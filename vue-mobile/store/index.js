import twoFactorWebApi from '../two-factor-web-api'

export default {
  namespaced: true,

  state: { },

  mutations: { },

  actions: {
    confirmTwoFactorAuth: async ({ commit }, payload) => {
      const response = await twoFactorWebApi.confirmTwoFactorAuth(payload)

      return response?.AllowAccess && response?.AuthToken
    },

    trustTheDevice: ({ commit }, payload) => {
      return twoFactorWebApi.trustTheDevice(payload)
    },

    getUsedDevices: async ({ commit }, payload) => {
      return await twoFactorWebApi.getUsedDevices(payload)
    },
  },

  getters: { },
}
