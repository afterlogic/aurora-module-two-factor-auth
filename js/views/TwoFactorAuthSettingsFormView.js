'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),

	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),

	ConvertUtils = require('modules/%ModuleName%/js/utils/Convert.js'),
	
	ConfigureAuthenticatorAppPopup = require('modules/%ModuleName%/js/popups/ConfigureAuthenticatorAppPopup.js'),
	ConfirmPasswordPopup = require('modules/%ModuleName%/js/popups/ConfirmPasswordPopup.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	SetupSecurityKeyNamePopup = require('modules/%ModuleName%/js/popups/SetupSecurityKeyNamePopup.js'),
	ShowBackupCodesPopup = require('modules/%ModuleName%/js/popups/ShowBackupCodesPopup.js')
;

/**
 * @constructor
 */
function CTwoFactorAuthSettingsFormView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);

	this.showRecommendationToConfigure = ko.observable(Settings.ShowRecommendationToConfigure);

	this.bAllowSecurityKeys = Settings.AllowYubikey;

	this.securityKeys = ko.observableArray(Settings.SecurityKeys);

	this.hasBackupCodes = ko.observable(false);
	this.infoShowBackupCodes = ko.observable('');

	this.hasAuthenticatorApp = ko.observable(Settings.EnableTwoFactorAuth);

	this.isEnabledTwoFactorAuth = ko.computed(function () {
		return this.hasAuthenticatorApp() || this.securityKeys().length > 0;
	}, this);
	this.isEnabledTwoFactorAuth.subscribe(function () {
		if (!this.isEnabledTwoFactorAuth())
		{
			Settings.updateBackupCodesCount(0);
			this.populateSettings();
		}
	}, this);

	this.sEditVerificator = '';
	this.passwordVerified = ko.observable(false);

	this.allowBackupCodes = ko.computed(function () {
		return Settings.AllowBackupCodes && (this.hasAuthenticatorApp() || this.securityKeys().length > 0) && this.passwordVerified();
	}, this);

	this.addingSecurityKey = ko.observable(false);

	this.populateSettings();
}

