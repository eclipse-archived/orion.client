/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['orion/compare/compareUtils', 'orion/textview/eventTarget'], function(mCompareUtils, mEventTarget) {


var orion = orion || {};

orion.CompareMergeModel = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	/** @private */
	function CompareMergeModel(model, mapWrapper) {
	    this._model = model;
	    this._mapperColumnIndex = mapWrapper.columnIndex;
	    this._mapper = mapWrapper.mapper;
	    var self = this;
		this._listener = {
			/** @private */
			onChanging: function(modelChangingEvent) {
				self.onChanging(modelChangingEvent);
			},
			/** @private */
			onChanged: function(modelChangedEvent) {
				self.onChanged(modelChangedEvent);
			}
		};
		model.addEventListener("Changing", this._listener.onChanging);
		model.addEventListener("Changed", this._listener.onChanged);
	    this.init();
	}

	CompareMergeModel.prototype =  {
		//private functions
		init: function(mapper){
			this._initing = true;
			if(mapper){
				this._mapper = mapper;
				this._annotations = undefined;
			}
		},
		
		getMapper: function(){
			return this._mapper;
		},
		
		//To get the line type from a zero based line index  
		getLineType: function(lineIndex){
			var mapItem = mCompareUtils.lookUpMapper(this._mapper , this._mapperColumnIndex , lineIndex);
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
			
		isMapperEmpty: function(){
			return this._mapper.length === 0;
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
			this.getAnnotations();
			var mapperIndex = this._annotations[annotationIndex][1];
			return 	(mapperIndex === -1) ? 0 :this._mapper[mapperIndex][this._mapperColumnIndex];
			//return 	(annotationIndex === -1) ? 0 : Math.max(this._mapper[annotationIndex][0], this._mapper[annotationIndex][1]);
		},
		
		getAnnotationLineCount: function(){
			//return 	orion.compareUtils.getMapperLineCount(this._mapper);
			return 	this.getLineCount();
		},
		
		getLineNumber: function(lineIndex , mapperColumnIndex){
			return lineIndex;
		},
		
		getLineIndexFromMapper: function(mapperIndex){
			return mCompareUtils.lookUpLineIndex(this._mapper , this._mapperColumnIndex , mapperIndex);
		},
		
		lookUpMapper: function(lineIndex){
			return mCompareUtils.lookUpMapper(this._mapper , this._mapperColumnIndex , lineIndex);
		},
		
		updateMapper: function(start, removedCharCount, addedCharCount, removedLineCount, addedLineCount){
			if(removedLineCount === addedLineCount)
				return;
			mCompareUtils.updateMapper(this._mapper , this._mapperColumnIndex , this.getLineAtOffset(start) , removedLineCount, addedLineCount);
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
		
		setLineDelimiter: function(lineDelimiter) {
			this._model.setLineDelimiter(lineDelimiter);
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
		
		onChanging: function(modelChangingEvent) {
			return this.dispatchEvent(modelChangingEvent);
		},
		
		onChanged: function(e) {
			/*
			console.log("start : " + e.start);
			console.log("removedCharCount : " + e.removedCharCount);
			console.log("addedCharCount : " + e.addedCharCount);
			console.log("removedLineCount : " + e.removedLineCount);
			console.log("addedLineCount : " + e.addedLineCount);
			console.log("line number : " + this.getLineAtOffset(e.start));
			*/
			if(!this._initing){
				this.updateMapper(e.start, e.removedCharCount, e.addedCharCount, e.removedLineCount, e.addedLineCount);
			} else {
				this._initing = false;
			}
			return this.dispatchEvent(e);
		}
		
	};
	
	mEventTarget.EventTarget.addMixin(CompareMergeModel.prototype);
	return CompareMergeModel;
}()); 
return orion;
});
