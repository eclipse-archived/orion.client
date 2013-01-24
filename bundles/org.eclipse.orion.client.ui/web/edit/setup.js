/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint browser:true devel:true*/
/*global define eclipse:true orion:true window*/

define(['i18n!orion/edit/nls/messages', 'require', 'orion/Deferred', 'orion/webui/littlelib', 'orion/selection', 'orion/status', 'orion/progress', 'orion/dialogs',
        'orion/commands', 'orion/favorites', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/outliner',
        'orion/problems', 'orion/editor/contentAssist', 'orion/editorCommands', 'orion/editor/editorFeatures', 'orion/editor/editor', 'orion/syntaxchecker',
        'orion/editor/textView', 'orion/editor/textModel', 
        'orion/editor/projectionTextModel', 'orion/editor/keyBinding','orion/searchAndReplace/textSearcher',
        'orion/edit/dispatcher', 'orion/contentTypes', 'orion/PageUtil', 'orion/highlight', 'orion/i18nUtil', 'orion/edit/syntaxmodel', 'orion/widgets/themes/editor/MiniThemeChooser'],
		function(messages, require, Deferred, lib, mSelection, mStatus, mProgress, mDialogs, mCommands, mFavorites,
				mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mOutliner, mProblems, mContentAssist, mEditorCommands, mEditorFeatures, mEditor,
				mSyntaxchecker, mTextView, mTextModel, mProjectionTextModel, mKeyBinding, mSearcher,
				mDispatcher, mContentTypes, PageUtil, Highlight, i18nUtil, SyntaxModelWirer, mThemeChooser) {
	
var exports = exports || {};
	
exports.setUpEditor = function(serviceRegistry, preferences, isReadOnly){
	var document = window.document;
	var selection;
	var commandService;
	var statusReportingService;
	var problemService;
	var outlineService;
	var contentTypeService;
	var progressService;
	
	// Initialize the plugin registry
	(function() {
		selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		statusReportingService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

		// Editor needs additional services
		problemService = new mProblems.ProblemService(serviceRegistry);
		outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferences: preferences});
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
	}());
	
	var outlineDomNode = lib.node("outline"), //$NON-NLS-0$
		editorDomNode = lib.node("editor"), //$NON-NLS-0$
		searchFloat = lib.node("searchFloat"); //$NON-NLS-0$

	var syntaxHighlighter = new Highlight.SyntaxHighlighter(serviceRegistry);
	var syntaxModelWirer = new SyntaxModelWirer(serviceRegistry);
	var fileClient = new mFileClient.FileClient(serviceRegistry);
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
	
	var textViewFactory = function() {
		var textView = new mTextView.TextView({
			parent: editorDomNode,
			model: new mProjectionTextModel.ProjectionTextModel(new mTextModel.TextModel()),
			tabSize: 4,
			readonly: isReadOnly
		});
		return textView;
	};
	
	var dispatcher;
	
	var inputManager = {
		lastFilePath: "",
		
		setInput: function(location, editor) {
			function errorMessage(error) {
				try {
					error = JSON.parse(error.responseText);
					return error.Message;
				} catch(e) {}
				return error.responseText;
			}
			function parseNumericParams(input, params) {
				for (var i=0; i < params.length; i++) {
					var param = params[i];
					if (input[param]) {
						input[param] = parseInt(input[param], 10);
					}
				}
			}
			if (location && location[0] !== "#") { //$NON-NLS-0$
				location = "#" + location; //$NON-NLS-0$
			}
			var input = PageUtil.matchResourceParameters(location);
			var fileURI = input.resource;
			parseNumericParams(input, ["start", "end", "line", "offset", "length"]); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// populate editor
			if (fileURI) {
				if (fileURI === this.lastFilePath) {
					editor.showSelection(input.start, input.end, input.line, input.offset, input.length);
				} else {
					if (!editor.getTextView()) {
						editor.installTextView();
					}
					var fullPathName = fileURI;
					var progressTimeout = setTimeout(function() {
						editor.setInput(fullPathName, messages["Fetching "] + fullPathName, null);
					}, 800); // wait 800ms before displaying
					var self = this;
					var setInput = function(contents, metadata) {
						var altPageTarget, name;
						if (metadata) {
							self._fileMetadata = metadata;
							var toolbar = lib.node("pageActions"); //$NON-NLS-0$
							if (toolbar) {	
								commandService.destroy(toolbar);
								commandService.renderCommands(toolbar.id, toolbar, metadata, editor, "button"); //$NON-NLS-0$
							}
							toolbar = lib.node("pageNavigationActions"); //$NON-NLS-0$
							if (toolbar) {	
								commandService.destroy(toolbar);
								commandService.renderCommands(toolbar.id, toolbar, editor, editor, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
							}
							self.setTitle(metadata.Location);
							self._contentType = contentTypeService.getFileContentType(metadata);
							// page target is the file, but if any interesting links fail, try the parent folder metadata.
							altPageTarget = function() {
								if (metadata.Parents && metadata.Parents.length > 0) {
									return progressService.progress(fileClient.read(metadata.Parents[0].Location, true), "Getting metadata of " + metadata.Parents[0].Location);
								}
							};
							name = metadata.Name;
						} else {
							// No metadata
							self._fileMetadata = null;
							self.setTitle(fileURI);
							self._contentType = contentTypeService.getFilenameContentType(self.getTitle());
							name = self.getTitle();
						}
		
						var chooser = new mThemeChooser.MiniThemeChooser( preferences, editor.getTextView() );
						mGlobalCommands.addSettings( chooser );
						
						mGlobalCommands.setPageTarget({task: "Coding", name: name, target: metadata,  //$NON-NLS-0$
							makeAlternate: function() {
								if (metadata.Parents && metadata.Parents.length > 0) {
									return progressService.progress(fileClient.read(metadata.Parents[0].Location, true), "Getting metadata of " + metadata.Parents[0].Location);
								}
							},
							serviceRegistry: serviceRegistry, commandService: commandService,
							searchService: searcher, fileService: fileClient});
						mGlobalCommands.setDirtyIndicator(false);
						syntaxHighlighter.setup(self._contentType, editor.getTextView(), editor.getAnnotationModel(), fileURI, true)
							.then(function() {
								// TODO folding should be a preference.
								var styler = syntaxHighlighter.getStyler();
								editor.setFoldingEnabled(styler && styler.foldingEnabled);
								setOutlineProviders(self._contentType, location);
								if (!dispatcher) {
									dispatcher = new mDispatcher.Dispatcher(serviceRegistry, editor, self._contentType);
								}
								// Contents
								editor.setInput(fileURI, null, contents);
								editor.showSelection(input.start, input.end, input.line, input.offset, input.length);
								commandService.processURL(window.location.href);
							});
						clearTimeout(progressTimeout);
					};
					var load = function(results) {
						var contentOrError = results[0];
						var metadataOrError = results[1];
						clearTimeout(progressTimeout);
						if (contentOrError._error) {
							console.error("HTTP status code: ", contentOrError._error.status); //$NON-NLS-0$
							contentOrError = messages["An error occurred: "] + errorMessage(contentOrError._error);
						}
						if (metadataOrError._error) {
							console.error("Error loading file metadata: " + errorMessage(metadataOrError._error)); //$NON-NLS-0$
						}
						setInput(contentOrError, metadataOrError);
					};
					new Deferred.all([progressService.progress(fileClient.read(fileURI), "Reading " + fileURI), progressService.progress(fileClient.read(fileURI, true), "Reading metedata of " + fileURI)], function(error) { return {_error: error}; }).then(load);
				}
				this.lastFilePath = fileURI;
			} else {
				editor.setInput(messages["No File Selected"], "", null);
			}
		},
		
		getInput: function() {
			return this.lastFilePath;
		},
			
		setTitle : function(title) {
			var indexOfSlash = title.lastIndexOf("/"); //$NON-NLS-0$
			var shortTitle = title;
			if (indexOfSlash !== -1) {
				shortTitle = shortTitle.substring(indexOfSlash + 1);
			}
			this._lastTitle = shortTitle;
		},
		
		getTitle: function() {
			return this._lastTitle;
		},
		
		getFileMetadata: function() {
			return this._fileMetadata;
		},

		getContentType: function() {
			return this._contentType;
		},

		setDirty: function(dirty) {
			mGlobalCommands.setDirtyIndicator(dirty);
		},
		
		hashChanged: function(editor) {
			var oldInput = this.getInput();
			selection.setSelections(window.location.hash); // may prompt, change input, or both //$NON-NLS-0$
			var newHash = window.location.hash;
			var newInput = this.getInput();
			var inputChanged = PageUtil.matchResourceParameters(oldInput).resource !== PageUtil.matchResourceParameters(newInput).resource; //$NON-NLS-1$ //$NON-NLS-0$
			var hashMatchesInput = PageUtil.matchResourceParameters(newInput).resource === PageUtil.matchResourceParameters(newHash).resource; //$NON-NLS-1$ //$NON-NLS-0$
			if (!inputChanged && !hashMatchesInput) {
				this._lastHash = newHash;
				window.location.hash = this._lastHash[0] === "#" ? this._lastHash.substring(1): this._lastHash; //$NON-NLS-0$
			} else if (inputChanged) {
				this.setInput(newHash, editor);
				this._lastHash = newHash;
			} else {
				// Input didn't change and input matches hash, just remember the current hash
				this._lastHash = newHash;
			}
		},
		
		shouldGoToURI: function(editor, fileURI) {
			if (editor.isDirty()) {
				var oldStripped = PageUtil.matchResourceParameters("#" + this.lastFilePath).resource; //$NON-NLS-0$
				var newStripped = PageUtil.matchResourceParameters(fileURI).resource;
				if (oldStripped !== newStripped) {
					return window.confirm(messages["There are unsaved changes.  Do you still want to navigate away?"]);
				}
			}
			return true;
		}
	};	
	
	var tabHandler = {
		handlers: [],
		
		addHandler: function(handler) {
			this.handlers.push(handler);
		},
		
		cancel: function() {
			return false;
		},
	
		isActive: function() {
			for (var i=0; i<this.handlers.length; i++) {
				if (this.handlers[i].isActive()) {
					return true;
				}
			}
			return false;
		},
	
		lineUp: function() {
			return false;
		},
		lineDown: function() {
			return false;
		},
		enter: function() {
			return false;
		},
		tab: function() {
			for (var i=0; i<this.handlers.length; i++) {
				if (this.handlers[i].isActive()) {
					return this.handlers[i].tab();
				}
				
			}
		}
	};
	
	var escHandler = {
		handlers: [],
		
		addHandler: function(handler) {
			this.handlers.push(handler);
		},
		
		cancel: function() {
			var handled = false;
			// To be safe, we give all our handlers a chance, not just the first one.
			// In case the user has left multiple modal popups open (such as key assist and search)
			for (var i=0; i<this.handlers.length; i++) {
				handled = this.handlers[i].cancel() || handled;
			}
			return handled;
		},
	
		isActive: function() {
			for (var i=0; i<this.handlers.length; i++) {
				if (this.handlers[i].isActive()) {
					return true;
				}
			}
			return false;
		},
	
		lineUp: function() {
			return false;
		},
		lineDown: function() {
			return false;
		},
		enter: function() {
			return false;
		},
		tab: function() {
			return false;
		}
	};
	
	var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
		
		keyModeStack.push(tabHandler);
		
		var localSearcher = new mSearcher.TextSearcher(editor, commandService, undoStack);
		// Create keybindings for generic editing, no dependency on the service model
		var genericBindings = new mEditorFeatures.TextActions(editor, undoStack , localSearcher);
		keyModeStack.push(genericBindings);
		
		// Linked Mode
		var linkedMode = new mEditorFeatures.LinkedMode(editor);
		keyModeStack.push(linkedMode);
		
		// create keybindings for source editing
		// TODO this should probably be something that happens more dynamically, when the editor changes input
		var codeBindings = new mEditorFeatures.SourceCodeActions(editor, undoStack, contentAssist, linkedMode);
		keyModeStack.push(codeBindings);
		
		// Register commands that depend on external services, the registry, etc.  Do this after
		// the generic keybindings so that we can override some of them.
		var commandGenerator = new mEditorCommands.EditorCommandFactory(serviceRegistry, commandService, fileClient, inputManager, "pageActions", isReadOnly, "pageNavigationActions", localSearcher); //$NON-NLS-1$ //$NON-NLS-0$
		commandGenerator.generateEditorCommands(editor);

		
		// give our external escape handler a shot at handling escape
		keyModeStack.push(escHandler);
		
		editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding('w', true, false, true), "toggleWrapMode"); //$NON-NLS-0$
		
		// global search
		editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("h", true), "searchFiles"); //$NON-NLS-1$ //$NON-NLS-0$
		editor.getTextView().setAction("searchFiles", function() { //$NON-NLS-0$
			window.setTimeout(function() {
				var e = editor.getTextView();
				var selection = e.getSelection();
				var searchPattern = "";
				if (selection.end > selection.start) {
					searchPattern = e.getText().substring(selection.start, selection.end);
				} if (searchPattern.length <= 0) {
					searchPattern = prompt(messages["Enter search term:"], searchPattern);
				} if (!searchPattern) {
					return;
				}
				document.addEventListener("keydown", function (e){  //$NON-NLS-0$
					if (e.charOrCode === lib.KEY.ESCAPE) {
						searchFloat.style.display = "none"; //$NON-NLS-0$
						if(lib.$$array("a", searchFloat).indexOf(document.activeElement) !== -1) { //$NON-NLS-0$
							editor.getTextView().focus();
						}
					}
				}, false);
				
				var searchFloatTabHandler = {
					isActive: function() {
						return searchFloat.style.display === "block"; //$NON-NLS-0$
					},
					
					tab: function() {
						if (this.isActive()) {
							lib.$("a",searchFloat).focus(); //$NON-NLS-0$
							return true;
						}
						return false;
					}
				};
				tabHandler.addHandler(searchFloatTabHandler);
				
				var searchFloatEscHandler = {
					isActive: function() {
						return searchFloat.style.display === "block"; //$NON-NLS-0$
					},
					
					cancel: function() {
						if (this.isActive()) {
							searchFloat.style.display = "none"; //$NON-NLS-0$
							return true;
						}
						return false;   // not handled
					}
				};
				escHandler.addHandler(searchFloatEscHandler);
									
				searchFloat.appendChild(document.createTextNode(messages["Searching for occurrences of "])); 
				var b = document.createElement("b"); //$NON-NLS-0$
				searchFloat.appendChild(b);
				b.appendChild(document.createTextNode("\"" + searchPattern + "\"...")); //$NON-NLS-1$ //$NON-NLS-0$
				searchFloat.style.display = "block"; //$NON-NLS-0$
				var searchParams = searcher.createSearchParams(searchPattern, false, true);
				searchParams.sort = "Name asc"; //$NON-NLS-0$
				var renderer = searcher.defaultRenderer.makeRenderFunction(null, searchFloat, false);
				searcher.search(searchParams, inputManager.getInput(), renderer);
			}, 0);
			return true;
		}, {name: messages["Search Files"]}); //$NON-NLS-0$
	};
	
	// Content Assist
	var contentAssistFactory = isReadOnly ? null
		: {
			createContentAssistMode: function(editor) {
				var progress = serviceRegistry.getService("orion.page.progress");
				var contentAssist = new mContentAssist.ContentAssist(editor.getTextView());
				contentAssist.addEventListener("Activating", function() { //$NON-NLS-0$
					// Content assist is about to be activated; set its providers.
					var fileContentType = inputManager.getContentType();
					var fileName = editor.getTitle();
					var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.contentAssist"); //$NON-NLS-0$
					var providers = [];
					for (var i=0; i < serviceReferences.length; i++) {
						var serviceReference = serviceReferences[i],
						    contentTypeIds = serviceReference.getProperty("contentType"), //$NON-NLS-0$
						    pattern = serviceReference.getProperty("pattern"); // backwards compatibility //$NON-NLS-0$
						if ((contentTypeIds && contentTypeService.isSomeExtensionOf(fileContentType, contentTypeIds)) || 
								(pattern && new RegExp(pattern).test(fileName))) {
							providers.push(serviceRegistry.getService(serviceReference));
						}
					}
					contentAssist.setProviders(providers);
					contentAssist.setProgress(progress);
				});
				var widget = new mContentAssist.ContentAssistWidget(contentAssist, "contentassist"); //$NON-NLS-0$
				return new mContentAssist.ContentAssistMode(contentAssist, widget);
			}
		};

	var statusReporter =  function(message, type, isAccessible) {
		if (type === "progress") { //$NON-NLS-0$
			statusReportingService.setProgressMessage(message);
		} else if (type === "error") { //$NON-NLS-0$
			statusReportingService.setErrorMessage(message);
		} else {
			statusReportingService.setMessage(message, null, isAccessible);
		}
	};
	var annotationFactory = new mEditorFeatures.AnnotationFactory();
	
	var editor = new mEditor.Editor({
		textViewFactory: textViewFactory,
		undoStackFactory: new mEditorCommands.UndoCommandFactory(serviceRegistry, commandService, "pageActions"), //$NON-NLS-0$
		textDNDFactory: new mEditorFeatures.TextDNDFactory(),
		annotationFactory: annotationFactory,
		foldingRulerFactory: new mEditorFeatures.FoldingRulerFactory(),
		lineNumberRulerFactory: new mEditorFeatures.LineNumberRulerFactory(),
		contentAssistFactory: contentAssistFactory,
		keyBindingFactory: keyBindingFactory, 
		statusReporter: statusReporter,
		domNode: editorDomNode
	});
	
	// Establishing dependencies on registered services
	serviceRegistry.getService("orion.core.marker").addEventListener("problemsChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
		editor.showProblems(event.problems);
	});
	
	editor.addEventListener("DirtyChanged", function(evt) { //$NON-NLS-0$
		inputManager.setDirty(editor.isDirty());
	});
	
	// Generically speaking, we respond to changes in selection.  New selections change the editor's input.
	selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
		var fileURI = event.selection;
		if (inputManager.shouldGoToURI(editor, fileURI)) {
			inputManager.setInput(fileURI, editor);
		} 
	});
	
	window.addEventListener("hashchange", function() {inputManager.hashChanged(editor);}, false); //$NON-NLS-0$
	inputManager.setInput(window.location.hash, editor);
	
	mGlobalCommands.generateBanner("orion-editor", serviceRegistry, commandService, preferences, searcher, editor, editor, escHandler); //$NON-NLS-0$
	// Put the make favorite command in our toolbar."
	commandService.registerCommandContribution("pageActions", "orion.makeFavorite", 2); //$NON-NLS-1$ //$NON-NLS-0$

		
	var syntaxChecker = new mSyntaxchecker.SyntaxChecker(serviceRegistry, editor);
	editor.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
		syntaxChecker.checkSyntax(inputManager.getContentType(), evt.title, evt.message, evt.contents);
	});
	
	var filteredProviders;
	
	// Create outliner "gadget"
	var outliner = new mOutliner.Outliner({parent: outlineDomNode,
		serviceRegistry: serviceRegistry,
		outlineService: serviceRegistry.getService("orion.edit.outline"), //$NON-NLS-0$
		commandService: commandService,
		selectionService: selection,
		onSelectedProvider: function(/**ServiceReference*/ outlineProvider) { //$NON-NLS-0$
			outlineService.setProvider(outlineProvider);
			outlineService.emitOutline(editor.getText(), editor.getTitle());
		}
	});
	if (filteredProviders) {
		outliner.setOutlineProviders(filteredProviders);
	}
		
	function setOutlineProviders(fileContentType, title) {
		var outlineProviders = serviceRegistry.getServiceReferences("orion.edit.outliner"); //$NON-NLS-0$
		filteredProviders = [];
		var i;
		for (i=0; i < outlineProviders.length; i++) {
			var serviceReference = outlineProviders[i],
			    contentTypeIds = serviceReference.getProperty("contentType"), //$NON-NLS-0$
			    pattern = serviceReference.getProperty("pattern"); // for backwards compatibility //$NON-NLS-0$
			var isSupported = false;
			if (contentTypeIds) {
				isSupported = contentTypeIds.some(function(contentTypeId) {
						return contentTypeService.isExtensionOf(fileContentType, contentTypeId);
					});
			} else if (pattern && new RegExp(pattern).test(title)) {
				isSupported = true;
			}
			if (isSupported) {
				filteredProviders.push(serviceReference);
			}
		}
		var deferreds = []; 
		for(i=0; i<filteredProviders.length; i++){
			if(filteredProviders[i].getProperty("nameKey") && filteredProviders[i].getProperty("nls")){ //$NON-NLS-1$ //$NON-NLS-0$
				var deferred = new Deferred();
				deferreds.push(deferred);
				var provider = filteredProviders[i];
				var getDisplayName = function(commandMessages) { //$NON-NLS-0$
					this.provider.displayName = commandMessages[provider.getProperty("nameKey")]; //$NON-NLS-0$
					this.deferred.resolve();
				};
				i18nUtil.getMessageBundle(provider.getProperty("nls")).then(getDisplayName.bind({provider: provider, deferred: deferred}), deferred.reject); //$NON-NLS-0$
			} else {
				filteredProviders[i].displayName = filteredProviders[i].getProperty("name"); //$NON-NLS-0$
			}
		}
		if(deferreds.length===0){
			outlineService.setOutlineProviders(filteredProviders);
			if (outliner) {
				outliner.setOutlineProviders(filteredProviders);
			}
		}else{
			Deferred.all(deferreds, function(error) { return error; }).then(function(){
				outlineService.setOutlineProviders(filteredProviders);
				if (outliner) {
					outliner.setOutlineProviders(filteredProviders);
				}
			});
		}
	}
	editor.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
		outlineService.emitOutline(editor.getText(), editor.getTitle());
	});
	window.onbeforeunload = function() {
		if (editor.isDirty()) {
			 return messages["There are unsaved changes."];
		}
	};
};
return exports;
});
