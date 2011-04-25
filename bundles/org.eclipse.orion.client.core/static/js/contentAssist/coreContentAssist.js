/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global orion:true*/

/** @namespace */
var orion = orion || {};
orion.contentAssist = orion.contentAssist || {};

/**
 * @name orion.contentAssist.CssContentAssistProvider
 */
orion.contentAssist.CssContentAssistProvider = (function() {
	function CssContentAssistProvider() {
	}
	CssContentAssistProvider.prototype = {
		getKeywords: function() /** @lends orion.contentAssist.CssContentAssistProvider.prototype */ {
			return [ "background", "background-attachment", "background-color", "background-image",
					"background-position", "background-repeat", "border", "border-bottom",
					"border-bottom-color", "border-bottom-style", "border-bottom-width", "border-color",
					"border-left", "border-left-color", "border-left-style", "border-left-width",
					"border-right", "border-right-color", "border-right-style", "border-right-width",
					"border-style", "border-top", "border-top-color", "border-top-style", "border-top-width",
					"border-width", "bottom", "clear", "clip", "color", "cursor", "display", "float", "font",
					"font-family", "font-size", "font-style", "font-variant", "font-weight", "height",
					"horizontal-align", "left", "line-height", "list-style", "list-style-image",
					"list-style-position", "list-style-type", "margin", "margin-bottom", "margin-left",
					"margin-right", "margin-top", "max-height", "max-width", "min-height", "min-width",
					"outline", "outline-color", "outline-style", "outline-width", "overflow", "overflow-x",
					"overflow-y", "padding", "padding-bottom", "padding-left", "padding-right",
					"padding-top", "position", "right", "text-align", "text-decoration", "text-indent",
					"top", "vertical-align", "visibility", "width", "z-index" ];
		}
	};
	return CssContentAssistProvider;
}());

/**
 * @name orion.contentAssist.JavaScriptContentAssistProvider
 */
orion.contentAssist.JavaScriptContentAssistProvider = (function() {
	function JavaScriptContentAssistProvider() {
	}
	JavaScriptContentAssistProvider.prototype = /** @lends orion.contentAssist.JavaScriptContentAssistProvider.prototype */ {
		getKeywords: function() {
			return [ "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else",
					"finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch",
					"this", "throw", "try", "typeof", "var", "void", "while", "with" ];
		}
	};
	return JavaScriptContentAssistProvider;
}());
