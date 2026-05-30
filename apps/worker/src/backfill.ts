import { db } from './db'
import { logger } from './logger'
import { queues, type SyncJobData } from './queues'

/**
 * Enqueue a full historical backfill for a single account.
 * Backfill jobs run on the low-priority queue (priority: 10) so they never
 * delay live sync traffic. Progress is tracked via sync_jobs rows.
 *
 * Called once when a new account is added; also exposed via /api/backfill/start.
 */
export async function enqueueBackfill(
  accountId: string,
  managerId: string
): Promise<void> {
  const account = await db
    .from('tracked_accounts')
    .select('platform, handle, platform_id')
    .eq('id', accountId)
    .single()
    .then((r) => r.data)
  if (!account) { logger.warn({ accountId }, 'backfill: account not found'); return }

  const jobData: SyncJobData = {
    accountId,
    managerId,
    platform: account.platform,
    handle: account.handle,
    platformId: account.platform_id,
    jobType: 'backfill',
  }

  await queues.backfill.add(`backfill:${accountId}`, jobData, {
    jobId: `backfill:${accountId}`,
    priority: 10,
  })
  logger.info({ accountId }, 'backfill enqueued')
}
