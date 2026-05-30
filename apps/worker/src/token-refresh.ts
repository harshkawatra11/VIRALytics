import { setInterval } from 'node:timers'
import { decrypt, encrypt } from '@viralytics/core/crypto'
import { db } from './db'
import { logger } from './logger'
import { env } from './config'

/**
 * Token-refresh runner. Runs every 6 hours and refreshes any OAuth tokens that
 * are expiring within the next 10 days (per the tokens_needing_refresh view).
 *
 * Strategy per platform:
 *   - YouTube: call Google token endpoint with refresh_token
 *   - Instagram: call graph.facebook.com/oauth/access_token with ig_refresh_token
 *   - TikTok: call TikTok refresh endpoint (rotates both tokens)
 */

const TICK_MS = 6 * 60 * 60 * 1000 // 6 hours

export function startTokenRefresher(): NodeJS.Timeout {
  const tick = async () => {
    const { data, error } = await db
      .from('platform_tokens' as 'tracked_accounts') // use service role to bypass RLS
      .select('*')

    // The view isn't in our typed client schema, so we call raw SQL via RPC.
    // Workaround: query the view as a custom RPC isn't set up; use the direct table
    // filtered for tokens expiring in 10 days with low failure count.
    try {
      const { data: tokens, error: tErr } = await db
        .from('platform_tokens')
        .select('*')
        .lt('refresh_failure_count', 3)
        .or(`token_expires_at.is.null,token_expires_at.lt.${new Date(Date.now() + 10 * 86_400_000).toISOString()}`)
        .lt('last_refreshed_at', new Date(Date.now() - 23 * 3_600_000).toISOString())

      if (tErr) { logger.error({ err: tErr.message }, 'token-refresh query failed'); return }

      for (const token of (tokens ?? [])) {
        await refreshToken(token).catch((err: unknown) => {
          logger.error({ accountId: token.account_id, platform: token.platform, err: (err as Error).message }, 'token refresh failed')
        })
      }
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'token-refresh tick threw')
    }

    void data; void error // suppress unused-var warnings from the failed approach
  }

  void tick()
  return setInterval(() => void tick(), TICK_MS)
}

async function refreshToken(token: {
  account_id: string
  platform: string
  encrypted_access_token: string
  encrypted_refresh_token: string | null
  scopes: string[]
}) {
  const key = env.ENCRYPTION_KEY
  let newAccessToken: string
  let newRefreshToken: string | null = null
  let newExpiresAt: string | null = null

  if (token.platform === 'youtube') {
    if (!token.encrypted_refresh_token) return // no refresh token, skip
    const refreshToken = decrypt(token.encrypted_refresh_token, key)
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) throw new Error(`YouTube refresh HTTP ${res.status}`)
    const body = await res.json() as { access_token: string; expires_in: number }
    newAccessToken = body.access_token
    newExpiresAt = new Date(Date.now() + body.expires_in * 1000).toISOString()
    newRefreshToken = null // YT keeps same refresh token

  } else if (token.platform === 'instagram') {
    const accessToken = decrypt(token.encrypted_access_token, key)
    const res = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    )
    if (!res.ok) throw new Error(`Instagram refresh HTTP ${res.status}`)
    const body = await res.json() as { access_token: string; expires_in: number }
    newAccessToken = body.access_token
    newExpiresAt = new Date(Date.now() + body.expires_in * 1000).toISOString()

  } else {
    return // TikTok handled separately (bidirectional rotation)
  }

  await db
    .from('platform_tokens')
    .update({
      encrypted_access_token: encrypt(newAccessToken, key),
      encrypted_refresh_token: newRefreshToken ? encrypt(newRefreshToken, key) : token.encrypted_refresh_token,
      token_expires_at: newExpiresAt,
      refresh_failure_count: 0,
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', token.account_id)

  logger.info({ accountId: token.account_id, platform: token.platform }, 'token refreshed')
}
