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
define([
	'embeddedEditor/helper/bootstrap',
	'embeddedEditor/helper/editorSetup',
	'orion/objects'
], function(
	mBootstrap,
	mEditorSetup,
	objects
) {
	function CodeEdit() {
	}

	objects.mixin(CodeEdit.prototype, {
		/**
		 * @class This object describes the options for <code>create</code>.
		 * @name orion.editor.EditOptions
		 *
		 * @property {String|DOMElement} parent the parent element for the view, it can be either a DOM element or an ID for a DOM element.
		 * @property {String} [contents=""] the editor contents.
		 * @property {String} [contentType] the type of the content (eg.- application/javascript, text/html, etc.)
		 */
		/**
		 * Creates an editorview instance configured with the given options.
		 * 
		 * @param {orion.editor.EditOptions} options the editor options.
		 */
		create: function(options) {
			return mBootstrap.startup(options).then(function(core) {
				var serviceRegistry = core.serviceRegistry;
				var pluginRegistry = core.pluginRegistry;
				var editorHelper = new mEditorSetup.EditorSetupHelper({
					serviceRegistry: serviceRegistry,
					pluginRegistry: pluginRegistry
				});
				return editorHelper.createEditor(options);
			});
		}
	});
	return CodeEdit;
});