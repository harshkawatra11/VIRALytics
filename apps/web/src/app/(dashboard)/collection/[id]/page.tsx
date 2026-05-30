import { createClient } from '@/lib/supabase/server'
import { getOverview, toCumulative } from '@/lib/queries/overview'
import { StatCards } from '@/components/stat-cards'
import { OverviewCharts } from '@/components/overview-charts'

export default async function CollectionOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const overview = await getOverview(supabase, id)

  if (overview.totals.videos === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No videos in this collection yet. Add accounts to it from the Accounts tab.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <StatCards totals={overview.totals} />
      <OverviewCharts
        cumulative={toCumulative(overview.timeseries)}
        virality={overview.virality}
        duration={overview.duration}
      />
    </div>
  )
}
