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
		// This is the new service registry.  All services should be registered and obtained here.
		serviceRegistry = new eclipse.ServiceRegistry();
		
		// This is the original registry.  For M5 we need it for plugin management.
		pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
		pluginRegistry.start();
		
		
		// this is temporary
		var jslintPlugin = pluginRegistry.getPlugin("/jslintPlugin.html");
		if (jslintPlugin === null) {
			pluginRegistry.loadPlugin("/jslintPlugin.html", function(plugin) {
				pluginRegistry.installPlugin(plugin.pluginURL, plugin.pluginData);
			});
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
	
	var editorContainer = new eclipse.EditorContainer(serviceRegistry,
			editorFactory, undoStackFactory,
			annotationRulerFactory, lineNumberRulerFactory, overviewRulerFactory,
			searcher,
			editorContainerDomNode, codeTitle,
			topContainerWidget, contentassist, leftPane, searchFloat);
	
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
	
	// Initialize link to home page
	var homeNode = dojo.byId("home");
	if (homeNode) {
		prefsService.get("window/orientation", function (home) {
			home = home || "navigate-table.html";
			prefsService.put("window/orientation", home);
			homeNode.href=home;
		});
	}
	

	// These are two example actions - they should be coming from plug-ins, and they
	// should ideally be contributed using the command service.  That is TBD.

	// Note that this is not in any shape or form that could be considered final.
	// We've included it to enable experimentation. Please provide feedback (in Bugzilla, on IRC, on the mailing list).
	
	// The shape of the contributed actions is (for now):
	// info - information about the action (object).
	//        required attribute: name - the name of the action
	//        optional attribute: key - an array with values to pass to the eclipse.KeyBinding constructor
	//        optional attribute: img - a URL to an image for the action
	// run - the implementation of the action (function).
	//        arguments passed to run: (selectedText, fullText, selection)
	//          selectedText (string) - the currently selected text in the editor
	//          fullText (string) - the complete text of the editor
	//          selection (object) - an object with attributes: start, end
	//        the return value of the run function will be used as follows:
	//          if the return value is a string, the current selection in the editor will be replaced with the returned string
	//          if the return value is an object, its "text" attribute (required) will be used to replace the contents of the editor,
	//                                            and its "selection" attribute (optional) will be used to set the new selection.
	// These actions will be migrated to commands in the future, see https://bugs.eclipse.org/bugs/show_bug.cgi?id=334189
	serviceRegistry.registerService("editorAction", {
	 info: function() {return {name:"UPPERCASE", img: "/favicon.ico", key:["u",true]};},
	 run: function(text) { return text.toUpperCase(); }
	});
	serviceRegistry.registerService("editorAction", {
	 info: function() {return {name:"Comment"};},
	 run: function(selectedText, text, selection) { return {text: text.substring(0,selection.start) + "/*" + text.substring(selection.start,selection.end) + "*/" + text.substring(selection.end),
	 selection: {start:selection.start,end:selection.end+4}}; }
	});

	// Add the plugin actions to the toolbar. This code is not real - it doesn't handle errors at all, for example.
	// Note that this is not in any shape or form that could be considered final.
	// We've included it to enable experimentation. Please provide feedback (in Bugzilla, on IRC, on the mailing list)
	var actionReferences = serviceRegistry.getServiceReferences("editorAction");
	for (var i=0; i<actionReferences.length; i++) {
		serviceRegistry.getService(actionReferences[i]).then(function(service) {
			service.info().then(function(info) {
				var editor = editorContainer._editor;
				var action = function() {
					var text = editor.getText();
					var selection = editor.getSelection();
					service.run(editor.getText(selection.start,selection.end),text,selection).then(function(result){
						if (result.text) {
							editor.setText(result.text);
							if (result.selection) {
								editor.setSelection(result.selection.start, result.selection.end);
								editor.focus();
							}
						} else {
							if (typeof result === 'string') {
								editor.setText(result, selection.start, selection.end);
								editor.setSelection(selection.start, selection.end);
								editor.focus();
							}
						}
					});
				};
				// add it to toolbar.  This is similar to what the command service does in its render methods.
				// This should be switched over to use the command service to render the 'page' level scopes once
				// that is implemented.
				var toolbar = dojo.byId("editorActions");
				if (info.img) {
					var a = document.createElement('img');
					a.setAttribute("class", "editorAction");
					a.setAttribute("src", info.img);
					a.setAttribute("alt", info.name);
					a.setAttribute("title", info.name);
					a.onclick = action;
					dojo.addClass(a, "commandImage");
					toolbar.appendChild(a);
					toolbar.appendChild(document.createTextNode(" "));
				} else {
					var a = document.createElement('span');
					a.setAttribute("class", "editorAction");
					a.appendChild(document.createTextNode(info.name));
					a.onclick = action;
					dojo.addClass(a, "commandLink");
					toolbar.appendChild(a);
					toolbar.appendChild(document.createTextNode(" "));
				}
				if (info.key) {
					// add it to the editor as a keybinding
					// KB exists so that we can pass an array (from info.key) rather than actual arguments
					function KB(args) {
						return eclipse.KeyBinding.apply(this, args);
					}
					KB.prototype = eclipse.KeyBinding.prototype;
					editor.setKeyBinding(new KB(info.key), info.name);
					editor.setAction(info.name, action);
				}
			});
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
