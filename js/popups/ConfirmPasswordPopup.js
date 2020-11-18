'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js')
;

/**
 * @constructor
 */
function CConfirmPasswordPopup()
{
	CAbstractPopup.call(this);

	this.onConfirm = null;
	this.password = ko.observable('');
	this.passwordFocus = ko.observable(true);
	this.inProgress = ko.observable(false);
	this.action = '';
}

_.extendOwn(CConfirmPasswordPopup.prototype, CAbstractPopup.prototype);

CConfirmPasswordPopup.prototype.PopupTemplate = '%ModuleName%_ConfirmPasswordPopup';

CConfirmPasswordPopup.prototype.onOpen = function (onConfirm, sAction)
{
	this.onConfirm = onConfirm;
	this.action = sAction;
	this.passwordFocus(true);
};

CConfirmPasswordPopup.prototype.verifyPassword = function ()
{
	this.inProgress(true);
	Ajax.send(
		'%ModuleName%',
		this.action, 
		{
			'Password': this.password()
		},
		this.onGetVerifyResponse,
		this
	);
};

CConfirmPasswordPopup.prototype.onGetVerifyResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		if (_.isFunction(this.onConfirm))
		{
			this.onConfirm(this.password(), oResponse);
		}
		this.closePopup();
		this.password('');
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PASSWORD'));
	}
	this.inProgress(false);
};

module.exports = new CConfirmPasswordPopup();
