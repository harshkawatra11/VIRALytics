/**
 * Month-over-month signal chip. Pure/server-safe (no client APIs) so it can be
 * rendered from server or client components alike. Hidden when value is null
 * (insufficient data) to avoid showing meaningless numbers.
 */
export function DeltaChip({
  value,
  className = '',
}: {
  value: number | null
  className?: string
}) {
  if (value === null) return null
  const isPos = value > 0
  const isNeg = value < 0
  const color = isPos ? 'var(--color-pos)' : isNeg ? 'var(--color-neg)' : 'var(--color-warn)'
  const bg = isPos
    ? 'var(--color-pos-bg)'
    : isNeg
      ? 'var(--color-neg-bg)'
      : 'var(--color-warn-bg)'
  const arrow = isPos ? '▲' : isNeg ? '▼' : '—'
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular ${className}`}
      style={{ color, backgroundColor: bg }}
    >
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

/** Same signal as a chip but on a transparent/glass surface (used in the hero). */
export function DeltaPill({ value }: { value: number | null }) {
  if (value === null) return null
  const isPos = value > 0
  const isNeg = value < 0
  const arrow = isPos ? '▲' : isNeg ? '▼' : '—'
  const text = isPos ? 'text-emerald-300' : isNeg ? 'text-rose-300' : 'text-amber-300'
  const bg = isPos ? 'bg-emerald-400/15' : isNeg ? 'bg-rose-400/15' : 'bg-amber-400/15'
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular ${text} ${bg}`}
    >
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  )
}
