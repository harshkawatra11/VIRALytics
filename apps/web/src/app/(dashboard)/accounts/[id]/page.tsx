import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { formatCompact, formatRelativeDate, type AccountStatus, type Platform } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { getAccountOverview } from '@/lib/queries/account-overview'
import { PlatformIcon } from '@/components/platform-icon'
import { AccountStatusBadge } from '@/components/account-status-badge'
import { OverviewDashboard } from '@/components/dashboard/overview-dashboard'

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [account, overview] = await Promise.all([
    supabase
      .from('tracked_accounts')
      .select('*')
      .eq('id', id)
      .single()
      .then((r) => r.data),
    getAccountOverview(supabase, id),
  ])

  if (!account) notFound()

  const externalUrl =
    account.platform === 'youtube'
      ? `https://youtube.com/@${account.handle}`
      : account.platform === 'instagram'
        ? `https://instagram.com/${account.handle}`
        : `https://tiktok.com/@${account.handle}`

  return (
    <div className="px-8 py-6">
      {/* breadcrumb */}
      <Link
        href="/accounts"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ChevronLeft size={14} />
        All Accounts
      </Link>

      {/* account header */}
      <div className="mb-6 flex items-start justify-between gap-4 rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5">
        <div className="flex items-center gap-4">
          {/* platform avatar placeholder */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-2xl font-bold text-[var(--color-text-subtle)]">
            {(account.display_name ?? account.handle).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[var(--color-text)]">
                {account.display_name ?? account.handle}
              </h1>
              <PlatformIcon platform={account.platform as Platform} />
              <AccountStatusBadge status={account.status as AccountStatus} />
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span>@{account.handle}</span>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
              >
                View profile <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* quick stats strip */}
        <div className="flex flex-shrink-0 items-center divide-x divide-[var(--color-border)]">
          <StatChip label="Followers" value={formatCompact(account.follower_count)} />
          <StatChip label="Videos" value={String(account.total_posts ?? 0)} />
          <StatChip label="Avg views" value={formatCompact(account.avg_views)} />
          <StatChip
            label="Last synced"
            value={account.last_synced_at ? formatRelativeDate(account.last_synced_at) : 'Never'}
          />
        </div>
      </div>

      {/* full analytics dashboard */}
      <OverviewDashboard overview={overview} scope="account" />
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 text-center first:pl-0 last:pr-0">
      <div className="text-base font-semibold tabular text-[var(--color-text)]">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  )
}
