import { Redis } from 'ioredis'
import { env } from './config'

/**
 * Shared ioredis connection for BullMQ. maxRetriesPerRequest must be null for
 * BullMQ's blocking commands.
 */
export const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})
