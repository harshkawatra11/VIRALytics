import type { Job } from 'bullmq'
import { db } from './db'
import { logger } from './logger'
import { invalidateAccountCache } from './cache'
import { persistScrape } from './persist'
import { scrape } from './scrapers'
import type { SyncJobData } from './queues'

/**
 * The unified sync processor used by all platform workers. Records a sync_jobs
 * audit row, scrapes, persists, invalidates cache, and maps failures to account
 * status. Returns a summary BullMQ stores on the completed job.
 */
export async function processSync(job: Job<SyncJobData>) {
  const data = job.data
  const startedAt = Date.now()
  const log = logger.child({ accountId: data.accountId, platform: data.platform })

  const { data: jobRow } = await db
    .from('sync_jobs')
    .insert({
      account_id: data.accountId,
      platform: data.platform,
      job_type: data.jobType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  try {
    const result = await scrape(data)

    // Private / not-found: record status, don't treat as a hard failure.
    if (result.status === 'private' || result.status === 'not_found') {
      await db.from('tracked_accounts').update({ status: result.status }).eq('id', data.accountId)
      await finishJob(jobRow?.id, 'completed', { startedAt })
      log.warn({ status: result.status }, 'account not scrapable')
      return { skipped: true, status: result.status }
    }

    const { postsFound, postsNew } = await persistScrape(data, result)
    await invalidateAccountCache(data.accountId, data.managerId)
    await finishJob(jobRow?.id, 'completed', { startedAt, postsFound, postsNew })

    log.info({ postsFound, postsNew }, 'sync completed')
    return { postsFound, postsNew }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ err: message }, 'sync failed')
    await finishJob(jobRow?.id, 'failed', { startedAt, error: message })

    // On the final attempt, flag the account so the UI can surface it.
    if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
      await db.from('tracked_accounts').update({ status: 'error' }).eq('id', data.accountId)
    }
    throw err // let BullMQ apply backoff/retry
  }
}

async function finishJob(
  id: string | undefined,
  status: 'completed' | 'failed',
  opts: { startedAt: number; postsFound?: number; postsNew?: number; error?: string }
) {
  if (!id) return
  await db
    .from('sync_jobs')
    .update({
      status,
      posts_found: opts.postsFound ?? 0,
      posts_new: opts.postsNew ?? 0,
      error_message: opts.error ?? null,
      duration_ms: Date.now() - opts.startedAt,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
}
