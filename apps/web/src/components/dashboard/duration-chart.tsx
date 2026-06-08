'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { DashCard } from './card'
import { seriesColor, ChartTooltip, chartColors } from './chart-theme'

export function DurationChart({ data }: { data: Overview['duration'] }) {
  const { grid, axis } = chartColors()
  return (
    <DashCard title="Avg views by duration">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 11, fill: axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: axis }}
            tickFormatter={(v) => formatCompact(v as number)}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip cursor={{ fill: 'var(--color-surface-muted)' }} content={<ChartTooltip />} />
          <Bar dataKey="avg_views" name="Avg views" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={seriesColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </DashCard>
  )
}
