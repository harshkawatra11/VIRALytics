import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/api'
import { getYoutubeAuthUrl } from '@/lib/oauth/youtube'

/** GET /api/oauth/youtube/authorize?accountId=xxx — starts the YouTube OAuth flow. */
export async function GET(req: Request) {
  try {
    const { supabase } = await requireUser()
    const accountId = z.string().uuid().parse(new URL(req.url).searchParams.get('accountId'))

    // Verify the account belongs to the caller (RLS-scoped read).
    const account = await supabase
      .from('tracked_accounts')
      .select('id')
      .eq('id', accountId)
      .maybeSingle()
      .then((r) => r.data)
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const state = Buffer.from(JSON.stringify({ accountId })).toString('base64url')
    return NextResponse.redirect(getYoutubeAuthUrl(state))
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
