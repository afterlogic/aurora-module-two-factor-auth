import types from 'src/utils/types'

class TwoFactorAuthSettings {
  constructor (appData) {
    const twoFactorAuthData = types.pObject(appData.TwoFactorAuth)
    this.trustDevicesForDays = types.pInt(twoFactorAuthData.TrustDevicesForDays)
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
}
