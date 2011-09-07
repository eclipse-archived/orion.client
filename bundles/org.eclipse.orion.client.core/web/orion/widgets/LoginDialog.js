/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/


define(['dojo', 'dijit', 'dijit/Dialog', 'dijit/form/CheckBox', 'dijit/form/CheckBox', 'dijit/form/Form', 'dijit/form/ValidationTextBox', 'dojo/data/ItemFileReadStore',  'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/LoginDialog.html'], function(dojo, dijit) {

/**
 * @param options {{ 
 *     title: string,
 *     label: string,
 *     func: function,
 *     [advanced]: boolean  // Whether to show advanced controls. Default is false
 * }}
 */
dojo.declare("orion.widgets.LoginDialog", [dijit.Dialog, orion.widgets._OrionDialogMixin], {
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/LoginDialog.html'),
	
	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},
	postMixInProperties: function(){
		this.inherited(arguments);
		this.title = "Authentication required!";
	},
	setAuthenticationServices: function(services){
		if(this.isEmpty(services)){
			this.hide();
			return;
		}
		dojo.empty(this.servicesList);
		for(var i in services){
			var li = dojo.create("li");
			dojo.place(document.createTextNode(services[i].SignInKey + ": "), li, "only");
			
			if(services[i].SignInLocation.toString().indexOf("?")==-1){
				dojo.create("a", {target: "_blank", href: services[i].SignInLocation + "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + services[i].SignInKey, innerHTML: "Sign in"}, li, "last");
			}else{
				dojo.create("a", {target: "_blank", href: services[i].SignInLocation + "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + services[i].SignInKey, innerHTML: "Sign in"}, li, "last");
			}
			
			dojo.place(li, this.servicesList, "last");
		}
		
	},
	isEmpty: function(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop))
				return false;
		}
		return true;
	}
});

});