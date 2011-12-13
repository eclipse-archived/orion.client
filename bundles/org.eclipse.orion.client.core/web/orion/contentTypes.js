/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define */
/*browser:true*/
define([], function() {
	/**
	 * @name orion.file.ContentTypes
	 * @class
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The registry to use for looking up registered content types, editors,
	 * and associations.
	 */
	function ContentTypes(serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	function array(obj) {
		if (obj === null || typeof obj === "undefined") { return []; }
		return (obj instanceof Array) ? obj : [obj];
	}
	ContentTypes.prototype = /**@lends orion.file.ContentTypeRegistry.prototype*/ {
		getContentTypes: function() {
			var map = this.getContentTypesMap();
			var types = [];
			for (var type in map) {
				if (map.hasOwnProperty(type)) {
					types.push(map[type]);
				}
			}
			return types;
		},
		/**
		 * @return {Object} A map of registered content type descriptors, keyed by content type id.
		 */
		getContentTypesMap: function() {
			var serviceReferences = this.serviceRegistry.getServiceReferences("orion.file.contenttype");
			var contentTypes = {};
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], types = array(serviceRef.getProperty("contentTypes"));
				for (var j=0; j < types.length; j++) {
					var type = types[j];
					if (!contentTypes[type.id]) {
						contentTypes[type.id] = {
							id: type.id,
							name: type.name,
							image: type.image,
							"extends": type["extends"],
							extension: array(type.extension),
							filename: array(type.filename)
						};
					}
				}
			}
			return contentTypes;
		},
		/**
		 * @return {Object} The content type descriptor
		 */
		getContentType: function(fileMetadata) {
			function winner(best, other, filename, extension) {
				var nameMatch = other.filename.indexOf(filename) >= 0;
				var extMatch = other.extension.indexOf(extension) >= 0;
				if (nameMatch || extMatch) {
					if (!best || (nameMatch && best.extension.indexOf(extension) >= 0)) {
						return other;
					}
				}
				return best;
			}
			var filename = fileMetadata.Name, extension = filename.split(".").pop();
			var contentTypes = this.getContentTypes(), best = null;
			for (var i=0; i < contentTypes.length; i++) {
				var type = contentTypes[i];
				if (winner(best, type, filename, extension) === type) {
					best = type;
				}
			}
			return best;
		}
	};
	return {ContentTypes: ContentTypes};
});
