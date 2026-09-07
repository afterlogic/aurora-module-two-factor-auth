const path = require('path')
const { sharedHelper } = require(path.join(process.env.AURORA_E2E_ROOT, 'helpers/paths'))
const { test, expect } = require('@playwright/test')
const { T } = sharedHelper('timeouts')
const {
  step,
  attachScreenshot,
  fieldControl,
  armAppDataResponse,
  waitForTurnstileToken,
  logoutToLoginForm,
  hasCredentials,
  getTestCredentials,
} = sharedHelper('login')
const { clickReady } = sharedHelper('ready')
const { sel, initVariant } = sharedHelper('app-variant')
const {
  enableAuthenticatorAppViaApi,
  enableAuthenticatorAppFromUserToken,
  armLoginResponse,
  disableAuthenticatorAppViaApi,
} = require('./helpers/two-factor')
const { generateTotp } = require('./helpers/totp')

// Regression coverage for: logging in with a correct Authenticator App code
// was rejected as "wrong code" even though the backend accepted it — the
// client compared the verify response to a literal `true` while the backend
// returns { AuthToken } on success. Covers both desktop (Knockout) and next
// (Vue) — same data-test-id markup, see VerifySecondFactorPopup.
//
// Setup (getting the account into "Authenticator App enabled" state) has two
// paths depending on the stand's TwoFactorAuth::MandatoryToConfigure setting:
//   - off: log in normally, then enable via the Settings API
//     (VerifyPassword → RegisterAuthenticatorAppBegin/Finish).
//   - on: the very first login cannot complete without configuring 2FA —
//     the backend hands back a UserToken instead of a session; use that
//     token with RegisterAuthenticatorAppBegin/Finish(needReloginAfterSetup)
//     directly, which also completes the login server-side.
// Either way, the interesting part — logging in again and entering a fresh
// TOTP code at the VerifySecondFactorPopup — is identical.

test.describe('Two-Factor login (Authenticator App)', () => {
  test.skip(!hasCredentials(), 'Set E2E_LOGIN_PRIMARY/E2E_PASSWORD_PRIMARY in .env.e2e')

  test.afterEach(async ({ page }) => {
    const { password } = getTestCredentials()
    // Best-effort: only meaningful if the test got far enough to enable it.
    await disableAuthenticatorAppViaApi(page, password)
  })

  test('login with a freshly computed authenticator code succeeds', async ({ page }) => {
    test.setTimeout(T(180000))
    const { login, password } = getTestCredentials()

    let secret = ''

    await step('Log in, enabling Authenticator App on the way if needed', async () => {
      const appDataResponsePromise = armAppDataResponse(page)

      await page.context().clearCookies()
      await page.goto('', { waitUntil: 'domcontentloaded' })
      await initVariant(page)
      await expect(page.getByTestId(sel('loginEmail'))).toBeVisible({ timeout: T(30000) })
      await attachScreenshot(page, 'two-factor-setup-01-login-page')

      await waitForTurnstileToken(page, appDataResponsePromise)
      await fieldControl(page, sel('loginEmail')).fill(login)
      await fieldControl(page, sel('loginPassword')).fill(password)
      await waitForTurnstileToken(page, appDataResponsePromise)

      const loginResponsePromise = armLoginResponse(page)
      await expect(page.getByTestId(sel('loginSubmit'))).toBeEnabled({ timeout: T(10000) })
      await clickReady(page.getByTestId(sel('loginSubmit')))

      const loginResponse = await loginResponsePromise
      const mandatoryUserToken = loginResponse?.Result?.TwoFactorAuth?.UserToken

      if (mandatoryUserToken) {
        console.log('  → Stand enforces mandatory 2FA setup — enabling Authenticator App via its UserToken')
        secret = await enableAuthenticatorAppFromUserToken(page, mandatoryUserToken, {
          needReloginAfterSetup: true,
        })
        // RegisterAuthenticatorAppFinish(needReloginAfterSetup: true) sets the
        // session cookie server-side; reload so the SPA picks it up.
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(page.getByTestId(sel('headerTabs'))).toBeVisible({ timeout: T(45000) })
      } else if (loginResponse?.Result?.TwoFactorAuth) {
        test.skip(
          true,
          'Account already requires 2FA verification to log in (leftover from a previous run?) — disable it manually and retry.'
        )
      } else {
        await expect(page.getByTestId(sel('headerTabs'))).toBeVisible({ timeout: T(45000) })
        try {
          secret = await enableAuthenticatorAppViaApi(page, password)
        } catch (err) {
          test.skip(true, `Could not enable Authenticator App via API (module likely disabled on this stand): ${err.message}`)
        }
      }

      await attachScreenshot(page, 'two-factor-setup-02-enabled')
    })

    const appDataResponsePromise = armAppDataResponse(page)

    await step('Log out', async () => {
      await logoutToLoginForm(page)
    })

    await step(`Log back in as ${login}`, async () => {
      await waitForTurnstileToken(page, appDataResponsePromise)
      await fieldControl(page, sel('loginEmail')).fill(login)
      await fieldControl(page, sel('loginPassword')).fill(password)
      await waitForTurnstileToken(page, appDataResponsePromise)
      await expect(page.getByTestId(sel('loginSubmit'))).toBeEnabled({ timeout: T(10000) })
      await clickReady(page.getByTestId(sel('loginSubmit')))
    })

    await step('Two-factor verification prompt appears', async () => {
      await expect(page.getByTestId('two-factor-verify')).toBeVisible({ timeout: T(20000) })
      await expect(page.getByTestId('two-factor-verify-code')).toBeVisible({ timeout: T(10000) })
      await attachScreenshot(page, 'two-factor-login-01-prompt')
    })

    await step('Enter a freshly computed TOTP code and submit', async () => {
      await fieldControl(page, 'two-factor-verify-code').fill(generateTotp(secret))
      await clickReady(page.getByTestId('two-factor-verify-submit'))
    })

    await step('Login completes: app shell loads, verify prompt is gone', async () => {
      await expect(page.getByTestId(sel('headerTabs'))).toBeVisible({ timeout: T(45000) })
      await expect(page.getByTestId('two-factor-verify')).not.toBeVisible({ timeout: T(15000) })
      await attachScreenshot(page, 'two-factor-login-02-shell')
    })
  })
})
