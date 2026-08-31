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

  getSettings: async () => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'GetSettings',
      parameters: {},
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  updateSettings: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'UpdateSettings',
      parameters,
      silentError: true,
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  verifyPassword: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyPassword',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_PASSWORD')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  registerAuthenticatorAppBegin: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'RegisterAuthenticatorAppBegin',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_SECRET_GENERATION_FAILED')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  registerAuthenticatorAppFinish: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'RegisterAuthenticatorAppFinish',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_CODE')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },

  disableAuthenticatorApp: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'DisableAuthenticatorApp',
      parameters,
      defaultErrorText: i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_PASSWORD')
    })
      .then(result => result)
      .catch(error => {
        throw error
      })
  },
}
