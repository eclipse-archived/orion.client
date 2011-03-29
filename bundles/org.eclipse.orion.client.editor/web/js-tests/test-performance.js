/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global editor styler setTimeout log */

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
	},
	test_getLocationAtOffset: function () {
		if (!editor) checkEditor();
		if (styler) {
			styler.destroy();
			styler = null;
		}
		var count = 10;
		var buffer = "";
		for (var i = 0; i < 10;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		editor.setText(buffer);
		editor.focus();
		var length = buffer.length;
		var start = new Date().getTime();
		for (i = 0; i < count;i++) {
			for (var j = 0; j < length;j++) {
				editor.getLocationAtOffset(j);
			}
		}
		log("time(getLocationAtOffset)=" + (new Date().getTime() - start));
		
		styler = new eclipse.TextStyler(editor, "js");
		start = new Date().getTime();
		for (i = 0; i < count;i++) {
			for (j = 0; j < length;j++) {
				editor.getLocationAtOffset(j);
			}
		}
		log("time(getLocationAtOffset)[styled]=" + (new Date().getTime() - start));
		
	},
	test_getOffsetAtLocation: function () {
		if (!editor) checkEditor();
		if (styler) {
			styler.destroy();
			styler = null;
		}
		var count = 2;
		var buffer = "";
		for (var i = 0; i < 6;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		editor.setText(buffer);
		editor.focus();
		var length = buffer.length;
		var location = editor.getLocationAtOffset(length);
		var start = new Date().getTime();
		for (i = 0; i < count;i++) {
			for (var j = 0; j < location.x; j++) {
				editor.getOffsetAtLocation(j, location.y);
			}
		}
		log("time(getOffseAtLocation)=" + (new Date().getTime() - start));
		
		styler = new eclipse.TextStyler(editor, "js");
		start = new Date().getTime();
		for (i = 0; i < count;i++) {
			for (var j = 0; j < location.x; j++) {
				editor.getOffsetAtLocation(j, location.y);
			}
		}
		log("time(getOffseAtLocation)[styled]=" + (new Date().getTime() - start));
		
	}
};