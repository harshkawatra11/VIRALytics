import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'
import { overviewSchema, type Overview } from './overview'

export type { Overview }

export async function getAccountOverview(
  supabase: SupabaseClient<Database>,
  accountId: string
): Promise<Overview> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('account_overview', {
    p_account_id: accountId,
  })
  if (error) throw new Error(error.message)
  return overviewSchema.parse(data ?? {})
}
