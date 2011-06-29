/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
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
 * Contructs a new ruler. 
 * <p>
 * The default implementation does not implement all the methods in the interface
 * and is useful only for objects implementing rulers.
 * <p/>
 * 
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
	function Ruler (rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left";
		this._overview = rulerOverview || "page";
		this._rulerStyle = rulerStyle;
		this._view = null;
	}
	Ruler.prototype = /** @lends orion.textview.Ruler.prototype */ {
		/**
		 * Sets the view for the ruler.
		 *
		 * @param {orion.textview.TextView} view the text view.
		 */
		setView: function (view) {
			if (this._onModelChanged && this._view) {
				this._view.removeEventListener("ModelChanged", this, this._onModelChanged); 
			}
			this._view = view;
			if (this._onModelChanged && this._view) {
				this._view.addEventListener("ModelChanged", this, this._onModelChanged);
			}
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
		 * Returns the CSS styling information for the decoration of a given line.
		 * <p>
		 * If the line index is <code>-1</code>, the CSS styling information for the decoration
		 * that determines the width of the ruler should be returned. If the line is
		 * <code>undefined</code>, the ruler styling information should be returned.
		 * </p>
		 *
		 * @param {Number} lineIndex the line index
		 * @returns {orion.textview.Style} the CSS styling for ruler, given line, or generic line.
		 *
		 * @see #getHTML
		 */
		getStyle: function(lineIndex) {
		},
		/**
		 * Returns the HTML content for the decoration of a given line.
		 * <p>
		 * If the line index is <code>-1</code>, the HTML content for the decoration
		 * that determines the width of the ruler should be returned.
		 * </p>
		 *
		 * @param {Number} lineIndex the line index
		 * @returns {String} the HTML content for a given line, or generic line.
		 *
		 * @see #getStyle
		 */
		getHTML: function(lineIndex) {
		},
		/**
		 * Returns the indices of the lines that have decoration.
		 * <p>
		 * This function is only called for rulers with "document" overview type.
		 * </p>
		 * 
		 * @returns {Number[]} an array of line indices.
		 */
		getAnnotations: function() {
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
		}
	};
	return Ruler;
}());

