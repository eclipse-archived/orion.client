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
/*global eclipse:true orion:true dojo dijit window*/
/*jslint devel:true*/

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/selection', 'orion/status', 'orion/dialogs',
        'orion/users', 'orion/commands', 'orion/util', 'orion/favorites', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/outliner',
        'orion/problems', 'orion/editor/contentAssist', 'orion/editorCommands', 'orion/editor/editorFeatures', 'orion/editor/editor', 'orion/syntaxchecker',
        'orion/editor/textMateStyler', 'orion/breadcrumbs', 'examples/textview/textStyler', 'orion/textview/textView', 'orion/textview/keyBinding',
        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/eWebBorderContainer'], 
		function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mSelection, mStatus, mDialogs, mUsers, mCommands, mUtil, mFavorites,
				mFileClient, mSearchClient, mGlobalCommands, mOutliner, mProblems, mContentAssist, mEditorCommands, mEditorFeatures, mEditor,
				mSyntaxchecker, mTextMateStyler, mBreadcrumbs, mTextStyler, mTextView, mKeyBinding) {
	
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
		new mUsers.UserService(serviceRegistry);
		prefsService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
		commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

		// Editor needs additional services besides EAS.
		problemService = new mProblems.ProblemService(serviceRegistry);
		new mOutliner.OutlineService(serviceRegistry);
		new mFavorites.FavoritesService({serviceRegistry: serviceRegistry});
	}());
	
	var splitArea = dijit.byId("orion.innerCoding"),
		outlineDomNode = dojo.byId("outline"),
		editorDomNode = dojo.byId("editor"),
		searchFloat = dojo.byId("searchFloat"),
		leftPane = dojo.byId("leftPane");

	var contentAssistFactory = null;
	if (!isReadOnly) {
		contentAssistFactory = function(editor) {
			return new mContentAssist.ContentAssist(editor, "contentassist", serviceRegistry);
		};
	}
	
	// Temporary.  This will evolve into something pluggable.
	var syntaxHighlightProviders = serviceRegistry.getServiceReferences("orion.edit.highlighter");
	var syntaxHighlighter = {
		styler: null, 
		
		highlight: function(fileName, textView) {
			if (this.styler) {
				this.styler.destroy();
				this.styler = null;
			}
			if (fileName) {
				var splits = fileName.split(".");
				var extension = splits.pop().toLowerCase();
				if (splits.length > 0) {
					switch(extension) {
						case "js":
							this.styler = new mTextStyler.TextStyler(textView, "js");
							break;
						case "java":
							this.styler = new mTextStyler.TextStyler(textView, "java");
							break;
						case "css":
							this.styler = new mTextStyler.TextStyler(textView, "css");
							break;
					}
					
					if (!this.styler && syntaxHighlightProviders) {
						// Check our syntax highlight providers
						var providerToUse;
						dojo.some(syntaxHighlightProviders, function(provider) {
							var fileTypes = provider.getProperty("fileTypes");
							if (fileTypes) {
								for (var i=0; i < fileTypes.length; i++) {
									if (fileTypes[i] === extension) {
										providerToUse = provider;
										return true;
									}
								}
							}
						});
						
						if (providerToUse) {
							var providerType = providerToUse.getProperty("type");
							if (providerType === "grammar") {
								// TextMate styler
								var grammar = providerToUse.getProperty("grammar");
								this.styler = new mTextMateStyler.TextMateStyler(textView, grammar);
							} else if (providerType === "parser") {
								console.debug("TODO implement support for parser-based syntax highlight provider");
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

	serviceRegistry.getService(fileServiceReference).then(function(fileService) {
		var fileClient = new mFileClient.FileClient(fileService);

		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		
		var textViewFactory = function() {
			return new mTextView.TextView({
				parent: editorDomNode,
				stylesheet: ["/orion/textview/textview.css", "/orion/textview/rulers.css", "/examples/textview/textstyler.css", "/css/default-theme.css"],
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
								syntaxHighlighter.highlight(fileURI, editor.getTextView());
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
				var titlePane = dojo.byId("pageTitle");
				if (titlePane) {
					dojo.empty(titlePane);
					new mBreadcrumbs.BreadCrumbs({container: "pageTitle", resource: this._fileMetadata});
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
		
		var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
			// Register commands that depend on external services, the registry, etc.
			var commandGenerator = new mEditorCommands.EditorCommandFactory(serviceRegistry, commandService, fileClient, inputManager, "pageActions", isReadOnly);
			commandGenerator.generateEditorCommands(editor);
			
			// Create keybindings for generic editing, no dependency on the service model
			var genericBindings = new mEditorFeatures.TextActions(editor, undoStack);
			keyModeStack.push(genericBindings);
			
			// create keybindings for source editing
			// TODO this should probably be something that happens more dynamically, when the editor changes input
			var codeBindings = new mEditorFeatures.SourceCodeActions(editor, undoStack, contentAssist);
			keyModeStack.push(codeBindings);
			
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
					searchFloat.onclick = function() {
						searchFloat.style.display = "none";
					};
					// TEMPORARY until we can better scope the search
					var extensionFilter = "";
					var fileName = inputManager.getTitle();
					
					dojo.place(document.createTextNode("Searching for occurrences of "), searchFloat, "last");
					var b = dojo.create("b", null, searchFloat, "last");
					dojo.place(document.createTextNode("\"" + searchPattern + "\""), b, "only");
					
					if (fileName) {
						var splits = fileName.split(".");
						if (splits.length > 0) {
							var extension = splits.pop().toLowerCase();
							extensionFilter = "+Name:*." + extension + "+";
							
							dojo.place(document.createTextNode(" in *."), searchFloat, "last");
							dojo.place(document.createTextNode(extension), searchFloat, "last");
						}
					}
					dojo.place(document.createTextNode("..."), searchFloat, "last");
					
					searchFloat.style.display = "block";
					var query = inputManager.getFileMetadata().SearchLocation + searchPattern + extensionFilter;
					searcher.search(searchFloat, query, inputManager.getInput());
				}, 0);
			});
				
			
			// splitter binding
			editor.getTextView().setKeyBinding(new mKeyBinding.KeyBinding("o", true), "Toggle Outliner");
			editor.getTextView().setAction("Toggle Outliner", function(){
					splitArea.toggle();
			});
		};
		
		var statusReporter = function(message, isError) {
			if (isError) {
				statusReportingService.setErrorMessage(message);	
			} else {
				statusReportingService.setMessage(message);	
			}
		};
	
		var annotationFactory = new mEditorFeatures.AnnotationFactory();
		
		var editor = new mEditor.Editor({
			textViewFactory: textViewFactory,
			undoStackFactory: new mEditorCommands.UndoCommandFactory(serviceRegistry, commandService, "pageActions"),
			annotationFactory: annotationFactory,
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
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, prefsService, searcher, editor, editor);
		mGlobalCommands.generateDomCommandsInBanner(commandService, editor);
			
		var syntaxChecker = new mSyntaxchecker.SyntaxChecker(serviceRegistry, editor);
		
		// Create outliner "gadget"
		new mOutliner.Outliner({parent: outlineDomNode, serviceRegistry: serviceRegistry, selectionService: selection});	
		
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
	});
};
return exports;
});
