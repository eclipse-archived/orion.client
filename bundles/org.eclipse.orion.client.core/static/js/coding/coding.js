/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse:true orion:true dojo dijit window*/
/*jslint devel:true*/

dojo.addOnLoad(function(){
	var pluginRegistry = null;
	var serviceRegistry = null;
	var document = window.document;
	var inputService;
	var prefsService;
	var commandService;
	var statusReportingService;
	var problemService;
	
	// Initialize the plugin registry
	(function() {
		// This is the new service registry.  All services should be registered and obtained here.
		serviceRegistry = new eclipse.ServiceRegistry();
		pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
		dojo.addOnUnload(function() {
			pluginRegistry.shutdown();
		});
		
//		// this is temporary
//		var jslintPlugin = pluginRegistry.getPlugin("/plugins/jslintPlugin.html");
//		if (jslintPlugin === null) {
//			pluginRegistry.installPlugin("/plugins/jslintPlugin.html");
//		}

		inputService = new eclipse.InputService(serviceRegistry);
		inputService.initializeContext({"manageDocumentTitle": true});	
		statusReportingService = new eclipse.StatusReportingService(serviceRegistry, "statusPane");
		new eclipse.LogService(serviceRegistry);
		new eclipse.DialogService(serviceRegistry);
		new eclipse.UserService(serviceRegistry);
		new eclipse.SelectionService(serviceRegistry);
		prefsService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
		commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});

		// Editor needs additional services besides EAS.
		problemService = new eclipse.ProblemService(serviceRegistry);
		new eclipse.OutlineService(serviceRegistry);
		new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
	}());
	
	var topContainerWidget = dijit.byId("topContainer"),
		outlineDomNode = dojo.byId("outline"),
		editorContainerDomNode = dojo.byId("editorContainer"),
		searchFloat = dojo.byId("searchFloat"),
		leftPane = dojo.byId("leftPane");
	
	// File operations
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);

	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var editorFactory = function() {
		return new eclipse.Editor({
			parent: editorContainerDomNode,
			stylesheet: "/editor/samples/editor.css",
			tabSize: 4
		});
	};

	var contentAssistFactory = function(editor) {
		return new eclipse.ContentAssist(editor, "contentassist");
	};
	
	var splitterMgr = {
		leftPaneWidth: "",
		toggleLeftPane: function(editor){
			var rightPane =  editor.getEditorWidget()._editorDiv;
			var rightPaneEditor =  editor.getEditorWidget();
			var targetW = "";
			var originalW = leftPane.style.width;
			var originalWint = parseInt(originalW.replace("px", ""), 10);
			var isLeftOpen = topContainerWidget.isLeftPaneOpen();
			if(isLeftOpen){
				this.leftPaneWidth = originalW;
				targetW = "0px";
			} else {
				this.calcLeftPaneW(rightPane);
				targetW = this.leftPaneWidth;
			}
			var targetWint = parseInt(targetW.replace("px", ""), 10);
			
			if(!isLeftOpen) {
				topContainerWidget.toggleLeftPaneState();
			}
			
			var a = new dojo.Animation({
				node: leftPane,
				duration: 300,
				curve: [1, 100],
				onAnimate: dojo.hitch(this, function(x){
					var deltaW = (targetWint - originalWint)*x/100;
					var curWidth = originalWint + deltaW;
					leftPane.style.width = curWidth + "px";
					leftPane.style.overflow = "hidden";
					rightPane.style.overflow = "hidden";
					topContainerWidget.layout();
					//this._topContainer.resize();
				}),
				onEnd: dojo.hitch(this, function(){
					rightPane.style.overflow = "auto";
					rightPaneEditor.redrawLines();
					if(isLeftOpen){
						topContainerWidget.toggleLeftPaneState();
					} else {
						leftPane.style.overflow = "auto";
						topContainerWidget.setSizeCookie(null);
					}
				})
			});
			a.play();
		}, 
		calcLeftPaneW: function(rightPane){
			var leftPaneW = topContainerWidget.getSizeCookie();
			if(leftPaneW < 50){
				var originalW = rightPane.style.width;
				var originalWint = parseInt(originalW.replace("px", ""), 10);
				this.leftPaneWidth = originalWint*0.25 + "px";
			} else {
				this.leftPaneWidth =leftPaneW + "px";
			}
			return this.leftPaneWidth;
		}
	};
	
	var inputManager = {
		lastFilePath: "",
		
		setInput: function(location, editorContainer) {
			var input = eclipse.util.getPositionInfo(location);
			var fileURI = input.filePath;
			this._fileURI = fileURI;
			// populate editor
			if (fileURI) {
				if (fileURI === this._lastFilePath) {
					editorContainer.showSelection(input.start, input.end, input.line, input.offset, input.length);
				} else {
					if (!editorContainer.getEditorWidget()) {
						editorContainer.installEditor();
					}
					var fullPathName = fileURI;
					editorContainer.onInputChange(fullPathName, "Fetching " + fullPathName, null);
					fileClient.read(fileURI).then(
						dojo.hitch(this, function(contents) {
							editorContainer.onInputChange(fileURI, null, contents);
							editorContainer.showSelection(input.start, input.end, input.line, input.offset, input.length);
						}),
						dojo.hitch(this, function(error) {
							editorContainer.onInputChange(fullPathName, "An error occurred: " + error.message, null);
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
				this._lastFilePath = fileURI;
			} else {
				editorContainer.onInputChange("No File Selected", "", null);
			}
		},
		
		getInput: function() {
			return this._lastFilePath;
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
			inputService.setTitle(shortTitle);
			var titlePane = dojo.byId("pageTitle");
			if (titlePane) {
				dojo.empty(titlePane);
				new eclipse.BreadCrumbs({container: "pageTitle", resource: this._fileMetadata});
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
		}
	};	
	
	var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
		// Register commands that depend on external services, the registry, etc.
		var commandGenerator = new orion.EditorCommandFactory(serviceRegistry, commandService, fileClient, inputManager, "pageActions");
		commandGenerator.generateEditorCommands(editor);
		
		// Create keybindings for generic editing, no dependency on the service model
		var genericBindings = new orion.TextActions(editor, undoStack);
		keyModeStack.push(genericBindings);
		
		// create keybindings for source editing
		// TODO this should probably be something that happens more dynamically, when the editor changes input
		var codeBindings = new orion.SourceCodeActions(editor, undoStack, contentAssist);
		keyModeStack.push(codeBindings);
		
		// global search
		editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("h", true), "search");
		editor.getEditorWidget().setAction("search", function() {
			window.setTimeout(function() {
				var e = editor.getEditorWidget();
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
		editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("o", true), "toggle");
		editor.getEditorWidget().setAction("toggle", function(){
				splitterMgr.toggleLeftPane(editor);
		});
		
		// Tell the top border container what to use for the splitter toggle function.
		// We do this here because we have the editor handy
		topContainerWidget.setToggleLeftPane(function() {
			splitterMgr.toggleLeftPane(editor);
		});
	};
	
	var statusReporter = function(message, isError) {
		if (isError) {
			statusReportingService.setErrorMessage(message);	
		} else {
			statusReportingService.setMessage(message);	
		}
	};

	var annotationFactory = new orion.AnnotationFactory();
	
	var editorContainer = new orion.EditorContainer({
		editorFactory: editorFactory,
		undoStackFactory: new orion.UndoCommandFactory(serviceRegistry, commandService, "pageActions"),
		annotationFactory: annotationFactory,
		lineNumberRulerFactory: new orion.LineNumberRulerFactory(),
		contentAssistFactory: contentAssistFactory,
		keyBindingFactory: keyBindingFactory, 
		statusReporter: statusReporter,
		domNode: editorContainerDomNode
	});
	
	// Establishing dependencies on registered services
	serviceRegistry.getService("IProblemProvider").then(function(problemProvider) {
		problemProvider.addEventListener("problemsChanged", function(problems) {
			annotationFactory.showProblems(problems);
		});
	});
	
	dojo.connect(editorContainer, "onDirtyChange", inputManager, inputManager.setDirty);
	
	serviceRegistry.getService("IInputProvider").then(function(input) {
		input.addEventListener("inputChanged", function(fileURI) {
			inputManager.setInput(fileURI, editorContainer);
		});
		input.getInput(function(fileURI) {
			inputManager.setInput(fileURI, editorContainer);
		});
	});
	
	// TODO search location needs to be gotten from somewhere
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, prefsService, searcher, editorContainer, editorContainer);
	eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, editorContainer);
		
	var syntaxChecker = new eclipse.SyntaxChecker(serviceRegistry, editorContainer);
	
	// Create outliner "gadget"
	new eclipse.Outliner({parent: outlineDomNode, serviceRegistry: serviceRegistry});	
	
	window.onbeforeunload = function() {
		if (editorContainer.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
			
	// Ctrl+o handler for toggling outline 
	document.onkeydown = function (evt){
		evt = evt || window.event;
		if(evt.ctrlKey && evt.keyCode  === 79){
			editorContainer.toggleLeftPane();
			if(document.all){ 
				evt.keyCode = 0;
			}else{ 
				evt.preventDefault();
				evt.stopPropagation();
			}					
		} 
	};
});
