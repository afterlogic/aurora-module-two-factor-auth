<template>
  <p class="q-my-sm">
    {{ $t('TWOFACTORAUTH.LABEL_ALL_SET') }}
  </p>
  <AppCheckbox
    leftLabel
    :modelValue="trustDevice"
    @update:modelValue="$emit('update:trustDevice', $event)"
    :label="$t('TWOFACTORAUTH.LABEL_TRUST_DEVICE_PLURAL', {COUNT: trustDevicesForDays})"
  />
  <AppButton
    class="q-mt-lg"
    :label="$t('TWOFACTORAUTH.ACTION_CONTINUE')"
    :loading="loading"
    @click="$emit('continue')"
  />
</template>

<script>
import AppButton from 'src/components/common/AppButton'
import AppCheckbox from 'src/components/common/AppCheckbox'

export default {
  name: 'TrustDevice',

  components: {
    AppButton,
    AppCheckbox,
  },

  props: {
    trustDevice: Boolean,
    trustDevicesForDays: Number,
    loading: Boolean
  },

  emits: ["continue", 'update:trustDevice'],
}
</script>

<style lang="scss" scoped>
</style>
