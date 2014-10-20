/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global importScripts*/
/*eslint-env amd*/

/**
 * This file bootstraps the JS plugin. It can be loaded in either of 2 ways:
 *
 * 1) As a web worker script via new Worker("javascriptBootstrap.js").
 * In this mode it configures RequireJS in the worker's global environment, then initializes the JS plugin.
 *
 * 2) As an AMD module in a regular Window.
 * In this mode it simply initializes the JS plugin.
 */
(function(factory) {
	if (typeof define === "function" && define.amd && typeof importScripts === "undefined") {
		// Case 1
		define(factory);
	} else if (typeof importScripts === "function") {
		// Case 2
		importScripts("../../requirejs/require.js"); // synchronous
		require.config({
			baseUrl: "../../",
			paths: {
				text: "requirejs/text",
				esprima: "esprima/esprima",
				estraverse: "estraverse/estraverse",
				escope: "escope/escope",
				logger: "javascript/logger",
				doctrine: 'doctrine/doctrine'
			},
			packages: [
				{
					name: "eslint/conf",
					location: "eslint/conf",
				},
				{
					name: "eslint",
					location: "eslint/lib",
					main: "eslint"
				},
			]
		});
		factory();
	} else {
		throw new Error("Unsupported global context");
	}
}(function() {
	/**
	 * Set up the plugin. To minimize the chance of a load timeout, create the PluginProvider as early as possible,
	 * deferring loading of javascriptPlugin's many dependencies until later.
	 * 
	 * This is important when running an un-optimized build.
	 */
	require(["orion/plugin"], function(PluginProvider) {
		var provider = new PluginProvider({
			name: "Orion JavaScript Tool Support", //$NON-NLS-0$
			version: "1.0", //$NON-NLS-0$
			description: "This plugin provides JavaScript tools support for Orion, like editing, search, navigation, validation, and code completion." //$NON-NLS-0$
		});

		require(["javascript/plugins/javascriptPlugin"], function(jsPluginFactory) {
			jsPluginFactory(provider);
		});
	});
}));