_.extendOwn(CTwoFactorAuthSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CTwoFactorAuthSettingsFormView.prototype.ViewTemplate = '%ModuleName%_TwoFactorAuthSettingsFormView';

CTwoFactorAuthSettingsFormView.prototype.onShow = function () {
	this.sEditVerificator = '';
	this.passwordVerified(false);
	this.populateSettings();
};

CTwoFactorAuthSettingsFormView.prototype.populateSettings = function ()
{
	this.showRecommendationToConfigure(Settings.ShowRecommendationToConfigure);

	this.hasAuthenticatorApp(Settings.EnableTwoFactorAuth);

	this.hasBackupCodes(Settings.BackupCodesCount > 0);
	this.infoShowBackupCodes(this.hasBackupCodes() ? TextUtils.i18n('%MODULENAME%/INFO_SHOW_BACKUP_CODES', { 'COUNT': Settings.BackupCodesCount }) : '');
};

CTwoFactorAuthSettingsFormView.prototype.confirmPassword = function ()
{
	Popups.showPopup(ConfirmPasswordPopup, [function (sEditVerificator) {
		this.sEditVerificator = sEditVerificator;
		this.passwordVerified(true);
		this.disableShowRecommendation();
	}.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.setupAuthenticatorApp = function ()
{
	Popups.showPopup(ConfigureAuthenticatorAppPopup, [this.sEditVerificator, function () {
		Settings.updateAuthenticatorApp(true);
		this.populateSettings();
	}.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.disableShowRecommendation = function ()
{
	this.showRecommendationToConfigure(false);
	Ajax.send('%ModuleName%', 'UpdateSettings', {'ShowRecommendationToConfigure': false}, function () {
		Settings.updateShowRecommendation(false);
		this.populateSettings();
	}.bind(this));
};

CTwoFactorAuthSettingsFormView.prototype.disableAuthenticatorApp = function ()
{
	var oParameters = {
		'Password': this.sEditVerificator
	};
	Ajax.send('%ModuleName%', 'DisableTwoFactorAuth', oParameters);
	Settings.updateAuthenticatorApp(false);
	this.populateSettings();
};

CTwoFactorAuthSettingsFormView.prototype.showBackupCodes = function ()
{
	if (this.allowBackupCodes())
	{
		Popups.showPopup(ShowBackupCodesPopup, [this.sEditVerificator, function (bGenerated, iBackupCodesCount) {
			if (bGenerated)
			{
				Settings.updateBackupCodesCount(iBackupCodesCount);
				this.populateSettings();
			}
		}.bind(this)]);
	}
};

CTwoFactorAuthSettingsFormView.prototype.addSecurityKey = function ()
{
	this.addingSecurityKey(true);
	Ajax.send('%ModuleName%', 'RegisterSecurityKeyAuthenticatorBegin', {
		'Password': this.sEditVerificator
	}, this.onRegisterSecurityKeyAuthenticatorBegin, this);
};

CTwoFactorAuthSettingsFormView.prototype.onRegisterSecurityKeyAuthenticatorBegin = function (oResponse) {
	this.addingSecurityKey(false);
	if (oResponse && oResponse.Result)
	{
		var oCreateArgs = oResponse.Result;
		oCreateArgs.publicKey.challenge = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.challenge);
		oCreateArgs.publicKey.user.id = ConvertUtils.base64ToArrayBuffer(oCreateArgs.publicKey.user.id);
		navigator.credentials.create(oCreateArgs)
			.then((cred) => {
				var oParams = {
					'Password': this.sEditVerificator,
					'Attestation': {
						'attestationObject': ConvertUtils.arrayBufferToBase64(cred.response.attestationObject),
						'clientDataJSON': ConvertUtils.arrayBufferToBase64(cred.response.clientDataJSON)
					}
				};
				Ajax.send('%ModuleName%', 'RegisterSecurityKeyAuthenticatorFinish', oParams,
					this.onRegisterSecurityKeyAuthenticatorFinish, this);
			})
			.catch((err) => {
				console.log("ERROR", typeof err, err);
			});
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

CTwoFactorAuthSettingsFormView.prototype.onRegisterSecurityKeyAuthenticatorFinish = function (oResponse)
{
	if (oResponse && oResponse.Result)
	{
		Popups.showPopup(SetupSecurityKeyNamePopup, [this.sEditVerificator, oResponse.Result, '', this.addCreatedSecurityKey.bind(this)]);
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_ADD_SECURITY_KEY'));
	}
};

CTwoFactorAuthSettingsFormView.prototype.addCreatedSecurityKey = function (iId, sName)
{
	this.securityKeys.push({
		'Id': iId,
		'keyName': ko.observable(sName),
	});
};

CTwoFactorAuthSettingsFormView.prototype.askNewSecurityKeyName = function (iId, sName)
{
	Popups.showPopup(SetupSecurityKeyNamePopup, [this.sEditVerificator, iId, sName, this.updateSecurityKeyName.bind(this)]);
};

CTwoFactorAuthSettingsFormView.prototype.updateSecurityKeyName = function (iId, sName)
{
	_.each(this.securityKeys(), function (oSecurityKey) {
		if (oSecurityKey.Id === iId)
		{
			oSecurityKey.keyName(sName);
		}
	});
	this.securityKeys.valueHasMutated();
};

CTwoFactorAuthSettingsFormView.prototype.askRemoveSecurityKey = function (iId, sName)
{
	var sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_REMOVE_SECURITY_KEY', {
		'KEYNAME': sName
	});
	Popups.showPopup(ConfirmPopup, [sConfirm, _.bind(function (bRemoveKey) {
		if (bRemoveKey)
		{
			this.removeSecurityKey(iId);
		}
	}, this)]);
};

CTwoFactorAuthSettingsFormView.prototype.removeSecurityKey = function (iId)
{
	Ajax.send(
		'%ModuleName%',
		'DeleteWebAuthnKey', 
		{
			'Password': this.sEditVerificator,
			'KeyId': iId,
		},
		function (oResponse) {
			if (oResponse && oResponse.Result)
			{
				this.securityKeys(_.filter(this.securityKeys(), function (oSecurityKey) {
					return oSecurityKey.Id !== iId
				}));
				Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_DELETE_SECURITY_KEY'));
			}
			else
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_SECURITY_KEY'));
			}
		},
		this
	);
};

module.exports = new CTwoFactorAuthSettingsFormView();
