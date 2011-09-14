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
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},
	
		setPendingAuthentication: function(services){
			
			for(var i in this.unauthenticatedServices){
				delete this.unauthenticatedServices[i].pending;
			}
			
			for(var i in services){
				if(this.unauthenticatedServices[services[i].SignInKey]){
					this.unauthenticatedServices[services[i].SignInKey].pending = true;
				}else{
					this.unauthenticatedServices[services[i].SignInKey] = {label: services[i].SignInKey, SignInLocation: services[i].SignInLocation, pending: true};
				}
			}
			this.renderUnauthenticatedServices();
		
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
		dojo.hitch(this, this.renderAuthenticatedServices)();
		dojo.hitch(this, this.renderUnauthenticatedServices)();
	},
	
	renderAuthenticatedServices: function(){
		dojo.empty(this.authenticatedList);
		this.authenticated.style.display = this.isEmpty(this.authenticatedServices) ? 'none' : '';
		var self = this;
		var isFirst = true;
		for(var i in this.authenticatedServices){
			if(!isFirst){
				var tr = dojo.create("tr", null, this.authenticatedList);
				dojo.create("td", {style: "padding: 0; margin 0;" ,colspan: 2, innerHTML: "<hr style='border-bottom: medium none; border-top: 1px solid #D3D3D3; color: gray; height: 0; margin: 2px;'>"}, tr);
			}
			isFirst = false;
			var tr = dojo.create("tr", {className: "navTableHeading"});
			var td = dojo.create("td", {innerHTML: "<h2>" + i + "</h2>"}, tr, "only");
			dojo.addClass(td, "LoginWindowLeft");
			td = dojo.create("td", {style: "text-align: right"}, tr, "last");
			dojo.addClass(td, "LoginWindowRight");
			var jsonData = this.authenticatedServices[i].data;
			var authService = this.authenticatedServices[i].authService;
			if(jsonData.Location)
				dojo.create("a", {href: ("/profile/user-profile.html#" + jsonData.Location), innerHTML: "Profile"}, td, "last");
			dojo.place(document.createTextNode(" "), td, "last");
			if(authService.logout){
				var a = dojo.create("a", {
					innerHTML: "Sign out"
				}, td, "last");
				
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
			dojo.place(tr, this.authenticatedList, "last");
			
			var lastLogin = "N/A";
			if (jsonData && jsonData.lastlogintimestamp) {
				lastLogin = dojo.date.locale.format(new Date(jsonData.lastlogintimestamp), {formatLength: "short"});
			}
			var userName = (jsonData.Name && jsonData.Name.replace(/^\s+|\s+$/g,"")!=="") ? jsonData.Name : jsonData.login;
			tr = dojo.create("tr");
			if(userName.length>40){
				td = dojo.create("td", {innerHTML: userName.substring(0, 30) + '... ' + "logged in since " + lastLogin, colspan: 2, title: userName + ' ' + "logged in since " + lastLogin}, tr, "only");
			}else{
				td = dojo.create("td", {innerHTML: userName + ' ' + "logged in since " + lastLogin, colspan: 2}, tr, "only");
			}
			dojo.addClass(td, "LoginWindowLeft");
			dojo.addClass(td, "LoginWindowRight");
			dojo.addClass(td, "LoginWindowComment");
			dojo.place(tr, this.authenticatedList, "last");
		}
		
		
	},
	
	renderUnauthenticatedServices: function(){
		dojo.empty(this.otherUnauthenticatedList);
		this.otherUnauthenticated.style.display = this.isEmpty(this.unauthenticatedServices) ? 'none' : '';
		var isFirst = true;
		for(var i in this.unauthenticatedServices){
			if(!isFirst || !this.isEmpty(this.authenticatedServices)){
				var tr = dojo.create("tr", null, this.otherUnauthenticatedList);
				dojo.create("td", {style: "padding: 0; margin 0;" ,colspan: 2, innerHTML: "<hr style='border-bottom: medium none; border-top: 1px solid #D3D3D3; color: gray; height: 0; margin: 2px;'>"}, tr);
			}
			isFirst = false;
			var tr = dojo.create("tr", {className: "navTableHeading"});
			var td = dojo.create("td", null, tr, "only");
			dojo.addClass(td, "LoginWindowLeft");
			var h2 = dojo.create("h2", {innerHTML: i}, td, "only");
			td = dojo.create("td", {style: "text-align: right"}, tr, "last");
			dojo.addClass(td, "LoginWindowRight");

			var authService = this.unauthenticatedServices[i].authService;
			
			if(!authService){
				var loginForm = this.unauthenticatedServices[i].SignInLocation;
				if(loginForm.indexOf("?")==-1){
					dojo.create("a", {target: "_blank", href: loginForm + "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, td, "last");
				}else{
					dojo.create("a", {target: "_blank", href: loginForm + "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, td, "last");
				}
			}else if(authService.getAuthForm){
				dojo.hitch(this, function(td){
				authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
					
					if(loginForm.indexOf("?")==-1){
						dojo.create("a", {target: "_blank", href: loginForm + "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, td, "last");
					}else{
						dojo.create("a", {target: "_blank", href: loginForm + "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i, innerHTML: "Sign in"}, td, "last");
					}
					
				});
				})(td);
			}else if(authService.login){
				
				var a = dojo.create("a", {innerHTML: "Sign in", style: "cursor: hand;"}, td, "last");
				dojo.connect(a, "onmouseover", a, function() {
					a.style.cursor = "pointer";
				});
				dojo.connect(a, "onmouseout", a, function() {
					a.style.cursor = "default";
				});
				dojo.connect(a, "onclick",function(){authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);});
				
			}
					
			dojo.place(tr, this.otherUnauthenticatedList, "last");
			if(this.unauthenticatedServices[i].pending){
				tr = dojo.create("tr");
				td = dojo.create("td", {innerHTML: "Authentication required!", style: "padding-left: 10px", colspan: 2}, tr, "only");
				dojo.addClass(td, "LoginWindowLeft");
				dojo.addClass(td, "LoginWindowRight");
				dojo.create("img", {src: "/images/warning.gif", style: "padding-right: 4px; vertical-align: bottom; padding-bottom: 2px;"}, td, "first");
				dojo.place(tr, this.otherUnauthenticatedList, "last");
			}
		}
	},
	isEmpty: function(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop))
				return false;
		}
		return true;
	},
	getHostname : function(url) {
		var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
	    var img = document.createElement('img');
	    img.src = url; // set string url
	    url = img.src; // get qualified url
	    img.src = null; // no server request
		return url.match(re)[1].toString();
		}
	
	});
});