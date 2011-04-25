/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint devel:true regexp:false laxbreak:true*/
/*global dojo orion:true*/

/**
 * @namespace The top-level Orion namespace.
 */
orion = orion || {};

/**
 * @namespace The namespace for stylers.
 */
orion.styler = orion.styler || {};

/**
 * Can be used as the prototype for concrete stylers. Extenders can provide their own _onSelection,
 * _onModelChanged, _onDestroy and _onLineStyle methods.
 * @class orion.styler.AbstractStyler
 */
orion.styler.AbstractStyler = (function() {
	function AbstractStyler() {
	}
	AbstractStyler.prototype = /** @lends orion.styler.AbstractStyler.prototype */ {
		/**
		 * Initializes this styler with an editor. Extenders should call this from their constructor.
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
		_onSelection: function(e) {},
		_onModelChanged: function(e) {},
		_onDestroy: function(e) {},
		_onLineStyle: function(e) {}
	};
	
	/**
	 * Helper for extending AbstractStyler.
	 * @methodOf orion.styler.AbstractStyler
	 * @static
	 * @param {Function} ctor The constructor function for the subclass.
	 * @param {Object} proto Object to be mixed into the subclass's prototype. If you're overriding
	 * _onSelection, _onModelChanged, etc, this object should contain your implementation of those methods.
	 */
	AbstractStyler.extend = function(ctor, proto) {
		if (typeof(ctor) !== "function") { throw new Error("Function expected"); }
		ctor.prototype = new orion.styler.AbstractStyler();
		ctor.constructor = ctor;
		for (var p in proto) {
			if (proto.hasOwnProperty(p)) { ctor.prototype[p] = proto[p]; }
		}
	};
	
	return AbstractStyler;
}());

orion.styler.Util = {
	/**
	 * @returns {String} str with JSON-escaped control character sequences converted to real control characters.
	 */
	escapeJson: function(/**String*/ str) {
		return str.replace(new RegExp("\\\\n", "g"), "\n")
			.replace(new RegExp("\\\\t", "g"), "\b")
			.replace(new RegExp("\\\\t", "g"), "\t");
	},
	
	/**
	 * @param {String} str String giving a regular expression pattern.
	 * @returns {RegExp}
	 */
	toRegExp: function(/**String*/ str) {
		var unsupported = [];
		
		// Add rules to detect some unsupported Oniguruma features
		function fail(feature, match) {
			return "Unsupported regex feature \"" + feature + "\": \"" + match[0] + "\" at index: " + match.index + " in " + match.input;
		}
		unsupported.addToken(/\(\?[ims\-]:/,
			function(match) {
				fail("option on/off for subexp", match);
			},
			XRegExp.OUTSIDE_CLASS);
		unsupported.addToken(/\(\?<([=!])/,
			function(match) {
				fail(match[1] === "=" ? "lookbehind" : "negative lookbehind", match);
			},
			XRegExp.OUTSIDE_CLASS);
		unsupported.addToken(/\(\?>/,
			function(match) {
				fail("atomic group", match);
			},
			XRegExp.OUTSIDE_CLASS);
		
		// TODO: Subpattern Definition (Oniguruma-Style)
		// See http://xregexp.com/api/token_examples/
		
		// TODO: Named capture in single quotes (?'name' ...)
		// See http://xregexp.com/syntax/named_capture_comparison/
		
		// Workaround to tolerate a regex enclosed by (?x) -- eg. JSON bundle
		// TODO: should reject (?xsubExpr1)(subExpr2) but doesn't
//		var xFlagMatch = /^\(\?x(:?)([\s\S]*)\)/.exec(str);
//		if (xFlagMatch) {
//			var inner = xFlagMatch[2];
//			if (xFlagMatch[1] === ":") {
//				// non-capturing (?x: X) -- eat ( )
//				return new RegExp(escapeJson(inner), "x");
//			} else {
//				// capturing (?x X) -- preserve ( )
//				return new RegExp(escapeJson("(" + inner + ")"), "x");
//			}
//		} else {
//			return new RegExp(escapeJson(str));
//		}
	},
	
	// XXX DEBUG XXX
	assert: function(cond, message) {
		if (!cond) { throw new Error(message); }
	}
};

/**
 * A styler that knows how to apply TextMate grammars.
 * 
 * TODO extend orion.styler.AbstractStyler
 * 
 * @class orion.styler.TextMateStyler
 * @param {Object} grammar The TextMate grammar as a JSON object. You can use a PList-to-JSON conversion 
 * tool to produce this object.
 */
orion.styler.TextMateStyler = (function() {
	function TextMateStyler(grammar) {
		this.grammar = grammar;
		this.preprocess(grammar);
	}
	
	/**
	 * An absolute position in the input lines.
	 * @param {String[]} lines All lines we're processing.
	 * @param {Number} lineNum Index of the current line being processed, 0 <= lineNum < lines.length
	 * @param {Number} index Our current position in the line, 0 <= index < lines[lineNum].length
	 * @param {String} text The unconsumed portion of the current line, equal to lines[lineNum].substring(index)
	 */
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
	
	/**
	 * The absolute position of a regex match in the input.
	 * @param {Number} lineNum The line number that the match occurred in.
	 * @param {Number} index The position within the line that the match begins at.
//	 * FIXME @param {RegExp.match} match The underlying RegExp match
	 * @param {Position} pos The input position that immediately follows this Match.
	 */
	function Match(lineNum, index, /*match, */pos) {
		this.lineNum = lineNum;
		this.index = index;
//		this.match = match;
		this.position = pos;
	}

	TextMateStyler.prototype = {
		/**
		 * A rule that contains subrules ("patterns" in TextMate parlance) but has no "begin" or "end".
		 * Also handles top level of grammar.
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
		})(),

		/** A rule with a "match" pattern. */
		MatchRule: (function() {
			function MatchRule(/**Object*/ rule) {
				this.rule = rule;
				this.matchRegex = toRegExp(rule.match);
			}
			MatchRule.prototype = {
				/** @returns {Match|null} */
				match: function(pos) {
				},
				/** Completes application of this rule by assigning the appropriate tokens */
				consume: function(/**Match*/ match, /**Position*/ startPosition, /**Position*/ endPosition) {
					if (match) {
						var name = this.rule.name;
						var captures = this.rule.captures;
						if (name) {
							console.debug("X tok" + name + " to '" + range(startPosition.lines, 
									startPosition.lineNum, startPosition.index, endPosition.lineNum, endPosition.index) + "'");
						}
						if (captures) {
							applyCaptures(captures, match);
						}
					}
				}
			};
			return MatchRule;
		}()),
		
		ruleFactory: function(rule) {
			if (rule.match) {
				return new MatchRule(rule);
			} else if (rule.begin) {
				return null; // Ignore begin/end rules; unsupported
			} else {
				return new ContainerRule(rule);
			}
		},
		
		/**
		 * Resolves a rule from the grammar into a MatchRule, ContainerRule, or BeginEndRule.
		 * @param rule {Object} A rule from the grammar.
		 * @returns {MatchRule|ContainerRule|BeginEndRule} An instance of one of our *Rules. If the 
		 * rule is a reference to another rule, then the instance for the real, resolved rule is returned.
		 * Returns null if __________
		 */
		resolve: function(rule) {
			var resolved = rule;
			if (rule.include) {
				assert(!rule.begin && !rule.end && !rule.match); // sanity check
				var name = rule.include;
				if (name.charAt(0) === "#") {
					resolved = this.grammar.repository[name.substring(1)];
				} else if (name === "$self") {
					resolved = this.grammar;
				} else {
					throw new Error("External rule " + name + " not supported");
				}
				if (!resolved) { throw new Error("Couldn't find rule " + name + " in grammar"); }
			}
			// Cache the (Match|Container|BeginEnd)Rule in the resolved rule from grammar. These objects are reused each
			// time the rule is called via an include, so they must not have any per-rule-application state.
			resolved._cachedRule = resolved._cachedRule || this.makeRule(resolved);
			return resolved._cachedRule;
		},
		
		parse: function(lines) {
			// No end tokens; BeginEndRule handles each of its subrules
			// Concern: backtracking? we need to be able to back up the pos if nothing matches?
			//		Just throw away the result returned from match()
			//		And unroll all the tokens we applied
			// TODO cache RegExp
			
			// main
			var pos = new Position(lines, 0, 0, lines[0]);
			var startRule = this.makeRule(this.grammar);
			startRule.match(pos);
		},
		
		applyCaptures: function(/**Object*/ captures, /**Match*/ match) {
			var regexMatch = match.match;
			for (var groupNum in captures) {
				if (captures.hasOwnProperty(groupNum)) {
					var value = captures[groupNum];
					var matchedGroup = regexMatch[groupNum];
					console.debug("X apply " + value.name + " to " + matchedGroup);
				}
			}
		}
	};
	return TextMateStyler;
}());
	
