/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*global eclipse orion*/

// create editor
// create TextMateStyler
// change editor contents
// check styled regions

var testcase = (function(assert) {
	var tests = {};
	
	function createEditor() {
		var options = {parent: "editorDiv"};
		return new eclipse.Editor(options);
	}
	
	tests["test create styler"] = function() {
		try {
			var editor = createEditor();
			var grammar = orion.styler.test.SampleGrammar;
			var styler = new orion.styler.TextMateStyler(editor, grammar);
			assert.ok(true, "true is false");
		} catch (e) {
			assert.ok(false, "Exception creating editor");
		}
	};
	
	tests["test style single keyword"] = function() {
		// do whatever
	};
	
	tests["test style after changing model"] = function() {
		// do whatever
	};
	
	tests["test grammar with unsupported regex feature"] = function() {
		// expect Error
	};
	
	tests["test grammar with other unsupported feature"] = function() {
		// expect Error
	};
	
	return tests;
}(orion.Assert));
