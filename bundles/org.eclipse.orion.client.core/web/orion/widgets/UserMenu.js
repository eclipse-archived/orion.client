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

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/Menu'], function(require, dojo, dijit, mUtil) {
	dojo.declare("orion.widgets.UserMenu", [dijit.Menu], {
		widgetsInTemplate: false,
		id: "userMenu",
		postCreate : function() {
			this.inherited(arguments);
		},
		
		constructor : function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},
		
		isSingleService : function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) === 1;
		},
		length: function(obj) {
			var length = 0;
			for(var prop in obj) {
				if(obj.hasOwnProperty(prop))
					length++;
			}
			return length;
		},
		
		renderServices: function(){
			var _self = this;
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				this.removeChild(children[i]);
			}
			if(this.isSingleService()){
				for(var i in this.authenticatedServices){
					var authService = this.authenticatedServices[i].authService;
					var jsonData = this.authenticatedServices[i].data;
					if(!authService){
						var loginForm = this.authenticatedServices[i].SignInLocation;
						this.addChild(new dijit.MenuItem({
							label: "Logged in to " + this.getHostname(loginForm)
						}));
					}else {
						this.addChild(new dijit.MenuItem({
							label: "Sign Out",
							onClick: dojo.hitch(_self, function(authService, i){
								return function(){authService.logout().then(dojo.hitch(_self, function(){
									this.addUserItem(i, authService, this.authenticatedServices[i].label);
									if(this.isSingleService()){
										if(dijit.popup.hide)
											dijit.popup.hide(this); //close doesn't work on FF
										dijit.popup.close(this);
									}
									localStorage.removeItem(i);
									}));};
								})(authService, i)
						}));
						if(jsonData.Location){
							this.addChild(new dijit.MenuItem({
								label: "<a href="+require.toUrl("profile/user-profile.html") + "#" + jsonData.Location+">Profile</a>"
							}));	
						}
					}
					for(var i in this.unauthenticatedServices){
						var authService = this.unauthenticatedServices[i].authService;
						
						if(!authService){
							var loginForm = this.unauthenticatedServices[i].SignInLocation;
							if(loginForm.indexOf("?")==-1){
								loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i;
							}else{
								loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i;
							}
							this.addChild(new dijit.MenuItem({
								label: "<a target='_blank' href="+loginForm+">Sign In</a>"
							}));
							
						}else if(authService.getAuthForm){
							dojo.hitch(_self, function(i){
								authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
									if(loginForm.indexOf("?")==-1){
										loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i;
									}else{
										loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + i;
									}
									this.addChild(new dijit.MenuItem({
										label: "<a target='_blank' href="+loginForm+">Sign In</a>"
									}));
								});
							})(i);
						}else if(authService.login){
							
							dojo.place(document.createTextNode(this.unauthenticatedServices[i].label ? this.unauthenticatedServices[i].label : i), h2, "only");
							
							var a = dojo.create("a", {innerHTML: "Sign in", style: "cursor: hand;"}, td, "last");
/*							dojo.connect(a, "onmouseover", a, function() {
								a.style.cursor = "pointer";
							});
							dojo.connect(a, "onmouseout", a, function() {
								a.style.cursor = "default";
							});*/
							
							this.addChild(new dijit.MenuItem({
								label: "<a target='_blank' style='cursor: hand;'>Sign In</a>",
								onClick:  dojo.hitch(_self, function(authService){
									return function(){authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);};
								})(authService)
							}));
							
						}
					}
				}
			}else{
				
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
				if(this.unauthenticatedServices[key]){
					this.unauthenticatedServices[key] = {authService: authService, label: label, pending: this.unauthenticatedServices[key].pending};
				}else{
					this.unauthenticatedServices[key] = {authService: authService, label: label};
				}
			}
			dojo.hitch(this, this.renderServices)();
			
			if(!dijit.byId('logins')){
				return;
			}
			
			if(this.isSingleService() && jsonData){
				var userName = (jsonData.Name && jsonData.Name.replace(/^\s+|\s+$/g,"")!=="") ? jsonData.Name : jsonData.login;
				if(userName.length > 40)
					userName = userName.substring(0, 30) + "...";
				dijit.byId('logins').setLabel(userName);
			}else{
				dijit.byId('logins').setLabel("Security");
			}
		},
	});
});
