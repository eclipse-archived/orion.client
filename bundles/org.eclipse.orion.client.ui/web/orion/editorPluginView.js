/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'orion/editor/editor',
	'orion/commands',
	'orion/objects',
	'orion/webui/littlelib'
], function(mEditor, Commands, objects, lib) {
	
	function handleError(statusService, error) {
		if (!statusService) {
			window.console.log(error);
			return;
		}
		var responseText = error.responseText;
		if (responseText) {
			try {
				error = JSON.parse(responseText);
			} catch(e) {
				error = {
					//HTML: true,
					Severity: "Error", //$NON-NLS-0$
					Message: responseText
				};
			}
		}
		statusService.setProgressResult(error);
	}
	

	var BaseEditor = mEditor.BaseEditor;
	function PluginEditor(options) {
		BaseEditor.apply(this, arguments);
		this.editorService = options.editorService;
		this.id = this.editorService.getProperty("id"); //$NON-NLS-0$
		this.metadata = options.metadata;
		this.serviceRegistry = options.serviceRegistry;
		this.pluginRegistry = options.pluginRegistry;
		this.statusService = options.statusService;
		this.inputManager = options.inputManager;
		this.activate = options.activate;
		this.editModelContextServiceID = options.editModelContextServiceID;
	}
		
	PluginEditor.prototype = Object.create(BaseEditor.prototype);
	objects.mixin(PluginEditor.prototype, /** @lends orion.edit.DelegatedEditor.prototype */ {
		_getPlugin: function() {
			//HACK
			return this.pluginRegistry.getPlugin(this.editorService._properties.__plugin__);
		},
		_load: function() {
			var serviceRegistry = this.serviceRegistry;
			// Relookup editor service because plugin may be reloaded when calling setParent
			var editors = serviceRegistry.getServiceReferences("orion.edit.editor"); //$NON-NLS-0$
			for (var i=0; i<editors.length; i++) {
				if (editors[i].getProperty("id") === this.id) { //$NON-NLS-0$
					this.editorService = editors[i];
				}
			}
			var service = serviceRegistry.getService(this.editorService);
			if (service.setBlob) {
				service.setBlob(new Blob([this._contents], {type: this.inputManager.getContentType().id}));
			}
			if (service.setTextModel) {

				//HACK
				var context = serviceRegistry.getService(serviceRegistry.getServiceReferences(this.editModelContextServiceID)[0]); //$NON-NLS-0$
				
				var self = this;
				self.oldSetText = context.setText;
				context.setText = function() {
					self.serviceChangingText = true;
					var result = self.oldSetText.apply(context, arguments);
					self.serviceChangingText = false;
					return result;
				};
				
				context.processKey = function(evt) {
					Commands.processKey(evt);
				};
				
				service.setTextModel(context);
			}
			if (service.registerKeys) {
				var bindings = Commands.getKeyBindings();
				var keys = [];
				Object.keys(bindings).forEach(function(key) {
					var kb = bindings[key].keyBinding;
					keys.push({keyCode: kb.keyCode, mod1: kb.mod1, mod2: kb.mod2, mod3: kb.mod3, mod4: kb.mod4});
				});
				service.registerKeys(keys);
			}
			this.activate();
		},
		install: function() {
			var parent = lib.node(this._domNode); //$NON-NLS-0$
			var root = this._rootDiv = document.createElement("div"); //$NON-NLS-0$
			root.style.width = "100%"; //$NON-NLS-0$
			root.style.height = "100%"; //$NON-NLS-0$
			root.style.overflow = "hidden"; //$NON-NLS-0$
			root.title = this.metadata ? this.metadata.Name : "";
			var self = this;
			var plugin = this._getPlugin();
			plugin.setParent(root).then(function() {
				self._load();
			}, function(e) {
				handleError(self.statusService, e);
			});
			parent.appendChild(root); 
			BaseEditor.prototype.install.call(this);
		},
		onChanged: function (modelChangedEvent) {
			BaseEditor.prototype.onChanged.call(this, modelChangedEvent);
			//TODO consider using the orion.edit.model service instead
			var service = this.serviceRegistry.getService(this.editorService);
			if (service && service.onChanged) {
				modelChangedEvent.isService = this.serviceChangingText;
				service.onChanged(modelChangedEvent);
			}
		},
		setInput: function(title, message, contents, contentsSaved) {
			if (typeof contents !== "string") {//HACK
				this._contents = contents;
			}
			BaseEditor.prototype.setInput.call(this, title, message, contents, contentsSaved);
		},
		uninstall: function() {
			var plugin = this._getPlugin();
			plugin.setParent(null);

			//HACK
			var serviceRegistry = this.serviceRegistry;
			if (this.oldSetText) {
				var context = serviceRegistry.getService(serviceRegistry.getServiceReferences(this.editModelContextServiceID)[0]); //$NON-NLS-0$
				context.setText = this.oldSetText;
			}
			
			lib.empty(this._domNode);
			BaseEditor.prototype.uninstall.call(this);
		}
	});

	function PluginEditorView(options) {
		this._parent = options.parent;
		this.serviceRegistry = options.serviceRegistry;
		this.pluginRegistry = options.pluginRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.commandRegistry = options.commandRegistry;
		this.statusService = options.statusService;
		this.progressService = options.progressService;
		this.editorService = options.editorService;
		this.editorCommands = options.editorCommands;
		this.editModelContextServiceID = options.editModelContextServiceID;
		this.metadata = options.metadata;
		this.inputManager = options.inputManager;
		this.readonly = options.readonly;
		this.model = options.model;
		this.undoStack = options.undoStack;
	}
	PluginEditorView.prototype = {
		create: function() {
			this.editor = new PluginEditor({
				domNode: this._parent,
				model: this.model,
				undoStack: this.undoStack,
				activate: function() {
					this.editorCommands.updateCommands(this);
				}.bind(this),
				serviceRegistry: this.serviceRegistry,
				pluginRegistry: this.pluginRegistry,
				editorService: this.editorService,
				statusService: this.statusService,
				inputManager: this.inputManager,
				editModelContextServiceID: this.editModelContextServiceID,
				metadata: this.metadata
			});
			this.editor.install();
		},
		destroy: function() {
			if (this.editor) {
				this.editor.destroy();
			}
			this.editor = null;
		}
	};

	return {
		PluginEditorView: PluginEditorView,
		PluginEditor: PluginEditor
	};
});
