/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global define window */

define("orion/editor/emacs", [ //$NON-NLS-0$
	"orion/editor/keyModes", //$NON-NLS-0$
	"orion/keyBinding", //$NON-NLS-0$
	"orion/util" //$NON-NLS-0$
], function(mKeyMode, mKeyBinding, util) {

	function EmacsMode() {
		mKeyMode.KeyMode.call(this);
	}
	EmacsMode.prototype = new mKeyMode.KeyMode();
	EmacsMode.prototype.createKeyBindings = function () {
		var KeyStroke = mKeyBinding.KeyStroke;
		var KeySequence = mKeyBinding.KeySequence;
		//no duplicate keybindings
		var bindings = [];

		// Changing the Location of Point
		bindings.push({actionID: "emacs-beginning-of-line", keyBinding: new KeyStroke('a', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-end-of-line", keyBinding: new KeyStroke('e', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-forward-char", keyBinding: new KeyStroke('f', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-char", keyBinding: new KeyStroke('b', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-forward-word", keyBinding: new KeyStroke('f', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-word", keyBinding: new KeyStroke('b', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-next-line", keyBinding: new KeyStroke('n', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-previous-line", keyBinding: new KeyStroke('p', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		//TODO these 2 are not right
		bindings.push({actionID: "emacs-beginning-of-buffer", keyBinding: new KeyStroke(',', false, true, true)}); //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-end-of-buffer", keyBinding: new KeyStroke('.', false, true, true)}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		// Erasing Text
		bindings.push({actionID: "emacs-delete-backward-char", keyBinding: new KeyStroke(46, true)}); //$NON-NLS-0$
		bindings.push({actionID: "emacs-delete-char", keyBinding: new KeyStroke('d', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-kill-line", keyBinding: new KeyStroke('k', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-kill-word", keyBinding: new KeyStroke('d', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-kill-word", keyBinding: new KeyStroke(46, false, false, true)}); //$NON-NLS-0$

		// Undoing Changes
		bindings.push({actionID: "undo", keyBinding: new KeySequence([new KeyStroke('x', true), new KeyStroke('u')])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "redo", keyBinding: new KeySequence([new KeyStroke('x', true), new KeyStroke('r')])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		//Scrolling 
		bindings.push({actionID: "emacs-scroll-up", keyBinding: new KeyStroke('v', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-scroll-down", keyBinding: new KeyStroke('v', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$

		bindings.push({actionID: "emacs-set-mark-command", keyBinding: new KeyStroke(' ', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-reset-mark-command", keyBinding: new KeyStroke('g', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-exchange-point-and-mark", keyBinding: new KeySequence([new KeyStroke('x', true), new KeyStroke('x', true)])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		for (var c=0; c<=9; c++) { //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, true)}); //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, true, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		}
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, true, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		
		//TODO should reassigning contentAssist be here? Note same as setMarker
		bindings.push({actionID: "contentAssist", keyBinding: new KeyStroke(' ', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$

		return bindings;
	};
	
	EmacsMode.prototype.setView = function (view) {
		mKeyMode.KeyMode.prototype.setView.call(this, view);
		if (view) {
			this._createActions(view);
		}
	};

	EmacsMode.prototype._moveCursor = function (actionID) {
		var data = {
			count: (this._argument || 1) * (this._sign || 1)
		};
		if (this._marker) {
			data.select = true;
		}
		this._argument = 0;
		this._sign = 1;
		var view = this.getView();
		return view.invokeAction(actionID, false, data);
	};

	EmacsMode.prototype._digitArgument = function (n) {
		this._argument = (this._argument || 0) * 10 + n;
		return true;
	};

	EmacsMode.prototype._negativeArgument = function () {
		this._sign = (this._sign || 1) * -1;
		return true;
	};

	EmacsMode.prototype._createActions = function (view) {
		var self = this;
		
		// Changing the Location of Point
		view.setAction("emacs-beginning-of-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineStart"); //$NON-NLS-0$
		});
		view.setAction("emacs-end-of-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineEnd"); //$NON-NLS-0$
		});
		view.setAction("emacs-forward-char", function() { //$NON-NLS-0$
			return self._moveCursor("charNext"); //$NON-NLS-0$
		});
		view.setAction("emacs-backward-char", function() { //$NON-NLS-0$
			return self._moveCursor("charPrevious"); //$NON-NLS-0$
		});
		view.setAction("emacs-forward-word", function() { //$NON-NLS-0$
			return self._moveCursor("wordNext"); //$NON-NLS-0$
		});
		view.setAction("emacs-backward-word", function() { //$NON-NLS-0$
			return self._moveCursor("wordPrevious"); //$NON-NLS-0$
		});
		view.setAction("emacs-next-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineDown"); //$NON-NLS-0$
		});
		view.setAction("emacs-previous-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineUp"); //$NON-NLS-0$
		});
		view.setAction("emacs-beginning-of-buffer", function() { //$NON-NLS-0$
			return self._moveCursor("textStart"); //$NON-NLS-0$
		});
		view.setAction("emacs-end-of-buffer", function() { //$NON-NLS-0$
			return self._moveCursor("textEnd"); //$NON-NLS-0$
		});
		
		view.setAction("emacs-delete-backward-char", function() { //$NON-NLS-0$
			return view.invokeAction("deletePrevious"); //$NON-NLS-0$
		});
		view.setAction("emacs-delete-char", function() { //$NON-NLS-0$
			return view.invokeAction("deletePrevious"); //$NON-NLS-0$
		});
		view.setAction("emacs-kill-line", function() { //$NON-NLS-0$
			return view.invokeAction("deleteLineEnd"); //$NON-NLS-0$
		});
		view.setAction("emacs-kill-word", function() { //$NON-NLS-0$
			return view.invokeAction("deleteWordNext"); //$NON-NLS-0$
		});
		view.setAction("emacs-backward-kill-word", function() { //$NON-NLS-0$
			return view.invokeAction("deleteWordPrevious"); //$NON-NLS-0$
		});
		
		view.setAction("emacs-scroll-up", function() { //$NON-NLS-0$
			return self._moveCursor("pageDown"); //$NON-NLS-0$
		});
		view.setAction("emacs-scroll-down", function() { //$NON-NLS-0$
			return self._moveCursor("pageUp"); //$NON-NLS-0$
		});

		view.setAction("emacs-set-mark-command", function() { //$NON-NLS-0$
			var caretOffset = view.getCaretOffset();
			view.setCaretOffset(caretOffset);
			self._marker = caretOffset;
			return true;
		});
		view.setAction("emacs-exchange-point-and-mark", function() { //$NON-NLS-0$
			if (self._marker !== undefined) {
				var caretOffset = view.getCaretOffset();
				var selection = view.getSelection();
				if (selection.end === caretOffset) {
					var temp = selection.start;
					selection.start = selection.end;
					selection.end = temp;
				}
				self._marker = caretOffset;
				view.setSelection(selection.start, selection.end);
			}
			return true;
		});
		view.setAction("emacs-reset-mark-command", function() { //$NON-NLS-0$
			var caretOffset = view.getCaretOffset();
			view.setCaretOffset(caretOffset);
			self._marker = undefined;
			return true;
		});

		view.setAction("emacs-digit-argument-0", function() { //$NON-NLS-0$
			return self._digitArgument(0);
		});
		view.setAction("emacs-digit-argument-1", function() { //$NON-NLS-0$
			return self._digitArgument(1);
		});
		view.setAction("emacs-digit-argument-2", function() { //$NON-NLS-0$
			return self._digitArgument(2);
		});
		view.setAction("emacs-digit-argument-3", function() { //$NON-NLS-0$
			return self._digitArgument(3);
		});
		view.setAction("emacs-digit-argument-4", function() { //$NON-NLS-0$
			return self._digitArgument(4);
		});
		view.setAction("emacs-digit-argument-5", function() { //$NON-NLS-0$
			return self._digitArgument(5);
		});
		view.setAction("emacs-digit-argument-6", function() { //$NON-NLS-0$
			return self._digitArgument(6);
		});
		view.setAction("emacs-digit-argument-7", function() { //$NON-NLS-0$
			return self._digitArgument(7);
		});
		view.setAction("emacs-digit-argument-8", function() { //$NON-NLS-0$
			return self._digitArgument(8);
		});
		view.setAction("emacs-digit-argument-9", function() { //$NON-NLS-0$
			return self._digitArgument(9);
		});
		view.setAction("emacs-negative-argument", function() { //$NON-NLS-0$
			return self._negativeArgument();
		});
	};

	return {
		EmacsMode: EmacsMode
	};
});