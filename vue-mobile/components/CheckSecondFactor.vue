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
          <div v-if="isMethodChoosing">
            <p class="q-mt-sm">
              {{ $t('TWOFACTORAUTH.INFO_OTHER_VERIFICATION_OPTIONS') }}
            </p>
            <AppButton
              :label="$t('TWOFACTORAUTH.ACTION_USE_AUTHENTICATOR_APP')"
              @click="chooseMethod('verification')"
              class="q-mt-lg"
            />
            <AppButton
              :label="$t('TWOFACTORAUTH.LABEL_ENTER_BACKUP_CODE')"
              @click="chooseMethod('backup')"
              class="q-mt-md"
            />
          </div>
          <div v-else-if="allowTrustedDevices">
            <p class="q-mt-sm">You’re all set</p>
            <AppCheckbox
              v-model="trustDevice"
              leftLabel
              :label="`Don’t ask again on this device for ${trustDevicesForDays} days`"
            />
            <AppButton
              label="Continue"
              class="q-mt-lg"
              :loading="loading"
              @click="goHome"
            />
          </div>
          <div v-else>
            <p class="q-mt-sm">
              Specify verification code from the Authenticator app
            </p>
            <AppInput
              v-if="verificationOption === 'verification'"
              autofocus
              type="text"
              v-model="verificationCode"
              placeholder="Verification code"
            />
            <AppInput
              v-else
              autofocus
              type="text"
              v-model="backupCode"
              placeholder="Backup code"
            />
            <AppButton
              label="Verify"
              class="q-mt-lg q-mb-md"
              :loading="loading"
              @click="verifyCode"
              :disabled="disabledVerification"
            />
            <a
              href="javascript:void(0)"
              @click.prevent="isMethodChoosing = !isMethodChoosing"
            >
              {{ $t('TWOFACTORAUTH.ACTION_TRY_ANOTHER_WAY') }}
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="q-pb-xl text-center">
      <a href="javascript:void(0)" @click.prevent="backToLogin">Back to login</a>
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import VueCookies from 'vue-cookies'

import AppInput from 'src/components/common/AppInput'
import AppButton from 'src/components/common/AppButton'
import AppCheckbox from 'src/components/common/AppCheckbox'

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

  components: {
    AppCheckbox,
    AppInput,
    AppButton,
  },

  data: () => ({
    loading: false,
    trustDevice: false,
    isMethodChoosing: false,
    backupCode: '',
    verificationCode: '',
    verificationOption: 'verification', // 'verification', 'backup', 'key'
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
  },

  mounted() {
    console.log('loginResult', this.loginResult.TwoFactorAuth)
  },

  methods: {
    ...mapActions('user', [
      'confirmTwoFactorAuth',
      'trustTheDevice',
    ]),
    backToLogin () {},

    async verifyCode() {
      this.loading = true
      try {
        const data = {
          Login: this.login,
          Password: this.password,
          Code: this.code,
        }
        await this.confirmTwoFactorAuth(data)
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async goHome() {
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
        await this.trustTheDevice(data)
        await this.$router.push('/mail')
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    chooseMethod(method) {
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
