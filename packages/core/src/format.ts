/** Exact comma-separated number (e.g. 4_207 -> "4,207", 1_400_000 -> "1,400,000"). */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('en-US')
}

/** Compact number formatting (e.g. 1_234 -> "1.2K", 4_500_000 -> "4.5M"). */
export function formatCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs < 1_000) return String(Math.round(n))
  const units = [
    { v: 1_000_000_000, s: 'B' },
    { v: 1_000_000, s: 'M' },
    { v: 1_000, s: 'K' },
  ]
  for (const { v, s } of units) {
    if (abs >= v) {
      const scaled = n / v
      // One decimal, but drop a trailing ".0" (e.g. "5M" not "5.0M").
      const str = scaled.toFixed(1).replace(/\.0$/, '')
      return `${str}${s}`
    }
  }
  return String(Math.round(n))
}

/** Percentage with one decimal: 0.066 (ratio) -> "6.6%". Pass already-scaled? No — expects a ratio 0..1. */
export function formatPercentFromRatio(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return '—'
  return `${(ratio * 100).toFixed(1)}%`
}

/** Percentage already expressed 0..100 -> "6.6%". */
export function formatPercent(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return '—'
  return `${pct.toFixed(1)}%`
}

/**
 * Human relative time. Within 7 days returns phrases like "Yesterday",
 * "3 days ago"; older returns a locale date string (dd/mm/yyyy).
 */
export function formatRelativeDate(date: Date | string | number, now: Date = new Date()): string {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = now.getTime() - d.getTime()
  const dayMs = 86_400_000
  const days = Math.floor(diffMs / dayMs)

  if (days < 0) return formatDateDMY(d)
  if (days === 0) {
    const hours = Math.floor(diffMs / 3_600_000)
    if (hours <= 0) return 'Just now'
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDateDMY(d)
}

export function formatDateDMY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Engagement rate (%) = (likes + comments + shares) / followers * 100. */
export function engagementRate(
  likes: number,
  comments: number,
  shares: number,
  followers: number
): number {
  if (!followers || followers <= 0) return 0
  return ((likes + comments + shares) / followers) * 100
}
