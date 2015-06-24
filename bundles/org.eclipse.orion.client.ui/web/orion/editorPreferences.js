/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:  IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/

define([
	'orion/EventTarget',
], function(EventTarget) {

	var SETTINGS_SECTION = "/editor/settings"; //$NON-NLS-0$
	var SETTINGS_KEY = "editorSettings"; //$NON-NLS-0$

	var defaults = {
		autoSave: true,
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

	function EditorPreferences(preferences, callback) {
		this._preferences = preferences;
		EventTarget.attach(this);
		var storageKey = preferences.listenForChangedSettings(SETTINGS_SECTION, function (e) {
			if (e.key === storageKey) {
				this.dispatchEvent({type: "Changed"}); //$NON-NLS-0$
			}
		}.bind(this));
		if (callback) {
			this.addEventListener("Changed", function(evt) { //$NON-NLS-0$
				callback(evt.preferences);
			});
		}
	}

	EditorPreferences.prototype = /** @lends edit.EditorPreferences.prototype */ {
		_initialize: function(prefs) {
			var settings = prefs.get(SETTINGS_KEY) || {};
			for (var property in defaults) {
				if (!settings.hasOwnProperty(property)) {
					settings[property] = defaults[property];
				}
			}
			return settings;
		},
		getPrefs: function(callback) {
			this._preferences.getPreferences(SETTINGS_SECTION).then(function(prefs) {
				var object = this._initialize(prefs);
				if (typeof object === "string") { //$NON-NLS-0$
					object = JSON.parse(object);
				}
				callback(object);
			}.bind(this));
		},
		setPrefs: function(object, callback) {
			this._preferences.getPreferences(SETTINGS_SECTION).then(function(prefs) {
				prefs.put(SETTINGS_KEY, object);
				object = this._initialize(prefs);
				if (callback) {
					callback(object);
				}
				this.dispatchEvent({type: "Changed", preferences: object}); //$NON-NLS-0$
			}.bind(this));
		}
	};

	return { EditorPreferences: EditorPreferences };
});
