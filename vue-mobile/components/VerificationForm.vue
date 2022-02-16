<template>
  <p class="q-mt-sm">
    {{ $t('TWOFACTORAUTH.INFO_AUTHENTICATOR_APP_VERIFICATION') }}
  </p>
  <AppInput
    v-if="verificationOption === 'authenticator-app'"
    autofocus
    type="text"
    placeholder="Verification code"
    :modelValue="verificationCode"
    @update:modelValue="$emit('update:verificationCode', $event)"
    @input="$emit('update:verificationCode', $event.target.value)"
    @keyup.enter="$emit('verifyCode')"
  />
  <AppInput
    v-else
    autofocus
    type="text"
    :placeholder="$t('TWOFACTORAUTH.LABEL_BACKUP_CODE')"
    :modelValue="backupCode"
    @update:modelValue="$emit('update:backupCode', $event)"
    @input="$emit('update:backupCode', $event.target.value)"
    @keyup.enter="$emit('verifyCode')"
  />
  <AppButton
    class="q-mt-lg q-mb-md"
    :label="$t('TWOFACTORAUTH.ACTION_VERIFY')"
    :loading="loading"
    :disabled="disabledVerification"
    @click="$emit('verifyCode')"
  />
  <a
    v-if="isBackupCodesExist"
    href="javascript:void(0)"
    @click.prevent="$emit('changeMethod')"
  >
    {{ $t('TWOFACTORAUTH.ACTION_TRY_ANOTHER_WAY') }}
  </a>
</template>

<script>
import AppButton from 'src/components/common/AppButton'
import AppInput from 'src/components/common/AppInput'

export default {
  name: 'VerificationForm',

  components: {
    AppButton,
    AppInput,
  },

  props: {
    verificationOption: String,
    verificationCode: String,
    backupCode: String,
    loading: Boolean,
    disabledVerification: Boolean,
    isBackupCodesExist: Boolean
  },

  emits: ["verifyCode", "changeMethod", 'update:verificationCode', 'update:backupCode'],
}
</script>

<style lang="scss" scoped>
</style>
