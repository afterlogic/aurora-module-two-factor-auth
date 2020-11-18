'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js')
;

/**
 * @constructor
 */
function CSetupSecurityKeyNamePopup()
{
	CAbstractPopup.call(this);

	this.sName = '';
	this.iId = 0;
	this.name = ko.observable('');
	this.nameFocus = ko.observable(true);
	this.inProgress = ko.observable(false);
	this.allowCancel = ko.observable(false);
}

_.extendOwn(CSetupSecurityKeyNamePopup.prototype, CAbstractPopup.prototype);

CSetupSecurityKeyNamePopup.prototype.PopupTemplate = '%ModuleName%_SetupSecurityKeyNamePopup';

CSetupSecurityKeyNamePopup.prototype.onOpen = function (iId, sName, fCallback)
{
	this.iId = iId;
	this.name(sName);
	this.nameFocus(true);
	this.allowCancel(!Types.isNonEmptyString(sName));
	this.fCallback = fCallback;
};

CSetupSecurityKeyNamePopup.prototype.save = function ()
{
	this.inProgress(true);
	Ajax.send(
		'%ModuleName%',
		'UpdateWebAuthnKeyName', 
		{
			'KeyId': this.iId,
			'Name': this.name()
		},
		this.onUpdateWebAuthnKeyName,
		this
	);
};

CSetupSecurityKeyNamePopup.prototype.onUpdateWebAuthnKeyName = function (oResponse)
{
	this.inProgress(false);
	if (oResponse && oResponse.Result)
	{
		if (_.isFunction(this.fCallback))
		{
			this.fCallback(this.iId, this.name());
		}
		this.closePopup();
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SETUP_SECRET_KEY_NAME'));
	}
};

module.exports = new CSetupSecurityKeyNamePopup();
