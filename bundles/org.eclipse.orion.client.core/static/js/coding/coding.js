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

	var pluginRegistry = null;
	var serviceRegistry = null;
	var document = window.document;
	var inputService;
	var prefsService;
	
	// Initialize the plugin registry
	(function() {
		// This is the original registry.  For M5 we need it for plugin management.
		pluginRegistry = new eclipse.Registry();
		pluginRegistry.start();
		
		var jslintPlugin = pluginRegistry.getPlugin("/jslintPlugin.html");
		if (jslintPlugin === null) {
			pluginRegistry.loadPlugin("/jslintPlugin.html", function(plugin) {
				pluginRegistry.installPlugin(plugin.pluginURL, plugin.pluginData);
			});
		}
		
		// This is the new service registry.  All services should be registered and obtained here.
		serviceRegistry = new eclipse.ServiceRegistry();
		var inputService = new eclipse.InputService(serviceRegistry);
		inputService.initializeContext({"manageDocumentTitle": true});	
		new eclipse.StatusReportingService(serviceRegistry, "statusPane");
		new eclipse.LogService(serviceRegistry);
		new eclipse.DialogService(serviceRegistry);
		new eclipse.UserService(serviceRegistry);
		new eclipse.SelectionService(serviceRegistry);
		prefsService = new eclipse.Preferences(serviceRegistry, "/prefs/user");
		new eclipse.SaveableService(serviceRegistry);
		
		// Editor needs additional services besides EAS.
		new eclipse.ProblemService(serviceRegistry);
		new eclipse.OutlineService(serviceRegistry);
		new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
		new eclipse.FileService(serviceRegistry);
	}());
	
	dojo.addOnUnload(function(){
		// FIXME: if editor is dirty and user answers "stay" to the prompt, this still stops registry
		pluginRegistry.stop();
	});
	
	var topContainerWidget = dijit.byId("topContainer"),
		codeTitle = dojo.byId("codeTitle"),
		outlineDomNode = dojo.byId("outline"),
		editorContainerDomNode = dojo.byId("editorContainer"),
		searchFloat = dojo.byId("searchFloat"),
		contentassist = dojo.byId("contentassist"),
		leftPane = dojo.byId("leftPane");
	
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
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
	
	var editorContainer = new eclipse.EditorContainer(pluginRegistry, serviceRegistry,
			editorFactory, undoStackFactory,
			annotationRulerFactory, lineNumberRulerFactory, overviewRulerFactory,
			searcher,
			editorContainerDomNode, codeTitle,
			topContainerWidget, contentassist, leftPane, searchFloat);
	
	// The eWebBorderContainer widget needs to know the editorContainer
	topContainerWidget.set("editorContainer", editorContainer);
	
	var syntaxChecker = new eclipse.SyntaxChecker(serviceRegistry, pluginRegistry, editorContainer);
	
	// Create outliner "gadget"
	new eclipse.Outliner({parent: outlineDomNode, serviceRegistry: serviceRegistry});	
	
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
