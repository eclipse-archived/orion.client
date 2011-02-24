/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var eclipse = eclipse || {};

eclipse.CompareTextModel = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	/** @private */
	function CompareTextModel(model, mapWrapper , lineFeeder) {
	    this._model = model;//new eclipse.TextModel(text, lineDelimiter);
	    this._mapperColumnIndex = mapWrapper.columnIndex;
	    this._mapper = mapWrapper.mapper;
		this._listeners = [];
		model.addListener(this);
		this._lineFeeder = lineFeeder;
	    this._init();
	}

	CompareTextModel.prototype = /** @lends eclipse.TextModel.prototype */ {
		//private functions
		_init: function(){
			var result = this._lineFeeder.generateGapBlocks(this._mapperColumnIndex);
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
					lineOffset += this._model.getLine (realIndex.lineIndex, true).length;
				}
				lineIndex++;
				if (lineOffset > offset) 
					break;
			}
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
			return this._model.getText(start, end);
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
		
		setText: function(text, start, end) {
			this._model.setText (text, start, end);
		}
	};
	
	return CompareTextModel;
}()); 
