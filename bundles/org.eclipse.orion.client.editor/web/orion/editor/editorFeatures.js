/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define prompt */

define("orion/editor/editorFeatures", [ //$NON-NLS-0$
	'i18n!orion/editor/nls/messages', //$NON-NLS-0$
	'orion/editor/undoStack', //$NON-NLS-0$
	'orion/keyBinding', //$NON-NLS-0$
	'orion/editor/rulers', //$NON-NLS-0$
	'orion/editor/annotations', //$NON-NLS-0$
	'orion/editor/tooltip', //$NON-NLS-0$
	'orion/editor/textDND', //$NON-NLS-0$
	'orion/editor/templates', //$NON-NLS-0$
	'orion/editor/regex', //$NON-NLS-0$
	'orion/util' //$NON-NLS-0$
], function(messages, mUndoStack, mKeyBinding, mRulers, mAnnotations, mTooltip, mTextDND, mTemplates, mRegex, util) {

	function UndoFactory() {
	}
	UndoFactory.prototype = {
		createUndoStack: function(editor) {
			var textView = editor.getTextView();
			var undoStack =  new mUndoStack.UndoStack(textView, 200);
			textView.setAction("undo", function() { //$NON-NLS-0$
				undoStack.undo();
				return true;
			}, {name: messages.undo});
			
			textView.setAction("redo", function() { //$NON-NLS-0$
				undoStack.redo();
				return true;
			}, {name: messages.redo});
			return undoStack;
		}
	};

	function LineNumberRulerFactory() {
	}
	LineNumberRulerFactory.prototype = {
		createLineNumberRuler: function(annotationModel) {
			return new mRulers.LineNumberRuler(annotationModel, "left", {styleClass: "ruler lines"}, {styleClass: "rulerLines odd"}, {styleClass: "rulerLines even"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
	};
	
	function FoldingRulerFactory() {
	}
	FoldingRulerFactory.prototype = {
		createFoldingRuler: function(annotationModel) {
			return new mRulers.FoldingRuler(annotationModel, "left", {styleClass: "ruler folding"}); //$NON-NLS-1$ //$NON-NLS-0$
		}
	};
	
	function AnnotationFactory() {
	}
	AnnotationFactory.prototype = {
		createAnnotationModel: function(model) {
			return new mAnnotations.AnnotationModel(model);
		},
		createAnnotationStyler: function(annotationModel, view) {
			return new mAnnotations.AnnotationStyler(annotationModel, view);
		},
		createAnnotationRulers: function(annotationModel) {
			var annotationRuler = new mRulers.AnnotationRuler(annotationModel, "left", {styleClass: "ruler annotations"}); //$NON-NLS-1$ //$NON-NLS-0$
			var overviewRuler = new mRulers.OverviewRuler(annotationModel, "right", {styleClass: "ruler overview"}); //$NON-NLS-1$ //$NON-NLS-0$
			return {annotationRuler: annotationRuler, overviewRuler: overviewRuler};
		}
	};
	
	function TextDNDFactory() {
	}
	TextDNDFactory.prototype = {
		createTextDND: function(editor, undoStack) {
			return new mTextDND.TextDND(editor.getTextView(), undoStack);
		}
	};
	
	function IncrementalFind(editor) {
		this.editor = editor;
		this._active = false;
		this._success = true;
		this._ignoreSelection = false;
		this._prefix = "";
		var self = this;
		this._listener = {
			onVerify: function(e){
				var editor = self.editor;
				var model = editor.getModel();
				var start = editor.mapOffset(e.start), end = editor.mapOffset(e.end);
				var txt = model.getText(start, end);
				var prefix = self._prefix;
				// TODO: mRegex is pulled in just for this one call so we can get case-insensitive search
				// is it really necessary
				var match = prefix.match(new RegExp("^" + mRegex.escape(txt), "i")); //$NON-NLS-1$ //$NON-NLS-0$
				if (match && match.length > 0) {
					prefix = self._prefix += e.text;
					self._success = true;
					self._status();
					self.find(true);
					e.text = null;
				}
			},
			onSelection: function() {
				if (!self._ignoreSelection) {
					self.setActive(false);
				}
			}
		};
	}
	IncrementalFind.prototype = {
		backspace: function() {
			if (!this.isActive()) {
				return false;
			}
			var prefix = this._prefix;
			prefix = this._prefix = prefix.substring(0, prefix.length-1);
			if (prefix.length === 0) {
				this._success = true;
				this._ignoreSelection = true;
				this.editor.setCaretOffset(this.editor.getSelection().start);
				this._ignoreSelection = false;
				this._status();
				return true;
			}
			return this.find(false);
		},
		find: function(forward, lookAhead) {
			if (!this.isActive()) {
				return false;
			}
			var prefix = this._prefix;
			if (prefix.length === 0) {
				return false;
			}
			var editor = this.editor;
			var model = editor.getModel();
			var start;
			if (forward) {
				if (this._success) {
					start = editor.getSelection().start + (lookAhead ? 1 : 0);
				} else {
					start = 0;
				}
			} else {
				if (this._success) {
					start = editor.getCaretOffset() - prefix.length - (lookAhead ? 1 : 0);
				} else {
					start = model.getCharCount() - 1;
				}
			}
			var result = editor.getModel().find({
				string: prefix,
				start: start,
				reverse: !forward,
				caseInsensitive: prefix.toLowerCase() === prefix}).next();
			if (result) {
				this._success = true;
				this._ignoreSelection = true;
				editor.moveSelection(result.start, result.end);
				this._ignoreSelection = false;
			} else {
				this._success = false;
			}
			this._status();
			return true;
		},
		isActive: function() {
			return this._active;
		},
		setActive: function(active) {
			this._active = active;
			this._prefix = "";
			this._success = true;
			var editor = this.editor;
			var textView = editor.getTextView();
			this.editor.setCaretOffset(this.editor.getCaretOffset());
			if (this._active) {
				textView.addEventListener("Verify", this._listener.onVerify); //$NON-NLS-0$
				textView.addEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
			} else {
				textView.removeEventListener("Verify", this._listener.onVerify); //$NON-NLS-0$
				textView.removeEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
			}
			this._status();
		},
		_status: function() {
			if (!this.isActive()) {
				this.editor.reportStatus("");
				return;
			}
			var formattedMessage = util.formatMessage(this._success ? messages.incrementalFind : messages.incrementalFindNotFound, this._prefix);
			this.editor.reportStatus(formattedMessage, this._success ? "" : "error"); //$NON-NLS-0$
		}
	};

	/**
	 * TextCommands connects common text editing keybindings onto an editor.
	 */
	function TextActions(editor, undoStack, searcher) {
		this.editor = editor;
		this.undoStack = undoStack;
		this._incrementalFind = new IncrementalFind(editor);
		this._searcher =  searcher;
		this._lastEditLocation = null;
		this.init();
	}
	TextActions.prototype = {
		init: function() {
			var self = this;
			var textView = this.editor.getTextView();
			
			this._lastEditListener = {
				onModelChanged: function(e) {
					if (self.editor.isDirty()) {
						self._lastEditLocation = e.start + e.addedCharCount;
					}
				}
			};
			textView.addEventListener("ModelChanged", this._lastEditListener.onModelChanged); //$NON-NLS-0$
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding("k", true), "findNext"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("findNext", function() { //$NON-NLS-0$
				if (this._searcher){
					var selection = textView.getSelection();
					if(selection.start < selection.end) {
						this._searcher.findNext(true, textView.getText(selection.start, selection.end));
					} else {
						this._searcher.findNext(true);
					}
					return true;
				}
				return false;
			}.bind(this), {name: messages.findNext});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding("k", true, true), "findPrevious"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("findPrevious", function() { //$NON-NLS-0$
				if (this._searcher){
					var selection = textView.getSelection();
					if(selection.start < selection.end) {
						this._searcher.findNext(false, textView.getText(selection.start, selection.end));
					} else {
						this._searcher.findNext(false);
					}
					return true;
				}
				return false;
			}.bind(this), {name: messages.findPrevious});
	
			textView.setKeyBinding(new mKeyBinding.KeyBinding("j", true), "incrementalFind"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("incrementalFind", function() { //$NON-NLS-0$
				if (this._searcher && this._searcher.visible()) {
					return true;
				}
				if (!this._incrementalFind.isActive()) {
					this._incrementalFind.setActive(true);
				} else {
					this._incrementalFind.find(true, true);
				}
				return true;
			}.bind(this), {name: messages.incrementalFindKey});
			textView.setAction("deletePrevious", function() { //$NON-NLS-0$
				return this._incrementalFind.backspace();
			}.bind(this));
			
			textView.setAction("tab", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				if(!textView.getOptions("tabMode")) { return; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				if (firstLine !== lastLine) {
					var lines = [];
					lines.push("");
					for (var i = firstLine; i <= lastLine; i++) {
						lines.push(model.getLine(i, true));
					}
					var lineStart = model.getLineStart(firstLine);
					var lineEnd = model.getLineEnd(lastLine, true);
					var options = textView.getOptions("tabSize", "expandTab"); //$NON-NLS-1$ //$NON-NLS-0$
					var text = options.expandTab ? new Array(options.tabSize + 1).join(" ") : "\t"; //$NON-NLS-1$ //$NON-NLS-0$
					editor.setText(lines.join(text), lineStart, lineEnd);
					editor.setSelection(lineStart === selection.start ? selection.start : selection.start + text.length, selection.end + ((lastLine - firstLine + 1) * text.length));
					return true;
				}
				
				var keyModes = editor.getKeyModes();
				for (var j = 0; j < keyModes.length; j++) {
					if (keyModes[j].isActive()) {
						return keyModes[j].tab();
					}
				}
				
				return false;
			}.bind(this));
	
			textView.setAction("shiftTab", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				if(!textView.getOptions("tabMode")) { return; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var tabSize = textView.getOptions("tabSize"); //$NON-NLS-0$
				var spaceTab = new Array(tabSize + 1).join(" "); //$NON-NLS-0$
				var lines = [], removeCount = 0, firstRemoveCount = 0;
				for (var i = firstLine; i <= lastLine; i++) {
					var line = model.getLine(i, true);
					if (model.getLineStart(i) !== model.getLineEnd(i)) {
						if (line.indexOf("\t") === 0) { //$NON-NLS-0$
							line = line.substring(1);
							removeCount++;
						} else if (line.indexOf(spaceTab) === 0) {
							line = line.substring(tabSize);
							removeCount += tabSize;
						} else {
							return true;
						}
					}
					if (i === firstLine) {
						firstRemoveCount = removeCount;
					}
					lines.push(line);
				}
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				var lastLineStart = model.getLineStart(lastLine);
				editor.setText(lines.join(""), lineStart, lineEnd);
				var start = lineStart === selection.start ? selection.start : selection.start - firstRemoveCount;
				var end = Math.max(start, selection.end - removeCount + (selection.end === lastLineStart+1 && selection.start !== selection.end ? 1 : 0));
				editor.setSelection(start, end);
				return true;
			}.bind(this), {name: messages.unindentLines});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(38, false, false, true), "moveLinesUp"); //$NON-NLS-0$
			textView.setAction("moveLinesUp", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				if (firstLine === 0) {
					return true;
				}
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var lineCount = model.getLineCount();
				var insertOffset = model.getLineStart(firstLine - 1);
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				var text = model.getText(lineStart, lineEnd);
				var delimiterLength = 0;
				if (lastLine === lineCount-1) {
					// Move delimiter preceding selection to end of text
					var delimiterStart = model.getLineEnd(firstLine - 1);
					var delimiterEnd = model.getLineEnd(firstLine - 1, true);
					text += model.getText(delimiterStart, delimiterEnd);
					lineStart = delimiterStart;
					delimiterLength = delimiterEnd - delimiterStart;
				}
				this.startUndo();
				editor.setText("", lineStart, lineEnd);
				editor.setText(text, insertOffset, insertOffset);
				editor.setSelection(insertOffset, insertOffset + text.length - delimiterLength);
				this.endUndo();
				return true;
			}.bind(this), {name: messages.moveLinesUp});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(40, false, false, true), "moveLinesDown"); //$NON-NLS-0$
			textView.setAction("moveLinesDown", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var lineCount = model.getLineCount();
				if (lastLine === lineCount-1) {
					return true;
				}
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				var insertOffset = model.getLineEnd(lastLine+1, true) - (lineEnd - lineStart);
				var text, delimiterLength = 0;
				if (lastLine !== lineCount-2) {
					text = model.getText(lineStart, lineEnd);
				} else {
					// Move delimiter following selection to front of the text
					var lineEndNoDelimiter = model.getLineEnd(lastLine);
					text = model.getText(lineEndNoDelimiter, lineEnd) + model.getText(lineStart, lineEndNoDelimiter);
					delimiterLength += lineEnd - lineEndNoDelimiter;
				}
				this.startUndo();
				editor.setText("", lineStart, lineEnd);
				editor.setText(text, insertOffset, insertOffset);
				editor.setSelection(insertOffset + delimiterLength, insertOffset + delimiterLength + text.length);
				this.endUndo();
				return true;
			}.bind(this), {name: messages.moveLinesDown});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(38, true, false, true), "copyLinesUp"); //$NON-NLS-0$
			textView.setAction("copyLinesUp", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				var lineCount = model.getLineCount();
				var delimiter = "";
				var text = model.getText(lineStart, lineEnd);
				if (lastLine === lineCount-1) {
					text += (delimiter = model.getLineDelimiter());
				}
				var insertOffset = lineStart;
				editor.setText(text, insertOffset, insertOffset);
				editor.setSelection(insertOffset, insertOffset + text.length - delimiter.length);
				return true;
			}.bind(this), {name: messages.copyLinesUp});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(40, true, false, true), "copyLinesDown"); //$NON-NLS-0$
			textView.setAction("copyLinesDown", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				var lineCount = model.getLineCount();
				var delimiter = "";
				var text = model.getText(lineStart, lineEnd);
				if (lastLine === lineCount-1) {
					text = (delimiter = model.getLineDelimiter()) + text;
				}
				var insertOffset = lineEnd;
				editor.setText(text, insertOffset, insertOffset);
				editor.setSelection(insertOffset + delimiter.length, insertOffset + text.length);
				return true;
			}.bind(this), {name: messages.copyLinesDown});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding('d', true, false, false), "deleteLines"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("deleteLines", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var selection = editor.getSelection();
				var model = editor.getModel();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				editor.setText("", lineStart, lineEnd);
				return true;
			}.bind(this), {name: messages.deleteLines});
			
			// Go To Line action
			textView.setKeyBinding(new mKeyBinding.KeyBinding("l", !util.isMac, false, false, util.isMac), "gotoLine"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("gotoLine", function() { //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var line = model.getLineAtOffset(editor.getCaretOffset());
				line = prompt(messages.gotoLinePrompty, line + 1);
				if (line) {
					line = parseInt(line, 10);
					editor.onGotoLine(line - 1, 0);
				}
				return true;
			}.bind(this), {name: messages.gotoLine});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(190, true), "nextAnnotation"); //$NON-NLS-0$
			textView.setAction("nextAnnotation", function() { //$NON-NLS-0$
				return this.nextAnnotation(true);
			}.bind(this), {name: messages.nextAnnotation});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(188, true), "previousAnnotation"); //$NON-NLS-0$
			textView.setAction("previousAnnotation", function() { //$NON-NLS-0$
				return this.nextAnnotation(false);
			}.bind(this), {name: messages.prevAnnotation});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding("e", true, false, true, false), "expand"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("expand", function() { //$NON-NLS-0$
				return this.expandAnnotation(true);
			}.bind(this), {name: messages.expand});
	
			textView.setKeyBinding(new mKeyBinding.KeyBinding("c", true, false, true, false), "collapse"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("collapse", function() { //$NON-NLS-0$
				return this.expandAnnotation(false);
			}.bind(this), {name: messages.collapse});
	
			textView.setKeyBinding(new mKeyBinding.KeyBinding("e", true, true, true, false), "expandAll"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("expandAll", function() { //$NON-NLS-0$
				return this.expandAnnotations(true);
			}.bind(this), {name: messages.expandAll});
	
			textView.setKeyBinding(new mKeyBinding.KeyBinding("c", true, true, true, false), "collapseAll"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("collapseAll", function() { //$NON-NLS-0$
				return this.expandAnnotations(false);
			}.bind(this), {name: messages.collapseAll});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding("q", !util.isMac, false, false, util.isMac), "lastEdit"); //$NON-NLS-1$ //$NON-NLS-0$
			textView.setAction("lastEdit", function() { //$NON-NLS-0$
				if (typeof this._lastEditLocation === "number")  { //$NON-NLS-0$
					this.editor.showSelection(this._lastEditLocation);
				}
				return true;
			}.bind(this), {name: messages.lastEdit});
		},
		
		nextAnnotation: function (forward) {
			var editor = this.editor;
			var annotationModel = editor.getAnnotationModel();
			if(!annotationModel) { return true; }
			var model = editor.getModel();
			var currentOffset = editor.getCaretOffset();
			var annotations = annotationModel.getAnnotations(forward ? currentOffset : 0, forward ? model.getCharCount() : currentOffset);
			var foundAnnotation = null;
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (forward) {
					if (annotation.start <= currentOffset) { continue; }
				} else {
					if (annotation.start >= currentOffset) { continue; }
				}
				switch (annotation.type) {
					case mAnnotations.AnnotationType.ANNOTATION_ERROR:
					case mAnnotations.AnnotationType.ANNOTATION_WARNING:
					case mAnnotations.AnnotationType.ANNOTATION_TASK:
					case mAnnotations.AnnotationType.ANNOTATION_BOOKMARK:
						break;
					default:
						continue;
				}
				foundAnnotation = annotation;
				if (forward) {
					break;
				}
			}
			if (foundAnnotation) {
				var view = editor.getTextView();
				var nextLine = model.getLineAtOffset(foundAnnotation.start);
				var tooltip = mTooltip.Tooltip.getTooltip(view);
				if (!tooltip) {
					editor.moveSelection(foundAnnotation.start);
					return true;
				}
				editor.moveSelection(foundAnnotation.start, foundAnnotation.start, function() {
					tooltip.setTarget({
						getTooltipInfo: function() {
							var tooltipCoords = view.convert({
								x: view.getLocationAtOffset(foundAnnotation.start).x, 
								y: view.getLocationAtOffset(model.getLineStart(nextLine)).y
							}, "document", "page"); //$NON-NLS-1$ //$NON-NLS-0$
							return {
								contents: [foundAnnotation],
								x: tooltipCoords.x,
								y: tooltipCoords.y + Math.floor(view.getLineHeight(nextLine) * 1.33)
							};
						}
					}, 0);
				});
			}
			return true;
		},
		
		expandAnnotation: function(expand) {
			var editor = this.editor;
			var annotationModel = editor.getAnnotationModel();
			if(!annotationModel) { return true; }
			var model = editor.getModel();
			var currentOffset = editor.getCaretOffset();
			var lineIndex = model.getLineAtOffset(currentOffset);
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex, true);
			if (model.getBaseModel) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
				model = model.getBaseModel();
			}
			var annotation, iter = annotationModel.getAnnotations(start, end);
			while (!annotation && iter.hasNext()) {
				var a = iter.next();
				if (a.type !== mAnnotations.AnnotationType.ANNOTATION_FOLDING) { continue; }
				annotation = a;
			}
			if (annotation) {
				if (expand !== annotation.expanded) {
					if (expand) {
						annotation.expand();
					} else {
						editor.setCaretOffset(annotation.start);
						annotation.collapse();
					}
					annotationModel.modifyAnnotation(annotation);
				}
			}
			return true;
		},

		expandAnnotations: function(expand) {
			var editor = this.editor;
			var textView = editor.getTextView();
			var annotationModel = editor.getAnnotationModel();
			if(!annotationModel) { return true; }
			var model = editor.getModel();
			var annotation, iter = annotationModel.getAnnotations(0, model.getCharCount());
			textView.setRedraw(false);
			while (iter.hasNext()) {
				annotation = iter.next();
				if (annotation.type !== mAnnotations.AnnotationType.ANNOTATION_FOLDING) { continue; }
				if (expand !== annotation.expanded) {
					if (expand) {
						annotation.expand();
					} else {
						annotation.collapse();
					}
					annotationModel.modifyAnnotation(annotation);
				}
			}
			textView.setRedraw(true);
			return true;
		},
		
		startUndo: function() {
			if (this.undoStack) {
				this.undoStack.startCompoundChange();
			}
		}, 
		
		endUndo: function() {
			if (this.undoStack) {
				this.undoStack.endCompoundChange();
			}
		}, 
	
		cancel: function() {
			this._incrementalFind.setActive(false);
		},
		
		isActive: function() {
			return this._incrementalFind.isActive();
		},
		
		isStatusActive: function() {
			return this._incrementalFind.isActive();
		},
		
		lineUp: function() {
			return this._incrementalFind.find(false, true);
		},
		lineDown: function() {	
			return this._incrementalFind.find(true, true);
		},
		enter: function() {
			return false;
		}
	};
	
	/**
	 * @param {orion.editor.Editor} editor
	 * @param {orion.editor.UndoStack} undoStack
	 * @param {orion.editor.ContentAssist} [contentAssist]
	 * @param {orion.editor.LinkedMode} [linkedMode]
	 */
	function SourceCodeActions(editor, undoStack, contentAssist, linkedMode) {
		this.editor = editor;
		this.undoStack = undoStack;
		this.contentAssist = contentAssist;
		this.linkedMode = linkedMode;
		if (this.contentAssist) {
			this.contentAssist.addEventListener("ProposalApplied", this.contentAssistProposalApplied.bind(this)); //$NON-NLS-0$
		}
		this.init();
	}
	SourceCodeActions.prototype = {
		startUndo: function() {
			if (this.undoStack) {
				this.undoStack.startCompoundChange();
			}
		}, 
		
		endUndo: function() {
			if (this.undoStack) {
				this.undoStack.endCompoundChange();
			}
		}, 
		init: function() {
			var textView = this.editor.getTextView();
		
			textView.setAction("lineStart", function() { //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var caretOffset = editor.getCaretOffset();
				var lineIndex = model.getLineAtOffset(caretOffset);
				var lineOffset = model.getLineStart(lineIndex);
				var lineText = model.getLine(lineIndex);
				var offset;
				for (offset=0; offset<lineText.length; offset++) {
					var c = lineText.charCodeAt(offset);
					if (!(c === 32 || c === 9)) {
						break;
					}
				}
				offset += lineOffset;
				if (caretOffset !== offset) {
					editor.setSelection(offset, offset);
					return true;
				}
				return false;
			}.bind(this));
		
			// Block comment operations
			textView.setKeyBinding(new mKeyBinding.KeyBinding(191, true), "toggleLineComment"); //$NON-NLS-0$
			textView.setAction("toggleLineComment", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var firstLine = model.getLineAtOffset(selection.start);
				var lastLine = model.getLineAtOffset(selection.end > selection.start ? selection.end - 1 : selection.end);
				var uncomment = true, lines = [], lineText, index;
				for (var i = firstLine; i <= lastLine; i++) {
					lineText = model.getLine(i, true);
					lines.push(lineText);
					if (!uncomment || (index = lineText.indexOf("//")) === -1) { //$NON-NLS-0$
						uncomment = false;
					} else {
						if (index !== 0) {
							var j;
							for (j=0; j<index; j++) {
								var c = lineText.charCodeAt(j);
								if (!(c === 32 || c === 9)) {
									break;
								}
							}
							uncomment = j === index;
						}
					}
				}
				var text, selStart, selEnd;
				var lineStart = model.getLineStart(firstLine);
				var lineEnd = model.getLineEnd(lastLine, true);
				if (uncomment) {
					for (var k = 0; k < lines.length; k++) {
						lineText = lines[k];
						index = lineText.indexOf("//"); //$NON-NLS-0$
						lines[k] = lineText.substring(0, index) + lineText.substring(index + 2);
					}
					text = lines.join("");
					var lastLineStart = model.getLineStart(lastLine);
					selStart = lineStart === selection.start ? selection.start : selection.start - 2;
					selEnd = selection.end - (2 * (lastLine - firstLine + 1)) + (selection.end === lastLineStart+1 ? 2 : 0);
				} else {
					lines.splice(0, 0, "");
					text = lines.join("//"); //$NON-NLS-0$
					selStart = lineStart === selection.start ? selection.start : selection.start + 2;
					selEnd = selection.end + (2 * (lastLine - firstLine + 1));
				}
				editor.setText(text, lineStart, lineEnd);
				editor.setSelection(selStart, selEnd);
				return true;
			}.bind(this), {name: messages.toggleLineComment});
			
			function findEnclosingComment(model, start, end) {
				var open = "/*", close = "*/"; //$NON-NLS-1$ //$NON-NLS-0$
				var firstLine = model.getLineAtOffset(start);
				var lastLine = model.getLineAtOffset(end);
				var i, line, extent, openPos, closePos;
				var commentStart, commentEnd;
				for (i=firstLine; i >= 0; i--) {
					line = model.getLine(i);
					extent = (i === firstLine) ? start - model.getLineStart(firstLine) : line.length;
					openPos = line.lastIndexOf(open, extent);
					closePos = line.lastIndexOf(close, extent);
					if (closePos > openPos) {
						break; // not inside a comment
					} else if (openPos !== -1) {
						commentStart = model.getLineStart(i) + openPos;
						break;
					}
				}
				for (i=lastLine; i < model.getLineCount(); i++) {
					line = model.getLine(i);
					extent = (i === lastLine) ? end - model.getLineStart(lastLine) : 0;
					openPos = line.indexOf(open, extent);
					closePos = line.indexOf(close, extent);
					if (openPos !== -1 && openPos < closePos) {
						break;
					} else if (closePos !== -1) {
						commentEnd = model.getLineStart(i) + closePos;
						break;
					}
				}
				return {commentStart: commentStart, commentEnd: commentEnd};
			}
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(191, true, !util.isMac, false, util.isMac), "addBlockComment"); //$NON-NLS-0$
			textView.setAction("addBlockComment", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var open = "/*", close = "*/", commentTags = new RegExp("/\\*" + "|" + "\\*/", "g"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				var result = findEnclosingComment(model, selection.start, selection.end);
				if (result.commentStart !== undefined && result.commentEnd !== undefined) {
					return true; // Already in a comment
				}
				
				var text = model.getText(selection.start, selection.end);
				if (text.length === 0) { return true; }
				
				var oldLength = text.length;
				text = text.replace(commentTags, "");
				var newLength = text.length;
				
				editor.setText(open + text + close, selection.start, selection.end);
				editor.setSelection(selection.start + open.length, selection.end + open.length + (newLength-oldLength));
				return true;
			}.bind(this), {name: messages.addBlockComment});
			
			textView.setKeyBinding(new mKeyBinding.KeyBinding(220, true, !util.isMac, false, util.isMac), "removeBlockComment"); //$NON-NLS-0$
			textView.setAction("removeBlockComment", function() { //$NON-NLS-0$
				if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
				var editor = this.editor;
				var model = editor.getModel();
				var selection = editor.getSelection();
				var open = "/*", close = "*/"; //$NON-NLS-1$ //$NON-NLS-0$
				
				// Try to shrink selection to a comment block
				var selectedText = model.getText(selection.start, selection.end);
				var newStart, newEnd;
				var i;
				for(i=0; i < selectedText.length; i++) {
					if (selectedText.substring(i, i + open.length) === open) {
						newStart = selection.start + i;
						break;
					}
				}
				for (; i < selectedText.length; i++) {
					if (selectedText.substring(i, i + close.length) === close) {
						newEnd = selection.start + i;
						break;
					}
				}
				
				if (newStart !== undefined && newEnd !== undefined) {
					editor.setText(model.getText(newStart + open.length, newEnd), newStart, newEnd + close.length);
					editor.setSelection(newStart, newEnd);
				} else {
					// Otherwise find enclosing comment block
					var result = findEnclosingComment(model, selection.start, selection.end);
					if (result.commentStart === undefined || result.commentEnd === undefined) {
						return true;
					}
					
					var text = model.getText(result.commentStart + open.length, result.commentEnd);
					editor.setText(text, result.commentStart, result.commentEnd + close.length);
					editor.setSelection(selection.start - open.length, selection.end - close.length);
				}
				return true;
			}.bind(this), {name: messages.removeBlockComment});
		},
		/**
		 * Called when a content assist proposal has been applied. Inserts the proposal into the
		 * document. Activates Linked Mode if applicable for the selected proposal.
		 * @param {orion.editor.ContentAssist#ProposalAppliedEvent} event
		 */
		contentAssistProposalApplied: function(event) {
			/**
			 * The event.proposal is an object with this shape:
			 * {   proposal: "[proposal string]", // Actual text of the proposal
			 *     description: "diplay string", // Optional
			 *     positions: [{
			 *         offset: 10, // Offset of start position of parameter i
			 *         length: 3  // Length of parameter string for parameter i
			 *     }], // One object for each parameter; can be null
			 *     escapePosition: 19, // Optional; offset that caret will be placed at after exiting Linked Mode.
			 *     style: 'emphasis', // Optional: either emphasis, noemphasis, hr to provide custom styling for the proposal
			 *     unselectable: false // Optional: if set to true, then this proposal cannnot be selected through the keyboard
			 * }
			 * Offsets are relative to the text buffer.
			 */
			var proposal = event.data.proposal;
			
			//if the proposal specifies linked positions, build the model and enter linked mode
			if (proposal.positions && proposal.positions.length > 0 && this.linkedMode) {
				var positionGroups = [];
				for (var i = 0; i < proposal.positions.length; ++i) {
					positionGroups[i] = {
						positions: [{
							offset: proposal.positions[i].offset,
							length: proposal.positions[i].length
						}]
					};
				}
				this.linkedMode.enterLinkedMode({
					groups: positionGroups,
					escapePosition: proposal.escapePosition
				});
			} else if (proposal.groups && proposal.groups.length > 0 && this.linkedMode) {
				this.linkedMode.enterLinkedMode({
					groups: proposal.groups,
					escapePosition: proposal.escapePosition
				});
			} else if (proposal.escapePosition) {
				//we don't want linked mode, but there is an escape position, so just set cursor position
				var textView = this.editor.getTextView();
				textView.setCaretOffset(proposal.escapePosition);
			}
			return true;
		},
		cancel: function() {
			return false;
		},
		isActive: function() {
			return true;
		},
		isStatusActive: function() {
			// SourceCodeActions never reports status
			return false;
		},
		lineUp: function() {
			return false;
		},
		lineDown: function() {
			return false;
		},
		enter: function() {
			// Auto indent
			var textView = this.editor.getTextView();
			if (textView.getOptions("readonly")) { return false; } //$NON-NLS-0$
			var editor = this.editor;
			var selection = editor.getSelection();
			if (selection.start === selection.end) {
				var model = editor.getModel();
				var lineIndex = model.getLineAtOffset(selection.start);
				var lineText = model.getLine(lineIndex, true);
				var lineStart = model.getLineStart(lineIndex);
				var index = 0, end = selection.start - lineStart, c;
				while (index < end && ((c = lineText.charCodeAt(index)) === 32 || c === 9)) { index++; }
				if (index > 0) {
					//TODO still wrong when typing inside folding
					var prefix = lineText.substring(0, index);
					index = end;
					while (index < lineText.length && ((c = lineText.charCodeAt(index++)) === 32 || c === 9)) { selection.end++; }
					editor.setText(model.getLineDelimiter() + prefix, selection.start, selection.end);
					return true;
				}
			}
			return false;
		},
		tab: function() {
			return false;
		}
	};
	
	function LinkedMode(editor, undoStack, contentAssist) {
		this.editor = editor;
		this.undoStack = undoStack;
		this.contentAssist = contentAssist;
		
		this.linkedModeModel = null;
		
		/**
		 * Listener called when Linked Mode is active. Updates position's offsets and length
		 * on user change. Also escapes the Linked Mode if the text buffer was modified outside of the Linked Mode positions.
		 */
		this.linkedModeListener = {
		
			onActivating: function(event) {
				if (this._groupContentAssistProvider) {
					this.contentAssist.setProviders([this._groupContentAssistProvider]);
					this.contentAssist.setProgress(null);
				}
			}.bind(this),
			
			onModelChanged: function(event) {
				if (this.ignoreVerify) { return; }

				// Get the position being modified
				var model = this.linkedModeModel, positionChanged, changed;
				while (model) {
					positionChanged = this._getPositionChanged(model, event.start, event.start + event.removedCharCount);
					changed = positionChanged.position;
					if (changed === undefined || changed.model !== model) {
						// The change has been done outside of the positions, exit the Linked Mode
						this.exitLinkedMode(false);
						model = this.linkedModeModel;
					} else {
						break;
					}
				}
				if (!model) { return; }

				// Update position offsets for this change. Group changes are done in #onVerify
				var deltaCount = 0;
				var changeCount = event.addedCharCount - event.removedCharCount;
				var sortedPositions = positionChanged.positions, position, pos;
				for (var i = 0; i < sortedPositions.length; ++i) {
					pos = sortedPositions[i];
					position = pos.position;
					var inside = position.offset <= event.start && event.start <= position.offset + position.length;
					if (inside && !pos.ansestor) {
						position.offset += deltaCount;
						position.length += changeCount;
						deltaCount += changeCount;
					} else {
						position.offset += deltaCount;
						if (pos.ansestor && inside) {
							position.length += changeCount;
						}
					}
					if (pos.escape) {
						pos.model.escapePosition = position.offset;
					}
				}
				this._updateAnnotations(sortedPositions);
			}.bind(this),

			onVerify: function(event) {
				if (this.ignoreVerify) { return; }

				// Get the position being modified
				var model = this.linkedModeModel, positionChanged, changed;
				while (model) {
					positionChanged = this._getPositionChanged(model, event.start, event.end);
					changed = positionChanged.position;
					if (changed === undefined || changed.model !== model) {
						// The change has been done outside of the positions, exit the Linked Mode
						this.exitLinkedMode(false);
						model = this.linkedModeModel;
					} else {
						break;
					}
				}
				if (!model) { return; }
				
				// Make sure changes in a same group are compound
				var undo = this._compoundChange;
				if (undo) {
					if (!(undo.owner.model === model && undo.owner.group === changed.group)) {
						this.endUndo();
						this.startUndo();
					}
				} else {
					this.startUndo();
				}

				model.selectedGroupIndex = changed.group;
				
				// Update position offsets taking into account all positions in the same changing group
				var deltaCount = 0;
				var changeCount = event.text.length - (event.end - event.start);
				var sortedPositions = positionChanged.positions, position, pos;
				var deltaStart = event.start - changed.position.offset, deltaEnd = event.end - changed.position.offset;
				for (var i = 0; i < sortedPositions.length; ++i) {
					pos = sortedPositions[i];
					position = pos.position;
					pos.oldOffset = position.offset;
					if (pos.model === model && pos.group === changed.group) {
						position.offset += deltaCount;
						position.length += changeCount;
						deltaCount += changeCount;
					} else {
						position.offset += deltaCount;
						if (pos.ansestor) {
							position.length += changed.count * changeCount;
						}
					}
					if (pos.escape) {
						pos.model.escapePosition = position.offset;
					}
				}
				
				// Cancel this modification and apply same modification to all positions in changing group
				this.ignoreVerify = true;
				var textView = this.editor.getTextView();
				for (i = sortedPositions.length - 1; i >= 0; i--) {
					pos = sortedPositions[i];
					if (pos.model === model && pos.group === changed.group) {
						textView.setText(event.text, pos.oldOffset + deltaStart , pos.oldOffset + deltaEnd);
					}
				}
				this.ignoreVerify = false;
				event.text = null;
				this._updateAnnotations(sortedPositions);
			}.bind(this)
		};
	}
	LinkedMode.prototype = {
		/**
		 * Starts Linked Mode, selects the first position and registers the listeners.
		 * @param {Object} linkedModeModel An object describing the model to be used by linked mode.
		 * Contains one or more position groups. If a position in a group is edited, the other positions in
		 * the same group are edited the same way. The model structure is as follows:
		 * <pre>{
		 *		groups: [{
		 *			data: {},
		 *			positions: [{
		 *				offset: 10, // Relative to the text buffer
		 *				length: 3
		 *			}]
		 *		}],
		 *		escapePosition: 19, // Relative to the text buffer
		 * }</pre>
		 *
		 * Each group in the model has an optional <code>data</code> property which can be
		 * used to provide additional content assist for the group.  The <code>type</code> in
		 * data determines what kind of content assist is provided. These are the support
		 * structures for the <code>data</code> property.
		 * <pre>{
		 *		type: "link"
		 *		values: ["proposal0", "proposal1", ...]
		 * }</pre>
		 *
		 * The "link" data struture provides static content assist proposals stored in the
		 * <code>values</code> property.
		 *
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.Template}<br/>
		 * {@link orion.editor.TemplateContentAssist}<br/>
		 * </p>
		 */
		enterLinkedMode: function(linkedModeModel) {
			if (!this.linkedModeModel) {
				var textView = this.editor.getTextView();
				textView.addEventListener("Verify", this.linkedModeListener.onVerify); //$NON-NLS-0$
				textView.addEventListener("ModelChanged", this.linkedModeListener.onModelChanged); //$NON-NLS-0$
				var contentAssist = this.contentAssist;
				contentAssist.addEventListener("Activating", this.linkedModeListener.onActivating); //$NON-NLS-0$
	
				textView.setKeyBinding(new mKeyBinding.KeyBinding(9), "nextLinkedModePosition"); //$NON-NLS-0$
				textView.setAction("nextLinkedModePosition", function() { //$NON-NLS-0$
					var model = this.linkedModeModel;
					this.selectLinkedGroup((model.selectedGroupIndex + 1) % model.groups.length);
					return true;
				}.bind(this));
				
				textView.setKeyBinding(new mKeyBinding.KeyBinding(9, false, true), "previousLinkedModePosition"); //$NON-NLS-0$
				textView.setAction("previousLinkedModePosition", function() { //$NON-NLS-0$
					var model = this.linkedModeModel;
					this.selectLinkedGroup(model.selectedGroupIndex > 0 ? model.selectedGroupIndex-1 : model.groups.length-1);
					return true;
				}.bind(this));
	
				this.editor.reportStatus(messages.linkedModeEntered, null, true);
			}
			this._sortedPositions = null;
			if (this.linkedModeModel) {
				linkedModeModel.previousModel = this.linkedModeModel;
				linkedModeModel.parentGroup = this.linkedModeModel.selectedGroupIndex;
				this.linkedModeModel.nextModel = linkedModeModel;
			}
			this.linkedModeModel = linkedModeModel;
			this.selectLinkedGroup(0);
		},
		/** 
		 * Exits Linked Mode. Optionally places the caret at linkedMode escapePosition. 
		 * @param {Boolean} [escapePosition=false] if true, place the caret at the  escape position.
		 */
		exitLinkedMode: function(escapePosition) {
			if (!this.isActive()) {
				return;
			}
			if (this._compoundChange) {
				this.endUndo();
				this._compoundChange = null;
			}
			this._sortedPositions = null;
			var model = this.linkedModeModel;
			this.linkedModeModel = model.previousModel;
			model.parentGroup = model.previousModel = undefined;
			if (this.linkedModeModel) {
				this.linkedModeModel.nextModel = undefined;
			}
			if (!this.linkedModeModel) {
				var textView = this.editor.getTextView();
				textView.removeEventListener("Verify", this.linkedModeListener.onVerify); //$NON-NLS-0$
				textView.removeEventListener("ModelChanged", this.linkedModeListener.onModelChanged); //$NON-NLS-0$
				var contentAssist = this.contentAssist;
				contentAssist.removeEventListener("Activating", this.linkedModeListener.onActivating); //$NON-NLS-0$
				contentAssist.offset = undefined;
	
				textView.setKeyBinding(new mKeyBinding.KeyBinding(9), "tab"); //$NON-NLS-0$
				textView.setKeyBinding(new mKeyBinding.KeyBinding(9, false, true), "shiftTab"); //$NON-NLS-0$
				
				this.editor.reportStatus(messages.linkedModeExited, null, true);
				if (escapePosition) {
					textView.setCaretOffset(model.escapePosition, false);
				}
			}
			this.selectLinkedGroup(0);
		},
		startUndo: function() {
			if (this.undoStack) {
				var self = this;
				var model = this.linkedModeModel;
				this._compoundChange = this.undoStack.startCompoundChange({
					model: model,
					group: model.selectedGroupIndex,
					end: function() {
						self._compoundChange = null;
					}
				});
			}
		}, 
		endUndo: function() {
			if (this.undoStack) {
				this.undoStack.endCompoundChange();
			}
		},
		isActive: function() {
			return !!this.linkedModeModel;
		},
		isStatusActive: function() {
			return !!this.linkedModeModel;
		},
		enter: function() {
			this.exitLinkedMode(true);
			return true;
		},
		cancel: function() {
			this.exitLinkedMode(false);
		},
		lineUp: function() {
			return false;
		},
		lineDown: function() {
			return false;
		},
		selectLinkedGroup: function(index) {
			var model = this.linkedModeModel;
			if (model) {
				model.selectedGroupIndex = index;
				var group = model.groups[index];
				var position = group.positions[0];
				var textView = this.editor.getTextView();
				textView.setSelection(position.offset, position.offset + position.length);
				var contentAssist = this.contentAssist;
				if (contentAssist) {
					contentAssist.offset = undefined;
					if (group.data && group.data.type === "link" && group.data.values) { //$NON-NLS-0$
						var provider = this._groupContentAssistProvider = new mTemplates.TemplateContentAssist(group.data.values);
						provider.getPrefix = function() {
							var selection = textView.getSelection();
							if (selection.start === selection.end) {
								var caretOffset = textView.getCaretOffset();
								if (position.offset <= caretOffset && caretOffset <= position.offset + position.length) {
									return textView.getText(position.offset, caretOffset);
								}
							}
							return "";
						};
						contentAssist.offset = position.offset;
						contentAssist.deactivate();
						contentAssist.activate();
					} else if (this._groupContentAssistProvider) {
						this._groupContentAssistProvider = null;
						contentAssist.deactivate();
					}
				}
			}
			this._updateAnnotations();
		},
		_getModelPositions: function(all, model, delta) {
			var groups = model.groups;
			for (var i = 0; i < groups.length; i++) {
				var positions = groups[i].positions;
				for (var j = 0; j < positions.length; j++) {
					var position = positions[j];
					if (delta) {
						position = {offset: position.offset + delta, length: position.length};
					}
					var pos = {
						index: j,
						group: i,
						count: positions.length,
						model: model,
						position: position
					};
					all.push(pos);
					if (model.nextModel && model.nextModel.parentGroup === i) {
						pos.ansestor = true;
						this._getModelPositions(all, model.nextModel, (delta || 0) + positions[j].offset - positions[0].offset);
					}
				}
			}
		},
		_getSortedPositions: function(model) {
			var all = this._sortedPositions;
			if (!all) {
				all = [];
				// Get the root linked model
				while (model.previousModel) {
					model = model.previousModel;
				}
				// Get all positions under model expanding group positions of stacked linked modes
				this._getModelPositions(all, model);
				// Add escape position for all models
				while (model) {
					if (model.escapePosition !== undefined) {
						all.push({
							escape: true,
							model: model,
							position: {offset: model.escapePosition, length: 0}
						});
					}
					model = model.nextModel;
				}
				all.sort(function(a, b) {
					return a.position.offset - b.position.offset;
				});
				this._sortedPositions = all;
			}
			return all;
		},
		_getPositionChanged: function(model, start, end) {
			var changed;
			var sortedPositions = this._getSortedPositions(model);
			for (var i = sortedPositions.length - 1; i >= 0; i--) {
				var position = sortedPositions[i].position;
				if (position.offset <= start && end <= position.offset + position.length) {
					changed = sortedPositions[i];
					break;
				}
			}
			return {position: changed, positions: sortedPositions};
		},
		_updateAnnotations: function(positions) {
			var annotationModel = this.editor.getAnnotationModel();
			if (!annotationModel) { return; }
			var remove = [], add = [];
			var textModel = annotationModel.getTextModel();
			var annotations = annotationModel.getAnnotations(0, textModel.getCharCount()), annotation;
			while (annotations.hasNext()) {
				annotation = annotations.next();
				switch (annotation.type) {
					case mAnnotations.AnnotationType.ANNOTATION_LINKED_GROUP:
					case mAnnotations.AnnotationType.ANNOTATION_CURRENT_LINKED_GROUP:
					case mAnnotations.AnnotationType.ANNOTATION_SELECTED_LINKED_GROUP:
						remove.push(annotation);
				}
			}
			var model = this.linkedModeModel;
			if (model) {
				positions = positions || this._getSortedPositions(model);
				for (var i = 0; i < positions.length; i++) {
					var position = positions[i];
					if (position.model !== model) { continue; }
					var type = mAnnotations.AnnotationType.ANNOTATION_LINKED_GROUP;
					if (position.group === model.selectedGroupIndex) {
						if (position.index === 0) {
							type = mAnnotations.AnnotationType.ANNOTATION_SELECTED_LINKED_GROUP;
						} else {
							type = mAnnotations.AnnotationType.ANNOTATION_CURRENT_LINKED_GROUP;
						}
					}
					position = position.position;
					annotation = mAnnotations.AnnotationType.createAnnotation(type, position.offset, position.offset + position.length, "");
					add.push(annotation);
				}
			}
			annotationModel.replaceAnnotations(remove, add);
		}
	};

	return {
		UndoFactory: UndoFactory,
		LineNumberRulerFactory: LineNumberRulerFactory,
		FoldingRulerFactory: FoldingRulerFactory,
		AnnotationFactory: AnnotationFactory,
		TextDNDFactory: TextDNDFactory,
		TextActions: TextActions,
		SourceCodeActions: SourceCodeActions,
		LinkedMode: LinkedMode
	};
});
