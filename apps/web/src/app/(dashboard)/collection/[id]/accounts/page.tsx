import { createClient } from '@/lib/supabase/server'
import { getCollectionContext } from '@/lib/queries/collection'
import { getAccountStats } from '@/lib/queries/accounts'
import { AccountsStatsTable } from '@/components/accounts-stats-table'
import { ManageCollectionAccounts } from '@/components/manage-collection-accounts'

export default async function CollectionAccounts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const ctx = await getCollectionContext(supabase, id)

  const [stats, allAccounts] = await Promise.all([
    ctx.accountIds.length ? getAccountStats(supabase, ctx.accountIds) : Promise.resolve([]),
    supabase
      .from('tracked_accounts')
      .select('id, handle, display_name, platform')
      .order('display_name')
      .then((r) => r.data ?? []),
  ])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ManageCollectionAccounts
          collectionId={id}
          memberIds={ctx.accountIds}
          allAccounts={allAccounts}
        />
      </div>
      <AccountsStatsTable accounts={stats} />
    </div>
  )
}
