import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { count: accountCount } = await supabase
    .from('tracked_accounts')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="px-8 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Overview</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Aggregate performance across all your tracked accounts.
        </p>
      </header>

      {accountCount === 0 || accountCount == null ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <h2 className="text-base font-semibold">Track your first account</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Paste any YouTube, Instagram, or TikTok profile URL to start tracking its public
            performance instantly. Connect accounts you own later for watch-time and completion-rate.
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          Tracking {accountCount} account{accountCount === 1 ? '' : 's'}. Overview charts arrive in
          Phase 5.
        </p>
      )}
    </div>
  )
}
