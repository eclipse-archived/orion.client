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
/*global define eclipse:true orion:true dojo window*/

define(['i18n!orion/edit/nls/messages', 'require', 'dojo', 'orion/selection', 'orion/status', 'orion/progress', 'orion/dialogs',
        'orion/commands', 'orion/favorites', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/outliner',
        'orion/problems', 'orion/editor/contentAssist', 'orion/editorCommands', 'orion/editor/editorFeatures', 'orion/editor/editor', 'orion/syntaxchecker',
        'orion/textview/textView', 'orion/textview/textModel', 
        'orion/textview/projectionTextModel', 'orion/textview/keyBinding','orion/searchAndReplace/textSearcher',
        'orion/edit/dispatcher', 'orion/contentTypes', 'orion/PageUtil', 'orion/highlight', "orion/i18nUtil", 'orion/edit/syntaxmodel', 'orion/widgets/themes/editor/MiniThemeChooser',
       'dojo/hash'], 
		function(messages, require, dojo, mSelection, mStatus, mProgress, mDialogs, mCommands, mFavorites,
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
	
	// Initialize the plugin registry
	(function() {
		selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		statusReportingService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

		// Editor needs additional services besides EAS.
		problemService = new mProblems.ProblemService(serviceRegistry);
		outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferences: preferences});
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
	}());
	
	var outlineDomNode = dojo.byId("outline"), //$NON-NLS-0$
		editorDomNode = dojo.byId("editor"), //$NON-NLS-0$
		searchFloat = dojo.byId("searchFloat"); //$NON-NLS-0$

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
			parseNumericParams(input, ["start", "end", "line", "offset", "length"]);
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
					var setInput = dojo.hitch(this, function(contents, metadata) {
						var altPageTarget, name;
						if (metadata) {
							this._fileMetadata = metadata;
							var toolbar = dojo.byId("pageActions"); //$NON-NLS-0$
							if (toolbar) {	
								commandService.destroy(toolbar);
								commandService.renderCommands(toolbar.id, toolbar, editor, editor, "button"); //$NON-NLS-0$
							}
							toolbar = dojo.byId("pageNavigationActions"); //$NON-NLS-0$
							if (toolbar) {	
								commandService.destroy(toolbar);
								commandService.renderCommands(toolbar.id, toolbar, editor, editor, "button");  // use true when we want to force toolbar items to text //$NON-NLS-0$
							}
							this.setTitle(metadata.Location);
							this._contentType = contentTypeService.getFileContentType(metadata);
							// page target is the file, but if any interesting links fail, try the parent folder metadata.
							altPageTarget = function() {
								if (metadata.Parents && metadata.Parents.length > 0) {
									return fileClient.read(metadata.Parents[0].Location, true);
								}
							};
							name = metadata.Name;
						} else {
							// No metadata
							this._fileMetadata = null;
							this.setTitle(fileURI);
							this._contentType = contentTypeService.getFilenameContentType(this.getTitle());
							name = this.getTitle();
						}
						
						var chooser = new mThemeChooser.MiniThemeChooser( preferences, editor.getTextView() );
	
						mGlobalCommands.addSettings( chooser );
						
						mGlobalCommands.setPageTarget({task: "Coding", name: name, target: metadata,
							isFavoriteTarget: true, makeAlternate: function() {
								if (metadata.Parents && metadata.Parents.length > 0) {
									return fileClient.read(metadata.Parents[0].Location, true);
								}
							},
							serviceRegistry: serviceRegistry, commandService: commandService,
							searchService: searcher, fileService: fileClient});
						mGlobalCommands.setDirtyIndicator(false);
						syntaxHighlighter.setup(this._contentType, editor.getTextView(), editor.getAnnotationModel(), fileURI, true)
							.then(dojo.hitch(this, function() {
								// TODO folding should be a preference.
								var styler = syntaxHighlighter.getStyler();
								editor.setFoldingEnabled(styler && styler.foldingEnabled);
								setOutlineProviders(this._contentType, location);
								if (!dispatcher) {
									dispatcher = new mDispatcher.Dispatcher(serviceRegistry, editor, this._contentType);
								}
								// Contents
								editor.setInput(fileURI, null, contents);
								editor.showSelection(input.start, input.end, input.line, input.offset, input.length);
								commandService.processURL(window.location.href);
							}));
						clearTimeout(progressTimeout);
					});
					var load = dojo.hitch(this, function(results) {
						var contentsOk = results[0][0], contents = contentsOk ? results[0][1] : null;
						var metadataOk = results[1][0], metadata = metadataOk ? results[1][1] : null;
						var error;
						clearTimeout(progressTimeout);
						if (!contentsOk) {
							error = results[0][1];
							console.error("HTTP status code: ", error.status); //$NON-NLS-0$
							contents = messages["An error occurred: "] + errorMessage(error);
						}
						if (!metadataOk) {
							error = results[1][1];
							console.error("Error loading file metadata: " + errorMessage(error)); //$NON-NLS-0$
						}
						setInput(contents, metadata);
					});
					new dojo.DeferredList([fileClient.read(fileURI), fileClient.read(fileURI, true)]).then(load, load);
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
			var oldHash = this._lastHash || this.getInput();
			var oldInput = this.getInput();
			selection.setSelections("#" + dojo.hash()); // may prompt, change input, or both //$NON-NLS-0$
			var newHash = dojo.hash();
			var newInput = this.getInput();
			var inputChanged = PageUtil.matchResourceParameters("#" + oldInput).resource !== PageUtil.matchResourceParameters("#" + newInput).resource; //$NON-NLS-1$ //$NON-NLS-0$
			var hashMatchesInput = PageUtil.matchResourceParameters("#" + newInput).resource === PageUtil.matchResourceParameters("#" + newHash).resource; //$NON-NLS-1$ //$NON-NLS-0$
			if (!inputChanged && !hashMatchesInput) {
				dojo.hash(this._lastHash);
			} else if (inputChanged) {
				dojo.hash(newHash);
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
			var handled = false;
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
		
		editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding('w', true, false, true), "toggleWrapMode");
		
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
				dojo.connect(document, "onkeypress", dojo.hitch(this, function (e){  //$NON-NLS-0$
					if (e.charOrCode === dojo.keys.ESCAPE) {
						searchFloat.style.display = "none"; //$NON-NLS-0$
						if(dojo.query("a", searchFloat).indexOf(document.activeElement) !== -1) { //$NON-NLS-0$
							editor.getTextView().focus();
						}
					}
				}));
				
				var searchFloatTabHandler = {
					isActive: function() {
						return searchFloat.style.display === "block"; //$NON-NLS-0$
					},
					
					tab: function() {
						if (this.isActive()) {
							dojo.query("a",searchFloat)[0].focus(); //$NON-NLS-0$
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
									
				dojo.place(document.createTextNode(messages["Searching for occurrences of "]), searchFloat, "last"); //$NON-NLS-1$
				var b = dojo.create("b", null, searchFloat, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode("\"" + searchPattern + "\"..."), b, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				searchFloat.style.display = "block"; //$NON-NLS-0$
				var query = searcher.createSearchQuery(searchPattern, null, "Name", true); //$NON-NLS-0$
				var renderer = searcher.defaultRenderer.makeRenderFunction(null, searchFloat, false);
				searcher.search(query, inputManager.getInput(), renderer, true);
			}, 0);
			return true;
		}, {name: messages["Search Files"]}); //$NON-NLS-0$
	};
	
	// Content Assist
	var contentAssistFactory = isReadOnly ? null
		: {
			createContentAssistMode: function(editor) {
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
	
	// In this page, the hash change drives selection.  In other scenarios, a file picker might drive selection
	dojo.subscribe("/dojo/hashchange", inputManager, function() {inputManager.hashChanged(editor);}); //$NON-NLS-0$
	inputManager.setInput(dojo.hash(), editor);
	
	mGlobalCommands.generateBanner("orion-editor", serviceRegistry, commandService, preferences, searcher, editor, editor, escHandler); //$NON-NLS-0$
		
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
		selectionService: selection});
	if (filteredProviders) {
		outliner.setOutlineProviders(filteredProviders);
	}
		
	function setOutlineProviders(fileContentType, title) {
		var outlineProviders = serviceRegistry.getServiceReferences("orion.edit.outliner");
		filteredProviders = [];
		for (var i=0; i < outlineProviders.length; i++) {
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
		for(var i=0; i<filteredProviders.length; i++){
			if(filteredProviders[i].getProperty("nameKey") && filteredProviders[i].getProperty("nls")){
				var deferred = new dojo.Deferred();
				deferreds.push(deferred);
				i18nUtil.getMessageBundle(filteredProviders[i].getProperty("nls")).then(dojo.hitch(this, function(i, deferred, commandMessages){
					filteredProviders[i].displayName = commandMessages[filteredProviders[i].getProperty("nameKey")];
					deferred.resolve();
				}, i, deferred), dojo.hitch(this, function(i, deferred, error){
					deferred.reject(error);
				}, i, deferred));
			} else {
				filteredProviders[i].displayName = filteredProviders[i].getProperty("name");
			}
		}
		if(deferreds.length===0){
			outlineService.setOutlineProviders(filteredProviders);
			if (outliner) {
				outliner.setOutlineProviders(filteredProviders);
			}
		}else{
			new dojo.DeferredList(deferreds).addBoth(dojo.hitch(this, function(){
				outlineService.setOutlineProviders(filteredProviders);
				if (outliner) {
					outliner.setOutlineProviders(filteredProviders);
				}
			}));
		}
	}
	editor.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
		outlineService.emitOutline(editor.getText(), editor.getTitle());
	});
	dojo.connect(outliner, "setSelectedProvider", function(/**ServiceReference*/ outlineProvider) { //$NON-NLS-0$
		outlineService.setProvider(outlineProvider);
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
