/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:  IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/util'
], function(util) {
	var defaults = {
		autoSave: util.isElectron ? false : true,
		autoSaveVisible: true,
		autoSaveLocalVisible: true,
		autoSaveTimeout: 250,
		autoSaveTimeoutVisible: true,
		themeVisible: true,
		themeLocalVisible: true,
		fontSizeVisible: true,
		fontSizeLocalVisible: true,
		autoLoad: true,
		autoLoadVisible: true,
		saveDiffs: true,
		saveDiffsVisible: true,
		contentAssistAutoTrigger: true,
		contentAssistAutoTriggerVisible: true,
		showOccurrences: true,
		showOccurrencesVisible: true,
		autoPairParentheses: true,
		autoPairParenthesesVisible: true,
		autoPairBraces: true,
		autoPairBracesVisible: true,
		autoPairSquareBrackets: true,
		autoPairSquareBracketsVisible: true,
		autoPairAngleBrackets: false,
		autoPairAngleBracketsVisible: true,
		autoPairQuotations: true,
		autoPairQuotationsVisible: true,
		autoCompleteComments: true,
		autoCompleteCommentsVisible: true,
		smartIndentation: true,
		smartIndentationVisible: true,
		trimTrailingWhiteSpace: false,
		trimTrailingWhiteSpaceVisible: true,
		formatOnSave: false,
		formatOnSaveVisible: true,
		tabSize: 4,
		tabSizeVisible: true,
		expandTab: false,
		expandTabVisible: true,
		scrollAnimation: true,
		scrollAnimationVisible: true,
		scrollAnimationTimeout: 300,
		scrollAnimationTimeoutVisible: true,
		annotationRuler: true,
		annotationRulerVisible: true,
		lineNumberRuler: true,
		lineNumberRulerVisible: true,
		foldingRuler: true,
		foldingRulerVisible: true,
		overviewRuler: true,
		overviewRulerVisible: true,
		zoomRuler: false,
		zoomRulerVisible: true,
		zoomRulerLocalVisible: true,
		showWhitespaces: false,
		showWhitespacesVisible: true,
		wordWrap: false,
		wordWrapVisible: true,
		showMargin: false,
		showMarginVisible: true,
		marginOffset: 80,
		marginOffsetVisible: true,
		keyBindings: "Default",
		keyBindingsVisible: true,
		keyBindingsLocalVisible: true,
		diffService: false,
		diffServiceVisible: false
	};
	return { defaults: defaults };
});
