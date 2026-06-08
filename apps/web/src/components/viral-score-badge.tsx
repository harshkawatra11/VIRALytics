import { classifyViralScore, viralScoreLabel } from '@viralytics/core'
import { cn } from '@/lib/utils'

/**
 * Shortimize's signature "viral performance" cell.
 *  - hot (>=2x):    green pill  "15.7x more than usual"
 *  - normal (>=0.5): amber pill  "1.1x more than usual"
 *  - cold (<0.5):   red pill    "Less views than usual"
 */
export function ViralScoreBadge({ score }: { score: number }) {
  const tier = classifyViralScore(score)
  const label = viralScoreLabel(score)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular',
        tier === 'hot' && 'bg-[var(--color-pos-bg)] text-[var(--color-pos)]',
        tier === 'normal' && 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
        tier === 'cold' && 'bg-[var(--color-neg-bg)] text-[var(--color-neg)]',
      )}
    >
      {label}
    </span>
  )
}
