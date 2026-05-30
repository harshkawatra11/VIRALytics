import { z } from 'zod'
import { PLANS, type Plan } from '@viralytics/core'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe, PLAN_PRICE_IDS } from '@/lib/stripe'

const schema = z.object({
  plan: z.enum(PLANS).refine((p) => p !== 'free', 'Cannot checkout the free plan'),
})

export async function POST(req: Request) {
  return handle(async () => {
    const { user } = await requireUser()
    const { plan } = await parseBody(req, schema)

    const priceId = PLAN_PRICE_IDS[plan as Exclude<Plan, 'free'>]
    if (!priceId) return jsonError('Plan is not available for purchase', 400)

    // Reuse an existing Stripe customer when we already have one.
    const svc = createServiceClient()
    const manager = await svc
      .from('managers')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()
      .then((r) => r.data)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: manager?.stripe_customer_id ?? undefined,
      customer_email: manager?.stripe_customer_id ? undefined : (manager?.email ?? user.email),
      client_reference_id: user.id,
      subscription_data: { trial_period_days: 14, metadata: { manager_id: user.id } },
      metadata: { manager_id: user.id, plan },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    return jsonOk({ url: session.url })
  })
}
