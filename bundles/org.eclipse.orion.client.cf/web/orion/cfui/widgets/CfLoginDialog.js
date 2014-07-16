/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2011. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['orion/webui/dialog'], function(dialog) {

/**
 * @param options {{ 
 *     title: string,						//title of window ("Jazz Login" used if not provided)
 *     func: function,						//callback function
 * }}
 */
function CfLoginDialog(options){
	this._init(options);
}

CfLoginDialog.prototype = new dialog.Dialog();

CfLoginDialog.prototype.TEMPLATE =
		'<div style="padding: 5px;" id="userIdRow">'+
			'<div style="float: left; width: 150px;"><label id="userIdLabel" for="userId"></label></div>'+
			'<input id="userId" style="width: 200px;" value="">'+
		'</div>'+
		'<div style="padding: 5px;" id="passwordRow">'+
			'<div style="float: left; width: 150px;"><label id="passwordLabel" for="password"></label></div>'+
			'<input type="password" id="password" style="width: 200px;" value="">'+
		'</div>';

	CfLoginDialog.prototype._init = function(options) {
		this.options = options || {};
		this.title = this.options.title || "Cloud Foundry Login";
		this.modal = true;
		this.buttons = [{text: 'OK', isDefault: true, callback: this.done.bind(this)}];
		this._func = options.func;
		this._initialize();
	};
	CfLoginDialog.prototype._bindToDom = function() {
		this.$userIdLabel.appendChild(document.createTextNode("User Id:"));
		this.$passwordLabel.appendChild(document.createTextNode("Password:"));
	};
	
	CfLoginDialog.prototype.done = function() {
		this.options.func(this.$userId.value, this.$password.value);
		this.hide();
	};
	
	CfLoginDialog.prototype.constructor = CfLoginDialog;
	
	return  CfLoginDialog;
});