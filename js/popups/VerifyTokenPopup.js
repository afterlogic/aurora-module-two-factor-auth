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
function CVerifyTokenPopup()
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

CVerifyTokenPopup.prototype.verifySecurityKey = function ()
{
	this.verifyingSecurityKey(true);
	Ajax.send('%ModuleName%', 'VerifySecurityKeyAuthenticatorBegin', {}, this.onVerifySecurityKeyAuthenticatorBegin, this);
};

CVerifyTokenPopup.prototype.onVerifySecurityKeyAuthenticatorBegin = function (oResponse) {
	this.verifyingSecurityKey(false);
	if (oResponse && oResponse.Result)
	{
		var oGetArgs = oResponse.Result;
		oGetArgs.publicKey.challenge = _base64ToArrayBuffer(oGetArgs.publicKey.challenge);
		oGetArgs.publicKey.user.id = _base64ToArrayBuffer(oGetArgs.publicKey.user.id);
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

CVerifyTokenPopup.prototype.onVerifySecurityKeyAuthenticatorFinish = function (oResponse) {
	console.log(oResponse && oResponse.Result);
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

module.exports = new CVerifyTokenPopup();
