import { engagementRate, type Database } from '@viralytics/core'
import { db } from './db'
import type { SyncJobData } from './queues'
import type { ScrapeResult } from './scrapers/types'

type PostInsert = Database['public']['Tables']['posts']['Insert']
type MetricInsert = Database['public']['Tables']['post_metrics']['Insert']
type AccountUpdate = Database['public']['Tables']['tracked_accounts']['Update']

export interface PersistResult {
  postsFound: number
  postsNew: number
}

/**
 * Idempotently writes a scrape result:
 *  1. update the account profile fields
 *  2. upsert posts (denormalized current metrics) keyed on (account, platform_post_id)
 *  3. insert a metric snapshot per post (history)
 *  4. insert a daily account snapshot
 *  5. recompute avg_views + every post's viral_score via RPC
 * Retries are safe — upserts and the RPC are deterministic.
 */
export async function persistScrape(job: SyncJobData, result: ScrapeResult): Promise<PersistResult> {
  const { accountId } = job
  const a = result.account

  // 1. account profile — only write fields the scraper actually returned, so a
  // partial scrape (e.g. the backfill post-scraper, which has no profile data)
  // never wipes good values like follower_count.
  const accountUpdate: AccountUpdate = {
    status: 'active',
    last_synced_at: new Date().toISOString(),
  }
  if (a.displayName !== null) accountUpdate.display_name = a.displayName
  if (a.avatarUrl !== null) accountUpdate.avatar_url = a.avatarUrl
  if (a.followerCount !== null) accountUpdate.follower_count = a.followerCount
  if (a.followingCount !== null) accountUpdate.following_count = a.followingCount
  if (a.totalPosts !== null) accountUpdate.total_posts = a.totalPosts
  if (a.platformId !== null) accountUpdate.platform_id = a.platformId
  await db.from('tracked_accounts').update(accountUpdate).eq('id', accountId)

  // Followers used for engagement-rate math: prefer the scrape, else the stored
  // value (so backfill rows get accurate rates instead of dividing by zero).
  let followers = a.followerCount ?? 0
  if (followers === 0) {
    const stored = await db
      .from('tracked_accounts')
      .select('follower_count')
      .eq('id', accountId)
      .single()
      .then((r) => r.data?.follower_count ?? 0)
    followers = stored
  }

  if (result.posts.length === 0) return { postsFound: 0, postsNew: 0 }

  // Which posts already exist? (for posts_new accounting)
  const existing = await db
    .from('posts')
    .select('platform_post_id')
    .eq('account_id', accountId)
    .then((r) => new Set((r.data ?? []).map((p) => p.platform_post_id)))

  const postRows: PostInsert[] = result.posts.map((p) => ({
    account_id: accountId,
    platform: job.platform,
    platform_post_id: p.platformPostId,
    post_type: p.postType,
    caption: p.caption,
    hashtags: p.hashtags,
    thumbnail_url: p.thumbnailUrl,
    duration_seconds: p.durationSeconds,
    permalink: p.permalink,
    posted_at: p.postedAt,
    current_views: p.views,
    current_likes: p.likes,
    current_comments: p.comments,
    current_shares: p.shares,
    current_saves: p.saves,
    current_engagement_rate: round4(engagementRate(p.likes, p.comments, p.shares, followers)),
  }))

  // 2. upsert posts, returning ids so we can attach metric snapshots
  const { data: upserted, error } = await db
    .from('posts')
    .upsert(postRows, { onConflict: 'account_id,platform_post_id' })
    .select('id, platform_post_id')
  if (error) throw new Error(`posts upsert failed: ${error.message}`)

  const idByPlatformId = new Map((upserted ?? []).map((r) => [r.platform_post_id, r.id]))

  // 3. metric snapshots (history)
  const metricRows: MetricInsert[] = result.posts.flatMap((p) => {
    const postId = idByPlatformId.get(p.platformPostId)
    if (!postId) return []
    return [
      {
        post_id: postId,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        impressions: p.impressions,
        reach: p.reach,
        engagement_rate: round4(engagementRate(p.likes, p.comments, p.shares, followers)),
        avg_watch_time_seconds: p.avgWatchTimeSeconds,
        completion_rate: p.completionRate,
        click_through_rate: p.clickThroughRate,
      },
    ]
  })
  if (metricRows.length > 0) {
    const { error: mErr } = await db.from('post_metrics').insert(metricRows)
    if (mErr) throw new Error(`post_metrics insert failed: ${mErr.message}`)
  }

  // 4. account snapshot
  await db.from('account_snapshots').insert({
    account_id: accountId,
    follower_count: a.followerCount ?? followers,
    total_views: result.posts.reduce((sum, p) => sum + p.views, 0),
  })

  // 5. recompute avg_views + viral_score for the account (single DB round trip)
  const { error: rpcErr } = await db.rpc('refresh_account_aggregates', { p_account_id: accountId })
  if (rpcErr) throw new Error(`refresh_account_aggregates failed: ${rpcErr.message}`)

  const postsNew = result.posts.filter((p) => !existing.has(p.platformPostId)).length
  return { postsFound: result.posts.length, postsNew }
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}
