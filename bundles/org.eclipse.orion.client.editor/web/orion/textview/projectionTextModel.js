/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/

/*global window define */

/**
 * @namespace The global container for Orion APIs.
 */ 
var orion = orion || {};
/**
 * @namespace The container for textview APIs.
 */ 
orion.textview = orion.textview || {};


orion.textview.ProjectionTextModel = (function() {

	/** @private */
	function ProjectionTextModel(model) {
		this._model = model;	/* Base Model */
		this._listeners = [];
		this._projections = [];
//		var self = this;
//		model.addListener({
//			onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
//				self._onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
//			},
//			onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
//				self.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
//			}
//		});
	}

	ProjectionTextModel.prototype = /** @lends orion.textview.ProjectionTextModel.prototype */ {
		addListener: function(listener) {
			this._listeners.push(listener);
		},
		removeListener: function(listener) {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i] === listener) {
					this._listeners.splice(i, 1);
					return;
				}
			}
		},
		/*
		* Projection
		*   start - start offset relative base 
		*   end - end offset relative to base, not inclusive
		*   content - undefiend/null/string/model
		*   _lineCount - number of lines between start and end (number of lines hidden)
		*   _lineIndex - line index of start, first hidden line
		*   _model - text model, never null
		*
		*/
		addProjection: function(projection) {
			//TODO add listeners from model
			if (!projection) {return;}
			//start and end can't overlap any exist projection
			var model = this._model, projections = this._projections, i;
			projection._lineIndex = model.getLineAtOffset(projection.start);
			projection._lineCount = model.getLineAtOffset(projection.end) - projection._lineIndex;
			var content = projection.content;
			if (!content) { content = ""; }
			if (typeof content === "string") {
				projection._model = new orion.textview.TextModel(content, model.getLineDelimiter());
			} else {
				projection._model = content;
			}
			var eventStart = this.mapOffset(projection.start, true);
			var removedCharCount = projection.end - projection.start;
			var removedLineCount = projection._lineCount;
			var addedCharCount = projection._model.getCharCount();
			var addedLineCount = projection._model.getLineCount() - 1;
			this.onChanging(projection._model.getText(), eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			var index = this._binarySearch(projections, projection.start);
			projections.splice(index, 0, projection);
			this.onChanged(eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
		},
		_binarySearch: function (array, offset) {
			var high = array.length, low = -1, index;
			while (high - low > 1) {
				index = Math.floor((high + low) / 2);
				if (offset <= array[index].start) {
					high = index;
				} else {
					low = index;
				}
			}
			return high;
		},
		removeProjection: function(projection) {
			//TODO remove listeners from model
			var i, delta = 0;
			for (i = 0; i < this._projections.length; i++) {
				var p = this._projections[i];
				if (p === projection) {
					projection = p;
					break;
				}
				delta += p._model.getCharCount() - (p.end - p.start);
			}
			if (i < this._projections.length) {
				var model = this._model;
				var eventStart = projection.start + delta;
				var addedCharCount = projection.end - projection.start;
				var addedLineCount = projection._lineCount;
				var removedCharCount = projection._model.getCharCount();
				var removedLineCount = projection._model.getLineCount() - 1;
				this.onChanging(model.getText(projection.start, projection.end), eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				this._projections.splice(i, 1);
				this.onChanged(eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			}
		},
		getBaseModel: function() {
			return this._model;
		},
		mapOffset: function(offset, parentOffset) {
			var projections = this._projections, delta = 0, i, projection;
			if (parentOffset) {
				for (i = 0; i < projections.length; i++) {
					projection = projections[i];
					if (projection.start > offset) { break; }
					if (projection.end > offset) { return -1; }
					delta += projection._model.getCharCount() - (projection.end - projection.start);
				}
				return offset + delta;
			}
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > offset - delta) { break; }
				var charCount = projection._model.getCharCount();
				if (projection.start + charCount > offset - delta) {
					return -1;
				}
				delta += charCount - (projection.end - projection.start);
			}
			return offset - delta;
		},
		mapLine: function(lineIndex, parent) {
			if (lineIndex < 0) { return -1; }
			var model = this._model, projections = this._projections, delta = 0, i, projection, lineCount;
			if (parent) {
				for (i = 0; i < projections.length; i++) {
					projection = projections[i];
					if (projection._lineIndex > lineIndex) { break; }
					lineCount = projection._model.getLineCount() - 1;
					if (projection._lineIndex + lineCount > lineIndex) {
						return -1;
					}
					delta += lineCount - projection._lineCount;
				}
				return lineIndex + delta;
			}
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection._lineIndex > lineIndex - delta) { break; }
				lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + lineCount > lineIndex - delta) {
					return -1;
				}
				delta += lineCount - projection._lineCount;
			}
			return lineIndex - delta;
		},
		getCharCount: function() {
			var count = this._model.getCharCount(), projections = this._projections;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				count += projection._model.getCharCount() - (projection.end - projection.start);
			}
			return count;
		},
		getLine: function(lineIndex, includeDelimiter) {
			if (lineIndex < 0) { return null; }
			var model = this._model, projections = this._projections;
			var delta = 0, result = [], offset = 0, i, lineCount, projection;
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection._lineIndex >= lineIndex - delta) { break; }
				lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + lineCount >= lineIndex - delta) {
					var projectionLineIndex = lineIndex - (projection._lineIndex + delta);
					if (projectionLineIndex < lineCount) {
						return projection._model.getLine(projectionLineIndex, includeDelimiter);
					} else {
						result.push(projection._model.getLine(lineCount));
					}
				}
				offset = projection.end;
				delta += lineCount - projection._lineCount;
			}
			offset = Math.max(offset, model.getLineStart(lineIndex - delta));
			for (; i < projections.length; i++) {
				projection = projections[i];
				if (projection._lineIndex > lineIndex - delta) { break; }
				result.push(model.getText(offset, projection.start));
				lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + lineCount > lineIndex - delta) {
					result.push(projection._model.getLine(0, includeDelimiter));
					return result.join("");
				}
				result.push(projection._model.getText());
				offset = projection.end;
				delta += lineCount - projection._lineCount;
			}
			var end = model.getLineEnd(lineIndex - delta, includeDelimiter);
			if (offset < end) {
				result.push(model.getText(offset, end));
			}
			return result.join("");
		},
		getLineAtOffset: function(offset) {
			var model = this._model, projections = this._projections;
			var delta = 0, lineDelta = 0;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				if (projection.start > offset - delta) { break; }
				var charCount = projection._model.getCharCount();
				if (projection.start + charCount > offset - delta) {
					var projectionOffset = offset - (projection.start + delta);
					lineDelta += projection._model.getLineAtOffset(projectionOffset);
					delta += projectionOffset;
					break;
				}
				lineDelta += projection._model.getLineCount() - 1 - projection._lineCount;
				delta += charCount - (projection.end - projection.start);
			}
			return model.getLineAtOffset(offset - delta) + lineDelta;
		},
		getLineCount: function() {
			var model = this._model, projections = this._projections;
			var count = model.getLineCount();
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				count += projection._model.getLineCount() - 1 - projection._lineCount;
			}
			return count;
		},
		getLineDelimiter: function() {
			return this._model.getLineDelimiter();
		},
		getLineEnd: function(lineIndex, includeDelimiter) {
			if (lineIndex < 0) { return -1; }
			var model = this._model, projections = this._projections;
			var delta = 0, offsetDelta = 0;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				if (projection._lineIndex > lineIndex - delta) { break; }
				var lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + lineCount > lineIndex - delta) {
					var projectionLineIndex = lineIndex - (projection._lineIndex + delta);
					return projection._model.getLineEnd (projectionLineIndex, includeDelimiter) + projection.start + offsetDelta;
				}
				offsetDelta += projection._model.getCharCount() - (projection.end - projection.start);
				delta += lineCount - projection._lineCount;
			}
			return model.getLineEnd(lineIndex - delta, includeDelimiter) + offsetDelta;
		},
		getLineStart: function(lineIndex) {
			if (lineIndex < 0) { return -1; }
			var model = this._model, projections = this._projections;
			var delta = 0, offsetDelta = 0;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				if (projection._lineIndex >= lineIndex - delta) { break; }
				var lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + lineCount >= lineIndex - delta) {
					var projectionLineIndex = lineIndex - (projection._lineIndex + delta);
					return projection._model.getLineStart (projectionLineIndex) + projection.start + offsetDelta;
				}
				offsetDelta += projection._model.getCharCount() - (projection.end - projection.start);
				delta += lineCount - projection._lineCount;
			}
			return model.getLineStart(lineIndex - delta) + offsetDelta;
		},
		getText: function(start, end) {
			if (start === undefined) { start = 0; }
			var model = this._model, projections = this._projections;
			var delta = 0, result = [], i, projection, charCount;
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > start - delta) { break; }
				charCount = projection._model.getCharCount();
				if (projection.start + charCount > start - delta) {
					if (end !== undefined && projection.start + charCount > end - delta) {
						return projection._model.getText(start - (projection.start + delta), end - (projection.start + delta));
					} else {
						result.push(projection._model.getText(start - (projection.start + delta)));
						start = projection.end + delta + charCount - (projection.end - projection.start);
					}
				}
				delta += charCount - (projection.end - projection.start);
			}
			var offset = start - delta;
			if (end !== undefined) {
				for (; i < projections.length; i++) {
					projection = projections[i];
					if (projection.start > end - delta) { break; }
					result.push(model.getText(offset, projection.start));
					charCount = projection._model.getCharCount();
					if (projection.start + charCount > end - delta) {
						result.push(projection._model.getText(0, end - (projection.start + delta)));
						return result.join("");
					}
					result.push(projection._model.getText());
					offset = projection.end;
					delta += charCount - (projection.end - projection.start);
				}
				result.push(model.getText(offset, end - delta));
			} else {
				for (; i < projections.length; i++) {
					projection = projections[i];
					result.push(model.getText(offset, projection.start));
					result.push(projection._model.getText());
					offset = projection.end;
				}
				result.push(model.getText(offset));
			}
			return result.join("");
		},
		_onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			var model = this._model, projections = this._projections, i, projection, delta = 0, lineDelta;
			var end = start + removedCharCount;
			for (; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > start) { break; }
				delta += projection._model.getCharCount() - (projection.end - projection.start);
			}
			/*TODO add stuff saved by setText*/
			var mapStart = start + delta, rangeStart = i;
			for (; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > end) { break; }
				delta += projection._model.getCharCount() - (projection.end - projection.start);
				lineDelta += projection._model.getLineCount() - 1 - projection._lineCount;
			}
			/*TODO add stuff saved by setText*/
			var mapEnd = end + delta, rangeEnd = i;
			this.onChanging(mapStart, mapEnd - mapStart, addedCharCount/*TODO add stuff saved by setText*/, removedLineCount + lineDelta/*TODO add stuff saved by setText*/, addedLineCount/*TODO add stuff saved by setText*/);
			projections.splice(projections, rangeEnd - rangeStart);
			var count = text.length - (mapEnd - mapStart);
			for (; i < projections.length; i++) {
				projection = projections[i];
				projection.start += count;
				projection.end += count;
				projection._lineIndex = model.getLineAtOffset(projection.start);
			}
		},
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanging) { 
					l.onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		setLineDelimiter: function(lineDelimiter) {
			this._model.setLineDelimiter(lineDelimiter);
		},
		setText: function(text, start, end) {
			if (text === undefined) { text = ""; }
			if (start === undefined) { start = 0; }
			var eventStart = start, eventEnd = end;
			var model = this._model, projections = this._projections;
			var delta = 0, lineDelta = 0, i, projection, charCount, startProjection, endProjection, startLineDelta = 0;
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > start - delta) { break; }
				charCount = projection._model.getCharCount();
				if (projection.start + charCount > start - delta) {
					if (end !== undefined && projection.start + charCount > end - delta) {
						projection._model.setText(text, start - (projection.start + delta), end - (projection.start + delta));
						//TODO events - special case
						return;
					} else {
						startLineDelta = projection._model.getLineCount() - 1 - projection._model.getLineAtOffset(start - (projection.start + delta));
						startProjection = {
							projection: projection,
							start: start - (projection.start + delta)
						};
						start = projection.end + delta + charCount - (projection.end - projection.start);
					}
				}
				lineDelta += projection._model.getLineCount() - 1 - projection._lineCount;
				delta += charCount - (projection.end - projection.start);
			}
			var mapStart = start - delta, rangeStart = i, startLine = model.getLineAtOffset(mapStart) + lineDelta - startLineDelta;
			if (end !== undefined) {
				for (; i < projections.length; i++) {
					projection = projections[i];
					if (projection.start > end - delta) { break; }
					charCount = projection._model.getCharCount();
					if (projection.start + charCount > end - delta) {
						lineDelta += projection._model.getLineAtOffset(end - (projection.start + delta));
						charCount = end - (projection.start + delta);
						end = projection.end + delta;
						endProjection = {
							projection: projection,
							end: charCount
						};
						break;
					}
					lineDelta += projection._model.getLineCount() - 1 - projection._lineCount;
					delta += charCount - (projection.end - projection.start);
				}
			} else {
				for (; i < projections.length; i++) {
					projection = projections[i];
					lineDelta += projection._model.getLineCount() - 1 - projection._lineCount;
					delta += projection._model.getCharCount() - (projection.end - projection.start);
				}
				end = eventEnd = model.getCharCount() + delta;
			}
			var mapEnd = end - delta, rangeEnd = i, endLine = model.getLineAtOffset(mapEnd) + lineDelta;
			
			//events
			var removedCharCount = eventEnd - eventStart;
			var removedLineCount = endLine - startLine;
			var addedCharCount = text.length;
			var addedLineCount = 0;
			var cr = 0, lf = 0, index = 0;
			while (true) {
				if (cr !== -1 && cr <= index) { cr = text.indexOf("\r", index); }
				if (lf !== -1 && lf <= index) { lf = text.indexOf("\n", index); }
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
				addedLineCount++;
			}
			this.onChanging(text, eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			
//			var changeLineCount = model.getLineAtOffset(mapEnd) - model.getLineAtOffset(mapStart) + addedLineCount;
			model.setText(text, mapStart, mapEnd);
			if (startProjection) {
				projection = startProjection.projection;
				projection._model.setText("", startProjection.start);
			}		
			if (endProjection) {
				projection = endProjection.projection;
				projection._model.setText("", 0, endProjection.end);
				projection.start = projection.end;
				projection._lineCount = 0;
			}
			projections.splice(rangeStart, rangeEnd - rangeStart);
			var changeCount = text.length - (mapEnd - mapStart);
			for (i = rangeEnd; i < projections.length; i++) {
				projection = projections[i];
				projection.start += changeCount;
				projection.end += changeCount;
//				if (projection._lineIndex + changeLineCount !== model.getLineAtOffset(projection.start)) {
//					log("here");
//				}
				projection._lineIndex = model.getLineAtOffset(projection.start);
//				projection._lineIndex += changeLineCount;
			}
			
			this.onChanged(eventStart, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
		}
	};

	return ProjectionTextModel;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
