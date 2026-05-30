import 'server-only'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { QUEUE_NAMES, type SyncJobData } from '@viralytics/core'

/**
 * Web-side BullMQ producer. The worker (Railway) consumes these; here we only
 * enqueue initial syncs and manual refreshes onto the same Redis queues.
 * A single shared connection is reused across hot reloads / serverless invokes.
 */
const globalForQueue = globalThis as unknown as {
  __viralyticsRedis?: Redis
  __viralyticsQueues?: Record<string, Queue<SyncJobData>>
}

function connection(): Redis {
  if (!globalForQueue.__viralyticsRedis) {
    globalForQueue.__viralyticsRedis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
    })
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

/** Enqueue a sync (initial / manual) routed to the platform queue. */
export async function enqueueSync(data: SyncJobData): Promise<void> {
  await queueFor(QUEUE_NAMES[data.platform]).add(`${data.platform}:${data.jobType}`, data, {
    jobId: `${data.jobType}:${data.accountId}`,
  })
}
