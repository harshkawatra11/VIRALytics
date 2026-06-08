import { z } from 'zod'
import type { SyncJobData } from '../queues'
import type { NormalizedPost, ScrapeResult } from './types'
import { extractHashtags } from './types'

const GRAPH = 'https://graph.facebook.com/v20.0'
const MEDIA_LIMIT = 50

function n(v: unknown): number {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? x : 0
}

const mediaSchema = z
  .object({
    id: z.string(),
    caption: z.string().nullable().optional(),
    media_type: z.string().optional(), // IMAGE | VIDEO | CAROUSEL_ALBUM
    thumbnail_url: z.string().nullable().optional(),
    media_url: z.string().nullable().optional(),
    timestamp: z.string().optional(),
    permalink: z.string().nullable().optional(),
    like_count: z.number().nullable().optional(),
    comments_count: z.number().nullable().optional(),
    // video_views = legacy, less accurate — insights.plays is the in-app number
    video_views: z.number().nullable().optional(),
  })
  .passthrough()

const insightsSchema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.object({ value: z.unknown() })).optional(),
      // newer API returns period/title/id/description alongside value
      value: z.unknown().optional(),
    })
  ),
})

/** Pull insight values for a single IG media item. Returns nulls on failure. */
async function fetchInsights(
  mediaId: string,
  token: string
): Promise<{ plays: number | null; reach: number | null; impressions: number | null; saved: number | null }> {
  try {
    const metrics = ['plays', 'reach', 'impressions', 'saved'].join(',')
    const res = await fetch(
      `${GRAPH}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
    )
    if (!res.ok) return { plays: null, reach: null, impressions: null, saved: null }
    const body = await res.json()
    const parsed = insightsSchema.safeParse(body)
    if (!parsed.success) return { plays: null, reach: null, impressions: null, saved: null }

    const map: Record<string, number | null> = {}
    for (const d of parsed.data.data) {
      // Older API shape: { values: [{ value: N }] }
      // Newer API shape: { value: N }
      const raw = d.value ?? d.values?.[0]?.value
      map[d.name] = raw != null ? n(raw) : null
    }
    return {
      plays: map.plays ?? null,
      reach: map.reach ?? null,
      impressions: map.impressions ?? null,
      saved: map.saved ?? null,
    }
  } catch {
    return { plays: null, reach: null, impressions: null, saved: null }
  }
}

/**
 * Instagram Graph API scraper. Called when the account has an OAuth token.
 * Returns real-time metrics matching what the account owner sees in the app.
 *
 * @param igUserId   The Instagram Business Account ID stored in platform_tokens.platform_account_id
 * @param token      Decrypted long-lived access token.
 */
export async function scrapeInstagramGraph(
  job: SyncJobData,
  token: string,
  igUserId: string
): Promise<ScrapeResult> {
  // 1. Account profile
  const profileRes = await fetch(
    `${GRAPH}/${igUserId}?fields=username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${token}`
  )
  if (!profileRes.ok) throw new Error(`IG Graph profile fetch failed: ${await profileRes.text()}`)
  const profile = await profileRes.json() as {
    username?: string; name?: string; profile_picture_url?: string
    followers_count?: number; follows_count?: number; media_count?: number
  }

  // 2. Media list (most recent MEDIA_LIMIT posts)
  const mediaFields = 'id,caption,media_type,thumbnail_url,media_url,timestamp,permalink,like_count,comments_count,video_views'
  const mediaRes = await fetch(
    `${GRAPH}/${igUserId}/media?fields=${mediaFields}&limit=${MEDIA_LIMIT}&access_token=${token}`
  )
  if (!mediaRes.ok) throw new Error(`IG Graph media fetch failed: ${await mediaRes.text()}`)
  const mediaBody = await mediaRes.json() as { data?: unknown[] }
  const rawItems = mediaBody.data ?? []

  const items = rawItems
    .map((i) => mediaSchema.safeParse(i))
    .flatMap((r) => (r.success ? [r.data] : []))

  // 3. Fetch insights for each item in parallel (fails silently per-item)
  const insightsList = await Promise.all(items.map((item) => fetchInsights(item.id, token)))

  const posts: NormalizedPost[] = items.map((item, idx) => {
    const ins = insightsList[idx] ?? { plays: null, reach: null, impressions: null, saved: null }
    // `plays` is what Instagram shows as "views" for Reels — use it over legacy video_views
    const views = ins.plays ?? n(item.video_views)
    const mediaType = item.media_type ?? ''
    const postType =
      mediaType === 'VIDEO' ? 'reel' as const
        : mediaType === 'CAROUSEL_ALBUM' ? 'carousel' as const
        : 'image' as const

    return {
      platformPostId: item.id,
      postType,
      caption: item.caption ?? null,
      hashtags: extractHashtags(item.caption),
      thumbnailUrl: item.thumbnail_url ?? item.media_url ?? null,
      durationSeconds: null, // Graph API doesn't return duration on media list
      permalink: item.permalink ?? null,
      postedAt: item.timestamp ?? null,
      views,
      likes: n(item.like_count),
      comments: n(item.comments_count),
      shares: 0, // IG Graph API doesn't expose share count publicly
      saves: ins.saved,
      impressions: ins.impressions,
      reach: ins.reach,
      avgWatchTimeSeconds: null,
      completionRate: null,
      clickThroughRate: null,
    }
  })

  return {
    account: {
      displayName: profile.name ?? profile.username ?? job.handle,
      avatarUrl: profile.profile_picture_url ?? null,
      followerCount: profile.followers_count ?? null,
      followingCount: profile.follows_count ?? null,
      totalPosts: profile.media_count ?? null,
      platformId: igUserId,
    },
    posts,
  }
}
