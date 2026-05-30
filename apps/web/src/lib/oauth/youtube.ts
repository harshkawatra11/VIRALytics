import 'server-only'

const YT_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const YT_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/** Scopes needed for both public channel data and private Analytics metrics. */
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ')

export function getYoutubeAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/youtube/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',   // mandatory for refresh_token
    prompt: 'consent',        // mandatory — without this Google may not return refresh_token
    state,
  })
  return `${YT_AUTH_URL}?${params}`
}

export interface YtTokens {
  access_token: string
  refresh_token: string | null
  expires_in: number
  scope: string
}

export async function exchangeYoutubeCode(code: string): Promise<YtTokens> {
  const res = await fetch(YT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/youtube/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`YouTube token exchange failed: ${await res.text()}`)
  return res.json() as Promise<YtTokens>
}

export async function refreshYoutubeToken(refreshToken: string): Promise<YtTokens> {
  const res = await fetch(YT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`YouTube refresh failed: ${await res.text()}`)
  return res.json() as Promise<YtTokens>
}
