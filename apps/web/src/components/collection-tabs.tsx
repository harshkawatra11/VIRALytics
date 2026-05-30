'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function CollectionTabs({
  collectionId,
  counts,
}: {
  collectionId: string
  counts: { videos: number; accounts: number }
}) {
  const pathname = usePathname()
  const base = `/collection/${collectionId}`
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/videos`, label: `Videos (${counts.videos})` },
    { href: `${base}/accounts`, label: `Accounts (${counts.accounts})` },
  ]
  return (
    <nav className="flex gap-1 border-b border-[var(--color-border)]">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'border-b-2 px-3 py-2 text-sm transition-colors',
              active
                ? 'border-[var(--color-brand)] font-medium text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
