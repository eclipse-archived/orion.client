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
	var commandService;
	
	// Initialize the plugin registry
	(function() {
		// This is the new service registry.  All services should be registered and obtained here.
		serviceRegistry = new eclipse.ServiceRegistry();
		pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
		
		
		// this is temporary
		var jslintPlugin = pluginRegistry.getPlugin("/jslintPlugin.html");
		if (jslintPlugin === null) {
			pluginRegistry.installPlugin("/jslintPlugin.html");
		}

		var inputService = new eclipse.InputService(serviceRegistry);
		inputService.initializeContext({"manageDocumentTitle": true});	
		new eclipse.StatusReportingService(serviceRegistry, "statusPane");
		new eclipse.LogService(serviceRegistry);
		new eclipse.DialogService(serviceRegistry);
		new eclipse.UserService(serviceRegistry);
		new eclipse.SelectionService(serviceRegistry);
		prefsService = new eclipse.Preferences(serviceRegistry, "/prefs/user");
		new eclipse.SaveableService(serviceRegistry);
		commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});

		// Editor needs additional services besides EAS.
		new eclipse.ProblemService(serviceRegistry);
		new eclipse.OutlineService(serviceRegistry);
		new eclipse.FavoritesService({serviceRegistry: serviceRegistry});
		new eclipse.FileService(serviceRegistry);
	}());
	
	var topContainerWidget = dijit.byId("topContainer"),
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
	
	var editorContainer = new eclipse.EditorContainer(serviceRegistry,
			editorFactory, commandService, eclipse.editorFeatures.createEditorCommands, eclipse.editorFeatures.undoFactory,
			annotationRulerFactory, lineNumberRulerFactory, overviewRulerFactory,
			searcher,
			editorContainerDomNode, "pageTitle",
			topContainerWidget, contentassist, leftPane, searchFloat, "pageActions");
	
	// TODO search location needs to be gotten from somewhere
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, prefsService, searcher, editorContainer, editorContainer);

	// The eWebBorderContainer widget needs to know the editorContainer
	topContainerWidget.set("editorContainer", editorContainer);
	
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
