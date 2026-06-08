import 'server-only'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'

const totalsSchema = z.object({
  videos: z.number(),
  views: z.number(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  saves: z.number(),
  engagement: z.number(),
  avg_engagement_rate: z.number().default(0),
  accounts: z.number().default(0),
  followers: z.number().default(0),
})

const TOTALS_DEFAULT = {
  videos: 0,
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  engagement: 0,
  avg_engagement_rate: 0,
  accounts: 0,
  followers: 0,
}

const overviewSchema = z.object({
  totals: totalsSchema.default(TOTALS_DEFAULT),
  viral_split: z
    .object({ hot: z.number(), normal: z.number(), cold: z.number() })
    .default({ hot: 0, normal: 0, cold: 0 }),
  virality: z.array(z.object({ bucket: z.string(), count: z.number() })).default([]),
  platforms: z
    .array(z.object({ platform: z.string(), videos: z.number(), views: z.number() }))
    .default([]),
  post_types: z
    .array(z.object({ type: z.string(), count: z.number(), avg_views: z.number() }))
    .default([]),
  duration: z.array(z.object({ bucket: z.string(), avg_views: z.number() })).default([]),
  timeseries: z
    .array(
      z.object({
        month: z.string(),
        views: z.number(),
        engagement: z.number().default(0),
        likes: z.number().default(0),
        comments: z.number().default(0),
        shares: z.number().default(0),
        saves: z.number().default(0),
      })
    )
    .default([]),
  follower_series: z
    .array(z.object({ date: z.string(), followers: z.number() }))
    .default([]),
  top_posts: z
    .array(
      z.object({
        id: z.string(),
        caption: z.string().nullable(),
        thumbnail_url: z.string().nullable(),
        permalink: z.string().nullable(),
        platform: z.string(),
        views: z.number(),
        viral_score: z.number(),
      })
    )
    .default([]),
  top_hashtags: z.array(z.object({ tag: z.string(), count: z.number() })).default([]),
  activity: z.array(z.object({ month: z.string(), count: z.number() })).default([]),
})

export { overviewSchema }
export type Overview = z.infer<typeof overviewSchema>
export type OverviewTotals = z.infer<typeof totalsSchema>

export async function getOverview(
  supabase: SupabaseClient<Database>,
  collectionId?: string
): Promise<Overview> {
  const { data, error } = await supabase.rpc('manager_overview', {
    p_collection: collectionId ?? null,
  })
  if (error) throw new Error(error.message)
  return overviewSchema.parse(data ?? {})
}

/** Cumulative views series for the area chart, derived from the monthly totals. */
export function toCumulative(series: Overview['timeseries']): { month: string; views: number }[] {
  let running = 0
  return series.map((p) => {
    running += p.views
    return { month: p.month, views: running }
  })
}

/** Per-metric monthly series for the tabbed engagement chart. */
export type TimeseriesMetric = 'views' | 'engagement' | 'likes' | 'comments' | 'shares' | 'saves'

export function monthlyMetric(
  series: Overview['timeseries'],
  key: TimeseriesMetric
): { month: string; value: number }[] {
  return series.map((p) => ({ month: p.month, value: p[key] }))
}

/**
 * Month-over-month % change for a metric (last complete month vs the prior
 * month). Returns null when there's <2 months of data or the base is 0, so the
 * UI can hide the delta chip rather than show a meaningless number.
 */
export function momDelta(series: Overview['timeseries'], key: TimeseriesMetric): number | null {
  if (series.length < 2) return null
  const last = series[series.length - 1]![key]
  const prev = series[series.length - 2]![key]
  if (prev === 0) return null
  return ((last - prev) / prev) * 100
}

/** First→last % change across the follower window; null when <2 points. */
export function followerDelta(series: Overview['follower_series']): number | null {
  if (series.length < 2) return null
  const first = series[0]!.followers
  const last = series[series.length - 1]!.followers
  if (first === 0) return null
  return ((last - first) / first) * 100
}
