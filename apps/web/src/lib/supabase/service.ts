import 'server-only'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'

/**
 * Service-role client that BYPASSES RLS. Use only in server-only code AFTER you
 * have independently verified the caller owns the resource (e.g. reading
 * post_metrics for a chart, or touching platform_tokens). Never expose to the
 * client and never call with unvalidated user input.
 */
export function createServiceClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
