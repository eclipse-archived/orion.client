/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window define setTimeout clearTimeout setInterval clearInterval */

/**
 * @namespace The global container for Orion APIs.
 */ 
var orion = orion || {};
/**
 * @namespace The container for textview APIs.
 */ 
orion.textview = orion.textview || {};

/**
 * Constructs a new ruler. 
 * <p>
 * The default implementation does not implement all the methods in the interface
 * and is useful only for objects implementing rulers.
 * <p/>
 * 
 * @param {orion.textview.AnnotationModel} [annotationModel] the annotation model for the ruler.
 * @param {String} [rulerLocation="left"] the location for the ruler.
 * @param {String} [rulerOverview="page"] the overview for the ruler.
 * @param {orion.textview.Style} [rulerStyle] the style for the ruler. 
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
 * {@link orion.textview.LineNumberRuler}<br/>
 * {@link orion.textview.AnnotationRuler}<br/>
 * {@link orion.textview.OverviewRuler}<br/> 
 * {@link orion.textview.TextView}<br/>
 * {@link orion.textview.TextView#addRuler}
 * </p>		 
 * @name orion.textview.Ruler
 */
orion.textview.Ruler = (function() {
	/** @private */
	function Ruler (annotationModel, rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left";
		this._overview = rulerOverview || "page";
		this._rulerStyle = rulerStyle;
		this._types = [];
		this._view = null;
		var self = this;
		this._annotationModelListener = {
			onChanged: function(e) {
				self._onAnnotationModelChanged(e);
			}
		};
		this.setAnnotationModel(annotationModel);
	}
	Ruler.prototype = /** @lends orion.textview.Ruler.prototype */ {
		/**
		 * Adds an annotation type to the ruler.
		 * <p>
		 * Only annotations of the specified types will be shown by
		 * this ruler.
		 * </p>
		 *
		 * @param type {Object} the annotation type to be shown
		 */
		addAnnotationType: function(type) {
			this._types.push(type);
		},
		/**
		 * Returns the annotations for a given line range.
		 * <p>
		 * This method is called the the text view when the ruler is redrawn.
		 * </p>
		 *
		 * @param {Number} startLine the line index
		 * @param {Number} endLine the line index
		 * @return {orion.textview.LineAnnotation} the annotations for the line range.
		 */
		getAnnotations: function(startLine, endLine) {
			var model = this._view.getModel();
			var annotationModel = this._annotationModel;
			var start = model.getLineStart(startLine);
			var end = model.getLineEnd(endLine - 1);
			var baseModel = model;
			if (model.getBaseModel) {
				baseModel = model.getBaseModel();
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var annotations = annotationModel.getAnnotations(start, end);
			var result = [];
			while (annotations.hasNext()) {
				var annotation = annotations.next();
				if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
				var annotationLineStart = baseModel.getLineAtOffset(annotation.start);
				var annotationLineEnd = baseModel.getLineAtOffset(annotation.end - 1);
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
			return result;
		},
		/**
		 * Returns the ruler annotation model.
		 *
		 * @returns {orion.textview.AnnotationModel} the ruler annotation model.
		 *
		 * @see #getOverview
		 */
		getAnnotationModel: function() {
			return this._annotationModel;
		},
		/**
		 * Returns the ruler location.
		 *
		 * @returns {String} the ruler location, which is either "left" or "right".
		 *
		 * @see #getOverview
		 */
		getLocation: function() {
			return this._location;
		},
		/**
		 * Returns the ruler overview type.
		 *
		 * @returns {String} the overview type, which is either "page" or "document".
		 *
		 * @see #getLocation
		 */
		getOverview: function() {
			return this._overview;
		},
		/**
		 * Returns the CSS styling information for the ruler.
		 *
		 * @returns {orion.textview.Style} the CSS styling for ruler.
		 */
		getRulerStyle: function() {
			return this._rulerStyle;
		},
		/**
		 * Returns whether the ruler shows annotations of the specified type.
		 *
		 * @param {Object} the annotation type 
		 * @returns {Boolean} whether the specified is shown
		 */
		isAnnotationTypeVisible: function(type) {
			for (var i = 0; i < this._types.length; i++) {
				if (this._types[i] === type) {
					return true;
				}
			}
			return false;
		},
		/**
		 * Removes an annotation type from the ruler.
		 *
		 * @param type {Object} the annotation type to be shown
		 */
		removeAnnotationType: function(type) {
			for (var i = 0; i < this._types.length; i++) {
				if (this._types[i] === type) {
					this._types.splice(i, 1);
					break;
				}
			}
		},
		/**
		 * Sets the annotation model for the ruler.
		 *
		 * @param {orion.textview.AnnotationModel} annotationModel the annotation model.
		 */
		setAnnotationModel: function (annotationModel) {
			var self = this;
			if (this._annotationModel) {
				this._annotationModel.removeListener(this._annotationModelListener); 
			}
			this._annotationModel = annotationModel;
			if (this._annotationModel) {
				this._annotationModel.addListener(this._annotationModelListener); 
			}
		},
		/**
		 * Sets the view for the ruler.
		 * <p>
		 * This method is called the the text view when the ruler
		 * is added to the view.
		 * </p>
		 *
		 * @param {orion.textview.TextView} view the text view.
		 */
		setView: function (view) {
			if (this._onTextModelChanged && this._view) {
				this._view.removeEventListener("ModelChanged", this, this._onTextModelChanged); 
			}
			this._view = view;
			if (this._onTextModelChanged && this._view) {
				this._view.addEventListener("ModelChanged", this, this._onTextModelChanged);
			}
		},
		/**
		 * Returns the widest annotation which determines the width of the ruler.
		 * <p>
		 * If the ruler does not have a fixed width it should provide the widest
		 * annotation to avoid the ruler from changing size as the view scrolls.
		 * </p>
		 * <p>
		 * This method is called the the text view when the ruler is redrawn.
		 * </p>
		 *
		 * @returns {orion.textview.Annotation} the annotation for the generic line.
		 *
		 * @see #getAnnotations
		 */
		getWidestAnnotation: function() {
			return null;
		},
		/**
		 * This event is sent when the user clicks a line decoration.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the clicked decoration.
		 * @param {DOMEvent} e the click event.
		 */
		onClick: function(lineIndex, e) {
		},
		/**
		 * This event is sent when the user double clicks a line decoration.
		 *
		 * @event
		 * @param {Number} lineIndex the line index of the double clicked decoration.
		 * @param {DOMEvent} e the double click event.
		 */
		onDblClick: function(lineIndex, e) {
		},
		onMouseMove: function(lineIndex, e) {
			if (this._tooltip && this._tooltipLineIndex === lineIndex) { return; }
			var self = this;
			self._hideTooltip();
			self._tooltipLineIndex = lineIndex;
			self._tooltipClientY = e.clientY;
			self._tooltipShowTimeout = setTimeout(function() {
				self._showTooltip();
				if (self._tooltip) {
					self._tooltipHideTimeout = setTimeout(function() {
						var opacity = parseFloat(self._getNodeStyle(self._tooltip, "opacity", "1"));
						self._tooltipFadeTimeout = setInterval(function() {
							if (self._tooltip && opacity > 0) {
								opacity -= 0.1;
								self._tooltip.style.opacity = opacity;
								return;
							}
							self._hideTooltip();
						}, 50);
					}, 4000);
				}
			}, 1000);
		},
		onMouseOver: this._onMouseMove,
		onMouseOut: function(lineIndex, e) {
			this._hideTooltip();
		},
		/**
		 * Sets the annotation that is displayed when a given line contains multiple
		 * annotations.
		 *
		 * @param {orion.textview.Annotation} the annotation for lines with multiple annotations.
		 */
		setMultiAnnotation: function(annotation) {
			this._multiAnnotation = annotation;
		},
		_getNodeStyle: function(node, prop, defaultValue) {
			var value;
			if (node) {
				value = node.style[prop];
				if (!value) {
					if (node.currentStyle) {
						var index = 0, p = prop;
						while ((index = p.indexOf("-", index)) !== -1) {
							p = p.substring(0, index) + p.substring(index + 1, index + 2).toUpperCase() + p.substring(index + 2);
						}
						value = node.currentStyle[p];
					} else {
						var css = node.ownerDocument.defaultView.getComputedStyle(node, null);
						value = css ? css.getPropertyValue(prop) : null;
					}
				}
			}
			return value || defaultValue;
		},
		_getTooltip: function(document, lineIndex, annotations) {
			if (annotations.length === 0) { return null; }
			var model = this._view.getModel(), annotation;
			function getText(start, end) {
				var m = model.getBaseModel ? model.getBaseModel() : model;
				var textStart = m.getLineStart(m.getLineAtOffset(start));
				var textEnd = m.getLineEnd(m.getLineAtOffset(end), true);
				return m.getText(textStart, textEnd);
			}
			if (annotations.length === 1) {
				annotation = annotations[0];
				if (annotation.rulerTitle) {
					return annotation.rulerHTML + "&nbsp;" + annotation.rulerTitle;
				} else {
					//TODO show a projection textview to get coloring 
					return document.createTextNode(getText(annotation.start, annotation.end));
				}
			} else {
				var tooltipHTML = "<em>Multiple annotations:</em><br>";
				for (var i = 0; i < annotations.length; i++) {
					annotation = annotations[i];
					var title = annotation.rulerTitle;
					if (!title) {
						title = getText(annotation.start, annotation.end);
					}
					tooltipHTML += annotation.rulerHTML + "&nbsp;" + title + "<br>";
				}
				return tooltipHTML;
			}
		},	
		_hideTooltip: function() {
			this._tooltipLineIndex = this._tooltipEvent = undefined;
			if (this._tooltip) {
				var parent = this._tooltip.parentNode;
				if (parent) { parent.removeChild(this._tooltip); }
				this._tooltip = null;
			}
			if (this._tooltipShowTimeout) {
				clearTimeout(this._tooltipShowTimeout);
				this._tooltipShowTimeout = null;
			}
			if (this._tooltipHideTimeout) {
				clearTimeout(this._tooltipHideTimeout);
				this._tooltipHideTimeout = null;
			}
			if (this._tooltipFadeTimeout) {
				clearInterval(this._tooltipFadeTimeout);
				this._tooltipFadeTimeout = null;
			}
		},
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
					var start = changes[i].start;
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
		_mergeAnnotation: function(result, annotation, annotationLineIndex, annotationLineCount) {
			if (!result) { result = {annotations: []}; }
			result.annotations.push(annotation);
			if (annotationLineIndex === 0) {
				if (result.html) {
					if (this._multiAnnotation && result.annotations[0].type !== annotation.type) {
						result.html = this._multiAnnotation.rulerHTML;
					}
				} else {
					result.html = annotation.rulerHTML;
				}
			}
			result.style = this._mergeStyle(result.style, annotation.rulerStyle);
			return result;
		},
		_mergeStyle: function(result, style) {
			if (style) {
				if (!result) { result = {}; }
				if (result.styleClass && style.styleClass) {
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
		_showTooltip: function() {
			var lineIndex = this._tooltipLineIndex;
			var e = this._tooltipEvent;
			if (lineIndex === undefined) { return; }
			var view = this._view;
			var model = view.getModel();
			var annotationModel = this._annotationModel;
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex);
			if (model.getBaseModel) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var iter = annotationModel.getAnnotations(start, end);
			var annotations = [], annotation;
			while (iter.hasNext()) {
				annotation = iter.next();
				if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
				annotations.push(annotation);
			}
			var document = this._view._parentDocument;//TODO bad not API
			var tooltipContent = this._getTooltip(document, lineIndex, annotations);
			if (!tooltipContent) { return; }
			var tooltip = this._tooltip = document.createElement("DIV");
			tooltip.className = "ruler_tooltip";
			if (typeof tooltipContent === "string") {
				tooltip.innerHTML = tooltipContent;
			} else {
				tooltip.appendChild(tooltipContent);
			}
			var rect = view.getClientArea();
			if (this.getOverview() === "document") {
				rect.y = view.convert({y: this._tooltipClientY}, "view", "document").y;
			} else {
				rect.y = view.getLocationAtOffset(model.getLineStart(lineIndex)).y;
			}
			view.convert(rect, "document", "page");
			tooltip.style.visibility = "hidden";
			document.body.appendChild(tooltip);
			var left = parseInt(this._getNodeStyle(tooltip, "padding-left", "0"), 10);
			left += parseInt(this._getNodeStyle(tooltip, "border-left-width", "0"), 10);
			var top = parseInt(this._getNodeStyle(tooltip, "padding-top", "0"), 10);
			top += parseInt(this._getNodeStyle(tooltip, "border-top-width", "0"), 10);
			rect.y -= top;
			if (this.getLocation() === "right") {
				var right = parseInt(this._getNodeStyle(tooltip, "padding-right", "0"), 10);
				right += parseInt(this._getNodeStyle(tooltip, "border-right-width", "0"), 10);
				tooltip.style.right = (document.body.getBoundingClientRect().right - (rect.x + rect.width) + left + right) + "px";
			} else {
				tooltip.style.left = (rect.x - left) + "px";
			}
			tooltip.style.top = rect.y + "px";
			tooltip.style.maxWidth = rect.width + "px";
			tooltip.style.maxHeight = (rect.height - (rect.y - view._parent.getBoundingClientRect().top)) + "px";
			tooltip.style.visibility = "visible";
		}
	};
	return Ruler;
}());

/**
 * Constructs a new line numbering ruler. 
 *
 * @param {String} [rulerLocation="left"] the location for the ruler.
 * @param {orion.textview.Style} [rulerStyle=undefined] the style for the ruler.
 * @param {orion.textview.Style} [oddStyle={style: {backgroundColor: "white"}] the style for lines with odd line index.
 * @param {orion.textview.Style} [evenStyle={backgroundColor: "white"}] the style for lines with even line index.
 *
 * @augments orion.textview.Ruler
 * @class This objects implements a line numbering ruler.
 *
 * <p><b>See:</b><br/>
 * {@link orion.textview.Ruler}
 * </p>
 * @name orion.textview.LineNumberRuler
 */
orion.textview.LineNumberRuler = (function() {
	/** @private */
	function LineNumberRuler (annotationModel, rulerLocation, rulerStyle, oddStyle, evenStyle) {
		orion.textview.Ruler.call(this, annotationModel, rulerLocation, "page", rulerStyle);
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}};
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}};
		this._numOfDigits = 0;
	}
	LineNumberRuler.prototype = new orion.textview.Ruler(); 
	/** @ignore */
	LineNumberRuler.prototype.getAnnotations = function(startLine, endLine) {
		var result = orion.textview.Ruler.prototype.getAnnotations.call(this, startLine, endLine);
		var model = this._view.getModel();
		for (var lineIndex = startLine; lineIndex < endLine; lineIndex++) {
			var style = lineIndex & 1 ? this._oddStyle : this._evenStyle;
			var mapLine = lineIndex;
			if (model.getBaseModel) { mapLine = model.mapLine(lineIndex); }
			if (!result[lineIndex]) { result[lineIndex] = {}; }
			result[lineIndex].html = (mapLine + 1) + "";
			if (!result[lineIndex].style) { result[lineIndex].style = style; }
		}
		return result;
	};
	/** @ignore */
	LineNumberRuler.prototype.getWidestAnnotation = function() {
		var lineCount = this._view.getModel().getLineCount();
		return this.getAnnotations(lineCount - 1, lineCount)[lineCount - 1];
	};
	/** @ignore */
	LineNumberRuler.prototype._onTextModelChanged = function(e) {
		var start = e.start;
		var model = this._view.getModel();
		var lineCount = model.getBaseModel ? model.getBaseModel().getLineCount() : model.getLineCount();
		var numOfDigits = (lineCount+"").length;
		if (this._numOfDigits !== numOfDigits) {
			this._numOfDigits = numOfDigits;
			var startLine = model.getLineAtOffset(start);
			this._view.redrawLines(startLine,  model.getLineCount(), this);
		}
	};
	return LineNumberRuler;
}());
/** 
 * @class This is class represents an annotation for the AnnotationRuler. 
 * <p> 
 * <b>See:</b><br/> 
 * {@link orion.textview.AnnotationRuler}
 * </p> 
 * 
 * @name orion.textview.Annotation 
 * 
 * @property {String} [html=""] The html content for the annotation, typically contains an image.
 * @property {orion.textview.Style} [style] the style for the annotation.
 * @property {orion.textview.Style} [overviewStyle] the style for the annotation in the overview ruler.
 */ 
