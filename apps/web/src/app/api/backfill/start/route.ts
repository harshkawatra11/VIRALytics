import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'
import { QUEUE_NAMES, type SyncJobData } from '@viralytics/core'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export async function POST(req: Request) {
  return handle(async () => {
    const { user, supabase } = await requireUser()
    const parsed = await req.json().then((b: unknown) => b as { accountId?: string }).catch(() => ({ accountId: undefined }))
    const accountId: string | undefined = parsed.accountId
    if (!accountId) return jsonError('accountId is required', 400)

    // Verify ownership (RLS).
    const account = await supabase
      .from('tracked_accounts')
      .select('id, platform, handle, platform_id')
      .eq('id', accountId)
      .maybeSingle()
      .then((r) => r.data)
    if (!account) return jsonError('Account not found', 404)

    const conn = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
    const queue = new Queue<SyncJobData>(QUEUE_NAMES.backfill, { connection: conn })
    const jobData: SyncJobData = {
      accountId,
      managerId: user.id,
      platform: account.platform,
      handle: account.handle,
      platformId: account.platform_id,
      jobType: 'backfill',
    }
    await queue.add(`backfill:${accountId}`, jobData, {
      jobId: `backfill:${accountId}`,
      priority: 10,
    })
    await queue.close()
    conn.disconnect()

    return jsonOk({ success: true, queued: true })
  })
}
