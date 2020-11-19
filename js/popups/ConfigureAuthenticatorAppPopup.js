'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

/**
 * @constructor
 */
function CConfigureAuthenticatorAppPopup()
{
	CAbstractPopup.call(this);
	
	this.sEditVerificator = null;

	this.QRCodeSrc = ko.observable('');
	this.secret = ko.observable('');
	this.pin = ko.observable('');
	this.pinFocus = ko.observable(false);
	this.saveInProgress = ko.observable(false);
	
	this.saveCommand = Utils.createCommand(this, this.save, function () {
		return Types.isNonEmptyString(this.QRCodeSrc()) && Types.isNonEmptyString(this.secret()) && Types.isNonEmptyString(this.pin());
	});
}

_.extendOwn(CConfigureAuthenticatorAppPopup.prototype, CAbstractPopup.prototype);

CConfigureAuthenticatorAppPopup.prototype.PopupTemplate = '%ModuleName%_ConfigureAuthenticatorAppPopup';

CConfigureAuthenticatorAppPopup.prototype.onOpen = function (sEditVerificator)
{
	this.sEditVerificator = sEditVerificator;
	this.QRCodeSrc('');
	this.secret('');
	this.pin('');
	this.pinFocus(false);
	this.saveInProgress(false);
	this.enableTwoFactorAuth();
};

CConfigureAuthenticatorAppPopup.prototype.enableTwoFactorAuth = function ()
{
	var oParameters = {
		'Password': this.sEditVerificator
	};
	Ajax.send('%ModuleName%', 'EnableTwoFactorAuth', oParameters, this.onEnableTwoFactorAuth, this);
};

CConfigureAuthenticatorAppPopup.prototype.onEnableTwoFactorAuth = function (oResponse)
{
	var oResult = oResponse && oResponse.Result;

	if(oResult && oResult.Secret && oResult.QRcode)
	{
		this.QRCodeSrc(oResult.QRcode);
		this.secret(oResult.Secret);
		this.isShowSecret(true);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PASSWORD'));
	}
};

CConfigureAuthenticatorAppPopup.prototype.save = function ()
{
	var oParameters = {
		'Password': this.sEditVerificator,
		'AuthenticatorCode': this.pin(),
		'Secret': this.secret()
	};
	this.saveInProgress(true);
	Ajax.send('%ModuleName%', 'TwoFactorAuthSave', oParameters, this.onTwoFactorAuthSave, this);
};

CConfigureAuthenticatorAppPopup.prototype.onTwoFactorAuthSave = function (Response)
{
	this.saveInProgress(false);
	if(Response && Response.Result)
	{
		this.clear();
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PIN'));
	}
};

CConfigureAuthenticatorAppPopup.prototype.cancelSetupAuthenticatorApp = function ()
{
	this.showAuthenticatorAppOption(false);
};

module.exports = new CConfigureAuthenticatorAppPopup();
