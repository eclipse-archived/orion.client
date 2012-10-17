/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/* global dojo dijit */
/* jslint browser:true */
define(['i18n!profile/nls/messages', 'dojo', 'dijit', 'dijit/Dialog', 'text!orion/profile/widgets/templates/NewUserDialog.html'], function(messages, dojo, dijit) {

/**
 * @param func
 */
dojo.declare("orion.profile.widgets.NewUserDialog", [ dijit.Dialog ], { //$NON-NLS-0$
	widgetsInTemplate : true,
	templateString : dojo.cache('orion', 'profile/widgets/templates/NewUserDialog.html'), //$NON-NLS-1$ //$NON-NLS-0$
	title : messages["Create New User"],

	constructor : function() {
		this.inherited(arguments);
		this.func = arguments[0] || function() {
		};
		this.registry = arguments[1];
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
		dojo.connect(this, "onKeyPress", dojo.hitch(this, function(evt) { //$NON-NLS-0$
			if (evt.keyCode === dojo.keys.ENTER) {
				this.domNode.focus(); // FF throws DOM error if textfield is
										// focused after dialog closes
				this._onSubmit();
			}
		}));
	},
	execute : function() {

		if (this.userName.value === "") {
			alert(messages["Provide user login!"]);
			return;
		}

		if (this.password.value !== this.passwordRetype.value) {
			alert(messages["Passwords don't match!"]);
			return;
		}
		
		var dialog = this;
		
		this.registry.getService("orion.core.user").createUser(dialog.userName.value, dialog.password.value, dialog.email.value).then(dialog.func, function(response) { //$NON-NLS-0$
			console.info(response);
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
				alert(messages["User could not be created."]);
			}
		}, function(error){
			console.info(error);
		});
		
	}
});
});