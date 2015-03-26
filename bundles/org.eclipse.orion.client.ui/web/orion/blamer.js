/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
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
	'orion/extensionCommands', //$NON-NLS-0$
	'orion/PageLinks', //$NON-NLS-0$
	'orion/URITemplate' //$NON-NLS-0$
], function(mExtensionCommands, PageLinks, URITemplate) {
	
	function Blamer(serviceRegistry, inputManager, editor) {
		this._serviceRegistry = serviceRegistry;
		this._inputManager = inputManager;
		this._editor = editor;
	}
	
	Blamer.prototype = {
		getBlamer: function() {
			var metadata = this._inputManager.getFileMetadata();
			var blamers = this._serviceRegistry.getServiceReferences("orion.edit.blamer"); //$NON-NLS-0$
			for (var i=0; i < blamers.length; i++) {
				var serviceReference = blamers[i];
				var info = {};
				info.validationProperties = serviceReference.getProperty("validationProperties"); //$NON-NLS-0$
				info.forceSingleItem = true;
				var validator = mExtensionCommands._makeValidator(info, this._serviceRegistry);
				if (validator.validationFunction.bind(validator)(metadata)) {
					return this._serviceRegistry.getService(serviceReference);
				}
			}
			return null;
		},

		isVisible: function() {
			return !!this.getBlamer();
		},
		
		doBlame: function() {
			var service = this.getBlamer();
			if (service) {
				var handleResult = function(results) {
					var orionHome = PageLinks.getOrionHome();
					for (var i=0; i<results.length; i++) {
						var range = results[i];
						var uriTemplate = new URITemplate(range.CommitLink);
						var params = {};
						params.OrionHome = orionHome;
						range.CommitLink = uriTemplate.expand(params);
					}
					this._editor.showBlame(results);
				}.bind(this);
				var inputManager = this._inputManager;
				var context = {metadata: inputManager.getFileMetadata()};
				service.computeBlame(inputManager.getEditor().getEditorContext(), context).then(handleResult);
			}
		}
	};
	return {Blamer: Blamer}; 
});


