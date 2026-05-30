import { z } from 'zod'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'

const assignSchema = z.object({ accountIds: z.array(z.string().uuid()).min(1).max(500) })

/** Assign accounts to a collection (collections group accounts). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { id } = await params
    const { accountIds } = await parseBody(req, assignSchema)

    // Verify the collection belongs to the caller (RLS-scoped read).
    const collection = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .maybeSingle()
      .then((r) => r.data)
    if (!collection) return jsonError('Collection not found', 404)

    // RLS insert policy also verifies account ownership per row.
    const rows = accountIds.map((accountId) => ({ collection_id: id, account_id: accountId }))
    const { error } = await supabase
      .from('collection_accounts')
      .upsert(rows, { onConflict: 'collection_id,account_id', ignoreDuplicates: true })
    if (error) return jsonError(error.message, 400)

    return jsonOk({ success: true, added: accountIds.length })
  })
}