/**
 * Contructs a new annotation ruler. 
 *
 * @param {String} [rulerLocation="left"] the location for the ruler.
 * @param {orion.textview.Style} [rulerStyle=undefined] the style for the ruler.
 * @param {orion.textview.Annotation} [defaultAnnotation] the default annotation.
 *
 * @augments orion.textview.Ruler
 * @class This objects implements an annotation ruler.
 *
 * <p><b>See:</b><br/>
 * {@link orion.textview.Ruler}<br/>
 * {@link orion.textview.Annotation}
 * </p>
 * @name orion.textview.AnnotationRuler
 */
orion.textview.AnnotationRuler = (function() {
	/** @private */
	function AnnotationRuler (annotationModel, rulerLocation, rulerStyle) {
		orion.textview.Ruler.call(this, annotationModel, rulerLocation, "page", rulerStyle);
	}
	AnnotationRuler.prototype = new orion.textview.Ruler();
	
	return AnnotationRuler;
}());

/**
 * Contructs an overview ruler. 
 * <p>
 * The overview ruler is used in conjunction with a AnnotationRuler, for each annotation in the 
 * AnnotationRuler this ruler displays a mark in the overview. Clicking on the mark causes the 
 * view to scroll to the annotated line.
 * </p>
 *
 * @param {String} [rulerLocation="left"] the location for the ruler.
 * @param {orion.textview.Style} [rulerStyle=undefined] the style for the ruler.
 * @param {orion.textview.AnnotationRuler} [annotationRuler] the annotation ruler for the overview.
 *
 * @augments orion.textview.Ruler
 * @class This objects implements an overview ruler.
 *
 * <p><b>See:</b><br/>
 * {@link orion.textview.AnnotationRuler} <br/>
 * {@link orion.textview.Ruler} 
 * </p>
 * @name orion.textview.OverviewRuler
 */
