import { createClient } from '@/lib/supabase/server'
import { handle, jsonOk } from '@/lib/api'

export async function POST() {
  return handle(async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return jsonOk({ success: true })
  })
}
