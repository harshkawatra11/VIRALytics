import { handle, jsonError, jsonOk, requireUser } from '@/lib/api'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { id } = await params

    // RLS scopes both reads and the delete to the owner.
    const existing = await supabase
      .from('tracked_accounts')
      .select('id')
      .eq('id', id)
      .maybeSingle()
      .then((r) => r.data)
    if (!existing) return jsonError('Account not found', 404)

    const { error } = await supabase.from('tracked_accounts').delete().eq('id', id)
    if (error) return jsonError(error.message, 400)

    return jsonOk({ success: true })
  })
}
