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
		this._listeners = [];
		this._ranges = [];
		this._models = [];
		this._model = model;
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
		addModel: function(model, range) {
			this._ranges.push(range);
			this._models.push(model);
			range.lineCount = this._model.getLineAtOffset(range.end) - (range.lineIndex = this._model.getLineAtOffset(range.start));
			//TODO add listeners to model
			//TODO send events
		},
		removeModel: function(model) {
			for (var i = 0; i < this._models.length; i++) {
				if (this._models[i] === model) {
					this._models.splice(i, 1);
					this._ranges.splice(i, 1);
					return;
				}
			}
			//TODO remove listeners from model
			//TODO send events
		},
		getModels: function() {
			//TODO copy?
			return this._models;
		},
		getRanges: function() {
			//TODO copy?
			return this._ranges;
		},
		//TODO getModel?
		getParent: function() {
			return this._model;
		},
		mapOffset: function(offset, parent) {
			//TODO handle invalid offsets in the destination
			var i, range, add, ranges = this._ranges, models = this._models;
			if (parent) {
				var offsetCount = 0;
				for (i = 0; i < ranges.length; i++) {
					range = ranges[i];
					if (range.end > offset) { break; }
					offsetCount += (range.end - range.start) - models[i].getCharCount();
				}
				return offset - offsetCount;
			}
			for (i = 0; i < ranges.length; i++) {
				range = ranges[i];
				add = (range.end - range.start) - models[i].getCharCount();
				if (range.end > (offset + add)) { break; }
				offset += add;
			}
			return offset;
		},
		mapLine: function(lineIndex) {
			if (lineIndex < 0) { return -1; }
			var lineCount = 0;
			var model = this._model, ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				var startLine = range.lineIndex;
				if (startLine - lineCount > lineIndex) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
			}
			return lineIndex + lineCount;
		},
		getCharCount: function() {
			var count = this._model.getCharCount(), ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				count += models[i].getCharCount() - (range.end - range.start);
			}
			return count;
		},
		getLine: function(lineIndex, includeDelimiter) {
			if (lineIndex < 0) { return -1; }
			var lineCount = 0, range, startLine;
			var model = this._model, ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				range = ranges[i];
				startLine = range.lineIndex;
				if (startLine - lineCount >= lineIndex) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
			}
			var rangeStart = i;
			var mapStart = model.getLineStart(lineIndex + lineCount);
			for (; i < ranges.length; i++) {
				range = ranges[i];
				startLine = range.lineIndex;
				if (startLine - lineCount > lineIndex) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
			}
			var mapEnd = model.getLineEnd(lineIndex + lineCount, includeDelimiter);
			var text = model.getText(mapStart, mapEnd);
			var result = [];
			var offset = 0;
			for (var j = rangeStart; j < i; j++) {
				range = ranges[j];
				result.push(text.substring(offset, range.start - mapStart));
				result.push(models[i].getText());
				offset = range.end - mapStart;
			}
			result.push(text.substring(offset, text.length));
			return result.join("");
		},
		getLineAtOffset: function(offset) {
			var lineCount = 0;
			var model = this._model, ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				var add = (range.end - range.start) - models[i].getCharCount();
				if (range.end > (offset + add)) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
				offset += add;
			}
			return model.getLineAtOffset(offset) - lineCount;
		},
		getLineCount: function() {
			var model = this._model, ranges = this._ranges;
			var count = model.getLineCount();
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				count -= range.lineCount;
			}
			return count;
		},
		getLineDelimiter: function() {
			return this._model.getLineDelimiter();
		},
		getLineEnd: function(lineIndex, includeDelimiter) {
			if (lineIndex < 0) { return -1; }
			var lineCount = 0, offsetCount = 0;
			var model = this._model, ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				var startLine = range.lineIndex;
				if (startLine - lineCount > lineIndex) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
				offsetCount += (range.end - range.start) - models[i].getCharCount();
			}
			return model.getLineEnd(lineIndex + lineCount, includeDelimiter) - offsetCount;
		},
		getLineStart: function(lineIndex) {
			if (lineIndex < 0) { return -1; }
			var lineCount = 0, offsetCount = 0;
			var model = this._model, ranges = this._ranges, models = this._models;
			for (var i = 0; i < ranges.length; i++) {
				var range = ranges[i];
				var startLine = range.lineIndex;
				if (startLine - lineCount >= lineIndex) { break; }
				lineCount += range.lineCount + models[i].getLineCount() - 1;
				offsetCount += (range.end - range.start) - models[i].getCharCount();
			}
			return model.getLineStart(lineIndex + lineCount) - offsetCount;
		},
		getText: function(start, end) {
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
			var text = model.getText(mapStart, mapEnd);
			var result = [], offset = 0;
			for (var j = rangeStart; j < i; j++) {
				range = ranges[j];
				result.push(text.substring(offset, range.start - mapStart));
				result.push(models[i].getText());
				offset = range.end - mapStart;
			}
			result.push(text.substring(offset, text.length));
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
			
			//TODO update ranges cached lineIndex and lineCount
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
