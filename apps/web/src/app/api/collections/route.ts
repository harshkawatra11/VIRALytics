import { createCollectionSchema } from '@viralytics/core'
import { handle, jsonError, jsonOk, parseBody, requireUser } from '@/lib/api'

export async function GET() {
  return handle(async () => {
    const { supabase } = await requireUser()
    const collections = await supabase
      .from('collections')
      .select('*')
      .order('name')
      .then((r) => r.data ?? [])
    return jsonOk({ collections })
  })
}

export async function POST(req: Request) {
  return handle(async () => {
    const { user, supabase } = await requireUser()
    const { name, color } = await parseBody(req, createCollectionSchema)

    const { data: collection, error } = await supabase
      .from('collections')
      .insert({ manager_id: user.id, name, color })
      .select('*')
      .single()
    if (error) return jsonError(error.message, 400)

    return jsonOk({ collection }, 201)
  })
}
