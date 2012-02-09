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
		
		_renderAuthenticatedService: function(key, parent, startIndex){
			var _self = this;
			var authService = this.authenticatedServices[key].authService;
			var jsonData = this.authenticatedServices[key].data;
			if(!authService){
				var loginForm = this.authenticatedServices[key].SignInLocation;
				parent.addChild(new dijit.MenuItem({
					label: "Logged in to " + this.getHostname(loginForm)
				}), startIndex);
			}else {
				parent.addChild(new dijit.MenuItem({
					label: "Sign Out",
					onClick: dojo.hitch(this, function(authService, key){
						return function(){authService.logout().then(dojo.hitch(_self, function(){
							this.addUserItem(key, authService, this.authenticatedServices[key].label);
							localStorage.removeItem(key);
							}));};
						})(authService, key)
				}), startIndex);
				if(jsonData.Location){
					parent.addChild(new dijit.MenuItem({
						label: "<a href="+require.toUrl("profile/user-profile.html") + "#" + jsonData.Location+">Profile</a>",
						_onClick: function(evt) { this.getParent().onItemClick(this, evt); }
					}), startIndex+1);	
				}
			}
		},
		
		_renderUnauthenticatedService: function(key, parent, startIndex){
			var _self = this;
			var authService = this.unauthenticatedServices[key].authService;
			
			if(!authService){
				var loginForm = this.unauthenticatedServices[key].SignInLocation;
				if(loginForm.indexOf("?")==-1){
					loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
				}else{
					loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
				}
				parent.addChild(new dijit.MenuItem({
					label: "<a target='_blank' href="+loginForm+">Sign In</a>",
					_onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
				}), startIndex);
				
			}else if(authService.getAuthForm){
				dojo.hitch(_self, function(key){
					authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
						if(loginForm.indexOf("?")==-1){
							loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
						}else{
							loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
						}
						parent.addChild(new dijit.MenuItem({
							label: "<a target='_blank' href="+loginForm+">Sign In</a>",
							_onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
						}), startIndex);
					});
				})(key);
			}else if(authService.login){
				parent.addChild(new dijit.MenuItem({
					label: "<a target='_blank' style='cursor: hand;'>Sign In</a>",
					onClick:  dojo.hitch(_self, function(authService){
						return function(){authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);};
					})(authService)
				}), startIndex);
				
			}
		},
		
		renderServices: function(){
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				this.removeChild(children[i]);
			}
			if(this.isSingleService()){
				for(var i in this.authenticatedServices){
					this._renderAuthenticatedService(i, this, 0);
				}
				for(var i in this.unauthenticatedServices){
					this._renderUnauthenticatedService(i, this, 0);
				}
			}else{
				for(var i in this.authenticatedServices){
					var menu = new dijit.Menu();
					this.addChild(new dijit.PopupMenuItem({
						label: this.getUserLabel(this.authenticatedServices[i]),
						popup: menu
					}));
					this._renderAuthenticatedService(i, menu, 0);
				}
				for(var i in this.unauthenticatedServices){
					var menu = new dijit.Menu();
					this.addChild(new dijit.PopupMenuItem({
						label: this.getUserLabel(this.unauthenticatedServices[i]),
						popup: menu
					}));
					this._renderUnauthenticatedService(i, menu, 0);
				}
			}
			 this.addChild(new dijit.MenuSeparator());
			 this.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("settings/settings.html") + ">Settings</a>",
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
			 }));
			 this.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("operations/list.html") + ">Background Operations</a>",
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
			 }));
			 this.addChild(new dijit.MenuSeparator());
			 var menu = new dijit.Menu();
				this.addChild(new dijit.PopupMenuItem({
					label: "Help",
					popup: menu
				}));
			menu.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("help/index.jsp") + ">Documentation</a>",
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
			 }));
			if(this.keyAssistFunction){
				menu.addChild(new dijit.MenuItem({
					 label: "Keyboard Help",
					 onClick: this.keyAssistFunction
				 }));	
			}
		},
		
		getUserLabel: function(userData){
			if(userData.data){
				var userName = (userData.data.Name && userData.data.Name.replace(/^\s+|\s+$/g,"")!=="") ? userData.data.Name : userData.data.login;
				if(userName.length > 40)
					userName = userName.substring(0, 30) + "...";
				userName+=" ("+userData.label+")";
				return userName;
			} else {
				return userData.label;
			}
		},
		
		setKeyAssist: function(keyAssistFunction){
			this.keyAssistFunction = keyAssistFunction;
			this.renderServices();
		},
	
		addUserItem: function(key, authService, label, jsonData){
			var _self = this;
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
			
			if(!dojo.byId('userInfo')){
				return;
			}
			
			if(this.isSingleService() && jsonData){
				var userName = (jsonData.Name && jsonData.Name.replace(/^\s+|\s+$/g,"")!=="") ? jsonData.Name : jsonData.login;
				var displayName = userName;
				if(displayName.length > 40)
					displayName = displayName.substring(0, 30) + "...";
				dojo.create("a", {innerHTML: displayName,
						href: require.toUrl("profile/user-profile.html") + "#" + jsonData.Location,
						title: "View profile of " + userName
					}, dojo.byId('userInfo'), "only");
			}else if(this.isSingleService() && !jsonData){
				if(authService.getAuthForm){
					dojo.hitch(this, function(key){
						authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
							if(loginForm.indexOf("?")==-1){
								loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
							}else{
								loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
							}
							dojo.create("a", {innerHTML: "Sign In",
								href: loginForm,
								title: "Sign In",
								target: "_blank"
							}, dojo.byId('userInfo'), "only");
						});
					})(key);
				}else if(authService.login){
					dojo.create("a", {innerHTML: "Sign In",
						title: "Sign In",
						onClick:  function(){alert("login");authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);},
						style: 'cursor: hand;'
					}, dojo.byId('userInfo'), "only");
				}
			} else {
				dojo.create("a", {innerHTML: "Profiles",
						onClick: function(){
							dijit.popup.open({
					            popup: loginDialog,
					            around: dojo.byId('userInfo')
					        });	
						}
					}, dojo.byId('userInfo'), "only");				
			}
		},
	});
});
