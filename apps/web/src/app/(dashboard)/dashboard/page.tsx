import { createClient } from '@/lib/supabase/server'
import { getOverview } from '@/lib/queries/overview'
import { OverviewDashboard } from '@/components/dashboard/overview-dashboard'
import { AddAccountDialog } from '@/components/add-account-dialog'

export default async function DashboardPage() {
  const supabase = await createClient()
  const overview = await getOverview(supabase)

  return (
    <div className="px-8 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Aggregate performance across all your tracked accounts.
          </p>
        </div>
        <AddAccountDialog />
      </header>

      {overview.totals.videos === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <h2 className="text-base font-semibold">Track your first account</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Paste any YouTube, Instagram, or TikTok profile URL to start tracking its public
            performance instantly. Connect accounts you own later for watch-time and completion-rate.
          </p>
        </div>
      ) : (
        <OverviewDashboard overview={overview} />
      )}
    </div>
  )
}
