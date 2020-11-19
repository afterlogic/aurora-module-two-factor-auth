'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CVerifySecondFactorPopup()
{
	CAbstractPopup.call(this);

	this.bAllowYubikey = Settings.AllowYubikey;
	this.verifyingSecurityKey = ko.observable(false);

	this.bAllowBackupCodes = Settings.AllowBackupCodes;
	this.bAllowYubikey = Settings.AllowYubikey;
	this.hasBackupCodes = ko.observable(false);
	this.showBackupCodesVerivication = ko.observable(false);
	this.backupCode = ko.observable(false);
	
	this.onConfirm = null;
	this.onCancel = null;
	this.pin = ko.observable('');
	this.inProgress = ko.observable(false);
	this.pinFocused = ko.observable(false);
	this.isMobile = ko.observable(App.isMobile() || false);

	this.Login = null;
	this.Password = null;
}

_.extendOwn(CVerifySecondFactorPopup.prototype, CAbstractPopup.prototype);

CVerifySecondFactorPopup.prototype.PopupTemplate = '%ModuleName%_VerifySecondFactorPopup';

CVerifySecondFactorPopup.prototype.onOpen = function (onConfirm, onCancel, oTwoFactorAuthData, Login, Password)
{
	this.onConfirm = onConfirm;
	this.onCancel = onCancel;
	this.showBackupCodesVerivication(false);
	this.hasBackupCodes(oTwoFactorAuthData.HasBackupCodes);
	this.backupCode('');
	this.Login = Login;
	this.Password = Password;
	this.pin('');
	this.pinFocused(true);
	if (oTwoFactorAuthData.HasSecurityKey)
	{
		this.verifySecurityKey();
	}
};

CVerifySecondFactorPopup.prototype.verifyPin = function ()
{
	this.inProgress(true);
	Ajax.send(
		'%ModuleName%',
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

CVerifySecondFactorPopup.prototype.onGetVerifyResponse = function (oResponse)
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
	this.inProgress(false);
};

CVerifySecondFactorPopup.prototype.cancelPopup = function ()
{
	if (_.isFunction(this.onCancel))
	{
		this.onCancel(false);
	}
	this.closePopup();
};

CVerifySecondFactorPopup.prototype.useBackupCode = function ()
{
	if (this.bAllowBackupCodes && this.hasBackupCodes())
	{
		this.showBackupCodesVerivication(true);
	}
};

CVerifySecondFactorPopup.prototype.verifyBackupCode = function ()
{
	this.inProgress(true);
	Ajax.send(
		'%ModuleName%',
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

CVerifySecondFactorPopup.prototype.onGetVerifyBackupCodeResponse = function (oResponse)
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
	this.inProgress(false);
};

function _base64ToArrayBuffer(base64) {
	var binary_string = window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}

function _arrayBufferToBase64( buffer ) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}

CVerifySecondFactorPopup.prototype.verifySecurityKey = function ()
{
	this.verifyingSecurityKey(true);
	Ajax.send('%ModuleName%', 'VerifySecurityKeyAuthenticatorBegin', {'Login': this.Login, 'Password': this.Password}, this.onVerifySecurityKeyAuthenticatorBegin, this);
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyAuthenticatorBegin = function (oResponse) {
	this.verifyingSecurityKey(false);
	if (oResponse && oResponse.Result)
	{
		var oGetArgs = oResponse.Result;
		oGetArgs.publicKey.challenge = _base64ToArrayBuffer(oGetArgs.publicKey.challenge);
		oGetArgs.publicKey.allowCredentials.forEach(element => {
			element.id = _base64ToArrayBuffer(element.id);
		});

		console.log("GET ARGS", oGetArgs);
		navigator.credentials.get(oGetArgs)
			.then((cred) => {
				console.log("VERIFY CREDENTIAL", cred);
				var oParams = {
					'Login': this.Login,
					'Password': this.Password,
					'Attestation': {
						id: cred.rawId ? _arrayBufferToBase64(cred.rawId) : null,
						clientDataJSON: cred.response.clientDataJSON  ? _arrayBufferToBase64(cred.response.clientDataJSON) : null,
						authenticatorData: cred.response.authenticatorData ? _arrayBufferToBase64(cred.response.authenticatorData) : null,
						signature : cred.response.signature ? _arrayBufferToBase64(cred.response.signature) : null
					}
				};
				Ajax.send('%ModuleName%', 'VerifySecurityKeyAuthenticatorFinish', oParams,
					this.onVerifySecurityKeyAuthenticatorFinish, this);
			})
			.catch((err) => {
				console.log("ERROR", err);
				Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_VERIFY_SECURITY_KEY'));
			});
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_VERIFY_SECURITY_KEY'));
	}
};

CVerifySecondFactorPopup.prototype.onVerifySecurityKeyAuthenticatorFinish = function (oResponse) {
	if (oResponse && oResponse.Result)
	{
		if (_.isFunction(this.onConfirm))
		{
			this.onConfirm(oResponse);
		}
		this.closePopup();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_VERIFY_SECURITY_KEY'));
	}
};

module.exports = new CVerifySecondFactorPopup();
