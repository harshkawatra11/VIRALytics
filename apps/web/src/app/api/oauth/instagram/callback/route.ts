import { NextResponse } from 'next/server'
import { exchangeInstagramCode } from '@/lib/oauth/instagram'
import { storeTokens } from '@/lib/oauth/token-store'
import { enqueueSync } from '@/lib/queue'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=instagram`)
  }

  try {
    const { accountId } = JSON.parse(Buffer.from(state, 'base64url').toString()) as { accountId: string }
    const tokens = await exchangeInstagramCode(code)

    await storeTokens({
      accountId,
      platform: 'instagram',
      accessToken: tokens.access_token,
      refreshToken: null, // Instagram has no separate refresh token
      platformAccountId: tokens.platform_account_id,
      // Long-lived token expires in 60 days; refresh at <10 days remaining.
      expiresAt: new Date(Date.now() + tokens.expires_in_days * 86_400_000),
      scopes: ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement'],
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

    return NextResponse.redirect(`${appUrl}/accounts?oauth=success&platform=instagram`)
  } catch {
    return NextResponse.redirect(`${appUrl}/accounts?oauth=error&platform=instagram`)
  }
}
