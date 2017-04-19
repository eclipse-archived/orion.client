/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Casey Flynn - Google Inc - initial API and implementation
 ******************************************************************************/
 /*eslint-env browser,amd*/
define(['i18n!orion/settings/nls/messages'
], function (messages) {
	var defaultColor = "#ff80c0";
	return [
		{
			display: messages["editorTheme font size"],
			objPath: [
				"styles fontSize"
			],
			id: "editorThemeFontSize",
			value: ""
		}, {
			display: messages["editorTheme background"],
			objPath: [
				"styles backgroundColor"
			],
			id: "editorThemeBackground",
			value: defaultColor
		}, {
			display: messages["editorTheme font color"],
			objPath: [
				"styles color"
			],
			id: "editorThemeColor",
			value: defaultColor
		}, {
			display: messages["editorTheme ruler background"],
			objPath: [
				"styles ruler backgroundColor", 
				"styles ruler overview backgroundColor",
				"styles ruler annotations backgroundColor"
			],
			id: "editorThemeRulerBackground",
			value: defaultColor
		}, {
			display: messages["editorTheme ruler color"],
			objPath: [
				"styles rulerLines color",
				"styles rulerLines odd color",
				"styles rulerLines even color"
			],
			id: "editorThemeRulerColor",
			value: defaultColor
		}, {
			display: messages["editorTheme ruler border color"],
			objPath: [
				"styles textviewLeftRuler borderColor",
				"styles textviewRightRuler borderColor"
			], 
			id: "editorThemeRulerBorderColor",
			value: defaultColor
		}, {
			display: messages["editorTheme current line background"],
			objPath: [
				"styles annotationLine currentLine backgroundColor"
			], 
			id: "editorThemeColorCurrentLineBackground", 
			value: defaultColor
		}, {
			display: messages["editorTheme comment"],
			objPath: [
				"styles comment color",
				"styles comment block color",
				"styles comment line color"
			],
			id: "editorThemeCommentColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme language variable"],
			objPath: [
				"styles variable language color"
			],
			id: "editorThemeLanguageVariableColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme language constant"],
			objPath: [
				"styles constant color"
			],
			id: "editorThemeConstantColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme number"],
			objPath: [
				"styles constant numeric color",
				"styles constant numeric hex color"
			],
			id: "editorThemeNumericConstantColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme string"],
			objPath: [
				"styles string color",
				"styles string quoted double color",
				"styles string quoted single color"
			],
			id: "editorThemeStringColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme entity"],
			objPath: [
				"styles entity name color",
				"styles entity name function color"
			],
			id: "editorThemeColorEntityColor", 
			value: defaultColor
		}, {
			display: messages["editorTheme keyword (control)"],
			objPath: [
				"styles keyword control color"
			],
			id: "editorThemeControlColor",
			value: defaultColor
		}, {
			display: messages["editorTheme keyword (operator)"],
			objPath: [
				"styles keyword operator color"
			],
			id: "editorThemeOperatorColor",
			value: defaultColor
		}, {
			display: messages["editorTheme function parameter"],
			objPath: [
				"styles variable parameter color"
			],
			id: "editorThemeFunctionParameterColor",
			value: defaultColor
		}, {
			display: messages["editorTheme comparison and logical operators"],
			objPath: [
				"styles punctuation operator color"
			],
			id: "editorThemeLogicalOperatorColor",
			value: defaultColor
		}, {
			display: messages["editorTheme write occurrence background"],
			objPath: [
				"styles annotationRange writeOccurrence backgroundColor"
			],
			id: "editorThemeWriteOccurrence",
			value: defaultColor
		}, {
			display: messages["editorTheme matching bracket background"],
			objPath: [
				"styles annotationRange matchingBracket backgroundColor",
				"styles annotationRange currentBracket backgroundColor"
			], 
			id: "editorThemeMatchingBracket",
			value: defaultColor
		}, {
			display: messages["editorTheme matching search background"],
			objPath: [
				"styles annotationRange matchingSearch backgroundColor"
			],
			id: "editorThemeMatchingSearch",
			value: defaultColor
		}, {
			display: messages["editorTheme current search background"],
			objPath: [
				"styles annotationRange matchingSearch currentSearch backgroundColor"
			],
			id: "editorThemeCurrentSearch",
			value: defaultColor
		}, {
			display: messages["editorTheme search range background"],
			objPath: [
				"styles annotationLine searchRange backgroundColor"
			],
			id: "editorThemeSearchRange",
			value: defaultColor
		}, {
			display: messages["editorTheme documentation task color"],
			objPath: [
				"styles keyword other documentation task color"
			],
			id: "editorThemeDocumentationTask",
			value: defaultColor
		}, {
			display: messages["editorTheme property name color"],
			objPath: [
				"styles support type propertyName color"
			],
			id: "editorThemePropertyName",
			value: defaultColor
		}, {
			display: messages["editorTheme tag"],
			objPath: [
				"styles meta tag color"
			],
			id: "editorThemeMetaTag",
			value: defaultColor
		}, {
			display: messages["editorTheme tag attribute"],
			objPath: [
				"styles meta tag attribute color"
			],
			id: "editorThemeMetaTagAttribute",
			value: defaultColor
		}, {
			display: messages["editorTheme selection background"],
			objPath: [
				"styles textviewContent ::selection backgroundColor",
				"styles textviewContent ::-moz-selection backgroundColor",
				"styles textviewSelection backgroundColor",
				"styles textviewSelectionUnfocused backgroundColor"
			],
			id: "editorSelection",
			value: defaultColor
		}
	];
});