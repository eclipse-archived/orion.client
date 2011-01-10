/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window document navigator setTimeout clearTimeout alert XMLHttpRequest */

var eclipse = eclipse || {};

eclipse.KeyBinding = (function() {
	var isMac = navigator.platform.indexOf("Mac") !== -1;
	function KeyBinding (keyCode, mod1, mod2, mod3, mod4) {
		if (typeof(keyCode) === "string") {
			this.keyCode = keyCode.toUpperCase().charCodeAt(0);
		} else {
			this.keyCode = keyCode;
		}
		this.mod1 = mod1 !== undefined && mod1 !== null ? mod1 : false;
		this.mod2 = mod2 !== undefined && mod2 !== null ? mod2 : false;
		this.mod3 = mod3 !== undefined && mod3 !== null ? mod3 : false;
		this.mod4 = mod4 !== undefined && mod4 !== null ? mod4 : false;
	}
	KeyBinding.prototype = {
		match: function (e) {
			if (this.keyCode === e.keyCode) {
				var mod1 = isMac ? e.metaKey : e.ctrlKey;
				if (this.mod1 !== mod1) { return false; }
				if (this.mod2 !== e.shiftKey) { return false; }
				if (this.mod3 !== e.altKey) { return false; }
				if (isMac && this.mod4 !== e.ctrlKey) { return false; }//mac only
				return true;
			}
			return false;
		},
		equals: function(kb) {
			if (!kb) { return false; }
			if (this.keyCode !== kb.keyCode) { return false; }
			if (this.mod1 !== kb.mod1) { return false; }
			if (this.mod2 !== kb.mod2) { return false; }
			if (this.mod3 !== kb.mod3) { return false; }
			if (this.mod4 !== kb.mod4) { return false; }
			return true;
		} 
	};
	return KeyBinding;
}());

