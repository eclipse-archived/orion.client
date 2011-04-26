/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global assertEquals eclipse */

if (window.AsyncTestCase) {
	PerformanceTest = AsyncTestCase("Performance"); 
} else {
	function PerformanceTest (editor) {
		this.editor = editor;
		this.FakeQueue = function() {
		};
		this.FakeQueue.prototype = { 
		call: function (name, func) {
				var callback = {
					add: function(f) {return f;} 
				};
				func(callback);
			}
		};
	}
}

PerformanceTest.prototype = {
	setUp: function () {
		/*:DOC += <div id="divParent" style="width:800px;height:800px;"></div>*/   
		assertNotNull(document.getElementById('divParent')); 
		var options = {
			parent: "divParent",
			model: new eclipse.TextModel(),
			stylesheet: "/editor/samples/editor.css",
			tabSize: 4
		};
		window.top.moveTo(0,0);
		window.top.resizeTo(screen.width,screen.height);
		this.editor = new eclipse.Editor(options);
	},
	tearDown: function () {
		this.editor.destroy();
	},
	doPage: function (queue, action, max) {
		var editor = this.editor;
		var objXml = new XMLHttpRequest();
		objXml.open("GET","/editor/samples/text.txt",false);
		objXml.send(null);
		this.styler = new eclipse.TextStyler(editor, "java");
		editor.setText(objXml.responseText);
		var model = editor.getModel();
		queue.call(action, function(callbacks) {
			function t() {
				var caretLine = model.getLineAtOffset(editor.getCaretOffset());
				editor.invokeAction(action);
				if (model.getLineAtOffset(editor.getCaretOffset()) !== caretLine && (max === undefined || --max > 0)) {
					setTimeout(callbacks.add(t), 0);
				} else {
					if (log) log ("time(",action,")=", (new Date().getTime() - start));
				}
			}
			if (action.toLowerCase().indexOf("down") !== -1) {
				editor.setSelection(0, 0);
			} else {
				var charCount = model.getCharCount();
				editor.setSelection(charCount, charCount);
			}
			editor.focus();
			var start = new Date().getTime();
			t();
		}); 
	
	},
	test_pageDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "pageDown");
	},
	test_pageUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "pageUp");
	},
	test_lineDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "lineDown", 300);
	},
	test_lineUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "lineUp", 300);
	},
	test_getLocationAtOffset: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var editor = this.editor;
		var count = 10;
		var buffer = "";
		for (var i = 0; i < 10;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test without any styles
		editor.setText(buffer);
		editor.focus();
		var length = buffer.length;
		queue.call('getLocationAtOffset', function(callbacks) {
			var start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < length;j++) {
					editor.getLocationAtOffset(j);
				}
			}
			if (log) log("time(getLocationAtOffset)=" + (new Date().getTime() - start));
		});
	},
	test_getLocationAtOffsetStyled: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var editor = this.editor;
		var count = 10;
		var buffer = "";
		for (var i = 0; i < 10;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test with styles
		editor.setText(buffer);
		styler = new eclipse.TextStyler(editor, "js");
		editor.focus();
		var length = buffer.length;
		queue.call('getLocationAtOffsetStyled', function(callbacks) {
			start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (j = 0; j < length;j++) {
					editor.getLocationAtOffset(j);
				}
			}
			if (log) log("time(getLocationAtOffset)[styled]=" + (new Date().getTime() - start));
		});
	},
	test_getOffsetAtLocation: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var editor = this.editor;
		var count = 100;
		var buffer = "";
		for (var i = 0; i < 6;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test without any styles
		editor.setText(buffer);
		editor.focus();
		var location = editor.getLocationAtOffset(length);
		queue.call('getLocationAtOffset', function(callbacks) {
			var start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < location.x; j++) {
					editor.getOffsetAtLocation(j, location.y);
				}
			}
			if (log) log("time(getOffseAtLocation)=" + (new Date().getTime() - start));
		});
	},
	test_getOffsetAtLocationStyled: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var editor = this.editor;
		var count = 100;
		var buffer = "";
		for (var i = 0; i < 6;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test with styles
		editor.setText(buffer);
		styler = new eclipse.TextStyler(editor, "js");
		editor.focus();
		var location = editor.getLocationAtOffset(length);
		queue.call('getLocationAtOffset[styled]', function(callbacks) {
			start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < location.x; j++) {
					editor.getOffsetAtLocation(j, location.y);
				}
			}
			if (log) log("time(getOffseAtLocation)[styled]=" + (new Date().getTime() - start));
		});
	}
};