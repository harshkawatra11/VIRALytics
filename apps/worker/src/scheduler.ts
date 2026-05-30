import { db } from './db'
import { logger } from './logger'
import { SWEEPER } from './config'
import { enqueueSync } from './queues'

/**
 * Sweeper: every tick, ask the DB for the next batch of accounts due for sync
 * and enqueue them. This scales far better than registering a repeatable job
 * per account (which would bloat Redis at 10k+ accounts) and survives restarts.
 */
export function startSweeper(): NodeJS.Timeout {
  const tick = async () => {
    try {
      const { data, error } = await db.rpc('due_accounts', { p_limit: SWEEPER.batchSize })
      if (error) throw new Error(error.message)
      const due = data ?? []
      if (due.length === 0) return

      await Promise.all(
        due.map((a) =>
          enqueueSync({
            accountId: a.id,
            managerId: a.manager_id,
            platform: a.platform,
            handle: a.handle,
            platformId: a.platform_id,
            jobType: 'scheduled',
          })
        )
      )
      logger.info({ count: due.length }, 'sweeper enqueued due accounts')
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'sweeper tick failed')
    }
  }

  void tick() // run immediately on boot
  return setInterval(() => void tick(), SWEEPER.tickMs)
}
