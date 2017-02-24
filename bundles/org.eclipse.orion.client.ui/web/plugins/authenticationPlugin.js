/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2016 IBM Corporation and others.
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
					if (loginData) {
						localStorage.setItem('orion.user', JSON.stringify(loginData))
					}
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
				localStorage.removeItem('orion.user')
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
			getAuthForm: function(notify) {
				return qualifyURL(notify ? ('../mixloginstatic/landing.html?redirect=' + encodeURIComponent(notify) + '&key=FORMOAuthUser') : '../mixloginstatic/LoginWindow.html');
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