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

/*eslint-env browser, amd*/
define("orion/editor/stylers/text_x-scss/syntax", ["orion/editor/stylers/text_css/syntax", "orion/editor/stylers/lib/syntax"], function(mCSS, mLib) {
//	var functionNames = [
//		"abs", "adjust-color", "adjust-hue", "alpha", "append",
//		"blue",
//		"call", "ceil", "change-color", "comparable", "complement",
//		"darken", "desaturate",
//		"fade-in", "fade-out", "feature-exists", "floor", "function-exists",
//		"global-variable-exists", "grayscale", "green",
//		"hsl", "hsla", "hue",
//		"ie-hex-str", "if", "index", "inspect", "invert", "is-superselector",
//		"join",
//		"keywords",
//		"length", "lighten", "lightness", "list-separator",
//		"map-get", "map-has-key", "map-keys", "map-merge", "map-remove", "map-values", "max", "min", "mixin-exists", "mix",
//		"nth",
//		"opacify", "opacity",
//		"percentage",
//		"quote",
//		"random", "red", "rgba", "rgb", "round",
//		"saturate", "saturation", "scale-color", "selector-append", "selector-extend", "selector-nest", "selector-parse",
//		"selector-replace", "selector-unify", "set-nth", "simple-selectors", "str-index", "str-insert", "str-length", "str-slice",
//		"to-lower-case", "to-upper-case", "transparentize", "type-of",
//		"unique-id", "unitless", "unit", "unquote",
//		"variable-exists",
//		"zip"
//	];
	var flags = [
		"default", "global", "optional"
	];
	var constants = [
		"false", "null", "true"
	];
	var directives = [
		"at-root",
		"content",
		"debug",
		"each", "else", "error", "extend",
		"for", "function",
		"if", "include",
		"mixin",
		"return",
		"warn", "while"
	];

	var grammars = [];
	grammars.push.apply(grammars, mCSS.grammars);
	grammars.push.apply(grammars, mLib.grammars);
	grammars.push({
		id: "orion.scss",
		contentTypes: ["text/x-scss"],
		patterns: [
			{include: "orion.css#string_single_multiline"},
			{include: "orion.css#string_double_multiline"},
			{include: "orion.lib#string_doubleQuote"},
			{include: "orion.lib#string_singleQuote"},
			{include: "orion.c-like#comment_block"},
			{include: "#eachin"},
			{include: "#forto"},
			{include: "orion.c-like#comment_singleLine"},
			{include: "#variable"},
			{include: "#placeholder"},
			{include: "#flag"},
			{include: "#directive"},
			{include: "orion.css#directive"},
			{include: "#constant"},
			{include: "#interpolated"},
			{include: "#operator"},
			{include: "orion.lib#brace_open"},
			{include: "orion.lib#brace_close"},
			{include: "orion.lib#bracket_open"},
			{include: "orion.lib#bracket_close"},
			{include: "orion.lib#parenthesis_open"},
			{include: "orion.lib#parenthesis_close"},
			{include: "orion.lib#number_decimal"},
			{include: "orion.css#number_hex"},
			{include: "orion.css#numeric_value"},
			{include: "orion.css#color"},
			{include: "orion.css#keyword"}
		],
		repository: {
			constant: {
				match: "\\b(?:" + constants.join("|") + ")\\b",
				name: "constant.language.scss"
			},
			directive: {
				match: "(^|\\s)(@("  + directives.join("|") + "))\\b",
				captures: {
					2: {name: "keyword.other.directive.scss"}
				}
			},
			eachin: {
				begin: "@each\\s",
				end: "\\sin\\b",
				captures: {
					0: {name: "keyword.other.directive.scss"},
				},
				patterns: [
					{include: "#variable"}
				]
			},
			flag: {
				match: "(^|\\s)(!("  + flags.join("|") + "))\\b",
				captures: {
					2: {name: "keyword.other.flag.scss"}
				}
			},
			forto: {
				begin: "@for\\s",
				end: "(^|\\s)(t(o|hrough))(\\s|$)",
				beginCaptures: {
					0: {name: "keyword.other.directive.scss"},
				},
				endCaptures: {
					2: {name: "keyword.other.directive.scss"}
				},
				patterns: [
					{include: "#variable"},
					{include: "orion.lib#number_decimal"},
					{
						match: "(^|\\s)(from)(\\s|$)",
						name: "keyword.other.directive.scss"
					}
				]
			},
			interpolated: {
				match: "#\\{[^}]*\\}",
				name: "string.interpolated.scss"
			},
			operator: {
				match: "\\+|\\*|\\/|%|==?|!=|&|<=?|=?>|!",
				name: "punctuation.operator.scss"
			},
			placeholder: {
				match: "%[\\w-]+",
				name: "variable.other.placeholder.sas"
			},
			variable: {
				match: "\\$[\\w-]+(\\.{3})?",
				name: "variable.other.scss"
			}
		}
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: directives.concat(flags)
	};
});
