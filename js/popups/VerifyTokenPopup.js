'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CVerifyTokenPopup()
{
	CAbstractPopup.call(this);
	this.bAllowBackupCodes = Settings.AllowBackupCodes;
	this.bAllowYubikey = Settings.AllowYubikey;
	this.hasBackupCodes = ko.observable(false);
	this.showBackupCodesVerivication = ko.observable(false);
	this.backupCode = ko.observable(false);
	
	this.onConfirm = null;
	this.onCancel = null;
	this.pin = ko.observable('');
	this.inPropgress = ko.observable(false);
	this.pinFocused = ko.observable(false);
	this.isMobile = ko.observable(App.isMobile() || false);

	this.Login = null;
	this.Password = null;
}

_.extendOwn(CVerifyTokenPopup.prototype, CAbstractPopup.prototype);

CVerifyTokenPopup.prototype.PopupTemplate = '%ModuleName%_VerifyTokenPopup';

CVerifyTokenPopup.prototype.onOpen = function (onConfirm, onCancel, bHasBackupCodes, Login, Password)
{
	this.onConfirm = onConfirm;
	this.onCancel = onCancel;
	this.showBackupCodesVerivication(false);
	this.hasBackupCodes(bHasBackupCodes);
	this.backupCode('');
	this.Login = Login;
	this.Password = Password;
	this.pin('');
	this.pinFocused(true);
};

CVerifyTokenPopup.prototype.verifyPin = function ()
{
	this.inPropgress(true);
	Ajax.send(
		'TwoFactorAuth',
		'VerifyPin', 
		{
			'Pin': this.pin(),
			'Login': this.Login,
			'Password': this.Password
		},
		this.onGetVerifyResponse,
		this
	);
};

CVerifyTokenPopup.prototype.onGetVerifyResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		if (_.isFunction(this.onConfirm))
		{
			this.onConfirm(oResponse);
		}
		this.closePopup();
		this.pin('');
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PIN'));
		this.pin('');
	}
	this.inPropgress(false);
};

CVerifyTokenPopup.prototype.cancelPopup = function ()
{
	if (_.isFunction(this.onCancel))
	{
		this.onCancel(false);
	}
	this.closePopup();
};

CVerifyTokenPopup.prototype.useBackupCode = function ()
{
	if (this.bAllowBackupCodes && this.hasBackupCodes())
	{
		this.showBackupCodesVerivication(true);
	}
};

CVerifyTokenPopup.prototype.verifyBackupCode = function ()
{
	this.inPropgress(true);
	Ajax.send(
		'TwoFactorAuth',
		'VerifyBackupCode', 
		{
			'BackupCode': this.backupCode(),
			'Login': this.Login,
			'Password': this.Password
		},
		this.onGetVerifyBackupCodeResponse,
		this
	);
};

CVerifyTokenPopup.prototype.onGetVerifyBackupCodeResponse = function (oResponse)
{
	var oResult = oResponse.Result;

	if (oResult)
	{
		if (_.isFunction(this.onConfirm))
		{
			this.onConfirm(oResponse);
		}
		this.closePopup();
		this.backupCode('');
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_BACKUP_CODE'));
		this.backupCode('');
	}
	this.inPropgress(false);
};

module.exports = new CVerifyTokenPopup();
