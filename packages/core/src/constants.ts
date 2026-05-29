/** Platforms VIRALytics tracks. */
export const PLATFORMS = ['youtube', 'instagram', 'tiktok'] as const
export type Platform = (typeof PLATFORMS)[number]

/** How an account's data is sourced. */
export const CONNECTION_TYPES = ['public', 'oauth'] as const
export type ConnectionType = (typeof CONNECTION_TYPES)[number]

/** Lifecycle status of a tracked account. */
export const ACCOUNT_STATUSES = [
  'pending', // queued for first scrape
  'active', // syncing normally
  'error', // repeated sync failures
  'private', // account is private / not publicly scrapable
  'not_found', // handle does not resolve
  'paused', // sync intentionally paused (e.g. plan downgrade)
] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export const POST_TYPES = ['video', 'image', 'carousel', 'reel', 'short'] as const
export type PostType = (typeof POST_TYPES)[number]

export const PLANS = ['free', 'starter', 'pro', 'agency'] as const
export type Plan = (typeof PLANS)[number]

export const SYNC_JOB_TYPES = ['initial', 'scheduled', 'backfill', 'manual'] as const
export type SyncJobType = (typeof SYNC_JOB_TYPES)[number]

export const SYNC_JOB_STATUSES = ['queued', 'running', 'completed', 'failed'] as const
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number]

/**
 * Per-plan limits. `accountLimit` = max tracked accounts.
 * `syncIntervalSeconds` = how often the sweeper re-syncs each account.
 * Design target: agency supports >=100 accounts per manager.
 */
export const PLAN_CONFIG: Record<
  Plan,
  { accountLimit: number; syncIntervalSeconds: number; historyDays: number | null }
> = {
  free: { accountLimit: 3, syncIntervalSeconds: 86_400, historyDays: 30 },
  starter: { accountLimit: 15, syncIntervalSeconds: 43_200, historyDays: 90 },
  pro: { accountLimit: 50, syncIntervalSeconds: 21_600, historyDays: null },
  agency: { accountLimit: 250, syncIntervalSeconds: 7_200, historyDays: null },
}
