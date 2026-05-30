import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'
import { env } from './config'

/** Service-role client (bypasses RLS). The worker has no user session. */
export const db: SupabaseClient<Database> = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
