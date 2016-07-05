/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
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
], function() {
	
	function Formatter(serviceRegistry, inputManager, editor) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
		this.editor = editor;
	}
	
	Formatter.prototype = {
		getFormatter: function() {
			var inputManagerContentType = this.inputManager.getContentType();
			var formatters = this.serviceRegistry.getServiceReferences("orion.edit.format"); //$NON-NLS-0$
			for (var i=0; i < formatters.length; i++) {
				var serviceReference = formatters[i];
				var contentTypes = serviceReference.getProperty("contentType"); //$NON-NLS-0$
				if (inputManagerContentType && inputManagerContentType.id) {
					var inputContentType = inputManagerContentType.id;
					if (Array.isArray(contentTypes)) {
						for (var j = 0, max = contentTypes.length; j < max; j++) {
							if (contentTypes[j] === inputContentType) {
								return this.serviceRegistry.getService(serviceReference);
							}
						}
					} else if (inputContentType === contentTypes) {
						return this.serviceRegistry.getService(serviceReference);
					}
				}
			}
			return null;
		},
		/*
		getServiceRefs : function(registry, contentType) {
			var contentTypeService = registry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
			function getFilteredServiceRef(registry, sReference, contentType) {
				var contentTypeIds = sReference.getProperty("contentType"); //$NON-NLS-0$
				return contentTypeService.isSomeExtensionOf(contentType, contentTypeIds).then(function(result) {
					return result ? sReference : null;
				});
			}
			var serviceRefs = registry.getServiceReferences("orion.edit.format"); //$NON-NLS-0$
			var filteredServiceRefs = [];
			for (var i=0; i < serviceRefs.length; i++) {
				var serviceRef = serviceRefs[i];
				if (serviceRef.getProperty("contentType")) { //$NON-NLS-0$
					filteredServiceRefs.push(getFilteredServiceRef(registry, serviceRef, contentType));
				}
			}
			
			// Return a promise that gives the service references that aren't null
			return Deferred.all(filteredServiceRefs, function(error) {return {_error: error}; }).then(
				function(serviceRefs) {
					var capableServiceRefs = [];
					for (var i=0; i < serviceRefs.length; i++) {
						var currentServiceRef = serviceRefs[i];
						if (currentServiceRef && !currentServiceRef._error) {
							capableServiceRefs.push(currentServiceRef);
						}
					}
					return capableServiceRefs;
				});
		},
*/
		isVisible: function() {
			return !!this.getFormatter();
		},
		
		doFormat: function() {
			var service = this.getFormatter();
			if (service) {
				var inputManager = this.inputManager;
				var selection = this.editor.getSelection();
				var context = {metadata: inputManager.getFileMetadata(), start: selection.start, end: selection.end};
				return service.format(this.editor.getEditorContext(), context);
			}
		}
	};
	return {Formatter: Formatter}; 
});


