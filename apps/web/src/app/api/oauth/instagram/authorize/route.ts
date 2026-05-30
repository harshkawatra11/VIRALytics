import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/api'
import { getInstagramAuthUrl } from '@/lib/oauth/instagram'

export async function GET(req: Request) {
  try {
    const { supabase } = await requireUser()
    const accountId = z.string().uuid().parse(new URL(req.url).searchParams.get('accountId'))

    const account = await supabase
      .from('tracked_accounts')
      .select('id')
      .eq('id', accountId)
      .maybeSingle()
      .then((r) => r.data)
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const state = Buffer.from(JSON.stringify({ accountId })).toString('base64url')
    return NextResponse.redirect(getInstagramAuthUrl(state))
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
