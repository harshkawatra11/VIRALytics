import 'server-only'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { QUEUE_NAMES, type SyncJobData } from '@viralytics/core'

/**
 * Web-side BullMQ producer. The worker consumes these; here we only enqueue
 * initial syncs and manual refreshes onto the same Redis queues.
 *
 * Hardening (so a misconfig can never silently swallow jobs again):
 *  - REDIS_URL is validated; a missing/blank value throws a clear error instead
 *    of ioredis silently defaulting to localhost:6379 and buffering jobs forever.
 *  - Connection errors are logged, not swallowed.
 *  - Every enqueue is time-bounded, so an unreachable Redis fails in seconds
 *    (the accounts API rolls back the insert on failure → no stuck "Syncing…").
 */
const globalForQueue = globalThis as unknown as {
  __viralyticsRedis?: Redis
  __viralyticsQueues?: Record<string, Queue<SyncJobData>>
}

const ENQUEUE_TIMEOUT_MS = 8_000

function redisUrl(): string {
  const url = process.env.REDIS_URL?.trim()
  if (!url) {
    throw new Error(
      'REDIS_URL is not set. The web app cannot enqueue sync jobs without it. ' +
        'Add REDIS_URL to apps/web/.env.local (use the same rediss:// URL as the worker).'
    )
  }
  return url
}

function connection(): Redis {
  if (!globalForQueue.__viralyticsRedis) {
    const redis = new Redis(redisUrl(), {
      // BullMQ requires this to be null for its blocking commands.
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Fail fast on the initial TCP/TLS handshake rather than hanging.
      connectTimeout: 10_000,
      // Bounded reconnect backoff (caps at 2s) so we recover from blips without
      // spinning — but never silently buffer forever (the enqueue timeout guards that).
      retryStrategy: (times) => Math.min(times * 200, 2_000),
    })
    redis.on('error', (err) => {
      // Surface connection problems in the server logs instead of swallowing them.
      console.error('[queue] Redis connection error:', err.message)
    })
    globalForQueue.__viralyticsRedis = redis
  }
  return globalForQueue.__viralyticsRedis
}

function queueFor(name: string): Queue<SyncJobData> {
  globalForQueue.__viralyticsQueues ??= {}
  globalForQueue.__viralyticsQueues[name] ??= new Queue<SyncJobData>(name, {
    connection: connection(),
  })
  return globalForQueue.__viralyticsQueues[name]
}

/** Reject if a promise doesn't settle within `ms`, with a clear message. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} (Redis unreachable after ${ms}ms)`)), ms)
    ),
  ])
}

/** Enqueue a sync (initial / manual) routed to the platform queue. */
export async function enqueueSync(data: SyncJobData): Promise<void> {
  const add = queueFor(QUEUE_NAMES[data.platform]).add(
    `${data.platform}_${data.jobType}`,
    data,
    { jobId: `${data.jobType}_${data.accountId}` }
  )
  await withTimeout(add, ENQUEUE_TIMEOUT_MS, 'Failed to enqueue sync job')
}

/**
 * Enqueue a full historical backfill on the low-priority backfill queue (so it
 * never delays live sync traffic). Deduped per account by jobId.
 */
export async function enqueueBackfill(data: Omit<SyncJobData, 'jobType'>): Promise<void> {
  const add = queueFor(QUEUE_NAMES.backfill).add(
    `backfill:${data.accountId}`,
    { ...data, jobType: 'backfill' },
    // jobId must not contain ':' (BullMQ restriction) — use '_' as the separator.
    { jobId: `backfill_${data.accountId}`, priority: 10 }
  )
  await withTimeout(add, ENQUEUE_TIMEOUT_MS, 'Failed to enqueue backfill job')
}
