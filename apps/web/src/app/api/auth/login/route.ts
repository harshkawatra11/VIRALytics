import { loginSchema } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { handle, jsonError, jsonOk, parseBody } from '@/lib/api'

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await parseBody(req, loginSchema)
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return jsonError('Invalid email or password', 401)

    return jsonOk({ success: true })
  })
}