orion.textview.OverviewRuler = (function() {
	/** @private */
	function OverviewRuler (annotationModel, rulerLocation, rulerStyle) {
		orion.textview.Ruler.call(this, annotationModel, rulerLocation, "document", rulerStyle);
	}
	OverviewRuler.prototype = new orion.textview.Ruler();
	
	/** @ignore */
	OverviewRuler.prototype.getRulerStyle = function() {
		var result = {style: {lineHeight: "1px", fontSize: "1px"}};
		result = this._mergeStyle(result, this._rulerStyle);
		return result;
	};
	/** @ignore */	
	OverviewRuler.prototype.onClick = function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		this._view.setTopIndex(lineIndex);
	};
	/** @ignore */
	OverviewRuler.prototype._getTooltip = function(document, lineIndex, annotations) {
		if (annotations.length === 0) {
			var model = this._view.getModel();
			return "Line: " + ((model.getBaseModel ? model.mapLine(lineIndex) : lineIndex) + 1);
		}
		return orion.textview.Ruler.prototype._getTooltip.call(this, document, lineIndex, annotations);
	};
	/** @ignore */
	OverviewRuler.prototype._mergeAnnotation = function(previousAnnotation, annotation, annotationLineIndex, annotationLineCount) {
		if (annotationLineIndex !== 0) { return undefined; }
		var result = previousAnnotation;
		if (!result) {
			//TODO using internal function
			//TODO annotationLineCount does not work when there are folded lines
			var height = (this._view._getClientHeight() / this._view.getModel().getLineCount()) * annotationLineCount;
			height = Math.max(3, height);
			result = {html: "&nbsp;", style: { style: {height: height + "px"}}};
			result.style = this._mergeStyle(result.style, annotation.overviewStyle);
		}
		return result;
	};
	return OverviewRuler;
}());

