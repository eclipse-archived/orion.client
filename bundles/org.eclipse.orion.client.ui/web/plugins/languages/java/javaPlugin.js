/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/plugin',
	'orion/editor/stylers/text_x-java-source/syntax', 
	'orion/editor/stylers/application_x-jsp/syntax',
	'orion/serviceregistry',
	'plugins/languages/java/ipc',
	'orion/EventTarget'
], function(PluginProvider, mJava, mJSP, mServiceRegistry, IPC, EventTarget) {
	
	/**
	 * Register all of the service providers 
	 */
	function registerServiceProviders(pluginProvider) {
	}

	return {
		connect: function connect() {
			var headers = {
				name: "Orion Java Tool Support",
				version: "1.0",
				description: "This plugin provides Java tools support for Orion."
			};
			var serviceRegistry = new mServiceRegistry.ServiceRegistry();
			var pluginProvider = new PluginProvider(headers, serviceRegistry);
			
			// register the content type
			pluginProvider.registerServiceProvider("orion.core.contenttype", {}, {
				contentTypes: [
					{
						id: "text/x-java-source",
						"extends": "text/plain",
						name: "Java",
						extension: ["java"]
					},
					{
						id: "application/x-jsp",
						"extends": "text/plain",
						name: "Java Server Page",
						extension: ["jsp"]
					}
				]
			});
			// syntax highlighting
			mJava.grammars.forEach(function(current) {
				pluginProvider.registerServiceProvider("orion.edit.highlighter", {}, current);
			});
			mJSP.grammars.forEach(function(current) {
				pluginProvider.registerServiceProvider("orion.edit.highlighter", {}, current);
			});
			var ipc = new IPC("/languageServer");
			function LSPService() {
				EventTarget.attach(this);
				ipc.lspService = this;
			}
			LSPService.prototype = {
				sendMessage: function(id, message, params) {
					return ipc.sendMessage(id, message, params);
				},
				start: function () {
					return ipc.connect();
				}
			};
			pluginProvider.registerService("orion.languages.server", //$NON-NLS-1$
				new LSPService(),
				{
					languageId: "java",
					name: "Java Symbol Outline",
					title: "Java Symbols",
					contentType: ["text/x-java-source", "application/x-jsp"]  //$NON-NLS-1$ //$NON-NLS-2$
				}
			);
			pluginProvider.connect();
		},
		registerServiceProviders: registerServiceProviders
	};
});
