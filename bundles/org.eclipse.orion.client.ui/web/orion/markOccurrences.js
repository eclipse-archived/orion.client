/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window */

define([
	'orion/edit/editorContext',
	'orion/Deferred',
	'orion/objects',
	'orion/serviceTracker'
], function(EditorContext, Deferred, Objects, ServiceTracker) {

	/**
	 * @name orion.MarkOccurrences.protoype
	 * @description Helper class to compute occurrences for a given content type. This class delegates
	 * to providers of the <code>orion.edit.occurrences</code> service
	 * @constructor
	 * @public
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.editor.InputManager} inputManager
	 */
	function MarkOccurrences(serviceRegistry, inputManager) {
		this.registry = serviceRegistry;
		this.inputManager = inputManager;
		this.tracker = new ServiceTracker(serviceRegistry, "orion.edit.occurrences"); //$NON-NLS-0$
		this.tracker.open();
	}
	
	Objects.mixin(MarkOccurrences.prototype, /** @lends orion.MarkOccurrences.prototype */ {
		/**
		 * @name _getOccurrenceProvider
		 * @description Returns the occurrence provider for the given content type or <code>null</code> if it could not be computed
		 * @function
		 * @private
		 * @memberof orion.MarkOccurrences.prototype
		 * @param {String} contentTypeId the content type identifier
		 * @returns {Object|orion.Promise} An occurrence provider capable of computing occurrences for the given content type
		 * @since 5.0
		 */
		_getOccurrenceProvider: function(contentTypeId) {
			var providers = this.tracker.getServiceReferences().filter(function(serviceRef) {
				var type = serviceRef.getProperty("contentType");
				if(Array.isArray(type)) {
					return type.indexOf(contentTypeId) !== -1;
				}
				return type === contentTypeId;
			});
			var serviceRef = providers[0];
			return serviceRef ? this.registry.getService(serviceRef) : null;
		},
		/**
		 * @name showOccurrences
		 * @description Shows occurences of the current context from the given editor
		 * @function
		 * @public
		 * @memberof orion.MarkOccurrences.prototype
		 * @param {Ojbect} editor The editor to show occurrences in
		 * @since 5.0
		 */
		showOccurrences: function(editor) {
			var contentType = this.inputManager.getContentType();
			if(contentType && contentType.id) {
				var provider = this._getOccurrenceProvider(contentType.id);
				if(provider) {
					var context = {
						selection: editor.getSelection()	
					};
					var that = this;
					provider.computeOccurrences(EditorContext.getEditorContext(that.registry), context).then(function (occurrences) {
						editor.showOccurrences(occurrences);
					});	
				}
			}
		}
	});
	return {MarkOccurrences : MarkOccurrences};
});