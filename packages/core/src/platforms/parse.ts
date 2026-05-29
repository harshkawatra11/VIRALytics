import type { Platform } from '../constants'

export interface ParsedHandle {
  platform: Platform
  /** Clean handle without leading @, or a channel ID for youtube /channel/ URLs. */
  handle: string
  /** True when `handle` is a YouTube channel ID (UC...) rather than an @handle. */
  isChannelId?: boolean
}

export class HandleParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HandleParseError'
  }
}

const YOUTUBE_PATTERNS: Array<{ re: RegExp; isChannelId?: boolean }> = [
  { re: /youtube\.com\/channel\/(UC[\w-]+)/i, isChannelId: true },
  { re: /youtube\.com\/@([A-Za-z0-9_.-]+)/i },
  { re: /youtube\.com\/c\/([A-Za-z0-9_.-]+)/i },
  { re: /youtube\.com\/user\/([A-Za-z0-9_.-]+)/i },
]

const INSTAGRAM_RESERVED = new Set(['p', 'reel', 'reels', 'tv', 'stories', 'explore'])

export function parseYoutube(input: string): ParsedHandle {
  const trimmed = input.trim()
  for (const { re, isChannelId } of YOUTUBE_PATTERNS) {
    const m = trimmed.match(re)
    if (m?.[1]) return { platform: 'youtube', handle: m[1], isChannelId }
  }
  // Bare @handle or handle
  const bare = trimmed.match(/^@?([A-Za-z0-9_.-]+)$/)
  if (bare?.[1]) return { platform: 'youtube', handle: bare[1] }
  throw new HandleParseError(`Could not parse a YouTube channel from "${input}"`)
}

export function parseInstagram(input: string): ParsedHandle {
  const trimmed = input.trim()
  const url = trimmed.match(/instagram\.com\/([A-Za-z0-9_.]+)/i)
  if (url?.[1] && !INSTAGRAM_RESERVED.has(url[1].toLowerCase())) {
    return { platform: 'instagram', handle: url[1] }
  }
  const bare = trimmed.match(/^@?([A-Za-z0-9_.]+)$/)
  if (bare?.[1]) return { platform: 'instagram', handle: bare[1] }
  throw new HandleParseError(`Could not parse an Instagram handle from "${input}"`)
}

export function parseTiktok(input: string): ParsedHandle {
  const trimmed = input.trim()
  const url = trimmed.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/i)
  if (url?.[1]) return { platform: 'tiktok', handle: url[1] }
  const bare = trimmed.match(/^@?([A-Za-z0-9_.]+)$/)
  if (bare?.[1]) return { platform: 'tiktok', handle: bare[1] }
  throw new HandleParseError(`Could not parse a TikTok handle from "${input}"`)
}

/** Detect platform from a URL, falling back to the provided hint for bare handles. */
export function detectPlatform(input: string): Platform | null {
  const s = input.toLowerCase()
  if (s.includes('youtube.com') || s.includes('youtu.be')) return 'youtube'
  if (s.includes('instagram.com')) return 'instagram'
  if (s.includes('tiktok.com')) return 'tiktok'
  return null
}

/**
 * Parse any supported URL or @handle. When the input is a bare handle (no
 * domain), `platformHint` is required to disambiguate.
 */
export function parseAccountInput(input: string, platformHint?: Platform): ParsedHandle {
  const detected = detectPlatform(input)
  const platform = detected ?? platformHint
  if (!platform) {
    throw new HandleParseError(
      'Could not determine platform from input — paste a full profile URL or pick a platform'
    )
  }
  switch (platform) {
    case 'youtube':
      return parseYoutube(input)
    case 'instagram':
      return parseInstagram(input)
    case 'tiktok':
      return parseTiktok(input)
  }
}
