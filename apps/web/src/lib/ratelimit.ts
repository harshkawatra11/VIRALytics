import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Lazy limiters — constructed on first use so a missing env var fails at request
 * time (handled gracefully) rather than at build/module-load time.
 */
let _refresh: Ratelimit | undefined
let _add: Ratelimit | undefined

function redis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

/** Manual-refresh limiter: 1 request per 30 minutes per key (account). */
export function refreshLimiter(): Ratelimit {
  _refresh ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.fixedWindow(1, '1800 s'),
    prefix: 'rl:refresh',
  })
  return _refresh
}

/** Add-account limiter: guard against abuse (20 / hour per manager). */
export function addAccountLimiter(): Ratelimit {
  _add ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.fixedWindow(20, '3600 s'),
    prefix: 'rl:add',
  })
  return _add
}
