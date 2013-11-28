/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document window URL console*/
define([
	'orion/editor/editor',
	'orion/editor/textModel',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/PageLinks',
	'orion/URITemplate'
], function(mEditor, mTextModel, objects, lib, PageLinks, URITemplate) {

	var BaseEditor = mEditor.BaseEditor;
	function DelegatedEditor(options) {
		BaseEditor.apply(this, arguments);
		this.metadata = options.metadata;
		this.contentProvider = options.contentProvider;
	}
		
	DelegatedEditor.prototype = Object.create(BaseEditor.prototype);
	objects.mixin(DelegatedEditor.prototype, /** @lends orion.edit.DelegatedEditor.prototype */ {
		install: function() {
			var parent = lib.node(this._domNode); //$NON-NLS-0$
			var root = this._rootDiv = document.createElement("div"); //$NON-NLS-0$
			root.style.width = "100%"; //$NON-NLS-0$
			root.style.height = "100%"; //$NON-NLS-0$
			root.style.overflow = "hidden"; //$NON-NLS-0$
			var content = this._contentDiv = document.createElement("iframe"); //$NON-NLS-0$
			content.id = this.contentProvider.getProperty("id"); //$NON-NLS-0$
			content.type = "text/html"; //$NON-NLS-0$
			content.style.width = "100%"; //$NON-NLS-0$
			content.style.height = "100%"; //$NON-NLS-0$
			content.frameBorder = 0; //$NON-NLS-0$
			root.appendChild(content); 
			parent.appendChild(root); 
		},
		setInput: function(title, message, contents, contentsSaved) {
			var info = {};
			info.Location = this.metadata.Location;
			info.OrionHome = PageLinks.getOrionHome();
			var contentProvider = this.contentProvider;
			var propertyNames = contentProvider.getPropertyKeys();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = contentProvider.getProperty(propertyNames[j]);
			}
			var uriTemplate = new URITemplate(info.uriTemplate);
			this._contentDiv.src = uriTemplate.expand(info);
			BaseEditor.prototype.setInput.call(this, title, message, contents, contentsSaved);
		},
		uninstall: function() {
			lib.empty(this._domNode);
		}
	});

	function DelegatedEditorView(options) {
		this._parent = options.parent;
		this.serviceRegistry = options.serviceRegistry;
		this.contentTypeRegistry = options.contentTypeRegistry;
		this.commandRegistry = options.commandRegistry;
		this.progressService = options.progressService;
		this.contentProvider = options.contentProvider;
		this.metadata = options.metadata;
	}
	DelegatedEditorView.prototype = {
		create: function() {
			this.editor = new DelegatedEditor({
				domNode: this._parent,
				serviceRegistry: this.serviceRegistry,
				contentProvider: this.contentProvider,
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
		DelegatedEditorView: DelegatedEditorView,
		DelegatedEditor: DelegatedEditor
	};
});