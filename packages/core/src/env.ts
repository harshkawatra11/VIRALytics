import { z } from 'zod'

/**
 * Server-side env validation. Call the relevant loader at process start so a
 * misconfigured deploy fails fast and loudly instead of at the first request.
 */

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex chars'),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

const workerSchema = serverSchema.extend({
  REDIS_URL: z.string().min(1),
  APIFY_API_TOKEN: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  YOUTUBE_CLIENT_ID: z.string().default(''),
  YOUTUBE_CLIENT_SECRET: z.string().default(''),
  META_APP_ID: z.string().default(''),
  META_APP_SECRET: z.string().default(''),
  TIKTOK_CLIENT_KEY: z.string().default(''),
  TIKTOK_CLIENT_SECRET: z.string().default(''),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type WorkerEnv = z.infer<typeof workerSchema>

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, source: NodeJS.ProcessEnv): z.infer<S> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  return result.data
}

export function loadServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  return parseOrThrow(serverSchema, source)
}

export function loadWorkerEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  return parseOrThrow(workerSchema, source)
}
