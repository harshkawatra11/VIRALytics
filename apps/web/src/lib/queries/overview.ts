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
})

const overviewSchema = z.object({
  totals: totalsSchema.default({
    videos: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    engagement: 0,
  }),
  virality: z.array(z.object({ bucket: z.string(), count: z.number() })).default([]),
  duration: z.array(z.object({ bucket: z.string(), avg_views: z.number() })).default([]),
  timeseries: z.array(z.object({ month: z.string(), views: z.number() })).default([]),
})

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
