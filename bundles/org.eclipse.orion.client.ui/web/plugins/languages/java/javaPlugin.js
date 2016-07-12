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
		diagnostics = Object.create(null), 
		LOG_ERRORS = localStorage.getItem('java.langserver.logmessage.error') === 'true',
		LOG_WARNINGS = localStorage.getItem('java.langserver.logmessage.warn') === 'true',
		LOG_INFO = localStorage.getItem('java.langserver.logmessage.error.info') === 'true';

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
				if(data !== null && typeof data === 'object') {
					if(data.params && (LOG_ERRORS && data.params.type === 1) || (LOG_WARNINGS && data.params.type === 2) || (LOG_INFO && data.params.type === 3)) {
						if(typeof data === 'object' && data !== null) {
							console.log(JSON.stringify(data));
						} else if(typeof data === 'string') {
							console.log(data);
						}
					}
				}
			}
		});
		/**
		 * Listener to handle diagnostics notifications
		 */
		ipc.addListener(ipc.MESSAGE_TYPES.publishDiagnostics, {
			handleNotification: function handleNotification(data) {
				var uri = data.params.uri;
				if (!diagnostics[uri]) {
					diagnostics[uri] = new Deferred();
				}
				diagnostics[uri].resolve(data.params.diagnostics.map(convertDiagnostic));
				delete diagnostics[uri];
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
			computeContentAssist: function(editorContext, args) {
				return editorContext.getFileMetadata().then(function(meta) {
					return getPosition(editorContext, args.selection.start).then(function(position) {
						return ipc.completion(meta.location, position).then(function(results) {
							if(Array.isArray(results) && results.length > 0) {
								return results.map(function(result) {
									return {
										name: result.label,
										proposal: result.insertText,
										description: ' ('+resolveCompletionKind(result.kind)+')',
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
		 * Symbol outline
		 */
		provider.registerService("orion.edit.outliner", {
			/**
			 * @callback
			 */
			computeOutline: function computeOutline(editorContext, options) {
				return editorContext.getFileMetadata().then(function(meta) {
					return ipc.documentSymbol(meta.location).then(function(results) {
						if(Array.isArray(results) && results.length > 0) {
							
						}
						return new Deferred().resolve([]);
					});
				}.bind(this));
			}
		},
    	{
    		contentType: ["text/x-java-source", "application/x-jsp"],  //$NON-NLS-1$
    		name: "Java Symbol Outline",
    		title: "Java Symbols",
    		id: "orion.java.symbols.outliner.source"  //$NON-NLS-1$
    	});
    	
		function convertEdit(editorContext, edit) {
			return editorContext.getLineStart(edit.range.start.line).then(function(startLineOffset) {
				return editorContext.getLineStart(edit.range.end.line).then(function(endLineOffset) {
					return {
						start: edit.range.start.character+startLineOffset,
						end: edit.range.end.character+endLineOffset,
						text: edit.newText
					};
				});
			});
		}
		
		//TODO only show command when the provider is available in capabilities
		//TODO send the options to the langangue server
		//TODO integrate with the new orion formating service. We may have to change the orion service because
		// the changes are done in the server side.
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
			{
				execute: /** @callback */ function(editorContext, options) {
					return editorContext.getFileMetadata().then(function(metadata) {
						return ipc.formatDocument(metadata.location, {}).then(function(edits) {
							return Deferred.all(edits.reverse().map(function(edit) {
								return convertEdit(editorContext, edit);
							})).then(function(offsetEdits) {
								return Deferred.all(offsetEdits.map(function(edit) {
									return editorContext.setText(edit.start, edit.end, edit.text);
								}));
							});
						});
					});
				}
			},
			{
			name: "Format Document",
			id : "orion.java.format",  //$NON-NLS-1$
//			key : [ 114, false, false, false, false],
			contentType: ["text/x-java-source", "application/x-jsp"]  //$NON-NLS-1$ //$NON-NLS-2$
			}
		);

		/**
		 * Validator
		 */
		provider.registerService("orion.edit.validator", {
			/**
			 * @callback
			 */
			computeProblems: function computeProblems(editorContext, options) {
				return editorContext.getFileMetadata().then(function(metadata) {
					var uri = metadata.location;
					if (!diagnostics[uri]) {
						diagnostics[uri] = new Deferred();
					}
					return diagnostics[uri];
				});
			}
		}, {
			contentType: ["text/x-java-source", "application/x-jsp"]
		});
		/**
		 * Hover
		 */
		provider.registerService("orion.edit.hover", {
			computeHoverInfo: function computeHoverInfo(editorContext, args) {
				if(args.proposal && args.proposal.kind === 'java') {
			        return args.proposal.hover;
			    }
				return editorContext.getFileMetadata().then(function(meta) {
					return getPosition(editorContext, args.offset).then(function(position) {
						return ipc.hover(meta.location, position).then(function(result) {
							var hover = '';
							if(typeof result.contents === 'string') {
								hover = result.contents;
							} else if(result.contents !== null && typeof result.contents === 'object') {
								hover = result.contents.value;
							}
							return new Deferred().resolve(hover);
						},
						/* @callback */ function(err) {
							return new Deferred().resolve('');
						});
					});
				});
			}
		}, {
    		name: "Java Hover",
    		contentType: ["text/x-java-source", "application/x-jsp"]	//$NON-NLS-1$ //$NON-NLS-2$
    	});
		/**
		 * Occurrences
		 */
		provider.registerService("orion.edit.occurrences", {
			computeOccurrences: function computeOccurrences(editorContext, args) {
				return editorContext.getFileMetadata().then(function(meta) {
					return getPosition(editorContext, args.selection.start).then(function(position) {
						return ipc.documentHighlight(meta.location, position).then(function(results) {
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
			}.bind(this)
		},
		{
			contentType: ["text/x-java-source", "application/x-jsp"]	//$NON-NLS-1$ //$NON-NLS-2$
		});
	}
	
	/**
	 * @name convertDiagnostic
	 * @description description
	 * @param diagnostic the LSP diagnostic object
	 * @returns returns the orion annotation object
	 */
	function convertDiagnostic(diagnostic) {
		return {
			description: diagnostic.message,
			id: diagnostic.code,
			severity: ipc.ERROR_TYPES[diagnostic.severity],
			range: diagnostic.range
		};
	}
	
	/**
	 * @name getPosition
	 * @description Return a document position object for use with the protocol
	 * @param {?} editorContext TRhe backing editor context
	 * @param {number} offset The Orion editor offset
	 * @returns {Deferred} Return a deferred that will resolve to a position object for the protocol textDocument requests
	 */
	function getPosition(editorContext, offset) {
		return editorContext.getLineAtOffset(offset).then(function(line) {
			return editorContext.getLineStart(line).then(function(lineOffset) {
				return {line: line, character: offset-lineOffset};
			});
		});
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
