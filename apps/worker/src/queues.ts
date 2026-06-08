import { Queue } from 'bullmq'
import { QUEUE_NAMES, type SyncJobData } from '@viralytics/core'
import { connection } from './redis'

export { QUEUE_NAMES }
export type { SyncJobData }

const defaultJobOptions = {
  attempts: 4,
  backoff: { type: 'exponential' as const, delay: 300_000 }, // 5m,10m,20m,40m
  removeOnComplete: { age: 86_400, count: 1000 },
  removeOnFail: { age: 604_800 },
}

export const queues = {
  youtube: new Queue<SyncJobData>(QUEUE_NAMES.youtube, { connection, defaultJobOptions }),
  instagram: new Queue<SyncJobData>(QUEUE_NAMES.instagram, { connection, defaultJobOptions }),
  tiktok: new Queue<SyncJobData>(QUEUE_NAMES.tiktok, { connection, defaultJobOptions }),
  backfill: new Queue<SyncJobData>(QUEUE_NAMES.backfill, {
    connection,
    defaultJobOptions: { ...defaultJobOptions, priority: 10 },
  }),
} as const

/** Route a sync job to its platform queue. De-dupes in-flight work, but lets old jobs run again. */
export async function enqueueSync(data: SyncJobData): Promise<void> {
  const queue = queues[data.platform]
  const jobId = `${data.jobType}_${data.accountId}`
  const existing = await queue.getJob(jobId)

  if (existing) {
    const state = await existing.getState()
    if (state === 'completed' || state === 'failed') {
      await existing.remove()
    } else {
      return
    }
  }

  await queue.add(`${data.platform}_${data.jobType}`, data, {
    jobId,
  })
}
