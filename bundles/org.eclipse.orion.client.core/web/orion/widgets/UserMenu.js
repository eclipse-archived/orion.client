/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window document localStorage*/

define(['i18n!orion/widgets/nls/messages', 'require', 'orion/webui/littlelib'], function(messages, require, lib) {
	
	function UserMenu(options) {
		this._init(options);		
	}
	UserMenu.prototype = /** @lends orion.widgets.UserMenu.UserMenu.prototype */ {
			
		_init: function(options) {
			this._dropdownNode = lib.node(options.dropdownNode);
			if (!this._dropdownNode) { throw "no dom node for dropdown found"; } //$NON-NLS-0$
			this._dropdown = options.dropdown;
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},
		
		isSingleService : function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) === 1;
		},
		hasServices: function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) > 0;
		},
		length: function(obj) {
			var length = 0;
			for(var prop in obj) {
				if(obj.hasOwnProperty(prop)) {
					length++;
				}
			}
			return length;
		},
		
		_renderAuthenticatedService: function(key, startIndex){
			var _self = this;
			var authService = this.authenticatedServices[key].authService;
			if(authService && authService.logout){
				var item = document.createElement("li");//$NON-NLS-0$
				var link = document.createElement("a"); //$NON-NLS-0$
				link.href = lib.NULLHREF; //$NON-NLS-0$
				var text = document.createTextNode(messages["Sign Out"]);
				link.appendChild(text);
				item.appendChild(link);
				this._dropdownNode.appendChild(item);
				link.addEventListener("click", function() { //$NON-NLS-0$
					authService.logout().then(function(){
						_self.addUserItem(key, authService, _self.authenticatedServices[key].label);
						localStorage.removeItem(key);
						localStorage.removeItem("lastLogin"); //$NON-NLS-0$
						//TODO: Bug 368481 - Re-examine localStorage caching and lifecycle
						for (var i = localStorage.length - 1; i >= 0; i--) {
							var name = localStorage.key(i);
							if (name && name.indexOf("/orion/preferences/user") === 0) { //$NON-NLS-0$
								localStorage.removeItem(name);
							}
						}
						authService.getAuthForm(window.location.href).then(function(formURL) {
							window.location = formURL;
						});
					});
				}, false);//$NON-NLS-0$
			}
		},
		

		renderServices: function(){
			this._dropdown.empty();
						 
			var item = document.createElement("li");//$NON-NLS-0$
			var link = document.createElement("a"); //$NON-NLS-0$
			link.href = require.toUrl("help/index.jsp"); //$NON-NLS-0$
			var text = document.createTextNode(messages["Help"]);//$NON-NLS-0$
			link.appendChild(text);
			item.appendChild(link);
			this._dropdownNode.appendChild(item);

			if(this.keyAssistFunction){
				item = document.createElement("li");//$NON-NLS-0$
				link = document.createElement("a"); //$NON-NLS-0$
				link.href = lib.NULLHREF;
				text = document.createTextNode(messages["Keyboard Shortcuts"]);//$NON-NLS-0$
				link.appendChild(text);
				item.appendChild(link);
				this._dropdownNode.appendChild(item);
				link.addEventListener("click", this.keyAssistFunction, false);//$NON-NLS-0$
			}
			
			// separator
			item = document.createElement("li"); //$NON-NLS-0$
			link = document.createElement("a"); //$NON-NLS-0$
			link.href = lib.NULLHREF;
			link.classList.add("dropdownSeparator"); //$NON-NLS-0$
			item.appendChild(link);
			this._dropdownNode.appendChild(item);
	
			item = document.createElement("li");//$NON-NLS-0$
			link = document.createElement("a"); //$NON-NLS-0$
			link.href = require.toUrl("settings/settings.html"); //$NON-NLS-0$
			text = document.createTextNode(messages["Settings"]);//$NON-NLS-0$
			link.appendChild(text);
			item.appendChild(link);
			this._dropdownNode.appendChild(item);

			if(this.isSingleService()){
				//add sign out only for single service.
				for(var i in this.authenticatedServices){
					if (this.authenticatedServices.hasOwnProperty(i)) {
						this._renderAuthenticatedService(i, 0);
					}
				}
			}
			
		},
		
		setKeyAssist: function(keyAssistFunction){
			this.keyAssistFunction = keyAssistFunction;
			this.renderServices();
		},
	
		addUserItem: function(key, authService, label, jsonData){
			if(jsonData){
				if(this.unauthenticatedServices[key]){
					delete this.unauthenticatedServices[key];
				}
				this.authenticatedServices[key] = {authService: authService, label: label, data: jsonData};
			}else{
				if(this.authenticatedServices[key]){
					delete this.authenticatedServices[key];
				}
				if(this.unauthenticatedServices[key]){
					this.unauthenticatedServices[key] = {authService: authService, label: label, pending: this.unauthenticatedServices[key].pending};
				}else{
					this.unauthenticatedServices[key] = {authService: authService, label: label};
				}
			}
			this.renderServices();
		}
	};
	UserMenu.prototype.constructor = UserMenu;
	//return the module exports
	return {UserMenu: UserMenu};

});
