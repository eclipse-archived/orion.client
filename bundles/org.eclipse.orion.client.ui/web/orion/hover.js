/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/

define ([
	'marked/marked', //$NON-NLS-0$
	'orion/edit/editorContext'//$NON-NLS-0$
], function(Markdown, EditorContext) {

	function Hover(editor, inputManager, serviceRegistry) {
		this.editor = editor;
		this.inputManager = inputManager;
		this.serviceRegistry = serviceRegistry;
		
		// Filter the plugins based on contentType...
		this.filterHoverPlugins();

		// Track changes to the input type and re-filter
		this.inputManager.addEventListener("InputChanged", function() { //$NON-NLS-0$
			this.filterHoverPlugins();
		}.bind(this));
	}
	
	Hover.prototype = {
		computeHoverInfo: function (context) {
			var hoverInfo = [];
			this._applicableProviders.forEach(function(provider) {
				var providerImpl = this.serviceRegistry.getService(provider);
				if (providerImpl.computeHoverInfo) {
					var editorContext = EditorContext.getEditorContext(this.serviceRegistry);
					var promise = providerImpl.computeHoverInfo(editorContext, context);
					hoverInfo.push({title: provider._properties.tipTitle,
									promise: promise,
									renderMarkDown: renderMarkDown});
				}
			}.bind(this));

			return hoverInfo;
		},
	
		filterHoverPlugins: function () {
			this._applicableProviders = [];
			var infoProviders = this.serviceRegistry.getServiceReferences("orion.edit.hover"); //$NON-NLS-0$
			for (var i = 0; i < infoProviders.length; i++) {
				var providerRef = infoProviders[i];
				if (providerRef._properties.contentType) {
					var validTypes = providerRef._properties.contentType;
					if (validTypes.indexOf(this.inputManager._contentType.id) !== -1) {
						this._applicableProviders.push(providerRef);
					}
				}
			}
		}
	};

	function renderMarkDown(markDown) {
		return Markdown(markDown);
	}
	
	function HoverFactory(serviceRegistry, inputManager) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
	}
	HoverFactory.prototype = {
		createHover: function(editor) {
			return new Hover(editor, this.inputManager, this.serviceRegistry);
		}
	};

	return {HoverFactory: HoverFactory}; 
});


