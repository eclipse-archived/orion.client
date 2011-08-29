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
		
		//TODO
		var self = this;
		model.addListener({
			onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
				self.onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			},
			onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
				self.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			}
		});
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
			if (!projection) {return;}
			this._projections.push(projection);
			var model = this._model;
			projection._lineIndex = model.getLineAtOffset(projection.start);
			projection._lineCount = model.getLineAtOffset(projection.end) - projection._lineIndex;
			var content = projection.content;
			if (!content) { content = ""; }
			if (typeof content === "string") {
				projection._model = new orion.textview.TextModel(content, model.getLineDelimiter());
			} else {
				projection._model = content;
			}
			//TODO add listeners to model
			//TODO send events
		},
		removeProjection: function(projection) {
			for (var i = 0; i < this._projections.length; i++) {
				if (this._projections[i] === projection) {
					this._projections.splice(i, 1);
					return;
				}
			}
			//TODO remove listeners from model
			//TODO send events
		},
		//TODO getModel?
		getParent: function() {
			return this._model;
		},
		mapOffset: function(offset, parentOffset) {
			var i, projection, projections = this._projections, delta = 0;
			if (parentOffset) {
				for (i = 0; i < projections.length; i++) {
					projection = projections[i];
					if (projection.start > offset) { break; }
					if (projection.start <= offset && offset < projection.end) { return -1; }
					delta += projection._model.getCharCount() - (projection.end - projection.start);
				}
				return offset + delta;
			}
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > offset - delta) { break; }
				var charCount = projection._model.getCharCount();
				if (projection.start + delta <= offset && offset < projection.start + delta + charCount) {
					return -1;
				}
				delta += charCount - (projection.end - projection.start);
			}
			return offset - delta;
		},
		mapLine: function(lineIndex) {
			if (lineIndex < 0) { return -1; }
			var model = this._model, projections = this._projections;
			var delta = 0;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				if (projection._lineIndex > lineIndex - delta) { break; }
				var lineCount = projection._model.getLineCount() - 1;
				if (projection._lineIndex + delta <= lineIndex && lineIndex < projection._lineIndex + delta + lineCount) {
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
			//TODO optimize
			return this.getText(this.getLineStart(lineIndex), this.getLineEnd(lineIndex, includeDelimiter));
		},
		getLineAtOffset: function(offset) {
			var delta = 0, lineDelta = 0;
			var model = this._model, projections = this._projections;
			for (var i = 0; i < projections.length; i++) {
				var projection = projections[i];
				if (projection.start > offset - delta) { break; }
				var charCount = projection._model.getCharCount();
				if (projection.start + delta <= offset && offset < projection.start + delta + charCount) {
					var projectionOffset = offset - (projection.start + delta);
					lineDelta += projection._model.getLineAtOffset(projectionOffset);
					delta += projectionOffset;
					break;
				}
				lineDelta +=  projection._model.getLineCount() - 1 - projection._lineCount;
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
				if (projection._lineIndex + delta <= lineIndex && lineIndex < projection._lineIndex + delta + lineCount) {
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
				if (projection._lineIndex + delta < lineIndex && lineIndex <= projection._lineIndex + delta + lineCount) {
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
			if (end === undefined) { end = this.getCharCount(); }//TODO optimize
			var model = this._model;
			var result = [];
			var i, projection, charCount, projections = this._projections, delta = 0;
			for (i = 0; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > start - delta) { break; }
				charCount = projection._model.getCharCount();
				if (projection.start + delta <= start && start < projection.start + delta + charCount) {
					if (projection.start + delta < end && end <= projection.start + delta + charCount) {
						return projection._model.getText(start - (projection.start + delta), end - (projection.start + delta));
					} else {
						result.push(projection._model.getText(start - (projection.start + delta)));
						start = projection.end + delta + charCount - (projection.end - projection.start);
					}
				}
				delta += charCount - (projection.end - projection.start);
			}
			var offset = start - delta;
			for (; i < projections.length; i++) {
				projection = projections[i];
				if (projection.start > end - delta) { break; }
				result.push(model.getText(offset, Math.min(end - delta, projection.start)));
				charCount = projection._model.getCharCount();
				if (projection.start + delta <= end && end < projection.start + delta + charCount) {
					result.push(projection._model.getText(0, end - (projection.start + delta)));
					return result.join("");
				}
				result.push(projection._model.getText());
				offset = projection.end;
				delta += charCount - (projection.end - projection.start);
			}
			if (offset < end - delta) {
				result.push(model.getText(offset, end - delta));
			}
			return result.join("");
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
		setText: function(text, start, end) {
			if (text === undefined) { text = ""; }
			if (start === undefined) { start = 0; }
			var model = this._model;
			var add, i, range, offsetCount = 0, ranges = this._ranges, models = this._models;
			for (i = 0; i < ranges.length; i++) {
				range = ranges[i];
				add = (range.end - range.start) - models[i].getCharCount();
				if (range.end > (start + offsetCount + add)) { break; }
				offsetCount += add;
			}
			var mapStart = start + offsetCount, rangeStart = i, mapEnd;
			if (end === undefined) {
				i = ranges.length;
				mapEnd = model.getCharCount();
			} else {
				for (; i < ranges.length; i++) {
					range = ranges[i];
					add = (range.end - range.start) - models[i].getCharCount();
					if (range.end > (end + offsetCount + add)) { break; }
					offsetCount += add;
				}
				mapEnd = end + offsetCount;
			}
			model.setText(text, mapStart, mapEnd);
			
			//TODO update ranges cached lineIndex
			//TODO remove ranges from rangeStart to i
			//Update ranges from i
			// what should be done if start or end is in the middle of a range?
			// is it better to do it here and send events from here as well? Or from the model listener?
		}
	};

	return ProjectionTextModel;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
