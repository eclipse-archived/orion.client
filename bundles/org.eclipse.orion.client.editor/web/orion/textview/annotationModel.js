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

orion.textview.FoldingAnnotation = (function() {
	/** @private */
	function FoldingAnnotation (projectionModel, type, start, end, expandedHTML, expandedStyle, collapsedHTML, collapsedStyle) {
		this.type = type;
		this.start = start;
		this.end = end;
		this._projectionModel = projectionModel;
		this._expandedHTML = expandedHTML;
		this._expandedStyle = expandedStyle;
		this._collapsedHTML = collapsedHTML;
		this._collapsedStyle = collapsedStyle;
		this.expanded = true;
		this._update(true);
	}
	
	FoldingAnnotation.prototype = /** @lends orion.textview.FoldingAnnotation.prototype */ {
		_update: function(checkLineCount) {
			var visible = true;
			if (checkLineCount) {
				var baseModel = this._projectionModel.getBaseModel();
				var startLine = baseModel.getLineAtOffset(this.start);
				var endLine = baseModel.getLineAtOffset(this.end);
				visible = startLine !== endLine;
			}
			if (visible) {
				if (this.expanded) {
					this.rulerHTML = this._expandedHTML;
					this.rulerStyle = this._expandedStyle;
				} else {
					this.rulerHTML = this._collapsedHTML;
					this.rulerStyle = this._collapsedStyle;
				}
			} else {
				this.rulerHTML = null;
				this.rulerStyle = null;
				this.expanded = true;
			}
			
		},
		changed: function(e) {
			if (e && e.textModelChangedEvent) {
				var changeStart = e.textModelChangedEvent.start;
				var changeEnd = e.textModelChangedEvent.start + e.textModelChangedEvent.removedCharCount;
				var changeCount = e.textModelChangedEvent.addedCharCount - e.textModelChangedEvent.removedCharCount;
				var start = this.start;
				var end = this.end;
				if (start > changeStart) {
					start -= changeCount;
				}
				if (end > changeStart) {
					end -= changeCount;
				}
				if (start <= changeStart && changeStart < this.end && this.start <= changeEnd && changeEnd < end) {
					this.expand();
					this._update(true);
				}
			}
		},
		collapse: function () {
			if (!this.expanded) { return; }
			if (!this.rulerHTML) { return; }
			this.expanded = false;
			var projectionModel = this._projectionModel;
			var baseModel = projectionModel.getBaseModel();
			this._projection = {
				start: baseModel.getLineStart(baseModel.getLineAtOffset(this.start) + 1),
				end: baseModel.getLineEnd(baseModel.getLineAtOffset(this.end), true)
			};
			projectionModel.addProjection(this._projection);
			this._update();
		},
		expand: function () {
			if (this.expanded) { return; }
			if (!this.rulerHTML) { return; }
			this.expanded = true;
			this._projectionModel.removeProjection(this._projection);
			this._update();
		},
		removed: function(e) {
			if (e && e.textModelChangedEvent) {
				return;
			}
			this.expand();
		}
	};
	
	return FoldingAnnotation;
}());

/**
 * Annotation
 *   type - {String} i.e orion.annotation.breakpoint, orion.annotation.folding
 *   start
 *   end
 *   rulerHTML
 *   rulerStyle
 *   rulerTitle
 *   overviewStyle
 *   rangeStyle
 *   lineStyle
 *
 * FoldingAnnotation
 *  expanded
 *  expandedHTML, expandedStyle
 *  collapsededHTML, collapsededStyle
 *
 * RulerAnnotation (between view and ruler)
 *   html
 *   style
 *
 */
