import { signupSchema } from '@viralytics/core'
import { createClient } from '@/lib/supabase/server'
import { handle, jsonError, jsonOk, parseBody } from '@/lib/api'

export async function POST(req: Request) {
  return handle(async () => {
    const { fullName, email, password } = await parseBody(req, signupSchema)
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) return jsonError(error.message, 400)
    // The managers row is created by the on_auth_user_created DB trigger.
    return jsonOk({ success: true, message: 'Check your email to confirm your account.' })
  })
}
