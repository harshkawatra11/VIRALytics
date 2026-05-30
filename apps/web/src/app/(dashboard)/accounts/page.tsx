import { formatCompact, formatRelativeDate, type AccountStatus, type Platform } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { PlatformIcon } from '@/components/platform-icon'
import { AccountStatusBadge } from '@/components/account-status-badge'
import { AddAccountDialog } from '@/components/add-account-dialog'
import { AccountRowActions } from '@/components/account-row-actions'

export default async function AccountsPage() {
  const supabase = await createClient()
  const accounts = await supabase
    .from('tracked_accounts')
    .select('*')
    .order('created_at', { ascending: false })
    .then((r) => r.data ?? [])

  return (
    <div className="px-8 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">All Accounts</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {accounts.length} tracked account{accounts.length === 1 ? '' : 's'}
          </p>
        </div>
        <AddAccountDialog />
      </header>

      {accounts.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center">
          <h2 className="text-base font-semibold">No accounts yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Paste a YouTube, Instagram, or TikTok profile URL to start tracking public performance
            in seconds.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-subtle)]">
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Followers</th>
                <th className="px-4 py-2.5 text-right font-medium">Videos</th>
                <th className="px-4 py-2.5 text-right font-medium">Avg views</th>
                <th className="px-4 py-2.5 font-medium">Last synced</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform={a.platform as Platform} />
                      <div>
                        <div className="font-medium text-[var(--color-text)]">
                          {a.display_name ?? a.handle}
                        </div>
                        <div className="text-xs text-[var(--color-text-subtle)]">@{a.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AccountStatusBadge status={a.status as AccountStatus} />
                  </td>
                  <td className="px-4 py-3 text-right tabular">{formatCompact(a.follower_count)}</td>
                  <td className="px-4 py-3 text-right tabular">{a.total_posts ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular">{formatCompact(a.avg_views)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {a.last_synced_at ? formatRelativeDate(a.last_synced_at) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <AccountRowActions accountId={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
