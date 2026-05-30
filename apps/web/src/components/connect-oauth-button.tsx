'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { Platform } from '@viralytics/core'
import { Button } from '@/components/ui/button'

const PLATFORM_DISPLAY: Partial<Record<Platform, string>> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
}

/**
 * "Connect for deep analytics" upgrade button. Redirects to the platform's OAuth
 * authorize URL and exchanges the code for encrypted tokens server-side.
 * Only shown for platforms that support OAuth private metrics (YT + IG).
 */
export function ConnectOAuthButton({
  accountId,
  platform,
  connected = false,
}: {
  accountId: string
  platform: Platform
  connected?: boolean
}) {
  const [loading, setLoading] = useState(false)

  // TikTok doesn't expose private metrics via OAuth — honest non-render.
  if (platform === 'tiktok') return null

  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
        <Zap size={12} /> Deep analytics on
      </span>
    )
  }

  function connect() {
    setLoading(true)
    // Navigate to the authorize route (server-side redirect to platform OAuth).
    window.location.href = `/api/oauth/${platform}/authorize?accountId=${accountId}`
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={connect}
      title={`Connect ${PLATFORM_DISPLAY[platform]} to unlock watch time & completion rate`}
    >
      <Zap size={13} />
      Connect {PLATFORM_DISPLAY[platform]}
    </Button>
  )
}
