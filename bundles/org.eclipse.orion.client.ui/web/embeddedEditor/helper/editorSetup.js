/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/editor/textModel',
	'orion/editor/undoStack',
	//'orion/webui/littlelib',
	'orion/commandRegistry',
	'orion/inputManager',
	'embeddedEditor/helper/embeddedFileClient',
	'orion/contentTypes',
	'orion/editorView',
	'orion/editorCommands',
	'orion/objects'
], function(
	mTextModel,
	mUndoStack,
	//lib, 
	mCommandRegistry,
	mInputManager,
	mEmbeddedFileClient,
	mContentTypes,
	mEditorView,
	mEditorCommands,
	objects
) {
	function EditorSetupHelper(options) {
		this.parentId = options.parentId;
		this._serviceRegistry = options.serviceRegistry;
		this._pluginRegistry = options.pluginRegistry;
		this._commandRegistry = new mCommandRegistry.CommandRegistry({});
		this._fileClient = new mEmbeddedFileClient.EmbeddedFileClient();
		this._contentTypeRegistry = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
		this._editorCommands = new mEditorCommands.EditorCommandFactory({
			serviceRegistry: this._serviceRegistry,
			commandRegistry: this._commandRegistry,
			fileClient: this._fileClient
			/*
			renderToolbars: this.renderToolbars.bind(this),
			searcher: this.searcher,
			readonly: this.readonly,
			toolbarId: "toolsActions", //$NON-NLS-0$
			saveToolbarId: "fileActions", //$NON-NLS-0$
			editToolbarId: "editActions", //$NON-NLS-0$
			navToolbarId: "pageNavigationActions", //$NON-NLS-0$
			*/
		});
		this._progressService = {
			progress: function(deferred, operationName, progressMonitor){
				return deferred;
			}
		};			
		this._serviceRegistry.registerService("orion.page.progress", this._progressService);
	}
	
	objects.mixin(EditorSetupHelper.prototype, /** @lends orion.editor.EditorSetupHelper.prototype */ {
		destroy: function() {
		},
		createInputManager: function() {
			var inputManager = this._inputManager = new mInputManager.InputManager({
				serviceRegistry: this._serviceRegistry,
				fileClient: this._fileClient,
				progressService: this._progressService,
				//statusReporter: this.statusReporter.bind(this),
				selection: this.selection,
				contentTypeRegistry: this._contentTypeRegistry
			});
			inputManager.addEventListener("InputChanged", function(evt) { //$NON-NLS-0$
				var metadata = evt.metadata;
				evt.editor = this.editorView.editor;
			}.bind(this));
			inputManager.addEventListener("InputChanging", function(e) { //$NON-NLS-0$
				e.editor = this.editorView.editor;
			}.bind(this));
		},
		defaultOptions: function() {
			var model = new mTextModel.TextModel();
			return {
				parent: this.parentId,
				model: model,
				undoStack: new mUndoStack.UndoStack(model, 500),
				serviceRegistry: this._serviceRegistry,
				pluginRegistry: this._pluginRegistry,
				commandRegistry: this._commandRegistry,
				contentTypeRegistry: this._contentTypeRegistry,
				editorCommands: this._editorCommands,
				progressService: this._progressService,
				//renderToolbars: this.renderToolbars, // fake it
				inputManager: this._inputManager, // fake it
				fileService: this._fileClient, // fake it
				readonly: false
//				statusReporter: this.statusReporter.bind(this),
			};
		},
		createEditor: function() {
			this._editorCommands.createCommands().then(function() {
				this.createInputManager();
				this.editorView = new mEditorView.EditorView(this.defaultOptions());
				this.editorView.create();
				this._inputManager.editor = this.editorView.editor;
				this._editorCommands.inputManager = this._inputManager;
				this._inputManager.setInput("foo.js");
			}.bind(this));
		}
	});
	
	return {
		EditorSetupHelper: EditorSetupHelper
	};
});
