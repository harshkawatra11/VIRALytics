'use client'

import { motion } from 'framer-motion'
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Activity,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Overview } from '@/lib/queries/overview'
import { AnimatedNumber } from './animated-number'
import { DeltaChip } from './delta-chip'

const CARDS: {
  key: keyof Overview['totals']
  label: string
  icon: LucideIcon
  color: string
}[] = [
  { key: 'followers', label: 'Followers', icon: Users, color: '#6366f1' },
  { key: 'views', label: 'Views', icon: Eye, color: '#8b5cf6' },
  { key: 'engagement', label: 'Engagement', icon: Activity, color: '#06b6d4' },
  { key: 'likes', label: 'Likes', icon: Heart, color: '#ec4899' },
  { key: 'comments', label: 'Comments', icon: MessageCircle, color: '#3b82f6' },
  { key: 'shares', label: 'Shares', icon: Share2, color: '#10b981' },
  { key: 'saves', label: 'Saves', icon: Bookmark, color: '#f59e0b' },
]

export function KpiCards({
  totals,
  deltas = {},
}: {
  totals: Overview['totals']
  deltas?: Partial<Record<keyof Overview['totals'], number | null>>
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
          className="card-elevated card-hover rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${card.color}1a`, color: card.color }}
            >
              <card.icon size={16} />
            </div>
            <DeltaChip value={deltas[card.key] ?? null} />
          </div>
          <div className="text-xs text-[var(--color-text-subtle)]">{card.label}</div>
          <AnimatedNumber
            value={totals[card.key]}
            className="mt-0.5 block text-2xl font-bold tabular text-[var(--color-text)]"
          />
        </motion.div>
      ))}
    </div>
  )
}
