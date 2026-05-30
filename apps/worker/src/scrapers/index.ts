import { decrypt } from '@viralytics/core/crypto'
import { env, MOCK_MODE } from '../config'
import { db } from '../db'
import type { SyncJobData } from '../queues'
import type { ScrapeResult } from './types'
import { scrapeYoutube } from './youtube'
import { scrapeInstagram, scrapeTiktok } from './apify'
import { scrapeMock } from './mock'

/**
 * Dispatch a sync job to the correct platform scraper.
 * For OAuth-connected accounts, decrypts the access token and passes it so
 * private metrics (watch time, completion rate) are included.
 */
export async function scrape(job: SyncJobData): Promise<ScrapeResult> {
  if (MOCK_MODE) return scrapeMock(job)

  // Fetch OAuth token if this account has one (service-role, no RLS).
  let oauthAccessToken: string | null = null
  const tokenRow = await db
    .from('platform_tokens')
    .select('encrypted_access_token, refresh_failure_count')
    .eq('account_id', job.accountId)
    .maybeSingle()
    .then((r) => r.data)

  if (tokenRow && tokenRow.refresh_failure_count < 3) {
    try {
      oauthAccessToken = decrypt(tokenRow.encrypted_access_token, env.ENCRYPTION_KEY)
    } catch {
      // Corrupt token — skip OAuth enrichment, continue with public data
    }
  }

  switch (job.platform) {
    case 'youtube':
      return scrapeYoutube(job, oauthAccessToken)
    case 'instagram':
      return scrapeInstagram(job) // IG OAuth enrichment handled via Apify + Graph API (Phase 7b)
    case 'tiktok':
      return scrapeTiktok(job)
  }
}

export type { ScrapeResult } from './types'
