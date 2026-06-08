'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Eye, Heart, MessageCircle, Share2, Bookmark, type LucideIcon } from 'lucide-react'
import { formatCompact } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { DashCard } from './card'
import { ChartTooltip, chartColors } from './chart-theme'
import { CHART } from './chart-colors'
import { cn } from '@/lib/utils'

type MetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'saves'

const METRICS: { key: MetricKey; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'views', label: 'Views', icon: Eye, color: CHART.c1 },
  { key: 'likes', label: 'Likes', icon: Heart, color: CHART.c5 },
  { key: 'comments', label: 'Comments', icon: MessageCircle, color: CHART.c6 },
  { key: 'shares', label: 'Shares', icon: Share2, color: CHART.c3 },
  { key: 'saves', label: 'Saves', icon: Bookmark, color: CHART.c4 },
]

const RANGES = [
  { key: '3m', label: '3M', months: 3 },
  { key: '6m', label: '6M', months: 6 },
  { key: '12m', label: '12M', months: 12 },
  { key: 'all', label: 'All', months: Infinity },
] as const

/**
 * Centerpiece performance chart. Metric tabs (Views/Likes/Comments/Shares/Saves)
 * switch the plotted series; range tabs window the months. Series color comes
 * from the vibrant palette (per metric), not the semantic signal colors.
 */
export function EngagementChart({ series }: { series: Overview['timeseries'] }) {
  const [metric, setMetric] = useState<MetricKey>('views')
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('all')
  const { grid, axis } = chartColors()

  const active = METRICS.find((m) => m.key === metric)!

  const data = useMemo(() => {
    const points = series.map((p) => ({ month: p.month, value: p[metric] }))
    const r = RANGES.find((x) => x.key === range)!
    return Number.isFinite(r.months) ? points.slice(-r.months) : points
  }, [series, metric, range])

  const tooltipFormat = (v: number) => `${formatCompact(v)}`

  return (
    <DashCard
      title="Engagement performance"
      action={
        <div className="flex gap-0.5 rounded-lg bg-[var(--color-surface-muted)] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                range === r.key
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {/* metric tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {METRICS.map((m) => {
          const on = m.key === metric
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                on
                  ? 'text-white'
                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
              style={on ? { backgroundColor: m.color } : undefined}
            >
              <m.icon size={13} />
              {m.label}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="engFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={active.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axis }}
            tickFormatter={(v) => formatCompact(v as number)}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip valueFormat={tooltipFormat} />} />
          <Area
            type="monotone"
            dataKey="value"
            name={`Total ${active.label}`}
            stroke={active.color}
            strokeWidth={2.5}
            fill="url(#engFill)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </DashCard>
  )
}
