'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Film, Users, Plus, Settings, FolderOpen } from 'lucide-react'
import { formatCompact } from '@viralytics/core'
import { cn } from '@/lib/utils'

export interface SidebarCollection {
  id: string
  name: string
  color: string
}

interface SidebarProps {
  collections: SidebarCollection[]
  trackedPosts: number
  managerName: string
}

const TOP_NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/videos', label: 'All Videos', icon: Film },
  { href: '/accounts', label: 'All Accounts', icon: Users },
]

export function Sidebar({ collections, trackedPosts, managerName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar-scroll flex h-screen w-[240px] flex-col overflow-y-auto bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)]">
      {/* brand */}
      <div className="flex items-center gap-2.5 border-b border-[var(--color-sidebar-border)] px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
          V
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">VIRALytics</div>
          <div className="text-[10px] text-[var(--color-sidebar-text-muted)]">{managerName}</div>
        </div>
      </div>

      {/* primary nav */}
      <nav className="px-2 py-3">
        {TOP_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[var(--color-sidebar-elevated)] text-white'
                  : 'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)] hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* collections */}
      <div className="px-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-sidebar-text-muted)]">
            Collections
          </span>
          <Link
            href="/collection/new"
            aria-label="New collection"
            className="rounded p-0.5 text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-elevated)] hover:text-white"
          >
            <Plus size={14} />
          </Link>
        </div>
        {collections.length === 0 ? (
          <p className="px-3 py-1 text-xs text-[var(--color-sidebar-text-muted)]">
            No collections yet
          </p>
        ) : (
          collections.map((c) => {
            const href = `/collection/${c.id}`
            const active = pathname.startsWith(href)
            return (
              <Link
                key={c.id}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-[var(--color-sidebar-elevated)] text-white'
                    : 'hover:bg-[var(--color-sidebar-elevated)] hover:text-white'
                )}
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate">{c.name}</span>
              </Link>
            )
          })
        )}
      </div>

      {/* creator groups (phase 2 feature placeholder) */}
      <div className="mt-2 px-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-sidebar-text-muted)]">
            Creator Groups
          </span>
          <FolderOpen size={14} className="text-[var(--color-sidebar-text-muted)]" />
        </div>
      </div>

      {/* sticky bottom */}
      <div className="mt-auto border-t border-[var(--color-sidebar-border)]">
        <div className="px-5 py-3">
          <div className="text-sm font-semibold text-white tabular">
            {formatCompact(trackedPosts)}
          </div>
          <div className="text-[10px] text-[var(--color-sidebar-text-muted)]">Tracked posts</div>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 border-t border-[var(--color-sidebar-border)] px-5 py-3 text-sm text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-elevated)] hover:text-white"
        >
          <Settings size={16} />
          Settings &amp; Billing
        </Link>
      </div>
    </aside>
  )
}
