import { Redis } from '@upstash/redis'
import { cacheKeys } from '@viralytics/core'
import { env } from './config'

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

/** Invalidate every dashboard cache key affected by an account sync. */
export async function invalidateAccountCache(accountId: string, managerId: string): Promise<void> {
  await redis.del(
    cacheKeys.accountOverview(accountId),
    cacheKeys.accountPosts(accountId),
    cacheKeys.managerAccounts(managerId)
  )
}
