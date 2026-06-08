'use client'

import { useEffect } from 'react'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/**
 * Client-driven sync controller.
 * - Fires immediately on mount (app open / tab restore).
 * - Re-fires every 2 hours while the tab is open.
 * - Stops entirely when the tab is closed — no background sweeper needed.
 *
 * The server route deduplicates within a 110-minute window, so rapid re-opens
 * (e.g. page refresh) don't spam the queue.
 */
export function SyncOnOpen() {
  useEffect(() => {
    const trigger = () =>
      fetch('/api/sync/open', { method: 'POST', keepalive: true }).catch(() => {})

    trigger()
    const interval = setInterval(trigger, TWO_HOURS_MS)
    return () => clearInterval(interval)
  }, [])

  return null
}
