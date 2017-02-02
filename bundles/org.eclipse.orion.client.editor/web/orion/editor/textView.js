/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 *		Mihai Sucan (Mozilla Foundation) - fix for Bug#334583 Bug#348471 Bug#349485 Bug#350595 Bug#360726 Bug#361180 Bug#362835 Bug#362428 Bug#362286 Bug#354270 Bug#361474 Bug#363945 Bug#366312 Bug#370584
 ******************************************************************************/

/*eslint-env browser, amd*/
define("orion/editor/textView", [  //$NON-NLS-1$
	'i18n!orion/editor/nls/messages', //$NON-NLS-1$
	'orion/editor/textModel', //$NON-NLS-1$
	'orion/editor/keyModes', //$NON-NLS-1$
	'orion/editor/eventTarget', //$NON-NLS-1$
	'orion/editor/textTheme', //$NON-NLS-1$
	'orion/editor/util', //$NON-NLS-1$
	'orion/util', //$NON-NLS-1$
	'orion/bidiUtils', //$NON-NLS-1$
	'orion/metrics' //$NON-NLS-1$
], function(messages, mTextModel, mKeyModes, mEventTarget, mTextTheme, textUtil, util, bidiUtils, mMetrics) {

	/** @private */
	function getWindow(doc) {
		return doc.defaultView || doc.parentWindow;
	}
	function newArray(len) {
		return new Array(len);
	}
	var addHandler = textUtil.addEventListener;
	var removeHandler = textUtil.removeEventListener;
	/** @private */
	function applyStyle(style, node, reset) {
		if (reset) {
			node.className = "";
			var attrs = node.attributes;
			for (var i= attrs.length; i-->0;) {
				if (!util.isIE || util.isIE >= 9 || (util.isIE < 9 && attrs[i].specified)) {
					node.removeAttribute(attrs[i].name); 
				}
			}
		}
		if (!style) {
			return;
		}
		if (style.styleClass) {
			node.className = style.styleClass;
		}
		var properties = style.style;
		if (properties) {
			for (var s in properties) {
				if (properties.hasOwnProperty(s)) {
					node.style[s] = properties[s];
				}
			}
		}
		var attributes = style.attributes;
		if (attributes) {
			for (var a in attributes) {
				if (attributes.hasOwnProperty(a)) {
					node.setAttribute(a, attributes[a]);
				}
			}
		}
	}
	/** @private */
	function clone(obj) {
		/*Note that this code only works because of the limited types used in TextViewOptions */
		if (obj instanceof Array) {
			return obj.slice(0);
		}
		return obj;
	}
	/**	@private */
	function merge(obj1, obj2) {
		if (!obj1) {
			return obj2;
		}
		if (!obj2) {
			return obj1;
		}
		for (var p in obj2) {
			if (obj2.hasOwnProperty(p)) {
				if (!obj1.hasOwnProperty(p)) {
					obj1[p] = obj2[p];
				}
			}
		}
		return obj1;
	}
	/** @private */
	var compare = textUtil.compare;
	/** @private */
	function convertDelimiter(text, addTextFunc, addDelimiterFunc) {
		var cr = 0, lf = 0, index = 0, len = text.length;
		while (index < len) {
			if (cr !== -1 && cr <= index) { cr = text.indexOf("\r", index); } //$NON-NLS-1$
			if (lf !== -1 && lf <= index) { lf = text.indexOf("\n", index); } //$NON-NLS-1$
			var start = index, end;
			if (lf === -1 && cr === -1) {
				addTextFunc(text.substring(index));
				break;
			}
			if (cr !== -1 && lf !== -1) {
				if (cr + 1 === lf) {
					end = cr;
					index = lf + 1;
				} else {
					end = cr < lf ? cr : lf;
					index = (cr < lf ? cr : lf) + 1;
				}
			} else if (cr !== -1) {
				end = cr;
				index = cr + 1;
			} else {
				end = lf;
				index = lf + 1;
			}
			addTextFunc(text.substring(start, end));
			if (addDelimiterFunc) {
				addDelimiterFunc();
			} else {
				if (index === len) addTextFunc("");
			}
		}
	}
	/** @private */
	function getBorder(node) {
		var left,_top,right,bottom;
		var win = getWindow(node.ownerDocument);
		if (win.getComputedStyle) {
			var style = win.getComputedStyle(node, null);
			left = style.getPropertyValue("border-left-width"); //$NON-NLS-1$
			_top = style.getPropertyValue("border-top-width"); //$NON-NLS-1$
			right = style.getPropertyValue("border-right-width"); //$NON-NLS-1$
			bottom = style.getPropertyValue("border-bottom-width"); //$NON-NLS-1$
		} else if (node.currentStyle) {
			left = node.currentStyle.borderLeftWidth;
			_top = node.currentStyle.borderTopWidth;
			right = node.currentStyle.borderRightWidth;
			bottom = node.currentStyle.borderBottomWidth;
		}
		return {
			left: parseInt(left, 10) || 0,
			top: parseInt(_top, 10) || 0,
			right: parseInt(right, 10) || 0,
			bottom: parseInt(bottom, 10) || 0
		};
	}
	/** @private */
	function getPadding(node) {
		var left,_top,right,bottom;
		var win = getWindow(node.ownerDocument);
		if (win.getComputedStyle) {
			var style = win.getComputedStyle(node, null);
			left = style.getPropertyValue("padding-left"); //$NON-NLS-1$
			_top = style.getPropertyValue("padding-top"); //$NON-NLS-1$
			right = style.getPropertyValue("padding-right"); //$NON-NLS-1$
			bottom = style.getPropertyValue("padding-bottom"); //$NON-NLS-1$
		} else if (node.currentStyle) {
			left = node.currentStyle.paddingLeft;
			_top = node.currentStyle.paddingTop;
			right = node.currentStyle.paddingRight;
			bottom = node.currentStyle.paddingBottom;
		}
		return {
			left: parseInt(left, 10) || 0, 
			top: parseInt(_top, 10) || 0,
			right: parseInt(right, 10) || 0,
			bottom: parseInt(bottom, 10) || 0
		};
	}
	/** @private */
	function getLineTrim(line) {
		var trim = line._trim;
		if (!trim) {
			trim = getPadding(line);
			var border = getBorder(line);
			trim.left += border.left;
			trim.top += border.top;
			trim.right += border.right;
			trim.bottom += border.bottom;
			line._trim = trim;
		}
		return trim;
	}
	/** @private */
	function DOMReady(doc, _parent, className, callback) {
		className = "_" + className + "DOMReady"; //$NON-NLS-1$ //$NON-NLS-1$
		_parent.className = _parent.className ? _parent.className + " " + className : className; //$NON-NLS-1$
		_parent.__DOMReady = callback;
		var id = className + "Style"; //$NON-NLS-1$
		if (doc.getElementById(id)) { return; }
		var animationName = className + "Animation"; //$NON-NLS-1$
		function insertListener(evt) {
			if (evt.animationName === animationName) {
				var target = evt.target;
				if (typeof target.__DOMReady === "function") { //$NON-NLS-1$
					getWindow(doc).setTimeout(function() {
						target.__DOMReady();
					}, 0);
				}
			}
		}
		function template(className, animationName) {
			var props = ["", "-webkit-", "-moz-", "-ms-", "-o-"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
			var _frames = "", classRule = "body ." + className + " {\n"; //$NON-NLS-1$ //$NON-NLS-2$
			for (var i=0; i<props.length; i++) {
				_frames +=
				"@" + props[i] + "keyframes " + animationName + " {\n" + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
				"from { opacity: 0.99; }\n" + //$NON-NLS-1$
				"to { opacity: 1; }\n" + //$NON-NLS-1$
				"}\n"; //$NON-NLS-1$
				classRule +=
				props[i] + "animation-duration: 0.001s;\n" + //$NON-NLS-1$
				props[i] + "animation-name: " + animationName + ";\n"; //$NON-NLS-1$ //$NON-NLS-2$
			}
			classRule += "}"; //$NON-NLS-1$
			return _frames + classRule;
		}
		addHandler(doc, "animationstart", insertListener, false); //$NON-NLS-1$
		addHandler(doc, "MSAnimationStart", insertListener, false);  //$NON-NLS-1$
		addHandler(doc, "webkitAnimationStart", insertListener, false); //$NON-NLS-1$
		var style = doc.createElement("style"); //$NON-NLS-1$
		style.id = id;
		var head = doc.getElementsByTagName("head")[0] || doc.documentElement; //$NON-NLS-1$
		style.appendChild(doc.createTextNode(template(className, animationName)));
		head.insertBefore(style, head.firstChild);
	}
	
	var Animation = textUtil.Animation;
	
	/** 
	 * Constructs a new Selection object.
	 * 
	 * @class A Selection represents a range of selected text in the view.
	 * @name orion.editor.Selection
	 */
	function Selection (start, end, caret) {
		/**
		 * The selection start offset.
		 *
		 * @name orion.editor.Selection#start
		 */
		this.start = start;
		/**
		 * The selection end offset.
		 *
		 * @name orion.editor.Selection#end
		 */
		this.end = end;
		/** @private */
		this.caret = caret; //true if the start, false if the caret is at end
		/** @private */
		this._columnX = -1;
	}
	/** @private */
	Selection.compare = function(s1, s2) {
		if (s1.length !== s2.length) return false;
		for (var i = 0; i < s1.length; i++) {
			if (!s1[i].equals(s2[i])) return false;
		}
		return true;
	};
	Selection.editing = function(selections, back) {
		var i;
		if (back) {
			for (i = selections.length - 1; i >= 0; i--) {
				if (selections[i]._editing) return selections[i];
			}
			return selections[selections.length - 1];
		}
		for (i = 0; i < selections.length; i++) {
			if (selections[i]._editing) return selections[i];
		}
		return selections[0];
	};
	/** @private */
	Selection.convert = function(selections) {
		if (selections.length === 1) return selections[0];
		return selections;
	};
	/** @private */
	Selection.contains = function(selections, offset) {
		return selections.some(function(selection) {
			return selection.contains(offset);
		});
	};
	/** @private */
	Selection.merge = function(selections) {
		if (selections.length <= 1) return selections;
		selections.sort(function(a, b) {
			return a.start - b.start;
		});
		var result = [];
		var current = selections[0];
		for (var i = 1; i < selections.length; i++) {
			if (selections[i].start >= current.end || current._editing || selections[i]._editing) {
				result.push(current);
				current = selections[i];
			} else {
				current.end = Math.max(current.end, selections[i].end);
			}
		}
		result.push(current);
		return result;
	};
	Selection.prototype = /** @lends orion.editor.Selection.prototype */ {
		/** @private */
		clone: function() {
			var result = new Selection(this.start, this.end, this.caret);
			result._columnX = this._columnX;
			result._editing = this._editing;
			result._docX = this._docX;
			return result;
		},
		/** @private */
		contains: function(offset) {
			if (this.start <= offset && offset < this.end) {
				return true;
			}
			return false;
		},
		/** @private */
		collapse: function() {
			if (this.caret) {
				this.end = this.start;
			} else {
				this.start = this.end;
			}
		},
		/** @private */
		extend: function (offset) {
			if (this.caret) {
				this.start = offset;
			} else {
				this.end = offset;
			}
			if (this.start > this.end) {
				var tmp = this.start;
				this.start = this.end;
				this.end = tmp;
				this.caret = !this.caret;
			}
		},
		/** @private */
		setCaret: function(offset) {
			this.start = offset;
			this.end = offset;
			this.caret = false;
		},
		/** @private */
		getCaret: function() {
			return this.caret ? this.start : this.end;
		},
		/** @private */
		getAnchor: function() {
			return this.caret ? this.end : this.start;
		},
		/** @private */
		getOrientedSelection: function() {
			return {start: this.getAnchor(), end: this.getCaret()};
		},
		/** @private */
		toString: function() {
			return "start=" + this.start + " end=" + this.end + (this.caret ? " caret is at start" : " caret is at end"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-4$
		},
		/** @private */
		isEmpty: function() {
			return this.start === this.end;
		},
		/** @private */
		equals: function(object) {
			return this.caret === object.caret && this.start === object.start && this.end === object.end && this._editing === object._editing;
		}
	};
	/** @private */
	function DOMSelection (view) {
		this._view = view;
		this._divs = [];
		var _parent = view._clipDiv || view._rootDiv;
		for (var i=0; i<3; i++) {
			var div = view._createSelectionDiv();
			_parent.appendChild(div);
			this._divs.push(div);
		}
	}
	DOMSelection.prototype = /** @lends orion.editor.DOMSelection.prototype */ {
		/** @private */
		destroy: function() {
			if (!this._divs) return;
			this._divs.forEach(function(div) {
				div.parentNode.removeChild(div);
			});
			this._divs = null;
		},
		/** @private */
		setPrimary: function(enabled) {
			this.primary = enabled;
		},
		/** @private */
		update: function() {
			var view = this._view;
			var primary = this.primary;
			var focused = view._hasFocus;
			var visible = view._cursorVisible;
			var cursor = !this.primary && this._selection && this._selection.isEmpty();
			var className;
			if (cursor) {
				className = "textviewSelectionCaret"; //$NON-NLS-1$
			} else {
				className = focused ? "textviewSelection" : "textviewSelectionUnfocused"; //$NON-NLS-1$ //$NON-NLS-2$
			}
			this._divs[0].style.visibility = (cursor && visible && focused) || !cursor ? "visible" : "hidden"; //$NON-NLS-1$ //$NON-NLS-2$
			this._divs[0].style.zIndex = visible && cursor ? "2" : "0"; //$NON-NLS-1$ //$NON-NLS-2$
			this._divs.forEach(function(div) {
				div.className = className;
				if (util.isWebkit < 537.36 && primary) {
					div.style.background = focused ? "transparent" : ""; //$NON-NLS-1$
				}
			});
		},
		/** @private */
		setSelection: function (selection) {
			this._selection = selection;
			this.update();
			var view = this._view;
			var model = view._model;
			var startLine = model.getLineAtOffset(selection.start);
			var endLine = model.getLineAtOffset(selection.end);
			var firstNode = view._getLineNext();
			/*
			* Bug in Firefox. For some reason, after a update page sometimes the 
			* firstChild returns null incorrectly. The fix is to ignore show selection.
			*/
			if (!firstNode) { return; }
			var lastNode = view._getLinePrevious();
			
			var topNode, bottomNode, topOffset, bottomOffset;
			if (startLine < firstNode.lineIndex) {
				topNode = firstNode;
				topOffset = model.getLineStart(firstNode.lineIndex);
			} else if (startLine > lastNode.lineIndex) {
				topNode = lastNode;
				topOffset = model.getLineStart(lastNode.lineIndex);
			} else {
				topNode = view._getLineNode(startLine);
				topOffset = selection.start;
			}

			if (endLine < firstNode.lineIndex) {
				bottomNode = firstNode;
				bottomOffset = model.getLineStart(firstNode.lineIndex);
			} else if (endLine > lastNode.lineIndex) {
				bottomNode = lastNode;
				bottomOffset = model.getLineStart(lastNode.lineIndex);
			} else {
				bottomNode = view._getLineNode(endLine);
				bottomOffset = selection.end;
			}
			this._setDOMSelection(topNode, topOffset, bottomNode, bottomOffset, selection.caret);
		},
		/** @private */
		_setDOMSelection: function (startNode, startOffset, endNode, endOffset, startCaret) {
			this._setDOMFullSelection(startNode, startOffset, endNode, endOffset);
			if (!this.primary) { return; }
			var view = this._view;
			var start = startNode._line.getNodeOffset(startOffset);
			var end = endNode._line.getNodeOffset(endOffset);
			if (!start.node || !end.node) return;
			var range;
			var win = view._getWindow();
			var doc = view._parent.ownerDocument;
			if (win.getSelection) {
				//W3C
				var sel = win.getSelection();
				range = doc.createRange();
				range.setStart(start.node, start.offset);
				range.setEnd(end.node, end.offset);
				if (view._hasFocus && (
					sel.anchorNode !== start.node || sel.anchorOffset !== start.offset ||
					sel.focusNode !== end.node || sel.focusOffset !== end.offset ||
					sel.anchorNode !== end.node || sel.anchorOffset !== end.offset ||
					sel.focusNode !== start.node || sel.focusOffset !== start.offset))
				{
					view._anchorNode = start.node;
					view._anchorOffset = start.offset;
					view._focusNode = end.node;
					view._focusOffset = end.offset;
					view._ignoreSelect = false;
					if (sel.rangeCount > 0) { sel.removeAllRanges(); }
					sel.addRange(range);
					view._ignoreSelect = true;
				}
				if (view._cursorDiv) {
					range = doc.createRange();
					if (startCaret) {
						range.setStart(start.node, start.offset);
						range.setEnd(start.node, start.offset);
					} else {
						range.setStart(end.node, end.offset);
						range.setEnd(end.node, end.offset);
					}
					var rect = range.getClientRects()[0];
					var cursorParent = view._cursorDiv.parentNode;
					var clientRect = cursorParent.getBoundingClientRect();
					if (rect && clientRect) {
						view._cursorDiv.style.top = (rect.top - clientRect.top + cursorParent.scrollTop) + "px"; //$NON-NLS-1$
						view._cursorDiv.style.left = (rect.left - clientRect.left + cursorParent.scrollLeft) + "px"; //$NON-NLS-1$
					}
				}
			} else if (doc.selection) {
				if (!view._hasFocus) { return; }
				//IE < 9
				var body = doc.body;

				/*
				* Bug in IE. For some reason when text is deselected the overflow
				* selection at the end of some lines does not get redrawn.  The
				* fix is to create a DOM element in the body to force a redraw.
				*/
				var child = util.createElement(doc, "div"); //$NON-NLS-1$
				body.appendChild(child);
				body.removeChild(child);
				
				range = body.createTextRange();
				range.moveToElementText(start.node.parentNode);
				range.moveStart("character", start.offset); //$NON-NLS-1$
				var endRange = body.createTextRange();
				endRange.moveToElementText(end.node.parentNode);
				endRange.moveStart("character", end.offset); //$NON-NLS-1$
				range.setEndPoint("EndToStart", endRange); //$NON-NLS-1$
				view._ignoreSelect = false;
				range.select();
				view._ignoreSelect = true;
			}
		},
		/** @private */
		_setDOMFullSelection: function(startNode, startOffset, endNode, endOffset) {
			this._divs.forEach(function(div) {
				div.style.width = div.style.height = "0px"; //$NON-NLS-1$
			});
			var view = this._view;
			if (!view._fullSelection) { return; }
			if (util.isIOS) { return; }
			if (startNode === endNode && startOffset === endOffset && this.primary) { return; }
			var viewPad = view._getViewPadding();
			var clientRect = view._clientDiv.getBoundingClientRect();
			var viewRect = view._viewDiv.getBoundingClientRect();
			var left = viewRect.left + viewPad.left;
			var right = clientRect.right;
			var _top = viewRect.top + viewPad.top;
			var bottom = clientRect.bottom;
			var hd = 0, vd = 0;
			if (view._clipDiv) {
				var clipRect = view._clipDiv.getBoundingClientRect();
				hd = clipRect.left - view._clipDiv.scrollLeft;
				vd = clipRect.top;
			} else {
				var rootpRect = view._rootDiv.getBoundingClientRect();
				hd = rootpRect.left;
				vd = rootpRect.top;
			}
			view._ignoreDOMSelection = true;
			var startLine = new TextLine(view, startNode.lineIndex, startNode);
			var startRect = startLine.getBoundingClientRect(startOffset, false);
			var l = startRect.left, endLine, endRect;
			if (startNode === endNode && startOffset === endOffset) {
				endLine = startLine;
				endRect = startRect;
			} else {
				endLine = new TextLine(view, endNode.lineIndex, endNode);
				endRect = endLine.getBoundingClientRect(endOffset, false);
			}
			var r = endRect.left;
			view._ignoreDOMSelection = false;
			var sel1Div = this._divs[0];
			var sel1Left = Math.min(right, Math.max(left, l));
			var sel1Top = Math.min(bottom, Math.max(_top, startRect.top));
			var sel1Right = right;
			var sel1Bottom = Math.min(bottom, Math.max(_top, startRect.bottom));
			sel1Div.style.left = (sel1Left - hd) + "px"; //$NON-NLS-1$
			sel1Div.style.top = (sel1Top - vd) + "px"; //$NON-NLS-1$
			sel1Div.style.width = Math.max(0, sel1Right - sel1Left) + "px"; //$NON-NLS-1$
			sel1Div.style.height = Math.max(0, sel1Bottom - sel1Top) + "px"; //$NON-NLS-1$
			if (startNode.lineIndex === endNode.lineIndex) {
				sel1Right = Math.min(r, right);
				sel1Div.style.width = Math.max(this.primary ? 0 : 1, sel1Right - sel1Left) + "px"; //$NON-NLS-1$
			} else {
				var sel3Left = left;
				var sel3Top = Math.min(bottom, Math.max(_top, endRect.top));
				var sel3Right = Math.min(right, Math.max(left, r));
				var sel3Bottom = Math.min(bottom, Math.max(_top, endRect.bottom));
				var sel3Div = this._divs[2];
				sel3Div.style.left = (sel3Left - hd) + "px"; //$NON-NLS-1$
				sel3Div.style.top = (sel3Top - vd) + "px"; //$NON-NLS-1$
				sel3Div.style.width = Math.max(0, sel3Right - sel3Left) + "px"; //$NON-NLS-1$
				sel3Div.style.height = Math.max(0, sel3Bottom - sel3Top) + "px"; //$NON-NLS-1$
				if (Math.abs(startNode.lineIndex - endNode.lineIndex) > 1) {
					var sel2Div = this._divs[1];
					sel2Div.style.left = (left - hd)  + "px"; //$NON-NLS-1$
					sel2Div.style.top = (sel1Bottom - vd) + "px"; //$NON-NLS-1$
					sel2Div.style.width = Math.max(0, right - left) + "px"; //$NON-NLS-1$
					sel2Div.style.height = Math.max(0, sel3Top - sel1Bottom) + "px"; //$NON-NLS-1$
				}
			}
		}
	};
	/** @private */
	function TextRect (rect) {
		this.left = rect.left;
		this.top = rect.top;
		this.right = rect.right;
		this.bottom = rect.bottom;
	}
	TextRect.prototype = /** @lends orion.editor.TextRect.prototype */ {
		/** @private */
		toString: function() {
			return "{l=" + this.left + ", t=" + this.top + ", r=" + this.right + ", b=" + this.bottom + "}"; //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
		}
	};
	/** 
	 * Constructs a new TextLine object.
	 * 
	 * @class A TextLine represents a line of text in the view.
	 * @name orion.editor.TextLine
	 * @private
	 */
	function TextLine (view, lineIndex, lineDiv) {
		/**
		 * The view.
		 *
		 * @name orion.editor.TextLine#view
		 * @private
		 */
		this.view = view;
		/**
		 * The line index.
		 *
		 * @name orion.editor.TextLine#lineIndex
		 * @private
		 */
		this.lineIndex = lineIndex;
		
		this._lineDiv = lineDiv;
	}
	TextLine.prototype = /** @lends orion.editor.TextLine.prototype */ {
		/** @private */
		create: function(_parent, div) {
			if (this._lineDiv) { return; }
			var child = this._lineDiv = this._createLine(_parent, div, this.lineIndex);
			child._line = this;
			return child;
		},
		_createLine: function(_parent, div, lineIndex) {
			var view = this.view;
			var model = view._model;
			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var e = {type:"LineStyle", textView: view, lineIndex: lineIndex, lineText: lineText, lineStart: lineStart}; //$NON-NLS-1$
			view.onLineStyle(e);
			var doc = _parent.ownerDocument;
			var lineDiv = div || util.createElement(doc, "div"); //$NON-NLS-1$
			if (!div || !compare(div.viewStyle, e.style)) {
				applyStyle(e.style, lineDiv, div);
				if (div) { div._trim = null; }
				lineDiv.viewStyle = e.style;
			}
			lineDiv.lineIndex = lineIndex;
			
			if (div && lineDiv.viewLineText === lineText && compare(e.ranges, lineDiv.viewRanges)) {
				return lineDiv;
			}
			lineDiv.viewRanges = e.ranges;
			lineDiv.viewLineText = lineText;
			
			var ranges = [];
			var data = {tabOffset: 0, ranges: ranges};
			this._createRanges(e.ranges, lineText, 0, lineText.length, lineStart, data);
			
			/*
			* A trailing span with a whitespace is added for three different reasons:
			* 1. Make sure the height of each line is the largest of the default font
			* in normal, italic, bold, and italic-bold.
			* 2. When full selection is off, Firefox, Opera and IE9 do not extend the 
			* selection at the end of the line when the line is fully selected. 
			* 3. The height of a div with only an empty span is zero.
			*/
			var c = " "; //$NON-NLS-1$
			if (!view._fullSelection && util.isIE < 9) {
				/* 
				* IE8 already selects extra space at end of a line fully selected,
				* adding another space at the end of the line causes the selection 
				* to look too big. The fix is to use a zero-width space (\uFEFF) instead. 
				*/
				c = "\uFEFF"; //$NON-NLS-1$
			}
			var range = {text: c, style: view._metrics.largestFontStyle, ignoreChars: 1};
			if (ranges.length === 0 || !ranges[ranges.length - 1].style || ranges[ranges.length - 1].style.tagName !== "div") { //$NON-NLS-1$
				ranges.push(range);
			} else {
				ranges.splice(ranges.length - 1, 0, range);
			}
		
			var span, style, oldSpan, oldStyle, text, oldText, end = 0, oldEnd = 0, next, i;
			if (util.isFirefox && lineText.length > 2000) {
				if (div) {
					lineDiv.innerHTML = "";
					div.lineWidth = undefined;
				}
				var frag = doc.createDocumentFragment();
				for (i = 0; i < ranges.length; i++) {
					range = ranges[i];
					text = range.text;
					style = range.style;
					span = this._createSpan(lineDiv, text, style, range.ignoreChars);
					frag.appendChild(span);
				}
				lineDiv.appendChild(frag);
			} else {
				var changeCount, changeStart;
				if (div) {
					var modelChangedEvent = div.modelChangedEvent;
					if (modelChangedEvent) {
						if (modelChangedEvent.removedLineCount === 0 && modelChangedEvent.addedLineCount === 0) {
							changeStart = modelChangedEvent.start - lineStart;
							changeCount = modelChangedEvent.addedCharCount - modelChangedEvent.removedCharCount;
						} else {
							changeStart = -1;
						}
						div.modelChangedEvent = undefined;
					}
					oldSpan = div.firstChild;
				}
				for (i = 0; i < ranges.length; i++) {
					range = ranges[i];
					text = range.text;
					end += text.length;
					style = range.style;
					if (oldSpan) {
						oldText = oldSpan.firstChild.data;
						oldStyle = oldSpan.viewStyle;
						if (oldText === text && compare(style, oldStyle)) {
							oldEnd += oldText.length;
							oldSpan._rectsCache = undefined;
							span = oldSpan = oldSpan.nextSibling;
							continue;
						} else {
							while (oldSpan) {
								if (changeStart !== -1) {
									var spanEnd = end;
									if (spanEnd >= changeStart) {
										spanEnd -= changeCount;
									}
									var t = oldSpan.firstChild.data;
									var len = t ? t.length : 0;
									if (oldEnd + len > spanEnd) { break; }
									oldEnd += len;
								}
								next = oldSpan.nextSibling;
								lineDiv.removeChild(oldSpan);
								oldSpan = next;
							}
						}
					}
					span = this._createSpan(lineDiv, text, style, range.ignoreChars);
					if (oldSpan) {
						lineDiv.insertBefore(span, oldSpan);
					} else {
						lineDiv.appendChild(span);
					}
					if (div) {
						div.lineWidth = undefined;
					}
				}
				if (div) {
					var tmp = span ? span.nextSibling : null;
					while (tmp) {
						next = tmp.nextSibling;
						div.removeChild(tmp);
						tmp = next;
					}
				}
			}
			if (!lineDiv.parentNode) {
				_parent.appendChild(lineDiv);
			}
			return lineDiv;
		},
		_createRanges: function(ranges, text, start, end, lineStart, data) {
			if (start > end) { return; }
			if (ranges) {
				for (var i = 0; i < ranges.length; i++) {
					var range = ranges[i];
					if (range.end < lineStart + start) { continue; }
					var styleStart = Math.max(lineStart + start, range.start) - lineStart;
					if (styleStart > end) { break; }
					var styleEnd = Math.min(lineStart + end, range.end) - lineStart;
					if (styleStart <= styleEnd) {
						styleStart = Math.max(start, styleStart);
						styleEnd = Math.min(end, styleEnd);
						if (start < styleStart) {
							this._createRange(text, start, styleStart, null, data);
						}
						if (!range.style || !range.style.unmergeable) {
							while (i + 1 < ranges.length && ranges[i + 1].start - lineStart === styleEnd && compare(range.style, ranges[i + 1].style)) {
								range = ranges[i + 1];
								styleEnd = Math.min(lineStart + end, range.end) - lineStart;
								i++;
							}
						}
						this._createRange(text, styleStart, styleEnd, range.style, data);
						start = styleEnd;
					}
				}
			}
			if (start < end) {
				this._createRange(text, start, end, null, data);
			}
		},
		_createRange: function(text, start, end, style, data) {
			if (start > end) { return; }
			var tabSize = this.view._customTabSize, range;
			var bidiStyle = {tagName:"span", bidi:true, style:{unicodeBidi:"embed", direction:"ltr"}};
			var bidiRange = {text: "\u200E", style: bidiStyle}; // We ensure segments flow from left to right by adding a LRM marker \u200E
			if (tabSize && tabSize !== 8) {
				var tabIndex = text.indexOf("\t", start); //$NON-NLS-1$
				while (tabIndex !== -1 && tabIndex < end) {
					if (start < tabIndex) {
						range = {text: text.substring(start, tabIndex), style: style};
						range = bidiUtils.enforceTextDir(range);
						data.ranges.push(range);
						if (bidiUtils.isBidiEnabled()) {
							data.ranges.push(bidiRange);
						}
						data.tabOffset += range.text.length;
					}
					var spacesCount = tabSize - (data.tabOffset % tabSize);
					if (spacesCount > 0) {
						//TODO hack to preserve tabs in getDOMText()
						var spaces = "\u00A0"; //$NON-NLS-1$
						for (var i = 1; i < spacesCount; i++) {
							spaces += " "; //$NON-NLS-1$
						}
						range = {text: spaces, style: style, ignoreChars: spacesCount - 1};
						data.ranges.push(range);
						if (bidiUtils.isBidiEnabled()) {
							data.ranges.push(bidiRange);
						}
						data.tabOffset += range.text.length;
					}
					start = tabIndex + 1;
					if (start === end) {
						return;
					}
					tabIndex = text.indexOf("\t", start); //$NON-NLS-1$
				}
			}
			if (start <= end) {
				range = {text: text.substring(start, end), style: style};
				range = bidiUtils.enforceTextDir(range);
				data.ranges.push(range);
				if (bidiUtils.isBidiEnabled()) {
					data.ranges.push(bidiRange);
				}
				data.tabOffset += range.text.length;
			}
		},
		_createSpan: function(_parent, text, style, ignoreChars) {
			var view = this.view;
			var tagName = "span"; //$NON-NLS-1$
			if (style && style.tagName) {
				tagName = style.tagName.toLowerCase();
			}
			var isLink = tagName === "a"; //$NON-NLS-1$
			if (isLink) { this.hasLink = true; }
			if (isLink && !view._linksVisible) {
				tagName = "span"; //$NON-NLS-1$
			}
			var doc = _parent.ownerDocument;
			var child = util.createElement(_parent.ownerDocument, tagName);
			child.appendChild(doc.createTextNode(style && style.text ? style.text : text));
			if (style && style.html) {
				child.innerHTML = style.html;
				child.ignore = true;
			} else if (style && style.node) {
				child.appendChild(style.node);
				child.ignore = true;
			} else if (style && style.bidi) {				
				child.ignore = true;
			}
			applyStyle(style, child);
			if (tagName === "a") { //$NON-NLS-1$
				var win = view._getWindow();
				addHandler(child, "click", function(e) { return view._handleLinkClick(e ? e : win.event); }, false); //$NON-NLS-1$
			}
			child.viewStyle = style;
			if (ignoreChars) {
				child.ignoreChars = ignoreChars;
			}
			return child;
		},
		_ensureCreated: function() {
			if (this._lineDiv) { return this._lineDiv; }
			return (this._createdDiv = this.create(this.view._clientDiv, null));
		},
		/** @private */
		getBoundingClientRect: function(offset, absolute) {
			var child = this._ensureCreated();
			var view = this.view;
			if (offset === undefined) {
				return this._getLineBoundingClientRect(child, true);
			}
			var model = view._model;
			var doc = child.ownerDocument;
			var lineIndex = this.lineIndex;
			var result = null;
			if (offset < model.getLineEnd(lineIndex)) {
				var lineOffset = model.getLineStart(lineIndex);
				this.forEach(function(lineChild) {
					var textNode = lineChild.firstChild;
					var nodeLength = this._nodeLength(lineChild); 
					if (lineOffset + nodeLength > offset) {
						var index = offset - lineOffset;
						var range;
						if (textNode.length === 1) {
							result = new TextRect(lineChild.getBoundingClientRect());
						} else if (view._isRangeRects) {
							range = doc.createRange();
							range.setStart(textNode, index);
							range.setEnd(textNode, index + 1);
							result = new TextRect(range.getBoundingClientRect());
						} else if (util.isIE) {
							range = doc.body.createTextRange();
							range.moveToElementText(lineChild);
							range.collapse();
							/*
							* Bug in IE8. TextRange.getClientRects() and TextRange.getBoundingClientRect() fails
							* if the line child is not the first element in the line and if the start offset is 0. 
							* The fix is to use Node.getClientRects() left edge instead.
							*/
							var fixIE8 = index === 0 && util.isIE === 8;
							if (fixIE8) { index = 1; }
							range.moveEnd("character", index + 1); //$NON-NLS-1$
							range.moveStart("character", index); //$NON-NLS-1$
							result = new TextRect(range.getBoundingClientRect());
							if (fixIE8) {
								result.left = lineChild.getClientRects()[0].left;
							}
						} else {
							var text = textNode.data;
							lineChild.removeChild(textNode);
							lineChild.appendChild(doc.createTextNode(text.substring(0, index)));
							var span = util.createElement(doc, "span"); //$NON-NLS-1$
							span.appendChild(doc.createTextNode(text.substring(index, index + 1)));
							lineChild.appendChild(span);
							lineChild.appendChild(doc.createTextNode(text.substring(index + 1)));
							result = new TextRect(span.getBoundingClientRect());
							lineChild.innerHTML = "";
							lineChild.appendChild(textNode);
							if (!this._createdDiv) {
								/*
								 * Removing the element node that holds the selection start or end
								 * causes the selection to be lost. The fix is to detect this case
								 * and restore the selection. 
								 */
								var s = view._getSelections()[0];
								if ((lineOffset <= s.start && s.start < lineOffset + nodeLength) ||  (lineOffset <= s.end && s.end < lineOffset + nodeLength)) {
									view._updateDOMSelection();
								}
							}
						}
						if (util.isIE < 11) {
							var win = getWindow(child.ownerDocument);
							var xFactor = win.screen.logicalXDPI / win.screen.deviceXDPI;
							var yFactor = win.screen.logicalYDPI / win.screen.deviceYDPI;
							result.left = result.left * xFactor;
							result.right = result.right * xFactor;
							result.top = result.top * yFactor;
							result.bottom = result.bottom * yFactor;
						}
						return false;
					}
					lineOffset += nodeLength;
					return true;
				});
			}
			var rect = this.getBoundingClientRect();
			if (!result) {
				if (view._wrapMode) {
					var rects = this.getClientRects();
					result = rects[rects.length - 1];
					result.left = result.right;
					result.left += rect.left;
					result.top += rect.top;
					result.right += rect.left;
					result.bottom += rect.top;
				} else {
					result = new TextRect(rect);
					result.left = result.right;
				}
			}
			if (absolute || absolute === undefined) {
				result.left -= rect.left;
				result.top -= rect.top;
				result.right -= rect.left;
				result.bottom -= rect.top;
			}
			return result;
		},
		forEach: function(callback) {
			var child = this._ensureCreated();
			var lineChild = child.firstChild;
			while (lineChild) {
				var next = lineChild.nextSibling;
				if (!lineChild.ignore) {
					if (!callback.call(this, lineChild)) {
						break;
					}
				}
				lineChild = next;
			}
		},
		/** @private */
		_getClientRects: function(element, parentRect) {
			var rects, newRects, rect, i;
			if (!element._rectsCache) {
				rects = element.getClientRects();
				newRects = newArray(rects.length);
				for (i = 0; i<rects.length; i++) {
					rect = newRects[i] = new TextRect(rects[i]);
					rect.left -= parentRect.left;
					rect.top -= parentRect.top;
					rect.right -= parentRect.left;
					rect.bottom -= parentRect.top;
				}
				element._rectsCache = newRects;
			}
			rects = element._rectsCache;
			newRects = [rects.length];
			for (i = 0; i<rects.length; i++) {
				newRects[i] = new TextRect(rects[i]);
			}
			return newRects;
		},
		getClientRects: function(lineIndex) {
			if (!this.view._wrapMode) { return [this.getBoundingClientRect()]; }
			var child = this._ensureCreated();
			//TODO [perf] cache rects
			var result = [];
			var parentRect = child.getBoundingClientRect();
			this.forEach(function(lineChild) {
				var rects = this._getClientRects(lineChild, parentRect);
				for (var i = 0; i < rects.length; i++) {
					var rect = rects[i], j, r;
					if (rect.top === rect.bottom) { continue; }
					var center = rect.top + (rect.bottom - rect.top) / 2;
					for (j = 0; j < result.length; j++) {
						r = result[j];
						if ((r.top <= center && center < r.bottom)) {
							break;
						}
					}
					if (j === result.length) {
						result.push(rect);
					} else {
						if (rect.left < r.left) { r.left = rect.left; }
						if (rect.top < r.top) { r.top = rect.top; }
						if (rect.right > r.right) { r.right = rect.right; }
						if (rect.bottom > r.bottom) { r.bottom = rect.bottom; }
					}
				}
				return true;
			});
			if (lineIndex !== undefined) {
				return result[lineIndex];
			}
			return result;
		},
		/** @private */
		_getLineBoundingClientRect: function (child, noTrim) {
			var rect = new TextRect(child.getBoundingClientRect());
			if (this.view._wrapMode) {
			} else {
				rect.right = rect.left;
				var lastChild = child.lastChild;
				//Remove any artificial trailing whitespace in the line
				while (lastChild && lastChild.ignoreChars === lastChild.firstChild.length) {
					lastChild = lastChild.previousSibling;
				}
				if (lastChild) {
					var lastRect = lastChild.getBoundingClientRect();
					rect.right = lastRect.right + getLineTrim(child).right;
				}
			}
			if (noTrim) {
				var padding = getLineTrim(child);
				rect.left = rect.left + padding.left;
				rect.right = rect.right - padding.right;
			}
			return rect;
		},
		/** @private */
		getLineCount: function () {
			if (!this.view._wrapMode) { return 1; }
			return this.getClientRects().length;
		},
		/** @private */
		getLineIndex: function(offset) {
			if (!this.view._wrapMode) { return 0; }
			var rects = this.getClientRects();
			var rect = this.getBoundingClientRect(offset);
			var center = rect.top + ((rect.bottom - rect.top) / 2);
			for (var i = 0; i < rects.length; i++) {
				if (rects[i].top <= center && center < rects[i].bottom) {
					return i;
				}
			}
			return rects.length - 1;
		},
		/** @private */
		getLineStart: function (lineIndex) {
			if (!this.view._wrapMode || lineIndex === 0) {
				return this.view._model.getLineStart(this.lineIndex);
			}
			var rects = this.getClientRects();
			return this.getOffset(rects[lineIndex].left + 1, rects[lineIndex].top + 1);
		},
		_nodeLength: function(lineChild) {
			if (!lineChild || lineChild.ignore) return 0;
			var len = lineChild.firstChild.length; 
			if (lineChild.ignoreChars) {
				len -= lineChild.ignoreChars;
			}
			return len;
		},
		getModelOffset: function(node, offset) {
			if (!node) { return 0; }
			var lineOffset = 0;
			this.forEach(function(lineChild) {
				var textNode = lineChild.firstChild;
				if (textNode === node) {
					if (lineChild.ignoreChars) { lineOffset -= lineChild.ignoreChars; }
					lineOffset += offset;
					return false;
				}
				if (lineChild.ignoreChars) { lineOffset -= lineChild.ignoreChars; }
				lineOffset += textNode.data.length;
				return true;
			});
			return Math.max(0, lineOffset) + this.view._model.getLineStart(this.lineIndex);
		},
		getNodeOffset: function(modelOffset) {
			var offset = 0;
			var lineNode, lineNodeOffset;
			var model = this.view._model;
			var lineStart = model.getLineStart(this.lineIndex);
			var lineOffset = modelOffset - lineStart;
			var end = model.getLineEnd(this.lineIndex) - lineStart;
			this.forEach(function(lineChild) {
				var node = lineChild.firstChild;
				var nodeLength = this._nodeLength(lineChild);
				if (nodeLength + offset > lineOffset || offset + nodeLength >= end) {
					lineNode = node;
					lineNodeOffset = lineOffset - offset;
					if (lineChild.ignoreChars && nodeLength > 0 && lineNodeOffset === nodeLength) {
						lineNodeOffset += lineChild.ignoreChars; 
					}
					return false;
				}
				offset += nodeLength;
				return true;
			});
			return {node: lineNode, offset: lineNodeOffset};
		},
		getText: function(offsetNode) {
			var text = "", offset = 0;
			this.forEach(function(lineChild) {
				var textNode;
				if (lineChild.ignoreChars) {
					textNode = lineChild.lastChild;
					var ignored = 0, childText = [], childOffset = -1;
					while (textNode) {
						var data = textNode.data;
						if (data) {
							for (var i = data.length - 1; i >= 0; i--) {
								var ch = data.substring(i, i + 1);
								if (ignored < lineChild.ignoreChars && (ch === " " || ch === "\uFEFF")) { //$NON-NLS-1$ //$NON-NLS-1$
									ignored++;
								} else {
									childText.push(ch === "\u00A0" ? "\t" : ch); //$NON-NLS-1$ //$NON-NLS-1$
								}
							}
						}
						if (offsetNode === textNode) {
							childOffset = childText.length;
						}
						textNode = textNode.previousSibling;
					}
					childText = childText.reverse().join("");
					if (childOffset !== -1) {
						offset = text.length + childText.length - childOffset;
					}
					text += childText;
				} else {
					textNode = lineChild.firstChild;
					while (textNode) {
						if (offsetNode === textNode) {
							offset = text.length;
						}
						text += textNode.data;
						textNode = textNode.nextSibling;
					}
				}
				return true;
			});
			return {text: text, offset: offset};
		},
		/** @private */
		getOffset: function(x, y) {
			var view = this.view;
			var model = view._model;
			var lineIndex = this.lineIndex;
			var lineStart = model.getLineStart(lineIndex);
			var lineEnd = model.getLineEnd(lineIndex);
			if (lineStart === lineEnd) {
				return lineStart;
			}
			var child = this._ensureCreated();
			var lineRect = this.getBoundingClientRect();
			
			var that = this;
			function hitChild(lineChild, offset, rect) {
				var textNode = lineChild.firstChild;
				var nodeLength = that._nodeLength(lineChild);
				var doc = child.ownerDocument;
				var win = getWindow(doc);
				var xFactor = util.isIE < 11 ? win.screen.logicalXDPI / win.screen.deviceXDPI : 1;
				var yFactor = util.isIE < 11 ? win.screen.logicalYDPI / win.screen.deviceYDPI : 1;
				var rangeLeft, rangeTop, rangeRight, rangeBottom;
				var range, start, end;
				var rl = rect.left + lineRect.left, fixIE8, rects1;
				if (util.isIE || view._isRangeRects) {
					range = view._isRangeRects ? doc.createRange() : doc.body.createTextRange();
					var high = nodeLength;
					var low = -1;
					while ((high - low) > 1) {
						var mid = Math.floor((high + low) / 2);
						start = low + 1;
						end = mid === nodeLength - 1 && lineChild.ignoreChars ? textNode.length : mid + 1;
						/*
						* Bug in IE8. TextRange.getClientRects() and TextRange.getBoundingClientRect() fails
						* if the line child is not the first element in the line and if the start offset is 0. 
						* The fix is to use Node.getClientRects() left edge instead.
						*/
						fixIE8 = start === 0 && util.isIE === 8;
						if (view._isRangeRects) {
							range.setStart(textNode, start);
							range.setEnd(textNode, end);
						} else {
							if (fixIE8) { start = 1; } 
							range.moveToElementText(lineChild);
							range.move("character", start); //$NON-NLS-1$
							range.moveEnd("character", end - start); //$NON-NLS-1$
						}
						rects1 = range.getClientRects();
						var found = false;
						for (var k = 0; k < rects1.length; k++) {
							rect = rects1[k];
							rangeLeft = (fixIE8 ? rl : rect.left) * xFactor - lineRect.left;
							rangeRight = rect.right * xFactor - lineRect.left;
							rangeTop = rect.top * yFactor - lineRect.top;
							rangeBottom = rect.bottom * yFactor - lineRect.top;
							if (rangeLeft <= x && x < rangeRight && (!view._wrapMode || (rangeTop <= y && y <= rangeBottom))) {
								found = true;
								break;
							}
						}
						if (found) {
							high = mid;
						} else {
							low = mid;
						}
					}
					offset += high;
					start = high;
					end = high === nodeLength - 1 && lineChild.ignoreChars ? textNode.length : Math.min(high + 1, textNode.length);
					if (view._isRangeRects) {
						range.setStart(textNode, start);
						range.setEnd(textNode, end);
					} else {
						range.moveToElementText(lineChild);
						range.move("character", start); //$NON-NLS-1$
						range.moveEnd("character", end - start); //$NON-NLS-1$
					}
					rects1 = range.getClientRects();
					var trailing = false;
					if (rects1.length > 0) {
						rect = rects1[0];
						rangeLeft = (fixIE8 ? rl : rect.left) * xFactor - lineRect.left;
						rangeRight = rect.right * xFactor - lineRect.left;
						//TODO test for character trailing (wrong for bidi)
						trailing = x > (rangeLeft + (rangeRight - rangeLeft) / 2);
					}
					// Handle Unicode surrogates
					var offsetInLine = offset - lineStart;
					var lineText = model.getLine(lineIndex);
					var c = lineText.charCodeAt(offsetInLine);
					if (0xD800 <= c && c <= 0xDBFF && trailing) {
						if (offsetInLine < lineText.length) {
							c = lineText.charCodeAt(offsetInLine + 1);
							if (0xDC00 <= c && c <= 0xDFFF) {
								offset += 1;
							}
						}
					} else if (0xDC00 <= c && c <= 0xDFFF && !trailing) {
						if (offsetInLine > 0) {
							c = lineText.charCodeAt(offsetInLine - 1);
							if (0xD800 <= c && c <= 0xDBFF) {
								offset -= 1;
							}
						}
					}
					if (trailing) {
						offset++;
					}
				} else {
					var newText = [];
					for (var q = 0; q < nodeLength; q++) {
						newText.push("<span>"); //$NON-NLS-1$
						if (q === nodeLength - 1) {
							newText.push(textNode.data.substring(q));
						} else {
							newText.push(textNode.data.substring(q, q + 1));
						}
						newText.push("</span>"); //$NON-NLS-1$
					}
					lineChild.innerHTML = newText.join("");
					var rangeChild = lineChild.firstChild;
					while (rangeChild) {
						rect = rangeChild.getBoundingClientRect();
						rangeLeft = rect.left - lineRect.left;
						rangeRight = rect.right - lineRect.left;
						if (rangeLeft <= x && x < rangeRight) {
							//TODO test for character trailing (wrong for bidi)
							if (x > rangeLeft + (rangeRight - rangeLeft) / 2) {
								offset++;
							}
							break;
						}
						offset++;
						rangeChild = rangeChild.nextSibling;
					}
					if (!that._createdDiv) {
						lineChild.innerHTML = "";
						lineChild.appendChild(textNode);
						/*
						 * Removing the element node that holds the selection start or end
						 * causes the selection to be lost. The fix is to detect this case
						 * and restore the selection. 
						 */
						var s = view._getSelections()[0];
						if ((offset <= s.start && s.start < offset + nodeLength) || (offset <= s.end && s.end < offset + nodeLength)) {
							view._updateDOMSelection();
						}
					}
				}
				return offset;
			}
			
			var rects, rect;
			if (view._wrapMode) {
				rects = this.getClientRects();
				if (y < rects[0].top) {
					y = rects[0].top;
				}
				for (var i = 0; i < rects.length; i++) {
					rect = rects[i];
					if (rect.top <= y && y < rect.bottom) {
						break;
					}
				}
				if (x < rect.left) { x = rect.left; }
				if (x > rect.right) { x = rect.right - 1; }
			} else {
				if (x < 0) { x = 0; }
				if (x > (lineRect.right - lineRect.left)) { x = lineRect.right - lineRect.left; }
			}
			
			function hitRects(child) {
				if (child.ignore) return null;
				var rects1 = that._getClientRects(child, lineRect);
				for (var j = 0; j < rects1.length; j++) {
					var rect1 = rects1[j];
					if (rect1.left <= x && x < rect1.right && (!view._wrapMode || (rect1.top <= y && y <= rect1.bottom))) {
						return rect1;
					}
				}
				return null;
			}
			
			var offset, lineChild;
			if (this._lastHitChild && this._lastHitChild.parentNode) {
				// Search last hit child first, then search around the last hit child
				offset = this._lastHitOffset;
				lineChild = this._lastHitChild;
				rect = hitRects(lineChild);
				if (!rect ) {
					var previousOffset = offset, nextOffset = offset + this._nodeLength(lineChild);
					var previousChild = lineChild.previousSibling, nextChild = lineChild.nextSibling;
					while (previousChild || nextChild) {
						if (previousChild) {
							previousOffset -= this._nodeLength(previousChild);
							if ((rect = hitRects(previousChild))) {
								lineChild = previousChild;
								offset = previousOffset;
								break;
							}
							previousChild = previousChild.previousSibling;
						}
						if (nextChild) {
							if ((rect = hitRects(nextChild))) {
								lineChild = nextChild;
								offset = nextOffset;
								break;
							}
							nextOffset += this._nodeLength(nextChild);
							nextChild = nextChild.nextSibling;
						}
					}
				}
			} else {
				// Start searching from the beginning of the line
				offset = lineStart;
				this.forEach(function(c) {
					lineChild = c;
					if ((rect = hitRects(lineChild))) {
						return false;
					}
					offset += this._nodeLength(lineChild);
					return true;
				});
			}
			
			if (lineChild && rect) {
				// Cache the last hit child
				this._lastHitChild = lineChild;
				this._lastHitOffset = offset;

				offset = hitChild(lineChild, offset, rect);
			}

			return Math.min(lineEnd, Math.max(lineStart, offset));
		},
		/** @private */
		getNextOffset: function (offset, data) {
			if (data.unit === "line") { //$NON-NLS-1$
				var view = this.view;
				var model = view._model;
				var lineIndex = model.getLineAtOffset(offset);
				if (data.count > 0) {
					data.count--;
					return model.getLineEnd(lineIndex);
				}
				data.count++;
				return model.getLineStart(lineIndex);
			}
			if (data.unit === "wordend" || data.unit === "wordWS" || data.unit === "wordendWS") { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
				return this._getNextOffset_W3C(offset, data);
			}
			return util.isIE ? this._getNextOffset_IE(offset, data) : this._getNextOffset_W3C(offset, data);
		},
		/** @private */
		_getNextOffset_W3C: function (offset, data) {
			function _isPunctuation(c) {
				return (33 <= c && c <= 47) || (58 <= c && c <= 64) || (91 <= c && c <= 94) || c === 96 || (123 <= c && c <= 126);
			}
			function _isWhitespace(c) {
				return c === 32 || c === 9;
			}
			var view = this.view;
			var model = view._model;
			var lineIndex = model.getLineAtOffset(offset);
			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var lineEnd = model.getLineEnd(lineIndex);
			var lineLength = lineText.length;
			var offsetInLine = offset - lineStart;
			var c;
			var step = data.count < 0 ? -1 : 1;
			if (data.unit === "word" || data.unit === "wordend" || data.unit === "wordWS" || data.unit === "wordendWS") { //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
				var previousPunctuation, previousLetterOrDigit, punctuation, letterOrDigit;
				while (data.count !== 0) {
					if (data.count > 0) {
						if (offsetInLine === lineLength) { return lineEnd; }
						c = lineText.charCodeAt(offsetInLine);
						previousPunctuation = _isPunctuation(c); 
						previousLetterOrDigit = !previousPunctuation && !_isWhitespace(c);
						offsetInLine++;
						while (offsetInLine < lineLength) {
							c = lineText.charCodeAt(offsetInLine);
							if (data.unit !== "wordWS" && data.unit !== "wordendWS") { //$NON-NLS-1$ //$NON-NLS-1$
								punctuation = _isPunctuation(c);
								if (data.unit === "wordend") { //$NON-NLS-1$
									if (!punctuation && previousPunctuation) { break; }
								} else {
									if (punctuation && !previousPunctuation) { break; }
								}
								letterOrDigit  = !punctuation && !_isWhitespace(c);
							} else {
								letterOrDigit  = !_isWhitespace(c);
							}
							if (data.unit === "wordend" || data.unit === "wordendWS") { //$NON-NLS-1$ //$NON-NLS-1$
								if (!letterOrDigit && previousLetterOrDigit) { break; }
							} else {
								if (letterOrDigit && !previousLetterOrDigit) { break; }
							}
							previousLetterOrDigit = letterOrDigit;
							previousPunctuation = punctuation;
							offsetInLine++;
						}
					} else {
						if (offsetInLine === 0) { return lineStart; }
						offsetInLine--;
						c = lineText.charCodeAt(offsetInLine);
						previousPunctuation = _isPunctuation(c); 
						previousLetterOrDigit = !previousPunctuation && !_isWhitespace(c);
						while (0 < offsetInLine) {
							c = lineText.charCodeAt(offsetInLine - 1);
							if (data.unit !== "wordWS" && data.unit !== "wordendWS") { //$NON-NLS-1$ //$NON-NLS-1$ 
								punctuation = _isPunctuation(c);
								if (data.unit === "wordend") { //$NON-NLS-1$
									if (punctuation && !previousPunctuation) { break; }
								} else {
									if (!punctuation && previousPunctuation) { break; }
								}
								letterOrDigit  = !punctuation && !_isWhitespace(c);
							} else {
								letterOrDigit  = !_isWhitespace(c);
							}
							if (data.unit === "wordend" || data.unit === "wordendWS") { //$NON-NLS-1$ //$NON-NLS-1$
								if (letterOrDigit && !previousLetterOrDigit) { break; }
							} else {
								if (!letterOrDigit && previousLetterOrDigit) { break; }
							}
							previousLetterOrDigit = letterOrDigit;
							previousPunctuation = punctuation;
							offsetInLine--;
						}
						if (offsetInLine === 0) {
							//get previous line
						}
					}
					data.count -= step;
				}
			} else {
				while (data.count !== 0 && (0 <= offsetInLine + step && offsetInLine + step <= lineLength)) {
					offsetInLine += step;
					c = lineText.charCodeAt(offsetInLine);
					// Handle Unicode surrogates
					if (offsetInLine > 0) {
						if (0xDFFB <= c && c <= 0xDFFF) {
							c = lineText.charCodeAt(offsetInLine - 1);
							if (0xD83C === c) {
								offsetInLine += step;
								continue; // Skip skin tone modifiers
							}
						}
						else if (0xFE00 <= c && c <= 0xFE0F) { // Skip variation selectors
								continue;
						}
						else if (0xDC00 <= c && c <= 0xDFFF) {
							c = lineText.charCodeAt(offsetInLine - 1);
							if (0xD800 <= c && c <= 0xDBFF) {
								offsetInLine += step;
							}
						}
					}
					data.count -= step;
				}
			}
			return lineStart + offsetInLine;
		},
		/** @private */
		_getNextOffset_IE: function (offset, data) {
			var child = this._ensureCreated();
			var view = this.view;
			var model = view._model;
			var lineIndex = this.lineIndex;
			var result = 0, range, len;
			var lineOffset = model.getLineStart(lineIndex);
			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var doc = child.ownerDocument;
			var lineChild;
			var step = data.count < 0 ? -1 : 1;
			if (offset === model.getLineEnd(lineIndex)) {
				lineChild = child.lastChild;
				while (lineChild && lineChild.ignoreChars === lineChild.firstChild.length) {
					lineChild = lineChild.previousSibling;
				}
				if (!lineChild) {
					return lineOffset;
				}
				range = doc.body.createTextRange();
				range.moveToElementText(lineChild);
				len = range.text.length;
				range.moveEnd(data.unit, step);
				result = offset + range.text.length - len;
			} else if (offset === lineOffset && data.count < 0) {
				result = lineOffset;
			} else {
				lineChild = child.firstChild;
				while (lineChild) {
					var nodeLength = this._nodeLength(lineChild);
					if (lineOffset + nodeLength > offset) {
						range = doc.body.createTextRange();
						if (offset === lineOffset && data.count < 0) {
							var temp = lineChild.previousSibling;
							// skip empty nodes
							while (temp) {
								if (temp.firstChild && temp.firstChild.length) {
									break;
								}
								temp = temp.previousSibling;
							}
							range.moveToElementText(temp ? temp : lineChild.previousSibling);
						} else {
							range.moveToElementText(lineChild);
							range.collapse();
							range.moveEnd("character", offset - lineOffset); //$NON-NLS-1$
						}
						len = range.text.length;
						range.moveEnd(data.unit, step);
						result = offset + range.text.length - len;
						break;
					}
					lineOffset = nodeLength + lineOffset;
					lineChild = lineChild.nextSibling;
				}
			}
			var offsetInLine = result - lineStart;
			var c = lineText.charCodeAt(offsetInLine);
			// Handle Unicode surrogates
			if (0xDC00 <= c && c <= 0xDFFF) {
				if (offsetInLine > 0) {
					c = lineText.charCodeAt(offsetInLine - 1);
					if (0xD800 <= c && c <= 0xDBFF) {
						offsetInLine += step;
					}
				}
			}
			result = offsetInLine + lineStart;
			data.count -= step;
			return result;
		},
		updateLinks: function() {
			var child = this._ensureCreated();
			if (!this.hasLink) { return; }
			var that = this;
			this.forEach(function(span) {
				var style = span.viewStyle;
				if (style && style.tagName && style.tagName.toLowerCase() === "a") { //$NON-NLS-1$
					child.replaceChild(that._createSpan(child, span.firstChild.data, style), span);
				}
				return true;
			});
		},
		/** @private */
		destroy: function() {
			var div = this._createdDiv;
			if (div) {
				div.parentNode.removeChild(div);
				this._createdDiv = null;
			}
		}
	};
	
	/**
	 * @class This object describes the options for the text view.
	 * <p>
	 * <b>See:</b><br/>
	 * {@link orion.editor.TextView}<br/>
	 * {@link orion.editor.TextView#setOptions}
	 * {@link orion.editor.TextView#getOptions}	 
	 * </p>		 
	 * @name orion.editor.TextViewOptions
	 *
	 * @property {String|DOMElement} parent the parent element for the view, it can be either a DOM element or an ID for a DOM element.
	 * @property {orion.editor.TextModel} [model] the text model for the view. If it is not set the view creates an empty {@link orion.editor.TextModel}.
	 * @property {Boolean} [readonly=false] whether or not the view is read-only.
	 * @property {Boolean} [fullSelection=true] whether or not the view is in full selection mode.
	 * @property {Boolean} [tabMode=true] whether or not the tab keypress is consumed by the view or is used for focus traversal.
	 * @property {Boolean} [expandTab=false] whether or not the tab key inserts white spaces.
	 * @property {orion.editor.TextTheme} [theme=orion.editor.TextTheme.getTheme()] the TextTheme manager. TODO more info on this
	 * @property {orion.editor.UndoStack} [undoStack] the Undo Stack.
	 * @property {String} [themeClass] the CSS class for the view theming.
	 * @property {Number} [tabSize=8] The number of spaces in a tab.
	 * @property {Boolean} [overwriteMode=false] whether or not the view is in insert/overwrite mode.
	 * @property {Boolean} [singleMode=false] whether or not the editor is in single line mode.
	 * @property {Number} [marginOffset=0] the offset in a line where the print margin should be displayed. <code>0</code> means no print margin.
	 * @property {Number} [wrapOffset=0] the offset in a line where text should wrap. <code>0</code> means wrap at the client area right edge.
	 * @property {Boolean} [wrapMode=false] whether or not the view wraps lines.
	 * @property {Boolean} [wrapable=false] whether or not the view is wrappable.
	 * @property {Number} [scrollAnimation=0] the time duration in miliseconds for scrolling animation. <code>0</code> means no animation.
	 * @property {Boolean} [blockCursorVisible=false] whether or not to show the block cursor.
	 */
	/**
	 * Constructs a new text view.
	 * 
	 * @param {orion.editor.TextViewOptions} options the view options.
	 * 
	 * @class A TextView is a user interface for editing text.
	 * @name orion.editor.TextView
	 * @borrows orion.editor.EventTarget#addEventListener as #addEventListener
	 * @borrows orion.editor.EventTarget#removeEventListener as #removeEventListener
	 * @borrows orion.editor.EventTarget#dispatchEvent as #dispatchEvent
	 */
	function TextView (options) {
		this._init(options || {});
	}
	
	TextView.prototype = /** @lends orion.editor.TextView.prototype */ {
		/**
		 * Adds a keyMode to the text view at the specified position.
		 *
		 * @param {orion.editor.KeyMode} mode the editor keyMode.
		 * @param {Number} [index=length] the index.
		 */
		addKeyMode: function(mode, index) {
			var keyModes = this._keyModes;
			if (index !== undefined) {
				keyModes.splice(index, 0, mode);
			} else {
				keyModes.push(mode);
			}
			//TODO: API needed for this
			if (mode._modeAdded) {
				mode._modeAdded();
			}
		},
		/**
		 * Adds a ruler to the text view at the specified position.
		 * <p>
		 * The position is relative to the ruler location.
		 * </p>
		 *
		 * @param {orion.editor.Ruler} ruler the ruler.
		 * @param {Number} [index=length] the ruler index.
		 */
		addRuler: function (ruler, index) {
			var rulers = this._rulers;
			if (index !== undefined) {
				var i, sideIndex;
				for (i = 0, sideIndex=0; i < rulers.length && sideIndex < index; i++) {
					if (ruler.getLocation() === rulers[i].getLocation()) {
						sideIndex++;
					}
				}
				rulers.splice(sideIndex, 0, ruler);
				index = sideIndex;
			} else {
				rulers.push(ruler);
			}
			this._createRuler(ruler, index);
			ruler.setView(this);
			this._update();
		},
		computeSize: function() {
			var w = 0, h = 0;
			var model = this._model, clientDiv = this._clientDiv;
			if (!clientDiv) { return {width: w, height: h}; }
			var clientWidth = clientDiv.style.width;
			/*
			* Feature in WekKit. Webkit limits the width of the lines
			* computed below to the width of the client div.  This causes
			* the lines to be wrapped even though "pre" is set.  The fix
			* is to set the width of the client div to a "0x7fffffffpx"
			* before computing the lines width.  Note that this value is
			* reset to the appropriate value further down.
			*/
			if (util.isWebkit) {
				clientDiv.style.width = "0x7fffffffpx"; //$NON-NLS-1$
			}
			var lineCount = model.getLineCount();
			for (var lineIndex=0; lineIndex<lineCount; lineIndex++) {
				var line = this._getLine(lineIndex);
				var rect = line.getBoundingClientRect();
				w = Math.max(w, rect.right - rect.left);
				h += rect.bottom - rect.top;
				line.destroy();
			}
			if (util.isWebkit) {
				clientDiv.style.width = clientWidth;
			}
			var viewPadding = this._getViewPadding();
			w += viewPadding.right + viewPadding.left + this._metrics.scrollWidth;
			h += viewPadding.bottom + viewPadding.top + this._metrics.scrollWidth;
			return {width: w, height: h};
		},
		/**
		 * Converts the given rectangle from one coordinate spaces to another.
		 * <p>The supported coordinate spaces are:
		 * <ul>
		 *   <li>"document" - relative to document, the origin is the top-left corner of first line</li>
		 *   <li>"page" - relative to html page that contains the text view</li>
		 * </ul>
		 * </p>
		 * <p>All methods in the view that take or return a position are in the document coordinate space.</p>
		 *
		 * @param rect the rectangle to convert.
		 * @param rect.x the x of the rectangle.
		 * @param rect.y the y of the rectangle.
		 * @param rect.width the width of the rectangle.
		 * @param rect.height the height of the rectangle.
		 * @param {String} from the source coordinate space.
		 * @param {String} to the destination coordinate space.
		 *
		 * @see orion.editor.TextView#getLocationAtOffset
		 * @see orion.editor.TextView#getOffsetAtLocation
		 * @see orion.editor.TextView#getTopPixel
		 * @see orion.editor.TextView#setTopPixel
		 */
		convert: function(rect, from, to) {
			if (!this._clientDiv) { return rect; }
			var _scroll = this._getScroll();
			var viewPad = this._getViewPadding();
			var viewRect = this._viewDiv.getBoundingClientRect();
			if (from === "document") { //$NON-NLS-1$
				if (rect.x !== undefined) {
					rect.x += - _scroll.x + viewRect.left + viewPad.left;
				}
				if (rect.y !== undefined) {
					rect.y += - _scroll.y + viewRect.top + viewPad.top;
				}
			}
			//At this point rect is in the widget coordinate space
			if (to === "document") { //$NON-NLS-1$
				if (rect.x !== undefined) {
					rect.x += _scroll.x - viewRect.left - viewPad.left;
				}
				if (rect.y !== undefined) {
					rect.y += _scroll.y - viewRect.top - viewPad.top;
				}
			}
			return rect;
		},
		/**
		 * Copies the selected text to the clipboard in plain text format.
		 * @returns {Boolean} <code>true</code> if the operation succeded.
		 * @since 10.0
		 */
		copy: function() {
			if (!this._clientDiv) { return false; }
			return this._doCopy();
		},
		/**
		 * Moves the selected text to the clipboard in plain text format.
		 * @returns {Boolean} <code>true</code> if the operation succeded.
		 * @since 10.0
		 */
		cut: function() {
			if (!this._clientDiv) { return false; }
			return this._doCut();
		},
		/**
		 * Destroys the text view. 
		 * <p>
		 * Removes the view from the page and frees all resources created by the view.
		 * Calling this function causes the "Destroy" event to be fire so that all components
		 * attached to view can release their references.
		 * </p>
		 *
		 * @see orion.editor.TextView#onDestroy
		 */
		destroy: function() {
			/* Destroy rulers*/
			for (var i=0; i< this._rulers.length; i++) {
				this._rulers[i].setView(null);
			}
			this.rulers = null;
			
			this._destroyView();

			var e = {type: "Destroy"}; //$NON-NLS-1$
			this.onDestroy(e);

			this._parent = null;
			if (this._model && this._model.destroy) {
				this._model.destroy();
			}
			this._model = null;
			this._theme = null;
			this._selection = null;
			this._doubleClickSelection = null;
			this._keyModes = null;
			this._actions = null;
		},
		/**
		 * Gives focus to the text view.
		 */
		focus: function() {
			if (!this._clientDiv) { return; }
			/*
			* Feature in Chrome. When focus is called in the clientDiv without
			* setting selection the browser will set the selection to the first dom 
			* element, which can be above the client area. When this happen the 
			* browser also scrolls the window to show that element.
			* The fix is to call _updateDOMSelection() before calling focus().
			*/
			this._updateDOMSelection();
			this._clientDiv.focus();
			/*
			* Feature in Safari. When focus is called the browser selects the clientDiv
			* itself. The fix is to call _updateDOMSelection() after calling focus().
			*/
			this._updateDOMSelection();
		},
		/**
		 * Check if the text view has focus.
		 *
		 * @returns {Boolean} <code>true</code> if the text view has focus, otherwise <code>false</code>.
		 */
		hasFocus: function() {
			return this._hasFocus;
		},
		/**
		 * Returns the action description for a given action ID.
		 *
		 * @returns {orion.editor.ActionDescrition} the action description
		 */
		getActionDescription: function(actionID) {
			var action = this._actions[actionID];
			if (action) {
				return action.actionDescription;
			}
			return undefined;
		},
		/**
		 * Returns all action IDs defined in the text view.
		 * <p>
		 * There are two types of actions, the predefined actions of the view 
		 * and the actions added by application code.
		 * </p>
		 * <p>
		 * The predefined actions are:
		 * <ul>
		 *   <li>Navigation actions. These actions move the caret collapsing the selection.</li>
		 *     <ul>
		 *       <li>"lineUp" - moves the caret up by one line</li>
		 *       <li>"lineDown" - moves the caret down by one line</li>
		 *       <li>"lineStart" - moves the caret to beginning of the current line</li>
		 *       <li>"lineEnd" - moves the caret to end of the current line </li>
		 *       <li>"charPrevious" - moves the caret to the previous character</li>
		 *       <li>"charNext" - moves the caret to the next character</li>
		 *       <li>"pageUp" - moves the caret up by one page</li>
		 *       <li>"pageDown" - moves the caret down by one page</li>
		 *       <li>"wordPrevious" - moves the caret to the previous word</li>
		 *       <li>"wordNext" - moves the caret to the next word</li>
		 *       <li>"textStart" - moves the caret to the beginning of the document</li>
		 *       <li>"textEnd" - moves the caret to the end of the document</li>
		 *     </ul>
		 *   <li>Selection actions. These actions move the caret extending the selection.</li>
		 *     <ul>
		 *       <li>"selectLineUp" - moves the caret up by one line</li>
		 *       <li>"selectLineDown" - moves the caret down by one line</li>
		 *       <li>"selectLineStart" - moves the caret to beginning of the current line</li>
		 *       <li>"selectLineEnd" - moves the caret to end of the current line </li>
		 *       <li>"selectCharPrevious" - moves the caret to the previous character</li>
		 *       <li>"selectCharNext" - moves the caret to the next character</li>
		 *       <li>"selectPageUp" - moves the caret up by one page</li>
		 *       <li>"selectPageDown" - moves the caret down by one page</li>
		 *       <li>"selectWordPrevious" - moves the caret to the previous word</li>
		 *       <li>"selectWordNext" - moves the caret to the next word</li>
		 *       <li>"selectTextStart" - moves the caret to the beginning of the document</li>
		 *       <li>"selectTextEnd" - moves the caret to the end of the document</li>
		 *       <li>"selectAll" - selects the entire document</li>
		 *     </ul>
		 *   <li>Edit actions. These actions modify the text view text</li>
		 *     <ul>
		 *       <li>"deletePrevious" - deletes the character preceding the caret</li>
		 *       <li>"deleteNext" - deletes the charecter following the caret</li>
		 *       <li>"deleteWordPrevious" - deletes the word preceding the caret</li>
		 *       <li>"deleteWordNext" - deletes the word following the caret</li>
		 *       <li>"deleteLineStart" - deletes characteres to the beginning of the line</li>
		 *       <li>"deleteLineEnd" - deletes characteres to the end of the line</li>
		 *       <li>"tab" - inserts a tab character at the caret</li>
		 *       <li>"shiftTab" - noop</li>
		 *       <li>"enter" - inserts a line delimiter at the caret</li>
		 *       <li>"uppercase" - upper case the text at the caret</li>
		 *       <li>"lowercase" - lower case the text at the caret</li>
		 *       <li>"capitalize" - capitilize case the text at the caret</li>
		 *       <li>"reversecase" - reverse the case the text at the caret</li>
		 *     </ul>
		 *   <li>Clipboard actions. These actions modify the view text as well</li>
		 *     <ul>
		 *       <li>"copy" - copies the selected text to the clipboard</li>
		 *       <li>"cut" - copies the selected text to the clipboard and deletes the selection</li>
		 *       <li>"paste" - replaces the selected text with the clipboard contents</li>
		 *     </ul>
		 *   <li>Scrolling actions.</li>
		 *     <ul>
		 *       <li>"scrollLineUp" - scrolls the view up by one line</li>
		 *       <li>"scrollLineDown" - scrolls the view down by one line</li>
		 *       <li>"scrollPageUp" - scrolls the view up by one page</li>
		 *       <li>"scrollPageDown" - scrolls the view down by one page</li>
		 *       <li>"scrollTextStart" - scrolls the view to the beginning of the document</li>
		 *       <li>"scrollTextEnd" - scrolls the view to the end of the document</li>
		 *     </ul>
		 *   <li>Mode actions.</li>
		 *     <ul>
		 *       <li>"toggleTabMode" - toggles tab mode.</li>
		 *       <li>"toggleWrapMode" - toggles wrap mode.</li>
		 *       <li>"toggleOverwriteMode" - toggles overwrite mode.</li>
		 *     </ul>
		 * </ul>
		 * </p>
		 * 
		 * @param {Boolean} [defaultAction=false] whether or not the predefined actions are included.
		 * @returns {String[]} an array of action IDs defined in the text view.
		 *
		 * @see orion.editor.TextView#invokeAction
		 * @see orion.editor.TextView#setAction
		 * @see orion.editor.TextView#setKeyBinding
		 * @see orion.editor.TextView#getKeyBindings
		 */
		getActions: function (defaultAction) {
			var result = [];
			var actions = this._actions;
			for (var i in actions) {
				if (actions.hasOwnProperty(i)) {
					if (!defaultAction && actions[i].defaultHandler) { continue; }
					result.push(i);
				}
			}
			return result;
		},
		/**
		 * Returns the bottom index.
		 * <p>
		 * The bottom index is the line that is currently at the bottom of the view.  This
		 * line may be partially visible depending on the vertical scroll of the view. The parameter
		 * <code>fullyVisible</code> determines whether to return only fully visible lines. 
		 * </p>
		 *
		 * @param {Boolean} [fullyVisible=false] if <code>true</code>, returns the index of the last fully visible line. This
		 *    parameter is ignored if the view is not big enough to show one line.
		 * @returns {Number} the index of the bottom line.
		 *
		 * @see orion.editor.TextView#getTopIndex
		 * @see orion.editor.TextView#setTopIndex
		 */
		getBottomIndex: function(fullyVisible) {
			if (!this._clientDiv) { return 0; }
			return this._getBottomIndex(fullyVisible);
		},
		/**
		 * Returns the bottom pixel.
		 * <p>
		 * The bottom pixel is the pixel position that is currently at
		 * the bottom edge of the view.  This position is relative to the
		 * beginning of the document.
		 * </p>
		 *
		 * @returns {Number} the bottom pixel.
		 *
		 * @see orion.editor.TextView#getTopPixel
		 * @see orion.editor.TextView#setTopPixel
		 * @see orion.editor.TextView#convert
		 */
		getBottomPixel: function() {
			if (!this._clientDiv) { return 0; }
			return this._getScroll().y + this._getClientHeight();
		},
		/**
		 * Returns the caret offset relative to the start of the document.
		 *
		 * @returns {Number} the caret offset relative to the start of the document.
		 *
		 * @see orion.editor.TextView#setCaretOffset
		 * @see orion.editor.TextView#setSelection
		 * @see orion.editor.TextView#getSelection
		 */
		getCaretOffset: function () {
			var s = this._getSelection();
			return s.getCaret();
		},
		/**
		 * Returns the client area.
		 * <p>
		 * The client area is the portion in pixels of the document that is visible. The
		 * client area position is relative to the beginning of the document.
		 * </p>
		 *
		 * @returns {Object} the client area rectangle {x, y, width, height}.
		 *
		 * @see orion.editor.TextView#getTopPixel
		 * @see orion.editor.TextView#getBottomPixel
		 * @see orion.editor.TextView#getHorizontalPixel
		 * @see orion.editor.TextView#convert
		 */
		getClientArea: function() {
			if (!this._clientDiv) { return {x: 0, y: 0, width: 0, height: 0}; }
			var _scroll = this._getScroll();
			return {x: _scroll.x, y: _scroll.y, width: this._getClientWidth(), height: this._getClientHeight()};
		},
		/**
		 * Returns the horizontal pixel.
		 * <p>
		 * The horizontal pixel is the pixel position that is currently at
		 * the left edge of the view.  This position is relative to the
		 * beginning of the document.
		 * </p>
		 *
		 * @returns {Number} the horizontal pixel.
		 *
		 * @see orion.editor.TextView#setHorizontalPixel
		 * @see orion.editor.TextView#convert
		 */
		getHorizontalPixel: function() {
			if (!this._clientDiv) { return 0; }
			return this._getScroll().x;
		},
		/**
		 * Returns all the key bindings associated to the given action ID.
		 *
		 * @param {String} actionID the action ID.
		 * @returns {orion.KeyBinding[]} the array of key bindings associated to the given action ID.
		 *
		 * @see orion.editor.TextView#setKeyBinding
		 * @see orion.editor.TextView#setAction
		 */
		getKeyBindings: function (actionID) {
			var result = [];
			var keyModes = this._keyModes;
			for (var i = 0; i < keyModes.length; i++) {
				result = result.concat(keyModes[i].getKeyBindings(actionID));
			}
			return result;
		},
		/**
		 * Returns all the key modes added to text view.
		 *
		 * @returns {orion.editor.KeyMode[]} the array of key modes.
		 *
		 * @see orion.editor.TextView#addKeyMode
		 * @see orion.editor.TextView#removeKeyMode
		 */
		getKeyModes: function() {
			return this._keyModes.slice(0);
		},
		/**
		 * Returns the line height for a given line index.  Returns the default line
		 * height if the line index is not specified.
		 *
		 * @param {Number} [lineIndex] the line index.
		 * @returns {Number} the height of the line in pixels.
		 *
		 * @see orion.editor.TextView#getLinePixel
		 */
		getLineHeight: function(lineIndex) {
			if (!this._clientDiv) { return 0; }
			return this._getLineHeight(lineIndex);
		},
		/**
		 * Returns the line index for a given line pixel position relative to the document.
		 *
		 * @param {Number} [y] the line pixel.
		 * @returns {Number} the line index for the specified pixel position.
		 *
		 * @see orion.editor.TextView#getLinePixel
		 */
		getLineIndex: function(y) {
			if (!this._clientDiv) { return 0; }
			return this._getLineIndex(y);
		},
		/**
		 * @name isValidTextPosition
		 * @description Return whether the given x/y pixel position, relative to the document, is inside of document text. 
		 * 				This tests both whether the y position is below the text lines of the document as we as whether the
		 * 				x position is within the text of the line.
		 * @function
		 * @param x {Number} [x] the x pixel position
		 * @param y {Number} [y] the line pixel position
		 * @returns returns {Boolean} true if the pixel position is over text content
		 */
		isValidTextPosition: function(x, y){
			if (!this._clientDiv) { return false; }
			// Check if we are within a valid line
			var lineIndex = this._getLineIndex(y, true);
			if (lineIndex < 0){
				return false;
			}
			// Get the closest offset to the position
			var line = this._getLine(lineIndex);
			var offset = this.getOffsetAtLocation(x, y);
			// If the closest offset is to the left of the character's bounds then position is outside the text on the line
			var bounds = line.getBoundingClientRect(offset);
			line.destroy();
			if (x > bounds.right){
				return false;
			}
			return true;
		},
		/**
		 * Returns the top pixel position of a given line index relative to the beginning
		 * of the document.
		 * <p>
		 * Clamps out of range indices.
		 * </p>
		 *
		 * @param {Number} lineIndex the line index.
		 * @returns {Number} the pixel position of the line.
		 *
		 * @see orion.editor.TextView#setTopPixel
		 * @see orion.editor.TextView#getLineIndex
		 * @see orion.editor.TextView#convert
		 */
		getLinePixel: function(lineIndex) {
			if (!this._clientDiv) { return 0; }
			return this._getLinePixel(lineIndex);
		},
		/**
		 * Returns the {x, y} pixel location of the top-left corner of the character
		 * bounding box at the specified offset in the document.  The pixel location
		 * is relative to the document.
		 * <p>
		 * Clamps out of range offsets.
		 * </p>
		 *
		 * @param {Number} offset the character offset
		 * @returns {Object} the {x, y} pixel location of the given offset.
		 *
		 * @see orion.editor.TextView#getOffsetAtLocation
		 * @see orion.editor.TextView#convert
		 */
		getLocationAtOffset: function(offset) {
			if (!this._clientDiv) { return {x: 0, y: 0}; }
			var model = this._model;
			offset = Math.min(Math.max(0, offset), model.getCharCount());
			var lineIndex = model.getLineAtOffset(offset);
			var line = this._getLine(lineIndex);
			var rect = line.getBoundingClientRect(offset);
			line.destroy();
			var x = rect.left;
			var y = this._getLinePixel(lineIndex) + rect.top;
			return {x: x, y: y};
		},
		/**
		 * Returns the next character offset after the given offset and options
		 *
		 * @param {Number} offset the offset to start from
		 * @param {Object} options
		 *   { unit: the type of unit to advance to (eg "character", "word", "wordend", "wordWS", "wordendWS"),
		 *    count: the number of units to advance (negative to advance backwards) }
		 * @returns {Number} the next character offset
		 */
		getNextOffset: function(offset, options) {
			var selection = new Selection(offset, offset, false);
			this._doMove(options, selection);
			return selection.getCaret();
		},
		/**
		 * Returns the specified view options.
		 * <p>
		 * The returned value is either a <code>orion.editor.TextViewOptions</code> or an option value. An option value is returned when only one string parameter
		 * is specified. A <code>orion.editor.TextViewOptions</code> is returned when there are no paremeters, or the parameters are a list of options names or a
		 * <code>orion.editor.TextViewOptions</code>. All view options are returned when there no paremeters.
		 * </p>
		 *
		 * @param {String|orion.editor.TextViewOptions} [options] The options to return.
		 * @return {Object|orion.editor.TextViewOptions} The requested options or an option value.
		 *
		 * @see orion.editor.TextView#setOptions
		 */
		getOptions: function() {
			var options;
			if (arguments.length === 0) {
				options = this._defaultOptions();
			} else if (arguments.length === 1) {
				var arg = arguments[0];
				if (typeof arg === "string") { //$NON-NLS-1$
					return clone(this["_" + arg]); //$NON-NLS-1$
				}
				options = arg;
			} else {
				options = {};
				for (var index in arguments) {
					if (arguments.hasOwnProperty(index)) {
						options[arguments[index]] = undefined;
					}
				}
			}
			for (var option in options) {
				if (options.hasOwnProperty(option)) {
					options[option] = clone(this["_" + option]); //$NON-NLS-1$
				}
			}
			return options;
		},
		/**
		 * Returns the text model of the text view.
		 *
		 * @returns {orion.editor.TextModel} the text model of the view.
		 */
		getModel: function() {
			return this._model;
		},
		/**
		 * Returns the character offset nearest to the given pixel location.  The
		 * pixel location is relative to the document.
		 *
		 * @param x the x of the location
		 * @param y the y of the location
		 * @returns {Number} the character offset at the given location.
		 *
		 * @see orion.editor.TextView#getLocationAtOffset
		 */
		getOffsetAtLocation: function(x, y) {
			if (!this._clientDiv) { return 0; }
			var lineIndex = this._getLineIndex(y);
			var line = this._getLine(lineIndex);
			var offset = line.getOffset(x, y - this._getLinePixel(lineIndex));
			line.destroy();
			return offset;
		},
		/**
		 * @name getLineAtOffset
		 * @description Compute the editor line number for the given offset
		 * @function
		 * @public
		 * @memberof orion.editor.TextView
		 * @param {Number} offset The offset into the editor
		 * @returns {Number} Returns the line number in the editor corresponding to the given offset or <code>-1</code> if the offset is 
		 * out of range
		 * @since 5.0
		 */
		getLineAtOffset: function(offset) {
			return this.getModel().getLineAtOffset(offset);
		},
		/**
		 * @name getLineStart
		 * @description Compute the editor start offset of the given line number
		 * @function
		 * @public
		 * @memberof orion.editor.TextView
		 * @param {Number} line The line number in the editor
		 * @returns {Number} Returns the start offset of the given line number in the editor.
		 * @since 5.0
		 */
		getLineStart: function(line) {
			return this.getModel().getLineStart(line);
		},
		/**
		 * Get the view rulers.
		 *
		 * @returns {orion.editor.Ruler[]} the view rulers
		 *
		 * @see orion.editor.TextView#addRuler
		 */
		getRulers: function() {
			return this._rulers.slice(0);
		},
		/**
		 * Returns the text view selection.
		 * <p>
		 * The selection is defined by a start and end character offset relative to the
		 * document. The character at end offset is not included in the selection.
		 * </p>
		 * 
		 * @returns {orion.editor.Selection} the view selection
		 *
		 * @see orion.editor.TextView#setSelection
		 */
		getSelection: function () {
			return this._getSelection();
		},
		getSelections: function () {
			return this._getSelections();
		},
		/**
		 * Returns the text view selection text.
		 * <p>
		 * If there are multiple selection ranges, the result is concatenated with the specified delimiter.
		 * </p>
		 * 
		 * @param {String} delimiter The offset into the editor
		 * @returns {String} the view selection text
		 * @since 10.0
		 * @see orion.editor.TextView#setSelection
		 */
		getSelectionText: function(delimiter) {
			var text = [];
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (!selection.isEmpty()) {
					text.push(that._getBaseText(selection.start, selection.end));
				}
			});
			return text.join(delimiter !== undefined ? delimiter : this._model.getLineDelimiter());
		},
		/**
		 * Returns the text for the given range.
		 * <p>
		 * The text does not include the character at the end offset.
		 * </p>
		 *
		 * @param {Number} [start=0] the start offset of text range.
		 * @param {Number} [end=char count] the end offset of text range.
		 *
		 * @see orion.editor.TextView#setText 	
		 */
		getText: function(start, end) {
			var model = this._model;
			return model.getText(start, end);
		},
		/**
		 * Returns the top index.
		 * <p>
		 * The top index is the line that is currently at the top of the view.  This
		 * line may be partially visible depending on the vertical scroll of the view. The parameter
		 * <code>fullyVisible</code> determines whether to return only fully visible lines. 
		 * </p>
		 *
		 * @param {Boolean} [fullyVisible=false] if <code>true</code>, returns the index of the first fully visible line. This
		 *    parameter is ignored if the view is not big enough to show one line.
		 * @returns {Number} the index of the top line.
		 *
		 * @see orion.editor.TextView#getBottomIndex
		 * @see orion.editor.TextView#setTopIndex
		 */
		getTopIndex: function(fullyVisible) {
			if (!this._clientDiv) { return 0; }
			return this._getTopIndex(fullyVisible);
		},
		/**
		 * Returns the top pixel.
		 * <p>
		 * The top pixel is the pixel position that is currently at
		 * the top edge of the view.  This position is relative to the
		 * beginning of the document.
		 * </p>
		 *
		 * @returns {Number} the top pixel.
		 *
		 * @see orion.editor.TextView#getBottomPixel
		 * @see orion.editor.TextView#setTopPixel
		 * @see orion.editor.TextView#convert
		 */
		getTopPixel: function() {
			if (!this._clientDiv) { return 0; }
			return this._getScroll().y;
		},
		/**
		 * Executes the action handler associated with the given action ID.
		 * <p>
		 * The application defined action takes precedence over predefined actions unless
		 * the <code>defaultAction</code> paramater is <code>true</code>.
		 * </p>
		 * <p>
		 * If the application defined action returns <code>false</code>, the text view predefined
		 * action is executed if present.
		 * </p>
		 *
		 * @param {String} actionID the action ID.
		 * @param {Boolean} [defaultAction] whether to always execute the predefined action only.
		 * @param {Object} [actionOptions] action specific options to be passed to the action handlers.
		 * @returns {Boolean} <code>true</code> if the action was executed.
		 *
		 * @see orion.editor.TextView#setAction
		 * @see orion.editor.TextView#getActions
		 */
		invokeAction: function (actionID, defaultAction, actionOptions) {
			if (!this._clientDiv) { return; }
			var action = this._actions[actionID];
			if (action) {
				if (action.actionDescription && action.actionDescription.id) {
					mMetrics.logEvent("editor", "action", action.actionDescription.id); //$NON-NLS-1$ //$NON-NLS-2$
				}
				if (!defaultAction && action.handler) {
					if (action.handler(actionOptions)) {
						return true;
					}
				}
				if (action.defaultHandler) {
					return typeof action.defaultHandler(actionOptions) === "boolean"; //$NON-NLS-1$
				}
			}
			return false;
		},
		/**
		* Returns if the view is destroyed.
		* @returns {Boolean} <code>true</code> if the view is destroyed.
		*/
		isDestroyed: function () {
			return !this._clientDiv;
		},
		/** 
		 * @class This is the event sent when the user right clicks or otherwise invokes the context menu of the view. 
		 * <p> 
		 * <b>See:</b><br/> 
		 * {@link orion.editor.TextView}<br/> 
		 * {@link orion.editor.TextView#event:onContextMenu} 
		 * </p> 
		 * 
		 * @name orion.editor.ContextMenuEvent 
		 * 
		 * @property {Number} x The pointer location on the x axis, relative to the document the user is editing. 
		 * @property {Number} y The pointer location on the y axis, relative to the document the user is editing. 
		 * @property {Number} screenX The pointer location on the x axis, relative to the screen. This is copied from the DOM contextmenu event.screenX property. 
		 * @property {Number} screenY The pointer location on the y axis, relative to the screen. This is copied from the DOM contextmenu event.screenY property. 
		 * @property {Boolean} defaultPrevented Determines whether the user agent context menu should be shown. It is shown by default.
		 * @property {Function} preventDefault If called prevents the user agent context menu from showing.
		 */ 
		/** 
		 * This event is sent when the user invokes the view context menu. 
		 * 
		 * @event 
		 * @param {orion.editor.ContextMenuEvent} contextMenuEvent the event 
		 */ 
		onContextMenu: function(contextMenuEvent) {
			return this.dispatchEvent(contextMenuEvent); 
		}, 
		onDragStart: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDrag: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDragEnd: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDragEnter: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDragOver: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDragLeave: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		onDrop: function(dragEvent) {
			return this.dispatchEvent(dragEvent);
		},
		/**
		 * @class This is the event sent when the text view is destroyed.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onDestroy}
		 * </p>
		 * @name orion.editor.DestroyEvent
		 */
		/**
		 * This event is sent when the text view has been destroyed.
		 *
		 * @event
		 * @param {orion.editor.DestroyEvent} destroyEvent the event
		 *
		 * @see orion.editor.TextView#destroy
		 */
		onDestroy: function(destroyEvent) {
			return this.dispatchEvent(destroyEvent);
		},
		/**
		 * @description This event is sent when the file is being saved
		 * @function
		 * @param {Object} savingEvent the event
		 * @since 8.0
		 */
		onSaving: function onSaving(savingEvent) {
		    return this.dispatchEvent(savingEvent);
		},
		/**
		 * @description This event is sent when the file has been saved
		 * @function
		 * @param {Object} inputChangedEvent the event
		 * @since 8.0
		 */
		onInputChanged: function onInputChanged(inputChangedEvent) {
		    return this.dispatchEvent(inputChangedEvent);
		},
		/**
		 * @class This object is used to define style information for the text view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onLineStyle}
		 * </p>		 
		 * @name orion.editor.Style
		 * 
		 * @property {String} styleClass A CSS class name.
		 * @property {Object} style An object with CSS properties.
		 * @property {String} tagName A DOM tag name.
		 * @property {Object} attributes An object with DOM attributes.
		 */
		/**
		 * @class This object is used to style range.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onLineStyle}
		 * </p>		 
		 * @name orion.editor.StyleRange
		 * 
		 * @property {Number} start The start character offset, relative to the document, where the style should be applied.
		 * @property {Number} end The end character offset (exclusive), relative to the document, where the style should be applied.
		 * @property {orion.editor.Style} style The style for the range.
		 */
		/**
		 * @class This is the event sent when the text view needs the style information for a line.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onLineStyle}
		 * </p>		 
		 * @name orion.editor.LineStyleEvent
		 * 
		 * @property {orion.editor.TextView} textView The text view.		 
		 * @property {Number} lineIndex The line index.
		 * @property {String} lineText The line text.
		 * @property {Number} lineStart The character offset, relative to document, of the first character in the line.
		 * @property {orion.editor.Style} style The style for the entire line (output argument).
		 * @property {orion.editor.StyleRange[]} ranges An array of style ranges for the line (output argument).		 
		 */
		/**
		 * This event is sent when the text view needs the style information for a line.
		 *
		 * @event
		 * @param {orion.editor.LineStyleEvent} lineStyleEvent the event
		 */
		onLineStyle: function(lineStyleEvent) {
			return this.dispatchEvent(lineStyleEvent);
		},
		/**
		 * @class This is the event sent for all keyboard events.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onKeyDown}<br/>
		 * {@link orion.editor.TextView#event:onKeyPress}<br/>
		 * {@link orion.editor.TextView#event:onKeyUp}<br/>
		 * </p>
		 * @name orion.editor.KeyEvent
		 * 
		 * @property {String} type The type of event.
		 * @property {DOMEvent} event The key DOM event.
		 * @property {Boolean} defaultPrevented Determines whether the user agent context menu should be shown. It is shown by default.
		 * @property {Function} preventDefault If called prevents the user agent context menu from showing.
		 */
		/**
		 * This event is sent for key down events.
		 *
		 * @event
		 * @param {orion.editor.KeyEvent} keyEvent the event
		 */
		onKeyDown: function(keyEvent) {
			return this.dispatchEvent(keyEvent);
		},
		/**
		 * This event is sent for key press events. Key press events are only sent
		 * for printable characters.
		 *
		 * @event
		 * @param {orion.editor.KeyEvent} keyEvent the event
		 */
		onKeyPress: function(keyEvent) {
			return this.dispatchEvent(keyEvent);
		},
		/**
		 * This event is sent for key up events.
		 *
		 * @event
		 * @param {orion.editor.KeyEvent} keyEvent the event
		 */
		onKeyUp: function(keyEvent) {
			return this.dispatchEvent(keyEvent);
		},
		/**
		 * @class This is the event sent when the text in the model has changed.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onModelChanged}<br/>
		 * {@link orion.editor.TextModel#onChanged}
		 * </p>
		 * @name orion.editor.ModelChangedEvent
		 * 
		 * @property {Number} start The character offset in the model where the change has occurred.
		 * @property {Number} removedCharCount The number of characters removed from the model.
		 * @property {Number} addedCharCount The number of characters added to the model.
		 * @property {Number} removedLineCount The number of lines removed from the model.
		 * @property {Number} addedLineCount The number of lines added to the model.
		 */
		/**
		 * This event is sent when the text in the model has changed.
		 *
		 * @event
		 * @param {orion.editor.ModelChangedEvent} modelChangedEvent the event
		 */
		onModelChanged: function(modelChangedEvent) {
			return this.dispatchEvent(modelChangedEvent);
		},
		/**
		 * @class This is the event sent when the text in the model is about to change.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onModelChanging}<br/>
		 * {@link orion.editor.TextModel#onChanging}
		 * </p>
		 * @name orion.editor.ModelChangingEvent
		 * 
		 * @property {String} text The text that is about to be inserted in the model.
		 * @property {Number} start The character offset in the model where the change will occur.
		 * @property {Number} removedCharCount The number of characters being removed from the model.
		 * @property {Number} addedCharCount The number of characters being added to the model.
		 * @property {Number} removedLineCount The number of lines being removed from the model.
		 * @property {Number} addedLineCount The number of lines being added to the model.
		 */
		/**
		 * This event is sent when the text in the model is about to change.
		 *
		 * @event
		 * @param {orion.editor.ModelChangingEvent} modelChangingEvent the event
		 */
		onModelChanging: function(modelChangingEvent) {
			return this.dispatchEvent(modelChangingEvent);
		},
		/**
		 * @class This is the event sent when the text is modified by the text view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onModify}
		 * </p>
		 * @name orion.editor.ModifyEvent
		 */
		/**
		 * This event is sent when the text view has changed text in the model.
		 * <p>
		 * If the text is changed directly through the model API, this event
		 * is not sent.
		 * </p>
		 *
		 * @event
		 * @param {orion.editor.ModifyEvent} modifyEvent the event
		 */
		onModify: function(modifyEvent) {
			return this.dispatchEvent(modifyEvent);
		},
		onMouseDown: function(mouseEvent) {
			return this.dispatchEvent(mouseEvent);
		},
		onMouseUp: function(mouseEvent) {
			return this.dispatchEvent(mouseEvent);
		},
		onMouseMove: function(mouseEvent) {
			return this.dispatchEvent(mouseEvent);
		},
		onMouseOver: function(mouseEvent) {
			return this.dispatchEvent(mouseEvent);
		},
		onMouseOut: function(mouseEvent) {
			return this.dispatchEvent(mouseEvent);
		},
		onTouchStart: function(touchEvent) {
			return this.dispatchEvent(touchEvent);
		},
		onTouchMove: function(touchEvent) {
			return this.dispatchEvent(touchEvent);
		},
		onTouchEnd: function(touchEvent) {
			return this.dispatchEvent(touchEvent);
		},
		onOptions: function(optionsEvent) {
			return this.dispatchEvent(optionsEvent);
		},
		/**
		 * @class This is the event sent when the selection changes in the text view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onSelection}
		 * </p>		 
		 * @name orion.editor.SelectionEvent
		 * 
		 * @property {orion.editor.Selection} oldValue The old selection.
		 * @property {orion.editor.Selection} newValue The new selection.
		 */
		/**
		 * This event is sent when the text view selection has changed.
		 *
		 * @event
		 * @param {orion.editor.SelectionEvent} selectionEvent the event
		 */
		onSelection: function(selectionEvent) {
			return this.dispatchEvent(selectionEvent);
		},
		/**
		 * @class This is the event sent when the text view scrolls.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onScroll}
		 * </p>		 
		 * @name orion.editor.ScrollEvent
		 * 
		 * @property {Object} oldValue The old scroll {x,y}.
		 * @property {Object} newValue The new scroll {x,y}.
		 */
		/**
		 * This event is sent when the text view scrolls vertically or horizontally.
		 *
		 * @event
		 * @param {orion.editor.ScrollEvent} scrollEvent the event
		 */
		onScroll: function(scrollEvent) {
			return this.dispatchEvent(scrollEvent);
		},
		/**
		 * @class This is the event sent when the text is about to be modified by the text view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onVerify}
		 * </p>
		 * @name orion.editor.VerifyEvent
		 * 
		 * @property {String} text The text being inserted.
		 * @property {Number} start The start offset of the text range to be replaced.
		 * @property {Number} end The end offset (exclusive) of the text range to be replaced.
		 */
		/**
		 * This event is sent when the text view is about to change text in the model.
		 * <p>
		 * If the text is changed directly through the model API, this event
		 * is not sent.
		 * </p>
		 * <p>
		 * Listeners are allowed to change these parameters. Setting text to null
		 * or undefined stops the change.
		 * </p>
		 *
		 * @event
		 * @param {orion.editor.VerifyEvent} verifyEvent the event
		 */
		onVerify: function(verifyEvent) {
			return this.dispatchEvent(verifyEvent);
		},
		/**
		 * @class This is the event sent when the text view is focused.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onFocus}<br/>
		 * </p>
		 * @name orion.editor.FocusEvent
		 */
		/**
		 * This event is sent when the text view is focused.
		 *
		 * @event
		 * @param {orion.editor.FocusEvent} focusEvent the event
		 */
		onFocus: function(focusEvent) {
			return this.dispatchEvent(focusEvent);
		},
		/**
		 * @class This is the event sent when the text view goes out of focus.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#event:onBlur}<br/>
		 * </p>
		 * @name orion.editor.BlurEvent
		 */
		/**
		 * This event is sent when the text view goes out of focus.
		 *
		 * @event
		 * @param {orion.editor.BlurEvent} blurEvent the event
		 */
		onBlur: function(blurEvent) {
			return this.dispatchEvent(blurEvent);
		},
		/**
		 * Replaces the selection with the text on the clipboard or, if there is no selection, inserts the text at the current caret offset.
		 * <p>
		 * If the single mode is on and the clipboard text contains more than one line, all lines will be concatenated.
		 * </p>
		 * @returns {Boolean} <code>true</code> if the operation succeded.
		 * @since 10.0
		 */
		paste: function() {
			if (!this._clientDiv) { return false; }
			return this._doPaste();
		},
		/**
		 * Redraws the entire view, including rulers.
		 *
		 * @see orion.editor.TextView#redrawLines
		 * @see orion.editor.TextView#redrawRange
		 * @see orion.editor.TextView#setRedraw
		 */
		redraw: function() {
			if (this._redrawCount > 0) { return; }
			var lineCount = this._model.getLineCount();
			this.redrawRulers(0, lineCount);
			this.redrawLines(0, lineCount); 
		},
		redrawRulers: function(startLine, endLine) {
			if (this._redrawCount > 0) { return; }
			var rulers = this.getRulers();
			for (var i = 0; i < rulers.length; i++) {
				this.redrawLines(startLine, endLine, rulers[i]);
			}
		},
		/**
		 * Redraws the text in the given line range.
		 * <p>
		 * The line at the end index is not redrawn.
		 * </p>
		 *
		 * @param {Number} [startLine=0] the start line
		 * @param {Number} [endLine=line count] the end line
		 *
		 * @see orion.editor.TextView#redraw
		 * @see orion.editor.TextView#redrawRange
		 * @see orion.editor.TextView#setRedraw
		 */
		redrawLines: function(startLine, endLine, ruler) {
			if (this._redrawCount > 0) { return; }
			if (startLine === undefined) { startLine = 0; }
			if (endLine === undefined) { endLine = this._model.getLineCount(); }
			if (startLine === endLine) { return; }
			var div = this._clientDiv;
			if (!div) { return; }
			if (ruler) {
				var divRuler = this._getRulerParent(ruler);
				div = divRuler.firstChild;
				while (div) {
					if (div._ruler === ruler) {
						break;
					}
					div = div.nextSibling;
				}
			}
			if (ruler) {
				div.rulerChanged = true;
			} else {
				if (this._lineHeight) {
					this._resetLineHeight(startLine, endLine);
				}
			}
			var imeLineIndex = -1;
			if (!ruler && this._imeOffset !== -1) {
				imeLineIndex = this._model.getLineAtOffset(this._imeOffset);
			}
			if (!ruler || ruler.getOverview() === "page") { //$NON-NLS-1$
				var child = div.firstChild;
				while (child) {
					var lineIndex = child.lineIndex;
					if (startLine <= lineIndex && lineIndex < endLine && lineIndex !== imeLineIndex) {
						child.lineChanged = true;
					}
					child = child.nextSibling;
				}
			}
			if (!ruler) {
				if (!this._wrapMode) {
					if (startLine <= this._maxLineIndex && this._maxLineIndex < endLine) {
						this._checkMaxLineIndex = this._maxLineIndex;
						this._maxLineIndex = -1;
						this._maxLineWidth = 0;
					}
				}
			}
			this.dispatchEvent({type: "Redraw", startLine: startLine, endLine: endLine, ruler: ruler}); //$NON-NLS-1$
			this._queueUpdate();
		},
		/**
		 * Redraws the text in the given range.
		 * <p>
		 * The character at the end offset is not redrawn.
		 * </p>
		 *
		 * @param {Number} [start=0] the start offset of text range
		 * @param {Number} [end=char count] the end offset of text range
		 *
		 * @see orion.editor.TextView#redraw
		 * @see orion.editor.TextView#redrawLines
		 * @see orion.editor.TextView#setRedraw
		 */
		redrawRange: function(start, end) {
			if (this._redrawCount > 0) { return; }
			var model = this._model;
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = model.getCharCount(); }
			var startLine = model.getLineAtOffset(start);
			var endLine = model.getLineAtOffset(Math.max(start, end - 1)) + 1;
			this.redrawLines(startLine, endLine);
		},	
		/**
		 * Removes a key mode from the text view.
		 *
		 * @param {orion.editor.KeyMode} mode the key mode.
		 */
		removeKeyMode: function (mode) {
			var keyModes = this._keyModes;
			for (var i=0; i<keyModes.length; i++) {
				if (keyModes[i] === mode) {
					keyModes.splice(i, 1);
					break;
				}
			}
			//TODO: API needed for this
			if (mode._modeRemoved) {
				mode._modeRemoved();
			}
		},
		/**
		 * Removes a ruler from the text view.
		 *
		 * @param {orion.editor.Ruler} ruler the ruler.
		 */
		removeRuler: function (ruler) {
			var rulers = this._rulers;
			for (var i=0; i<rulers.length; i++) {
				if (rulers[i] === ruler) {
					rulers.splice(i, 1);
					ruler.setView(null);
					this._destroyRuler(ruler);
					this._update();
					break;
				}
			}
		},
		resize: function() {
			if (!this._clientDiv) { return; }
			this._handleResize(null);
		},
		/**
		 * @class This object describes an action for the text view.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView}<br/>
		 * {@link orion.editor.TextView#setAction}
		 * </p>		 
		 * @name orion.editor.ActionDescription
		 *
		 * @property {String} [name] the name to be used when showing the action as text.
		 */
		/**
		 * Associates an application defined handler to an action ID.
		 * <p>
		 * If the action ID is a predefined action, the given handler executes before
		 * the default action handler.  If the given handler returns <code>true</code>, the
		 * default action handler is not called.
		 * </p>
		 *
		 * @param {String} actionID the action ID.
		 * @param {Function} handler the action handler.
		 * @param {orion.editor.ActionDescription} [actionDescription=undefined] the action description.
		 *
		 * @see orion.editor.TextView#getActions
		 * @see orion.editor.TextView#invokeAction
		 */
		setAction: function(actionID, handler, actionDescription) {
			if (!actionID) { return; }
			var actions = this._actions;
			var action = actions[actionID];
			if (!action) { 
				action = actions[actionID] = {};
			}
			action.handler = handler;
			if (actionDescription !== undefined) {
				action.actionDescription = actionDescription;
			}
		},
		/**
		 * Associates a key binding with the given action ID. Any previous
		 * association with the specified key binding is overwriten. If the
		 * action ID is <code>null</code>, the association is removed.
		 * 
		 * @param {orion.KeyBinding} keyBinding the key binding
		 * @param {String} actionID the action ID
		 */
		setKeyBinding: function(keyBinding, actionID) {
			this._keyModes[0].setKeyBinding(keyBinding, actionID);
		},
		/**
		 * Sets the caret offset relative to the start of the document.
		 *
		 * @param {Number} caret the caret offset relative to the start of the document.
		 * @param {Boolean|Number|orion.editor.TextViewShowOptions} [show=true]
		 * 					if <code>true</code>, the view will scroll the minimum amount necessary to show the caret location. If
		 *					<code>show</code> is a <code>Number</code>, the view will scroll the minimum amount necessary to show the caret location plus a
		 *					percentage of the client area height. The parameter is clamped to the [0,1] range.  In either case, the view will only scroll
		 *					if the new caret location is not visible already.  The <code>show</code> parameter can also be a <code>orion.editor.TextViewShowOptions</code> object. See
		 * 					{@link orion.editor.TextViewShowOptions} for further information in how the options can be used to control the scrolling behavior.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @see orion.editor.TextView#getCaretOffset
		 * @see orion.editor.TextView#setSelection
		 * @see orion.editor.TextView#getSelection
		 */
		setCaretOffset: function(offset, show, callback) {
			var charCount = this._model.getCharCount();
			offset = Math.max(0, Math.min (offset, charCount));
			var selection = new Selection(offset, offset, false);
			this._setSelection (selection, show === undefined || show, true, callback);
		},
		/**
		 * Sets the horizontal pixel.
		 * <p>
		 * The horizontal pixel is the pixel position that is currently at
		 * the left edge of the view.  This position is relative to the
		 * beginning of the document.
		 * </p>
		 *
		 * @param {Number} pixel the horizontal pixel.
		 *
		 * @see orion.editor.TextView#getHorizontalPixel
		 * @see orion.editor.TextView#convert
		 */
		setHorizontalPixel: function(pixel) {
			if (!this._clientDiv) { return; }
			pixel = Math.max(0, pixel);
			this._scrollView(pixel - this._getScroll().x, 0);
		},
		/**
		 * Sets whether the view should update the DOM.
		 * <p>
		 * This can be used to improve the performance.
		 * </p><p>
		 * When the flag is set to <code>true</code>,
		 * the entire view is marked as needing to be redrawn. 
		 * Nested calls to this method are stacked.
		 * </p>
		 *
		 * @param {Boolean} redraw the new redraw state
		 * 
		 * @see orion.editor.TextView#redraw
		 */
		setRedraw: function(redraw) {
			if (redraw) {
				if (--this._redrawCount === 0) {
					this.redraw();
				}
			} else {
				this._redrawCount++;
			}
		},
		/**
		 * Sets the text model of the text view.
		 *
		 * @param {orion.editor.TextModel} model the text model of the view.
		 */
		setModel: function(model) {
			if (model === this._model) { return; }
			model = model || new mTextModel.TextModel();
			this._model.removeEventListener("preChanging", this._modelListener.onChanging); //$NON-NLS-1$
			this._model.removeEventListener("postChanged", this._modelListener.onChanged); //$NON-NLS-1$
			var oldLineCount = this._model.getLineCount();
			var oldCharCount = this._model.getCharCount();
			var newLineCount = model.getLineCount();
			var newCharCount = model.getCharCount();
			var newText = model.getText();
			var e = {
				type: "ModelChanging", //$NON-NLS-1$
				text: newText,
				start: 0,
				removedCharCount: oldCharCount,
				addedCharCount: newCharCount,
				removedLineCount: oldLineCount,
				addedLineCount: newLineCount
			};
			this.onModelChanging(e);
			this._model = model;
			e = {
				type: "ModelChanged", //$NON-NLS-1$
				start: 0,
				removedCharCount: oldCharCount,
				addedCharCount: newCharCount,
				removedLineCount: oldLineCount,
				addedLineCount: newLineCount
			};
			this.onModelChanged(e); 
			this._model.addEventListener("preChanging", this._modelListener.onChanging); //$NON-NLS-1$
			this._model.addEventListener("postChanged", this._modelListener.onChanged); //$NON-NLS-1$
			this._reset();
			this._update();
		},
		/**
		 * Sets the view options for the view.
		 *
		 * @param {orion.editor.TextViewOptions} options the view options.
		 * 
		 * @see orion.editor.TextView#getOptions
		 */
		setOptions: function (options) {
			var defaultOptions = this._defaultOptions();
			for (var option in options) {
				if (options.hasOwnProperty(option)) {
					var newValue = options[option], oldValue = this["_" + option]; //$NON-NLS-1$
					if (compare(oldValue, newValue)) { continue; }
					var update = defaultOptions[option] ? defaultOptions[option].update : null;
					if (update) {
						update.call(this, newValue);
						continue;
					}
					this["_" + option] = clone(newValue); //$NON-NLS-1$
				}
			}
			this.onOptions({type: "Options", options: options}); //$NON-NLS-1$
		},
		/**
		 * @class This object describes the selection show options.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextView#setSelection}
		 * {@link orion.editor.TextView#setCaretOffset}	 
		 * {@link orion.editor.TextView#showSelection}	 
		 * </p>		 
		 * @name orion.editor.TextViewShowOptions
		 *
		 * @property {String} viewAnchor the view anchor.  The view anchor can be one of these values:
		 * <p>
		 * <ul>
		 *   <li>"top" - align the selection to the top of the view client area.</li>
		 *   <li>"bottom" - align the selection to the bottom of the view client area.</li>
		 *   <li>"center" - align the selection to the center of the view client area.</li>
		 *   <li> by default - align the selection to the top or bottom of the client area depending on whether the caret is above or below the client area respectively. </li>
		 * </ul>
		 * </p>
		 * @property {Number} [viewAnchorOffset=0] an offset from the view anchor. The offset is a percentage of the client area height and it is clamped to [0-1] range.
		 * @property {String} [selectionAnchor=caret] the selection anchor. The seleciton anchor can be one of these values:
		 * <p>
		 * <ul>
		 *   <li>"top" - align the top of the selection to the view anchor.</li>
		 *   <li>"bottom" - align the bottom of the selection to the view anchor.</li>
		 *   <li>"center" - align the center of the selection to the view anchor.</li>
		 *   <li> by default - align the top or bottom of the selection to the view anchor depending on whether the caret is at the start or end of the selection. </li>
		 * </ul>
		 * </p>
		 * @property {String} [scrollPolicy] the scroll policy. The scroll policy can be one of these values:
		 * <p>
		 * <ul>
		 *   <li>"always" - always scroll vertically to the desired pixel offset even if the caret is already visible.</li>
		 *   <li> by default - only scroll if the caret is not visible. </li>
		 * </ul>
		 * </p>
		 */
		/**
		 * Sets the text view selection.
		 * <p>
		 * The selection is defined by a start and end character offset relative to the
		 * document. The character at end offset is not included in the selection.
		 * </p>
		 * <p>
		 * The caret is always placed at the end offset. The start offset can be
		 * greater than the end offset to place the caret at the beginning of the
		 * selection.
		 * </p>
		 * <p>
		 * Clamps out of range offsets.
		 * </p>
		 * 
		 * @param {Number} start the start offset of the selection
		 * @param {Number} end the end offset of the selection
		 * @param {Boolean|Number|orion.editor.TextViewShowOptions} [show=true]
		 * 					if <code>true</code>, the view will scroll the minimum amount necessary to show the caret location. If
		 *					<code>show</code> is a <code>Number</code>, the view will scroll the minimum amount necessary to show the caret location plus a
		 *					percentage of the client area height. The parameter is clamped to the [0,1] range.  In either case, the view will only scroll
		 *					if the new caret location is not visible already.  The <code>show</code> parameter can also be a <code>orion.editor.TextViewShowOptions</code> object. See
		 * 					{@link orion.editor.TextViewShowOptions} for further information in how the options can be used to control the scrolling behavior.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @see orion.editor.TextView#getSelection
		 */
		setSelection: function (start, end, show, callback) {
			var caret = start > end;
			if (caret) {
				var tmp = start;
				start = end;
				end = tmp;
			}
			var charCount = this._model.getCharCount();
			start = Math.max(0, Math.min (start, charCount));
			end = Math.max(0, Math.min (end, charCount));
			var selection = new Selection(start, end, caret);
			this._setSelection(selection, show === undefined || show, true, callback);
		},
		setSelections: function (ranges, show, callback) {
			var selections = this._rangesToSelections(ranges);
			this._setSelection(selections, show === undefined || show, true, callback);
		},
		/**
		 * Replaces the text in the given range with the given text.
		 * <p>
		 * The character at the end offset is not replaced.
		 * </p>
		 * <p>
		 * When both <code>start</code> and <code>end</code> parameters
		 * are not specified, the text view places the caret at the beginning
		 * of the document and scrolls to make it visible.
		 * </p>
		 *
		 * @param {String} text the new text.
		 * @param {Number} [start=0] the start offset of text range.
		 * @param {Number} [end=char count] the end offset of text range.
		 * @param {Boolean|Number|orion.editor.TextViewShowOptions} [show=true]
		 * 					if <code>true</code>, the view will scroll the minimum amount necessary to show the caret location. If
		 *					<code>show</code> is a <code>Number</code>, the view will scroll the minimum amount necessary to show the caret location plus a
		 *					percentage of the client area height. The parameter is clamped to the [0,1] range.  In either case, the view will only scroll
		 *					if the new caret location is not visible already.  The <code>show</code> parameter can also be a <code>orion.editor.TextViewShowOptions</code> object. See
		 * 					{@link orion.editor.TextViewShowOptions} for further information in how the options can be used to control the scrolling behavior.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @see orion.editor.TextView#getText
		 */
		setText: function (text, start, end, show, callback) {
			var isSingle = typeof text === "string"; //$NON-NLS-1$
			var reset = start === undefined && end === undefined && isSingle;
			var edit;
			if (isSingle) {
				if (start === undefined) { start = 0; }
				if (end === undefined) { end = this._model.getCharCount(); }
				edit = {text: text, selection: [new Selection(start, end, false)]};
			} else {
				edit = text;
				edit.selection = this._rangesToSelections(edit.selection);
			}
			edit._code = true;
			if (reset) {
				this._variableLineHeight = false;
			}
			this._modifyContent(edit, !reset, show === undefined || show, callback);
			if (reset) {
				/*
				* Bug in Firefox.  For some reason, the caret does not show after the
				* view is refreshed.  The fix is to toggle the contentEditable state and
				* force the clientDiv to loose and receive focus if it is focused.
				*/
				if (util.isFirefox < 13) {
					this._fixCaret();
				}
			}
		},
		/**
		 * Sets the top index.
		 * <p>
		 * The top index is the line that is currently at the top of the text view.  This
		 * line may be partially visible depending on the vertical scroll of the view.
		 * </p>
		 *
		 * @param {Number} topIndex the index of the top line.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @see orion.editor.TextView#getBottomIndex
		 * @see orion.editor.TextView#getTopIndex
		 */
		setTopIndex: function(topIndex, callback) {
			if (!this._clientDiv) { return; }
			this._scrollViewAnimated(0, this._getLinePixel(Math.max(0, topIndex)) - this._getScroll().y, callback);
		},
		/**
		 * Sets the top pixel.
		 * <p>
		 * The top pixel is the pixel position that is currently at
		 * the top edge of the view.  This position is relative to the
		 * beginning of the document.
		 * </p>
		 *
		 * @param {Number} pixel the top pixel.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @see orion.editor.TextView#getBottomPixel
		 * @see orion.editor.TextView#getTopPixel
		 * @see orion.editor.TextView#convert
		 */
		setTopPixel: function(pixel, callback) {
			if (!this._clientDiv) { return; }
			this._scrollViewAnimated(0, Math.max(0, pixel) - this._getScroll().y, callback);
		},
		/**
		 * Scrolls the selection into view if needed.
		 *
 		 * @param {Number|orion.editor.TextViewShowOptions} [show=0]
		 * 					If <code>show</code> is a <code>Number</code>, the view will scroll the minimum amount necessary to show the caret location plus a
		 *					percentage of the client area height. The parameter is clamped to the [0,1] range.  The view will only scroll
		 *					if the new caret location is not visible already.  The <code>show</code> parameter can also be a <code>orion.editor.TextViewShowOptions</code> object. See
		 * 					{@link orion.editor.TextViewShowOptions} for further information in how the options can be used to control the scrolling behavior.
		 * @param {Function} [callback] if callback is specified and <code>scrollAnimation</code> is not zero, view scrolling is animated and
		 *					the callback is called when the animation is done. Otherwise, callback is callback right away.
		 *
		 * @returns {Boolean} true if the view was scrolled.
		 *
		 * @see orion.editor.TextView#getSelection
		 * @see orion.editor.TextView#setSelection
		 * @see orion.editor.TextView#setCaretOffset
		 */
		showSelection: function(show, callback) {
			return this._showCaret(show ? false : true, callback, show);
		},
		update: function(styleChanged, sync) {
			if (!this._clientDiv) { return; }
			if (styleChanged || this._metrics.invalid) {
				this._updateStyle();
			}
			if (sync === undefined || sync) {
				this._update();
			} else {
				this._queueUpdate();
			}
		},
		
		/**************************************** Event handlers *********************************/
		_handleRootMouseDown: function (e) {
			this._cancelCheckSelection();
			if (this._ignoreEvent(e)) { return; }
			if (util.isFirefox < 13 && e.which === 1) {
				this._clientDiv.contentEditable = false;
				(this._overlayDiv || this._clientDiv).draggable = true;
				this._ignoreBlur = true;
			}
			
			/* Prevent clicks outside of the client div from taking focus away. */
			var topNode = this._overlayDiv || this._clientDiv;
			/* Use view div on IE 8 otherwise it is not possible to scroll. */
			if (util.isIE < 9) { topNode = this._viewDiv; }
			var temp = e.target ? e.target : e.srcElement;
			while (temp) {
				if (topNode === temp) {
					return;
				}
				if (temp.className && temp.className.indexOf("textViewFind") !== -1) { //$NON-NLS-1$
					return;
				}
				temp = temp.parentNode;
			}
			if (e.preventDefault) { e.preventDefault(); }
			if (e.stopPropagation){ e.stopPropagation(); }
			if (!this._isW3CEvents) {
				/*
				* In IE 8 is not possible to prevent the default handler from running
				* during mouse down event using usual API. The workaround is to give
				* focus back to the client div.
				*/ 
				var that = this;
				var win = this._getWindow();
				win.setTimeout(function() {
					that._clientDiv.focus();
				}, 0);
			}
		},
		_handleRootMouseUp: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (util.isFirefox < 13 && e.which === 1) {
				this._clientDiv.contentEditable = true;
				(this._overlayDiv || this._clientDiv).draggable = false;
			}
			if (util.isFirefox && e.which === 1) {
				
				/*
				* Bug in Firefox.  For some reason, Firefox stops showing the caret
				* in some cases. For example when the user cancels a drag operation 
				* by pressing ESC.  The fix is to detect that the drag operation was
				* cancelled,  toggle the contentEditable state and force the clientDiv
				* to loose and receive focus if it is focused.
				*/
				this._fixCaret();
				this._ignoreBlur = false;
			}
		},
		_handleBlur: function () {
			this._cancelCheckSelection();
			if (this._ignoreBlur) { return; }
			this._commitIME();
			this._hasFocus = false;
			/*
			* Bug in IE 8 and earlier. For some reason when text is deselected
			* the overflow selection at the end of some lines does not get redrawn.
			* The fix is to create a DOM element in the body to force a redraw.
			*/
			if (util.isIE < 9) {
				if (!this._getSelections()[0].isEmpty()) {
					var rootDiv = this._rootDiv;
					var child = util.createElement(rootDiv.ownerDocument, "div"); //$NON-NLS-1$
					rootDiv.appendChild(child);
					rootDiv.removeChild(child);
				}
			}
			if (this._cursorDiv) {
				this._cursorDiv.style.display = "none"; //$NON-NLS-1$
			}
			if (this._domSelection) {
				this._domSelection.forEach(function(domSelection) { domSelection.update(); });
				/* Clear browser selection if selection is within clientDiv */
				var temp;
				var win = this._getWindow();
				var doc = this._parent.ownerDocument;
				if (win.getSelection) {
					var sel = win.getSelection();
					temp = sel.anchorNode;
					while (temp) {
						if (temp === this._clientDiv) {
							if (sel.rangeCount > 0) { sel.removeAllRanges(); }
							break;
						}
						temp = temp.parentNode;
					}
				} else if (doc.selection) {
					this._ignoreSelect = false;
					temp = doc.selection.createRange().parentElement();
					while (temp) {
						if (temp === this._clientDiv) {
							doc.selection.empty();
							break;
						}
						temp = temp.parentNode;
					}
					this._ignoreSelect = true;
				}
			}
			if (!this._ignoreFocus) {
				this.onBlur({type: "Blur"}); //$NON-NLS-1$
			}
		},
		_handleCompositionStart: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this._imeTimeout) {
				var win = this._getWindow();
				win.clearTimeout(this._imeTimeout);
				this._imeTimeout = null;
			}
			if (this._imeText) {
				this._commitIME(this._imeText);
				this._imeText = null;
			}
			this._startIME();
			if (this._mutationObserver) {
				this._mutationObserver.disconnect();
				this._mutationObserver = null;
			}
		},
		_handleCompositionUpdate: function(e) {
			if (this._ignoreEvent(e)) { return; }
			this._imeText = e.data;
		},
		_handleCompositionEnd: function (e) {
			if (this._ignoreEvent(e)) { return; }
			this._imeText = e.data;
			var win = this._getWindow();
			this._imeTimeout = win.setTimeout(function() {
				this._commitIME(this._imeText);
				this._imeText = this._imeTimeout = null;
			}.bind(this), 0);
		},
		_handleContextMenu: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (util.isIE && this._lastMouseButton === 3) {
				// We need to update the DOM selection, because on
				// right-click the caret moves to the mouse location.
				// See bug 366312 and 376508.
				this._updateDOMSelection();
			}
			var preventDefault = false;
			if (this.isListening("ContextMenu")) { //$NON-NLS-1$
				var evt = this._createMouseEvent("ContextMenu", e); //$NON-NLS-1$
				evt.screenX = e.screenX;
				evt.screenY = e.screenY;
				this.onContextMenu(evt);
				preventDefault = evt.defaultPrevented;
			} else if (util.isMac && util.isFirefox && e.button === 0) {
				// hack to prevent CTRL+Space from showing the browser context menu
				preventDefault = true;
			}
			if (preventDefault) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			} else {
				this._contextMenuOpen = true;
				if (util.isFirefox) {
					this._checkSelectionChange = true;
					this._pollSelectionChange(true);
				}
			}
		},
		_handleCopy: function (e) {
			this._cancelCheckSelection();
			if (this._ignoreEvent(e)) { return; }
			if (this._ignoreCopy) { return; }
			if (this._doCopy(e)) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleCut: function (e) {
			this._cancelCheckSelection();
			if (this._ignoreEvent(e)) { return; }
			if (this._doCut(e)) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleDataModified: function(e) {
			if (this._ignoreEvent(e)) { return; }
			this._startIME();
		},
		_handleDblclick: function (e) {
			if (this._ignoreEvent(e)) { return; }
			var time = e.timeStamp ? e.timeStamp : Date.now();
			this._lastMouseTime = time;
			if (this._clickCount !== 2) {
				this._clickCount = 2;
				this._handleMouse(e);
			}
		},
		_handleDragStart: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (util.isFirefox < 13) {
				var that = this;
				var win = this._getWindow();
				win.setTimeout(function() {
					that._clientDiv.contentEditable = true;
					that._clientDiv.draggable = false;
					that._ignoreBlur = false;
				}, 0);
			}
			if (this.isListening("DragStart") && this._dragOffset !== -1) { //$NON-NLS-1$
				this._isMouseDown = false;
				this.onDragStart(this._createMouseEvent("DragStart", e)); //$NON-NLS-1$
				this._dragOffset = -1;
			} else {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleDrag: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this.isListening("Drag")) { //$NON-NLS-1$
				this.onDrag(this._createMouseEvent("Drag", e)); //$NON-NLS-1$
			}
		},
		_handleDragEnd: function (e) {
			if (this._ignoreEvent(e)) { return; }
			this._dropTarget = false;
			this._dragOffset = -1;
			if (this.isListening("DragEnd")) { //$NON-NLS-1$
				this.onDragEnd(this._createMouseEvent("DragEnd", e)); //$NON-NLS-1$
			}
			if (util.isFirefox < 13) {
				this._fixCaret();
				/*
				* Bug in Firefox.  For some reason, Firefox stops showing the caret when the 
				* selection is dropped onto itself. The fix is to detected the case and 
				* call fixCaret() a second time.
				*/
				if (e.dataTransfer.dropEffect === "none" && !e.dataTransfer.mozUserCancelled) { //$NON-NLS-1$
					this._fixCaret();
				}
			}
		},
		_handleDragEnter: function (e) {
			if (this._ignoreEvent(e)) { return; }
			var prevent = true;
			this._dropTarget = true;
			if (this.isListening("DragEnter")) { //$NON-NLS-1$
				prevent = false;
				this.onDragEnter(this._createMouseEvent("DragEnter", e)); //$NON-NLS-1$
			}
			/*
			* Webkit will not send drop events if this event is not prevented, as spec in HTML5.
			* Firefox and IE do not follow this spec for contentEditable. Note that preventing this 
			* event will result is loss of functionality (insertion mark, etc).
			*/
			if (util.isWebkit || prevent) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleDragOver: function (e) {
			if (this._ignoreEvent(e)) { return; }
			var prevent = true;
			if (this.isListening("DragOver")) { //$NON-NLS-1$
				prevent = false;
				this.onDragOver(this._createMouseEvent("DragOver", e)); //$NON-NLS-1$
			}
			/*
			* Webkit will not send drop events if this event is not prevented, as spec in HTML5.
			* Firefox and IE do not follow this spec for contentEditable. Note that preventing this 
			* event will result is loss of functionality (insertion mark, etc).
			*/
			if (util.isWebkit || prevent) {
				if (prevent) { e.dataTransfer.dropEffect = "none"; } //$NON-NLS-1$
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleDragLeave: function (e) {
			if (this._ignoreEvent(e)) { return; }
			this._dropTarget = false;
			if (this.isListening("DragLeave")) { //$NON-NLS-1$
				this.onDragLeave(this._createMouseEvent("DragLeave", e)); //$NON-NLS-1$
			}
		},
		_handleDrop: function (e) {
			if (this._ignoreEvent(e)) { return; }
			this._dropTarget = false;
			if (this.isListening("Drop")) { //$NON-NLS-1$
				this.onDrop(this._createMouseEvent("Drop", e)); //$NON-NLS-1$
			}
			/*
			* This event must be prevented otherwise the user agent will modify
			* the DOM. Note that preventing the event on some user agents (i.e. IE)
			* indicates that the operation is cancelled. This causes the dropEffect to 
			* be set to none  in the dragend event causing the implementor to not execute
			* the code responsible by the move effect.
			*/
			if (e.preventDefault) { e.preventDefault(); }
			return false;
		},
		_handleFocus: function () {
			this._hasFocus = true;
			if (util.isIOS && this._lastTouchOffset !== undefined) {
				this.setCaretOffset(this._lastTouchOffset, true);
				this._lastTouchOffset = undefined;
			} else {
				this._updateDOMSelection();
			}
			if (this._cursorDiv) {
				this._cursorDiv.style.display = "block"; //$NON-NLS-1$
			}
			if (this._domSelection) {
				this._domSelection.forEach(function(domSelection) { domSelection.update(); });
			}
			if (!this._ignoreFocus) {
				this.onFocus({type: "Focus"}); //$NON-NLS-1$
			}
		},
		_handleKeyDown: function (e) {
			this._cancelCheckSelection();
			if (this._ignoreEvent(e)) {	return;	}
			if (this.isListening("KeyDown")) { //$NON-NLS-1$
				var keyEvent = this._createKeyEvent("KeyDown", e); //$NON-NLS-1$
				this.onKeyDown(keyEvent); //$NON-NLS-1$
				if (keyEvent.defaultPrevented) {
					/*
					* Feature in Firefox. Keypress events still happen even if the keydown event
					* was prevented. The fix is to remember that keydown was prevented and prevent
					* the keypress ourselves.
					*/
					if (util.isFirefox) {
						this._keyDownPrevented = true;
					}
					e.preventDefault();
					return;
				}
			}
			var modifier = false;
			switch (e.keyCode) {
				case 16: /* Shift */
				case 17: /* Control */
				case 18: /* Alt */
				case 91: /* Command */
					modifier = true;
					break;
				default:
					this._setLinksVisible(false);
			}
			if (e.keyCode === 229) {
				if (this._readonly) {
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
				var startIME = true;
				
				/*
				* Bug in Safari. Some Control+key combinations send key events
				* with keyCode equals to 229. This is unexpected and causes the
				* view to start an IME composition. The fix is to ignore these
				* events.
				*/
				if (util.isSafari && util.isMac) {
					if (e.ctrlKey) {
						startIME = false;
						e.keyCode = 0x81;
					}
				}
				if (startIME) {
					this._startIME();
				}
			} else {
				if (!modifier) {
					this._commitIME();
				}
			}
			/*
			* Feature in Firefox. When a key is held down the browser sends 
			* right number of keypress events but only one keydown. This is
			* unexpected and causes the view to only execute an action
			* just one time. The fix is to ignore the keydown event and 
			* execute the actions from the keypress handler.
			* Note: This only happens on the Mac and Linux (Firefox 3.6).
			*
			* Feature in Opera < 12.16.  Opera sends keypress events even for non-printable
			* keys.  The fix is to handle actions in keypress instead of keydown.
			*/
			if (((util.isMac || util.isLinux) && util.isFirefox < 4) || util.isOpera < 12.16) {
				this._keyDownEvent = e;
				return true;
			}
			
			if (this._doAction(e)) {
				if (e.preventDefault) {
					e.preventDefault(); 
					e.stopPropagation(); 
				} else {
					e.cancelBubble = true;
					e.returnValue = false;
					e.keyCode = 0;
				}
				return false;
			}
		},
		_handleKeyPress: function (e) {
			if (this._ignoreEvent(e)) { return; }
			/*
			* Feature in Firefox. Keypress events still happen even if the keydown event
			* was prevented. The fix is to remember that keydown was prevented and prevent
			* the keypress ourselves.
			*/
			if (this._keyDownPrevented) { 
				if (e.preventDefault) {
					e.preventDefault(); 
					e.stopPropagation(); 
				} 
				this._keyDownPrevented = undefined;
				return;
			}
			/*
			* Feature in Embedded WebKit.  Embedded WekKit on Mac runs in compatibility mode and
			* generates key press events for these Unicode values (Function keys).  This does not
			* happen in Safari or Chrome.  The fix is to ignore these key events.
			*/
			if (util.isMac && util.isWebkit) {
				if ((0xF700 <= e.keyCode && e.keyCode <= 0xF7FF) || e.keyCode === 13 || e.keyCode === 8) {
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
			}
			if (((util.isMac || util.isLinux) && util.isFirefox < 4) || util.isOpera < 12.16) {
				if (this._doAction(this._keyDownEvent)) {
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
			}
			var ctrlKey = util.isMac ? e.metaKey : e.ctrlKey;
			if (e.charCode !== undefined) {
				if (ctrlKey) {
					switch (e.charCode) {
						/*
						* In Firefox and Safari if ctrl+v, ctrl+c ctrl+x is canceled
						* the clipboard events are not sent. The fix to allow
						* the browser to handles these key events.
						*/
						case 99://c
						case 118://v
						case 120://x
							return true;
					}
				}
			}
			if (this.isListening("KeyPress")) { //$NON-NLS-1$
				var keyEvent = this._createKeyEvent("KeyPress", e); //$NON-NLS-1$
				this.onKeyPress(keyEvent); //$NON-NLS-1$
				if (keyEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
			}
			if (this._doAction(e)) {
				if (e.preventDefault) {
					e.preventDefault(); 
					e.stopPropagation(); 
				} else {
					e.cancelBubble = true;
					e.returnValue = false;
					e.keyCode = 0;
				}
				return false;
			}
			var ignore = false;
			if (util.isMac) {
				if (e.ctrlKey || e.metaKey) { ignore = true; }
			} else {
				if (util.isFirefox) {
					//Firefox clears the state mask when ALT GR generates input
					if (e.ctrlKey || e.altKey) { ignore = true; }
				} else {
					//IE and Chrome only send ALT GR when input is generated
					if (e.ctrlKey ^ e.altKey) { ignore = true; }
				}
			}
			if (!ignore) {
				var key = util.isOpera ? e.which : (e.charCode !== undefined ? e.charCode : e.keyCode);
				if (key > 31) {
					this._doContent(String.fromCharCode (key));
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
			}
		},
		_handleDocKeyUp: function (e) {
			var ctrlKey = util.isMac ? e.metaKey : e.ctrlKey;
			if (!ctrlKey) {
				this._setLinksVisible(false);
			}
		},
		_handleKeyUp: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this.isListening("KeyUp")) { //$NON-NLS-1$
				var keyEvent = this._createKeyEvent("KeyUp", e); //$NON-NLS-1$
				this.onKeyUp(keyEvent); //$NON-NLS-1$
				if (keyEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
			}
			this._handleDocKeyUp(e);
			// don't commit for space (it happens during JP composition)  
			if (e.keyCode === 13) {
				this._commitIME();
			}
		},
		_handleLinkClick: function (e) {
			var ctrlKey = util.isMac ? e.metaKey : e.ctrlKey;
			if (!ctrlKey) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleMouse: function (e) {
			var win = this._getWindow();
			var result = true;
			var target = win;
			if (util.isIE || (util.isFirefox && !this._overlayDiv)) { target = this._clientDiv; }
			if (this._overlayDiv) {
				if (this._hasFocus) {
					this._ignoreFocus = true;
				}
				var that = this;
				win.setTimeout(function () {
					that.focus();
					that._ignoreFocus = false;
				}, 0);
			}
			var extend = e.shiftKey;
			var block = e.altKey;
			var add = util.isMac ? e.metaKey : e.ctrlKey;
			this._blockSelection = this._doubleClickSelection = null;
			if (this._clickCount === 1) {
				var drag = (!util.isOpera || util.isOpera >= 12.16) && this._hasFocus && this.isListening("DragStart"); //$NON-NLS-1$
				result = this._setSelectionTo(e.clientX, e.clientY, true, extend, add, drag);
				if (result) { this._setGrab(target); }
			} else {
				/*
				* Feature in IE8 and older, the sequence of events in the IE8 event model
				* for a doule-click is:
				*
				*	down
				*	up
				*	up
				*	dblclick
				*
				* Given that the mouse down/up events are not balanced, it is not possible to
				* grab on mouse down and ungrab on mouse up.  The fix is to grab on the first
				* mouse down and ungrab on mouse move when the button 1 is not set.
				*/
				if (this._isW3CEvents) { this._setGrab(target); }
				
				this._setSelectionTo(e.clientX, e.clientY, true, extend, add, false);
				this._doubleClickSelection = Selection.editing(this._getSelections());
			}
			if (block) {
				this._blockSelection = Selection.editing(this._getSelections());
			}
			return result;
		},
		_handleMouseDown: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this._linksVisible) {
				var target = e.target || e.srcElement;
				if (target.tagName !== "A") { //$NON-NLS-1$
					this._setLinksVisible(false);
				} else {
					return;
				}
			}
			this._commitIME();

			var button = e.which; // 1 - left, 2 - middle, 3 - right
			if (!button) { 
				// if IE 8 or older
				if (e.button === 4) { button = 2; }
				if (e.button === 2) { button = 3; }
				if (e.button === 1) { button = 1; }
			}

			// For middle click we always need getTime(). See _getClipboardText().
			var time = button !== 2 && e.timeStamp ? e.timeStamp : Date.now();
			var timeDiff = time - this._lastMouseTime;
			var deltaX = Math.abs(this._lastMouseX - e.clientX);
			var deltaY = Math.abs(this._lastMouseY - e.clientY);
			var sameButton = this._lastMouseButton === button;
			this._lastMouseX = e.clientX;
			this._lastMouseY = e.clientY;
			this._lastMouseTime = time;
			this._lastMouseButton = button;

			if (button === 1) {
				this._isMouseDown = true;
				if (sameButton && timeDiff <= this._clickTime && deltaX <= this._clickDist && deltaY <= this._clickDist) {
					this._clickCount++;
				} else {
					this._clickCount = 1;
				}
			}
			if (this.isListening("MouseDown")) { //$NON-NLS-1$
				var mouseEvent = this._createMouseEvent("MouseDown", e); //$NON-NLS-1$
				this.onMouseDown(mouseEvent);
				if (mouseEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
			}
			if (button === 1) {
				if (this._handleMouse(e) && (util.isIE >= 9 || util.isOpera || util.isChrome || util.isSafari || (util.isFirefox && !this._overlayDiv))) {
					if (!this._hasFocus) {
						this.focus();
					}
					e.preventDefault();
				}
			}
			if (util.isFirefox && this._lastMouseButton === 3) {
				// We need to update the DOM selection, because on
				// right-click the caret moves to the mouse location.
				// See bug 366312 and 376508.
				this._updateDOMSelection();
			}
		},
		_handleMouseOver: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this._animation) { return; }
			if (this.isListening("MouseOver")) { //$NON-NLS-1$
				this.onMouseOver(this._createMouseEvent("MouseOver", e)); //$NON-NLS-1$
			}
		},
		_handleMouseOut: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this._animation) { return; }
			if (this.isListening("MouseOut")) { //$NON-NLS-1$
				this.onMouseOut(this._createMouseEvent("MouseOut", e)); //$NON-NLS-1$
			}
		},
		_handleMouseMove: function (e) {
			if (this._animation) { return; }
			var inClient = this._isClientDiv(e);
			if (this.isListening("MouseMove")) { //$NON-NLS-1$
				if (inClient || this._isMouseDown){
					var mouseEvent = this._createMouseEvent("MouseMove", e); //$NON-NLS-1$
					this.onMouseMove(mouseEvent);
					if (mouseEvent.defaultPrevented) {
						e.preventDefault();
						return;
					}
				}
			}
			if (this._dropTarget) {
				return;
			}
			/*
			* Bug in IE9. IE sends one mouse event when the user changes the text by
			* pasting or undo.  These operations usually happen with the Ctrl key
			* down which causes the view to enter link mode.  Link mode does not end
			* because there are no further events.  The fix is to only enter link
			* mode when the coordinates of the mouse move event have changed.
			*/
			var changed = this._linksVisible || this._lastMouseMoveX !== e.clientX || this._lastMouseMoveY !== e.clientY;
			this._lastMouseMoveX = e.clientX;
			this._lastMouseMoveY = e.clientY;
			this._setLinksVisible(changed && !this._isMouseDown && e.altKey && (util.isMac ? e.metaKey : e.ctrlKey));

			this._checkOverlayScroll();

			/*
			* Feature in IE8 and older, the sequence of events in the IE8 event model
			* for a doule-click is:
			*
			*	down
			*	up
			*	up
			*	dblclick
			*
			* Given that the mouse down/up events are not balanced, it is not possible to
			* grab on mouse down and ungrab on mouse up.  The fix is to grab on the first
			* mouse down and ungrab on mouse move when the button 1 is not set.
			*
			* In order to detect double-click and drag gestures, it is necessary to send
			* a mouse down event from mouse move when the button is still down and isMouseDown
			* flag is not set.
			*/
			if (!this._isW3CEvents) {
				if (e.button === 0) {
					this._setGrab(null);
					return true;
				}
				if (!this._isMouseDown && e.button === 1 && (this._clickCount & 1) !== 0 && inClient) {
					this._clickCount = 2;
					return this._handleMouse(e, this._clickCount);
				}
			}
			if (!this._isMouseDown || this._dragOffset !== -1) {
				return;
			}
			
			var x = e.clientX;
			var y = e.clientY;
			var viewPad = this._getViewPadding();
			var viewRect = this._viewDiv.getBoundingClientRect();
			var width = this._getClientWidth (), height = this._getClientHeight();
			var leftEdge = viewRect.left + viewPad.left;
			var topEdge = viewRect.top + viewPad.top;
			var rightEdge = viewRect.left + viewPad.left + width;
			var bottomEdge = viewRect.top + viewPad.top + height;
			if (y < topEdge) {
				this._doAutoScroll("up", x, y - topEdge); //$NON-NLS-1$
			} else if (y > bottomEdge) {
				this._doAutoScroll("down", x, y - bottomEdge); //$NON-NLS-1$
			} else if (x < leftEdge && !this._wrapMode) {
				this._doAutoScroll("left", x - leftEdge, y); //$NON-NLS-1$
			} else if (x > rightEdge && !this._wrapMode) {
				this._doAutoScroll("right", x - rightEdge, y); //$NON-NLS-1$
			} else {
				this._endAutoScroll();
				this._setSelectionTo(x, y, false, true);
			}
		},
		_isClientDiv: function(e) {
			var topNode = this._overlayDiv || this._clientDiv;
			var temp = e.target ? e.target : e.srcElement;
			while (temp) {
				if (topNode === temp) {
					return true;
				}
				temp = temp.parentNode;
			}
			return false;
		},
		_createKeyEvent: function(type, e) {
			return {
				type: type,
				event: e,
				preventDefault: function() {
					this.defaultPrevented = true;
				}
			};
		},
		_createMouseEvent: function(type, e) {
			var pt = this.convert({x: e.clientX, y: e.clientY}, "page", "document"); //$NON-NLS-1$ //$NON-NLS-2$
			return {
				type: type,
				event: e,
				clickCount: this._clickCount,
				x: pt.x,
				y: pt.y,
				preventDefault: function() {
					this.defaultPrevented = true;
				}
			};
		},
		_createTouchEvent: function(type, e) {
			var pt = e.touches.length ? this.convert({x: e.touches[0].clientX, y: e.touches[0].clientY}, "page", "document") : {}; //$NON-NLS-1$ //$NON-NLS-2$
			return {
				type: type,
				event: e,
				touchCount: e.touches.length,
				x: pt.x,
				y: pt.y,
				preventDefault: function() {
					this.defaultPrevented = true;
				}
			};
		},
		_handleMouseUp: function (e) {
			var left = e.which ? e.button === 0 : e.button === 1;
			if (this.isListening("MouseUp")) { //$NON-NLS-1$
				if (this._isClientDiv(e) || (left && this._isMouseDown)) {
					var mouseEvent = this._createMouseEvent("MouseUp", e); //$NON-NLS-1$
					this.onMouseUp(mouseEvent);
					if (mouseEvent.defaultPrevented) {
						e.preventDefault();
						this._isMouseDown = false;
						return;
					}
				}
			}
			if (this._linksVisible) {
				return;
			}
			if (left && this._isMouseDown) {
				var selections = this._getSelections();
				var selection = Selection.editing(selections);
				selections.forEach(function(sel) {
					sel._editing = false;
				});
				if (this._dragOffset !== -1) {
					selection.extend(this._dragOffset);
					selection.collapse();
					selections = selection;
					this._dragOffset = -1;
				}
				this._setSelection(selections, false);
				this._isMouseDown = false;
				this._endAutoScroll();
				
				/*
				* Feature in IE8 and older, the sequence of events in the IE8 event model
				* for a doule-click is:
				*
				*	down
				*	up
				*	up
				*	dblclick
				*
				* Given that the mouse down/up events are not balanced, it is not possible to
				* grab on mouse down and ungrab on mouse up.  The fix is to grab on the first
				* mouse down and ungrab on mouse move when the button 1 is not set.
				*/
				if (this._isW3CEvents) { this._setGrab(null); }
			}
			/*
			* Note that there cases when Firefox sets the DOM selection in mouse up.
			* This happens for example after a cancelled drag operation.
			*
			* Note that on Chrome and IE, the caret stops blicking if mouse up is
			* prevented.
			*/
			if (left && this._isMouseDown && util.isFirefox) {
				this._updateDOMSelection();
				e.preventDefault();
			}
		},
		_handleMouseWheel: function (e) {
			if (this._noScroll) return;
			var lineHeight = this._getLineHeight();
			var pixelX = 0, pixelY = 0;
			// Note: On the Mac the correct behaviour is to scroll by pixel.
			if (util.isIE || util.isOpera) {
				pixelY = (-e.wheelDelta / 40) * lineHeight;
			} else if (util.isFirefox) {
				var limit = 256;
				if (e.type === "wheel") { //$NON-NLS-1$
					if (e.deltaMode) { // page or line
						pixelX = Math.max(-limit, Math.min(limit, e.deltaX)) * lineHeight;
						pixelY = Math.max(-limit, Math.min(limit, e.deltaY)) * lineHeight;
					} else {
						pixelX = e.deltaX;
						pixelY = e.deltaY;
					}
				} else {
					var pixel;
					if (util.isMac) {
						pixel = e.detail * 3;
					} else {
						pixel = Math.max(-limit, Math.min(limit, e.detail)) * lineHeight;
					}
					if (e.axis === e.HORIZONTAL_AXIS) {
						pixelX = pixel;
					} else {
						pixelY = pixel;
					}
				}
			} else {
				//Webkit
				if (util.isMac) {
					/*
					* In Safari, the wheel delta is a multiple of 120. In order to
					* convert delta to pixel values, it is necessary to divide delta
					* by 40.
					*
					* In Chrome and Safari 5, the wheel delta depends on the type of the
					* mouse. In general, it is the pixel value for Mac mice and track pads,
					* but it is a multiple of 120 for other mice. There is no presise
					* way to determine if it is pixel value or a multiple of 120.
					* 
					* Note that the current approach does not calculate the correct
					* pixel value for Mac mice when the delta is a multiple of 120.
					*
					* For values that are multiples of 120, the denominator varies on
					* the time between events.
					*/
					var denominatorX, denominatorY;
					var deltaTime = e.timeStamp - this._wheelTimeStamp;
					this._wheelTimeStamp = e.timeStamp;
					if (e.wheelDeltaX % 120 !== 0) { 
						denominatorX = 1; 
					} else {
						denominatorX = deltaTime < 40 ? 40/(40-deltaTime) : 40;
					}
					if (e.wheelDeltaY % 120 !== 0) { 
						denominatorY = 1; 
					} else {
						denominatorY = deltaTime < 40 ? 40/(40-deltaTime) : 40; 
					}
					pixelX = Math.ceil(-e.wheelDeltaX / denominatorX);
					if (-1 < pixelX && pixelX < 0) { pixelX = -1; }
					if (0 < pixelX && pixelX < 1) { pixelX = 1; }
					pixelY = Math.ceil(-e.wheelDeltaY / denominatorY);
					if (-1 < pixelY && pixelY < 0) { pixelY = -1; }
					if (0 < pixelY && pixelY < 1) { pixelY = 1; }
				} else {
					pixelX = -e.wheelDeltaX;
					var linesToScroll = 8;
					pixelY = (-e.wheelDeltaY / 120 * linesToScroll) * lineHeight;
				}
			}
			/* 
			* Feature in Safari. If the event target is removed from the DOM 
			* safari stops smooth scrolling. The fix is keep the element target
			* in the DOM and remove it on a later time. 
			*
			* Note: Using a timer is not a solution, because the timeout needs to
			* be at least as long as the gesture (which is too long).
			*/
			if (util.isSafari || (util.isChrome && util.isMac)) {
				var lineDiv = e.target;
				while (lineDiv && lineDiv.lineIndex === undefined) {
					lineDiv = lineDiv.parentNode;
				}
				this._mouseWheelLine = lineDiv;
			}
			var oldScroll = this._getScroll();
			this._scrollView(pixelX, pixelY);
			var newScroll = this._getScroll();
			if (oldScroll.x !== newScroll.x || oldScroll.y !== newScroll.y) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handlePaste: function (e) {
			this._cancelCheckSelection();
			if (this._ignoreEvent(e)) { return; }
			if (this._ignorePaste) { return; }
			if (this._doPaste(e)) {
				if (util.isIE) {
					/*
					 * Bug in IE,  
					 */
					var that = this;
					this._ignoreFocus = true;
					var win = this._getWindow();
					win.setTimeout(function() {
						that._updateDOMSelection();
						that._ignoreFocus = false;
					}, 0);
				}
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleResize: function () {
			var newWidth = this._rootDiv.clientWidth;
			var newHeight = this._rootDiv.clientHeight;
			if (this._rootWidth !== newWidth || this._rootHeight !== newHeight) {
				if (this._rootWidth !== newWidth && this._wrapMode) {
					this._resetLineHeight();
				}
				this._rootWidth = newWidth;
				this._rootHeight = newHeight;
				/*
				* Feature in IE7. For some reason, sometimes Internet Explorer 7 
				* returns incorrect values for element.getBoundingClientRect() when 
				* inside a resize handler. The fix is to queue the work.
				*/			
				var queue = util.isIE < 9;

				/*
				* The calculated metrics may be out of date when the zoom level changes.
				*/
				var metrics = this._calculateMetrics();
				if (!compare(metrics, this._metrics)) {
					if (this._metrics.invalid && !metrics.invalid) {
						this._updateStyle(false, metrics);
					} else {
						if (this._variableLineHeight) {
							this._variableLineHeight = false;
							this._resetLineHeight();
						}
						this._metrics = metrics;
					}
					queue = true;
				}

				if (queue) {
					this._queueUpdate();
				} else {
					this._update();
				}
				this.dispatchEvent({type: "Resize"}); //$NON-NLS-1$
			}
		},
		_handleRulerEvent: function (e) {
			var target = e.target ? e.target : e.srcElement;
			var lineIndex = target.lineIndex;
			var element = target;
			while (element && !element._ruler) {
				if (lineIndex === undefined && element.lineIndex !== undefined) {
					lineIndex = element.lineIndex;
				}
				element = element.parentNode;
			}
			var ruler = element ? element._ruler : null;
			if (lineIndex === undefined && ruler && ruler.getOverview() === "document") { //$NON-NLS-1$
				var clientHeight = this._getClientHeight ();
				var lineCount = this._model.getLineCount ();
				var viewPad = this._getViewPadding();
				var viewRect = this._viewDiv.getBoundingClientRect();
				var lineHeight = this._getLineHeight();
				var contentHeight = lineHeight * lineCount;
				var trackHeight = clientHeight + viewPad.top + viewPad.bottom - 2 * this._metrics.scrollWidth;
				var divHeight, arrowWidth;
				if (contentHeight < trackHeight) {
					divHeight = lineHeight;
					arrowWidth = viewPad.top;
				} else {
					divHeight = trackHeight / lineCount;
					arrowWidth = this._metrics.scrollWidth;
				}
				lineIndex = Math.floor(((e.clientY - viewRect.top) - arrowWidth) / divHeight);
				if (!(0 <= lineIndex && lineIndex < lineCount)) {
					lineIndex = undefined;
				}
			}
			if (ruler) {
				switch (e.type) {
					case "click": //$NON-NLS-1$
						if (ruler.onClick) { ruler.onClick(lineIndex, e); }
						break;
					case "dblclick": //$NON-NLS-1$
						if (ruler.onDblClick) { ruler.onDblClick(lineIndex, e); }
						break;
					case "mousemove": //$NON-NLS-1$
						if (ruler.onMouseMove) { ruler.onMouseMove(lineIndex, e); }
						break;
					case "mouseover": //$NON-NLS-1$
						if (ruler.onMouseOver) { ruler.onMouseOver(lineIndex, e); }
						break;
					case "mouseout": //$NON-NLS-1$
						if (ruler.onMouseOut) { 
							var tmp = e.relatedTarget;
							while (tmp && tmp !== this._rootDiv) {
								if (tmp === element) {
									return;
								}
								tmp = tmp.parentNode;
							}
							ruler.onMouseOut(lineIndex, e); 
						}
						break;
				}
			}
		},
		_handleScroll: function () {
			this._lastScrollTime = Date.now();
			var _scroll = this._getScroll(false);
			var oldX = this._hScroll;
			var oldY = this._vScroll;
			if (oldX !== _scroll.x || oldY !== _scroll.y) {
				this._hScroll = _scroll.x;
				this._vScroll = _scroll.y;
				this._commitIME();
				this._update(oldY === _scroll.y);
				var e = {
					type: "Scroll", //$NON-NLS-1$
					oldValue: {x: oldX, y: oldY},
					newValue: _scroll
				};
				this.onScroll(e);
			}
		},
		_handleSelectStart: function (e) {
			var menuOpen = this._contextMenuOpen;
			this._contextMenuOpen = false;
			if (menuOpen) {
				this._checkSelectionChange = true;
				return;
			}
			if (this._ignoreSelect) {
				if (e && e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_getModelOffset: function(node, offset) {
			if (!node) { return; }
			var lineNode;
			if (node.tagName === "DIV") { //$NON-NLS-1$
				lineNode = node;
			} else {
				lineNode = node.parentNode.parentNode;
			}
			if (!lineNode._line) {
				return 0;
			}
			return lineNode._line.getModelOffset (node, offset);
		},
		_updateSelectionFromDOM: function() {
			if (!(util.isIOS || util.isAndroid || this._checkSelectionChange)) {
				return false;
			}
			var win = this._getWindow();
			var selection = win.getSelection();
			var start = this._getModelOffset(selection.anchorNode, selection.anchorOffset);
			var end = this._getModelOffset(selection.focusNode, selection.focusOffset);
			var sel = this._getSelections()[0];
			if (start === undefined || end === undefined || (sel.start === start && sel.end === end)) {
				return false;
			}
			
			if (this._checkSelectionChange) {
				var firstLine = this._getLineNext();
				var lastLine = this._getLinePrevious();
				
				// Selection is unchanged and bigger than the visible buffer region
				if (selection.anchorNode === firstLine.firstChild.firstChild && selection.anchorOffset === 0 &&
					selection.focusNode === lastLine.firstChild.firstChild && selection.focusOffset === 0)
				{
					return false;
				}
				
				// Detect select all
				if (
				(selection.anchorNode === firstLine.firstChild.firstChild && selection.anchorOffset === 0 && selection.focusNode === lastLine.lastChild.firstChild)
				|| (selection.anchorNode === this._clientDiv && selection.focusNode === this._clientDiv)
				) {
					start = 0;
					end = this.getModel().getCharCount();
				}
			}
			
			this._setSelection(new Selection(start, end), false, false);
			this._checkSelectionChange = false;
			return true;
		},
		_cancelCheckSelection: function() {
			if (this._checkSelectionChange) {
				this._checkSelectionChange = false;
				this._cancelPollSelectionChange();
			}
		},
		_cancelPollSelectionChange: function() {
			if (this._selPollTimer) {
				var win = this._getWindow();
				win.clearTimeout(this._selPollTimer);
				this._selPollTimer = null; 
			}
		},
		_pollSelectionChange: function(retryPoll) {
			var that = this;
			var win = this._getWindow();
			this._cancelPollSelectionChange();
			this._selPollTimer = win.setTimeout(function() {
				that._selPollTimer = null; 
				if (!that._clientDiv) { return; }
				var changed = that._updateSelectionFromDOM();
				if (!changed && retryPoll) {
					that._pollSelectionChange(retryPoll);
				}
			}, 100);
		},
		_handleSelectionChange: function () {
			if (this._imeOffset !== -1) {
				return;
			}
			/*
			 * Feature in Android. The selection handles are hidden when the DOM changes. Sending
			 * selection events to the application while the user is moving the selection handles
			 * may hide the handles unexpectedly.  The fix is to delay updating the selection and
			 * sending the event to the application.
			 */
			if (util.isAndroid) {
				this._pollSelectionChange();
			} else {
				this._updateSelectionFromDOM();
			}
		},
		_handleTextInput: function (e) {
			if (this._ignoreEvent(e)) { return; }
			if (this._imeOffset !== -1) {
				return;
			}
			var selection = this._getWindow().getSelection();
			if (
				selection.anchorNode !== this._anchorNode || selection.focusNode !== this._focusNode ||
				selection.anchorOffset !== this._anchorOffset || selection.focusOffset !== this._focusOffset
			) {
				var temp = selection.anchorNode;
				while (temp) {
					if (temp.lineIndex !== undefined) {
						break;
					}
					temp = temp.parentNode;
				}
				if (temp) {
					var model = this._model;
					var lineIndex = temp.lineIndex;
					var oldText = model.getLine(lineIndex), text = oldText;
					var offset = 0;
					var lineStart = model.getLineStart(lineIndex);
					if (selection.rangeCount > 0) {
						selection.getRangeAt(0).deleteContents();
						var node = temp.ownerDocument.createTextNode(e.data);
						selection.getRangeAt(0).insertNode(node);
						var nodeText = this._getDOMText(temp, node);
						text = nodeText.text;
						offset = nodeText.offset;
						node.parentNode.removeChild(node);
					}
					temp.lineRemoved = true;
					
					var start = 0;
					while (oldText.charCodeAt(start) === text.charCodeAt(start) && start < offset) {
						start++;
					}
		
					var end = oldText.length - 1, delta = text.length - oldText.length;
					while (oldText.charCodeAt(end) === text.charCodeAt(end + delta) && end + delta >= offset + e.data.length) {
						end--;
					}
					end++;
					
					var deltaText = text.substring(start, end + delta);
					start += lineStart;
					end += lineStart;
					
					var selections = this._getSelections();
					var deltaStart = selections[0].start - start;
					var deltaEnd = selections[0].end - end;
					selections[0].start = start;
					selections[0].end = end;
					for (var i=1; i<selections.length; i++) {
						selections[i].start -= deltaStart;
						selections[i].end -= deltaEnd;
					}
					this._modifyContent({text: deltaText, selection: selections, _ignoreDOMSelection: true}, true);
				}
			} else {
				this._doContent(e.data);
			}
			e.preventDefault();
		},
		_handleTouchStart: function (e) {
			if (this.isListening("TouchStart")) { //$NON-NLS-1$
				var touchEvent = this._createTouchEvent("TouchStart", e); //$NON-NLS-1$
				this.onTouchStart(touchEvent);
				if (touchEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
				if (this._noScroll) {
					return;
				}
			}
			this._commitIME();
			var win = this._getWindow();
			if (this._touchScrollTimer) {
				this._vScrollDiv.style.display = "none"; //$NON-NLS-1$
				this._hScrollDiv.style.display = "none"; //$NON-NLS-1$
				win.clearInterval(this._touchScrollTimer);
				this._touchScrollTimer = null;
			}
			var touches = e.touches;
			if (touches.length === 1) {
				var touch = touches[0];
				var x = touch.clientX, y = touch.clientY;
				this._touchStartX = x;
				this._touchStartY = y;
				if (util.isAndroid) {
					/*
					* Bug in Android 4.  The clientX/Y coordinates of the touch events
					* include the page scrolling offsets.
					*/
				    if (y < (touch.pageY - win.pageYOffset) || x < (touch.pageX - win.pageXOffset) ) {
						x = touch.pageX - win.pageXOffset;
						y = touch.pageY - win.pageYOffset;
				    }
				}
				var pt = this.convert({x: x, y: y}, "page", "document"); //$NON-NLS-1$ //$NON-NLS-2$
				this._lastTouchOffset = this.getOffsetAtLocation(pt.x, pt.y);
				this._touchStartTime = e.timeStamp;
				this._touching = true;
			}
		},
		_handleTouchMove: function (e) {
			if (this.isListening("TouchMove")) { //$NON-NLS-1$
				var touchEvent = this._createTouchEvent("TouchMove", e); //$NON-NLS-1$
				this.onTouchMove(touchEvent);
				if (touchEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
				if (this._noScroll) {
					return;
				}
			}
			var touches = e.touches;
			if (touches.length === 1) {
				var touch = touches[0];
				this._touchCurrentX = touch.clientX;
				this._touchCurrentY = touch.clientY;
				var interval = 10;
				if (!this._touchScrollTimer && (e.timeStamp - this._touchStartTime) < (interval*20)) {
					this._vScrollDiv.style.display = "block"; //$NON-NLS-1$
					if (!this._wrapMode) {
						this._hScrollDiv.style.display = "block"; //$NON-NLS-1$
					}
					var that = this;
					var win = this._getWindow();
					this._touchScrollTimer = win.setInterval(function() {
						var deltaX = 0, deltaY = 0;
						if (that._touching) {
							deltaX = that._touchStartX - that._touchCurrentX;
							deltaY = that._touchStartY - that._touchCurrentY;
							that._touchSpeedX = deltaX / interval;
							that._touchSpeedY = deltaY / interval;
							that._touchStartX = that._touchCurrentX;
							that._touchStartY = that._touchCurrentY;
						} else {
							if (Math.abs(that._touchSpeedX) < 0.1 && Math.abs(that._touchSpeedY) < 0.1) {
								that._vScrollDiv.style.display = "none"; //$NON-NLS-1$
								that._hScrollDiv.style.display = "none"; //$NON-NLS-1$
								win.clearInterval(that._touchScrollTimer);
								that._touchScrollTimer = null;
								return;
							} else {
								deltaX = that._touchSpeedX * interval;
								deltaY = that._touchSpeedY * interval;
								that._touchSpeedX *= 0.95;
								that._touchSpeedY *= 0.95;
							}
						}
						that._scrollView(deltaX, deltaY);
					}, interval);
				}
				if (this._touchScrollTimer) {
					e.preventDefault();
				}
			}
		},
		_handleTouchEnd: function (e) {
			if (this.isListening("TouchEnd")) { //$NON-NLS-1$
				var touchEvent = this._createTouchEvent("TouchEnd", e); //$NON-NLS-1$
				this.onTouchEnd(touchEvent);
				if (touchEvent.defaultPrevented) {
					e.preventDefault();
					return;
				}
				if (this._noScroll) {
					return;
				}
			}
			var touches = e.touches;
			if (touches.length === 0) {
				this._touching = false;
			}
		},

		/************************************ Actions ******************************************/
		_doAction: function (e) {
			var mode, i;
			var keyModes = this._keyModes;
			for (i = keyModes.length - 1 ; i >= 0; i--) {
				mode = keyModes[i];
				if (typeof mode.match === "function") { //$NON-NLS-1$
					var actionID = mode.match(e);
					if (actionID !== undefined) {
						return this.invokeAction(actionID);
					}
				}
			}
			return false;
		},
		_doMove: function(args, selection) {
			var model = this._model;
			var caret = selection.getCaret();
			var lineIndex = model.getLineAtOffset(caret);
			if (!args.count) {
				args.count = 1;
			}
			while (args.count !== 0) {
				var lineStart = model.getLineStart(lineIndex);
				if (args.count < 0 && caret === lineStart) {
					if (lineIndex > 0) {
						if (args.unit === "character") { //$NON-NLS-1$
							args.count++;
						}
						lineIndex--;
						selection.extend(model.getLineEnd(lineIndex));
					} else {
						break;
					}
				} else if (args.count > 0 && caret === model.getLineEnd(lineIndex)) {
					if (lineIndex + 1 < model.getLineCount()) {
						if (args.unit === "character") { //$NON-NLS-1$
							args.count--;
						}
						lineIndex++;
						selection.extend(model.getLineStart(lineIndex));
					} else {
						break;
					}
				} else {
					var removeTab = false;
					if (args.expandTab && args.unit === "character" && (caret - lineStart) % this._tabSize === 0) { //$NON-NLS-1$
						var lineText = model.getText(lineStart, caret);
						removeTab = !/[^ ]/.test(lineText); // Only spaces between line start and caret.
					}
					if (removeTab) {
						selection.extend(caret - this._tabSize);
						args.count += args.count < 0 ? 1 : -1;
					} else {
						var line = this._getLine(lineIndex);
						selection.extend(line.getNextOffset(caret, args));
						line.destroy();
					}
				}
				caret = selection.getCaret();
			}
			return selection;
		},
		_doBackspace: function (args) {
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (selection.isEmpty()) {
					if (!args.count) {
						args.count = 1;
					}
					args.count *= -1;
					args.expandTab = that._expandTab;
					that._doMove(args, selection);
				}
			});
			this._modifyContent({text: "", selection: selections}, true);
			return true;
		},
		_doCase: function (args) {
			var that = this;
			var selections = this._getSelections();
			var changes = [];
			selections.forEach(function(selection) {
				that._doMove(args, selection);
				var text = that.getText(selection.start, selection.end);
				switch (args.type) {
					case "lower": text = text.toLowerCase(); break; //$NON-NLS-1$
					case "capitalize": text = text.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }); break; //$NON-NLS-1$
					case "reverse":  //$NON-NLS-1$
						var newText = "";
						for (var i=0; i<text.length; i++) {
							var s = text[i];
							var l = s.toLowerCase();
							if (l !== s) {
								s = l;
							} else {
								s = s.toUpperCase();
							}
							newText += s;
						} 
						text = newText;
						break;
					default: text = text.toUpperCase(); break;
				}
				changes.push(text);
			});
			return this._modifyContent({text: changes, selection: selections, _ignoreDOMSelection: true}, true);
		},
		_doContent: function (text) {
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (that._overwriteMode && selection.isEmpty()) {
					var model = that._model;
					var lineIndex = model.getLineAtOffset(selection.end);
					if (selection.end < model.getLineEnd(lineIndex)) {
						var line = that._getLine(lineIndex);
						selection.extend(line.getNextOffset(selection.getCaret(), {unit:"character", count:1})); //$NON-NLS-1$
						line.destroy();
					}
				}
			});
			return this._modifyContent({text: text, selection: selections, _ignoreDOMSelection: true}, true);
		},
		_doCopy: function (e) {
			var text = this.getSelectionText();
			if (text) {
				return this._setClipboardText(text, e);
			}
			return true;
		},
		_doCursorNext: function (args) {
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (!selection.isEmpty() && !args.select) {
					selection.start = selection.end;
				} else {
					that._doMove(args, selection);
				}
				if (!args.select) { selection.collapse(); }
			});
			this._setSelection(selections, true);
			return true;
		},
		_doCursorPrevious: function (args) {
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (!selection.isEmpty() && !args.select) {
					selection.end = selection.start;
				} else {
					if (!args.count) {
						args.count = 1;
					}
					args.count *= -1;
					that._doMove(args, selection);
				}
				if (!args.select) { selection.collapse(); }
			});
			this._setSelection(selections, true);
			return true;
		},
		_doCut: function (e) {
			var text = this.getSelectionText();
			if (text) {
				if (!this._setClipboardText(text, e)) {
					return false;
				}
				this._doContent("");
			}
			return true;
		},
		_doDelete: function (args) {
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (selection.isEmpty()) {
					that._doMove(args, selection);
				}
			});
			this._modifyContent({text: "", selection: selections}, true);
			return true;
		},
		_doEnd: function (args) {
			var model = this._model;
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (args.ctrl) {
					selection.extend(model.getCharCount());
				} else {
					var offset = selection.getCaret();
					var lineIndex = model.getLineAtOffset(offset);
					if (that._wrapMode) {
						var line = that._getLine(lineIndex);
						var visualIndex = line.getLineIndex(offset);
						if (visualIndex === line.getLineCount() - 1) {
							offset = model.getLineEnd(lineIndex);
						} else {
							offset = line.getLineStart(visualIndex + 1) - 1;
						}
						line.destroy();
					} else {
						if (args.count && args.count > 0) {
							lineIndex = Math.min (lineIndex  + args.count - 1, model.getLineCount() - 1);
						}
						offset = model.getLineEnd(lineIndex);
					}
					selection.extend(offset);
				}
				if (!args.select) { selection.collapse(); }
			});
			this._setSelection(selections, true, true, args.ctrl ? function() {} : null);
			return true;
		},
		_doEnter: function (args) {
			if (this._singleMode) return true;
			var model = this._model;
			var selections = this._getSelections();
			this._doContent(model.getLineDelimiter()); 
			if (args && args.noCursor) {
				selections.forEach(function(selection) {
					selection.end = selection.start;
				});
				this._setSelection(selections, true);
			}
			return true;
		},
		_doEscape: function () {
			var selections = this._getSelections();
			if (selections.length > 1) {
				this._setSelection(selections[0], true);
			}
			return true;
		},
		_doHome: function (args) {
			var model = this._model;
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (args.ctrl) {
					selection.extend(0);
				} else {
					var offset = selection.getCaret();
					var lineIndex = model.getLineAtOffset(offset);
					if (that._wrapMode) {
						var line = that._getLine(lineIndex);
						var visualIndex = line.getLineIndex(offset);
						offset = line.getLineStart(visualIndex);
						line.destroy();
					} else {
						offset = model.getLineStart(lineIndex);
					}
					selection.extend(offset); 
				}
				if (!args.select) { selection.collapse(); }
			});
			this._setSelection(selections, true, true, args.ctrl ? function() {} : null);
			return true;
		},
		_doLineDown: function (args) {
			var model = this._model;
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				var caret = selection.getCaret();
				var lineIndex = model.getLineAtOffset(caret), visualIndex;
				var line = that._getLine(lineIndex);
				var x = selection._columnX, y = 1, lastLine = false;
				if (x === -1 || args.wholeLine || (args.select && util.isIE)) {
					var offset = args.wholeLine ? model.getLineEnd(lineIndex + 1) : caret;
					x = selection._columnX = line.getBoundingClientRect(offset).left;
				}
				if ((visualIndex = line.getLineIndex(caret)) < line.getLineCount() - 1) {
					y = line.getClientRects(visualIndex + 1).top + 1;
				} else {
					var lastLineCount = model.getLineCount() - 1;
					lastLine = lineIndex === lastLineCount;
					if (args.count && args.count > 0) {
						lineIndex = Math.min (lineIndex + args.count, lastLineCount);
					} else {
						lineIndex++;
					}
				}
				var select = false;
				if (lastLine) {
					if (args.select || (util.isMac || util.isLinux)) {
						selection.extend(model.getCharCount());
						select = true;
					}
				} else {
					if (line.lineIndex !== lineIndex) {
						line.destroy();
						line = that._getLine(lineIndex);
					}
					selection.extend(line.getOffset(x, y));
					select = true;
				}
				if (select) {
					if (!args.select) { selection.collapse(); }
				}
				line.destroy();
			});
			that._setSelection(selections, true, true, null, 0, false, true);
			return true;
		},
		_doLineUp: function (args) {
			var model = this._model;
			var that = this;
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				var caret = selection.getCaret();
				var lineIndex = model.getLineAtOffset(caret), visualIndex;
				var line = that._getLine(lineIndex);
				var x = selection._columnX, firstLine = false, y;
				if (x === -1 || args.wholeLine || (args.select && util.isIE)) {
					var offset = args.wholeLine ? model.getLineStart(lineIndex - 1) : caret;
					x = selection._columnX = line.getBoundingClientRect(offset).left;
				}
				if ((visualIndex = line.getLineIndex(caret)) > 0) {
					y = line.getClientRects(visualIndex - 1).top + 1;
				} else {
					firstLine = lineIndex === 0;
					if (!firstLine) {
						if (args.count && args.count > 0) {
							lineIndex = Math.max (lineIndex - args.count, 0);
						} else {
							lineIndex--;
						}
						y = that._getLineHeight(lineIndex) - 1;
					}
				}
				var select = false;
				if (firstLine) {
					if (args.select || (util.isMac || util.isLinux)) {
						selection.extend(0);
						select = true;
					}
				} else {
					if (line.lineIndex !== lineIndex) {
						line.destroy();
						line = that._getLine(lineIndex);
					}
					selection.extend(line.getOffset(x, y));
					select = true;
				}
				if (select) {
					if (!args.select) { selection.collapse(); }
				}
				line.destroy();
			});
			that._setSelection(selections, true, true, null, 0, false, true);
			return true;
		},
		_doNoop: function () {
			return true;
		},
		_doPageDown: function (args) {
			var that = this;
			var model = this._model;
			var selections = this._getSelections();
			var lineCount = model.getLineCount();
			var _scroll = this._getScroll();
			var clientHeight = this._getClientHeight();
			var lineHeight = this._getLineHeight();
			var lines = Math.floor(clientHeight / lineHeight);
			var x, line, pageScroll;
			selections.forEach(function(selection) {
				var caret = selection.getCaret();
				var caretLine = model.getLineAtOffset(caret);
				if (that._lineHeight) {
					x = selection._columnX;
					var caretRect = that._getBoundsAtOffset(caret);
					if (x === -1 || (args.select && util.isIE)) {
						x = selection._columnX = caretRect.left;
					}
					var lineIndex = that._getLineIndex(caretRect.top + clientHeight);
					line = that._getLine(lineIndex);
					var linePixel = that._getLinePixel(lineIndex);
					var y = caretRect.top + clientHeight - linePixel;
					caret = line.getOffset(x, y);
					var rect = line.getBoundingClientRect(caret);
					line.destroy();
					selection.extend(caret);
					if (!args.select) { selection.collapse(); }
					pageScroll = pageScroll !== undefined ? Math.min(pageScroll, rect.top + linePixel - caretRect.top) : rect.top + linePixel - caretRect.top;
				} else {
					if (caretLine < lineCount - 1) {
						var scrollLines = Math.min(lineCount - caretLine - 1, lines);
						scrollLines = Math.max(1, scrollLines);
						x = selection._columnX;
						if (x === -1 || (args.select && util.isIE)) {
							line = that._getLine(caretLine);
							x = selection._columnX = line.getBoundingClientRect(caret).left;
							line.destroy();
						}
						line = that._getLine(caretLine + scrollLines);
						selection.extend(line.getOffset(x, 0));
						line.destroy();
						if (!args.select) { selection.collapse(); }
						var verticalMaximum = lineCount * lineHeight;
						var scrollOffset = _scroll.y + scrollLines * lineHeight;
						if (scrollOffset + clientHeight > verticalMaximum) {
							scrollOffset = verticalMaximum - clientHeight;
						}
						pageScroll = pageScroll !== undefined ? Math.min(pageScroll, scrollOffset - _scroll.y) : scrollOffset - _scroll.y;
					}
				}
			});
			this._setSelection(selections, true, true, function() {}, pageScroll, false, true);
			return true;
		},
		_doPageUp: function (args) {
			var that = this;
			var model = this._model;
			var selections = this._getSelections();
			var _scroll = this._getScroll();
			var clientHeight = this._getClientHeight();
			var lineHeight = this._getLineHeight();
			var lines = Math.floor(clientHeight / lineHeight);
			var x, line, pageScroll;
			selections.forEach(function(selection) {
				var caret = selection.getCaret();
				var caretLine = model.getLineAtOffset(caret);
				if (that._lineHeight) {
					x = selection._columnX;
					var caretRect = that._getBoundsAtOffset(caret);
					if (x === -1 || (args.select && util.isIE)) {
						x = selection._columnX = caretRect.left;
					}
					var lineIndex = that._getLineIndex(caretRect.bottom - clientHeight);
					line = that._getLine(lineIndex);
					var linePixel = that._getLinePixel(lineIndex);
					var y = (caretRect.bottom - clientHeight) - linePixel;
					caret = line.getOffset(x, y);
					var rect = line.getBoundingClientRect(caret);
					line.destroy();
					selection.extend(caret);
					if (!args.select) { selection.collapse(); }
					pageScroll = pageScroll !== undefined ? Math.max(pageScroll, rect.top + linePixel - caretRect.top) : rect.top + linePixel - caretRect.top;
				} else {
					if (caretLine > 0) {
						var scrollLines = Math.max(1, Math.min(caretLine, lines));
						x = selection._columnX;
						if (x === -1 || (args.select && util.isIE)) {
							line = that._getLine(caretLine);
							x = selection._columnX = line.getBoundingClientRect(caret).left;
							line.destroy();
						}
						line = that._getLine(caretLine - scrollLines);
						selection.extend(line.getOffset(x, that._getLineHeight(caretLine - scrollLines) - 1));
						line.destroy();
						if (!args.select) { selection.collapse(); }
						var scrollOffset = Math.max(0, _scroll.y - scrollLines * lineHeight);
						pageScroll = pageScroll !== undefined  ? Math.max(pageScroll, scrollOffset - _scroll.y) : scrollOffset - _scroll.y;
					}
				}
			});
			this._setSelection(selections, true, true, function() {}, pageScroll, false, true);
			return true;
		},
		_doPaste: function(e) {
			var that = this;
			var result = this._getClipboardText(e, function(text) {
				if (text.length) {
					if (util.isLinux && that._lastMouseButton === 2) {
						var timeDiff = Date.now() - that._lastMouseTime;
						if (timeDiff <= that._clickTime) {
							that._setSelectionTo(that._lastMouseX, that._lastMouseY, true);
						}
					}
					var selections = that._getSelections();
					var delimiter = that._singleMode ? "" : that._model.getLineDelimiter();
					that._doContent(selections.length > 1 && selections.length === text.length ? text : text.join(delimiter));
				}
			});
			return result !== null;
		},
		_doScroll: function (args) {
			var type = args.type;
			var model = this._model;
			var lineCount = model.getLineCount();
			var clientHeight = this._getClientHeight();
			var lineHeight = this._getLineHeight();
			var verticalMaximum = this._lineHeight ? this._scrollHeight : lineCount * lineHeight;
			var verticalScrollOffset = this._getScroll().y;
			var pixel;
			switch (type) {
				case "textStart": pixel = 0; break; //$NON-NLS-1$
				case "textEnd": pixel = verticalMaximum - clientHeight; break; //$NON-NLS-1$
				case "pageDown": pixel = verticalScrollOffset + clientHeight; break; //$NON-NLS-1$
				case "pageUp": pixel = verticalScrollOffset - clientHeight; break; //$NON-NLS-1$
				case "lineDown": pixel = verticalScrollOffset + lineHeight; break; //$NON-NLS-1$
				case "lineUp": pixel = verticalScrollOffset - lineHeight; break; //$NON-NLS-1$
				case "centerLine": //$NON-NLS-1$
					var selection = this._getSelections()[0];
					var lineStart = model.getLineAtOffset(selection.start);
					var lineEnd = model.getLineAtOffset(selection.end);
					var selectionHeight = (lineEnd - lineStart + 1) * lineHeight;
					pixel = (lineStart * lineHeight) - (clientHeight / 2) + (selectionHeight / 2);
					break;
			}
			if (pixel !== undefined) {
				pixel = Math.min(Math.max(0, pixel), verticalMaximum - clientHeight);
				this._scrollViewAnimated(0, pixel - verticalScrollOffset, function() {});
			}
			return true;
		},
		_doSelectAll: function () {
			var model = this._model;
			this._setSelection(new Selection(0, model.getCharCount()), false);
			return true;
		},
		_doTab: function () {
			if (!this._tabMode || this._readonly) { return; }
			var text = "\t"; //$NON-NLS-1$
			var selections = this._getSelections();
			if (this._expandTab) {
				text = [];
				var model = this._model;
				var tabSize = this._tabSize;
				selections.forEach(function(selection) {
					var caret = selection.getCaret();
					var lineIndex = model.getLineAtOffset(caret);
					var lineStart = model.getLineStart(lineIndex);
					var spaces = tabSize - ((caret - lineStart) % tabSize);
					text.push((newArray(spaces + 1)).join(" ")); //$NON-NLS-1$
				});
			}
			return this._modifyContent({text: text, selection: selections, _ignoreDOMSelection: true}, true);
		},
		_doShiftTab: function () {
			if (!this._tabMode || this._readonly) { return; }
			return true;
		},
		_doOverwriteMode: function () {
			if (this._readonly) { return; }
			this.setOptions({overwriteMode: !this.getOptions("overwriteMode")}); //$NON-NLS-1$
			return true;
		},
		_doTabMode: function () {
			this.setOptions({tabMode: !this.getOptions("tabMode")}); //$NON-NLS-1$
			return true;
		},
		_doWrapMode: function () {
			this.setOptions({wrapMode: !this.getOptions("wrapMode")}); //$NON-NLS-1$
			return true;
		},
		
		/************************************ Internals ******************************************/
		_autoScroll: function () {
			var model = this._model;
			var selections = this._getSelections();
			var selection = Selection.editing(selections, this._autoScrollDir === "down"); //$NON-NLS-1$
			var pt = this.convert({x: this._autoScrollX, y: this._autoScrollY}, "page", "document"); //$NON-NLS-1$ //$NON-NLS-2$
			var caret = selection.getCaret();
			var lineCount = model.getLineCount();
			var caretLine = model.getLineAtOffset(caret), lineIndex, line;
			if (this._autoScrollDir === "up" || this._autoScrollDir === "down") { //$NON-NLS-1$ //$NON-NLS-1$
				var _scroll = this._autoScrollY / this._getLineHeight();
				_scroll = _scroll < 0 ? Math.floor(_scroll) : Math.ceil(_scroll);
				lineIndex = caretLine;
				lineIndex = Math.max(0, Math.min(lineCount - 1, lineIndex + _scroll));
			} else if (this._autoScrollDir === "left" || this._autoScrollDir === "right") { //$NON-NLS-1$ //$NON-NLS-1$
				lineIndex = this._getLineIndex(pt.y);
				line = this._getLine(caretLine); 
				pt.x += line.getBoundingClientRect(caret, false).left;
				line.destroy();
			}
			if (this._blockSelection) {
				selections = this._getBlockSelections(selections, lineIndex, pt);
			} else if (lineIndex === 0 && (util.isMac || util.isLinux)) {
				selection.extend(0);
			} else if (lineIndex === lineCount - 1 && (util.isMac || util.isLinux)) {
				selection.extend(model.getCharCount());
			} else {
				line = this._getLine(lineIndex);
				selection.extend(line.getOffset(pt.x, pt.y - this._getLinePixel(lineIndex)));
				line.destroy();
			}
			this._setSelection(selections, true);
		},
		_autoScrollTimer: function () {
			this._autoScroll();
			var that = this;
			var win = this._getWindow();
			this._autoScrollTimerID = win.setTimeout(function () {that._autoScrollTimer();}, this._AUTO_SCROLL_RATE);
		},
		_calculateLineHeightTimer: function(calculate) {
			if (!this._lineHeight) { return; }
			if (this._calculateLHTimer) { return; }
			var lineCount = this._model.getLineCount(), i = 0;
			if (calculate) {
				var c = 0;
				var MAX_TIME = 100;
				var start = Date.now(), firstLine = 0;
				while (i < lineCount) {
					if (!this._lineHeight[i]) {
						c++;
						if (!firstLine) { firstLine = i; }
						this._lineHeight[i] = this._calculateLineHeight(i);
					}
					i++;
					if ((Date.now() - start) > MAX_TIME) {
						break;
					}
				}
				this.redrawRulers(0, lineCount);
				this._queueUpdate();
			}
			var win = this._getWindow();
			if (i !== lineCount) {
				var that = this;
				this._calculateLHTimer = win.setTimeout(function() {
					that._calculateLHTimer = null;
					that._calculateLineHeightTimer(true);
				}, 0);
				return;
			}
			if (this._calculateLHTimer) {
				win.clearTimeout(this._calculateLHTimer);
				this._calculateLHTimer = undefined;
			}
		},
		_calculateLineHeight: function(lineIndex) {
			var line = this._getLine(lineIndex);
			var rect = line.getBoundingClientRect();
			line.destroy();
			return Math.max(1, rect.bottom - rect.top);
		},
		_calculateMetrics: function() {
			var _parent = this._clientDiv;
			var doc = _parent.ownerDocument;
			var c = " "; //$NON-NLS-1$
			var line = util.createElement(doc, "div"); //$NON-NLS-1$
			line.style.lineHeight = "normal"; //$NON-NLS-1$
			var model = this._model;
			var lineText = model.getLine(0);
			var e = {type:"LineStyle", textView: this, 0: 0, lineText: lineText, lineStart: 0}; //$NON-NLS-1$
			this.onLineStyle(e);
			applyStyle(e.style, line);
			line.style.position = "fixed"; //$NON-NLS-1$
			line.style.left = "-1000px"; //$NON-NLS-1$
			var span1 = util.createElement(doc, "span"); //$NON-NLS-1$
			span1.appendChild(doc.createTextNode(c));
			line.appendChild(span1);
			var span2 = util.createElement(doc, "span"); //$NON-NLS-1$
			span2.style.fontStyle = "italic"; //$NON-NLS-1$
			span2.appendChild(doc.createTextNode(c));
			line.appendChild(span2);
			var span3 = util.createElement(doc, "span"); //$NON-NLS-1$
			span3.style.fontWeight = "bold"; //$NON-NLS-1$
			span3.appendChild(doc.createTextNode(c));
			line.appendChild(span3);
			var span4 = util.createElement(doc, "span"); //$NON-NLS-1$
			span4.style.fontWeight = "bold"; //$NON-NLS-1$
			span4.style.fontStyle = "italic"; //$NON-NLS-1$
			span4.appendChild(doc.createTextNode(c));
			line.appendChild(span4);
			_parent.appendChild(line);
			var lineRect = line.getBoundingClientRect();
			var spanRect1 = span1.getBoundingClientRect();
			var spanRect2 = span2.getBoundingClientRect();
			var spanRect3 = span3.getBoundingClientRect();
			var spanRect4 = span4.getBoundingClientRect();
			var h1 = spanRect1.bottom - spanRect1.top;
			var h2 = spanRect2.bottom - spanRect2.top;
			var h3 = spanRect3.bottom - spanRect3.top;
			var h4 = spanRect4.bottom - spanRect4.top;
			var fontStyle = 0;
			var invalid = (lineRect.bottom - lineRect.top) <= 0;
			var lineHeight = Math.max(1, lineRect.bottom - lineRect.top);
			if (h2 > h1) {
				fontStyle = 1;
			}
			if (h3 > h2) {
				fontStyle = 2;
			}
			if (h4 > h3) {
				fontStyle = 3;
			}
			var style;
			if (fontStyle !== 0) {
				style = {style: {}};
				if ((fontStyle & 1) !== 0) {
					style.style.fontStyle = "italic"; //$NON-NLS-1$
				}
				if ((fontStyle & 2) !== 0) {
					style.style.fontWeight = "bold"; //$NON-NLS-1$
				}
			}
			var trim = getLineTrim(line);
			_parent.removeChild(line);
			
			// calculate pad and scroll width
			var pad = getPadding(this._viewDiv);
			var div1 = util.createElement(doc, "div"); //$NON-NLS-1$
			div1.style.position = "fixed"; //$NON-NLS-1$
			div1.style.left = "-1000px"; //$NON-NLS-1$
			div1.style.paddingLeft = pad.left + "px"; //$NON-NLS-1$
			div1.style.paddingTop = pad.top + "px"; //$NON-NLS-1$
			div1.style.paddingRight = pad.right + "px"; //$NON-NLS-1$
			div1.style.paddingBottom = pad.bottom + "px"; //$NON-NLS-1$
			div1.style.width = "100px"; //$NON-NLS-1$
			div1.style.height = "100px"; //$NON-NLS-1$
			var div2 = util.createElement(doc, "div"); //$NON-NLS-1$
			div2.style.width = "100%"; //$NON-NLS-1$
			div2.style.height = "100%"; //$NON-NLS-1$
			div1.appendChild(div2);
			_parent.appendChild(div1);
			var rect1 = div1.getBoundingClientRect();
			var rect2 = div2.getBoundingClientRect();
			var scrollWidth = 0;
			if (!this._singleMode && !this._noScroll) {
				div1.style.overflow = 'hidden'; //$NON-NLS-1$
				div2.style.height = "200px"; //$NON-NLS-1$
				var w1 = div1.clientWidth;
				div1.style.overflow = 'scroll'; //$NON-NLS-1$
				var w2 = div1.clientWidth;
				scrollWidth = w1 - w2;
			}
			_parent.removeChild(div1);
			pad = {
				left: rect2.left - rect1.left,
				top: rect2.top - rect1.top,
				right: rect1.right - rect2.right,
				bottom: rect1.bottom - rect2.bottom
			};
			var wrapWidth = 0, marginWidth = 0, charWidth = 0;
			if (!invalid) {
				div1 = util.createElement(doc, "div"); //$NON-NLS-1$
				div1.style.position = "fixed"; //$NON-NLS-1$
				div1.style.left = "-1000px"; //$NON-NLS-1$
				_parent.appendChild(div1);
				div1.innerHTML = newArray(2).join("a"); //$NON-NLS-1$
				rect1 = div1.getBoundingClientRect();
				charWidth = Math.ceil(rect1.right - rect1.left);
				if (this._wrapOffset || this._marginOffset) {
					div1.innerHTML = newArray(this._wrapOffset + 1 + (util.isWebkit ? 0 : 1)).join(" "); //$NON-NLS-1$
					rect1 = div1.getBoundingClientRect();
					wrapWidth = Math.ceil(rect1.right - rect1.left);
					div1.innerHTML = newArray(this._marginOffset + 1).join(" "); //$NON-NLS-1$
					rect2 = div1.getBoundingClientRect();
					marginWidth = Math.ceil(rect2.right - rect2.left);
				}
				_parent.removeChild(div1);
			}
			return {
				lineHeight: lineHeight,
				largestFontStyle: style,
				lineTrim: trim,
				viewPadding: pad,
				scrollWidth: scrollWidth,
				wrapWidth: wrapWidth,
				marginWidth: marginWidth,
				charWidth: charWidth,
				invalid: invalid
			};
		},
		_cancelAnimation: function() {
			if (this._animation) {
				this._animation.stop();
				this._animation = null;
			}
		},
		_clearSelection: function (direction) {
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (direction === "next") { //$NON-NLS-1$
					selection.start = selection.end;
				} else {
					selection.end = selection.start;
				}
			});
			this._setSelection(selections, true);
			return true;
		},
		_commitIME: function (insertText) {
			if (this._imeOffset === -1) { return; }
			var model = this._model;
			var lineIndex = model.getLineAtOffset(this._imeOffset);
			var lineStart = model.getLineStart(lineIndex);
			var line = this._getLineNode(lineIndex);
			if (!insertText) {
				// make the state of the IME match the state the view expects it be in
				// when the view commits the text and IME also need to be committed
				// this can be accomplished by changing the focus around
				this._scrollDiv.focus();
				this._clientDiv.focus();
				
				var newText = this._getDOMText(line).text;
				var oldText = model.getLine(lineIndex);
				var start = this._imeOffset - lineStart;
				var end = start + newText.length - oldText.length;
				if (start !== end) {
					insertText = newText.substring(start, end);
				}
			}
			this._imeOffset = -1;
			if (insertText) {
				if (!this._doContent(insertText) && !util.isWebkit) {
					line.lineRemoved = true;
					this._queueUpdate();
				}
			}
		},
		_createActions: function () {
			this.addKeyMode(new mKeyModes.DefaultKeyMode(this));
			//1 to 1, no duplicates
			var that = this;
			this._actions = {
				"noop": {defaultHandler: function() {return that._doNoop();}}, //$NON-NLS-1$

				"lineUp": {defaultHandler: function(data) {return that._doLineUp(merge(data,{select: false}));}, actionDescription: {name: messages.lineUp}}, //$NON-NLS-1$
				"lineDown": {defaultHandler: function(data) {return that._doLineDown(merge(data,{select: false}));}, actionDescription: {name: messages.lineDown}}, //$NON-NLS-1$
				"lineStart": {defaultHandler: function(data) {return that._doHome(merge(data,{select: false, ctrl:false}));}, actionDescription: {name: messages.lineStart}}, //$NON-NLS-1$
				"lineEnd": {defaultHandler: function(data) {return that._doEnd(merge(data,{select: false, ctrl:false}));}, actionDescription: {name: messages.lineEnd}}, //$NON-NLS-1$
				"charPrevious": {defaultHandler: function(data) {return that._doCursorPrevious(merge(data,{select: false, unit:"character"}));}, actionDescription: {name: messages.charPrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"charNext": {defaultHandler: function(data) {return that._doCursorNext(merge(data,{select: false, unit:"character"}));}, actionDescription: {name: messages.charNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"pageUp": {defaultHandler: function(data) {return that._doPageUp(merge(data,{select: false}));}, actionDescription: {name: messages.pageUp}}, //$NON-NLS-1$
				"pageDown": {defaultHandler: function(data) {return that._doPageDown(merge(data,{select: false}));}, actionDescription: {name: messages.pageDown}}, //$NON-NLS-1$
				"scrollPageUp": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "pageUp"}));}, actionDescription: {name: messages.scrollPageUp}}, //$NON-NLS-1$ //$NON-NLS-1$
				"scrollPageDown": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "pageDown"}));}, actionDescription: {name: messages.scrollPageDown}}, //$NON-NLS-1$ //$NON-NLS-1$
				"scrollLineUp": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "lineUp"}));}, actionDescription: {name: messages.scrollLineUp}}, //$NON-NLS-1$ //$NON-NLS-1$
				"scrollLineDown": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "lineDown"}));}, actionDescription: {name: messages.scrollLineDown}}, //$NON-NLS-1$ //$NON-NLS-1$
				"wordPrevious": {defaultHandler: function(data) {return that._doCursorPrevious(merge(data,{select: false, unit:"word"}));}, actionDescription: {name: messages.wordPrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"wordNext": {defaultHandler: function(data) {return that._doCursorNext(merge(data,{select: false, unit:"word"}));}, actionDescription: {name: messages.wordNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"textStart": {defaultHandler: function(data) {return that._doHome(merge(data,{select: false, ctrl:true}));}, actionDescription: {name: messages.textStart}}, //$NON-NLS-1$
				"textEnd": {defaultHandler: function(data) {return that._doEnd(merge(data,{select: false, ctrl:true}));}, actionDescription: {name: messages.textEnd}}, //$NON-NLS-1$
				"scrollTextStart": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "textStart"}));}, actionDescription: {name: messages.scrollTextStart}}, //$NON-NLS-1$ //$NON-NLS-1$
				"scrollTextEnd": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "textEnd"}));}, actionDescription: {name: messages.scrollTextEnd}}, //$NON-NLS-1$ //$NON-NLS-1$
				"centerLine": {defaultHandler: function(data) {return that._doScroll(merge(data,{type: "centerLine"}));}, actionDescription: {name: messages.centerLine}}, //$NON-NLS-1$ //$NON-NLS-1$
				
				"selectLineUp": {defaultHandler: function(data) {return that._doLineUp(merge(data,{select: true}));}, actionDescription: {name: messages.selectLineUp}}, //$NON-NLS-1$
				"selectLineDown": {defaultHandler: function(data) {return that._doLineDown(merge(data,{select: true}));}, actionDescription: {name: messages.selectLineDown}}, //$NON-NLS-1$
				"selectWholeLineUp": {defaultHandler: function(data) {return that._doLineUp(merge(data,{select: true, wholeLine: true}));}, actionDescription: {name: messages.selectWholeLineUp}}, //$NON-NLS-1$
				"selectWholeLineDown": {defaultHandler: function(data) {return that._doLineDown(merge(data,{select: true, wholeLine: true}));}, actionDescription: {name: messages.selectWholeLineDown}}, //$NON-NLS-1$
				"selectLineStart": {defaultHandler: function(data) {return that._doHome(merge(data,{select: true, ctrl:false}));}, actionDescription: {name: messages.selectLineStart}}, //$NON-NLS-1$
				"selectLineEnd": {defaultHandler: function(data) {return that._doEnd(merge(data,{select: true, ctrl:false}));}, actionDescription: {name: messages.selectLineEnd}}, //$NON-NLS-1$
				"selectCharPrevious": {defaultHandler: function(data) {return that._doCursorPrevious(merge(data,{select: true, unit:"character"}));}, actionDescription: {name: messages.selectCharPrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"selectCharNext": {defaultHandler: function(data) {return that._doCursorNext(merge(data,{select: true, unit:"character"}));}, actionDescription: {name: messages.selectCharNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"selectPageUp": {defaultHandler: function(data) {return that._doPageUp(merge(data,{select: true}));}, actionDescription: {name: messages.selectPageUp}}, //$NON-NLS-1$
				"selectPageDown": {defaultHandler: function(data) {return that._doPageDown(merge(data,{select: true}));}, actionDescription: {name: messages.selectPageDown}}, //$NON-NLS-1$
				"selectWordPrevious": {defaultHandler: function(data) {return that._doCursorPrevious(merge(data,{select: true, unit:"word"}));}, actionDescription: {name: messages.selectWordPrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"selectWordNext": {defaultHandler: function(data) {return that._doCursorNext(merge(data,{select: true, unit:"word"}));}, actionDescription: {name: messages.selectWordNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"selectTextStart": {defaultHandler: function(data) {return that._doHome(merge(data,{select: true, ctrl:true}));}, actionDescription: {name: messages.selectTextStart}}, //$NON-NLS-1$
				"selectTextEnd": {defaultHandler: function(data) {return that._doEnd(merge(data,{select: true, ctrl:true}));}, actionDescription: {name: messages.selectTextEnd}}, //$NON-NLS-1$

				"deletePrevious": {defaultHandler: function(data) {return that._doBackspace(merge(data,{unit:"character"}));}, actionDescription: {name: messages.deletePrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"deleteNext": {defaultHandler: function(data) {return that._doDelete(merge(data,{unit:"character"}));}, actionDescription: {name: messages.deleteNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"deleteWordPrevious": {defaultHandler: function(data) {return that._doBackspace(merge(data,{unit:"word"}));}, actionDescription: {name: messages.deleteWordPrevious}}, //$NON-NLS-1$ //$NON-NLS-1$
				"deleteWordNext": {defaultHandler: function(data) {return that._doDelete(merge(data,{unit:"word"}));}, actionDescription: {name: messages.deleteWordNext}}, //$NON-NLS-1$ //$NON-NLS-1$
				"deleteLineStart": {defaultHandler: function(data) {return that._doBackspace(merge(data,{unit: "line"}));}, actionDescription: {name: messages.deleteLineStart}}, //$NON-NLS-1$ //$NON-NLS-1$
				"deleteLineEnd": {defaultHandler: function(data) {return that._doDelete(merge(data,{unit: "line"}));}, actionDescription: {name: messages.deleteLineEnd}}, //$NON-NLS-1$ //$NON-NLS-1$
				"tab": {defaultHandler: function(data) {return that._doTab(merge(data,{}));}, actionDescription: {name: messages.tab}}, //$NON-NLS-1$
				"shiftTab": {defaultHandler: function(data) {return that._doShiftTab(merge(data,{}));}, actionDescription: {name: messages.shiftTab}}, //$NON-NLS-1$
				"enter": {defaultHandler: function(data) {return that._doEnter(merge(data,{}));}, actionDescription: {name: messages.enter}}, //$NON-NLS-1$
				"enterNoCursor": {defaultHandler: function(data) {return that._doEnter(merge(data,{noCursor:true}));}, actionDescription: {name: messages.enterNoCursor}}, //$NON-NLS-1$
				"escape": {defaultHandler: function(data) {return that._doEscape(merge(data,{}));}, actionDescription: {name: messages.escape}}, //$NON-NLS-1$
				"selectAll": {defaultHandler: function(data) {return that._doSelectAll(merge(data,{}));}, actionDescription: {name: messages.selectAll}}, //$NON-NLS-1$
				"copy": {defaultHandler: function(data) {return that._doCopy(merge(data,{}));}, actionDescription: {name: messages.copy}}, //$NON-NLS-1$
				"cut": {defaultHandler: function(data) {return that._doCut(merge(data,{}));}, actionDescription: {name: messages.cut}}, //$NON-NLS-1$
				"paste": {defaultHandler: function(data) {return that._doPaste(merge(data,{}));}, actionDescription: {name: messages.paste}}, //$NON-NLS-1$
				
				"uppercase": {defaultHandler: function(data) {return that._doCase(merge(data,{type: "upper"}));}, actionDescription: {name: messages.uppercase}}, //$NON-NLS-1$ //$NON-NLS-1$
				"lowercase": {defaultHandler: function(data) {return that._doCase(merge(data,{type: "lower"}));}, actionDescription: {name: messages.lowercase}}, //$NON-NLS-1$ //$NON-NLS-1$
				"capitalize": {defaultHandler: function(data) {return that._doCase(merge(data,{unit: "word", type: "capitalize"}));}, actionDescription: {name: messages.capitalize}}, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
				"reversecase": {defaultHandler: function(data) {return that._doCase(merge(data,{type: "reverse"}));}, actionDescription: {name: messages.reversecase}}, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-1$
				
				"toggleOverwriteMode": {defaultHandler: function(data) {return that._doOverwriteMode(merge(data,{}));}, actionDescription: {name: messages.toggleOverwriteMode}}, //$NON-NLS-1$
				"toggleTabMode": {defaultHandler: function(data) {return that._doTabMode(merge(data,{}));}, actionDescription: {name: messages.toggleTabMode}}, //$NON-NLS-1$
				"toggleWrapMode": {defaultHandler: function(data) {return that._doWrapMode(merge(data,{}));}, actionDescription: {name: messages.toggleWrapMode}} //$NON-NLS-1$
			};
		},
		_createRulerParent: function(doc, className) {
			var div = util.createElement(doc, "div"); //$NON-NLS-1$
			div.className = className;
			div.tabIndex = -1;
			div.style.overflow = "hidden"; //$NON-NLS-1$
			div.style.MozUserSelect = "none"; //$NON-NLS-1$
			div.style.WebkitUserSelect = "none"; //$NON-NLS-1$
			div.style.position = "absolute"; //$NON-NLS-1$
			div.style.top = "0px"; //$NON-NLS-1$
			div.style.bottom = "0px"; //$NON-NLS-1$
			div.style.cursor = "default"; //$NON-NLS-1$
			div.style.display = "none"; //$NON-NLS-1$
			div.setAttribute("aria-hidden", "true"); //$NON-NLS-1$ //$NON-NLS-2$
			this._rootDiv.appendChild(div);
			return div;
		},
		_createRuler: function(ruler, index) {
			if (!this._clientDiv) { return; }
			var rulerParent = this._getRulerParent(ruler);
			if (!rulerParent) { return; }
			if (rulerParent !== this._marginDiv || this._marginOffset) {
				rulerParent.style.display = "block"; //$NON-NLS-1$
			}
			rulerParent.rulerWidth = undefined;
			var div = util.createElement(rulerParent.ownerDocument, "div"); //$NON-NLS-1$
			div._ruler = ruler;
			ruler.node = div;
			div.rulerChanged = true;
			div.style.position = "relative"; //$NON-NLS-1$
			div.style.cssFloat = "left"; //$NON-NLS-1$
			div.style.styleFloat = "left"; //$NON-NLS-1$
			div.style.outline = "none"; //$NON-NLS-1$
			if (index === undefined || index < 0 || index >= rulerParent.children.length) {
				rulerParent.appendChild(div);
			} else {
				var sibling = rulerParent.firstChild;
				while (sibling && index-- > 0) {
					sibling = sibling.nextSibling;
				}
				rulerParent.insertBefore(div, sibling);
			}
		},
		_createSelectionDiv: function() {
			var div = util.createElement(this._parent.ownerDocument, "div"); //$NON-NLS-1$
			div.className = "textviewSelection"; //$NON-NLS-1$
			div.style.position = "absolute"; //$NON-NLS-1$
			div.style.borderWidth = "0px"; //$NON-NLS-1$
			div.style.margin = "0px"; //$NON-NLS-1$
			div.style.padding = "0px"; //$NON-NLS-1$
			div.style.outline = "none"; //$NON-NLS-1$
			div.style.width = "0px"; //$NON-NLS-1$
			div.style.height = "0px"; //$NON-NLS-1$
			div.style.zIndex = "0"; //$NON-NLS-1$
			return div;
		},
		_createView: function() {
			if (this._clientDiv) { return; }
			var _parent = this._parent;
			while (_parent.hasChildNodes()) { _parent.removeChild(_parent.lastChild); }

			var doc = _parent.ownerDocument;
			var rootDiv = util.createElement(doc, "div"); //$NON-NLS-1$
			this._rootDiv = rootDiv;
			rootDiv.tabIndex = -1;
			rootDiv.style.position = "relative"; //$NON-NLS-1$
			rootDiv.style.overflow = "hidden"; //$NON-NLS-1$
			rootDiv.style.width = "100%"; //$NON-NLS-1$
			rootDiv.style.height = "100%"; //$NON-NLS-1$
			rootDiv.style.overflow = "hidden"; //$NON-NLS-1$
			rootDiv.style.WebkitTextSizeAdjust = "100%"; //$NON-NLS-1$
			rootDiv.setAttribute("role", "application"); //$NON-NLS-1$ //$NON-NLS-2$
			rootDiv.setAttribute("aria-label", "Text View"); //$NON-NLS-1$
			_parent.appendChild(rootDiv);
			
			var leftDiv = this._createRulerParent(doc, "textviewLeftRuler"); //$NON-NLS-1$
			this._leftDiv = leftDiv;

			var viewDiv = util.createElement(doc, "div"); //$NON-NLS-1$
			viewDiv.className = "textviewScroll"; //$NON-NLS-1$
			this._viewDiv = viewDiv;
			viewDiv.tabIndex = -1;
			viewDiv.style.position = "absolute"; //$NON-NLS-1$
			viewDiv.style.top = "0px"; //$NON-NLS-1$
			viewDiv.style.bottom = "0px"; //$NON-NLS-1$
			viewDiv.style.borderWidth = "0px"; //$NON-NLS-1$
			viewDiv.style.margin = "0px"; //$NON-NLS-1$
			viewDiv.style.outline = "none"; //$NON-NLS-1$
			viewDiv.style.background = "transparent"; //$NON-NLS-1$
			rootDiv.appendChild(viewDiv);
			
			var rightDiv = this._createRulerParent(doc, "textviewRightRuler"); //$NON-NLS-1$
			this._rightDiv = rightDiv;
			if (document.dir == "rtl") { /* ACGC */
				rightDiv.style.left = "0px"; //$NON-NLS-1$
			}else{
				rightDiv.style.right = "0px"; //$NON-NLS-1$	  
			}

			var innerRightDiv = this._createRulerParent(doc, "textviewInnerRightRuler"); //$NON-NLS-1$
			this._innerRightDiv = innerRightDiv;
			innerRightDiv.style.zIndex = "1"; //$NON-NLS-1$

			var scrollDiv = util.createElement(doc, "div"); //$NON-NLS-1$
			this._scrollDiv = scrollDiv;
			scrollDiv.style.margin = "0px"; //$NON-NLS-1$
			scrollDiv.style.borderWidth = "0px"; //$NON-NLS-1$
			scrollDiv.style.padding = "0px"; //$NON-NLS-1$
			viewDiv.appendChild(scrollDiv);
			
			var marginDiv = this._marginDiv = this._createRulerParent(doc, "textviewMarginRuler"); //$NON-NLS-1$
			marginDiv.style.zIndex = "4"; //$NON-NLS-1$
			
			if (!util.isIE && !util.isIOS) {
				var clipDiv = util.createElement(doc, "div"); //$NON-NLS-1$
				this._clipDiv = clipDiv;
				clipDiv.style.position = "absolute"; //$NON-NLS-1$
				clipDiv.style.overflow = "hidden"; //$NON-NLS-1$
				clipDiv.style.margin = "0px"; //$NON-NLS-1$
				clipDiv.style.borderWidth = "0px"; //$NON-NLS-1$
				clipDiv.style.padding = "0px"; //$NON-NLS-1$
				clipDiv.style.background = "transparent"; //$NON-NLS-1$
				rootDiv.appendChild(clipDiv);
				
				var clipScrollDiv = util.createElement(doc, "div"); //$NON-NLS-1$
				this._clipScrollDiv = clipScrollDiv;
				clipScrollDiv.style.position = "absolute"; //$NON-NLS-1$
				clipScrollDiv.style.height = "1px"; //$NON-NLS-1$
				clipScrollDiv.style.top = "-1000px"; //$NON-NLS-1$
				clipScrollDiv.style.background = "transparent"; //$NON-NLS-1$
				clipDiv.appendChild(clipScrollDiv);
			}

			var clientDiv = util.createElement(doc, "div"); //$NON-NLS-1$
			clientDiv.className = "textviewContent"; //$NON-NLS-1$
			this._clientDiv = clientDiv;
			clientDiv.tabIndex = 0;
			clientDiv.style.position = "absolute"; //$NON-NLS-1$
			clientDiv.style.borderWidth = "0px"; //$NON-NLS-1$
			clientDiv.style.margin = "0px"; //$NON-NLS-1$
			clientDiv.style.padding = "0px"; //$NON-NLS-1$
			clientDiv.style.outline = "none"; //$NON-NLS-1$
			clientDiv.style.zIndex = "1"; //$NON-NLS-1$
			clientDiv.style.WebkitUserSelect = "text"; //$NON-NLS-1$
			clientDiv.setAttribute("spellcheck", "false"); //$NON-NLS-1$ //$NON-NLS-2$
			if (util.isIOS || util.isAndroid) {
				clientDiv.style.WebkitTapHighlightColor = "transparent"; //$NON-NLS-1$
			}
			(this._clipDiv || rootDiv).appendChild(clientDiv);
			
			this._setFullSelection(this._fullSelection, true);
			
			if (util.isIOS || util.isAndroid) {
				var vScrollDiv = util.createElement(doc, "div"); //$NON-NLS-1$
				this._vScrollDiv = vScrollDiv;
				vScrollDiv.style.position = "absolute"; //$NON-NLS-1$
				vScrollDiv.style.borderWidth = "1px"; //$NON-NLS-1$
				vScrollDiv.style.borderColor = "white"; //$NON-NLS-1$
				vScrollDiv.style.borderStyle = "solid"; //$NON-NLS-1$
				vScrollDiv.style.borderRadius = "4px"; //$NON-NLS-1$
				vScrollDiv.style.backgroundColor = "black"; //$NON-NLS-1$
				vScrollDiv.style.opacity = "0.5"; //$NON-NLS-1$
				vScrollDiv.style.margin = "0px"; //$NON-NLS-1$
				vScrollDiv.style.padding = "0px"; //$NON-NLS-1$
				vScrollDiv.style.outline = "none"; //$NON-NLS-1$
				vScrollDiv.style.zIndex = "3"; //$NON-NLS-1$
				vScrollDiv.style.width = "8px"; //$NON-NLS-1$
				vScrollDiv.style.display = "none"; //$NON-NLS-1$
				rootDiv.appendChild(vScrollDiv);
				var hScrollDiv = util.createElement(doc, "div"); //$NON-NLS-1$
				this._hScrollDiv = hScrollDiv;
				hScrollDiv.style.position = "absolute"; //$NON-NLS-1$
				hScrollDiv.style.borderWidth = "1px"; //$NON-NLS-1$
				hScrollDiv.style.borderColor = "white"; //$NON-NLS-1$
				hScrollDiv.style.borderStyle = "solid"; //$NON-NLS-1$
				hScrollDiv.style.borderRadius = "4px"; //$NON-NLS-1$
				hScrollDiv.style.backgroundColor = "black"; //$NON-NLS-1$
				hScrollDiv.style.opacity = "0.5"; //$NON-NLS-1$
				hScrollDiv.style.margin = "0px"; //$NON-NLS-1$
				hScrollDiv.style.padding = "0px"; //$NON-NLS-1$
				hScrollDiv.style.outline = "none"; //$NON-NLS-1$
				hScrollDiv.style.zIndex = "3"; //$NON-NLS-1$
				hScrollDiv.style.height = "8px"; //$NON-NLS-1$
				hScrollDiv.style.display = "none"; //$NON-NLS-1$
				rootDiv.appendChild(hScrollDiv);
			}

			if (util.isFirefox && !clientDiv.setCapture) {
				var overlayDiv = util.createElement(doc, "div"); //$NON-NLS-1$
				this._overlayDiv = overlayDiv;
				overlayDiv.style.position = clientDiv.style.position;
				overlayDiv.style.borderWidth = clientDiv.style.borderWidth;
				overlayDiv.style.margin = clientDiv.style.margin;
				overlayDiv.style.padding = clientDiv.style.padding;
				overlayDiv.style.cursor = "text"; //$NON-NLS-1$
				overlayDiv.style.zIndex = "2"; //$NON-NLS-1$
				(this._clipDiv || rootDiv).appendChild(overlayDiv);
			}
			clientDiv.contentEditable = "true"; //$NON-NLS-1$
			this._setWrapMode(this._wrapMode, true);
			this._setReadOnly(this._readonly);
			this._setThemeClass(this._themeClass, true);
			this._setTabSize(this._tabSize, true);
			this._setMarginOffset(this._marginOffset, true);
			this._hookEvents();
			bidiUtils.initInputField(clientDiv);
			var rulers = this._rulers;
			for (var i=0; i<rulers.length; i++) {
				this._createRuler(rulers[i]);
			}
			this._update();
			// Detect when the parent is attached to the DOM or display
			var that = this;
			function checkDOMReady() {
				if (!that._rootDiv) { return; }
				that.update(true);
				if (that._metrics.invalid) {
					that._getWindow().setTimeout(function() {
						checkDOMReady();
					}, 100);
				}
			}
			DOMReady(doc, rootDiv, "textview", checkDOMReady); //$NON-NLS-1$
		},
		_defaultOptions: function() {
			return {
				parent: {value: undefined, update: null},
				model: {value: undefined, update: this.setModel},
				scrollAnimation: {value: 0, update: null},
				readonly: {value: false, update: this._setReadOnly},
				fullSelection: {value: true, update: this._setFullSelection},
				tabMode: { value: true, update: null },
				tabSize: {value: 8, update: this._setTabSize},
				expandTab: {value: false, update: null},
				singleMode: {value: false, update: this._setSingleMode},
				noScroll: {value: false, update: this._setNoScroll},
				overwriteMode: { value: false, update: this._setOverwriteMode },
				blockCursorVisible: { value: false, update: this._setBlockCursor},
				marginOffset: {value: 0, update: this._setMarginOffset},
				wrapOffset: {value: 0, update: this._setWrapOffset},
				wrapMode: {value: false, update: this._setWrapMode},
				wrappable: {value: false, update: null},
				undoStack: {value: null, update: this._setUndoStack},
				theme: {value: mTextTheme.TextTheme.getTheme(), update: this._setTheme},
				themeClass: {value: undefined, update: this._setThemeClass}
			};
		},
		_destroyRuler: function(ruler) {
			var rulerParent = this._getRulerParent(ruler);
			if (rulerParent) {
				var div = rulerParent.firstChild;
				while (div) {
					if (div._ruler === ruler) {
						div._ruler = undefined;
						rulerParent.removeChild(div);
						if (rulerParent.children.length === 0 && (rulerParent !== this._marginDiv || !this._marginOffset)) {
							rulerParent.style.display = "none"; //$NON-NLS-1$
						}
						rulerParent.rulerWidth = undefined;
						break;
					}
					div = div.nextSibling;
				}
			}
		},
		_destroyView: function() {
			var clientDiv = this._clientDiv;
			if (!clientDiv) { return; }
			this._setGrab(null);
			this._unhookEvents();

			/* Destroy timers */
			var win = this._getWindow();
			if (this._autoScrollTimerID) {
				win.clearTimeout(this._autoScrollTimerID);
				this._autoScrollTimerID = null;
			}
			if (this._updateTimer) {
				win.clearTimeout(this._updateTimer);
				this._updateTimer = null;
			}
			if (this._calculateLHTimer) {
				win.clearTimeout(this._calculateLHTimer);
				this._calculateLHTimer = null;
			}
			if (this._cursorTimer) {
				win.clearInterval(this._cursorTimer);
				this._cursorTimer = null;
			}
			if (this._imeTimeout) {
				win.clearInterval(this._imeTimeout);
				this._imeTimeout = null;
			}
			
			var rootDiv = this._rootDiv;
			rootDiv.parentNode.removeChild(rootDiv);

			/* Destroy DOM */
			this._domSelection = null;
			this._clipboardDiv = null;
			this._rootDiv = null;
			this._scrollDiv = null;
			this._viewDiv = null;
			this._clipDiv = null;
			this._clipScrollDiv = null;
			this._clientDiv = null;
			this._overlayDiv = null;
			this._leftDiv = null;
			this._rightDiv = null;
			this._innerRightDiv = null;
			this._marginDiv = null;
			this._cursorDiv = null;
			this._vScrollDiv = null;
			this._hScrollDiv = null;
		},
		_doAutoScroll: function (direction, x, y) {
			this._autoScrollDir = direction;
			this._autoScrollX = x;
			this._autoScrollY = y;
			if (!this._autoScrollTimerID) {
				this._autoScrollTimer();
			}
		},
		_endAutoScroll: function () {
			if (this._autoScrollTimerID) {
				var win = this._getWindow();
				win.clearTimeout(this._autoScrollTimerID);
			}
			this._autoScrollDir = undefined;
			this._autoScrollTimerID = undefined;
		},
		_fixCaret: function() {
			var clientDiv = this._clientDiv;
			if (clientDiv) {
				var hasFocus = this._hasFocus;
				this._ignoreFocus = true;
				if (hasFocus) { clientDiv.blur(); }
				clientDiv.contentEditable = false;
				clientDiv.contentEditable = true;
				if (hasFocus) { clientDiv.focus(); }
				this._ignoreFocus = false;
			}
		},
		_getBaseText: function(start, end) {
			var model = this._model;
			/* This is the only case the view access the base model, alternatively the view could use a event to application to customize the text */
			if (model.getBaseModel) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
				model = model.getBaseModel();
			}
			return model.getText(start, end);
		},
		_getBottomIndex: function (fullyVisible) {
			var child = this._bottomChild;
			if (fullyVisible && this._getClientHeight() > this._getLineHeight()) {
				var rect = child.getBoundingClientRect();
				var clientRect = this._clientDiv.getBoundingClientRect();
				if (rect.bottom > clientRect.bottom) {
					child = this._getLinePrevious(child) || child;
				}
			}
			return child.lineIndex;
		},
		_getBlockSelections: function(selections, lineIndex, pt) {
			var model = this._model;
			selections = selections.filter(function(sel) { return !sel._editing; });
			var firstLine = model.getLineAtOffset(this._blockSelection.getAnchor()), lastLine;
			if (lineIndex > firstLine) {
				lastLine = lineIndex;
			} else {
				lastLine = firstLine;
				firstLine = lineIndex;
			}
			for (var l = firstLine; l <= lastLine; l++) {
				var line = this._getLine(l);
				var o1 = line.getOffset(pt.x, 1);
				var o2 = line.getOffset(this._blockSelection._docX, 1);
				line.destroy();
				if (o1 === o2 && o1 === model.getLineEnd(l)) continue;
				var caret = o1 < o2;
				var sel = new Selection(caret ? o1 : o2, caret ? o2 : o1, caret);
				sel._editing = true;
				selections.push(sel);
			}
			return selections;
		},
		_getBoundsAtOffset: function(offset) {
			var model = this._model;
			var line = this._getLine(model.getLineAtOffset(offset));
			var result = line.getBoundingClientRect(offset);
			var linePixel = this._getLinePixel(line.lineIndex);
			result.top += linePixel;
			result.bottom += linePixel;
			line.destroy();
			return result;
		},
		_getClientHeight: function() {
			var viewPad = this._getViewPadding();
			return Math.max(0, this._viewDiv.clientHeight - viewPad.top - viewPad.bottom);
		},
		_getInnerRightWidth: function() {
			var innerRightWidth = this._innerRightDiv.rulerWidth;
			if (innerRightWidth === undefined) {
				var innerRightRect = this._innerRightDiv.getBoundingClientRect();
				this._innerRightDiv.rulerWidth = innerRightWidth = innerRightRect.right - innerRightRect.left;
			}
			return innerRightWidth;
		},
		_getClientWidth: function() {
			var viewPad = this._getViewPadding();
			var innerRightWidth = this._getInnerRightWidth();
			return Math.max(0, this._viewDiv.clientWidth - viewPad.left - viewPad.right - innerRightWidth);
		},
		_getClipboardText: function (evt, handler) {
			// IE
			var win = this._getWindow();
			var clipboardData = win.clipboardData;
			// WebKit and Firefox > 21
			if (!clipboardData && evt) {
				clipboardData = evt.clipboardData;
			}
			function convert(wholeText) {
				var clipboardText = [];
				convertDelimiter(wholeText, function(t) {clipboardText.push(t);}, null);
				if (handler) { handler(clipboardText); }
				return clipboardText;
			}
			if (clipboardData) {
				return convert(clipboardData.getData(util.isIE ? "Text" : "text/plain")); //$NON-NLS-1$"//$NON-NLS-2$
			}
			if (util.isElectron && !evt) {
				return convert(window.__electron.clipboard.readText());
			}
			if (util.isFirefox) {
				this._ignoreFocus = true;
				var clipboardDiv = this._clipboardDiv;
				var doc = this._rootDiv.ownerDocument;
				if (!clipboardDiv) {
					clipboardDiv = util.createElement(doc, "div"); //$NON-NLS-1$
					this._clipboardDiv = clipboardDiv;
					clipboardDiv.style.position = "fixed"; //$NON-NLS-1$
					clipboardDiv.style.whiteSpace = "pre"; //$NON-NLS-1$
					clipboardDiv.style.left = "-1000px"; //$NON-NLS-1$
					this._rootDiv.appendChild(clipboardDiv);
				}
				clipboardDiv.innerHTML = "<pre contenteditable=''></pre>"; //$NON-NLS-1$
				clipboardDiv.firstChild.focus();
				var that = this;
				var _getText = function() {
					var noteText = that._getTextFromElement(clipboardDiv);
					clipboardDiv.innerHTML = "";
					return convert(noteText);
				};
				
				/* Try execCommand first. Works on firefox with clipboard permission. */
				var result = false;
				this._ignorePaste = true;

				/* Do not try execCommand if middle-click is used, because if we do, we get the clipboard text, not the primary selection text. */
				if (!util.isLinux || this._lastMouseButton !== 2) {
					try {
						result = doc.execCommand("paste", false, null); //$NON-NLS-1$
					} catch (ex) {
						/* Firefox can throw even when execCommand() works, see bug 362835. */
						result = clipboardDiv.childNodes.length > 1 || clipboardDiv.firstChild && clipboardDiv.firstChild.childNodes.length > 0;
					}
				}
				this._ignorePaste = false;
				if (!result) {
					/* Try native paste in DOM, works for firefox during the paste event. */
					if (evt) {
						win.setTimeout(function() {
							that.focus();
							_getText();
							that._ignoreFocus = false;
						}, 0);
						return null;
					} else {
						/* no event and no clipboard permission, paste can't be performed */
						this.focus();
						this._ignoreFocus = false;
						return "";
					}
				}
				this.focus();
				this._ignoreFocus = false;
				return _getText();
			}
			return "";
		},
		_getDOMText: function(child, offsetNode) {
			return child._line.getText(offsetNode);
		},
		_getTextFromElement: function(element) {
			var doc = element.ownerDocument;
			var win = doc.defaultView;
			if (!win.getSelection) {
				return element.innerText || element.textContent;
			}

			var newRange = doc.createRange();
			newRange.selectNode(element);

			var selection = win.getSelection();
			var oldRanges = [], i;
			for (i = 0; i < selection.rangeCount; i++) {
				oldRanges.push(selection.getRangeAt(i));
			}

			this._ignoreSelect = true;
			selection.removeAllRanges();
			selection.addRange(newRange);

			var text = selection.toString();

			selection.removeAllRanges();
			for (i = 0; i < oldRanges.length; i++) {
				selection.addRange(oldRanges[i]);
			}

			this._ignoreSelect = false;
			return text;
		},
		_getViewPadding: function() {
			return this._metrics.viewPadding;
		},
		_getLine: function(lineIndex) {
			var child = this._getLineNode(lineIndex);
			if (child && !child.lineChanged && !child.lineRemoved) {
				return child._line;
			}
			return new TextLine(this, lineIndex);
		},
		_getLineHeight: function(lineIndex, calculate) {
			if (lineIndex !== undefined && this._lineHeight) {
				var lineHeight = this._lineHeight[lineIndex];
				if (lineHeight) { return lineHeight; }
				if (calculate || calculate === undefined) {
					var height = this._lineHeight[lineIndex] = this._calculateLineHeight(lineIndex);
					return height;
				}
			}
			return this._metrics.lineHeight;
		},
		_getLineNode: function (lineIndex) {
			var clientDiv = this._clientDiv;
			var child = clientDiv.firstChild;
			while (child) {
				if (lineIndex === child.lineIndex) {
					return child;
				}
				child = child.nextSibling;
			}
			return undefined;
		},
		_getLineNext: function (lineNode) {
			var node = lineNode ? lineNode.nextSibling : this._clientDiv.firstChild;
			while (node && (node.lineIndex === -1 || !node._line)) {
				node = node.nextSibling;
			}
			return node;
		},
		_getLinePrevious: function (lineNode) {
			var node = lineNode ? lineNode.previousSibling : this._clientDiv.lastChild;
			while (node && (node.lineIndex === -1 || !node._line)) {
				node = node.previousSibling;
			}
			return node;
		},
		_getLinePixel: function(lineIndex) {
			lineIndex = Math.min(Math.max(0, lineIndex), this._model.getLineCount());
			if (this._lineHeight) {
				var topIndex = this._getTopIndex();
				var pixel = -this._topIndexY + this._getScroll().y, i;
				if (lineIndex > topIndex) {
					for (i = topIndex; i < lineIndex; i++) {
						pixel += this._getLineHeight(i);
					}
				} else {
					for (i = topIndex - 1; i >= lineIndex; i--) {
						pixel -= this._getLineHeight(i);
					}
				}
				return pixel;
			}
			var lineHeight = this._getLineHeight();
			return lineHeight * lineIndex;
		},
		/**
		 * @name _getLineIndex
		 * @description Returns the line index closest to the given text view relative location.  Will return -1
		 * 				if restrictToValidLines is true and y location is outside of text lines.
		 * @function
		 * @private
		 * @param y location to search
		 * @param restrictToValidLines whether to return -1 if the location is outside a valid line, otherwise return the closest valid line index
		 * @returns returns The line index closest to the location or -1 if restrictToValidLines is true and location is outside text area
		 */
		_getLineIndex: function(y, restrictToValidLines) {
			var lineHeight, lineIndex = 0;
			var lineCount = this._model.getLineCount();
			if (this._lineHeight) {
				lineIndex = this._getTopIndex();
				var pixel = -this._topIndexY + this._getScroll().y;
				if (y !== pixel) {
					if (y < pixel) {
						while (y < pixel && lineIndex > 0) {
							y += this._getLineHeight(--lineIndex);
						}
					} else {
						lineHeight = this._getLineHeight(lineIndex);
						while (y - lineHeight >= pixel && lineIndex < lineCount - 1) {
							y -= lineHeight;
							lineHeight = this._getLineHeight(++lineIndex);
						}
					}
				}
			} else {
				lineHeight = this._getLineHeight();
				lineIndex = Math.floor(y / lineHeight);
			}
			if (restrictToValidLines){
				if (lineCount === 0 || lineIndex < 0 || lineIndex > (lineCount-1)){
					return -1;
				}
			}
			return Math.max(0, Math.min(lineCount - 1, lineIndex));
		},
		_getRulerParent: function(ruler) {
			switch (ruler.getLocation()) {
				case "left": return this._leftDiv; //$NON-NLS-1$
				case "right": return this._rightDiv; //$NON-NLS-1$
				case "innerRight": return this._innerRightDiv; //$NON-NLS-1$
				case "margin": return this._marginDiv; //$NON-NLS-1$
			}
			return null;
		},
		_getScroll: function(cancelAnimation) {
			if (cancelAnimation === undefined || cancelAnimation) {
				this._cancelAnimation();
			}
			var viewDiv = this._viewDiv;
			return {x: viewDiv.scrollLeft, y: viewDiv.scrollTop};
		},
		_getSelection: function () {
			return (Array.isArray(this._selection) ? this._selection[0] : this._selection).clone();
		},
		_getSelections: function () {
			return (Array.isArray(this._selection) ? this._selection : [this._selection]).map(function(s) {
				return s.clone();
			});
		},
		_getTopIndex: function (fullyVisible) {
			var child = this._topChild;
			if (fullyVisible && this._getClientHeight() > this._getLineHeight()) {
				var rect = child.getBoundingClientRect();
				var viewPad = this._getViewPadding();
				var viewRect = this._viewDiv.getBoundingClientRect();
				if (rect.top < viewRect.top + viewPad.top) {
					child = this._getLineNext(child) || child;
				}
			}
			return child.lineIndex;
		},
		_hookEvents: function() {
			var that = this;
			this._modelListener = {
				/** @private */
				onChanging: function(modelChangingEvent) {
					that._onModelChanging(modelChangingEvent);
				},
				/** @private */
				onChanged: function(modelChangedEvent) {
					that._onModelChanged(modelChangedEvent);
				}
			};
			this._model.addEventListener("preChanging", this._modelListener.onChanging); //$NON-NLS-1$
			this._model.addEventListener("postChanged", this._modelListener.onChanged); //$NON-NLS-1$
			
			this._themeListener = {
				onChanged: function() {
					that._setThemeClass(that._themeClass);
				}
			};
			this._theme.addEventListener("ThemeChanged", this._themeListener.onChanged); //$NON-NLS-1$
			
			var handlers = this._handlers = [];
			var clientDiv = this._clientDiv, viewDiv = this._viewDiv, rootDiv = this._rootDiv;
			var topNode = this._overlayDiv || clientDiv;
			var doc = clientDiv.ownerDocument;
			var win = this._getWindow();
			var grabNode = util.isIE ? doc : win;
			handlers.push({target: win, type: "resize", handler: function(e) { return that._handleResize(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "blur", handler: function(e) { return that._handleBlur(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "focus", handler: function(e) { return that._handleFocus(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: viewDiv, type: "focus", handler: function() { clientDiv.focus(); }}); //$NON-NLS-1$
			var textModel = that.getModel();
			if(textModel && typeof textModel.deferScroll === "function") {//If textModel is extended to defer the scroll handler for segmental contents
				var deferredHandler = textModel.deferScroll(that, that._handleScroll.bind(that));
				handlers.push({target: viewDiv, type: "scroll", handler: function(e) { return deferredHandler(e ? e : win.event);}}); //$NON-NLS-0$
			} else {
				handlers.push({target: viewDiv, type: "scroll", handler: function(e) { return that._handleScroll(e ? e : win.event);}}); //$NON-NLS-1$
			}
			handlers.push({target: clientDiv, type: "textInput", handler: function(e) { return that._handleTextInput(e ? e : win.event); }}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "keydown", handler: function(e) { return that._handleKeyDown(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "keypress", handler: function(e) { return that._handleKeyPress(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "keyup", handler: function(e) { return that._handleKeyUp(e ? e : win.event);}}); //$NON-NLS-1$
			if (util.isIE) {
				handlers.push({target: doc, type: "keyup", handler: function(e) { return that._handleDocKeyUp(e ? e : win.event);}}); //$NON-NLS-1$
			}
			handlers.push({target: clientDiv, type: "contextmenu", handler: function(e) { return that._handleContextMenu(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "copy", handler: function(e) { return that._handleCopy(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "cut", handler: function(e) { return that._handleCut(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: clientDiv, type: "paste", handler: function(e) { return that._handlePaste(e ? e : win.event);}}); //$NON-NLS-1$
			handlers.push({target: doc, type: "selectionchange", handler: function(e) { return that._handleSelectionChange(e ? e : win.event); }}); //$NON-NLS-1$
			if (util.isIOS || util.isAndroid) {
				handlers.push({target: clientDiv, type: "touchstart", handler: function(e) { return that._handleTouchStart(e ? e : win.event); }}); //$NON-NLS-1$
				handlers.push({target: clientDiv, type: "touchmove", handler: function(e) { return that._handleTouchMove(e ? e : win.event); }}); //$NON-NLS-1$
				handlers.push({target: clientDiv, type: "touchend", handler: function(e) { return that._handleTouchEnd(e ? e : win.event); }}); //$NON-NLS-1$
			} else {
				handlers.push({target: clientDiv, type: "selectstart", handler: function(e) { return that._handleSelectStart(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: clientDiv, type: "mousedown", handler: function(e) { return that._handleMouseDown(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: clientDiv, type: "mouseover", handler: function(e) { return that._handleMouseOver(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: clientDiv, type: "mouseout", handler: function(e) { return that._handleMouseOut(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: grabNode, type: "mouseup", handler: function(e) { return that._handleMouseUp(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: grabNode, type: "mousemove", handler: function(e) { return that._handleMouseMove(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: rootDiv, type: "mousedown", handler: function(e) { return that._handleRootMouseDown(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: rootDiv, type: "mouseup", handler: function(e) { return that._handleRootMouseUp(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "dragstart", handler: function(e) { return that._handleDragStart(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "drag", handler: function(e) { return that._handleDrag(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "dragend", handler: function(e) { return that._handleDragEnd(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "dragenter", handler: function(e) { return that._handleDragEnter(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "dragover", handler: function(e) { return that._handleDragOver(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "dragleave", handler: function(e) { return that._handleDragLeave(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: topNode, type: "drop", handler: function(e) { return that._handleDrop(e ? e : win.event);}}); //$NON-NLS-1$
				handlers.push({target: this._clientDiv, type: util.isFirefox > 26 ? "wheel" : util.isFirefox ? "DOMMouseScroll" : "mousewheel", handler: function(e) { return that._handleMouseWheel(e ? e : win.event); }}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
				if (this._clipDiv) {
					handlers.push({target: this._clipDiv, type: util.isFirefox > 26 ? "wheel" : util.isFirefox ? "DOMMouseScroll" : "mousewheel", handler: function(e) { return that._handleMouseWheel(e ? e : win.event); }}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
				}
				if (util.isFirefox && (!util.isWindows || util.isFirefox >= 15)) {
					var MO = win.MutationObserver || win.MozMutationObserver;
					if (MO) {
						this._mutationObserver = new MO(function(mutations) { that._handleDataModified(mutations); });
						this._mutationObserver.observe(clientDiv, {subtree: true, characterData: true});
					} else {
						handlers.push({target: this._clientDiv, type: "DOMCharacterDataModified", handler: function (e) { return that._handleDataModified(e ? e : win.event); }}); //$NON-NLS-1$
					}
				}
				if ((util.isFirefox && (!util.isWindows || util.isFirefox >= 15)) || util.isIE || util.isWebkit) {
					handlers.push({target: this._clientDiv, type: "compositionstart", handler: function (e) { return that._handleCompositionStart(e ? e : win.event); }}); //$NON-NLS-1$
					handlers.push({target: this._clientDiv, type: "compositionend", handler: function (e) { return that._handleCompositionEnd(e ? e : win.event); }}); //$NON-NLS-1$
					handlers.push({target: this._clientDiv, type: "compositionupdate", handler: function (e) { return that._handleCompositionUpdate(e ? e : win.event); }}); //$NON-NLS-1$
				}
				if (this._overlayDiv) {
					handlers.push({target: this._overlayDiv, type: "mousedown", handler: function(e) { return that._handleMouseDown(e ? e : win.event);}}); //$NON-NLS-1$
					handlers.push({target: this._overlayDiv, type: "mouseover", handler: function(e) { return that._handleMouseOver(e ? e : win.event);}}); //$NON-NLS-1$
					handlers.push({target: this._overlayDiv, type: "mouseout", handler: function(e) { return that._handleMouseOut(e ? e : win.event);}}); //$NON-NLS-1$
					handlers.push({target: this._overlayDiv, type: "contextmenu", handler: function(e) { return that._handleContextMenu(e ? e : win.event); }}); //$NON-NLS-1$
				}
				if (!this._isW3CEvents) {
					handlers.push({target: this._clientDiv, type: "dblclick", handler: function(e) { return that._handleDblclick(e ? e : win.event); }}); //$NON-NLS-1$
				}
			}

			this._hookRulerEvents(this._leftDiv, handlers);
			this._hookRulerEvents(this._rightDiv, handlers);
			this._hookRulerEvents(this._innerRightDiv, handlers);
			this._hookRulerEvents(this._marginDiv, handlers);
			
			for (var i=0; i<handlers.length; i++) {
				var h = handlers[i];
				addHandler(h.target, h.type, h.handler, h.capture);
			}
		},
		_hookRulerEvents: function(div, handlers) {
			if (!div) { return; }
			var that = this;
			var win = this._getWindow();
			if (util.isIE) {
				handlers.push({target: div, type: "selectstart", handler: function() {return false;}}); //$NON-NLS-1$
			}
			handlers.push({target: div, type: util.isFirefox > 26 ? "wheel" : util.isFirefox ? "DOMMouseScroll" : "mousewheel", handler: function(e) { return that._handleMouseWheel(e ? e : win.event); }}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-3$
			handlers.push({target: div, type: "click", handler: function(e) { that._handleRulerEvent(e ? e : win.event); }}); //$NON-NLS-1$
			handlers.push({target: div, type: "dblclick", handler: function(e) { that._handleRulerEvent(e ? e : win.event); }}); //$NON-NLS-1$
			handlers.push({target: div, type: "mousemove", handler: function(e) { that._handleRulerEvent(e ? e : win.event); }}); //$NON-NLS-1$
			handlers.push({target: div, type: "mouseover", handler: function(e) { that._handleRulerEvent(e ? e : win.event); }}); //$NON-NLS-1$
			handlers.push({target: div, type: "mouseout", handler: function(e) { that._handleRulerEvent(e ? e : win.event); }}); //$NON-NLS-1$
		},
		_getWindow: function() {
			return getWindow(this._parent.ownerDocument);
		},
		_ignoreEvent: function(e) {
			var node = e.target;
			while (node && node !== this._clientDiv) {
				if (node.ignore) { return true; }
				node = node.parentNode;
			}
			return false;
		},
		_init: function(options) {
			var _parent = options.parent;
			if (typeof(_parent) === "string") { //$NON-NLS-1$
				_parent = (options.document || document).getElementById(_parent);
			}
			if (!_parent) { throw new Error("no parent"); } //$NON-NLS-1$
			options.parent = _parent;
			options.model = options.model || new mTextModel.TextModel();
			var defaultOptions = this._defaultOptions();
			for (var option in defaultOptions) {
				if (defaultOptions.hasOwnProperty(option)) {
					var value;
					if (options[option] !== undefined) {
						value = options[option];
					} else {
						value = defaultOptions[option].value;
					}
					this["_" + option] = value; //$NON-NLS-1$
				}
			}
			this._keyModes = [];
			this._rulers = [];
			this._selection = [new Selection(0, 0, false)];
			this._linksVisible = false;
			this._redrawCount = 0;
			this._maxLineWidth = 0;
			this._maxLineIndex = -1;
			this._ignoreSelect = true;
			this._ignoreFocus = false;
			this._hasFocus = false;
			this._dragOffset = -1;
			this._isRangeRects = (!util.isIE || util.isIE >= 9) && typeof _parent.ownerDocument.createRange().getBoundingClientRect === "function"; //$NON-NLS-1$
			this._isW3CEvents = _parent.addEventListener;

			/* Auto scroll */
			this._autoScrollX = null;
			this._autoScrollY = null;
			this._autoScrollTimerID = null;
			this._AUTO_SCROLL_RATE = 50;
			this._grabControl = null;
			this._moseMoveClosure  = null;
			this._mouseUpClosure = null;
			
			/* Double click */
			this._lastMouseX = 0;
			this._lastMouseY = 0;
			this._lastMouseTime = 0;
			this._clickCount = 0;
			this._clickTime = 250;
			this._clickDist = 5;
			this._isMouseDown = false;
			this._doubleClickSelection = null;
			
			/* Scroll */
			this._hScroll = 0;
			this._vScroll = 0;

			/* IME */
			this._imeOffset = -1;
			
			/* Create elements */
			this._createActions();
			this._createView();
		},
		_checkOverlayScroll: function() {
			if (util.isMac && util.isWebkit) {
				if (!this._metrics.invalid && this._metrics.scrollWidth === 0) {
					var viewDiv = this._viewDiv;
					var overlay = this._isOverOverlayScroll();
					if (overlay.vertical || overlay.horizontal) {
						viewDiv.style.pointerEvents = ""; //$NON-NLS-1$
					} else {
						viewDiv.style.pointerEvents = "none"; //$NON-NLS-1$
					}
				}
			}	
		},
		_isOverOverlayScroll: function() {
			var scrollShowing = Date.now() - this._lastScrollTime < 200;
			if (!scrollShowing) {
				return {};
			}
			var rect = this._viewDiv.getBoundingClientRect();
			var x = this._lastMouseMoveX;
			var y = this._lastMouseMoveY;
			var overlayScrollWidth = 15;
			return {
				vertical: rect.top <= y && y < rect.bottom && rect.right - overlayScrollWidth <= x && x < rect.right,
				horizontal: rect.bottom - overlayScrollWidth <= y && y < rect.bottom && rect.left <= x && x < rect.right
			};
		},
		_startUndo: function() {
			if (this._undoStack) {
				var that = this;
				this._compoundChange = this._undoStack.startCompoundChange({
					end: function() {
						that._compoundChange = null;
					}
				});
			}
		},
		_endUndo: function() {
			if (this._undoStack) {
				this._undoStack.endCompoundChange();
			}
		},
		_modifyContent: function(e, caretAtEnd, show, callback) {
			if (this._readonly && !e._code) {
				return false;
			}
			e.type = "Verify"; //$NON-NLS-1$
			var oldStart = e.start = e.selection[0].start;
			var oldEnd = e.end = e.selection[0].end;
			this.onVerify(e);
			if (oldStart !== e.start) e.selection[0].start = e.start;
			if (oldEnd !== e.end) e.selection[0].end = e.end;

			if (e.text === null || e.text === undefined) { return false; }
			
			if (e.selection.length > 1) this.setRedraw(false);
			
			var undo = this._compoundChange;
			if (undo) {
				if (!Selection.compare(this._getSelections(), undo.owner.selection)) {
					this._endUndo();
					if (e.selection.length > 1) this._startUndo();
				}
			} else {
				if (e.selection.length > 1) this._startUndo();
			}
			
			var model = this._model;
			try {
				if (e._ignoreDOMSelection) { this._ignoreDOMSelection = true; }
				var offset = 0, i = 0;
				e.selection.forEach(function(selection) {
					selection.start += offset;
					selection.end += offset;
					var text = Array.isArray(e.text) ? e.text[i] : e.text;
					model.setText(text, selection.start, selection.end);
					offset += (selection.start - selection.end) + text.length;
					selection.setCaret(caretAtEnd ? selection.start + text.length : selection.start);
					i++;
				});
			} finally {
				if (e._ignoreDOMSelection) { this._ignoreDOMSelection = false; }
			}
			this._setSelection(e.selection, show, true, callback);
			
			undo = this._compoundChange;
			if (undo) undo.owner.selection = e.selection;
			
			if (e.selection.length > 1) this.setRedraw(true);

			this.onModify({type: "Modify"}); //$NON-NLS-1$
			return true;
		},
		_onModelChanged: function(modelChangedEvent) {
			modelChangedEvent.type = "ModelChanged"; //$NON-NLS-1$
			this.onModelChanged(modelChangedEvent);
			modelChangedEvent.type = "Changed"; //$NON-NLS-1$
			var start = modelChangedEvent.start;
			var addedCharCount = modelChangedEvent.addedCharCount;
			var removedCharCount = modelChangedEvent.removedCharCount;
			var addedLineCount = modelChangedEvent.addedLineCount;
			var removedLineCount = modelChangedEvent.removedLineCount;
			
			var selections = this._getSelections();
			selections.forEach(function(selection) {
				if (selection.end > start) {
					if (selection.end > start && selection.start < start + removedCharCount) {
						// selection intersects replaced text. set caret behind text change
						selection.setCaret(start + addedCharCount);
					} else {
						// move selection to keep same text selected
						selection.start +=  addedCharCount - removedCharCount;
						selection.end +=  addedCharCount - removedCharCount;
					}
				}
			});
			this._setSelection(selections, false, false);
			
			var model = this._model;
			var startLine = model.getLineAtOffset(start);
			var child = this._getLineNext();
			while (child) {
				var lineIndex = child.lineIndex;
				if (startLine <= lineIndex && lineIndex <= startLine + removedLineCount) {
					if (startLine === lineIndex && !child.modelChangedEvent && !child.lineRemoved) {
						child.modelChangedEvent = modelChangedEvent;
						child.lineChanged = true;
					} else {
						child.lineRemoved = true;
						child.lineChanged = false;
						child.modelChangedEvent = null;
					}
				}
				if (lineIndex > startLine + removedLineCount) {
					child.lineIndex = lineIndex + addedLineCount - removedLineCount;
					child._line.lineIndex = child.lineIndex;
				}
				child = this._getLineNext(child);
			}
			if (this._lineHeight) {
				var args = [startLine, removedLineCount].concat(newArray(addedLineCount));
				Array.prototype.splice.apply(this._lineHeight, args);
			}
			if (!this._wrapMode) {
				if (startLine <= this._maxLineIndex && this._maxLineIndex <= startLine + removedLineCount) {
					this._checkMaxLineIndex = this._maxLineIndex;
					this._maxLineIndex = -1;
					this._maxLineWidth = 0;
				}
			}
			this._update();
		},
		_onModelChanging: function(modelChangingEvent) {
			modelChangingEvent.type = "ModelChanging"; //$NON-NLS-1$
			this.onModelChanging(modelChangingEvent);
			modelChangingEvent.type = "Changing"; //$NON-NLS-1$
		},
		_queueUpdate: function() {
			if (this._updateTimer || this._ignoreQueueUpdate) { return; }
			var that = this;
			var win = this._getWindow();
			this._updateTimer = win.setTimeout(function() { 
				that._updateTimer = null;
				that._update();
			}, 0);
		},
		_rangesToSelections: function(ranges) {
			var selections = [];
			var charCount = this._model.getCharCount();
			ranges.forEach(function(range) {
				var selection;
				if (range instanceof Selection) {
					selection = range.clone();
				} else {
					var start = range.start;
					var end = range.end;
					var caret = start > end;
					if (caret) {
						var tmp = start;
						start = end;
						end = tmp;
					}
					start = Math.max(0, Math.min (start, charCount));
					end = Math.max(0, Math.min (end, charCount));
					selection = new Selection(start, end, caret);
				}
				selections.push(selection);
			});
			return selections;
		},
		_resetLineHeight: function(startLine, endLine) {
			if (this._wrapMode || this._variableLineHeight) {
				if (startLine !== undefined && endLine !== undefined) {
					for (var i = startLine; i < endLine; i++) {
						this._lineHeight[i] = undefined;
					}
				} else {
					this._lineHeight = newArray(this._model.getLineCount());
				}
				this._calculateLineHeightTimer();
			} else {
				this._lineHeight = null;
			}
		},
		_resetLineWidth: function() {
			var clientDiv = this._clientDiv;
			if (clientDiv) {
				var child = clientDiv.firstChild;
				while (child) {
					child.lineWidth = undefined;
					child = child.nextSibling;
				}
			}
		},
		_reset: function() {
			this._maxLineIndex = -1;
			this._maxLineWidth = 0;
			this._topChild = null;
			this._bottomChild = null;
			this._topIndexY = 0;
			this._variableLineHeight = false;
			this._resetLineHeight();
			this._setSelection(new Selection(0, 0, false), false, false);
			if (this._viewDiv) {
				this._viewDiv.scrollLeft = 0;
				this._viewDiv.scrollTop = 0;
			}
			var clientDiv = this._clientDiv;
			if (clientDiv) {
				var child = clientDiv.firstChild;
				while (child) {
					child.lineRemoved = true;
					child = child.nextSibling;
				}
				/*
				* Bug in Firefox.  For some reason, the caret does not show after the
				* view is refreshed.  The fix is to toggle the contentEditable state and
				* force the clientDiv to loose and receive focus if it is focused.
				*/
				if (util.isFirefox < 13) {
					this._fixCaret ();
				}
			}
		},
		_scrollViewAnimated: function (pixelX, pixelY, callback) {
			var win = this._getWindow();
			if (callback && this._scrollAnimation) {
				var that = this;
				this._animation = new Animation({
					window: win,
					duration: this._scrollAnimation,
					curve: [pixelY, 0],
					onAnimate: function(x) {
						var deltaY = pixelY - Math.floor(x);
						that._scrollView (0, deltaY);
						pixelY -= deltaY;
					},
					onEnd: function() {
						that._animation = null;
						that._scrollView (pixelX, pixelY);
						if (callback) {
							win.setTimeout(callback, 0);
						}
					}
				});
				this._animation.play();
			} else {
				this._scrollView (pixelX, pixelY);
				if (callback) {
					win.setTimeout(callback, 0);
				}
			}
		}, 
		_scrollView: function (pixelX, pixelY) {
			/*
			* Always set _ensureCaretVisible to false so that the view does not scroll
			* to show the caret when scrollView is not called from showCaret().
			*/
			this._ensureCaretVisible = false;
			
			/*
			* Scrolling is done only by setting the scrollLeft and scrollTop fields in the
			* view div. This causes an update from the scroll event. In some browsers 
			* this event is asynchronous and forcing update page to run synchronously
			* leads to redraw problems. 
			* On Chrome 11, the view redrawing at times when holding PageDown/PageUp key.
			* On Firefox 4 for Linux, the view redraws the first page when holding 
			* PageDown/PageUp key, but it will not redraw again until the key is released.
			*/
			var viewDiv = this._viewDiv;
			if (pixelX) { viewDiv.scrollLeft += pixelX; }
			if (pixelY) { viewDiv.scrollTop += pixelY; }
		},
		_setClipboardText: function (text, evt) {
			if (util.isElectron && !evt) {
				window.__electron.clipboard.writeText(text);
				return true;
			}
			var clipboardText;
			// IE
			var win = this._getWindow();
			var clipboardData = win.clipboardData;
			// WebKit and Firefox > 21
			if (!clipboardData && evt) {
				clipboardData = evt.clipboardData;
			}
			if (clipboardData) {
				clipboardText = [];
				convertDelimiter(text, function(t) {clipboardText.push(t);}, function() {clipboardText.push(util.platformDelimiter);});
				/*
				* Note that setData() succeeds on Firefox > 21 and WebKit, but the return value is not a boolean like IE.
				*/
				var success = clipboardData.setData(util.isIE ? "Text" : "text/plain", clipboardText.join("")); //$NON-NLS-1$ //$NON-NLS-2$
				if (success || (evt && (util.isFirefox > 21 || util.isWebkit))) {
					return true;
				}
				if (!evt) return false;
			}
			var doc = this._parent.ownerDocument;
			var child = util.createElement(doc, "pre"); //$NON-NLS-1$
			child.style.position = "fixed"; //$NON-NLS-1$
			child.style.left = "-1000px"; //$NON-NLS-1$
			convertDelimiter(text, 
				function(t) {
					child.appendChild(doc.createTextNode(t));
				}, 
				function() {
					child.appendChild(util.createElement(doc, "br")); //$NON-NLS-1$
				}
			);
			child.appendChild(doc.createTextNode(" ")); //$NON-NLS-1$
			this._clientDiv.appendChild(child);
			var range = doc.createRange();
			range.setStart(child.firstChild, 0);
			range.setEndBefore(child.lastChild);
			var sel = win.getSelection();
			if (sel.rangeCount > 0) { sel.removeAllRanges(); }
			sel.addRange(range);
			var that = this;
			/** @ignore */
			var cleanup = function() {
				if (child && child.parentNode === that._clientDiv) {
					that._clientDiv.removeChild(child);
				}
				that._updateDOMSelection();
			};
			var result = false;
			/* 
			* Try execCommand first, it works on firefox with clipboard permission,
			* chrome 5, safari 4.
			*/
			this._ignoreCopy = true;
			try {
				result = doc.execCommand("copy", false, null); //$NON-NLS-1$
			} catch (e) {}
			this._ignoreCopy = false;
			if (!result) {
				if (evt) {
					win.setTimeout(cleanup, 0);
					return false;
				}
			}
			/* no event and no permission, copy cannot be done */
			cleanup();
			return true;
		},
		_setGrab: function (target) {
			if (target === this._grabControl) { return; }
			if (target) {
				if (target.setCapture) { target.setCapture(); }
				this._grabControl = target;
			} else {
				if (this._grabControl.releaseCapture) { this._grabControl.releaseCapture(); }
				this._grabControl = null;
			}
		},
		_setLinksVisible: function(visible) {
			if (this._linksVisible === visible) { return; }
			this._linksVisible = visible;
			/*
			* Feature in IE.  The client div looses focus and does not regain it back
			* when the content editable flag is reset. The fix is to remember that it
			* had focus when the flag is cleared and give focus back to the div when
			* the flag is set.
			*/
			if (util.isIE && visible) {
				this._hadFocus = this._hasFocus;
			}
			var clientDiv = this._clientDiv;
			clientDiv.contentEditable = !visible;
			if (this._hadFocus && !visible) {
				clientDiv.focus();
			}
			if (this._overlayDiv) {
				this._overlayDiv.style.zIndex = visible ? "-1" : "1"; //$NON-NLS-1$ //$NON-NLS-2$
			}
			var line = this._getLineNext();
			while (line) {
				line._line.updateLinks();
				line = this._getLineNext(line);
			}
			this._updateDOMSelection();
		},
		_setSelection: function (selection, _scroll, update, callback, pageScroll, add, preserveCursorX) {
			if (selection) {
				if (update === undefined) { update = true; }
				var oldSelection = this._getSelections(), newSelection;
				if (Array.isArray(selection)) {
					newSelection = selection;
				} else if (add) {
					newSelection = oldSelection.concat([selection]);
				} else {
					newSelection = [selection];
				}
				this._selection = Selection.merge(newSelection);
				
				if (!preserveCursorX) {
					newSelection.forEach(function(sel) {
						sel._columnX = -1;
					});
				}

				/* 
				* Always showCaret(), even when the selection is not changing, to ensure the
				* caret is visible. Note that some views do not scroll to show the caret during
				* keyboard navigation when the selection does not chanage. For example, line down
				* when the caret is already at the last line.
				*/
				if (_scroll !== false) { /*update = !*/this._showCaret(false, callback, _scroll, pageScroll); }
				
				/* 
				* Sometimes the browser changes the selection 
				* as result of method calls or "leaked" events. 
				* The fix is to set the visual selection even
				* when the logical selection is not changed.
				*/
				if (update) { this._updateDOMSelection(); }
				
				if (!Selection.compare(oldSelection, newSelection)) {
					var e = {
						type: "Selection", //$NON-NLS-1$
						oldValue: Selection.convert(oldSelection),
						newValue: Selection.convert(newSelection)
					};
					this.onSelection(e);
				}
			}
		},
		_setSelectionTo: function (x, y, down, extent, add, drag) {
			var model = this._model;
			var selections = this._getSelections();
			var pt = this.convert({x: x, y: y}, "page", "document"); //$NON-NLS-1$ //$NON-NLS-2$
			var lineIndex = this._getLineIndex(pt.y);
			var line = this._getLine(lineIndex);
			var offset = line.getOffset(pt.x, pt.y - this._getLinePixel(lineIndex));
			if (drag && !extent) {
				if (Selection.contains(selections, offset)) {
					this._dragOffset = offset;
					line.destroy();
					return false;
				}
			}
			if (this._blockSelection) {
				selections = this._getBlockSelections(selections, lineIndex, pt);
			} else {
				var selection;
				if (!down) {
					selection = Selection.editing(selections);
				} else if (extent) {
					selection = selections[selections.length - 1];
					selection._editing = true;
				} else {
					selection = new Selection(0, 0);
					selection._editing = true;
					if (add) {
						selections.push(selection);
					} else {
						selections = [selection];
					}
					selection._docX = pt.x;
				}
				if (this._clickCount === 1) {
					selection.extend(offset);
					if (!extent) { selection.collapse(); }
				} else {
					var word = (this._clickCount & 1) === 0;
					var start, end;
					if (word) {
						if (this._doubleClickSelection) {
							if (offset >= this._doubleClickSelection.start) {
								start = this._doubleClickSelection.start;
								end = line.getNextOffset(offset, {unit:"wordend", count:1}); //$NON-NLS-1$
							} else {
								start = line.getNextOffset(offset, {unit:"word", count:-1}); //$NON-NLS-1$
								end = this._doubleClickSelection.end;
							}
						} else {
							start = line.getNextOffset(offset, {unit:"word", count:-1}); //$NON-NLS-1$
							end = line.getNextOffset(start, {unit:"wordend", count:1}); //$NON-NLS-1$
						}
					} else {
						if (this._doubleClickSelection) {
							var doubleClickLine = model.getLineAtOffset(this._doubleClickSelection.start);
							if (lineIndex >= doubleClickLine) {
								start = model.getLineStart(doubleClickLine);
								end = model.getLineEnd(lineIndex);
							} else {
								start = model.getLineStart(lineIndex);
								end = model.getLineEnd(doubleClickLine);
							}
						} else {
							start = model.getLineStart(lineIndex);
							end = model.getLineEnd(lineIndex);
						}
					}
					selection.setCaret(start);
					selection.extend(end);
				}
			}
			this._setSelection(selections, true, true, null, false);
			line.destroy();
			return true;
		},
		_setFullSelection: function(fullSelection, init) {
			this._fullSelection = fullSelection;
			if (util.isWebkit < 537.36) {
				this._fullSelection = fullSelection = true;
			}
			if (!this._domSelection) {
				this._domSelection = [];
				this._cursorVisible = true;
			}
			if (!init) {
				this._updateDOMSelection();
			}
		},
		_setBlockCursor: function (visible) {
			this._blockCursorVisible = visible;
			this._updateBlockCursorVisible();
		},
		_setOverwriteMode: function (overwrite) {
			this._overwriteMode = overwrite;
			this._updateBlockCursorVisible();
		},
		_updateBlockCursorVisible: function () {
			if (this._blockCursorVisible || this._overwriteMode) {
				if (!this._cursorDiv) {
					var viewDiv = this._viewDiv;
					var cursorDiv = util.createElement(viewDiv.ownerDocument, "div"); //$NON-NLS-1$
					cursorDiv.className = "textviewBlockCursor"; //$NON-NLS-1$
					this._cursorDiv = cursorDiv;
					cursorDiv.tabIndex = -1;
					cursorDiv.style.zIndex = "2"; //$NON-NLS-1$
					cursorDiv.style.color = "transparent"; //$NON-NLS-1$
					cursorDiv.style.position = "absolute"; //$NON-NLS-1$
					cursorDiv.style.pointerEvents = "none"; //$NON-NLS-1$
					cursorDiv.innerHTML = "&nbsp;"; //$NON-NLS-1$
					viewDiv.appendChild(cursorDiv);
					this._updateDOMSelection();
				}
			} else {
				if (this._cursorDiv) {
					this._cursorDiv.parentNode.removeChild(this._cursorDiv);
					this._cursorDiv = null;
				}
			}
		},
		_setMarginOffset: function(marginOffset, init) {
			this._marginOffset = marginOffset;
			this._marginDiv.style.display = marginOffset ? "block" : "none"; //$NON-NLS-1$ //$NON-NLS-2$
			if (!init) {
				this._metrics = this._calculateMetrics();
				this._queueUpdate();
			}
		},
		_setWrapOffset: function(wrapOffset, init) {
			this._wrapOffset = wrapOffset;
			if (!init) {
				this._metrics = this._calculateMetrics();
				this._queueUpdate();
			}
		},
		_setReadOnly: function (readOnly) {
			this._readonly = readOnly;
		},
		_setSingleMode: function (singleMode, init) {
			this._singleMode = singleMode;
			this._updateOverflow();
			this._updateStyle(init);
		},
		_setNoScroll: function (noScroll, init) {
			this._noScroll = noScroll;
			this._updateOverflow();
			this._updateStyle(init);
		},
		_setTabSize: function (tabSize, init) {
			this._tabSize = tabSize;
			this._customTabSize = undefined;
			var clientDiv = this._clientDiv;
			if (util.isOpera) {
				if (clientDiv) { clientDiv.style.OTabSize = this._tabSize+""; }
			} else if (util.isWebkit >= 537.1) {
				if (clientDiv) { clientDiv.style.tabSize = this._tabSize+""; }
			} else if (util.isFirefox >= 4) {
				if (clientDiv) {  clientDiv.style.MozTabSize = this._tabSize+""; }
			} else if (this._tabSize !== 8) {
				this._customTabSize = this._tabSize;
			}
			if (!init) {
				this.redrawLines();
				this._resetLineWidth();
			}
		},
		_setTheme: function(theme) {
			if (this._theme) {
				this._theme.removeEventListener("ThemeChanged", this._themeListener.onChanged); //$NON-NLS-1$
			}
			this._theme = theme;
			if (this._theme) {
				this._theme.addEventListener("ThemeChanged", this._themeListener.onChanged); //$NON-NLS-1$
			}
			this._setThemeClass(this._themeClass);
		},
		_setThemeClass: function (themeClass, init) {
			this._themeClass = themeClass;
			var viewContainerClass = "textview"; //$NON-NLS-1$
			var globalThemeClass = this._theme.getThemeClass();
			if (globalThemeClass) { viewContainerClass += " " + globalThemeClass; } //$NON-NLS-1$
			if (this._themeClass && globalThemeClass !== this._themeClass) { viewContainerClass += " " + this._themeClass; } //$NON-NLS-1$
			this._rootDiv.className = viewContainerClass;
			this._updateStyle(init);
		},
		_setUndoStack: function (undoStack) {
			this._undoStack = undoStack;
		},
		_setWrapMode: function (wrapMode, init) {
			this._wrapMode = wrapMode && this._wrappable;
			var clientDiv = this._clientDiv;
			if (this._wrapMode) {
				clientDiv.style.whiteSpace = "pre-wrap"; //$NON-NLS-1$
				clientDiv.style.wordWrap = "break-word"; //$NON-NLS-1$
			} else {
				clientDiv.style.whiteSpace = "pre"; //$NON-NLS-1$
				clientDiv.style.wordWrap = "normal"; //$NON-NLS-1$
			}
			this._updateOverflow();
			if (!init) {
				this.redraw();
				this._resetLineWidth();
			}
			this._resetLineHeight();
		},
		_showCaret: function (allSelection, callback, showOptions, pageScroll) {
			if (!this._clientDiv) { return; }
			if (this._redrawCount > 0) { return; }
			if (this._ignoreDOMSelection) { return; }
			if (this._imeOffset !== -1) return;
			var model = this._model;
			var selections = this._getSelections();
			var selection = Selection.editing(selections, this._autoScrollDir === "down"); //$NON-NLS-1$
			var _scroll = this._getScroll();
			var caret = selection.getCaret();
			var start = selection.start;
			var end = selection.end;
			var startLine = model.getLineAtOffset(start);
			var endLine = model.getLineAtOffset(end);
			var endInclusive = Math.max(Math.max(start, model.getLineStart(endLine)), end - 1);
			var clientWidth = this._getClientWidth();
			var clientHeight = this._getClientHeight();
			var minScroll = clientWidth / 4;
			var bounds = this._getBoundsAtOffset(caret === start ? start : endInclusive);
			var left = bounds.left;
			var right = bounds.right;
			var _top = bounds.top;
			var bottom = bounds.bottom;
			var selectionHeight = 0;
			var hasShowOptions = typeof showOptions === "object"; //$NON-NLS-1$
			if ((allSelection || hasShowOptions) && !selection.isEmpty()) {
				bounds = this._getBoundsAtOffset(caret === end ? start : endInclusive);
				selectionHeight = (bounds.bottom > bottom ? bounds.bottom : bottom) - (bounds.top < _top ? bounds.top : _top);
				if (allSelection) {
					if (bounds.top === _top) {
						if (caret === start) {
							right = left + Math.min(bounds.right - left, clientWidth);
						} else {
							left = right - Math.min(right - bounds.left, clientWidth);
						}
					} else {
						if (caret === start) {
							bottom = _top + Math.min(bounds.bottom - _top, clientHeight);
						} else {
							_top = bottom - Math.min(bottom - bounds.top, clientHeight);
						}
					}
				}
			}
			var pixelX = 0;
			if (left < _scroll.x) {
				pixelX = Math.min(left - _scroll.x, -minScroll);
			}
			if (right > _scroll.x + clientWidth) {
				pixelX = Math.max(right - _scroll.x - clientWidth, minScroll);
			}
			var pixelY = 0;
			if (_top < _scroll.y) {
				pixelY = _top - _scroll.y;
			} else if (bottom > _scroll.y + clientHeight) {
				pixelY = bottom - _scroll.y - clientHeight;
			}
			if (pageScroll) {
				if (pageScroll > 0) {
					if (pixelY > 0) {
						pixelY = Math.max(pixelY, pageScroll);
					}
				} else {
					if (pixelY < 0) {
						pixelY = Math.min(pixelY, pageScroll);
					}
				}
			}
			var alwaysScroll = hasShowOptions && showOptions.scrollPolicy === "always"; //$NON-NLS-1$
			if (pixelX !== 0 || pixelY !== 0 || alwaysScroll) {
				if (hasShowOptions) {
					var flag = pixelY > 0;
					if (pixelY === 0) {
						pixelY = _top - _scroll.y;
					}
					var viewAnchor = showOptions.viewAnchor;
					var selectionAnchor = showOptions.selectionAnchor;
					var viewAnchorOffset = Math.min(Math.max(0, showOptions.viewAnchorOffset || 0));
//					var selectionAnchorOffset = Math.min(Math.max(0, showOptions.selectionAnchorOffset || 0));
					if (viewAnchor === "top") { //$NON-NLS-1$
						pixelY += Math.floor(flag ? (1 - viewAnchorOffset) * clientHeight : -viewAnchorOffset * clientHeight);
					} else if (viewAnchor === "bottom") { //$NON-NLS-1$
						pixelY += Math.floor(flag ? viewAnchorOffset * clientHeight : -(1 - viewAnchorOffset) * clientHeight);
					} else if (viewAnchor === "center") { //$NON-NLS-1$
						pixelY += Math.floor(flag ? clientHeight / 2 + viewAnchorOffset * clientHeight : clientHeight / 2  - (1 - viewAnchorOffset) * clientHeight);
					} else { // caret is the default
						pixelY += Math.floor(flag ? viewAnchorOffset * clientHeight : -viewAnchorOffset * clientHeight);
					}
					if (startLine !== endLine) {
						if (selectionAnchor === "top" && caret !== start) { //$NON-NLS-1$
							pixelY += Math.floor(-selectionHeight);
						} else if (selectionAnchor === "bottom" && caret !== end) { //$NON-NLS-1$
							pixelY += Math.floor(selectionHeight);
						} else if (selectionAnchor === "center") { //$NON-NLS-1$
							pixelY += Math.floor(selectionHeight / 2);
						} else {
							// caret is the default
						}
					}
				} else if (pixelY !== 0 && typeof showOptions === "number") { //$NON-NLS-1$
					if (showOptions < 0) { showOptions = 0; }
					if (showOptions > 1) { showOptions = 1; }
					pixelY += Math.floor(pixelY > 0 ? showOptions * clientHeight : -showOptions * clientHeight);
				}
				this._scrollViewAnimated(pixelX, pixelY, callback);
				/*
				* When the view scrolls it is possible that one of the scrollbars can show over the caret.
				* Depending on the browser scrolling can be synchronous (Safari), in which case the change 
				* can be detected before showCaret() returns. When scrolling is asynchronous (most browsers), 
				* the detection is done during the next update page.
				*/
				if (clientHeight !== this._getClientHeight() || clientWidth !== this._getClientWidth()) {
					this._showCaret();
				} else {
					this._ensureCaretVisible = true;
				}
				return true;
			} else {
				if (callback) {
					callback();
				}
			}
			return false;
		},
		_startIME: function () {
			if (this._imeOffset !== -1) { return; }
			var selected = false;
			var selections = this._getSelections();
			for (var i=0; i<selections.length && !selected; i++) {
				selected = !selections[i].isEmpty();
			}
			if (selected) {
				this._modifyContent({text: "", selection: selections}, true);
			}
			this._imeOffset = selections[0].start;
		},
		_unhookEvents: function() {
			this._model.removeEventListener("preChanging", this._modelListener.onChanging); //$NON-NLS-1$
			this._model.removeEventListener("postChanged", this._modelListener.onChanged); //$NON-NLS-1$
			this._theme.removeEventListener("ThemeChanged", this._themeListener.onChanged); //$NON-NLS-1$
			this._modelListener = null;
			for (var i=0; i<this._handlers.length; i++) {
				var h = this._handlers[i];
				removeHandler(h.target, h.type, h.handler);
			}
			this._handlers = null;
			if (this._mutationObserver) {
				this._mutationObserver.disconnect();
			}
		},
		_updateDOMSelection: function () {
			if (this._redrawCount > 0) { return; }
			if (this._ignoreDOMSelection) { return; }
			if (this._imeOffset !== -1) return;
			if (!this._clientDiv) { return; }
			var selection = this._getSelections();
			var domSelection = this._domSelection, i;
			if (domSelection.length < selection.length) {
				for (i=domSelection.length; i<selection.length; i++) {
					domSelection.push(new DOMSelection(this));
				}
			} else if (domSelection.length > selection.length) {
				domSelection.splice(selection.length).forEach(function(s) {
					s.destroy();
				});
			}
			for (i=0; i<domSelection.length; i++) {
				domSelection[i].setPrimary(i === 0);
				domSelection[i].setSelection(selection[i]);
			}
			var win = this._getWindow();
			var that = this;
			if (domSelection.length > 1) {
				if (!this._cursorTimer) {
					this._cursorTimer = win.setInterval(function() {
						that._cursorVisible = !that._cursorVisible;
						that._domSelection.forEach(function(domSelection) { domSelection.update(); });
					}, 500);
				}
			} else {
				if (this._cursorTimer) {
					win.clearInterval(this._cursorTimer);
					this._cursorTimer = null;
				}
			}
		},
		_update: function(hScrollOnly) {
			if (this._redrawCount > 0) { return; }
			if (this._updateTimer) {
				var win = this._getWindow();
				win.clearTimeout(this._updateTimer);
				this._updateTimer = null;
				hScrollOnly = false;
			}
			var clientDiv = this._clientDiv;
			var viewDiv = this._viewDiv;
			if (!clientDiv) { return; }
			if (this._metrics.invalid) {
				this._ignoreQueueUpdate = true;
				this._updateStyle();
				this._ignoreQueueUpdate = false;
			}
			var model = this._model;
			var _scroll = this._getScroll(false);
			var viewPad = this._getViewPadding();
			var lineCount = model.getLineCount();
			var lineHeight = this._getLineHeight();
			var needUpdate = false;
			var hScroll = false, vScroll = false;
			var scrollbarWidth = this._metrics.scrollWidth;
			
			if (this._wrapMode) {
				clientDiv.style.width = (this._metrics.wrapWidth || this._getClientWidth()) + "px"; //$NON-NLS-1$
			}
			
			/*
			* topIndex - top line index of the view (maybe be particialy visible)
			* lineStart - top line minus one line (if any)
			* topIndexY - portion of the top line that is NOT visible.
			* top - topIndexY plus height of the line before top line (if any)
			*/
			var topIndex, lineStart, _top, topIndexY,
				leftWidth, leftRect,
				clientWidth, clientHeight, scrollWidth, scrollHeight,
				totalHeight = 0, totalLineIndex = 0, tempLineHeight;
			if (this._lineHeight) {
				while (totalLineIndex < lineCount) {
					tempLineHeight = this._getLineHeight(totalLineIndex);
					if (totalHeight + tempLineHeight > _scroll.y) {
						break;
					}
					totalHeight += tempLineHeight;
					totalLineIndex++;
				}
				topIndex = totalLineIndex;
				lineStart = Math.max(0, topIndex - 1);
				topIndexY = _top = _scroll.y - totalHeight;
				if (topIndex > 0) {
					_top += this._getLineHeight(topIndex - 1);
				}
			} else {
				var firstLine = Math.max(0, _scroll.y) / lineHeight;
				topIndex = Math.floor(firstLine);
				lineStart = Math.max(0, topIndex - 1);
				_top = Math.round((firstLine - lineStart) * lineHeight);
				topIndexY = Math.round((firstLine - topIndex) * lineHeight);
				scrollHeight = lineCount * lineHeight;
			}
			this._topIndexY = topIndexY;
			var rootDiv = this._rootDiv;
			var rootWidth = rootDiv.clientWidth;
			var rootHeight = rootDiv.clientHeight;
			if (hScrollOnly) {
				leftWidth = 0;
				if (this._leftDiv) {
					leftRect = this._leftDiv.getBoundingClientRect();
					leftWidth = leftRect.right - leftRect.left;
				}
				clientWidth = this._getClientWidth();
				clientHeight = this._getClientHeight();
				scrollWidth = clientWidth;
				if (this._wrapMode) {
					if (this._metrics.wrapWidth) {
						scrollWidth = this._metrics.wrapWidth;
					}
				} else {
					scrollWidth = Math.max(this._maxLineWidth, scrollWidth);
				}
				while (totalLineIndex < lineCount) {
					tempLineHeight = this._getLineHeight(totalLineIndex, false);
					totalHeight += tempLineHeight;
					totalLineIndex++;
				}
				scrollHeight = totalHeight;
			} else {
				clientHeight = this._getClientHeight();

				var linesPerPage = Math.floor((clientHeight + topIndexY) / lineHeight);
				var bottomIndex = Math.min(topIndex + linesPerPage, lineCount - 1);
				var lineEnd = Math.min(bottomIndex + 1, lineCount - 1);
				
				var lineIndex, lineWidth;
				var child = clientDiv.firstChild;
				while (child) {
					lineIndex = child.lineIndex;
					var nextChild = child.nextSibling;
					if (!(lineStart <= lineIndex && lineIndex <= lineEnd) || child.lineRemoved || child.lineIndex === -1) {
						if (this._mouseWheelLine === child) {
							child.style.display = "none"; //$NON-NLS-1$
							child.lineIndex = -1;
						} else {
							clientDiv.removeChild(child);
						}
					}
					child = nextChild;
				}
	
				child = this._getLineNext();
				var doc = viewDiv.ownerDocument;
				var frag = doc.createDocumentFragment();
				for (lineIndex=lineStart; lineIndex<=lineEnd; lineIndex++) {
					if (!child || child.lineIndex > lineIndex) {
						new TextLine(this, lineIndex).create(frag, null);
					} else {
						if (frag.firstChild) {
							clientDiv.insertBefore(frag, child);
							frag = doc.createDocumentFragment();
						}
						if (child && child.lineChanged) {
							child = new TextLine(this, lineIndex).create(frag, child);
							child.lineChanged = false;
						}
						child = this._getLineNext(child);
					}
				}
				if (frag.firstChild) { clientDiv.insertBefore(frag, child); }
	
				/*
				* Feature in WekKit. Webkit limits the width of the lines
				* computed below to the width of the client div.  This causes
				* the lines to be wrapped even though "pre" is set.  The fix
				* is to set the width of the client div to "0x7fffffffpx"
				* before computing the lines width.  Note that this value is
				* reset to the appropriate value further down.
				*/ 
				if (util.isWebkit && !this._wrapMode) {
					clientDiv.style.width = "0x7fffffffpx"; //$NON-NLS-1$
				}
	
				var rect;
				child = this._getLineNext();
				var bottomHeight = clientHeight + _top;
				var foundBottomIndex = false;
				while (child) {
					lineWidth = child.lineWidth;
					if (lineWidth === undefined) {
						rect = child._line.getBoundingClientRect();
						lineWidth = child.lineWidth = Math.ceil(rect.right - rect.left);
						var lh = rect.bottom - rect.top;
						if (this._lineHeight) {
							this._lineHeight[child.lineIndex] = lh;
						} else if (lineHeight !== 0 && lh !== 0 && Math.ceil(lineHeight) !== Math.ceil(lh)) {
							this._variableLineHeight = true;
							this._lineHeight = [];
							this._lineHeight[child.lineIndex] = lh;
						}
					}
					if (this._lineHeight && !foundBottomIndex) {
						bottomHeight -= this._lineHeight[child.lineIndex];
						if (bottomHeight < 0) {
							bottomIndex = child.lineIndex;
							foundBottomIndex = true;
						}
					}
					if (!this._wrapMode) {
						if (lineWidth >= this._maxLineWidth) {
							this._maxLineWidth = lineWidth;
							this._maxLineIndex = child.lineIndex;
						}
						if (this._checkMaxLineIndex === child.lineIndex) { this._checkMaxLineIndex = -1; }
					}
					if (child.lineIndex === topIndex) { this._topChild = child; }
					if (child.lineIndex === bottomIndex) { this._bottomChild = child; }
					child = this._getLineNext(child);
				}
				if (this._checkMaxLineIndex !== -1) {
					lineIndex = this._checkMaxLineIndex;
					this._checkMaxLineIndex = -1;
					if (0 <= lineIndex && lineIndex < lineCount) {
						var line = new TextLine(this, lineIndex);
						rect = line.getBoundingClientRect();
						lineWidth = rect.right - rect.left;
						if (lineWidth >= this._maxLineWidth) {
							this._maxLineWidth = lineWidth;
							this._maxLineIndex = lineIndex;
						}
						line.destroy();
					}
				}
				
				while (totalLineIndex < lineCount) {
					tempLineHeight = this._getLineHeight(totalLineIndex, totalLineIndex <= bottomIndex);
					totalHeight += tempLineHeight;
					totalLineIndex++;
				}
				scrollHeight = totalHeight;
	
				// Update rulers
				this._updateRuler(this._leftDiv, topIndex, lineEnd, rootHeight);
				this._updateRuler(this._rightDiv, topIndex, lineEnd, rootHeight);
				this._updateRuler(this._innerRightDiv, topIndex, lineEnd, rootHeight);
				this._updateRuler(this._marginDiv, topIndex, lineEnd, rootHeight);
				
				leftWidth = 0;
				if (this._leftDiv) {
					leftRect = this._leftDiv.getBoundingClientRect();
					leftWidth = leftRect.right - leftRect.left;
				}
				var rightWidth = 0;
				if (this._rightDiv) {
					var rightRect = this._rightDiv.getBoundingClientRect();
					rightWidth = rightRect.right - rightRect.left;
				}
				viewDiv.style.left = leftWidth + "px"; //$NON-NLS-1$
				viewDiv.style.right = rightWidth + "px"; //$NON-NLS-1$

				/* Need to set the height first in order for the width to consider the vertical scrollbar */
				var scrollDiv = this._scrollDiv;
				scrollDiv.style.height = (scrollHeight + (util.isWebkit ? 0 : viewPad.bottom)) + "px"; //$NON-NLS-1$
				
				clientWidth = this._getClientWidth();
				if (!this._singleMode && !this._wrapMode && !this._noScroll) {
					var clientHeightNoScroll = clientHeight, clientHeightScroll = clientHeight;
					var oldHScroll = viewDiv.style.overflowX === "scroll"; //$NON-NLS-1$
					if (oldHScroll) {
						clientHeightNoScroll += scrollbarWidth;
					} else {
						clientHeightScroll -= scrollbarWidth;
					}
					var clientWidthNoScroll = clientWidth, clientWidthScroll = clientWidth;
					var oldVScroll = viewDiv.style.overflowY === "scroll"; //$NON-NLS-1$
					if (oldVScroll) {
						clientWidthNoScroll += scrollbarWidth;
					} else {
						clientWidthScroll -= scrollbarWidth;
					}
					clientHeight = clientHeightNoScroll;
					clientWidth = clientWidthNoScroll;
					if (scrollHeight > clientHeight) {
						vScroll = true;
						clientWidth = clientWidthScroll;
					}
					if (this._maxLineWidth > clientWidth) {
						hScroll = true;
						clientHeight = clientHeightScroll;
						if (scrollHeight > clientHeight) {
							vScroll = true;
							clientWidth = clientWidthScroll;
						}
					}
					if (oldHScroll !== hScroll) {
						viewDiv.style.overflowX = hScroll ? "scroll" : "hidden"; //$NON-NLS-1$ //$NON-NLS-2$
					}
					if (oldVScroll !== vScroll) {
						viewDiv.style.overflowY = vScroll ? "scroll" : "hidden"; //$NON-NLS-1$ //$NON-NLS-2$
					}
					needUpdate = oldHScroll !== hScroll || oldVScroll !== vScroll;
				}
				
				var width = clientWidth;
				if (this._wrapMode) {
					if (this._metrics.wrapWidth) {
						width = this._metrics.wrapWidth;
					}
				} else {
					width = Math.max(this._maxLineWidth + this._getInnerRightWidth(), width);
				}
				/*
				* Except by IE 8 and earlier, all other browsers are not allocating enough space for the right padding 
				* in the scrollbar. It is possible this a bug since all other paddings are considered.
				*/
				scrollWidth = width;
				if ((!util.isIE || util.isIE >= 9) && this._maxLineWidth > clientWidth) { width += viewPad.right + viewPad.left; }
				scrollDiv.style.width = width + "px"; //$NON-NLS-1$
				if (this._clipScrollDiv) {
					this._clipScrollDiv.style.width = width + "px"; //$NON-NLS-1$
				}
				/* Get the left scroll after setting the width of the scrollDiv as this can change the horizontal scroll offset. */
				_scroll = this._getScroll(false);

				var innerRightDiv = this._innerRightDiv;
				if (innerRightDiv) {
					innerRightDiv.style.right = rightWidth + (viewDiv.style.overflowY === "scroll" ? this._metrics.scrollWidth : 0) + "px"; //$NON-NLS-1$ //$NON-NLS-1$
					innerRightDiv.style.bottom = (viewDiv.style.overflowX === "scroll" ? scrollbarWidth : 0) + "px"; //$NON-NLS-1$ //$NON-NLS-1$
				}
			}
			this._scrollHeight = scrollHeight;
			if (this._vScrollDiv) {
				var trackHeight = clientHeight - 8;
				var thumbHeight = Math.max(15, Math.ceil(Math.min(1, trackHeight / (scrollHeight + viewPad.top + viewPad.bottom)) * trackHeight));
				this._vScrollDiv.style.left = (leftWidth + clientWidth - 8) + "px"; //$NON-NLS-1$
				this._vScrollDiv.style.top = Math.floor(Math.max(0, (_scroll.y * trackHeight / scrollHeight))) + "px"; //$NON-NLS-1$
				this._vScrollDiv.style.height = thumbHeight + "px"; //$NON-NLS-1$
			}
			if (!this._wrapMode && this._hScrollDiv) {
				var trackWidth = clientWidth - 8;
				var thumbWidth = Math.max(15, Math.ceil(Math.min(1, trackWidth / (this._maxLineWidth + viewPad.left + viewPad.right)) * trackWidth));
				this._hScrollDiv.style.left = leftWidth + Math.floor(Math.max(0, Math.floor(_scroll.x * trackWidth / this._maxLineWidth))) + "px"; //$NON-NLS-1$
				this._hScrollDiv.style.top = (clientHeight - 9) + "px"; //$NON-NLS-1$
				this._hScrollDiv.style.width = thumbWidth + "px"; //$NON-NLS-1$
			}
			var left = _scroll.x;	
			var clipDiv = this._clipDiv;
			var overlayDiv = this._overlayDiv;
			var marginDiv = this._marginDiv;
			var clipLeft, clipTop;
			if (marginDiv) {
				marginDiv.style.left = (-left + leftWidth + this._metrics.marginWidth + viewPad.left) + "px"; //$NON-NLS-1$
				marginDiv.style.bottom = (viewDiv.style.overflowX === "scroll" ? scrollbarWidth : 0) + "px"; //$NON-NLS-1$ //$NON-NLS-1$
			}
			if (clipDiv) {
				clipDiv.scrollLeft = left;
				clipDiv.scrollTop = 0;
				clipLeft = leftWidth + viewPad.left;
				clipTop = viewPad.top;
				var clipWidth = clientWidth;
				var clipHeight = clientHeight;
				var clientLeft = 0, clientTop = -_top;
				if (_scroll.x === 0) {
					clipLeft -= viewPad.left;
					clipWidth += viewPad.left;
					clientLeft = viewPad.left;
				} 
				if (_scroll.x + clientWidth === scrollWidth) {
					clipWidth += viewPad.right;
				}
				if (_scroll.y === 0) {
					clipTop -= viewPad.top;
					clipHeight += viewPad.top;
					clientTop += viewPad.top;
				}
				if (_scroll.y + clientHeight === scrollHeight) { 
					clipHeight += viewPad.bottom; 
				}
				clipDiv.style.left = clipLeft + "px"; //$NON-NLS-1$
				clipDiv.style.top = clipTop + "px"; //$NON-NLS-1$
				clipDiv.style.right = (rootWidth - clipWidth - clipLeft) + "px"; //$NON-NLS-1$
				clipDiv.style.bottom = (rootHeight - clipHeight - clipTop) + "px"; //$NON-NLS-1$
				clientDiv.style.left = clientLeft + "px"; //$NON-NLS-1$
				clientDiv.style.top = clientTop + "px"; //$NON-NLS-1$
				clientDiv.style.width = scrollWidth + "px"; //$NON-NLS-1$
				clientDiv.style.height = (clientHeight + _top) + "px"; //$NON-NLS-1$
				if (overlayDiv) {
					overlayDiv.style.left = clientDiv.style.left;
					overlayDiv.style.top = clientDiv.style.top;
					overlayDiv.style.width = clientDiv.style.width;
					overlayDiv.style.height = clientDiv.style.height;
				}
			} else {
				clipLeft = left;
				clipTop = _top;
				var clipRight = left + clientWidth;
				var clipBottom = _top + clientHeight;
				if (clipLeft === 0) { clipLeft -= viewPad.left; }
				if (clipTop === 0) { clipTop -= viewPad.top; }
				if (clipRight === scrollWidth) { clipRight += viewPad.right; }
				if (_scroll.y + clientHeight === scrollHeight) { clipBottom += viewPad.bottom; }
				clientDiv.style.clip = "rect(" + clipTop + "px," + clipRight + "px," + clipBottom + "px," + clipLeft + "px)"; //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-5$
				if (document.dir == "rtl") { /* ACGC */
					clientDiv.style.right = (-left + leftWidth + viewPad.left) + "px"; //$NON-NLS-1$
				}else{
					clientDiv.style.left = (-left + leftWidth + viewPad.left) + "px"; //$NON-NLS-1$	  
				}
				clientDiv.style.width = (this._wrapMode || util.isWebkit ? scrollWidth : clientWidth + left) + "px"; //$NON-NLS-1$
				if (!hScrollOnly) {
					clientDiv.style.top = (-_top + viewPad.top) + "px"; //$NON-NLS-1$
					clientDiv.style.height = (clientHeight + _top) + "px"; //$NON-NLS-1$
				}
				if (overlayDiv) {
					overlayDiv.style.clip = clientDiv.style.clip;
					overlayDiv.style.left = clientDiv.style.left;
					overlayDiv.style.width = clientDiv.style.width;
					if (!hScrollOnly) {
						overlayDiv.style.top = clientDiv.style.top;
						overlayDiv.style.height = clientDiv.style.height;
					}
				}
			}
			this._updateDOMSelection();

			if (needUpdate) {
				var ensureCaretVisible = this._ensureCaretVisible;
				this._ensureCaretVisible = false;
				if (ensureCaretVisible) {
					this._showCaret();
				}
				this._queueUpdate();
			}
		},
		_updateOverflow: function() {
			var viewDiv = this._viewDiv;
			if (this._noScroll) {
				viewDiv.style.overflow = "hidden"; //$NON-NLS-1$
			} else if (this._wrapMode) {
				viewDiv.style.overflowX = "hidden"; //$NON-NLS-1$
				viewDiv.style.overflowY = "scroll"; //$NON-NLS-1$
			} else {
				viewDiv.style.overflow = "hidden"; //$NON-NLS-1$
			}
		},
		_updateRuler: function (divRuler, topIndex, bottomIndex, rootHeight) {
			if (!divRuler) { return; }
			var doc = this._parent.ownerDocument;
			var lineHeight = this._getLineHeight();
			var viewPad = this._getViewPadding();
			var div = divRuler.firstChild;
			while (div) {
				var ruler = div._ruler;
				var overview = ruler.getOverview();
				if (div.rulerChanged) {
					applyStyle(ruler.getRulerStyle(), div);
					divRuler.rulerWidth = undefined;
				}
				if (overview === "fixed") { //$NON-NLS-1$
					div.rulerChanged = false;
					div = div.nextSibling;
					continue;
				}
				var offset = lineHeight;
				if (overview === "page") { offset += this._topIndexY; } //$NON-NLS-1$
				div.style.top = -offset + "px"; //$NON-NLS-1$
				div.style.height = (rootHeight + offset) + "px"; //$NON-NLS-1$
				
				
				var widthDiv;
				var child = div.firstChild;
				if (child) {
					widthDiv = child;
					child = child.nextSibling;
				} else {
					widthDiv = util.createElement(doc, "div"); //$NON-NLS-1$
					widthDiv.style.visibility = "hidden"; //$NON-NLS-1$
					div.appendChild(widthDiv);
				}
				var lineIndex, annotation;
				if (div.rulerChanged) {
					if (widthDiv) {
						lineIndex = -1;
						annotation = ruler.getWidestAnnotation();
						if (annotation) {
							applyStyle(annotation.style, widthDiv);
							if (annotation.html) {
								widthDiv.innerHTML = annotation.html;
							}
						}
						widthDiv.lineIndex = lineIndex;
						widthDiv.style.height = (lineHeight + viewPad.top) + "px"; //$NON-NLS-1$
					}
				}

				var lineDiv, frag, annotations;
				if (overview === "page") { //$NON-NLS-1$
					annotations = ruler.getAnnotations(topIndex, bottomIndex + 1);
					while (child) {
						lineIndex = child.lineIndex;
						var nextChild = child.nextSibling;
						if (!(topIndex <= lineIndex && lineIndex <= bottomIndex) || child.lineChanged) {
							div.removeChild(child);
						}
						child = nextChild;
					}
					child = div.firstChild.nextSibling;
					frag = doc.createDocumentFragment();
					for (lineIndex=topIndex; lineIndex<=bottomIndex; lineIndex++) {
						if (!child || child.lineIndex > lineIndex) {
							lineDiv = util.createElement(doc, "div"); //$NON-NLS-1$
							annotation = annotations[lineIndex];
							if (annotation) {
								applyStyle(annotation.style, lineDiv);
								if (annotation.html) {
									lineDiv.innerHTML = annotation.html;
								}
								lineDiv.annotation = annotation;
							}
							lineDiv.lineIndex = lineIndex;
							lineDiv.style.height = this._getLineHeight(lineIndex) + "px"; //$NON-NLS-1$
							frag.appendChild(lineDiv);
						} else {
							if (frag.firstChild) {
								div.insertBefore(frag, child);
								frag = doc.createDocumentFragment();
							}
							if (child) {
								child = child.nextSibling;
							}
						}
					}
					if (frag.firstChild) { div.insertBefore(frag, child); }
				} else {
					var clientHeight = this._getClientHeight ();
					var lineCount = this._model.getLineCount ();
					var contentHeight = lineHeight * lineCount;
					var trackHeight = clientHeight + viewPad.top + viewPad.bottom - 2 * this._metrics.scrollWidth;
					var divHeight, arrowWidth;
					if (contentHeight < trackHeight) {
						divHeight = lineHeight;
						arrowWidth = viewPad.top;
					} else {
						divHeight = trackHeight / lineCount;
						arrowWidth = this._metrics.scrollWidth;
					}
					if (div.rulerChanged) {
						var count = div.childNodes.length;
						while (count > 1) {
							div.removeChild(div.lastChild);
							count--;
						}
						annotations = ruler.getAnnotations(0, lineCount);
						frag = doc.createDocumentFragment();
						for (var prop in annotations) {
							lineIndex = prop >>> 0;
							if (lineIndex < 0) { continue; }
							lineDiv = util.createElement(doc, "div"); //$NON-NLS-1$
							annotation = annotations[prop];
							applyStyle(annotation.style, lineDiv);
							lineDiv.style.position = "absolute"; //$NON-NLS-1$
							lineDiv.style.top = arrowWidth + lineHeight + Math.floor(lineIndex * divHeight) + "px"; //$NON-NLS-1$
							if (annotation.html) {
								lineDiv.innerHTML = annotation.html;
							}
							lineDiv.annotation = annotation;
							lineDiv.lineIndex = lineIndex;
							frag.appendChild(lineDiv);
						}
						div.appendChild(frag);
					} else if (div._oldTrackHeight !== trackHeight) {
						lineDiv = div.firstChild ? div.firstChild.nextSibling : null;
						while (lineDiv) {
							lineDiv.style.top = this._metrics.scrollWidth + lineHeight + Math.floor(lineDiv.lineIndex * divHeight) + "px"; //$NON-NLS-1$
							lineDiv = lineDiv.nextSibling;
						}
					}
					div._oldTrackHeight = trackHeight;
				}
				div.rulerChanged = false;
				div = div.nextSibling;
			}
		},
		_updateStyleSheet: function() {
			var styleText = "";
			if (util.isWebkit && this._metrics.scrollWidth > 0) {
				styleText += "\n.textview ::-webkit-scrollbar-corner {background: #eeeeee;}"; //$NON-NLS-1$
			}
			if (styleText) {
				var doc = this._clientDiv.ownerDocument;
				var node = doc.getElementById("_textviewStyle"); //$NON-NLS-1$
				if (!node) {
					node = util.createElement(doc, "style"); //$NON-NLS-1$
					node.id = "_textviewStyle"; //$NON-NLS-1$
					var head = doc.getElementsByTagName("head")[0] || doc.documentElement; //$NON-NLS-1$
					node.appendChild(doc.createTextNode(styleText));
					head.insertBefore(node, head.firstChild);
				} else {
					node.removeChild(node.firstChild);
					node.appendChild(doc.createTextNode(styleText));
				}
			}
		},
		_updateStyle: function (init, metrics) {
			if (!init && util.isIE) {
				this._rootDiv.style.lineHeight = "normal"; //$NON-NLS-1$
			}
			metrics = this._metrics = metrics || this._calculateMetrics();
			if (this._variableLineHeight) {
				this._variableLineHeight = false;
				this._resetLineHeight();
			}
			if (util.isIE) {
				this._rootDiv.style.lineHeight = (metrics.lineHeight - (metrics.lineTrim.top + metrics.lineTrim.bottom)) + "px"; //$NON-NLS-1$
			} else {
				this._rootDiv.style.lineHeight = "normal"; //$NON-NLS-1$
			}
			this._updateStyleSheet();
			if (util.isMac && util.isWebkit) {
				var viewDiv = this._viewDiv;
				if (!metrics.invalid && metrics.scrollWidth === 0) {
					viewDiv.style.pointerEvents = "none"; //$NON-NLS-1$
					viewDiv.style.zIndex = "2"; //$NON-NLS-1$
				} else {
					viewDiv.style.pointerEvents = ""; //$NON-NLS-1$
					viewDiv.style.zIndex = ""; //$NON-NLS-1$
				}
			}
			if (!init) {
				this.redraw();
				this._resetLineWidth();
			}
		}
	};//end prototype
	mEventTarget.EventTarget.addMixin(TextView.prototype);
	
	return {TextView: TextView};
});

