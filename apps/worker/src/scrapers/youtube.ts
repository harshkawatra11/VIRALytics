import { z } from 'zod'
import type { SyncJobData } from '../queues'
import { env } from '../config'
import type { NormalizedPost, ScrapeResult } from './types'
import { extractHashtags, parseIsoDuration } from './types'
import { fetchYoutubeAnalytics } from './youtube-analytics'

const API = 'https://www.googleapis.com/youtube/v3'

// --- Zod schemas: validate every external response (shape drift -> caught) ---
const channelSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z.object({
          title: z.string(),
          thumbnails: z.object({ default: z.object({ url: z.string() }).optional() }).optional(),
        }),
        statistics: z.object({
          subscriberCount: z.string().optional(),
          videoCount: z.string().optional(),
          viewCount: z.string().optional(),
        }),
        contentDetails: z.object({
          relatedPlaylists: z.object({ uploads: z.string() }),
        }),
      })
    )
    .default([]),
})

const playlistItemsSchema = z.object({
  items: z.array(z.object({ contentDetails: z.object({ videoId: z.string() }) })).default([]),
})

const videosSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          publishedAt: z.string().optional(),
          thumbnails: z
            .object({ medium: z.object({ url: z.string() }).optional() })
            .optional(),
        }),
        contentDetails: z.object({ duration: z.string().optional() }),
        statistics: z.object({
          viewCount: z.string().optional(),
          likeCount: z.string().optional(),
          commentCount: z.string().optional(),
        }),
      })
    )
    .default([]),
})

function num(s: string | undefined): number {
  const n = Number(s ?? 0)
  return Number.isFinite(n) ? n : 0
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

export async function scrapeYoutube(
  job: SyncJobData,
  oauthAccessToken?: string | null
): Promise<ScrapeResult> {
  const key = env.YOUTUBE_API_KEY
  // 1. Resolve channel (by stored channel id, else by handle).
  const channelQuery = job.platformId
    ? `id=${encodeURIComponent(job.platformId)}`
    : `forHandle=${encodeURIComponent(job.handle)}`
  const channelRaw = await getJson(
    `${API}/channels?part=snippet,statistics,contentDetails&${channelQuery}&key=${key}`
  )
  const channel = channelSchema.parse(channelRaw).items[0]
  if (!channel) return { account: emptyAccount(), posts: [], status: 'not_found' }

  // 2. Recent uploads.
  const uploads = channel.contentDetails.relatedPlaylists.uploads
  const playlistRaw = await getJson(
    `${API}/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=50&key=${key}`
  )
  const videoIds = playlistItemsSchema.parse(playlistRaw).items.map((i) => i.contentDetails.videoId)

  // 3. Video details (batched by 50).
  const posts: NormalizedPost[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50).join(',')
    if (!ids) continue
    const videosRaw = await getJson(
      `${API}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${key}`
    )
    for (const v of videosSchema.parse(videosRaw).items) {
      const duration = parseIsoDuration(v.contentDetails.duration)
      posts.push({
        platformPostId: v.id,
        postType: duration !== null && duration <= 60 ? 'short' : 'video',
        caption: v.snippet.description ?? v.snippet.title ?? null,
        hashtags: extractHashtags(v.snippet.description),
        thumbnailUrl: v.snippet.thumbnails?.medium?.url ?? null,
        durationSeconds: duration,
        permalink: `https://www.youtube.com/watch?v=${v.id}`,
        postedAt: v.snippet.publishedAt ?? null,
        views: num(v.statistics.viewCount),
        likes: num(v.statistics.likeCount),
        comments: num(v.statistics.commentCount),
        shares: 0,
        saves: null,
        impressions: null,
        reach: null,
        avgWatchTimeSeconds: null,
        completionRate: null,
        clickThroughRate: null,
      })
    }
  }

  // If an OAuth token is available, enrich with private Analytics metrics.
  if (oauthAccessToken && posts.length > 0 && channel.id) {
    const analytics = await fetchYoutubeAnalytics(
      oauthAccessToken,
      channel.id,
      posts.map((p) => p.platformPostId)
    )
    for (const post of posts) {
      const a = analytics.get(post.platformPostId)
      if (a) {
        post.avgWatchTimeSeconds = a.avgWatchTimeSeconds
        post.completionRate = a.completionRate
        post.clickThroughRate = a.clickThroughRate
      }
    }
  }

  return {
    account: {
      displayName: channel.snippet.title,
      avatarUrl: channel.snippet.thumbnails?.default?.url ?? null,
      followerCount: num(channel.statistics.subscriberCount),
      followingCount: null,
      totalPosts: num(channel.statistics.videoCount),
      platformId: channel.id,
    },
    posts,
  }
}

function emptyAccount() {
  return {
    displayName: null,
    avatarUrl: null,
    followerCount: null,
    followingCount: null,
    totalPosts: null,
    platformId: null,
  }
}
