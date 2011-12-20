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

define(['jsdiff/diff'], function() {

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
			var diff = JsDiff.diffLines(oldStr, newStr);
			var map = [];
			var changContents = [];
			var previousDiff = null;
			linesAdded = 0;
			linesRemoved = 0;
			changeIndex = -1;
		    for (var i = 0; i < diff.length; i++) {
		    	var current = diff[i],
		        lines = current.lines || current.value.replace(/\n$/, "").split("\n");
		        current.lines = lines;
		        if(!current.added && !current.removed){
		        	if(linesAdded || linesRemoved){
			        	map.push([linesAdded, linesRemoved, changeIndex]);
						linesAdded = 0;
						linesRemoved = 0;
						changeIndex = -1;
		        	}
		        	map.push([current.lines.length, current.lines.length, 0]);
		        } else if (current.added){
		        	if(changeIndex === -1){
		        		changeIndex = changContents.length +1;
		        	}
		        	linesAdded += current.lines.length;
		        	for(var j = 0; j < current.lines.length ; j++){
		        		changContents.push(current.lines[j]);
		        	}
		        } else {
		        	linesRemoved += current.lines.length;
		        }
		    }
        	if(linesAdded || linesRemoved){
	        	map.push([linesAdded, linesRemoved, changeIndex]);
        	}
        	return {mapper:map, changContents: {array:changContents , index:0}};
		}
	};
	return JSDiffAdapter;
}());

return orion;
});
