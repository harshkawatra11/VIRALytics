'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCompact } from '@viralytics/core'
import { DashCard } from './card'
import { ChartTooltip } from './chart-theme'

export interface DonutSlice {
  name: string
  value: number
  color: string
}

/**
 * Thin donut with a center label + legend. Used for virality split, platform
 * mix, and content-type breakdown. `format` is a string flag (not a function)
 * so this client component can be rendered from a server component.
 */
export function DonutCard({
  title,
  slices,
  centerLabel,
  centerValue,
  format = 'compact',
}: {
  title: string
  slices: DonutSlice[]
  centerLabel: string
  centerValue: string
  format?: 'compact' | 'int'
}) {
  const valueFormat = format === 'int' ? (n: number) => String(n) : formatCompact
  const hasData = slices.some((s) => s.value > 0)

  return (
    <DashCard title={title}>
      {!hasData ? (
        <EmptyDonut />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-[140px] w-[140px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={64}
                  paddingAngle={3}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular text-[var(--color-text)]">
                {centerValue}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-subtle)]">
                {centerLabel}
              </span>
            </div>
          </div>

          <ul className="flex-1 space-y-1.5">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate capitalize text-[var(--color-text-muted)]">{s.name}</span>
                <span className="ml-auto font-semibold tabular text-[var(--color-text)]">
                  {valueFormat(s.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashCard>
  )
}

function EmptyDonut() {
  return (
    <div className="flex h-[140px] items-center justify-center text-sm text-[var(--color-text-subtle)]">
      No data yet
    </div>
  )
}
