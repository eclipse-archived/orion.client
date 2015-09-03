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
define(["orion/xhr", 'orion/xsrfUtils', "orion/plugin", "domReady!"], function(xhr, xsrfUtils, PluginProvider) {
	
	function connect() {
		var headers = {
			name: "Orion User Authentication",
			version: "1.0",
			description: "This plugin provides a user authentication service to support user verification and logout."
		};
		var pluginProvider = new PluginProvider(headers);
		registerServiceProviders(pluginProvider);
		pluginProvider.connect();
	}

	function registerServiceProviders(provider) {
		function qualifyURL(url) {
			return new URL(url, self.location.href).href;
		}

		function getAuthLinkFromJSON(responseObject, redirect) {
			redirect = redirect ? encodeURIComponent(redirect) : "";
			var loginURL = "../mixloginstatic/landing.html"; //$NON-NLS-0$
			authForm = redirect ? ("../mixloginstatic/landing.html?redirect=" + redirect + "&key=FORMOAuthUser") : "../mixloginstatic/LoginWindow.html"; //$NON-NLS-0$
			if (responseObject) {
				var authProvider = responseObject.AuthProvider;
				if (authProvider) {
					authForm = "../login/oauth?oauth=" + authProvider + (redirect ? "&redirect=" + redirect : ""); //$NON-NLS-0$
				} else {
					var userCreationEnabled = responseObject.CanAddUsers;
					var registrationURI = responseObject.RegistrationURI;
					if (!userCreationEnabled && !registrationURI) {
						authForm = "../mixloginstatic/LoginWindow.html" + (redirect ? "?redirect=" + redirect : ""); //$NON-NLS-0$
					}
				}
			}
			return qualifyURL(authForm);
		}

		var loginData;
	
		var serviceImpl = {
			getUser: function() {
				if (loginData) {
					return loginData;
				}
	
				loginData = xhr("POST", "../login", { //$NON-NLS-0$
					headers: {
						"Orion-Version": "1" //$NON-NLS-0$
					},
					timeout: 15000
				}).then(function(result) {
					loginData = result.response ? JSON.parse(result.response) : null;
					return loginData;
				}, function(error) {
					loginData = null;
					if (error instanceof Error && error.name === "Cancel") {
						return "_cancel";
					}
					return error.response ? JSON.parse(error.response) : null;
				});
				return loginData;
			},
			logout: function() { /* don't wait for the login response, notify anyway */
				loginData = null;
				return xhr("POST", "../logout", { //$NON-NLS-0$
					headers: {
						"Orion-Version": "1" //$NON-NLS-0$
					},
					timeout: 15000
				}).then(function(result) {
					loginData = null;
					return result.response ? JSON.parse(result.response) : null;
				}, function(error) {
					return error.response ? JSON.parse(error.response) : null;
				});
			},
			getAuthData: function() {
				var errorMsg = "Error while getting redirection info from the Orion server";
				return xhr("POST", "../login/redirectinfo", { //$NON-NLS-0$
					headers: {
						"Orion-Version": "1" //$NON-NLS-0$
					},
					timeout: 15000
				}).then(function(result) {
					if (result.response) {
						return JSON.parse(result.response);
					} else {
						console.error(errorMsg);
					}
				}, function(error) {
					if (error.response) {
						console.error("Post request returned error: " + error.response);
						return JSON.parse(error.response);
					} else {
						console.error(errorMsg);
					}
				});
			},
			getAuthForm: function(redirect) {
				return this.getAuthData().then(function(responseObject) {
					return getAuthLinkFromJSON(responseObject, redirect);
				});
			},

			getSignOutLink: function(redirect) {
				return this.getAuthData().then(function(responseObject) {
					return responseObject.SignOutRedirect ? responseObject.SignOutRedirect : getAuthLinkFromJSON(responseObject, redirect);
				});
			},
			getKey: function() {
				return "FORMOAuthUser";
			},
	
			getLabel: function() {
				return "Orion workspace server";
			}
		};
		var serviceProps = {
			name: "FORM+OAuth"
		};
		provider.registerService("orion.core.auth", serviceImpl, serviceProps);
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});