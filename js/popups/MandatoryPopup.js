'use strict';

var
	_ = require('underscore'),
	
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js')
;

/**
 * @constructor
 */
function CMandatoryPopup()
{
	CAbstractPopup.call(this)

	this.sUserToken = ''

	this.SettingView = require('modules/%ModuleName%/js/views/TwoFactorAuthSettingsFormView.js')

	this.SettingView.isEnabledTwoFactorAuth.subscribe(function (v) {
		if (v) {
			this.closePopup()
		}
	}, this)
}

_.extendOwn(CMandatoryPopup.prototype, CAbstractPopup.prototype)

CMandatoryPopup.prototype.PopupTemplate = '%ModuleName%_MandatoryPopup'

CMandatoryPopup.prototype.onOpen = function (sUserToken)
{
	this.SettingView.subPage(false)
	this.SettingView.bNeedReloginAfterSetup = true
	this.SettingView.userToken(sUserToken || '')
	this.SettingView.clearAll()
}

module.exports = new CMandatoryPopup()
