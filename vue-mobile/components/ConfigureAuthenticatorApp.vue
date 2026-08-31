<template>
  <div class="full-width" data-test-id="two-factor-configure">
    <p class="q-mt-sm">
      {{ $t('TWOFACTORAUTH.HINT_MOBILE_AUTHENTICATOR_APP_USE') }}
    </p>

    <div v-if="qrLoading" class="text-center q-my-md">
      <q-spinner size="2rem" color="primary" />
    </div>

    <div v-else-if="qrCodeUrl" class="text-center q-mt-md">
      <img
        :src="qrCodeUrl"
        :alt="$t('TWOFACTORAUTH.LABEL_QR_CODE')"
        class="two-factor-configure__qr"
        data-test-id="two-factor-configure-qr"
      />
    </div>

    <div v-if="secret" class="q-mt-md">
      <div class="text-secondary">{{ $t('TWOFACTORAUTH.LABEL_SECRET_KEY') }}</div>
      <div
        class="two-factor-configure__secret text-weight-medium"
        data-test-id="two-factor-configure-secret"
        @click="copySecret"
      >
        {{ secret }}
      </div>
    </div>

    <p class="q-mt-md">
      {{ $t('TWOFACTORAUTH.HINT_ENTER_CODE') }}
    </p>

    <AppInput
      autofocus
      type="text"
      inputmode="numeric"
      data-test-id="two-factor-configure-code"
      :placeholder="$t('TWOFACTORAUTH.LABEL_VERIFICATION_CODE')"
      :modelValue="code"
      @update:modelValue="code = $event"
      @input="code = $event.target.value"
      @keyup.enter="onSave"
    />

    <AppButton
      class="q-mt-md"
      data-test-id="two-factor-configure-submit"
      :label="$t('TWOFACTORAUTH.ACTION_VERIFY')"
      :loading="loading"
      :disabled="!canSave"
      @click="onSave"
    />
  </div>
</template>

<script>
import notification from 'src/utils/notification'
import { i18n } from 'src/boot/i18n'

import AppButton from 'src/components/common/AppButton'
import AppInput from 'src/components/common/AppInput'

import twoFactorWebApi from '../two-factor-web-api'
import QRCode from '../vendors/qr'

export default {
  name: 'ConfigureAuthenticatorApp',

  components: {
    AppButton,
    AppInput,
  },

  props: {
    userToken: {
      type: String,
      required: true,
    },
    needReloginAfterSetup: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['configured'],

  data: () => ({
    loading: false,
    qrLoading: true,
    secret: '',
    qrCodeUrl: '',
    code: '',
  }),

  computed: {
    canSave() {
      return !!this.secret && !!this.code
    },
  },

  mounted() {
    this.begin()
  },

  methods: {
    async begin() {
      this.qrLoading = true
      try {
        const response = await twoFactorWebApi.registerAuthenticatorAppBegin({
          UserToken: this.userToken,
        })
        if (response && response.Secret && response.QRCodeName) {
          this.secret = response.Secret
          this.qrCodeUrl = this.generateQrCode(response.QRCodeName, response.Secret)
        }
      } catch (err) {
        console.error(err)
      } finally {
        this.qrLoading = false
      }
    },

    generateQrCode(qrCodeName, secret) {
      const data = `otpauth://totp/${qrCodeName}?secret=${secret}`
      try {
        return QRCode.generatePNG(data, { margin: 0, modulesize: 6 })
      } catch (err) {
        console.error(err)
        return ''
      }
    },

    async onSave() {
      if (!this.canSave) {
        return
      }
      this.loading = true
      try {
        const response = await twoFactorWebApi.registerAuthenticatorAppFinish({
          UserToken: this.userToken,
          Code: this.code,
          Secret: this.secret,
          NeedReloginAfterSetup: this.needReloginAfterSetup,
        })
        if (response) {
          this.$emit('configured', response)
        } else {
          notification.showError(i18n.global.tc('TWOFACTORAUTH.ERROR_WRONG_CODE'))
        }
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    copySecret() {
      if (this.secret && navigator?.clipboard) {
        navigator.clipboard.writeText(this.secret).catch(() => {})
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.two-factor-configure__qr {
  width: 10rem;
  height: 10rem;
  image-rendering: pixelated;
}
.two-factor-configure__secret {
  word-break: break-all;
  font-family: monospace;
  font-size: 1rem;
  cursor: pointer;
}
</style>
