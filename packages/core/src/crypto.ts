import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

/**
 * AES-256-GCM authenticated encryption for OAuth tokens at rest.
 *
 * Storage format (base64): [12-byte IV][16-byte auth tag][ciphertext].
 * A fresh random IV is generated per operation (never reused), and GCM's auth
 * tag detects tampering on decrypt. The 32-byte key lives only in env vars
 * (ENCRYPTION_KEY, 64 hex chars) — never in the database.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_BYTES = 32

function loadKey(keyHex: string): Buffer {
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex chars); got ${key.length} bytes`
    )
  }
  return key
}

export function encrypt(plaintext: string, keyHex: string): string {
  const key = loadKey(keyHex)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

export function decrypt(payloadB64: string, keyHex: string): string {
  const key = loadKey(keyHex)
  const payload = Buffer.from(payloadB64, 'base64')
  if (payload.length < IV_BYTES + TAG_BYTES) {
    throw new Error('Ciphertext payload is too short to be valid')
  }
  const iv = payload.subarray(0, IV_BYTES)
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/** Constant-time string comparison (e.g. for webhook secrets). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
