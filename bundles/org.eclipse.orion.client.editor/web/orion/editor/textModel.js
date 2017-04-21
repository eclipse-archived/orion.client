/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/
 
/*eslint-env browser, amd*/
define("orion/editor/textModel", ['orion/editor/eventTarget', 'orion/regex', 'orion/util'], function(mEventTarget, mRegex, util) {

	/**
	 * Constructs a new TextModel with the given text and default line delimiter.
	 *
	 * @param {String} [text=""] the text that the model will store
	 * @param {String} [lineDelimiter=platform delimiter] the line delimiter used when inserting new lines to the model.
	 *
	 * @name orion.editor.TextModel
	 * @class The TextModel is an interface that provides text for the view. Applications may
	 * implement the TextModel interface to provide a custom store for the view content. The
	 * view interacts with its text model in order to access and update the text that is being
	 * displayed and edited in the view. This is the default implementation.
	 * <p>
	 * <b>See:</b><br/>
	 * {@link orion.editor.TextView}<br/>
	 * {@link orion.editor.TextView#setModel}
	 * </p>
	 * @borrows orion.editor.EventTarget#addEventListener as #addEventListener
	 * @borrows orion.editor.EventTarget#removeEventListener as #removeEventListener
	 * @borrows orion.editor.EventTarget#dispatchEvent as #dispatchEvent
	 */
	function TextModel(text, lineDelimiter) {
		this._lastLineIndex = -1;
		this._text = [""];
		this._lineOffsets = [0];
		this.setText(text);
		this.setLineDelimiter(lineDelimiter);
	}

	TextModel.prototype = /** @lends orion.editor.TextModel.prototype */ {
		/**
		 * Destroys this text model.
		 */
		destroy: function() {
		},
		/**
		 * @class This object describes the options to use while finding occurrences of a string in a text model.
		 * @name orion.editor.FindOptions
		 *
		 * @property {String} string the search string to be found.
		 * @property {Boolean} [regex=false] whether or not the search string is a regular expression.
		 * @property {Boolean} [wrap=false] whether or not to wrap search.
		 * @property {Boolean} [wholeWord=false] whether or not to search only whole words.
		 * @property {Boolean} [caseInsensitive=false] whether or not search is case insensitive.
		 * @property {Boolean} [reverse=false] whether or not to search backwards.
		 * @property {Number} [start=0] The start offset to start searching
		 * @property {Number} [rangeStart] The range start offset of the search. Used to search in a given range.
		 * @property {Number} [rangeEnd] The range end offset of the search. Used to search in a given range.
		 */
		/**
		 * @class This object represents a find occurrences iterator.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.TextModel#find}<br/>
		 * </p>		 
		 * @name orion.editor.FindIterator
		 * 
		 * @property {Function} hasNext Determines whether there are more occurrences in the iterator.
		 * @property {Function} next Returns the next matched range {start,end} in the iterator.
		 */	
		/**
		 * Finds occurrences of a string in the text model.
		 *
		 * @param {orion.editor.FindOptions} options the search options
		 * @return {orion.editor.FindIterator} the find occurrences iterator.
		 */
		find: function(options) {
			if (this._text.length > 1) {
				this._text = [this._text.join("")];
			}
			var string = options.string;
			var regex = options.regex;
			var pattern = string;
			var flags = "";
			var caseInsensitive = options.caseInsensitive;
			if (pattern) {
				if (regex) {
					var parsed = mRegex.parse(pattern);
					if (parsed) {
						pattern = parsed.pattern;
						flags = parsed.flags;
					}
				} else {
					pattern = string.replace(/([\\$\^*\/+?\.\(\)|{}\[\]])/g, "\\$&"); //$NON-NLS-0$
					/*
					* Bug in JS RegEx. In a Turkish locale, dotless i (u0131) capitalizes to I (u0049) and i (u0069) 
					* capitalizes to dot I (u0130). The JS RegEx does not match correctly the Turkish i's in case
					* insensitive mode. The fix is to detect the presence of Turkish i's in the search pattern and 
					* to modify the pattern to search for both upper and lower case.
					*/
					if (caseInsensitive) {
						pattern = pattern.replace(/[iI\u0130\u0131]/g, "[Ii\u0130\u0131]"); //$NON-NLS-0$
					}
				}
			}
			var current = null, skip;
			if (pattern) {
				var reverse = options.reverse;
				var wrap = options.wrap;
				var wholeWord = options.wholeWord;
				var start = options.start || 0;
				var rangeStart = options.rangeStart;
				var rangeEnd = options.rangeEnd;
				var isRange = rangeStart !== null && rangeStart !== undefined && rangeEnd !== null && rangeEnd !== undefined;
				if (flags.indexOf("g") === -1) { flags += "g"; } //$NON-NLS-1$ //$NON-NLS-2$
				if (flags.indexOf("m") === -1) { flags += "m"; } //$NON-NLS-1$ //$NON-NLS-2$
				if (caseInsensitive) {
					if (flags.indexOf("i") === -1) { flags += "i"; } //$NON-NLS-1$ //$NON-NLS-2$
				}
				if (wholeWord) {
					pattern = "\\b" + pattern + "\\b"; //$NON-NLS-1$ //$NON-NLS-2$
				}
				var text = this._text[0], result, lastIndex, offset = 0;
				if (isRange) {
					var s = rangeStart < rangeEnd ? rangeStart : rangeEnd;
					var e = rangeStart < rangeEnd ? rangeEnd : rangeStart;
					text = text.substring(s, e);
					offset = s;
				}
				var re = new RegExp(pattern, flags);
				if (reverse) {
					skip = function() {
						var match = null;
						re.lastIndex = 0;
						while (true) {
							lastIndex = re.lastIndex;
							result = re.exec(text);
							if (lastIndex === re.lastIndex) {
								return null;
							}
							if (result) {
								if (result.index + offset < start) {
									match = {start: result.index + offset, end: re.lastIndex + offset};
								} else {
									if (!wrap || match) {
										break;
									}
									start = text.length + offset;
									match = {start: result.index + offset, end: re.lastIndex + offset};
								}
							} else {
								break;
							}
						}
						if (match) { start = match.start; }
						return match;
					};
				} else {
					re.lastIndex = start - offset;
					skip = function() {
						while (true) {
							lastIndex = re.lastIndex;
							result = re.exec(text);
							if (lastIndex === re.lastIndex) {
								return null;
							}
							if (result) {
								return {start: result.index + offset, end: re.lastIndex + offset};
							}
							if (lastIndex !== 0) {
								if (wrap) {
									continue;
								}
							}
							break;
						}
						return null;
					};
				}
				current = skip();
			}
			return {
				/**
				 * @callback 
				 */
				next: function() {
					var result = current;
					if (result) { current = skip(); }
					return result;					
				},
				/**
				 * @callback 
				 */
				hasNext: function() {
					return current !== null;
				}
			};
		},
		/**
		 * Returns the number of characters in the model.
		 *
		 * @returns {Number} the number of characters in the model.
		 */
		getCharCount: function() {
			var count = 0;
			for (var i = 0; i<this._text.length; i++) {
				count += this._text[i].length;
			}
			return count;
		},
		/**
		 * Returns the text of the line at the given index.
		 * <p>
		 * The valid indices are 0 to line count exclusive.  Returns <code>null</code> 
		 * if the index is out of range. 
		 * </p>
		 *
		 * @param {Number} lineIndex the zero based index of the line.
		 * @param {Boolean} [includeDelimiter=false] whether or not to include the line delimiter. 
		 * @returns {String} the line text or <code>null</code> if out of range.
		 *
		 * @see orion.editor.TextModel#getLineAtOffset
		 */
		getLine: function(lineIndex, includeDelimiter) {
			var lineCount = this.getLineCount();
			if (!(0 <= lineIndex && lineIndex < lineCount)) {
				return null;
			}
			var start = this._lineOffsets[lineIndex];
			if (lineIndex + 1 < lineCount) {
				var text = this.getText(start, this._lineOffsets[lineIndex + 1]);
				if (includeDelimiter) {
					return text;
				}
				var end = text.length, c;
				while (((c = text.charCodeAt(end - 1)) === 10) || (c === 13)) {
					end--;
				}
				return text.substring(0, end);
			} else {
				return this.getText(start); 
			}
		},
		/**
		 * Returns the line index at the given character offset.
		 * <p>
		 * The valid offsets are 0 to char count inclusive. The line index for
		 * char count is <code>line count - 1</code>. Returns <code>-1</code> if
		 * the offset is out of range.
		 * </p>
		 *
		 * @param {Number} offset a character offset.
		 * @returns {Number} the zero based line index or <code>-1</code> if out of range.
		 */
		getLineAtOffset: function(offset) {
			var charCount = this.getCharCount();
			if (!(0 <= offset && offset <= charCount)) {
				return -1;
			}
			var lineCount = this.getLineCount();
			if (offset === charCount) {
				return lineCount - 1; 
			}
			var lineStart, lineEnd;
			var index = this._lastLineIndex;
			if (0 <= index && index < lineCount) {
				lineStart = this._lineOffsets[index];
				lineEnd = index + 1 < lineCount ? this._lineOffsets[index + 1] : charCount;
				if (lineStart <= offset && offset < lineEnd) {
					return index;
				}
			}
			var high = lineCount;
			var low = -1;
			while (high - low > 1) {
				index = Math.floor((high + low) / 2);
				lineStart = this._lineOffsets[index];
				lineEnd = index + 1 < lineCount ? this._lineOffsets[index + 1] : charCount;
				if (offset <= lineStart) {
					high = index;
				} else if (offset < lineEnd) {
					high = index;
					break;
				} else {
					low = index;
				}
			}
			this._lastLineIndex = high;
			return high;
		},
		/**
		 * Returns the number of lines in the model.
		 * <p>
		 * The model always has at least one line.
		 * </p>
		 *
		 * @returns {Number} the number of lines.
		 */
		getLineCount: function() {
			return this._lineOffsets.length;
		},
		/**
		 * Returns the line delimiter that is used by the view
		 * when inserting new lines. New lines entered using key strokes 
		 * and paste operations use this line delimiter.
		 *
		 * @return {String} the line delimiter that is used by the view when inserting new lines.
		 */
		getLineDelimiter: function() {
			return this._lineDelimiter;
		},
		/**
		 * Returns the end character offset for the given line. 
		 * <p>
		 * The end offset is not inclusive. This means that when the line delimiter is included, the 
		 * offset is either the start offset of the next line or char count. When the line delimiter is
		 * not included, the offset is the offset of the line delimiter.
		 * </p>
		 * <p>
		 * The valid indices are 0 to line count exclusive.  Returns <code>-1</code> 
		 * if the index is out of range. 
		 * </p>
		 *
		 * @param {Number} lineIndex the zero based index of the line.
		 * @param {Boolean} [includeDelimiter=false] whether or not to include the line delimiter. 
		 * @return {Number} the line end offset or <code>-1</code> if out of range.
		 *
		 * @see orion.editor.TextModel#getLineStart
		 */
		getLineEnd: function(lineIndex, includeDelimiter) {
			var lineCount = this.getLineCount();
			if (!(0 <= lineIndex && lineIndex < lineCount)) {
				return -1;
			}
			if (lineIndex + 1 < lineCount) {
				var end = this._lineOffsets[lineIndex + 1];
				if (includeDelimiter) {
					return end;
				}
				var text = this.getText(Math.max(this._lineOffsets[lineIndex], end - 2), end);
				var i = text.length, c;
				while (((c = text.charCodeAt(i - 1)) === 10) || (c === 13)) {
					i--;
				}
				return end - (text.length - i);
			} else {
				return this.getCharCount();
			}
		},
		/**
		 * Returns the start character offset for the given line.
		 * <p>
		 * The valid indices are 0 to line count exclusive.  Returns <code>-1</code> 
		 * if the index is out of range. 
		 * </p>
		 *
		 * @param {Number} lineIndex the zero based index of the line.
		 * @return {Number} the line start offset or <code>-1</code> if out of range.
		 *
		 * @see orion.editor.TextModel#getLineEnd
		 */
		getLineStart: function(lineIndex) {
			if (!(0 <= lineIndex && lineIndex < this.getLineCount())) {
				return -1;
			}
			return this._lineOffsets[lineIndex];
		},
		/**
		 * Returns the text for the given range.
		 * <p>
		 * The end offset is not inclusive. This means that character at the end offset
		 * is not included in the returned text.
		 * </p>
		 *
		 * @param {Number} [start=0] the zero based start offset of text range.
		 * @param {Number} [end=char count] the zero based end offset of text range.
		 *
		 * @see orion.editor.TextModel#setText
		 */
		getText: function(start, end) {
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = this.getCharCount(); }
			if (start === end) { return ""; }
			var offset = 0, chunk = 0, length;
			while (chunk<this._text.length) {
				length = this._text[chunk].length; 
				if (start <= offset + length) { break; }
				offset += length;
				chunk++;
			}
			var firstOffset = offset;
			var firstChunk = chunk;
			while (chunk<this._text.length) {
				length = this._text[chunk].length; 
				if (end <= offset + length) { break; }
				offset += length;
				chunk++;
			}
			var lastOffset = offset;
			var lastChunk = chunk;

			// error check for invalid chunks of text
			if (firstChunk >= this._text.length || lastChunk >= this._text.length || firstChunk > lastChunk) {
				return "";
			}
			
			if (firstChunk === lastChunk) {
				return this._text[firstChunk].substring(start - firstOffset, end - lastOffset);
			}
			var beforeText = this._text[firstChunk].substring(start - firstOffset);
			var afterText = this._text[lastChunk].substring(0, end - lastOffset);
			return beforeText + this._text.slice(firstChunk+1, lastChunk).join("") + afterText; 
		},
		/**
		 * Notifies all listeners that the text is about to change.
		 * <p>
		 * This notification is intended to be used only by the view. Application clients should
		 * use {@link orion.editor.TextView#event:onModelChanging}.
		 * </p>
		 * <p>
		 * NOTE: This method is not meant to called directly by application code. It is called internally by the TextModel
		 * as part of the implementation of {@link #setText}. This method is included in the public API for documentation
		 * purposes and to allow integration with other toolkit frameworks.
		 * </p>
		 *
		 * @param {orion.editor.ModelChangingEvent} modelChangingEvent the changing event
		 */
		onChanging: function(modelChangingEvent) {
			return this.dispatchEvent(modelChangingEvent);
		},
		/**
		 * Notifies all listeners that the text has changed.
		 * <p>
		 * This notification is intended to be used only by the view. Application clients should
		 * use {@link orion.editor.TextView#event:onModelChanged}.
		 * </p>
		 * <p>
		 * NOTE: This method is not meant to called directly by application code. It is called internally by the TextModel
		 * as part of the implementation of {@link #setText}. This method is included in the public API for documentation
		 * purposes and to allow integration with other toolkit frameworks.
		 * </p>
		 *
		 * @param {orion.editor.ModelChangedEvent} modelChangedEvent the changed event
		 */
		onChanged: function(modelChangedEvent) {
			return this.dispatchEvent(modelChangedEvent);
		},
		/**
		 * Sets the line delimiter that is used by the view
		 * when new lines are inserted in the model due to key
		 * strokes and paste operations. The line delimiter of
		 * existing lines are unchanged unless the to <code>all</code>
		 * argument is <code>true</code>.
		 * <p>
		 * If lineDelimiter is "auto", the delimiter is computed to be
		 * the first delimiter found in the current text. If lineDelimiter
		 * is undefined or if there are no delimiters in the current text, the
		 * platform delimiter is used.
		 * </p>
		 *
		 * @param {String} lineDelimiter the line delimiter that is used by the view when inserting new lines.
		 * @param {Boolean} [all=false] whether or not the delimiter of existing lines are changed.
		 */
		setLineDelimiter: function(lineDelimiter, all) {
			if (lineDelimiter === "auto") {
				lineDelimiter = undefined;
				if (this.getLineCount() > 1) {
					lineDelimiter = this.getText(this.getLineEnd(0), this.getLineEnd(0, true));
				}
			}
			this._lineDelimiter = lineDelimiter ? lineDelimiter : util.platformDelimiter;
			if (all) {
				var lineCount = this.getLineCount();
				if (lineCount > 1) {
					var lines = new Array(lineCount);
					for (var i=0; i<lineCount; i++) {
						lines[i] = this.getLine(i);
					}
					this.setText(lines.join(this._lineDelimiter));
				}
			}
		},
		/**
		 * Replaces the text in the given range with the given text.
		 * <p>
		 * The end offset is not inclusive. This means that the character at the 
		 * end offset is not replaced.
		 * </p>
		 * <p>
		 * The text model must notify the listeners before and after the
		 * the text is changed by calling {@link #onChanging} and {@link #onChanged}
		 * respectively. 
		 * </p>
		 *
		 * @param {String} [text=""] the new text.
		 * @param {Number} [start=0] the zero based start offset of text range.
		 * @param {Number} [end=char count] the zero based end offset of text range.
		 *
		 * @see orion.editor.TextModel#getText
		 */
		setText: function(text, start, end) {
			if (text === undefined) { text = ""; }
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = this.getCharCount(); }
			if (start === end && text === "") { return; }
			var startLine = this.getLineAtOffset(start);
			var endLine = this.getLineAtOffset(end);
			var eventStart = start;
			var removedCharCount = end - start;
			var removedLineCount = endLine - startLine;
			var addedCharCount = text.length;
			var addedLineCount = 0;
			var lineCount = this.getLineCount();
			
			var cr = 0, lf = 0, index = 0;
			var newLineOffsets = [];
			while (true) {
				if (cr !== -1 && cr <= index) { cr = text.indexOf("\r", index); } //$NON-NLS-0$
				if (lf !== -1 && lf <= index) { lf = text.indexOf("\n", index); } //$NON-NLS-0$
				if (lf === -1 && cr === -1) { break; }
				if (cr !== -1 && lf !== -1) {
					if (cr + 1 === lf) {
						index = lf + 1;
					} else {
						index = (cr < lf ? cr : lf) + 1;
					}
				} else if (cr !== -1) {
					index = cr + 1;
				} else {
					index = lf + 1;
				}
				newLineOffsets.push(start + index);
				addedLineCount++;
			}
		
			var modelChangingEvent = {
				type: "Changing", //$NON-NLS-0$
				text: text,
				start: eventStart,
				removedCharCount: removedCharCount,
				addedCharCount: addedCharCount,
				removedLineCount: removedLineCount,
				addedLineCount: addedLineCount
			};
			this.onChanging(modelChangingEvent);
			
			var changedText = text;

			//TODO this should be done the loops below to avoid getText()
			if (newLineOffsets.length === 0) {
				var startLineOffset = this.getLineStart(startLine), endLineOffset;
				if (endLine + 1 < lineCount) {
					endLineOffset = this.getLineStart(endLine + 1);
				} else {
					endLineOffset = this.getCharCount();
				}
				if (start !== startLineOffset) {
					text = this.getText(startLineOffset, start) + text;
					start = startLineOffset;
				}
				if (end !== endLineOffset) {
					text = text + this.getText(end, endLineOffset);
					end = endLineOffset;
				}
			}
			
			var changeCount = addedCharCount - removedCharCount;
			for (var j = startLine + removedLineCount + 1; j < lineCount; j++) {
				this._lineOffsets[j] += changeCount;
			}
			
			/*
			* Feature in Chrome.  Chrome exceeds the maximum call stack when calling splice
			* around 62k arguments. The limit seems to be higher on IE (250K) and Firefox (450k).
			* The fix is to break the splice in junks of 50k.
			*/
			var SPLICE_LIMIT = 50000;
			var limit = SPLICE_LIMIT, args;
			if (newLineOffsets.length < limit) {
				args = [startLine + 1, removedLineCount].concat(newLineOffsets);
				Array.prototype.splice.apply(this._lineOffsets, args);
			} else {
				index = startLine + 1;
				this._lineOffsets.splice(index, removedLineCount);
				for (var k = 0; k < newLineOffsets.length; k += limit) {
					args = [index, 0].concat(newLineOffsets.slice(k, Math.min(newLineOffsets.length, k + limit)));
					Array.prototype.splice.apply(this._lineOffsets, args);
					index += limit;
				}
			}
			
			var offset = 0, chunk = 0, length;
			while (chunk<this._text.length) {
				length = this._text[chunk].length; 
				if (start <= offset + length) { break; }
				offset += length;
				chunk++;
			}
			var firstOffset = offset;
			var firstChunk = chunk;
			while (chunk<this._text.length) {
				length = this._text[chunk].length; 
				if (end <= offset + length) { break; }
				offset += length;
				chunk++;
			}
			var lastOffset = offset;
			var lastChunk = chunk;
			var firstText = this._text[firstChunk];
			var lastText = this._text[lastChunk];
			var beforeText = firstText.substring(0, start - firstOffset);
			var afterText = lastText.substring(end - lastOffset);
			var params = [firstChunk, lastChunk - firstChunk + 1];
			if (beforeText) { params.push(beforeText); }
			if (text) { params.push(text); }
			if (afterText) { params.push(afterText); }
			Array.prototype.splice.apply(this._text, params);
			if (this._text.length === 0) { this._text = [""]; }
			
			var modelChangedEvent = {
				type: "Changed", //$NON-NLS-0$
				start: eventStart,
				text: changedText,
				removedCharCount: removedCharCount,
				addedCharCount: addedCharCount,
				removedLineCount: removedLineCount,
				addedLineCount: addedLineCount
			};
			this.onChanged(modelChangedEvent);
		}
	};
	mEventTarget.EventTarget.addMixin(TextModel.prototype);
	
	return {TextModel: TextModel};
});
