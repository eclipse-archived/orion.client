/*******************************************************************************
 * @license
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/xhr', 
	'orion/plugin',
	"domReady!"
],
function(xhr, PluginProvider) {
	function ThemesProvider(serverURL) {
		this.serverURL = serverURL;
	}
	
	ThemesProvider.prototype = {
		getValueFromHost: function(key) {
			return xhr("GET", this.serverURL + key, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000,
				log: false
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		getThemeVersion: function() {
			return this.getValueFromHost("version");
		},
		getStyles: function() {
			return this.getValueFromHost("styles");
		},
		getProtectedThemes: function() {
			return this.getValueFromHost("protectedThemes");
		},
		getDefaultTheme: function() {
			this.getValueFromHost("defaultTheme");
		}
	};
	
	function connect() {
		var login = new URL("../mixloginstatic/LoginWindow.html", self.location.href).href;
		var headers = {
			name: "Orion Container Theme Provider",
			version: "1.0",
			description: "This plugin provides IDE theme data.",
			login: login
		};
		var pluginProvider = new PluginProvider(headers);
		registerServiceProviders(pluginProvider);
		pluginProvider.connect();
	}

	function registerServiceProviders(provider) {
		var service = new ThemesProvider(new URL("../themes/container/", self.location.href).href);
		provider.registerService("orion.core.themes.provider", service, {});
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});