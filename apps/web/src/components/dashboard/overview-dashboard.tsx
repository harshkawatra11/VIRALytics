import { formatCompact, type Platform } from '@viralytics/core'
import type { Overview } from '@/lib/queries/overview'
import { toCumulative, momDelta, followerDelta } from '@/lib/queries/overview'
import { PLATFORM_LABELS } from '@/components/platform-icon'
import { HeroPanel } from './hero-panel'
import { KpiCards } from './kpi-card'
import { EngagementChart } from './engagement-chart'
import { FollowerGrowth } from './follower-growth'
import { DonutCard, type DonutSlice } from './donut-card'
import { DurationChart } from './duration-chart'
import { TopPosts } from './top-posts'
import { TopHashtags } from './top-hashtags'
import { ActivityHeatmap } from './activity-heatmap'
import { seriesColor, PLATFORM_COLOR, CHART } from './chart-colors'

/**
 * Full enriched dashboard, shared by the Overview page, Collection pages, and
 * per-account pages. `scope` controls cross-account-only widgets: the manager
 * view shows the Platform-split donut (meaningful across accounts) while the
 * per-account view hides it (usually a single platform).
 */
export function OverviewDashboard({
  overview,
  scope = 'manager',
}: {
  overview: Overview
  scope?: 'manager' | 'account'
}) {
  const t = overview.totals

  // Engagement breakdown — replaces the old viral-split donut. Center = total engagement.
  const engagementSlices: DonutSlice[] = [
    { name: 'Likes', value: t.likes, color: CHART.c5 },
    { name: 'Comments', value: t.comments, color: CHART.c6 },
    { name: 'Shares', value: t.shares, color: CHART.c3 },
    { name: 'Saves', value: t.saves, color: CHART.c4 },
  ]

  const platformSlices: DonutSlice[] = overview.platforms.map((p) => ({
    name: PLATFORM_LABELS[p.platform as Platform] ?? p.platform,
    value: p.views,
    color: PLATFORM_COLOR[p.platform] ?? seriesColor(0),
  }))

  const typeSlices: DonutSlice[] = overview.post_types.map((t, i) => ({
    name: t.type,
    value: t.count,
    color: seriesColor(i),
  }))

  // Month-over-month deltas for KPI chips + hero. followers uses the snapshot
  // window; everything else uses last-complete-month vs prior month.
  const fGrowth = followerDelta(overview.follower_series)
  const deltas = {
    followers: fGrowth,
    views: momDelta(overview.timeseries, 'views'),
    engagement: momDelta(overview.timeseries, 'engagement'),
    likes: momDelta(overview.timeseries, 'likes'),
    comments: momDelta(overview.timeseries, 'comments'),
    shares: momDelta(overview.timeseries, 'shares'),
    saves: momDelta(overview.timeseries, 'saves'),
  }

  const showPlatform = scope === 'manager' && platformSlices.length > 0

  return (
    <div className="space-y-4">
      <HeroPanel
        totals={t}
        cumulative={toCumulative(overview.timeseries)}
        viewsDelta={deltas.views}
        followerGrowth={fGrowth}
      />

      <KpiCards totals={t} deltas={deltas} />

      {/* engagement performance (2-col) + engagement breakdown donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EngagementChart series={overview.timeseries} />
        </div>
        <DonutCard
          title="Engagement breakdown"
          slices={engagementSlices}
          centerLabel="engagement"
          centerValue={formatCompact(t.engagement)}
        />
      </div>

      {/* follower growth (2-col) + content-type donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FollowerGrowth series={overview.follower_series} delta={fGrowth} />
        </div>
        <DonutCard
          title="Content type"
          slices={typeSlices}
          centerLabel="posts"
          centerValue={String(t.videos)}
          format="int"
        />
      </div>

      {/* platform split (manager only) + duration */}
      {showPlatform ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DonutCard
            title="Platform split"
            slices={platformSlices}
            centerLabel="views"
            centerValue={formatCompact(t.views)}
          />
          <div className="lg:col-span-2">
            <DurationChart data={overview.duration} />
          </div>
        </div>
      ) : (
        <DurationChart data={overview.duration} />
      )}

      {/* leaderboards + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPosts posts={overview.top_posts} />
        </div>
        <TopHashtags hashtags={overview.top_hashtags} />
      </div>

      <ActivityHeatmap activity={overview.activity} />
    </div>
  )
}
