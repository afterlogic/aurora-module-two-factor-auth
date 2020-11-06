'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	moment = require('moment'),

	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),

	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CAbstractPopup = require('%PathToCoreWebclientModule%/js/popups/CAbstractPopup.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	FileSaver = require('%PathToCoreWebclientModule%/js/vendors/FileSaver.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),

	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CShowBackupCodesPopup()
{
	CAbstractPopup.call(this);
	
	this.backupCodes = ko.observableArray([]);

	this.codesGeneratedDataInfo = ko.observable('');

	this.generatingBackupCodes = ko.observable(false);
	this.generateBackupCodesCommand = Utils.createCommand(this, this.generateNewBackupCodes, function () { return !this.generatingBackupCodes(); });
}

_.extendOwn(CShowBackupCodesPopup.prototype, CAbstractPopup.prototype);

CShowBackupCodesPopup.prototype.PopupTemplate = '%ModuleName%_ShowBackupCodesPopup';

CShowBackupCodesPopup.prototype.onOpen = function ()
{
	if (Settings.HasBackupCodes)
	{
		this.getBackupCodes();
	}
	else
	{
		this.backupCodes([]);
		this.codesGeneratedDataInfo('');
		this.generateBackupCodes();
	}
};

CShowBackupCodesPopup.prototype.getBackupCodes = function ()
{
	this.backupCodes([]);
	this.codesGeneratedDataInfo('');
	Ajax.send('TwoFactorAuth', 'GenerateBackupCodes', {}, function (Response) {
		var aCodes = Response && Response.Result;
		if (Types.isNonEmptyArray(aCodes))
		{
			this.backupCodes(aCodes);
		}
	}, this);
};

CShowBackupCodesPopup.prototype.generateNewBackupCodes = function ()
{
	Popups.showPopup(ConfirmPopup, [TextUtils.i18n('%MODULENAME%/INFO_GET_NEW_CODES'),
		function (bOk) {
			if (bOk)
			{
				this.generateBackupCodes();
			}
		}.bind(this),
		TextUtils.i18n('%MODULENAME%/CONFIRM_GET_NEW_CODES')
	]);
};

CShowBackupCodesPopup.prototype.generateBackupCodes = function ()
{
	this.generatingBackupCodes(true);
	Ajax.send('TwoFactorAuth', 'GenerateBackupCodes', {}, function (Response) {
		this.generatingBackupCodes(false);
		var
			oResult = Response && Response.Result,
			aCodes = oResult && oResult.Codes
		;
		if (Types.isNonEmptyArray(aCodes))
		{
			var oMoment = moment.unix(oResult.Datetime);
			this.codesGeneratedDataInfo(TextUtils.i18n('%MODULENAME%/INFO_CODES_GENERATED_DATA', {
				'DATA': oMoment.format('MMM D, YYYY')
			}));
			this.backupCodes(aCodes);
		}
	}, this);
};

CShowBackupCodesPopup.prototype.getBackupCodesFileText = function ()
{
	var sText = '';
	sText += TextUtils.i18n('%MODULENAME%/HEADING_SAVE_CODES') + '\n';
	sText += TextUtils.i18n('%MODULENAME%/INFO_KEEP_CODES_SAFE') + '\n';
	sText += '\n';
	_.each(this.backupCodes(), function (sCode, iIndex) {
		sText += (iIndex + 1) + '. ' + sCode + '\n';
	});
	sText += '\n';
	sText += App.getUserPublicId() + '\n';
	sText += '\n';
	sText += TextUtils.i18n('%MODULENAME%/INFO_USE_CODE_ONCE') + '\n';
	sText += this.codesGeneratedDataInfo() + '\n';
	return sText;
};

CShowBackupCodesPopup.prototype.print = function ()
{
	var
		sText = this.getBackupCodesFileText(),
		oWin = WindowOpener.open('', 'backup-codes-' + App.getUserPublicId() + '-print')
	;

	if (oWin)
	{
		$(oWin.document.body).html('<pre>' + sText + '</pre>');
		oWin.print();
	}
};

CShowBackupCodesPopup.prototype.download = function ()
{
	var sText = this.getBackupCodesFileText();
	var oBlob = new Blob([sText], {'type': 'text/plain;charset=utf-8'});
	FileSaver.saveAs(oBlob, 'backup-codes-' + App.getUserPublicId() + '.txt', true);

};

module.exports = new CShowBackupCodesPopup();
