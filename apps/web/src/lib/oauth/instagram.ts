import 'server-only'

const IG_AUTH_URL = 'https://www.facebook.com/v20.0/dialog/oauth'
const IG_TOKEN_URL = 'https://graph.facebook.com/v20.0/oauth/access_token'
const IG_LONG_LIVED_URL = 'https://graph.facebook.com/v20.0/oauth/access_token'
const IG_REFRESH_URL = 'https://graph.facebook.com/v20.0/oauth/access_token'
const IG_GRAPH = 'https://graph.facebook.com/v20.0'

/**
 * Scopes required for Instagram Business Graph API analytics.
 * instagram_manage_insights requires Meta App Review (2-week lead time).
 * Pages scopes are required for IG Business Account discovery.
 */
const SCOPES = [
  'instagram_basic',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
].join(',')

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`,
    scope: SCOPES,
    response_type: 'code',
    state,
  })
  return `${IG_AUTH_URL}?${params}`
}

export interface IgTokens {
  access_token: string
  /** Long-lived tokens expire in 60 days. No separate refresh_token for IG. */
  expires_in_days: number
  platform_account_id: string | null
}

export async function exchangeInstagramCode(code: string): Promise<IgTokens> {
  // Step 1: short-lived user token.
  const shortRes = await fetch(IG_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!shortRes.ok) throw new Error(`IG short-lived exchange failed: ${await shortRes.text()}`)
  const { access_token: shortToken } = await shortRes.json() as { access_token: string }

  // Step 2: exchange for a long-lived token (60 days).
  const longRes = await fetch(
    `${IG_LONG_LIVED_URL}?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: shortToken,
    })}`
  )
  if (!longRes.ok) throw new Error(`IG long-lived exchange failed: ${await longRes.text()}`)
  const { access_token, expires_in } = await longRes.json() as { access_token: string; expires_in: number }

  // Step 3: discover the Instagram Business Account ID for this user.
  const pagesRes = await fetch(
    `${IG_GRAPH}/me/accounts?fields=id,instagram_business_account&access_token=${access_token}`
  )
  let platformAccountId: string | null = null
  if (pagesRes.ok) {
    const pages = await pagesRes.json() as { data?: { instagram_business_account?: { id: string } }[] }
    platformAccountId = pages.data?.[0]?.instagram_business_account?.id ?? null
  }

  return { access_token, expires_in_days: Math.floor(expires_in / 86_400), platform_account_id: platformAccountId }
}

/**
 * Refresh a long-lived Instagram token. Must be called before it expires (60d).
 * Expired tokens CANNOT be refreshed — they are permanently unrecoverable.
 */
export async function refreshInstagramToken(token: string): Promise<string> {
  const res = await fetch(
    `${IG_REFRESH_URL}?${new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    })}`
  )
  if (!res.ok) throw new Error(`IG token refresh failed: ${await res.text()}`)
  const { access_token } = await res.json() as { access_token: string }
  return access_token
}
