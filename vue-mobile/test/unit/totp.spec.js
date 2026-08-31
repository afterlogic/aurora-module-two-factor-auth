import { describe, expect, it } from 'vitest'

import { generateTotp, base32Decode } from '../e2e/helpers/totp.js'

// RFC 6238 Appendix B test seed: ASCII "12345678901234567890", base32-encoded.
const RFC6238_SHA1_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

describe('base32Decode', () => {
  it('decodes RFC 4648 vectors', () => {
    expect(base32Decode('MY======').toString()).toBe('f')
    expect(base32Decode('MZXW6').toString()).toBe('foo')
    expect(base32Decode('MZXW6YTBOI======').toString()).toBe('foobar')
  })

  it('is case-insensitive and ignores whitespace', () => {
    expect(base32Decode('mzxw6ytb oi======').toString()).toBe('foobar')
  })

  it('throws on an invalid character', () => {
    expect(() => base32Decode('MZXW0')).toThrow()
  })
})

describe('generateTotp', () => {
  // RFC 6238 Appendix B, SHA1 column, truncated to the default 6 digits.
  const vectors = [
    { seconds: 59, code: '287082' },
    { seconds: 1111111109, code: '081804' },
    { seconds: 1111111111, code: '050471' },
    { seconds: 1234567890, code: '005924' },
    { seconds: 2000000000, code: '279037' },
    { seconds: 20000000000, code: '353130' },
  ]

  for (const { seconds, code } of vectors) {
    it(`matches the RFC 6238 vector at t=${seconds}s`, () => {
      expect(generateTotp(RFC6238_SHA1_SECRET, { timestamp: seconds * 1000 })).toBe(code)
    })
  }

  it('honours the digits option', () => {
    expect(generateTotp(RFC6238_SHA1_SECRET, { timestamp: 59000, digits: 8 })).toBe('94287082')
  })

  it('is stable within a 30s window and changes across it', () => {
    // Aligned to a 30s step boundary so +29s stays in-window and +31s rolls over.
    const base = 56_666_666 * 30 * 1000
    expect(generateTotp(RFC6238_SHA1_SECRET, { timestamp: base })).toBe(
      generateTotp(RFC6238_SHA1_SECRET, { timestamp: base + 29_000 })
    )
    expect(generateTotp(RFC6238_SHA1_SECRET, { timestamp: base })).not.toBe(
      generateTotp(RFC6238_SHA1_SECRET, { timestamp: base + 31_000 })
    )
  })
})
