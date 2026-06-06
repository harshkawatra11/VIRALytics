import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'
import { getRazorpay } from '@/lib/razorpay'

/** Cancel the active subscription at period end. */
export async function POST() {
  return handle(async () => {
    const { user } = await requireUser()
    const svc = createServiceClient()
    const manager = await svc
      .from('managers')
      .select('razorpay_subscription_id')
      .eq('id', user.id)
      .single()
      .then((r) => r.data)

    if (!manager?.razorpay_subscription_id) {
      return jsonError('No active subscription', 400)
    }

    // cancel_at_cycle_end = 1 → cancel after the current billing period
    await getRazorpay().subscriptions.cancel(manager.razorpay_subscription_id, true)

    return jsonOk({ message: 'Subscription will be cancelled at the end of the current period.' })
  })
}
