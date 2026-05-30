import { videosQuerySchema } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { getVideos } from '@/lib/queries/videos'
import { VideosView } from '@/components/videos-view'

export default async function CollectionVideos({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const q = videosQuerySchema.parse({ ...sp, collectionId: id })

  const supabase = await createClient()
  const { rows, total } = await getVideos(supabase, q)

  return (
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
  )
}
