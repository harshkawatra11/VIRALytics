import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'
import { refreshLimiter } from '@/lib/ratelimit'
import { enqueueSync } from '@/lib/queue'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { user, supabase } = await requireUser()
    const { id } = await params

    // Ownership + fetch the fields the queue needs (RLS scopes this select).
    const account = await supabase
      .from('tracked_accounts')
      .select('id, platform, handle, platform_id')
      .eq('id', id)
      .single()
      .then((r) => r.data)
    if (!account) return jsonError('Account not found', 404)

    // Rate limit: once per 30 minutes per account.
    const { success } = await refreshLimiter().limit(account.id)
    if (!success) return jsonError('Already refreshed recently — try again in a bit', 429)

    await enqueueSync({
      accountId: account.id,
      managerId: user.id,
      platform: account.platform,
      handle: account.handle,
      platformId: account.platform_id,
      jobType: 'manual',
    })

    return jsonOk({ success: true })
  })
}
