import { handle, jsonOk, requireUser } from '@/lib/api'
import { enqueueSync } from '@/lib/queue'
import type { Platform } from '@viralytics/core'

/** Don't re-scrape an account that synced within this window. Set to 110 min so
 *  the 2-hour client interval always triggers a real sync, but a page refresh
 *  within the same session doesn't spam the queue. */
const FRESH_WINDOW_MS = 110 * 60 * 1000

/**
 * Fired by the dashboard on open: refresh every active account for the current
 * manager that hasn't synced very recently. Enqueues are deduped by jobId, so
 * concurrent opens can't pile up duplicate jobs.
 */
export async function POST() {
  return handle(async () => {
    const { user, supabase } = await requireUser()

    const accounts = await supabase
      .from('tracked_accounts')
      .select('id, platform, handle, platform_id, last_synced_at, status')
      .eq('status', 'active')
      .then((r) => r.data ?? [])

    const cutoff = Date.now() - FRESH_WINDOW_MS
    const due = accounts.filter(
      (a) => !a.last_synced_at || new Date(a.last_synced_at).getTime() < cutoff
    )

    await Promise.allSettled(
      due.map((a) =>
        enqueueSync({
          accountId: a.id,
          managerId: user.id,
          platform: a.platform as Platform,
          handle: a.handle,
          platformId: a.platform_id,
          jobType: 'scheduled',
        })
      )
    )

    return jsonOk({ queued: due.length })
  })
}
