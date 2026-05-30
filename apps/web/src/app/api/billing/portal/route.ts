import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  return handle(async () => {
    const { user } = await requireUser()
    const svc = createServiceClient()
    const manager = await svc
      .from('managers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()
      .then((r) => r.data)

    if (!manager?.stripe_customer_id) {
      return jsonError('No billing account yet — subscribe to a plan first', 400)
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: manager.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })

    return jsonOk({ url: session.url })
  })
}
