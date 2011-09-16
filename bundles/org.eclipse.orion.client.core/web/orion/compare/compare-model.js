/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([], function() {

var orion = orion || {};

orion.CompareTextModel = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	/** @private */
	function CompareTextModel(model, mapWrapper , lineFeeder) {
	    this._model = model;
	    this._mapperColumnIndex = mapWrapper.columnIndex;
	    this._mapper = mapWrapper.mapper;
		this._listeners = [];
		model.addListener(this);
		this._lineFeeder = lineFeeder;
	    this.init();
	}

	CompareTextModel.prototype = {
		//private functions
		init: function(mapper , diffArray){
			if(mapper)
				this._mapper = mapper;
			var result = this._lineFeeder.generateGapBlocks(this._mapper , this._mapperColumnIndex , diffArray);
			this._dummyLBlock = result.gapBlocks;
			this._dummyLNumber = result.gapNumber;
		},
		
		_getDummyCharCountAt: function(gapInfo , includeDelimiter){
			if(gapInfo.blockNumber < 0)
				return 0;
			var count = 0;
			for (var i = 0 ; i <= gapInfo.blockNumber ; i++){
				if(i >= this._dummyLBlock.length)
					break;
				var stopAtDelta = (i === gapInfo.blockNumber) ? gapInfo.stopAtDelta : this._dummyLBlock[i][1] - 1;
				for(var j = 0 ; j <= stopAtDelta ; j++ ){
					var lineText = includeDelimiter ? this._lineFeeder.getLineAt(this._dummyLBlock ,i,j,true) : this._lineFeeder.getLineAt(this._dummyLBlock , i,j,!( i === gapInfo.blockNumber && j === stopAtDelta));
					count += lineText.length;
				}
			}
			return count;
		},
		
		//Get the index for the _text from the virtual index
		//return value : {lineIndex: >= 0 if 
		lookUpRealIndex: function(lineIndex){
			var gapsBefore = 0;
			var lastGapSize = 0;
			for (var i = 0 ; i < this._dummyLBlock.length ; i++){
				var gapStart = this._dummyLBlock[i][0];
				var gapEnd = gapStart + this._dummyLBlock[i][1] -1;
				if(lineIndex < gapStart)
						break;
				//If the lineIndex is within a gap block , returns -1 
				if(lineIndex >= gapStart && lineIndex <= gapEnd )
					return {lineIndex:-1 , gapsBefore:gapsBefore + lineIndex - gapStart , lastGapInfo:{blockNumber:i , stopAtDelta:lineIndex-gapStart }};
				lastGapSize = this._dummyLBlock[i][1];
				gapsBefore += lastGapSize;
			}
			return {lineIndex:(lineIndex -gapsBefore) , gapsBefore:gapsBefore , lastGapInfo:{blockNumber:i-1 , stopAtDelta:lastGapSize-1}};
		},
		
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			return this._lineFeeder.getLineType(lineIndex , this._mapperColumnIndex);
		},
			
		getMapper: function(){
			return this._mapper;
		},
		
		getAnnotations: function(){
			return this._lineFeeder.getAnnotations();
		},
		
		getAnnotationH: function(lineIndex){
			return this._lineFeeder.getAnnotationH(lineIndex);
		},
		
		getAnnotationLineCount: function(){
			return 	this.getLineCount();
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			if(this._lineFeeder.getLineNumber)
				return this._lineFeeder.getLineNumber(lineIndex , mapperColumnIndex);
			var realIndex = this.lookUpRealIndex(lineIndex);
			return realIndex.lineIndex;
		},
		
		addListener: function(listener) {
			this._listeners.push(listener);
		},
		
		removeListener: function(listener) {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i] === listener) {
					this._listeners.splice(i, 1);
					return;
				}
			}
		},

		getCharCount: function() {
			var count = this._model.getCharCount();
			if(this._dummyLBlock.length > 0)
				count += this._getDummyCharCountAt({blockNumber:this._dummyLBlock.length - 1 , stopAtDelta: this._dummyLBlock[this._dummyLBlock.length-1][1] - 1} , true); 
			return count;
		},

		getLine: function(lineIndex, includeDelimiter) {
			var lineCount = this.getLineCount();
			if (!(0 <= lineIndex && lineIndex < lineCount)) {
				return null;
			}
			var realIndex = this.lookUpRealIndex(lineIndex);
			if (realIndex.lineIndex < 0) {
				return this._lineFeeder.getLineAt(this._dummyLBlock ,realIndex.lastGapInfo.blockNumber , realIndex.lastGapInfo.stopAtDelta , includeDelimiter);
			} else {
				return this._model.getLine(realIndex.lineIndex , includeDelimiter);
			}
		},
		
		getLineAtOffset: function(offset) {
			if (!(0 <= offset && offset <= this.getCharCount())) {
				return -1;
			}
			var lineCount = this.getLineCount();
			var lineIndex = 0;
			var lineOffset = 0;
			while (lineIndex < lineCount) {
				var realIndex = this.lookUpRealIndex(lineIndex);
				if (realIndex.lineIndex < 0) {
					lineOffset += this._lineFeeder.getLineAt(this._dummyLBlock ,realIndex.lastGapInfo.blockNumber , realIndex.lastGapInfo.stopAtDelta , true ).length; 
				} else {
					var line = this._model.getLine (realIndex.lineIndex, true);
					if(line){
						lineOffset += line.length;
					} else {
						lineOffset += 0;
					}
				}
				lineIndex++;
				if (lineOffset > offset) 
					break;
			}
			if(lineIndex > lineCount)
				return (lineCount -1 );
			return lineIndex-1;
		},
		
		getLineCount: function() {
			return this._model.getLineCount() + this._dummyLNumber;
		},
		
		getLineDelimiter: function() {
			return this._model.getLineDelimiter();
		},
		
		getLineEnd: function(lineIndex, includeDelimiter) {
			var lineCount = this.getLineCount();
			if (!(0 <= lineIndex && lineIndex < lineCount)) {
				return -1;
			}
			var realIndex = this.lookUpRealIndex(lineIndex);
			var offset = 0;
			if (realIndex.lineIndex < 0) {
				offset += this._getDummyCharCountAt(realIndex.lastGapInfo , includeDelimiter);
				var realLinesBefore = lineIndex -  realIndex.gapsBefore;
				if(realLinesBefore > 0)
					offset += this._model.getLineEnd(realLinesBefore - 1, true);
			} else{
				offset += this._getDummyCharCountAt(realIndex.lastGapInfo , true);
				offset += this._model.getLineEnd(realIndex.lineIndex, includeDelimiter);
			}
			return offset;
		},
		
		getLineStart: function(lineIndex) {
			if (!(0 <= lineIndex && lineIndex < this.getLineCount())) {
				return -1;
			}
			if(lineIndex === 0)
				return 0;
			return this.getLineEnd(lineIndex - 1 , true);
		},
		
		
		//TODO : for editting mode
		getText: function(start, end) {
			if(start === end)
				return this._model.getText(start,end);
			if (start === undefined) { start = 0; }
			if (end === undefined) { end = this.getCharCount(); }
			var startLine = this.getLineAtOffset(start);
			var endLine = this.getLineAtOffset(end);
			var lineStart = this.getLineStart(startLine);
			var lineEnd = this.getLineEnd(endLine,true);
			var firstLine = this.getLine(startLine,true);
			if(!firstLine)
				return this._model.getText(start,end);
			if(startLine === endLine){
				return firstLine.substring(start - lineStart , firstLine.length - lineEnd + end);
			}
			var beforeText =  firstLine.substring(start - lineStart);
			var lastLine = this.getLine(endLine,true);
			if(!lastLine)
				return this._model.getText(start,end);
			var afterText =  lastLine.substring(0, lastLine.length - lineEnd + end);
			var middleText = "";
			for(var i = startLine +1 ; i < endLine ;i++){
				middleText = middleText +  this.getLine(i,true);
			}
			return (beforeText + middleText + afterText);
		},
		
		onChanging: function(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanging) { 
					l.onChanging(text, start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		
		onChanged: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount) {
			
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		},
		
		setLineDelimiter: function(lineDelimiter) {
			this._model.setLineDelimiter(lineDelimiter);
		},
		
		setText: function(text, start, end) {
			this._model.setText (text, 0, this._model.getCharCount());
		}
	};
	
	return CompareTextModel;
}()); 

