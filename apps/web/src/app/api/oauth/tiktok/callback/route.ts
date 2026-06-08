import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeTiktokCode } from '@/lib/oauth/tiktok'
import { storeTokens } from '@/lib/oauth/token-store'
import { enqueueSync } from '@/lib/queue'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=tiktok`)
  }

  try {
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('tt_pkce_verifier')?.value
    if (!codeVerifier) throw new Error('PKCE verifier missing — cookie expired or tampered')
    cookieStore.delete('tt_pkce_verifier')

    const { accountId } = JSON.parse(Buffer.from(state, 'base64url').toString()) as { accountId: string }
    const tokens = await exchangeTiktokCode(code, codeVerifier)

    await storeTokens({
      accountId,
      platform: 'tiktok',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      platformAccountId: tokens.open_id,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scopes: tokens.scope.split(','),
    })

    const { createServiceClient } = await import('@/lib/supabase/service')
    const svc = createServiceClient()
    const account = await svc
      .from('tracked_accounts')
      .select('manager_id, platform, handle, platform_id')
      .eq('id', accountId)
      .single()
      .then((r) => r.data)
    if (account) {
      await enqueueSync({
        accountId,
        managerId: account.manager_id,
        platform: account.platform,
        handle: account.handle,
        platformId: account.platform_id,
        jobType: 'manual',
      })
    }

    return NextResponse.redirect(`${appUrl}/accounts?oauth=success&platform=tiktok`)
  } catch {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=tiktok`)
  }
}
