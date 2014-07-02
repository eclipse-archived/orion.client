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

define("orion/editor/stylers/text_x-erlang/syntax", ["orion/editor/stylers/lib/syntax"], function(mLib) { //$NON-NLS-1$ //$NON-NLS-0$
	var keywords = [
		"xor",
		"when",
		"try",
		"rem",
		"receive",
		"query",
		"orelse",
		"or",
		"of",
		"not",
		"let",
		"if",
		"fun",
		"end",
		"div",
		"cond",
		"catch",
		"case",
		"bxor",
		"bsr",
		"bsl",
		"bor",
		"bnot",
		"begin",
		"band",
		"andalso",
		"and",
		"after"
	];

	// For Preprocessors, Records and so on specified with hyphens
	var hyphenStuff = [
		"module",
		"export",
		"import",
		"compile",
		"vsn",
		"on_load",
		"spec",
		"record",
		"include",
		"include_lib",
		"define",
		"file",
		"type",
		"opaque",
		"export_type",
		"undef",
		"ifdef",
		"ifndef",
		"else",
		"endif"
	];

	var grammars = mLib.grammars;
	grammars.push({
		id: "orion.erlang", //$NON-NLS-0$
		contentTypes: ["text/x-erlang"], //$NON-NLS-0$ // Connection to erlangPlugin.js
		patterns: [
			{include: "orion.lib#brace_open"}, //$NON-NLS-0$
			{include: "orion.lib#brace_close"}, //$NON-NLS-0$
			{include: "orion.lib#bracket_open"}, //$NON-NLS-0$
			{include: "orion.lib#bracket_close"}, //$NON-NLS-0$
			{include: "orion.lib#parenthesis_open"}, //$NON-NLS-0$
			{include: "orion.lib#parenthesis_close"}, //$NON-NLS-0$
			{include: "orion.lib#number_decimal"}, //$NON-NLS-0$
			{
				match: "\\b(?:" + keywords.join("|") + ")\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "keyword.control.js" //$NON-NLS-0$
			},
			{
				match: "-\\b(?:" + hyphenStuff.join("|") + ")\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "keyword.control.erlang" //$NON-NLS-0$
			}
		],
		repository: {
			
			comment: {
				match: "%.*", //$NON-NLS-0$
				name: "comment.line.erlang", //$NON-NLS-0$
				patterns: [
					{
						include: "orion.lib#todo_comment_singleLine" //$NON-NLS-0$
					}
				]
			},
			method: {
				match: "[a-zA-Z0-9_.]+(?=\\(|\\s\\()",
			    name: "method.erlang"
			},
			multiLineDoubleQuote: {
				begin: "\"(?:\\\\.|[^\"])*",
				end: "(?:\\\\.|[^\"])*\"",
				name: "string.quoted.double"
			},
		}

	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: keywords
	};
});
