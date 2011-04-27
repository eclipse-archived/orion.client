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
/*global eclipse:true orion:true dojo window*/
/*jslint devel:true*/

dojo.addOnLoad(function(){
	
	var editorContainerDomNode = dojo.byId("editorContainer");
	
	var editorFactory = function() {
		return new eclipse.Editor({
			parent: editorContainerDomNode,
			stylesheet: "/editor/samples/editor.css",
			tabSize: 4
		});
	};

	var contentAssistFactory = function(editor) {
		var contentAssist = new eclipse.ContentAssist(editor, "contentassist");
		contentAssist.addProvider(new orion.contentAssist.CssContentAssistProvider());
		contentAssist.addProvider(new orion.contentAssist.JavaScriptContentAssistProvider());
		return contentAssist;
	};
	
	var annotationFactory = new orion.AnnotationFactory();

	
	var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
		
		// Create keybindings for generic editing
		var genericBindings = new orion.TextActions(editor, undoStack);
		keyModeStack.push(genericBindings);
		
		// create keybindings for source editing
		var codeBindings = new orion.SourceCodeActions(editor, undoStack, contentAssist);
		keyModeStack.push(codeBindings);
		
		// save binding
		editor.getEditorWidget().setKeyBinding(new eclipse.KeyBinding("s", true), "save");
		editor.getEditorWidget().setAction("save", function(){
				editor.onInputChange(null, null, null, true);
				var text = editor.getEditorWidget().getText();
				var problems = [];
				for (var i=0; i<text.length; i++) {
					if (text.charAt(i) === 'z') {
						var line = editor.getEditorWidget().getModel().getLineAtOffset(i) + 1;
						var character = i - editor.getEditorWidget().getModel().getLineStart(line);
						problems.push({character: character, line: line, reason: "I don't like the letter 'z'"});
					}
				}
				annotationFactory.showProblems(problems);
				return true;
		});
	};
	
	var dirtyIndicator = "";
	var status = "";
	
	var statusReporter = function(message, isError) {
		if (isError) {
			status =  "ERROR: " + message;
		} else {
			status = message;
		}
		dojo.byId("status").innerHTML = dirtyIndicator + status;
	};
	
	var editorContainer = new orion.EditorContainer({
		editorFactory: editorFactory,
		undoStackFactory: new orion.UndoFactory(),
		annotationFactory: annotationFactory,
		lineNumberRulerFactory: new orion.LineNumberRulerFactory(),
		contentAssistFactory: contentAssistFactory,
		keyBindingFactory: keyBindingFactory, 
		statusReporter: statusReporter,
		domNode: editorContainerDomNode
	});
		
	dojo.connect(editorContainer, "onDirtyChange", this, function(dirty) {
		if (dirty) {
			dirtyIndicator = "You have unsaved changes.  ";
		} else {
			dirtyIndicator = "";
		}
		dojo.byId("status").innerHTML = dirtyIndicator + status;
	});
	
	editorContainer.installEditor();
	editorContainer.onInputChange("Content", null, "This is the initial editor contentz.  Type some text and press Ctrl-S to save.");
	
	window.onbeforeunload = function() {
		if (editorContainer.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
});
