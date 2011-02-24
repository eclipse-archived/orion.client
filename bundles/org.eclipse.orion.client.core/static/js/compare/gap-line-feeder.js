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

	function GapLineFeeder(mapper, lineDelimeter) {
		this._mapper = mapper;
		this._lineDelimeter = lineDelimeter;
	}

	GapLineFeeder.prototype = /** @lends eclipse.TextModel.prototype */ {
		generateGapBlocks: function( mapperColumnIndex ){
		    var gapBlocks = [];//Each item represents the start lineIndex and the line number of a gap block , and the string index of the dummyLineArray
		    var gapNumber = 0;
			var curLineindex = 0;//zero based
			var mapperColumnIndexCompare = 1 - mapperColumnIndex;
			for (var i = 0 ; i < this._mapper.length ; i++){
				if(this._mapper[i][mapperColumnIndex] < this._mapper[i][mapperColumnIndexCompare]){
					var gap = this._mapper[i][mapperColumnIndexCompare] - this._mapper[i][mapperColumnIndex];
					gapNumber +=gap;
					gapBlocks.push([curLineindex + this._mapper[i][mapperColumnIndex] , gap , 1]);
				}
				curLineindex += Math.max(this._mapper[i][mapperColumnIndexCompare], this._mapper[i][mapperColumnIndex]);
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
		}
		
	};
	
	return GapLineFeeder;
}()); 
