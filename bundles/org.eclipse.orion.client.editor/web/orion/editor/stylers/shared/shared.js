/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define*/

define("orion/editor/stylers/shared/shared", [], function() { //$NON-NLS-0$
	return {
		grammars: [{
			id: "orion.patterns",
			patterns: [
				{
					id: "brace_open",
					match: "{",
					name: "punctuation.section.block.begin"
				}, {
					id: "brace_close",
					match: "}",
					name: "punctuation.section.block.end"
				}, {
					id: "bracket_open",
					match: "\\[",
					name: "punctuation.section.bracket.begin"
				}, {
					id: "bracket_close",
					match: "\\]",
					name: "punctuation.section.bracket.end"
				}, {
					id: "parenthesis_open",
					match: "\\(",
					name: "punctuation.section.parens.begin"
				}, {
					id: "parenthesis_close",
					match: "\\)",
					name: "punctuation.section.parens.end"
				}, {
					id: "comment_singleline",
					begin: "//",
					end: ".*",
					name: "comment.line",
					patterns: [
						{
							match: "(\\b)(TODO)(\\s|$)(.*)",
							name: "meta.annotation.task.todo",
							captures: {
								2: {name: "keyword.other.documentation.task"},
								4: {name: "comment.line"}
							}
						}
					]
				}, {
					id: "comment_multiline",
					begin: "/\\*",
					end: "(?:\\*/|$)",
					name: "comment.block",
					patterns: [
						{
							match: "@\\S*",
							name: "keyword.other.documentation.tag"
						}, {
							match: "\\<\\S*\\>?",
							name: "keyword.other.documentation.markup"
						}, {
							match: "(\\b)(TODO)(\\s|$)(.*)",
							name: "meta.annotation.task.todo",
							captures: {
								2: {name: "keyword.other.documentation.task"},
								4: {name: "comment.block"}
							}
						}
					]
				}, {
					id: "string_singleline",
					match: "\"(?:\\\\.|[^\"])*(?:\"|$)",
					name: "string.quoted.double"
				}, {
					id: "string_singleQuote",
					match: "'(?:\\\\.|[^'])*(?:'|$)",
					name: "string.quoted.single"
				}, {
					id: "number_decimal",
					match: "\\b-?(?:\\.\\d+|\\d+\\.?\\d*)(?:[eE][+-]?\\d+)?\\b",
					name: "constant.numeric"
				}, {
					id: "number_hex",
					match: "\\b0x[0-9A-Fa-f]+\\b",
					name: "constant.numeric"
				}
			]
		}],
		keywords: []
	}
});
