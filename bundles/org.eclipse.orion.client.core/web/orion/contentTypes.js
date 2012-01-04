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
define([], function() {
	/**
	 * @name orion.file.ContentType
	 * @class Represents a content type known to Orion.
	 * @property {String} id Unique identifier of this ContentType.
	 * @property {String} name User-readable name of this ContentType.
	 * @property {String} extends Optional; Gives the ID of another ContentType that is this one's parent.
	 * @property {String[]} extension Optional; List of file extensions characterizing this ContentType.
	 * @property {String[]} filename Optional; List of filenames characterizing this ContentType.
	 */
	
	/**
	 * @name orion.file.ContentTypeService
	 * @class A service for querying {@link orion.file.ContentType}s.
	 * @description A service for querying {@link orion.file.ContentType}s. Clients should request the <code>"orion.file.contenttypes"</code>
	 * service from the {@link orion.serviceregistry.ServiceRegistry} rather than instantiate this class directly. This constructor is 
	 * intended for use only by page initialization code.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to use for looking up registered content types
	 * and for registering this service.
	 */
	function ContentTypeService(serviceRegistry) {
		function buildMap(serviceRegistry) {
			function array(obj) {
				if (obj === null || typeof obj === "undefined") { return []; }
				return (obj instanceof Array) ? obj : [obj];
			}
			var serviceReferences = serviceRegistry.getServiceReferences("orion.file.contenttype");
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
		}
		
		this.serviceRegistry = serviceRegistry;
		this.map = buildMap(serviceRegistry);
		serviceRegistry.registerService("orion.file.contenttypes", this);
	}
	ContentTypeService.prototype = /** @lends orion.file.ContentTypeService.prototype */ {
		/**
		 * Gets all the ContentTypes in the registry.
		 * @returns {orion.file.ContentType[]} An array of all registered ContentTypes.
		 */
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
		 * Gets a map of all ContentTypes.
		 * @return {Object} A map whose keys are ContentType IDs and values are the {@link orion.file.ContentType} having that ID.
		 */
		getContentTypesMap: function() {
			return this.map;
		},
		/**
		 * Looks up the ContentType for a file, given the file's metadata.
		 * @param {Object} fileMetadata Metadata for a file.
		 * @returns {orion.file.ContentType} The ContentType for the file, or <code>null</code> if none could be found.
		 */
		getFileContentType: function(fileMetadata) {
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
		},
		/**
		 * Gets a ContentType by ID.
		 * @param {String} id The ContentType ID.
		 * @returns {orion.file.ContentType} The ContentType having the given ID, or <code>null</code>.
		 */
		getContentType: function(id) {
			return this.map[id] || null;
		},
		/**
		 * Determines whether a ContentType is an extension of another.
		 * @param {orion.file.ContentType|String} contentTypeA ContentType or ContentType ID.
		 * @param {orion.file.ContentType|String} contentTypeB ContentType or ContentType ID.
		 * @returns {Boolean} Returns <code>true</code> if <code>contentTypeA</code> equals <code>contentTypeB</code>,
		 *  or <code>contentTypeA</code> descends from <code>contentTypeB</code>.
		 */
		isExtensionOf: function(contentTypeA, contentTypeB) {
			contentTypeA = (typeof contentTypeA === "string") ? this.getContentType(contentTypeA) : contentTypeA;
			contentTypeB = (typeof contentTypeB === "string") ? this.getContentType(contentTypeB) : contentTypeB;
			if (!contentTypeA || !contentTypeB) { return false; }
			if (contentTypeA.id === contentTypeB.id) { return true; }
			else {
				var parent = contentTypeA;
				while (parent && (parent = this.getContentType(parent['extends']))) {
					if (parent.id === contentTypeB.id) { return true; }
				}
			}
			return false;
		},
		/**
		 * Similar to {@link #isExtensionOf}, but works on an array of contentTypes.
		 * @param {orion.file.ContentType|String} contentType ContentType or ContentType ID.
		 * @param {orion.file.ContentType[]|String[]} contentTypes Array of ContentTypes or ContentType IDs.
		 * @returns {Boolean} <code>true</code> if <code>contentType</code> equals or descends from any of the
		 * ContentTypes in <code>contentTypes</code>.
		 */
		isSomeExtensionOf: function(contentType, contentTypes) {
			for (var i=0; i < contentTypes.length; i++) {
				if (this.isExtensionOf(contentType, contentTypes[i])) {
					return true;
				}
			}
			return false;
		}
	};
	return {ContentTypeService: ContentTypeService};
});