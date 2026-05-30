import { describe, expect, it } from 'vitest'
import { extractHashtags, parseIsoDuration } from '../scrapers/types'

describe('parseIsoDuration', () => {
  it.each([
    ['PT15S', 15],
    ['PT1M30S', 90],
    ['PT1H2M3S', 3723],
    ['PT0S', 0],
  ])('parses %s -> %i', (iso, secs) => {
    expect(parseIsoDuration(iso)).toBe(secs)
  })
  it('returns null for undefined', () => {
    expect(parseIsoDuration(undefined)).toBeNull()
  })
})

describe('extractHashtags', () => {
  it('extracts unique lowercase tags', () => {
    expect(extractHashtags('Never give up #CR7 #football #CR7')).toEqual(['cr7', 'football'])
  })
  it('handles none', () => {
    expect(extractHashtags('no tags here')).toEqual([])
    expect(extractHashtags(null)).toEqual([])
  })
})
