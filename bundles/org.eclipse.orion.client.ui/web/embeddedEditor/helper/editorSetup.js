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
	'orion/commandRegistry',
	'orion/inputManager',
	'orion/fileClient',
	'orion/contentTypes',
	'orion/editorView',
	'orion/editorCommands',
	'orion/objects'
], function(
	mTextModel,
	mUndoStack,
	mCommandRegistry,
	mInputManager,
	mFileClient,
	mContentTypes,
	mEditorView,
	mEditorCommands,
	objects
) {
	var idCounter = 0;
	function EditorSetupHelper(options) {
		this._serviceRegistry = options.serviceRegistry;
		this._pluginRegistry = options.pluginRegistry;
		this._commandRegistry = new mCommandRegistry.CommandRegistry({});
		this._fileClient = new mFileClient.FileClient(this._serviceRegistry);
		this._contentTypeRegistry = new mContentTypes.ContentTypeRegistry(this._serviceRegistry);
		this._editorCommands = new mEditorCommands.EditorCommandFactory({
			serviceRegistry: this._serviceRegistry,
			commandRegistry: this._commandRegistry,
			fileClient: this._fileClient,
			toolbarId: "_orion_hidden_actions",
			navToolbarId: "_orion_hidden_actions"
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
			},
			showWhile: function(deferred, message, avoidDisplayError){
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
				evt.editor = this.editorView.editor;
				this.pageActionsScope = "_orion_hidden_actions";
				this._commandRegistry.destroy(this.pageActionsScope);
				this._commandRegistry.renderCommands(this.pageActionsScope, this.pageActionsScope, evt.metadata, evt.editor, "tool"); //$NON-NLS-0$
			}.bind(this));
			inputManager.addEventListener("InputChanging", function(e) { //$NON-NLS-0$
				e.editor = this.editorView.editor;
			}.bind(this));
		},
		defaultOptions: function(parentId) {
			var model = new mTextModel.TextModel();
			var id = idCounter.toString();
			var context = Object.create(null);
			context.openEditor = function(fileurl, options){this.editorView.editor.setSelection(options.start, options.end);}.bind(this);
			return {
				activateContext: context,
				id: id,
				parent: parentId,
				model: model,
				undoStack: new mUndoStack.UndoStack(model, 500),
				serviceRegistry: this._serviceRegistry,
				pluginRegistry: this._pluginRegistry,
				commandRegistry: this._commandRegistry,
				contentTypeRegistry: this._contentTypeRegistry,
				editorCommands: this._editorCommands,
				progressService: this._progressService,
				inputManager: this._inputManager, // fake it
				fileService: this._fileClient, // fake it
				problemsServiceID: "orion.core.marker" + id, //$NON-NLS-0$
				editContextServiceID: "orion.edit.context" + id, //$NON-NLS-0$
				editModelContextServiceID: "orion.edit.model.context" + id, //$NON-NLS-0$
				readonly: false
			};
		},
		createEditor: function(options) {
			return this._editorCommands.createCommands().then(function() {
				this._editorCommands.registerCommands();
				this.createInputManager();
				this.editorView = new mEditorView.EditorView(this.defaultOptions(options.parent));
				idCounter++;
				this.editorView.create();
				this._inputManager.editor = this.editorView.editor;
				this._inputManager.setAutoSaveTimeout(300);
				this._editorCommands.inputManager = this._inputManager;
				if(options.contentType && options.contents) {
					this.editorView.setContents(options.contents, options.contentType);
				}
				return this.editorView;
			}.bind(this));
		}
	});
	
	return {
		EditorSetupHelper: EditorSetupHelper
	};
});
