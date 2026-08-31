/**
 * Records every sendRequest() call so specs can assert the module/method/params
 * each web-api wrapper produces. Reset `calls.length = 0` between tests.
 */
export const calls = []

export default {
  sendRequest (options) {
    calls.push(options)
    return Promise.resolve({ Stubbed: true, options })
  },
}
