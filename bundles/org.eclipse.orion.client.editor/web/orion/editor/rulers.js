/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/**
 * @class Provides the various rulers that show up on the left and right sides of the editor.  The rulers
 * 			contain annotations with varying styles, hovers and on click behaviours.
 */
/*eslint-env browser, amd*/
define("orion/editor/rulers", [
	'i18n!orion/editor/nls/messages',
	'orion/editor/textView',
	'orion/editor/annotations',
	'orion/editor/tooltip', 
	'orion/objects',
	'orion/editor/util',
	'orion/util'
], function(messages, mTextView, mAnnotations, mTooltip, objects, textUtil, util) {

	function BaseRuler (rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left"; //$NON-NLS-0$
		this._overview = rulerOverview || "page"; //$NON-NLS-0$
		this._rulerStyle = rulerStyle;
		this._view = null;
	}
	BaseRuler.prototype = /** @lends orion.editor.BaseRuler.prototype */ {
		/**
		 * Returns the ruler location.
		 *
		 * @returns {String} the ruler location, which is either "left" or "right" or "margin".
		 *
		 * @see orion.editor.Ruler#getOverview
		 */
		getLocation: function() {
			return this._location;
		},
		/**
		 * Returns the ruler overview type.
		 *
		 * @returns {String} the overview type, which is either "page" or "document" or "fixed".
		 *
		 * @see orion.editor.Ruler#getLocation
		 */
		getOverview: function() {
			return this._overview;
		},
		/**
		 * Returns the style information for the ruler.
		 *
		 * @returns {orion.editor.Style} the style information.
		 */
		getRulerStyle: function() {
			return this._rulerStyle;
		},
		/**
		 * Returns the text view.
		 *
		 * @returns {orion.editor.TextView} the text view.
		 *
		 * @see orion.editor.Ruler#setView
		 */
		getView: function() {
			return this._view;
		},
		/**
		 * Sets the view for the ruler.
		 * <p>
		 * This method is called by the text view when the ruler
		 * is added to the view.
		 * </p>
		 *
		 * @param {orion.editor.TextView} view the text view.
		 */
		setView: function (view) {
			if (this._onTextModelChanged && this._view) {
				this._view.removeEventListener("ModelChanged", this._listener.onTextModelChanged); //$NON-NLS-0$
			}
			this._view = view;
			if (this._onTextModelChanged && this._view) {
				this._view.addEventListener("ModelChanged", this._listener.onTextModelChanged); //$NON-NLS-0$
			}
		},
	};

	/**
	 * Constructs a new ruler. 
	 * <p>
	 * The default implementation does not implement all the methods in the interface
	 * and is useful only for objects implementing rulers.
	 * <p/>
	 * 
	 * @param {orion.editor.AnnotationModel} annotationModel the annotation model for the ruler.
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {String} [rulerOverview="page"] the overview for the ruler.
	 * @param {orion.editor.Style} [rulerStyle] the style for the ruler. 
	 * 
	 * @class This interface represents a ruler for the text view.
	 * <p>
	 * A Ruler is a graphical element that is placed either on the left or on the right side of 
	 * the view. It can be used to provide the view with per line decoration such as line numbering,
	 * bookmarks, breakpoints, folding disclosures, etc. 
	 * </p><p>
	 * There are two types of rulers: page and document. A page ruler only shows the content for the lines that are
	 * visible, while a document ruler always shows the whole content.
	 * </p>
	 * <b>See:</b><br/>
	 * {@link orion.editor.LineNumberRuler}<br/>
	 * {@link orion.editor.AnnotationRuler}<br/>
	 * {@link orion.editor.OverviewRuler}<br/> 
	 * {@link orion.editor.TextView}<br/>
	 * {@link orion.editor.TextView#addRuler}
	 * </p>		 
	 * @name orion.editor.Ruler
	 * @borrows orion.editor.AnnotationTypeList#addAnnotationType as #addAnnotationType
	 * @borrows orion.editor.AnnotationTypeList#getAnnotationTypePriority as #getAnnotationTypePriority
	 * @borrows orion.editor.AnnotationTypeList#getAnnotationsByType as #getAnnotationsByType
	 * @borrows orion.editor.AnnotationTypeList#isAnnotationTypeVisible as #isAnnotationTypeVisible
	 * @borrows orion.editor.AnnotationTypeList#removeAnnotationType as #removeAnnotationType
	 */
	function Ruler (annotationModel, rulerLocation, rulerOverview, rulerStyle) {
		BaseRuler.call(this, rulerLocation, rulerOverview, rulerStyle);
		var self = this;
		this._listener = {
			onTextModelChanged: function(e) {
				self._onTextModelChanged(e);
			},
			onAnnotationModelChanged: function(e) {
				self._onAnnotationModelChanged(e);
			}
		};
		this.setAnnotationModel(annotationModel);
	}
	Ruler.prototype = objects.mixin(new BaseRuler(), /** @lends orion.editor.Ruler.prototype */ {
		/**
		 * Returns the annotations for a given line range merging multiple
		 * annotations when necessary.
		 * <p>
		 * This method is called by the text view when the ruler is redrawn.
		 * </p>
		 *
		 * @param {Number} startLine the start line index
		 * @param {Number} endLine the end line index
		 * @return {orion.editor.Annotation[]} the annotations for the line range. The array might be sparse.
		 */
		getAnnotations: function(startLine, endLine) {
			var annotationModel = this._annotationModel;
			if (!annotationModel) { return []; }
			var model = this._view.getModel();
			var start = model.getLineStart(startLine);
			var end = model.getLineEnd(endLine - 1);
			var baseModel = model;
			if (model.getBaseModel) {
				baseModel = model.getBaseModel();
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var result = [];
			var annotations = this.getAnnotationsByType(annotationModel, start, end);
			for (var i = 0; i < annotations.length; i++) {
				var annotation = annotations[i];
				var annotationLineStart = baseModel.getLineAtOffset(annotation.start);
				var annotationLineEnd = baseModel.getLineAtOffset(Math.max(annotation.start, annotation.end - 1));
				for (var lineIndex = annotationLineStart; lineIndex<=annotationLineEnd; lineIndex++) {
					var visualLineIndex = lineIndex;
					if (model !== baseModel) {
						var ls = baseModel.getLineStart(lineIndex);
						ls = model.mapOffset(ls, true);
						if (ls === -1) { continue; }
						visualLineIndex = model.getLineAtOffset(ls);
					}
					if (!(startLine <= visualLineIndex && visualLineIndex < endLine)) { continue; }
					var rulerAnnotation = this._mergeAnnotation(result[visualLineIndex], annotation, lineIndex - annotationLineStart, annotationLineEnd - annotationLineStart + 1);
					if (rulerAnnotation) {
						result[visualLineIndex] = rulerAnnotation;
					}
				}
			}
			if (!this._multiAnnotation && this._multiAnnotationOverlay) {
				for (var k in result) {
					if (result[k]._multiple) {
						result[k].html = result[k].html + this._multiAnnotationOverlay.html;
					}
				}
			}
			return result;
		},
		/**
		 * Returns the annotation model.
		 *
		 * @returns {orion.editor.AnnotationModel} the ruler annotation model.
		 *
		 * @see orion.editor.Ruler#setAnnotationModel
		 */
		getAnnotationModel: function() {
			return this._annotationModel;
		},
		/**
		 * Returns the widest annotation which determines the width of the ruler.
		 * <p>
		 * If the ruler does not have a fixed width it should provide the widest
		 * annotation to avoid the ruler from changing size as the view scrolls.
		 * </p>
		 * <p>
		 * This method is called by the text view when the ruler is redrawn.
		 * </p>
		 *
		 * @returns {orion.editor.Annotation} the widest annotation.
		 *
		 * @see orion.editor.Ruler#getAnnotations
		 */
		getWidestAnnotation: function() {
			return null;
		},
		/**
		 * Sets the annotation model for the ruler.
		 *
		 * @param {orion.editor.AnnotationModel} annotationModel the annotation model.
		 *
		 * @see orion.editor.Ruler#getAnnotationModel
		 */
		setAnnotationModel: function (annotationModel) {
			if (this._annotationModel) {
				this._annotationModel.removeEventListener("Changed", this._listener.onAnnotationModelChanged); //$NON-NLS-0$
			}
			this._annotationModel = annotationModel;
			if (this._annotationModel) {
				this._annotationModel.addEventListener("Changed", this._listener.onAnnotationModelChanged); //$NON-NLS-0$
			}
		},
		/**
		 * Sets the annotation that is displayed when a given line contains multiple
		 * annotations.  This annotation is used when there are different types of
		 * annotations in a given line.
		 *
		 * @param {orion.editor.Annotation} annotation the annotation for lines with multiple annotations.
		 * 
		 * @see orion.editor.Ruler#setMultiAnnotationOverlay
		 */
		setMultiAnnotation: function(annotation) {
			this._multiAnnotation = annotation;
		},
		/**
		 * Sets the annotation that overlays a line with multiple annotations.  This annotation is displayed on
		 * top of the computed annotation for a given line when there are multiple annotations of the same type
		 * in the line. It is also used when the multiple annotation is not set.
		 *
		 * @param {orion.editor.Annotation} annotation the annotation overlay for lines with multiple annotations.
		 * 
		 * @see orion.editor.Ruler#setMultiAnnotation
		 */
		setMultiAnnotationOverlay: function(annotation) {
			this._multiAnnotationOverlay = annotation;
		},
		/**
		 * This event is sent when the user clicks a line annotation. We select an annotation on the line using
		 * the following logic:
		 * 1) If no selection or selection is on another line, select the first annotation
		 * 2) If an annotation is selected, select the next annotation in the model
		 * 3) If there is a selection that does not match an annotation, select the first annotation after the selection start
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the annotation under the pointer.
		 * @param {DOMEvent} e the click event.
		 */
		onClick: function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var view = this._view;
			
			var model = view.getModel();
			var lineStart = model.getLineStart(lineIndex);
			var lineEnd = model.getLineEnd(lineIndex, true);
			var selectionStart = view.getSelection().start;
			var selectionEnd = view.getSelection().end;
			
			var annotationModel = this._annotationModel;
			var annotation, start, end;
			if (annotationModel){

				if (model.getBaseModel) {
					lineStart = model.mapOffset(lineStart);
					lineEnd = model.mapOffset(lineEnd);
					selectionStart = model.mapOffset(selectionStart);
					selectionEnd = model.mapOffset(selectionEnd);
				}
				
				var self = this;
				annotation = this._findNextAnnotation(annotationModel, lineStart, lineEnd, selectionStart, selectionEnd, 
					function(annotationType){
						return self.isAnnotationTypeVisible(annotationType);
					}
				);
				// Select the annotation or the start of the line
				start = annotation ? annotation.start : lineStart;
				end = annotation ? annotation.end : lineStart;
				
				if (model.getBaseModel) {
					start = model.mapOffset(start, true);
					end = model.mapOffset(end, true);
				}
				
				// TODO What does this code do
				if (annotation && annotation.groupId !== undefined) {
					if (this._currentClickGroup === annotation.groupId) {
						this._currentClickGroup = null;
					} else {
						this._currentClickGroup = annotation.groupId;
					}
					this._setCurrentGroup(lineIndex);
				}
			}
			
			// Set the selection before opening the tooltip otherwise the tooltip will be closed immediately
			this._view.setSelection(end, start, 1/3, function(){});
			
			// Open the tooltip for the selected annotation in the same location as the multi-annotation ruler tooltip.
			var tooltip = mTooltip.Tooltip.getTooltip(this._view);
			if (tooltip) {
				if (annotation && this.getLocation() === "left"){ //$NON-NLS-0$
					tooltip.show({getTooltipInfo: function() {
							return self._getTooltipInfo([annotation]);
						}
					}, false, false);
				} else {
					tooltip.hide();
				}
			}
		},
		/**
		 * This event is sent when the user double clicks a line annotation.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the annotation under the pointer.
		 * @param {DOMEvent} e the double click event.
		 * @callback
		 */
		onDblClick: function(lineIndex, e) {
		},
		/**
		 * This event is sent when the user moves the mouse over a line annotation.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the annotation under the pointer.
		 * @param {DOMEvent} e the mouse move event.
		 */
		onMouseMove: function(lineIndex, e) {
			var tooltip = mTooltip.Tooltip.getTooltip(this._view);
			if (!tooltip) { return; }
			if (tooltip.isVisible() && this._tooltipLineIndex === lineIndex) { return; }
			this._tooltipLineIndex = lineIndex;
			
			// Prevent spurious mouse event (e.g. on a scroll)					
			if (e.clientX === this._lastMouseX
				&& e.clientY === this._lastMouseY) {
				return;
			}
			
			this._lastMouseX = e.clientX;
			this._lastMouseY = e.clientY;

			if (this._hoverTimeout) {
				window.clearTimeout(this._hoverTimeout);
				this._hoverTimeout = null;
			}
			
			var target = e.target ? e.target : e.srcElement;
			var bounds = target.getBoundingClientRect();
			this._curElementBounds = Object.create(null);
			this._curElementBounds.top = bounds.top;
			this._curElementBounds.left = bounds.left;
			this._curElementBounds.height = bounds.height;
			this._curElementBounds.width = bounds.width;
			
			// If we have the entire ruler selected, just use a 1 pixel high area in the ruler (Bug 463486)
			if (target === this.node){
				this._curElementBounds.top = e.clientY;
				this._curElementBounds.height = 1;
			}
			
			var self = this;
			self._hoverTimeout = window.setTimeout(function() {
				self._hoverTimeout = null;
				tooltip.onHover({
					getTooltipInfo: function() {
						var annotations = self._getAnnotationsAtLineIndex(self._tooltipLineIndex);
						var content = self._getTooltipContents(self._tooltipLineIndex, annotations);
						return self._getTooltipInfo(content, e.clientY, {source: "ruler", rulerLocation: self.getLocation()}); //$NON-NLS-0$
					}
				}, e.clientX, e.clientY);
			}, 175);
		},
		/**
		 * This event is sent when the mouse pointer enters a line annotation.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the annotation under the pointer.
		 * @param {DOMEvent} e the mouse over event.
		 */
		onMouseOver: function(lineIndex, e) {
			this.onMouseMove(lineIndex, e);
			if (!this._currentClickGroup) {
				this._setCurrentGroup(lineIndex);
			}
		},
		/**
		 * This event is sent when the mouse pointer exits a line annotation.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the annotation under the pointer.
		 * @param {DOMEvent} e the mouse out event.
		 * @callback
		 */
		onMouseOut: function(lineIndex, e) {
			if (!this._currentClickGroup) {
				this._setCurrentGroup(-1);
			}

			if (this._hoverTimeout) {
				window.clearTimeout(this._hoverTimeout);
				this._hoverTimeout = null;
			}
		},
		/**
		 * @name _findNextAnnotation
		 * @description Looks at all annotations in the given range and attempt to find the next valid
		 * 				annotation after the current selection.
		 * @function
		 * @private
		 * @param annotationModel The annotation model to lookup annotations in
		 * @param rangeStart The start range to search for annotations (required)
		 * @param rangeEnd The end range to search for annotations (required)
		 * @param selectionStart The start of the current selection (optional)
		 * @param selectionEnd The end of the current selection (optional)
		 * @param isAnnotationTypeVisible A function callback to check if a given annotation type is valid or visible (optional)
		 * @returns The next annotation in the list or <code>null</code>
		 */
		_findNextAnnotation: function(annotationModel, rangeStart, rangeEnd, selectionStart, selectionEnd, isAnnotationTypeVisible){
			var annotation = null;
			var selectedAnnotation;
			var searchStart = rangeStart;
			
			if (selectionStart >= 0 && selectionEnd >= 0){
				if (selectionStart >= rangeStart && selectionStart < rangeEnd){
					searchStart = selectionStart;
					var selectedAnnotations = annotationModel.getAnnotations(selectionStart, selectionEnd);
					while (!selectedAnnotation && selectedAnnotations.hasNext()){
						var current = selectedAnnotations.next();
						if (isAnnotationTypeVisible && !isAnnotationTypeVisible(current.type)) { continue; }
						if (current.start === selectionStart && current.end === selectionEnd){
							selectedAnnotation = current;
						}
					}
				}
			}
			
			var iter = annotationModel.getAnnotations(searchStart, rangeEnd);
			var useNextValid;
			while (iter.hasNext()){
				current = iter.next();
				if (isAnnotationTypeVisible && !isAnnotationTypeVisible(current.type)) { continue; }
				// Default to first visible annotation
				if (!annotation){
					annotation = current;
				}
				// If no selected annotation, use the first in the list
				if (!selectedAnnotation){
					annotation = current;
					break;
				}
				// If the selected annotation was found, use the next annotation
				// NOTE: If two annotations have the same range, we skip to the next annotation so don't flip between them
				if (useNextValid && (selectedAnnotation.start !== current.start || selectedAnnotation.end !== current.end)){
					useNextValid = false;
					annotation = current;
					break;
				}
				// Found the selected annotation, use the next in the list
				if (selectedAnnotation && selectedAnnotation === current){
					useNextValid = true;
				}
			}
			if (useNextValid){
				annotation = null; // Last annotation on the line was selected, go to line start
			}
			
			return annotation;
		},
		
		_getAnnotationsAtLineIndex: function _getAnnotationsAtLineIndex(lineIndex){
			if (lineIndex === undefined) { return; }
			var view = this._view;
			var annotationModel = this._annotationModel;
			var annotations = [];
			var model;
			
			//check if the current view exists, if not return empty array
			if (view) {
				model = view.getModel();
			} else {
				return [];
			}
			
			// check if both model exists
			if (annotationModel && model) {
				var start = model.getLineStart(lineIndex);
				var end = model.getLineEnd(lineIndex);
				if (model.getBaseModel) {
					start = model.mapOffset(start);
					end = model.mapOffset(end);
				}
				annotations = this.getAnnotationsByType(annotationModel, start, end);
			}
			return annotations;
		},
		/** @ignore */
		_getTooltipInfo: function(contents, y, context) {
			if (!contents) { return null; } // TODO: shouldn't this check the length, it'll never be null
		
			var hoverArea = Object.create(null);
			hoverArea.top = this._curElementBounds.top;
			hoverArea.left = this._curElementBounds.left;
			hoverArea.height = this._curElementBounds.height;
			hoverArea.width = this._curElementBounds.width;
			
			if (typeof contents === 'string' && y) {
				// Hack for line numbers
				hoverArea.top = y;
				hoverArea.height = 1;
			}
			
			var rulerLocation = this.getLocation();
			var rulerStyle = this.getRulerStyle();
			// The tooltip is positioned opposite to where the ruler is
			var position = rulerLocation === "left" ? "right" : "left"; //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
			
			var offsetX = 0;
			var offsetY = 0;
			if (this._view){
				var viewRect = this._view._clientDiv.getBoundingClientRect();
				offsetX = viewRect.left - (hoverArea.left + hoverArea.width);
			} else {
				offsetX = hoverArea.width;
			}
			offsetY = hoverArea.height;
			if (position === "left") {
				offsetX = -25;
				// Hack for when the hoverArea is a sliver of the ruler, ruler is 2px wider than annotations
				if (hoverArea.height === 1){
					offsetX += 2;
				}
			}
			// Adjust the tooltip for folding comments to exactly cover the unfolded text location
			if (rulerStyle.styleClass.indexOf("folding") >= 0){ //$NON-NLS-0$
				offsetY -= 14;
			}
			
			var info = {
				contents: contents,
				position: position,
				tooltipOffsetX: offsetX,
				tooltipOffsetY: offsetY,
				anchorArea: hoverArea,
				context: context
			};
			return info;
		},
		/**
		 * @name _getTooltipContents
		 * @description Overridden by different rulers to provide customer tooltip content
		 * @function
		 * @private
		 * @param lineIndex
		 * @param annotations
		 * @returns returns
		 * @callback
		 */
		_getTooltipContents: function _getTooltipContents(lineIndex, annotations){
			return annotations;
		},
		
		_getOnClickTooltipInfo: function(annotation) {
			var view = this._view;
			var hoverArea = Object.create(null);
			hoverArea.top = this._curElementBounds.top;
			hoverArea.left = this._curElementBounds.left;
			hoverArea.height = this._curElementBounds.height;
			hoverArea.width = this._curElementBounds.width;
			var rulerLocation = this.getLocation();
			var position = rulerLocation === "left" ? "right" : "left"; //$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$
			var info = {
				contents: [annotation],
				position: position,
				anchorArea: hoverArea
			};
			
			if (view){
				var viewRect = view._clientDiv.getBoundingClientRect();
				info.offsetX = viewRect.left - (hoverArea.left + hoverArea.width);
			} else {
				info.offsetX = hoverArea.width;
			}

			info.offsetY = hoverArea.height;
			if (info.position === "left") {
				info.offsetX = 20;
			}
			return info;
		},
		/** @ignore */
		_onAnnotationModelChanged: function(e) {
			var view = this._view;
			if (!view) { return; }
			var model = view.getModel(), self = this;
			var lineCount = model.getLineCount();
			if (e.textModelChangedEvent) {
				var start = e.textModelChangedEvent.start;
				if (model.getBaseModel) { start = model.mapOffset(start, true); }
				var startLine = model.getLineAtOffset(start);
				view.redrawLines(startLine, lineCount, self);
				return;
			}
			function redraw(changes) {
				for (var i = 0; i < changes.length; i++) {
					if (!self.isAnnotationTypeVisible(changes[i].type)) { continue; }
					start = changes[i].start;
					var end = changes[i].end;
					if (model.getBaseModel) {
						start = model.mapOffset(start, true);
						end = model.mapOffset(end, true);
					}
					if (start !== -1 && end !== -1) {
						view.redrawLines(model.getLineAtOffset(start), model.getLineAtOffset(Math.max(start, end - 1)) + 1, self);
					}
				}
			}
			redraw(e.added);
			redraw(e.removed);
			redraw(e.changed);
		},
		/** @ignore */
		_mergeAnnotation: function(result, annotation, annotationLineIndex, annotationLineCount) {
			if (!result) { result = {}; }
			if (annotationLineIndex === 0) {
				if (result.html && annotation.html) {
					if (annotation.html !== result.html) {
						if (!result._multiple && this._multiAnnotation) {
							result.html = this._multiAnnotation.html;
						}
					} 
					result._multiple = true;
				} else {
					result.html = annotation.html;
				}
			}
			result.style = this._mergeStyle(result.style, annotation.style);
			return result;
		},
		/** @ignore */
		_mergeStyle: function(result, style) {
			if (style) {
				if (!result) { result = {}; }
				if (result.styleClass && style.styleClass && result.styleClass !== style.styleClass) {
					result.styleClass += " " + style.styleClass; //$NON-NLS-0$
				} else {
					result.styleClass = style.styleClass;
				}
				var prop;
				if (style.style) {
					if (!result.style) { result.style  = {}; }
					for (prop in style.style) {
						if (result.style[prop] === undefined) {
							result.style[prop] = style.style[prop];
						}
					}
				}
				if (style.attributes) {
					if (!result.attributes) { result.attributes  = {}; }
					for (prop in style.attributes) {
						if (result.attributes[prop] === undefined) {
							result.attributes[prop] = style.attributes[prop];
						}
					}
				}
			}
			return result;
		},
		_setCurrentGroup: function(lineIndex) {
			var annotationModel = this._annotationModel;
			var groupAnnotation = null;
			var model = annotationModel.getTextModel();
			var annotation;
			var annotations;
			var currentGroupAnnotation = this._currentGroupAnnotation;
			if (lineIndex !== -1) {
				var start = model.getLineStart(lineIndex);
				var end = model.getLineEnd(lineIndex);
				if (model.getBaseModel) {
					start = model.mapOffset(start);
					end = model.mapOffset(end);
				}
				annotations = annotationModel.getAnnotations(start, end);
				while(annotations.hasNext()){
					annotation = annotations.next();
					if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
					if (annotation.start <= start && annotation.end >= end){
						if (annotation.groupId !== undefined) {
							groupAnnotation = annotation;
							break;
						}
					}
				}
				if (currentGroupAnnotation && groupAnnotation) {
					if (currentGroupAnnotation.groupId === groupAnnotation.groupId) {
						return;
					}
				}
			}
			this._currentGroupAnnotation = null;
			if (currentGroupAnnotation) {
				annotationModel.removeAnnotations(currentGroupAnnotation.groupType);
			}
			if (!groupAnnotation) { return; }
			
			if (lineIndex === -1) { return; }
			this._currentGroupAnnotation = groupAnnotation;
			annotations = annotationModel.getAnnotations();
			var add = [];
			while (annotations.hasNext()) {
				annotation = annotations.next();
				delete annotation.groupAnnotation;
				if (annotation.groupId === groupAnnotation.groupId) {
					annotation = annotation.createGroupAnnotation();
					add.push(annotation);
				}
			}
			annotationModel.replaceAnnotations(null, add);
		}
	});
	mAnnotations.AnnotationTypeList.addMixin(Ruler.prototype);

	/**
	 * Constructs a new line numbering ruler. 
	 *
	 * @param {orion.editor.AnnotationModel} annotationModel the annotation model for the ruler.
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {orion.editor.Style} [rulerStyle=undefined] the style for the ruler.
	 * @param {orion.editor.Style} [oddStyle={style: {backgroundColor: "white"}] the style for lines with odd line index.
	 * @param {orion.editor.Style} [evenStyle={backgroundColor: "white"}] the style for lines with even line index.
	 *
	 * @augments orion.editor.Ruler
	 * @class This objects implements a line numbering ruler.
	 *
	 * <p><b>See:</b><br/>
	 * {@link orion.editor.Ruler}
	 * </p>
	 * @name orion.editor.LineNumberRuler
	 */
	function LineNumberRuler (annotationModel, rulerLocation, rulerStyle, oddStyle, evenStyle) {
		Ruler.call(this, annotationModel, rulerLocation, "page", rulerStyle); //$NON-NLS-0$
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}}; //$NON-NLS-0$
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}}; //$NON-NLS-0$
		this._numOfDigits = 0;
		this._firstLine = 1;
	}
	LineNumberRuler.prototype = new Ruler(); 
	/** @ignore */
	LineNumberRuler.prototype.getAnnotations = function(startLine, endLine) {
		var result = Ruler.prototype.getAnnotations.call(this, startLine, endLine);
		var model = this._view.getModel();
		for (var lineIndex = startLine; lineIndex < endLine; lineIndex++) {
			var style = (lineIndex - this._firstLine) & 1 ? this._oddStyle : this._evenStyle;
			var mapLine = lineIndex;
			if (model.getBaseModel) {
				var lineStart = model.getLineStart(mapLine);
				mapLine = model.getBaseModel().getLineAtOffset(model.mapOffset(lineStart));
			}
			if (!result[lineIndex]) { result[lineIndex] = {}; }
			result[lineIndex].html = (this._firstLine + mapLine) + "";
			if (!result[lineIndex].style) { result[lineIndex].style = style; }
		}
		return result;
	};
	/** @ignore */
	LineNumberRuler.prototype.getWidestAnnotation = function() {
		var lineCount = this._view.getModel().getLineCount();
		return this.getAnnotations(lineCount - 1, lineCount)[lineCount - 1];
	};
	/**
	 * Sets the line index displayed for the first line. The default value is
	 * <code>1</code>.
	 *
	 * @param {Number} [lineIndex=1] the first line index displayed
	 */
	LineNumberRuler.prototype.setFirstLine = function(lineIndex) {
		this._firstLine = lineIndex !== undefined ? lineIndex : 1;
	};
	/** @ignore */
	LineNumberRuler.prototype._onTextModelChanged = function(e) {
		var start = e.start;
		var model = this._view.getModel();
		var lineCount = model.getBaseModel ? model.getBaseModel().getLineCount() : model.getLineCount();
		var numOfDigits = ((this._firstLine + lineCount - 1)+"").length;
		if (this._numOfDigits !== numOfDigits) {
			this._numOfDigits = numOfDigits;
			var startLine = model.getLineAtOffset(start);
			this._view.redrawLines(startLine,  model.getLineCount(), this);
		}
	};
	
	/** 
	 * @class This is class represents an annotation for the AnnotationRuler. 
	 * <p> 
	 * <b>See:</b><br/> 
	 * {@link orion.editor.AnnotationRuler}
	 * </p> 
	 * 
	 * @name orion.editor.Annotation 
	 * 
	 * @property {String} [html=""] The html content for the annotation, typically contains an image.
	 * @property {orion.editor.Style} [style] the style for the annotation.
	 * @property {orion.editor.Style} [overviewStyle] the style for the annotation in the overview ruler.
	 */ 
	/**
	 * Constructs a new annotation ruler. 
	 *
	 * @param {orion.editor.AnnotationModel} annotationModel the annotation model for the ruler.
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {orion.editor.Style} [rulerStyle=undefined] the style for the ruler.
	 * @param {orion.editor.Annotation} [defaultAnnotation] the default annotation.
	 *
	 * @augments orion.editor.Ruler
	 * @class This objects implements an annotation ruler.
	 *
	 * <p><b>See:</b><br/>
	 * {@link orion.editor.Ruler}<br/>
	 * {@link orion.editor.Annotation}
	 * </p>
	 * @name orion.editor.AnnotationRuler
	 */
	function AnnotationRuler (annotationModel, rulerLocation, rulerStyle) {
		Ruler.call(this, annotationModel, rulerLocation, "page", rulerStyle); //$NON-NLS-0$
	}
	AnnotationRuler.prototype = new Ruler();
	
	/**
	 * Constructs a new overview ruler. 
	 * <p>
	 * The overview ruler is used in conjunction with a AnnotationRuler, for each annotation in the 
	 * AnnotationRuler this ruler displays a mark in the overview. Clicking on the mark causes the 
	 * view to scroll to the annotated line.
	 * </p>
	 *
	 * @param {orion.editor.AnnotationModel} annotationModel the annotation model for the ruler.
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {orion.editor.Style} [rulerStyle=undefined] the style for the ruler.
	 *
	 * @augments orion.editor.Ruler
	 * @class This objects implements an overview ruler.
	 *
	 * <p><b>See:</b><br/>
	 * {@link orion.editor.AnnotationRuler} <br/>
	 * {@link orion.editor.Ruler} 
	 * </p>
	 * @name orion.editor.OverviewRuler
	 */
	function OverviewRuler (annotationModel, rulerLocation, rulerStyle) {
		Ruler.call(this, annotationModel, rulerLocation, "document", rulerStyle); //$NON-NLS-0$
	}
	OverviewRuler.prototype = new Ruler();
	
	/** @ignore */
	OverviewRuler.prototype.getRulerStyle = function() {
		var result = {style: {lineHeight: "1px", fontSize: "1px"}}; //$NON-NLS-1$ //$NON-NLS-0$
		result = this._mergeStyle(result, this._rulerStyle);
		return result;
	};
	/** @ignore */
	OverviewRuler.prototype._getTooltipContents = function(lineIndex, annotations) {
		if (annotations && annotations.length === 0) {
			var model = this._view.getModel();
			var mapLine = lineIndex;
			if (model.getBaseModel) {
				var lineStart = model.getLineStart(mapLine);
				mapLine = model.getBaseModel().getLineAtOffset(model.mapOffset(lineStart));
			}
			return util.formatMessage(messages.line, mapLine + 1);
		}
		return Ruler.prototype._getTooltipContents.call(this, lineIndex, annotations);
	};
	/** @ignore */
	OverviewRuler.prototype._mergeAnnotation = function(previousAnnotation, annotation, annotationLineIndex, annotationLineCount) {
		if (annotationLineIndex !== 0) { return undefined; }
		var result = previousAnnotation;
		if (!result) {
			//TODO annotationLineCount does not work when there are folded lines
			var height = 3 * annotationLineCount;
			result = {html: "&nbsp;", style: { style: {height: height + "px"}}}; //$NON-NLS-1$ //$NON-NLS-0$
			result.style = this._mergeStyle(result.style, annotation.overviewStyle);
		}
		return result;
	};

	/**
	 * Constructs a new folding ruler. 
	 *
	 * @param {orion.editor.AnnotationModel} annotationModel the annotation model for the ruler.
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {orion.editor.Style} [rulerStyle=undefined] the style for the ruler.
	 *
	 * @augments orion.editor.Ruler
	 * @class This objects implements an overview ruler.
	 *
	 * <p><b>See:</b><br/>
	 * {@link orion.editor.AnnotationRuler} <br/>
	 * {@link orion.editor.Ruler} 
	 * </p>
	 * @name orion.editor.OverviewRuler
	 */
	function FoldingRuler (annotationModel, rulerLocation, rulerStyle) {
		AnnotationRuler.call(this, annotationModel, rulerLocation, rulerStyle);
	}
	FoldingRuler.prototype = new AnnotationRuler();
	
	/** @ignore */
	FoldingRuler.prototype.onClick =  /* @callback */ function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		var annotationModel = this._annotationModel;
		if (!annotationModel) { return; }
		var view = this._view;
		var model = view.getModel();
		var start = model.getLineStart(lineIndex);
		var end = model.getLineEnd(lineIndex, true);
		if (model.getBaseModel) {
			start = model.mapOffset(start);
			end = model.mapOffset(end);
			model = model.getBaseModel();
		}
		var annotation, iter = annotationModel.getAnnotations(start, end);
		while (!annotation && iter.hasNext()) {
			var a = iter.next();
			if (!this.isAnnotationTypeVisible(a.type)) { continue; }
			if (model.getLineAtOffset(a.start) !== model.getLineAtOffset(start)) { continue; }
			annotation = a;
		}
		if (annotation) {
			var tooltip = mTooltip.Tooltip.getTooltip(this._view);
			if (tooltip) {
				tooltip.hide();
			}
			if (annotation.expanded) {
				annotation.collapse();
			} else {
				annotation.expand();
			}
		}
	};
	/** @ignore */
	FoldingRuler.prototype._getTooltipContents = function(lineIndex, annotations) {
		if (annotations && annotations.length > 0) {
			var view = this._view;
			var model = view.getModel();
			var start = model.getLineStart(lineIndex);
			if (model.getBaseModel) {
				start = model.mapOffset(start);
				model = model.getBaseModel();
			}
			var mapLineIndex = model.getLineAtOffset(start);
			for (var i = 0; i < annotations.length; i++) {
				var a = annotations[i];
				if (!this.isAnnotationTypeVisible(a.type)) { continue; }
				if (model.getLineAtOffset(a.start) !== mapLineIndex) { continue; }
				if (annotations[i].expanded) {
					break;
				}
				return AnnotationRuler.prototype._getTooltipContents.call(this, lineIndex, [a]);
			}
		}
		return null;
	};
	/** @ignore */
	FoldingRuler.prototype._onAnnotationModelChanged = function(e) {
		if (e.textModelChangedEvent) {
			AnnotationRuler.prototype._onAnnotationModelChanged.call(this, e);
			return;
		}
		var view = this._view;
		if (!view) { return; }
		var model = view.getModel(), self = this, i;
		var lineCount = model.getLineCount(), lineIndex = lineCount;
		function redraw(changes) {
			for (i = 0; i < changes.length; i++) {
				if (!self.isAnnotationTypeVisible(changes[i].type)) { continue; }
				var start = changes[i].start;
				if (model.getBaseModel) {
					start = model.mapOffset(start, true);
				}
				if (start !== -1) {
					lineIndex = Math.min(lineIndex, model.getLineAtOffset(start));
				}
			}
		}
		redraw(e.added);
		redraw(e.removed);
		redraw(e.changed);
		var rulers = view.getRulers();
		for (i = 0; i < rulers.length; i++) {
			view.redrawLines(lineIndex, lineCount, rulers[i]);
		}
	};
	

	/**
	 * Constructs a new zoom ruler. 
	 *
	 * @param {String} [rulerLocation="left"] the location for the ruler.
	 * @param {orion.editor.Style} [rulerStyle=undefined] the style for the ruler.
	 *
	 * @augments orion.editor.Ruler
	 * @class This objects implements an overview ruler.
	 *
	 * <p><b>See:</b><br/>
	 * {@link orion.editor.AnnotationRuler} <br/>
	 * {@link orion.editor.Ruler} 
	 * </p>
	 * @name orion.editor.OverviewRuler
	 */
	var ZoomRuler = function(rulerLocation, rulerStyle) {
		BaseRuler.call(this, rulerLocation, "fixed", rulerStyle); //$NON-NLS-0$
	};
	
	ZoomRuler.prototype = objects.mixin(new BaseRuler(), {
		setView: function (view) {
			this._destroy();
			BaseRuler.prototype.setView.call(this, view);
			this._create();
		},
		_create: function() {
			var textView = this.getView();
			if (!textView) return;
			function getOptions(options) {
				var rulerTheme = "textviewZoom"; //$NON-NLS-0$
				var theme = options.themeClass;
				if (theme) {
					theme = theme.replace(rulerTheme, "");
					if (theme) { theme = " " + theme; } //$NON-NLS-0$
					theme = rulerTheme + theme;
				} else {
					theme = rulerTheme;
				}
				options.themeClass = theme;
				options.noScroll = true;
				options.readonly = true;
				return options;
			}
			var options = getOptions(textView.getOptions());
			options.parent = this.node;
			var zoomView = this._zoomView = new mTextView.TextView(options);
			zoomView._clientDiv.contentEditable = false;
			zoomView.setModel(textView.getModel());
			var document = textView.getOptions("parent").ownerDocument; //$NON-NLS-0$
			var windowDiv = this._windowDiv = util.createElement(document, "div"); //$NON-NLS-0$
			windowDiv.className ="rulerZoomWindow"; //$NON-NLS-0$
			this.node.appendChild(windowDiv);
			var border = parseInt(textUtil.getNodeStyle(windowDiv, "border-top-width", 0)) + //$NON-NLS-0$
					parseInt(textUtil.getNodeStyle(windowDiv, "border-bottom-width", 0)); //$NON-NLS-0$
			var that = this;
			function updateWindow(scroll, p) {
				var top = scroll.y * p.zoomFactor;
				var height = p.clientHeight * p.zoomFactor;
				that.top = top;
				that.bottom = top + height;
				top = zoomView.convert({y: top}, "document", "page").y; //$NON-NLS-1$ //$NON-NLS-0$
				top = top - that.node.getBoundingClientRect().top;
				windowDiv.style.top = top + "px"; //$NON-NLS-0$
				windowDiv.style.height = (height - border) + "px"; //$NON-NLS-0$
			}
			function getProps() {
				var padding = textView._metrics.viewPadding;
				var zoomPadding = textView._metrics.viewPadding;
				var lineHeight = textView.getLineHeight();
				var zoomLineHeight = zoomView.getLineHeight();
				var lineCount = textView.getModel().getLineCount();
				var documentHeight = textView._lineHeight ? textView._scrollHeight : lineCount * lineHeight;
				var zoomDocumentHeight = zoomView._lineHeight ? zoomView._scrollHeight : lineCount * zoomLineHeight;
				var zoomFactor = zoomDocumentHeight / documentHeight;
				var clientHeight = textView.getClientArea().height + padding.top + padding.bottom;
				var zoomClientHeight = zoomView.getClientArea().height + zoomPadding.top + zoomPadding.bottom;
				var windowHeight = clientHeight * zoomFactor;
				var scrollWidth = textView._metrics.scrollWidth;
				return {
					zoomFactor: zoomFactor,
					documentHeight: documentHeight,
					zoomDocumentHeight: zoomDocumentHeight,
					clientHeight: clientHeight,
					zoomClientHeight: zoomClientHeight,
					scrollWidth: scrollWidth,
					windowHeight: windowHeight,
					padding: padding
				};
			}
			function toZoom(scroll, p) {
				return scroll.y * (p.zoomFactor + (p.windowHeight - p.clientHeight - p.scrollWidth) / p.documentHeight);
			}
			function updateScroll(scroll) {
				scroll = scroll || {y: textView.getTopPixel()};
				var p = getProps();
				var y = toZoom(scroll, p);
				zoomView.setTopPixel(y);
				updateWindow(scroll, p);
			}
			function updateWidth(options) {
				var width;
				if (options.wrapMode && !options.wrapOffset && textView._metrics.charWidth) {
					var div1 = util.createElement(document, "div"); //$NON-NLS-0$
					div1.style.position = "fixed"; //$NON-NLS-0$
					div1.style.left = "-1000px"; //$NON-NLS-0$
					zoomView._clientDiv.appendChild(div1);
					div1.textContent = new Array(Math.ceil(textView.getClientArea().width / textView._metrics.charWidth) + 1).join("a"); //$NON-NLS-0$
					var rect1 = div1.getBoundingClientRect();
					width = Math.min(150, Math.ceil(rect1.right - rect1.left)) + "px"; //$NON-NLS-0$
				} else {
					width = "";
				}
				var oldWidth = that.node.style.width;
				that.node.style.width = width;
				return oldWidth !== width;
			}
			textView.addEventListener("Scroll", this._scrollListener = function(event) { //$NON-NLS-0$
				updateScroll(event.newValue);
			});
			textView.addEventListener("Resize", this._resizeListener = function() { //$NON-NLS-0$
				updateWidth(zoomView.getOptions());
				updateScroll();
			});
			textView.addEventListener("Redraw", this._redrawListener = function(event) { //$NON-NLS-0$
				if (!event.ruler) {
					zoomView.redrawLines(event.startLine, event.endLine);
				}
			});
			textView.addEventListener("Options", this._optionsListener = function(event) { //$NON-NLS-0$
				var options = getOptions(event.options);
				zoomView.setOptions(options);
				updateWidth(zoomView.getOptions());
			});
			zoomView.addEventListener("LineStyle", this._lineListener = function(e) { //$NON-NLS-0$
				textView.onLineStyle(e);
			});
			function down(event, clientY, touch) {
				if (touch || (that.top <= event.y && event.y <= that.bottom)) {
					that.mouseDown = true;
					that.delta = clientY - windowDiv.getBoundingClientRect().top + that.node.getBoundingClientRect().top;
				} else {
					var offset = zoomView.getOffsetAtLocation(event.x, event.y);
					textView.setSelection(offset, offset, 0.5, function() {});
				}
			}
			function up() {
				that.mouseDown = false;
			}
			function move(clientY) {
				if (that.mouseDown) {
					var p = getProps();
					var thumbPos = Math.min(p.zoomClientHeight - p.windowHeight, Math.max(0, clientY - that.delta));
					textView.setTopPixel(thumbPos * (p.documentHeight - p.clientHeight) / Math.min(p.zoomDocumentHeight, p.zoomClientHeight - p.windowHeight));
				}
			}
			function stop(event) {
				event.preventDefault();
			}
			if (util.isIOS || util.isAndroid) {
				windowDiv.addEventListener("touchstart", function(event) { //$NON-NLS-0$
					var touches = event.touches;
					if (touches.length === 1) {
						down(event, event.touches[0].clientY, true);
						event.preventDefault();
					}
				});
				windowDiv.addEventListener("touchend", function(event) { //$NON-NLS-0$
					var touches = event.touches;
					if (touches.length === 0) {
						up();
					}
				});
				windowDiv.addEventListener("touchmove", function(event) { //$NON-NLS-0$
					var touches = event.touches;
					if (touches.length === 1) {
						move(event.touches[0].clientY);
					}
				});
				zoomView.addEventListener("TouchStart", function(event) { //$NON-NLS-0$
					if (event.touchCount === 1) {
						down(event, event.event.touches[0].clientY);
						stop(event);
					}
				});
//				windowDiv.style.pointerEvents = "none"; //$NON-NLS-0$
//				zoomView.addEventListener("TouchEnd", function(event) { //$NON-NLS-0$
//					if (event.touchCount === 0) {
//						up(event);
//					}
//				});
//				zoomView.addEventListener("TouchMove", function(event) { //$NON-NLS-0$
//					if (event.touchCount === 1) {
//						move(event.event.touches[0].clientY);
//					}
//				});
			} else {
				windowDiv.style.pointerEvents = "none"; //$NON-NLS-0$
				zoomView.addEventListener("MouseDown", function(event) { //$NON-NLS-0$
					var e = event.event;
					if (e.which ? e.button === 0 : e.button === 1) {
						down(event, e.clientY);
					}
					stop(event);
				});
				zoomView.addEventListener("MouseUp", function(event) { //$NON-NLS-0$
					up();
					stop(event);
				});
				zoomView.addEventListener("MouseMove", function(event) { //$NON-NLS-0$
					move(event.event.clientY);
					stop(event);
				});
			}
			(document.defaultView || document.parentWindow).setTimeout(function() {
				updateScroll();
			}, 0);
		},
		_destroy: function() {
			var textView = this.getView();
			if (textView) {
				textView.removeEventListener("Scroll", this._scrollListener); //$NON-NLS-0$
				this._scrollListener = null;
				textView.removeEventListener("Resize", this._resizeListener); //$NON-NLS-0$
				this._resizeListener = null;
				textView.removeEventListener("Redraw", this._redrawListener); //$NON-NLS-0$
				this._redrawListener = null;
				textView.removeEventListener("Options", this._optionsListener); //$NON-NLS-0$
				this._optionsListener = null;
			}
			var zoomView = this._zoomView;
			if (zoomView) {
				zoomView.removeEventListener("LineStyle", this._lineListener); //$NON-NLS-0$
				zoomView.setModel(null);
				zoomView.destroy();
				this._zoomView = null;
			}
		}
	});
	
	return {
		BaseRuler: BaseRuler,
		Ruler: Ruler,
		AnnotationRuler: AnnotationRuler,
		LineNumberRuler: LineNumberRuler,
		OverviewRuler: OverviewRuler,
		FoldingRuler: FoldingRuler,
		ZoomRuler: ZoomRuler,
	};
});
