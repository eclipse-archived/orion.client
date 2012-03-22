/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

define(['jsdiff/diff'], function(JsDiff) {

var orion = orion || {};


orion.JSDiffAdapter = (function() {
	/**
	 * JSDiffAdapter is an adapter to convert jsdiff diff blocks into a list of mappers that is used in the Orion compare widget.
	 * 
	 * @name orion.JSDiffAdapter
	 * 
	 */
	function JSDiffAdapter() {
	}
	JSDiffAdapter.prototype = {
		adapt: function(oldStr, newStr){
			var splitOld = oldStr.split("\n");
			var splitNew = newStr.split("\n");
			var newLineAtEndOld = (splitOld[splitOld.length-1] === "");
			var newLineAtEndNew = (splitNew[splitNew.length-1] === "");
			
			var diff = JsDiff.diffLines(oldStr, newStr);
			var map = [];
			var changContents = [];
			var linesAdded = 0;
			var linesRemoved = 0;
			var changeIndex = -1;
			var oFileLineCounter = 0;
			var previousDelim = true;
		    for (var i = 0; i < diff.length; i++) {
		    	var current = diff[i];
		        //var lines = current.lines || current.value.replace(/\n$/, "").split("\n");
		        var lines = current.lines || current.value.split("\n");
		        var currentLineNumber = lines.length;
		        var startNumber = 0;
		        if(lines.length > 1 && lines[lines.length-1] === ""){
		        	currentLineNumber--;
		        }
		        if(currentLineNumber > 1 && !previousDelim){
		        	if(lines[0] === ""){
		        		currentLineNumber--;
		        		startNumber++;
		        	}
		        }
		        current.lines = lines;
		        if(!current.added && !current.removed){
		        	if(linesAdded || linesRemoved){
			        	map.push([linesAdded, linesRemoved, changeIndex]);
						linesAdded = 0;
						linesRemoved = 0;
						changeIndex = -1;
						oFileLineCounter += linesRemoved;
		        	}
		        	map.push([currentLineNumber, currentLineNumber, 0]);
					oFileLineCounter += currentLineNumber;
		        } else if (current.added){
		        	if(changeIndex === -1){
		        		changeIndex = changContents.length +1;
		        	}
		        	linesAdded += currentLineNumber;
		        	for(var j = startNumber; j < (currentLineNumber + startNumber) ; j++){
		        		changContents.push(current.lines[j]);
		        	}
		        } else {
		        	linesRemoved += currentLineNumber;
		        }
		        previousDelim = false;
		        if(lines.length > 1 && lines[lines.length-1] === ""){
			        previousDelim = true;
		        }
		    }
        	if(linesAdded || linesRemoved){
	        	map.push([linesAdded, linesRemoved, changeIndex]);
				oFileLineCounter += linesRemoved;
        	}
        	
        	if(oFileLineCounter < splitOld.length && splitOld.length > 1){
				var lastMapItem = map[map.length-1];
				if(lastMapItem[2] === 0){
					lastMapItem[0] += 1;
					lastMapItem[1] += 1;
				} else if (lastMapItem[2] === -1){
					map.push([1 , 1 , 0]);
				} else if(newLineAtEndOld === newLineAtEndNew){
					map.push([1 , 1 , 0]);
				} else {
					if(newLineAtEndNew)
						lastMapItem[0] += 1;
					if(newLineAtEndOld )
						lastMapItem[1] += 1;
				}
        	}
       	
         	return {mapper:map, changContents: {array:changContents , index:0}};
		},
		
		adaptCharDiff : function(oldStr, newStr) {
			var diff = JsDiff.diffChars(oldStr, newStr);
			var map = [];
			var oldStart = 0;
			var newStart = 0;
			var charsAdded = 0;
			var charsRemoved = 0;
			for ( var i = 0; i < diff.length; i++) {
				var current = diff[i];
				if (!current.added && !current.removed) {
					if (charsAdded > 0 || charsRemoved > 0) {
						map
								.push([ newStart,
										newStart + charsAdded,
										oldStart,
										oldStart + charsRemoved ]);
						newStart += charsAdded;
						oldStart += charsRemoved;
						charsAdded = 0;
						charsRemoved = 0;
					}
					newStart += current.value.length;
					oldStart += current.value.length;
				} else if (current.added) {
					charsAdded += current.value.length;
				} else {
					charsRemoved += current.value.length;
				}
			}
			if (charsAdded > 0 || charsRemoved > 0) {
				map.push([ newStart, newStart + charsAdded,
						oldStart, oldStart + charsRemoved ]);
			}
			return map;
		}
	};
	return JSDiffAdapter;
}());

return orion;
});
