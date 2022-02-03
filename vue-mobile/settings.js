import typesUtils from 'src/utils/types'

class TwoFactorAuthSettings {
  constructor (appData) {
    const twoFactorAuthData = typesUtils.pObject(appData.TwoFactorAuth)
    console.log('twoFactorAuthData', twoFactorAuthData)
    this.trustDevicesForDays = typesUtils.pInt(twoFactorAuthData.TrustDevicesForDays)
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
