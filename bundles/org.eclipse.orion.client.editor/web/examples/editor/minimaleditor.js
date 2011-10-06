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
/*global orion:true window*/
/*jslint browser:true devel:true*/

window.onload = function(){
	
	var editorDomNode = document.getElementById("editor");
	
	var textViewFactory = function() {
		return new orion.textview.TextView({
			parent: editorDomNode,
			stylesheet: [ "../../orion/textview/textview.css",
							"../../orion/textview/rulers.css",
							"../../orion/textview/annotations.css",
							"../textview/textstyler.css"],
			tabSize: 4
		});
	};
	
	var annotationFactory = new orion.editor.AnnotationFactory();
	
	var keyBindingFactory = function(editor, keyModeStack, undoStack, contentAssist) {
		
		// Create keybindings for generic editing
		var genericBindings = new orion.editor.TextActions(editor, undoStack);
		keyModeStack.push(genericBindings);
		
		// create keybindings for source editing
		var codeBindings = new orion.editor.SourceCodeActions(editor, undoStack, contentAssist);
		keyModeStack.push(codeBindings);
		
		// save binding
		editor.getTextView().setKeyBinding(new orion.textview.KeyBinding("s", true), "save");
		editor.getTextView().setAction("save", function(){
				editor.onInputChange(null, null, null, true);
				var text = editor.getTextView().getText();
				var problems = [];
				for (var i=0; i<text.length; i++) {
					if (text.charAt(i) === 'z') {
						var line = editor.getTextView().getModel().getLineAtOffset(i) + 1;
						var character = i - editor.getTextView().getModel().getLineStart(line);
						problems.push({
							start: character,
							end: character + 1,
							severity: "error",
							description: "I don't like the letter 'z'"});
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
		document.getElementById("status").innerHTML = dirtyIndicator + status;
	};
		
	var editor = new orion.editor.Editor({
		textViewFactory: textViewFactory,
		undoStackFactory: new orion.editor.UndoFactory(),
		annotationFactory: annotationFactory,
		lineNumberRulerFactory: new orion.editor.LineNumberRulerFactory(),
		contentAssistFactory: null,
		keyBindingFactory: keyBindingFactory, 
		statusReporter: statusReporter,
		domNode: editorDomNode
	});
		
	orion.editor.util.connect(editor, "onDirtyChange", this, function(dirty) {
		if (dirty) {
			dirtyIndicator = "You have unsaved changes.  ";
		} else {
			dirtyIndicator = "";
		}
		document.getElementById("status").innerHTML = dirtyIndicator + status;
	});
	
	editor.installTextView();
	editor.onInputChange("Content", null, "This is the initial editor contentz.  Type some text and press Ctrl-S to save.");
	
	window.onbeforeunload = function() {
		if (editor.isDirty()) {
			 return "There are unsaved changes.";
		}
	};
};
