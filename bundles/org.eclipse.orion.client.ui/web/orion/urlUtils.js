/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window document*/

define(['orion/PageUtil'], function(PageUtil) {
                
    /**
     * Detect if the given text has any URL encloded by "[" and "]". Multiple occurences of the pattern "[url string]" and the non matched part are returned as an array of segments.
     * @param {String} text The given string to detect.
	 * @returns {Array} An array containing all the segments of the given string. Each segment has the following 2 properties:
	 *     segmentStr: String. The string in the segment.
	 *     isValidURL: Boolean. The flag indicating if the segment is a valid URL.
	 */
	function detectValidURL(text) {
		var regex = /\[([^\]]+)\]/g;
		var match = regex.exec(text), matches=[], lastNonMatchIndex=0;
		while (match) {
			//match[0]: the string enclosed by "[" and "]"
			//match[1]: the string inside the pair of "[" and "]"
			if(match.length === 2 && match[1].length >= 0){
				if(PageUtil.validateURLScheme(match[1])) { //Check if it is a valid URL
					if(match.index > lastNonMatchIndex) { //We have to push a plain text segment first
						matches.push({segmentStr: text.substring(lastNonMatchIndex, match.index), isValidURL: false});
					}
					matches.push({segmentStr: match[1], isValidURL: true});
					lastNonMatchIndex = match.index + match[0].length;
				}
			}
			match = regex.exec(text);
		}
		if(lastNonMatchIndex === 0) {
			return null;
		} else if( lastNonMatchIndex < (text.length - 1) ) {
			matches.push({segmentStr: text.substring(lastNonMatchIndex), isValidURL: false});
		}
		return matches;
	}
	
    /**
     * Render an array of string segments.
     * @param {dom node} parentNode The given parent dom node where the segements will be rendered.
     * @param {Array} segements The given array containing all the segments. Each segment has the following 2 properties:
	 *     segmentStr: String. The string in the segment.
	 *     isValidURL: Boolean. The flag indicating if the segment is a valid URL.
	 */
	function rendeStrSegments(parentNode, segments) {
		segments.forEach(function(segment) {
			if(segment.isValidURL){
				var link = document.createElement('a');
		        link.href = segment.segmentStr;
		        link.appendChild(document.createTextNode(segment.segmentStr));
				parentNode.appendChild(link);
			} else {
				var plainText = document.createElement("span");
				plainText.textContent = segment.segmentStr;
				parentNode.appendChild(plainText);
			}
		});
	}
	
	//return module exports
	return {
		detectValidURL: detectValidURL,
		rendeStrSegments: rendeStrSegments
	};
});
