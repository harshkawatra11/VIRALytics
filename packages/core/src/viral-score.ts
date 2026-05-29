/**
 * Viral score = a post's views / the account's average views.
 *  - 15.7  -> the post got 15.7x the account's typical views
 *  - 1.0   -> exactly average
 *  - 0.3   -> well below average
 *
 * This is the single most important UI signal (Shortimize's purple
 * "X more than usual" pill). Classification thresholds are tunable here so the
 * worker (which persists the number) and the UI (which colors it) never drift.
 */

export type ViralTier = 'hot' | 'normal' | 'cold'

export const VIRAL_THRESHOLDS = {
  /** >= this -> "hot" (purple pill). */
  hot: 2,
  /** >= this (and < hot) -> "normal"; below -> "cold". */
  normal: 0.5,
} as const

/** Compute the raw score. Returns 0 when the account has no usable average yet. */
export function computeViralScore(views: number, accountAvgViews: number): number {
  if (!accountAvgViews || accountAvgViews <= 0) return 0
  if (!Number.isFinite(views) || views < 0) return 0
  return views / accountAvgViews
}

export function classifyViralScore(score: number): ViralTier {
  if (score >= VIRAL_THRESHOLDS.hot) return 'hot'
  if (score >= VIRAL_THRESHOLDS.normal) return 'normal'
  return 'cold'
}

/**
 * Display label matching Shortimize's column:
 *  - hot/normal -> "15.7x more than usual"
 *  - cold       -> "Less views than usual"
 */
export function viralScoreLabel(score: number): string {
  if (classifyViralScore(score) === 'cold') return 'Less views than usual'
  return `${score.toFixed(1)}x more than usual`
}
