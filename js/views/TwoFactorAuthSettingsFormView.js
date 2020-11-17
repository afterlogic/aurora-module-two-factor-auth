'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),

	ConfirmPasswordPopup = require('modules/%ModuleName%/js/popups/ConfirmPasswordPopup.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	ShowBackupCodesPopup = require('modules/%ModuleName%/js/popups/ShowBackupCodesPopup.js')
;

/**
 * @constructor
 */
function CTwoFactorAuthSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.bAllowYubikey = Settings.AllowYubikey;
	this.showAuthenticatorAppOption = ko.observable(false);
	this.showOptions = ko.computed(function () {
		return this.bAllowYubikey && !this.showAuthenticatorAppOption();
	}, this);

	this.showRecommendationToConfigure = ko.observable(Settings.ShowRecommendationToConfigure);
	this.hasBackupCodes = ko.observable(false);
	this.infoShowBackupCodes = ko.observable('');
	this.populateSettings();

	this.isEnabledTwoFactorAuth = ko.observable(Settings.EnableTwoFactorAuth);
	this.isEnabledTwoFactorAuth.subscribe(function () {
		if (!this.isEnabledTwoFactorAuth())
		{
			Settings.updateBackupCodesCount(0);
			this.populateSettings();
		}
	}, this);
	this.isPasswordVerified = ko.observable(false);
	this.isShowSecret = ko.observable(false);
	this.isValidatingPin = ko.observable(false);
	this.QRCodeSrc = ko.observable('');
	this.secret = ko.observable('');
	this.pin = ko.observable('');
	
	this.allowBackupCodes = ko.computed(function () {
		return Settings.AllowBackupCodes && this.isEnabledTwoFactorAuth() && this.isShowSecret();
	}, this);

	this.addingSecurityKey = ko.observable(false);
}

_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = '%ModuleName%_TwoFactorAuthSettingsFormView';

CTwoFactorAuthSettingsFormView.prototype.populateSettings = function ()
{
	this.hasBackupCodes(Settings.BackupCodesCount > 0);
	this.infoShowBackupCodes(this.hasBackupCodes() ? TextUtils.i18n('%MODULENAME%/INFO_SHOW_BACKUP_CODES', { 'COUNT': Settings.BackupCodesCount }) : '');
};

CTwoFactorAuthSettingsFormView.prototype.confirmPassword = function ()
{
	Popups.showPopup(ConfirmPasswordPopup, [
		_.bind(this.onConfirmPassword, this),
		'EnableTwoFactorAuth'
	]);
};

CTwoFactorAuthSettingsFormView.prototype.onConfirmPassword = function (Response)
{
	if(Response && Response.Result && Response.Result.Secret && Response.Result.QRcode)
	{
		this.QRCodeSrc(Response.Result.QRcode);
		this.secret(Response.Result.Secret);
		this.isShowSecret(true);
		this.disableShowRecommendation();
	}
};

CTwoFactorAuthSettingsFormView.prototype.setupAuthenticatorApp = function ()
{
	this.showAuthenticatorAppOption(true);
};

CTwoFactorAuthSettingsFormView.prototype.cancelSetupAuthenticatorApp = function ()
{
	this.showAuthenticatorAppOption(false);
};

CTwoFactorAuthSettingsFormView.prototype.validatePin= function ()
{
	this.isValidatingPin(true);
	Ajax.send(
		'TwoFactorAuth',
		'TwoFactorAuthSave', 
		{
			'Pin': this.pin(),
			'Secret': this.secret()
		},
		this.onValidatingPinResponse,
		this
	);
};

CTwoFactorAuthSettingsFormView.prototype.disableShowRecommendation = function ()
{
	this.showRecommendationToConfigure(false);
	Ajax.send('TwoFactorAuth', 'UpdateSettings', {'ShowRecommendationToConfigure': false}, function () {
		Settings.updateShowRecommendation(false);
	});
};

CTwoFactorAuthSettingsFormView.prototype.onValidatingPinResponse = function (Response)
{
	this.isValidatingPin(false);
	if(Response && Response.Result)
	{
		this.QRCodeSrc('');
		this.secret('');
		this.pin('');
		this.isShowSecret(false);
		this.isEnabledTwoFactorAuth(true);
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_WRONG_PIN'));
	}
};

CTwoFactorAuthSettingsFormView.prototype.disable = function ()
{
	Popups.showPopup(ConfirmPasswordPopup, [
		_.bind(function () {
			this.QRCodeSrc('');
			this.secret('');
			this.pin('');
			this.isShowSecret(false);
			this.isEnabledTwoFactorAuth(false);
			this.cancelSetupAuthenticatorApp();
		}, this),
		'DisableTwoFactorAuth'
	]);
};

CTwoFactorAuthSettingsFormView.prototype.showBackupCodes = function ()
{
	if (this.allowBackupCodes())
	{
		Popups.showPopup(ShowBackupCodesPopup, [function (bGenerated, iBackupCodesCount) {
			if (bGenerated)
			{
				Settings.updateBackupCodesCount(iBackupCodesCount);
				this.populateSettings();
			}
		}.bind(this)]);
	}
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

CTwoFactorAuthSettingsFormView.prototype.addSecurityKey = function ()
{
	this.addingSecurityKey(true);
	Ajax.send('TwoFactorAuth', 'RegisterSecurityKeyAuthenticatorBegin', {}, this.onRegisterSecurityKeyAuthenticatorBegin, this);
};

CTwoFactorAuthSettingsFormView.prototype.onRegisterSecurityKeyAuthenticatorBegin = function (oResponse) {
	this.addingSecurityKey(false);
	if (oResponse && oResponse.Result)
	{
		var oCreateArgs = oResponse.Result;
		oCreateArgs.publicKey.challenge = _base64ToArrayBuffer(oCreateArgs.publicKey.challenge);
		oCreateArgs.publicKey.user.id = _base64ToArrayBuffer(oCreateArgs.publicKey.user.id);
		console.log("CREATE ARGS", oCreateArgs);
		navigator.credentials.create(oCreateArgs)
			.then((cred) => {
				console.log("NEW CREDENTIAL", cred);
				var oParams = {
					'Attestation': {
						'attestationObject': _arrayBufferToBase64(cred.response.attestationObject),
						'clientDataJSON': _arrayBufferToBase64(cred.response.clientDataJSON)
					}
				};
				Ajax.send('TwoFactorAuth', 'RegisterSecurityKeyAuthenticatorFinish', oParams,
					this.onRegisterSecurityKeyAuthenticatorFinish, this);
			})
			.catch((err) => {
				console.log("ERROR", err);
				Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
			});
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

CTwoFactorAuthSettingsFormView.prototype.onRegisterSecurityKeyAuthenticatorFinish = function (oResponse) {
	console.log(oResponse && oResponse.Result);
	if (oResponse && oResponse.Result)
	{
		
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

module.exports = new CTwoFactorAuthSettingsFormView();
