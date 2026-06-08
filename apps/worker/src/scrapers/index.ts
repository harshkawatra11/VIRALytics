import { decrypt } from '@viralytics/core/crypto'
import { env, MOCK_MODE } from '../config'
import { db } from '../db'
import type { SyncJobData } from '../queues'
import type { ScrapeResult } from './types'
import { scrapeYoutube } from './youtube'
import { scrapeInstagram, scrapeInstagramBackfill, scrapeTiktok } from './apify'
import { scrapeInstagramGraph } from './instagram-graph'
import { scrapeTiktokApi } from './tiktok-api'
import { scrapeMock } from './mock'

/**
 * Dispatch a sync job to the correct platform scraper.
 *
 * OAuth priority:
 *  - YouTube  → always uses OAuth when connected (private analytics: watch time, CTR)
 *  - Instagram → uses Graph API when connected (real-time exact metrics + saves/reach)
 *               falls back to Apify public scraper when not connected
 *  - TikTok   → uses Login Kit v2 API when connected (real-time metrics)
 *               falls back to Apify public scraper when not connected
 */
export async function scrape(job: SyncJobData): Promise<ScrapeResult> {
  if (MOCK_MODE) return scrapeMock(job)

  // Fetch OAuth token for this account (service-role bypasses RLS).
  let oauthAccessToken: string | null = null
  let platformAccountId: string | null = null

  const tokenRow = await db
    .from('platform_tokens')
    .select('encrypted_access_token, platform_account_id, refresh_failure_count')
    .eq('account_id', job.accountId)
    .maybeSingle()
    .then((r) => r.data)

  if (tokenRow && tokenRow.refresh_failure_count < 3) {
    try {
      oauthAccessToken = decrypt(tokenRow.encrypted_access_token, env.ENCRYPTION_KEY)
      platformAccountId = tokenRow.platform_account_id ?? null
    } catch {
      // Corrupt token — skip OAuth enrichment, fall back to public scraping
    }
  }

  const isBackfill = job.jobType === 'backfill'

  switch (job.platform) {
    case 'youtube':
      return scrapeYoutube(job, oauthAccessToken, isBackfill)

    case 'instagram':
      if (isBackfill) return scrapeInstagramBackfill(job)
      // Use Graph API when OAuth token + IG Business Account ID are available
      if (oauthAccessToken && platformAccountId) {
        return scrapeInstagramGraph(job, oauthAccessToken, platformAccountId).catch(() =>
          // Fall back to Apify if Graph API call fails (token revoked, rate-limited, etc.)
          scrapeInstagram(job)
        )
      }
      return scrapeInstagram(job)

    case 'tiktok':
      if (oauthAccessToken) {
        return scrapeTiktokApi(job, oauthAccessToken, isBackfill).catch(() =>
          // Fall back to Apify public scraper on any API error
          scrapeTiktok(job)
        )
      }
      return scrapeTiktok(job)
  }
}

export type { ScrapeResult } from './types'
