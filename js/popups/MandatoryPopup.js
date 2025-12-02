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
	CAbstractPopup.call(this);

	this.SettingView = require('modules/%ModuleName%/js/views/TwoFactorAuthSettingsFormView.js')
	this.SettingView.subPage(false)


	this.SettingView.isEnabledTwoFactorAuth.subscribe(function (v) {
		if (v) {
			this.closePopup()
		}
	}, this)
}

_.extendOwn(CMandatoryPopup.prototype, CAbstractPopup.prototype);

CMandatoryPopup.prototype.PopupTemplate = '%ModuleName%_MandatoryPopup';

CMandatoryPopup.prototype.onOpen = function (sEditVerificator, fSuccessCallback)
{
	this.SettingView.clearAll();
};

module.exports = new CMandatoryPopup();