orion.DiffLineFeeder = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	function DiffLineFeeder(diffLinesArray , lineDelimeter) {
		if(diffLinesArray){
			this._diffLinesArray = diffLinesArray.array;
			this._diffLinesArrayIndex = diffLinesArray.index;
		}
		this._lineDelimeter = lineDelimeter;
		this._annotations = [];
	}

	DiffLineFeeder.prototype =  {
	
		generateGapBlocks: function( mapper, mapperColumnIndex , diffLinesArray ){
		    var gapBlocks = [];//Each item represents the start lineIndex and the line number of a gap block , and the string index of the dummyLineArray
			this._mapper = mapper;
			if(diffLinesArray){
				this._diffLinesArray = diffLinesArray.array;
				this._diffLinesArrayIndex = diffLinesArray.index;
			}
		    this._annotations = [];
		    var gapNumber = 0;
			var curLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			var delta = 0;
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][2] === 0)
					delta = this._mapper[i][mapperColumnIndex];
				else
					delta = this._mapper[i][mapperColumnIndex] + this._mapper[i][mapperColumnIndexCompare];
				if(this._mapper[i][2] > 0){
					var gap =this._mapper[i][mapperColumnIndex];
					gapNumber +=gap;
					gapBlocks.push([curLineindex + this._mapper[i][mapperColumnIndexCompare] , gap , this._mapper[i][2]]);
				}
				if((this._mapper[i][2] !== 0))
					this._annotations.push([curLineindex , i, delta]);
				curLineindex += delta;
			}
			return {gapBlocks:gapBlocks , gapNumber:gapNumber};
		},
		
		getLineAt: function(blocks , blockNumber , delta , includeDelimiter ){
			var index = blocks[blockNumber][2];
			index += (delta -1);
			var lineText = this._diffLinesArray[index];
			if(lineText === undefined){
				console.log(blocks);
			}
			lineText = lineText.substring(this._diffLinesArrayIndex);
			if (includeDelimiter) {
				return lineText + this._lineDelimeter;
			}
			return lineText;
		},
	
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex , mapperColumnIndex){
			var curLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			var delta = 0;
			
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][2] === 0)
					delta = this._mapper[i][mapperColumnIndex];
				else
					delta = this._mapper[i][mapperColumnIndex] + this._mapper[i][mapperColumnIndexCompare];
				if(lineIndex >= curLineindex && lineIndex < (curLineindex +delta)){
					if(this._mapper[i][2] === 0){
						return {type:"unchnaged" , mapperIndex:i};
					} else if(this._mapper[i][2] < 0){
						return {type:"removed" , mapperIndex:i};
					} else if(this._mapper[i][1] === 0){
						return {type:"added", mapperIndex:i};
					} else if (lineIndex < this._mapper[i][mapperColumnIndexCompare] + curLineindex){
						return {type:"removed" , mapperIndex:i};
					}	
					return {type:"added" , mapperIndex:i};
				}
				curLineindex += delta;
			}
			return {type:"unchnaged" , mapperIndex:-1};
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			if(this._mapper.length === 0)
				return lineIndex;
			var curLineindex = 0;//zero based
			var curMyLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			var delta = 0;
			
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][2] === 0)
					delta = this._mapper[i][mapperColumnIndex];
				else
					delta = this._mapper[i][mapperColumnIndex] + this._mapper[i][mapperColumnIndexCompare];
				
				if(lineIndex >= curLineindex && lineIndex < (curLineindex +delta)){
					var curDelta = lineIndex - curLineindex;
					if(this._mapper[i][2] === 0){
						return curMyLineindex + curDelta;
					} else if(this._mapper[i][2] < 0){
						return mapperColumnIndex === 0 ? -1 : (curMyLineindex + curDelta);
					} else if(this._mapper[i][1] === 0){
						return mapperColumnIndex === 0 ? (curMyLineindex + curDelta) : -1;
					} else if (lineIndex < this._mapper[i][1] + curLineindex){
						return mapperColumnIndex === 0 ? -1 : (curMyLineindex + curDelta);
					}	
					return mapperColumnIndex === 0 ? (curMyLineindex + curDelta - this._mapper[i][1]) : -1;
				}
				curLineindex += delta;
				curMyLineindex += this._mapper[i][mapperColumnIndex];
			}
			return lineIndex;
		},
		
		getAnnotations: function(){
			return this._annotations;
		},
		
		getAnnotationH: function(annotationIndex){
			return  this._annotations[annotationIndex][2];
		}
		
	};
	
	return DiffLineFeeder;
}()); 

