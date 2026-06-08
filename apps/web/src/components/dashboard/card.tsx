import { cn } from '@/lib/utils'

/** Shared dashboard card shell — title + optional action, elevated surface. */
export function DashCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'card-elevated rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]',
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-4 pt-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
          {action}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  )
}
