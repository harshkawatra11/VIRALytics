'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Download, Search } from 'lucide-react'
import { PLATFORMS, formatCompact, formatNumber, formatDateDMY, type Platform } from '@viralytics/core'
import type { VideoRow } from '@/lib/queries/videos'
import { PlatformIcon, PLATFORM_LABELS } from '@/components/platform-icon'
import { ViralScoreBadge } from '@/components/viral-score-badge'
import { VideoDetailPanel } from '@/components/video-detail-panel'
import { cn } from '@/lib/utils'

interface Props {
  rows: VideoRow[]
  total: number
  page: number
  pageSize: number
  platform?: Platform
  sortBy: string
  sortDir: 'asc' | 'desc'
  dateRange: string
  hashtag?: string
}

const DATE_RANGES = [
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['90d', '90 days'],
  ['all', 'All time'],
] as const

export function VideosView(props: Props) {
  const { rows, total, page, pageSize } = props
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      }
      // Any filter change resets pagination.
      if (!('page' in updates)) next.delete('page')
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router]
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const exportUrl = `/api/analytics/export?${params.toString()}`

  function toggleSort(col: string) {
    const dir = props.sortBy === col && props.sortDir === 'desc' ? 'asc' : 'desc'
    setParam({ sortBy: col, sortDir: dir })
  }

  return (
    <div>
      {/* filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border-strong)]">
          <button
            onClick={() => setParam({ platform: null })}
            className={cn('px-3 py-1.5 text-xs', !props.platform ? 'bg-[var(--color-surface-muted)] font-medium' : 'text-[var(--color-text-muted)]')}
          >
            All
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setParam({ platform: props.platform === p ? null : p })}
              title={PLATFORM_LABELS[p]}
              className={cn(
                'border-l border-[var(--color-border)] px-3 py-1.5',
                props.platform === p && 'bg-[var(--color-surface-muted)]'
              )}
            >
              <PlatformIcon platform={p} size={14} />
            </button>
          ))}
        </div>

        <select
          value={props.dateRange}
          onChange={(e) => setParam({ dateRange: e.target.value })}
          className="h-8 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-xs"
        >
          {DATE_RANGES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
          <input
            defaultValue={props.hashtag ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam({ hashtag: (e.target as HTMLInputElement).value })
            }}
            placeholder="hashtag…"
            className="h-8 w-36 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-7 pr-2 text-xs"
          />
        </div>

        <a
          href={exportUrl}
          download
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
        >
          <Download size={12} />
          Export CSV
        </a>

        <span className="text-xs text-[var(--color-text-subtle)]">
          {formatCompact(total)} videos
        </span>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-subtle)]">
              <th className="px-3 py-2.5 font-medium">Account</th>
              <th className="px-3 py-2.5 font-medium">Video</th>
              <SortHeader label="Views" col="views" {...props} onSort={toggleSort} align="right" />
              <SortHeader label="Viral Performance" col="viral_score" {...props} onSort={toggleSort} />
              <SortHeader label="Engagement" col="engagement_rate" {...props} onSort={toggleSort} align="right" />
              <th className="px-3 py-2.5 text-right font-medium">Total Eng.</th>
              <th className="px-3 py-2.5 text-right font-medium">Comments</th>
              <SortHeader label="Date" col="posted_at" {...props} onSort={toggleSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-[var(--color-text-muted)]">
                  No videos match these filters yet.
                </td>
              </tr>
            ) : (
              rows.map((v) => {
                const totalEng = v.current_likes + v.current_comments + v.current_shares
                return (
                  <tr
                  key={v.id}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]"
                  onClick={() => setSelectedPostId(v.id)}
                >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={v.platform as Platform} size={14} />
                        <span className="max-w-[120px] truncate text-xs text-[var(--color-text-muted)]">
                          {v.account_display_name ?? v.account_handle ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {v.thumbnail_url ? (
                          <Image
                            src={v.thumbnail_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 flex-shrink-0 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded bg-[var(--color-surface-muted)]" />
                        )}
                        <a
                          href={v.permalink ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[280px] truncate text-xs text-[var(--color-text)] hover:underline"
                        >
                          {v.caption ?? 'Untitled'}
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.current_views)}</td>
                    <td className="px-3 py-2.5">
                      <ViralScoreBadge score={v.viral_score} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{v.current_engagement_rate.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-right tabular">{formatNumber(totalEng)}</td>
                    <td className="px-3 py-2.5 text-right tabular">{formatNumber(v.current_comments)}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-[var(--color-text-muted)]">
                      {v.posted_at ? formatDateDMY(new Date(v.posted_at)) : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setParam({ page: String(page - 1) })}
            className="rounded border border-[var(--color-border-strong)] px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-[var(--color-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setParam({ page: String(page + 1) })}
            className="rounded border border-[var(--color-border-strong)] px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <VideoDetailPanel
        postId={selectedPostId}
        onClose={() => setSelectedPostId(null)}
      />
      {selectedPostId && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setSelectedPostId(null)}
        />
      )}
    </div>
  )
}

function SortHeader({
  label,
  col,
  sortBy,
  onSort,
  align = 'left',
}: {
  label: string
  col: string
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
  align?: 'left' | 'right'
}) {
  return (
    <th className={cn('px-3 py-2.5 font-medium', align === 'right' && 'text-right')}>
      <button
        onClick={() => onSort(col)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-[var(--color-text)]',
          sortBy === col && 'text-[var(--color-text)]'
        )}
      >
        {label}
        <ArrowUpDown size={11} />
      </button>
    </th>
  )
}
