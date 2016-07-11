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
	/**
	 * Single place to add in all of the provide hooks for the various services
	 */
	function hookAPIs(provider) {
		/**
		 * Content Assist
		 */
		provider.registerService("orion.edit.contentassist", {
			/**
			 * @callback
			 */
			computeContentAssist: function(editorContext, params) {
				return editorContext.getFileMetadata().then(function(meta) {
					return editorContext.getLineAtOffset(params.selection.start).then(function(line) {
						return editorContext.getLineStart(line).then(function(lineOffset) {
							return ipc.completion(meta.location, {line: line, character: params.selection.start-lineOffset}).then(function(results) {
								if(Array.isArray(results) && results.length > 0) {
									return results.map(function(result) {
										return {
											name: '['+resolveCompletionKind(result.kind)+'] '+result.label,
											description: ' ('+result.detail+')',
								            relevance: 100,
								            style: 'emphasis', //$NON-NLS-1$
								            overwrite: true,
								            kind: 'java', //$NON-NLS-1$
								            hover: {
								            	content: result.documentation,
								            	type: 'markdown'
								            }
								        };
									});
								}
								return new Deferred().resolve([]);
							},
							/* @callback */ function(err) {
								return new Deferred().resolve([]);
							});
						});
					});
				});
			}
		},
		{
			contentType: ["text/x-java-source", "application/x-jsp"],  //$NON-NLS-1$ //$NON-NLS-2$
			name: 'Java Content Assist',  //$NON-NLS-1$
			id: "orion.edit.contentassist.java",  //$NON-NLS-1$
			charTriggers: "[.]",  //$NON-NLS-1$
			excludedStyles: "(string.*)"  //$NON-NLS-1$
		});
		/**
		 * Validator
		 */
		provider.registerService("orion.edit.validator", {
			/**
			 * @callback
			 */
			computeProblems: function computeProblems(editorContext, options) {
				if (!computeProblemsDeferred) {
					computeProblemsDeferred = new Deferred();
					if (diagnostics) {
						resolveProblems();
					}
				}
				return computeProblemsDeferred;
			}
		}, {
			contentType: ["text/x-java-source", "application/x-jsp"]
		});
		/**
		 * Occurrences
		 */
		provider.registerService("orion.edit.occurrences", {
			computeOccurrences: function computeOccurrences(editorContext, args) {
				return editorContext.getFileMetadata().then(function(meta) {
					return editorContext.getLineAtOffset(args.selection.start).then(function(line) {
						return editorContext.getLineStart(line).then(function(lineOffset) {
							return ipc.documentHighlight(meta.location, {line: line, character: args.selection.start-lineOffset}).then(function(results) {
								if(Array.isArray(results) && results.length > 0) {
									return Deferred.all(results.map(function(result) {
										return editorContext.getLineStart(result.range.start.line).then(function(offset) {
											return {
												start: result.range.start.character+offset,
												end: result.range.end.character+offset
											};				
										});
									}));
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
	 * Converts the completion result kind into a human-readable string
	 */
	function resolveCompletionKind(num) {
		switch(num) {
			case 1: return 'Text';
			case 2: return 'Method';
			case 3: return 'Function';
			case 4: return 'Constructor';
			case 5: return 'Field';
			case 6: return 'Variable';
			case 7: return 'Class';
			case 8: return 'Interface';
			case 9: return 'Module';
			case 10: return 'Property';
			case 11: return 'Unit';
			case 12: return 'Value';
			case 13: return 'Enum';
			case 14: return 'Keyword';
			case 15: return 'Snippet';
			case 16: return 'Color';
			case 17: return 'File';
			case 18: return 'Reference';
			default: return 'Unknown';
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
		hookAPIs(pluginProvider);
		
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
