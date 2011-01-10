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