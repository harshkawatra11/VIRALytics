import { ApifyClient } from 'apify-client'
import { z } from 'zod'
import type { SyncJobData } from '../queues'
import { env } from '../config'
import type { NormalizedPost, ScrapeResult } from './types'
import { extractHashtags } from './types'

const client = new ApifyClient({ token: env.APIFY_API_TOKEN })

const RESULTS_LIMIT = 100

function n(v: unknown): number {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? x : 0
}

// ---------------------------------------------------------------- Instagram
const igPostSchema = z
  .object({
    id: z.string().optional(),
    shortCode: z.string().optional(),
    type: z.string().optional(), // Image | Video | Sidecar
    url: z.string().optional(),
    caption: z.string().nullable().optional(),
    likesCount: z.number().nullable().optional(),
    commentsCount: z.number().nullable().optional(),
    videoViewCount: z.number().nullable().optional(),
    videoPlayCount: z.number().nullable().optional(),
    timestamp: z.string().nullable().optional(),
    displayUrl: z.string().nullable().optional(),
    videoDuration: z.number().nullable().optional(),
  })
  .passthrough()

const igProfileSchema = z
  .object({
    username: z.string().optional(),
    fullName: z.string().nullable().optional(),
    followersCount: z.number().nullable().optional(),
    followsCount: z.number().nullable().optional(),
    postsCount: z.number().nullable().optional(),
    profilePicUrl: z.string().nullable().optional(),
    id: z.string().nullable().optional(),
    private: z.boolean().optional(),
    latestPosts: z.array(igPostSchema).optional(),
  })
  .passthrough()

function igPostType(t: string | undefined): NormalizedPost['postType'] {
  if (t === 'Video') return 'reel'
  if (t === 'Sidecar') return 'carousel'
  return 'image'
}

export async function scrapeInstagram(job: SyncJobData): Promise<ScrapeResult> {
  const run = await client.actor('apify/instagram-profile-scraper').call({
    usernames: [job.handle],
    resultsLimit: RESULTS_LIMIT,
  })
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const profile = igProfileSchema.safeParse(items[0])
  if (!profile.success || !profile.data.username) {
    return { account: empty(), posts: [], status: 'not_found' }
  }
  const p = profile.data
  if (p.private) return { account: empty(), posts: [], status: 'private' }

  const posts: NormalizedPost[] = (p.latestPosts ?? []).map((post) => {
    const views = n(post.videoViewCount ?? post.videoPlayCount)
    return {
      platformPostId: post.id ?? post.shortCode ?? post.url ?? crypto.randomUUID(),
      postType: igPostType(post.type),
      caption: post.caption ?? null,
      hashtags: extractHashtags(post.caption),
      thumbnailUrl: post.displayUrl ?? null,
      durationSeconds: post.videoDuration ? Math.round(post.videoDuration) : null,
      permalink: post.url ?? null,
      postedAt: post.timestamp ?? null,
      views,
      likes: n(post.likesCount),
      comments: n(post.commentsCount),
      shares: 0,
      saves: null,
      impressions: null,
      reach: null,
      avgWatchTimeSeconds: null,
      completionRate: null,
      clickThroughRate: null,
    }
  })

  return {
    account: {
      displayName: p.fullName ?? p.username ?? null,
      avatarUrl: p.profilePicUrl ?? null,
      followerCount: p.followersCount ?? null,
      followingCount: p.followsCount ?? null,
      totalPosts: p.postsCount ?? null,
      platformId: p.id ?? null,
    },
    posts,
  }
}

// ------------------------------------------------------------------- TikTok
const ttItemSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().nullable().optional(),
    createTime: z.number().nullable().optional(),
    createTimeISO: z.string().nullable().optional(),
    webVideoUrl: z.string().nullable().optional(),
    diggCount: z.number().nullable().optional(),
    commentCount: z.number().nullable().optional(),
    shareCount: z.number().nullable().optional(),
    playCount: z.number().nullable().optional(),
    videoMeta: z
      .object({ duration: z.number().nullable().optional(), coverUrl: z.string().nullable().optional() })
      .passthrough()
      .optional(),
    authorMeta: z
      .object({
        name: z.string().optional(),
        nickName: z.string().nullable().optional(),
        fans: z.number().nullable().optional(),
        following: z.number().nullable().optional(),
        video: z.number().nullable().optional(),
        avatar: z.string().nullable().optional(),
        id: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export async function scrapeTiktok(job: SyncJobData): Promise<ScrapeResult> {
  const run = await client.actor('clockworks/tiktok-scraper').call({
    profiles: [job.handle],
    resultsPerPage: RESULTS_LIMIT,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  })
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  const parsed = items.map((i) => ttItemSchema.safeParse(i)).flatMap((r) => (r.success ? [r.data] : []))
  if (parsed.length === 0) return { account: empty(), posts: [], status: 'not_found' }

  const author = parsed.find((i) => i.authorMeta)?.authorMeta

  const posts: NormalizedPost[] = parsed
    .filter((i) => i.id)
    .map((i) => ({
      platformPostId: i.id!,
      postType: 'video' as const,
      caption: i.text ?? null,
      hashtags: extractHashtags(i.text),
      thumbnailUrl: i.videoMeta?.coverUrl ?? null,
      durationSeconds: i.videoMeta?.duration ?? null,
      permalink: i.webVideoUrl ?? null,
      postedAt: i.createTimeISO ?? (i.createTime ? new Date(i.createTime * 1000).toISOString() : null),
      views: n(i.playCount),
      likes: n(i.diggCount),
      comments: n(i.commentCount),
      shares: n(i.shareCount),
      saves: null,
      impressions: null,
      reach: null,
      avgWatchTimeSeconds: null,
      completionRate: null,
      clickThroughRate: null,
    }))

  return {
    account: {
      displayName: author?.nickName ?? author?.name ?? job.handle,
      avatarUrl: author?.avatar ?? null,
      followerCount: author?.fans ?? null,
      followingCount: author?.following ?? null,
      totalPosts: author?.video ?? null,
      platformId: author?.id ?? null,
    },
    posts,
  }
}

function empty() {
  return {
    displayName: null,
    avatarUrl: null,
    followerCount: null,
    followingCount: null,
    totalPosts: null,
    platformId: null,
  }
}
