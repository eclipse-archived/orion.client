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
	'orion/commandRegistry',
	'orion/fileClient',
	'orion/contentTypes',
	'orion/editorCommands',
	'embeddedEditor/helper/bootstrap',
	'embeddedEditor/helper/editorSetup',
	'orion/Deferred',
	'orion/objects'
], function(
	mCommandRegistry,
	mFileClient,
	mContentTypes,
	mEditorCommands,
	mBootstrap,
	mEditorSetup,
	Deferred,
	objects
) {
	function CodeEdit(options) {
		this._startupOptions = options;
		this._toolbarId = options && options.toolbarId ? options.toolbarId : "__code__edit__hidden__toolbar";
	}
	var once;
	objects.mixin(CodeEdit.prototype, {
		_init: function(core) {
			if(once) {
				return once;
			}
			if(!(this._startupOptions && this._startupOptions.toolbarId)) {
				//TODO: We should create this hidden div somewhere else
				//The hidden DIV that allows some commands for editorCommnads to be rendered. We only want to use keybinding of them though.
				var orionHiddenDiv = document.createElement("div");
				orionHiddenDiv.id = this._toolbarId;
				document.body.appendChild(orionHiddenDiv);
				orionHiddenDiv.style.display = "none";
			}
			//once = new Deferred();
			this._serviceRegistry = core.serviceRegistry;
			this._commandRegistry = new mCommandRegistry.CommandRegistry({});
			this._fileClient = new mFileClient.FileClient(this._serviceRegistry);
			this._contentTypeRegistry = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
			this._editorCommands = new mEditorCommands.EditorCommandFactory({
				serviceRegistry: this._serviceRegistry,
				commandRegistry: this._commandRegistry,
				fileClient: this._fileClient,
				toolbarId: this._toolbarId,
				navToolbarId: this._toolbarId
			});
			this._progressService = {
				progress: function(deferred/*, operationName, progressMonitor*/){
					return deferred;
				},
				showWhile: function(deferred/*, message, avoidDisplayError*/){
					return deferred;
				}
			};			
			this._serviceRegistry.registerService("orion.page.progress", this._progressService);
			once = this._editorCommands.createCommands().then(function() {
				this._editorCommands.registerCommands();
				return new Deferred().resolve();
			}.bind(this));
			//once.resolve();
			return once;
		},
		
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
			return mBootstrap.startup(this._startupOptions).then(function(core) {
				var serviceRegistry = core.serviceRegistry;
				var pluginRegistry = core.pluginRegistry;
				return this._init(core).then( function () {
					var editorHelper = new mEditorSetup.EditorSetupHelper({
						serviceRegistry: serviceRegistry,
						pluginRegistry: pluginRegistry,
						commandRegistry: this._commandRegistry,
						fileClient: this._fileClient,
						contentTypeRegistry: this._contentTypeRegistry,
						editorCommands: this._editorCommands,
						progressService: this._progressService,
						toolbarId: this._toolbarId
					});
					return editorHelper.createEditor(options);
		 		}.bind(this));

			}.bind(this));
		}
	});
	return CodeEdit;
});