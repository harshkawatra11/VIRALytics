import { videosQuerySchema, formatCompact } from '@viralytics/core'
import { requireUser } from '@/lib/api'
import { getVideos } from '@/lib/queries/videos'

const HEADERS = [
  'Platform',
  'Account',
  'Caption',
  'Posted At',
  'Views',
  'Likes',
  'Comments',
  'Shares',
  'Saves',
  'Engagement Rate (%)',
  'Viral Score',
  'Avg Watch Time (s)',
  'Completion Rate (%)',
  'Permalink',
]

function escape(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

/** GET /api/analytics/export?[videosQueryParams] — streams a CSV of the current filter. */
export async function GET(req: Request) {
  try {
    const { user, supabase } = await requireUser()
    void user
    const sp = Object.fromEntries(new URL(req.url).searchParams.entries())
    const q = videosQuerySchema.parse({ ...sp, pageSize: 2000, page: 1 })

    const { rows } = await getVideos(supabase, q)

    const lines = [
      HEADERS.join(','),
      ...rows.map((r) =>
        [
          r.platform,
          r.account_display_name ?? r.account_handle ?? '',
          (r.caption ?? '').replaceAll('\n', ' '),
          r.posted_at ?? '',
          r.current_views,
          r.current_likes,
          r.current_comments,
          r.current_shares,
          r.current_saves ?? '',
          r.current_engagement_rate.toFixed(2),
          r.viral_score.toFixed(2),
          '', // avg_watch_time — from post_metrics detail, not in list
          '', // completion_rate — same
          r.permalink ?? '',
        ]
          .map(escape)
          .join(',')
      ),
    ]

    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="viralytics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
}

// suppress unused import warning
void formatCompact
