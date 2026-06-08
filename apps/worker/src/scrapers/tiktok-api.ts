import { z } from 'zod'
import type { SyncJobData } from '../queues'
import type { NormalizedPost, ScrapeResult } from './types'
import { extractHashtags } from './types'

const TT_API = 'https://open.tiktokapis.com/v2'

function n(v: unknown): number {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? x : 0
}

const videoSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  create_time: z.number().optional(),
  cover_image_url: z.string().nullable().optional(),
  share_url: z.string().nullable().optional(),
  embed_link: z.string().nullable().optional(),
  view_count: z.number().nullable().optional(),
  like_count: z.number().nullable().optional(),
  comment_count: z.number().nullable().optional(),
  share_count: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
}).passthrough()

const userSchema = z.object({
  open_id: z.string().optional(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  follower_count: z.number().nullable().optional(),
  following_count: z.number().nullable().optional(),
  video_count: z.number().nullable().optional(),
}).passthrough()

const VIDEO_FIELDS = [
  'id', 'title', 'create_time', 'cover_image_url', 'share_url',
  'view_count', 'like_count', 'comment_count', 'share_count', 'duration',
].join(',')

const USER_FIELDS = [
  'open_id', 'display_name', 'avatar_url',
  'follower_count', 'following_count', 'video_count',
].join(',')

/**
 * TikTok API scraper — uses an OAuth access token (Login Kit v2) to fetch
 * accurate, real-time metrics directly from TikTok's API. Falls back to the
 * Apify public scraper when no token is available.
 */
export async function scrapeTiktokApi(
  job: SyncJobData,
  token: string,
  isBackfill = false
): Promise<ScrapeResult> {
  const maxCount = isBackfill ? 200 : 20
  const authHeader = { Authorization: `Bearer ${token}` }

  // 1. Account profile
  const userRes = await fetch(
    `${TT_API}/user/info/?fields=${USER_FIELDS}`,
    { headers: authHeader }
  )
  if (!userRes.ok) throw new Error(`TikTok user info failed: ${await userRes.text()}`)
  const userBody = await userRes.json() as { data?: { user?: unknown }; error?: { code: string; message: string } }
  if (userBody.error?.code && userBody.error.code !== 'ok') {
    throw new Error(`TikTok user info error: ${userBody.error.message}`)
  }
  const user = userSchema.safeParse(userBody.data?.user)
  const u = user.success ? user.data : null

  // 2. Video list (paginated up to maxCount)
  const posts: NormalizedPost[] = []
  let cursor: number | undefined
  let hasMore = true

  while (hasMore && posts.length < maxCount) {
    const body: Record<string, unknown> = {
      max_count: Math.min(20, maxCount - posts.length),
      fields: VIDEO_FIELDS,
    }
    if (cursor != null) body.cursor = cursor

    const vidRes = await fetch(`${TT_API}/video/list/`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!vidRes.ok) break
    const vidBody = await vidRes.json() as {
      data?: { videos?: unknown[]; cursor?: number; has_more?: boolean }
      error?: { code: string }
    }
    if (vidBody.error?.code && vidBody.error.code !== 'ok') break

    const videos = (vidBody.data?.videos ?? [])
      .map((v) => videoSchema.safeParse(v))
      .flatMap((r) => (r.success ? [r.data] : []))

    for (const v of videos) {
      posts.push({
        platformPostId: v.id,
        postType: 'video',
        caption: v.title ?? null,
        hashtags: extractHashtags(v.title),
        thumbnailUrl: v.cover_image_url ?? null,
        durationSeconds: v.duration ?? null,
        permalink: v.share_url ?? null,
        postedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
        views: n(v.view_count),
        likes: n(v.like_count),
        comments: n(v.comment_count),
        shares: n(v.share_count),
        saves: null,
        impressions: null,
        reach: null,
        avgWatchTimeSeconds: null,
        completionRate: null,
        clickThroughRate: null,
      })
    }

    cursor = vidBody.data?.cursor
    hasMore = vidBody.data?.has_more ?? false
  }

  return {
    account: {
      displayName: u?.display_name ?? job.handle,
      avatarUrl: u?.avatar_url ?? null,
      followerCount: u?.follower_count ?? null,
      followingCount: u?.following_count ?? null,
      totalPosts: u?.video_count ?? null,
      platformId: u?.open_id ?? null,
    },
    posts,
  }
}
