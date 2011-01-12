/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse = eclipse || {};

eclipse.UndoStack = (function() {
	var Change = (function() {
		function Change(offset, text, previousText) {
			this.offset = offset;
			this.text = text;
			this.previousText = previousText;
		}
		Change.prototype = {
			undo: function (editor, select) {
				this._doUndoRedo(this.offset, this.previousText, this.text, editor, select);
			},
			redo: function (editor, select) {
				this._doUndoRedo(this.offset, this.text, this.previousText, editor, select);
			},
			_doUndoRedo: function(offset, text, previousText, editor, select) {
				editor.setText(text, offset, offset + previousText.length);
				if (select) {
					editor.setSelection(offset, offset + text.length);
				}
			}
		};
		return Change;
	}());

	var CompoundChange = (function() {
		function CompoundChange (selection, caret) {
			this.selection = selection;
			this.caret = caret;
			this.changes = [];
		}
		CompoundChange.prototype = {
			add: function (change) {
				this.changes.push(change);
			},
			undo: function (editor, select) {
				for (var i=this.changes.length - 1; i >= 0; i--) {
					this.changes[i].undo(editor, false);
				}
				if (select) {
					var start = this.selection.start;
					var end = this.selection.end;
					editor.setSelection(this.caret ? start : end, this.caret ? end : start);
				}
			},
			redo: function (editor, select) {
				for (var i = 0; i < this.changes.length; i++) {
					this.changes[i].redo(editor, false);
				}
				if (select) {
					var start = this.selection.start;
					var end = this.selection.end;
					editor.setSelection(this.caret ? start : end, this.caret ? end : start);
				}
			}
		};
		return CompoundChange;
	}());

	function UndoStack (editor, size) {
		this.editor = editor;
		this.size = size !== undefined ? size : 100;
		this.reset();
		editor.addEventListener("ModelChanging", this, this._onModelChanging);
		editor.addEventListener("Destroy", this, this._onDestroy);
	}
	UndoStack.prototype = {
		add: function (change) {
			if (this.compoundChange) {
				this.compoundChange.add(change);
			} else {
				var length = this.stack.length;
				this.stack.splice(this.index, length-this.index, change);
				this.index++;
				if (this.stack.length > this.size) {
					this.stack.shift();
					this.index--;
					this.cleanIndex--;
				}
			}
		},
		markClean: function() {
			this.endCompoundChange();
			this._commitUndo();
			this.cleanIndex = this.index;
		},
		isClean: function() {
			return this.cleanIndex === this.getSize().undo;
		},
		canUndo: function() {
			return this.getSize().undo > 0;
		},
		canRedo: function() {
			return this.getSize().redo > 0;
		},
		endCompoundChange: function() {
			this.compoundChange = undefined;
		},
		getSize: function() {
			var index = this.index;
			var length = this.stack.length;
			if (this._undoStart !== undefined) {
				index++;
			}
			return {undo: index, redo: (length - index)};
		},
		undo: function() {
			this._commitUndo();
			if (this.index <= 0) {
				return false;
			}
			var change = this.stack[--this.index];
			this._ignoreUndo = true;
			change.undo(this.editor, true);
			this._ignoreUndo = false;
			return true;
		},
		redo: function() {
			this._commitUndo();
			if (this.index >= this.stack.length) {
				return false;
			}
			var change = this.stack[this.index++];
			this._ignoreUndo = true;
			change.redo(this.editor, true);
			this._ignoreUndo = false;
			return true;
		},
		reset: function() {
			this.index = this.cleanIndex = 0;
			this.stack = [];
			this._undoStart = undefined;
			this._undoText = "";
			this._ignoreUndo = false;
			this._compoundChange = undefined;
		},
		startCompoundChange: function() {
			var change = new CompoundChange(this.editor.getSelection(), this.editor.getCaretOffset());
			this.add(change);
			this.compoundChange = change;
		},
		_commitUndo: function () {
			if (this._undoStart !== undefined) {
				if (this._undoStart < 0) {
					this.add(new Change(-this._undoStart, "", this._undoText, ""));
				} else {
					this.add(new Change(this._undoStart, this._undoText, ""));
				}
				this._undoStart = undefined;
				this._undoText = "";
			}
		},
		_onDestroy: function() {
			this.editor.removeEventListener("ModelChanging", this, this._onModelChanging);
			this.editor.removeEventListener("Destroy", this, this._onDestroy);
		},
		_onModelChanging: function(e) {
			var newText = e.text;
			var start = e.start;
			var removedCharCount = e.removedCharCount;
			var addedCharCount = e.addedCharCount;
			if (this._ignoreUndo) {
				return;
			}
			if (this._undoStart !== undefined && 
				!((addedCharCount === 1 && removedCharCount === 0 && start === this._undoStart + this._undoText.length) ||
					(addedCharCount === 0 && removedCharCount === 1 && (((start + 1) === -this._undoStart) || (start === -this._undoStart)))))
			{
				this._commitUndo();
			}
			if (!this.compoundChange) {
				if (addedCharCount === 1 && removedCharCount === 0) {
					if (this._undoStart === undefined) {
						this._undoStart = start;
					}
					this._undoText = this._undoText + newText;
					return;
				} else if (addedCharCount === 0 && removedCharCount === 1) {
					var deleting = this._undoText.length > 0 && -this._undoStart === start;
					this._undoStart = -start;
					if (deleting) {
						this._undoText = this._undoText + this.editor.getText(start, start + removedCharCount);
					} else {
						this._undoText = this.editor.getText(start, start + removedCharCount) + this._undoText;
					}
					return;
				}
			}
			this.add(new Change(start, newText, this.editor.getText(start, start + removedCharCount)));
		}
	};
	return UndoStack;
}());