'use strict'

const Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
  Api = require('%PathToCoreWebclientModule%/js/Api.js'),
  App = require('%PathToCoreWebclientModule%/js/App.js')

const DeviceUtils = require('modules/%ModuleName%/js/utils/Device.js'),
  Settings = require('modules/%ModuleName%/js/Settings.js')

module.exports = {
  saveDevice(authToken, successCallback) {
    if (!Settings.AllowUsedDevices) {
      successCallback()
      return
    }

    const parameters = {
      DeviceId: App.getCurrentDeviceId(),
      DeviceName: DeviceUtils.getName(),
    }
    Ajax.send(
      '%ModuleName%',
      'SaveDevice',
      parameters,
      function (response) {
        if (response && response.Result) {
          successCallback()
        } else {
          Api.showErrorByCode(response)
        }
      },
      this,
      null,
      authToken
    )
  },
}
