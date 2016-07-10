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
		diagnostics, 
		computeProblemsDeferred; //TODO handle multiple files and requests

	/**
	 * @name initializeIPC
	 * @description Connects the IPC instance to the websocket and sets the deafult listeners
	 */
	function initializeIPC() {
		ipc.connect();
		/**
		 * Default logging listener
		 */
		ipc.addListener(ipc.MESSAGE_TYPES.logMessage, {
			handleNotification: function handleNotification(data) {
				if(localStorage.getItem('java.langserver.logmessage') === 'true') {
					if(typeof data === 'object' && data !== null) {
						console.log(JSON.stringify(data));
					} else if(typeof data === 'string') {
						console.log(data);
					}
				}
			}
		});
		/**
		 * Listener to handle diagnostics notifications
		 */
		ipc.addListener(ipc.MESSAGE_TYPES.publishDiagnostics, {
			handleNotification: function handleNotification(data) {
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
	/**
	 * Register all of the service providers 
	 */
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
		
		function convertOccurrence(editorContext, result) {
			return editorContext.getLineStart(result.range.start.line).then(function(offset) {
				return {
					start: result.range.start.character+offset,
					end: result.range.end.character+offset
				};				
			});
		}
		
		/**
		 * Occurrences
		 */
		pluginProvider.registerService("orion.edit.occurrences", {
				computeOccurrences: function computeOccurrences(editorContext, args) {
					return editorContext.getFileMetadata().then(function(meta) {
						return editorContext.getLineAtOffset(args.selection.start).then(function(line) {
							return editorContext.getLineStart(line).then(function(lineOffset) {
								return ipc.documentHighlight(meta.location, {line: line, character: args.selection.start-lineOffset}).then(function(results) {
									if(Array.isArray(results) && results.length > 0) {
										var o = [];
										results.forEach(function(result) {
											o.push(convertOccurrence(editorContext, result));
										});
										return Deferred.all(o);
									} 
									return new Deferred().resolve([]);
								}.bind(this),
								/* @callback */ function(err) {
									return new Deferred().resolve([]);
								});	
							}.bind(this));
						}.bind(this));
					}.bind(this));
				}.bind(this)
			},
    		{
    			contentType: ["text/x-java-source", "application/x-jsp"]	//$NON-NLS-1$ //$NON-NLS-2$
    		});
    	/**
    	 * editor model changes
    	 */
		pluginProvider.registerService("orion.edit.model", {  //$NON-NLS-1$
			onSaving: project.onSaving.bind(project),
			onModelChanging: project.onModelChanging.bind(project),
			onInputChanged: project.onInputChanged.bind(project)
		},
		{
			contentType: ["text/x-java-source", "application/x-jsp"]  //$NON-NLS-1$ //$NON-NLS-2$
		});
	}

	return {
		connect: function connect() {
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
			initializeIPC();
		},
		registerServiceProviders: registerServiceProviders
	};
});
