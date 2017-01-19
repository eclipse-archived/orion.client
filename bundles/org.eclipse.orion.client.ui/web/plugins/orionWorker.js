/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*globals importScripts orion*/
/*eslint-env browser, amd*/
importScripts("../orion/Deferred.js", "../orion/plugin.js", '../requirejs/require.min.js');
var pluginProvider = new orion.PluginProvider();
require(["../orion/require-config.js"], function(config){
	require(["plugins/orionPlugin"], function(plugin){
		plugin.connect(pluginProvider);
	}, config.errback);
}, function(err) {
	alert("Please try refreshing the page.\n\nRequireJS error \'" + err.requireType + 
			"\'' occurred loading module:\n \'" + err.requireModules + "\'.");
});
