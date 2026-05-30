import type { SyncJobData } from '../queues'
import { MOCK_MODE } from '../config'
import type { ScrapeResult } from './types'
import { scrapeYoutube } from './youtube'
import { scrapeInstagram, scrapeTiktok } from './apify'
import { scrapeMock } from './mock'

/** Dispatch a sync job to the correct platform scraper (or mock fixtures). */
export async function scrape(job: SyncJobData): Promise<ScrapeResult> {
  if (MOCK_MODE) return scrapeMock(job)
  switch (job.platform) {
    case 'youtube':
      return scrapeYoutube(job)
    case 'instagram':
      return scrapeInstagram(job)
    case 'tiktok':
      return scrapeTiktok(job)
  }
}

export type { ScrapeResult } from './types'
