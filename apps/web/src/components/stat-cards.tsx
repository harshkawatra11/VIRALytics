import { formatCompact } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'

const STATS: { key: keyof Overview['totals']; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'saves', label: 'Saves' },
]

export function StatCards({ totals }: { totals: Overview['totals'] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3 lg:grid-cols-6">
      {STATS.map(({ key, label }) => (
        <div key={key} className="bg-[var(--color-surface)] p-4">
          <div className="text-xs text-[var(--color-text-subtle)]">{label}</div>
          <div className="mt-1 text-xl font-semibold tabular text-[var(--color-text)]">
            {formatCompact(totals[key])}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-subtle)]">
            All time
          </div>
        </div>
      ))}
    </div>
  )
}
