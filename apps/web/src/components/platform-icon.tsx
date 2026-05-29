import { Youtube, Instagram, Music2 } from 'lucide-react'
import type { Platform } from '@viralytics/core'
import { cn } from '@/lib/utils'

const ICON = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music2, // lucide has no TikTok glyph; Music2 reads as short-form video
} as const

const COLOR = {
  youtube: 'text-[var(--color-youtube)]',
  instagram: 'text-[var(--color-instagram)]',
  tiktok: 'text-[var(--color-tiktok)]',
} as const

const LABEL = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
} as const

export function PlatformIcon({
  platform,
  className,
  size = 16,
}: {
  platform: Platform
  className?: string
  size?: number
}) {
  const Icon = ICON[platform]
  return (
    <Icon
      aria-label={LABEL[platform]}
      className={cn(COLOR[platform], className)}
      width={size}
      height={size}
    />
  )
}

export { LABEL as PLATFORM_LABELS }
