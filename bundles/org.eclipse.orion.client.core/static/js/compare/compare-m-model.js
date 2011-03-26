/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var orion = orion || {};

orion.CompareMergeModel = (function() {
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

	CompareMergeModel.prototype =  {
		//private functions
		init: function(mapper){
			if(mapper)
				this._mapper = mapper;
		},
		
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			var mapItem = orion.compareUtils.lookUpMapper(this._mapper , this._mapperColumnIndex , lineIndex);
			if(mapItem.mapperIndex > -1){
				if(this._mapper[mapItem.mapperIndex][2] !== 0){
					var mapperLength = this._mapper[mapItem.mapperIndex][this._mapperColumnIndex];
					if(mapperLength === 0)
						return {type:"top-only" , mapperIndex:mapItem.mapperIndex};
					if(mapperLength === 1)
						return {type:"oneline" , mapperIndex:mapItem.mapperIndex};
					if(lineIndex === mapItem.startFrom)
						return {type:"top" , mapperIndex:mapItem.mapperIndex};
					if(lineIndex === mapItem.startFrom + mapperLength -1)
						return {type:"bottom" , mapperIndex:mapItem.mapperIndex};
					return {type:"middle" , mapperIndex:mapItem.mapperIndex};
				}
			}
			return {type:"unchanged" , mapperIndex:mapItem.mapperIndex};
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
		
		getAnnotationH: function(annotationIndex){
			var mapperIndex = this._annotations[annotationIndex][1];
			return 	(mapperIndex === -1) ? 0 :this._mapper[mapperIndex][this._mapperColumnIndex];
			//return 	(annotationIndex === -1) ? 0 : Math.max(this._mapper[annotationIndex][0], this._mapper[annotationIndex][1]);
		},
		
		getAnnotationLineCount: function(){
			//return 	orion.compareUtils.getMapperLineCount(this._mapper);
			return 	this.getLineCount();
		},
		
		getAnnotationIndex: function(lineIndex){
			if(this._annotations === undefined)
				this.getAnnotations();
			for (var i = 0 ; i < this._annotations.length ; i++){
				if(this._annotations[i][0] === lineIndex){
					return i;//this._annotations[i][1];
				}
			}
			return -1;
		},
		
		getAnnotationIndexByMapper: function(mapperIndex){
			if(this._annotations === undefined)
				this.getAnnotations();
			for (var i = 0 ; i < this._annotations.length ; i++){
				if(this._annotations[i][1] === mapperIndex){
					return i;
				}
			}
			return -1;
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			return lineIndex;
		},
		
		getLineIndexFromMapper: function(mapperIndex){
			return orion.compareUtils.lookUpLineIndex(this._mapper , this._mapperColumnIndex , mapperIndex);
		},
		
		lookUpMapper: function(lineIndex){
			return orion.compareUtils.lookUpMapper(this._mapper , this._mapperColumnIndex , lineIndex);
		},
		
		updateMapper: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount){
			if(removedLineCount === addedLineCount)
				return;
			orion.compareUtils.updateMapper(this._mapper , this._mapperColumnIndex , this.getLineAtOffset(start) , removedLineCount, addedLineCount);
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
			/*
			console.log("start : " + start);
			console.log("removedCharCount : " + removedCharCount);
			console.log("addedCharCount : " + addedCharCount);
			console.log("removedLineCount : " + removedLineCount);
			console.log("addedLineCount : " + addedLineCount);
			console.log("line number : " + this.getLineAtOffset(start));
			*/
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
