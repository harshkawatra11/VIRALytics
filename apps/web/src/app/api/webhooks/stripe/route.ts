import type Stripe from 'stripe'
import { PLAN_CONFIG } from '@viralytics/core'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe, planFromPriceId, planUpdate } from '@/lib/stripe'

// Stripe requires the raw, unparsed body for signature verification.
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, secret)
  } catch (err) {
    console.error('[stripe] signature verification failed', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const svc = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const managerId = session.client_reference_id ?? session.metadata?.manager_id
        if (managerId && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string)
          const plan = planFromPriceId(sub.items.data[0]?.price.id)
          await svc
            .from('managers')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: sub.id,
              ...planUpdate(plan),
            })
            .eq('id', managerId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        // Active (incl. trialing / cancel-at-period-end) keeps the paid plan;
        // a terminal status falls back to free.
        const terminal = sub.status === 'canceled' || sub.status === 'unpaid'
        const plan = terminal ? 'free' : planFromPriceId(sub.items.data[0]?.price.id)
        await svc
          .from('managers')
          .update({ ...planUpdate(plan), stripe_subscription_id: sub.id })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const manager = await svc
          .from('managers')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()
          .then((r) => r.data)
        if (manager) {
          await svc
            .from('managers')
            .update({ ...planUpdate('free'), stripe_subscription_id: null })
            .eq('id', manager.id)
          await enforceAccountLimit(svc, manager.id, PLAN_CONFIG.free.accountLimit)
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe] handler error', event.type, err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
}

/**
 * After a downgrade, pause the manager's accounts beyond the new limit (keeps
 * the oldest active ones). Pausing (not deleting) preserves historical data.
 */
async function enforceAccountLimit(
  svc: ReturnType<typeof createServiceClient>,
  managerId: string,
  limit: number
) {
  const accounts = await svc
    .from('tracked_accounts')
    .select('id')
    .eq('manager_id', managerId)
    .neq('status', 'paused')
    .order('created_at', { ascending: true })
    .then((r) => r.data ?? [])

  const excess = accounts.slice(limit).map((a) => a.id)
  if (excess.length > 0) {
    await svc.from('tracked_accounts').update({ status: 'paused' }).in('id', excess)
  }
}
