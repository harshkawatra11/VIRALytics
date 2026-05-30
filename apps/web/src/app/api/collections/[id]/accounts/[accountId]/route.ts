import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'

/** Remove an account from a collection (does not delete the account). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { id, accountId } = await params
    const { error } = await supabase
      .from('collection_accounts')
      .delete()
      .eq('collection_id', id)
      .eq('account_id', accountId)
    if (error) return jsonError(error.message, 400)
    return jsonOk({ success: true })
  })
}
