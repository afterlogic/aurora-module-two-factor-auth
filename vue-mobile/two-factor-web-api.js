import webApi from 'src/api/web-api'

export default {
  confirmTwoFactorAuth: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyAuthenticatorAppCode',
      parameters,
    }).then((result) => {
      return result
    })
  },

  trustTheDevice: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'TrustDevice',
      parameters,
    }).then((result) => {
      return result
    })
  },

  getUsedDevices: async (parameters) => {
    return webApi.sendRequest({
      moduleName: 'TwoFactorAuth',
      methodName: 'GetUsedDevices',
      parameters,
    }).then((result) => {
      return result
    })
  },
}
