import { cn } from '@/lib/utils'

/** Lightweight typographic wrappers for legal copy (no typography plugin needed). */
export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-2 text-2xl font-semibold text-[var(--color-text)]">{children}</h1>
}
export function Updated({ date }: { date: string }) {
  return <p className="mb-6 text-xs text-[var(--color-text-subtle)]">Last updated: {date}</p>
}
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 text-base font-semibold text-[var(--color-text)]">{children}</h2>
}
export function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mb-3 text-sm leading-relaxed text-[var(--color-text-muted)]', className)}>
      {children}
    </p>
  )
}
export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
      {children}
    </ul>
  )
}
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 rounded-md border-l-2 border-[var(--color-warning)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
      {children}
    </p>
  )
}
