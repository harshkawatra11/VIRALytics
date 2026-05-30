import 'server-only'
import { encrypt } from '@viralytics/core/crypto'
import { createServiceClient } from '@/lib/supabase/service'

interface StoreTokensOptions {
  accountId: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  accessToken: string
  refreshToken?: string | null
  platformAccountId?: string | null
  expiresAt?: Date | null
  scopes?: string[]
}

/**
 * Encrypt and persist OAuth tokens. Upserts on account_id so a reconnect
 * overwrites the old tokens rather than creating duplicates.
 */
export async function storeTokens(opts: StoreTokensOptions): Promise<void> {
  const key = process.env.ENCRYPTION_KEY!
  const svc = createServiceClient()

  const { error } = await svc
    .from('platform_tokens')
    .upsert(
      {
        account_id: opts.accountId,
        platform: opts.platform,
        encrypted_access_token: encrypt(opts.accessToken, key),
        encrypted_refresh_token: opts.refreshToken ? encrypt(opts.refreshToken, key) : null,
        platform_account_id: opts.platformAccountId ?? null,
        token_expires_at: opts.expiresAt?.toISOString() ?? null,
        scopes: opts.scopes ?? [],
        refresh_failure_count: 0,
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id' }
    )

  if (error) throw new Error(`Token store failed: ${error.message}`)

  // Mark the account as oauth-connected.
  await svc
    .from('tracked_accounts')
    .update({ connection_type: 'oauth' })
    .eq('id', opts.accountId)
}
