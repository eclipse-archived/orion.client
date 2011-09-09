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
 * RulerAnnotation
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
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(e);
				}
			}
		},
		removeAllAnnotations: function(type) {
			var annotations = this._annotations;
			var removed; 
			if (type) {
				removed = [];
				for (var i = annotations.length; i >= 0; i--) {
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
				changed: []
			};
			var annotation = annotations[startIndex];
			if (annotation.start < start && start < annotation.end) {
				annotation.end = start;
				e.changed.push(annotation);
				startIndex++;
			}
			var endIndex = this._binarySearch(annotations, end, true);
			annotation = annotations[endIndex];
			//TODO seems wrong?
//			if (annotation.start < end && end < annotation.end) {
//				annotation.end = end;
//				e.changed.push(annotation);
//				endIndex--;
//			}
			var changeCount = addedCharCount - removedCharCount;
			for (var i = endIndex; i < annotations.length; i++) {
				annotation = annotations[i];
				annotation.start += changeCount;
				annotation.end += changeCount;
				e.changed.push(annotation);
			}
			e.removed = annotations.splice(startIndex, endIndex - startIndex);
			e.modelEvent = {
				start: start,
				removedCharCount: removedCharCount,
				addedCharCount: addedCharCount,
				removedLineCount: removedLineCount,
				addedLineCount: addedLineCount
			};
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
