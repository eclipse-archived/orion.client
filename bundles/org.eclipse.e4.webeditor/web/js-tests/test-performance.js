/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global editor setTimeout log */

function PerformanceTestCase() {
}

PerformanceTestCase.prototype = {
	test_pageDownScrolling: function () {
		var model = editor.getModel();
		editor.setSelection(0, 0);
		var start = new Date().getTime();
		function t() {
			var caretLine = model.getLineAtOffset(editor.getCaretOffset());
			editor.invokeAction("pageDown");
			if (model.getLineAtOffset(editor.getCaretOffset()) !== caretLine) {
				setTimeout(t, 0);
			} else {
				log("time(page down)=" + (new Date().getTime() - start));
			}
		}
		editor.focus();
		t();
	},	
	test_pageUpScrolling: function () {
		var model = editor.getModel();
		var charCount = model.getCharCount();
		editor.setSelection(charCount, charCount);
		var start = new Date().getTime();
		function t() {
			var caretLine = model.getLineAtOffset(editor.getCaretOffset());
			editor.invokeAction("pageUp");
			if (model.getLineAtOffset(editor.getCaretOffset()) !== caretLine) {
				setTimeout(t, 0);
			} else {
				log("time(page up)=" + (new Date().getTime() - start));
			}
		}
		editor.focus();
		t();
	},
	test_lineDownScrolling: function () {
		var count = 300;
		editor.setSelection(0, 0);
		var model = editor.getModel();
		var caretLine = model.getLineAtOffset(editor.getCaretOffset());
		var start = new Date().getTime();
		function t() {
			editor.invokeAction("lineDown");
			if ((model.getLineAtOffset(editor.getCaretOffset()) - caretLine) !== 300) {
				setTimeout(t, 0);
			} else {
				log("time(line down)=" + (new Date().getTime() - start));
			}
		}
		editor.focus();
		t();
	},
	test_lineUpScrolling: function () {
		var count = 300;
		var model = editor.getModel();
		var charCount = model.getCharCount();
		editor.setSelection(charCount, charCount);
		var caretLine = model.getLineAtOffset(editor.getCaretOffset());
		var start = new Date().getTime();
		function t() {
			editor.invokeAction("lineUp");
			if ((caretLine - model.getLineAtOffset(editor.getCaretOffset())) !== count) {
				setTimeout(t, 0);
			} else {
				log("time(line up)=" + (new Date().getTime() - start));
			}
		}
		editor.focus();
		t();
	}
};