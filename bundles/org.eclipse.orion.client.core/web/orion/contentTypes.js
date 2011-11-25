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
define(["orion/editor/regex"], function(mRegex) {
	/**
	 * @name orion.file.ContentTypeRegistry
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
		/** 
		 * @returns {Array} An array of registered editors.
		 */
		getEditors: function() {
			var serviceReferences = this.serviceRegistry.getServiceReferences("orion.edit.editor");
			var editors = [];
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], id = serviceRef.getProperty("id");
				editors.push({
					id: id,
					name: serviceRef.getProperty("name"),
					href: serviceRef.getProperty("href")
				});
			}
			return editors;
		},
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
			var serviceReferences = this.serviceRegistry.getServiceReferences("orion.file.contentType");
			var contentTypes = {};
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], types = array(serviceRef.getProperty("contentTypes"));
				for (var j=0; j < types.length; j++) {
					var type = types[j];
					if (!contentTypes[type.id]) {
						contentTypes[type.id] = {
							id: type.id,
							name: type.name,
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
		},
		/**
		 * Converts "orion.navigate.openWith" service contributions into orion.navigate.command that open the appropriate editors.
		 * @returns {Object[]} The fileCommands
		 */
		toFileCommands: function() {
			function getObject(parent, fields) {
				if (parent === null || typeof parent === "undefined") { return parent; }
				fields = fields.split(".");
				var value;
				for (var i=0; i < fields.length; i++) {
					value = parent[fields[i]];
					parent = value;
					if (value === null || typeof value === "undefined") { break; }
				}
				return value;
			}
			function makeOpenWithRunner(href) {
				return function(item) {
					// String substitution: replace ${foo} with item.foo, ${foo.bar} with item.foo.bar, etc.
					return href.replace(/\$\{([\d\w-_$.]+)\}/g, function(str, properties) {
						return getObject(item, properties);
					});
				};
			}
			function toNamePattern(exts, filenames) {
				exts = exts.map(function(ext) { return mRegex.escapeRegex(ext); });
				filenames = filenames.map(function(ext) { return mRegex.escapeRegex(ext); });
				var extsPart = exts.length && "(*\\.(" + exts.join("|") + ")$)";
				var filenamesPart = filenames.length && "(^(" + filenames.join("|") + ")$)";
				var pattern;
				if (extsPart && filenamesPart) {
					pattern = extsPart + "|" + filenamesPart;
				} else if (extsPart) {
					pattern = extsPart;
				} else if (filenamesPart) {
					pattern = filenamesPart;
				} else {
					pattern = null;
				}
				// /(*\.(ext1|ext2|...)$)|(^(filename1|filename2|...)$)/
				return pattern;
			}
			function getEditorContentTypes(serviceRegistry, editor) {
				var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith");
				var types = [];
				for (var i=0; i < openWithReferences.length; i++) {
					var ref = openWithReferences[i];
					if (ref.getProperty("editor") === editor.id) {
						types = types.concat(array(ref.getProperty("contentType")));
					}
				}
				return types;
			}
			
			var editors = this.getEditors();
			var contentTypes = this.getContentTypesMap();
			var fileCommands = [];
			for (var i=0; i < editors.length; i++) {
				var editor = editors[i];
				var editorContentTypes = getEditorContentTypes(this.serviceRegistry, editor);
				if (editorContentTypes.length) {
					var exts = [], filenames = [];
					for (var j=0; j < editorContentTypes.length; j++) {
						var contentType = contentTypes[editorContentTypes[j]];
						if (contentType) {
							exts = exts.concat(contentType.extension);
							filenames = filenames.concat(contentType.filename);	
						}
					}
					var href = editor.href;
					var validationProperties = { Name: toNamePattern(exts, filenames) };
					var properties = {
							name: editor.name || editor.id,
							id: "eclipse.openWithCommand." + editor.id,
							tooltip: editor.name,
							validationProperties: validationProperties,
							href: true,
							forceSingleItem: true,
							isEditor: true // Distinguishes from a normal fileCommand
						};
					// Pretend that this is a real service
					var fakeService = {
							run: makeOpenWithRunner(href)
						};
					fileCommands.push({properties: properties, service: fakeService});
				}
			}
			return fileCommands;
		}
	};
	return {ContentTypes: ContentTypes};
});