orion.textview.FoldingRuler = (function() {
	/** @private */
	function FoldingRuler (annotationModel, rulerLocation, rulerStyle) {
		orion.textview.AnnotationRuler.call(this, annotationModel, rulerLocation, rulerStyle);
	}
	FoldingRuler.prototype = new orion.textview.AnnotationRuler();
	
	/** @ignore */
	FoldingRuler.prototype.onClick =  function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		var view = this._view;
		var model = view.getModel();
		var start = model.getLineStart(lineIndex);
		var end = model.getLineEnd(lineIndex, true);
		if (model.getBaseModel) {
			start = model.mapOffset(start);
			end = model.mapOffset(end);
		}
		var annotationModel = this._annotationModel;
		var annotation, iter = annotationModel.getAnnotations(start, end);
		while (!annotation && iter.hasNext()) {
			var a = iter.next();
			if (!this.isAnnotationTypeVisible(a.type)) { continue; }
			annotation = a;
		}
		if (annotation) {
			this._hideTooltip();
			if (annotation.expanded) {
				annotation.collapse();
			} else {
				annotation.expand();
			}
			this._annotationModel.modifyAnnotation(annotation);
		}
	};
	/** @ignore */
	FoldingRuler.prototype._getTooltip = function(document, lineIndex, annotations) {
		if (annotations.length === 1) {
			if (annotations[0].expanded) {
				return null;
			}
		}
		return orion.textview.AnnotationRuler.prototype._getTooltip.call(this, document, lineIndex, annotations);
	};
	/** @ignore */
	FoldingRuler.prototype._onAnnotationModelChanged = function(e) {
		if (e.textModelChangedEvent) {
			orion.textview.AnnotationRuler.prototype._onAnnotationModelChanged.call(this, e);
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
	
	return FoldingRuler;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
