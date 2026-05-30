import type { AccountStatus } from '@viralytics/core'
import { cn } from '@/lib/utils'

const STATUS: Record<AccountStatus, { label: string; cls: string }> = {
  pending: { label: 'Syncing…', cls: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]' },
  active: { label: 'Active', cls: 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]' },
  error: { label: 'Error', cls: 'bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]' },
  private: { label: 'Private', cls: 'bg-[var(--color-warning-bg,#fdf0d5)] text-[var(--color-warning)]' },
  not_found: { label: 'Not found', cls: 'bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]' },
  paused: { label: 'Paused', cls: 'bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]' },
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const s = STATUS[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  )
}
