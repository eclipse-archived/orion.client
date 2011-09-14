/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global assertEquals orion */

if (window.AsyncTestCase) {
	PerformanceTest = AsyncTestCase("Performance"); 
} else {
	function PerformanceTest (view) {
		this.view = view;
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
		var stylesheets = [
			"/orion/textview/textview.css",
			"/orion/textview/rulers.css",
			"/examples/textview/textstyler.css",
		];
		var options = {
			parent: "divParent",
			model: new orion.textview.TextModel(),
			stylesheet: stylesheets,
			tabSize: 4
		};
		window.top.moveTo(0,0);
		window.top.resizeTo(screen.width,screen.height);
		this.view = new orion.textview.TextView(options);
	},
	tearDown: function () {
		this.view.destroy();
	},
	doPage: function (queue, action, max) {
		var view = this.view;
		var objXml = new XMLHttpRequest();
		objXml.open("GET","/examples/textview/text.txt",false);
		objXml.send(null);
		this.styler = new examples.textview.TextStyler(view, "java");
		view.setText(objXml.responseText);
		var model = view.getModel();
		queue.call(action, function(callbacks) {
			function t() {
				var caretLine = model.getLineAtOffset(view.getCaretOffset());
				view.invokeAction(action);
				if (model.getLineAtOffset(view.getCaretOffset()) !== caretLine && (max === undefined || --max > 0)) {
					setTimeout(callbacks.add(t), 0);
				} else {
					if (window.log) log ("time(",action,")=", (new Date().getTime() - start));
				}
			}
			if (action.toLowerCase().indexOf("down") !== -1) {
				view.setSelection(0, 0);
			} else {
				var charCount = model.getCharCount();
				view.setSelection(charCount, charCount);
			}
			view.focus();
			var start = new Date().getTime();
			t();
		}); 
	
	},
	test_pageDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "pageDown");
	},
	test_selectPageDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "selectPageDown");
	},
	test_pageUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "pageUp");
	},
	test_selectPageUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "selectPageUp");
	},
	test_lineDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "lineDown", 300);
	},
	test_selectLineDown: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "selectLineDown", 300);
	},
	test_lineUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "lineUp", 300);
	},
	test_selectLineUp: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		this.doPage(queue, "selectLineUp", 300);
	},
	test_getLocationAtOffset: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var view = this.view;
		var count = 10;
		var buffer = "";
		for (var i = 0; i < 10;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test without any styles
		view.setText(buffer);
		view.focus();
		var length = buffer.length;
		queue.call('getLocationAtOffset', function(callbacks) {
			var start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < length;j++) {
					view.getLocationAtOffset(j);
				}
			}
			if (window.log) log("time(getLocationAtOffset)=" + (new Date().getTime() - start));
		});
	},
	test_getLocationAtOffsetStyled: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var view = this.view;
		var count = 10;
		var buffer = "";
		for (var i = 0; i < 10;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test with styles
		view.setText(buffer);
		styler = new examples.textview.TextStyler(view, "js");
		view.focus();
		var length = buffer.length;
		queue.call('getLocationAtOffsetStyled', function(callbacks) {
			start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (j = 0; j < length;j++) {
					view.getLocationAtOffset(j);
				}
			}
			if (window.log) log("time(getLocationAtOffset)[styled]=" + (new Date().getTime() - start));
		});
	},
	test_getOffsetAtLocation: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var view = this.view;
		var count = 100;
		var buffer = "";
		for (var i = 0; i < 6;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test without any styles
		view.setText(buffer);
		view.focus();
		var location = view.getLocationAtOffset(length);
		queue.call('getLocationAtOffset', function(callbacks) {
			var start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < location.x; j++) {
					view.getOffsetAtLocation(j, location.y);
				}
			}
			if (window.log) log("time(getOffseAtLocation)=" + (new Date().getTime() - start));
		});
	},
	test_getOffsetAtLocationStyled: function (queue) {
		if (!queue) var queue = new this.FakeQueue();
		var view = this.view;
		var count = 100;
		var buffer = "";
		for (var i = 0; i < 6;i++) {
			buffer += "var nada for nada function " + i + " ";
		}
		
		//test hit test with styles
		view.setText(buffer);
		styler = new examples.textview.TextStyler(view, "js");
		view.focus();
		var location = view.getLocationAtOffset(length);
		queue.call('getLocationAtOffset[styled]', function(callbacks) {
			start = new Date().getTime();
			for (i = 0; i < count;i++) {
				for (var j = 0; j < location.x; j++) {
					view.getOffsetAtLocation(j, location.y);
				}
			}
			if (window.log) log("time(getOffseAtLocation)[styled]=" + (new Date().getTime() - start));
		});
	}
};