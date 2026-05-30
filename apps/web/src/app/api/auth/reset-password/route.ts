import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handle, jsonOk, parseBody } from '@/lib/api'

const schema = z.object({ email: z.string().trim().email() })

export async function POST(req: Request) {
  return handle(async () => {
    const { email } = await parseBody(req, schema)
    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/settings`,
    })
    // Always succeed to avoid leaking which emails are registered.
    return jsonOk({ success: true, message: 'If that email exists, a reset link is on its way.' })
  })
}
