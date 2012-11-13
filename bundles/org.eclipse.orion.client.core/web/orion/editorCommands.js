/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window widgets eclipse:true orion:true serviceRegistry dojo dijit define */
/*jslint maxerr:150 browser:true devel:true regexp:false*/


/**
 * @namespace The global container for orion APIs.
 */ 
define(['i18n!orion/edit/nls/messages', 'dojo', 'orion/commands', 'orion/globalCommands', 'orion/extensionCommands', 'orion/contentTypes', 'orion/textview/keyBinding', 'orion/textview/undoStack', 'orion/searchUtils'], 
	function(messages, dojo, mCommands, mGlobalCommands, mExtensionCommands, mContentTypes, mKeyBinding, mUndoStack, mSearchUtils) {

var exports = {};

var contentTypesCache = null;
exports.EditorCommandFactory = (function() {
	function EditorCommandFactory (serviceRegistry, commandService, fileClient, inputManager, toolbarId, isReadOnly, navToolbarId, searcher) {
		this.serviceRegistry = serviceRegistry;
		this.commandService = commandService;
		this.fileClient = fileClient;
		this.inputManager = inputManager;
		this.toolbarId = toolbarId;
		this.pageNavId = navToolbarId;
		this.isReadOnly = isReadOnly;
		this._searcher = searcher;
	}
	EditorCommandFactory.prototype = {
		/**
		 * Creates the common text editing commands.  Also generates commands for any installed plug-ins that
		 * contribute editor actions.  
		 */
		generateEditorCommands: function(editor) {
			function getContentTypes(serviceRegistry) {
				if (contentTypesCache) {
					return contentTypesCache;
				}
				var contentTypeService = serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
				//TODO Shouldn't really be making service selection decisions at this level. See bug 337740
				if (!contentTypeService) {
					contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
					contentTypeService = serviceRegistry.getService("orion.core.contenttypes"); //$NON-NLS-0$
				}
				return contentTypeService.getContentTypes().then(function(ct) {
					contentTypesCache = ct;
					return contentTypesCache;
				});
			}

			// KB exists so that we can pass an array (from info.key) rather than actual arguments
			function createKeyBinding(args) {
				var keyBinding = new mKeyBinding.KeyBinding();
				mKeyBinding.KeyBinding.apply(keyBinding, args);
				return keyBinding;
			}
	
			function handleError(error) {
				var errorToDisplay = {};
				errorToDisplay.Severity = "Error"; //$NON-NLS-0$
				if (error.status === 0) {
					errorToDisplay.Message = messages['No response from server.  Check your internet connection and try again.']; //$NON-NLS-1$
				} else {
					errorToDisplay = error;
				}
				var statusService = serviceRegistry.getService("orion.page.message"); //$NON-NLS-0$
				if (statusService) {
					statusService.setProgressResult(errorToDisplay);
				} else {
					window.console.log(errorToDisplay);
				}
			}

			// create commands common to all editors
			if (!this.isReadOnly) {
				editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding('s', true), "save"); //$NON-NLS-1$ //$NON-NLS-0$
				//If we are introducing other file system to provide save action, we need to define an onSave function in the input manager
				//That way the file system knows how to implement their save mechanism
				if(this.inputManager.onSave){
					editor.getTextView().setAction("save", dojo.hitch(this, function () { //$NON-NLS-0$
						var contents = editor.getText();
						this.inputManager.onSave(this.inputManager.getInput(), contents,
												dojo.hitch(this, function(result) {
													editor.setInput(this.inputManager.getInput(), null, contents, true);
													if(this.inputManager.afterSave){
														this.inputManager.afterSave();
													}
												}),
												dojo.hitch(this, function(error) {
													error.log = true;
												})
						);
						return true;
					}), {name: messages['Save']});
				} else {
					editor.getTextView().setAction("save", dojo.hitch(this, function () { //$NON-NLS-0$
						var contents = editor.getText();
						var etag = this.inputManager.getFileMetadata().ETag;
						var args = { "ETag" : etag }; //$NON-NLS-0$
						this.fileClient.write(this.inputManager.getInput(), contents, args).then(
								dojo.hitch(this, function(result) {
									this.inputManager.getFileMetadata().ETag = result.ETag;
									editor.setInput(this.inputManager.getInput(), null, contents, true);
									if(this.inputManager.afterSave){
										this.inputManager.afterSave();
									}
								}),
								dojo.hitch(this, function(error) {
									// expected error - HTTP 412 Precondition Failed 
									// occurs when file is out of sync with the server
									if (error.status === 412) {
										var forceSave = confirm(messages["Resource is out of sync with the server. Do you want to save it anyway?"]);
										if (forceSave) {
											// repeat save operation, but without ETag 
											this.fileClient.write(this.inputManager.getInput(), contents).then(
													dojo.hitch(this, function(result) {
														this.inputManager.getFileMetadata().ETag = result.ETag;
														editor.setInput(this.inputManager.getInput(), null, contents, true);
														if(this.inputManager.afterSave){
															this.inputManager.afterSave();
														}
													}, handleError));
										}
									} else {
										// unknown error
										handleError(error);
									}
								})
						);
						return true;
					}), {name: messages['Save']});
				}
				var saveCommand = new mCommands.Command({
					name: messages['Save'],
					tooltip: messages["Save this file"],
					id: "orion.save", //$NON-NLS-0$
					callback: function(data) {
						data.items.getTextView().invokeAction("save"); //$NON-NLS-0$
					}});
					
				
					
				this.commandService.addCommand(saveCommand);
				this.commandService.registerCommandContribution(this.toolbarId, "orion.save", 1, null, false, new mCommands.CommandKeyBinding('s', true)); //$NON-NLS-1$ //$NON-NLS-0$
				
				
				if( document.webkitCancelFullScreen || document.mozCancelFullScreen ){
				
					editor.getTextView().setAction("fullscreen", dojo.hitch(this, function (){ 
						var element = document.getElementById('innerPanels'); 
						
						if( element.webkitRequestFullScreen ){
							element.webkitRequestFullScreen(); 
						}else if( element.mozRequestFullScreen ){
							element.mozRequestFullScreen(); 
						}
					}));
						
				    editor.getTextView().setAction("normalscreen", dojo.hitch(this, function (){ 
						var element = document.getElementById('innerPanels');
						if( document.webkitCancelFullScreen ){
							document.webkitCancelFullScreen(); 
						}else if( document.mozCancelFullScreen ){
							document.mozCancelFullScreen();
						}
					}));
	
					
					var fullScreenCommand = new mCommands.Command({
					
						name: 'Fullscreen',
						tooltip: 'Edit in full screen mode',
						id: "orion.fullscreen",
						callback: function(data){
						
							if( data.domNode.innerHTML === 'Fullscreen' ){
								data.domNode.innerHTML = 'Exit Fullscreen';
								data.items.getTextView().invokeAction("fullscreen");
							}else{
								data.domNode.innerHTML = 'Fullscreen';
								
								data.items.getTextView().invokeAction("normalscreen");
							}
						}
					});
					
					this.commandService.addCommand(fullScreenCommand);
					this.commandService.registerCommandContribution(this.toolbarId, "orion.fullscreen", 1, null, false, new mCommands.CommandKeyBinding('u', true)); //$NON-NLS-1$ //$NON-NLS-0$
	
				}
		
				// page navigation commands (go to line)
				var lineParameter = new mCommands.ParametersDescription([new mCommands.CommandParameter('line', 'number', 'Line:')], {hasOptionalParameters: false}, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
																		function() {
																			var line = editor.getModel().getLineAtOffset(editor.getCaretOffset()) + 1;
																			return [new mCommands.CommandParameter('line', 'number', 'Line:', line.toString())]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
																		});
				
				var gotoLineCommand =  new mCommands.Command({
					name: messages["Go to Line"],
					tooltip: messages["Go to specified line number"],
					id: "orion.gotoLine", //$NON-NLS-0$
					parameters: lineParameter,
					callback: function(data) {
						var line;
						var model = editor.getModel();
						if (data.parameters && data.parameters.valueFor('line')) { //$NON-NLS-0$
							line = data.parameters.valueFor('line'); //$NON-NLS-0$
						} else {
							line = model.getLineAtOffset(editor.getCaretOffset());
							line = prompt(messages["Go to line:"], line + 1);
							if (line) {
								line = parseInt(line, 10);
							}
						}
						if (line) {
							editor.onGotoLine(line - 1, 0);
						}
					}});
				this.commandService.addCommand(gotoLineCommand);
				this.commandService.registerCommandContribution(this.pageNavId, "orion.gotoLine", 1, null, true, new mCommands.CommandKeyBinding('l', true), new mCommands.URLBinding("gotoLine", "line")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				// override the editor binding 
				editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding('l', true), "gotoLine"); //$NON-NLS-1$ //$NON-NLS-0$
				editor.getTextView().setAction("gotoLine", dojo.hitch(this, function () { //$NON-NLS-0$
					this.commandService.runCommand("orion.gotoLine"); //$NON-NLS-0$
					return true;
				}), gotoLineCommand);

				// find&&replace commands (find)
				var findParameter = new mCommands.ParametersDescription([new mCommands.CommandParameter('find', 'text', 'Find:')], {clientCollect: true}, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
																		function() {
																			var selection = editor.getSelection();
																			var searchString = "";
																			if (selection.end > selection.start) {
																				var model = editor.getModel();
																				searchString = model.getText(selection.start, selection.end);
																			}
																			return [new mCommands.CommandParameter('find', 'text', 'Find:', searchString)]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
																		});
				var that = this;
				var findCommand =  new mCommands.Command({
					name: messages["Find"],
					tooltip: messages["Find"],
					id: "orion.editor.find", //$NON-NLS-0$
					parameters: findParameter,
					callback: function(data) {
						if (that._searcher) {
							var searchString = "";
							var parsedParam = null;
							var selection = editor.getSelection();
							if (selection.end > selection.start) {//If there is selection from editor, we want to use it as the default keyword
								var model = editor.getModel();
								searchString = model.getText(selection.start, selection.end);
								fromSelection = true;
							} else {//If there is no selection from editor, we want to parse the parameter from URL binding
								if (data.parameters && data.parameters.valueFor('find')) { //$NON-NLS-0$
									var findParam = data.parameters.valueFor('find');
									var parsedParam = mSearchUtils.parseFindURLBinding(findParam);
									searchString = parsedParam.searchStr;
								}
							}
							if(parsedParam){
								that._searcher.setOptions({useRegExp: parsedParam.useRegExp});
								if(parsedParam.lineNumber){
									var offset = editor.getModel().getLineStart(parsedParam.lineNumber-1);
									editor.moveSelection(offset, offset, function(){
										that._searcher.buildToolBar(searchString, parsedParam ? parsedParam.replaceStr : null);
										that._searcher.findNext(true);
										}, 
									focus);
								} else {
									that._searcher.buildToolBar(searchString, parsedParam ? parsedParam.replaceStr : null);
									that._searcher.findNext(true);
								}
							} else {
								that._searcher.buildToolBar(searchString);
							}
							return true;
						}
						return false;
					}});
				this.commandService.addCommand(findCommand);
				this.commandService.registerCommandContribution(this.pageNavId, "orion.editor.find", 2, null, true, new mCommands.CommandKeyBinding('f', true), new mCommands.URLBinding("find", "find")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				// override the editor binding 
				editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding('f', true), "find"); //$NON-NLS-1$ //$NON-NLS-0$
				editor.getTextView().setAction("find", dojo.hitch(this, function () { //$NON-NLS-0$
					this.commandService.runCommand("orion.editor.find"); //$NON-NLS-0$
					return true;
				}), findCommand);

				// add the commands generated by plug-ins who implement the "orion.edit.command" extension.
		
				// Note that the shape of the "orion.edit.command" extension is not in any shape or form that could be considered final.
				// We've included it to enable experimentation. Please provide feedback in the following bug:
				// https://bugs.eclipse.org/bugs/show_bug.cgi?id=337766
		
				// The shape of the contributed actions is (for now):
				// info - information about the action (object).
				//        required attribute: name - the name of the command
				//        required attribute: id - the id of the action, namespace qualified
				//        optional attribute: tooltip - the tooltip to use for the command
				//        optional attribute: key - an array with values to pass to the orion.textview.KeyBinding constructor
				//        optional attribute: img - a URL to an image for the action
				//      optional attribute: contentType - an array of content types for which this command is valid
				//      optional attribute: validationProperties - an array of validation properties used to read the resource
				//          metadata to determine whether the command is valid for the given resource.  Regular expression patterns are
				//          supported as values in addition to specific values.
				//          For example the validation property
				//				[{source: "Git"}, {source: "Directory", match:"true"}]
				//              specifies that the property "Git" must be present, and that the property "Directory" must be true.
				// run - the implementation of the action (function).
				//        arguments passed to run: (selectedText, fullText, selection, resourceName)
				//          selectedText (string) - the currently selected text in the editor
				//          fullText (string) - the complete text of the editor
				//          selection (object) - an object with attributes: start, end
				//          resourceName (string) - the resource being edited
				//        the return value of the run function will be used as follows:
				//          if the return value is a string, the current selection in the editor will be replaced with the returned string
				//          if the return value is an object, its "text" attribute (required) will be used to replace the contents of the editor,
				//                                            and its "selection" attribute (optional) will be used to set the new selection.
			
				// iterate through the extension points and generate commands for each one.
				var actionReferences = this.serviceRegistry.getServiceReferences("orion.edit.command"); //$NON-NLS-0$
				var input = this.inputManager;
				var makeCommand = function(info, service, options) {
					options.callback = dojo.hitch(editor, function(data) {
							// command service will provide editor parameter but editor widget callback will not
							editor = data ? data.items || this : this;
							var selection = editor.getSelection();
							var model = editor.getModel();
							var text = model.getText();
							service.run(model.getText(selection.start,selection.end),text,selection, input.getInput()).then(function(result){
								if (result && result.text) {
									editor.setText(result.text);
									if (result.selection) {
										editor.setSelection(result.selection.start, result.selection.end);
										editor.getTextView().focus();
									}
								} else {
									if (typeof result === 'string') { //$NON-NLS-0$
										editor.setText(result, selection.start, selection.end);
										editor.setSelection(selection.start, selection.start + result.length);
										editor.getTextView().focus();
									}
								}
							});
							return true;
						});
					return new mCommands.Command(options);
				};
				dojo.when(getContentTypes(this.serviceRegistry), dojo.hitch(this, function() {
					var deferreds = [];
					for (var i=0; i<actionReferences.length; i++) {
						var serviceReference = actionReferences[i];
						var service = this.serviceRegistry.getService(actionReferences[i]);
						var info = {};
						var propertyNames = actionReferences[i].getPropertyKeys();
						for (var j = 0; j < propertyNames.length; j++) {
							info[propertyNames[j]] = actionReferences[i].getProperty(propertyNames[j]);
						}
						info.forceSingleItem = true;  // for compatibility with mExtensionCommands._createCommandOptions
						
						var deferred = mExtensionCommands._createCommandOptions(info, serviceReference, this.serviceRegistry, contentTypesCache, false, function(items) {
							// items is the editor and we care about the file metadata for validation
							return input.getFileMetadata();
						});
						deferreds.push(deferred);	
						deferred.then(dojo.hitch(this, function(commandOptions){
							var command = makeCommand(info, service, commandOptions);
							this.commandService.addCommand(command);
							this.commandService.registerCommandContribution(this.toolbarId, command.id, 100+i);
							if (info.key) {
								// add it to the editor as a keybinding
								var textView = editor.getTextView();
								textView.setKeyBinding(createKeyBinding(info.key), command.id);
								textView.setAction(command.id, command.callback, command);
							}				
						}));
					}
					new dojo.DeferredList(deferreds).addBoth(dojo.hitch(this, function(){
						// In the editor, we generate page level commands to the banner.  Don't bother if we don't know the input
						// metadata, because we'll generate again once we know.
						if (input.getFileMetadata()) {
							var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
							if (toolbar) {	
								this.commandService.destroy(toolbar);
								this.commandService.renderCommands(toolbar.id, toolbar, editor, editor, "button"); //$NON-NLS-0$
							}
							toolbar = dojo.byId("pageNavigationActions"); //$NON-NLS-0$
							if (toolbar) {	
								this.commandService.destroy(toolbar);
								this.commandService.renderCommands(toolbar.id, toolbar, editor, editor, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
							}						}
					}));
				}));
			}
		}
	};
	return EditorCommandFactory;
}());

exports.UndoCommandFactory = (function() {
	function UndoCommandFactory(serviceRegistry, commandService, toolbarId) {
		this.serviceRegistry = serviceRegistry;
		this.commandService = commandService;
		this.toolbarId = toolbarId;
	}
	UndoCommandFactory.prototype = {
		createUndoStack: function(editor) {
			var undoStack =  new mUndoStack.UndoStack(editor.getTextView(), 200);
			var undoCommand = new mCommands.Command({
				name: messages['Undo'],
				id: "orion.undo", //$NON-NLS-0$
				callback: function(data) {
					data.items.getTextView().invokeAction("undo"); //$NON-NLS-0$
				}});
			editor.getTextView().setAction("undo", function() { //$NON-NLS-0$
				undoStack.undo();
				return true;
			}, undoCommand);
			this.commandService.addCommand(undoCommand);
			
			var redoCommand = new mCommands.Command({
				name: messages['Redo'],
				id: "orion.redo", //$NON-NLS-0$
				callback: function(data) {
					data.items.getTextView().invokeAction("redo"); //$NON-NLS-0$
				}});
			editor.getTextView().setAction("redo", function() { //$NON-NLS-0$
				undoStack.redo();
				return true;
			}, redoCommand);
	
			this.commandService.addCommand(redoCommand);
	
			this.commandService.registerCommandContribution(this.toolbarId, "orion.undo", 400, null, true, editor.getTextView().getKeyBindings("undo")[0]); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.registerCommandContribution(this.toolbarId, "orion.redo", 401, null, true, editor.getTextView().getKeyBindings("redo")[0]); //$NON-NLS-1$ //$NON-NLS-0$

			return undoStack;
		}
	};
	return UndoCommandFactory;
}());

return exports;	
});
