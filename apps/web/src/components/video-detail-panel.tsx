'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompact } from '@viralytics/core'

interface MetricPoint {
  recorded_at: string
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  avg_watch_time_seconds: number | null
  completion_rate: number | null
}

interface PostSummary {
  id: string
  caption: string | null
  permalink: string | null
  posted_at: string | null
  platform: string
}

interface Props {
  postId: string | null
  onClose: () => void
}

export function VideoDetailPanel({ postId, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<PostSummary | null>(null)
  const [history, setHistory] = useState<MetricPoint[]>([])

  useEffect(() => {
    if (!postId) { setPost(null); setHistory([]); return }
    setLoading(true)
    fetch(`/api/analytics/posts/${postId}`)
      .then((r) => r.json())
      .then((body: { post: PostSummary; history: MetricPoint[] }) => {
        setPost(body.post)
        setHistory(body.history)
      })
      .finally(() => setLoading(false))
  }, [postId])

  if (!postId) return null

  const hasPrivate = history.some((h) => h.avg_watch_time_seconds != null)

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-sm font-semibold">Video performance</h2>
        <button onClick={onClose} aria-label="Close">
          <X size={18} className="text-[var(--color-text-muted)]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : post ? (
          <div className="space-y-4">
            <div>
              <p className="line-clamp-3 text-sm text-[var(--color-text)]">
                {post.caption ?? 'No caption'}
              </p>
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-brand)] hover:underline"
                >
                  View on {post.platform} <ExternalLink size={11} />
                </a>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No metric history yet.</p>
            ) : (
              <>
                <ChartCard title="Views over time" data={history} dataKey="views" />
                {hasPrivate && (
                  <>
                    <ChartCard
                      title="Avg watch time (s)"
                      data={history}
                      dataKey="avg_watch_time_seconds"
                      color="#00b37e"
                    />
                    <ChartCard
                      title="Completion rate (%)"
                      data={history}
                      dataKey="completion_rate"
                      color="#2F6DF6"
                    />
                  </>
                )}
                {!hasPrivate && (
                  <div className="rounded-md bg-[var(--color-brand-soft)] p-3 text-xs text-[var(--color-brand)]">
                    Connect this account for watch time &amp; completion rate data.
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  data,
  dataKey,
  color = '#7C3AED',
}: {
  title: string
  data: MetricPoint[]
  dataKey: keyof MetricPoint
  color?: string
}) {
  const chartData = data.map((d) => ({
    date: d.recorded_at.slice(0, 10),
    value: d[dataKey] as number | null,
  }))

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">{title}</h3>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e6e8ec" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a93a3' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#8a93a3' }}
            tickFormatter={(v) => formatCompact(v as number)}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip formatter={(v) => formatCompact(v as number)} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
