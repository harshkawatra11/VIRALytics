import { formatCompact, formatRelativeDate, type Platform } from '@viralytics/core'
import type { AccountStats } from '@/lib/queries/accounts'
import { PlatformIcon } from '@/components/platform-icon'
import { PostingSparkline } from '@/components/posting-sparkline'

export function AccountsStatsTable({ accounts }: { accounts: AccountStats[] }) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-muted)]">
        No accounts here yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-subtle)]">
            <th className="px-3 py-2.5 font-medium">Account</th>
            <th className="px-3 py-2.5 text-right font-medium">Tracked</th>
            <th className="px-3 py-2.5 text-right font-medium">Total views</th>
            <th className="px-3 py-2.5 text-right font-medium">Avg / video</th>
            <th className="px-3 py-2.5 text-right font-medium">Highest</th>
            <th className="px-3 py-2.5 font-medium">Posting activity</th>
            <th className="px-3 py-2.5 font-medium">Last posted</th>
            <th className="px-3 py-2.5 font-medium">Collections</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={a.platform as Platform} size={14} />
                  <div>
                    <div className="font-medium text-[var(--color-text)]">
                      {a.display_name ?? a.handle}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-subtle)]">@{a.handle}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular">
                {a.tracked_videos}/{a.total_posts ?? a.tracked_videos}
              </td>
              <td className="px-3 py-2.5 text-right tabular">{formatCompact(a.total_views)}</td>
              <td className="px-3 py-2.5 text-right tabular">{formatCompact(a.avg_views)}</td>
              <td className="px-3 py-2.5 text-right tabular">{formatCompact(a.highest_views)}</td>
              <td className="px-3 py-2.5">
                <PostingSparkline activity={a.postingActivity} postedLast7={a.postedLast7} />
              </td>
              <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                {a.lastPostedAt ? formatRelativeDate(a.lastPostedAt) : '—'}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {a.collections.slice(0, 1).map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px]"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                  ))}
                  {a.collections.length > 1 && (
                    <span className="text-[10px] text-[var(--color-text-subtle)]">
                      +{a.collections.length - 1}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
