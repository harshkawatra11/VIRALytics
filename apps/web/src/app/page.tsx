import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Phase 9 replaces this with a marketing landing page. For now, route by auth.
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}
