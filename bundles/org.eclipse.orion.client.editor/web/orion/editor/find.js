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
/*global define prompt */

define("orion/editor/find", [ //$NON-NLS-0$
	'i18n!orion/editor/nls/messages', //$NON-NLS-0$
	'orion/keyBinding', //$NON-NLS-0$
	'orion/editor/keyModes', //$NON-NLS-0$
	'orion/editor/regex', //$NON-NLS-0$
	'orion/objects', //$NON-NLS-0$
	'orion/util' //$NON-NLS-0$
], function(messages, mKeyBinding, mKeyModes, mRegex, objects, util) {

	var exports = {};
	
	function IncrementalFind(editor) {
		mKeyModes.KeyMode.call(this);
		this.editor = editor;
		this._active = false;
		this._success = true;
		this._ignoreSelection = false;
		this._prefix = "";
		
		var textView = editor.getTextView();
		textView.setAction("incrementalFindCancel", function() { //$NON-NLS-0$
			this.setActive(false);
			return true;
		}.bind(this));
		textView.setAction("incrementalFindBackspace", function() { //$NON-NLS-0$
			return this._backspace();
		}.bind(this));
		
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
					self.find(self._forward, true);
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
	IncrementalFind.prototype = new mKeyModes.KeyMode();
	objects.mixin(IncrementalFind.prototype, {
		createKeyBindings: function() {
			var KeyBinding = mKeyBinding.KeyBinding;
			var bindings = [];
			bindings.push({actionID: "incrementalFindBackspace", keyBinding: new KeyBinding(8)}); //$NON-NLS-0$
			bindings.push({actionID: "incrementalFindCancel", keyBinding: new KeyBinding(13)}); //$NON-NLS-0$
			bindings.push({actionID: "incrementalFindCancel", keyBinding: new KeyBinding(27)}); //$NON-NLS-0$
			bindings.push({actionID: "incrementalFindReverse", keyBinding: new KeyBinding(38)}); //$NON-NLS-0$
			bindings.push({actionID: "incrementalFind", keyBinding: new KeyBinding(40)}); //$NON-NLS-0$
			bindings.push({actionID: "incrementalFindReverse", keyBinding: new KeyBinding('k', true, true)}); //$NON-NLS-1$ //$NON-NLS-0$
			bindings.push({actionID: "incrementalFind", keyBinding: new KeyBinding('k', true)}); //$NON-NLS-1$ //$NON-NLS-0$
			return bindings;
		},
		find: function(forward, change) {
			this._forward = forward;
			if (!this.isActive()) {
				this.setActive(true);
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
					start = change ? this._start : editor.getCaretOffset() + 1;
				} else {
					start = 0;
				}
			} else {
				if (this._success) {
					start = change ? this._start : editor.getCaretOffset();
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
				if (!change) {
					this._start = start;
				}
				this._success = true;
				this._ignoreSelection = true;
				editor.moveSelection(forward ? result.start : result.end, forward ? result.end : result.start);
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
		isStatusActive: function() {
			return this.isActive();
		},
		setActive: function(active) {
			if (this._active === active) {
				return;
			}
			this._active = active;
			this._prefix = "";
			this._success = true;
			var editor = this.editor;
			var textView = editor.getTextView();
			this._start = this.editor.getCaretOffset();
			this.editor.setCaretOffset(this._start);
			if (this._active) {
				textView.addEventListener("Verify", this._listener.onVerify); //$NON-NLS-0$
				textView.addEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
				textView.addKeyMode(this);
			} else {
				textView.removeEventListener("Verify", this._listener.onVerify); //$NON-NLS-0$
				textView.removeEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
				textView.removeKeyMode(this);
			}
			this._status();
		},
		_backspace: function() {
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
			return this.find(this._forward, true);
		},
		_status: function() {
			if (!this.isActive()) {
				this.editor.reportStatus("");
				return;
			}
			var msg;
			if (this._forward) {
				msg = this._success ? messages.incrementalFindStr : messages.incrementalFindStrNotFound;
			} else {
				msg = this._success ? messages.incrementalFindReverseStr : messages.incrementalFindReverseStrNotFound;
			}
			msg = util.formatMessage(msg, this._prefix);
			this.editor.reportStatus(msg, this._success ? "" : "error"); //$NON-NLS-0$
		}
	});
	exports.IncrementalFind = IncrementalFind;
	
	return exports;
});
