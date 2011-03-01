/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var eclipse = eclipse || {};

eclipse.GapLineFeeder = (function() {
	var isWindows = navigator.platform.indexOf("Win") !== -1;

	function GapLineFeeder(lineDelimeter) {
		this._lineDelimeter = lineDelimeter;
		this._annotations = [];
	}

	GapLineFeeder.prototype = /** @lends eclipse.TextModel.prototype */ {
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
					this._annotations.push([curLineindex , delta]);
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
		
		getAnnotationH: function(lineIndex){
			for (var i = 0 ; i < this._annotations.length ; i++){
				if(this._annotations[i][0] === lineIndex)
					return this._annotations[i][1];
			}
			return 0;
		}
		
	};
	
	return GapLineFeeder;
}()); 
