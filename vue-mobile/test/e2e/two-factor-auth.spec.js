const path = require('path')
const { sharedHelper } = require(
  path.join(process.env.AURORA_MOBILE_E2E_ROOT, 'test/e2e/helpers/paths')
)
const { test, expect } = sharedHelper('fixtures')
const {
  loginAsTestUser,
  step,
  attachScreenshot,
  fieldControl,
  resolveLoginFieldTestId,
  fillLoginCredentials,
} = sharedHelper('login')
const { clickReady } = sharedHelper('ready')

const {
  twoFactorTabLocator,
  getTwoFactorSettings,
  isAuthenticatorAppEnabled,
  isRecommendationExpected,
  dismissRecommendationToast,
  disableAuthenticatorAppViaApi,
  confirmPassword,
  openTwoFactorSettings,
} = require('./helpers/two-factor')
const { generateTotp } = require('./helpers/totp')

const login = process.env.E2E_LOGIN
const password = process.env.E2E_PASSWORD
const hasCredentials = !!(login && password)

test.describe('Mobile Two Factor Verification (Authenticator App)', () => {
  test.skip(!hasCredentials, 'Set E2E_LOGIN and E2E_PASSWORD in .env.e2e')

  test.afterEach(async ({ page }) => {
    // Teardown via the app's own API — reversing what a test enabled, without
    // touching the admin UI. Safe to run even when nothing was enabled.
    await disableAuthenticatorAppViaApi(page, password)
  })

  test('settings: configuration dialog appears (no mutation)', async ({ page }) => {
    test.setTimeout(120000)
    await loginAsTestUser(page)

    const tab = twoFactorTabLocator(page)
    await dismissRecommendationToast(page)
    await clickReady(page.getByTestId('nav-settings'))
    await expect(page.getByTestId('settings-menu')).toBeVisible({ timeout: 30000 })
    test.skip(
      (await tab.count()) === 0,
      'Two Factor Verification tab is not available on this stand'
    )

    // A previous failed run may have left the authenticator enabled.
    if (await isAuthenticatorAppEnabled(page)) {
      await disableAuthenticatorAppViaApi(page, password)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await dismissRecommendationToast(page)
      await clickReady(page.getByTestId('nav-settings'))
      await expect(page.getByTestId('settings-menu')).toBeVisible({ timeout: 30000 })
    }

    await step('Open the Two Factor Verification tab', async () => {
      await openTwoFactorSettings(page)
      await attachScreenshot(page, '2fa-01-overview')
    })

    await step('Confirm password to reach the setup form', async () => {
      await clickReady(page.getByTestId('settings-two-factor-auth-configure'))
      await confirmPassword(page, password)
    })

    await step('Assert the authenticator setup dialog is shown', async () => {
      await expect(page.getByTestId('two-factor-configure')).toBeVisible({
        timeout: 20000,
      })
      await expect(page.getByTestId('two-factor-configure-code')).toBeVisible()
      // RegisterAuthenticatorAppBegin resolves a beat later — the secret and the
      // QR are set together in its response handler.
      await expect(page.getByTestId('two-factor-configure-secret')).toBeVisible({ timeout: 15000 })
      const qrShown = await page.getByTestId('two-factor-configure-qr').isVisible().catch(() => false)
      console.log(`  → QR shown: ${qrShown}`)
      await attachScreenshot(page, '2fa-02-setup-dialog')
    })

    expect(await isAuthenticatorAppEnabled(page)).toBe(false)
  })

  test('settings: full setup with a computed TOTP code, then API teardown', async ({
    page,
  }) => {
    test.setTimeout(150000)
    await loginAsTestUser(page)

    const tab = twoFactorTabLocator(page)
    await dismissRecommendationToast(page)
    await clickReady(page.getByTestId('nav-settings'))
    await expect(page.getByTestId('settings-menu')).toBeVisible({ timeout: 30000 })
    test.skip(
      (await tab.count()) === 0,
      'Two Factor Verification tab is not available on this stand'
    )

    if (await isAuthenticatorAppEnabled(page)) {
      await disableAuthenticatorAppViaApi(page, password)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await dismissRecommendationToast(page)
      await clickReady(page.getByTestId('nav-settings'))
      await expect(page.getByTestId('settings-menu')).toBeVisible({ timeout: 30000 })
    }

    await openTwoFactorSettings(page)

    // The secret is issued by RegisterAuthenticatorAppBegin, which fires when the
    // setup form mounts (right after the password is confirmed). Arm the wait first.
    const beginResponse = page
      .waitForResponse(
        (res) =>
          res.request().method() === 'POST' &&
          (res.request().postData() || '').includes('Method=RegisterAuthenticatorAppBegin'),
        { timeout: 20000 }
      )
      .then((res) => res.json())
      .catch(() => null)

    await step('Confirm password', async () => {
      await clickReady(page.getByTestId('settings-two-factor-auth-configure'))
      await confirmPassword(page, password)
    })

    let secret = ''
    await step('Read the shared secret from RegisterAuthenticatorAppBegin', async () => {
      await expect(page.getByTestId('two-factor-configure')).toBeVisible({ timeout: 20000 })
      const payload = await beginResponse
      secret = payload && payload.Result && payload.Result.Secret
      expect(secret, 'secret from RegisterAuthenticatorAppBegin').toBeTruthy()
    })

    await step('Enter a computed TOTP code and submit', async () => {
      await fieldControl(page, 'two-factor-configure-code').fill(generateTotp(secret))
      await clickReady(page.getByTestId('two-factor-configure-submit'))
      await expect(page.getByTestId('two-factor-configure')).toBeHidden({ timeout: 20000 })
      await expect(page.getByTestId('settings-two-factor-auth-configure')).toBeVisible({
        timeout: 20000,
      })
      await attachScreenshot(page, '2fa-03-enabled')
    })

    await step('Backend confirms the authenticator app is enabled', async () => {
      await expect
        .poll(() => isAuthenticatorAppEnabled(page), { timeout: 15000, intervals: [500, 1000] })
        .toBe(true)
    })

    await step('Teardown via API and confirm it is off', async () => {
      await disableAuthenticatorAppViaApi(page, password)
      await expect
        .poll(() => isAuthenticatorAppEnabled(page), { timeout: 15000, intervals: [500, 1000] })
        .toBe(false)
    })
  })

  test('recommendation: soft prompt appears right after an in-SPA login (no reload)', async ({
    page,
  }) => {
    test.setTimeout(120000)

    // Anonymous pre-check so we skip cleanly on stands where login itself would
    // be blocked (mandatory 2FA) or the module is off.
    await page.goto('', { waitUntil: 'domcontentloaded' })
    const anon = await getTwoFactorSettings(page)
    test.skip(
      anon.AllowAuthenticatorApp !== true,
      'Authenticator app is disabled on this stand'
    )
    test.skip(
      anon.MandatoryToConfigure === true,
      'Stand enforces mandatory 2FA — the soft recommendation does not apply'
    )

    // Full login flow, then NO reload — the prompt must show on the same SPA
    // session it was only shown after Ctrl+F5 before. Reloading here would hide
    // the regression this test guards against.
    await loginAsTestUser(page)

    test.skip(
      !(await isRecommendationExpected(page)),
      'Stand does not ask for the soft 2FA recommendation for this user (2FA already enabled or dismissed)'
    )

    await step('Prompt shows without reload; "Configure" opens the settings screen', async () => {
      await expect(page.getByTestId('two-factor-recommendation')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('two-factor-recommendation-configure')).toBeVisible()
      await expect(page.getByTestId('two-factor-recommendation-dismiss')).toBeVisible()
      await attachScreenshot(page, '2fa-05-recommendation')
      // Act before the toast auto-dismisses.
      await page.getByTestId('two-factor-recommendation-configure').click()
      await expect(page).toHaveURL(/\/settings\/two-factor-auth$/, { timeout: 15000 })
      await expect(page.getByTestId('settings-two-factor-auth')).toBeVisible({ timeout: 15000 })
    })
  })

  test('login: mandatory setup dialog (skipped unless the stand enforces 2FA)', async ({
    page,
  }) => {
    test.setTimeout(120000)

    let loginFieldTestId = 'login-email'
    await step('Open login and submit credentials', async () => {
      await page.context().clearCookies()
      await page.goto('', { waitUntil: 'domcontentloaded' })
      await page
        .locator('[data-test-id="login-email"], [data-test-id="login-username"]')
        .first()
        .waitFor({ state: 'visible', timeout: 30000 })
      loginFieldTestId = await resolveLoginFieldTestId(page)
      await fillLoginCredentials(page, loginFieldTestId, login)
      await fieldControl(page, 'login-password').fill(password)
      await expect(page.getByTestId('login-submit')).toBeEnabled({ timeout: 10000 })
      await page.getByTestId('login-submit').click()
    })

    const mandatoryDialog = page.getByTestId('login-2fa')
    const appShell = page.getByTestId('app-shell')
    await Promise.race([
      mandatoryDialog.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
      appShell.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    ])

    test.skip(
      !(await mandatoryDialog.isVisible().catch(() => false)),
      'Stand does not enforce mandatory 2FA for this user (MandatoryToConfigure is off)'
    )

    await step('Assert the mandatory setup form is shown on the login screen', async () => {
      await expect(page.getByTestId('two-factor-configure')).toBeVisible({ timeout: 15000 })
      await expect(page.getByTestId('two-factor-configure-code')).toBeVisible()
      await attachScreenshot(page, '2fa-04-mandatory-login')
    })
  })
})
