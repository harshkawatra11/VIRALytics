'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { Platform } from '@viralytics/core'
import { Button } from '@/components/ui/button'

const PLATFORM_DISPLAY: Partial<Record<Platform, string>> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

const PLATFORM_BENEFIT: Partial<Record<Platform, string>> = {
  youtube: 'unlock watch time, completion rate & CTR',
  instagram: 'unlock real-time metrics, saves & reach',
  tiktok: 'unlock real-time views, likes & shares',
}

/**
 * "Connect for deep analytics" upgrade button.
 * Redirects to the platform's OAuth authorize route which handles PKCE (TikTok),
 * token exchange, encryption, and queuing an immediate re-sync.
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

  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
        <Zap size={12} /> Deep analytics on
      </span>
    )
  }

  function connect() {
    setLoading(true)
    window.location.href = `/api/oauth/${platform}/authorize?accountId=${accountId}`
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={connect}
      title={`Connect ${PLATFORM_DISPLAY[platform]} to ${PLATFORM_BENEFIT[platform]}`}
    >
      <Zap size={13} />
      Connect {PLATFORM_DISPLAY[platform]}
    </Button>
  )
}
