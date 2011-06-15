/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define([], function(){

var orion = orion || {};

orion.GapTextModel = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	/** @private */
	function GapTextModel(model, isOriginal ,map) {
	    this._model = model;
	    this._isOriginal = (isOriginal === undefined ? true : isOriginal);
	    this._myIndex = this._isOriginal ? 1:0;
	    this._reverseIndex = 1-this._myIndex;
	    this._map = map;
		this._listeners = [];
		model.addListener(this);
	    this._init();
	}

	GapTextModel.prototype = {
		//private functions
		_init: function(){
			this._generateGapBlocks();
		},
		
		_generateGapBlocks: function(){
		    this._gapBlocks = [];//Each item represents the start lineIndex and the line number of a gap block
		    this._gapNumber = 0;
			var curLineindex = 0;//zero based
			for (var i = 0 ; i < this._map.length ; i++){
				if(this._map[i][this._myIndex] < this._map[i][this._reverseIndex]){
					var gap = this._map[i][this._reverseIndex] - this._map[i][this._myIndex];
					this._gapNumber +=gap;
					this._gapBlocks.push([curLineindex + this._map[i][this._myIndex] , gap]);
				}
				curLineindex += Math.max(this._map[i][this._reverseIndex], this._map[i][this._myIndex]);
			}
		},
		
		//Get the index for the _text from the virtual index
		//Returns -1 if the lineIndex is inside a gap block
		lookUpRealIndex: function(lineIndex){
			var gapsBefore = 0;
			for (var i = 0 ; i < this._gapBlocks.length ; i++){
				var gapStart = this._gapBlocks[i][0];
				var gapSize = this._gapBlocks[i][1];
				var gapEnd = this._gapBlocks[i][0] + this._gapBlocks[i][1] -1;
				if(lineIndex < gapStart)
						break;
				//If the lineIndex is within a gap block , returns -1 
				if(lineIndex >= gapStart && lineIndex <= gapEnd )
					return {lineIndex:-1 , gapsBefore:gapsBefore + lineIndex - gapStart};
				gapsBefore += this._gapBlocks[i][1];
			}
			return {lineIndex:(lineIndex -gapsBefore) , gapsBefore:gapsBefore};
		},
		
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			
			var curLineindex = 0;//zero based
			for (var i = 0 ; i < this._map.length ; i++){
				var maxV = Math.max(this._map[i][this._reverseIndex], this._map[i][this._myIndex]);
				if(lineIndex >= curLineindex && lineIndex < (curLineindex + maxV)){
					if(this._map[i][2] === 0){
						return "unchnaged";
					} else if(this._map[i][2] < 0){
						return "removed";
					} else if(this._map[i][1] === 0){
						return "added";
					} else if (lineIndex < this._map[i][this._myIndex] + curLineindex){
						return "changed";
					}
					return "changed_gap";
				}
				curLineindex += Math.max(this._map[i][this._reverseIndex], this._map[i][this._myIndex]);
			}
			return "unchnaged";
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
			count += (this._gapNumber*this.getLineDelimiter().length); 
			return count;
		},

		getLine: function(lineIndex, includeDelimiter) {
			var lineCount = this.getLineCount();
			if (!(0 <= lineIndex && lineIndex < lineCount)) {
				return null;
			}
			var realIndex = this.lookUpRealIndex(lineIndex);
			if (realIndex.lineIndex < 0) {
				if(includeDelimiter)
					return this.getLineDelimiter();
				return "";
			} else {
				return this._model.getLine(realIndex.lineIndex , includeDelimiter);
			}
		},
		
		getLineAtOffset: function(offset) {
			if (!(0 <= offset && offset <= this.getCharCount())) {
				return -1;
			}
			var model = this._model;
			var lineCount = this.getLineCount();
			var lineIndex = 0;
			var lineOffset = 0;
			while (lineIndex < lineCount) {
				var realIndex = this.lookUpRealIndex(lineIndex);
				if (realIndex.lineIndex < 0) {
					lineOffset += this.getLineDelimiter().length; 
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
			return this._model.getLineCount() + this._gapNumber;
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
			var offset = realIndex.gapsBefore * this.getLineDelimiter().length;
			if (realIndex.lineIndex < 0) {
				var realLinesBefore = lineIndex -  realIndex.gapsBefore;
				if(realLinesBefore > 0)
					offset += this._model.getLineEnd(realLinesBefore - 1, true);
				if(includeDelimiter)
					offset += this.getLineDelimiter().length;
			} else{
				offset += this._model.getLineEnd(realIndex.lineIndex, includeDelimiter);
			}
			return offset;
		},
		
		getLineStart: function(lineIndex) {
			if (!(0 <= lineIndex && lineIndex < this.getLineCount())) {
				return -1;
			}
			var realIndex = this.lookUpRealIndex(lineIndex);
			var gaps = 0;
			var newLineIndex = -1;
			if (realIndex.lineIndex < 0) {
				var gaps = realIndex.gapsBefore;
				if((lineIndex - gaps) >= 0 )
					newLineIndex = lineIndex - gaps - 1;
			} else {
				gaps = realIndex.gapsBefore;
				newLineIndex = realIndex.lineIndex;
			}
			var offset = 0;
			//if(includeDelimiter)
				offset += this.getLineDelimiter().length*gaps;
			if(newLineIndex >= 0){
				if(realIndex.lineIndex < 0)
					offset += this._model.getLineEnd(newLineIndex,true);
				else
					offset += this._model.getLineStart(newLineIndex);
			}
			return offset;
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
	
	return GapTextModel;
}()); 

return orion;	
});
