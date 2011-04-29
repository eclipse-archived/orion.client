/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint */
/*global dojo orion:true*/

var orion = orion || {};

orion.syntax = orion.syntax || {};

/**
 * Gives the syntax rules for highlighting HTML.
 */
orion.syntax.HtmlSyntaxHighlightProvider = (function() {
	/** @private */
	function HtmlSyntaxHighlightProvider() {
	}
	HtmlSyntaxHighlightProvider.prototype = /** @lends orion.syntax.HtmlSyntaxHighlightProvider.prototype */ {
		grammar: {
			"comment": "HTML syntax rules",
			"name": "HTML",
			"fileTypes": [ "html", "htm" ],
			"scopeName": "source.html",
			"uuid": "3B5C76FB-EBB5-D930-F40C-047D082CE99B",
			"patterns": [
				// TODO unicode?
				{ // startDelimiter + tagName + endDelimiter
					"match": "<[A-Za-z0-9_\\-:]+ ?",
					"name": "entity.name.tag.html"
				},
				{
					"match": "<!--|-->",
					"name": "punctuation.definition.comment.html"
				},
				{ // attribute name
					"match": "[A-Za-z\\-:]+(?=\\s*=\\s*['\"])",
					"name": "entity.other.attribute.name.html"
				},
				{ // double quoted string
					"match": "(\")[^\"]+(\")",
					"name": "string.quoted.double.html"
				},
				{ // single quoted string
					"match": "(')[^']+(\')",
					"name": "string.quoted.single.html"
				},
				// TODO need a way to return to "inside-tag" state here
				{ // startDelimiter + slash + tagName + endDelimiter
					"match": "</[A-Za-z0-9_\\-:]+>",
					"name": "entity.name.tag.html"
				},
				{ // end delimiter of open tag
					"match": ">", 
					"name": "entity.name.tag.html"
				} ],
			"repository": {
//				"insideTag": {
//					
//				}
			}
		}
	};
	return HtmlSyntaxHighlightProvider;
}());