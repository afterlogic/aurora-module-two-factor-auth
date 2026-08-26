import eventBus from 'src/event-bus'

import settings from './settings'

const LOGIN_MODULE_NAMES = [
  'StandardLoginFormMobileWebclient',
  'MailLoginFormMobileWebclient',
]

const _getProcessLoginResultComponent = params => {
  params.getProcessLoginResultComponent = () => import('./pages/CheckSecondFactor')
}

export default {
  moduleName: 'TwoFactorAuth',

  requiredModules: [],

  init (appdata) {
    settings.init(appdata)
  },

  initSubscriptions (appData) {
    LOGIN_MODULE_NAMES.forEach((moduleName) => {
      const eventName = `${moduleName}::GetProcessLoginResultComponent`
      eventBus.$off(eventName, _getProcessLoginResultComponent)
      eventBus.$on(eventName, _getProcessLoginResultComponent)
    })
  },
}
