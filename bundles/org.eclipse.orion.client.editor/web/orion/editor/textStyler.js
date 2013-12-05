/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 *               Alex Lakatos - fix for bug#369781
 ******************************************************************************/

/*global define */

define("orion/editor/textStyler", [ //$NON-NLS-0$
	'orion/editor/annotations', //$NON-NLS-0$
	'orion/editor/keywords' //$NON-NLS-0$
], function(mAnnotations, mKeywords) {

	var UNKOWN = 1;
	var KEYWORD = 2;
	var NUMBER = 3;
	var STRING = 4;
	var MULTILINE_STRING = 5;
	var SINGLELINE_COMMENT = 6;
	var MULTILINE_COMMENT = 7;
	var DOC_COMMENT = 8;
	var WHITE = 9;
	var WHITE_TAB = 10;
	var WHITE_SPACE = 11;
	var HTML_MARKUP = 12;
	var DOC_TAG = 13;
	var TASK_TAG = 14;

	// Styles
	var singleCommentStyle = {styleClass: "token_singleline_comment"}; //$NON-NLS-0$
	var multiCommentStyle = {styleClass: "token_multiline_comment"}; //$NON-NLS-0$
	var docCommentStyle = {styleClass: "token_doc_comment"}; //$NON-NLS-0$
	var htmlMarkupStyle = {styleClass: "token_doc_html_markup"}; //$NON-NLS-0$
	var tasktagStyle = {styleClass: "token_task_tag"}; //$NON-NLS-0$
	var doctagStyle = {styleClass: "token_doc_tag"}; //$NON-NLS-0$
	var stringStyle = {styleClass: "token_string"}; //$NON-NLS-0$
	var numberStyle = {styleClass: "token_number"}; //$NON-NLS-0$
	var keywordStyle = {styleClass: "token_keyword"}; //$NON-NLS-0$
	var spaceStyle = {styleClass: "token_space", unmergeable: true}; //$NON-NLS-0$
	var tabStyle = {styleClass: "token_tab", unmergeable: true}; //$NON-NLS-0$
	var caretLineStyle = {styleClass: "line_caret"}; //$NON-NLS-0$
	
	var styleMappings = {
		"UNKOWN": null,
		"KEYWORD": keywordStyle,
		"NUMBER": numberStyle,
		"STRING": stringStyle,
		"MULTILINE_STRING": stringStyle,
		"SINGLELINE_COMMENT": singleCommentStyle,
		"MULTILINE_COMMENT": multiCommentStyle,
		"DOC_COMMENT": docCommentStyle,
		"WHITE": spaceStyle,
		"WHITE_TAB": tabStyle,
		"WHITE_SPACE": spaceStyle,
		"HTML_MARKUP": htmlMarkupStyle,
		"DOC_TAG": doctagStyle,
		"TASK_TAG": tasktagStyle,
		"orion.enclosure.brace.start": {styleClass: "orion.enclosure.brace.start"},
		"orion.enclosure.brace.end": {styleClass: "orion.enclosure.brace.end"},
		"orion.enclosure.bracket.start": {styleClass: "orion.enclosure.bracket.start"},
		"orion.enclosure.bracket.end": {styleClass: "orion.enclosure.bracket.end"},
		"orion.enclosure.parenthesis.start": {styleClass: "orion.enclosure.parenthesis.start"},
		"orion.enclosure.parenthesis.end": {styleClass: "orion.enclosure.parenthesis.end"}
	};

	function TextStyler (view, annotationModel, patterns) {
		function createPattern(element) {
			var subPatterns = [];
			if (element.patterns) {
				element.patterns.forEach(function(current) {
					var subPattern = createPattern(current).line;
					if (subPattern) {
						subPatterns.push(subPattern);
					}
				});
			}
			var result = {};
			if (element.match && !element.begin && !element.end && element.name) {
				result.line = {regex: new RegExp(element.match, "g"), name: element.name};
				if (subPatterns.length) {
					result.line.patterns = subPatterns;
				}
			} else if (!element.match && element.begin && element.end && element.name) {
				result.document = result.line = {regexBegin: new RegExp(element.begin, "g"), regexEnd: new RegExp(element.end, "g"), name: element.name};
				if (subPatterns.length) {
					result.document.patterns = subPatterns;
				}
			}
			return result;
		}

		this.linePatterns = [];
		this.documentPatterns = [];
		this.enclosurePatterns = {};
		patterns.forEach(function(current) {
			var pattern = createPattern(current);
			if (pattern) {
				if (pattern.line) {
					this.linePatterns.push(pattern.line);
					if (pattern.line.name.indexOf("orion.enclosure") === 0 && (pattern.line.name.indexOf(".start") !== -1 || pattern.line.name.indexOf(".end") !== -1)) {
						this.enclosurePatterns[pattern.line.name] = pattern.line;
					}
				}
				if (pattern.document) {
					this.documentPatterns.push(pattern.document);
				}
			}
		}.bind(this));

		this.whitespacesVisible = this.spacesVisible = this.tabsVisible = false;
		this.spacePattern = {regex: new RegExp(" ", "g"), name: "WHITE_SPACE", isWhitespace: true};
		this.tabPattern = {regex: new RegExp("\t", "g"), name: "WHITE_TAB", isWhitespace: true};

		this.detectHyperlinks = true;
		this.highlightCaretLine = false;
		this.foldingEnabled = true;
		this.detectTasks = true;
		this.view = view;
		this.annotationModel = annotationModel;
		this._bracketAnnotations = undefined;

		var self = this;
		this._listener = {
			onChanged: function(e) {
				self._onModelChanged(e);
			},
			onDestroy: function(e) {
				self._onDestroy(e);
			},
			onLineStyle: function(e) {
				self._onLineStyle(e);
			},
			onMouseDown: function(e) {
				self._onMouseDown(e);
			},
			onSelection: function(e) {
				self._onSelection(e);
			}
		};
		var model = view.getModel();
		if (model.getBaseModel) {
			model = model.getBaseModel();
		}
		model.addEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
		view.addEventListener("MouseDown", this._listener.onMouseDown); //$NON-NLS-0$
		view.addEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
		view.addEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
		view.addEventListener("LineStyle", this._listener.onLineStyle); //$NON-NLS-0$
		this._computeComments ();
		this._computeFolding();
		view.redrawLines();
	}

	TextStyler.prototype = {
		destroy: function() {
			var view = this.view;
			if (view) {
				var model = view.getModel();
				if (model.getBaseModel) {
					model = model.getBaseModel();
				}
				model.removeEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
				view.removeEventListener("MouseDown", this._listener.onMouseDown); //$NON-NLS-0$
				view.removeEventListener("Selection", this._listener.onSelection); //$NON-NLS-0$
				view.removeEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
				view.removeEventListener("LineStyle", this._listener.onLineStyle); //$NON-NLS-0$
				this.view = null;
			}
		},
		setHighlightCaretLine: function(highlight) {
			this.highlightCaretLine = highlight;
		},
		setWhitespacesVisible: function(visible, redraw) {
			if (this.whitespacesVisible === visible) { return; }
			this.whitespacesVisible = visible;
			if (redraw) {
				this.view.redraw();
			}
		},
		setTabsVisible: function(visible) {
			if (this.tabsVisible === visible) { return; }
			this.tabsVisible = visible;
			this.setWhitespacesVisible(this.tabsVisible || this.spacesVisible, false);
			this.view.redraw();
		},
		setSpacesVisible: function(visible) {
			if (this.spacesVisible === visible) { return; }
			this.spacesVisible = visible;
			this.setWhitespacesVisible(this.tabsVisible || this.spacesVisible, false);
			this.view.redraw();
		},
		setDetectHyperlinks: function(enabled) {
			this.detectHyperlinks = enabled;
		},
		setFoldingEnabled: function(enabled) {
			this.foldingEnabled = enabled;
		},
		setDetectTasks: function(enabled) {
			this.detectTasks = enabled;
		},
		_binarySearch: function (array, offset, inclusive, low, high) {
			var index;
			if (low === undefined) { low = -1; }
			if (high === undefined) { high = array.length; }
			while (high - low > 1) {
				index = Math.floor((high + low) / 2);
				if (offset <= array[index].start) {
					high = index;
				} else if (inclusive && offset < array[index].end) {
					high = index;
					break;
				} else {
					low = index;
				}
			}
			return high;
		},
		_computeComments: function() {
			var model = this.view.getModel();
			if (model.getBaseModel) { model = model.getBaseModel(); }
			this.comments = this._findComments(model.getText(), model);
		},
		_computeFolding: function() {
			if (!this.foldingEnabled) { return; }
			var view = this.view;
			var viewModel = view.getModel();
			if (!viewModel.getBaseModel) { return; }
			var annotationModel = this.annotationModel;
			if (!annotationModel) { return; }
			annotationModel.removeAnnotations(mAnnotations.AnnotationType.ANNOTATION_FOLDING);
			var add = [];
			var baseModel = viewModel.getBaseModel();
			var comments = this.comments;
			for (var i=0; i<comments.length; i++) {
				var comment = comments[i];
				var annotation = this._createFoldingAnnotation(viewModel, baseModel, comment.start, comment.end);
				if (annotation) {
					add.push(annotation);
				}
			}
			annotationModel.replaceAnnotations(null, add);
		},
		_createFoldingAnnotation: function(viewModel, baseModel, start, end) {
			var startLine = baseModel.getLineAtOffset(start);
			var endLine = baseModel.getLineAtOffset(end);
			if (startLine === endLine) {
				return null;
			}
			return new (mAnnotations.AnnotationType.getType(mAnnotations.AnnotationType.ANNOTATION_FOLDING))(start, end, viewModel);
		},
		_computeTasks: function(offset, styles) {
			if (!this.detectTasks) { return; }
			var annotationModel = this.annotationModel;
			if (!annotationModel) { return; }

			var view = this.view;
			var viewModel = view.getModel(), baseModel = viewModel;
			if (viewModel.getBaseModel) { baseModel = viewModel.getBaseModel(); }
			var annotationType = mAnnotations.AnnotationType.ANNOTATION_TASK;
			var lineIndex = baseModel.getLineAtOffset(offset);
			var lineEnd = baseModel.getLineEnd(lineIndex);
			var annotations = annotationModel.getAnnotations(offset, lineEnd);
			var remove = [];
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (annotation.type === annotationType) {
					remove.push(annotation);
				}
			}

			var add = [];
			for (var i = 0; i < styles.length; i++) {
				var current = styles[i];
				if (current.style.styleClass === "token_task_tag") {
					/*
					 * If the content belonging to the task tag has been broken up by whitespace tokens
					 * then look at the subsequent tokens for consecutive whitespace+tag tokens, which
					 * should also be grouped with the current task token.
					 */
					var end = current.end;
					if (this._isRenderingWhitespace()) {
						while (i + 1 < styles.length && (styles[i + 1].isWhitespace || styles[i + 1].style.styleClass === "token_task_tag")) {
							end = styles[i + 1].end;
							i += 1;
						}
					}
					add.push(mAnnotations.AnnotationType.createAnnotation(annotationType, current.start, end, baseModel.getText(current.start, end)));
				}
			};
			annotationModel.replaceAnnotations(remove, add);
		},
		_getLineStyle: function(lineIndex) {
			if (this.highlightCaretLine) {
				var view = this.view;
				var model = view.getModel();
				var selection = view.getSelection();
				if (selection.start === selection.end && model.getLineAtOffset(selection.start) === lineIndex) {
					return caretLineStyle;
				}
			}
			return null;
		},
		_getStyles: function(model, text, start) {
			if (model.getBaseModel) {
				start = model.mapOffset(start);
			}
			var end = start + text.length;

			var styles = [];

			// for any sub range that is not a comment, parse code generating tokens (keywords, numbers, brackets, line comments, etc)
			var offset = start, comments = this.comments;
			var startIndex = this._binarySearch(comments, start, true);
			for (var i = startIndex; i < comments.length; i++) {
				if (comments[i].start >= end) { break; }
				var commentStart = comments[i].start;
				var commentEnd = comments[i].end;
				if (offset < commentStart) {
					this._parse(text.substring(offset - start, commentStart - start), offset, this.linePatterns, true, styles);
				}
				var type = comments[i].type;
				var style = styleMappings[type];
//				switch (type) {
//					case DOC_COMMENT: style = docCommentStyle; break;
//					case MULTILINE_COMMENT: style = multiCommentStyle; break;
//					case MULTILINE_STRING: style = stringStyle; break;
//				}
				var s = Math.max(offset, commentStart);
				var e = Math.min(end, commentEnd);
		//			styles.push({start: s, end: e, style: style});
//				if ((type === DOC_COMMENT || type === MULTILINE_COMMENT) && (this.whitespacesVisible || this.detectHyperlinks)) {
				var commentStyles = [];
					this._parseComment(text.substring(s - start, e - start), s, comments[i].patterns, commentStyles, style, type);
				var index = s;
				commentStyles.forEach(function(current) {
					if (current.start - index) {
						styles.push({start: index, end: current.start, style: style});
					}
					styles.push(current);
					index = current.end;
				});
				if (e - index) {
					styles.push({start: index, end: e, style: style});
				}
//				styles = styles.concat(commentStyles);
//				} else if (type === MULTILINE_STRING && this.whitespacesVisible) {
//					this._parseString(text.substring(s - start, e - start), s, styles, stringStyle);
//				} else {
//				}
				offset = commentEnd;
			}
			if (offset < end) {
				this._parse(text.substring(offset - start, end - start), offset, this.linePatterns, true, styles);
			}
			if (model.getBaseModel) {
				for (var j = 0; j < styles.length; j++) {
					var length = styles[j].end - styles[j].start;
					styles[j].start = model.mapOffset(styles[j].start, true);
					styles[j].end = styles[j].start + length;
				}
			}
			return styles;
		},
		_isRenderingWhitespace: function() {
			return this.whitespacesVisible && (this.tabsVisible || this.spacesVisible);
		},
		_mergeStyles: function(fullStyle, substyles, resultStyles) {
			var i = fullStyle.start;
			substyles.forEach(function(current) {
				if (i < current.start) {
					resultStyles.push({start: i, end: current.start, style: fullStyle.style});
				}
				resultStyles.push(current);
				i = current.end;
			});
			if (i < fullStyle.end) {
				resultStyles.push({start: i, end: fullStyle.end, style: fullStyle.style});
			}
		},
		_parse: function(text, offset, patterns, isForRendering, styles, parentMatch) {
			/*
			 * If _parse() is being invoked for some purpose other than the creation of styles to be
			 * rendered then passing false for isForRendering can be used as a performance optimization,
			 * which skips the consideration of whitespace patterns and pattern subpatterns.
			 */

			if (!patterns) {
				return;
			}

			if (isForRendering && this._isRenderingWhitespace()) {
				var temp = patterns.slice(0);
				if (this.tabsVisible) {
					temp.push(this.tabPattern);
				}
				if (this.spacesVisible) {
					temp.push(this.spacePattern);
				}
				patterns = temp;
			}

			var matches = [];
			patterns.forEach(function(current) {
				var regex = current.regex || current.regexBegin;
				regex.oldLastIndex = regex.lastIndex;
				regex.lastIndex = 0;
				var result = regex.exec(text);
				if (result) {
					matches.push({result: result, pattern: current});
				}
			}.bind(this));
			matches.sort(function(a,b) {
				if (a.result.index < b.result.index) {
					return -1;
				}
				if (a.result.index > b.result.index) {
					return 1;
				}
				return 0;
			});

			var index = 0;
			while (matches.length > 0) {
				var current = matches[0];
				matches.splice(0,1);

				if (current.result.index < index) {
					/* processing of another match has moved index beyond this match */
					this._updateMatch(current, text, matches, index);
					continue;
				}

				/* apply the style */
				var start = offset + current.result.index;
				var end, result;
				if (current.pattern.regex) {
					/* regex defined by a "match" */
					result = current.result;
					end = start + result[0].length;
				} else {
					/* regex defined by a "begin/end" pair */
					current.pattern.regexEnd.lastIndex = current.result.index + current.result[0].length;
					result = current.pattern.regexEnd.exec(text);
					if (!result) {
						result = new RegExp("$").exec(text);
					}
					end = offset + result.index + result[0].length;
				}
				var tokenStyle = {start: start, end: end, style: styleMappings[current.pattern.name || "UNKOWN"], isWhitespace: current.pattern.isWhitespace};
				if (isForRendering) {
					var substyles = [];
					if (current.pattern.patterns) {
						this._parse(text.substring(start, end), start, current.pattern.patterns, true, substyles, current);
						this._mergeStyles(tokenStyle, substyles, styles);
					} else {
						/* if whitespaces are being shown then invoke _parse on leaf values in order to mark whitespace within them */
						if (this._isRenderingWhitespace() && !current.pattern.isWhitespace) {
							this._parse(text.substring(start, end), start, [], true, substyles, current);
							this._mergeStyles(tokenStyle, substyles, styles);
						} else {
							styles.push(tokenStyle);
						}
					}
				} else {
					styles.push(tokenStyle);
				}
				index = result.index + result[0].length;
				this._updateMatch(current, text, matches);
			}
			if (isForRendering && !parentMatch) {
				this._computeTasks(offset, styles);
			}
			patterns.forEach(function(current) {
				var regex = current.regex || current.regexBegin;
				regex.lastIndex = regex.oldLastIndex;
			}.bind(this));
		},
		_parseComment: function(text, offset, subPatterns, styles, s, type) {
			// TODO support multi-line sub-patterns
			var lines = text.split('\n');
			lines.forEach(function(current) {
				this._parse(current, offset, subPatterns, true, styles);
				offset += current.length;
			}.bind(this));
		},
		_updateMatch: function(match, text, matches, minimumIndex) {
			var regEx = match.pattern.regex ? match.pattern.regex : match.pattern.regexBegin;
			if (minimumIndex) {
				regEx.lastIndex = minimumIndex;
			}
			var result = regEx.exec(text);
			if (result) {
				match.result = result;
				for (var i = 0; i < matches.length; i++) {
					if (result.index <= matches[i].result.index) {
						matches.splice(i, 0, match);
						return;
					}
				}
				matches.push(match);
			}
		},
		_detectHyperlinks: function(text, offset, styles, s) {
			var href = null, index, linkStyle;
			if ((index = text.indexOf("://")) > 0) { //$NON-NLS-0$
				href = text;
				var start = index;
				while (start > 0) {
					var c = href.charCodeAt(start - 1);
					if (!((97 <= c && c <= 122) || (65 <= c && c <= 90) || 0x2d === c || (48 <= c && c <= 57))) { //LETTER OR DASH OR NUMBER
						break;
					}
					start--;
				}
				if (start > 0) {
					var brackets = "\"\"''(){}[]<>"; //$NON-NLS-0$
					index = brackets.indexOf(href.substring(start - 1, start));
					if (index !== -1 && (index & 1) === 0 && (index = href.lastIndexOf(brackets.substring(index + 1, index + 2))) !== -1) {
						var end = index;
						linkStyle = this._clone(s);
						linkStyle.tagName = "a"; //$NON-NLS-0$
						linkStyle.attributes = {href: href.substring(start, end)};
						styles.push({start: offset, end: offset + start, style: s});
						styles.push({start: offset + start, end: offset + end, style: linkStyle});
						styles.push({start: offset + end, end: offset + text.length, style: s});
						return null;
					}
				}
			} else if (text.toLowerCase().indexOf("bug#") === 0) { //$NON-NLS-0$
				href = "https://bugs.eclipse.org/bugs/show_bug.cgi?id=" + parseInt(text.substring(4), 10); //$NON-NLS-0$
			}
			if (href) {
				linkStyle = this._clone(s);
				linkStyle.tagName = "a"; //$NON-NLS-0$
				linkStyle.attributes = {href: href};
				return linkStyle;
			}
			return s;
		},
		_clone: function(obj) {
			if (!obj) { return obj; }
			var newObj = {};
			for (var p in obj) {
				if (obj.hasOwnProperty(p)) {
					var value = obj[p];
					newObj[p] = value;
				}
			}
			return newObj;
		},
		_findComments: function(text, model, offset) {
			offset = offset || 0;

			var matches = [];
			this.documentPatterns.forEach(function(current) {
				current.regexBegin.lastIndex = current.regexEnd.lastIndex = 0;
				var result = current.regexBegin.exec(text);
				if (result) {
					matches.push({result: result, pattern: current});
				}
			}.bind(this));
			matches.sort(function(a,b) {
				if (a.result.index < b.result.index) {
					return -1;
				}
				if (a.result.index > b.result.index) {
					return 1;
				}
				return 0;
			});
			
			if (!matches.length) {
				return matches;
			}

			var index = 0;
			var results = [];
			while (matches.length > 0) {
				var current = matches[0];
				matches.splice(0,1);

				if (current.result.index < index) {
					/* processing of another match has moved index beyond this match */
					this._updateMatch(current, text, matches, index);
					continue;
				}

				 /* verify that the begin match is valid (eg.- is not within a string, etc.) */
				var lineIndex = model.getLineAtOffset(offset + current.result.index);
				var lineText = model.getLine(lineIndex);
				var styles = [];
				this._parse(lineText, model.getLineStart(lineIndex), this.linePatterns, false, styles);
				var targetOffset = offset + current.result.index;
				for (var i = 0; i < styles.length; i++) {
					if (styles[i].start === targetOffset) {
						/* found it, now determine the end */
						current.pattern.regexEnd.lastIndex = current.result.index + current.result[0].length;
						var resultEnd = current.pattern.regexEnd.exec(text);
						if (resultEnd) {
							results.push({
								start: targetOffset,
								end: offset + resultEnd.index + resultEnd[0].length,
								type: current.pattern.name,
								patterns: current.pattern.patterns
							});
							index = resultEnd.index + resultEnd[0].length;
						}
						break;
					}
				}
				this._updateMatch(current, text, matches);
			}
			return results;
		},
		_findMatchingBracket: function(model, offset) {
			var lineIndex = model.getLineAtOffset(offset);
			var lineEnd = model.getLineEnd(lineIndex);
			var text = model.getText(offset, lineEnd);

			var match;
			var keys = Object.keys(this.enclosurePatterns);
			for (var i = 0; i < keys.length; i++) {
				var current = this.enclosurePatterns[keys[i]];
				current.regex.lastIndex = 0;
				var result = current.regex.exec(text);
				if (result && result.index === 0) {
					match = current;
					break;
				}
			}
			if (!match) { return -1; }

			var closingName;
			var onEnclosureStart = false;
			if (match.name.indexOf(".start") !== -1) {
				onEnclosureStart = true;
				closingName = match.name.replace(".start", ".end");
			} else {
				closingName = match.name.replace(".end", ".start");
			}
			var closingBracket = this.enclosurePatterns[closingName];
			if (!closingBracket) { return -1; }

			var lineText = model.getLine(lineIndex);
			var lineStart = model.getLineStart(lineIndex);
			var brackets = this._findBrackets(match, closingBracket, lineText, lineStart, lineEnd);
			for (i = 0; i < brackets.length; i++) {
				var sign = brackets[i] >= 0 ? 1 : -1;
				if (brackets[i] * sign - 1 === offset) {
					var level = 1;
					if (!onEnclosureStart) {
						i--;
						for (; i>=0; i--) {
							sign = brackets[i] >= 0 ? 1 : -1;
							level += sign;
							if (level === 0) {
								return brackets[i] * sign - 1;
							}
						}
						lineIndex -= 1;
						while (lineIndex >= 0) {
							lineText = model.getLine(lineIndex);
							lineStart = model.getLineStart(lineIndex);
							lineEnd = model.getLineEnd(lineIndex);
							brackets = this._findBrackets(match, closingBracket, lineText, lineStart, lineEnd);
							for (var j = brackets.length - 1; j >= 0; j--) {
								sign = brackets[j] >= 0 ? 1 : -1;
								level += sign;
								if (level === 0) {
									return brackets[j] * sign - 1;
								}
							}
							lineIndex--;
						}
					} else {
						i++;
						for (; i<brackets.length; i++) {
							sign = brackets[i] >= 0 ? 1 : -1;
							level += sign;
							if (level === 0) {
								return brackets[i] * sign - 1;
							}
						}
						lineIndex += 1;
						var lineCount = model.getLineCount ();
						while (lineIndex < lineCount) {
							lineText = model.getLine(lineIndex);
							lineStart = model.getLineStart(lineIndex);
							lineEnd = model.getLineEnd(lineIndex);
							brackets = this._findBrackets(match, closingBracket, lineText, lineStart, lineEnd);
							for (var k=0; k<brackets.length; k++) {
								sign = brackets[k] >= 0 ? 1 : -1;
								level += sign;
								if (level === 0) {
									return brackets[k] * sign - 1;
								}
							}
							lineIndex++;
						}
					}
					break;
				}
			}
			return -1;
		},
		_findBrackets: function(bracket, closingBracket, text, start, end) {
			var result = [], styles = [];
			// for any sub range that is not a comment, parse code generating tokens (keywords, numbers, brackets, line comments, etc)
			var offset = start, comments = this.comments;
			var startIndex = this._binarySearch(comments, start, true);
			for (var i = startIndex; i < comments.length; i++) {
				if (comments[i].start >= end) { break; }
				var commentStart = comments[i].start;
				var commentEnd = comments[i].end;
				if (offset < commentStart) {
					this._parse(text.substring(offset - start, commentStart - start), offset, this.linePatterns, false, styles);
					styles.forEach(function(current) {
						if (current.style.styleClass.indexOf(bracket.name) === 0) {
							result.push(current.start + 1);
						} else if (current.style.styleClass.indexOf(closingBracket.name) === 0) {
							result.push(-(current.start + 1));
						}
					});
					styles = [];
				}
				offset = commentEnd;
			}
			if (offset < end) {
				this._parse(text.substring(offset - start, end - start), offset, this.linePatterns, false, styles);
				styles.forEach(function(current) {
					if (current.style.styleClass.indexOf(bracket.name) === 0) {
						result.push(current.start + 1);
					} else if (current.style.styleClass.indexOf(closingBracket.name) === 0) {
						result.push(-(current.start + 1));
					}
				});
			}
			return result;
		},
		_onDestroy: function(e) {
			this.destroy();
		},
		_onLineStyle: function (e) {
			if (e.textView === this.view) {
				e.style = this._getLineStyle(e.lineIndex);
			}
			e.ranges = this._getStyles(e.textView.getModel(), e.lineText, e.lineStart);
		},
		_onSelection: function(e) {
			var oldSelection = e.oldValue;
			var newSelection = e.newValue;
			var view = this.view;
			var model = view.getModel();
			var lineIndex;
			if (this.highlightCaretLine) {
				var oldLineIndex = model.getLineAtOffset(oldSelection.start);
				lineIndex = model.getLineAtOffset(newSelection.start);
				var newEmpty = newSelection.start === newSelection.end;
				var oldEmpty = oldSelection.start === oldSelection.end;
				if (!(oldLineIndex === lineIndex && oldEmpty && newEmpty)) {
					if (oldEmpty) {
						view.redrawLines(oldLineIndex, oldLineIndex + 1);
					}
					if ((oldLineIndex !== lineIndex || !oldEmpty) && newEmpty) {
						view.redrawLines(lineIndex, lineIndex + 1);
					}
				}
			}
			if (!this.annotationModel) { return; }
			var remove = this._bracketAnnotations, add, caret;
			if (newSelection.start === newSelection.end && (caret = view.getCaretOffset()) > 0) {
				var mapCaret = caret - 1;
				if (model.getBaseModel) {
					mapCaret = model.mapOffset(mapCaret);
					model = model.getBaseModel();
				}
				var bracket = this._findMatchingBracket(model, mapCaret);
				if (bracket !== -1) {
					add = [
						mAnnotations.AnnotationType.createAnnotation(mAnnotations.AnnotationType.ANNOTATION_MATCHING_BRACKET, bracket, bracket + 1),
						mAnnotations.AnnotationType.createAnnotation(mAnnotations.AnnotationType.ANNOTATION_CURRENT_BRACKET, mapCaret, mapCaret + 1)
					];
				}
			}
			this._bracketAnnotations = add;
			this.annotationModel.replaceAnnotations(remove, add);
		},
		_onMouseDown: function(e) {
			if (e.clickCount !== 2) { return; }
			var view = this.view;
			var model = view.getModel();
			var offset = view.getOffsetAtLocation(e.x, e.y);
			if (offset > 0) {
				var mapOffset = offset - 1;
				var baseModel = model;
				if (model.getBaseModel) {
					mapOffset = model.mapOffset(mapOffset);
					baseModel = model.getBaseModel();
				}
				var bracket = this._findMatchingBracket(baseModel, mapOffset);
				if (bracket !== -1) {
					e.preventDefault();
					var mapBracket = bracket;
					if (model.getBaseModel) {
						mapBracket = model.mapOffset(mapBracket, true);
					}
					if (offset > mapBracket) {
						offset--;
						mapBracket++;
					}
					view.setSelection(mapBracket, offset);
				}
			}
		},
		_onModelChanged: function(e) {
			var start = e.start;
			var removedCharCount = e.removedCharCount;
			var addedCharCount = e.addedCharCount;
			var changeCount = addedCharCount - removedCharCount;
			var view = this.view;
			var viewModel = view.getModel();
			var baseModel = viewModel.getBaseModel ? viewModel.getBaseModel() : viewModel;
			var end = start + removedCharCount;
			var charCount = baseModel.getCharCount();
			var commentCount = this.comments.length;
			var lineStart = baseModel.getLineStart(baseModel.getLineAtOffset(start));
			var commentStart = this._binarySearch(this.comments, lineStart, true);
			var commentEnd = this._binarySearch(this.comments, end, false, commentStart - 1, commentCount);

			var ts;
			if (commentStart < commentCount && this.comments[commentStart].start <= lineStart && lineStart < this.comments[commentStart].end) {
				ts = this.comments[commentStart].start;
				if (ts > start) { ts += changeCount; }
			} else {
				if (commentStart === commentCount && commentCount > 0 && charCount - changeCount === this.comments[commentCount - 1].end) {
					ts = this.comments[commentCount - 1].start;
				} else {
					ts = lineStart;
				}
			}
			var te;
			if (commentEnd < commentCount) {
				te = this.comments[commentEnd].end;
				if (te > start) { te += changeCount; }
				commentEnd += 1;
			} else {
				commentEnd = commentCount;
				te = charCount;//TODO could it be smaller?
			}
			var text = baseModel.getText(ts, te), comment;
			var newComments = this._findComments(text, baseModel, ts), i;
			for (i = commentStart; i < this.comments.length; i++) {
				comment = this.comments[i];
				if (comment.start > start) { comment.start += changeCount; }
				if (comment.start > start) { comment.end += changeCount; }
			}
			var redraw = (commentEnd - commentStart) !== newComments.length;
			if (!redraw) {
				for (i=0; i<newComments.length; i++) {
					comment = this.comments[commentStart + i];
					var newComment = newComments[i];
					if (comment.start !== newComment.start || comment.end !== newComment.end || comment.type !== newComment.type) {
						redraw = true;
						break;
					}
				}
			}
			var args = [commentStart, commentEnd - commentStart].concat(newComments);
			Array.prototype.splice.apply(this.comments, args);
			if (redraw) {
				var redrawStart = ts;
				var redrawEnd = te;
				if (viewModel !== baseModel) {
					redrawStart = viewModel.mapOffset(redrawStart, true);
					redrawEnd = viewModel.mapOffset(redrawEnd, true);
				}
				view.redrawRange(redrawStart, redrawEnd);
			}

			if (this.foldingEnabled && baseModel !== viewModel && this.annotationModel) {
				var annotationModel = this.annotationModel;
				var iter = annotationModel.getAnnotations(ts, te);
				var remove = [], all = [];
				var annotation;
				while (iter.hasNext()) {
					annotation = iter.next();
					if (annotation.type === mAnnotations.AnnotationType.ANNOTATION_FOLDING) {
						all.push(annotation);
						for (i = 0; i < newComments.length; i++) {
							if (annotation.start === newComments[i].start && annotation.end === newComments[i].end) {
								break;
							}
						}
						if (i === newComments.length) {
							remove.push(annotation);
							annotation.expand();
						} else {
							var annotationStart = annotation.start;
							var annotationEnd = annotation.end;
							if (annotationStart > start) {
								annotationStart -= changeCount;
							}
							if (annotationEnd > start) {
								annotationEnd -= changeCount;
							}
							if (annotationStart <= start && start < annotationEnd && annotationStart <= end && end < annotationEnd) {
								var startLine = baseModel.getLineAtOffset(annotation.start);
								var endLine = baseModel.getLineAtOffset(annotation.end);
								if (startLine !== endLine) {
									if (!annotation.expanded) {
										annotation.expand();
									}
								} else {
									annotationModel.removeAnnotation(annotation);
								}
							}
						}
					}
				}
				var add = [];
				for (i = 0; i < newComments.length; i++) {
					comment = newComments[i];
					for (var j = 0; j < all.length; j++) {
						if (all[j].start === comment.start && all[j].end === comment.end) {
							break;
						}
					}
					if (j === all.length) {
						annotation = this._createFoldingAnnotation(viewModel, baseModel, comment.start, comment.end);
						if (annotation) {
							add.push(annotation);
						}
					}
				}
				annotationModel.replaceAnnotations(remove, add);
			}
		}
	};

	return {TextStyler: TextStyler};
});
