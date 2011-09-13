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

define(['dojo', 'dijit', 'dijit/TooltipDialog', 'text!orion/widgets/templates/LoginDialog.html'], function(dojo, dijit) {
	
	dojo.declare("orion.widgets.LoginDialog", [dijit.TooltipDialog], {
		widgetsInTemplate: true,
		templateString: dojo.cache('orion', 'widgets/templates/LoginDialog.html'),

		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this.pendingAuthServices = {};
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},
	
		setPendingAuthentication: function(services){
		if(this.isEmpty(services)){
			this.pendingAuthenticationList.style.display = 'none';
			dijit.popup.hide(this);
			return;
		}
		this.pendingAuthentication.style.display = '';
		this.pendingAuthServices = services;
		dojo.empty(this.pendingAuthenticationList);
		for(var i in this.pendingAuthServices){
			var li = dojo.create("li");
			dojo.place(document.createTextNode(services[i].SignInKey + ": "), li, "only");
			
			if(this.pendingAuthServices[i].SignInLocation.toString().indexOf("?")==-1){
				dojo.create("a", {target: "_blank", href: this.pendingAuthServices[i].SignInLocation + "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + services[i].SignInKey, innerHTML: "Sign in"}, li, "last");
			}else{
				dojo.create("a", {target: "_blank", href: this.pendingAuthServices[i].SignInLocation + "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + services[i].SignInKey, innerHTML: "Sign in"}, li, "last");
			}
			
			dojo.place(li, this.pendingAuthenticationList, "last");
		}
		
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
			this.unauthenticatedServices[key] = {authService: authService, label: label};
		}
		dojo.hitch(this, this.renderAuthenticatedServices)();
		dojo.hitch(this, this.renderUnauthenticatedServices)();
	},
	
	renderAuthenticatedServices: function(){
		dojo.empty(this.authenticatedList);
		this.authenticated.style.display = this.isEmpty(this.authenticatedServices) ? 'none' : '';
		var self = this;
		for(var i in this.authenticatedServices){
			var li = dojo.create("li");
			dojo.place(document.createTextNode(i + ": "), li, "only");
			var jsonData = this.authenticatedServices[i].data;
			var authService = this.authenticatedServices[i].authService;
			if(jsonData.Location)
				dojo.create("a", {href: ("/profile/user-profile.html#" + jsonData.Location), innerHTML: "Profile"}, li, "last");
			dojo.place(document.createTextNode(" "), li, "last");
			if(authService.logout){
				var a = dojo.create("a", {
					innerHTML: "Sign out"
				}, li, "last");
				
				dojo.connect(a, "onmouseover", a, function() {
					a.style.cursor = "pointer";
				});
				dojo.connect(a, "onmouseout", a, function() {
					a.style.cursor = "default";
				});
				
				dojo.connect(a, "onclick",  function(){
					authService.logout().then(dojo.hitch(self, function(){
						this.addUserItem(i, authService, this.authenticatedServices[i].label);
						localStorage.removeItem(i);
						}));
					});
			}
				
			//TODO
			dojo.place(li, this.authenticatedList, "last");
		}
		
		
	},
	
	renderUnauthenticatedServices: function(){
		dojo.empty(this.otherUnauthenticatedList);
		this.otherUnauthenticated.style.display = this.isEmpty(this.unauthenticatedServices) ? 'none' : '';
		for(var i in this.unauthenticatedServices){
			var li = dojo.create("li");
			dojo.place(document.createTextNode(i + ": "), li, "only");
			var authService = this.unauthenticatedServices[i].authService;
			
			if(authService.getAuthForm){
				dojo.hitch(this, function(li){
				authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
					
					if(loginForm.indexOf("?")==-1){
						dojo.create("a", {target: "_blank", href: loginForm + "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, li, "last");
					}else{
						dojo.create("a", {target: "_blank", href: loginForm + "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, li, "last");
					}
					
				});
				})(li);
			}else if(authService.login){
				
				var a = dojo.create("a", {innerHTML: "Sign in", style: "cursor: hand;"}, li, "last");
				dojo.connect(a, "onmouseover", a, function() {
					a.style.cursor = "pointer";
				});
				dojo.connect(a, "onmouseout", a, function() {
					a.style.cursor = "default";
				});
				dojo.connect(a, "onclick",function(){authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);});
				
			}
					
			dojo.place(li, this.otherUnauthenticatedList, "last");
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