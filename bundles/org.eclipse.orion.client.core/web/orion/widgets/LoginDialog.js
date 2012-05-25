/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define eclipse localStorage dojo dijit widgets*/
/*jslint browser:true*/

define(['i18n!orion/widgets/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog', 'text!orion/widgets/templates/LoginDialog.html'], function(messages, require, dojo, dijit, mUtil) {

	dojo.declare("orion.widgets.LoginDialog", [dijit.TooltipDialog], { //$NON-NLS-0$
		widgetsInTemplate: true,
		templateString: dojo.cache('orion', 'widgets/templates/LoginDialog.html'),
		//$NON-NLS-1$ //$NON-NLS-0$

		constructor: function() {
			this.inherited(arguments);
			this.options = arguments[0] || {};
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},

		postCreate: function() {
			this.inherited(arguments);
			var _self = this;

			dojo.addClass(this.closeLink, "imageSprite"); //$NON-NLS-0$
			dojo.addClass(this.closeLink, "core-sprite-close"); //$NON-NLS-0$

			dojo.connect(this.closeLink, "onmouseover", this.closeLink, function() { //$NON-NLS-0$
				_self.closeLink.style.cursor = "pointer"; //$NON-NLS-0$
			});
			dojo.connect(this.closeLink, "onmouseout", this.closeLink, function() { //$NON-NLS-0$
				_self.closeLink.style.cursor = "default"; //$NON-NLS-0$
			});

			dojo.connect(this.closeLink, "onclick", function() {
				dojo.hitch(_self, _self.closeDialog)();
			}); //$NON-NLS-0$
		},

		setPendingAuthentication: function(services) {

			for (var i in this.unauthenticatedServices) {
				delete this.unauthenticatedServices[i].pending;
			}

			for (var i in services) {
				if (this.unauthenticatedServices[services[i].SignInKey]) {
					this.unauthenticatedServices[services[i].SignInKey].pending = true;
				} else if (this.authenticatedServices[services[i].SignInKey]) {
					this.unauthenticatedServices[services[i].SignInKey] = this.authenticatedServices[services[i].SignInKey];
					this.unauthenticatedServices[services[i].SignInKey].pending = true;
					delete this.authenticatedServices[services[i].SignInKey];
				} else {
					this.unauthenticatedServices[services[i].SignInKey] = {
						label: services[i].label,
						SignInLocation: services[i].SignInLocation,
						pending: true
					};
				}
			}
			this.renderUnauthenticatedServices();
			this.renderAuthenticatedServices();

		},

		authenticatedService: function(SignInKey) {
			if (this.unauthenticatedServices[SignInKey] && !this.unauthenticatedServices[SignInKey].authService) {
				this.authenticatedServices[SignInKey] = this.unauthenticatedServices[SignInKey];
				delete this.unauthenticatedServices[SignInKey];
			}
		},

		addUserItem: function(key, authService, label, jsonData) {
			if (jsonData) {
				if (this.unauthenticatedServices[key]) {
					delete this.unauthenticatedServices[key];
				}
				this.authenticatedServices[key] = {
					authService: authService,
					label: label,
					data: jsonData
				};
			} else {
				if (this.authenticatedServices[key]) {
					delete this.authenticatedServices[key];
				}
				if (this.unauthenticatedServices[key]) {
					this.unauthenticatedServices[key] = {
						authService: authService,
						label: label,
						pending: this.unauthenticatedServices[key].pending
					};
				} else {
					this.unauthenticatedServices[key] = {
						authService: authService,
						label: label
					};
				}
			}
			dojo.hitch(this, this.renderAuthenticatedServices)();
			dojo.hitch(this, this.renderUnauthenticatedServices)();
		},

		renderAuthenticatedServices: function() {
			dojo.empty(this.authenticatedList);
			this.authenticated.style.display = this.isEmpty(this.authenticatedServices) ? 'none' : ''; //$NON-NLS-0$
			var _self = this;
			var isFirst = true;
			for (var i in this.authenticatedServices) {
				if (!isFirst) {
					var tr = dojo.create("tr", null, this.authenticatedList); //$NON-NLS-0$
					dojo.create("td", {
						style: "padding: 0; margin 0;",
						colspan: 2,
						innerHTML: "<hr style='border-bottom: medium none; border-top: 1px solid #D3D3D3; color: gray; height: 0; margin: 2px;'>"
					}, tr); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				isFirst = false;
				var tr = dojo.create("tr", {
					className: "navTableHeading"
				}); //$NON-NLS-1$ //$NON-NLS-0$
				var authService = this.authenticatedServices[i].authService;
				var td = dojo.create("td", null, tr, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				var h2 = dojo.create("h2", null, td, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				if (!authService) {
					var loginForm = this.authenticatedServices[i].SignInLocation;
					if (this.authenticatedServices[i].label) {
						h2.innerHTML = this.authenticatedServices[i].label + "<br>"; //$NON-NLS-0$
					}
					h2.innerHTML += this.getHostname(loginForm);
				} else if (authService.getAuthForm) {
					dojo.hitch(_self, function(h2, i) {
						authService.getAuthForm(eclipse.globalCommandUtils.notifyAuthenticationSite).then(function(loginForm) {
							if (_self.authenticatedServices[i].label) {
								h2.innerHTML = _self.authenticatedServices[i].label + "<br>"; //$NON-NLS-0$
							}
							h2.innerHTML += _self.getHostname(loginForm);
						});
					})(h2, i);
				} else {
					h2.innerHTML = this.authenticatedServices[i].label ? this.authenticatedServices[i].label : i;
				}
				dojo.addClass(td, "LoginWindowLeft"); //$NON-NLS-0$
				var td = dojo.create("td", {
					style: "text-align: right"
				}, tr, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(td, "LoginWindowRight"); //$NON-NLS-0$
				var jsonData = this.authenticatedServices[i].data;
				var authService = this.authenticatedServices[i].authService;
				if (!authService) {
					dojo.place(tr, this.authenticatedList, "last"); //$NON-NLS-0$
					return;
				}
				if (jsonData.Location) dojo.create("a", {
					href: (require.toUrl("profile/user-profile.html") + "#" + jsonData.Location),
					innerHTML: messages['Profile']
				}, td, "last"); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(" "), td, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				if (authService.logout) {
					var a = dojo.create("a", { //$NON-NLS-0$
						innerHTML: messages['Sign out']
					}, td, "last"); //$NON-NLS-0$

					dojo.connect(a, "onmouseover", a, function() { //$NON-NLS-0$
						a.style.cursor = "pointer"; //$NON-NLS-0$
					});
					dojo.connect(a, "onmouseout", a, function() { //$NON-NLS-0$
						a.style.cursor = "default"; //$NON-NLS-0$
					});

					dojo.connect(a, "onclick", dojo.hitch(_self, function(authService, i) { //$NON-NLS-0$
						return function() {
							authService.logout().then(dojo.hitch(_self, function() {
								this.addUserItem(i, authService, this.authenticatedServices[i].label);
								if (this.isSingleService()) {
									this.closeDialog();
								}
								localStorage.removeItem(i);
							}));
						};
					})(authService, i));
				}
				dojo.place(tr, this.authenticatedList, "last"); //$NON-NLS-0$

				var lastLogin = messages['N/A'];
				if (jsonData && jsonData.lastlogintimestamp) {
					lastLogin = dojo.date.locale.format(new Date(jsonData.lastlogintimestamp), {
						formatLength: "short"
					}); //$NON-NLS-0$
				}
				var userName = (jsonData.Name && jsonData.Name.replace(/^\s+|\s+$/g, "") !== "") ? jsonData.Name : jsonData.login; //$NON-NLS-0$
				tr = dojo.create("tr"); //$NON-NLS-0$
				if (userName.length > 40) {
					td = dojo.create("td", {
						innerHTML: userName.substring(0, 30) + '... ' + messages['logged in since '] + lastLogin,
						colspan: 2,
						title: userName + ' ' + messages['logged in since '] + lastLogin
					}, tr, "only"); //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
				} else {
					td = dojo.create("td", {
						innerHTML: userName + ' ' + messages['logged in since '] + lastLogin,
						colspan: 2
					}, tr, "only"); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				dojo.addClass(td, "LoginWindowLeft"); //$NON-NLS-0$
				dojo.addClass(td, "LoginWindowRight"); //$NON-NLS-0$
				dojo.addClass(td, "LoginWindowComment"); //$NON-NLS-0$
				dojo.place(tr, this.authenticatedList, "last"); //$NON-NLS-0$
			}
		},

		renderUnauthenticatedServices: function() {
			this.emptyListInfo.style.display = this.unauthenticatedServices.length === 0 && this.authenticatedServices.length === 0 ? '' : 'none'; //$NON-NLS-0$
			dojo.empty(this.otherUnauthenticatedList);
			var _self = this;
			this.otherUnauthenticated.style.display = this.isEmpty(this.unauthenticatedServices) ? 'none' : ''; //$NON-NLS-0$
			var isFirst = true;
			for (var i in this.unauthenticatedServices) {
				if (!isFirst || !this.isEmpty(this.authenticatedServices)) {
					var tr = dojo.create("tr", null, this.otherUnauthenticatedList); //$NON-NLS-0$
					dojo.create("td", {
						style: "padding: 0; margin 0;",
						colspan: 2,
						innerHTML: "<hr style='border-bottom: medium none; border-top: 1px solid #D3D3D3; color: gray; height: 0; margin: 2px;'>"
					}, tr); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				isFirst = false;
				var tr = dojo.create("tr", {
					className: "navTableHeading"
				}); //$NON-NLS-1$ //$NON-NLS-0$
				var td = dojo.create("td", null, tr, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(td, "LoginWindowLeft"); //$NON-NLS-0$
				var h2 = dojo.create("h2", null, td, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				td = dojo.create("td", {
					style: "text-align: right"
				}, tr, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(td, "LoginWindowRight"); //$NON-NLS-0$

				var authService = this.unauthenticatedServices[i].authService;

				var notifyAuthenticationSite = eclipse.globalCommandUtils.notifyAuthenticationSite;
				var redirectURL = notifyAuthenticationSite + (notifyAuthenticationSite.indexOf("?") === -1 ? "?" : "&") + "key=" + i;

				if (!authService) {
					var loginForm = this.unauthenticatedServices[i].SignInLocation;
					if (loginForm.indexOf("?") === -1) { //$NON-NLS-0$
						dojo.create("a", {
							target: "_blank",
							href: loginForm + "?redirect=" + encodeURIComponent(redirectURL),
							innerHTML: messages['Sign in']
						}, td, "last"); //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					} else {
						dojo.create("a", {
							target: "_blank",
							href: loginForm + "&redirect=" + encodeURIComponent(redirectURL),
							innerHTML: messages['Sign in']
						}, td, "last"); //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}

					if (this.unauthenticatedServices[i].label) {
						h2.innerHTML = this.unauthenticatedServices[i].label + "<br>"; //$NON-NLS-0$
					}
					h2.innerHTML += this.getHostname(loginForm);
				} else if (authService.getAuthForm) {
					dojo.hitch(_self, function(td, i) {

						authService.getAuthForm(redirectURL).then(function(loginForm) {

							dojo.create("a", {
								target: "_blank",
								href: loginForm,
								innerHTML: messages['Sign in']
							}, td, "last"); //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							if (_self.unauthenticatedServices[i].label) {
								h2.innerHTML = _self.unauthenticatedServices[i].label + "<br>"; //$NON-NLS-0$
							}
							h2.innerHTML += _self.getHostname(loginForm);
						});
					})(td, i);
				} else if (authService.login) {
					dojo.place(document.createTextNode(this.unauthenticatedServices[i].label ? this.unauthenticatedServices[i].label : i), h2, "only"); //$NON-NLS-0$

					var a = dojo.create("a", {
						innerHTML: messages['Sign in'],
						style: "cursor: hand;"
					}, td, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					dojo.connect(a, "onmouseover", a, function() { //$NON-NLS-0$
						a.style.cursor = "pointer"; //$NON-NLS-0$
					});
					dojo.connect(a, "onmouseout", a, function() { //$NON-NLS-0$
						a.style.cursor = "default"; //$NON-NLS-0$
					});
					dojo.connect(a, "onclick", dojo.hitch(_self, function(authService) { //$NON-NLS-0$
						return function() {
							authService.login(redirectURL).then(function() {
								if (_self.isSingleService()) if (dijit.popup.hide) dijit.popup.hide(_self); //close doesn't work on FF
								dijit.popup.close(_self);
							});
						};
					})(authService));
				}

				dojo.place(tr, this.otherUnauthenticatedList, "last"); //$NON-NLS-0$
				if (this.unauthenticatedServices[i].pending) {
					tr = dojo.create("tr"); //$NON-NLS-0$
					td = dojo.create("td", {
						innerHTML: messages['Authentication required!'],
						style: "padding-left: 10px",
						colspan: 2
					}, tr, "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$
					dojo.addClass(td, "LoginWindowLeft"); //$NON-NLS-0$
					dojo.addClass(td, "LoginWindowRight"); //$NON-NLS-0$
					dojo.create("img", {
						src: require.toUrl("images/warning.gif"),
						style: "padding-right: 4px; vertical-align: bottom; padding-bottom: 2px;"
					}, td, "first"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(tr, this.otherUnauthenticatedList, "last"); //$NON-NLS-0$
				}
			}
		},
		isSingleService: function() {
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) === 1;
		},
		isEmpty: function(obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) return false;
			}
			return true;
		},
		length: function(obj) {
			var length = 0;
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) length++;
			}
			return length;
		},
		getHostname: function(url) {
			var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im'); //$NON-NLS-0$
			var temp = document.createElement('a'); //$NON-NLS-0$
			temp.href = url;
			url = temp.href; // get qualified url
			return url.match(re)[1].toString();
		},
		closeDialog: function() {
			if (dijit.popup.hide) dijit.popup.hide(this); //close doesn't work on FF
			dijit.popup.close(this);
		}
	});
});