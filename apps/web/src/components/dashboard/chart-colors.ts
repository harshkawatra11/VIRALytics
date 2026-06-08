/** Pure color constants — no client APIs, safe to import from server components. */

export const CHART = {
  c1: '#8b5cf6',
  c2: '#06b6d4',
  c3: '#10b981',
  c4: '#f59e0b',
  c5: '#ec4899',
  c6: '#3b82f6',
} as const

export const CHART_SERIES = [CHART.c1, CHART.c2, CHART.c3, CHART.c4, CHART.c5, CHART.c6]

/** Semantic signal colors — green = up/good, red = down/bad, amber = neutral. */
export const POS = '#16a34a'
export const NEG = '#ef4444'
export const WARN = '#f59e0b'

export function seriesColor(i: number): string {
  return CHART_SERIES[((i % CHART_SERIES.length) + CHART_SERIES.length) % CHART_SERIES.length]!
}

export const PLATFORM_COLOR: Record<string, string> = {
  youtube: '#ff0000',
  instagram: '#e1306c',
  tiktok: '#22d3ee',
}
