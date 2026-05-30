import { loadWorkerEnv } from '@viralytics/core/env'

/** Validated once at boot — a misconfigured worker fails fast. */
export const env = loadWorkerEnv()

/** Optional mock mode: scrapers return fixtures instead of calling Apify/YouTube. */
export const MOCK_MODE = process.env.MOCK_SCRAPERS === 'true'

/** Per-platform worker concurrency. YouTube shares a daily quota -> serialize. */
export const CONCURRENCY = {
  youtube: 2,
  instagram: 3,
  tiktok: 3,
  backfill: 2,
} as const

/** How many due accounts the sweeper enqueues per tick, and the tick interval. */
export const SWEEPER = {
  batchSize: 200,
  tickMs: 120_000, // every 2 minutes
} as const
