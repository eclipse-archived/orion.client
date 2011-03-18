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
			var mapItem = this._lookUpMapper(lineIndex);
			if(mapItem.mapper){
				if(mapItem.mapper[2] !== 0)
					return "changed";
			}
			return "unchanged";
		},
			
		getAnnotations: function(){
			return [];//this._lineFeeder.getAnnotations();
		},
		
		getAnnotationH: function(lineIndex){
			return 1;//this._lineFeeder.getAnnotationH(lineIndex);
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			return lineIndex;
		},
		
		_lookUpMapper: function(lineIndex){
			var curLineindex = 0;//zero based
			for (var i = 0 ; i < this._mapper.length ; i++){
				var size = this._mapper[i][this._mapperColumnIndex];
				if(size === 0)
					size = 1;
				if(lineIndex >= curLineindex && lineIndex < (curLineindex + size)){
					return {mapper:this._mapper[i] , startFrom:curLineindex};
				}
				curLineindex += this._mapper[i][this._mapperColumnIndex];
			}
			return  {mapper:null , startFrom:-1};
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
