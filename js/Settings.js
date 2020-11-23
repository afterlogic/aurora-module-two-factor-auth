'use strict';

var
	ko = require('knockout'),
	_ = require('underscore'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),

	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

module.exports = {
	ServerModuleName: '%ModuleName%',
	HashModuleName: 'two-factor-auth',
	EnableTwoFactorAuth: false,
	ShowRecommendationToConfigure: true,
	AllowBackupCodes: false,
	BackupCodesCount: false,
	AllowYubikey: false,
	SecurityKeys: [],
	TrustedDevicesLifetime: 0,

	/**
	 * Initializes settings from AppData object sections.
	 *
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = _.extend({}, oAppData[this.ServerModuleName] || {}, oAppData['%ModuleName%'] || {});
		if (!_.isEmpty(oAppDataSection))
		{
			this.EnableTwoFactorAuth = Types.pBool(oAppDataSection.EnableTwoFactorAuth, this.EnableTwoFactorAuth);
			this.ShowRecommendationToConfigure = Types.pBool(oAppDataSection.ShowRecommendationToConfigure, this.ShowRecommendationToConfigure);
			this.AllowBackupCodes = Types.pBool(oAppDataSection.AllowBackupCodes, this.AllowBackupCodes);
			this.BackupCodesCount = Types.pInt(oAppDataSection.BackupCodesCount, this.BackupCodesCount);
			this.AllowYubikey = Types.pBool(oAppDataSection.AllowYubikey, this.AllowYubikey);
			this.TrustedDevicesLifetime = Types.pInt(oAppDataSection.TrustedDevicesLifetime, this.TrustedDevicesLifetime);
			this.SecurityKeys = [];
			if (Types.isNonEmptyArray(oAppDataSection.WebAuthKeysInfo))
			{
				_.each(oAppDataSection.WebAuthKeysInfo, function (aSecurityKeyData) {
					if (Types.isNonEmptyArray(aSecurityKeyData, 2))
					{
						this.SecurityKeys.push({
							'Id': aSecurityKeyData[0],
							'keyName': ko.observable(aSecurityKeyData[1])
						});
					}
				}.bind(this));
			}
			this.checkIfEnabled();
		}
	},

	updateShowRecommendation: function (bShowRecommendationToConfigure)
	{
		this.ShowRecommendationToConfigure = bShowRecommendationToConfigure;
	},

	updateBackupCodesCount: function (iBackupCodesCount)
	{
		this.BackupCodesCount = iBackupCodesCount;
	},

	updateAuthenticatorApp: function (bEnableTwoFactorAuth)
	{
		this.EnableTwoFactorAuth = !!bEnableTwoFactorAuth;
	},

	checkIfEnabled: function ()
	{
		if (App.isUserNormalOrTenant() && this.ShowRecommendationToConfigure)
		{
			var bTfaSettingsOpened = window.location.hash === 'settings/two-factor-auth' || window.location.hash === '#settings/two-factor-auth';
			if (!this.EnableTwoFactorAuth && !bTfaSettingsOpened)
			{
				setTimeout(function () {
					Screens.showLoading(TextUtils.i18n('%MODULENAME%/CONFIRM_MODULE_NOT_ENABLED'));

					$('.report_panel.loading a').on('click', function () {
						Screens.hideLoading();
					});

					setTimeout(function () {
						Screens.hideLoading();
					}, 10000);
				}, 100);
			}
		}
	}
};
