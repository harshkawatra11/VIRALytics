import { z } from 'zod'
import { PLANS, type Plan } from '@viralytics/core'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'
import { getRazorpay, PLAN_IDS } from '@/lib/razorpay'

const schema = z.object({
  plan: z.enum(PLANS).refine((p) => p !== 'free', 'Cannot checkout the free plan'),
})

export async function POST(req: Request) {
  return handle(async () => {
    const { user } = await requireUser()
    const { plan } = await parseBody(req, schema)

    const razorpayPlanId = PLAN_IDS[plan as Exclude<Plan, 'free'>]
    if (!razorpayPlanId) return jsonError('Plan is not available for purchase', 400)

    const svc = createServiceClient()
    const manager = await svc
      .from('managers')
      .select('razorpay_customer_id, email')
      .eq('id', user.id)
      .single()
      .then((r) => r.data)

    // Create a Razorpay subscription (status: created → activate after first payment)
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 120, // 10 years max; cancel anytime via webhook
      notes: { manager_id: user.id, plan },
    } as Parameters<ReturnType<typeof getRazorpay>['subscriptions']['create']>[0])

    return jsonOk({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      email: manager?.email ?? user.email,
      managerId: user.id,
      plan,
    })
  })
}
