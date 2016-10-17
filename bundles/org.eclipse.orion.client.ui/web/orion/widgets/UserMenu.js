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
/*eslint-env browser, amd*/
define([
	'i18n!orion/widgets/nls/messages',
	'orion/webui/littlelib',
	'orion/PageLinks',
	'orion/webui/dropdown',
	'orion/util',
	'orion/webui/dialog',
	'orion/xhr'
], function(messages, lib, PageLinks, Dropdown, util, dialog, xhr) {
	
	function UserMenu(options) {
		this._displaySignOut = true;
		this._init(options);		
	}
	UserMenu.prototype = /** @lends orion.widgets.UserMenu.UserMenu.prototype */ {
			
		_init: function(options) {
			this._dropdownNode = lib.node(options.dropdownNode);
			if (!this._dropdownNode) { throw "no dom node for dropdown found"; } //$NON-NLS-0$
			this._dropdown = options.dropdown;
			this._serviceRegistry = options.serviceRegistry;
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
			//Options to customize all drop down items 
			this._noSeparator = options.noSeparator;
			this._dropDownItemClass = options.dropDownItemClass;
			this._keyAssistClass = options.keyAssistClass;
			if( options.signOut !== undefined ){
				this._displaySignOut = options.signOut;
			}
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
		
		_makeMenuItem: function(name, click) {
			var li = Dropdown.createMenuItem(name);
			var element = li.firstElementChild;
			if(typeof this._dropDownItemClass === "string") {//$NON-NLS-0$
				if(this._dropDownItemClass !== "") {
					element.classList.add(this._dropDownItemClass);
				}
			}
			
			element.addEventListener("click", click, false); //$NON-NLS-0$
			// onClick events do not register for spans when using the keyboard
			element.addEventListener("keydown", function(e) { //$NON-NLS-0$
				if (e.keyCode === lib.KEY.ENTER || e.keyCode === lib.KEY.SPACE) {	
					click();
				}
			}, false);
			return element;
		},
		
		_renderAuthenticatedService: function(key, startIndex){
			var _self = this;
			var authService = this.authenticatedServices[key].authService;
			if (authService && authService.logout && this._displaySignOut){
				if (!util.isElectron) {
					var element = this._makeMenuItem(messages["Sign Out"], function() {
						authService.logout().then(function(){
							_self.addUserItem(key, authService, _self.authenticatedServices[key].label);
							localStorage.removeItem(key);
							//TODO: Bug 368481 - Re-examine localStorage caching and lifecycle
							for (var i = localStorage.length - 1; i >= 0; i--) {
								var name = localStorage.key(i);
								if (name && name.indexOf("/orion/preferences/user") === 0) { //$NON-NLS-0$
									localStorage.removeItem(name);
								}
							}
							authService.getAuthForm(PageLinks.getOrionHome()).then(function(formURL) {
								window.location = formURL;
							});
						});
					});
					this._dropdownNode.appendChild(element.parentNode);
				}
			}
		},
		
		/*
		Category user.0 [
		                [ <Contributed links>
		                [ Keyboard Shortcuts
		---Separator---
		Category user.1 [
		                [ <Contributed links>
		                [ <Service sign-out links>
		[...]
		Category user.N [
		                [< Contributed links>
		*/
		renderServices: function(){
			var doc = document;
			var categories = [];
			function getCategory(number) {
				if (!categories[number]) {
					categories[number] = doc.createDocumentFragment();
				}
				return categories[number];
			}
			var serviceRegistry = this._serviceRegistry;
			PageLinks.getPageLinksInfo(serviceRegistry, "orion.page.link.user").then(function(pageLinksInfo) { //$NON-NLS-0$
				if(this._dropdown) {
					this._dropdown.empty();
				} else if(this._dropdownNode) {
					lib.empty(this._dropdownNode);
				}

				// Read extension-contributed links
				var pageLinks = pageLinksInfo.getAllLinks();
				pageLinks = pageLinks.sort(function(a, b){
					if (a.order && b.order){
						return a.order - b.order;
					}
					return 0;
				});
				pageLinks.forEach(function(item) {
					var categoryNumber, match;
					if (item.category && (match = /user\.(\d+)/.exec(item.category))) {
						categoryNumber = parseInt(match[1], 10);
					}
					if (typeof categoryNumber !== "number" || isNaN(categoryNumber)) { //$NON-NLS-0$
						categoryNumber = 1;
					}
					var category = getCategory(categoryNumber);

					var li = doc.createElement("li");//$NON-NLS-0$
					var link = doc.createElement("a"); //$NON-NLS-0$
					link.setAttribute("role", "menuitem"); //$NON-NLS-0$ //$NON-NLS-1$
					if(typeof this._dropDownItemClass === "string") {//$NON-NLS-0$
						if(this._dropDownItemClass !== "") {
							link.classList.add(this._dropDownItemClass);
						}
					} else {
						link.classList.add("dropdownMenuItem"); //$NON-NLS-0$
					}
					link.href = item.href;
					if (link.hostname !== "localhost" && util.isElectron) {
						link.target = "_blank";
					}
					link.textContent = item.textContent;
					li.appendChild(link);
					category.appendChild(li);
					link.addEventListener("keydown", function(e) { //$NON-NLS-0$
						if (e.keyCode === lib.KEY.ENTER || e.keyCode === lib.KEY.SPACE) {	
							link.click();
						}
					}, false);
				}.bind(this));

				if(this.keyAssistFunction){
					var element = this._makeMenuItem(messages["Keyboard Shortcuts"], this.keyAssistFunction);
					if(typeof this._keyAssistClass === "string") {//$NON-NLS-0$
						if(this._keyAssistClass !== "") {
							element.classList.add(this._keyAssistClass);
						}
					} else {
						element.classList.add("key-assist-menuitem"); //$NON-NLS-0$
					}
					var keyAssist = element.parentNode;
					getCategory(0).appendChild(keyAssist);
				}

				if (util.isElectron) {
					var clearLocalStorage = this._makeMenuItem(messages["Clear Local Storage"], function() { localStorage.clear(); });
					getCategory(0).appendChild(clearLocalStorage.parentNode);
					var about = this._makeMenuItem(messages["About"], function() {
						var newDialog = new dialog.Dialog();
						newDialog.TEMPLATE =
							'<div>' +
								'<div><label id="appVersion">${Version: }<span>' + window.__electron.remote.app.getVersion() + '</span></label></div>' +
								'<div><label id="buildID">${Build ID: }<span>' + window.__electron.remote.app.buildId + '</span></label></div>' +
								'<div><label id="updateChannel">${Update Channel: }' + 
									'<select id="channelOptions"><option id="stable">${Stable}</option><option id="alpha">${Alpha}</option></select>' + 
								'</label></div>' + 
								'<div><label id="updateAvailable">${Update available. Download now?}</label></div>' +
								'<div><label id="updateUnavailable">${No updates available.}</label></div>' +
								'<div><label id="updateError">${Error occurred while checking for updates.}</label></div>' +
								'<div><label id="updateDownloading">${Update is downloading in the background.}</label></div>' +
							'</div>';
						newDialog.messages = messages;
						newDialog.title = messages["About"];
						newDialog.buttons = [
						{ 
							text: messages["Download"],
							callback: function() {
								xhr("POST", "/update/downloadUpdates")
									.then(function(result) {
										document.querySelector("#updateDownloading").style.display = updateDownloading;
										document.querySelector("#updateChannel").style.display = 
										document.querySelector("#aboutDownloadUpdates").style.display =
										document.querySelector("#updateAvailable").style.display = "none";
									}, function(error) {
										document.querySelector("#updateError").style.display = updateError;
										document.querySelector("#aboutDownloadUpdates").style.display =
										document.querySelector("#updateDownloading").style.display =
										document.querySelector("#updateAvailable").style.display = "none";
									});
							},
							id: "aboutDownloadUpdates" 
						},
						{
							text: messages["Check for Updates"],
							callback: function() {
								var channelOptions = document.getElementById('channelOptions'),
									updateChannel = channelOptions.options[channelOptions.selectedIndex].id;
								xhr("GET", '/update/resolveNewVersion?updateChannel=' + updateChannel)
									.then(function(result) {
										if (result.response) {
											document.querySelector("#aboutDownloadUpdates").style.display = aboutDownloadUpdates;
											document.querySelector("#updateAvailable").style.display = updateAvailable;
											document.querySelector("#updateUnavailable").style.display = 
											document.querySelector("#updateChannel").style.display = 
											document.querySelector("#aboutResolveNewVersion").style.display = 
											document.querySelector("#updateError").style.display = "none";
										} else {
											document.querySelector("#updateUnavailable").style.display = updateUnavailable;
										}
									}, function(error) {
										document.querySelector("#updateError").style.display = updateError;
										document.querySelector("#aboutResolveNewVersion").style.display = "none";
									});
							},
							id: "aboutResolveNewVersion"
						},
						{
							text: messages["Close"],
							callback: function() {
								newDialog.hide();
							}, 
							id: "aboutClose" 
						}
						];
						newDialog.modal = true;
						newDialog._initialize();
						var aboutDownloadUpdates = document.querySelector("#aboutDownloadUpdates").style.display;
						var updateUnavailable = document.querySelector("#updateUnavailable").style.display;
						var updateAvailable = document.querySelector("#updateAvailable").style.display;
						var updateError = document.querySelector("#updateError").style.display;
						var updateDownloading = document.querySelector("#updateDownloading").style.display;
						document.querySelector("#aboutDownloadUpdates").style.display = 
						document.querySelector("#updateAvailable").style.display = 
						document.querySelector("#updateUnavailable").style.display = 
						document.querySelector("#updateError").style.display = 
						document.querySelector("#updateDownloading").style.display = "none";
						newDialog.show();
					});
					getCategory(0).appendChild(about.parentNode);
				}

				// Add categories to _dropdownNode
				var _self = this;
				categories.sort(function(a, b) { return a - b; }).forEach(function(category, i) {
					if (i < categories.length - 1 && !this._noSeparator) {
						// Add a separator
						var li = Dropdown.createSeparator();
						category.appendChild(li);
					}
					_self._dropdownNode.appendChild(category);
				}.bind(this));

				if(this.isSingleService()){
					//add sign out only for single service.
					for(var i in this.authenticatedServices){
						if (this.authenticatedServices.hasOwnProperty(i)) {
							this._renderAuthenticatedService(i, 0);
						}
					}
				}
			}.bind(this));
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
