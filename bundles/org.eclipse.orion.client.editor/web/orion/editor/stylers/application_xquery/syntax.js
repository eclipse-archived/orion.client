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
define("orion/editor/stylers/application_xquery/syntax", ["orion/editor/stylers/lib/syntax"], function(mLib) { //$NON-NLS-1$ //$NON-NLS-0$
	var keywords = [
		"xquery",
		"zero-digit",
		"window",
		"where",
		"when",
		"version",
		"variable",
		"validate",
		"unordered",
		"union",
		"typeswitch",
		"type",
		"tumbling",
		"try",
		"treat",
		"to",
		"then",
		"text",
		"switch",
		"strip",
		"strict",
		"start",
		"stable",
		"some",
		"sliding",
		"self",
		"schema-element",
		"schema-attribute",
		"schema",
		"satisfies",
		"return",
		"processing-instruction",
		"previous",
		"preserve",
		"preceding-sibling",
		"preceding",
		"percent",
		"per-mille",
		"pattern-separator",
		"parent",
		"ordering",
		"order",
		"or",
		"option",
		"only",
		"of",
		"node",
		"no-preserve",
		"no-inherit",
		"next",
		"ne",
		"NaN",
		"namespace-node",
		"namespace",
		"module",
		"mod",
		"minus-sign",
		"lt",
		"let",
		"least",
		"le",
		"lax",
		"item",
		"is",
		"intersect",
		"instance",
		"inherit",
		"infinity",
		"in",
		"import",
		"if",
		"idiv",
		"gt",
		"grouping-separator",
		"group",
		"greatest",
		"ge",
		"function",
		"for",
		"following-sibling",
		"following",
		"external",
		"except",
		"every",
		"eq",
		"end",
		"encoding",
		"empty-sequence",
		"empty",
		"else",
		"element",
		"document-node",
		"div",
		"digit",
		"descending",
		"descendant-or-self",
		"descendant",
		"default",
		"declare",
		"decimal-separator",
		"decimal-format",
		"count",
		"copy-namespaces",
		"context",
		"construction",
		"comment",
		"collation",
		"child",
		"catch",
		"castable",
		"cast",
		"case",
		"by",
		"boundary-space",
		"base-uri",
		"attribute",
		"at",
		"ascending",
		"as",
		"and",
		"ancestor-or-self",
		"ancestor",
		"allowing"
	];

	var grammars = mLib.grammars;
	grammars.push({
		id: "orion.xquery", //$NON-NLS-0$
		contentTypes: ["application/xquery"], //$NON-NLS-0$ // Connection to xqueryPlugin.js
		patterns: [
			{include: "#comment"},
			{include: "#variable"},
			{include: "#multiLineDoubleQuote"}, 
			{include: "#multiLineSingleQuote"}, 
			{include: "orion.xml#tag"}, 
			{include: "orion.lib#string_doubleQuote"}, //$NON-NLS-0$
			{include: "orion.lib#string_singleQuote"}, //$NON-NLS-0$
			{include: "orion.lib#brace_open"}, //$NON-NLS-0$
			{include: "orion.lib#brace_close"}, //$NON-NLS-0$
			{include: "orion.lib#bracket_open"}, //$NON-NLS-0$
			{include: "orion.lib#bracket_close"}, //$NON-NLS-0$
			{include: "orion.lib#parenthesis_open"}, //$NON-NLS-0$
			{include: "orion.lib#parenthesis_close"}, //$NON-NLS-0$
			{
				match: "\\b(?:" + keywords.join("|") + ")\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "keyword.control.js" //$NON-NLS-0$
			}
		],
		repository: {
			
			comment: {
				begin: "\\(:", //$NON-NLS-0$
				end: ":\\)", //$NON-NLS-0$ 
				name: "comment.block.xquery", //$NON-NLS-0$
				patterns: [
					{
						match: "(\\b)(TODO)(\\b)(((?!:\\)).)*)", //$NON-NLS-0$ // match: "(\\b)(TODO)(\\b)(((?!-->).)*)", //$NON-NLS-0$
						name: "meta.annotation.task.todo", //$NON-NLS-0$
						captures: {
							2: {name: "keyword.other.documentation.task"}, //$NON-NLS-0$
							4: {name: "comment.block"} //$NON-NLS-0$
						}
					}
				]
			},
			variable: {
				match: "\\$[a-zA-z0-9_]+",
				name: "variable.other.xquery" 
			},
			multiLineDoubleQuote: {
				begin: "\"",
				end: "\"",
				name: "string.quoted.double"
			},
			multiLineSingleQuote: {
				begin: "\'",
				end: "\'",
				name: "string.quoted.single"
			}
		}

	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: keywords
	};
});
