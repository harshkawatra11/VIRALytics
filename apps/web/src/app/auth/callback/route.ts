import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles the email-confirmation / password-reset redirect. Supabase appends
 * a `code` to exchange for a session, then we forward the user onward.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, process.env.NEXT_PUBLIC_APP_URL))
  }

  return NextResponse.redirect(
    new URL('/login?error=Could not confirm your account', process.env.NEXT_PUBLIC_APP_URL)
  )
}
