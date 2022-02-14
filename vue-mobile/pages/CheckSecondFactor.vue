<template>
    <div class="full-width">
      <div class="text-center two-factor full-width">
        <p class="text-weight-medium two-factor__heading">
          {{ $t('TWOFACTORAUTH.HEADING_TWA_VERIFICATION') }}
        </p>
        <p class="q-mt-sm">
          {{ $t('TWOFACTORAUTH.INFO_TWA_VERIFICATION') }}
        </p>
        <div class="q-mt-lg">
          <method-choose v-if="isMethodChoosing" @chooseMethod="onChooseMethod" />
          <trust-device
            v-else-if="isTrustDeviceShow"
            v-model:trust-device="trustDevice"
            :trust-devices-for-days="trustDevicesForDays"
            :loading="loading"
            @continue="onContinue"
          />
          <verification-form
            v-else
            v-model:verification-code="verificationCode"
            v-model:backup-code="backupCode"
            :loading="loading"
            :disabled-verification="disabledVerification"
            :is-backup-codes-exist="isBackupCodesExist"
            :verification-option="verificationOption"
            @verifyCode="onVerifyCode"
            @changeMethod="onChangeMethod"
          />
        </div>
      </div>
    </div>
    <div class="q-pb-xl text-center">
      <a href="javascript:void(0)" @click.prevent="onBackToLogin">Back to login</a>
    </div>
</template>

<script>
import { mapActions } from 'vuex'
import VueCookies from 'vue-cookies'

import store from 'src/store'
import MethodChoose from '../components/MethodChoose'
import TrustDevice from '../components/TrustDevice'
import VerificationForm from '../components/VerificationForm'

import settings from '../settings'

export default {
  name: 'CheckSecondFactor',

  props: {
    login: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    loginResult: {
      type: Object,
      required: true
    },
  },

  emits: ["backToLogin"],

  components: {
    MethodChoose,
    TrustDevice,
    VerificationForm,
  },

  data: () => ({
    loading: false,
    trustDevice: false,
    isMethodChoosing: false,
    backupCode: '',
    verificationCode: '',
    verificationOption: 'verification', // 'verification', 'backup', 'key'
    authCode: '',
  }),

  computed: {
    disabledVerification() {
      return this.verificationOption === 'verification'
        ? !this.verificationCode
        : !this.backupCode
    },
    code() {
      return this.verificationOption === 'backup'
        ? this.backupCode
        : this.verificationCode
    },
    trustDevicesForDays() {
      return settings.getSetting('trustDevicesForDays')
    },
    allowTrustedDevices() {
      return this.trustDevicesForDays > 0
    },
    isBackupCodesExist() {
      return this.loginResult.TwoFactorAuth.HasBackupCodes ?? false
    },
    isTrustDeviceShow() {
      return this.authCode && this.allowTrustedDevices;
    }
  },

  methods: {
    ...mapActions('twofactorauth', [
      'confirmTwoFactorAuth',
      'trustTheDevice',
    ]),
    onBackToLogin () {
      this.$emit('backToLogin', )
    },

    async onVerifyCode() {
      this.loading = true
      try {
        const data = {
          Login: this.login,
          Password: this.password,
          Code: this.code,
        }
        const confirmedTwoFactor = await this.confirmTwoFactorAuth(data)
        this.authCode = confirmedTwoFactor
        if (confirmedTwoFactor && !this.allowTrustedDevices) {
          await store.dispatch('core/setAuthToken', this.authCode)
        }
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    onChangeMethod() {
      this.isMethodChoosing = !this.isMethodChoosing
    },

    async onContinue() {
      this.loading = true
      try {
        const uuid = VueCookies.get('DeviceId')
        const deviceName = window.navigator.userAgent
        const data = {
          Login: this.login,
          Password: this.password,
          DeviceId: uuid,
          DeviceName: deviceName,
          Trust: this.trustDevice,
        }
        const res = await this.trustTheDevice(data)

        if (res) await store.dispatch('core/setAuthToken', this.authCode)
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    onChooseMethod(method) {
      this.isMethodChoosing = false
      this.verificationOption = method
    },
  },
}
</script>

<style lang="scss" scoped>
.two-factor {
  padding-top: 6.25rem;

  &__heading {
    font-size: 1.125rem;
    line-height: 1.25rem;
  }
}
.page-body-login {
  padding-top: 9.25rem;
}
</style>
