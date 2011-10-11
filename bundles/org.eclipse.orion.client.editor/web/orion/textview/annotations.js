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
 * @class This object represents a decoration attached to a range of text. Annotations are added to a
 * <code>AnnotationModel</code> which is attached to a <code>TextModel</code>.
 * <p>
 * <b>See:</b><br/>
 * {@link orion.textview.AnnotationModel}<br/>
 * {@link orion.textview.Ruler}<br/>
 * </p>		 
 * @name orion.textview.Annotation
 * 
 * @property {String} type The annotation type (i. e. orion.annotation.error).
 * @property {Number} start The start offset of the annotation in the text model.
 * @property {Number} end The end offset of the annotation in the text model.
 * @property {String} html The HTML displayed for this annotation.
 * @property {String} title The text description by the annotation.
 * @property {orion.textview.Style} style The style information for the annotation used on in the annotations ruler and tooltips.
 * @property {orion.textview.Style} overviewStyle The style information for the annotation used in the overview ruler.
 * @property {orion.textview.Style} rangeStyle The style information for the annotation used in the text view to decorate a range of text.
 * @property {orion.textview.Style} lineStyle The style information for the annotation used in the text view to decorate a line of text.
 */
 
/**
 * Constructs a new folding annotation.
 * 
 * @param {orion.textview.ProjectionTextModel} projectionModel The projection text model.
 * @param {String} type The annotation type.
 * @param {Number} start The start offset of the annotation in the text model.
 * @param {Number} end The end offset of the annotation in the text model.
 * @param {String} expandedHTML The HTML displayed for this annotation when it is expanded.
 * @param {orion.textview.Style} style The style information for the annotation when it is expanded.
 * @param {String} collapsedHTML The HTML displayed for this annotation when it is collapsed.
 * @param {orion.textview.Style} style The style information for the annotation when it is collapsed.
 * 
 * @class This object represents a folding annotation.
 * @name orion.textview.FoldingAnnotation
 */
orion.textview.FoldingAnnotation = (function() {
	/** @private */
	function FoldingAnnotation (projectionModel, type, start, end, expandedHTML, expandedStyle, collapsedHTML, collapsedStyle) {
		this.type = type;
		this.start = start;
		this.end = end;
		this._projectionModel = projectionModel;
		this._expandedHTML = this.html = expandedHTML;
		this._expandedStyle = this.style = expandedStyle;
		this._collapsedHTML = collapsedHTML;
		this._collapsedStyle = collapsedStyle;
		this.expanded = true;
	}
	
	FoldingAnnotation.prototype = /** @lends orion.textview.FoldingAnnotation.prototype */ {
		/**
		 * Collapses the annotation.
		 */
		collapse: function () {
			if (!this.expanded) { return; }
			this.expanded = false;
			this.html = this._collapsedHTML;
			this.style = this._collapsedStyle;
			var projectionModel = this._projectionModel;
			var baseModel = projectionModel.getBaseModel();
			this._projection = {
				start: baseModel.getLineStart(baseModel.getLineAtOffset(this.start) + 1),
				end: baseModel.getLineEnd(baseModel.getLineAtOffset(this.end), true)
			};
			projectionModel.addProjection(this._projection);
		},
		/**
		 * Expands the annotation.
		 */
		expand: function () {
			if (this.expanded) { return; }
			this.expanded = true;
			this.html = this._expandedHTML;
			this.style = this._expandedStyle;
			this._projectionModel.removeProjection(this._projection);
		}
	};
	
	return FoldingAnnotation;
}());

/**
 * Constructs a annotation model.
 * 
 * @param {textModel} the view options.
 * 
 * @class This object manages annotations for a <code>TextModel</code>.
 * @name orion.textview.AnnotationModel
 */
