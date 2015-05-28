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
/*globals importScripts*/
/*eslint-env browser, amd*/
importScripts("../orion/plugin.js");
var login = new URL("../mixloginstatic/LoginWindow.html", self.location.href).href;
var headers = {
	name: "Orion Core Support",
	version: "1.0",
	description: "This plugin provides the core Orion support.",
	login: login
};
var pluginProvider = new orion.PluginProvider(headers);
importScripts('../requirejs/require.min.js');
require({
	baseUrl: '..',
	// set the paths to our library packages
	packages: [],
	paths: {
		text: 'requirejs/text',
		i18n: 'requirejs/i18n',
		domReady: 'requirejs/domReady'
	}
});
require(["plugins/orionPlugin"], function(plugin) {
//	plugin.connect();
	plugin.registerServiceProviders(pluginProvider);
	pluginProvider.connect();
});