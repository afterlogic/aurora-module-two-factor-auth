const path = require('path')
const { sharedHelper } = require(
  path.join(process.env.AURORA_MOBILE_E2E_ROOT, 'test/e2e/helpers/paths')
)
const { expect } = require('@playwright/test')
const { clickReady } = sharedHelper('ready')

const TAB_PATH = '/settings/two-factor-auth'

function twoFactorTabLocator(page) {
  return page.locator(
    `[data-test-id="settings-tab"][data-settings-path="${TAB_PATH}"]`
  )
}

/**
 * Invoke an Aurora Web API method through the running app's own session
 * (same origin/path, PHP cookie + AuthToken). Used for state setup/teardown so
 * the test never has to drive the admin UI. Returns the parsed JSON or null.
 */
async function callAppApi(page, moduleName, methodName, parameters = {}) {
  return page.evaluate(
    async ({ moduleName, methodName, parameters }) => {
      const authToken = (document.cookie.match(/(?:^|;\s*)AuthToken=([^;]+)/) || [])[1]
      const body = new URLSearchParams({ Module: moduleName, Method: methodName })
      if (parameters && Object.keys(parameters).length > 0) {
        body.set('Parameters', JSON.stringify(parameters))
      }
      const res = await fetch(location.origin + location.pathname + '?/Api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MobileApp': '1',
          ...(authToken
            ? { Authorization: 'Bearer ' + decodeURIComponent(authToken) }
            : {}),
        },
        body,
        credentials: 'include',
      })
      try {
        return await res.json()
      } catch {
        return null
      }
    },
    { moduleName, methodName, parameters }
  )
}

async function getTwoFactorSettings(page) {
  const resp = await callAppApi(page, 'TwoFactorAuth', 'GetSettings')
  return (resp && resp.Result) || {}
}

async function isAuthenticatorAppEnabled(page) {
  return !!(await getTwoFactorSettings(page)).AuthenticatorAppEnabled
}

/**
 * The soft recommendation prompt is due when the module setting asks for it
 * (backend sends `ShowRecommendationToConfigure` as `null`/absent then, `false`
 * only when off or already dismissed), 2FA is not enabled, and it is not
 * mandatory (mandatory has its own enforced login dialog).
 */
async function isRecommendationExpected(page) {
  const s = await getTwoFactorSettings(page)
  return (
    s.AllowAuthenticatorApp === true &&
    s.ShowRecommendationToConfigure !== false &&
    s.AuthenticatorAppEnabled !== true &&
    s.MandatoryToConfigure !== true
  )
}

/** Best-effort teardown — disables the authenticator app if it is on. Never throws. */
async function disableAuthenticatorAppViaApi(page, password) {
  try {
    if (!password) {
      return
    }
    if (!(await isAuthenticatorAppEnabled(page))) {
      return
    }
    await callAppApi(page, 'TwoFactorAuth', 'DisableAuthenticatorApp', {
      Password: password,
    })
  } catch (err) {
    console.log('  → 2FA API cleanup skipped:', err && err.message)
  }
}

/**
 * The soft-recommendation toast is anchored bottom and overlaps the footer nav,
 * so it intercepts pointer events in unrelated tests. Drop it from the DOM.
 * No-op when it is not shown.
 */
async function dismissRecommendationToast(page) {
  // It renders a beat after login lands; poll briefly, remove it, done.
  for (let i = 0; i < 10; i++) {
    const removed = await page
      .evaluate(() => {
        const els = document.querySelectorAll('[data-test-id="two-factor-recommendation"]')
        els.forEach((el) => el.remove())
        return els.length
      })
      .catch(() => 0)
    if (removed > 0) {
      return
    }
    await page.waitForTimeout(200)
  }
}

/**
 * From the 2FA settings overview: confirm the account password to reach the
 * setup form. Waits for the submit button to enable (i.e. Vue has the value)
 * before clicking — `.fill()` + reactivity is otherwise racy.
 */
async function confirmPassword(page, password) {
  await expect(page.getByTestId('settings-two-factor-auth-password')).toBeVisible({
    timeout: 15000,
  })
  await page
    .locator(
      'input[data-test-id="settings-two-factor-auth-password"], [data-test-id="settings-two-factor-auth-password"] input'
    )
    .first()
    .fill(password)
  const submit = page.getByTestId('settings-two-factor-auth-password-submit')
  await expect(submit).toBeEnabled({ timeout: 5000 })
  await submit.click()
}

/** Open Settings → the Two Factor Verification tab. Assumes the tab exists. */
async function openTwoFactorSettings(page) {
  await dismissRecommendationToast(page)
  await clickReady(page.getByTestId('nav-settings'))
  await expect(page.getByTestId('settings-menu')).toBeVisible({ timeout: 30000 })
  await clickReady(twoFactorTabLocator(page))
  await expect(page.getByTestId('settings-two-factor-auth')).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByTestId('settings-two-factor-auth-configure')).toBeVisible({
    timeout: 30000,
  })
}

module.exports = {
  TAB_PATH,
  twoFactorTabLocator,
  callAppApi,
  getTwoFactorSettings,
  isAuthenticatorAppEnabled,
  isRecommendationExpected,
  dismissRecommendationToast,
  disableAuthenticatorAppViaApi,
  confirmPassword,
  openTwoFactorSettings,
}
