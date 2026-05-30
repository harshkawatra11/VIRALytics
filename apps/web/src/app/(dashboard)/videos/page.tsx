import { videosQuerySchema } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { getVideos } from '@/lib/queries/videos'
import { VideosView } from '@/components/videos-view'

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = videosQuerySchema.parse(sp)

  const supabase = await createClient()
  const { rows, total } = await getVideos(supabase, q)

  return (
    <div className="px-8 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold">All Videos</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Every tracked video, ranked by viral performance.
        </p>
      </header>
      <VideosView
        rows={rows}
        total={total}
        page={q.page}
        pageSize={q.pageSize}
        platform={q.platform}
        sortBy={q.sortBy}
        sortDir={q.sortDir}
        dateRange={q.dateRange}
        hashtag={q.hashtag}
      />
    </div>
  )
}
