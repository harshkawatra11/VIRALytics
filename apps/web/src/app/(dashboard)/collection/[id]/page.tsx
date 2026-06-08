import { createClient } from '@/lib/supabase/server'
import { getOverview } from '@/lib/queries/overview'
import { OverviewDashboard } from '@/components/dashboard/overview-dashboard'

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

  return <OverviewDashboard overview={overview} />
}
