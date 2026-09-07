const { generateTotp } = require('./totp')

/**
 * Invoke an Aurora Web API method through the running app's own session
 * (same origin, PHP session cookie). Used for state setup/teardown so a test
 * never has to drive the Settings UI to (de)configure 2FA.
 *
 * Tries the legacy/prod entry first (`{path}?/Api/`, used by desktop and by
 * a built `next`), then falls back to the `next` Vite dev server's proxy
 * (`/backend/{Module}::{Method}`, see next/src/commons/config/api.ts) — the
 * same request the app itself would send depending on which one is live.
 */
async function callAppApi(page, moduleName, methodName, parameters = {}) {
  return page.evaluate(
    async ({ moduleName, methodName, parameters }) => {
      async function post(url) {
        const body = new URLSearchParams({
          Module: moduleName,
          Method: methodName,
          Parameters: JSON.stringify(parameters || {}),
        })
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          credentials: 'include',
        })
        const text = await res.text()
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      }

      const prodResult = await post(location.origin + location.pathname + '?/Api/').catch(
        () => null
      )
      if (prodResult && typeof prodResult === 'object' && 'Result' in prodResult) {
        return prodResult
      }

      return post(`${location.origin}/backend/${moduleName}::${methodName}`)
    },
    { moduleName, methodName, parameters }
  )
}

/**
 * Enables the Authenticator App second factor for the currently logged-in
 * user, entirely via API (VerifyPassword → RegisterAuthenticatorAppBegin →
 * a computed TOTP code → RegisterAuthenticatorAppFinish). Requires an
 * already-authenticated `page` (e.g. right after loginAsTestUser).
 *
 * @returns {Promise<string>} the base32 secret, so the caller can compute
 *   fresh TOTP codes later (e.g. for the login-time verify screen).
 */
async function enableAuthenticatorAppViaApi(page, password) {
  const verifyResponse = await callAppApi(page, 'TwoFactorAuth', 'VerifyPassword', {
    Password: password,
  })
  const userToken = verifyResponse && verifyResponse.Result && verifyResponse.Result.UserToken
  if (!userToken) {
    throw new Error(
      `VerifyPassword did not return a UserToken (${JSON.stringify(verifyResponse)})`
    )
  }

  return enableAuthenticatorAppFromUserToken(page, userToken, { needReloginAfterSetup: false })
}

/**
 * Enables the Authenticator App second factor from a `UserToken` — the
 * short-lived, encrypted (login/password) blob the backend hands back
 * instead of a session when TwoFactorAuth::MandatoryToConfigure forces setup
 * before a login can complete (see TwoFactorAuth::RegisterAuthenticatorAppBegin,
 * which accepts this token for an otherwise-anonymous caller). Also covers
 * the already-authenticated Settings flow when `needReloginAfterSetup` is
 * false (see enableAuthenticatorAppViaApi).
 *
 * When `needReloginAfterSetup` is true, RegisterAuthenticatorAppFinish also
 * completes the login server-side (sets the auth cookie) — the caller still
 * needs to reload the page for the app to pick that cookie up.
 *
 * @returns {Promise<string>} the base32 secret.
 */
async function enableAuthenticatorAppFromUserToken(
  page,
  userToken,
  { needReloginAfterSetup = false } = {}
) {
  const beginResponse = await callAppApi(page, 'TwoFactorAuth', 'RegisterAuthenticatorAppBegin', {
    UserToken: userToken,
  })
  const secret = beginResponse && beginResponse.Result && beginResponse.Result.Secret
  if (!secret) {
    throw new Error(
      `RegisterAuthenticatorAppBegin did not return a Secret (${JSON.stringify(beginResponse)})`
    )
  }

  const finishResponse = await callAppApi(page, 'TwoFactorAuth', 'RegisterAuthenticatorAppFinish', {
    UserToken: userToken,
    Code: generateTotp(secret),
    Secret: secret,
    NeedReloginAfterSetup: needReloginAfterSetup,
  })
  // Success is a truthy Result — either a literal `true` (plain setup) or
  // `{ AuthToken }` (needReloginAfterSetup delegates to VerifyAuthenticatorAppCode
  // server-side, see Module.php RegisterAuthenticatorAppFinish).
  if (!finishResponse || !finishResponse.Result) {
    throw new Error(
      `RegisterAuthenticatorAppFinish did not confirm the code (${JSON.stringify(finishResponse)})`
    )
  }

  return secret
}

/**
 * Arms a listener for the login POST (`Method=Login`, any login module) and
 * resolves to its parsed JSON body. Mirrors next/e2e's GetAppdata arming —
 * must be called *before* the submit click.
 */
function armLoginResponse(page) {
  return page
    .waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        (res.request().postData() || '').includes('Method=Login'),
      { timeout: 20000 }
    )
    .then((res) => res.json())
    .catch(() => null)
}

/** Best-effort teardown — disables the authenticator app. Never throws. */
async function disableAuthenticatorAppViaApi(page, password) {
  try {
    if (!password) {
      return
    }
    await callAppApi(page, 'TwoFactorAuth', 'DisableAuthenticatorApp', { Password: password })
  } catch (err) {
    console.log('  → 2FA API cleanup skipped:', err && err.message)
  }
}

module.exports = {
  callAppApi,
  enableAuthenticatorAppViaApi,
  enableAuthenticatorAppFromUserToken,
  armLoginResponse,
  disableAuthenticatorAppViaApi,
}
