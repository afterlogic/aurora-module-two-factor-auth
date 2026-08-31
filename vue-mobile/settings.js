import types from 'src/utils/types'

class TwoFactorAuthSettings {
  constructor (appData) {
    const twoFactorAuthData = types.pObject(appData.TwoFactorAuth)
    this.trustDevicesForDays = types.pInt(twoFactorAuthData.TrustDevicesForDays)
    this.allowAuthenticatorApp = types.pBool(twoFactorAuthData.AllowAuthenticatorApp)
    this.mandatoryToConfigure = types.pBool(twoFactorAuthData.MandatoryToConfigure)
    // Backend sends `false` only when the module setting is off or the user
    // dismissed it; `null`/absent (module on, not dismissed) means "show it" —
    // same collapse the desktop `Settings.js` does.
    this.showRecommendationToConfigure = types.pBool(twoFactorAuthData.ShowRecommendationToConfigure, true)
    this.authenticatorAppEnabled = this.allowAuthenticatorApp && types.pBool(twoFactorAuthData.AuthenticatorAppEnabled)
  }
}

let settings = null

export default {
  init (appData) {
    settings = new TwoFactorAuthSettings(appData)
  },

  getSetting (settingName) {
    return settings ? settings[settingName] : null
  },

  setSetting (settingName, value) {
    if (settings) {
      settings[settingName] = value
    }
  },
}
