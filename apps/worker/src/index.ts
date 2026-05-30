import { Worker } from 'bullmq'
import { createServer } from 'node:http'
import { connection } from './redis'
import { logger } from './logger'
import { CONCURRENCY, MOCK_MODE } from './config'
import { QUEUE_NAMES } from './queues'
import { processSync } from './processor'
import { startSweeper } from './scheduler'
import { startTokenRefresher } from './token-refresh'

logger.info({ mock: MOCK_MODE }, 'VIRALytics worker starting')

const workers = [
  new Worker(QUEUE_NAMES.youtube, processSync, { connection, concurrency: CONCURRENCY.youtube }),
  new Worker(QUEUE_NAMES.instagram, processSync, {
    connection,
    concurrency: CONCURRENCY.instagram,
  }),
  new Worker(QUEUE_NAMES.tiktok, processSync, { connection, concurrency: CONCURRENCY.tiktok }),
  new Worker(QUEUE_NAMES.backfill, processSync, { connection, concurrency: CONCURRENCY.backfill }),
]

for (const w of workers) {
  w.on('failed', (job, err) =>
    logger.warn({ jobId: job?.id, err: err.message }, 'job failed (will retry per backoff)')
  )
}

const sweeper = startSweeper()
const tokenRefresher = startTokenRefresher()

// Minimal health endpoint so Railway can health-check the worker.
const port = Number(process.env.PORT ?? 8080)
createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ ok: true, workers: workers.length }))
}).listen(port, () => logger.info({ port }, 'health server listening'))

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down')
  clearInterval(sweeper)
  clearInterval(tokenRefresher)
  await Promise.all(workers.map((w) => w.close()))
  await connection.quit()
  process.exit(0)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
