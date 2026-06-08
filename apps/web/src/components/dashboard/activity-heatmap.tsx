import type { Overview } from '@/lib/queries/overview'
import { DashCard } from './card'

/**
 * 12-month posting-activity strip. Builds a continuous month axis (so gaps show
 * as empty) and shades each cell by post-count intensity.
 */
export function ActivityHeatmap({ activity }: { activity: Overview['activity'] }) {
  const byMonth = new Map(activity.map((a) => [a.month, a.count]))
  const max = activity.reduce((m, a) => Math.max(m, a.count), 0) || 1

  // Build the last 12 month keys ending at the current month.
  const now = new Date()
  const months: { key: string; label: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      label: d.toLocaleString('en', { month: 'short' }),
      count: byMonth.get(key) ?? 0,
    })
  }

  const total = months.reduce((s, m) => s + m.count, 0)

  return (
    <DashCard
      title="Posting activity"
      action={
        <span className="text-xs text-[var(--color-text-subtle)]">{total} posts · 12 mo</span>
      }
    >
      <div className="flex items-end justify-between gap-1.5">
        {months.map((m) => {
          const intensity = m.count === 0 ? 0 : 0.25 + (m.count / max) * 0.75
          return (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="flex h-14 w-full items-end justify-center rounded-md"
                style={{
                  backgroundColor:
                    m.count === 0
                      ? 'var(--color-surface-muted)'
                      : `color-mix(in srgb, var(--color-pos) ${intensity * 100}%, transparent)`,
                }}
                title={`${m.label}: ${m.count} posts`}
              >
                {m.count > 0 && (
                  <span className="pb-1 text-[10px] font-semibold text-white mix-blend-difference">
                    {m.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[var(--color-text-subtle)]">{m.label}</span>
            </div>
          )
        })}
      </div>
    </DashCard>
  )
}
