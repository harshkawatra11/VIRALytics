import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Returns the metric history for a single post. Ownership is verified via the
 * RLS-scoped session client; history is fetched with service role (bypasses
 * post_metrics's zero-policy RLS), but only after ownership is confirmed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { postId } = await params

    // Ownership check: can the current user see this post?
    const post = await supabase
      .from('posts')
      .select('id, platform_post_id, caption, permalink, posted_at, platform, account_id')
      .eq('id', postId)
      .maybeSingle()
      .then((r) => r.data)
    if (!post) return jsonError('Post not found', 404)

    // Fetch history with service role (post_metrics has no RLS policies).
    const history = await createServiceClient()
      .from('post_metrics')
      .select('recorded_at, views, likes, comments, shares, saves, avg_watch_time_seconds, completion_rate, click_through_rate, engagement_rate')
      .eq('post_id', postId)
      .order('recorded_at', { ascending: true })
      .then((r) => r.data ?? [])

    return jsonOk({ post, history })
  })
}
