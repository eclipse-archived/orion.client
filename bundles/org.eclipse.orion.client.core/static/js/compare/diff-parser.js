/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
var eclipse = eclipse || {};
eclipse.DiffParser = (function() {
	function DiffParser(options) {
		//this._init();
	}
	DiffParser.prototype = {
		_init: function(){
			//Input 
			this._oFileContents = [];
			this._diffContents = [];
			
			//All the middle result when computing 
			this._oBlocks = [];//each item inside new block will be formatted as [startAtLine , linesInBlock]
			this._nBlocks = [];//each item inside new block will be formatted as [startAtLine , linesInBlock , indexInDiffLines]
			this._hunkRanges = [];
			this._lastToken = " ";
			
			//Final result as out put
			this._deltaMap = [];
			this._nFileContents = [];
		},
		
		parseAllLines: function(oFileString , diffString){
			this._init();
			this._oFileContents = oFileString.split('\n');
			this._diffContents = diffString.split('\n');
			var lineNumber = this._diffContents.length;
			this._hunkRanges = [];
			for(var i = 0; i <lineNumber ; i++){
				  var hunkRange = this._parseHunkRange(i);
				  if(hunkRange)
					  this._hunkRanges.push(hunkRange); 
			}
			//console.log(JSON.stringify(this._hunkRanges));
			for(var j = 0; j <this._hunkRanges.length ; j++){
				this._parsehunkBlock(j);
			}
			//console.log(JSON.stringify(this._oBlocks));
			//console.log(JSON.stringify(this._nBlocks));
			this._buildMap();
			this._logMap();
			console.log("Total line number in original file: " + this._oFileContents.length);
			this._buildNewFile();
			this._logNewFile();
			console.log("Total line number in new file: " + this._nFileContents.length);
		},
		
		_logMap: function(){
			for(var i = 0;i < this._deltaMap.length ; i++){
				console.log(JSON.stringify(this._deltaMap[i]));
				if(this._deltaMap[i][2] > 0){
					for(var j = 0;j < this._deltaMap[i][0] ; j++){
						console.log(this._diffContents[this._deltaMap[i][2]+j-1]);
					}
				}
			}
		},
		
		_logNewFile: function(){
			for(var i = 0;i < this._nFileContents.length ; i++){
				console.log(this._nFileContents[i]);
			}
		},
		
		_createBlock: function(token , blocks , startAtLine , endAtLine){
			if(endAtLine === startAtLine && token === " ")
				return;
			var block = [startAtLine , endAtLine - startAtLine ,"s" ];
			if(token === "-"){
				block[2] = "r";
			} else if(token === "+"){
				block[2] = "a";
			} else if(token === "c"){
				block[2] = "c";
			}
			blocks.push(block);
		},
		
		_createMinusBlock: function(oBlkStart , nBlkStart , oBlockLength){
			var len = this._oBlocks.length;
			if(len === 0 || oBlkStart !== this._oBlocks[len-1][0]){
				this._oBlocks.push([oBlkStart , oBlockLength]);
				this._nBlocks.push([nBlkStart , 0 , -2]);
			} else {
				this._oBlocks[len-1][1] = this._oBlocks[len-1][1] + oBlockLength;
			}
		},
		
		_createPlusBlock: function(oBlkStart , nBlkStart , nBlockLength , lastPlusPos ){
			var len = this._nBlocks.length;
			if(len === 0 || nBlkStart !== this._nBlocks[len-1][0]){
				this._oBlocks.push([oBlkStart , 0]);
				this._nBlocks.push([nBlkStart , nBlockLength , lastPlusPos]);
			} else {
				this._nBlocks[len-1][1] = this._nBlocks[len-1][1] + nBlockLength;
				this._nBlocks[len-1][2] = lastPlusPos;
			}
		},
		
		//read line by line in a hunk range
		_parsehunkBlock: function(hunkRangeNo ){
			var lastToken = " ";
			var startNo = this._hunkRanges[hunkRangeNo][0] + 1;
			var endNo = (hunkRangeNo === (this._hunkRanges.length - 1) ) ? this._diffContents.length : this._hunkRanges[hunkRangeNo+1][0];
			
			var oCursor = 0;
			var nCursor = 0;
			var oBlkStart = this._hunkRanges[hunkRangeNo][1];
			var nBlkStart = this._hunkRanges[hunkRangeNo][3];
			var lastPlusPos = startNo;
			for (var i = startNo ; i< endNo ; i++){
				var curToken = this._diffContents[i][0];
				if(lastToken !== curToken){
					if(curToken === "+")
						lastPlusPos = i;
					switch(lastToken){
					case " ":
						oBlkStart = this._hunkRanges[hunkRangeNo][1] + oCursor;
						nBlkStart = this._hunkRanges[hunkRangeNo][3] + nCursor;
						break;
					case "-":
						this._createMinusBlock(oBlkStart , nBlkStart ,this._hunkRanges[hunkRangeNo][1] + oCursor - oBlkStart);
						break;
					case "+":
						this._createPlusBlock(oBlkStart , nBlkStart ,this._hunkRanges[hunkRangeNo][3] + nCursor - nBlkStart , lastPlusPos);
						break;
					default:
					}
					lastToken = curToken;
				}
				switch(curToken){
				case "-":
					oCursor++;
					break;
				case "+":
					nCursor++;
					break;
				default:
					oCursor++;
					nCursor++;
				}
			}
		},
		
		_buildMap: function(){
			var  blockLen = this._oBlocks.length;
			var oFileLen = this._oFileContents.length;
			var lastSamePos = 1;
			for(var i = 0 ; i < blockLen ; i++){
				var delta =  this._oBlocks[i][0] - lastSamePos;
				//Create the "same on both" delta 
				if(delta > 0){
					this._deltaMap.push([delta , delta , 0]);
				}
				this._deltaMap.push([this._nBlocks[i][1] , this._oBlocks[i][1] , this._nBlocks[i][2]+1]);
				lastSamePos = this._oBlocks[i][0] + this._oBlocks[i][1];
			}
			if(0 < (oFileLen - lastSamePos)){
				this._deltaMap.push([oFileLen - lastSamePos+1 , oFileLen - lastSamePos+1 , 0]);
			}
		},
		
		_buildNewFile: function(){
			var oFileCursor = 1;
			for(var i = 0;i < this._deltaMap.length ; i++){
				if(this._deltaMap[i][2] === 0){
					for(var j = 0;j < this._deltaMap[i][0] ; j++){
						this._nFileContents.push(this._oFileContents[oFileCursor+j-1]);
					}
				} else if(this._deltaMap[i][2] > 0){
					for(var j = 0;j < this._deltaMap[i][0] ; j++){
						this._nFileContents.push(this._diffContents[this._deltaMap[i][2]+j-1].substring(1));
					}
				}
				oFileCursor = oFileCursor + this._deltaMap[i][1];
			}
		},
		
		//In many versions of GNU diff, each range can omit the comma and trailing value s, in which case s defaults to 1. 
		_parseHRangeBody: function(body , retVal){
			if(0 < body.indexOf(",")){
				var splitted = body.split(",");
				retVal.push(parseInt(splitted[0]));
				retVal.push(parseInt(splitted[1]));
			} else {
				retVal.push(parseInt(body));
				retVal.push(1);
			}
		},
		
		//The hunk range information contains two hunk ranges. 
		//The range for the hunk of the original file is preceded by a minus symbol, and the range for the new file is preceded by a plus symbol. 
		//Each hunk range is of the format l,s where l is the starting line number and s is the number of lines the change hunk applies to for each respective file. 
		//In many versions of GNU diff, each range can omit the comma and trailing value s, in which case s defaults to 1. 
		//Note that the only really interesting value is the l line number of the first range; all the other values can be computed from the diff.	
		/*
		 * return value :
		 * [lineNumberInDiff , OriginalL , OriginalS , NewL ,NewS] , no matter "-l,s +l,s" or "+l,s -l,s"
		 */
		_parseHunkRange: function(lineNumber){
			var oneLine = this._diffContents[lineNumber];
			if(12 > oneLine.length )
				return undefined;//to be qualified as a hunkSign line , the line has to match the @@-l,s+l,s@@ pattern
			var subStr = oneLine.substring(0,2);
			if("@@" !== subStr)
				return undefined;//to be qualified as a hunkSign line , the line has to start with "@@"
			var subLine = oneLine.substring(2);
			var secondIndex = subLine.indexOf("@@");
			if(secondIndex < 0)
				return undefined;//to be qualified as a hunkSign line , the line has to have the second "@@"
			var hunkSignBody = subLine.substring(0 , secondIndex);
			
			var minusIndex = hunkSignBody.indexOf("-");
			var plusIndex = hunkSignBody.indexOf("+");
			if( minusIndex < 0 || plusIndex < 0)
					return undefined;
			var retVal = [lineNumber];
			if(minusIndex < plusIndex){
				var splitted = hunkSignBody.substring(minusIndex+1).split("+");
				this._parseHRangeBody(splitted[0] , retVal);
				this._parseHRangeBody(splitted[1] , retVal);
			} else {
				splitted = hunkSignBody.substring(plusIndex+1).split("-");
				this._parseHRangeBody(splitted[1] , retVal);
				this._parseHRangeBody(splitted[0] , retVal);
			}
			return retVal;
		}
	
	};
	return DiffParser;
}());
