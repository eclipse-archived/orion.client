/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/
 
/*global orion:true*/
var orion = orion || {};
orion.styler = orion.styler || {};
orion.styler.test = orion.styler.test || {};

orion.styler.test.SampleGrammar = {
	"comment": "Dummy grammar for testing",
	"name": "My great language",
	"fileTypes": [ "foo", "bar" ],
	"scopeName": "source.mylang",
	"uuid": "BA5758BD-B671-40BF-F234-22AF369537E8",
	"patterns": [
			{
				"match": "\\b(break|if|continue|do|for|return|switch|throw|while)\\b",
				"name": "keyword.control.mylang"
			},
			{
				"match": "\\b(case|catch|debugger|default|delete|else|finally|function|in|instanceof|new|this|try|typeof|var|void|with)\\b",
				"name": "keyword.other.mylang"
			}, {
				"match": "(')[^'](')",
				"name": "constant.character.mylang",
				"captures": {
					// this is ignored because captures aren't supported
					"1": {
						"name": "punctuation.definition.constant.mylang"
					},
					"2": {
						"name": "punctuation.definition.constant.mylang"
					}
				}
			}, {
				"match": "\\b(?:\\d+)\\b",
				"name": "constant.numeric.mylang"
			}, {
				"match": "(&&|\\|\\|)",
				"name": "keyword.operator.logical.mylang"
			}, {
				"match": "\\b(null|true|false)\\b",
				"name": "constant.language.mylang"
			}, {
				// for testing include
				"include": "#badZ"
			} ],
	"repository": {
		"badZ": {
			"match": "z",
			"name": "invalid.illegal.idontlikez.mylang"
		}
	}
};
