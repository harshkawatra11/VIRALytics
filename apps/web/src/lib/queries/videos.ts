import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, VideosQuery } from '@viralytics/core'

export type VideoRow = Database['public']['Tables']['posts']['Row'] & {
  account_handle: string | null
  account_display_name: string | null
}

const SORT_COLUMN: Record<VideosQuery['sortBy'], string> = {
  views: 'current_views',
  viral_score: 'viral_score',
  posted_at: 'posted_at',
  engagement_rate: 'current_engagement_rate',
  likes: 'current_likes',
}

function sinceFor(range: VideosQuery['dateRange']): string | null {
  if (range === 'all') return null
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

/**
 * Paginated videos for the current manager (RLS-scoped). The parent account's
 * handle/name is joined in a second query to stay fully typed against our
 * hand-authored Database type (no embedded-relationship metadata needed).
 */
export async function getVideos(
  supabase: SupabaseClient<Database>,
  q: VideosQuery
): Promise<{ rows: VideoRow[]; total: number }> {
  // Resolve collection -> member account ids (collections group accounts).
  let accountIds: string[] | null = null
  if (q.collectionId) {
    const ids = await supabase
      .from('collection_accounts')
      .select('account_id')
      .eq('collection_id', q.collectionId)
      .then((r) => (r.data ?? []).map((x) => x.account_id))
    if (ids.length === 0) return { rows: [], total: 0 }
    accountIds = ids
  }

  let query = supabase.from('posts').select('*', { count: 'exact' })

  if (q.platform) query = query.eq('platform', q.platform)
  if (accountIds) query = query.in('account_id', accountIds)
  if (q.hashtag) query = query.contains('hashtags', [q.hashtag.toLowerCase()])
  const since = sinceFor(q.dateRange)
  if (since) query = query.gte('posted_at', since)

  const from = (q.page - 1) * q.pageSize
  query = query
    .order(SORT_COLUMN[q.sortBy], { ascending: q.sortDir === 'asc', nullsFirst: false })
    .range(from, from + q.pageSize - 1)

  const { data: posts, count, error } = await query
  if (error) throw new Error(error.message)
  if (!posts || posts.length === 0) return { rows: [], total: count ?? 0 }

  // Second step: account labels for the posts on this page.
  const ids = [...new Set(posts.map((p) => p.account_id))]
  const accounts = await supabase
    .from('tracked_accounts')
    .select('id, handle, display_name')
    .in('id', ids)
    .then((r) => new Map((r.data ?? []).map((a) => [a.id, a])))

  const rows: VideoRow[] = posts.map((p) => ({
    ...p,
    account_handle: accounts.get(p.account_id)?.handle ?? null,
    account_display_name: accounts.get(p.account_id)?.display_name ?? null,
  }))

  return { rows, total: count ?? 0 }
}
