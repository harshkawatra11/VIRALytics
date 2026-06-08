'use client'

import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Eye, Heart, Percent, Users } from 'lucide-react'
import { formatCompact, formatPercent } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { AnimatedNumber } from './animated-number'
import { DeltaPill } from './delta-chip'

interface HeroPanelProps {
  totals: Overview['totals']
  cumulative: { month: string; views: number }[]
  viewsDelta?: number | null
  followerGrowth?: number | null
}

export function HeroPanel({
  totals,
  cumulative,
  viewsDelta = null,
  followerGrowth = null,
}: HeroPanelProps) {
  const sub = [
    {
      label: 'Followers',
      value: formatCompact(totals.followers),
      icon: Users,
      delta: followerGrowth,
    },
    { label: 'Engagement', value: formatCompact(totals.engagement), icon: Heart, delta: null },
    {
      label: 'Eng. rate',
      value: formatPercent(totals.avg_engagement_rate),
      icon: Percent,
      delta: null,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[var(--radius-card-lg)] p-6 text-white"
      style={{
        background:
          'radial-gradient(120% 140% at 0% 0%, #6366f1 0%, #4c1d95 45%, #0b0e13 100%)',
      }}
    >
      {/* glow accents */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-1/3 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {/* hero metric */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60">
            <Eye size={14} /> Total reach
          </div>
          <div className="mt-2 flex items-end gap-3">
            <AnimatedNumber
              value={totals.views}
              className="text-5xl font-bold tabular leading-none tracking-tight"
            />
            {viewsDelta !== null ? (
              <span className="mb-1">
                <DeltaPill value={viewsDelta} />
              </span>
            ) : (
              <span className="mb-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                {formatCompact(totals.videos)} videos
              </span>
            )}
          </div>
          <p className="mt-2 max-w-sm text-sm text-white/55">
            {viewsDelta !== null
              ? 'Aggregate views across every tracked account — month-over-month change shown.'
              : 'Aggregate views across every tracked account, all time.'}
          </p>

          {/* inline sparkline */}
          <div className="mt-4 h-12 w-full max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulative} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#c4b5fd"
                  strokeWidth={2}
                  fill="url(#heroSpark)"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* glass sub-stats */}
        <div className="grid grid-cols-3 gap-3">
          {sub.map((s) => (
            <div key={s.label} className="glass rounded-xl px-4 py-3 text-center">
              <s.icon size={15} className="mx-auto mb-1.5 text-white/70" />
              <div className="text-lg font-semibold tabular leading-tight">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-white/55">{s.label}</div>
              {s.delta !== null && (
                <div className="mt-1 flex justify-center">
                  <DeltaPill value={s.delta} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