orion.textview.AnnotationModel = (function() {

	/** @private */
	function AnnotationModel(textModel) {
		this._annotations = [];
		this._listeners = [];
		var self = this;
		this._modelListener = {
			onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
				self._onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			}
		};
		this.setTextModel(textModel);
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
		/**
		 * Adds an annotation to the annotation model.  The annotation model listeners are
		 * notified of this change.
		 * 
		 * @param {orion.textview.Annotation} annotation the annotation to be added.
		 * 
		 * @see #removeAnnotation
		 */
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
		 * Gets the attached text model. 
		 * 
		 * @return {orion.textview.TextModel} The text model.
		 * 
		 * @see #setTextModel
		 */
		getTextModel: function() {
			return this._model;
		},
		/**
		 * @class This object represents an annotation iterator.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.textview.AnnotationModel#getAnnotations}<br/>
		 * </p>		 
		 * @name orion.textview.AnnotationIterator
		 * 
		 * @property {Function} hasNext Determines whether there are more annotations in the iterator.
		 * @property {Function} next Gets the next annotation in the iterator.
		 */		
		/**
		 * Returns an iterator of annotations for the given range of text.
		 *
		 * @param {Number} start the start offset of the range
		 * @param {Number} end the end offset of the range
		 * @return {orion.textview.AnnotationIterator} an annotation iterartor
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
		/**
		 * Notifies the annotation model listeners that the given annotation has
		 * been modified.
		 * 
		 * @param {orion.textview.Annotation} annotation the annotation modified.
		 * 
		 * @see addAnnotation
		 */
		modifyAnnotation: function(annotation) {
			if (!annotation) { return; }
			var annotations = this._annotations;
			var index = this._binarySearch(annotations, annotation.start);
			var e = {
				added: [],
				removed: [],
				changed: []
			};
			while (index < annotations.length && annotations[index].start === annotation.start) {
				if (annotations[index] === annotation) {
					e.changed.push(annotation);
					break;
				}
				index++;
			}
			if (e.changed.length > 0) {
				this.onChanged(e);
			}
		},
		/**
		 * Notifies all listeners that the annotation model has changed.
		 *
		 * @param {orion.textview.Annotation[]} added The list of annotation being added to the model.
		 * @param {orion.textview.Annotation[]} changed The list of annotation modified in the model.
		 * @param {orion.textview.Annotation[]} removed The list of annotation being removed from the model.
		 * @param {ModelChangedEvent} textModelChangedEvent the text odel changed event that trigger this change, can be null if the change happen because of {@link #addAnnotation}.
		 */
		onChanged: function(e) {
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(e);
				}
			}
		},
		/**
		 * Removes all annotations of the given <code>type</code>. All annotations
		 * are removed if the type is not specified.
		 * 
		 * @param {Object} type the type of annotations to be removed.
		 * 
		 * @see removeAnnotation
		 */
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
		/**
		 * Removes an annotation from the annotation model.  The annotation model listeners are
		 * notified of this change.
		 * 
		 * @param {orion.textview.Annotation} annotation the annotation to be removed.
		 * 
		 * @see #addAnnotation
		 */
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
		/**
		 * Removes and adds the specifed annotations to the annotation model. The annotation
		 * model listeners are notified of this change.  Only one changed event is generated.
		 * 
		 * @param {orion.textview.Annotation} remove the annotations to be removed.
		 * @param {orion.textview.Annotation} add the annotations to be added.
		 * 
		 * @see #addAnnotation
		 * @see #removeAnnotation
		 */
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
		/**
		 * Attaches the annotation model to the given text model.  The annotation
		 * model keeps track of changes in the text model and update and/or removes
		 * annotations that are affected by the change.
		 * 
		 * @return {orion.textview.TextModel} The text model.
		 * 
		 * @see #setTextModel
		 */
		setTextModel: function(textModel) {
			if (this._model) {
				this._model.removeListener(this._modelListener);
			}
			this._model = textModel;
			if (this._model) {
				this._model.addListener(this._modelListener);
			}
		},
		/** @ignore */
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
		/** @ignore */
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


