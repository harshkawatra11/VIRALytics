import { classifyViralScore, viralScoreLabel } from '@viralytics/core'
import { cn } from '@/lib/utils'

/**
 * Shortimize's signature "viral performance" cell.
 *  - hot (>=2x):   purple pill, "15.7x more than usual"
 *  - normal:       subtle pill, "1.1x more than usual"
 *  - cold (<0.5x): muted text, "Less views than usual"
 */
export function ViralScoreBadge({ score }: { score: number }) {
  const tier = classifyViralScore(score)
  const label = viralScoreLabel(score)

  if (tier === 'cold') {
    return <span className="text-xs text-[var(--color-viral-cold)]">{label}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular',
        tier === 'hot'
          ? 'bg-[var(--color-viral-hot-bg)] text-[var(--color-viral-hot)]'
          : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
      )}
    >
      {label}
    </span>
  )
}
