import 'server-only'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

/**
 * Shared API-route plumbing enforcing the mandatory order:
 *   1. getUser()  -> 401 if no session
 *   2. validate   -> 400 if body invalid
 *   3. ownership   (per-route, using the returned client)
 *   4. logic / 5. respond
 */

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

/** Step 1 — server-validated session. Throws ApiError(401) when absent. */
export async function requireUser(): Promise<{
  user: User
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, 'Not authenticated')
  return { user, supabase }
}

/** Step 2 — parse + validate a JSON body against a Zod schema. Throws ApiError(400). */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S
): Promise<z.infer<S>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError(400, 'Invalid JSON body')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0]?.message ?? 'Invalid request')
  }
  return result.data
}

/** Wrap a handler so thrown ApiErrors become clean JSON responses. */
export function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((err) => {
    if (err instanceof ApiError) return jsonError(err.message, err.status)
    console.error('[api] unhandled error', err)
    return jsonError('Internal server error', 500)
  })
}
