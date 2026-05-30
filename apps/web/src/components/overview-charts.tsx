'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompact } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'

const BRAND = '#7C3AED'
const GRID = '#e6e8ec'
const AXIS = '#8a93a3'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      {children}
    </div>
  )
}

export function OverviewCharts({
  cumulative,
  virality,
  duration,
}: {
  cumulative: { month: string; views: number }[]
  virality: Overview['virality']
  duration: Overview['duration']
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <Card title="Cumulative views">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cumulative} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: AXIS }}
                tickFormatter={(v) => formatCompact(v as number)}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip formatter={(v) => formatCompact(v as number)} />
              <Area type="monotone" dataKey="views" stroke={BRAND} strokeWidth={2} fill="url(#v)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Virality analysis">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={virality} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Avg views by duration">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={duration} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: AXIS }}
              tickFormatter={(v) => formatCompact(v as number)}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip formatter={(v) => formatCompact(v as number)} />
            <Bar dataKey="avg_views" fill="#00b37e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
