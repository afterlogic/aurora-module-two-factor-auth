'use strict';

var
	moment = require('moment'),
	UAParser = require('ua-parser-js'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

/**
 * @constructor
 * @param {object} oData
 * @returns {CDeviceModel}
 */
function CDeviceModel(oData)
{
	this.sDeviceId = '';
	this.oUaData = '';
	this.sDeviceName = '';
	this.sExpirationDate = '';
	this.sLastUsageDate = '';
	this.sDeviceExpiresDate = '';
	this.sDeviceLastUsageDate = '';
	
	this.parse(oData);
}

/**
 * @param {Object} oData
 */
CDeviceModel.prototype.parse = function (oData)
{
	if (oData !== null)
	{
		var
			oExpMoment = moment.unix(oData.ExpirationDateTime),
			oUsageMoment = moment.unix(oData.LastUsageDateTime),
			sName = '',
			sPlatform = ''
		;
		this.sDeviceId = Types.pString(oData.DeviceId);
		this.oUaData = UAParser(Types.pString(oData.DeviceName));
		this.sExpirationDate = oExpMoment.format('MMM D, YYYY');
		this.sLastUsageDate = oUsageMoment.fromNow();
		sName = this.oUaData.browser.name + '/' + this.oUaData.browser.major;
		sPlatform = this.oUaData.os.name + ' ' + this.oUaData.os.version;
		this.sDeviceName = TextUtils.i18n('%MODULENAME%/LABEL_TRUSTED_DEVICE', {
			'NAME': sName,
			'PLATFORM': sPlatform
		});
		this.sDeviceExpiresDate = TextUtils.i18n('%MODULENAME%/LABEL_TRUSTED_DEVICE_EXPIRES_DATE', {
			'EXPDATE': this.sExpirationDate
		});
		this.sDeviceLastUsageDate = TextUtils.i18n('%MODULENAME%/LABEL_TRUSTED_DEVICE_LAST_USAGE_DATE', {
			'USAGEDATE': this.sLastUsageDate
		});
	}
};

module.exports = CDeviceModel;