orion.textview.AnnotationModel = (function() {

	/** @private */
	function AnnotationModel(textModel) {
		this._model = textModel;
		this._annotations = [];
		this._listeners = [];
		var self = this;
		this._model.addListener({
			onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
				self._onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			}
		});
	}

	AnnotationModel.prototype = /** @lends orion.textview.AnnotationModel.prototype */ {
		/**
		 * Adds a listener to the model.
		 * 
		 * @param {Object} listener the listener to add.
		 * @param {Function} [listener.onChanged] see {@link #onChanged}.
		 * 
		 * @see removeListener
		 */
		addListener: function(listener) {
			this._listeners.push(listener);
		},
		/**
		 * Removes a listener from the model.
		 * 
		 * @param {Object} listener the listener to remove
		 * 
		 * @see #addListener
		 */
		removeListener: function(listener) {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i] === listener) {
					this._listeners.splice(i, 1);
					return;
				}
			}
		},
		addAnnotation: function(annotation) {
			if (!annotation) { return; }
			var annotations = this._annotations;
			var index = this._binarySearch(annotations, annotation.start);
			annotations.splice(index, 0, annotation);
			var e = {
				added: [annotation],
				removed: [],
				changed: []
			};
			this.onChanged(e);
		},
		/**
		 * @param {Number} start the start 
		 * @param {Number} end the end
		 * @return an iterartor
		 */
		getAnnotations: function(start, end) {
			var annotations = this._annotations;
			var startIndex = this._binarySearch(annotations, start, true);
			return {
				next: function() {
					if (startIndex < annotations.length) {
						var annotation = annotations[startIndex++];
						if (annotation.start < end) {
							return annotation;
						}
					}
					return null;
				},
				hasNext: function() {
					return startIndex < annotations.length && annotations[startIndex].start < end;
				}
			};
		},
		modifyAnnotation: function(annotation) {
			if (!annotation) { return; }
			var annotations = this._annotations;
			var index = this._binarySearch(annotations, annotation.start);
			var e = {
				added: [],
				removed: [],
				changed: []
			};
			if (!(0 <= index && index < annotations.length) || annotations[index] !== annotation) {
				annotations.splice(index, 0, annotation);
				e.added.push(annotation);
			} else {
				e.changed.push(annotation);
			}
			this.onChanged(e);
		},
		/**
		 * Notifies all listeners that the text has changed.
		 * <p>
		 * This notification is intended to be used only by the view. Application clients should
		 * use {@link orion.textview.TextView#event:onModelChanged}.
		 * </p>
		 * <p>
		 * NOTE: This method is not meant to called directly by application code. It is called internally by the TextModel
		 * as part of the implementation of {@link #setText}. This method is included in the public API for documentation
		 * purposes and to allow integration with other toolkit frameworks.
		 * </p>
		 *
		 * @param {Number} start the character offset in the model where the change occurred.
		 * @param {Number} removedCharCount the number of characters removed from the model.
		 * @param {Number} addedCharCount the number of characters added to the model.
		 * @param {Number} removedLineCount the number of lines removed from the model.
		 * @param {Number} addedLineCount the number of lines added to the model.
		 */
		onChanged: function(e) {
			var i;
			for (i = 0; i < e.added.length; i++) {
				if (e.added[i].added) {
					e.added[i].added(e);
				}
			}
			for (i = 0; i < e.changed.length; i++) {
				if (e.changed[i].changed) {
					e.changed[i].changed(e);
				}
			}
			for (i = 0; i < e.removed.length; i++) {
				if (e.removed[i].removed) {
					e.removed[i].removed(e);
				}
			}
			for (i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(e);
				}
			}
		},
		removeAnnotations: function(type) {
			var annotations = this._annotations;
			var removed, i; 
			if (type) {
				removed = [];
				for (i = annotations.length - 1; i >= 0; i--) {
					var annotation = annotations[i];
					if (annotation.type === type) {
						annotations.splice(i, 1);
					}
					removed.splice(0, 0, annotation);
				}
			} else {
				removed = annotations;
				annotations = [];
			}
			var e = {
				removed: removed,
				added: [],
				changed: []
			};
			this.onChanged(e);
		},
		removeAnnotation: function(annotation) {
			var annotations = this._annotations;
			var index = this._binarySearch(annotations, annotation.start);
			if (!(0 <= index && index < annotations.length)) { return; }
			if (annotations[index] !== annotation) { return; }
			annotations.splice(index, 1);
			var e = {
				removed: [annotation],
				added: [],
				changed: []
			};
			this.onChanged(e);
		},
		replaceAnnotations: function(remove, add) {
			var annotations = this._annotations, i, index, annotation;
			if (!add) { add = []; }
			if (!remove) { remove = []; }
			for (i = 0; i < remove.length; i++) {
				annotation = remove[i];
				index = this._binarySearch(annotations, annotation.start);
				if (!(0 <= index && index < annotations.length)) { continue; }
				if (annotations[index] !== annotation) { continue; }
				annotations.splice(index, 1);
			}
			for (i = 0; i < add.length; i++) {
				annotation = add[i];
				index = this._binarySearch(annotations, annotation.start);
				annotations.splice(index, 0, annotation);
			}
			var e = {
				removed: remove,
				added: add,
				changed: []
			};
			this.onChanged(e);
		},
		_binarySearch: function (array, offset, inclusive) {
			var high = array.length, low = -1, index;
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
		_onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			var annotations = this._annotations, end = start + removedCharCount;
			var startIndex = this._binarySearch(annotations, start, true);
			if (!(0 <= startIndex && startIndex < annotations.length)) { return; }
			var e = {
				added: [],
				changed: [],
				textModelChangedEvent: {
					start: start,
					removedCharCount: removedCharCount,
					addedCharCount: addedCharCount,
					removedLineCount: removedLineCount,
					addedLineCount: addedLineCount
				}
			};
			var changeCount = addedCharCount - removedCharCount, i;
			var endIndex = this._binarySearch(annotations, end, true);
			for (i = endIndex; i < annotations.length; i++) {
				var annotation = annotations[i];
				if (annotation.start > start) {
					annotation.start += changeCount;
				}
				if (annotation.end > start) {
					annotation.end += changeCount;
				}
				e.changed.push(annotation);
			}
			e.removed = annotations.splice(startIndex, endIndex - startIndex);
			this.onChanged(e);
		}
	};

	return AnnotationModel;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
