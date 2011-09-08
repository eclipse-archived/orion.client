/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global window define setTimeout clearTimeout */

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
		 * Only annotations of the added types will be shown by
		 * this ruler.
		 * </p>
		 *
		 * @param type {String} the annotation type to be shown
		 */
		addAnnotationType: function(type) {
			this._types.push(type);
		},
		/**
		 * Returns the annotations for a given line range.
		 * 
		 * @param {Number} startLine the line index
		 * @param {Number} endLine the line index
		 * @return {orion.textview.Annotation} the annotations for the line range.
		 */
		getAnnotations: function(startLine, endLine) {
			return this._getAnnotations(startLine, endLine);
		},
		_mergeAnnotation: function(previousAnnotation, annotation, annotationLineIndex, annotationLineCount) {
			var result = previousAnnotation;
			if (!result) { result = {annotations: []}; }
			result.annotations.push(annotation);
			if (annotationLineIndex === 0) {
				if (result.html) {
					if (previousAnnotation.annotations[0].type !== annotation.type) {
						//TODO give API for multiple annotation
						result.html = "<img src='images/multi_annotation.gif'/>";
					}
				} else {
					result.html = annotation.rulerHTML;
				}
			}
			if (annotation.rulerStyle) {
				if (!result.style) { result.style = {}; }
				if (result.style.styleClass && annotation.rulerStyle.styleClass) {
					result.style.styleClass += " " + annotation.rulerStyle.styleClass;
				} else {
					result.style.styleClass = annotation.rulerStyle.styleClass;
				}
				var prop;
				if (annotation.rulerStyle.style) {
					if (!result.style.style) { result.style.style  = {}; }
					for (prop in annotation.rulerStyle.style) {
						if (!result.style.style[prop]) {
							result.style.style[prop] = annotation.rulerStyle.style[prop];
						}
					}
				}
				if (annotation.rulerStyle.attributes) {
					if (!result.style.attributes) { result.style.attributes  = {}; }
					for (prop in annotation.rulerStyle.attributes) {
						if (!result.style.attributes[prop]) {
							result.style.attributes[prop] = annotation.rulerStyle.attributes[prop];
						}
					}
				}
			}
			return result;
		},
		_getAnnotations: function(startLine, endLine) {
			var model = this._view.getModel();
			var annotationModel = this._annotationModel;
			var start = model.getLineStart(startLine);
			var end = model.getLineEnd(endLine - 1);
			var baseModel = model;
			if (model.getParent) {
				baseModel = model.getParent();
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
		 * @param {String} the annotation type 
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
		 * @param type {String} the annotation type to be shown
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
		 * Sets the view for the ruler. This method is called the the text view when the
		 * ruler is added to the view.
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
		_hideTooltip: function() {
			if (this._tooltip) {
				var parent = this._tooltip.parentNode;
				if (parent) { parent.removeChild(this._tooltip); }
				this._tooltip = null;
			}
			if (this._tooltipShowTimeout) {
				clearTimeout(this._tooltipTimeout);
				this._tooltipShowTimeout = null;
			}
			if (this._tooltipHideTimeout) {
				clearTimeout(this._tooltipHideTimeout);
				this._tooltipHideTimeout = null;
			}
		},
		_showTooltip: function(lineIndex, e) {
			if (lineIndex === undefined) { return; }
			var model = this._view.getModel();
			var annotationModel = this._annotationModel;
			var start = model.getLineStart(lineIndex);
			var end = model.getLineEnd(lineIndex);
			if (model.getParent) {
				start = model.mapOffset(start);
				end = model.mapOffset(end);
			}
			var iter = annotationModel.getAnnotations(start, end);
			var document = this._view._parentDocument;//TODO bad not API
			var parent = document.body;
			var annotations = [], annotation, tooltipHTML = "";
			while (iter.hasNext()) {
				annotation = iter.next();
				if (!this.isAnnotationTypeVisible(annotation.type)) { continue; }
				annotations.push(annotation);
			}
			var tooltip = document.createElement("DIV");
			if (annotations.length === 0) {
				if (this.getOverview() === "document") {
					tooltipHTML = "Line: " + ((model.getParent ? model.mapLine(lineIndex) : lineIndex) + 1);
				} else {
					return;
				}
			} else {
				if (annotations.length === 1) {
					annotation = annotations[0];
					if (annotation.rulerTitle) {
						tooltipHTML = annotation.rulerHTML + "&nbsp;" + annotation.rulerTitle;
					} else {
						//TODO show a projection textview to get coloring 
						var src = model.getParent ? model.getParent().getText(annotation.start, annotation.end) : model.getText(annotation.start, annotation.end);
						tooltip.appendChild(document.createTextNode(src));
					}
				} else {
					tooltipHTML = "<em>Multiple annotations:</em><br>";
					for (var i = 0; i < annotations.length; i++) {
						annotation = annotations[i];
						var title = annotation.rulerTitle;
						if (!title) {
							title = model.getParent ? model.getParent().getText(annotation.start, annotation.end) : model.getText(annotation.start, annotation.end);
						}
						tooltipHTML += annotation.rulerHTML + "&nbsp;" + title + "<br>";
					}
				}
			}
			var pt = {x: e.clientX + 10, y: e.clientY + 10};
			this._view.convert(pt, "view", "page");
			tooltip.className = "ruler_tooltip";
			tooltip.style.whiteSpace = "pre";
			tooltip.style.position = "fixed";
			tooltip.style.left = pt.x + "px";
			tooltip.style.top = pt.y + "px";
			if (tooltipHTML) { tooltip.innerHTML = tooltipHTML; }
			var self = this;
			this._tooltip = tooltip;
			this._tooltipLineIndex = lineIndex;
			this._tooltipShowTimeout = setTimeout(function() {
				if (!self._tooltip) { return; } 
				parent.appendChild(self._tooltip);
				self._tooltipHideTimeout = setTimeout(function() {
					self._hideTooltip();
				}, 5000);
			}, 500);
		},
		onMouseOver: function(lineIndex, e) {
			if (this._tooltip && this._tooltipLineIndex === lineIndex) { return; }
			this._hideTooltip();
			this._showTooltip(lineIndex, e);
		},
		onMouseOut: function(lineIndex, e) {
			this._hideTooltip();
		},
		_onAnnotationModelChanged: function(e) {
			var i, view = this._view, model = view.getModel(), self = this;
			var lineCount = model.getLineCount();
			function redraw(changes) {
				for (i = 0; i < changes.length; i++) {
					if (!self.isAnnotationTypeVisible(changes[i].type)) { continue; }
					var start = changes[i].start;
					var end = changes[i].end;
					if (model.getParent) {
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

//			//TODO when all lines have to be redraw? see demo.js view.folding.onClick
//			view.redrawLines(0, lineCount, self);
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
			if (model.getParent) { mapLine = model.mapLine(lineIndex); }
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
		var lineCount = model.getParent ? model.getParent().getLineCount() : model.getLineCount();
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
		var result = this._rulerStyle || {};
		var style = result.style || (result.style = {});
		style.lineHeight = "1px";
		style.fontSize = "1px";
		return result;
	};
	/** @ignore */
	OverviewRuler.prototype._mergeAnnotation = function(previousAnnotation, annotation, annotationLineIndex, annotationLineCount) {
		if (annotationLineIndex !== 0) { return undefined; }
		var result = previousAnnotation;
		if (!result) {
			//TODO using internal function
			var height = (this._view._getClientHeight() / this._view.getModel().getLineCount()) * annotationLineCount;
			height = Math.max(3, height);
			result = {html: "&nbsp;", style: { style: {height: height + "px"}}};
			if (annotation.overviewStyle) {
				result.style.styleClass = annotation.overviewStyle.styleClass;
				if (annotation.overviewStyle.style) {
					for (var prop in annotation.overviewStyle.style) {
						if (!result.style.style[prop]) {
							result.style.style[prop] = annotation.rulerStyle.style[prop];
						}
					}
				}
			}
		}
		return result;
	};
	/** @ignore */	
	OverviewRuler.prototype.onClick = function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		this._view.setTopIndex(lineIndex);
	};
	return OverviewRuler;
}());

if (typeof window !== "undefined" && typeof window.define !== "undefined") {
	define([], function() {
		return orion.textview;
	});
}
