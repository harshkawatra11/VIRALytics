import { updateCollectionSchema } from '@viralytics/core'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { id } = await params
    const updates = await parseBody(req, updateCollectionSchema)

    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) return jsonError(error.message, 400)
    if (!data) return jsonError('Collection not found', 404)
    return jsonOk({ collection: data })
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { supabase } = await requireUser()
    const { id } = await params
    const existing = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .maybeSingle()
      .then((r) => r.data)
    if (!existing) return jsonError('Collection not found', 404)
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) return jsonError(error.message, 400)
    return jsonOk({ success: true })
  })
}