// Gap line feeder is no longer used. But we refer to it as an example how the different line feeders serve the compare model.
orion.GapLineFeeder = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	function GapLineFeeder(lineDelimeter) {
		this._lineDelimeter = lineDelimeter;
		this._annotations = [];
	}

	GapLineFeeder.prototype = {
		generateGapBlocks: function( mapper, mapperColumnIndex , diffLinesArray ){
		    var gapBlocks = [];//Each item represents the start lineIndex and the line number of a gap block , and the string index of the dummyLineArray
			this._mapper = mapper;
			this._annotations = [];
		    var gapNumber = 0;
			var curLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][mapperColumnIndex] < this._mapper[i][mapperColumnIndexCompare]){
					var gap = this._mapper[i][mapperColumnIndexCompare] - this._mapper[i][mapperColumnIndex];
					gapNumber +=gap;
					gapBlocks.push([curLineindex + this._mapper[i][mapperColumnIndex] , gap , 1]);
				}
				var delta = Math.max(this._mapper[i][mapperColumnIndexCompare], this._mapper[i][mapperColumnIndex]);
				if((this._mapper[i][2] !== 0))
					this._annotations.push([curLineindex , i, delta]);
				curLineindex += delta;
			}
			return {gapBlocks:gapBlocks , gapNumber:gapNumber};
		},
		
		getLineAt: function(blocks , blockNumber , delta , includeDelimiter ){
			if (includeDelimiter) {
				return this._lineDelimeter;
			}
			return "";
		},
	
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex , mapperColumnIndex){
			var curLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			for (var i = 0 ; i < this._mapper.length ; i++){
				var maxV = Math.max(this._mapper[i][mapperColumnIndex], this._mapper[i][mapperColumnIndexCompare]);
				if(lineIndex >= curLineindex && lineIndex < (curLineindex + maxV)){
					if(this._mapper[i][2] === 0){
						return "unchnaged";
					} else if(this._mapper[i][2] < 0){
						return "removed";
					} else if(this._mapper[i][1] === 0){
						return "added";
					} else if (lineIndex < this._mapper[i][mapperColumnIndex] + curLineindex){
						return "changed";
					}
					return "changed_gap";
				}
				curLineindex += Math.max(this._mapper[i][mapperColumnIndex], this._mapper[i][mapperColumnIndexCompare]);
			}
			return "unchnaged";
		},
		
		getAnnotations: function(){
			return this._annotations;
		},
		
		getAnnotationH: function(annotationIndex){
			return  this._annotations[annotationIndex][2];
		}
		
	};
	
	return GapLineFeeder;
}()); 

return orion;
});

