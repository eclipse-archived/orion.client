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
	'orion/plugin',
	'orion/widgets/themes/ThemeVersion',
	'orion/widgets/themes/container/LightPage',
	'orion/widgets/themes/container/OrionPage',
	"domReady!"
],
function(PluginProvider, ThemeVersion, LightPage, OrionPage) {
	function ThemesProvider() {
	}
	
		/*
	 * Plugin Stub for Theme Data.
	 * To provide custom theme data, change the _themeData object to return
	 * custom values.
	 */
	
	var _themeData = {
		"styles": [LightPage, OrionPage],
		"version": ThemeVersion,
		"protectedThemes": [LightPage.name, OrionPage.name],
		"defaultTheme": LightPage.name
	};
	
	ThemesProvider.prototype = {
		getThemeValue: function(key) {
			if (_themeData.hasOwnProperty(key)) {
				return _themeData[key];
			}
			throw new Error("Theme Data Not Available.");
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
		var service = new ThemesProvider();
		provider.registerService("orion.core.container.themes.provider", service, {});
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});