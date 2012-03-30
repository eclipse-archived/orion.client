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

/*global define window eclipse localStorage*/

define(['require', 'dojo', 'dijit', 'orion/commands', 'orion/util', 'dijit/Menu'], function(require, dojo, dijit, mCommands, mUtil) {
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
		hasServices: function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) > 0;
		},
		length: function(obj) {
			var length = 0;
			for(var prop in obj) {
				if(obj.hasOwnProperty(prop))
					length++;
			}
			return length;
		},
		
		_renderAuthenticatedService: function(key, startIndex, who){
			var _self = this;
			var authService = this.authenticatedServices[key].authService;
			if(authService && authService.logout){
					this.addChild(new dijit.MenuItem({
						label: who ? "Sign Out " + who : "Sign Out",
						onClick: dojo.hitch(this, function(authService, key){
							return function(){authService.logout().then(dojo.hitch(_self, function(){
								this.addUserItem(key, authService, this.authenticatedServices[key].label);
								localStorage.removeItem(key);
								}));};
							})(authService, key)
					}), startIndex);
			}
		},
		
		_renderUnauthenticatedService: function(key, startIndex, where){
			var _self = this;
			var authService = this.unauthenticatedServices[key].authService;
			
			if(!authService){
				var loginForm = this.unauthenticatedServices[key].SignInLocation;
				if(loginForm.indexOf("?")==-1){
					loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
				}else{
					loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key;
				}
				this.addChild(new dijit.MenuItem({
					label: where ? "<a target='_blank' href="+loginForm+">Sign In To "+ where +"</a>" : "<a target='_blank' href="+loginForm+">Sign In</a>",
					onKeyDown: function(evt){if(evt.keyCode===13) window.open(loginForm);},
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
						_self.addChild(new dijit.MenuItem({
							label: where ? "<a target='_blank' href="+loginForm+">Sign In To "+where+"</a>" : "<a target='_blank' href="+loginForm+">Sign In</a>",
							onKeyDown: function(evt){if(evt.keyCode===13) window.open(loginForm);},
							_onClick: function(evt) { this.getParent().onItemClick(this, evt); } 
						}), startIndex);
					});
				})(key);
			}else if(authService.login){
				this.addChild(new dijit.MenuItem({
					label: where ? "Sign In To " + where : "Sign In",
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
				//add sign out only for single service.
				//When there are more services user may use Sign out on the tooltip that is always available 
				for(var i in this.authenticatedServices){
					this._renderAuthenticatedService(i, 0);
				}
			}
			 this.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("settings/settings.html") + ">Settings</a>",
				 onKeyDown: function(evt){
					if(evt.keyCode === 13 || evt.keyCode === 32) {
						if(evt.ctrlKey) {
							window.open(require.toUrl("settings/settings.html"));
						} else {
							window.location=require.toUrl("settings/settings.html");
						}
					}
				 },
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
			 }));
			 this.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("operations/list.html") + ">Background Operations</a>",
				 onKeyDown: function(evt){
					if(evt.keyCode === 13 || evt.keyCode === 32) {
						if(evt.ctrlKey) {
							window.open(require.toUrl("operations/list.html"));
						} else {
							window.location=require.toUrl("operations/list.html");
						}
					}
				 },
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
			 }));
			 this.addChild(new dijit.MenuSeparator());
			this.addChild(new dijit.MenuItem({
				 label: "<a href="+require.toUrl("help/index.jsp") + ">Help</a>",
				 onKeyDown: function(evt){
					if(evt.keyCode === 13 || evt.keyCode === 32) {
						if(evt.ctrlKey) {
							window.open(require.toUrl("help/index.jsp"));
						} else {
							window.location=require.toUrl("help/index.jsp");
						}
					}
				 },
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
			 }));
			if(this.keyAssistFunction){
				this.addChild(new dijit.MenuItem({
					 label: "Keyboard Help",
					 onClick: this.keyAssistFunction
				 }));	
			}
			
			this.addChild(new dijit.MenuItem({
				 label: "<a href='"+require.toUrl("help/about.html") + "'>About Orion</a>",
				 onKeyDown: function(evt){
					if(evt.keyCode === 13 || evt.keyCode === 32) {
						if(evt.ctrlKey) {
							window.open(require.toUrl("help/about.html"));
						} else {
							window.location=require.toUrl("help/about.html");
						}
					}
				 },
				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
			 }));
			
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
				var profileLink = dojo.create("a", {innerHTML: displayName,
									  href: require.toUrl("profile/user-profile.html") + "#" + jsonData.Location,
									  "aria-label": "View profile of " + userName,
									  style: "margin-right: 0px"
								  }, dojo.byId('userInfo'), "only");
				new mCommands.CommandTooltip({
					connectId: [profileLink],
					label: "View profile of " + userName,
					position: ["above", "left", "right", "below"] // otherwise defaults to right and obscures adjacent commands
				});
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
								style: "margin-right: 0px",
								target: "_blank"
							}, dojo.byId('userInfo'), "only");
						});
					})(key);
				}else if(authService.login){
					var a = dojo.create("a", {innerHTML: "Sign In",
						style: "margin-right: 0px"
					}, dojo.byId('userInfo'), "only");
					
					dojo.connect(a, "onmouseover", a, function() {
						a.style.cursor = "pointer";
					});
					dojo.connect(a, "onmouseout", a, function() {
						a.style.cursor = "default";
					});
					
					dojo.connect(a, "onclick", function(){
							authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);
						});
					
				}
			} else if(this.hasServices()) {
				var a = dojo.create("a", {innerHTML: "Profiles",
					style: "margin-right: 0px"
					}, dojo.byId('userInfo'), "only");
				
				dojo.connect(a, "onmouseover", a, function() {
					a.style.cursor = "pointer";
				});
				dojo.connect(a, "onmouseout", a, function() {
					a.style.cursor = "default";
				});
				
				dojo.connect(a, "onclick", function(){
					try{
						dijit.popup.open({
				            popup: _self.options.loginDialog,
				            around: dojo.byId('userInfo')
				        });
					}catch (e) {/*Known key is null FF error*/}
						dijit.focus(_self.options.loginDialog.domNode);
					});
				
			} else {
				dojo.empty(dojo.byId('userInfo'));
			}
		}
	});
});
