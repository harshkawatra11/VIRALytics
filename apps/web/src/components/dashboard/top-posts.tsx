import { Eye, ImageOff } from 'lucide-react'
import { formatCompact, classifyViralScore, type Platform } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { PlatformIcon } from '@/components/platform-icon'
import { DashCard } from './card'

// Semantic viral tiers: hot = green (over-performing), normal = amber, cold = red.
const VIRAL_STYLE: Record<string, string> = {
  hot: 'bg-[var(--color-pos-bg)] text-[var(--color-pos)]',
  normal: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  cold: 'bg-[var(--color-neg-bg)] text-[var(--color-neg)]',
}

export function TopPosts({ posts }: { posts: Overview['top_posts'] }) {
  return (
    <DashCard title="Top performing posts" bodyClassName="p-2">
      {posts.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-subtle)]">
          No posts yet
        </div>
      ) : (
        <ul>
          {posts.map((p, i) => {
            const tier = classifyViralScore(p.viral_score)
            return (
              <li key={p.id}>
                <a
                  href={p.permalink ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-surface-muted)]"
                >
                  <span className="w-4 text-center text-xs font-semibold text-[var(--color-text-subtle)]">
                    {i + 1}
                  </span>
                  <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-[var(--color-surface-muted)]">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--color-text-subtle)]">
                        <ImageOff size={14} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon platform={p.platform as Platform} size={12} />
                      <span className="truncate text-sm text-[var(--color-text)]">
                        {p.caption ?? 'Untitled'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-subtle)]">
                      <Eye size={11} /> {formatCompact(p.views)}
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${VIRAL_STYLE[tier]}`}
                  >
                    {p.viral_score.toFixed(1)}x
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}
