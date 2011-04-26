/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint devel:true regexp:false laxbreak:true*/
/*global dojo orion:true*/

orion = orion || {};

orion.styler = orion.styler || {};

/**
 * Can be used as the prototype for concrete stylers. Extenders can call {@link orion.styler.AbstractStyler.extend}
 * and provider their own _onSelection, _onModelChanged, _onDestroy and _onLineStyle methods. 
 * @class orion.styler.AbstractStyler
 */
orion.styler.AbstractStyler = (function() {
	/** @inner */
	function AbstractStyler() {
	}
	AbstractStyler.prototype = /** @lends orion.styler.AbstractStyler.prototype */ {
		/**
		 * Initializes this styler with an editor. Extenders must call this from their constructor.
		 * @param {eclipse.Editor} editor
		 */
		initialize: function(editor) {
			this.editor = editor;
			
			editor.addEventListener("Selection", this, this._onSelection);
			editor.addEventListener("ModelChanged", this, this._onModelChanged);
			editor.addEventListener("Destroy", this, this._onDestroy);
			editor.addEventListener("LineStyle", this, this._onLineStyle);
		},
		
		/**
		 * Destroys this styler and removes all listeners. Called by the editor.
		 */
		destroy: function() {
			if (this.editor) {
				this.editor.removeEventListener("Selection", this, this._onSelection);
				this.editor.removeEventListener("ModelChanged", this, this._onModelChanged);
				this.editor.removeEventListener("Destroy", this, this._onDestroy);
				this.editor.removeEventListener("LineStyle", this, this._onLineStyle);
				this.editor = null;
			}
		},
		
		/** To be overridden by subclasses.
		 * @public
		 */
		_onSelection: function(/**eclipse.SelectionEvent*/ e) {},
		
		/** To be overridden by subclasses.
		 * @public
		 */
		_onModelChanged: function(/**eclipse.ModelChangingEvent*/ e) {},
		
		/** To be overridden by subclasses.
		 * @public
		 */
		_onDestroy: function(/**eclipse.DestroyEvent*/ e) {},
		
		/** To be overridden by subclasses.
		 * @public
		 */
		_onLineStyle: function(/**eclipse.LineStyleEvent*/ e) {}
	};
	
	return AbstractStyler;
}());

/**
 * Helper for extending AbstractStyler.
 * @methodOf orion.styler.AbstractStyler
 * @static
 * @param {Function} subCtor The constructor function for the subclass.
 * @param {Object} [proto] Object to be mixed into the subclass's prototype. This object can contain your 
 * implementation of _onSelection, _onModelChanged, etc.
 * @see orion.styler.TextMateStyler for example usage.
 */
orion.styler.AbstractStyler.extend = function(subCtor, proto) {
	if (typeof(subCtor) !== "function") { throw new Error("Function expected"); }
	subCtor.prototype = new orion.styler.AbstractStyler();
	subCtor.constructor = subCtor;
	for (var p in proto) {
		if (proto.hasOwnProperty(p)) { subCtor.prototype[p] = proto[p]; }
	}
};

