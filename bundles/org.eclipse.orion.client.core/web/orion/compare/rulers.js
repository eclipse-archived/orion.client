/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */

define(['orion/compare/compareUtils'], function(mCompareUtils) {
var orion = orion || {};

orion.CompareRuler = (function() {
	/**
	 * Creates a new ruler for the compare editor.
	 * @class The compare ruler is used by the compare editor to render trim around the editor.
	 * @name orion.compare.rulers.CompareRuler
	 */
	function CompareRuler (rulerLocation, rulerOverview, rulerStyle) {
		this._location = rulerLocation || "left";
		this._overview = rulerOverview || "page";
		this._rulerStyle = rulerStyle;
		this._editor = null;
		var self = this;
		this._listener = {
			onModelChanged: function(e) {
				self._onModelChanged(e);
			}
		};
	}
	CompareRuler.prototype = /** @lends orion.compare.rulers.CompareRuler.prototype */ {
		setView: function (editor) {
			if (this._onModelChanged && this._editor) {
				this._editor.removeEventListener("ModelChanged", this._listener.onModelChanged); 
			}
			this._editor = editor;
			if (this._onModelChanged && this._editor) {
				this._editor.addEventListener("ModelChanged", this._listener.onModelChanged);
			}
		},
		getLocation: function() {
			return this._location;
		},
		getOverview: function(editor) {
			return this._overview;
		},
		getAnnotationModel: function() {
			return null;
		},
		addAnnotationType: function(type) {
		},
		isAnnotationTypeVisible: function(type) {
			return false;
		},
		removeAnnotationType: function(type) {
		},
		setAnnotationModel: function (annotationModel) {
		},
		getAnnotations: function(startLine, endLine) {
			var result = [];
			for (var i=startLine; i<endLine; i++) {
				var style = this.getStyle(i);
				if(style)
					result[i] = {html: this.getHTML(i), style: style};
			}
			return result;
		},
		getWidestAnnotation: function() {
			return {html: this.getHTML(-1), style: this.getStyle(-1)};
		},
		getRulerStyle: function() {
			return this.getStyle(undefined);
		}
	};
	return CompareRuler;
}());

orion.LineNumberCompareRuler = (function() {
	/**
	 * Creates a new line number ruler for the compare editor.
	 * @class The line number ruler is used by the compare editor to render line numbers next to the editor
	 * @name orion.compare.rulers.LineNumberCompareRuler
	 */
	function LineNumberCompareRuler (mapperColumnIndex , rulerLocation, rulerStyle, oddStyle, evenStyle) {
		orion.CompareRuler.call(this, rulerLocation, "page", rulerStyle);
		this._oddStyle = oddStyle || {style: {backgroundColor: "white"}};
		this._evenStyle = evenStyle || {style: {backgroundColor: "white"}};
		this._numOfDigits = 0;
		this._mapperColumnIndex = mapperColumnIndex;
	}
	LineNumberCompareRuler.prototype = new orion.CompareRuler(); 
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
			return lineIndex + 1;
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

orion.CompareAnnotation =  (function() {

	function CompareAnnotation() {
		this._currentAnnotationIndex = 0;
	}

	CompareAnnotation.prototype =  {
		
		init: function(mapper , editor ){
			this._mapper = mapper;
			this._editor = editor;
			this._currentAnnotationIndex = 0;
		},
		
		getCurrentAnnotationIndex: function(){
			return this._currentAnnotationIndex;
		},
		
		getCurrentMapperIndex: function(){
			var annotations = this._editor.getModel().getAnnotations();
			return annotations.length === 0 ? -1 : annotations[this._currentAnnotationIndex][1];
		},
		
		matchPositionFromAnnotation: function(index){
			var annotaionIndex = index;
			if(index === -1){
				annotaionIndex = 0;
			} else {
				var model =  this._editor.getModel();
				annotaionIndex = mCompareUtils.getAnnotationIndex(model.getAnnotations(), index);
			}
			this._currentAnnotationIndex = annotaionIndex;
		},
		
		gotoDiff: function(annotationIndex){
			this._currentAnnotationIndex = annotationIndex;
		},
		
		nextDiff: function(){
			var annotations = this._editor.getModel().getAnnotations();
			if(annotations.length !== 0 ){
				if((annotations.length -1) === this._currentAnnotationIndex)
					this._currentAnnotationIndex = 0;
				else
					this._currentAnnotationIndex += 1;
			}
		},
		
		prevDiff: function(){
			var annotations = this._editor.getModel().getAnnotations();
			if(annotations.length !== 0 ){
				if(0 === this._currentAnnotationIndex)
					this._currentAnnotationIndex = annotations.length -1;
				else
					this._currentAnnotationIndex -= 1;
			}
		}
	};
	return CompareAnnotation;
}()); 

/**
 * Creates a new compare overview ruler for the compare editor.
 * @class The compare overview ruler is used by the compare editor to 
 * render lines matching differences between two editors
 * @name orion.compare.rulers.CompareOverviewRuler
 */
orion.CompareOverviewRuler = (function() {
	function CompareOverviewRuler (rulerLocation, rulerStyle) {
		orion.CompareRuler.call(this, rulerLocation, "document", rulerStyle);
	}
	CompareOverviewRuler.prototype = new orion.CompareRuler();
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
				result = {styleClass: "annotationOverview breakpoint"} || {};
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


orion.TwoWayCompareOverviewRuler = (function() {
	function TwoWayCompareOverviewRuler ( rulerLocation, rulerStyle , compareAnnotaion , onClick) {
		this._compareAnnotaion = compareAnnotaion;
		this._onClick = onClick;
		orion.CompareRuler.call(this, rulerLocation, "document", rulerStyle);
	}
	TwoWayCompareOverviewRuler.prototype = new orion.CompareRuler();
	TwoWayCompareOverviewRuler.prototype.getStyle = function(lineIndex) {
		var result, style;
		if (lineIndex === undefined) {
			result = this._rulerStyle || {};
			style = result.style || (result.style = {});
			style.lineHeight = "1px";
			style.fontSize = "1px";
			style.width = "14px";
		} else {
			if (lineIndex !== -1) {
				result = {styleClass: "annotationOverview breakpoint"} || {};
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
				var annotationIndex = mCompareUtils.getAnnotationIndex(model.getAnnotations(), lineIndex);
				if (annotationIndex === -1) return null;
				var mapperIndex = mCompareUtils.getAnnotationMapperIndex(model.getAnnotations(), annotationIndex);
				var conflict = mCompareUtils.isMapperConflict(model.getMapper(), mapperIndex);
				if(conflict)
					style.border = "1px #FF0000 solid";
				if(annotationIndex === this._compareAnnotaion.getCurrentAnnotationIndex())
					style.backgroundColor = conflict ? "red" :"blue";
				var anH = model.getAnnotationH(annotationIndex);
				var lC = model.getAnnotationLineCount();
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
	TwoWayCompareOverviewRuler.prototype.getHTML = function(lineIndex) {
		return "&nbsp;";
	};
	TwoWayCompareOverviewRuler.prototype.onClick = function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		this._onClick(lineIndex , this);
	};
	TwoWayCompareOverviewRuler.prototype._onModelChanged = function(e) {
		var model = this._editor.getModel();
		var lineCount = model.getLineCount();
		if(lineCount > 0)
			this._editor.redrawLines(0, 1, this);
	};
	return TwoWayCompareOverviewRuler;
}());


orion.CompareMatchRenderer =  (function() {

	function CompareMatchRenderer(canvasDiv) {
		this._canvasDiv = canvasDiv;
		this._mapper = undefined;
		this._initialized = false;
		this._annotation = new orion.CompareAnnotation();
	}

	CompareMatchRenderer.prototype =  {
		
		init: function(mapper , leftEditor , rightEditor ){
			this._initialized = true;
			this._mapper = mapper;
			this._leftEditor = leftEditor;
			this._rightEditor = rightEditor;
			this._annotation.init(mapper , rightEditor);
			this.render();
		},
		
		getAnnotation: function(){
			return this._annotation;
		},
		
		getCurrentAnnotationIndex: function(){
			return this._annotation.getCurrentAnnotationIndex();
		},
		
		getCurrentMapperIndex: function(){
			return this._annotation.getCurrentMapperIndex();
		},
		
		setOverviewRuler: function(overview){
			this._overviewRuler =  overview;
		},

		_setEditorPosition: function (editor , lineIndex){
			var lineHeight = editor.getLineHeight();
			var clientArea = editor.getClientArea();
			var lines = Math.floor(clientArea.height / lineHeight/3);
			editor.setTopIndex((lineIndex - lines) > 0 ? lineIndex - lines : 0);
		},
		
		_findBaseLine: function(editor){
			var lineHeight = editor.getLineHeight();
			var clientArea = editor.getClientArea();
			var lines = Math.floor(clientArea.height / lineHeight/3);
			return editor.getTopIndex() + lines;
		},
		
		matchPositionFrom: function(fromLeft){
			var baseEditor = fromLeft ? this._leftEditor : this._rightEditor;
			var matchEditor = fromLeft ? this._rightEditor : this._leftEditor;
			var topLine = baseEditor.getTopIndex();
			var bottomLine = baseEditor.getBottomIndex();
			var matchLine = mCompareUtils.matchMapper(this._mapper , fromLeft ? 0: 1 , topLine , bottomLine);
			matchEditor.setTopIndex(matchLine);
		},

		matchPositionFromAnnotation: function(index){
			if(!this._initialized){
				return;
			}
			this._annotation.matchPositionFromAnnotation(index);
			this.positionAnnotation(this._annotation.getCurrentAnnotationIndex());
		},
		
		positionAnnotation: function(annotationIndex){
			var annotations = this._rightEditor.getModel().getAnnotations();
			if(annotations.length === 0)
				return;
			this._setEditorPosition(this._rightEditor , annotations[annotationIndex][0]);
			var lineIndexL = this._leftEditor.getModel().getLineIndexFromMapper(annotations[annotationIndex][1]);
			this._setEditorPosition(this._leftEditor , lineIndexL);
			this._leftEditor.redrawRange();
			this._rightEditor.redrawRange();
			var drawLine = this._rightEditor.getTopIndex() ;
			this._rightEditor.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
		},
		
		gotoDiff: function(annotationIndex){
			this._annotation.gotoDiff(annotationIndex);
			var drawLine = this._rightEditor.getTopIndex() ;
			this._leftEditor.redrawRange();
			this._rightEditor.redrawRange();
			this._rightEditor.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
		},
		
		nextDiff: function(){
			this._annotation.nextDiff();
			this.positionAnnotation(this._annotation.getCurrentAnnotationIndex());
			this.render();
		},
		
		prevDiff: function(){
			this._annotation.prevDiff();
			this.positionAnnotation(this._annotation.getCurrentAnnotationIndex());
			this.render();
		},
		
		getMapperTextRange: function(editor , mapperIndex , mapperColumnIndex){
			var startLine = editor.getModel().getLineIndexFromMapper(mapperIndex);
			var endLine = startLine + this._mapper[mapperIndex][mapperColumnIndex] - 1;
			var start =  editor.getModel().getLineStart(startLine);
			var end =  editor.getModel().getLineEnd(endLine,true);
			return {start:start,end:end};
		},
	
		copyToLeft: function(){
			var mapperIndex = this.getCurrentMapperIndex();
			//if(this._mapper[mapperIndex][1] === 0)
			//	return;
			var textRangeR = this.getMapperTextRange(this._rightEditor , mapperIndex , 1);
			var textRangeL = this.getMapperTextRange(this._leftEditor , mapperIndex , 0);
			var textR = this._rightEditor.getText(textRangeR.start , textRangeR.end);
			this._leftEditor.setText(textR , textRangeL.start , textRangeL.end);
			this._leftEditor.redrawRange();
			this._rightEditor.redrawRange();
		},
	
		render: function(){
			if(!this._mapper )
				return;
			var context=this._canvasDiv.getContext("2d");
			context.clearRect(0,0,this._canvasDiv.width,this._canvasDiv.height);
			context.strokeStyle = '#AAAAAA'; 
			context.lineWidth   = 1;
			context.beginPath();
			
			var leftTop = this._leftEditor.getTopIndex();
			var leftBottom = this._leftEditor.getBottomIndex();
			var rightTop = this._rightEditor.getTopIndex();
			var rightBottom = this._rightEditor.getBottomIndex();
			this._leftLineH = this._leftEditor.getLineHeight();
			this._rightLineH = this._rightEditor.getLineHeight();
		
			var curLeftIndex = 0;
			var curRightIndex = 0;
			var rendering = false;
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][2] !== 0){
					if(mCompareUtils.overlapMapper( this._mapper[i] , 0 , curLeftIndex , leftTop ,leftBottom) ||
							mCompareUtils.overlapMapper( this._mapper[i] , 1 , curRightIndex , rightTop ,rightBottom) ){
						this._renderCurve(i, curLeftIndex , curRightIndex , this._canvasDiv , context , leftTop , leftBottom , rightTop , rightBottom);
						rendering = true;
					} else if (rendering) {
						break;
					}
				}
				curLeftIndex += this._mapper[i][0];
				curRightIndex += this._mapper[i][1];
			}
			context.stroke();		
		},
		
		_renderCurve: function (mapperIndex , leftStart , rightStart , canvas , context , leftTop , leftBottom , rightTop , rightBottom){
			var mapperItem = this._mapper[mapperIndex];
			/*
			var leftMiddle =  (leftStart + (mapperItem[0]/2) - leftTop) * this._leftLineH;
			var rightMiddle = (rightStart + (mapperItem[1]/2) - rightTop) * this._rightLineH ;
			*/
			var leftMiddle =  this._leftEditor.getLinePixel(leftStart + (mapperItem[0]/2)) + (mapperItem[0]%2)*this._leftLineH/3 - this._leftEditor.getTopPixel();
			var rightMiddle =  this._rightEditor.getLinePixel(rightStart + (mapperItem[1]/2)) + (mapperItem[1]%2)*this._rightLineH/3- this._rightEditor.getTopPixel();
			
			var w =  canvas.parentNode.clientWidth;
			
			if(mapperIndex === this.getCurrentMapperIndex()){
				context.stroke();
				context.strokeStyle = '#000'; 
				context.lineWidth   = 1;
				context.beginPath();
				context.moveTo(0 , leftMiddle);
				context.bezierCurveTo( w/3, leftMiddle, w*0.666  ,rightMiddle , w ,rightMiddle);
				context.stroke();
				context.strokeStyle = '#AAAAAA'; 
				context.lineWidth   = 1;
				context.beginPath();
				return;
			}
			context.moveTo(0 , leftMiddle);
			context.bezierCurveTo( w/3, leftMiddle, w*0.666  ,rightMiddle , w ,rightMiddle);
			context.stroke();
		},
		
		onChanged: function(e) {
			if(e.removedLineCount === e.addedLineCount)
				return;
			if(e.removedLineCount > 0 || e.addedLineCount > 0)
				this.render();
			
		}
		
	};
	
	return CompareMatchRenderer;
}()); 

return orion;
});
