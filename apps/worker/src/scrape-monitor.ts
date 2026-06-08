import { logger } from './logger'
import type { ScrapeResult } from './scrapers/types'
import type { SyncJobData } from './queues'

/**
 * Data-quality guard: detects when a scraper returns suspiciously empty data
 * (silent corruption — zeros/nulls instead of throwing). Logs a loud operator
 * warning and returns whether the result is safe to persist.
 *
 * Why: Apify actors sometimes break on platform changes and return null/0 rows
 * without erroring. Persisting that data corrupts viral scores and charts.
 */
export function assertScrapeQuality(job: SyncJobData, result: ScrapeResult): boolean {
  const log = logger.child({ accountId: job.accountId, platform: job.platform, handle: job.handle })

  if (result.status === 'private' || result.status === 'not_found') return true

  // No posts at all from a known-active account is suspicious.
  if (result.posts.length === 0) {
    log.warn('SCRAPE_QUALITY: zero posts returned — possible actor breakage; skipping persist')
    return false
  }

  // Count posts with zero views AND zero likes — both zero simultaneously is a
  // strong signal of a parse failure (real posts almost never have both zero).
  const blankPosts = result.posts.filter((p) => p.views === 0 && p.likes === 0).length
  const blankRate = blankPosts / result.posts.length

  if (blankRate >= 0.8) {
    log.error(
      { blankPosts, total: result.posts.length, blankRate: blankRate.toFixed(2) },
      'SCRAPE_QUALITY: ≥80% posts have views=0 AND likes=0 — actor may be returning corrupt data; skipping persist'
    )
    return false
  }

  if (blankRate >= 0.4) {
    log.warn(
      { blankPosts, total: result.posts.length, blankRate: blankRate.toFixed(2) },
      'SCRAPE_QUALITY: ≥40% posts have views=0 AND likes=0 — possible partial actor degradation'
    )
    // Warn but still persist — partial data is better than none at this threshold.
  }

  // Null account profile from a non-backfill sync is a mild signal.
  if (job.jobType !== 'backfill' && result.account.followerCount === null) {
    log.warn('SCRAPE_QUALITY: account followerCount is null on a non-backfill sync')
  }

  return true
}