/** @ignore */
orion.textview.AnnotationStyler = (function() {
	/** @private */
	function AnnotationStyler (view, annotationModel) {
		this._view = view;
		this._annotationModel = annotationModel;
		view.addEventListener("LineStyle", this, this._onLineStyle);
		var self = this;
		this._annotationModelListener = {
			onChanged: function(e) {
				self._onAnnotationModelChanged(e);
			}
		};
		annotationModel.addListener(this._annotationModelListener);
	}
	AnnotationStyler.prototype = /** @lends orion.textview.AnnotationStyler.prototype */ {
		destroy: function() {
			var view = this._view;
			if (view) {
				view.removeEventListener("Destroy", this, this._onDestroy);
				view.removeEventListener("LineStyle", this, this._onLineStyle);
				this.view = null;
			}
			var annotationModel = this._annotationModel;
			if (annotationModel) {
				annotationModel.removeListener(this._annotationModelListener);
				annotationModel = null;
			}
		},
		_mergeStyle: function(result, style) {
			if (style) {
				if (!result) { result = {}; }
				if (result.styleClass && style.styleClass && result.styleClass !== style.styleClass) {
					result.styleClass += " " + style.styleClass;
				} else {
					result.styleClass = style.styleClass;
				}
				var prop;
				if (style.style) {
					if (!result.style) { result.style  = {}; }
					for (prop in style.style) {
						if (!result.style[prop]) {
							result.style[prop] = style.style[prop];
						}
					}
				}
				if (style.attributes) {
					if (!result.attributes) { result.attributes  = {}; }
					for (prop in style.attributes) {
						if (!result.attributes[prop]) {
							result.attributes[prop] = style.attributes[prop];
						}
					}
				}
			}
			return result;
		},
		_mergeStyleRanges: function(ranges, styleRange) {
			for (var i=0; i<ranges.length; i++) {
				var range = ranges[i];
				if (styleRange.end <= range.start) { break; }
				if (styleRange.start >= range.end) { continue; }
				var mergedStyle = this._mergeStyle({}, range.style);
				mergedStyle = this._mergeStyle(mergedStyle, styleRange.style);
				if (styleRange.start <= range.start && styleRange.end >= range.end) {
					ranges[i] = {start: range.start, end: range.end, style: mergedStyle};
				} else if (styleRange.start > range.start && styleRange.end < range.end) {
					ranges.splice(i, 1,
						{start: range.start, end: styleRange.start, style: range.style},
						{start: styleRange.start, end: styleRange.end, style: mergedStyle},
						{start: styleRange.end, end: range.end, style: range.style});
					i += 2;
				} else if (styleRange.start > range.start) {
					ranges.splice(i, 1,
						{start: range.start, end: styleRange.start, style: range.style},
						{start: styleRange.start, end: range.end, style: mergedStyle});
					i += 1;
				} else if (styleRange.end < range.end) {
					ranges.splice(i, 1,
						{start: range.start, end: styleRange.end, style: mergedStyle},
						{start: styleRange.end, end: range.end, style: range.style});
					i += 1;
				}
			}
		},
		_onAnnotationModelChanged: function(e) {
			if (e.textModelChangedEvent) {
				return;
			}
			var view = this._view;
			if (!view) { return; }
			var model = view.getModel();
			function redraw(changes) {
				for (var i = 0; i < changes.length; i++) {
					if (!changes[i].rangeStyle) { continue; }
					var start = changes[i].start;
					var end = changes[i].end;
					if (model.getBaseModel) {
						start = model.mapOffset(start, true);
						end = model.mapOffset(end, true);
					}
					if (start !== -1 && end !== -1) {
						view.redrawRange(start, end);
					}
				}
			}
			redraw(e.added);
			redraw(e.removed);
			redraw(e.changed);
		},
		_onDestroy: function(e) {
			this.destroy();
		},
		_onLineStyle: function (e) {
			var annotationModel = this._annotationModel;
			var viewModel = this._view.getModel();
			var baseModel = annotationModel.getTextModel();
			var start = e.lineStart;
			var end = e.lineStart + e.lineText.length;
			if (baseModel !== viewModel) {
				start = viewModel.mapOffset(start);
				end = viewModel.mapOffset(end);
			}
			var annotations = annotationModel.getAnnotations(start, end);
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (annotation.rangeStyle) {
					var annotationStart = annotation.start;
					var annotationEnd = annotation.end;
					if (baseModel !== viewModel) {
						annotationStart = viewModel.mapOffset(annotationStart, true);
						annotationEnd = viewModel.mapOffset(annotationEnd, true);
					}
					this._mergeStyleRanges(e.ranges, {start: annotationStart, end: annotationEnd, style: annotation.rangeStyle});
				}
				if (annotation.lineStyle) {
					e.style = this._mergeStyle({}, e.style);
					e.style = this._mergeStyle(e.style, annotation.lineStyle);
				}
			}
		}
	};
	return AnnotationStyler;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
