/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/* global dojo dijit */
/* jslint browser:true */
define(['dojo', 'dijit', 'dijit/Dialog', 'text!orion/profile/widgets/templates/ResetPasswordDialog.html'], function(dojo, dijit) {

/**
 * @param func
 */
dojo.declare("orion.profile.widgets.ResetPasswordDialog", [ dijit.Dialog ], {
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'profile/widgets/templates/ResetPasswordDialog.html'),

	constructor : function() {
		this.inherited(arguments);
		this.user = arguments[0].user;
		this.func = arguments[0].func || function() {};
		this.registry = arguments[0].registry;
		this.title = "Change password for " + this.user.login;
	},
	onHide : function() {
		// This assumes we don't reuse the dialog
		this.inherited(arguments);
		setTimeout(dojo.hitch(this, function() {
			this.destroyRecursive(); // TODO make sure this removes DOM
			// elements
		}), this.duration);
	},
	postCreate : function() {
		this.inherited(arguments);
		dojo.connect(this, "onKeyPress", dojo.hitch(this, function(evt) {
			if (evt.keyCode === dojo.keys.ENTER) {
				this.domNode.focus(); // FF throws DOM error if textfield is
										// focused after dialog closes
				this._onSubmit();
			}
		}));
	},
	execute : function() {

		if (this.password.value !== this.passwordRetype.value) {
			alert("Passwords don't match!");
			return;
		}
		
		var dialog = this;
		
		this.registry.getService("orion.core.user").resetUserPassword(dialog.user.login, dialog.password.value).then(dialog.func, function(response) {
		  var message = response.message;
		  try{
			  if(response.responseText){
				  message = JSON.parse(response.responseText).Message;
			  }
		  }catch(Exception){
			  //leave standard message
		  }
	  
			if (message) {
				alert(message);
			} else {
				alert("Password reset failed");
			}
		});
		
	}
});
});