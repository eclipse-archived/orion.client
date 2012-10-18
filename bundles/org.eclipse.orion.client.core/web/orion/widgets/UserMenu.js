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

define(['i18n!orion/widgets/nls/messages', 'require', 'dojo', 'dijit', 'orion/commands', 'dijit/Menu'], function(messages, require, dojo, dijit, mCommands) {
	dojo.declare("orion.widgets.UserMenu", [dijit.Menu], {
	
		widgetsInTemplate: false,
		id: "userMenu", //$NON-NLS-0$
		
		templateString: '<table role="menu" tabIndex="${tabIndex}" dojoAttachEvent="onkeypress:_onKeyPress" cellspacing="0">' + //$NON-NLS-0$
						'<tbody class="dijitReset" dojoAttachPoint="containerNode"></tbody>' + //$NON-NLS-0$
						'</table>', //$NON-NLS-0$
		
		label: messages['test'],
		
		postCreate : function() {
			this.inherited(arguments);
			
			dojo.style( this.domNode, 'border-radius', '3px' ); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style( this.domNode, 'border', '1px solid #DDD' ); //$NON-NLS-1$ //$NON-NLS-0$
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
					this.addChild(new mCommands.CommandMenuItem({
						label: who ? messages["Sign Out "] + who : messages["Sign Out"],
						onClick: dojo.hitch(this, function(authService, key){
							return function(){
								authService.logout().then(dojo.hitch(_self, function(){
									this.addUserItem(key, authService, this.authenticatedServices[key].label);
									localStorage.removeItem(key);
									localStorage.removeItem("lastLogin");
									//TODO: Bug 368481 - Re-examine localStorage caching and lifecycle
									for (var i = localStorage.length - 1; i >= 0; i--) {
										var name = localStorage.key(i);
										if (name && name.indexOf("/orion/preferences/user") === 0) {
											localStorage.removeItem(name);
										}
									}
									authService.getAuthForm(window.location.href).then(function(formURL) {
										window.location = formURL;
									});
								}));
							};
						})(authService, key)
					}));
			}
		},
		
		_renderUnauthenticatedService: function(key, startIndex, where){
			var _self = this;
			var authService = this.unauthenticatedServices[key].authService;
			
			if(!authService){
				var loginForm = this.unauthenticatedServices[key].SignInLocation;
				if(loginForm.indexOf("?")===-1){ //$NON-NLS-0$
					loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
				}else{
					loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
				}
				this.addChild(new mCommands.Command.MenuItem({
					label: where ? "<a target='_blank' href="+loginForm+">"+messages["Sign In To "]+ where +"</a>" : "<a target='_blank' href="+loginForm+">"+messages["Sign In"]+"</a>", //$NON-NLS-8$ //$NON-NLS-6$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
					hasLink: true
				}), startIndex);
				
			}else if(authService.getAuthForm){
				dojo.hitch(_self, function(key){
					authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
						if(loginForm.indexOf("?")===-1){ //$NON-NLS-0$
							loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
						}else{
							loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
						}
						_self.addChild(new mCommands.CommandMenuItem({
							label: where ? "<a target='_blank' href="+loginForm+">"+messages['Sign In To ']+where+"</a>" : "<a target='_blank' href="+loginForm+">"+messages["Sign In"]+"</a>", //$NON-NLS-7$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
							hasLink: true
						}), startIndex);
					});
				})(key);
			}else if(authService.login){
				this.addChild(new mCommands.CommandMenuItem({
					label: where ? "Sign In To " + where : "Sign In", //$NON-NLS-1$ //$NON-NLS-0$
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
			
//			 this.addChild(new dijit.MenuItem({
//				 label: "<a href="+require.toUrl("operations/list.html") + ">Background Operations</a>",
//				 onKeyDown: function(evt){
//					if(evt.keyCode === 13 || evt.keyCode === 32) {
//						if(evt.ctrlKey) {
//							window.open(require.toUrl("operations/list.html"));
//						} else {
//							window.location=require.toUrl("operations/list.html");
//						}
//					}
//				 },
//				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
//			 }));
			 
			this.addChild(new mCommands.CommandMenuItem({
				 label: "<a href="+require.toUrl("help/index.jsp") + ">"+messages["Help"]+"</a>", //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				 hasLink: true
			 }));
			if(this.keyAssistFunction){
				this.addChild(new mCommands.CommandMenuItem({
					 label: messages["Keyboard Shortcuts"],
					 onClick: this.keyAssistFunction
				 }));	
			}
			
			this.addChild(new dijit.MenuSeparator());
			
			
			 this.addChild(new mCommands.CommandMenuItem({
				 label: "<a href="+require.toUrl("settings/settings.html") + ">"+messages["Settings"]+"</a>", //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				 hasLink: true
			 }));
			 
			 if(this.isSingleService()){
				//add sign out only for single service.
				//When there are more services user may use Sign out on the tooltip that is always available 
				for(var i in this.authenticatedServices){
					this._renderAuthenticatedService(i, 0);
				}
			}
			
//			this.addChild(new dijit.MenuItem({
//				 label: "<a href='"+require.toUrl("help/about.html") + "'>About Orion</a>",
//				 onKeyDown: function(evt){
//					if(evt.keyCode === 13 || evt.keyCode === 32) {
//						if(evt.ctrlKey) {
//							window.open(require.toUrl("help/about.html"));
//						} else {
//							window.location=require.toUrl("help/about.html");
//						}
//					}
//				 },
//				 _onClick: function(evt) { this.getParent().onItemClick(this, evt); }
//			 }));
			
		},
		
		getUserLabel: function(userData){
			if(userData.data){
				var userName = (userData.data.Name && userData.data.Name.replace(/^\s+|\s+$/g,"")!=="") ? userData.data.Name : userData.data.login; //$NON-NLS-0$
				if(userName.length > 40)
					userName = userName.substring(0, 30) + "..."; //$NON-NLS-0$
				userName+=" ("+userData.label+")"; //$NON-NLS-1$ //$NON-NLS-0$
				return userName;
			} else {
				return userData.label;
			}
		},
		
		setUserName: function( name ){
		
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
			
			if(!dojo.byId('userInfo')){ //$NON-NLS-0$
				return;
			}
			
			if(this.isSingleService() && jsonData){
				var userName = (jsonData.Name && jsonData.Name.replace(/^\s+|\s+$/g,"")!=="") ? jsonData.Name : jsonData.login; //$NON-NLS-0$
				var displayName = userName;
				if(displayName.length > 40)
					displayName = displayName.substring(0, 30) + "..."; //$NON-NLS-0$
				var profileLink = dojo.create("a", { //$NON-NLS-0$
									  href: require.toUrl("profile/user-profile.html") + "#" + jsonData.Location, //$NON-NLS-1$ //$NON-NLS-0$
									  style: "margin-right: 0px" //$NON-NLS-0$
								  }, dojo.byId('userInfo'), "only"); //$NON-NLS-1$ //$NON-NLS-0$
				profileLink.textContent = displayName;
				profileLink.setAttribute("aria-label", messages["View profile of "] + userName); //$NON-NLS-0$
				new mCommands.CommandTooltip({
					connectId: [profileLink],
					label: messages['View profile of '] + userName,
					position: ["above", "left", "right", "below"] // otherwise defaults to right and obscures adjacent commands //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}else if(this.isSingleService() && !jsonData){
				if(authService.getAuthForm){
					dojo.hitch(this, function(key){
						authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm){
							if(loginForm.indexOf("?")===-1){ //$NON-NLS-0$
								loginForm+= "?redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
							}else{
								loginForm+= "&redirect=" + eclipse.globalCommandUtils.notifyAuthenticationSite + "?key=" + key; //$NON-NLS-1$ //$NON-NLS-0$
							}
							var link = dojo.create("a", { //$NON-NLS-0$
								href: loginForm,
								style: "margin-right: 0px", //$NON-NLS-0$
								target: "_blank" //$NON-NLS-0$
							}, dojo.byId('userInfo'), "only"); //$NON-NLS-1$ //$NON-NLS-0$
							link.textContent = messages['Sign In'];
						});
					})(key);
				}else if(authService.login){
					var a = dojo.create("a", { //$NON-NLS-0$
						style: "margin-right: 0px" //$NON-NLS-0$
					}, dojo.byId('userInfo'), "only"); //$NON-NLS-1$ //$NON-NLS-0$
					a.textContent = messages['Sign In'];
					
					dojo.connect(a, "onmouseover", a, function() { //$NON-NLS-0$
						a.style.cursor = "pointer"; //$NON-NLS-0$
					});
					dojo.connect(a, "onmouseout", a, function() { //$NON-NLS-0$
						a.style.cursor = "default"; //$NON-NLS-0$
					});
					
					dojo.connect(a, "onclick", function(){ //$NON-NLS-0$
							authService.login(eclipse.globalCommandUtils.notifyAuthenticationSite);
						});
					
				}
			} else {
				dojo.empty(dojo.byId('userInfo')); //$NON-NLS-0$
			}
		}
	});
});
