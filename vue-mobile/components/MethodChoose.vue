<template>
  <p class="q-mt-sm">
    {{ $t('TWOFACTORAUTH.INFO_OTHER_VERIFICATION_OPTIONS') }}
  </p>
  <AppButton
    :label="$t('TWOFACTORAUTH.ACTION_USE_AUTHENTICATOR_APP')"
    @click="$emit('chooseMethod', 'authenticator-app')"
    class="q-mt-lg"
  />
  <AppButton
    :label="$t('TWOFACTORAUTH.LABEL_ENTER_BACKUP_CODE')"
    @click="$emit('chooseMethod', 'backup-codes')"
    class="q-mt-md"
  />
</template>

<script>
import AppButton from 'src/components/common/AppButton'

export default {
  name: 'MethodChoose',

  components: {
    AppButton,
  },

  emits: ["chooseMethod"],
}
</script>

<style lang="scss" scoped>
</style>
