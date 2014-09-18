/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
/*global prompt URL*/
define([
    'i18n!orion/compare/nls/messages',
    'orion/i18nUtil',
    'orion/Deferred', 
    'orion/webui/littlelib', 
    'orion/compare/compareUtils', 
    'orion/compare/diffProvider', 
    'orion/compare/compareView', 
    'orion/highlight', 
	'orion/fileClient', 
	'orion/globalCommands', 
	'orion/commands', 
	'orion/keyBinding', 
	'orion/searchAndReplace/textSearcher', 
	'orion/editorCommands', 
	'orion/objects', 
	'orion/inputManager', 
	'orion/editor/editorFeatures', 
	'orion/contentTypes', 
	'orion/URL-shim'
], function(messages, i18nUtil, Deferred, lib, mCompareUtils, mDiffProvider, mCompareView, Highlight, mFileClient, mGlobalCommands, mCommands, mKeyBinding, mSearcher, mEditorCommands, objects, mInputManager, mEditorFeatures, mContentTypes) {

var exports = {};

exports.DefaultDiffProvider = (function() {
	function DefaultDiffProvider(serviceRegistry){
		this.serviceRegistry = serviceRegistry;
		this._diffProvider = new mDiffProvider.DiffProvider(serviceRegistry);
	}	
	DefaultDiffProvider.prototype = {
		_resolveTwoFiles: function(oldFileURL, newFileURL){
			var that = this;
			var compareTwo = function(results) {
				if(Array.isArray(results) && results.length === 2 && results[0] && results[1]){
					var oldFileContentType = results[0];
					var newFileContentType = results[1];
					return new Deferred().resolve({ oldFile:{URL: oldFileURL, Name: that._resolveFileName(oldFileURL), Type: oldFileContentType},
								newFile:{URL: newFileURL, Name: that._resolveFileName(newFileURL), Type: newFileContentType},
								diffContent: that._diffContent
							 });
				} else {
					var oldFileName = oldFileURL ? that._resolveFileName(oldFileURL) : ""; //$NON-NLS-0$
					var newFileName = newFileURL ? that._resolveFileName(newFileURL) : ""; //$NON-NLS-0$
					return new Deferred().resolve({ oldFile:{URL: oldFileURL, Name: oldFileName, Type: null},
								newFile:{URL: newFileURL, Name: newFileName, Type: null},
								diffContent: that._diffContent
							 });
				}
			};
			return Deferred.all([ that._getContentType(oldFileURL), that._getContentType(newFileURL)], function(error) { return {_error: error}; }).then(compareTwo);
		},
		
		//TODO : get the file name from file service
		_resolveFileName: function(fileURL){
			var fileName = fileURL.split("?")[0]; //$NON-NLS-0$
			return fileName;
		},
		
		_getContentType: function(fileURL){
			var filename = this._resolveFileName(fileURL);
			return this.serviceRegistry.getService("orion.core.contentTypeRegistry").getFilenameContentType(filename); //$NON-NLS-0$
		},
		
		_resolveComplexFileURL: function(complexURL) {
			var that = this;
			return this._diffProvider.getDiffFileURI(complexURL).then(function(jsonData, secondArg) {
				return that._resolveTwoFiles(jsonData.Old, jsonData.New);
			}, function(){});
		},
		
		resolveDiff: function(resource, compareTo, hasConflicts) {
			this._hasConflicts = hasConflicts;
			if(compareTo){
				return this._resolveTwoFiles(compareTo, resource);
			} else {
				if(!this._diffProvider){
					console.log("A diff provider is needed for compound diff URL"); //$NON-NLS-0$
					return;
				}
				var that = this;
				if(that._hasConflicts) {
					return that._diffProvider.getDiffContent(resource).then(function(jsonData, secondArg) {
						that._diffContent = jsonData.split("diff --git")[1]; //$NON-NLS-0$
						return that._resolveComplexFileURL(resource);
					}, function(){});
				} else {// We do not need to get diff contents from server if there is no conflicts. We use client side diff here.
					return that._resolveComplexFileURL(resource);
				}
			}
		}
	};
	return DefaultDiffProvider;
}());

function CompareStyler(registry){
	this._syntaxHighlither = new Highlight.SyntaxHighlighter(registry);
}	
CompareStyler.prototype = {
	highlight: function(fileName, contentType, editor) {
		return this._syntaxHighlither.setup(contentType, editor.getTextView(), 
									 null, //passing an AnnotationModel allows the styler to use it to annotate tasks/comment folding/etc, but we do not really need this in compare editor
									 fileName,
									 false /*bug 378193*/);
	}
};

exports.ResourceComparer = (function() {
	function ResourceComparer (serviceRegistry, commandRegistry, options, viewOptions) {
		this._registry = serviceRegistry;
		this._commandService = commandRegistry;
		this._fileClient = new mFileClient.FileClient(serviceRegistry);
		this._fileClient = new mFileClient.FileClient(serviceRegistry);
		this._searchService = this._registry.getService("orion.core.search"); //$NON-NLS-0$
		this._progress = this._registry.getService("orion.page.progress"); //$NON-NLS-0$
		this.setOptions(options, true);
		if(options.toggleable) {
			this._compareView = new mCompareView.toggleableCompareView(options.type === "inline" ? "inline" : "twoWay", viewOptions); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		} else if(options.type === "inline") { //$NON-NLS-0$
			this._compareView = new mCompareView.inlineCompareView(viewOptions);
		} else {
			this._compareView = new mCompareView.TwoWayCompareView(viewOptions);
		}
		this._compareView.getWidget().setOptions({extCmdHolder: this});
		if(!viewOptions.highlighters){
			this._compareView.getWidget().setOptions({highlighters: [new CompareStyler(serviceRegistry), new CompareStyler(serviceRegistry)]});
		} 
		if(!viewOptions.oldFile){//Create a default file option object for right side 
			this._compareView.getWidget().setOptions({oldFile: {readonly: this._checkReadonly(options.readonlyRight)}});
		}
		if(!viewOptions.newFile){//Create a default file option object for left side
			this._compareView.getWidget().setOptions({newFile: {readonly: this._checkReadonly(options.readonly, true)}});
		}
		this.initExtCmds();
		this._initInputManagers();
		this._compareView.getWidget().initEditors( messages['fetching...']);
		this._inputManagers.forEach(function(inputManager) {
			if(inputManager.manager){
				var editor = this._compareView.getWidget().getEditors()[inputManager.manager._editorIndex];
				editor.addEventListener("DirtyChanged", function(evt) { //$NON-NLS-0$
					inputManager.manager.setDirty(editor.isDirty());
				});
			}
		}.bind(this));
	}
	ResourceComparer.prototype = {
		_clearOptions: function(){
			this.options = {};
		},
		_checkReadonly: function(readonlyFlag, isLeft){
			if(isLeft){//Legacy: If not defined, left side readonly is false
				return typeof readonlyFlag === "undefined" ? false : readonlyFlag; //$NON-NLS-0$
			} else {//Legacy: If not defined, right side readonly is true
				return typeof readonlyFlag === "undefined" ? true : readonlyFlag; //$NON-NLS-0$
			}
		},
		_getFileOptions: function(editorIndex) {
			return (editorIndex === 1 ? this._compareView.getWidget().options.newFile : this._compareView.getWidget().options.oldFile);
		},
		_createInputManager: function() {
			return new mInputManager.InputManager({
						serviceRegistry: this._registry,
						fileClient: this._fileClient,
						progressService: this._progress
			});
		},
		_initInputManagers: function() {
			this._inputManagers = [{}, {}];
			//We only create input managers when it is a non toggleable side by side compare widget
			if(!this.options.toggleable && this._compareView.getWidget()._uiFactory && this._compareView.getWidget().type === "twoWay") { //$NON-NLS-0$
				//Create the right hand side input manager
				if(!this._checkReadonly(this.options.readonlyRight)) {
					this._inputManagers[0].manager = this._createInputManager();
					this._initInputManager(this._inputManagers[0].manager, 0, this._compareView.getWidget()._uiFactory.getActionDivId());
				}
				//Create the left hand side input manager
				if(!this._checkReadonly(this.options.readonly, true)) {
					this._inputManagers[1].manager =  this._createInputManager();
					this._initInputManager(this._inputManagers[1].manager, 1, this._compareView.getWidget()._uiFactory.getActionDivId(true));
				}
			}
			var that = this;
			this._inputManagers.forEach(function(inputManager) {
				if(inputManager.manager){
					var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
						var localSearcher = new mSearcher.TextSearcher(editor, that._registry, that._commandService, undoStack);
						var keyBindings = new mEditorFeatures.KeyBindingsFactory().createKeyBindings(editor, undoStack, contentAssist, localSearcher);
						var commandGenerator = new mEditorCommands.EditorCommandFactory({
							serviceRegistry: that._registry,
							commandRegistry: that._commandService,
							fileClient: that._fileClient,
							inputManager: inputManager.manager,
							toolbarId: inputManager.manager._actionBarId,
							readonly: false,
							navToolbarId: "pageNavigationActions", //$NON-NLS-0$
							textSearcher: localSearcher
						});
						var saveCmdId = inputManager.manager._editorIndex === 1 ? "orion.compare.save.left" : "orion.compare.save.right"; //$NON-NLS-1$ //$NON-NLS-0$
						commandGenerator.generateSimpleEditorCommands(editor, saveCmdId);
						return keyBindings;
					};
					this._getFileOptions(inputManager.manager._editorIndex).keyBindingFactory = keyBindingFactory;
				}
			}.bind(this));
		},
		_initInputManager: function(inputManger, editorIndex, actionBarId){
			var that = this;
			objects.mixin(inputManger, {
				filePath: "",
				_editorIndex: editorIndex,
				_actionBarId: actionBarId,
				getInput: function() {
					return this.filePath;
				},
				
				setDirty: function(dirty) {
					var editors = that._compareView.getWidget().getEditors();
					var checkedDirty = dirty;
					if(editors && editors.length === 2){
						checkedDirty = editors[0].isDirty() || editors[1].isDirty();
					}
					mGlobalCommands.setDirtyIndicator(checkedDirty);
					if(that._compareView.getWidget().refreshTitle){
						that._compareView.getWidget().refreshTitle(this._editorIndex, dirty);
					}
				},
				
				getFileMetadata: function() {
					return this._fileMetadata;
				},
				
				getEditor: function() {
					return that._compareView.getWidget().getEditors()[this._editorIndex];
				},
							
				setInput: function(fileURI, editor) {
					this._parsedLocation = {resource:fileURI};
					that._progress.progress(that._fileClient.read(fileURI, true), i18nUtil.formatMessage(messages["readingFileMetadata"], fileURI)).then( //$NON-NLS-0$
						function(metadata) {
							this._fileMetadata = metadata;
							var toolbar = lib.node(this._actionBarId); //$NON-NLS-0$
							if (toolbar) {	
								that._commandService.destroy(toolbar);
								var editorIndex = this._editorIndex;
								that._commandService.renderCommands(toolbar.id, toolbar, that._compareView.getWidget().getEditors()[editorIndex], that._compareView.getWidget().getEditors()[editorIndex], "tool"); //$NON-NLS-0$
							}
							if(metadata){
								this.setTitle(metadata.Location, metadata);
							}
						}.bind(this),
						function(error) {
							console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
							this.setTitle(fileURI);
						}.bind(this)
					);
					this.lastFilePath = fileURI;
				},
				
				setTitle : function(title, /*optional*/ metadata) {
					var name;
					if (metadata) {
						name = metadata.Name;
					}
					mGlobalCommands.setPageTarget({task: messages["compareTreeTitle"], name: name, target: metadata,
								serviceRegistry: that._registry, commandService: that._commandService,
								searchService: that._searchService, fileService: that._fileClient});
					if (title.charAt(0) === '*') { //$NON-NLS-0$
						mGlobalCommands.setDirtyIndicator(true);
					} else {
						mGlobalCommands.setDirtyIndicator(false);
					} 
				},
				
				afterSave: function(){
					var editors = that._compareView.getWidget().getEditors();
					var newContents = editors[this._editorIndex].getTextView().getText();
					var fileObj = that._getFileOptions(this._editorIndex);
					fileObj.Content = newContents;
					that._compareView.getWidget().refresh();
				}
			});
		},
		setOptions: function(options, clearExisting){
			if(clearExisting){
				this._clearOptions();
			}
			if(!this.options) {
				this.options = {};
			}
			if(options) {
				Object.keys(options).forEach(function(option) {
					this.options[option] = options[option];
				}.bind(this));
			}
		},
		generateLink: function(compareWidget){	
			var diffPos = compareWidget.getCurrentDiffPos();
			var href = mCompareUtils.generateCompareHref(this.options.resource, {
				compareTo: this.options.compareTo ? this.options.compareTo : undefined,
				readonly: this.options.readonly,
				readonlyRight: this.options.readonlyRight,
				conflict: this.options.hasConflicts,
				block: diffPos.block ? diffPos.block : 1, 
				change: diffPos.change ? diffPos.change : 0 
			});
			var url = new URL(href, window.location.href).href;
			prompt(messages["Copy the link URL:"], url);
		},
		openComparePage: function(compareWidget){	
			var diffPos = compareWidget.getCurrentDiffPos();
			var href = mCompareUtils.generateCompareHref(this.options.resource, {
				compareTo: this.options.compareTo ? this.options.compareTo : undefined,
				readonly: !this.options.editableInComparePage,
				conflict: this.options.hasConflicts,
				block: diffPos.block ? diffPos.block : 1, 
				change: diffPos.change ? diffPos.change : 0 
			});
			return href;
		},
		initExtCmds: function() {
			var cmdProvider = this._compareView.getWidget().options.commandProvider;
			if(cmdProvider && cmdProvider.getOptions().commandSpanId) {
				var commandSpanId = cmdProvider.getOptions().commandSpanId;
				var generateLinkCommand = new mCommands.Command({
					tooltip : messages["GenerateCurDiffLink"],
					name: messages["Generate Link"],
					//imageClass : "core-sprite-link", //$NON-NLS-0$
					id: "orion.compare.generateLink", //$NON-NLS-0$
					groupId: "orion.compareGroup", //$NON-NLS-0$
					visibleWhen: function(item) {
						return item.options.extCmdHolder.options.resource && item.options.extCmdHolder.options.generateLink;
					},
					callback : function(data) {
						data.items.options.extCmdHolder.generateLink(data.items);
				}});
				var openComparePageCommand = new mCommands.Command({
					tooltip : messages["Open the compare page"],
					name: messages["Compare"],
					imageClass : "git-sprite-compare", //$NON-NLS-0$
					id: "orion.compare.openComparePage", //$NON-NLS-0$
					groupId: "orion.compareGroup", //$NON-NLS-0$
					visibleWhen: function(item) {
						return item.options.extCmdHolder.options.resource && !item.options.extCmdHolder.options.generateLink;
					},
					hrefCallback: function(data) {
						return data.items.options.extCmdHolder.openComparePage(data.items);
				}});
				this._commandService.addCommand(generateLinkCommand);
				this._commandService.addCommand(openComparePageCommand);
					
				// Register command contributions
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.openComparePage", 98); //$NON-NLS-0$
				this._commandService.registerCommandContribution(commandSpanId, "orion.compare.generateLink", 99, null, false, new mKeyBinding.KeyBinding('l', true, true)); //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
	    _getFilesContents: function(files){
	        var promises = [];
			files.forEach(function(file) {
				promises.push(this._loadSingleFile(file));
			}.bind(this));
			return Deferred.all(promises, function(error) { return {_error: error}; });
	    },
	    _loadSingleFile: function(file) {
	        return this._registry.getService("orion.page.progress").progress(this._fileClient.read(file.URL), //$NON-NLS-0$
	                   i18nUtil.formatMessage(messages["readingFile"], file.URL)).then( //$NON-NLS-0$
		        function(contents) {
					file.Content = contents;
					return file;
		        }.bind(this),
		        function(error, ioArgs) {
					if (error.status === 404) {
						file.Content = "";
					} else {
						//TODO: show file loading error in the appropriate editor(error, ioArgs);
					}
					return file;
		        }.bind(this)
			);
	    },
		start: function(){
			if(this.options.resource){
				if(!this.options.diffProvider){
					console.log("A diff provider is needed for Complex diff URL"); //$NON-NLS-0$
					return;
				}
				var that = this;
				return that.options.diffProvider.resolveDiff(that.options.resource, that.options.compareTo, that.options.hasConflicts).then( function(diffParam){
					that._compareView.getWidget().setOptions(diffParam);
					var isImage = mContentTypes.isImage(diffParam.newFile.Type);
					var viewOptions = that._compareView.getWidget().options;
					if(that._checkReadonly(that.options.readonlyRight) || isImage) {
						viewOptions.oldFile.readonly = true;
					}
					if(that._checkReadonly(that.options.readonly, true) || isImage) {
						viewOptions.newFile.readonly = true;
					}
					if(isImage){
						that._compareView.initImageMode();
						return that._compareView.getWidget().refresh().then(function(height){
							return new Deferred().resolve(height + 5);
						});
					} else {
						var filesToLoad = ( viewOptions.diffContent ? [viewOptions.oldFile/*, viewOptions.newFile*/] : [viewOptions.oldFile, viewOptions.newFile]); 
						return that._getFilesContents(filesToLoad).then( function(){
							var viewHeight = that._compareView.getWidget().refresh(true);
							this._inputManagers.forEach(function(inputManager) {
								if(inputManager.manager){
									var fileOptions = that._getFileOptions(inputManager.manager._editorIndex);
									var editor = that._compareView.getWidget().getEditors()[inputManager.manager._editorIndex];
									inputManager.manager.filePath = fileOptions.URL;
									inputManager.manager.setInput(fileOptions.URL , editor);
								}
							});
							return new Deferred().resolve(viewHeight);
						}.bind(that));
					}
				});
			}
		}
	};
	return ResourceComparer;
}());

return exports;
});