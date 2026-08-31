import { beforeEach, describe, expect, it } from 'vitest'

import twoFactorWebApi from '../../two-factor-web-api.js'
import { calls } from './stubs/web-api.js'

function lastCall() {
  return calls[calls.length - 1]
}

describe('two-factor-web-api wrappers', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('getSettings → TwoFactorAuth/GetSettings with empty params', async () => {
    await twoFactorWebApi.getSettings()
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'GetSettings',
      parameters: {},
    })
  })

  it('updateSettings → TwoFactorAuth/UpdateSettings with the flag', async () => {
    await twoFactorWebApi.updateSettings({ ShowRecommendationToConfigure: false })
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'UpdateSettings',
      parameters: { ShowRecommendationToConfigure: false },
    })
  })

  it('verifyPassword forwards the Password parameter', async () => {
    await twoFactorWebApi.verifyPassword({ Password: 'secret' })
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'VerifyPassword',
      parameters: { Password: 'secret' },
    })
  })

  it('registerAuthenticatorAppBegin forwards the UserToken', async () => {
    await twoFactorWebApi.registerAuthenticatorAppBegin({ UserToken: 'tok' })
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'RegisterAuthenticatorAppBegin',
      parameters: { UserToken: 'tok' },
    })
  })

  it('registerAuthenticatorAppFinish forwards code/secret/token/relogin flag', async () => {
    const parameters = {
      UserToken: 'tok',
      Code: '123456',
      Secret: 'ABCDEF',
      NeedReloginAfterSetup: true,
    }
    await twoFactorWebApi.registerAuthenticatorAppFinish(parameters)
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'RegisterAuthenticatorAppFinish',
      parameters,
    })
  })

  it('disableAuthenticatorApp forwards the Password parameter', async () => {
    await twoFactorWebApi.disableAuthenticatorApp({ Password: 'secret' })
    expect(lastCall()).toMatchObject({
      moduleName: 'TwoFactorAuth',
      methodName: 'DisableAuthenticatorApp',
      parameters: { Password: 'secret' },
    })
  })

  it('every wrapper targets the TwoFactorAuth backend module', async () => {
    await Promise.all([
      twoFactorWebApi.verifyAuthenticatorAppCode({ Code: '1', Login: 'a', Password: 'b' }),
      twoFactorWebApi.verifyBackupCode({ BackupCode: '1', Login: 'a', Password: 'b' }),
      twoFactorWebApi.trustTheDevice({ DeviceId: 'd', DeviceName: 'n' }),
    ])
    for (const call of calls) {
      expect(call.moduleName).toBe('TwoFactorAuth')
      expect(typeof call.methodName).toBe('string')
      expect(call.methodName.length).toBeGreaterThan(0)
    }
  })
})
