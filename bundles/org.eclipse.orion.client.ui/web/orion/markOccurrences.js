/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/
define([
	'orion/Deferred',
	'orion/lsp/utils'
], function(Deferred, Utils) {

	function MarkOccurrences(serviceRegistry, inputManager, editor, languageServerRegistry) {
		this.registry = serviceRegistry;
		this.inputManager = inputManager;
		this.editor = editor;
		this.languageServerRegistry = languageServerRegistry;
		this._languageServer = null;
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
							var currentServiceRef = serviceRefs[i];
							if (currentServiceRef && !currentServiceRef._error) {
								capableServiceRefs.push(currentServiceRef);
							}
						}
						return capableServiceRefs;
					});
			}
			
			var occurrenceTimer;
			var selectionListener = function() {
				if (occurrenceTimer) {
					window.clearTimeout(occurrenceTimer);
				}
				if (!this.occurrencesVisible) { return; }
				occurrenceTimer = window.setTimeout(function() {
					occurrenceTimer = null;
					var selections = this.editor.getSelections();
					if (selections.length > 1) {
						this.editor.showOccurrences([]);
						return;
					}
					var context = {
						selection: selections[0],
						contentType: this.inputManager.getContentType().id
					};
					
					var servicePromises = [];
					var allOccurrences = [];
					if(Array.isArray(this.occurrencesServices) && this.occurrencesServices.length > 0) {
						for (var i=0; i<this.occurrencesServices.length; i++) {
							var serviceEntry = this.occurrencesServices[i];
							if (serviceEntry){
								servicePromises.push(serviceEntry.computeOccurrences(this.editor.getEditorContext(), context).then(function (occurrences) {
									allOccurrences = allOccurrences.concat(occurrences);
								}));
							}
						}
					}
					if (this._languageServer && this._languageServer.isDocumentHighlightEnabled()) {
						servicePromises.push(Utils.computeOccurrences(this._languageServer, this.inputManager, this.editor, context).then(function (occurrences) {
							allOccurrences = allOccurrences.concat(occurrences);
						}));
					}
					Deferred.all(servicePromises).then(function(){
						this.editor.showOccurrences(allOccurrences);
					}.bind(this));
				}.bind(this), 500);
			}.bind(this);
						
			this.inputManager.addEventListener("InputChanged", function(evt) {
				var textView = this.editor.getTextView();
				var addedSelectionListener = false;
				if (textView) {
					textView.removeEventListener("Selection", selectionListener);
					getServiceRefs(this.registry, evt.contentType, evt.title).then(function(serviceRefs) {
						if (!serviceRefs || serviceRefs.length === 0) {
							if (occurrenceTimer) {
								window.clearTimeout(occurrenceTimer);
							}
						} else {
							this.occurrencesServices = [];
							for (var a=0; a<serviceRefs.length; a++) {
								var service = this.registry.getService(serviceRefs[a]);
								if (service){
									this.occurrencesServices.push(service);
								}
							}
							if (!addedSelectionListener) {
								addedSelectionListener = true;
								textView.addEventListener("Selection", selectionListener);
							}
						}
					}.bind(this));
					this._languageServer = this.languageServerRegistry.getServerByContentType(evt.contentType);
					if (this._languageServer && !addedSelectionListener) {
						textView.addEventListener("Selection", selectionListener);
					}
				}
			}.bind(this));
		}
	};
	return {MarkOccurrences: MarkOccurrences};
});