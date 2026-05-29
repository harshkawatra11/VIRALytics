import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, safeEqual } from '../crypto'
import {
  engagementRate,
  formatCompact,
  formatPercent,
  formatRelativeDate,
} from '../format'
import { classifyViralScore, computeViralScore, viralScoreLabel } from '../viral-score'
import { HandleParseError, parseAccountInput } from '../platforms/parse'

const KEY = randomBytes(32).toString('hex')

describe('crypto (AES-256-GCM)', () => {
  it('round-trips a token', () => {
    const secret = 'ya29.a0AfH6SMexample-refresh-token'
    expect(decrypt(encrypt(secret, KEY), KEY)).toBe(secret)
  })

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encrypt('same', KEY)).not.toBe(encrypt('same', KEY))
  })

  it('rejects a tampered payload (auth tag)', () => {
    const enc = encrypt('secret', KEY)
    const bytes = Buffer.from(enc, 'base64')
    const last = bytes.length - 1
    bytes[last] = (bytes[last] ?? 0) ^ 0xff
    expect(() => decrypt(bytes.toString('base64'), KEY)).toThrow()
  })

  it('rejects a wrong-length key', () => {
    expect(() => encrypt('x', 'deadbeef')).toThrow(/64 hex chars|32 bytes/)
  })

  it('safeEqual compares correctly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})

describe('formatCompact', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1K'],
    [1234, '1.2K'],
    [4_500_000, '4.5M'],
    [5_000_000, '5M'],
    [2_400_000_000, '2.4B'],
  ])('formats %i -> %s', (input, expected) => {
    expect(formatCompact(input)).toBe(expected)
  })

  it('handles null/undefined', () => {
    expect(formatCompact(null)).toBe('—')
    expect(formatCompact(undefined)).toBe('—')
  })
})

describe('engagementRate & formatPercent', () => {
  it('computes (likes+comments+shares)/followers*100', () => {
    expect(engagementRate(100, 50, 50, 10_000)).toBeCloseTo(2)
  })
  it('guards divide-by-zero', () => {
    expect(engagementRate(100, 0, 0, 0)).toBe(0)
  })
  it('formats percent', () => {
    expect(formatPercent(6.6)).toBe('6.6%')
  })
})

describe('formatRelativeDate', () => {
  const now = new Date('2026-05-29T12:00:00Z')
  it('yesterday', () => {
    expect(formatRelativeDate(new Date('2026-05-28T12:00:00Z'), now)).toBe('Yesterday')
  })
  it('n days ago within a week', () => {
    expect(formatRelativeDate(new Date('2026-05-26T12:00:00Z'), now)).toBe('3 days ago')
  })
  it('falls back to dd/mm/yyyy past a week', () => {
    expect(formatRelativeDate(new Date('2026-01-10T12:00:00Z'), now)).toBe('10/01/2026')
  })
})

describe('viral score', () => {
  it('computes ratio', () => {
    expect(computeViralScore(157_000, 10_000)).toBeCloseTo(15.7)
  })
  it('returns 0 when no average yet', () => {
    expect(computeViralScore(1000, 0)).toBe(0)
  })
  it('classifies tiers', () => {
    expect(classifyViralScore(15.7)).toBe('hot')
    expect(classifyViralScore(1.1)).toBe('normal')
    expect(classifyViralScore(0.3)).toBe('cold')
  })
  it('labels like Shortimize', () => {
    expect(viralScoreLabel(15.7)).toBe('15.7x more than usual')
    expect(viralScoreLabel(0.3)).toBe('Less views than usual')
  })
})

describe('parseAccountInput', () => {
  it('parses youtube @handle url', () => {
    expect(parseAccountInput('https://youtube.com/@MrBeast')).toEqual({
      platform: 'youtube',
      handle: 'MrBeast',
      isChannelId: undefined,
    })
  })
  it('parses youtube channel id', () => {
    expect(parseAccountInput('https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA')).toEqual({
      platform: 'youtube',
      handle: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
      isChannelId: true,
    })
  })
  it('parses instagram url and ignores /p/ reserved paths', () => {
    expect(parseAccountInput('https://www.instagram.com/cristiano/')).toEqual({
      platform: 'instagram',
      handle: 'cristiano',
    })
    expect(() => parseAccountInput('https://www.instagram.com/p/')).toThrow(HandleParseError)
  })
  it('parses tiktok url', () => {
    expect(parseAccountInput('https://www.tiktok.com/@khaby.lame')).toEqual({
      platform: 'tiktok',
      handle: 'khaby.lame',
    })
  })
  it('uses platform hint for bare handles', () => {
    expect(parseAccountInput('@cristiano', 'instagram')).toEqual({
      platform: 'instagram',
      handle: 'cristiano',
    })
  })
  it('throws when platform cannot be determined', () => {
    expect(() => parseAccountInput('@somehandle')).toThrow(HandleParseError)
  })
})
