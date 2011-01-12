/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse dojo dijit window*/
/*jslint devel:true*/

dojo.addOnLoad(function(){

	var registry = null;
	var document = window.document;
	var inputService;
	var prefsService;
	
	// Initialize the plugin registry
	(function() {
		registry = new eclipse.Registry();
		registry.start();
		
		// Register EAS
		registry.registerLocalService("IStatusReporter", "EASStatusReporter", new eclipse.StatusReportingService(registry, "statusPane"));
		registry.registerLocalService("ILogService", "EASLog", new eclipse.LogService(registry));
		registry.registerLocalService("IDialogService", "EASDialogs", new eclipse.DialogService(registry));
		registry.registerLocalService("ISaveable", "EASSaveable", new eclipse.SaveableService(registry));
		inputService = new eclipse.InputService(registry);
		registry.registerLocalService("IInputProvider", "EASInputProvider", inputService);
		registry.registerLocalService("IUsers", "EASUsers", new eclipse.UserService(registry));
		registry.registerLocalService("ISelectionService", "EASSelection", new eclipse.SelectionService(registry));
		prefsService = new eclipse.Preferences(registry, "/prefs/user");
		registry.registerLocalService("IPreferenceService", "EASPreferences", prefsService);
		
		// Editor needs additional services besides EAS.
		registry.registerLocalService("IProblemProvider", "JSProblems", new eclipse.ProblemService());
		registry.registerLocalService("IOutlineProvider", "OutlineProvider", new eclipse.OutlineService());
		registry.registerLocalService("IFavorites", "FavoritesService", new eclipse.FavoritesService({serviceRegistry: registry}));
		registry.registerLocalService("IFileService", "FileService", new eclipse.FileService());
	}());
	
	dojo.addOnUnload(function(){
		// FIXME: if editor is dirty and user answers "stay" to the prompt, this still stops registry
		registry.stop();
	});
	
	var topContainerWidget = dijit.byId("topContainer"),
		codeTitle = dojo.byId("codeTitle"),
		outlineDomNode = dojo.byId("outline"),
		editorContainerDomNode = dojo.byId("editorContainer"),
		searchFloat = dojo.byId("searchFloat"),
		contentassist = dojo.byId("contentassist"),
		leftPane = dojo.byId("leftPane");
	
	var searcher = new eclipse.Searcher({serviceRegistry: registry});
	
	// Initialize EAS context-specific values
	inputService.initializeContext({"manageDocumentTitle": true});
	
	var editorFactory = function() {
		return new eclipse.Editor({
			parent: editorContainerDomNode,
			stylesheet: "/editor/samples/editor.css"
		});
	};
	var undoStackFactory = function(editor) { return new eclipse.UndoStack(editor, 200); };
	var rulerStyle = {style: { backgroundColor: "#eee" }};
	var annotationRuler;
	var annotationRulerFactory = function() {
			annotationRuler = new eclipse.AnnotationRuler("left", rulerStyle, {html: "<img src='images/problem.gif'></img>"});
			return annotationRuler;
	};
	var lineNumberRulerFactory = function() {
			return new eclipse.LineNumberRuler("left", {style: {backgroundColor: "#eee", textAlign: "right", borderLeft:"1px solid #ddd", borderRight:"1px solid #ddd"}}, {style: { backgroundColor: "#eee" }}, {style: { backgroundColor: "#eee" }});
	};
	var overviewRulerFactory = function() {
			return new eclipse.OverviewRuler("right", rulerStyle, annotationRuler);
	};
	
	var editorContainer = new eclipse.EditorContainer(registry, 
			editorFactory, undoStackFactory,
			annotationRulerFactory, lineNumberRulerFactory, overviewRulerFactory,
			searcher,
			editorContainerDomNode, codeTitle,
			topContainerWidget, contentassist, leftPane, searchFloat);
	
	// The eWebBorderContainer widget needs to know the editorContainer
	topContainerWidget.set("editorContainer", editorContainer);
	
	var syntaxChecker = new eclipse.SyntaxChecker(registry, editorContainer);
	
	// Create outliner "gadget"
	new eclipse.Outliner({parent: outlineDomNode, serviceRegistry: registry});
	
	// FIXME: only leaving this here because editorContainer's verifyInputChange handler doesn't work
	// see WorkItem 408
	window.onbeforeunload = function() {
		if (editorContainer.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
	
	// Initialize link to home page
	var homeNode = dojo.byId("home");
	if (homeNode) {
		prefsService.get("window/orientation", function (home) {
			home = home || "navigate-table.html";
			prefsService.put("window/orientation", home);
			homeNode.href=home;
		});
	}
	
	// Attach listeners to toolbar
	dojo.byId("save").onclick = function(evt) {
		editorContainer._editor.invokeAction("save");
	};
	dojo.byId("undo").onclick = function(evt) {
		editorContainer._editor.invokeAction("undo");
	};
	dojo.byId("redo").onclick = function(evt) {
		editorContainer._editor.invokeAction("redo");
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
