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
	'i18n!orion/editor/nls/messages', //$NON-NLS-0$
	"orion/editor/keyModes", //$NON-NLS-0$
	"orion/keyBinding", //$NON-NLS-0$
	"orion/util" //$NON-NLS-0$
], function(messages, mKeyMode, mKeyBinding, util) {

	function EmacsMode(textView) {
		mKeyMode.KeyMode.call(this, textView);
	}
	EmacsMode.prototype = new mKeyMode.KeyMode();
	EmacsMode.prototype.createKeyBindings = function () {
		var KeyStroke = mKeyBinding.KeyStroke;
		var KeySequence = mKeyBinding.KeySequence;
		//no duplicate keybindings
		var bindings = [];

		// Changing the Location of Point
		bindings.push({actionID: "emacs-beginning-of-line", keyBinding: new KeyStroke('a', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-end-of-line", keyBinding: new KeyStroke('e', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-forward-char", keyBinding: new KeyStroke('f', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-char", keyBinding: new KeyStroke('b', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-forward-word", keyBinding: new KeyStroke('f', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-word", keyBinding: new KeyStroke('b', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-next-line", keyBinding: new KeyStroke('n', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-previous-line", keyBinding: new KeyStroke('p', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		//TODO these 2 are not right
		bindings.push({actionID: "emacs-beginning-of-buffer", keyBinding: new KeyStroke(',', false, true, true)}); //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-end-of-buffer", keyBinding: new KeyStroke('.', false, true, true)}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		// Erasing Text
		bindings.push({actionID: "emacs-delete-backward-char", keyBinding: new KeyStroke(46, !util.isMac, false, false, util.isMac)}); //$NON-NLS-0$
		bindings.push({actionID: "emacs-delete-char", keyBinding: new KeyStroke('d', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-kill-line", keyBinding: new KeyStroke('k', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-kill-word", keyBinding: new KeyStroke('d', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-backward-kill-word", keyBinding: new KeyStroke(46, false, false, true)}); //$NON-NLS-0$

		// Undoing Changes
		bindings.push({actionID: "undo", keyBinding: new KeySequence([new KeyStroke('x', true), new KeyStroke('u')])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "redo", keyBinding: new KeySequence([new KeyStroke('x', true), new KeyStroke('r')])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		//Scrolling 
		bindings.push({actionID: "emacs-scroll-up", keyBinding: new KeyStroke('v', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-scroll-down", keyBinding: new KeyStroke('v', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$

		bindings.push({actionID: "emacs-set-mark-command", keyBinding: new KeyStroke(' ', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-reset-mark-command", keyBinding: new KeyStroke('g', !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-exchange-point-and-mark", keyBinding: new KeySequence([new KeyStroke('x', !util.isMac, false, false, util.isMac), new KeyStroke('x', !util.isMac, false, false, util.isMac)])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		for (var c=0; c<=9; c++) { //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "emacs-digit-argument-" + c, keyBinding: new KeyStroke(48 + c, !util.isMac, false, true, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		}
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, !util.isMac, false, false, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "emacs-negative-argument", keyBinding: new KeyStroke(189, !util.isMac, false, true, util.isMac)}); //$NON-NLS-1$ //$NON-NLS-0$
		
		//TODO should these keys be done here?
		bindings.push({actionID: "contentAssist", keyBinding: new KeyStroke(191, false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "find", keyBinding: new KeyStroke('r', false, false, true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "incrementalFind", keyBinding: new KeyStroke('s', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "incrementalFindReverse", keyBinding: new KeyStroke('r', true)}); //$NON-NLS-1$ //$NON-NLS-0$
		bindings.push({actionID: "save", keyBinding: new KeySequence([new KeyStroke('x', !util.isMac, false, false, util.isMac), new KeyStroke('s', !util.isMac, false, false, util.isMac)])}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		//Create actions
		this._createActions(this.getView());
		
		return bindings;
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
		}, {name: messages.lineStart});
		view.setAction("emacs-end-of-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineEnd"); //$NON-NLS-0$
		}, {name: messages.lineEnd});
		view.setAction("emacs-forward-char", function() { //$NON-NLS-0$
			return self._moveCursor("charNext"); //$NON-NLS-0$
		}, {name: messages.charNext});
		view.setAction("emacs-backward-char", function() { //$NON-NLS-0$
			return self._moveCursor("charPrevious"); //$NON-NLS-0$
		}, {name: messages.charPrevious});
		view.setAction("emacs-forward-word", function() { //$NON-NLS-0$
			return self._moveCursor("wordNext"); //$NON-NLS-0$
		}, {name: messages.wordNext});
		view.setAction("emacs-backward-word", function() { //$NON-NLS-0$
			return self._moveCursor("wordPrevious"); //$NON-NLS-0$
		}, {name: messages.wordPrevious});
		view.setAction("emacs-next-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineDown"); //$NON-NLS-0$
		}, {name: messages.lineDown});
		view.setAction("emacs-previous-line", function() { //$NON-NLS-0$
			return self._moveCursor("lineUp"); //$NON-NLS-0$
		}, {name: messages.lineUp});
		view.setAction("emacs-beginning-of-buffer", function() { //$NON-NLS-0$
			return self._moveCursor("textStart"); //$NON-NLS-0$
		}, {name: messages.textStart});
		view.setAction("emacs-end-of-buffer", function() { //$NON-NLS-0$
			return self._moveCursor("textEnd"); //$NON-NLS-0$
		}, {name: messages.textEnd});
		
		view.setAction("emacs-delete-backward-char", function() { //$NON-NLS-0$
			return view.invokeAction("deletePrevious"); //$NON-NLS-0$
		}, {name: messages.deletePrevious});
		view.setAction("emacs-delete-char", function() { //$NON-NLS-0$
			return view.invokeAction("deletePrevious"); //$NON-NLS-0$
		}, {name: messages.deletePrevious});
		view.setAction("emacs-kill-line", function() { //$NON-NLS-0$
			return view.invokeAction("deleteLineEnd"); //$NON-NLS-0$
		}, {name: messages.deleteLineEnd});
		view.setAction("emacs-kill-word", function() { //$NON-NLS-0$
			return view.invokeAction("deleteWordNext"); //$NON-NLS-0$
		}, {name: messages.deleteWordNext});
		view.setAction("emacs-backward-kill-word", function() { //$NON-NLS-0$
			return view.invokeAction("deleteWordPrevious"); //$NON-NLS-0$
		}, {name: messages.deleteWordPrevious});
		
		view.setAction("emacs-scroll-up", function() { //$NON-NLS-0$
			return self._moveCursor("pageDown"); //$NON-NLS-0$
		}, {name: messages.pageDown});
		view.setAction("emacs-scroll-down", function() { //$NON-NLS-0$
			return self._moveCursor("pageUp"); //$NON-NLS-0$
		}, {name: messages.pageUp});

		view.setAction("emacs-set-mark-command", function() { //$NON-NLS-0$
			var caretOffset = view.getCaretOffset();
			view.setCaretOffset(caretOffset);
			self._marker = caretOffset;
			return true;
		}, {name: messages.setMarkCommand});
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
		}, {name: messages.exchangeMarkPoint});
		view.setAction("emacs-reset-mark-command", function() { //$NON-NLS-0$
			var caretOffset = view.getCaretOffset();
			view.setCaretOffset(caretOffset);
			self._marker = undefined;
			return true;
		}, {name: messages.clearMark});

		view.setAction("emacs-digit-argument-0", function() { //$NON-NLS-0$
			return self._digitArgument(0);
		}, {name: util.formatMessage(messages.digitArgument, "0")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-1", function() { //$NON-NLS-0$
			return self._digitArgument(1);
		}, {name: util.formatMessage(messages.digitArgument, "1")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-2", function() { //$NON-NLS-0$
			return self._digitArgument(2);
		}, {name: util.formatMessage(messages.digitArgument, "2")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-3", function() { //$NON-NLS-0$
			return self._digitArgument(3);
		}, {name: util.formatMessage(messages.digitArgument, "3")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-4", function() { //$NON-NLS-0$
			return self._digitArgument(4);
		}, {name: util.formatMessage(messages.digitArgument, "4")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-5", function() { //$NON-NLS-0$
			return self._digitArgument(5);
		}, {name: util.formatMessage(messages.digitArgument, "5")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-6", function() { //$NON-NLS-0$
			return self._digitArgument(6);
		}, {name: util.formatMessage(messages.digitArgument, "6")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-7", function() { //$NON-NLS-0$
			return self._digitArgument(7);
		}, {name: util.formatMessage(messages.digitArgument, "7")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-8", function() { //$NON-NLS-0$
			return self._digitArgument(8);
		}, {name: util.formatMessage(messages.digitArgument, "8")}); //$NON-NLS-0$
		view.setAction("emacs-digit-argument-9", function() { //$NON-NLS-0$
			return self._digitArgument(9);
		}, {name: util.formatMessage(messages.digitArgument, "9")}); //$NON-NLS-0$
		view.setAction("emacs-negative-argument", function() { //$NON-NLS-0$
			return self._negativeArgument();
		}, {name: messages.negativeArgument});
	};

	return {
		EmacsMode: EmacsMode
	};
});