eclipse.Editor = (function() {
	
	/** Private Helpers */
	function addHandler(node, type, handler, capture) {
		if (typeof node.addEventListener === "function") {
			node.addEventListener(type, handler, capture === true);
		} else {
			node.attachEvent("on" + type, handler);
		}
	}
	function removeHandler(node, type, handler, capture) {
		if (typeof node.removeEventListener === "function") {
			node.removeEventListener(type, handler, capture === true);
		} else {
			node.detachEvent("on" + type, handler);
		}
	}
	var isIE = document.selection && window.ActiveXObject && /MSIE/.test(navigator.userAgent);
	var isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
	var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
	var isMac = navigator.platform.indexOf("Mac") !== -1;
	var isWindows = navigator.platform.indexOf("Win") !== -1;
	var isW3CEvents = typeof window.document.documentElement.addEventListener === "function";

	var Selection = (function() {
		function Selection (start, end, caret) {
			this.start = start;
			this.end = end;
			this.caret = caret; //true if the start, false if the caret is at end
		}
		Selection.prototype = {
			clone: function() {
				return new Selection(this.start, this.end, this.caret);
			},
			collapse: function() {
				if (this.caret) {
					this.end = this.start;
				} else {
					this.start = this.end;
				}
			},
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
			setCaret: function(offset) {
				this.start = offset;
				this.end = offset;
				this.caret = false;
			},
			getCaret: function() {
				return this.caret ? this.start : this.end;
			},
			toString: function() {
				return "start=" + this.start + " end=" + this.end + (this.caret ? " caret is at start" : " caret is at end");
			},
			isEmpty: function() {
				return this.start === this.end;
			},
			equals: function(object) {
				return this.caret === object.caret && this.start === object.start && this.end === object.end;
			}
		};
		return Selection;
	}());

	var EventTable = (function() {
		function EventTable(){
		    this._listeners = {};
		}
		EventTable.prototype = {
			addEventListener: function(type, context, func, data) {
				if (!this._listeners[type]) {
					this._listeners[type] = [];
				}
				var listener = {
						context: context,
						func: func,
						data: data
				};
				this._listeners[type].push(listener);
			},
			sendEvent: function(type, event) {
				var listeners = this._listeners[type];
				if (listeners) {
					for (var i=0, len=listeners.length; i < len; i++){
						var l = listeners[i];
						if (l && l.context && l.func) {
							l.func.call(l.context, event, l.data);
						}
					}
				}
			},
			removeEventListener: function(type, context, func, data){
				var listeners = this._listeners[type];
				if (listeners) {
					for (var i=0, len=listeners.length; i < len; i++){
						var l = listeners[i];
						if (l.context === context && l.func === func && l.data === data) {
							listeners.splice(i, 1);
							break;
						}
					}
				}
			}
		};
		return EventTable;
	}());
	
	/******************************* Constructor ***************************/
	function Editor (options) {
		this._init(options);
	}
	
	Editor.prototype = {
		/*************************************** API **********************************/
		addEventListener: function(type, context, func, data) {
			this._eventTable.addEventListener(type, context, func, data);
		},
		addRuler: function (ruler) {
			var document = this._frameDocument;
			var body = document.body;
			var side = ruler.getLocation();
			var rulerParent = side === "left" ? this._leftDiv : this._rightDiv;
			if (!rulerParent) {
				rulerParent = document.createElement("DIV");
				rulerParent.style.overflow = "hidden";
				rulerParent.style.MozUserSelect = "none";
				rulerParent.style.WebkitUserSelect = "none";
				if (isIE) {
					rulerParent.attachEvent("onselectstart", function() {return false;});
				}
				rulerParent.style.position = "absolute";
				rulerParent.style.top = "0px";
				rulerParent.style.cursor = "default";
				body.appendChild(rulerParent);
				if (side === "left") {
					this._leftDiv = rulerParent;
					rulerParent.className = "editorLeftRuler";
				} else {
					this._rightDiv = rulerParent;
					rulerParent.className = "editorRightRuler";
				}
				var table = document.createElement("TABLE");
				rulerParent.appendChild(table);
				table.cellPadding = "0px";
				table.cellSpacing = "0px";
				table.border = "0px";
				table.insertRow(0);
				var self = this;
				addHandler(rulerParent, "click", function(e) { self._handleRulerEvent(e); });
				addHandler(rulerParent, "dblclick", function(e) { self._handleRulerEvent(e); });
			}
			var div = document.createElement("DIV");
			div._ruler = ruler;
			div.rulerChanged = true;
			div.style.position = "relative";
			var row = rulerParent.firstChild.rows[0];
			var index = row.cells.length;
			var cell = row.insertCell(index);
			cell.vAlign = "top";
			cell.appendChild(div);
			ruler.setView(this);
			this._updatePage();
		},
		convert: function(rect, from, to) {
			var scroll = this._getScroll();
			var editorPad = this._getEditorPadding();
			var frame = this._frame.getBoundingClientRect();
			var editorRect = this._editorDiv.getBoundingClientRect();
			switch(from) {
				case "document":
					if (rect.x !== undefined) {
						rect.x += - scroll.x + editorRect.left + editorPad.left;
					}
					if (rect.y !== undefined) {
						rect.y += - scroll.y + editorRect.top + editorPad.top;
					}
					break;
				case "page":
					if (rect.x !== undefined) {
						rect.x += - frame.left;
					}
					if (rect.y !== undefined) {
						rect.y += - frame.top;
					}
					break;
			}
			//At this point rect is in the widget coordinate space
			switch (to) {
				case "document":
					if (rect.x !== undefined) {
						rect.x += scroll.x - editorRect.left - editorPad.left;
					}
					if (rect.y !== undefined) {
						rect.y += scroll.y - editorRect.top - editorPad.top;
					}
					break;
				case "page":
					if (rect.x !== undefined) {
						rect.x += frame.left;
					}
					if (rect.y !== undefined) {
						rect.y += frame.top;
					}
					break;
			}
		},
		destroy: function() {
			this._setGrab(null);
			this._unhookEvents();
			
			/* Destroy rulers*/
			var destroyRulers = function(rulerDiv) {
				if (!rulerDiv) {
					return;
				}
				var cells = rulerDiv.firstChild.rows[0].cells;
				for (var i = 0; i < cells.length; i++) {
					var div = cells[i].firstChild;
					div._ruler.setView(null);
				}
			};
			destroyRulers (this._leftDiv);
			destroyRulers (this._rightDiv);

			/* Destroy timers */
			if (this._autoScrollTimerID) {
				clearTimeout(this._autoScrollTimerID);
				this._autoScrollTimerID = null;
			}
			if (this._updateTimer) {
				clearTimeout(this._updateTimer);
				this._updateTimer = null;
			}
			
			/* Destroy DOM */
			var parent = this._parent;
			var frame = this._frame;
			parent.removeChild(frame);
			
			var e = {};
			this.onDestroy(e);
			
			this._parent = null;
			this._parentDocument = null;
			this._model = null;
			this._selection = null;
			this._doubleClickSelection = null;
			this._eventTable = null;
			this._frame = null;
			this._frameDocument = null;
			this._frameWindow = null;
			this._scrollDiv = null;
			this._editorDiv = null;
			this._clientDiv = null;
			this._overlayDiv = null;
			this._textArea = null;
			this._keyBindings = null;
			this._actions = null;
		},
		focus: function() {
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
		/*
		 * returns a string arrays with the name of all actions
		 * if defaultAction is true it also includes the predefined actions 
		 */
		getActions: function (defaultAction) {
			var result = [];
			var actions = this._actions;
			for (var i = 0; i < actions.length; i++) {
				if (!defaultAction && actions[i].defaultHandler) { continue; }
				result.push(actions[i].name);
			}
			return result;
		},
		getBottomIndex: function(fullyVisible /*optional*/) {
			return this._getBottomIndex(fullyVisible);
		},
		getBottomPixel: function() {
			return this._getScroll().y + this._getClientHeight();
		},
		getCaretOffset: function () {
			var s = this._getSelection();
			return s.getCaret();
		},
		getClientArea: function() {
			var scroll = this._getScroll();
			return {x: scroll.x, y: scroll.y, width: this._getClientWidth(), height: this._getClientHeight()};
		},
		getHorizontalPixel: function() {
			return this._getScroll().x;
		},
		/*
		 * Returns the array of KeyBinding for the given name 
		 */
		getKeyBindings: function (name) {
			var result = [];
			var keyBindings = this._keyBindings;
			for (var i = 0; i < keyBindings.length; i++) {
				if (keyBindings[i].name === name) {
					result.push(keyBindings[i].keyBinding);
				}
			}
			return result;
		},
		getLineHeight: function(lineIndex/*optional*/) {
			return this._getLineHeight();
		},
		getLinePixel: function(lineIndex) {
			lineIndex= Math.min(Math.max(0, lineIndex), this._model.getLineCount());
			var lineHeight = this._getLineHeight();
			return lineHeight * lineIndex;
		},
		getLocationAtOffset: function(offset) {
			var model = this._model;
			var lineIndex = model.getLineAtOffset(offset);
			var scroll = this._getScroll();
			var editorRect = this._editorDiv.getBoundingClientRect();
			var editorPad = this._getEditorPadding();
			var x = this._getOffsetToX(offset) + scroll.x - editorRect.left - editorPad.left;
			var y = this.getLinePixel(lineIndex);
			return {x: x, y: y};
		},
		getModel: function() {
			return this._model;
		},
		getOffsetAtLocation: function(x, y) {
			var model = this._model;
			var scroll = this._getScroll();
			var editorRect = this._editorDiv.getBoundingClientRect();
			var editorPad = this._getEditorPadding();
			var lineIndex = this._getYToLine(y - scroll.y);
			x += -scroll.x + editorRect.left + editorPad.left;
			var offset = this._getXToOffset(lineIndex, x);
			return offset;
		},
		/*
		* start offset -
		* end offset - the char at end offset is not included
		*/
		getSelection: function () {
			var s = this._getSelection();
			return {start: s.start, end: s.end};
		},
		/*
		* start offset -
		* end offset - the char at end offset is not included
		*/
		getText: function(start /*optional*/, end /*optional*/) {
			var model = this._model;
			return model.getText(start, end);
		},
		getTopIndex: function(fullyVisible /*optional*/) {
			return this._getTopIndex(fullyVisible);
		},
		getTopPixel: function() {
			return this._getScroll().y;
		},
		invokeAction: function (name, defaultAction) {
			var actions = this._actions;
			for (var i = 0; i < actions.length; i++) {
				var a = actions[i];
				if (a.name && a.name === name) {
					if (!defaultAction && a.userHandler) { return a.userHandler(); }
					if (a.defaultHandler) { return a.defaultHandler(); }
					return false;
				}
			}
			return false;
		},
		/*
		 * Events.
		 * public so that dojo.connect can see it
		 */
		onDestroy: function(destroyEvent) {
			this._eventTable.sendEvent("Destroy", destroyEvent);
		},
		onLineStyle: function(lineStyleEvent) {
			this._eventTable.sendEvent("LineStyle", lineStyleEvent);
		},
		onModelChanged: function(modelChangedEvent) {
			this._eventTable.sendEvent("ModelChanged", modelChangedEvent);
		},
		onModelChanging: function(modelChangingEvent) {
			this._eventTable.sendEvent("ModelChanging", modelChangingEvent);
		},
		/**
		* This method is called when the editor has changed text in the model.
		*/
		onModify: function(modifyEvent) {
			this._eventTable.sendEvent("Modify", modifyEvent);
		},
		onSelection: function(selectionEvent) {
			this._eventTable.sendEvent("Selection", selectionEvent);
		},
		onScroll: function(scrollEvent) {
			this._eventTable.sendEvent("Scroll", scrollEvent);
		},
		/**
		* This method is called when the editor is about to change text in the model. The
		* data parameter has these fields:
		* 
		*	text -> text being inserted
		*	start,end -> range of text being deleted (end is not included)
		*
		* Listeners are allowed to change these parameters. Setting text to null
		* or undefined stops the change.
		*/
		onVerify: function(verifyEvent) {
			this._eventTable.sendEvent("Verify", verifyEvent);
		},
		/*
		* start line -
		* end line - is not included in the redraw range
		*/
		redrawLines: function(startLine, endLine, ruler) {
			if (startLine === undefined) { startLine = 0; }
			if (endLine === undefined) { endLine = this._model.getLineCount(); }
			if (startLine === endLine) { return; }
			var div = this._clientDiv;
			if (ruler) {
				var location = ruler.getLocation();//"left" or "right"
				var divRuler = location === "left" ? this._leftDiv : this._rightDiv;
				var cells = divRuler.firstChild.rows[0].cells;
				for (var i = 0; i < cells.length; i++) {
					if (cells[i].firstChild._ruler === ruler) {
						div = cells[i].firstChild;
						break;
					}
				}
			}
			if (ruler) {
				div.rulerChanged = true;
			}
			if (!ruler || ruler.getOverview() === "page") {
				var child = div.firstChild;
				while (child) {
					var lineIndex = child.lineIndex;
					if (startLine <= lineIndex && lineIndex < endLine) {
						child.lineChanged = true;
					}
					child = child.nextSibling;
				}
			}
			if (!ruler) {
				if (startLine <= this._maxLineIndex && this._maxLineIndex < endLine) {
					this._maxLineIndex = -1;
					this._maxLineWidth = 0;
				}
			}
			this._queueUpdatePage();
		},
		/*
		* start offset -
		* end offset - is not included in the redraw range
		*/
		redrawRange: function(start, end) {
			var model = this._model;
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = model.getCharCount(); }
			if (start === end) { return; }
			var startLine = model.getLineAtOffset(start);
			var endLine = model.getLineAtOffset(Math.max(0, end - 1)) + 1;
			this.redrawLines(startLine, endLine);
		},
		removeEventListener: function(type, context, func, data) {
			this._eventTable.removeEventListener(type, context, func, data);
		},
		removeRuler: function (ruler) {
			ruler.setView(null);
			var side = ruler.getLocation();
			var rulerParent = side === "left" ? this._leftDiv : this._rightDiv;
			var row = rulerParent.firstChild.rows[0];
			var cells = row.cells;
			for (var index = 0; index < cells.length; index++) {
				var cell = cells[index];
				if (cell.firstChild._ruler === ruler) { break; }
			}
			if (index === cells.length) { return; }
			row.cells[index]._ruler = undefined;
			row.deleteCell(index);
			this._updatePage();
		},
		/*
		 * if handler is null the default action handler is reinstall to the name, if available
		 */
		setAction: function(name, handler) {
			if (!name) { return; }
			var actions = this._actions;
			for (var i = 0; i < actions.length; i++) {
				var a = actions[i];
				if (a.name === name) {
					a.userHandler = handler;
					return;
				}
			}
			actions.push({name: name, userHandler: handler});
		},
		/*
		 * Sets a new keybinding,
		 * the name can be a predefined name, a user name, a null
		 * if the keybinding already exists the new name overrides the old one
		 * for use names use setAction to seta action for the new name
		 * 
		 * if name==null it removes the keybinding.
		 * Removing all the keybinding associated to a name will cause the user action to be removed.
		 * predefined action are never removed (so they can be reinstalled in the future). 
		 */
		setKeyBinding: function(keyBinding, name) {
			var keyBindings = this._keyBindings;
			for (var i = 0; i < keyBindings.length; i++) {
				var kb = keyBindings[i]; 
				if (kb.keyBinding.equals(keyBinding)) {
					if (name) {
						kb.name = name;
					} else {
						if (kb.predefined) {
							kb.name = null;
						} else {
							var oldName = kb.name; 
							keyBindings.splice(i, 1);
							var index = 0;
							while (index < keyBindings.length && oldName !== keyBindings[index].name) {
								index++;
							}
							if (index === keyBindings.length) {
								//remove action when last keybinding is remved
								var actions = this._actions;
								for (var j = 0; j < actions.length; j++) {
									if (actions[j].name === oldName) {
										if (!actions[j].defaultHandler) {
											actions.splice(j, 1);
										}
									}
								}
							}
						}
					}
					return;
				}
			}
			if (name) {
				keyBindings.push({keyBinding: keyBinding, name: name});
			}
		},
		setCaretOffset: function(offset, show /*optional*/) {
			var charCount = this._model.getCharCount();
			offset = Math.max(0, Math.min (offset, charCount));
			var selection = new Selection(offset, offset, false);
			this._setSelection (selection, show === undefined || show);
		},
		setHorizontalPixel: function(pixel) {
			pixel = Math.max(0, pixel);
			this._scrollView(pixel - this._getScroll().x, 0);
		},
		setModel: function(model) {
			if (!model) { return; }
			this._model.removeListener(this._modelListener);
			var oldLineCount = this._model.getLineCount();
			var oldCharCount = this._model.getCharCount();
			var newLineCount = model.getLineCount();
			var newCharCount = model.getCharCount();
			var newText = model.getText();
			var e = {
				text: newText,
				start: 0,
				removedCharCount: oldCharCount,
				addedCharCount: newCharCount,
				removedLineCount: oldLineCount,
				addedLineCount: newLineCount
			};
			this.onModelChanging(e); 
			this.redrawRange();
			this._model = model;
			e = {
				start: 0,
				removedCharCount: oldCharCount,
				addedCharCount: newCharCount,
				removedLineCount: oldLineCount,
				addedLineCount: newLineCount
			};
			this.onModelChanged(e); 
			this._model.addListener(this._modelListener);
			this.redrawRange();
		},
		/*
		* start offset -
		* end offset  - is not included in the selection
		*/
		setSelection: function (start, end, show /*optional*/ ) {
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
			this._setSelection(selection, show === undefined || show);
		},
		/*
		* start offset -
		* end offset  - the character at end offset is not included in the text range removed from the editor
		*/
		setText: function (text, start /*optional*/, end /*optional*/) {
			var reset = start === undefined && end === undefined;
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = this._model.getCharCount(); }
			this._modifyContent({text: text, start: start, end: end, _code: true}, !reset);
			if (reset) {
				this._columnX = -1;
				this._setSelection(new Selection (0, 0, false), true);
				this._showCaret();
			}
		},
		setTopIndex: function(topIndex) {
			var model = this._model;
			if (model.getCharCount() === 0) {
				return;
			}
			var lineCount = model.getLineCount();
			var lineHeight = this._getLineHeight();
			var pageSize = Math.max(1, Math.min(lineCount, Math.floor(this._getClientHeight () / lineHeight)));
			if (topIndex < 0) {
				topIndex = 0;
			} else if (topIndex > lineCount - pageSize) {
				topIndex = lineCount - pageSize;
			}
			var pixel = topIndex * lineHeight - this._getScroll().y;
			this._scrollView(0, pixel);
		},
		setTopPixel: function(pixel) {
			var lineHeight = this._getLineHeight();
			var clientHeight = this._getClientHeight();
			var lineCount = this._model.getLineCount();
			pixel = Math.min(Math.max(0, pixel), lineHeight * lineCount - clientHeight);
			this._scrollView(0, pixel - this._getScroll().y);
		},
		showSelection: function() {
			return this._showCaret();
		},
		
		/**************************************** Event handlers *********************************/
		_handleBodyMouseDown: function (e) {
			if (!e) { e = window.event; }
			/*
			 * Prevent clicks outside of the editor from taking focus 
			 * away the editor. Note that in Firefox clicking on the 
			 * scrollbar also take focus from the editor. Other browsers
			 * do not have this problem and stopping the click over the 
			 * scrollbar for them causes mouse capture problems.
			 */
			var topNode = this._overlayDiv || this._editorDiv;
			
			var temp = e.target ? e.target : e.srcElement;
			while (temp) {
				if (topNode === temp) {
					return;
				}
				temp = temp.parentNode;
			}
			if (e.preventDefault) { e.preventDefault(); }
			if (e.stopPropagation){ e.stopPropagation(); }
			if (!isW3CEvents) {
				/* In IE 8 is not possible to prevent the default handler from running
				*  during mouse down event using usual API. The workaround is to use
				*  setCapture/releaseCapture. 
				*/ 
				topNode.setCapture();
				setTimeout(function() { topNode.releaseCapture(); }, 0);
			}
		},
		_handleBlur: function (e) {
			if (!e) { e = window.event; }
			if (isIE) {
				/*
				* Bug in IE. For some reason when text is deselected the overflow
				* selection at the end of some lines does not get redrawn.  The
				* fix is to create a DOM element in the body to force a redraw.
				*/
				if (!this._getSelection().isEmpty()) {
					var child = document.createElement("DIV");
					var body = this._frameDocument.body;
					body.appendChild(child);
					body.removeChild(child);
				}
			}
		},
		_handleContextMenu: function (e) {
			if (!e) { e = window.event; }
			if (e.preventDefault) { e.preventDefault(); }
			return false;
		},
		_handleCopy: function (e) {
			if (this._ignoreCopy) { return; }
			if (!e) { e = window.event; }
			if (this._doCopy(e)) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleCut: function (e) {
			if (!e) { e = window.event; }
			if (this._doCut(e)) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleDataModified: function(e) {
			this._startIME();
		},
		_handleDblclick: function (e) {
			if (!e) { e = window.event; }
			var time = e.timeStamp ? e.timeStamp : new Date().getTime();
			this._lastMouseTime = time;
			if (this._clickCount !== 2) {
				this._clickCount = 2;
				this._handleMouse(e);
			}
		},
		_handleDragStart: function (e) {
			if (!e) { e = window.event; }
			if (e.preventDefault) { e.preventDefault(); }
			return false;
		},
		_handleKeyDown: function (e) {
			if (!e) { e = window.event; }
			if (e.keyCode === 229) {
				if (this.readonly) {
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
				this._startIME();
			} else {
				this._commitIME();
			}
			/*
			* Feature in Firefox. When a key is held down the browser sends 
			* right number of keypress events but only one keydown. This is
			* unexpected and causes the editor to only execute an action
			* just one time. The fix is to ignore the keydown event and 
			* execute the actions from the keypress handler.
			* Note: This only happens on the Mac (Firefox).
			*/
			if (isMac && isFirefox) {return true;}
			
			if (this._doAction(e)) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleKeyPress: function (e) {
			if (!e) { e = window.event; }
			if (isMac && isFirefox) {
				if (this._doAction(e)) {
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
			}
			var ctrlKey = isMac ? e.metaKey : e.ctrlKey;
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
			var ignore = false;
			if (isMac) {
				if (e.ctrlKey || e.metaKey) { ignore = true; }
			} else {
				if (isFirefox) {
					//Firefox clears the state mask when ALT GR generates input
					if (e.ctrlKey || e.altKey) { ignore = true; }
				} else {
					//IE and Chrome only send ALT GR when input is generated
					if (e.ctrlKey ^ e.altKey) { ignore = true; }
				}
			}
			if (!ignore) {
				var key = e.charCode !== undefined ? e.charCode : e.keyCode;
				if (key !== 0) {
					this._doContent(String.fromCharCode (key));
					if (e.preventDefault) { e.preventDefault(); }
					return false;
				}
			}
		},
		_handleKeyUp: function (e) {
			if (!e) { e = window.event; }
			
			// don't commit for space (it happens during JP composition)  
			if (e.keyCode === 13) {
				this._commitIME();
			}
		},
		_handleMouse: function (e) {
			var target = this._frameWindow;
			if (isIE) { target = this._clientDiv; }
			if (this._overlayDiv) {
				var self = this;
				setTimeout(function () {
					self.focus();
				}, 0);
			}
			if (this._clickCount === 1) {
				this._setGrab(target);
				this._setSelectionTo(e.clientX, e.clientY, e.shiftKey);
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
				if (isW3CEvents) { this._setGrab(target); }
				
				this._doubleClickSelection = null;
				this._setSelectionTo(e.clientX, e.clientY, e.shiftKey);
				this._doubleClickSelection = this._getSelection();
			}
		},
		_handleMouseDown: function (e) {
			if (!e) { e = window.event; }
			var left = e.which ? e.button === 0 : e.button === 1;
			this._commitIME();
			if (left) {
				this._isMouseDown = true;
				var deltaX = Math.abs(this._lastMouseX - e.clientX);
				var deltaY = Math.abs(this._lastMouseY - e.clientY);
				var time = e.timeStamp ? e.timeStamp : new Date().getTime();  
				if ((time - this._lastMouseTime) <= this._clickTime && deltaX <= this._clickDist && deltaY <= this._clickDist) {
					this._clickCount++;
				} else {
					this._clickCount = 1;
				}
				this._lastMouseX = e.clientX;
				this._lastMouseY = e.clientY;
				this._lastMouseTime = time;
				this._handleMouse(e);
			}
		},
		_handleMouseMove: function (e) {
			if (!e) { e = window.event; }
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
			if (!isW3CEvents) {
				if (e.button === 0) {
					this._setGrab(null);
					return true;
				}
				if (!this._isMouseDown && e.button === 1 && (this._clickCount & 1) !== 0) {
					this._clickCount = 2;
					return this._handleMouse(e, this._clickCount);
				}
			}
			
			var x = e.clientX;
			var y = e.clientY;
			var editorPad = this._getEditorPadding();
			var editorRect = this._editorDiv.getBoundingClientRect();
			var width = this._getClientWidth (), height = this._getClientHeight();
			var leftEdge = editorRect.left + editorPad.left;
			var topEdge = editorRect.top + editorPad.top;
			var rightEdge = editorRect.left + editorPad.left + width;
			var bottomEdge = editorRect.top + editorPad.top + height;
			var model = this._model;
			var caretLine = model.getLineAtOffset(this._getSelection().getCaret());
			if (y < topEdge && caretLine !== 0) {
				this._doAutoScroll("up", x, y - topEdge);
			} else if (y > bottomEdge && caretLine !== model.getLineCount() - 1) {
				this._doAutoScroll("down", x, y - bottomEdge);
			} else if (x < leftEdge) {
				this._doAutoScroll("left", x - leftEdge, y);
			} else if (x > rightEdge) {
				this._doAutoScroll("right", x - rightEdge, y);
			} else {
				this._endAutoScroll();
				this._setSelectionTo(x, y, true);
				// Feature in IE, IE does redraw the selection background right
				// away after the selection changes because of mouse move events.
				// The fix is to call getBoundingClientRect() on the
				// body element to force the selection to be redraw. Some how
				// calling this method forces a redraw.
				if (isIE) {
					var body = this._frameDocument.body;
					body.getBoundingClientRect();
				}
			}
		},
		_handleMouseUp: function (e) {
			if (!e) { e = window.event; }
			this._endAutoScroll();
			var left = e.which ? e.button === 0 : e.button === 1;
			if (left) {
				this._isMouseDown=false;
				
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
				if (isW3CEvents) { this._setGrab(null); }
			}
		},
		_handleMouseWheel: function (e) {
			if (!e) { e = window.event; }
			var lineHeight = this._getLineHeight();
			var pixelX = 0, pixelY = 0;
			// Note: On the Mac the correct behaviour is to scroll by pixel.
			if (isFirefox) {
				var pixel;
				if (isMac) {
					pixel = e.detail * 3;
				} else {
					var limit = 256;
					pixel = Math.max(-limit, Math.min(limit, e.detail)) * lineHeight;
				}
				if (e.axis === e.HORIZONTAL_AXIS) {
					pixelX = pixel;
				} else {
					pixelY = pixel;
				}
			} else {
				//Webkit
				if (isMac) {
					pixelX = -e.wheelDeltaX / 40;
					if (-1 < pixelX && pixelX < 0) { pixelX = -1; }
					if (0 < pixelX && pixelX < 1) { pixelX = 1; }
					pixelY = -e.wheelDeltaY / 40;
					if (-1 < pixelY && pixelY < 0) { pixelY = -1; }
					if (0 < pixelY && pixelY < 1) { pixelY = 1; }
				} else {
					pixelX = -e.wheelDeltaX;
					var linesToScroll = 8;
					pixelY = (-e.wheelDeltaY / 120 * linesToScroll) * lineHeight;
				}
			}
			this._scrollView(pixelX, pixelY);
			if (e.preventDefault) { e.preventDefault(); }
			return false;
		},
		_handlePaste: function (e) {
			if (this._ignorePaste) { return; }
			if (!e) { e = window.event; }
			if (this._doPaste(e)) {
				if (isIE) {
					/*
					 * Bug in IE,  
					 */
					var self = this;
					setTimeout(function() {self._updateDOMSelection();}, 0);
				}
				if (e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},
		_handleResize: function (e) {
			if (!e) { e = window.event; }
			var document = this._frameDocument;
			var element = isIE ? document.documentElement : document.body;
			var newWidth = element.clientWidth;
			var newHeight = element.clientHeight;
			if (this._editorWidth !== newWidth || this._editorHeight !== newHeight) {
				this._editorWidth = newWidth;
				this._editorHeight = newHeight;
//				this._queueUpdatePage();
				this._updatePage();
			}
		},
		_handleRulerEvent: function (e) {
			if (!e) { e = window.event; }
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
			if (ruler) {
				switch (e.type) {
					case "click":
						if (ruler.onClick) { ruler.onClick(lineIndex, e); }
						break;
					case "dblclick": 
						if (ruler.onDblClick) { ruler.onDblClick(lineIndex, e); }
						break;
				}
			}
		},
		_handleScroll: function () {
			var scroll = this._getScroll ();
			var oldX = this._hScroll;
			var oldY = this._vScroll;
			if (oldX !== scroll.x || (oldY !== scroll.y)) {
				this._hScroll = scroll.x;
				this._vScroll = scroll.y;
				this._commitIME();
				this._updatePage();
				var e = {
					oldValue: {x: oldX, y: oldY},
					newValue: scroll
				};
				this.onScroll(e);
			}
		},
		_handleSelectStart: function (e) {
			if (!e) { e = window.event; }
			if (this._ignoreSelect) {
				if (e && e.preventDefault) { e.preventDefault(); }
				return false;
			}
		},

		/************************************ Actions ******************************************/
		_doAction: function (e) {
			var keyBindings = this._keyBindings;
			for (var i = 0; i < keyBindings.length; i++) {
				var kb = keyBindings[i];
				if (kb.keyBinding.match(e)) {
					if (kb.name) {
						var actions = this._actions;
						for (var j = 0; j < actions.length; j++) {
							var a = actions[j];
							if (a.name === kb.name) {
								if (a.userHandler) {
									if (!a.userHandler()) {
										if (a.defaultHandler) {
											a.defaultHandler();
										}
									}
								} else if (a.defaultHandler) {
									a.defaultHandler();
								}
								break;
							}
						}
					}
					return true;
				}
			}
			return false;
		},
		_doBackspace: function (args) {
			var selection = this._getSelection();
			if (selection.isEmpty()) {
				var model = this._model;
				var caret = selection.getCaret();
				var lineIndex = model.getLineAtOffset(caret);
				if (caret === model.getLineStart(lineIndex)) {
					if (lineIndex > 0) {
						selection.extend(model.getLineEnd(lineIndex - 1));
					}
				} else {
					selection.extend(this._getOffset(caret, args.word, -1));
				}
			}
			this._modifyContent({text: "", start: selection.start, end: selection.end}, true);
			return true;
		},
		_doContent: function (text) {
			var selection = this._getSelection();
			this._modifyContent({text: text, start: selection.start, end: selection.end, _ignoreDOMSelection: true}, true);
		},
		_doCopy: function (e) {
			var selection = this._getSelection();
			if (!selection.isEmpty()) {
				var text = this._model.getText(selection.start, selection.end);
				return this._setClipboardText(text, e);
			}
			return true;
		},
		_doCursorNext: function (args) {
			if (!args.select) {
				if (this._clearSelection("next")) { return true; }
			}
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var lineIndex = model.getLineAtOffset(caret);
			if (caret === model.getLineEnd(lineIndex)) {
				if (lineIndex + 1 < model.getLineCount()) {
					selection.extend(model.getLineStart(lineIndex + 1));
				}
			} else {
				selection.extend(this._getOffset(caret, args.word, 1));
			}
			if (!args.select) { selection.collapse(); }
			this._setSelection(selection, true);
			return true;
		},
		_doCursorPrevious: function (args) {
			if (!args.select) {
				if (this._clearSelection("previous")) { return true; }
			}
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var lineIndex = model.getLineAtOffset(caret);
			if (caret === model.getLineStart(lineIndex)) {
				if (lineIndex > 0) {
					selection.extend(model.getLineEnd(lineIndex - 1));
				}
			} else {
				selection.extend(this._getOffset(caret, args.word, -1));
			}
			if (!args.select) { selection.collapse(); }
			this._setSelection(selection, true);
			return true;
		},
		_doCut: function (e) {
			var selection = this._getSelection();
			if (!selection.isEmpty()) {
				var text = this._model.getText(selection.start, selection.end);
				this._doContent("");
				return this._setClipboardText(text, e);
			}
			return true;
		},
		_doDelete: function (args) {
			var selection = this._getSelection();
			if (selection.isEmpty()) {
				var model = this._model;
				var caret = selection.getCaret();
				var lineIndex = model.getLineAtOffset(caret);
				if (caret === model.getLineEnd (lineIndex)) {
					if (lineIndex + 1 < model.getLineCount()) {
						selection.extend(model.getLineStart(lineIndex + 1));
					}
				} else {
					selection.extend(this._getOffset(caret, args.word, 1));
				}
			}
			this._modifyContent({text: "", start: selection.start, end: selection.end}, true);
			return true;
		},
		_doEnd: function (args) {
			var selection = this._getSelection();
			var model = this._model;
			if (args.ctrl) {
				selection.extend(model.getCharCount());
			} else {
				var lineIndex = model.getLineAtOffset(selection.getCaret());
				selection.extend(model.getLineEnd(lineIndex)); 
			}
			if (!args.select) { selection.collapse(); }
			this._setSelection(selection, true);
			return true;
		},
		_doEnter: function (args) {
			var model = this._model;
			this._doContent(model.getLineDelimiter()); 
			return true;
		},
		_doHome: function (args) {
			var selection = this._getSelection();
			var model = this._model;
			if (args.ctrl) {
				selection.extend(0);
			} else {
				var lineIndex = model.getLineAtOffset(selection.getCaret());
				selection.extend(model.getLineStart(lineIndex)); 
			}
			if (!args.select) { selection.collapse(); }
			this._setSelection(selection, true);
			return true;
		},
		_doLineDown: function (args) {
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var lineIndex = model.getLineAtOffset(caret);
			if (lineIndex + 1 < model.getLineCount()) {
				var x = this._columnX;
				if (x === -1 || args.select) {
					x = this._getOffsetToX(caret);
				}
				selection.extend(this._getXToOffset(lineIndex + 1, x));
				if (!args.select) { selection.collapse(); }
				this._setSelection(selection, true, true);
				this._columnX = x;//fix x by scrolling
			}
			return true;
		},
		_doLineUp: function (args) {
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var lineIndex = model.getLineAtOffset(caret);
			if (lineIndex > 0) {
				var x = this._columnX;
				if (x === -1 || args.select) {
					x = this._getOffsetToX(caret);
				}
				selection.extend(this._getXToOffset(lineIndex - 1, x));
				if (!args.select) { selection.collapse(); }
				this._setSelection(selection, true, true);
				this._columnX = x;//fix x by scrolling
			}
			return true;
		},
		_doPageDown: function (args) {
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var caretLine = model.getLineAtOffset(caret);
			var lineCount = model.getLineCount();
			if (caretLine < lineCount - 1) {
				var clientHeight = this._getClientHeight();
				var lineHeight = this._getLineHeight();
				var lines = Math.floor(clientHeight / lineHeight);
				var scrollLines = Math.min(lineCount - caretLine - 1, lines);
				scrollLines = Math.max(1, scrollLines);
				var x = this._columnX;
				if (x === -1 || args.select) {
					x = this._getOffsetToX(caret);
				}
				selection.extend(this._getXToOffset(caretLine + scrollLines, x));
				if (!args.select) { selection.collapse(); }
				this._setSelection(selection, false, false);
				
				var verticalMaximum = lineCount * lineHeight;
				var verticalScrollOffset = this._getScroll().y;
				var scrollOffset = verticalScrollOffset + scrollLines * lineHeight;
				if (scrollOffset + clientHeight > verticalMaximum) {
					scrollOffset = verticalMaximum - clientHeight;
				} 
				if (scrollOffset > verticalScrollOffset) {
					this._scrollView(0, scrollOffset - verticalScrollOffset);
				} else {
					this._updateDOMSelection();
				}
				this._columnX = x;//fix x by scrolling
			}
			return true;
		},
		_doPageUp: function (args) {
			var model = this._model;
			var selection = this._getSelection();
			var caret = selection.getCaret();
			var caretLine = model.getLineAtOffset(caret);
			if (caretLine > 0) {
				var clientHeight = this._getClientHeight();
				var lineHeight = this._getLineHeight();
				var lines = Math.floor(clientHeight / lineHeight);
				var scrollLines = Math.max(1, Math.min(caretLine, lines));
				var x = this._columnX;
				if (x === -1 || args.select) {
					x = this._getOffsetToX(caret);
				}
				selection.extend(this._getXToOffset(caretLine - scrollLines, x));
				if (!args.select) { selection.collapse(); }
				this._setSelection(selection, false, false);
				
				var verticalScrollOffset = this._getScroll().y;
				var scrollOffset = Math.max(0, verticalScrollOffset - scrollLines * lineHeight);
				if (scrollOffset < verticalScrollOffset) {
					this._scrollView(0, scrollOffset - verticalScrollOffset);
				} else {
					this._updateDOMSelection();
				}
				this._columnX = x;//fix x by scrolling
			}
			return true;
		},
		_doPaste: function(e) {
			var text = this._getClipboardText(e);
			if (text) {
				this._doContent(text);
			}
			return text !== null;
		},
		_doSelectAll: function (args) {
			var model = this._model;
			var selection = this._getSelection();
			selection.setCaret(0);
			selection.extend(model.getCharCount());
			this._setSelection(selection, false);
			return true;
		},
		_doTab: function (args) {
			this._doContent("\t"); 
			return true;
		},
		
		/************************************ Internals ******************************************/
		_applyStyle: function(style, node) {
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
		},
		_autoScroll: function () {
			var selection = this._getSelection();
			var line;
			var x = this._autoScrollX;
			if (this._autoScrollDir === "up" || this._autoScrollDir === "down") {
				var scroll = this._autoScrollY / this._getLineHeight();
				scroll = scroll < 0 ? Math.floor(scroll) : Math.ceil(scroll);
				line = this._model.getLineAtOffset(selection.getCaret());
				line = Math.max(0, Math.min(this._model.getLineCount() - 1, line + scroll));
			} else if (this._autoScrollDir === "left" || this._autoScrollDir === "right") {
				line = this._getYToLine(this._autoScrollY);
				x += this._getOffsetToX(selection.getCaret());
			}
			selection.extend(this._getXToOffset(line, x));
			this._setSelection(selection, true);
		},
		_autoScrollTimer: function () {
			this._autoScroll();
			var self = this;
			this._autoScrollTimerID = setTimeout(function () {self._autoScrollTimer();}, this._AUTO_SCROLL_RATE);
		},
		_calculateLineHeight: function() {
			var document = this._frameDocument;
			var parent = this._clientDiv;
			var span1 = document.createElement("SPAN");
			span1.appendChild(document.createTextNode("W"));
			parent.appendChild(span1);
			var br = document.createElement("BR");
			parent.appendChild(br);
			var span2 = document.createElement("SPAN");
			span2.appendChild(document.createTextNode("W"));
			parent.appendChild(span2);
			var rect1 = span1.getBoundingClientRect();
			var rect2 = span2.getBoundingClientRect();
			var lineHeight = rect2.top - rect1.top;
			parent.removeChild(span1);
			parent.removeChild(br);
			parent.removeChild(span2);
			return lineHeight; 
		},
		_clearSelection: function (direction) {
			var selection = this._getSelection();
			if (selection.isEmpty()) { return false; }
			if (direction === "next") {
				selection.start = selection.end;
			} else {
				selection.end = selection.start;
			}
			this._setSelection(selection, true);
			return true;
		},
		_commitIME: function () {
			if (this._imeOffset === -1) { return; }
			// make the state of the IME match the state the editor expects it be in
			// when the editor commits the text and IME also need to be committed
			// this can be accomplished by changing the focus around
			this._scrollDiv.focus();
			this._clientDiv.focus();
			
			var model = this._model;
			var lineIndex = model.getLineAtOffset(this._imeOffset);
			var lineStart = model.getLineStart(lineIndex);
			var newText = this._getDOMText(lineIndex);
			var oldText = model.getLine(lineIndex);
			var start = this._imeOffset - lineStart;
			var end = start + newText.length - oldText.length;
			if (start !== end) {
				var insertText = newText.substring(start, end);
				this._doContent(insertText);
			}
			this._imeOffset = -1;
		},
		_createActions: function () {
			var KeyBinding = eclipse.KeyBinding;
			//no duplicate keybindings
			var bindings = this._keyBindings = [];

			// Cursor Navigation
			bindings.push({name: "lineUp",		keyBinding: new KeyBinding(38), predefined: true});
			bindings.push({name: "lineDown",	keyBinding: new KeyBinding(40), predefined: true});
			bindings.push({name: "charPrevious",	keyBinding: new KeyBinding(37), predefined: true});
			bindings.push({name: "charNext",	keyBinding: new KeyBinding(39), predefined: true});
			bindings.push({name: "pageUp",		keyBinding: new KeyBinding(33), predefined: true});
			bindings.push({name: "pageDown",	keyBinding: new KeyBinding(34), predefined: true});
			if (isMac) {
				bindings.push({name: "lineStart",	keyBinding: new KeyBinding(37, true), predefined: true});
				bindings.push({name: "lineEnd",		keyBinding: new KeyBinding(39, true), predefined: true});
				bindings.push({name: "wordPrevious",	keyBinding: new KeyBinding(37, null, null, true), predefined: true});
				bindings.push({name: "wordNext",	keyBinding: new KeyBinding(39, null, null, true), predefined: true});
				bindings.push({name: "textStart",	keyBinding: new KeyBinding(36), predefined: true});
				bindings.push({name: "textEnd",		keyBinding: new KeyBinding(35), predefined: true});
				bindings.push({name: "textStart",	keyBinding: new KeyBinding(38, true), predefined: true});
				bindings.push({name: "textEnd",		keyBinding: new KeyBinding(40, true), predefined: true});
			} else {
				bindings.push({name: "lineStart",	keyBinding: new KeyBinding(36), predefined: true});
				bindings.push({name: "lineEnd",		keyBinding: new KeyBinding(35), predefined: true});
				bindings.push({name: "wordPrevious",	keyBinding: new KeyBinding(37, true), predefined: true});
				bindings.push({name: "wordNext",	keyBinding: new KeyBinding(39, true), predefined: true});
				bindings.push({name: "textStart",	keyBinding: new KeyBinding(36, true), predefined: true});
				bindings.push({name: "textEnd",		keyBinding: new KeyBinding(35, true), predefined: true});
			}

			// Select Cursor Navigation
			bindings.push({name: "selectLineUp",		keyBinding: new KeyBinding(38, null, true), predefined: true});
			bindings.push({name: "selectLineDown",		keyBinding: new KeyBinding(40, null, true), predefined: true});
			bindings.push({name: "selectCharPrevious",	keyBinding: new KeyBinding(37, null, true), predefined: true});
			bindings.push({name: "selectCharNext",		keyBinding: new KeyBinding(39, null, true), predefined: true});
			bindings.push({name: "selectPageUp",		keyBinding: new KeyBinding(33, null, true), predefined: true});
			bindings.push({name: "selectPageDown",		keyBinding: new KeyBinding(34, null, true), predefined: true});
			if (isMac) {
				bindings.push({name: "selectLineStart",	keyBinding: new KeyBinding(37, true, true), predefined: true});
				bindings.push({name: "selectLineEnd",		keyBinding: new KeyBinding(39, true, true), predefined: true});
				bindings.push({name: "selectWordPrevious",	keyBinding: new KeyBinding(37, null, true, true), predefined: true});
				bindings.push({name: "selectWordNext",	keyBinding: new KeyBinding(39, null, true, true), predefined: true});
				bindings.push({name: "selectTextStart",	keyBinding: new KeyBinding(36, null, true), predefined: true});
				bindings.push({name: "selectTextEnd",		keyBinding: new KeyBinding(35, null, true), predefined: true});
				bindings.push({name: "selectTextStart",	keyBinding: new KeyBinding(38, true, true), predefined: true});
				bindings.push({name: "selectTextEnd",		keyBinding: new KeyBinding(40, true, true), predefined: true});
			} else {
				bindings.push({name: "selectLineStart",		keyBinding: new KeyBinding(36, null, true), predefined: true});
				bindings.push({name: "selectLineEnd",		keyBinding: new KeyBinding(35, null, true), predefined: true});
				bindings.push({name: "selectWordPrevious",	keyBinding: new KeyBinding(37, true, true), predefined: true});
				bindings.push({name: "selectWordNext",		keyBinding: new KeyBinding(39, true, true), predefined: true});
				bindings.push({name: "selectTextStart",		keyBinding: new KeyBinding(36, true, true), predefined: true});
				bindings.push({name: "selectTextEnd",		keyBinding: new KeyBinding(35, true, true), predefined: true});
			}

			//Misc
			bindings.push({name: "deletePrevious",		keyBinding: new KeyBinding(8), predefined: true});
			bindings.push({name: "deletePrevious",		keyBinding: new KeyBinding(8, null, true), predefined: true});
			bindings.push({name: "deleteNext",		keyBinding: new KeyBinding(46), predefined: true});
			bindings.push({name: "deleteWordPrevious",	keyBinding: new KeyBinding(8, true), predefined: true});
			bindings.push({name: "deleteWordPrevious",	keyBinding: new KeyBinding(8, true, true), predefined: true});
			bindings.push({name: "deleteWordNext",		keyBinding: new KeyBinding(46, true), predefined: true});
			bindings.push({name: "tab",			keyBinding: new KeyBinding(9), predefined: true});
			bindings.push({name: "enter",			keyBinding: new KeyBinding(13), predefined: true});
			bindings.push({name: "selectAll",		keyBinding: new KeyBinding('a', true), predefined: true});
			if (isMac) {
				bindings.push({name: "deleteNext",		keyBinding: new KeyBinding(46, null, true), predefined: true});
				bindings.push({name: "deleteWordPrevious",	keyBinding: new KeyBinding(8, null, null, true), predefined: true});
				bindings.push({name: "deleteWordNext",		keyBinding: new KeyBinding(46, null, null, true), predefined: true});
			}
				
			//bug in IE: prevent ctrl+'u' and ctrl+'i' from applying styles to the text
			bindings.push({name: null,			keyBinding: new KeyBinding('u', true), predefined: true});
			bindings.push({name: null,			keyBinding: new KeyBinding('i', true), predefined: true});

			if (isFirefox) {
				bindings.push({name: "copy", keyBinding: new KeyBinding(45, true), predefined: true});
				bindings.push({name: "paste", keyBinding: new KeyBinding(45, null, true), predefined: true});
				bindings.push({name: "cut", keyBinding: new KeyBinding(46, null, true), predefined: true});
			}

			//1 to 1, no duplicates
			var self = this;
			this._actions = [
				{name: "lineUp",		defaultHandler: function() {return self._doLineUp({select: false});}},
				{name: "lineDown",		defaultHandler: function() {return self._doLineDown({select: false});}},
				{name: "lineStart",		defaultHandler: function() {return self._doHome({select: false, ctrl:false});}},
				{name: "lineEnd",		defaultHandler: function() {return self._doEnd({select: false, ctrl:false});}},
				{name: "charPrevious",		defaultHandler: function() {return self._doCursorPrevious({select: false, word:false});}},
				{name: "charNext",		defaultHandler: function() {return self._doCursorNext({select: false, word:false});}},
				{name: "pageUp",		defaultHandler: function() {return self._doPageUp({select: false});}},
				{name: "pageDown",		defaultHandler: function() {return self._doPageDown({select: false});}},
				{name: "wordPrevious",		defaultHandler: function() {return self._doCursorPrevious({select: false, word:true});}},
				{name: "wordNext",		defaultHandler: function() {return self._doCursorNext({select: false, word:true});}},
				{name: "textStart",		defaultHandler: function() {return self._doHome({select: false, ctrl:true});}},
				{name: "textEnd",		defaultHandler: function() {return self._doEnd({select: false, ctrl:true});}},
				
				{name: "selectLineUp",		defaultHandler: function() {return self._doLineUp({select: true});}},
				{name: "selectLineDown",	defaultHandler: function() {return self._doLineDown({select: true});}},
				{name: "selectLineStart",	defaultHandler: function() {return self._doHome({select: true, ctrl:false});}},
				{name: "selectLineEnd",		defaultHandler: function() {return self._doEnd({select: true, ctrl:false});}},
				{name: "selectCharPrevious",	defaultHandler: function() {return self._doCursorPrevious({select: true, word:false});}},
				{name: "selectCharNext",	defaultHandler: function() {return self._doCursorNext({select: true, word:false});}},
				{name: "selectPageUp",		defaultHandler: function() {return self._doPageUp({select: true});}},
				{name: "selectPageDown",	defaultHandler: function() {return self._doPageDown({select: true});}},
				{name: "selectWordPrevious",	defaultHandler: function() {return self._doCursorPrevious({select: true, word:true});}},
				{name: "selectWordNext",	defaultHandler: function() {return self._doCursorNext({select: true, word:true});}},
				{name: "selectTextStart",	defaultHandler: function() {return self._doHome({select: true, ctrl:true});}},
				{name: "selectTextEnd",		defaultHandler: function() {return self._doEnd({select: true, ctrl:true});}},
				
				{name: "deletePrevious",	defaultHandler: function() {return self._doBackspace({word:false});}},
				{name: "deleteNext",		defaultHandler: function() {return self._doDelete({word:false});}},
				{name: "deleteWordPrevious",	defaultHandler: function() {return self._doBackspace({word:true});}},
				{name: "deleteWordNext",	defaultHandler: function() {return self._doDelete({word:true});}},
				{name: "tab",			defaultHandler: function() {return self._doTab();}},
				{name: "enter",			defaultHandler: function() {return self._doEnter();}},
				{name: "selectAll",		defaultHandler: function() {return self._doSelectAll();}},
				{name: "copy",			defaultHandler: function() {return self._doCopy();}},
				{name: "cut",			defaultHandler: function() {return self._doCut();}},
				{name: "paste",			defaultHandler: function() {return self._doPaste();}}
			];
		},
		_createLine: function(parent, sibling, document, lineIndex, model) {
			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var e = {lineIndex: lineIndex, lineText: lineText, lineStart: lineStart};
			this.onLineStyle(e);
			var child = document.createElement("DIV");
			child.lineIndex = lineIndex;
			this._applyStyle(e.style, child);

			/*
			* Firefox does not extend the selection at the end of the line when the
			* line is fully selected. The fix is to add an extra space at the end of
			* the line.
			*/
			var extendSelection = isFirefox;
			if (lineText.length === 0) {
				/*
				* When the span is empty the height of the line div becomes zero.
				* The fix is use a zero-width non-break space to preserve the default
				* height in the line div. Note that in Chrome this character shows
				* a glyph, for this reason the zero-width non-joiner character is
				* used instead.
				*/
				if (!extendSelection) {
					var span = document.createElement("SPAN");
					span.ignoreChars = 1;
					span.appendChild(document.createTextNode(isChrome ? "\u200C" : "\uFEFF"));
					child.appendChild(span);
				}
			} else {
				this._createRange(child, document, e.ranges, 0, lineText.length, lineText, lineStart);
			}
			if (extendSelection) {
				var ext = document.createElement("SPAN");
				ext.ignoreChars = 1;
				ext.appendChild(document.createTextNode(" "));
				child.appendChild(ext);
			}
			parent.insertBefore(child, sibling);
			return child;
		},
		_createRange: function(parent, document, ranges, start, end, text, lineStart) {
			if (start >= end) { return; }
			var span;
			if (ranges) {
				for (var i = 0; i < ranges.length; i++) {
					var range = ranges[i];
					var styleStart = Math.max(lineStart, range.start) - lineStart;
					var styleEnd = Math.min(lineStart + text.length, range.end) - lineStart;
					if (styleStart >= end) { break; }
					if ((start <= styleStart && styleStart < end) || (start <= styleEnd && styleEnd < end)) {
						styleStart = Math.max(start, styleStart);
						styleEnd = Math.min(end, styleEnd);
						if (start < styleStart) {
							span = document.createElement("SPAN");
							span.appendChild(document.createTextNode(text.substring(start, styleStart)));
							parent.appendChild(span);
						}
						span = document.createElement("SPAN");
						span.appendChild(document.createTextNode(text.substring(styleStart, styleEnd)));
						this._applyStyle(range.style, span);
						parent.appendChild(span);
						start = styleEnd;
					}
				}
			}
			if (start < end) {
				span = document.createElement("SPAN");
				span.appendChild(document.createTextNode(text.substring(start, end)));
				parent.appendChild(span);
			}
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
			if (this._autoScrollTimerID) { clearTimeout(this._autoScrollTimerID); }
			this._autoScrollDir = undefined;
			this._autoScrollTimerID = undefined;
		},
		_getBoundsAtOffset: function (offset) {
			return isIE ? this._getBoundsAtOffset_IE(offset) : this._getBoundsAtOffset_FF(offset);
		},
		_getBoundsAtOffset_FF: function (offset) {
			var model = this._model;
			var document = this._frameDocument;
			var clientDiv = this._clientDiv;
			var lineIndex = model.getLineAtOffset(offset);
			var dummy;
			var child = this._getLineNode(lineIndex);
			if (!child) {
				child = dummy = this._createLine(clientDiv, null, document, lineIndex, model);
			}
			var result = null;
			if (offset < model.getLineEnd(lineIndex)) {
				var lineChild = child.firstChild;
				var spanOffset = model.getLineStart(lineIndex);
				while (lineChild) {
					if (!lineChild.ignoreChars) {
						var textNode = lineChild.firstChild;
						var spanEndOffset = spanOffset + textNode.length; 
						if (spanEndOffset > offset) {
							var text = textNode.data;
							var index = offset - spanOffset;
							lineChild.removeChild(textNode);
							lineChild.appendChild(document.createTextNode(text.substring(0, index)));
							var span = document.createElement("SPAN");
							span.appendChild(document.createTextNode(text.substring(index, index + 1)));
							lineChild.appendChild(span);
							lineChild.appendChild(document.createTextNode(text.substring(index + 1)));
							result = span.getBoundingClientRect();
							lineChild.innerHTML = "";
							lineChild.appendChild(textNode);
							if (!dummy) {
								/*
								 * Removing the element node that holds the selection start or end
								 * causes the selection to be lost. The fix is to detect this case
								 * and restore the selection. 
								 */
								var selection = this._getSelection();
								if ((spanOffset <= selection.start && selection.start < spanEndOffset) || (spanOffset <= selection.end && selection.end < spanEndOffset)) {
									this._updateDOMSelection();
								}
							}
							break;
						}
						spanOffset = spanEndOffset;
					}
					lineChild = lineChild.nextSibling;
				}
			}
			if (!result) {
				var rect = this._getLineBoundingClientRect(child);
				result = {left: rect.right, right: rect.right};
			}
			if (dummy) { clientDiv.removeChild(dummy); }
			return result;
		},
		_getBoundsAtOffset_IE: function (offset) {
			var document = this._frameDocument;
			var clientDiv = this._clientDiv;
			var model = this._model;
			var lineIndex = model.getLineAtOffset(offset);
			var dummy;
			var child = this._getLineNode(lineIndex);
			if (!child) {
				child = dummy = this._createLine(clientDiv, null, document, lineIndex, model);
			}
			var result = {left: 0, right: 0};
			if (offset === model.getLineEnd(lineIndex)) {
				var rect = this._getLineBoundingClientRect(child);
				result = {left: rect.right, right: rect.right};
			} else {
				var lineOffset = model.getLineStart(lineIndex);
				var lineChild = child.firstChild;
				while (lineChild) {
					var node = lineChild.firstChild;
					if (!node.ignoreChars) {
						if (node.length + lineOffset > offset) {
							var range = document.body.createTextRange();
							range.moveToElementText(lineChild);
							range.collapse();
							range.moveEnd("character", offset - lineOffset + 1);
							range.moveStart("character", offset - lineOffset);
							result = range.getBoundingClientRect();
							break;
						}
						lineOffset += node.length;
					}
					lineChild = lineChild.nextSibling;
				}
			}
			if (dummy) { clientDiv.removeChild(dummy); }
			return result;
		},
		_getBottomIndex: function (fullyVisible) {
			var child = this._bottomChild;
			if (fullyVisible && this._getClientHeight() > this._getLineHeight()) {
				var rect = child.getBoundingClientRect();
				var clientRect = this._clientDiv.getBoundingClientRect();
				if (rect.bottom > clientRect.bottom && child.previousSibling) {
					child = child.previousSibling;
				}
			}
			return child.lineIndex;
		},
		_getFrameHeight: function() {
			return this._frameDocument.documentElement.clientHeight;
		},
		_getFrameWidth: function() {
			return this._frameDocument.documentElement.clientWidth;
		},
		_getClientHeight: function() {
			var editorPad = this._getEditorPadding();
			return Math.max(0, this._editorDiv.clientHeight - editorPad.top - editorPad.bottom);
		},
		_getClientWidth: function() {
			var editorPad = this._getEditorPadding();
			return Math.max(0, this._editorDiv.clientWidth - editorPad.left - editorPad.right);
		},
		_getClipboardText: function (event) {
			if (this._frameWindow.clipboardData) {
				//IE
				return this._frameWindow.clipboardData.getData("Text");
			}
			if (isFirefox) {
				var textArea = this._textArea;
				textArea.innerHTML = "";
				textArea.focus();
				var delimiter = this._model.getLineDelimiter();
				var getText = function() {
					var text;
					if (textArea.firstChild) {
						text = "";
						var child = textArea.firstChild;
						while (child) {
							if (child.nodeType === child.TEXT_NODE) {
								text += child.data;
							} else if (child.tagName === "BR") {
								text += delimiter; 
							} 
							child = child.nextSibling;
						}
					} else {
						text = textArea.value;
					}
					return text;
				};
				
				//Try execCommand first. Works on firefox with clipboard permission,
				var result = false;
				this._ignorePaste = true;
				try {
					var document = this._frameDocument;
					result = document.execCommand("paste", false, null);
				} catch (ex) {
				}
				this._ignorePaste = false;
				
				if (!result) {
					//Try native paste in the text area, works for firefox (asynchronously) 
					//only works during the paste event
					if (event) {
						var self = this;
						setTimeout(function() {
							self.focus();
							var text = getText();
							if (text) { self._doContent(text); }
						}, 0);
						return null;
					} else {
						//no event and no clipboard permission, paste can't be performed
						//suggest allow clipboard helper to the user
						this.focus();
						return "";
					}
				}
				this.focus();
				return getText();
			}
			//webkit
			if (event && event.clipboardData) {
				// Webkit (Chrome/Safari) allows getData during the paste event
				// Note: setData is not allowed, not even during copy/cut event
				return event.clipboardData.getData("text/plain");
			} else {
				//TODO try paste using extension (Chrome only)
			}
			return "";
		},
		_getDOMText: function(lineIndex) {
			var child = this._getLineNode(lineIndex);
			var lineChild = child.firstChild;
			var text = "";
			while (lineChild) {
				var subNode = lineChild.firstChild;
				while (subNode) {
					// Note: This assumes that the ignoreChars are always at the end of the lineChild
					if (lineChild.ignoreChars && lineChild.lastChild === subNode) {
						text += subNode.data.substring (0, subNode.length - lineChild.ignoreChars);
					} else {
						text += subNode.data;
					}
					subNode = subNode.nextSibling;
				}
				lineChild = lineChild.nextSibling;
			}
			return text;
		},
		_getEditorPadding: function() {
			if (!this._editorPadding) {
				this._editorPadding = this._getPadding(this._editorDiv);
			}
			return this._editorPadding;
		},
		_getLineBoundingClientRect: function (child) {
			var rect = child.getBoundingClientRect();
			var lastChild = child.lastChild;
			while (lastChild && lastChild.ignoreChars) {
				lastChild = lastChild.previousSibling;
			}
			if (!lastChild) {
				return {left: rect.left, top: rect.top, right: rect.left, bottom: rect.bottom};
			}
			var lastRect = lastChild.getBoundingClientRect();
			return {left: rect.left, top: rect.top, right: lastRect.right, bottom: rect.bottom};
		},
		_getLineHeight: function() {
			var document = this._frameDocument;
			var body = document.body;
			return parseInt(body.style.lineHeight, 10);
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
		_getOffset: function (offset, word, direction) {
			return isIE ?  this._getOffset_IE(offset, word, direction) : this._getOffset_FF(offset, word, direction);
		},
		_getOffset_FF: function (offset, word, direction) {
			if (word) {
				var model = this._model;
				var lineIndex = model.getLineAtOffset(offset);
				var lineText = model.getLine(lineIndex);
				var lineStart = model.getLineStart(lineIndex);
				var lineEnd = model.getLineEnd(lineIndex);
				var lineLength = lineText.length;
				var offsetInLine = offset - lineStart;
				
				var isPunctuation = function isPunctuation(c) {
					return (33 <= c && c <= 47) || (58 <= c && c <= 64) || (91 <= c && c <= 94) || c === 96 || (123 <= c && c <= 126);
				};
 
				var isWhitespace = function isWhitespace(c) {
					return c === 32 || c === 9;
				};
				
				var c, previousPunctuation, previousLetterOrDigit, punctuation, letterOrDigit;
				if (direction > 0) {
					if (offsetInLine === lineLength) { return lineEnd; }
					c = lineText.charCodeAt(offsetInLine);
					previousPunctuation = isPunctuation(c); 
					previousLetterOrDigit = !previousPunctuation && !isWhitespace(c);
					offsetInLine++;
					while (offsetInLine < lineLength) {
						c = lineText.charCodeAt(offsetInLine);
						punctuation = isPunctuation(c);
						if (punctuation && !previousPunctuation) { break; }
						letterOrDigit  = !punctuation && !isWhitespace(c);
						if (letterOrDigit && !previousLetterOrDigit) { break; }
						previousLetterOrDigit = letterOrDigit;
						previousPunctuation = punctuation;
						offsetInLine++;
					}
				} else {
					if (offsetInLine === 0) { return lineStart; }
					offsetInLine--;
					c = lineText.charCodeAt(offsetInLine);
					previousPunctuation = isPunctuation(c); 
					previousLetterOrDigit = !previousPunctuation && !isWhitespace(c);
					while (0 < offsetInLine) {
						c = lineText.charCodeAt(offsetInLine - 1);
						punctuation = isPunctuation(c);
						if (!punctuation && previousPunctuation) { break; }
						letterOrDigit  = !punctuation && !isWhitespace(c);
						if (!letterOrDigit && previousLetterOrDigit) { break; }
						previousLetterOrDigit = letterOrDigit;
						previousPunctuation = punctuation;
						offsetInLine--;
					}
				}
				return lineStart + offsetInLine;
			}
			return offset + direction;
		},
		_getOffset_IE: function (offset, word, direction) {
			var document = this._frameDocument;
			var model = this._model;
			var lineIndex = model.getLineAtOffset(offset);
			var clientDiv = this._clientDiv;
			var dummy;
			var child = this._getLineNode(lineIndex);
			if (!child) {
				child = dummy = this._createLine(clientDiv, null, document, lineIndex, model);
			}
			var result = 0, range, length;
			var lineOffset = model.getLineStart(lineIndex);
			if (offset === model.getLineEnd(lineIndex)) {
				range = document.body.createTextRange();
				range.moveToElementText(child.lastChild);
				length = range.text.length;
				range.moveEnd(word ? "word" : "character", direction);
				result = offset + range.text.length - length;
			} else if (offset === lineOffset && direction < 0) {
				result = lineOffset;
			} else {
				var lineChild = child.firstChild;
				while (lineChild) {
					if (!lineChild.ignoreChars) {
						var node = lineChild.firstChild;
						if (node.length + lineOffset > offset) {
							range = document.body.createTextRange();
							if (offset === lineOffset && direction < 0) {
								range.moveToElementText(lineChild.previousSibling);
							} else {
								range.moveToElementText(lineChild);
								range.collapse();
								range.moveEnd("character", offset - lineOffset);
							}
							length = range.text.length;
							range.moveEnd(word ? "word" : "character", direction);
							result = offset + range.text.length - length;
							break;
						}
						lineOffset = node.length + lineOffset;
					}
					lineChild = lineChild.nextSibling;
				}
			}
			if (dummy) { clientDiv.removeChild(dummy); }
			return result;
		},
		_getOffsetToX: function (offset) {
			return this._getBoundsAtOffset(offset).left;
		},
		_getPadding: function (node) {
			var left,top,right,bottom;
			if (node.currentStyle) {
				left = node.currentStyle.paddingLeft;
				top = node.currentStyle.paddingTop;
				right = node.currentStyle.paddingRight;
				bottom = node.currentStyle.paddingBottom;
			} else if (this._frameWindow.getComputedStyle) {
				var style = this._frameWindow.getComputedStyle(node, null);
				left = style.getPropertyValue("padding-left");
				top = style.getPropertyValue("padding-top");
				right = style.getPropertyValue("padding-right");
				bottom = style.getPropertyValue("padding-bottom");
			}
			return {
					left: parseInt(left, 10), 
					top: parseInt(top, 10),
					right: parseInt(right, 10),
					bottom: parseInt(bottom, 10)
			};
		},
		_getScroll: function() {
			var editorDiv = this._editorDiv;
			return {x: editorDiv.scrollLeft, y: editorDiv.scrollTop};
		},
		_getSelection: function () {
			return this._selection.clone();
		},
		_getTopIndex: function (fullyVisible) {
			var child = this._topChild;
			if (fullyVisible && this._getClientHeight() > this._getLineHeight()) {
				var rect = child.getBoundingClientRect();
				var editorPad = this._getEditorPadding();
				var editorRect = this._editorDiv.getBoundingClientRect();
				if (rect.top < editorRect.top + editorPad.top && child.nextSibling) {
					child = child.nextSibling;
				}
			}
			return child.lineIndex;
		},
		_getXToOffset: function (lineIndex, x) {
			return isIE ? this._getXToOffset_IE(lineIndex, x) : this._getXToOffset_FF(lineIndex, x);
		},
		_getXToOffset_FF: function (lineIndex, x) {
			var model = this._model;
			var document = this._frameDocument;
			var clientDiv = this._clientDiv;
			var dummy;
			var child = this._getLineNode(lineIndex);
			if (!child) {
				child = dummy = this._createLine(clientDiv, null, document, lineIndex, model);
			}
			var lineRect = this._getLineBoundingClientRect(child);
			if (x < lineRect.left) { x = lineRect.left; }
			if (x > lineRect.right) { x = lineRect.right; }
			var offset = model.getLineStart(lineIndex);
			var lineChild = child.firstChild;
			done:
			while (lineChild) {
				if (!lineChild.ignoreChars) {
					var textNode = lineChild.firstChild;
					var rects = lineChild.getClientRects();
					for (var i = 0; i < rects.length; i++) {
						var rect = rects[i];
						if (rect.left <= x && x < rect.right) {
							var newText = [];
							for (var j = 0; j < textNode.length; j++) {
								newText.push("<span>");
								newText.push(textNode.substringData(j, 1));
								newText.push("</span>");
							}
							lineChild.innerHTML = newText.join("");
							var rangeChild = lineChild.firstChild;
							while (rangeChild) {
								rect = rangeChild.getBoundingClientRect();
								if (rect.left <= x && x < rect.right) {
									//TODO test for character trailing (wrong for bidi)
									if (x > rect.left + (rect.right - rect.left) / 2) {
										offset++;
									}
									break;
								}
								offset++;
								rangeChild = rangeChild.nextSibling;
							}
							if (!dummy) {
								lineChild.innerHTML = "";
								lineChild.appendChild(textNode);
								/*
								 * Removing the element node that holds the selection start or end
								 * causes the selection to be lost. The fix is to detect this case
								 * and restore the selection. 
								 */
								var selection = this._getSelection();
								var spanOffset = offset, spanEndOffset = offset + textNode.length;
								if ((spanOffset <= selection.start && selection.start < spanEndOffset) || (spanOffset <= selection.end && selection.end < spanEndOffset)) {
									this._updateDOMSelection();
								}
							}
							break done;
						}
					}
					offset += textNode.length;
				}
				lineChild = lineChild.nextSibling;
			}
			if (dummy) { clientDiv.removeChild(dummy); }
			return offset;
		},
		_getXToOffset_IE: function (lineIndex, x) {
			var model = this._model;
			var document = this._frameDocument;
			var clientDiv = this._clientDiv;
			var dummy;
			var child = this._getLineNode(lineIndex);
			if (!child) {
				child = dummy = this._createLine(clientDiv, null, document, lineIndex, model);
			}
			var lineRect = this._getLineBoundingClientRect(child);
			if (x < lineRect.left) { x = lineRect.left; }
			if (x > lineRect.right) { x = lineRect.right; }
			/*
			* Bug in IE. The coordinates of getClientRects() are relative to
			* the browser window.  The fix is to convert to the frame window
			* before using it. 
			*/
			var rects = child.getClientRects();
			var minLeft = rects[0].left;
			for (var i=1; i<rects.length; i++) {
				minLeft = Math.min(rects[i].left, minLeft);
			}
			var deltaX = minLeft - lineRect.left;
			var scrollX = this._getScroll().x;
			function getClientRects(element) {
				var rects, newRects, i, r;
				if (!element._rectsCache) {
					rects = element.getClientRects();
					newRects = [rects.length];
					for (i = 0; i<rects.length; i++) {
						r = rects[i];
						newRects[i] = {left: r.left - deltaX + scrollX, top: r.top, right: r.right - deltaX + scrollX, bottom: r.bottom};
					}
					element._rectsCache = newRects; 
				}
				rects = element._rectsCache;
				newRects = [rects.length];
				for (i = 0; i<rects.length; i++) {
					r = rects[i];
					newRects[i] = {left: r.left - scrollX, top: r.top, right: r.right - scrollX, bottom: r.bottom};
				}
				return newRects;
			}
			var offset = model.getLineStart(lineIndex);
			var lineChild = child.firstChild;
			done:
			while (lineChild) {
				if (!lineChild.ignoreChars) {
					var textNode = lineChild.firstChild;
					rects = getClientRects(lineChild);
					for (var j = 0; j < rects.length; j++) {
						var rect = rects[j];
						if (rect.left <= x && x < rect.right) {
							var range = document.body.createTextRange();
							var length = textNode.length;
							var high = length;
							var low = -1;
							while ((high - low) > 1) {
								var mid = Math.floor((high + low) / 2);
								range.moveToElementText(lineChild);
								range.move("character", low + 1);
								range.moveEnd("character", mid - low);
								rects = range.getClientRects();
								var found = false;
								for (var k = 0; k < rects.length; k++) {
									rect = rects[k];
									if ((rect.left - deltaX) <= x && x < (rect.right - deltaX)) {
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
							range.moveToElementText(lineChild);
							range.move("character", high);
							range.moveEnd("character", 1);
							rect = range.getClientRects()[0];
							//TODO test for character trailing (wrong for bidi)
							if (x > ((rect.left - deltaX) + ((rect.right - rect.left) / 2))) {
								offset++;
							}
							break done;
						}
					}
					offset += textNode.length;
				}
				lineChild = lineChild.nextSibling;
			}
			if (dummy) { clientDiv.removeChild(dummy); }
			return offset;
		},
		_getYToLine: function (y) {
			var editorPad = this._getEditorPadding();
			var editorRect = this._editorDiv.getBoundingClientRect();
			y -= editorRect.top + editorPad.top;
			var lineHeight = this._getLineHeight();
			var lineIndex = Math.floor((y + this._getScroll().y) / lineHeight);
			var lineCount = this._model.getLineCount();
			return Math.max(0, Math.min(lineCount - 1, lineIndex));
		},
		_hookEvents: function() {
			var self = this;
			this._modelListener = {
				onChanging: function(newText, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
					self._onModelChanging(newText, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				},
				onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
					self._onModelChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			};
			this._model.addListener(this._modelListener);
			
			this._mouseMoveClosure = function(e) { return self._handleMouseMove(e);};
			this._mouseUpClosure = function(e) { return self._handleMouseUp(e);};
			
			var clientDiv = this._clientDiv;
			var editorDiv = this._editorDiv;
			var topNode = this._overlayDiv || this._clientDiv;
			var body = this._frameDocument.body; 
			var resizeNode = isIE ? this._frame : this._frameWindow; 
			this._handlers = [
				{target: editorDiv, type: "scroll", handler: function(e) { return self._handleScroll(e);}},
				{target: clientDiv, type: "keydown", handler: function(e) { return self._handleKeyDown(e);}},
				{target: clientDiv, type: "keypress", handler: function(e) { return self._handleKeyPress(e);}},
				{target: clientDiv, type: "keyup", handler: function(e) { return self._handleKeyUp(e);}},
				{target: clientDiv, type: "selectstart", handler: function(e) { return self._handleSelectStart(e);}},
				{target: clientDiv, type: "contextmenu", handler: function(e) { return self._handleContextMenu(e);}},
				{target: clientDiv, type: "copy", handler: function(e) { return self._handleCopy(e);}},
				{target: clientDiv, type: "cut", handler: function(e) { return self._handleCut(e);}},
				{target: clientDiv, type: "paste", handler: function(e) { return self._handlePaste(e);}},
//				{target: clientDiv, type: "blur", handler: function(e) { return self._handleBlur(e);}},
				{target: topNode, type: "mousedown", handler: function(e) { return self._handleMouseDown(e);}},
				{target: body, type: "mousedown", handler: function(e) { return self._handleBodyMouseDown(e);}},
				{target: topNode, type: "dragstart", handler: function(e) { return self._handleDragStart(e);}},
				{target: resizeNode, type: "resize", handler: function(e) { return self._handleResize(e);}}
			];
			if (!isIE) {
				var wheelEvent = isFirefox ? "DOMMouseScroll" : "mousewheel";
				this._handlers.push({target: this._editorDiv, type: wheelEvent, handler: function(e) { return self._handleMouseWheel(e); }});
			}
			if (isFirefox && !isWindows) {
				this._handlers.push({target: this._clientDiv, type: "DOMCharacterDataModified", handler: function (e) { return self._handleDataModified(e); }});
			}
			if (this._overlayDiv) {
				this._handlers.push({target: this._overlayDiv, type: "contextmenu", handler: function(e) { return self._handleContextMenu(e); }});
			}
			if (!isW3CEvents) {
				this._handlers.push({target: this._clientDiv, type: "dblclick", handler: function(e) { return self._handleDblclick(e); }});
			}
			for (var i=0; i<this._handlers.length; i++) {
				var h = this._handlers[i];
				addHandler(h.target, h.type, h.handler);
			}
		},
		_init: function(options) {
			var parent = options.parent;
			if (typeof(parent) === "string") {
				parent = window.document.getElementById(parent);
			}
			if (!parent) { throw "no parent"; }
			this._parent = parent;
			this._model = options.model ? options.model : new eclipse.TextModel();
			this.readonly = options.readonly === true;
			this._selection = new Selection (0, 0, false);
			this._eventTable = new EventTable();
			this._maxLineWidth = 0;
			this._maxLineIndex = -1;
			this._ignoreSelect = true;
			this._columnX = -1;

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
			while (parent.hasChildNodes()) { parent.removeChild(parent.lastChild); }
			var parentDocument = parent.document || parent.ownerDocument;
			this._parentDocument = parentDocument;
			var frame = parentDocument.createElement("IFRAME");
			this._frame = frame;
			frame.frameBorder = "0px";//for IE, needs to be set before the frame is added to the parent
			frame.style.width = "100%";
			frame.style.height = "100%";
			frame.scrolling = "no";
			frame.style.border = "0px";
			parent.appendChild(frame);

			var html = [];
			html.push("<!DOCTYPE html>");
			html.push("<html>");
			html.push("<head>");
			html.push("<meta http-equiv='X-UA-Compatible' content='IE=EmulateIE7'/>");
			html.push("<style>");
			html.push(".editorContainer {font-family: monospace; font-size: 10pt;}");
			html.push(".editor {padding: 1px 2px;}");
			html.push(".editorContent {}");
			html.push("</style>");
			if (options.stylesheet) {
				var stylesheet = typeof(options.stylesheet) === "string" ? [options.stylesheet] : options.stylesheet;
				for (var i = 0; i < stylesheet.length; i++) {
					try {
						//Force CSS to be loaded synchronously so lineHeight can be calculated
						var objXml = new XMLHttpRequest();
						objXml.open("GET", stylesheet[i], false);
						objXml.send(null);
						html.push("<style>");
						html.push(objXml.responseText);
						html.push("</style>");
					} catch (e) {
						html.push("<link rel='stylesheet' type='text/css' href='");
						html.push(stylesheet[i]);
						html.push("'></link>");
					}
				}
			}
			html.push("</head>");
			html.push("<body spellcheck='false'></body>");
			html.push("</html>");

			var frameWindow = frame.contentWindow;
			this._frameWindow = frameWindow;
			var document = frameWindow.document;
			this._frameDocument = document;
			document.open();
			document.write(html.join(""));
			document.close();
			
			var body = document.body;
			body.className = "editorContainer";
			body.style.margin = "0px";
			body.style.borderWidth = "0px";
			body.style.padding = "0px";
			
			var textArea = document.createElement("TEXTAREA");
			this._textArea = textArea;
			textArea.id = "textArea";
			textArea.tabIndex = -1;
			textArea.style.position = "fixed";
			textArea.style.whiteSpace = "pre";
			textArea.style.top = "-1000px";
			textArea.style.width = "100px";
			textArea.style.height = "100px";
			body.appendChild(textArea);

			var editorDiv = document.createElement("DIV");
			editorDiv.className = "editor";
			this._editorDiv = editorDiv;
			editorDiv.id = "editorDiv";
			editorDiv.tabIndex = -1;
			editorDiv.style.overflow = "auto";
			editorDiv.style.position = "absolute";
			editorDiv.style.top = "0px";
			editorDiv.style.borderWidth = "0px";
			editorDiv.style.margin = "0px";
			editorDiv.style.MozOutline = "none";
			editorDiv.style.outline = "none";
			if (isFirefox) {
				editorDiv.style.cursor = "text";
			}
			body.appendChild(editorDiv);
				
			var scrollDiv = document.createElement("DIV");
			this._scrollDiv = scrollDiv;
			scrollDiv.id = "scrollDiv";
			scrollDiv.style.margin = "0px";
			scrollDiv.style.borderWidth = "0px";
			scrollDiv.style.padding = "0px";
			editorDiv.appendChild(scrollDiv);
				
			var clientDiv = document.createElement("DIV");
			clientDiv.className = "editorContent";
			this._clientDiv = clientDiv;
			clientDiv.id = "clientDiv";
			clientDiv.style.whiteSpace = "pre";
			clientDiv.style.position = "fixed";
			clientDiv.style.borderWidth = "0px";
			clientDiv.style.margin = "0px";
			clientDiv.style.padding = "0px";
			clientDiv.style.MozOutline = "none";
			clientDiv.style.outline = "none";
			scrollDiv.appendChild(clientDiv);

			if (isFirefox) {
				var overlayDiv = document.createElement("DIV");
				this._overlayDiv = overlayDiv;
				overlayDiv.id = "overlayDiv";
				overlayDiv.style.position = clientDiv.style.position;
				overlayDiv.style.borderWidth = clientDiv.style.borderWidth;
				overlayDiv.style.margin = clientDiv.style.margin;
				overlayDiv.style.padding = clientDiv.style.padding;
				overlayDiv.style.zIndex = "1";
				scrollDiv.appendChild(overlayDiv);
			}
			clientDiv.contentEditable = "true";
			body.style.lineHeight = this._calculateLineHeight() + "px";
			this._createActions();
			this._hookEvents();
		},
		_isDOMSelectionComplete: function() {
			var selection = this._getSelection();
			var topIndex = this._getTopIndex();
			var bottomIndex = this._getBottomIndex();
			var model = this._model;
			var firstLine = model.getLineAtOffset(selection.start);
			var lastLine = model.getLineAtOffset(selection.start !== selection.end ? selection.end - 1 : selection.end);
			if (topIndex <= firstLine && firstLine <= bottomIndex && topIndex <= lastLine && lastLine <= bottomIndex) {
				var child = this._getLineNode(firstLine);
				while (child && child.lineIndex <= lastLine) {
					var lineChild = child.firstChild;
					while (lineChild) {
						if (lineChild.ignoreChars) { return false; }
						lineChild = lineChild.nextSibling;
					}
					child = child.nextSibling;
				}
				return true;
			}
			return false;
		},
		_modifyContent: function(e, updateCaret) {
			if (this.readonly && !e._code) {
				return;
			}

			this.onVerify(e);

			if (e.text === null || e.text === undefined) { return; }
			
			var model = this._model;
			if (e._ignoreDOMSelection) { this._ignoreDOMSelection = true; }
			model.setText (e.text, e.start, e.end);
			if (e._ignoreDOMSelection) { this._ignoreDOMSelection = false; }
			
			if (updateCaret) {
				var selection = this._getSelection ();
				selection.setCaret(e.start + e.text.length);
				this._setSelection(selection, true);
				this._showCaret();
			}
			this.onModify({});
		},
		_onModelChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			var e = {
				start: start,
				removedCharCount: removedCharCount,
				addedCharCount: addedCharCount,
				removedLineCount: removedLineCount,
				addedLineCount: addedLineCount
			};
			this.onModelChanged(e);
			
			var selection = this._getSelection();
			if (selection.end > start) {
				if (selection.end > start && selection.start < start + removedCharCount) {
					// selection intersects replaced text. set caret behind text change
					selection.setCaret(start + addedCharCount);
				} else {
					// move selection to keep same text selected
					selection.start +=  addedCharCount - removedCharCount;
					selection.end +=  addedCharCount - removedCharCount;
				}
				this._setSelection(selection, false, false);
			}
			
			var model = this._model;
			var startLine = model.getLineAtOffset(start);
			var clientDiv = this._clientDiv;
			var child = clientDiv.firstChild;
			while (child) {
				var lineIndex = child.lineIndex;
				if (startLine <= lineIndex && lineIndex <= startLine + removedLineCount) {
					child.lineChanged = true;
				}
				if (lineIndex > startLine + removedLineCount) {
					child.lineIndex = lineIndex + addedLineCount - removedLineCount;
				}
				child = child.nextSibling;
			}
			if (startLine <= this._maxLineIndex && this._maxLineIndex <= startLine + removedLineCount) {
				this._maxLineIndex = -1;
				this._maxLineWidth = 0;
			}
			this._updatePage();
		},
		_onModelChanging: function(newText, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			var e = {
				text: newText,
				start: start,
				removedCharCount: removedCharCount,
				addedCharCount: addedCharCount,
				removedLineCount: removedLineCount,
				addedLineCount: addedLineCount
			};
			this.onModelChanging(e);
		},
		_queueUpdatePage: function() {
			if (this._updateTimer) { return; }
			var self = this;
			this._updateTimer = setTimeout(function() { 
				self._updateTimer = null;
				self._updatePage();
			}, 0);
		},
		_scrollView: function (pixelX, pixelY) {
			/*
			* IE redraws the page when scrollTop is changed. This redraw is not necessary
			* while scrolling since updatePage() will be called in _handleScroll(). In order
			* to improve performance, the page is hidden during scroll causing only on redraw
			* to happen. Note that this approach causes flashing on Firefox.
			*/
			if (isIE) {
				this._frameDocument.body.style.visibility = "hidden";
			}
			this._editorDiv.scrollLeft += pixelX;
			this._editorDiv.scrollTop += pixelY;
			this._handleScroll();
			if (isIE) {
				this._frameDocument.body.style.visibility = "visible";
				this.focus();
			}
		},
		_setClipboardText: function (text, event) {
			if (this._frameWindow.clipboardData) {
				//IE
				return this._frameWindow.clipboardData.setData("Text", text);
			}
			if (isChrome || isFirefox || !event) {
				/* Feature in Chrome, clipboardData.setData is no-op on chrome, the fix is to use execCommand */
				var document = this._frameDocument;
				var textArea = this._textArea;
				textArea.value = text;
				textArea.select();
				var result = false;
				
				//Try execCommand first, it works on firefox with clipboard permission,
				// chrome 5, safari 4.
				this._ignoreCopy = true;
				try {
					result = document.execCommand("copy", false, null);
				} catch (e) {}
				this._ignoreCopy = false;
				if (!result) {
					if (event) {
						if (event.type === "copy" && this._isDOMSelectionComplete()) {
							this.focus();
							return false;
						}
						var self = this;
						setTimeout(function() {
							self.focus();
						}, 0);
						return false;
					} else {
						//no event and no permission, give up
						this.focus();
						return true;
					}
				}
				this.focus();
				return result;
			}
			if (event && event.clipboardData) {
				//webkit
				return event.clipboardData.setData("text/plain", text);
			}
		},
		_setDOMSelection: function (startNode, startOffset, endNode, endOffset) {
			var window = this._frameWindow;
			var clientDiv = this._clientDiv;
			var document = this._frameDocument;
			var startLineNode, startLineOffset, endLineNode, endLineOffset;
			var offset = 0;
			var lineChild = startNode.firstChild;
			var node;
			while (lineChild) {
				node = lineChild.firstChild;
				if (node.length + offset > startOffset) {
					startLineNode = node;
					startLineOffset = startOffset - offset;
					break;
				}
				offset += node.length;
				if (lineChild.ignoreChars) {
					startOffset += node.length;
				}
				lineChild = lineChild.nextSibling;
			}
			if (!lineChild) {
				startLineNode = node;
				startLineOffset = node.length;
			}
			offset = 0;
			lineChild = endNode.firstChild;
			while (lineChild) {
				node = lineChild.firstChild;
				if (node.length + offset > endOffset) {
					endLineNode = node;
					endLineOffset = endOffset - offset;
					break;
				}
				offset += node.length;
				if (lineChild.ignoreChars) {
					endOffset += node.length;
				}
				lineChild = lineChild.nextSibling;
			}
			if (!lineChild) {
				endLineNode = node;
				endLineOffset = node.length;
			}
			var range;
			if (window.getSelection) {
				//FF
				range = document.createRange();
				range.setStart(startLineNode, startLineOffset);
				range.setEnd(endLineNode, endLineOffset);
				var sel = window.getSelection();
				this._ignoreSelect = false;
				if (sel.rangeCount > 0) { sel.removeAllRanges(); }
				sel.addRange(range);
				this._ignoreSelect = true;
			} else if (document.selection) {
				//IE
				var body = document.body;

				/*
				* Bug in IE. For some reason when text is deselected the overflow
				* selection at the end of some lines does not get redrawn.  The
				* fix is to create a DOM element in the body to force a redraw.
				*/
				var child = document.createElement("DIV");
				body.appendChild(child);
				body.removeChild(child);
				
				range = body.createTextRange();
				range.moveToElementText(startLineNode.parentNode);
				range.moveStart("character", startLineOffset);
				var endRange = body.createTextRange();
				endRange.moveToElementText(endLineNode.parentNode);
				endRange.moveStart("character", endLineOffset);
				range.setEndPoint("EndToStart", endRange);
				this._ignoreSelect = false;
				range.select();
				this._ignoreSelect = true;
			}
		},
		_setGrab: function (target) {
			if (target === this._grabControl) { return; }
			if (target) {
				addHandler(target, "mousemove", this._mouseMoveClosure);
				addHandler(target, "mouseup", this._mouseUpClosure);
				if (target.setCapture) { target.setCapture(); }
				this._grabControl = target;
			} else {
				removeHandler(this._grabControl, "mousemove", this._mouseMoveClosure);
				removeHandler(this._grabControl, "mouseup", this._mouseUpClosure);
				if (this._grabControl.releaseCapture) { this._grabControl.releaseCapture(); }
				this._grabControl = null;
			}
		},
		_setSelection: function (selection, scroll, update) {
			if (selection) {
				this._columnX = -1;
				if (update === undefined) { update = true; }
				var oldSelection = this._selection; 
				if (!oldSelection.equals(selection)) {
					this._selection = selection;
					var e = {
						oldValue: {start:oldSelection.start, end:oldSelection.end},
						newValue: {start:selection.start, end:selection.end}
					};
					this.onSelection(e);
					if (scroll) { update = !this._showCaret(); }
				}
				
				/* Sometimes the browser changes the selection 
				 * as result of method calls or "leaked" events. 
				 * The fix is to set the visual selection even
				 * when the logical selection is not changed.
				 */
				if (update) { this._updateDOMSelection(); }
			}
		},
		_setSelectionTo: function (x,y,extent) {
			var model = this._model, offset;
			var selection = this._getSelection();
			var lineIndex = this._getYToLine(y);
			if (this._clickCount === 1) {
				offset = this._getXToOffset(lineIndex, x);
				selection.extend(offset);
				if (!extent) { selection.collapse(); }
			} else {
				var word = (this._clickCount & 1) === 0;
				var start, end;
				if (word) {
					offset = this._getXToOffset(lineIndex, x);
					if (this._doubleClickSelection) {
						if (offset >= this._doubleClickSelection.start) {
							start = this._doubleClickSelection.start;
							end = this._getOffset(offset, true, +1);
						} else {
							start = this._getOffset(offset, true, -1);
							end = this._doubleClickSelection.end;
						}
					} else {
						start = this._getOffset(offset, true, -1);
						end = this._getOffset(start, true, +1);
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
			this._setSelection(selection, true, true);
		},
		_showCaret: function () {
			var model = this._model;
			var selection = this._getSelection();
			var scroll = this._getScroll();
			var caret = selection.getCaret();
			var start = selection.start;
			var end = selection.end;
			var startLine = model.getLineAtOffset(start); 
			var endLine = model.getLineAtOffset(end);
			var endInclusive = Math.max(Math.max(start, model.getLineStart(endLine)), end - 1);
			var editorPad = this._getEditorPadding();
			
			var clientWidth = this._getClientWidth();
			var leftEdge = editorPad.left;
			var rightEdge = editorPad.left + clientWidth;
			var bounds = this._getBoundsAtOffset(caret === start ? start : endInclusive);
			var left = bounds.left;
			var right = bounds.right;
			var minScroll = clientWidth / 4;
			if (!selection.isEmpty() && startLine === endLine) {
				bounds = this._getBoundsAtOffset(caret === end ? start : endInclusive);
				var selectionWidth = caret === start ? bounds.right - left : right - bounds.left;
				if ((clientWidth - minScroll) > selectionWidth) {
					if (left > bounds.left) { left = bounds.left; }
					if (right < bounds.right) { right = bounds.right; }
				}
			}
			var editorRect = this._editorDiv.getBoundingClientRect(); 
			left -= editorRect.left;
			right -= editorRect.left;
			var pixelX = 0;
			if (left < leftEdge) {
				pixelX = Math.min(left - leftEdge, -minScroll);
			}
			if (right > rightEdge) {
				var maxScroll = this._scrollDiv.scrollWidth - scroll.x - clientWidth;
				pixelX = Math.min(maxScroll,  Math.max(right - rightEdge, minScroll));
			}

			var pixelY = 0;
			var topIndex = this._getTopIndex(true);
			var bottomIndex = this._getBottomIndex(true);
			var caretLine = model.getLineAtOffset(caret);
			var clientHeight = this._getClientHeight();
			if (!(topIndex <= caretLine && caretLine <= bottomIndex)) {
				var lineHeight = this._getLineHeight();
				var selectionHeight = (endLine - startLine) * lineHeight;
				pixelY = caretLine * lineHeight;
				pixelY -= scroll.y;
				if (pixelY + lineHeight > clientHeight) {
					pixelY -= clientHeight - lineHeight;
					if (caret === start && start !== end) {
						pixelY += Math.min(clientHeight - lineHeight, selectionHeight);
					}
				} else {
					if (caret === end) {
						pixelY -= Math.min (clientHeight - lineHeight, selectionHeight);
					}
				}
			}

			if (pixelX !== 0 || pixelY !== 0) {
				this._scrollView (pixelX, pixelY);
				if (clientHeight !== this._getClientHeight() || clientWidth !== this._getClientWidth()) {
					this._showCaret();
				}
				return true;
			}
			return false;
		},
		_startIME: function () {
			if (this._imeOffset !== -1) { return; }
			var selection = this._getSelection();
			if (!selection.isEmpty()) {
				this._modifyContent({text: "", start: selection.start, end: selection.end}, true);
			}
			this._imeOffset = selection.start;
		},
		_unhookEvents: function() {
			this._model.removeListener(this._modelListener);
			this._modelListener = null;

			this._mouseMoveClosure = null;
			this._mouseUpClosure = null;

			for (var i=0; i<this._handlers.length; i++) {
				var h = this._handlers[i];
				removeHandler(h.target, h.type, h.handler);
			}
			this._handlers = null;
		},
		_updateDOMSelection: function () {
			if (this._ignoreDOMSelection) { return; }
			var selection = this._getSelection();
			var model = this._model;
			var startLine = model.getLineAtOffset(selection.start);
			var endLine = model.getLineAtOffset(selection.end);
			var clientDiv = this._clientDiv;
			var firstNode = clientDiv.firstChild;
			/*
			* Bug in Firefox. For some reason, after a update page sometimes the 
			* firstChild returns null incorrectly. The fix is to ignore show selection.
			*/
			if (!firstNode) { return; }
			var lastNode = clientDiv.lastChild;
			
			var topNode, bottomNode, topOffset, bottomOffset;
			if (startLine < firstNode.lineIndex) {
				topNode = firstNode;
				topOffset = 0;
			} else if (startLine > lastNode.lineIndex) {
				topNode = lastNode;
				topOffset = 0;
			} else {
				topNode = this._getLineNode(startLine);
				topOffset = selection.start - model.getLineStart(startLine);
			}

			if (endLine < firstNode.lineIndex) {
				bottomNode = firstNode;
				bottomOffset = 0;
			} else if (endLine > lastNode.lineIndex) {
				bottomNode = lastNode;
				bottomOffset = 0;
			} else {
				bottomNode = this._getLineNode(endLine);
				bottomOffset = selection.end - model.getLineStart(endLine);
			}
			this._setDOMSelection(topNode, topOffset, bottomNode, bottomOffset);
		},
		_updatePage: function() {
			if (this._updateTimer) { 
				clearTimeout(this._updateTimer);
				this._updateTimer = null;
			}
			var document = this._frameDocument;
			var frameWidth = this._getFrameWidth();
			var frameHeight = this._getFrameHeight();
			document.body.style.width = frameWidth + "px";
			document.body.style.height = frameHeight + "px";
			
			var editorDiv = this._editorDiv;
			var clientDiv = this._clientDiv;
			var editorPad = this._getEditorPadding();
			
			/* Update editor height in order to have client height computed */
			editorDiv.style.height = Math.max(0, (frameHeight - editorPad.top - editorPad.bottom)) + "px";
			
			var model = this._model;
			var lineHeight = this._getLineHeight();
			var scrollY = this._getScroll().y;
			var firstLine = Math.max(0, scrollY) / lineHeight;
			var topIndex = Math.floor(firstLine);
			var lineStart = Math.max(0, topIndex - 1);
			var top = Math.round((firstLine - lineStart) * lineHeight);
			var lineCount = model.getLineCount();
			var clientHeight = this._getClientHeight();
			var partialY = Math.round((firstLine - topIndex) * lineHeight);
			var linesPerPage = Math.floor((clientHeight + partialY) / lineHeight);
			var bottomIndex = Math.min(topIndex + linesPerPage, lineCount - 1);
			var lineEnd = Math.min(bottomIndex + 1, lineCount - 1);
			this._partialY = partialY;
			
			var lineIndex, lineWidth;
			var child = clientDiv.firstChild;
			while (child) {
				lineIndex = child.lineIndex;
				var nextChild = child.nextSibling;
				if (!(lineStart <= lineIndex && lineIndex <= lineEnd) || child.lineChanged) {
					clientDiv.removeChild(child);
				}
				child = nextChild;
			}
			// Webkit still wraps even if pre is used
			clientDiv.style.width = (0x7FFFF).toString() + "px";

			child = clientDiv.firstChild;
			for (lineIndex=lineStart; lineIndex<=lineEnd; lineIndex++) {
				if (!child || child.lineIndex > lineIndex) {
					child = this._createLine(clientDiv, child, document, lineIndex, model);
					var rect = this._getLineBoundingClientRect(child);
					lineWidth = rect.right - rect.left;
					child.lineWidth = lineWidth; 
					// when the maxLineIndex is known measure only the lines that have changed
					if (this._maxLineIndex !== -1) {
						if (lineWidth >= this._maxLineWidth) {
							this._maxLineWidth = lineWidth;
							this._maxLineIndex = lineIndex;
						}
					}
				}
				if (lineIndex === topIndex) { this._topChild = child; }
				if (lineIndex === bottomIndex) { this._bottomChild = child; }
				if (child.lineIndex === lineIndex) {
					child = child.nextSibling;
				}
			}

			// when the maxLineIndex is not known all the visible lines need to be measured
			if (this._maxLineIndex === -1) {
				child = clientDiv.firstChild;
				while (child) {
					lineWidth = child.lineWidth;
					if (lineWidth >= this._maxLineWidth) {
						this._maxLineWidth = lineWidth;
						this._maxLineIndex = child.lineIndex;
					}
					child = child.nextSibling;
				}
			}
			
			// Update rulers
			this._updateRuler(this._leftDiv, topIndex, bottomIndex);
			this._updateRuler(this._rightDiv, topIndex, bottomIndex);
			
			var leftWidth = this._leftDiv ? this._leftDiv.scrollWidth : 0;
			var rightWidth = this._rightDiv ? this._rightDiv.scrollWidth : 0;
			editorDiv.style.left = leftWidth + "px";
			editorDiv.style.width = Math.max(0, frameWidth - leftWidth - rightWidth - editorPad.left - editorPad.right) + "px";
			if (this._rightDiv) {
				this._rightDiv.style.left = (frameWidth - rightWidth) + "px"; 
			}
			
			var scrollDiv = this._scrollDiv;
			/* Need to set the height first in order for the width to consider the vertical scrollbar */
			var scrollHeight = lineCount * lineHeight;
			scrollDiv.style.height = scrollHeight + "px";
			var clientWidth = this._getClientWidth();
			var width = Math.max(this._maxLineWidth, clientWidth);
			clientDiv.style.width = width + "px";
			var overlayDiv = this._overlayDiv;
			if (overlayDiv) {
				overlayDiv.style.width = width + "px";
			}
			/* Except by IE, all other browsers are not allocating enough space for the right padding 
			 * in the scrollbar. It is possible this a bug since all other paddings are considered.
			 */
			var scrollWidth = width;
			if (!isIE) { width += editorPad.right; }
			scrollDiv.style.width = width + "px";

			/*
			* Get client height after both scrollbars are visible and updatePage again to recalculate top and bottom indices.
			* 
			* Note that updateDOMSelection() has to be called on IE before getting the new client height because it
			* forces the client area to be recomputed.
			*/
			this._updateDOMSelection();
			if (clientHeight !== this._getClientHeight()) {
				this._updatePage();
				return;
			}
			// Get the left scroll after setting the width of the scrollDiv as this can change the horizontal scroll offset.
			var scroll = this._getScroll();
			var left = scroll.x;
			var clipLeft = left;
			var clipTop = top;
			var clipRight = left + clientWidth;
			var clipBottom = top + clientHeight;
			if (clipLeft === 0) { clipLeft -= editorPad.left; }
			if (clipTop === 0) { clipTop -= editorPad.top; }
			if (clipRight === scrollWidth) { clipRight += editorPad.right; }
			if (scroll.y + clientHeight === scrollHeight) { clipBottom += editorPad.bottom; }
			clientDiv.style.clip = "rect(" + clipTop + "px," + clipRight + "px," + clipBottom + "px," + clipLeft + "px)";
			clientDiv.style.left = (-left + leftWidth + editorPad.left) + "px";
			clientDiv.style.top = (-top + editorPad.top) + "px";
			clientDiv.style.height = (clientHeight + top) + "px";
			if (overlayDiv) {
				overlayDiv.style.clip = clientDiv.style.clip;
				overlayDiv.style.left = clientDiv.style.left;
				overlayDiv.style.top = clientDiv.style.top;
				overlayDiv.style.height = clientDiv.style.height;
			}
			function updateRulerSize(divRuler) {
				if (!divRuler) { return; }
				var rulerHeight = clientHeight + editorPad.top + editorPad.bottom;
				var cells = divRuler.firstChild.rows[0].cells;
				for (var i = 0; i < cells.length; i++) {
					var div = cells[i].firstChild;
					var offset = lineHeight;
					if (div._ruler.getOverview() === "page") { offset += partialY; }
					div.style.top = -offset + "px";
					div.style.height = (rulerHeight + offset) + "px";
					div = div.nextSibling;
				}
				divRuler.style.height = rulerHeight + "px";
			}
			updateRulerSize(this._leftDiv);
			updateRulerSize(this._rightDiv);
		},
		_updateRuler: function (divRuler, topIndex, bottomIndex) {
			if (!divRuler) { return; }
			var cells = divRuler.firstChild.rows[0].cells;
			var lineHeight = this._getLineHeight();
			var parentDocument = this._parentDocument;
			var editorPad = this._getEditorPadding();
			for (var i = 0; i < cells.length; i++) {
				var div = cells[i].firstChild;
				var ruler = div._ruler, style;
				if (div.rulerChanged) {
					this._applyStyle(ruler.getStyle(), div);
				}
				
				var widthDiv;
				var child = div.firstChild;
				if (child) {
					widthDiv = child;
					child = child.nextSibling;
				} else {
					widthDiv = parentDocument.createElement("DIV");
					widthDiv.style.visibility = "hidden";
					div.appendChild(widthDiv);
				}
				var lineIndex;
				if (div.rulerChanged) {
					if (widthDiv) {
						lineIndex = -1;
						this._applyStyle(ruler.getStyle(lineIndex), widthDiv);
						widthDiv.innerHTML = ruler.getHTML(lineIndex);
						widthDiv.lineIndex = lineIndex;
						widthDiv.style.height = (lineHeight + editorPad.top) + "px";
					}
				}

				var overview = ruler.getOverview(), lineDiv;
				if (overview === "page") {
					while (child) {
						lineIndex = child.lineIndex;
						var nextChild = child.nextSibling;
						if (!(topIndex <= lineIndex && lineIndex <= bottomIndex) || child.lineChanged) {
							div.removeChild(child);
						}
						child = nextChild;
					}
					child = div.firstChild.nextSibling;
					for (lineIndex=topIndex; lineIndex<=bottomIndex; lineIndex++) {
						if (!child || child.lineIndex > lineIndex) {
							lineDiv = parentDocument.createElement("DIV");
							this._applyStyle(ruler.getStyle(lineIndex), lineDiv);
							lineDiv.innerHTML = ruler.getHTML(lineIndex);
							lineDiv.lineIndex = lineIndex;
							lineDiv.style.height = lineHeight + "px";
							div.insertBefore(lineDiv, child);
						}
						if (child && child.lineIndex === lineIndex) {
							child = child.nextSibling;
						}
					}
				} else {
					if (div.rulerChanged) {
						var count = div.childNodes.length;
						while (count > 1) {
							div.removeChild(div.lastChild);
							count--;
						}
	
						var buttonHeight = 17;
						var clientHeight = this._getClientHeight ();
						var trackHeight = clientHeight + editorPad.top + editorPad.bottom - 2 * buttonHeight;
						var lineCount = this._model.getLineCount ();
						var lines = ruler.getAnnotations ();
						for (var j = 0; j < lines.length; j++) {
							lineIndex = lines[j];
							lineDiv = parentDocument.createElement("DIV");
							this._applyStyle(ruler.getStyle(lineIndex), lineDiv);
							lineDiv.style.position = "absolute";
							var divHeight = trackHeight / lineCount;
							lineDiv.style.top = buttonHeight + lineHeight + Math.floor(lineIndex * divHeight) + "px";
							lineDiv.innerHTML = ruler.getHTML(lineIndex);
							lineDiv.lineIndex = lineIndex;
							div.appendChild(lineDiv);
						}
					}
				}
				div.rulerChanged = false;
				div = div.nextSibling;
			}
		}
	};//end prototype
	
	return Editor;
}());
