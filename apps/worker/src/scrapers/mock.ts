import type { SyncJobData } from '../queues'
import type { NormalizedPost, ScrapeResult } from './types'
import { extractHashtags } from './types'

/** Deterministic fixtures for local dev / CI (MOCK_SCRAPERS=true). */
export function scrapeMock(job: SyncJobData): ScrapeResult {
  const base = 8000
  const posts: NormalizedPost[] = Array.from({ length: 18 }, (_, i) => {
    // Vary views so viral scores span cold/normal/hot tiers.
    const multiplier = [0.2, 0.4, 0.8, 1, 1.1, 1.3, 2.4, 5.1, 15.7, 0.3, 0.9, 1.2, 3.3, 0.6, 1, 7.2, 0.5, 1.8][i] ?? 1
    const views = Math.round(base * multiplier)
    const caption = `Mock ${job.platform} post ${i + 1} #demo #${job.handle.replace(/\W/g, '')}`
    return {
      platformPostId: `${job.platform}-${job.handle}-${i}`,
      postType: job.platform === 'youtube' ? 'video' : 'reel',
      caption,
      hashtags: extractHashtags(caption),
      thumbnailUrl: `https://picsum.photos/seed/${job.handle}-${i}/120/120`,
      durationSeconds: 15 + (i % 5) * 10,
      permalink: `https://example.com/${job.handle}/${i}`,
      postedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      views,
      likes: Math.round(views * 0.08),
      comments: Math.round(views * 0.01),
      shares: Math.round(views * 0.005),
      saves: job.platform === 'instagram' ? Math.round(views * 0.02) : null,
      impressions: null,
      reach: null,
      avgWatchTimeSeconds: null,
      completionRate: null,
      clickThroughRate: null,
    }
  })

  return {
    account: {
      displayName: job.handle,
      avatarUrl: `https://picsum.photos/seed/${job.handle}/64/64`,
      followerCount: 120_000,
      followingCount: 300,
      totalPosts: posts.length,
      platformId: `mock-${job.handle}`,
    },
    posts,
  }
}
