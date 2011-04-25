/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
 /*global window dojo orion:true eclipse:true handleGetAuthenticationError*/
 /*jslint maxerr:150 browser:true devel:true regexp:false*/
  
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");

var eclipse = eclipse || {};
var orion = orion || {};
orion.EditorContainer = (function() {
	function EditorContainer(options) {
		this._editorFactory = options.editorFactory;
		this._undoStackFactory = options.undoStackFactory;
		this._annotationFactory = options.annotationFactory;
		this._lineNumberRulerFactory = options.lineNumberRulerFactory;
		this._contentAssistFactory = options.contentAssistFactory;
		this._keyBindingFactory = options.keyBindingFactory;
		this._statusReporter = options.statusReporter;
		this._domNode = options.domNode;
		
		this._annotationsRuler = null;
		this._overviewRuler = null;
		this._dirty = false;
		this._contentAssist = null;
		this._keyModes = [];		
	}
	EditorContainer.prototype = {
		getEditorWidget: function() {
			return this._editor;
		},
		
		reportStatus: function(message, isError) {
			if (this._statusReporter) {
				this._statusReporter(message, isError);
			} else {
				window.alert(isError ? "ERROR: " + message : message);
			}
		},
				
		/**
		 * @static
		 * @param editor
		 * @param start
		 * @param end
		 */
		moveSelection: function(editor, start, end) {
			end = end || start;
			editor.setSelection(start, end, false);
			var topPixel = editor.getTopPixel();
			var bottomPixel = editor.getBottomPixel();
			var line = editor.getModel().getLineAtOffset(start);
			var linePixel = editor.getLinePixel(line);
			if (linePixel < topPixel || linePixel > bottomPixel) {
				var height = bottomPixel - topPixel;
				var target = Math.max(0, linePixel- Math.floor((linePixel<topPixel?3:1)*height / 4));
				var a = new dojo.Animation({
					node: editor,
					duration: 300,
					curve: [topPixel, target],
					onAnimate: function(x){
						editor.setTopPixel(Math.floor(x));
					},
					onEnd: function() {
						editor.showSelection();
						editor.focus();
					}
				});
				a.play();
			} else {
				editor.showSelection();
				editor.focus();
			}
		},
		getContents : function() {
			if (this._editor) {
				return this._editor.getText();
			}
		},
		isDirty : function() {
			return this._dirty;
		},
		checkDirty : function() {
			var dirty = !this._undoStack.isClean();
			if (this._dirty === dirty) {
				return;
			}
			this.onDirtyChange(dirty);
		},
		
		getAnnotationsRuler : function() {
			return this._annotationsRuler;
		},

		/**
		 * Helper for finding occurrences of str in the editor.
		 * @param str {String}
		 * @param startIndex {number}
		 * @param [ignoreCase] {boolean} Default is false
		 * @param [reverse] {boolean} Default is false
		 * @return {index: number, length: number} giving the match details, or null if no match found.
		 */
		doFind: function(str, startIndex, ignoreCase, reverse) {
			var text = this._editor.getText();
			if (ignoreCase) {
				str = str.toLowerCase();
				text = text.toLowerCase();
			}
			
			var i;
			if (reverse) {
				text = text.split("").reverse().join("");
				str = str.split("").reverse().join("");
				startIndex = text.length - startIndex - 1;
				i = text.indexOf(str, startIndex);
				if (i !== -1) {
					return {index: text.length - str.length - i, length: str.length};
				}
			} else {
				i = text.indexOf(str, startIndex);
				if (i !== -1) {
					return {index: i, length: str.length};
				}
			}
			return null;
		},
		
		/**
		 * Helper for finding regexp matches in the editor. Use doFind() for simple string searches.
		 * @param pattern {String} A valid regexp pattern
		 * @param flags {String} Valid regexp flags: [is]
		 * @param [startIndex] {number} Default is false
		 * @param [reverse] {boolean} Default is false
		 * @return {index: number, length: number} giving the match details, or null if no match found.
		 */
		doFindRegExp: function(pattern, flags, startIndex, reverse) {
			if (!pattern) {
				return null;
			}
			
			flags = flags || "";
			// 'g' makes exec() iterate all matches, 'm' makes ^$ work linewise
			flags += (flags.indexOf("g") === -1 ? "g" : "") + (flags.indexOf("m") === -1 ? "m" : "");
			var regexp = new RegExp(pattern, flags);
			var text = this._editor.getText();
			var result = null,
			    match = null;
			if (reverse) {
				while (true) {
					result = regexp.exec(text);
					if (result && result.index <= startIndex) {
						match = {index: result.index, length: result[0].length};
					} else {
						return match;
					}
				}
			} else {
				result = regexp.exec(text.substring(startIndex));
				return result && {index: result.index + startIndex, length: result[0].length};
			}
		},
		
		/**
		 * @param {String} Input string
		 * @return {pattern:String, flags:String} if str looks like a RegExp, or null otherwise
		 */
		parseRegExp: function(str) {
			var regexp = /^\s*\/(.+)\/([gim]{0,3})\s*$/.exec(str);
			if (regexp) {
				return {pattern: regexp[1], flags: regexp[2]};
			}
			return null;
		},
		
		installEditor : function() {
			// Create editor and install optional features
			this._editor = this._editorFactory();
			if (this._undoStackFactory) {
				this._undoStack = this._undoStackFactory.createUndoStack(this);
			}
			if (this._contentAssistFactory) {
				this._contentAssist = this._contentAssistFactory(this);
				this._keyModes.push(this._contentAssist);
			}
			
			var editorContainer = this,
				editor = this._editor;
						
			// Set up keybindings
			if (this._keyBindingFactory) {
				this._keyBindingFactory(this, this._keyModes, this._undoStack, this._contentAssist);
			}
			
			// Set keybindings for keys that apply to different modes
			editor.setKeyBinding(new eclipse.KeyBinding(27), "ESC");
			editor.setAction("ESC", dojo.hitch(this, function() {
				for (var i=0; i<this._keyModes.length; i++) {
					if (this._keyModes[i].isActive()) {
						return this._keyModes[i].cancel();
					}
				}
				return false;
			}));

			editor.setAction("lineUp", dojo.hitch(this, function() {
				for (var i=0; i<this._keyModes.length; i++) {
					if (this._keyModes[i].isActive()) {
						return this._keyModes[i].lineUp();
					}
				}
				return false;
			}));
			editor.setAction("lineDown", dojo.hitch(this, function() {
				for (var i=0; i<this._keyModes.length; i++) {
					if (this._keyModes[i].isActive()) {
						return this._keyModes[i].lineDown();
					}
				}
				return false;
			}));
						
			/**@this {orion.EditorContainer} */
			function updateCursorStatus() {
				var model = editor.getModel();
				var caretOffset = editor.getCaretOffset();
				var lineIndex = model.getLineAtOffset(caretOffset);
				var lineStart = model.getLineStart(lineIndex);
				var offsetInLine = caretOffset - lineStart;
				// If we are in a mode, we will bail out from reporting the cursor position.
				for (var i=0; i<this._keyModes.length; i++) {
					if (this._keyModes[i].isActive()) {
						return;
					}
				}
				this.reportStatus("Line " + (lineIndex + 1) + " : Col " + offsetInLine);
			}
			
			// Listener for dirty state
			editor.addEventListener("ModelChanged", this, this.checkDirty);
					
			//Adding selection changed listener
			editor.addEventListener("Selection", this, updateCursorStatus);
			
			// Create rulers
			if (this._annotationFactory) {
				var annotations = this._annotationFactory.createAnnotationRulers();
				this._annotationsRuler = annotations.annotationRuler;
			
				this._annotationsRuler.onClick = function(lineIndex, e) {
					if (lineIndex === undefined) { return; }
					if (lineIndex === -1) { return; }
					var annotation = this.getAnnotation(lineIndex);
					if (annotation === undefined) { return; }
					editorContainer.onGotoLine(annotation.line, annotation.column);
				};
				
				this._overviewRuler = annotations.overviewRuler;
				this._overviewRuler.onClick = function(lineIndex, e) {
					if (lineIndex === undefined) { return; }
					editorContainer.moveSelection(this._editor, this._editor.getModel().getLineStart(lineIndex));
				};
			
				editor.addRuler(this._annotationsRuler);
				editor.addRuler(this._overviewRuler);
			}
			
			if (this._lineNumberRulerFactory) {
				this._lineNumberRuler = this._lineNumberRulerFactory.createLineNumberRuler();
				editor.addRuler(this._lineNumberRuler);
			}
		},
		
		showSelection : function(start, end, line, offset, length) {
			// We use typeof because we need to distinguish the number 0 from an undefined or null parameter
			if (typeof(start) === "number") {
				if (typeof(end) !== "number") {
					end = start;
				}
				this.moveSelection(this._editor, start, end);
			} else if (typeof(line) === "number") {
				var pos = this._editor.getModel().getLineStart(line-1);
				if (typeof(offset) === "number") {
					pos = pos + offset;
				}
				if (typeof(length) !== "number") {
					length = 0;
				}
				this.moveSelection(this._editor, pos, pos+length);
			}
		},
		
		onInputChange : function (title, message, contents, contentsSaved) {
			if (contentsSaved && this._editor) {
				// don't reset undo stack on save, just mark it clean so that we don't lose the undo past the save
				this._undoStack.markClean();
				this.checkDirty();
				return;
			}
			if (this._editor) {
				if (message) {
					this._editor.setText(message);
				} else {
					if (this._styler) {
						this._styler.destroy();
						this._styler = null;
					}
					var fileName = title;
					if (fileName) {
						var splits = fileName.split(".");
						if (splits.length > 0) {
							var extension = splits.pop().toLowerCase();
							switch(extension) {
								case "js":
									this.styler = new eclipse.TextStyler(this._editor, "js");
									break;
								case "java":
									this.styler = new eclipse.TextStyler(this._editor, "java");
									break;
								case "html":
									//TODO
									break;
								case "xml":
									//TODO
									break;
								case "css":
									this.styler = new eclipse.TextStyler(this._editor, "css");
									break;
								case "json":
									// FIXME mamacdon
									this.styler = new orion.styler.JsonStyler(this._editor);
									break;
							}
						}
					}
					if (contents !== null && contents !== undefined) {
						this._editor.setText(contents);
					}
				}
				this._undoStack.reset();
				this.checkDirty();
				this._editor.focus();
			}
		},
		
		onGotoLine : function (line, column, end) {
			if (this._editor) {
				var lineStart = this._editor.getModel().getLineStart(line);
				if (typeof column === "string") {
					var index = this._editor.getModel().getLine(line).indexOf(column);
					if (index !== -1) {
						end = index + column.length;
						column = index;
					} else {
						column = 0;
					}
				}
				var col = Math.min(this._editor.getModel().getLineEnd(line), column);
				if (end===undefined) {
					end = col;
				}
				var offset = lineStart + col;
				this.moveSelection(this._editor, offset, lineStart + end);
			}
		},
		
		onDirtyChange: function(isDirty) {
			this._dirty = isDirty;
		}
	};
	return EditorContainer;
}());