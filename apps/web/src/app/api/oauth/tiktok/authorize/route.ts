import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/api'
import { getTiktokAuthUrl, generatePkce } from '@/lib/oauth/tiktok'

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

    const { verifier, challenge } = generatePkce()
    const state = Buffer.from(JSON.stringify({ accountId })).toString('base64url')

    // Store verifier in a short-lived cookie — retrieved in the callback.
    const cookieStore = await cookies()
    cookieStore.set('tt_pkce_verifier', verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes — enough for the OAuth round-trip
      path: '/',
    })

    return NextResponse.redirect(getTiktokAuthUrl(state, challenge))
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
