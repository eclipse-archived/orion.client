/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'orion/Deferred'
], function(Deferred) {

	function MarkOccurrences(serviceRegistry, inputManager, editor) {
		this.registry = serviceRegistry;
		this.inputManager = inputManager;
		this.editor = editor;
	}
	MarkOccurrences.prototype = {
		/**
		 * Sets whether mark occurrences are shown.
		 * 
		 * @param visible whether mark occurrences are shown
		 */
		setOccurrencesVisible: function(visible) {
			if (this.occurrencesVisible === visible) {
				return;
			}
			this.occurrencesVisible = visible;
			if (!visible) {
				this.editor.showOccurrences([]);
			}
		},
		/* Looks up applicable references of occurrence service, calls references, calls the editor to show the occurrences. */
		findOccurrences: function() {
			function getServiceRefs(registry, contentType, title) {
				var contentTypeService = registry.getService("orion.core.contentTypeRegistry"); //$NON-NLS-0$
				function getFilteredServiceRef(registry, sReference, contentType) {
					var contentTypeIds = sReference.getProperty("contentType"); //$NON-NLS-0$
					return contentTypeService.isSomeExtensionOf(contentType, contentTypeIds).then(function(result) {
						return result ? sReference : null;
					});
				}
				var serviceRefs = registry.getServiceReferences("orion.edit.occurrences"); //$NON-NLS-0$
				var filteredServiceRefs = [];
				for (var i=0; i < serviceRefs.length; i++) {
					var serviceRef = serviceRefs[i];
					var pattern = serviceRef.getProperty("pattern"); // backwards compatibility //$NON-NLS-0$
					if (serviceRef.getProperty("contentType")) { //$NON-NLS-0$
						filteredServiceRefs.push(getFilteredServiceRef(registry, serviceRef, contentType));
					} else if (pattern && new RegExp(pattern).test(title)) {
						var d = new Deferred();
						d.resolve(serviceRef);
						filteredServiceRefs.push(d);
					}
				}
				
				// Return a promise that gives the service references that aren't null
				return Deferred.all(filteredServiceRefs, function(error) {return {_error: error}; }).then(
					function(serviceRefs) {
						var capableServiceRefs = [];
						for (var i=0; i < serviceRefs.length; i++) {
							var serviceRef = serviceRefs[i];
							if (serviceRef && !serviceRef._error) {
								capableServiceRefs.push(serviceRef);
							}
						}
						return capableServiceRefs;
					});
			}
			
			var occurrenceTimer;
			var that = this;
			var selectionListener = function() {
				if (occurrenceTimer) {
					window.clearTimeout(occurrenceTimer);
				}
				if (!that.occurrencesVisible) { return; }
				occurrenceTimer = window.setTimeout(function() {
					occurrenceTimer = null;
					var editor = that.editor;
					var selections = editor.getSelections();
					if (selections.length > 1) {
						that.editor.showOccurrences([]);
						return;
					}
					var context = {
						selection: selections[0],
						contentType: that.inputManager.getContentType().id
					};
					if(that.occurrencesService) {
						that.occurrencesService.computeOccurrences(editor.getEditorContext(), context).then(function (occurrences) {
							that.editor.showOccurrences(occurrences);
						});	
					}
				}, 500);
			};
						
			that.inputManager.addEventListener("InputChanged", function(evt) {//$NON-NLS-0$
				var textView = that.editor.getTextView();
				if (textView) {
					textView.removeEventListener("Selection", selectionListener); //$NON-NLS-0$
					getServiceRefs(that.registry, evt.contentType, evt.title).then(function(serviceRefs) {
						if (!serviceRefs || serviceRefs.length === 0) {
							if (occurrenceTimer) {
								window.clearTimeout(occurrenceTimer);
							}
						} else {
							that.occurrencesService = that.registry.getService(serviceRefs[0]);
							textView.addEventListener("Selection", selectionListener); //$NON-NLS-0$
						}
					});
				}
			});
		}
	};
	return {MarkOccurrences: MarkOccurrences};
});