<script>
import { mapState } from 'pinia'
import { Notify } from 'quasar'

import { i18n } from 'src/boot/i18n'
import { useCoreStore } from 'src/stores/index-pinia'

import settings from '../settings'
import twoFactorWebApi from '../two-factor-web-api'

// Soft-recommendation prompt for enabling the authenticator app, mirroring the
// desktop `Settings.js::checkIfEnabled` behaviour. Shown once per app load when
// `ShowRecommendationToConfigure` is on (and 2FA is not already enabled and not
// mandatory — mandatory has its own enforced setup dialog on login).
let shownThisSession = false

export default {
  name: 'TwoFactorRecommendation',

  render() {
    return null
  },

  computed: {
    ...mapState(useCoreStore, ['isUserNormalOrTenant']),
  },

  watch: {
    // This component is mounted once (globally) while still anonymous, so its
    // `mounted` hook runs before login. Re-check when the user signs in without
    // a full page reload.
    isUserNormalOrTenant(isAuthenticated) {
      if (isAuthenticated) {
        this.maybeRecommend()
      }
    },
  },

  mounted() {
    this.maybeRecommend()
  },

  methods: {
    shouldRecommend() {
      if (shownThisSession) {
        return false
      }
      return (
        this.isUserNormalOrTenant &&
        settings.getSetting('allowAuthenticatorApp') === true &&
        settings.getSetting('showRecommendationToConfigure') === true &&
        settings.getSetting('authenticatorAppEnabled') !== true &&
        settings.getSetting('mandatoryToConfigure') !== true
      )
    },

    maybeRecommend() {
      if (!this.shouldRecommend()) {
        return
      }
      shownThisSession = true

      Notify.create({
        message: i18n.global.tc('TWOFACTORAUTH.HINT_ABOUT_TWOFACTORAUTH'),
        color: 'primary',
        textColor: 'white',
        position: 'bottom',
        multiLine: true,
        // Auto-dismiss like the desktop recommendation panel; the user opts out
        // for good only via "No, thanks".
        timeout: 15000,
        attrs: { 'data-test-id': 'two-factor-recommendation' },
        actions: [
          {
            label: i18n.global.tc('TWOFACTORAUTH.ACTION_CONFIGURE'),
            color: 'white',
            'data-test-id': 'two-factor-recommendation-configure',
            handler: () => {
              this.$router.push('/settings/two-factor-auth')
            },
          },
          {
            label: i18n.global.tc('TWOFACTORAUTH.ACTION_REFUSE_CONFIGURE'),
            color: 'white',
            'data-test-id': 'two-factor-recommendation-dismiss',
            handler: () => {
              this.dismissForever()
            },
          },
        ],
      })
    },

    dismissForever() {
      settings.setSetting('showRecommendationToConfigure', false)
      twoFactorWebApi
        .updateSettings({ ShowRecommendationToConfigure: false })
        .catch(() => {})
    },
  },
}
</script>