orion.styler.Util = {
	/**
	 * @returns {String} str with JSON-escaped control character sequences converted to real control characters.
	 */
	escapeJson: function(/**String*/ str) {
		return str.replace(new RegExp("\\\\n", "g"), "\n")
			.replace(new RegExp("\\\\t", "g"), "\b")
			.replace(new RegExp("\\\\t", "g"), "\t");
	},
	
	// Rules to detect some unsupported Oniguruma features
	unsupported: [
		{regex: /\(\?[ims\-]:/, func: function(match) { return "option on/off for subexp"; }},
		{regex: /\(\?<([=!])/, func: function(match) { return (match[1] === "=") ? "lookbehind" : "negative lookbehind"; }},
		{regex: /\(\?>/, func: function(match) { return "atomic group"; }}
	],
	
	/**
	 * @param {String} str String giving a regular expression pattern from a TextMate JSON grammar.
	 * @returns {RegExp}
	 */
	toRegExp: function(str) {
		function fail(feature, match) {
			throw new Error("Unsupported regex feature \"" + feature + "\": \"" + match[0] + "\" at index: "
					+ match.index + " in " + match.input);
		}
		var match, i;
		for (i=0; i < this.unsupported.length; i++) {
			if ((match = this.unsupported[i].regex.exec(str))) {
				fail(this.unsupported[i].func(match));
			}
		}
		
		// Handle (?x)expr ("x" flag that applies to entire regex)
		var str2 = "";
		if ((match = /^\(\?x\)/.exec(str))) {
			// Eat \s+ (whitespace) and #.* (comment up to EOL) if they occur outside []
			var insideCharacterClass = false;
			for (i=0; i < str.length; ) {
				var match2;
				if ((match2 = /\s+|#.*/.exec(str)) && match2.index === i) {
					i = match2.index + match2[0].length;
					console.debug("Ate " + match2[0]);
				} else {
					var char = str.charAt(i);
					if (char === "[") {
						insideCharacterClass = true;
					} else if (char === "]") {
						insideCharacterClass = false;
					}
					str2 += char;
					i++;
				}
			}
		}
		str2 = str2 || str;
		str2 = orion.styler.Util.escapeJson(str2);
		// TODO: tolerate (?xexpr) -- eg. in JSON grammar
		// TODO: tolerate (?i) -- eg. in PHP grammar
		return new RegExp(str2);
	}
};

/**
 * A styler that knows how to apply a limited subset of the TextMate grammar format to style a line.
 * 
 * @class orion.styler.TextMateStyler
 * @extends orion.styler.AbstractStyler
 * @param {eclipse.Editor} editor
 * @param {Object} grammar The TextMate grammar as a JSON object. You can use a plist-to-JSON conversion 
 * tool to produce this object. Note that not all features of TextMate grammars are supported.
 */
orion.styler.TextMateStyler = (function() {
	/** @inner */
	function TextMateStyler(editor, grammar) {
		this.initialize(editor);
		this.grammar = grammar;
		this._preprocess();
	}
	orion.styler.AbstractStyler.extend(TextMateStyler, /** @lends orion.styler.TextMateStyler.prototype */ {
		_preprocess: function() {
			// Look up "include"d rules, create Rule instances
			var stack = [this.grammar];
			for (; stack.length !== 0; ) {
				var rule = stack.pop();
				if (rule.__resolvedRule && rule.__cachedTypedRule) {
					continue;
				}
				
				rule.__resolvedRule = this._resolve(rule);
				rule.__cachedTypedRule = this._createTypedRule(rule);
				if (rule.patterns) {
					for (var i=0; i < rule.patterns.length; i++) {
						stack.push(rule.patterns[i]);
					}
				}
			}
		},
		
		/**
		 * An absolute position in the input lines.
		 * @param {String[]} lines All lines we're processing.
		 * @param {Number} lineNum Index of the current line being processed, 0 <= lineNum < lines.length
		 * @param {Number} index Our current position in the line, 0 <= index < lines[lineNum].length
		 * @param {String} text The unconsumed portion of the current line, equal to lines[lineNum].substring(index)
		 * @private
		 */
		Position: (function() {
			function Position(lines, lineNum, index, text) {
				this.lines = lines;
				this.lineNum = lineNum;
				this.index = index;
				this.text = text;
			}
			/**
			 * @param {RegExp.match|null} match The regex match from searching in this Position's <code>text</code>.
			 * @returns {Position} The new Position after advancing past match, or null if we're at the end of input.
			 */
			Position.prototype.advance = function(match) {
				if (!match) { return this; }
				var endIndex = this.index + match.index + match[0].length,
				    newLineNum = (endIndex < this.lines[this.lineNum].length) ? this.lineNum : this.lineNum + 1,
				    newIndex = (this.lineNum === newLineNum) ? endIndex + 1 : 0;
				if (newLineNum < this.lines.length) {
					var text = this.lines[newLineNum].substring(newIndex);
					return new Position(this.lines, newLineNum, newIndex, text);
				} else {
					return null; // EOF
				}
			};
			// XXX debug
			Position.prototype.toString = function() {
				return "line#: " + this.lineNum + ", index: " + this.index + ", " + " text: " + this.text.substring(0,2);
			};
			return Position;
		}()),
		
		Match: (function() {
			/**
			 * FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
			 */
			function Match(lineNum, index, pos) {
				this.lineNum = lineNum;
				this.index = index;
				this.position = pos;
			}
			return Match;
		}()),
		
		/**
		 * A rule that contains subrules ("patterns" in TextMate parlance) but has no "begin" or "end".
		 * Also handles top level of grammar.
		 * @private
		 */
		ContainerRule: (function() {
			function ContainerRule(rule) {
				this.rule = rule;
			}
			ContainerRule.prototype = {
				/** @returns {Match|null} */
				match: function(pos) {
				}
			};
			return ContainerRule;
		}()),

		/**
		 * A rule with a "match" pattern.
		 * @private
		 */
		MatchRule: (function() {
			function MatchRule(/**Object*/ rule) {
				this.rule = rule;
				this.matchRegex = orion.styler.Util.toRegExp(rule.match);
			}
			MatchRule.prototype = {
				match: function(pos) {
				},
				/** Completes application of this rule by assigning the appropriate tokens */
				consume: function(/**Match*/ match, /**Position*/ startPosition, /**Position*/ endPosition) {
					if (match) {
						// FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME
						var name = this.rule.name;
						var captures = this.rule.captures;
						if (captures) {
							this._applyCaptures(captures, match);
						}
					}
				}
			};
			return MatchRule;
		}()),
		
		/**
		 * @param {Object} rule A rule from the JSON grammar.
		 * @returns {MatchRule|ContainerRule|null} Returns null if rule is a begin/end rule (= not supported).
		 */
		_createTypedRule: function(rule) {
			if (rule.match) {
				return new this.MatchRule(rule);
			} else if (rule.begin) {
				return null; // Ignore begin/end rules; unsupported
			} else {
				return new this.ContainerRule(rule);
			}
		},
		
		/**
		 * Resolves a rule from the grammar (which may be an include) into the real rule that it points to.
		 */
		_resolve: function(rule) {
			function assert(cond, message) {
				if (!cond) { throw new Error(message); }
			}
			
			var resolved = rule;
			if (rule.include) {
				assert(!(rule.begin || rule.end || rule.match), "Unexpected patterns in include rule");
				var name = rule.include;
				if (name.charAt(0) === "#") {
					resolved = this.grammar.repository && this.grammar.repository[name.substring(1)];
					if (!resolved) { throw new Error("Couldn't find included rule " + name + " in grammar repository"); }
				} else if (name === "$self") {
					resolved = this.grammar;
				} else if (name === "$base") {
					// $base is only relevant when including rules from foreign grammars
					throw new Error("include $base not supported"); 
				} else {
					throw new Error("Include external rule " + name + " not supported");
				}
			}
			return resolved;
		},
		
		/**
		 * TODO
		 * @param {String[]} lines
		 */
		parse: function(lines) {
			var position = new Position(lines, 0, 0, lines[0]);
			// startRule.match(position)
		},
		
		_applyCaptures: function(/**Object*/ captures, /**Match*/ match) {
			var regexMatch = match.match;
			for (var groupNum in captures) {
				if (captures.hasOwnProperty(groupNum)) {
					var value = captures[groupNum];
					var matchedGroup = regexMatch[groupNum];
					console.debug("X apply " + value.name + " to " + matchedGroup);
				}
			}
		},
		
		_onSelection: function(e) {
		},
		_onModelChanged: function(/**eclipse.ModelChangingEvent*/ e) {
			// Re-style the changed lines?
			
		},
		_onDestroy: function(/**eclipse.DestroyEvent*/ e) {
		},
		_onLineStyle: function(/**eclipse.LineStyleEvent*/ e) {
			// When is this called? eg. while scrolling?
		}
	});
	return TextMateStyler;
}());
	