/**
 * Contructs a new line numbering ruler. 
 *
 * @param {String} [rulerLocation="left"] the location for the ruler.
 * @param {orion.textview.Style} [rulerStyle=undefined] the style for the ruler.
 * @param {orion.textview.Style} [oddStyle={backgroundColor: "white"}] the style for lines with odd line index.
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
	function LineNumberRuler (rulerLocation, rulerStyle, oddStyle, evenStyle) {
		orion.textview.Ruler.call(this, rulerLocation, "page", rulerStyle);
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}};
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}};
		this._numOfDigits = 0;
	}
	LineNumberRuler.prototype = new orion.textview.Ruler(); 
	/** @ignore */
	LineNumberRuler.prototype.getStyle = function(lineIndex) {
		if (lineIndex === undefined) {
			return this._rulerStyle;
		} else {
			return lineIndex & 1 ? this._oddStyle : this._evenStyle;
		}
	};
	/** @ignore */
	LineNumberRuler.prototype.getHTML = function(lineIndex) {
		if (lineIndex === -1) {
			var model = this._view.getModel();
			return model.getLineCount();
		} else {
			return lineIndex + 1;
		}
	};
	/** @ignore */
	LineNumberRuler.prototype._onModelChanged = function(e) {
		var start = e.start;
		var model = this._view.getModel();
		var lineCount = model.getLineCount();
		var numOfDigits = (lineCount+"").length;
		if (this._numOfDigits !== numOfDigits) {
			this._numOfDigits = numOfDigits;
			var startLine = model.getLineAtOffset(start);
			this._view.redrawLines(startLine, lineCount, this);
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
	function AnnotationRuler (rulerLocation, rulerStyle, defaultAnnotation) {
		orion.textview.Ruler.call(this, rulerLocation, "page", rulerStyle);
		this._defaultAnnotation = defaultAnnotation;
		this._annotations = [];
	}
	AnnotationRuler.prototype = new orion.textview.Ruler();
	/**
	 * Removes all annotations in the ruler.
	 *
	 * @name clearAnnotations
	 * @methodOf orion.textview.AnnotationRuler.prototype
	 */
	AnnotationRuler.prototype.clearAnnotations = function() {
		this._annotations = [];
		var lineCount = this._view.getModel().getLineCount();
		this._view.redrawLines(0, lineCount, this);
		if (this._overviewRuler) {
			this._view.redrawLines(0, lineCount, this._overviewRuler);
		}
	};
	/**
	 * Returns the annotation for the given line index.
	 *
	 * @param {Number} lineIndex the line index
	 *
	 * @returns {orion.textview.Annotation} the annotation for the given line, or undefined
	 *
	 * @name getAnnotation
	 * @methodOf orion.textview.AnnotationRuler.prototype
	 * @see #setAnnotation
	 */
	AnnotationRuler.prototype.getAnnotation = function(lineIndex) {
		return this._annotations[lineIndex];
	};
	/** @ignore */
	AnnotationRuler.prototype.getAnnotations = function() {
		var lines = [];
		for (var prop in this._annotations) {
			var i = prop >>> 0;
			if (this._annotations[i] !== undefined) {
				lines.push(i);
			}
		}
		return lines;
	};
	/** @ignore */
	AnnotationRuler.prototype.getStyle = function(lineIndex) {
		switch (lineIndex) {
			case undefined:
				return this._rulerStyle;
			case -1:
				return this._defaultAnnotation ? this._defaultAnnotation.style : null;
			default:
				return this._annotations[lineIndex] && this._annotations[lineIndex].style ? this._annotations[lineIndex].style : null;
		}
	};
	/** @ignore */	
	AnnotationRuler.prototype.getHTML = function(lineIndex) {
		if (lineIndex === -1) {
			return this._defaultAnnotation ? this._defaultAnnotation.html : "";
		} else {
			return this._annotations[lineIndex] && this._annotations[lineIndex].html ? this._annotations[lineIndex].html : "";
		}
	};
	/**
	 * Sets the annotation in the given line index.
	 *
	 * @param {Number} lineIndex the line index
	 * @param {orion.textview.Annotation} annotation the annotation
	 *
	 * @name setAnnotation
	 * @methodOf orion.textview.AnnotationRuler.prototype
	 * @see #getAnnotation
	 * @see #clearAnnotations
	 */
	AnnotationRuler.prototype.setAnnotation = function(lineIndex, annotation) {
		if (lineIndex === undefined) { return; }
		this._annotations[lineIndex] = annotation;
		this._view.redrawLines(lineIndex, lineIndex + 1, this);
		if (this._overviewRuler) {
			this._view.redrawLines(lineIndex, lineIndex + 1, this._overviewRuler);
		}
	};
	/** @ignore */
	AnnotationRuler.prototype._onModelChanged = function(e) {
		var start = e.start;
		var removedLineCount = e.removedLineCount;
		var addedLineCount = e.addedLineCount;
		var linesChanged = addedLineCount - removedLineCount;
		if (linesChanged) {
			var model = this._view.getModel();
			var startLine = model.getLineAtOffset(start);
			var newLines = [], lines = this._annotations;
			var changed = false;
			for (var prop in lines) {
				var i = prop >>> 0;
				if (!(startLine < i && i < startLine + removedLineCount)) {
					var newIndex = i;
					if (i > startLine) {
						newIndex += linesChanged;
						changed = true;
					}
					newLines[newIndex] = lines[i];
				} else {
					changed = true;
				}
			}
			this._annotations = newLines;
			if (changed) {
				var lineCount = model.getLineCount();
				this._view.redrawLines(startLine, lineCount, this);
				//TODO redraw overview (batch it for performance)
				if (this._overviewRuler) {
					this._view.redrawLines(0, lineCount, this._overviewRuler);
				}
			}
		}
	};
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
	function OverviewRuler (rulerLocation, rulerStyle, annotationRuler) {
		orion.textview.Ruler.call(this, rulerLocation, "document", rulerStyle);
		this._annotationRuler = annotationRuler;
		if (annotationRuler) {
			annotationRuler._overviewRuler = this;
		}
	}
	OverviewRuler.prototype = new orion.textview.Ruler();
	/** @ignore */
	OverviewRuler.prototype.getAnnotations = function() {
		return this._annotationRuler.getAnnotations();
	};
	/** @ignore */	
	OverviewRuler.prototype.getStyle = function(lineIndex) {
		var result, style;
		if (lineIndex === undefined) {
			result = this._rulerStyle || {};
			style = result.style || (result.style = {});
			style.lineHeight = "1px";
			style.fontSize = "1px";
			style.width = "14px";
		} else {
			if (lineIndex !== -1) {
				var annotation = this._annotationRuler.getAnnotation(lineIndex);
				result = annotation.overviewStyle || {};
			} else {
				result = {};
			}
			style = result.style || (result.style = {});
			style.cursor = "pointer";
			style.width = "8px";
			style.height = "3px";
			style.left = "2px";
		}
		return result;
	};
	/** @ignore */
	OverviewRuler.prototype.getHTML = function(lineIndex) {
		return "&nbsp;";
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
