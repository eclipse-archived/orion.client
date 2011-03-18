/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse = eclipse || {};

eclipse.CompareRuler = (function() {
	function CompareRuler (rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left";
		this._overview = rulerOverview || "page";
		this._rulerStyle = rulerStyle;
		this._editor = null;
	}
	CompareRuler.prototype = {
		setEditor: function (editor) {
			if (this._onModelChanged && this._editor) {
				this._editor.removeEventListener("ModelChanged", this, this._onModelChanged); 
			}
			this._editor = editor;
			if (this._onModelChanged && this._editor) {
				this._editor.addEventListener("ModelChanged", this, this._onModelChanged);
			}
		},
		getLocation: function() {
			return this._location;
		},
		getOverview: function(editor) {
			return this._overview;
		}
	};
	return CompareRuler;
}());

eclipse.LineNumberCompareRuler = (function() {
	function LineNumberCompareRuler (mapperColumnIndex , rulerLocation, rulerStyle, oddStyle, evenStyle) {
		eclipse.CompareRuler.call(this, rulerLocation, "page", rulerStyle);
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}};
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}};
		this._numOfDigits = 0;
		this._mapperColumnIndex = mapperColumnIndex;
	}
	LineNumberCompareRuler.prototype = new eclipse.CompareRuler(); 
	LineNumberCompareRuler.prototype.getStyle = function(lineIndex) {
		if (lineIndex === undefined) {
			return this._rulerStyle;
		} else {
			return this._evenStyle;
		}
	};
	LineNumberCompareRuler.prototype.getHTML = function(lineIndex) {
		var model = this._editor.getModel();
		if (lineIndex === -1) {
			return model.getLineCount();
		} else {
			if( model.getLineNumber){
				var realIndex = model.getLineNumber(lineIndex , this._mapperColumnIndex);
				if(realIndex === -1){
					return "";
				}
				return  realIndex + 1;
			} 
			return lineIndex + 1;;
		}
	};
	LineNumberCompareRuler.prototype._onModelChanged = function(e) {
		var start = e.start;
		var model = this._editor.getModel();
		var lineCount = model.getLineCount();
		var numOfDigits = (lineCount+"").length;
		if (this._numOfDigits !== numOfDigits) {
			this._numOfDigits = numOfDigits;
			var startLine = model.getLineAtOffset(start);
			this._editor.redrawLines(startLine, lineCount, this);
		}
	};
	return LineNumberCompareRuler;
}());

eclipse.CompareOverviewRuler = (function() {
	function CompareOverviewRuler (rulerLocation, rulerStyle) {
		eclipse.CompareRuler.call(this, rulerLocation, "document", rulerStyle);
	}
	CompareOverviewRuler.prototype = new eclipse.CompareRuler();
	CompareOverviewRuler.prototype.getAnnotations = function() {
		var model = this._editor.getModel();
		var lines = [];
		if(model.getAnnotations){
			var annotations = model.getAnnotations();
			for (var i = 0;i < annotations.length ; i++) {
				if (annotations[i] !== undefined) {
					lines.push(annotations[i][0]);
				}
			}
		}
		return lines;
	};
	CompareOverviewRuler.prototype.getStyle = function(lineIndex) {
		var result, style;
		if (lineIndex === undefined) {
			result = this._rulerStyle || {};
			style = result.style || (result.style = {});
			style.lineHeight = "1px";
			style.fontSize = "1px";
			style.width = "14px";
		} else {
			if (lineIndex !== -1) {
				result = {styleClass: "ruler_annotation_breakpoint_overview"} || {};
			} else {
				result = {};
			}
			style = result.style || (result.style = {});
			style.cursor = "pointer";
			style.width = "8px";
			//style.height = "3px";
			style.left = "2px";
			
			var model = this._editor.getModel();
			if(lineIndex >= 0 && model.getAnnotationH){
				var anH = model.getAnnotationH(lineIndex);
				var lC = model.getLineCount();
				var clientArea = this._editor.getClientArea();
				var height =  Math.floor(clientArea.height*anH/lC);
				if (height < 2)
					height = 2;
				style.height = height +"px";
			} else {
				style.height = "3px";
			}
		}
		return result;
	};
	CompareOverviewRuler.prototype.getHTML = function(lineIndex) {
		return "&nbsp;";
	};
	CompareOverviewRuler.prototype.onClick = function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		var lineHeight = this._editor.getLineHeight();
		var clientArea = this._editor.getClientArea();
		var lines = Math.floor(clientArea.height / lineHeight/3);
		this._editor.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
	};
	CompareOverviewRuler.prototype._onModelChanged = function(e) {
		var model = this._editor.getModel();
		var lineCount = model.getLineCount();
		if(lineCount > 0)
			this._editor.redrawLines(0, 1, this);
	};
	return CompareOverviewRuler;
}());
