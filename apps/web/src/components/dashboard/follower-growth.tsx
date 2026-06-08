'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart } from 'lucide-react'
import { formatCompact } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { DashCard } from './card'
import { ChartTooltip, chartColors } from './chart-theme'
import { CHART } from './chart-colors'
import { DeltaChip } from './delta-chip'

/**
 * Daily follower count over the snapshot window. Falls back to a graceful empty
 * state until enough daily snapshots accumulate (needs >=2 points to plot).
 */
export function FollowerGrowth({
  series,
  delta,
}: {
  series: Overview['follower_series']
  delta: number | null
}) {
  const { grid, axis } = chartColors()
  const hasData = series.length >= 2

  const data = series.map((p) => ({
    label: new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    followers: p.followers,
  }))

  return (
    <DashCard
      title="Follower growth"
      action={hasData ? <DeltaChip value={delta} /> : null}
    >
      {!hasData ? (
        <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]">
            <LineChart size={20} />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            Growth history builds as we sync
          </p>
          <p className="max-w-xs text-xs text-[var(--color-text-subtle)]">
            We snapshot follower counts daily. Your growth curve appears here once a couple of
            days of history accumulate.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="followerFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.c2} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART.c2} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: axis }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axis }}
              tickFormatter={(v) => formatCompact(v as number)}
              tickLine={false}
              axisLine={false}
              width={48}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="followers"
              name="Followers"
              stroke={CHART.c2}
              strokeWidth={2.5}
              fill="url(#followerFill)"
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </DashCard>
  )
}
