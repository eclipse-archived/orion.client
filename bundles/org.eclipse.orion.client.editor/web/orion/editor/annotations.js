/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2017 IBM Corporation and others.
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
define("orion/editor/annotations", ['i18n!orion/editor/nls/messages', 'orion/editor/eventTarget'], function(messages, mEventTarget) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
	/**
	 * @class This object represents a regitry of annotation types.
	 * @name orion.editor.AnnotationType
	 */
	function AnnotationType() {
	}
	
	/**
	 * @class This object represents a decoration attached to a range of text. Annotations are added to a
	 * <code>AnnotationModel</code> which is attached to a <code>TextModel</code>.
	 * <p>
	 * <b>See:</b><br/>
	 * {@link orion.editor.AnnotationModel}<br/>
	 * {@link orion.editor.Ruler}<br/>
	 * </p>
	 * @name orion.editor.Annotation
	 *
	 * @property {String} type The annotation type (for example, orion.annotation.error).
	 * @property {Number} start The start offset of the annotation in the text model.
	 * @property {Number} end The end offset of the annotation in the text model.
	 * @property {String} html The HTML displayed for the annotation.
	 * @property {String} title The text description for the annotation.
	 * @property {orion.editor.Style} style The style information for the annotation used in the annotations ruler and tooltips.
	 * @property {orion.editor.Style} overviewStyle The style information for the annotation used in the overview ruler.
	 * @property {orion.editor.Style} rangeStyle The style information for the annotation used in the text view to decorate a range of text.
	 * @property {orion.editor.Style} lineStyle The style information for the annotation used in the text view to decorate a line of text.
	 */
	/**
	 * Constructs a new folding annotation.
	 *
	 * @param {Number} start The start offset of the annotation in the text model.
	 * @param {Number} end The end offset of the annotation in the text model.
	 * @param {orion.editor.ProjectionTextModel} projectionModel The projection text model.
	 *
	 * @class This object represents a folding annotation.
	 * @name orion.editor.FoldingAnnotation
	 */
	function FoldingAnnotation (start, end, projectionModel) {
		this.start = start;
		this.end = end;
		this._projectionModel = projectionModel;
		this.html = this._expandedHTML;
		this.style = this._expandedStyle;
		this.expanded = true;
	}

	FoldingAnnotation.prototype = /** @lends orion.editor.FoldingAnnotation.prototype */ {
		_expandedHTML: "<div class='annotationHTML expanded'></div>", //$NON-NLS-0$
		_expandedStyle: {styleClass: "annotation expanded"}, //$NON-NLS-0$
		_collapsedHTML: "<div class='annotationHTML collapsed'></div>", //$NON-NLS-0$
		_collapsedStyle: {styleClass: "annotation collapsed"}, //$NON-NLS-0$
		_collapse: function() {
			if (!this.expanded) { return false; }
			this.expanded = false;
			this.html = this._collapsedHTML;
			this.style = this._collapsedStyle;
			if (this._annotationModel) {
				this._annotationModel.modifyAnnotation(this);
			}
			return true;
		},
		_expand: function() {
			if (this.expanded) { return false; }
			this.expanded = true;
			this.html = this._expandedHTML;
			this.style = this._expandedStyle;
			if (this._annotationModel) {
				this._annotationModel.modifyAnnotation(this);
			}
			return true;
		},
		_collapseImpl: function (checkOverlaping) {
			if (this._collapse()) {
				if (checkOverlaping) {
					this._forEachOverlaping(function(annotation) {
						if (!annotation.expanded) {
							annotation._expandImpl(false);
							annotation._recollapse = true;
						}
					});
				}
				var projectionModel = this._projectionModel;
				var baseModel = projectionModel.getBaseModel();
				this._projection = {
					annotation: this,
					start: baseModel.getLineStart(baseModel.getLineAtOffset(this.start) + 1),
					end: baseModel.getLineEnd(baseModel.getLineAtOffset(this.end), true)
				};
				projectionModel.addProjection(this._projection);
			}
		},
		_expandImpl: function(checkOverlaping) {
			if (this._expand()) {
				this._projectionModel._removeProjection(this._projection, !this._annotationModel);
				if (checkOverlaping) {
					this._forEachOverlaping(function(annotation) {
						if (annotation._recollapse) {
							annotation._collapseImpl(false);
							annotation._recollapse = false;
						}
					});
				}
			}
		},
		_forEachOverlaping: function(callback) {
			if (!this._annotationModel) { return; }
			var annotations = this._annotationModel.getAnnotations(this.start, this.end);
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (annotation !== this && annotation.type === AnnotationType.ANNOTATION_FOLDING) {
					callback.call(this, annotation);
				}
			}
		},
		/**
		 * Collapses the annotation.
		 */
		collapse: function () {
			this._recollapse = false;
			this._collapseImpl(true);
		},
		/**
		 * Expands the annotation.
		 */
		expand: function () {
			this._recollapse = false;
			this._expandImpl(true);
		}
	};
	 
	/**
	 * Error annotation type.
	 */
	AnnotationType.ANNOTATION_ERROR = "orion.annotation.error"; //$NON-NLS-0$
	/**
	 * Warning annotation type.
	 */
	AnnotationType.ANNOTATION_WARNING = "orion.annotation.warning"; //$NON-NLS-0$
	/**
	 * Info annotation type.
	 * @since 14.0
	 */
	AnnotationType.ANNOTATION_INFO = "orion.annotation.info"; //$NON-NLS-0$
	/**
	 * Task annotation type.
	 */
	AnnotationType.ANNOTATION_TASK = "orion.annotation.task"; //$NON-NLS-0$
	/**
	 * Breakpoint annotation type.
	 */
	AnnotationType.ANNOTATION_BREAKPOINT = "orion.annotation.breakpoint"; //$NON-NLS-0$
	/**
	 * Bookmark annotation type.
	 */
	AnnotationType.ANNOTATION_BOOKMARK = "orion.annotation.bookmark"; //$NON-NLS-0$
	/**
	 * Folding annotation type.
	 */
	AnnotationType.ANNOTATION_FOLDING = "orion.annotation.folding"; //$NON-NLS-0$
	/**
	 * Curent bracket annotation type.
	 */
	AnnotationType.ANNOTATION_CURRENT_BRACKET = "orion.annotation.currentBracket"; //$NON-NLS-0$
	/**
	 * Matching bracket annotation type.
	 */
	AnnotationType.ANNOTATION_MATCHING_BRACKET = "orion.annotation.matchingBracket"; //$NON-NLS-0$
	/**
	 * Current line annotation type.
	 */
	AnnotationType.ANNOTATION_CURRENT_LINE = "orion.annotation.currentLine"; //$NON-NLS-0$
	/**
	 * Current search annotation type.
	 */
	AnnotationType.ANNOTATION_CURRENT_SEARCH = "orion.annotation.currentSearch"; //$NON-NLS-0$
	/**
	 * Matching search annotation type.
	 */
	AnnotationType.ANNOTATION_MATCHING_SEARCH = "orion.annotation.matchingSearch"; //$NON-NLS-0$
	/**
	 * Search range annotation type.
	 */
	AnnotationType.ANNOTATION_SEARCH_RANGE = "orion.annotation.searchRange"; //$NON-NLS-0$
	/**
	 * Read Occurrence annotation type.
	 */
	AnnotationType.ANNOTATION_READ_OCCURRENCE = "orion.annotation.readOccurrence"; //$NON-NLS-0$
	/**
	 * Write Occurrence annotation type.
	 */
	AnnotationType.ANNOTATION_WRITE_OCCURRENCE = "orion.annotation.writeOccurrence"; //$NON-NLS-0$
	/**
	 * Selected linked group annotation type.
	 */
	AnnotationType.ANNOTATION_SELECTED_LINKED_GROUP = "orion.annotation.selectedLinkedGroup"; //$NON-NLS-0$
	/**
	 * Current linked group annotation type.
	 */
	AnnotationType.ANNOTATION_CURRENT_LINKED_GROUP = "orion.annotation.currentLinkedGroup"; //$NON-NLS-0$
	/**
	 * Linked group annotation type.
	 */
	AnnotationType.ANNOTATION_LINKED_GROUP = "orion.annotation.linkedGroup"; //$NON-NLS-0$
	/**
	* Blame annotation type.
	*/
	AnnotationType.ANNOTATION_BLAME = "orion.annotation.blame"; //$NON-NLS-0$
	/**
	* Current Blame annotation type.
	*/
	AnnotationType.ANNOTATION_CURRENT_BLAME = "orion.annotation.currentBlame"; //$NON-NLS-0$
	/**
	 * Diff Added annotation type.
	 */
	AnnotationType.ANNOTATION_DIFF_ADDED = "orion.annotation.diffAdded"; //$NON-NLS-0$
	/**
	 * Diff Deleted annotation type.
	 */
	AnnotationType.ANNOTATION_DIFF_DELETED = "orion.annotation.diffDeleted"; //$NON-NLS-0$
	/**
	 * Diff Modification annotation type.
	 */
	AnnotationType.ANNOTATION_DIFF_MODIFIED = "orion.annotation.diffModified"; //$NON-NLS-0$

	/** @private */
	var annotationTypes = {};

	/**
	 * Register an annotation type.
	 *
	 * @param {String} type The annotation type (for example, orion.annotation.error).
	 * @param {Object|Function} properties The common annotation properties of the registered
	 *		annotation type. All annotations create with this annotation type will expose these
	 *		properties.
	 */
	AnnotationType.registerType = function(type, properties) {
		var constructor = properties;
		if (typeof constructor !== "function") { //$NON-NLS-0$
			constructor = function(start, end, title) {
				this.start = start;
				this.end = end;
				if (title !== undefined) { this.title = title; }
			};
			constructor.prototype = properties;
		}
		constructor.prototype.type = type;
		annotationTypes[type] = constructor;
		return type;
	};

	/**
	 * Creates an annotation of a given type with the specified start end end offsets.
	 *
	 * @param {String} type The annotation type (for example, orion.annotation.error).
	 * @param {Number} start The start offset of the annotation in the text model.
	 * @param {Number} end The end offset of the annotation in the text model.
	 * @param {String} [title] The text description for the annotation if different then the type description.
	 * @return {orion.editor.Annotation} the new annotation
	 */
	AnnotationType.createAnnotation = function(type, start, end, title) {
		return new (this.getType(type))(start, end, title);
	};

	/**
	 * Gets the registered annotation type with specified type. The returned
	 * value is a constructor that can be used to create annotations of the
	 * speficied type.  The constructor takes the start and end offsets of
	 * the annotation.
	 *
	 * @param {String} type The annotation type (for example, orion.annotation.error).
	 * @return {Function} The annotation type constructor ( i.e function(start, end, title) ).
	 */
	AnnotationType.getType = function(type) {
		return annotationTypes[type];
	};

	/** @private */
	function registerType(type, lineStyling) {
		var index = type.lastIndexOf('.'); //$NON-NLS-0$
		var suffix = type.substring(index + 1);
		var properties = {
			title: messages[suffix],
			style: {styleClass: "annotation " + suffix}, //$NON-NLS-0$
			html: "<div class='annotationHTML " + suffix + "'></div>", //$NON-NLS-1$ //$NON-NLS-0$
			overviewStyle: {styleClass: "annotationOverview " + suffix} //$NON-NLS-0$
		};
		if (lineStyling) {
			properties.lineStyle = {styleClass: "annotationLine " + suffix}; //$NON-NLS-0$
		} else {
			properties.rangeStyle = {styleClass: "annotationRange " + suffix}; //$NON-NLS-0$
		}
		AnnotationType.registerType(type, properties);
	}
	registerType(AnnotationType.ANNOTATION_ERROR);
	registerType(AnnotationType.ANNOTATION_WARNING);
	registerType(AnnotationType.ANNOTATION_INFO);
	registerType(AnnotationType.ANNOTATION_TASK);
	registerType(AnnotationType.ANNOTATION_BREAKPOINT);
	registerType(AnnotationType.ANNOTATION_BOOKMARK);
	registerType(AnnotationType.ANNOTATION_CURRENT_BRACKET);
	registerType(AnnotationType.ANNOTATION_MATCHING_BRACKET);
	registerType(AnnotationType.ANNOTATION_CURRENT_SEARCH);
	registerType(AnnotationType.ANNOTATION_MATCHING_SEARCH);
	registerType(AnnotationType.ANNOTATION_SEARCH_RANGE, true);
	registerType(AnnotationType.ANNOTATION_READ_OCCURRENCE);
	registerType(AnnotationType.ANNOTATION_WRITE_OCCURRENCE);
	registerType(AnnotationType.ANNOTATION_SELECTED_LINKED_GROUP);
	registerType(AnnotationType.ANNOTATION_CURRENT_LINKED_GROUP);
	registerType(AnnotationType.ANNOTATION_LINKED_GROUP);
	registerType(AnnotationType.ANNOTATION_CURRENT_LINE, true);
	registerType(AnnotationType.ANNOTATION_BLAME, true);
	registerType(AnnotationType.ANNOTATION_CURRENT_BLAME, true);
	registerType(AnnotationType.ANNOTATION_DIFF_ADDED);
	registerType(AnnotationType.ANNOTATION_DIFF_DELETED);
	registerType(AnnotationType.ANNOTATION_DIFF_MODIFIED);

	AnnotationType.registerType(AnnotationType.ANNOTATION_FOLDING, FoldingAnnotation);

	/**
	 * Constructs a new AnnotationTypeList object.
	 *
	 * @class This represents an interface of prioritized annotation types.
	 * @name orion.editor.AnnotationTypeList
	 */
	function AnnotationTypeList () {
	}
	/**
	 * Adds in the annotation type interface into the specified object.
	 *
	 * @param {Object} object The object to add in the annotation type interface.
	 */
	AnnotationTypeList.addMixin = function(object) {
		var proto = AnnotationTypeList.prototype;
		for (var p in proto) {
			if (proto.hasOwnProperty(p)) {
				object[p] = proto[p];
			}
		}
	};
	AnnotationTypeList.prototype = /** @lends orion.editor.AnnotationTypeList.prototype */ {
		/**
		 * Adds an annotation type to the receiver.
		 * <p>
		 * Only annotations of the specified types will be shown by
		 * the receiver.
		 * </p>
		 * <p>
		 * If the priority is not specified, the annotation type will be added
		 * to the end of the receiver's list (lowest pririoty).
		 * </p>
		 *
		 * @param {Object} type the annotation type to be shown
		 * @param {Number} priority the priority for the annotation type
		 * 
		 * @see orion.editor.AnnotationTypeList#removeAnnotationType
		 * @see orion.editor.AnnotationTypeList#isAnnotationTypeVisible
		 * @see orion.editor.AnnotationTypeList#getAnnotationTypePriority
		 */
		addAnnotationType: function(type, priority) {
			if (!this._annotationTypes) { this._annotationTypes = []; }
			var index = priority - 1;
			if (priority == undefined || !(0 <= index && index < this._annotationTypes.length)) {
				this._annotationTypes.push(type);
			} else {
				this._annotationTypes.splice(index, 0, type);
			}
		},
		/**
		 * Gets the annotation type priority.  The priority is determined by the
		 * order the annotation type is added to the receiver.  Annotation types
		 * added first have higher priority.
		 * <p>
		 * Returns <code>0</code> if the annotation type is not added.
		 * </p>
		 *
		 * @param {Object} type the annotation type
		 *
		 * @see orion.editor.AnnotationTypeList#addAnnotationType
		 * @see orion.editor.AnnotationTypeList#removeAnnotationType
		 * @see orion.editor.AnnotationTypeList#isAnnotationTypeVisible
		 */
		getAnnotationTypePriority: function(type) {
			if (this._annotationTypes) {
				for (var i = 0; i < this._annotationTypes.length; i++) {
					if (this._annotationTypes[i] === type) {
						return i + 1;
					}
				}
			}
			return 0;
		},
		/**
		 * Returns an array of annotations in the specified annotation model for the given range of text sorted by type.
		 *
		 * @param {orion.editor.AnnotationModel} annotationModel the annotation model.
		 * @param {Number} start the start offset of the range.
		 * @param {Number} end the end offset of the range.
		 * @return {orion.editor.Annotation[]} an annotation array.
		 */
		getAnnotationsByType: function(annotationModel, start, end) {
			var iter = annotationModel.getAnnotations(start, end);
			var annotation, annotations = [];
			while (iter.hasNext()) {
				annotation = iter.next();
				if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
				annotations.push(annotation);
			}
			var self = this;
			annotations.sort(function(a, b) {
				return self.getAnnotationTypePriority(a.type) - self.getAnnotationTypePriority(b.type);
			});
			return annotations;
		},
		/**
		 * Returns whether the receiver shows annotations of the specified type.
		 *
		 * @param {Object} type the annotation type
		 * @returns {Boolean} whether the specified annotation type is shown
		 *
		 * @see orion.editor.AnnotationTypeList#addAnnotationType
		 * @see orion.editor.AnnotationTypeList#removeAnnotationType
		 */
		isAnnotationTypeVisible: function(type) {
			if (this.getAnnotationTypePriority(type) === 0) return false;
			return !this._visibleAnnotationTypes || this._visibleAnnotationTypes[type] === undefined || this._visibleAnnotationTypes[type] === true;
		},
		/**
		 * Sets whether annotations of the given annotation type are visble. By default
		 * all annotations added to the receiver are visible.
		 * 
		 * @param {Object} type
		 * @param {Boolean} visible
		 * @since 14.0
		 */
		setAnnotationTypeVisible: function(type, visible) {
			if (typeof type === "object") {
				this._visibleAnnotationTypes = type;
			} else {
				if (!this._visibleAnnotationTypes) this._visibleAnnotationTypes = {};
				this._visibleAnnotationTypes[type] = visible;
			}
		},
		/**
		 * Removes an annotation type from the receiver.
		 *
		 * @param {Object} type the annotation type to be removed
		 *
		 * @see orion.editor.AnnotationTypeList#addAnnotationType
		 * @see orion.editor.AnnotationTypeList#isAnnotationTypeVisible
		 */
		removeAnnotationType: function(type) {
			if (!this._annotationTypes) { return; }
			for (var i = 0; i < this._annotationTypes.length; i++) {
				if (this._annotationTypes[i] === type) {
					this._annotationTypes.splice(i, 1);
					break;
				}
			}
		}
	};
	
	/** @private */
	function binarySearch(array, offset, inclusive, low, high) {
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
	}
	
	/**
	 * Constructs an annotation model.
	 * 
	 * @param {orion.editor.TextModel} textModel The text model.
	 * 
	 * @class This object manages annotations for a <code>TextModel</code>.
	 * <p>
	 * <b>See:</b><br/>
	 * {@link orion.editor.Annotation}<br/>
	 * {@link orion.editor.TextModel}<br/> 
	 * </p>	
	 * @name orion.editor.AnnotationModel
	 * @borrows orion.editor.EventTarget#addEventListener as #addEventListener
	 * @borrows orion.editor.EventTarget#removeEventListener as #removeEventListener
	 * @borrows orion.editor.EventTarget#dispatchEvent as #dispatchEvent
	 */
	function AnnotationModel(textModel) {
		this._annotations = [];
		var self = this;
		this._listener = {
			onChanged: function(modelChangedEvent) {
				self._onChanged(modelChangedEvent);
			}
		};
		this.setTextModel(textModel);
	}

	AnnotationModel.prototype = /** @lends orion.editor.AnnotationModel.prototype */ {
		/**
		 * Adds an annotation to the annotation model.
		 * <p>The annotation model listeners are notified of this change.</p>
		 *
		 * @param {orion.editor.Annotation} annotation the annotation to be added.
		 *
		 * @see orion.editor.AnnotationModel#removeAnnotation
		 */
		addAnnotation: function(annotation) {
			if (!annotation) { return; }
			var annotations = this._annotations;
			var index = binarySearch(annotations, annotation.start);
			annotations.splice(index, 0, annotation);
			annotation._annotationModel = this;
			var e = {
				type: "Changed", //$NON-NLS-0$
				added: [annotation],
				removed: [],
				changed: []
			};
			this.onChanged(e);
		},
		/**
		 * Returns the text model.
		 *
		 * @return {orion.editor.TextModel} The text model.
		 *
		 * @see orion.editor.AnnotationModel#setTextModel
		 */
		getTextModel: function() {
			return this._model;
		},
		/**
		 * @class This object represents an annotation iterator.
		 * <p>
		 * <b>See:</b><br/>
		 * {@link orion.editor.AnnotationModel#getAnnotations}<br/>
		 * </p>
		 * @name orion.editor.AnnotationIterator
		 *
		 * @property {Function} hasNext Determines whether there are more annotations in the iterator.
		 * @property {Function} next Returns the next annotation in the iterator.
		 */
		/**
		 * Returns an iterator of annotations for the given range of text. If called with no parameters,
		 * returns all annotations in the model.
		 *
		 * @param {Number} start the start offset of the range.
		 * @param {Number} end the end offset of the range.
		 * @return {orion.editor.AnnotationIterator} an annotation iterartor.
		 */
		getAnnotations: function(start, end) {
			var annotations = this._annotations, current;
			var i = 0, skip;
			if (start === undefined && end === undefined) {
				skip = function() {
					return (i < annotations.length) ? annotations[i++] : null;
				};
			} else {
				//TODO binary search does not work for range intersection when there are overlaping ranges, need interval search tree for this
				skip = function() {
					while (i < annotations.length) {
						var a =  annotations[i++];
						if ((start === a.start) || (start > a.start ? start < a.end : a.start < end)) {
							return a;
						}
						if (a.start >= end) {
							break;
						}
					}
					return null;
				};
			}
			current = skip();
			return {
				next: function() {
					var result = current;
					if (result) { current = skip(); }
					return result;
				},
				hasNext: function() {
					return current !== null;
				}
			};
		},
		/**
		 * Notifies the annotation model that the given annotation has been modified.
		 * <p>The annotation model listeners are notified of this change.</p>
		 *
		 * @param {orion.editor.Annotation} annotation the modified annotation.
		 *
		 * @see orion.editor.AnnotationModel#addAnnotation
		 */
		modifyAnnotation: function(annotation) {
			if (!annotation) { return; }
			var index = this._getAnnotationIndex(annotation);
			if (index < 0) { return; }
			var e = {
				type: "Changed", //$NON-NLS-0$
				added: [],
				removed: [],
				changed: [annotation]
			};
			this.onChanged(e);
		},
		/**
		 * Notifies all listeners that the annotation model has changed.
		 *
		 * @param {orion.editor.Annotation[]} added The list of annotation being added to the model.
		 * @param {orion.editor.Annotation[]} changed The list of annotation modified in the model.
		 * @param {orion.editor.Annotation[]} removed The list of annotation being removed from the model.
		 * @param {ModelChangedEvent} textModelChangedEvent the text model changed event that trigger this change, can be null if the change was trigger by a method call (for example, {@link #addAnnotation}).
		 */
		onChanged: function(e) {
			return this.dispatchEvent(e);
		},
		/**
		 * Removes all annotations of the given <code>type</code>. All annotations
		 * are removed if the type is not specified.
		 * <p>The annotation model listeners are notified of this change.  Only one changed event is generated.</p>
		 *
		 * @param {Object} type the type of annotations to be removed.
		 *
		 * @see orion.editor.AnnotationModel#removeAnnotation
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
						removed.splice(0, 0, annotation);
						annotation._annotationModel = null;
					}
				}
			} else {
				removed = annotations;
				annotations = [];
			}
			var e = {
				type: "Changed", //$NON-NLS-0$
				removed: removed,
				added: [],
				changed: []
			};
			this.onChanged(e);
		},
		/**
		 * Removes an annotation from the annotation model.
		 * <p>The annotation model listeners are notified of this change.</p>
		 *
		 * @param {orion.editor.Annotation} annotation the annotation to be removed.
		 *
		 * @see orion.editor.AnnotationModel#addAnnotation
		 */
		removeAnnotation: function(annotation) {
			if (!annotation) { return; }
			var index = this._getAnnotationIndex(annotation);
			if (index < 0) { return; }
			annotation._annotationModel = null;
			var e = {
				type: "Changed", //$NON-NLS-0$
				removed: this._annotations.splice(index, 1),
				added: [],
				changed: []
			};
			this.onChanged(e);
		},
		/**
		 * Removes and adds the specifed annotations to the annotation model.
		 * <p>The annotation model listeners are notified of this change.  Only one changed event is generated.</p>
		 *
		 * @param {orion.editor.Annotation} remove the annotations to be removed.
		 * @param {orion.editor.Annotation} add the annotations to be added.
		 *
		 * @see orion.editor.AnnotationModel#addAnnotation
		 * @see orion.editor.AnnotationModel#removeAnnotation
		 */
		replaceAnnotations: function(remove, add) {
			var annotations = this._annotations, i, index, annotation, removed = [];
			if (remove) {
				for (i = remove.length - 1; i >= 0; i--) {
					annotation = remove[i];
					index = this._getAnnotationIndex(annotation);
					if (index < 0) { continue; }
					annotation._annotationModel = null;
					annotations.splice(index, 1);
					removed.splice(0, 0, annotation);
				}
			}
			if (!add) { add = []; }
			for (i = 0; i < add.length; i++) {
				annotation = add[i];
				index = binarySearch(annotations, annotation.start);
				annotation._annotationModel = this;
				annotations.splice(index, 0, annotation);
			}
			var e = {
				type: "Changed", //$NON-NLS-0$
				removed: removed,
				added: add,
				changed: []
			};
			
			this.onChanged(e);
		},
		/**
		 * Sets the text model of the annotation model.  The annotation
		 * model listens for changes in the text model to update and remove
		 * annotations that are affected by the change.
		 *
		 * @param {orion.editor.TextModel} textModel the text model.
		 *
		 * @see orion.editor.AnnotationModel#getTextModel
		 */
		setTextModel: function(textModel) {
			if (this._model) {
				this._model.removeEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
			}
			this._model = textModel;
			if (this._model) {
				this._model.addEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
			}
		},
		/** @ignore */
		_getAnnotationIndex: function(annotation) {
			var annotations = this._annotations;
			var index = binarySearch(annotations, annotation.start);
			while (index < annotations.length && annotations[index].start === annotation.start) {
				if (annotations[index] === annotation) {
					return index;
				}
				index++;
			}
			return -1;
		},
		/** @ignore */
		_onChanged: function(modelChangedEvent) {
			var start = modelChangedEvent.start;
			var addedCharCount = modelChangedEvent.addedCharCount;
			var removedCharCount = modelChangedEvent.removedCharCount;
			var annotations = this._annotations, end = start + removedCharCount;
			//TODO binary search does not work for range intersection when there are overlaping ranges, need interval search tree for this
			var startIndex = 0;
			if (!(0 <= startIndex && startIndex < annotations.length)) { return; }
			var e = {
				type: "Changed", //$NON-NLS-0$
				added: [],
				removed: [],
				changed: [],
				textModelChangedEvent: modelChangedEvent
			};
			var changeCount = addedCharCount - removedCharCount, i;
			for (i = startIndex; i < annotations.length; i++) {
				var annotation = annotations[i];
				if (annotation.start >= end) {
					annotation._oldStart = annotation.start;
					annotation._oldEnd = annotation.end;
					annotation.start += changeCount;
					annotation.end += changeCount;
					e.changed.push(annotation);
				} else if (annotation.end <= start) {
					//nothing
				} else if (annotation.start <= start && end < annotation.end) {//Annotation renderer does not render the last character
					annotation._oldStart = annotation.start;
					annotation._oldEnd = annotation.end;
					annotation.end += changeCount;
					e.changed.push(annotation);
				} else {
					annotations.splice(i, 1);
					e.removed.push(annotation);
					annotation._annotationModel = null;
					if (annotation.expand) {
						annotation.expand();
					}
					i--;
				}
			}
			if (e.added.length > 0 || e.removed.length > 0 || e.changed.length > 0) {
				this.onChanged(e);
			}
		}
	};
	mEventTarget.EventTarget.addMixin(AnnotationModel.prototype);

	/**
	 * Constructs a new styler for annotations.
	 *
	 * @param {orion.editor.TextView} view The styler view.
	 * @param {orion.editor.AnnotationModel} view The styler annotation model.
	 *
	 * @class This object represents a styler for annotation attached to a text view.
	 * @name orion.editor.AnnotationStyler
	 * @borrows orion.editor.AnnotationTypeList#addAnnotationType as #addAnnotationType
	 * @borrows orion.editor.AnnotationTypeList#getAnnotationTypePriority as #getAnnotationTypePriority
	 * @borrows orion.editor.AnnotationTypeList#getAnnotationsByType as #getAnnotationsByType
	 * @borrows orion.editor.AnnotationTypeList#isAnnotationTypeVisible as #isAnnotationTypeVisible
	 * @borrows orion.editor.AnnotationTypeList#removeAnnotationType as #removeAnnotationType
	 */
	function AnnotationStyler (view, annotationModel) {
		this._view = view;
		this._annotationModel = annotationModel;
		var self = this;
		this._listener = {
			onDestroy: function(e) {
				self._onDestroy(e);
			},
			onLineStyle: function(e) {
				self._onLineStyle(e);
			},
			onChanged: function(e) {
				self._onAnnotationModelChanged(e);
			}
		};
		view.addEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
		view.addEventListener("postLineStyle", this._listener.onLineStyle); //$NON-NLS-0$
		annotationModel.addEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
	}
	AnnotationStyler.prototype = /** @lends orion.editor.AnnotationStyler.prototype */ {
		/**
		 * Destroys the styler.
		 * <p>
		 * Removes all listeners added by this styler.
		 * </p>
		 */
		destroy: function() {
			var view = this._view;
			if (view) {
				view.removeEventListener("Destroy", this._listener.onDestroy); //$NON-NLS-0$
				view.removeEventListener("LineStyle", this._listener.onLineStyle); //$NON-NLS-0$
				this.view = null;
			}
			var annotationModel = this._annotationModel;
			if (annotationModel) {
				annotationModel.removeEventListener("Changed", this._listener.onChanged); //$NON-NLS-0$
				annotationModel = null;
			}
		},
		_mergeStyle: function(result, style) {
			if (style) {
				if (!result) { result = {}; }
				if (result.styleClass && style.styleClass && result.styleClass !== style.styleClass) {
					result.styleClass += " " + style.styleClass; //$NON-NLS-0$
				} else {
					result.styleClass = style.styleClass;
				}
				var prop;
				if (style.tagName) {
					if (!result.tagName) {
						result.tagName = style.tagName;
					}
				}
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
			if (!ranges) {
				ranges = [];
			}
			var mergedStyle, i = binarySearch(ranges, styleRange.start, true);
			for (; i<ranges.length && styleRange; i++) {
				var range = ranges[i];
				if (styleRange.end <= range.start) { break; }
				if (styleRange.start >= range.end) { continue; }
				mergedStyle = this._mergeStyle({}, range.style);
				mergedStyle = this._mergeStyle(mergedStyle, styleRange.style);
				var args = [];
				args.push(i, 1);
				if (styleRange.start < range.start) {
					args.push({start: styleRange.start, end: range.start, style: styleRange.style});
				}
				if (styleRange.start > range.start) {
					args.push({start: range.start, end: styleRange.start, style: range.style});
				}
				args.push({start: Math.max(range.start, styleRange.start), end: Math.min(range.end, styleRange.end), style: mergedStyle});
				if (styleRange.end < range.end) {
					args.push({start: styleRange.end, end: range.end, style: range.style});
				}
				if (styleRange.end > range.end) {
					styleRange = {start: range.end, end: styleRange.end, style: styleRange.style};
				} else {
					styleRange = null;
				}
				Array.prototype.splice.apply(ranges, args);
			}
			if (styleRange) {
				mergedStyle = this._mergeStyle({}, styleRange.style);
				ranges.splice(i, 0, {start: styleRange.start, end: styleRange.end, style: mergedStyle});
			}
			return ranges;
		},
		_onAnnotationModelChanged: function(e) {
			var view = this._view;
			if (!view) { return; }
			var self = this;
			var model = view.getModel();
			function redrawRange(start, end) {
				if (model.getBaseModel) {
					start = model.mapOffset(start, true);
					end = model.mapOffset(end, true);
				}
				if (start !== -1 && end !== -1) {
					view.redrawRange(start, end);
				}
			}
			function redraw(changes, changed) {
				for (var i = 0; i < changes.length; i++) {
					if (!self.isAnnotationTypeVisible(changes[i].type)) { continue; }
					var change = changes[i];
					redrawRange(change.start, change.end);
					if (changed && change._oldStart !== undefined && change._oldEnd) {
						redrawRange(change._oldStart, change._oldEnd);
					}
				}
			}
			redraw(e.added);
			redraw(e.removed);
			redraw(e.changed, true);
		},
		_onDestroy: function(e) {
			this.destroy();
		},
		_onLineStyle: function (e) {
			var annotationModel = this._annotationModel;
			var viewModel = e.textView.getModel();
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
				if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
				if (annotation.rangeStyle) {
					var annotationStart = annotation.start;
					var annotationEnd = annotation.end;
					if (baseModel !== viewModel) {
						annotationStart = viewModel.mapOffset(annotationStart, true);
						annotationEnd = viewModel.mapOffset(annotationEnd, true);
					}
					e.ranges = this._mergeStyleRanges(e.ranges, {start: annotationStart, end: annotationEnd, style: annotation.rangeStyle});
				}
				if (annotation.lineStyle) {
					e.style = this._mergeStyle({}, e.style);
					e.style = this._mergeStyle(e.style, annotation.lineStyle);
				}
			}
		}
	};
	AnnotationTypeList.addMixin(AnnotationStyler.prototype);

	return {
		FoldingAnnotation: FoldingAnnotation,
		AnnotationType: AnnotationType,
		AnnotationTypeList: AnnotationTypeList,
		AnnotationModel: AnnotationModel,
		AnnotationStyler: AnnotationStyler
	};
});
