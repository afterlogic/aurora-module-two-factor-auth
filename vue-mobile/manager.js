import eventBus from 'src/event-bus'

import settings from './settings'

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
    eventBus.$off('StandardLoginFormMobileWebclient::GetProcessLoginResultComponent', _getProcessLoginResultComponent)
    eventBus.$on('StandardLoginFormMobileWebclient::GetProcessLoginResultComponent', _getProcessLoginResultComponent)
  },
}
