/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
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

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/selection', 'orion/status', 'orion/dialogs',
        'orion/commands', 'orion/util', 'orion/favorites', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/outliner',
        'orion/problems', 'orion/editor/contentAssist', 'orion/editorCommands', 'orion/editor/editorFeatures', 'orion/editor/editor', 'orion/syntaxchecker',
        'orion/editor/textMateStyler', 'orion/breadcrumbs', 'examples/textview/textStyler', 'orion/textview/textView', 'orion/textview/textModel', 
        'orion/textview/projectionTextModel', 'orion/textview/keyBinding','orion/searchAndReplace/textSearcher','orion/searchAndReplace/orionTextSearchAdaptor',
        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mSelection, mStatus, mDialogs, mCommands, mUtil, mFavorites,
				mFileClient, mSearchClient, mGlobalCommands, mOutliner, mProblems, mContentAssist, mEditorCommands, mEditorFeatures, mEditor,
				mSyntaxchecker, mTextMateStyler, mBreadcrumbs, mTextStyler, mTextView, mTextModel, mProjectionTextModel, mKeyBinding, mSearcher, mSearchAdaptor) {
	
var exports = exports || {};
	
exports.setUpEditor = function(isReadOnly){
	var pluginRegistry = null;
	var serviceRegistry = null;
	var document = window.document;
	var selection;
	var prefsService;
	var commandService;
	var statusReportingService;
	var problemService;
	var outlineService;
	
	document.body.style.visibility = "visible";
	dojo.parser.parse();
	
	// Initialize the plugin registry
	(function() {
		// This is the new service registry.  All services should be registered and obtained here.
		serviceRegistry = new mServiceregistry.ServiceRegistry();
		pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
		dojo.addOnWindowUnload(function() {
			pluginRegistry.shutdown();
		});
		
		selection = new mSelection.Selection(serviceRegistry);
		statusReportingService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		new mDialogs.DialogService(serviceRegistry);
		prefsService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
		commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

		// Editor needs additional services besides EAS.
		problemService = new mProblems.ProblemService(serviceRegistry);
		outlineService = new mOutliner.OutlineService({serviceRegistry: serviceRegistry, preferencesService: prefsService});
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
	}());
	
	var splitArea = dijit.byId("orion.innerCoding"),
		outlineDomNode = dojo.byId("outline"),
		editorDomNode = dojo.byId("editor"),
		searchFloat = dojo.byId("searchFloat"),
		leftPane = dojo.byId("leftPane");

	// Content Assist
	var contentAssistFactory = null;
	if (!isReadOnly) {
		contentAssistFactory = function(editor) {
			var contentAssist = new mContentAssist.ContentAssist(editor, "contentassist");
			var providersLoaded = false;
			contentAssist.addEventListener("show", function(event) {
				function addProvider(name, pattern, service) {
					contentAssist.addProvider(service, name, pattern);
				}
				if (!providersLoaded) {
					// Load contributed content assist providers
					var fileName = editor.getTitle();
					var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.contentAssist");
					for (var i=0; i < serviceReferences.length; i++) {
						var serviceReference = serviceReferences[i];
						var name = serviceReference.getProperty("name"),
						    pattern = serviceReference.getProperty("pattern");
						if (pattern && new RegExp(pattern).test(fileName)) {
							(function(name, pattern) {
								serviceRegistry.getService(serviceReference).then(function(service) {
									addProvider(name, pattern, service);
								});
							}(name, pattern));
						}
					}
					providersLoaded = true;
				}
			});
			return contentAssist;
		};
	}
	
	// Temporary.  This will evolve into something pluggable.
	var syntaxHighlightProviders = serviceRegistry.getServiceReferences("orion.edit.highlighter");
	var syntaxHighlighter = {
		styler: null, 
		
		highlight: function(fileName, editor) {
			if (this.styler) {
				this.styler.destroy();
				this.styler = null;
			}
			if (fileName) {
				var textView = editor.getTextView();
				var splits = fileName.split(".");
				var extension = splits.pop().toLowerCase();
				if (splits.length > 0) {
					var annotationModel = editor.getAnnotationModel();
					switch(extension) {
						case "js":
						case "json":
							this.styler = new mTextStyler.TextStyler(textView, "js", annotationModel);
							break;
						case "java":
							this.styler = new mTextStyler.TextStyler(textView, "java", annotationModel);
							break;
						case "css":
							this.styler = new mTextStyler.TextStyler(textView, "css", annotationModel);
							break;
					}
					
					if (!this.styler && syntaxHighlightProviders) {
						var grammars = [],
						    providerToUse;
						for (var i=0; i < syntaxHighlightProviders.length; i++) {
							var provider = syntaxHighlightProviders[i],
							    fileTypes = provider.getProperty("fileTypes");
							if (provider.getProperty("type") === "grammar") {
								grammars.push(provider.getProperty("grammar"));
							}
							if (fileTypes && fileTypes.indexOf(extension) !== -1) {
								providerToUse = provider;
							}
						}
						
						if (providerToUse) {
							var providerType = providerToUse.getProperty("type");
							if (providerType === "parser") {
								console.debug("TODO implement support for parser-based syntax highlight provider");
							} else if (providerType === "grammar" || typeof providerType === "undefined") {
								var grammar = providerToUse.getProperty("grammar");
								this.styler = new mTextMateStyler.TextMateStyler(textView, grammar, grammars);
							}
						}
					}
				}
			}
		}
	};

	var fileServices = serviceRegistry.getServiceReferences("orion.core.file");
	var fileServiceReference;
	
	for (var i=0; i<fileServices.length; i++) {
		var info = {};
		var propertyNames = fileServices[i].getPropertyNames();
		for (var j = 0; j < propertyNames.length; j++) {
			info[propertyNames[j]] = fileServices[i].getProperty(propertyNames[j]);
		}
		if (new RegExp(info.pattern).test(dojo.hash())) {
			fileServiceReference = fileServices[i];
		}
	}

	var fileClient = new mFileClient.FileClient(serviceRegistry);

		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		
		var model = new mTextModel.TextModel();
		/* Folding is disabled for now until key bindings and search are fixed */ 
		if (false) {
			model = new mProjectionTextModel.ProjectionTextModel(model);
		}
		var textViewFactory = function() {
			return new mTextView.TextView({
				parent: editorDomNode,
				model: model,
				stylesheet: ["/orion/textview/textview.css", "/orion/textview/rulers.css",
					"/examples/textview/textstyler.css", "/css/default-theme.css",
					"/orion/editor/editor.css"],
				tabSize: 4,
				readonly: isReadOnly
			});
		};
	
	var inputManager = {
		lastFilePath: "",
		
		setInput: function(location, editor) {
			var input = mUtil.getPositionInfo(location);
			var fileURI = input.filePath;
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
						editor.onInputChange(fullPathName, "Fetching " + fullPathName, null);
					}, 800); // wait 800ms before displaying
					fileClient.read(fileURI).then(
						dojo.hitch(this, function(contents) {
							clearTimeout(progressTimeout);
							editor.onInputChange(fileURI, null, contents);
							// in the long run we should be looking for plug-ins to call here for highlighting
							syntaxHighlighter.highlight(fileURI, editor);
							editor.highlightAnnotations();
							editor.showSelection(input.start, input.end, input.line, input.offset, input.length);
						}),
						dojo.hitch(this, function(error) {
							clearTimeout(progressTimeout);
							editor.onInputChange(fullPathName, "An error occurred: " + error.message, null);
							console.error("HTTP status code: ", error.status);
						})
					);
					fileClient.read(fileURI, true).then(
						dojo.hitch(this, function(metadata) {
							this._fileMetadata = metadata;
							this.setTitle(metadata.Location);
						}),
						dojo.hitch(this, function(error) {
							console.error("Error loading file metadata: " + error.message);
							this.setTitle(fileURI);
						})
					);
				}
				this.lastFilePath = fileURI;
			} else {
				editor.onInputChange("No File Selected", "", null);
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
				var root = mUtil.getUserName() || "Navigator Root";
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
			if (this.shouldGoToURI(editor, dojo.hash())) {
				selection.setSelections(dojo.hash());
			} else {
				// we are staying at our previous location
				dojo.hash(this.lastFilePath);
			}
		},
		
		shouldGoToURI: function(editor, fileURI) {
			if (editor.isDirty()) {
				var oldStripped = mUtil.getPositionInfo(this.lastFilePath).filePath;
				var newStripped = mUtil.getPositionInfo(fileURI).filePath;
				if (oldStripped !== newStripped) {
					return window.confirm("There are unsaved changes.  Do you still want to navigate away?");
				}
			}
			return true;
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
		}
	};
	
	var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
		// Register commands that depend on external services, the registry, etc.
		var commandGenerator = new mEditorCommands.EditorCommandFactory(serviceRegistry, commandService, fileClient, inputManager, "pageActions", isReadOnly);
		commandGenerator.generateEditorCommands(editor);
		
		// Create keybindings for generic editing, no dependency on the service model
		var genericBindings = new mEditorFeatures.TextActions(editor, undoStack , new mSearcher.TextSearcher(commandService, undoStack, new mSearchAdaptor.OrionTextSearchAdaptor()));
		keyModeStack.push(genericBindings);
		
		// Linked Mode
		var linkedMode = new orion.editor.LinkedMode(editor);
		keyModeStack.push(linkedMode);
		
		// create keybindings for source editing
		// TODO this should probably be something that happens more dynamically, when the editor changes input
		var codeBindings = new mEditorFeatures.SourceCodeActions(editor, undoStack, contentAssist, linkedMode);
		keyModeStack.push(codeBindings);
		
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
					}
				}));
				
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
				var query = inputManager.getFileMetadata().SearchLocation + searchPattern;
				searcher.search(searchFloat, query, inputManager.getInput());
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
	
	var statusReporter = function(message, isError, isProgress) {
		if(isProgress){
			statusReportingService.setProgressMessage(message);
		} else if (isError) {
			statusReportingService.setErrorMessage(message);	
		} else {
			statusReportingService.setMessage(message);	
		}
	};

	var annotationFactory = new mEditorFeatures.AnnotationFactory("/images/problem.gif");
	
	var editor = new mEditor.Editor({
		textViewFactory: textViewFactory,
		undoStackFactory: new mEditorCommands.UndoCommandFactory(serviceRegistry, commandService, "pageActions"),
		annotationFactory: annotationFactory,
		foldingRulerFactory: new mEditorFeatures.FoldingRulerFactory(),
		lineNumberRulerFactory: new mEditorFeatures.LineNumberRulerFactory(),
		contentAssistFactory: contentAssistFactory,
		keyBindingFactory: keyBindingFactory, 
		statusReporter: statusReporter,
		domNode: editorDomNode
	});
	
	// Establishing dependencies on registered services
	serviceRegistry.getService("orion.core.marker").then(function(problemProvider) {
		problemProvider.addEventListener("problemsChanged", function(problems) {
			annotationFactory.showProblems(problems);
		});
	});
	
	dojo.connect(editor, "onDirtyChange", inputManager, inputManager.setDirty);
	
	// Generically speaking, we respond to changes in selection.  New selections change the editor's input.
	serviceRegistry.getService("orion.page.selection").then(function(service) {
		service.addEventListener("selectionChanged", function(fileURI) {
			if (inputManager.shouldGoToURI(editor, fileURI)) {
				inputManager.setInput(fileURI, editor);
			} 
		});
	});

	// In this page, the hash change drives selection.  In other scenarios, a file picker might drive selection
	dojo.subscribe("/dojo/hashchange", inputManager, function() {inputManager.hashChanged(editor);});
	inputManager.setInput(dojo.hash(), editor);
	
	// TODO search location needs to be gotten from somewhere
	mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, prefsService, searcher, editor, editor, escHandler);
	mGlobalCommands.generateDomCommandsInBanner(commandService, editor);
		
	var syntaxChecker = new mSyntaxchecker.SyntaxChecker(serviceRegistry, editor);
	
	// Create outliner "gadget"
	var outliner = new mOutliner.Outliner({parent: outlineDomNode,
		serviceRegistry: serviceRegistry,
		outlineService: serviceRegistry.getService("orion.edit.outline"),
		commandService: commandService,
		selectionService: selection});
	dojo.connect(editor, "onInputChange", function(title, message, contents, saved) {
		var outlineProviders = serviceRegistry.getServiceReferences("orion.edit.outliner"),
		    filteredProviders = [];
		for (var i=0; i < outlineProviders.length; i++) {
			var serviceReference = outlineProviders[i],
			    pattern = serviceReference.getProperty("pattern");
			if (pattern && new RegExp(pattern).test(title)) {
				filteredProviders.push(serviceReference);
			}
		}
		outlineService.setOutlineProviders(filteredProviders, editor.getContents(), editor.getTitle());
		outliner.setOutlineProviders(filteredProviders);
	});
	dojo.connect(outliner, "setSelectedProvider", function(/**ServiceReference*/ outlineProvider) {
		outlineService.setProvider(outlineProvider);
		outlineService.emitOutline(editor.getContents(), editor.getTitle());
	});
	
	window.onbeforeunload = function() {
		if (editor.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
	
	// Set up the border container
	splitArea.setToggleCallback(function() {
		editor.getTextView().redrawLines();
	});
			
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
