import type { Platform, SyncJobType } from './constants'

/** BullMQ queue names — one per platform plus a low-priority backfill queue. */
export const QUEUE_NAMES = {
  youtube: 'yt-sync',
  instagram: 'ig-sync',
  tiktok: 'tt-sync',
  backfill: 'backfill',
} as const

/** Payload shared by the web (enqueue) and worker (process). */
export interface SyncJobData {
  accountId: string
  managerId: string
  platform: Platform
  handle: string
  platformId: string | null
  jobType: SyncJobType
}

export function queueNameForPlatform(platform: Platform): string {
  return QUEUE_NAMES[platform]
}
