/*global define window log */

define("orion/editor/vi", [ 
		"orion/editor/keyModes", //$NON-NLS-0$
		"orion/keyBinding"  //$NON-NLS-0$
], function (mKeyMode, mKeyBinding) {
	
	//Status Line Mode
	function StatusLineMode(viMode){
		mKeyMode.KeyMode.call(this);
		this.viMode = viMode;
	}
	StatusLineMode.prototype = new mKeyMode.KeyMode(); 
		
	function mixin(object, proto) {
		for (var p in proto) {
			if (proto.hasOwnProperty(p)) {
				object[p] = proto[p];
			}
		}
	}
	
	mixin(StatusLineMode.prototype, /** @lends orion.editor.viMode.StatusLineMode.prototype */ {
		createKeyBindings: function() {
			var KeyBinding = mKeyBinding.KeyBinding;
			var bindings = [];
			bindings.push({actionID: "cancel",		keyBinding: new KeyBinding(27), predefined: true}); //$NON-NLS-0$
			return bindings;
		},
		_createActions: function() {
			var view = this.getView();
			if (view) {
				var self = this;
				view.setAction("cancel", function() { //$NON-NLS-0$
					view.removeKeyMode(self);
					view.addKeyMode(self.viMode);
					return true;
				});
			}
		},
		match: function(e) {
			var result = mKeyMode.KeyMode.prototype.match.call(this, e);
			if (!result) {
				result = this.getView().getKeyModes()[0].match(e);
			}
			return result;
		},
		setView: function(view) {
			mKeyMode.KeyMode.prototype.setView.call(this, view);
			this._createActions();
		},
		storeNumber: function(n) {
			this.number = n;
		}
	});
	
	
	//Change Mode
	function ChangeMode(viMode){
		mKeyMode.KeyMode.call(this);
		this.viMode = viMode;
	}
	ChangeMode.prototype = new mKeyMode.KeyMode(); 

	mixin(ChangeMode.prototype, /** @lends orion.editor.viMode.ChangeMode.prototype */ {
		createKeyBindings: function() {
			var KeyBinding = mKeyBinding.KeyBinding;
			var bindings = [];
			bindings.push({actionID: "cancel",		keyBinding: new KeyBinding(27), predefined: true}); //$NON-NLS-0$
			return bindings;
		},
		_createActions: function() {
			var view = this.getView();
			if (view) {
				var self = this;
				view.setAction("cancel", function() { //$NON-NLS-0$
					view.removeKeyMode(self);
					view.addKeyMode(self.viMode);
					return true;
				});
			}
		},
		match: function(e) {
			var result = mKeyMode.KeyMode.prototype.match.call(this, e);
			if (!result) {
				result = this.getView().getKeyModes()[0].match(e);
			}
			return result;
		},
		setView: function(view) {
			mKeyMode.KeyMode.prototype.setView.call(this, view);
			this._createActions();
		},
		storeNumber: function(n ) {
		}
	});
	
	
	//Insert Mode
	function InsertMode(viMode){
		mKeyMode.KeyMode.call(this);
		this.viMode = viMode;
	}
	InsertMode.prototype = new mKeyMode.KeyMode(); 

	mixin(InsertMode.prototype, /** @lends orion.editor.viMode.InsertMode.prototype */ {
		createKeyBindings: function() {
			var KeyBinding = mKeyBinding.KeyBinding;
			var bindings = [];
			bindings.push({actionID: "cancel",		keyBinding: new KeyBinding(27), predefined: true}); //$NON-NLS-0$
			return bindings;
		},
		_createActions: function() {
			var view = this.getView();
			if (view) {
				var self = this;
				view.setAction("cancel", function() { //$NON-NLS-0$
					view.removeKeyMode(self);
					view.addKeyMode(self.viMode);
					return true;
				});
			}
		},
		match: function(e) {
			var result = mKeyMode.KeyMode.prototype.match.call(this, e);
			if (!result) {
				result = this.getView().getKeyModes()[0].match(e);
			}
			return result;
		},
		setView: function(view) {
			mKeyMode.KeyMode.prototype.setView.call(this, view);
			this._createActions();
		},
		storeNumber: function(n ) {
		}
	});
	
	function VIMode(statusReporter){
		mKeyMode.KeyMode.call(this);
		this.number = "";
		this.insertMode = new InsertMode(this);
		this.statusReporter = statusReporter;
	}
	VIMode.prototype = new mKeyMode.KeyMode(); 
	mixin(VIMode.prototype, /** @lends orion.editor.viMode.VIMode.prototype */ {
		createKeyBindings: function() {
			var KeyBinding = mKeyBinding.KeyBinding;
			var bindings = [];
			//Movement
			//left
			bindings.push({actionID: "vi-Left",	keyBinding: new KeyBinding("h", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Left",	keyBinding: new KeyBinding("h", true, false, false, false)}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Left",	keyBinding: new KeyBinding(8)}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Left",	keyBinding: new KeyBinding(37)}); //$NON-NLS-0$
			
			//down
			bindings.push({actionID: "vi-Down",	keyBinding: new KeyBinding("j", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Down",	keyBinding: new KeyBinding(40)}); //$NON-NLS-0$
			
			//up
			bindings.push({actionID: "vi-Up",	keyBinding: new KeyBinding("k", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Up",	keyBinding: new KeyBinding(38)}); //$NON-NLS-0$
			
			//right
			bindings.push({actionID: "vi-Right",	keyBinding: new KeyBinding("l", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Right",	keyBinding: new KeyBinding(39)}); //$NON-NLS-0$
			bindings.push({actionID: "vi-Right",	keyBinding: new KeyBinding(32)}); //$NON-NLS-0$
			
			//text movement
			bindings.push({actionID: "vi-w",	keyBinding: new KeyBinding("w", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-b",	keyBinding: new KeyBinding("b", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//TODO: add
			bindings.push({actionID: "vi-W",	keyBinding: new KeyBinding("W", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//TODO: add
			bindings.push({actionID: "vi-B",	keyBinding: new KeyBinding("B", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//TODO: 
			bindings.push({actionID: "vi-e",	keyBinding: new KeyBinding("e", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-E",	keyBinding: new KeyBinding("E", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-)",	keyBinding: new KeyBinding(")", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-(",	keyBinding: new KeyBinding("(", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-}",	keyBinding: new KeyBinding("}", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-{",	keyBinding: new KeyBinding("{", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-]]",	keyBinding: new KeyBinding("]]", false, false, false, false, "keypress")}); //$NON-NLS-0$
			//bindings.push({actionID: "vi-[[",	keyBinding: new KeyBinding("[[", false, false, false, false, "keypress")}); //$NON-NLS-0$
		
			//Lines
			bindings.push({actionID: "vi-$",	keyBinding: new KeyBinding("$", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			bindings.push({actionID: "vi-^_",	keyBinding: new KeyBinding("^", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-^_",	keyBinding: new KeyBinding("_", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			bindings.push({actionID: "vi-+",	keyBinding: new KeyBinding("+", false, false, false, false, "keypress")}); 
			bindings.push({actionID: "vi-+",	keyBinding:  new KeyBinding(13)});
			bindings.push({actionID: "vi--",	keyBinding:  new KeyBinding("-", false, false, false, false, "keypress")});
			bindings.push({actionID: "vi-|",	keyBinding:  new KeyBinding("|", false, false, false, false, "keypress")});
			
			bindings.push({actionID: "vi-H",	keyBinding: new KeyBinding("H", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-M",	keyBinding: new KeyBinding("M", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-L",	keyBinding: new KeyBinding("L", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			//Screens
			
			//Searches
			bindings.push({actionID: "vi-/",	keyBinding: new KeyBinding("/", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-?",	keyBinding: new KeyBinding("?", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-n",	keyBinding: new KeyBinding("n", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-N",	keyBinding: new KeyBinding("N", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-f",	keyBinding: new KeyBinding("f", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-F",	keyBinding: new KeyBinding("F", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-,",	keyBinding: new KeyBinding(",", false, false, false, false, "keypress")}); //$NON-NLS-0$
			bindings.push({actionID: "vi-;",	keyBinding: new KeyBinding(";", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			//Line numbering
			bindings.push({actionID: "vi-goToLine",	keyBinding: new KeyBinding("G", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			//Status Line mode
			bindings.push({actionID: "statusLineMode",	keyBinding: new KeyBinding(":", false, false, false, false, "keypress")}); //$NON-NLS-0$
			
			//Numbers
			for (var i=0; i<9; i++) {
				bindings.push({actionID: "storeNumber" + i,	keyBinding: new KeyBinding(i+"", false, false, false, false, "keypress"), predefined: true}); //$NON-NLS-0$
			}
			
			//Insert
			bindings.push({actionID: "vi-i",	keyBinding: new KeyBinding("i", false, false, false, false, "keypress"), predefined: true}); //$NON-NLS-0$
			bindings.push({actionID: "vi-I",	keyBinding: new KeyBinding("I", false, false, false, false, "keypress"), predefined: true}); //$NON-NLS-0$
	
			//Change
			return bindings;
		},
		_findNextChar: function (forward) {
			var num = this.number >> 0 || 1;
			if (this._charTempOptions) {
				var view = this.getView();
				var tempTempOptions = {};
				tempTempOptions.count = num;
				tempTempOptions.hideAfterFind = this._charTempOptions.hideAfterFind;
				tempTempOptions.incremental = this._charTempOptions.incremental;
				tempTempOptions.reverse = this._charTempOptions.reverse;
				tempTempOptions.wrap = false;
				var model = view.getModel();
				if (forward) {
					tempTempOptions.start  = view.getCaretOffset() + 1;
					tempTempOptions.end= model.getLineEnd(model.getLineAtOffset(tempTempOptions.start));
					tempTempOptions.reverse = false;
					view.invokeAction("findNext", false, tempTempOptions); //$NON-NLS-0$
				} else {
					tempTempOptions.start = view.getCaretOffset() - 1;
					tempTempOptions.end  = model.getLineStart(model.getLineAtOffset(tempTempOptions.start));
					tempTempOptions.reverse = true;
					view.invokeAction("findPrevious", false, tempTempOptions); //$NON-NLS-0$
				}
			}
			this.number = "";
			return true;
		},
		_findChar: function (start, end, reverse) {
			var num = this.number >> 0 || 1;
			this._charTempOptions = {};
			this._charTempOptions.start  = start;
			this._charTempOptions.end= end;
			this._charTempOptions.count = num;
			this._charTempOptions.hideAfterFind = true;
			this._charTempOptions.incremental = false;
			this._charTempOptions.reverse = reverse;
			this.getView().invokeAction("find", false, this._charTempOptions); //$NON-NLS-0$
			this.number = "";
			return true;
		},
		_createActions: function() {
			var view = this.getView();
			
			//Utility
			function firstNonBlankChar(lineIndex) {
				var model = view.getModel();
				var lineText = model.getLine(lineIndex);
				var offsetInLine = 0;
				var c = lineText.charCodeAt(offsetInLine);
				while (c === 32 || c === 9) {
					offsetInLine++;
					c = lineText.charCodeAt(offsetInLine);
				}
				return offsetInLine;
			}
			//
			
			if (view) {
				var self = this;
				//Movement
				view.setAction("vi-Left", function() { //$NON-NLS-0$
					var result = view.invokeAction("charPrevious", true, {count:self.number >> 0, unit: "character"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-Right", function() { //$NON-NLS-0$
					var result = view.invokeAction("charNext", true, {count:self.number >> 0, unit: "character"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-Up", function() { //$NON-NLS-0$
					var result = view.invokeAction("lineUp", true, {count:self.number >> 0}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-Down", function() { //$NON-NLS-0$
					var result = view.invokeAction("lineDown", true, {count:self.number >> 0}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				//text movement
				view.setAction("vi-w", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordNext", true, {count:self.number >> 0, unit: "word"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-b", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordPrevious", true, {count:self.number >> 0, unit: "word"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-W", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordNext", true, {count:self.number >> 0, unit: "wordWS"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-B", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordPrevious", true, {count:self.number >> 0, unit: "wordWS"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-e", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordNext", true, {count:self.number >> 0, unit: "wordend"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-E", function() { //$NON-NLS-0$
					var result = view.invokeAction("wordNext", true, {count:self.number >> 0, unit: "wordendWS"}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				//Lines
				view.setAction("vi-0", function() { //$NON-NLS-0$
					var result = view.invokeAction("lineStart", true); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-$", function() { //$NON-NLS-0$
					var result = view.invokeAction("lineEnd", true); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return result;
				});
				
				view.setAction("vi-^_", function() { //$NON-NLS-0$
					var model = view.getModel();
					var offset = view.getCaretOffset();
					var lineIndex = model.getLineAtOffset(offset);
					view.setCaretOffset(model.getLineStart(lineIndex) + firstNonBlankChar(lineIndex));
					self.number = "";
					return true;
				});
				
				view.setAction("vi-+", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					var model = view.getModel();
					var offset = view.getCaretOffset();
					var lastLineCount = model.getLineCount() - 1;
					var lineIndex = Math.min (model.getLineAtOffset(offset) + 1 + num, lastLineCount);
					view.setCaretOffset(model.getLineStart(lineIndex) + firstNonBlankChar(lineIndex));
					self.number = "";
					return true;
				});
				
				view.setAction("vi--", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					var model = view.getModel();
					var offset = view.getCaretOffset();
					var lineIndex = Math.max(model.getLineAtOffset(offset) - 1 - num, 0);
					view.setCaretOffset(model.getLineStart(lineIndex) + firstNonBlankChar(lineIndex));
					self.number = "";
					return true;
				});
				
				view.setAction("vi-|", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					var model = view.getModel();
					var offset = view.getCaretOffset();
					var lineIndex = model.getLineAtOffset(offset);
					view.setCaretOffset(Math.min(model.getLineStart(lineIndex) + num - 1, model.getLineEnd(lineIndex)));
					self.number = "";
					return true;
				});
				
				view.setAction("vi-H", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					var topIndex = view.getModel().getLineStart(view.getTopIndex(true) + num);
					view.setCaretOffset(topIndex);
					self.number = "";
					return true;
				});
				
				view.setAction("vi-M", function() { //$NON-NLS-0$
					var middleIndex = Math.ceil((view.getBottomIndex(true) - view.getTopIndex(true))/2);
					view.setCaretOffset(view.getModel().getLineStart(middleIndex));
					self.number = "";
					return true;
				});
				
				view.setAction("vi-L", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					view.setCaretOffset(view.getModel().getLineStart(view.getBottomIndex(true) - num));
					self.number = "";
					return true;
				});
				
				//Searches
				view.setAction("vi-/", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					view.invokeAction("find", false, {hideAfterFind:true, incremental:false, reverse:false}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return true;
				});
				
				view.setAction("vi-?", function() { //$NON-NLS-0$
					var num = 0;
					if (self.number !== "") {
						num = self.number >> 0;
					}
					view.invokeAction("find", false, {hideAfterFind:true, incremental:false, reverse:true}); //$NON-NLS-1$ //$NON-NLS-0$
					self.number = "";
					return true;
				});
				
				view.setAction("vi-n", function() { //$NON-NLS-0$
					var num = self.number >> 0 || 1;
					view.invokeAction("findNext", false, {count:num}); //$NON-NLS-0$
					self.number = "";
					return true;
				});
				
				view.setAction("vi-N", function() { //$NON-NLS-0$
					var num = self.number >> 0 || 1;
					view.invokeAction("findPrevious", false, {count:num}); //$NON-NLS-0$
					self.number = "";
					return true;
				});
				
				view.setAction("vi-f", function() { //$NON-NLS-0$
					var model = view.getModel();
					var start = view.getCaretOffset();
					return self._findChar(start, model.getLineEnd(model.getLineAtOffset(start)), false);
				});
				
				view.setAction("vi-F", function() { //$NON-NLS-0$
					var model = view.getModel();
					var end = view.getCaretOffset();
					return self._findChar( model.getLineStart(model.getLineAtOffset(end)), end, true);
				});
				
				
				view.setAction("vi-,", function() { //$NON-NLS-0$
					return self._findNextChar(self._charTempOptions.reverse);
				});
				
				view.setAction("vi-;", function() { //$NON-NLS-0$
					return self._findNextChar(!self._charTempOptions.reverse);
				});
				
				//Line numbering
				view.setAction("vi-goToLine", function() { //$NON-NLS-0$
					if (self.statusReporter) {
						self.statusReporter("Go to Line!");
					}
					if (self.number === "") {
						var model = view.getModel();
						if (model.getBaseModel) {
							model = model.getBaseModel();
						}
						self.number = model.getLineCount();
					}
					var result = view.invokeAction("gotoLine", false, {line:self.number >> 0}); //$NON-NLS-1$ //$NON-NLS-0$
					//TODO: this works if gotoLine is registered (not part of textview) - need to handle fail case
					self.number = "";
					return result;
				});
				
				//Insert
				view.setAction("vi-i", function() { //$NON-NLS-0$
					self.insertMode.storeNumber(self.number);
					view.addKeyMode(self.insertMode);
					view.removeKeyMode(self);
					return true;
				});
				
				view.setAction("vi-I", function() { //$NON-NLS-0$
					self.insertMode.storeNumber(self.number);
					view.addKeyMode(self.insertMode);
					view.removeKeyMode(self);
					return true;
				});
				
				//Status Line Mode
				view.setAction("statusLineMode", function() { //$NON-NLS-0$
					self.insertMode.storeNumber(self.number);
					view.addKeyMode(self.insertMode);
					view.removeKeyMode(self);
					return true;
				});
				
				view.setAction("storeNumber0", function() {return self._storeNumber(0);});
				view.setAction("storeNumber1", function() {return self._storeNumber(1);});
				view.setAction("storeNumber2", function() {return self._storeNumber(2);});
				view.setAction("storeNumber3", function() {return self._storeNumber(3);});
				view.setAction("storeNumber4", function() {return self._storeNumber(4);});
				view.setAction("storeNumber5", function() {return self._storeNumber(5);});
				view.setAction("storeNumber6", function() {return self._storeNumber(6);});
				view.setAction("storeNumber7", function() {return self._storeNumber(7);});
				view.setAction("storeNumber8", function() {return self._storeNumber(8);});
				view.setAction("storeNumber9", function() {return self._storeNumber(9);});
			}	
		},
		match: function(e) {
			var result = mKeyMode.KeyMode.prototype.match.call(this, e);
			if (!result && e.type === "keypress") {
				result = "noop";
			}
			return result;
		},
		setView: function(view) {
			mKeyMode.KeyMode.prototype.setView.call(this, view);
			this._createActions();
		},
		_storeNumber: function(index) {
			if (index === 0 && !this.number) {
				var result = this.getView().invokeAction("lineStart", true); //$NON-NLS-1$ //$NON-NLS-0$
				this.number = "";
				return true;
			}
			this.number += index;
			return true;
		}
//		isStatusActive: function() {
//			return this.isActive();
//		}
	});
	
	return {
		VIMode: VIMode, 
		InsertMode: InsertMode
	};
});