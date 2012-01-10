/******************************************************************************* 
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint */
/*global define*/

define(["orion/assert", "orion/textview/eventTarget", "orion/textview/textModel", "orion/textview/annotations", "orion/editor/mirror"],
		function(assert, mEventTarget, mTextModel, mAnnotations, mMirror) {
	var tests = {};
	
	function SampleMode(codeMirror) {
	}
	
	// Fake version of orion.textview.TextView for testing. Just dispatches events, doesn't touch the DOM.
	function MockTextView() {
		this.model = new mTextModel.TextModel();
	}
	MockTextView.prototype = {
		getModel: function() {
			return this.model;
		},
		getText: function(start, end) {
			return this.model.getText(start, end);
		},
		setText: function(text, start, end) {
		}
		// Dispatch "Changing", "Changed", "LineStyle", "Scroll" (?), "Destroy", "Verify"
	};
	
	// ************************************************************************************************
	tests["CodeMirror - 1"] = function() {
		var view = new MockTextView();
		var annotationModel = new mAnnotations.AnnotationModel(view.getModel());
		var codeMirror = new mMirror.CodeMirror();
		codeMirror.defineMode("test", SampleMode);
		var styler = new mMirror.CodeMirrorStyler(view, annotationModel, codeMirror);
		
		
	};
	
	return tests;
});