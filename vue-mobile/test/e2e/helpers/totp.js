/**
 * Minimal RFC 6238 TOTP generator for E2E tests.
 *
 * `RegisterAuthenticatorAppBegin` returns the shared secret in plaintext, so a
 * test can derive the same 6-digit code an authenticator app would show and
 * complete 2FA setup without a human. No external dependency — Node `crypto`
 * only. Verified against the RFC 6238 Appendix B test vectors in
 * test/unit/totp.spec.js.
 */
const crypto = require('crypto')

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Decode an RFC 4648 base32 string (case-insensitive, padding/spaces ignored). */
function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
  let bits = 0
  let value = 0
  const bytes = []

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`)
    }
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >>> bits) & 0xff)
    }
  }

  return Buffer.from(bytes)
}

/**
 * @param {string} secret Base32-encoded shared secret.
 * @param {{ timestamp?: number, period?: number, digits?: number, algorithm?: string }} [options]
 *   timestamp is in milliseconds (defaults to Date.now()).
 * @returns {string} Zero-padded one-time code.
 */
function generateTotp(secret, options = {}) {
  const { timestamp = Date.now(), period = 30, digits = 6, algorithm = 'sha1' } = options

  const counter = Math.floor(timestamp / 1000 / period)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))

  const hmac = crypto.createHmac(algorithm, base32Decode(secret)).update(counterBuffer).digest()

  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(binary % 10 ** digits).padStart(digits, '0')
}

module.exports = { generateTotp, base32Decode }
