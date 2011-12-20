/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define */

/**
 * @name orion.contentAssist.HTMLContentAssistProvider
 * @class Provides content assist for HTML.
 */
function HTMLContentAssistProvider() {
}
HTMLContentAssistProvider.prototype = /** @lends orion.contentAssist.HTMLContentAssistProvider.prototype */ {

	/**
	 * Returns a string of all the whitespace at the start of the current line.
	 * @param {String} buffer The document
	 * @param {Object} selection The current selection
	 * @param {Integer} selection.offset The current selection offset
	 */
	leadingWhitespace: function(buffer, selection) {
		var whitespace = "";
		var offset = selection.offset-1;
		while (offset > 0) {
			var c = buffer.charAt(offset--);
			if (c === '\n' || c === '\r') {
				//we hit the start of the line so we are done
				break;
			}
			if (/\s/.test(c)) {
				//we found whitespace to add it to our result
				whitespace = c.concat(whitespace);
			} else {
				//we found non-whitespace, so reset our result
				whitespace = "";
			}

		}
		return whitespace;
	},
	getKeywords: function(prefix, buffer, selection) {
		var proposals = [];
		//template - simple html document
		if (buffer.length === 0) {
			var text = "<!DOCTYPE html>\n" +
				"<html lang=\"en\">\n" +
				"\t<head>\n" +
				"\t\t<meta charset=utf-8>\n" +
				"\t\t<title>My Document</title>\n" +
				"\t</head>\n" +
				"\t<body>\n" +
				"\t\t<h1>A basic HTML document</h1>\n" +
				"\t\t<p>\n" +
				"\t\t\t\n" + //cursor goes here
				"\t\t</p>\n" +
				"\t</body>\n" +
				"</html>";
			proposals.push({proposal: text, description: "Simple HTML document", escapePosition: selection.offset+152});
			return proposals;
		}

		//only offer HTML element proposals if the character preceeding the prefix is the start of an HTML element
		var preceedingChar = buffer.charAt(selection.offset-prefix.length-1);
		if (preceedingChar !== '<') {
			return proposals;
		}
		
		//elements that are typically placed on a single line (e.g., <b>, <h1>, etc)
		var element, proposalText, exitOffset;
		var singleLineElements = ["abbr","b","button","canvas","cite","command","dd","del","dfn","dt","em","embed",
			"font","h1","h2","h3","h4","h5","h6","i","ins","kbd","label","li","mark","meter","object","option","output",
			"progress","q","rp","rt","samp","small","strong","sub","sup","td","time","title","tt","u","var"];
		for (var i = 0; i < singleLineElements.length; i++) {
			element = singleLineElements[i];
			if (element.indexOf(prefix) === 0) {
				proposalText = element + "></" + element + ">";
				//exit position is the end of the opening element tag, so we need to substract the prefix already typed
				exitOffset = selection.offset+element.length-prefix.length+1;
				proposals.push({proposal: proposalText, description: "<" + proposalText, escapePosition: exitOffset});
			}
		}
		
		//elements that typically start a block spanning multiple lines (e.g., <p>, <div>, etc)
		var multiLineElements = ["address","article","aside","audio","bdo","blockquote","body","caption","code",
			"colgroup","datalist","details","div","dl","fieldset","figure","footer","form","head","header",
			"hgroup","iframe","legend","map","menu","nav","noframes","noscript","ol","optgroup","p","pre",
			"ruby","script","section","select","span","style","table","tbody","textarea","tfoot","th","thead",
			"tr","ul","video"];
		var whitespace = this.leadingWhitespace(buffer, selection);
		for (i = 0; i < multiLineElements.length; i++) {
			element = multiLineElements[i];
			if (element.indexOf(prefix) === 0) {
				proposalText = element + ">\n" + whitespace + "\t\n" + whitespace + "</" + element + ">";
				//exit position is the end of the opening element tag, so we need to substract the prefix already typed
				exitOffset = selection.offset+element.length-prefix.length + whitespace.length + 3;
				proposals.push({proposal: proposalText, description: "<" + proposalText, escapePosition: exitOffset});
			}
		}

		//elements with no closing element (e.g., <hr>, <br>, etc)
		var emptyElements = ["area","base","br","col","hr","input","link","meta","param","keygen","source"];
		for (i = 0; i < emptyElements.length; i++) {
			element = emptyElements[i];
			if (element.indexOf(prefix) === 0) {
				proposalText = element + "/>";
				//exit position is the end of the element, so we need to substract the prefix already typed
				exitOffset = selection.offset+element.length-prefix.length+2;
				proposals.push({proposal: proposalText, description: "<" + proposalText, escapePosition: exitOffset});
			}
		}
		
		//deluxe handling for very common elements
		//image
		if ("img".indexOf(prefix) === 0) {
			proposalText = "img src=\"\" alt=\"Image\"/>";
			proposals.push({proposal: proposalText, description: "<" + proposalText, escapePosition: selection.offset+9-prefix.length});
		}
		//anchor
		if (prefix === 'a') {
			proposals.push({proposal: "a href=\"\"></a>", description: "<a></a> - HTML anchor element", escapePosition: selection.offset+7});
		}

		return proposals;
	}
};
