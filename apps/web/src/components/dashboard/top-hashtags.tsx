import type { Overview } from '@/lib/queries/overview'
import { seriesColor } from './chart-colors'
import { DashCard } from './card'

export function TopHashtags({ hashtags }: { hashtags: Overview['top_hashtags'] }) {
  const max = hashtags.reduce((m, h) => Math.max(m, h.count), 0) || 1

  return (
    <DashCard title="Top hashtags">
      {hashtags.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-subtle)]">
          No hashtags found
        </div>
      ) : (
        <ul className="space-y-2.5">
          {hashtags.map((h, i) => (
            <li key={h.tag} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 truncate text-sm font-medium text-[var(--color-text)]">
                #{h.tag}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(h.count / max) * 100}%`,
                    backgroundColor: seriesColor(i),
                  }}
                />
              </div>
              <span className="w-8 flex-shrink-0 text-right text-xs font-semibold tabular text-[var(--color-text-muted)]">
                {h.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  )
}
