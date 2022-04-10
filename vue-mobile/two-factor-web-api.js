import { i18n } from 'src/boot/i18n'
import webApi from 'src/api/web-api'

export default {
  verifyAuthenticatorAppCode: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyAuthenticatorAppCode',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_CODE')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  verifyBackupCode: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyBackupCode',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_BACKUP_CODE')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  trustTheDevice: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'TrustDevice',
      parameters,
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },
}
