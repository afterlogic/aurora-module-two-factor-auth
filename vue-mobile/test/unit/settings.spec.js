import { beforeEach, describe, expect, it } from 'vitest'

import settings from '../../settings.js'

describe('TwoFactorAuth mobile settings', () => {
  beforeEach(() => {
    settings.init({})
  })

  it('parses the TwoFactorAuth appData section', () => {
    settings.init({
      TwoFactorAuth: {
        TrustDevicesForDays: 14,
        AllowAuthenticatorApp: true,
        MandatoryToConfigure: true,
        ShowRecommendationToConfigure: true,
        AuthenticatorAppEnabled: true,
      },
    })

    expect(settings.getSetting('trustDevicesForDays')).toBe(14)
    expect(settings.getSetting('allowAuthenticatorApp')).toBe(true)
    expect(settings.getSetting('mandatoryToConfigure')).toBe(true)
    expect(settings.getSetting('showRecommendationToConfigure')).toBe(true)
    expect(settings.getSetting('authenticatorAppEnabled')).toBe(true)
  })

  it('falls back to safe defaults when the section is missing', () => {
    settings.init({})

    expect(settings.getSetting('trustDevicesForDays')).toBe(0)
    expect(settings.getSetting('allowAuthenticatorApp')).toBe(false)
    expect(settings.getSetting('mandatoryToConfigure')).toBe(false)
    expect(settings.getSetting('authenticatorAppEnabled')).toBe(false)
  })

  it('treats a missing/null recommendation flag as "show" (matches desktop)', () => {
    settings.init({ TwoFactorAuth: {} })
    expect(settings.getSetting('showRecommendationToConfigure')).toBe(true)

    settings.init({ TwoFactorAuth: { ShowRecommendationToConfigure: null } })
    expect(settings.getSetting('showRecommendationToConfigure')).toBe(true)

    settings.init({ TwoFactorAuth: { ShowRecommendationToConfigure: false } })
    expect(settings.getSetting('showRecommendationToConfigure')).toBe(false)
  })

  it('never reports authenticatorAppEnabled when the app method is not allowed', () => {
    settings.init({
      TwoFactorAuth: {
        AllowAuthenticatorApp: false,
        AuthenticatorAppEnabled: true,
      },
    })

    expect(settings.getSetting('authenticatorAppEnabled')).toBe(false)
  })

  it('returns undefined for an unknown setting name', () => {
    expect(settings.getSetting('nope')).toBeUndefined()
  })

  it('setSetting overrides a value in place', () => {
    settings.init({ TwoFactorAuth: { AllowAuthenticatorApp: true } })
    expect(settings.getSetting('authenticatorAppEnabled')).toBe(false)

    settings.setSetting('authenticatorAppEnabled', true)
    expect(settings.getSetting('authenticatorAppEnabled')).toBe(true)
  })
})
