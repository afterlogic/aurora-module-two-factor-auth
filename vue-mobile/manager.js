import _ from 'lodash'
import { defineAsyncComponent, markRaw } from 'vue'

import eventBus from 'src/event-bus'

import { i18n } from '../../CoreMobileWebclient/vue-mobile/src/boot/i18n'

import settings from './settings'

const LOGIN_MODULE_NAMES = [
  'StandardLoginFormMobileWebclient',
  'MailLoginFormMobileWebclient',
]

const SETTINGS_PATH = '/settings/two-factor-auth'

const _getProcessLoginResultComponent = params => {
  params.getProcessLoginResultComponent = () => import('./pages/CheckSecondFactor')
}

const _isAuthenticatorAppAllowed = () => settings.getSetting('allowAuthenticatorApp') === true

const _getSettingsTabs = params => {
  if (!_isAuthenticatorAppAllowed()) {
    return
  }
  if (!_.isArray(params.settingsTabs)) {
    params.settingsTabs = []
  }
  params.settingsTabs = params.settingsTabs.concat([
    {
      routerPath: SETTINGS_PATH,
      tabNameLangConst: 'TWOFACTORAUTH.LABEL_SETTINGS_TAB',
      getIconComponent: () => import('./components/icons/TwoFactorAuthIcon'),
    },
  ])
}

const _getSettingsPageChildren = params => {
  if (!_isAuthenticatorAppAllowed()) {
    return
  }
  if (!_.isArray(params.settingsPageChildren)) {
    params.settingsPageChildren = []
  }
  params.settingsPageChildren = params.settingsPageChildren.concat([
    {
      path: SETTINGS_PATH,
      component: () => import('./pages/TwoFactorAuthSettings'),
    },
  ])
}

const _getSettingsHeaderTitles = params => {
  if (!_isAuthenticatorAppAllowed()) {
    return
  }
  if (!_.isArray(params.settingsHeaderTitles)) {
    params.settingsHeaderTitles = []
  }
  params.settingsHeaderTitles = params.settingsHeaderTitles.concat([
    {
      settingsPath: SETTINGS_PATH,
      settingsTitle: i18n.global.t('TWOFACTORAUTH.HEADING_SETTINGS_TAB'),
    },
  ])
}

// Always-mounted, render-less helper that shows the soft 2FA recommendation
// prompt when the module setting asks for it.
const _setComponents = components => {
  if (!_.isArray(components) || components.some(component => component.name === 'TwoFactorRecommendation')) {
    return
  }
  components.push({
    name: 'TwoFactorRecommendation',
    component: markRaw(defineAsyncComponent(() => import('./components/TwoFactorRecommendation'))),
  })
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

    eventBus.$off('SettingsMobileWebclient::GetSettingsTabs', _getSettingsTabs)
    eventBus.$on('SettingsMobileWebclient::GetSettingsTabs', _getSettingsTabs)

    eventBus.$off('SettingsMobileWebclient::GetSettingsPageChildren', _getSettingsPageChildren)
    eventBus.$on('SettingsMobileWebclient::GetSettingsPageChildren', _getSettingsPageChildren)

    eventBus.$off('SettingsMobileWebclient::GetSettingsHeaderTitles', _getSettingsHeaderTitles)
    eventBus.$on('SettingsMobileWebclient::GetSettingsHeaderTitles', _getSettingsHeaderTitles)

    eventBus.$off('CoreMobileWebclient::CheckComponents', _setComponents)
    eventBus.$on('CoreMobileWebclient::CheckComponents', _setComponents)
    eventBus.$emit('CoreMobileWebclient::InitSubscription')
  },
}
