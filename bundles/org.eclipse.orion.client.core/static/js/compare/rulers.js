/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var orion = orion || {};

orion.CompareRuler = (function() {
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

orion.LineNumberCompareRuler = (function() {
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

orion.CompareOverviewRuler = (function() {
	function CompareOverviewRuler (rulerLocation, rulerStyle) {
		orion.CompareRuler.call(this, rulerLocation, "document", rulerStyle);
	}
	CompareOverviewRuler.prototype = new orion.CompareRuler();
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


orion.CompareMergeOverviewRuler = (function() {
	function CompareMergeOverviewRuler (compareMatchRenderer , rulerLocation, rulerStyle) {
		this._compareMatchRenderer = compareMatchRenderer;
		orion.CompareRuler.call(this, rulerLocation, "document", rulerStyle);
	}
	CompareMergeOverviewRuler.prototype = new orion.CompareRuler();
	CompareMergeOverviewRuler.prototype.getAnnotations = function() {
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
	CompareMergeOverviewRuler.prototype.getStyle = function(lineIndex) {
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
				var annotationIndex = model.getAnnotationIndex(lineIndex);
				if(annotationIndex === this._compareMatchRenderer.getCurrentAnnotationIndex())
					style.backgroundColor = "blue";
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
	CompareMergeOverviewRuler.prototype.getHTML = function(lineIndex) {
		return "&nbsp;";
	};
	CompareMergeOverviewRuler.prototype.onClick = function(lineIndex, e) {
		if (lineIndex === undefined) { return; }
		this._compareMatchRenderer.matchPositionFromAnnotation(lineIndex);
	};
	CompareMergeOverviewRuler.prototype._onModelChanged = function(e) {
		var model = this._editor.getModel();
		var lineCount = model.getLineCount();
		if(lineCount > 0)
			this._editor.redrawLines(0, 1, this);
	};
	return CompareMergeOverviewRuler;
}());


orion.CompareMatchRenderer =  (function() {

	function CompareMatchRenderer(canvasDiv) {
		this._canvasDiv = canvasDiv;
		this._mapper = undefined;
	}

	CompareMatchRenderer.prototype =  {
		
		init: function(mapper , leftEditor , rightEditor ){
			this._mapper = mapper;
			this._leftEditor = leftEditor;
			this._rightEditor = rightEditor;
			this._currentAnnotationIndex = 0;
			this.render();
		},
		
		getCurrentAnnotationIndex: function(){
			return this._currentAnnotationIndex;
		},
		
		getCurrentMapperIndex: function(){
			var annotations = this._rightEditor.getModel().getAnnotations();
			return annotations.length === 0 ? -1 : annotations[this._currentAnnotationIndex][1];
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
			var matchLine = orion.compareUtils.matchMapper(this._mapper , fromLeft ? 0: 1 , topLine , bottomLine);
			matchEditor.setTopIndex(matchLine);
		},

		matchPositionFromAnnotation: function(index){
			var annotaionIndex = index;
			if(index === -1){
				annotaionIndex = 0;
			} else {
				var model =  this._rightEditor.getModel();
				annotaionIndex = model.getAnnotationIndex(index);
			}
			this._currentAnnotationIndex = annotaionIndex;
			this.positionAnnotation(annotaionIndex);
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
		
		nextDiff: function(){
			var annotations = this._rightEditor.getModel().getAnnotations();
			if(annotations.length !== 0 ){
				if((annotations.length -1) === this._currentAnnotationIndex)
					this._currentAnnotationIndex = 0;
				else
					this._currentAnnotationIndex += 1;
			}
			this.positionAnnotation(this._currentAnnotationIndex);
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
			if(this._mapper[mapperIndex][1] === 0)
				return;
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
					if(orion.compareUtils.overlapMapper( this._mapper[i] , 0 , curLeftIndex , leftTop ,leftBottom) ||
					   orion.compareUtils.overlapMapper( this._mapper[i] , 1 , curRightIndex , rightTop ,rightBottom) ){
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
			var leftMiddle =  (leftStart + (mapperItem[0]/2) - leftTop) * this._leftLineH;
			var rightMiddle = (rightStart + (mapperItem[1]/2) - rightTop) * this._rightLineH ;
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
		
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			if(removedLineCount === addedLineCount)
				return;
			if(removedLineCount > 0 || addedLineCount > 0)
				this.render();
			
		}
		
	};
	
	return CompareMatchRenderer;
}()); 

