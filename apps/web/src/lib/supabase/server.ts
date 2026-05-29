import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@viralytics/core'

/**
 * Supabase client bound to the request's auth cookies (RLS-enforced).
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component (read-only cookies) — middleware
            // refreshes the session, so this can be safely ignored here.
          }
        },
      },
    }
  )
}
