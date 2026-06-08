import 'server-only'
import crypto from 'node:crypto'

const TT_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TT_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'

/**
 * Scopes for TikTok Login Kit v2.
 * - user.info.basic: display name, avatar, follower count (no review needed)
 * - video.list: view_count, like_count, comment_count, share_count (no review)
 */
const SCOPES = 'user.info.basic,video.list'

/** Generate a PKCE pair. TikTok v2 mandates PKCE (S256). */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(48).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function getTiktokAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: SCOPES,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${TT_AUTH_URL}?${params}`
}

export interface TiktokTokens {
  access_token: string
  refresh_token: string
  expires_in: number          // seconds, typically 86400 (24h)
  refresh_expires_in: number  // seconds, typically 31536000 (365d)
  open_id: string             // TikTok user ID (used as platform_account_id)
  scope: string
}

export async function exchangeTiktokCode(code: string, codeVerifier: string): Promise<TiktokTokens> {
  const res = await fetch(TT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`)
  const body = await res.json() as { data?: TiktokTokens; error?: { code: string; message: string } }
  if (body.error?.code && body.error.code !== 'ok') {
    throw new Error(`TikTok token exchange error: ${body.error.message}`)
  }
  return body.data!
}

export async function refreshTiktokToken(refreshToken: string): Promise<TiktokTokens> {
  const res = await fetch(TT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`TikTok refresh failed: ${await res.text()}`)
  const body = await res.json() as { data?: TiktokTokens; error?: { code: string; message: string } }
  if (body.error?.code && body.error.code !== 'ok') {
    throw new Error(`TikTok refresh error: ${body.error.message}`)
  }
  return body.data!
}
