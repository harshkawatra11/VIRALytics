import type { PostType } from '@viralytics/core'

/** Platform-agnostic shape every scraper/normalizer must return. */
export interface NormalizedAccount {
  displayName: string | null
  avatarUrl: string | null
  followerCount: number | null
  followingCount: number | null
  totalPosts: number | null
  platformId: string | null
}

export interface NormalizedPost {
  platformPostId: string
  postType: PostType | null
  caption: string | null
  hashtags: string[]
  thumbnailUrl: string | null
  durationSeconds: number | null
  permalink: string | null
  postedAt: string | null // ISO timestamp
  views: number
  likes: number
  comments: number
  shares: number
  saves: number | null
  impressions: number | null
  reach: number | null
  // OAuth-only private metrics (null for public scrapes)
  avgWatchTimeSeconds: number | null
  completionRate: number | null
  clickThroughRate: number | null
}

export interface ScrapeResult {
  account: NormalizedAccount
  posts: NormalizedPost[]
  /** Set when the platform/scraper reports the profile is private or missing. */
  status?: 'private' | 'not_found'
}

/** Parse ISO-8601 duration (PT1M30S) to seconds. */
export function parseIsoDuration(iso: string | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const [, h, min, s] = m
  return Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0)
}

/** Extracts unique #hashtags from caption text. */
export function extractHashtags(caption: string | null | undefined): string[] {
  if (!caption) return []
  const matches = caption.match(/#[\p{L}0-9_]+/gu) ?? []
  const seen = new Set<string>()
  for (const m of matches) seen.add(m.slice(1).toLowerCase())
  return [...seen]
}
