const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * 7-day posting-activity sparkline (Shortimize style). Green bar = posted that
 * day; height scales with count. Shows "N in 7d" and a per-day average.
 */
export function PostingSparkline({
  activity,
  postedLast7,
}: {
  activity: number[]
  postedLast7: number
}) {
  const max = Math.max(1, ...activity)
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-end gap-0.5" style={{ height: 28 }}>
        {activity.map((count, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className="w-2 rounded-sm"
              style={{
                height: count > 0 ? `${Math.max(4, (count / max) * 22)}px` : '2px',
                backgroundColor: count > 0 ? 'var(--color-accent)' : 'var(--color-border-strong)',
              }}
              title={`${count} post${count === 1 ? '' : 's'}`}
            />
            <span className="text-[8px] leading-none text-[var(--color-text-subtle)]">
              {DAYS[i]}
            </span>
          </div>
        ))}
      </div>
      <div className="leading-tight">
        <div className="text-xs font-medium text-[var(--color-text)]">{postedLast7} in 7d</div>
        <div className="text-[10px] text-[var(--color-text-subtle)]">
          {(postedLast7 / 7).toFixed(1)}/day
        </div>
      </div>
    </div>
  )
}
