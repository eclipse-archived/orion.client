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
define(['dojo'], function(dojo) {

var orion = orion || {};

orion.styler = orion.styler || {};

/**
 * A styler that does nothing, but can be extended by concrete stylers. Extenders can call 
 * {@link orion.styler.AbstractStyler.extend} and provide their own {@link #_onSelection}, 
 * {@link #_onModelChanged}, {@link #_onDestroy} and {@link #_onLineStyle} methods.
 * @class orion.styler.AbstractStyler
 */
orion.styler.AbstractStyler = (function() {
	/** @inner */
	function AbstractStyler() {
	}
	AbstractStyler.prototype = /** @lends orion.styler.AbstractStyler.prototype */ {
		/**
		 * Initializes this styler with an editor. Extenders <b>must</b> call this from their constructor.
		 * @param {eclipse.Editor} editor
		 */
		initialize: function(editor) {
			this.editor = editor;
			
			editor.addEventListener("Selection", this, this._onSelection);
			editor.addEventListener("ModelChanged", this, this._onModelChanged);
			editor.addEventListener("Destroy", this, this._onDestroy);
			editor.addEventListener("LineStyle", this, this._onLineStyle);
			editor.redrawLines();
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
		
		/** To be overridden by subclass.
		 * @public
		 */
		_onSelection: function(/**eclipse.SelectionEvent*/ e) {},
		
		/** To be overridden by subclass.
		 * @public
		 */
		_onModelChanged: function(/**eclipse.ModelChangedEvent*/ e) {},
		
		/** To be overridden by subclass.
		 * @public
		 */
		_onDestroy: function(/**eclipse.DestroyEvent*/ e) {},
		
		/** To be overridden by subclass.
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
	 * @param {String} [flags] [ismg]+
	 * @returns {RegExp}
	 */
	toRegExp: function(str) {
		var flags = "";
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
//					console.debug("Ate " + match2[0]);
				} else {
					var chr = str.charAt(i);
					if (chr === "[") {
						insideCharacterClass = true;
					} else if (chr === "]") {
						insideCharacterClass = false;
					}
					str2 += chr;
					i++;
				}
			}
		}
		str2 = str2 || str;
		str2 = orion.styler.Util.escapeJson(str2);
		// TODO: tolerate /(?xExpr)/ -- eg. in JSON grammar
		// TODO: tolerate /(?iSubExp)/ -- eg. in PHP grammar (trickier)
		return new RegExp(str2, flags);
	}
};

/**
 * A styler that knows how to apply a limited subset of the TextMate grammar format to style a line.<p>
 *
 * <h4>Styling from a grammar:</h4>
 * Each scope name given in the grammar is converted to an array of CSS class names. For example 
 * a region of text with scope <tt>keyword.control.php</tt> will be assigned the CSS classes 
 * <pre>keyword, keyword-control, keyword-control-php</pre>
 *
 * A CSS file can give rules matching any of these class names to provide generic or more specific styling.
 * For example, <pre>.keyword { font-color: blue; }</pre> colors all keywords blue, while
 * <pre>.keyword-control-php { font-weight: bold; }</pre> bolds only PHP control keywords.
 *
 * This is useful when using grammars that adhere to TextMate's
 * <a href="http://manual.macromates.com/en/language_grammars.html#naming_conventions">scope name conventions</a>,
 * as a single CSS rule can provide consistent styling to similar constructs across different languages.<p>
 * 
 * <h4>Supported top-level grammar features:</h4>
 * <ul><li><tt>fileTypes, patterns, repository</tt> (but see below) are supported.</li>
 * <li><tt>scopeName, firstLineMatch, foldingStartMarker, foldingStopMarker</tt> are <b>not</b> supported.</li>
 * </ul>
 *
 * <p>TODO update this section</p>
 * <del>
 * <h4>Supported grammar rule features:</h4>
 * <ul><li><tt>match</tt> patterns are supported.</li>
 * <li><tt>name</tt> scope is supported.</li>
 * <li><tt>captures</tt> is <b>not</b> supported. Any scopes given inside a <tt>captures</tt> object are not applied.</li>
 * <li><tt>begin/end</tt> patterns are <b>not</b> supported and are ignored, along with their subrules. Consequently, 
 *   matched constructs may <b>not</b> span multiple lines.</li>
 * <li><tt>contentName, beginCaptures, endCaptures, applyEndPatternLast</tt> are <b>not</b> supported.</li>
 * <li><tt>include</tt> is supported, but only when it references a rule in the current grammar's <tt>repository</tt>.
 *   Including <tt>$self</tt>, <tt>$base</tt>, or <tt>rule.from.another.grammar</tt> is <b>not</b> supported.</li>
 * <li>The <tt>(?x)</tt> option ("extended" regex format) is supported, but only when it appears at the beginning of a regex pattern.</li>
 * <li>Matching is done using native JavaScript {@link RegExp}s. As a result, many Oniguruma features are <b>not</b> supported.
 *   Unsupported features include:
 *   <ul><li>Named captures</li>
 *   <li>Setting flags inside groups (eg. <tt>(?i:a)b</tt>)</li>
 *   <li>Lookbehind and negative lookbehind</li>
 *   <li>Subexpression call</li>
 *   <li>etc.</li>
 *   </ul>
 * </li>
 * </ul>
 * </del>
 *
 * @class orion.styler.TextMateStyler
 * @extends orion.styler.AbstractStyler
 * @param {eclipse.Editor} editor The editor.
 * @param {JSONObject} grammar The TextMate grammar as a JSON object. You can use a plist-to-JSON conversion tool
 * to produce this object. Note that some features of TextMate grammars are not supported.
 */
orion.styler.TextMateStyler = (function() {
	/** @inner */
	function TextMateStyler(editor, grammar) {
		this.initialize(editor);
		this.grammar = this.copy(grammar);
		this._styles = {}; /* key: {String} scopeName, value: {String[]} cssClassNames */
		this._tree = null;
		
		this.preprocess();
	}
	orion.styler.AbstractStyler.extend(TextMateStyler, /** @lends orion.styler.TextMateStyler.prototype */ {
		copy: function(grammar) {
			// Use a copy of the grammar object, since we'll mutate it
			return JSON.parse(JSON.stringify(grammar));
		},
		preprocess: function() {
			var stack = [this.grammar];
			for (; stack.length !== 0; ) {
				var rule = stack.pop();
				if (rule._resolvedRule && rule._typedRule) {
					continue;
				}
//				console.debug("Process " + (rule.include || rule.name));
				
				// Look up include'd rule, create typed *Rule instance
				rule._resolvedRule = this._resolve(rule);
				rule._typedRule = this._createTypedRule(rule);
				
				// Convert the scope names to styles and cache them for later
				this.addStyles(rule.name);
				this.addStyles(rule.contentName);
				this.addStylesForCaptures(rule.captures);
				this.addStylesForCaptures(rule.beginCaptures);
				this.addStylesForCaptures(rule.endCaptures);
				
				if (rule._resolvedRule !== rule) {
					// Add include target
					stack.push(rule._resolvedRule);
				}
				if (rule.patterns) {
					// Add subrules
					for (var i=0; i < rule.patterns.length; i++) {
						stack.push(rule.patterns[i]);
					}
				}
			}
		},
		
		/**
		 * Adds eclipse.Style objects for scope to our _styles cache.
		 * @param {String} scope A scope name, like "constant.character.php".
		 */
		addStyles: function(scope) {
			if (scope && !this._styles[scope]) {
				this._styles[scope] = dojo.map(scope.split("."),
						function(segment, i, segments) {
							return segments.slice(0, i+1).join("-");
						});
//				console.debug("add style for " + scope + " = [" + this._styles[scope].join(", ") + "]");
			}
		},
		addStylesForCaptures: function(/**Object*/ captures) {
			for (var prop in captures) {
				if (captures.hasOwnProperty(prop)) {
					var scope = captures[prop].name;
					this.addStyles(scope);
				}
			}
		},
		/**
		 * A rule that contains subrules ("patterns" in TextMate parlance) but has no "begin" or "end".
		 * Also handles top level of grammar.
		 * @private
		 */
		ContainerRule: (function() {
			function ContainerRule(/**Object*/ rule) {
				this.rule = rule;
				this.subrules = rule.patterns;
			}
			return ContainerRule;
		}()),
		/**
		 * A rule that is delimited by "begin" and "end" matches, which may be separated by any number of
		 * lines. This type of rule may contain subrules, which apply only inside the begin .. end region.
		 * @private
		 */
		BeginEndRule: (function() {
			function BeginEndRule(/**Object*/ rule) {
				this.rule = rule;
				// TODO: the TextMate blog claims that "end" is optional.
				this.beginRegex = orion.styler.Util.toRegExp(rule.begin);
				this.endRegex = orion.styler.Util.toRegExp(rule.end);
				this.subrules = rule.patterns || [];
				
				// TODO: if rule.beginCaptures, make a group-ified regex from beginRegex
				// TODO: if rule.endCaptures, make a group-ified regex from endRegex
			}
			return BeginEndRule;
		}()),
		
		/**
		 * A rule with a "match" pattern.
		 * @private
		 */
		MatchRule: (function() {
			function MatchRule(/**Object*/ rule) {
				this.rule = rule;
				this.matchRegex = orion.styler.Util.toRegExp(rule.match);
				
				// TODO if rule.captures, make a group-ified regex from matchRegex
			}
			return MatchRule;
		}()),
		/**
		 * @param {Object} rule A rule from the JSON grammar.
		 * @returns {MatchRule|BeginEndRule|ContainerRule}
		 */
		_createTypedRule: function(rule) {
			if (rule.match) {
				return new this.MatchRule(rule);
			} else if (rule.begin) {
				return new this.BeginEndRule(rule);
			} else {
				return new this.ContainerRule(rule);
			}
		},
		/**
		 * Resolves a rule from the grammar (which may be an include) into the real rule that it points to.
		 */
		_resolve: function(rule) {
			var resolved = rule;
			if (rule.include) {
				if (rule.begin || rule.end || rule.match) {
					throw new Error("Unexpected regex pattern in \"include\" rule " + rule.include);
				}
				var name = rule.include;
				if (name.charAt(0) === "#") {
					resolved = this.grammar.repository && this.grammar.repository[name.substring(1)];
					if (!resolved) { throw new Error("Couldn't find included rule " + name + " in grammar repository"); }
				} else if (name === "$self") {
					resolved = this.grammar;
				} else if (name === "$base") {
					// $base is only relevant when including rules from foreign grammars
					throw new Error("Include \"$base\" is not supported"); 
				} else {
					throw new Error("Include external rule \"" + name + "\" is not supported");
				}
			}
			return resolved;
		},
		// Parse the file, beginning from "start", and stopping when startNode's "end" pattern 
		// has been matched, or the end of buffer is reached.
		// TODO revamp this for recovery parsing
		parse: function(startNode, start) {
			if (startNode.children.length > 0) {
				throw new Error("Can we get here?");
//				// we're reparsing a node so reset it
//				startNode.children.splice(0);
			}
			
			var model = this.editor.getModel();
			var lastLine = model.getLineCount() - 1;
			var pos = start;
			var last = model.getCharCount();
			var lastResetPos = -1;
			var node = startNode;
			var ruleNumber = 0;
			while (pos < last) {
				var lineIndex = model.getLineAtOffset(pos);
				
				// Build stack of subrules to try. ruleNumber tells us which subrule to start from.
				var ruleStack = [];
				var subrules = node.rule.subrules;
				if (ruleNumber === subrules.length) {
					ruleNumber = 0;
					if (lastResetPos === pos) {
						// Already tried all rules, and didn't advance any further => this line is done.
						// Go to next line, or end.
						pos = (lineIndex === lastLine) ? last : model.getLineStart(lineIndex+1);
						continue;
					}
					lastResetPos = pos;
				}
				this.push(ruleStack, node.rule.subrules, ruleNumber);
				
				// Get the next subrule (if any) of node, and match it against the line we're on.
				var next = ruleStack.length ? ruleStack.pop() : null;
				var rule = next && next._resolvedRule._typedRule;
				if (rule instanceof this.ContainerRule) {
					// A ContainerRule itself can't match anything, but it can carry subrules, so we need to make a Node
					// in the tree for it and descend into it
					throw new Error("FIXME containerNode");
//					var subContainerNode = new this.ContainerNode(node, rule);
//					node.addChild(subContainerNode);
//					node = subContainerNode; // descend
//					console.debug("Descend into " + subContainerNode);
				} else if (rule instanceof this.MatchRule || this.BeginEndRule || !rule) {
					// Match the subrule (if there is one), and see if we can end the begin/end node 
					// we're inside (if we are inside one)
					var lineStart = model.getLineStart(lineIndex);
					var lineEnd = Math.min(model.getLineEnd(lineIndex), last);
					var line = model.getText(pos, lineEnd); // remaining suffix of line
					
					var offset = pos;
					var subRegex = null, subMatch = null;
					if (rule) {
						subRegex = rule.matchRegex || rule.beginRegex;
						subMatch = this.exec(subRegex, line, offset);
					}
					var endMatch = this.tryEnd(node.rule, line, offset);
					var winner = this.getWinner(rule, subMatch, endMatch);
					if (subMatch && subMatch === winner) {
						// Subrule consumes match
						pos = this.afterMatch(subMatch);
						ruleNumber = 0; // subrule matched; start over again from 0
						if (rule instanceof this.BeginEndRule) {
							var subNode = new this.BeginEndNode(node, rule, subMatch.index, subMatch);
							node.addChild(subNode);
							node = subNode; // descend
//							console.debug("  BEGIN: " + regex + " at " + subMatch.index + "; descend into " + subNode);
						} else {
							// MatchRule, advance past it. Apply subrules starting over from 0
							var endsAt = pos;
//							console.debug("  matched " + subMatch[0] + " at " + subMatch.index + ".." + endsAt + ", name: " + rule.rule.name + " txt: "
//								+ model.getText(subMatch.index, endsAt));
						}
					} else if (endMatch && endMatch === winner) {
						// End consumes match. The BeginEndRule that node represents is finished.
						pos = this.afterMatch(endMatch);
						node.setEnd(endMatch);
						// are we done?
						if (node === startNode) {
							break;
						}
						node = node.parent; // ascend
						ruleNumber = 0; // start in the parent node from rule #0
//						console.debug("  END " + endMatch + " at " + offset + ", ascend to " + node);
					} else {
						// Neither sub nor end matched; try the next rule
						ruleNumber++;
					}
				}
			} // end loop
			// Terminate any BeginEndNodes that never matched their "end"s
			this.closeBeginEndNodes(startNode);
		},
		closeBeginEndNodes: function(startFrom) {
			// An unterminated BeginEndNode will be the last element of a children array, but may be nested 
			// arbitrarily deeply.
			var lastChar = this.editor.getModel().getCharCount();
			var node = startFrom;
			while (node) {
				var child = node.children[node.children.length-1];
				if (child instanceof this.BeginEndNode && !child.end) {
					console.debug("Force set end: " + child + " to " + lastChar);
					child.setNoEnd(lastChar);
					node = child;
				} else {
					node = null;
				}
			}
		},
		ContainerNode: (function() {
			function ContainerNode(parent, rule) {
				this.parent = parent;
				this.rule = rule;
				this.children = [];
				
				this.start = null;
				this.end = null;
			}
			ContainerNode.prototype.addChild = function(child) {
				this.children.push(child);
			};
			ContainerNode.prototype.valueOf = function() {
				var r = this.rule;
				return "ContainerNode { " + (r.include || "") + " " + (r.name || "") + (r.comment || "") + "}";
			};
			return ContainerNode;
		}()),
		BeginEndNode: (function() {
			function BeginEndNode(parent, rule, start, beginMatch) {
				this.parent = parent;
				this.rule = rule;
				this.children = [];
				
				this.start = start;
				this.beginMatch = beginMatch;
				this.end = null; // not known yet, but will be set eventually (may be EOF)
				this.endMatch = null; // not known yet, will be null if we never match our "end" pattern
			}
			BeginEndNode.prototype.addChild = function(child) {
				this.children.push(child);
			};
			BeginEndNode.prototype.setEnd = function(endMatch) {
				this.endMatch = endMatch;
				this.end = endMatch.index + endMatch[0].length;
			};
			BeginEndNode.prototype.setNoEnd = function(lastChar) {
				this.end = lastChar;
			};
			BeginEndNode.prototype.valueOf = function() {
				return "{" + this.rule.beginRegex + " range=" + this.start + ".." + this.end + "}";
			};
			return BeginEndNode;
		}()),
		/** Pushes rules onto stack, skipping the first 'startFrom' rules. rules[startFrom] becomes top of stack */
		push: function(/**Array*/ stack, /**Array*/ rules, /**Number*/ startFrom) {
			startFrom = startFrom || 0;
			for (var i = rules.length; i > startFrom; ) {
				stack.push(rules[--i]);
			}
		},
		/** Execs regex on text, and returns the match object with its index offset by the given amount. */
		exec: function(/**RegExp*/ regex, /**String*/ text, /**Number*/ offset) {
			var match = regex.exec(text);
			if (match) { match.index += offset; }
			regex.lastIndex = 0; // Just in case
			return match;
		},
		/** @returns {Number} The position immediately following the match. */
		afterMatch: function(/**RegExp.match*/ match) {
			return match.index + match[0].length;
		},
		/** @returns {RegExp.match} If rule is a BeginEndRule and its "end" pattern matches the text. */
		tryEnd: function(/**BeginEndRule|MatchRule*/ rule, /**String*/ text, /**Number*/ offset) {
			if (!rule.endRegex) { return null; }
			// TODO: Support backreferences in endRegex that refer to matched groups of the beginMatch
			var endRegex = rule.endRegex;
			return this.exec(endRegex, text, offset);
		},
		/** Given match from a subrule and match from parent rule's "end" regex, returns the match that wins. */
		getWinner: function(/**(BeginEnd|Match)Rule*/ rule, /**RegExp.match*/ sub, /**RegExp.match*/ end) {
			// Use whichever is nonnull and matches earliest. If match at same index, end wins unless
			// applyEndPatternLast is set
			if (!end) { return sub; }
			else if (!sub) { return end; }
			else if (end.index < sub.index) { return end; }
			else if (sub.index < end.index) { return sub; }
			else { return rule.applyEndPatternLast ? sub : end; }
		},
		/** Called once when file is first loaded to build the parse tree. Tree is updated incrementally thereafter as buffer is modified */
		initialParse: function() {
			var last = this.editor.getModel().getCharCount();
			console.debug("initialParse" + 0 + " .. " + last + " " + this.editor.getText(0, last));
			// First time; make parse tree for whole buffer
			var root = new this.ContainerNode(null, this.grammar._typedRule);
			this.parse(root, 0);
			this._tree = root;
		},
		_onModelChanged: function(/**eclipse.ModelChangedEvent*/ e) {
			var addedCharCount = e.addedCharCount,
			    addedLineCount = e.addedLineCount,
			    removedCharCount = e.removedCharCount,
			    removedLineCount = e.removedLineCount,
			    start = e.start;
			if (!this._tree) {
				this.initialParse();
			} else {
				console.debug("\nstart=" + start + " add=" + addedCharCount + " rem=" + removedCharCount
						+ " addl=" + addedLineCount + " reml=" + removedLineCount);
				var model = this.editor.getModel();
				var end = start + removedCharCount;
				
				var sls = model.getLineStart(model.getLineAtOffset(start));
				var ele = model.getLineEnd(model.getLineAtOffset(end));
				var fdl = this.getFirstDamagedLeaf(sls, sls); // maybe +1?
				if (fdl) {
					console.debug("fdl=" + fdl + " sls=" + sls + " ele=" + ele);
					var t = this.editor.getText(sls, ele);
					console.debug(" t='" + t.replace(/\n/g,"\\n") + "'");
					// [sls..ele] is the region we need to verify. If we find the structure of the tree
					// has changed in that area, then we may need to reparse the rest of the file.
					
					var stoppedAt = this.repair(fdl, sls, ele);
				} else {
					// TODO: fdl == null, we didn't hit any b/e nodes but may still have added a node
					// need to parse [sls..ele]
					console.debug("TODO fdl is null");
				}
				
				// TODO: call editor.redrawRange() on [sls, stoppedAt]
			}
		},
		/**
		 * TODOC
		 * @param {Number} end The best-case stopping point. If we detect a structure change to tree,
		 * then we'll go past end and in worst case parse until EOF.
		 */
		repair: function(origNode, sls, ele) {
			/*
			node = origNode
			pos = sls
			// This is the only time we rely on the positions being correct. Everything else
			// is relative to previous nodes and we re-set the start/end positions as we find
			// them. Using sls is safe since sls <= modelChangedEvent.start
			expected = the initial expected node, based on sls
			
			// do we 
			ruleStack = []
			ruleNumber = ?? whichever ruleNumber derived the expected node?
			while (???) {
				put rules on ruleStack
				get the expected rule for next match
				sub = get the next subrule to try
				try matching sub
				if (subMatch && winner === subMatch) {
					if (subrule instanceof this.BeginEndRule) {
						if (expected the same child) {
							// found an expected child
							// ie. subrule = expected rule
							updateStart(node, newStart)
							node = node.children[index of the expected child] // go into it
						} else {
							// found an unexpected child
							trash(node, )
							trashed = true
						}
					} else {
						// MatchRule; ignore and continue
					}
				} else if (endMatch && winner == endMatch) {
					if (expected node to end) {
						// found an expected end
						updateEnd(node, newStart)
						node = node.parent
					} else {
						// found an unexpected end
						trash(node, )
						trashed = true
					}
				} else {
					// Nothing matched; keep going until something does
				}
				
				done = !trashed ? (pos < end) : (pos < lastChar);
			}
			if (!trashed) {
				// update successors that we didn't parse
			}
			// return where we stopped parsing
			return pos;
						function updateStart(node, newStart) {
				node.start = subMatch.start
				node.beginMatch = subMatch.beginMatch
				node.end = null
			}
			function trash() {
				if (expected a child) {
					// delete remaining children
					node.children.length = index of whatever the expected child was supposed to be
				} else if (expected an end) {
					node.endMatch = node.end = null
				}
				delete all successors of node
				ruleNumber = 0; // start over parsing node again from 0??
			}
			*/
		},
		/** @returns {BeginEndNode} The first (smallest "start" value) leaf node damaged by the edit.
		 */
		getFirstDamagedLeaf: function(start, end) {
			var nodes = [this._tree];
			var result, lastUndamaged;
			while (nodes.length) {
				var n = nodes.pop();
				if (!n.parent /*n is root*/ || this.isDamaged(n, start, end)) {
					// n is damaged by the edit, so go into its children
					// Note: If a node is damaged, then some of its descendents MAY be damaged
					// If a node is undamaged, then ALL of its descendents are undamaged
					if (n instanceof this.BeginEndNode) {
						result = n;
					}
					// Examine children[0] last
					for (var i=0; i < n.children.length; i++) {
						nodes.push(n.children[i]);
					}
				}
			}
			return result;
		},
		/** @returns true If n overlaps the interval [start,end] */
		isDamaged: function(/**BeginEndNode*/ n, start, end) {
			return (n.start <= end && n.end >= start);
		},
		_onLineStyle: function(/**eclipse.LineStyleEvent*/ e) {
			function byStart(r1, r2) { return r1.start - r2.start; }
			function getClaimedBy(claimedRegions, start, end) {
				// claimedRegions is guaranteed to be a set of nonoverlapping intervals
				var len = claimedRegions.length;
				for (var i=0; i < len; i++) {
					var r = claimedRegions[i];
					if (r.start <= start && end <= r.end) {
						return r.node;
					}
				}
				return null;
			}
			// directRegions must be nonoverlapping intervals and sorted in ascending order by "start"
			function getGaps(directRegions, lineStart, lineEnd) {
				var gaps = [];
				var expect = e.lineStart;
				for (var i=0; i < directRegions.length; i++) {
					var scope = directRegions[i],
					    ss = scope.start,
					    se = scope.end;
					if (ss !== expect) {
						// gap region [expect, ss]
						gaps.push({start: expect, end:ss});
					}
					expect = se;
				}
				if (expect !== lineEnd) {
					gaps.push({start: expect, end: lineEnd});
				}
				return gaps;
			}
			
//			console.debug("lineIndex=" + e.lineIndex + " lineStart=" + e.lineStart + "" /*+ "lineText:" + e.lineText*/ + " ");
			if (!this._tree) {
				// In some cases it seems onLineStyle is called before onModelChanged, so we need to parse here
				this.initialParse();
			}
			
			var lineStart = e.lineStart;
			var model = this.editor.getModel();
			var lineEnd = model.getLineEnd(e.lineIndex);
			var nodes = this.getIntersecting(e.lineStart, lineEnd);
			
			var i, node;
			// Apply "dirct" scopes: ie MatchRule-matches and beginCaptures/endCaptures of the BeginEndRules that intersect this line
			var directScopes = [];
			var claimedRegions = [];
			if (nodes.length > 0 && nodes.length[nodes.length-1] === this._tree) {
				// Intersects multiple nodes, including toplevel node. Remove toplevel node since
				// it's dealth with below
				nodes.splice(nodes.length-1, 1);
			}
			for (i=0; i < nodes.length; i++) {
				node = nodes[i];
				this.styleDirect(directScopes, claimedRegions, node, lineStart, lineEnd);
			}
			
			// begin inherited
			// For each gap remaining in line that wasn't assigned a match/beginCaptures/endCaptures
			// scope above, assign the nearest inherited name/contentName scope to it (if any), or give 
			// the toplevel rules a chance to match it.
			var directSorted = directScopes.slice(0).sort(byStart); // TODO: are these already sorted?
			var gaps = getGaps(directSorted, e.lineStart, lineEnd);
//			console.debug("  gaps: " + gaps.map(function(g){return "["+g.start+","+g.end+" '"+model.getText(g.start,g.end)+"']";}).join(" "));
			
			var inheritedScopes = [];
			for (i=0; i < gaps.length; i++) {
				var gap = gaps[i];
				// find out who owns this gap
				node = getClaimedBy(claimedRegions, gap.start, gap.end);
				if (!node) {
					// Not claimed by anybody--use toplevel "match"-rules
					this.styleFromMatchRules(inheritedScopes, this._tree, gap.start, gap.end);
				} else {
					// Get the nearest inherited name/contentName scope and assign it to the gap
					this.styleInherited(inheritedScopes, node, gap.start, gap.end);
				}
			}
			// end inherited
			
			// directScopes, inheritedScopes are disjoint
			var scopes = directScopes.concat(inheritedScopes);
			e.ranges = this.toStyleRanges(scopes);
			
			// Editor requires StyleRanges must be in ascending order by 'start', or else some will be ignored
			e.ranges.sort(byStart);
			
//			console.debug("  text: " + this.editor.getText(lineStart, lineEnd));
//			console.debug("  scopes: " + scopes.map(function(sc){return sc.scope;}).join(", "));
			//console.debug("  intersects " + nodes.length + ": [" + nodes.map(function(r){return r.valueOf();}).join(", ") + "]");
		},
		// Find the nearest inherited name/contentName and apply it to [start..end]
		styleInherited: function(/**Array*/ scopes, /**BeginEndNode*/ node, start, end) {
			while (node) {
				// if node defines a contentName or name, apply it
				var rule = node.rule.rule;
				var name = rule.name,
				    contentName = rule.contentName;
				// TODO: if both, we don't resolve the conflict. contentName always wins
				var scope = contentName || name;
				if (scope) {
					this.addScope(scopes, node, start, end, contentName || name);
					break;
				}
				node = node.parent;
			}
		},
		// We know node intersects line somehow. Figure out how and apply the relevant styles
		// only for begin/endCaptures, and match rules.
		// claimedRegions records what portion of line this rule applies to
		styleDirect: function(/**Array*/ scopes, /**Array*/ claimedRegions, /**BeginEndNode*/ node, lineStart, lineEnd) {
			var claimedRegion;
			var matchRuleStart, matchRuleEnd;
			if (node instanceof this.BeginEndNode) {
				// if we start on this line, apply our beginCaptures
				// if we end on this line, apply our endCaptures
				var rule = node.rule.rule;
				var start0 = node.start,
				    start1 = node.start + node.beginMatch[0].length,
				    end0 = (node.endMatch && node.endMatch.index) || node.end,
				    end1 = node.end;
				var beginCaptures = rule.beginCaptures,
				    endCaptures = rule.endCaptures,
				    captures = rule.captures;
				var beginsOnLine = lineStart <= start0 && start1 <= lineEnd,
				   endsOnLine = lineStart <= end0 && end1 <= lineEnd;
				if (beginsOnLine) {
					claimedRegion = {start: start0, end: Math.min(end1, lineEnd)};
					matchRuleStart = start1;
					matchRuleEnd = Math.min(end0, lineEnd);
					this.addScopeForCaptures(scopes, node, start0, start1, node.beginMatch, beginCaptures || captures);
				}
				if (endsOnLine) {
					claimedRegion = {start: Math.max(start0, lineStart), end: end1};
					matchRuleStart = Math.max(start1, lineStart);
					matchRuleEnd = end0;
					this.addScopeForCaptures(scopes, node, end0, end1, node.endMatch, endCaptures || captures);
				}
				if (!beginsOnLine && !endsOnLine) {
					claimedRegion = {start: lineStart, end: lineEnd};
					matchRuleStart = lineStart;
					matchRuleEnd = lineEnd;
				}
			} else {
				matchRuleStart = lineStart;
				matchRuleEnd = lineEnd;
				throw new Error("Shouldn't get here--toplevel handled elsewhere");
			}
			// This begin/end rule claims a region of the line
			claimedRegion.node = node;
			claimedRegions.push(claimedRegion);
			
			// Now apply our "match" rules to the available area on this line.
			// TODO: this is probably wrong if we don't end on this line but another Begin/End node does.. oh well.
			this.styleFromMatchRules(scopes, node, matchRuleStart, matchRuleEnd);
		},
		// Styles the region start..end by applying any "match"-subrules of node
		styleFromMatchRules: function(/**Array*/ scopes, /**BeginEndNode|ContainerNode*/node, start, end) {
			var model = this.editor.getModel(),
			    pos = start,
			    subrules = node.rule.subrules || [];
			for (var i=0, resetAt = -1; pos < end; ) {
				if (i === subrules.length) {
					if (resetAt === pos) {
						break;
					}
					resetAt = pos;
					i = 0;
					continue;
				}
				var sub = subrules[i];
				sub = sub._resolvedRule && sub._resolvedRule._typedRule;
				if (sub instanceof this.MatchRule) {
					var text = model.getText(pos, end);
					var match = this.exec(sub.matchRegex, text, pos);
					if (match) {
						pos = this.afterMatch(match);
						this.addScope(scopes, node, match.index, pos, sub.rule.name);
						i = 0; // match; start over from 0th subrule
						continue;
					}
				}
				i++;
			}
		},
		// fromNode: The BeginEndNode that contributed this scope region
		addScope: function(scopes, fromNode, start, end, scope) {
			if (!scope || start === end) { return; }
			scopes.push({start: start, end: end, scope: scope, from: fromNode});
		},
		addScopeForCaptures: function(scopes, fromNode, start, end, match, captures /*,newRegex, old2New*/) {
			if (!captures) { return; }
			this.addScope(scopes, fromNode, start, end, captures[0] && captures[0].name);
			// TODO: apply scopes captures[1..n] to matching groups [1]..[n] of match
//			for (var groupNum in captures) {
//				if (captures.hasOwnProperty(groupNum)) {
//					var scope = captures[groupNum].name;
//					var groupText = match[groupNum];
//					if (!scope || typeof(groupText) !== "string") {
//						continue;
//					}
//					//console.debug("TODO apply " + scope + " to '" + groupText + "'");
//					/* TODO: workaround for JS having no API for getting matching group start index
//					var newMatchRegex = parse regex, wrap every un-matching-paren'd term with matching parens
//					var old2New = object mapping group #s in regex to #s in newMatchRegex
//					// Match again against newRegex. Note that newMatch[0] is guaranteed to be start..end
//					newRegex.lastIndex = start;
//					var newMatch = newRegex.exec(match.input.substring(0, end+1));
//					newRegex.lastIndex = 0;
//					var groupRanges = sum up lengths of newMatch[1], newMatch[2], ... to get matching group ranges
//					for (var groupNum = 1; newMatch[groupNum]; groupNum++) {
//						var oldGroupNum = old2New[groupNum];
//						if (typeof(oldGroupNum) !== "undefined") {
//							var scope = captures[oldGroupNum].name;
//							ranges.push({start: groupStart, end: groupEnd, scope: scope});
//						}
//					}
//					*/
//				}
//			}
		},
		/** @returns {Node[]} In depth-first order */
		getIntersecting: function(start, end) {
			var result = [];
			var nodes = this._tree ? [this._tree] : [];
			while (nodes.length) {
				var n = nodes.pop();
				var visitChildren = false;
				if (n instanceof this.ContainerNode) {
					visitChildren = true;
				} else if (this.isDamaged(n, start, end)) {
					visitChildren = true;
					result.push(n);
				}
				if (visitChildren) {
					var len = n.children.length;
//					for (var i=len-1; i >= 0; i--) {
//						nodes.push(n.children[i]);
//					}
					for (var i=0; i < len; i++) {
						nodes.push(n.children[i]);
					}
				}
			}
			return result.reverse();
		},
		_onSelection: function(e) {
		},
		_onDestroy: function(/**eclipse.DestroyEvent*/ e) {
			this.grammar = null;
			this._styles = null;
			this._tree = null;
		},
		/**
		 * Applies the grammar to obtain the {@link eclipse.StyleRange[]} for the given line.
		 * @returns eclipse.StyleRange[]
		 */
		toStyleRanges: function(/**ScopeRange[]*/ scopeRanges) {
			var styleRanges = [];
			for (var i=0; i < scopeRanges.length; i++) {
				var scopeRange = scopeRanges[i];
				var classNames = this._styles[scopeRange.scope];
				if (!classNames) { throw new Error("styles not found for " + scopeRange.scope); }
				var classNamesString = classNames.join(" ");
				styleRanges.push({start: scopeRange.start, end: scopeRange.end, style: {styleClass: classNamesString}});
//				console.debug("{start " + styleRanges[i].start + ", end " + styleRanges[i].end + ", style: " + styleRanges[i].style.styleClass + "}");
			}
			return styleRanges;
		}
	});
	return TextMateStyler;
}());

return orion.styler;	
});
