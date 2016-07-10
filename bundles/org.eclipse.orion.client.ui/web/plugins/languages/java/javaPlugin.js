/*******************************************************************************
 * @license
 * Copyright (c) 2014, 2016 IBM Corporation and others.
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
"orion/Deferred",
'orion/editor/stylers/text_x-java-source/syntax', 
'orion/editor/stylers/application_x-jsp/syntax',
"plugins/languages/java/javaProject",
'orion/serviceregistry',
"plugins/languages/java/ipc"
], function(PluginProvider, Deferred, mJava, mJSP, JavaProject, mServiceRegistry, IPC) {

	var ipc = new IPC('/languageServer'),
		project,
		diagnostics, computeProblemsDeferred;//TODO handle multiple files and requests

	function connect() {
		var headers = {
			name: "Orion Java Tool Support",
			version: "1.0",
			description: "This plugin provides Java tools support for Orion."
		};
		var serviceRegistry = new mServiceRegistry.ServiceRegistry();
		project = new JavaProject(serviceRegistry, ipc);
		var pluginProvider = new PluginProvider(headers, serviceRegistry);
		registerServiceProviders(pluginProvider);
		pluginProvider.connect();
		ipc.connect();
		ipc.addListener(ipc.MESSAGE_TYPES.publishDiagnostics, {
			handleNotification: function(data) {
				diagnostics = data.params.diagnostics;
				resolveProblems();
			}
		});
	}
	
	function resolveProblems() {
		if (computeProblemsDeferred && diagnostics) {
			var types = ["", "error", "warning", "info", "hint"];
			computeProblemsDeferred.resolve(diagnostics.map(function(d) {
				return {
					description: d.message,
					id: d.code,
					severity: types[d.severity],
					range: d.range
				};
			}));
			diagnostics = computeProblemsDeferred = null;
		}
	}

	function registerServiceProviders(pluginProvider) {
		pluginProvider.registerServiceProvider("orion.core.contenttype", {}, {
			contentTypes: [
				{	id: "text/x-java-source",
					"extends": "text/plain",
					name: "Java",
					extension: ["java"]
				}, {id: "application/x-jsp",
					"extends": "text/plain",
					name: "Java Server Page",
					extension: ["jsp"]
				}
			]
		});
		mJava.grammars.forEach(function(current) {
			pluginProvider.registerServiceProvider("orion.edit.highlighter", {}, current);
		});
		mJSP.grammars.forEach(function(current) {
			pluginProvider.registerServiceProvider("orion.edit.highlighter", {}, current);
		});
		pluginProvider.registerService("orion.edit.validator", {
			/**
			 * @callback
			 */
			computeProblems: function computeProblems(editorContext, options) {
				if (computeProblemsDeferred) return computeProblemsDeferred;
				computeProblemsDeferred = new Deferred();
				if (diagnostics) {
					resolveProblems();
				}
				return computeProblemsDeferred;
			}
		}, {
			contentType: ["text/x-java-source"]
		});
		pluginProvider.registerService("orion.edit.model", {  //$NON-NLS-1$
			onInputChanged: project.onInputChanged.bind(project)
		},
		{
			contentType: ["text/x-java-source", "application/x-jsp"]  //$NON-NLS-1$ //$NON-NLS-2$
		});	
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});
