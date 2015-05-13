/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
/*global URL*/
var _editor_script_source = null; //We need to know where the browser script lives
var _all_script = document.getElementsByTagName('script');
if (_all_script && _all_script.length && _all_script.length > 0) {
	for (var j = 0; j < 2; j++) { // try twice in all the script tags
		for (var i = 0; i < _all_script.length; i++) {
			if (j === 0) { //First try: if the script id is ""orion.browse.browser""
				if (_all_script[i].id === "orion.editor.embeddedEditor") {
					_editor_script_source = _all_script[i].src;
					break;
				}
			} else {
				var regex = /.*built-embeddedEditor.*.js/;
				if (_all_script[i].src && regex.exec(_all_script[i].src)) {
					_editor_script_source = _all_script[i].src;
					break;
				}
			}
		}
		if (_editor_script_source) {
			break;
		}
	}
	if (!_editor_script_source) {
		_editor_script_source = _all_script[_all_script.length - 1].src;
	}
}
define([
	'embeddedEditor/helper/editorSetup',
	//'orion/staticDataSource',
	//'orion/contentTypes',
	'orion/serviceregistry',
	'orion/pluginregistry',
	'orion/objects',
	'orion/Deferred',
	'orion/URL-shim'
], function(
	mEditorSetup, 
	//mStaticDataSource,
	//mContentTypes,
	mServiceRegistry, 
	mPluginRegistry,
	objects,
	Deferred
) {
	var pluginURLs = [
		"../plugins/webToolsPlugin_stand_alone.html",
		"../plugins/javascriptPlugin_stand_alone.html",
		"../plugins/webEditingPlugin.html",
		"../plugins/languageToolsPlugin.html"
	];
	function Editor(params) { // parentId, repo, base
		if (typeof params === "string") {
			params = {
				parentId: arguments[0]
				//pluginURL: arguments[1]
			};
		} else {
			params = params || {};
		}
		this.parentId = params.parentId;
		var serviceRegistry = this.serviceRegistry = new mServiceRegistry.ServiceRegistry();
		//this._contentTypeService =  new mContentTypes.ContentTypeRegistry(mStaticDataSource.ContentTypes);
		//serviceRegistry.registerService("orion.core.contentTypeRegistry", this._contentTypeService); //$NON-NLS-0$
		var plugins = {};
		pluginURLs.forEach(function(pluginURLString){
			var pluginURL = new URL(pluginURLString, _editor_script_source);
			plugins[pluginURL.href] = {autostart: "lazy"};
		});
		this.pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, {
			storage: {},
			plugins: plugins
		});
	}

	objects.mixin(Editor.prototype, {
		startup: function() {
			if(this.started) {
				return new Deferred().resolve();
			} else {
				this.started = true;
				return this.pluginRegistry.start();
			}
		},
		initEditor: function() {
			this.editorHelper = new mEditorSetup.EditorSetupHelper({
				parentId: this.parentId,
				serviceRegistry: this.serviceRegistry,
				pluginRegistry: this.pluginRegistry
			});
			this.editorHelper.createEditor();
		}
	});
	return Editor;
});