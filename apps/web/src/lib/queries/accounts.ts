import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'

export interface AccountStats {
  id: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  handle: string
  display_name: string | null
  avatar_url: string | null
  status: Database['public']['Tables']['tracked_accounts']['Row']['status']
  follower_count: number | null
  total_posts: number | null
  tracked_videos: number
  total_views: number
  avg_views: number
  highest_views: number
  /** 7 buckets, oldest→newest, count of posts that day. */
  postingActivity: number[]
  postedLast7: number
  lastPostedAt: string | null
  collections: { id: string; name: string; color: string }[]
}

/**
 * Accounts enriched with per-account aggregates and a 7-day posting sparkline,
 * derived from the denormalized posts table (RLS-scoped). For a collection,
 * pass its member account ids.
 */
export async function getAccountStats(
  supabase: SupabaseClient<Database>,
  accountIds?: string[]
): Promise<AccountStats[]> {
  let accountsQuery = supabase
    .from('tracked_accounts')
    .select('id, platform, handle, display_name, avatar_url, status, follower_count, total_posts, avg_views')
    .order('created_at', { ascending: false })
  if (accountIds) accountsQuery = accountsQuery.in('id', accountIds)
  const accounts = await accountsQuery.then((r) => r.data ?? [])
  if (accounts.length === 0) return []

  const ids = accounts.map((a) => a.id)

  // Pull lightweight post rows for aggregates + sparkline (capped per account by RLS scope).
  const posts = await supabase
    .from('posts')
    .select('account_id, current_views, posted_at')
    .in('account_id', ids)
    .then((r) => r.data ?? [])

  // Collection memberships for the pill column (two plain queries — no embed,
  // keeping types simple against our hand-authored Database).
  const membershipRows = await supabase
    .from('collection_accounts')
    .select('account_id, collection_id')
    .in('account_id', ids)
    .then((r) => r.data ?? [])
  const collectionIds = [...new Set(membershipRows.map((m) => m.collection_id))]
  const collectionsById = collectionIds.length
    ? await supabase
        .from('collections')
        .select('id, name, color')
        .in('id', collectionIds)
        .then((r) => new Map((r.data ?? []).map((c) => [c.id, c])))
    : new Map<string, { id: string; name: string; color: string }>()

  const dayMs = 86_400_000
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return accounts.map((a) => {
    const own = posts.filter((p) => p.account_id === a.id)
    const views = own.map((p) => p.current_views)
    const totalViews = views.reduce((s, v) => s + v, 0)
    const highest = views.reduce((m, v) => Math.max(m, v), 0)

    const activity = new Array<number>(7).fill(0)
    let lastPostedAt: string | null = null
    for (const p of own) {
      if (!p.posted_at) continue
      if (!lastPostedAt || p.posted_at > lastPostedAt) lastPostedAt = p.posted_at
      const d = new Date(p.posted_at)
      d.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today.getTime() - d.getTime()) / dayMs)
      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays
        activity[idx] = (activity[idx] ?? 0) + 1
      }
    }

    const cols = membershipRows
      .filter((m) => m.account_id === a.id)
      .flatMap((m) => {
        const c = collectionsById.get(m.collection_id)
        return c ? [c] : []
      })

    return {
      id: a.id,
      platform: a.platform,
      handle: a.handle,
      display_name: a.display_name,
      avatar_url: a.avatar_url,
      status: a.status,
      follower_count: a.follower_count,
      total_posts: a.total_posts,
      tracked_videos: own.length,
      total_views: totalViews,
      avg_views: a.avg_views,
      highest_views: highest,
      postingActivity: activity,
      postedLast7: activity.reduce((s, v) => s + v, 0),
      lastPostedAt,
      collections: cols,
    }
  })
}
