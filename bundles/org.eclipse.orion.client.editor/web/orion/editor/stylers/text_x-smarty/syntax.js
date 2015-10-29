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

define("orion/editor/stylers/text_x-smarty/syntax", ["orion/editor/stylers/lib/syntax", "orion/editor/stylers/text_html/syntax", "orion/editor/stylers/text_x-php/syntax"], //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	function(mLib, mHTML, mPHP) {

	var constants = [
		"false", "no", "off", "on", "true", "yes"   //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	];

	/* these can be redefined in the file, this is not currently handled */
	var DELIMITER_OPEN = "{"; //$NON-NLS-0$
	var DELIMITER_CLOSE = "}"; //$NON-NLS-0$
	
	var grammars = [];
	grammars.push.apply(grammars, mLib.grammars);
	grammars.push.apply(grammars, mHTML.grammars);
	grammars.push.apply(grammars, mPHP.grammars);
	grammars.push({
		id: "orion.smarty", //$NON-NLS-0$
		contentTypes: ["text/x-smarty"], //$NON-NLS-0$
		patterns: [
			{include: "orion.html"}, //$NON-NLS-0$
			{include: "#smartyCommentBlock"}, //$NON-NLS-0$
			{include: "#literalBlock"}, //$NON-NLS-0$
			{include: "#phpBlock"}, //$NON-NLS-0$
			{include: "#smartyBlock"} //$NON-NLS-0$
		],
		repository: {
			literalBlock: {
				begin: "({)literal(})", //$NON-NLS-0$
				end: "({)/literal(})", //$NON-NLS-0$
				captures: {
					1: "punctuation.brace.begin.smarty", //$NON-NLS-0$
					2: "punctuation.brace.end.smarty" //$NON-NLS-0$
				}
			},
			phpBlock: {
				begin: "({)php(})", //$NON-NLS-0$
				end: "({)/php(})", //$NON-NLS-0$
				captures: {
					1: "punctuation.brace.begin.smarty", //$NON-NLS-0$
					2: "punctuation.brace.end.smarty" //$NON-NLS-0$
				},
				patterns: [
					{include: "orion.php-core"} //$NON-NLS-0$
				]
			},
			smartyBlock: {
				begin: "(" + DELIMITER_OPEN + ")", //$NON-NLS-1$ //$NON-NLS-0$
				end: "(" + DELIMITER_CLOSE + ")", //$NON-NLS-1$ //$NON-NLS-0$
				captures: {
					1: "punctuation.brace.begin.smarty", //$NON-NLS-0$
					2: "punctuation.brace.end.smarty" //$NON-NLS-0$
				},
				patterns: [
					{include: "orion.lib#string_singleQuote"}, //$NON-NLS-0$
					{include: "#smartyString_doubleQuote"}, //$NON-NLS-0$
					{include: "#smartyVariable"}, //$NON-NLS-0$
					{include: "#smartyConfigVariable"}, //$NON-NLS-0$
					{include: "#smartyConstant"}, //$NON-NLS-0$
					{include: "orion.lib#number_decimal"}, //$NON-NLS-0$
				]
			},
			smartyCommentBlock: {
				begin: {match: DELIMITER_OPEN + "\\*", literal: DELIMITER_OPEN + "*"}, //$NON-NLS-1$ //$NON-NLS-0$
				end: {match: "\\*" + DELIMITER_CLOSE, literal: "*" + DELIMITER_CLOSE}, //$NON-NLS-1$ //$NON-NLS-0$
				name: "comment.block.smarty", //$NON-NLS-0$
			},
			smartyConfigVariable: {
				match: "#\\w+#", //$NON-NLS-0$
				name: "variable.other.config.smarty", //$NON-NLS-0$
			},
			smartyConstant: {
				match: "\\b(?:" + constants.join("|") + ")\\b", //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				name: "constant.language.smarty" //$NON-NLS-0$
			},
			smartyEscapedVariable: {
				match: "`\\$[^`]+`", //$NON-NLS-0$
				name: "variable.other.escaped.smarty", //$NON-NLS-0$
			},
			smartyString_doubleQuote: {
				begin: '"', //$NON-NLS-0$
				end: '"', //$NON-NLS-0$
				name: "string.quoted.double.smarty", //$NON-NLS-0$
				patterns: [
					{include: "#smartyEscapedVariable"}, //$NON-NLS-0$
					{include: "#smartyVariable"}, //$NON-NLS-0$
					{include: "#smartyConfigVariable"} //$NON-NLS-0$
				]
			},
			smartyVariable: {
				match: "\\$(?:smarty\\.(?:config|server)\\.)?\\w+", //$NON-NLS-0$
				name: "variable.other.smarty", //$NON-NLS-0$
			}
		}
	});
	return {
		id: grammars[grammars.length - 1].id,
		grammars: grammars,
		keywords: []
	};
});
