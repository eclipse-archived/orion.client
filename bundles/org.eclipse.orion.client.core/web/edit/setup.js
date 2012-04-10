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
/*global define eclipse:true orion:true dojo dijit window*/

define(['require', 'dojo', 'orion/selection', 'orion/status', 'orion/progress', 'orion/dialogs',
        'orion/commands', 'orion/util', 'orion/favorites', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/globalCommands', 'orion/outliner',
        'orion/problems', 'orion/editor/contentAssist', 'orion/editorCommands', 'orion/editor/editorFeatures', 'orion/editor/editor', 'orion/syntaxchecker',
        'orion/breadcrumbs', 'orion/textview/textView', 'orion/textview/textModel', 
        'orion/textview/projectionTextModel', 'orion/textview/keyBinding','orion/searchAndReplace/textSearcher',
        'orion/edit/dispatcher', 'orion/contentTypes', 'orion/PageUtil', 'orion/highlight',
        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer' ], 
		function(require, dojo, mSelection, mStatus, mProgress, mDialogs, mCommands, mUtil, mFavorites,
				mFileClient, mOperationsClient, mSearchClient, mGlobalCommands, mOutliner, mProblems, mContentAssist, mEditorCommands, mEditorFeatures, mEditor,
				mSyntaxchecker, mBreadcrumbs, mTextView, mTextModel, mProjectionTextModel, mKeyBinding, mSearcher,
				mDispatcher, mContentTypes, PageUtil, Highlight) {
	
var exports = exports || {};
	
exports.setUpEditor = function(serviceRegistry, preferences, isReadOnly){
	var document = window.document;
	var selection;
	var commandService;
	var statusReportingService;
	var problemService;
	var outlineService;
	var contentTypeService;
	
	document.body.style.visibility = "visible";
	dojo.parser.parse();
	
	// Initialize the plugin registry
	(function() {
		selection = new mSelection.Selection(serviceRegistry);
		var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
		statusReportingService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
		new mProgress.ProgressService(serviceRegistry, operationsClient);
		new mDialogs.DialogService(serviceRegistry);
		commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

		// Editor needs additional services besides EAS.
		problemService = new mProblems.ProblemService(serviceRegistry);
		outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferences: preferences});
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
		contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
	}());
	
	var splitArea = dijit.byId("topContainer"),
		outlineDomNode = dojo.byId("outline"),
		editorDomNode = dojo.byId("editor"),
		mainPane = dijit.byId("mainPane"),
		searchFloat = dojo.byId("searchFloat");

	var syntaxHighlighter = new Highlight.SyntaxHighlighter(serviceRegistry);
	var fileClient = new mFileClient.FileClient(serviceRegistry);
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
	
	var textViewFactory = function() {
		var textView = new mTextView.TextView({
			parent: editorDomNode,
			model: new mProjectionTextModel.ProjectionTextModel(new mTextModel.TextModel()),
			tabSize: 4,
			readonly: isReadOnly
		});
		dojo.connect(mainPane, "resize", dojo.hitch(this, function (e){
			textView.resize();
		}));
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
			if (location && location[0] !== "#") {
				location = "#" + location;
			}
			var input = PageUtil.matchResourceParameters(location);
			var fileURI = input.resource;
			if (input.line) {
				input.line = parseInt(input.line,10);
			}
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
						editor.setInput(fullPathName, "Fetching " + fullPathName, null);
					}, 800); // wait 800ms before displaying
					var setInput = dojo.hitch(this, function(contents, metadata) {
						if (metadata) {
							this._fileMetadata = metadata;
							// page target is the file but if any interesting links fail, try our parent folder metadata.
							mGlobalCommands.setPageTarget(metadata, serviceRegistry, commandService, 
								function() {
									if (metadata.Parents && metadata.Parents.length > 0) {
										return fileClient.read(metadata.Parents[0].Location, true);
									}
								}, metadata);
							mGlobalCommands.generateDomCommandsInBanner(commandService, editor);
							this.setTitle(metadata.Location);
							this._contentType = contentTypeService.getFileContentType(metadata);
						} else {
							// No metadata
							this._fileMetadata = null;
							this.setTitle(fileURI);
							this._contentType = contentTypeService.getFilenameContentType(this.getTitle());
						}
						syntaxHighlighter.setup(this._contentType, editor.getTextView(), editor.getAnnotationModel(), fileURI)
							.then(dojo.hitch(this, function() {
								// TODO folding should be a preference.
								var styler = syntaxHighlighter.getStyler();
								editor.setFoldingEnabled(styler && styler.foldingEnabled);
								editor.highlightAnnotations();
								setOutlineProviders(this._contentType, location);
								if (!dispatcher) {
									dispatcher = new mDispatcher.Dispatcher(serviceRegistry, editor, this._contentType);
								}
								// Contents
								editor.setInput(fileURI, null, contents);
								editor.showSelection(input.start, input.end, input.line, input.offset, input.length);
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
							console.error("HTTP status code: ", error.status);
							contents = "An error occurred: " + errorMessage(error);
						}
						if (!metadataOk) {
							error = results[1][1];
							console.error("Error loading file metadata: " + errorMessage(error));
						}
						setInput(contents, metadata);
					});
					new dojo.DeferredList([fileClient.read(fileURI), fileClient.read(fileURI, true)]).then(load, load);
				}
				this.lastFilePath = fileURI;
			} else {
				editor.setInput("No File Selected", "", null);
			}
		},
		
		getInput: function() {
			return this.lastFilePath;
		},
			
		setTitle : function(title) {
			var indexOfSlash = title.lastIndexOf("/");
			var shortTitle = title;
			if (indexOfSlash !== -1) {
				shortTitle = shortTitle.substring(indexOfSlash + 1);
				if (title.charAt(0) === '*') {
					shortTitle = '*' + shortTitle;
				}
			}
			this._lastTitle = shortTitle;
			window.document.title = shortTitle;
			var titlePane = dojo.byId("location");
			if (titlePane) {
				dojo.empty(titlePane);
				searcher.setLocationByMetaData(this._fileMetadata, {index: "first"});
				var root = fileClient.fileServiceName(this._fileMetadata && this._fileMetadata.Location);
				new mBreadcrumbs.BreadCrumbs({
					container: "location", 
					resource: this._fileMetadata,
					firstSegmentName: root
				});
				if (title.charAt(0) === '*') {
					var dirty = dojo.create('b', null, titlePane, "last");
					dirty.innerHTML = '*';
				}
			}
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
			if (dirty) {
				if (this._lastTitle && this._lastTitle.charAt(0) !== '*') {
					this.setTitle('*'+ this._lastTitle);
				}
			} else {
				if (this._lastTitle && this._lastTitle.charAt(0) === '*') {
					this.setTitle(this._lastTitle.substring(1));
				}
			}
		},
		
		hashChanged: function(editor) {
			var oldHash = this._lastHash || this.getInput();
			var oldInput = this.getInput();
			selection.setSelections("#" + dojo.hash()); // may prompt, change input, or both
			var newHash = dojo.hash();
			var newInput = this.getInput();
			var inputChanged = PageUtil.matchResourceParameters("#" + oldInput).resource !== PageUtil.matchResourceParameters("#" + newInput).resource;
			var hashMatchesInput = PageUtil.matchResourceParameters("#" + newInput).resource === PageUtil.matchResourceParameters("#" + newHash).resource;
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
				var oldStripped = PageUtil.matchResourceParameters("#" + this.lastFilePath).resource;
				var newStripped = PageUtil.matchResourceParameters(fileURI).resource;
				if (oldStripped !== newStripped) {
					return window.confirm("There are unsaved changes.  Do you still want to navigate away?");
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
		
		// Create keybindings for generic editing, no dependency on the service model
		var genericBindings = new mEditorFeatures.TextActions(editor, undoStack , new mSearcher.TextSearcher(editor, commandService, undoStack));
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
		var commandGenerator = new mEditorCommands.EditorCommandFactory(serviceRegistry, commandService, fileClient, inputManager, "pageActions", isReadOnly, "pageNavigationActions");
		commandGenerator.generateEditorCommands(editor);

		
		// give our external escape handler a shot at handling escape
		keyModeStack.push(escHandler);
		
		// global search
		editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("h", true), "Search Files");
		editor.getTextView().setAction("Search Files", function() {
			window.setTimeout(function() {
				var e = editor.getTextView();
				var selection = e.getSelection();
				var searchPattern = "";
				if (selection.end > selection.start) {
					searchPattern = e.getText().substring(selection.start, selection.end);
				} if (searchPattern.length <= 0) {
					searchPattern = prompt("Enter search term:", searchPattern);
				} if (!searchPattern) {
					return;
				}
				dojo.connect(document, "onkeypress", dojo.hitch(this, function (e){ 
					if (e.charOrCode === dojo.keys.ESCAPE) {
						searchFloat.style.display = "none";
						if(dojo.query("a", searchFloat).indexOf(document.activeElement) !== -1) {
							editor.getTextView().focus();
						}
					}
				}));
				
				var searchFloatTabHandler = {
					isActive: function() {
						return searchFloat.style.display === "block";
					},
					
					tab: function() {
						if (this.isActive()) {
							dojo.query("a",searchFloat)[0].focus();
							return true;
						}
						return false;
					}
				};
				tabHandler.addHandler(searchFloatTabHandler);
				
				var searchFloatEscHandler = {
					isActive: function() {
						return searchFloat.style.display === "block";
					},
					
					cancel: function() {
						if (this.isActive()) {
							searchFloat.style.display = "none";
							return true;
						}
						return false;   // not handled
					}
				};
				escHandler.addHandler(searchFloatEscHandler);
									
				dojo.place(document.createTextNode("Searching for occurrences of "), searchFloat, "last");
				var b = dojo.create("b", null, searchFloat, "last");
				dojo.place(document.createTextNode("\"" + searchPattern + "\"..."), b, "only");
				searchFloat.style.display = "block";
				var query = searcher.createSearchQuery(searchPattern, null, "Name", true);
				var renderer = searcher.defaultRenderer.makeRenderFunction(searchFloat, false);
				searcher.search(query, inputManager.getInput(), renderer);
			}, 0);
			return true;
		});
		
		// splitter binding
		editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("o", true), "Toggle Outliner");
		editor.getTextView().setAction("Toggle Outliner", function(){
				splitArea.toggle();
				return true;
		});
	};
	
	// Content Assist
	var contentAssistFactory = isReadOnly ? null
		: {
			createContentAssistMode: function(editor) {
				var contentAssist = new mContentAssist.ContentAssist(editor.getTextView());
				contentAssist.addEventListener("Activating", function(event) {
					// Content assist is about to be activated; set its providers.
					var fileContentType = inputManager.getContentType();
					var fileName = editor.getTitle();
					var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.contentAssist");
					var providers = [];
					for (var i=0; i < serviceReferences.length; i++) {
						var serviceReference = serviceReferences[i],
						    contentTypeIds = serviceReference.getProperty("contentType"),
						    pattern = serviceReference.getProperty("pattern"); // backwards compatibility
						if ((contentTypeIds && contentTypeService.isSomeExtensionOf(fileContentType, contentTypeIds)) || 
								(pattern && new RegExp(pattern).test(fileName))) {
							providers.push(serviceRegistry.getService(serviceReference));
						}
					}
					contentAssist.setProviders(providers);
				});
				var widget = new mContentAssist.ContentAssistWidget(contentAssist, "contentassist");
				return new mContentAssist.ContentAssistMode(contentAssist, widget);
			}
		};

	var statusReporter =  function(message, type, isAccessible) {
		if (type === "progress") {
			statusReportingService.setProgressMessage(message);
		} else if (type === "error") {
			statusReportingService.setErrorMessage(message);
		} else {
			statusReportingService.setMessage(message, null, isAccessible);
		}
	};
	var annotationFactory = new mEditorFeatures.AnnotationFactory();
	
	var editor = new mEditor.Editor({
		textViewFactory: textViewFactory,
		undoStackFactory: new mEditorCommands.UndoCommandFactory(serviceRegistry, commandService, "pageActions"),
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
	serviceRegistry.getService("orion.core.marker").addEventListener("problemsChanged", function(problems) {
		editor.showProblems(problems);
	});
	
	editor.addEventListener("DirtyChanged", function(evt) {
		inputManager.setDirty(editor.isDirty());
	});
	
	// Generically speaking, we respond to changes in selection.  New selections change the editor's input.
	serviceRegistry.getService("orion.page.selection").addEventListener("selectionChanged", function(fileURI) {
		if (inputManager.shouldGoToURI(editor, fileURI)) {
			inputManager.setInput(fileURI, editor);
		} 
	});
	
	// In this page, the hash change drives selection.  In other scenarios, a file picker might drive selection
	dojo.subscribe("/dojo/hashchange", inputManager, function() {inputManager.hashChanged(editor);});
	inputManager.setInput(dojo.hash(), editor);
	
	mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, editor, editor, escHandler);
	mGlobalCommands.generateDomCommandsInBanner(commandService, editor);
		
	var syntaxChecker = new mSyntaxchecker.SyntaxChecker(serviceRegistry, editor);
	editor.addEventListener("InputChanged", function(evt) {
		syntaxChecker.checkSyntax(inputManager.getContentType(), evt.title, evt.message, evt.contents);
	});
	
	// Create outliner "gadget"
	var outliner = new mOutliner.Outliner({parent: outlineDomNode,
		serviceRegistry: serviceRegistry,
		outlineService: serviceRegistry.getService("orion.edit.outline"),
		commandService: commandService,
		selectionService: selection});
	function setOutlineProviders(fileContentType, title) {
		var outlineProviders = serviceRegistry.getServiceReferences("orion.edit.outliner"),
		    filteredProviders = [];
		for (var i=0; i < outlineProviders.length; i++) {
			var serviceReference = outlineProviders[i],
			    contentTypeIds = serviceReference.getProperty("contentType"),
			    pattern = serviceReference.getProperty("pattern"); // for backwards compatibility
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
		outlineService.setOutlineProviders(filteredProviders);
		outliner.setOutlineProviders(filteredProviders);
	}
	editor.addEventListener("InputChanged", function(evt) {
		outlineService.emitOutline(editor.getText(), editor.getTitle());
	});
	dojo.connect(outliner, "setSelectedProvider", function(/**ServiceReference*/ outlineProvider) {
		outlineService.setProvider(outlineProvider);
		outlineService.emitOutline(editor.getText(), editor.getTitle());
	});
	
	window.onbeforeunload = function() {
		if (editor.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
			
	// Ctrl+o handler for toggling outline 
	document.onkeydown = function (evt){
		evt = evt || window.event;
		if(evt.ctrlKey && evt.keyCode  === 79){
			splitArea.toggle();
			if(document.all){ 
				evt.keyCode = 0;
			}else{ 
				evt.preventDefault();
				evt.stopPropagation();
			}					
		} 
	};
};
return exports;
});
