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
	AuthenticatorAppEnabled: false,
	ShowRecommendationToConfigure: true,
	AllowBackupCodes: false,
	BackupCodesCount: false,
	AllowSecurityKeys: false,
	SecurityKeys: [],
	TrustedDevicesLifetime: 0,
	AllowTrustedDevices: false,

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
			this.AuthenticatorAppEnabled = Types.pBool(oAppDataSection.AuthenticatorAppEnabled, this.AuthenticatorAppEnabled);
			this.ShowRecommendationToConfigure = Types.pBool(oAppDataSection.ShowRecommendationToConfigure, this.ShowRecommendationToConfigure);
			this.AllowBackupCodes = Types.pBool(oAppDataSection.AllowBackupCodes, this.AllowBackupCodes);
			this.BackupCodesCount = Types.pInt(oAppDataSection.BackupCodesCount, this.BackupCodesCount);
			this.AllowSecurityKeys = Types.pBool(oAppDataSection.AllowSecurityKeys, this.AllowSecurityKeys);
			this.TrustedDevicesLifetime = Types.pInt(oAppDataSection.TrustedDevicesLifetime, this.TrustedDevicesLifetime);
			this.AllowTrustedDevices = this.TrustedDevicesLifetime > 0;
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

	updateAuthenticatorApp: function (bAuthenticatorAppEnabled)
	{
		this.AuthenticatorAppEnabled = !!bAuthenticatorAppEnabled;
	},

	checkIfEnabled: function ()
	{
		if (App.isUserNormalOrTenant() && this.ShowRecommendationToConfigure)
		{
			var bTfaSettingsOpened = window.location.hash === 'settings/two-factor-auth' || window.location.hash === '#settings/two-factor-auth';
			if (!this.AuthenticatorAppEnabled && !bTfaSettingsOpened)
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
