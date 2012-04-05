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

define(['orion/compare/compareUtils', 'orion/compare/diffTreeNavigator'], function(mCompareUtils, mDiffTreeNavigator) {
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
		
		getCurrentDiffBlockIndex: function(){
			return this._currentAnnotationIndex;
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
			if(lineIndex >= 0 ){
				var diffBlocks;
				if(this._diffNavigator){
					diffBlocks = this._diffNavigator.getFeeder().getDiffBlocks();
				} else if (model.getAnnotations){
					diffBlocks = model.getAnnotations();
				} else {
					return null;
				}
				
				var annotationIndex = mCompareUtils.getAnnotationIndex(diffBlocks, lineIndex);
				if (annotationIndex === -1) return null;
				var mapperIndex = mCompareUtils.getAnnotationMapperIndex(diffBlocks, annotationIndex);
				var mapper;
				if(this._diffNavigator){
					mapper = this._diffNavigator.getMapper();
				} else if (model.getMapper){
					mapper = model.getMapper();
				} else {
					return null;
				}
				var conflict = mCompareUtils.isMapperConflict(mapper, mapperIndex);
				if(conflict)
					style.border = "1px #FF0000 solid";
				var anH, lC;
				if(this._diffNavigator){
					if(annotationIndex === this._diffNavigator.getCurrentBlockIndex())
						style.backgroundColor = conflict ? "red" :"blue";
					anH = this._diffNavigator.getFeeder().getDiffBlockH(annotationIndex);
					lC = this._diffNavigator.getFeeder().getAnnotationLineCount();
				} else {
					if(annotationIndex === this._compareAnnotaion.getCurrentDiffBlockIndex())
						style.backgroundColor = conflict ? "red" :"blue";
					anH = model.getAnnotationH(annotationIndex);
					lC = model.getAnnotationLineCount();
				}
				if(anH < 0){
					return null;
				}
				var clientArea = this._editor.getClientArea();
				var height =  Math.floor(clientArea.height*anH/lC);
				if (height < 2)
					height = 2;
				style.height = height +"px";
			} else {
				return style.height = "3px";
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
	}

	CompareMatchRenderer.prototype =  {
		init: function(mapper , leftEditor , rightEditor, charDiff ){
			this._initialized = true;
			this._initing = true;
			this._mapper = mapper;
			this._leftEditor = leftEditor;
			this._rightEditor = rightEditor;
			this._leftTextView = leftEditor.getTextView();
			this._rightTextView = rightEditor.getTextView();
			var rFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._rightTextView.getModel(), this._mapper, 1);
			var lFeeder = new mDiffTreeNavigator.TwoWayDiffBlockFeeder(this._leftTextView.getModel(), this._mapper, 0);
			this._diffNavigator = new mDiffTreeNavigator.DiffTreeNavigator(this._rightEditor, this._leftEditor, rFeeder, lFeeder, charDiff);
			this._overviewRuler._diffNavigator = this._diffNavigator;
			this.render();
		},
		
		getDiffNavigator: function(){
			return this._diffNavigator;
		},
		
		getCurrentDiffBlockIndex: function(){
			return this._diffNavigator.getCurrentBlockIndex();
		},
		
		getCurrentMapperIndex: function(){
			return this._diffNavigator.getCurrentMapperIndex();
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
			var baseEditor = fromLeft ? this._leftTextView : this._rightTextView;
			var matchEditor = fromLeft ? this._rightTextView : this._leftTextView;
			var topLine = baseEditor.getTopIndex();
			var bottomLine = baseEditor.getBottomIndex();
			var matchLine = mCompareUtils.matchMapper(this._mapper , fromLeft ? 0: 1 , topLine , bottomLine);
			matchEditor.setTopIndex(matchLine);
		},

		matchPositionFromAnnotation: function(lineIndex){
			if(!this._initialized){
				return;
			}
			if(this._diffNavigator){
				var diffblockIndex;
				if(lineIndex < 0){
					diffblockIndex = 0;
				} else {
					diffblockIndex = mCompareUtils.getAnnotationIndex(this._diffNavigator.getFeeder().getDiffBlocks(), lineIndex);
				}
				this._diffNavigator.gotoBlock(diffblockIndex);
				this.positionDiffBlock(diffblockIndex);
			}
		},
		
		positionDiffBlock: function(annotationIndex){
			var diffBlocks = this._diffNavigator.getFeeder().getDiffBlocks();
			if(diffBlocks.length === 0)
				return;
			this._setEditorPosition(this._rightTextView , diffBlocks[annotationIndex][0]);
			var lineIndexL = mCompareUtils.lookUpLineIndex(this._diffNavigator.getMapper(), 0, diffBlocks[annotationIndex][1]);
			this._setEditorPosition(this._leftTextView , lineIndexL);
			this._leftTextView.redrawRange();
			this._rightTextView.redrawRange();
			var drawLine = this._rightTextView.getTopIndex() ;
			this._rightTextView.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
		},
		
		gotoChange: function(caretPosition, textView){
			if(this._diffNavigator.gotoChange(caretPosition, textView)){
				var drawLine = this._rightTextView.getTopIndex() ;
				this._rightTextView.redrawLines(drawLine , drawLine+  1 , this._overviewRuler);
				this.render();
			}
		},

		nextDiff: function(){
			this._diffNavigator.iterateOnBlock(true, true);
			this.positionDiffBlock(this._diffNavigator.getCurrentBlockIndex());
			this.render();
		},
		
		prevDiff: function(){
			this._diffNavigator.iterateOnBlock(false, true);
			this.positionDiffBlock(this._diffNavigator.getCurrentBlockIndex());
			this.render();
		},
		
		nextChange: function(){
			this._diffNavigator.iterateOnChange(true);
			this.positionDiffBlock(this._diffNavigator.getCurrentBlockIndex());
			this.render();
		},
		
		prevChange: function(){
			this._diffNavigator.iterateOnChange(false);
			this.positionDiffBlock(this._diffNavigator.getCurrentBlockIndex());
			this.render();
		},
		
		getMapperTextRange: function(editor , mapperIndex , mapperColumnIndex){
			var startLine = mCompareUtils.lookUpLineIndex(this._diffNavigator.getMapper(), mapperIndex, mapperIndex);
			var endLine = startLine + this._mapper[mapperIndex][mapperColumnIndex] - 1;
			var start =  editor.getModel().getLineStart(startLine);
			var end =  editor.getModel().getLineEnd(endLine,true);
			return {start:start,end:end};
		},
	
		copyToLeft: function(){
			if(!this._diffNavigator.iterator){
				return;
			}
			var currentDiff = this._diffNavigator.iterator.cursor();
			if(currentDiff){
				var textR = this._rightTextView.getText(currentDiff.oldA.start , currentDiff.oldA.end);
				this._leftTextView.setText(textR , currentDiff.newA.start , currentDiff.newA.end);
			}
		},
	
		render: function(){
			if(!this._mapper )
				return;
			var context=this._canvasDiv.getContext("2d");
			context.clearRect(0,0,this._canvasDiv.width,this._canvasDiv.height);
			context.strokeStyle = '#AAAAAA'; 
			context.lineWidth   = 1;
			context.beginPath();
			
			var leftTop = this._leftTextView.getTopIndex();
			var leftBottom = this._leftTextView.getBottomIndex();
			var rightTop = this._rightTextView.getTopIndex();
			var rightBottom = this._rightTextView.getBottomIndex();
			this._leftLineH = this._leftTextView.getLineHeight();
			this._rightLineH = this._rightTextView.getLineHeight();
		
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
			var leftMiddle =  this._leftTextView.getLinePixel(leftStart + (mapperItem[0]/2)) + (mapperItem[0]%2)*this._leftLineH/3 - this._leftTextView.getTopPixel();
			var rightMiddle =  this._rightTextView.getLinePixel(rightStart + (mapperItem[1]/2)) + (mapperItem[1]%2)*this._rightLineH/3- this._rightTextView.getTopPixel();
			
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
			if(!this._initing){
				mCompareUtils.updateMapper(this._mapper , 0 , this._leftTextView.getModel().getLineAtOffset(e.start) , e.removedLineCount, e.addedLineCount);
			}
			this._initing = false;
			if(e.removedLineCount > 0 || e.addedLineCount > 0)
				this.render();
		}
	};
	return CompareMatchRenderer;
}()); 

return orion;
});