'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
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

	this.showRecommendationToConfigure = ko.observable(Settings.ShowRecommendationToConfigure);
	this.hasBackupCodes = ko.observable(Settings.HasBackupCodes);

	this.isEnabledTwoFactorAuth = ko.observable(Settings.EnableTwoFactorAuth);
	this.isPasswordVerified = ko.observable(false);
	this.isShowSecret = ko.observable(false);
	this.isValidatingPin = ko.observable(false);
	this.QRCodeSrc = ko.observable('');
	this.secret = ko.observable('');
	this.pin = ko.observable('');
}

_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = '%ModuleName%_TwoFactorAuthSettingsFormView';

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
		Settings.update(false);
	});
}

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
		}, this),
		'DisableTwoFactorAuth'
	]);
};

CTwoFactorAuthSettingsFormView.prototype.showBackupCodes = function ()
{
	if (this.isShowSecret())
	{
		Popups.showPopup(ShowBackupCodesPopup, []);
	}
};

module.exports = new CTwoFactorAuthSettingsFormView();
