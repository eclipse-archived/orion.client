/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var eclipse = eclipse || {};

eclipse.CompareMergeModel = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	/** @private */
	function CompareMergeModel(model, mapWrapper) {
	    this._model = model;
	    this._mapperColumnIndex = mapWrapper.columnIndex;
	    this._mapper = mapWrapper.mapper;
		this._listeners = [];
		model.addListener(this);
	    this.init();
	}

	CompareMergeModel.prototype = /** @lends eclipse.TextModel.prototype */ {
		//private functions
		init: function(mapper){
			if(mapper)
				this._mapper = mapper;
		},
		
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			var mapItem = this.lookUpMapper(lineIndex);
			if(mapItem.mapperIndex > -1){
				if(this._mapper[mapItem.mapperIndex][2] !== 0){
					var mapperLength = this._mapper[mapItem.mapperIndex][this._mapperColumnIndex];
					if(mapperLength === 0)
						return "top-only";
					if(mapperLength === 1)
						return "oneline";
					if(lineIndex === mapItem.startFrom)
						return "top";
					if(lineIndex === mapItem.startFrom + mapperLength -1)
						return "bottom";
					return "middle";
				}
			}
			return "unchanged";
		},
			
		getAnnotations: function(){
			if(this._annotations === undefined){
				this._annotations = [];
				var curLineindex = 0;//zero based
				for (var i = 0 ; i < this._mapper.length ; i++){
					if((this._mapper[i][2] !== 0))
						this._annotations.push([curLineindex , i]);
					curLineindex += this._mapper[i][this._mapperColumnIndex];
				}
			}
			return this._annotations;
		},
		
		getAnnotationH: function(lineIndex){
			var annotationIndex = this.getAnnotationIndex(lineIndex);
			return 	(annotationIndex === -1) ? 0 : Math.max(this._mapper[annotationIndex][0], this._mapper[annotationIndex][1]);
		},
		
		getAnnotationIndex: function(lineIndex){
			if(this._anotations === undefined)
				this.getAnnotations();
			for (var i = 0 ; i < this._annotations.length ; i++){
				if(this._annotations[i][0] === lineIndex){
					return this._annotations[i][1];
				}
			}
			return -1;
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			return lineIndex;
		},
		
		lookUpMapper: function(lineIndex){
			var curLineindex = 0;//zero based
			for (var i = 0 ; i < this._mapper.length ; i++){
				var size = this._mapper[i][this._mapperColumnIndex];
				if(size === 0)
					size = 1;
				if(lineIndex >= curLineindex && lineIndex < (curLineindex + size)){
					return {mapperIndex:i , startFrom:curLineindex};
				}
				curLineindex += this._mapper[i][this._mapperColumnIndex];
			}
			return  {mapperIndex:-1 , startFrom:-1};
		},
		
		getLineIndexFromMapper: function(mapperIndex){
			if(mapperIndex === 0)
				return 0;
			var curLineindex = 0;//zero based
			for (var i = 0 ; i < mapperIndex ; i++){
				curLineindex += this._mapper[i][this._mapperColumnIndex];
			}
			return curLineindex;
		},
		
		updateMapper: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount){
			if(removedLineCount === addedLineCount)
				return;
			if(removedLineCount > 0 || addedLineCount > 0){
				var lineIndex = this.getLineAtOffset(start);
				var mapperItem = this.lookUpMapper(lineIndex);
				if(removedLineCount > 0){
					var linesLeft = removedLineCount;
					var startInMapper = lineIndex - mapperItem.startFrom;
					for(var i = mapperItem.mapperIndex ; i < this._mapper.length ; i++){
						var wipeOutLines = this._mapper[i][this._mapperColumnIndex] - startInMapper;
						if(linesLeft <= wipeOutLines){
							this._mapper[i][this._mapperColumnIndex] -= linesLeft;
							break;
						}
						this._mapper[i][this._mapperColumnIndex] -= wipeOutLines;
						linesLeft -= wipeOutLines;
						startInMapper = 0;
					}
				}
				if(addedLineCount > 0){
					this._mapper[mapperItem.mapperIndex][this._mapperColumnIndex] += addedLineCount;
				}
			}
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
			return this._model.getCharCount();
		},

		getLine: function(lineIndex, includeDelimiter) {
			return this._model.getLine(lineIndex , includeDelimiter);
		},
		
		getLineAtOffset: function(offset) {
			return this._model.getLineAtOffset(offset);
		},
		
		getLineCount: function() {
			return this._model.getLineCount();
		},
		
		getLineDelimiter: function() {
			return this._model.getLineDelimiter();
		},
		
		getLineEnd: function(lineIndex, includeDelimiter) {
			return this._model.getLineEnd(lineIndex, includeDelimiter);
		},
		
		getLineStart: function(lineIndex) {
			return this._model.getLineStart (lineIndex);
		},
		
		setText: function(text, start, end) {
			this._model.setText (text, start, end);
		},
		
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
			console.log("start : " + start);
			console.log("removedCharCount : " + removedCharCount);
			console.log("addedCharCount : " + addedCharCount);
			console.log("removedLineCount : " + removedLineCount);
			console.log("addedLineCount : " + addedLineCount);
			console.log("line number : " + this.getLineAtOffset(start));
			this.updateMapper(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
			for (var i = 0; i < this._listeners.length; i++) {
				var l = this._listeners[i]; 
				if (l && l.onChanged) { 
					l.onChanged(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount);
				}
			}
		}
		
	};
	
	return CompareMergeModel;
}()); 
