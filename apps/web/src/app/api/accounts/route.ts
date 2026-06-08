import { addAccountSchema, parseAccountInput, HandleParseError } from '@viralytics/core'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'
import { addAccountLimiter } from '@/lib/ratelimit'
import { enqueueSync, enqueueBackfill } from '@/lib/queue'

export async function GET() {
  return handle(async () => {
    const { supabase } = await requireUser()
    const accounts = await supabase
      .from('tracked_accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .then((r) => r.data ?? [])
    return jsonOk({ accounts })
  })
}

export async function POST(req: Request) {
  return handle(async () => {
    const { user, supabase } = await requireUser()
    const { input, platform, attestation } = await parseBody(req, addAccountSchema)
    void attestation // schema enforces it is true; recorded as user consent

    const { success } = await addAccountLimiter().limit(user.id)
    if (!success) return jsonError('Too many accounts added recently — try again later', 429)

    // Parse the URL/handle into a clean platform + handle.
    let parsed
    try {
      parsed = parseAccountInput(input, platform)
    } catch (err) {
      if (err instanceof HandleParseError) return jsonError(err.message, 400)
      throw err
    }

    // Enforce the plan's account limit.
    const [{ count }, manager] = await Promise.all([
      supabase
        .from('tracked_accounts')
        .select('*', { count: 'exact', head: true })
        .then((r) => ({ count: r.count ?? 0 })),
      supabase
        .from('managers')
        .select('account_limit')
        .eq('id', user.id)
        .single()
        .then((r) => r.data),
    ])
    if (manager && count >= manager.account_limit) {
      return jsonError(
        `Plan limit reached (${manager.account_limit} accounts). Upgrade to track more.`,
        403
      )
    }

    // Insert (RLS double-checks manager ownership via the insert policy).
    const { data: account, error } = await supabase
      .from('tracked_accounts')
      .insert({
        manager_id: user.id,
        platform: parsed.platform,
        connection_type: 'public',
        handle: parsed.handle,
        platform_id: parsed.isChannelId ? parsed.handle : null,
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') return jsonError('You are already tracking this account', 409)
      return jsonError(error.message, 400)
    }

    // Kick off the initial scrape immediately. Roll back the insert if queue fails.
    try {
      await enqueueSync({
        accountId: account.id,
        managerId: user.id,
        platform: account.platform,
        handle: account.handle,
        platformId: account.platform_id,
        jobType: 'initial',
      })
    } catch (err) {
      await supabase.from('tracked_accounts').delete().eq('id', account.id)
      throw err
    }

    // Also queue a full historical backfill (low priority) so every post is
    // captured, not just the recent batch. Best-effort — a failure here must not
    // fail the add, since the initial sync already succeeded.
    try {
      await enqueueBackfill({
        accountId: account.id,
        managerId: user.id,
        platform: account.platform,
        handle: account.handle,
        platformId: account.platform_id,
      })
    } catch {
      // swallow — backfill can be retried later via the refresh/backfill endpoints
    }

    return jsonOk({ account }, 201)
  })
}
