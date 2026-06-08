'use client'

import { formatCompact } from '@viralytics/core'

// Re-export pure color helpers so existing client-component imports don't break.
export { CHART, CHART_SERIES, seriesColor, PLATFORM_COLOR } from './chart-colors'

/** Axis/grid colors read live from CSS vars so they adapt to light/dark. */
export function chartColors() {
  if (typeof window === 'undefined') return { grid: '#e7e9f0', axis: '#8a93a3' }
  const styles = getComputedStyle(document.documentElement)
  return {
    grid: styles.getPropertyValue('--chart-grid').trim() || '#e7e9f0',
    axis: styles.getPropertyValue('--chart-axis').trim() || '#8a93a3',
  }
}

interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormat = (v: number) => formatCompact(v),
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  valueFormat?: (v: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2 text-xs shadow-lg">
      {label !== undefined && (
        <div className="mb-1 font-medium text-[var(--color-text)]">{label}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? 'var(--color-brand)' }}
          />
          <span className="capitalize">{entry.name ?? entry.dataKey}</span>
          <span className="ml-auto font-semibold text-[var(--color-text)] tabular">
            {typeof entry.value === 'number' ? valueFormat(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
