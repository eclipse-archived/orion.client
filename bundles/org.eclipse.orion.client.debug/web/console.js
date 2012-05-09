/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 ******************************************************************************/

/*global define*/
/*jslint browser:true*/

define(['dojo', 'orion/textview/textView'], function(dojo, mTextView) {

	var orion = {};
	orion.console = {};

	/** 
	 * Constructs a new ConsoleInput object.
	 * 
	 * @class A ConsoleInput represents a command that is being entered in a Console.
	 * @name orion.console.ConsoleInput
	 */
	orion.console.ConsoleInput = (function() {
		function ConsoleInput(console, textView) {
			this._init(console, textView);
		}
		ConsoleInput.prototype = /** @lends orion.console.ConsoleInput.prototype */{
			/** @private */
			_init: function(console, textView) {
				if (!console) { throw "no console"; }
				if (!textView) { throw "no textView"; }
				this._console = console;
				this._textView = textView;
				this._enabled = true;
				var model = textView.getModel();
				this._startIndex = model.getCharCount();
				model.setText("> ", this._startIndex);
				textView.setCaretOffset(this._startIndex + 2, false);
			},
			getStartIndex: function() {
				return this._startIndex;
			},
			getText: function() {
				return this._textView.getModel().getText(this._startIndex + 2);
			},
			handleVerifyEvent: function(verifyEvent) {
				if (verifyEvent.start < this._startIndex + 2) {
					return false;
				}
				if (!this._enabled) {
					verifyEvent.text = null;
				}
				return true;
			},
			setEnabled: function(value) {
				this._enabled = value;
				this._textView.redrawRange(this._startIndex);
			},
			setStartIndex: function(value) {
				this._textView.setCaretOffset(this._textView.getCaretOffset() + (value - this._startIndex));
				this._startIndex = value;
			}
		};
		return ConsoleInput;
	}());

	/**
	 * Constructs a new console.
	 * 
	 * @param options the view options.
	 * @param parent the parent element for the console, it can be either a DOM element or an ID for a DOM element.
	 * 
	 * @class A Console is a user interface that accepts input command lines and displays output.
	 * @name orion.console.Console
	 */
	orion.console.Console = (function() {
		function Console(parent) {
			this._init(parent);
		}
		Console.prototype = /** @lends orion.console.Console.prototype */{
			/** @private */
			_init: function(parent) {
				if (!parent) { throw "no parent"; }

				var textView = new mTextView.TextView({parent: parent});
				this._textView = textView;
				this._currentInput = new orion.console.ConsoleInput(this, textView);

				var self = this;
				textView.addEventListener("Verify", function(verifyEvent) {
					if (!self._currentInput.handleVerifyEvent(verifyEvent)) {
						verifyEvent.text = null;
					}
				});
				
				this._inputListeners = [];
				textView.addEventListener("Modify", function(modelChangedEvent) {
					var text = self._currentInput.getText();
					var index = text.indexOf("\r\n");
					if (index !== -1) {
						var value = text.substring(0, index);
						for (var i = 0; i < self._inputListeners.length; i++) {
							var current = self._inputListeners[i];
							current(value);
						}
						self._currentInput = new orion.console.ConsoleInput(self, textView);
					}
				});

				this._inputStyleListeners = [];
//				textView.addEventListener("LineStyle", function(lineStyleEvent) {
//					self._currentInput.handleLineStyleEvent(lineStyleEvent);
//					if (lineStyleEvent.lineStart !== self._startIndex) {
//						return;
//					}
//					if (!self._enabled) {
//						lineStyleEvent.style = {style: {color: "#FF0000"}};
//					} else {
//						lineStyleEvent.style = {style: {color: "#0000FF"}};
//					}
//				});
			},
			
			appendOutput: function(text) {
				var model = this._textView.getModel();
				var startIndex = this._currentInput.getStartIndex();
				var inputText = model.getText(startIndex);
				var length = text.length;
				model.setText(text + "\r\n" + inputText, startIndex);
				this._currentInput.setStartIndex(this._currentInput.getStartIndex() + 2 + length);
			},
			addInputListener: function(listener) {
				this._inputListeners.push(listener);
			},
			addInputStyleListener: function(listener) {
				this._inputStyleListeners.push(listener);
			},
			removeInputListener: function(listener) {
				for (var i = 0; i < this._inputListeners.length; i++) {
					if (this._inputListeners[i] === listener) {
						this._inputListeners.splice(i, 1);
						return;
					}
				}
			},
			removeInputStyleListener: function(listener) {
				for (var i = 0; i < this._inputStyleListeners.length; i++) {
					if (this._inputStyleListeners[i] === listener) {
						this._inputStyleListeners.splice(i, 1);
						return;
					}
				}
			},
			setAcceptInput: function(value) {
				this._currentInput.setEnabled(value);
			}
		};
		return Console;
	}());
	
	return orion.console;
});
