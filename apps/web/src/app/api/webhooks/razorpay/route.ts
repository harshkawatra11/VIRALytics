import { PLAN_CONFIG } from '@viralytics/core'
import { createServiceClient } from '@/lib/supabase/service'
import { planFromRazorpayPlanId, planUpdate, verifyWebhookSignature } from '@/lib/razorpay'

// Razorpay sends the raw JSON body — no special parser needed.
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(body, sig)) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const svc = createServiceClient()

  try {
    const sub = (event.payload as { subscription?: { entity?: Record<string, unknown> } })
      ?.subscription?.entity

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        if (!sub) break
        const managerId = (sub.notes as Record<string, string>)?.manager_id
        const plan = planFromRazorpayPlanId(sub.plan_id as string)
        if (managerId) {
          await svc
            .from('managers')
            .update({
              razorpay_subscription_id: sub.id as string,
              ...planUpdate(plan),
            })
            .eq('id', managerId)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        if (!sub) break
        const subscriptionId = sub.id as string
        const manager = await svc
          .from('managers')
          .select('id')
          .eq('razorpay_subscription_id', subscriptionId)
          .single()
          .then((r) => r.data)
        if (manager) {
          await svc
            .from('managers')
            .update({ ...planUpdate('free'), razorpay_subscription_id: null })
            .eq('id', manager.id)
          await enforceAccountLimit(svc, manager.id, PLAN_CONFIG.free.accountLimit)
        }
        break
      }
    }
  } catch (err) {
    console.error('[razorpay] handler error', event.event, err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
}

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
