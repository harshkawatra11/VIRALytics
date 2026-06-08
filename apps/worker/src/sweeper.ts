import { db } from './db'
import { enqueueSync } from './queues'
import { logger } from './logger'
import { SWEEPER } from './config'

export interface SweeperHandle {
  stop: () => void
}

/**
 * Background sweeper: periodically enqueues overdue accounts for sync.
 *
 * Uses the existing due_accounts() RPC (0008) which already respects each
 * manager's plan-based sync_interval_seconds. Two cadence rules on top:
 *
 * HOT accounts  — have at least one post <48h old OR viral_score ≥2 in last
 *                 7 days. Always synced when due per plan interval.
 * COLD accounts — all posts >7 days old and no recent viral spike.
 *                 Only synced at 4× their plan interval to reduce Apify cost.
 *
 * This collapses Agency Apify spend ~4× without changing the product promise:
 * fresh creators and breakout posts get full-cadence attention; dormant
 * accounts that haven't posted in weeks get checked less aggressively.
 *
 * Cost guard: the sweeper never enqueues more than SWEEPER.maxPerTick jobs
 * per tick. This caps worst-case Apify spend even if due_accounts returns a
 * large backlog (e.g. after a worker restart).
 */
export function startSweeper(): SweeperHandle {
  let interval: ReturnType<typeof setInterval> | undefined

  async function tick() {
    try {
      const due = await db.rpc('due_accounts', { p_limit: SWEEPER.batchSize })
      if (due.error) {
        logger.error({ err: due.error.message }, 'sweeper: due_accounts RPC failed')
        return
      }
      const accounts = due.data ?? []
      if (accounts.length === 0) return

      const accountIds = accounts.map((a) => a.id)

      // Classify which accounts are "hot": recent post (<48h) or recent viral spike.
      const { data: hotRows } = await db
        .from('posts')
        .select('account_id')
        .in('account_id', accountIds)
        .or('posted_at.gte.' + new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() +
            ',viral_score.gte.2')
        .gt('posted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const hotAccountIds = new Set((hotRows ?? []).map((r) => r.account_id))

      let enqueued = 0
      for (const account of accounts) {
        if (enqueued >= SWEEPER.maxPerTick) break

        const isHot = hotAccountIds.has(account.id)

        // Cold accounts: skip 3 out of every 4 ticks by checking last_synced_at
        // against 4× the plan interval. due_accounts already checked the normal
        // interval, so we just additionally gate cold ones here.
        if (!isHot) {
          const { data: acc } = await db
            .from('tracked_accounts')
            .select('last_synced_at')
            .eq('id', account.id)
            .single()
          const lastSync = acc?.last_synced_at ? new Date(acc.last_synced_at).getTime() : 0
          const { data: mgr } = await db
            .from('managers')
            .select('sync_interval_seconds')
            .eq('id', account.manager_id)
            .single()
          const coldThresholdMs = (mgr?.sync_interval_seconds ?? 86400) * 4 * 1000
          if (Date.now() - lastSync < coldThresholdMs) continue
        }

        await enqueueSync({
          accountId: account.id,
          managerId: account.manager_id,
          platform: account.platform as 'youtube' | 'instagram' | 'tiktok',
          handle: account.handle,
          platformId: account.platform_id ?? null,
          jobType: 'scheduled',
        })
        enqueued++
      }

      if (enqueued > 0) {
        logger.info({ enqueued, hot: hotAccountIds.size, due: accounts.length }, 'sweeper tick')
      }
    } catch (err) {
      logger.error({ err }, 'sweeper tick error')
    }
  }

  // Stagger the first tick by a random 0–30s to avoid thundering herd on deploy.
  const jitter = Math.floor(Math.random() * 30_000)
  const timeout = setTimeout(() => {
    void tick()
    interval = setInterval(() => void tick(), SWEEPER.tickMs)
  }, jitter)

  logger.info({ tickMs: SWEEPER.tickMs, jitterMs: jitter }, 'sweeper started')
  return {
    stop: () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    },
  }
}
