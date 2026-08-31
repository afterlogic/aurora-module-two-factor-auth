<template>
  <div class="q-pa-lg" data-test-id="settings-two-factor-auth">
    <div v-if="loadingSettings" class="text-center q-my-lg">
      <q-spinner size="2rem" color="primary" />
    </div>

    <div v-else-if="!allowAuthenticatorApp" />

    <template v-else-if="view === 'configure'">
      <ConfigureAuthenticatorApp
        :user-token="userToken"
        :need-relogin-after-setup="false"
        @configured="onConfigured"
      />
    </template>

    <template v-else-if="view === 'password'">
      <p class="q-mt-sm">{{ $t('TWOFACTORAUTH.HINT_ABOUT_CONFIRMATION') }}</p>
      <AppInput
        autofocus
        type="password"
        data-test-id="settings-two-factor-auth-password"
        :placeholder="$t('COREWEBCLIENT.LABEL_PASSWORD')"
        :modelValue="password"
        @update:modelValue="password = $event"
        @input="password = $event.target.value"
        @keyup.enter="onPasswordConfirmed"
      />
      <AppButton
        class="q-mt-lg"
        data-test-id="settings-two-factor-auth-password-submit"
        :label="$t('TWOFACTORAUTH.ACTION_VERIFY_PASSWORD')"
        :loading="loading"
        :disabled="!password"
        @click="onPasswordConfirmed"
      />
    </template>

    <template v-else>
      <p class="text-secondary">
        {{ authenticatorAppEnabled
          ? $t('TWOFACTORAUTH.HINT_ABOUT_TWOFACTORAUTH_ENABLED')
          : $t('TWOFACTORAUTH.HINT_ABOUT_TWOFACTORAUTH') }}
      </p>
      <AppButton
        class="q-mt-lg"
        data-test-id="settings-two-factor-auth-configure"
        :label="$t('TWOFACTORAUTH.ACTION_CONFIGURE')"
        :loading="loading"
        @click="onConfigureClick"
      />
      <AppButton
        v-if="authenticatorAppEnabled && !mandatoryToConfigure"
        class="q-mt-md"
        data-test-id="settings-two-factor-auth-disable"
        :label="$t('TWOFACTORAUTH.ACTION_DISABLE')"
        :loading="loading"
        @click="onDisableClick"
      />
    </template>
  </div>
</template>

<script>
import notification from 'src/utils/notification'
import { i18n } from 'src/boot/i18n'

import AppButton from 'src/components/common/AppButton'
import AppInput from 'src/components/common/AppInput'

import settings from '../settings'
import twoFactorWebApi from '../two-factor-web-api'
import ConfigureAuthenticatorApp from '../components/ConfigureAuthenticatorApp'

export default {
  name: 'TwoFactorAuthSettings',

  components: {
    AppButton,
    AppInput,
    ConfigureAuthenticatorApp,
  },

  data: () => ({
    loadingSettings: true,
    loading: false,
    allowAuthenticatorApp: false,
    authenticatorAppEnabled: false,
    mandatoryToConfigure: false,
    view: 'overview', // 'overview' | 'password' | 'configure'
    intent: '', // 'configure' | 'disable'
    password: '',
    userToken: '',
  }),

  mounted() {
    this.loadSettings()
  },

  methods: {
    async loadSettings() {
      this.loadingSettings = true
      try {
        const response = await twoFactorWebApi.getSettings()
        this.allowAuthenticatorApp = response?.AllowAuthenticatorApp === true
        this.authenticatorAppEnabled = this.allowAuthenticatorApp && response?.AuthenticatorAppEnabled === true
        this.mandatoryToConfigure = response?.MandatoryToConfigure === true
        settings.setSetting('authenticatorAppEnabled', this.authenticatorAppEnabled)
      } catch (err) {
        console.error(err)
      } finally {
        this.loadingSettings = false
      }
    },

    resetToOverview() {
      this.view = 'overview'
      this.intent = ''
      this.password = ''
      this.userToken = ''
    },

    onConfigureClick() {
      this.intent = 'configure'
      this.password = ''
      this.view = 'password'
    },

    onDisableClick() {
      this.intent = 'disable'
      this.password = ''
      this.view = 'password'
    },

    async onPasswordConfirmed() {
      if (!this.password) {
        return
      }
      // Two-factor auth cannot be turned off while it is mandatory.
      if (this.intent === 'disable' && this.mandatoryToConfigure) {
        this.resetToOverview()
        return
      }
      this.loading = true
      try {
        if (this.intent === 'disable') {
          const result = await twoFactorWebApi.disableAuthenticatorApp({ Password: this.password })
          if (result) {
            this.authenticatorAppEnabled = false
            settings.setSetting('authenticatorAppEnabled', false)
            notification.showReport(i18n.global.tc('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
            this.resetToOverview()
          }
        } else {
          const result = await twoFactorWebApi.verifyPassword({ Password: this.password })
          if (result && result.UserToken) {
            this.userToken = result.UserToken
            this.password = ''
            this.view = 'configure'
          } else {
            notification.showError(i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_PASSWORD'))
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    onConfigured() {
      this.authenticatorAppEnabled = true
      settings.setSetting('authenticatorAppEnabled', true)
      notification.showReport(i18n.global.tc('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
      this.resetToOverview()
    },
  },
}
</script>
