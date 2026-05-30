import { NextResponse } from 'next/server'
import { exchangeYoutubeCode } from '@/lib/oauth/youtube'
import { storeTokens } from '@/lib/oauth/token-store'
import { enqueueSync } from '@/lib/queue'

/**
 * YouTube OAuth callback. Exchanges the code for tokens, stores them encrypted,
 * and triggers an immediate sync to populate private Analytics metrics.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=youtube`)
  }

  try {
    const { accountId } = JSON.parse(Buffer.from(state, 'base64url').toString()) as { accountId: string }
    const tokens = await exchangeYoutubeCode(code)

    await storeTokens({
      accountId,
      platform: 'youtube',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scopes: tokens.scope.split(' '),
    })

    // Queue an immediate sync so private metrics appear without waiting.
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

    return NextResponse.redirect(`${appUrl}/accounts?oauth=success&platform=youtube`)
  } catch {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=youtube`)
  }
}
