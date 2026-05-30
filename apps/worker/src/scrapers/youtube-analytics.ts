import { z } from 'zod'

/**
 * YouTube Analytics API — private metrics (watch time, completion rate, CTR).
 * Requires an OAuth access token with yt-analytics.readonly scope.
 * Called only when the account has a connected OAuth token.
 */

const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2'

const reportSchema = z.object({
  columnHeaders: z.array(z.object({ name: z.string() })),
  rows: z.array(z.array(z.number())).optional().default([]),
})

interface VideoAnalytics {
  videoId: string
  avgWatchTimeSeconds: number | null
  completionRate: number | null
  clickThroughRate: number | null
}

/** Fetch private per-video analytics for a list of video IDs. Batched in groups of 10. */
export async function fetchYoutubeAnalytics(
  accessToken: string,
  channelId: string,
  videoIds: string[]
): Promise<Map<string, VideoAnalytics>> {
  const result = new Map<string, VideoAnalytics>()
  const today = new Date().toISOString().slice(0, 10)
  const startDate = '2020-01-01' // covers entire library

  // Analytics API allows filtering by up to 10 video ids at once.
  for (let i = 0; i < videoIds.length; i += 10) {
    const batch = videoIds.slice(i, i + 10)
    const videoFilter = batch.map((id) => `video==${id}`).join(',')

    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate: today,
      metrics: 'averageViewDuration,averageViewPercentage,clickThroughRate',
      dimensions: 'video',
      filters: videoFilter,
      maxResults: '10',
    })

    const res = await fetch(`${ANALYTICS_BASE}/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      // 403 = insufficient scope / token expired; skip silently (worker will retry).
      continue
    }

    const parsed = reportSchema.safeParse(await res.json())
    if (!parsed.success) continue

    const { columnHeaders, rows } = parsed.data
    const idx = {
      video: columnHeaders.findIndex((h) => h.name === 'video'),
      avd: columnHeaders.findIndex((h) => h.name === 'averageViewDuration'),
      avp: columnHeaders.findIndex((h) => h.name === 'averageViewPercentage'),
      ctr: columnHeaders.findIndex((h) => h.name === 'clickThroughRate'),
    }

    for (const row of rows) {
      const videoId = String(row[idx.video])
      result.set(videoId, {
        videoId,
        avgWatchTimeSeconds: idx.avd >= 0 ? (row[idx.avd] ?? null) : null,
        completionRate: idx.avp >= 0 ? (row[idx.avp] ?? null) : null,
        clickThroughRate: idx.ctr >= 0 ? (row[idx.ctr] ?? null) : null,
      })
    }
  }

  return result
}
