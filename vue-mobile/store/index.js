import store from 'src/store'

import twoFactorWebApi from '../two-factor-web-api'

export default {
  namespaced: true,

  state: { },

  mutations: { },

  actions: {
    confirmTwoFactorAuth: async ({ commit }, payload) => {
      const response = await twoFactorWebApi.confirmTwoFactorAuth(payload)
      if (response?.AuthToken) {
        store.dispatch('core/setAuthToken', result.AuthToken)
      }
    },

    trustTheDevice: async ({ commit }, payload) => {
      const response = await twoFactorWebApi.trustTheDevice(payload)
    },

    getUsedDevices: async ({ commit }, payload) => {
      return await twoFactorWebApi.getUsedDevices(payload)
    },
  },

  getters: { },
}
