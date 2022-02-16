import { i18n } from 'src/boot/i18n'
import webApi from 'src/api/web-api'

export default {
  verifyAuthenticatorAppCode: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyAuthenticatorAppCode',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_CODE')
    }).then((result) => {
      return result
    }).catch(e => {
      throw new Error(e.Method ?? e)
    })
  },

  verifyBackupCode: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyBackupCode',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_BACKUP_CODE')
    }).then((result) => {
      return result
    }).catch(e => {
      throw new Error(e.Method ?? e)
    })
  },

  trustTheDevice: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'TrustDevice',
      parameters,
    }).then((result) => {
      return result
    }).catch(e => {
      throw new Error(e.Method ?? e)
    })
  },
}
