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
/*global define*/

define([], function() {

	function EditorPreferences(preferences, callback) {
		this._preferences = preferences;
		this._callback = callback;
		if (callback) {
			var storageKey = preferences.listenForChangedSettings("/editor/settings", function (e) {  //$NON-NLS-0$
				if (e.key === storageKey) {
					callback();	
				}
			}.bind(this));
		}
	}
	
	EditorPreferences.prototype = /** @lends edit.EditorPreferences.prototype */ {
		_initialize: function(prefs) {
			var settings = prefs.get("editorSettings");
			if (!settings) {
				prefs.put("editorSettings",
				{	
					autoSaveEnabled:false, 
					autoSaveTimeout:520, 
					autoLoadEnabled:false
				});
			}
		},
		getPrefs: function(callback) {
			this._preferences.getPreferences("/editor/settings").then(function(prefs) { 
				this._initialize(prefs);
				prefs = prefs.get("editorSettings");
				if (typeof prefs === "string") { //$NON-NLS-0$
					prefs = JSON.parse(prefs);
				}
				callback(prefs);
			}.bind(this));
		},
		setPrefs: function(object, callback) {
			this._preferences.getPreferences("/editor/settings").then(function(prefs) {
				prefs.put("editorSettings", object);
				if (callback) {
					callback(object);
				}
				if (this._callback) {
					this._callback(object);
				}
			}.bind(this));
		}
	};
	
	return  {EditorPreferences : EditorPreferences};
});	
	