import 'server-only'
import { notFound } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'

export interface CollectionContext {
  id: string
  name: string
  color: string
  accountIds: string[]
  counts: { videos: number; accounts: number }
}

/** Load a collection (RLS-scoped), its member account ids, and tab counts. */
export async function getCollectionContext(
  supabase: SupabaseClient<Database>,
  collectionId: string
): Promise<CollectionContext> {
  const collection = await supabase
    .from('collections')
    .select('id, name, color')
    .eq('id', collectionId)
    .maybeSingle()
    .then((r) => r.data)
  if (!collection) notFound()

  const accountIds = await supabase
    .from('collection_accounts')
    .select('account_id')
    .eq('collection_id', collectionId)
    .then((r) => (r.data ?? []).map((x) => x.account_id))

  let videos = 0
  if (accountIds.length > 0) {
    videos = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('account_id', accountIds)
      .then((r) => r.count ?? 0)
  }

  return {
    ...collection,
    accountIds,
    counts: { videos, accounts: accountIds.length },
  }
}
