/*******************************************************************************
 * @license
 * Copyright (c) 2011,2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window define orion */
/*browser:true*/

define(["require", "dojo", "orion/util", "orion/commands", "orion/editor/regex", "orion/contentTypes", "orion/URITemplate", "orion/widgets/NewItemDialog", "orion/widgets/DirectoryPrompterDialog", 'orion/widgets/ImportDialog', 'orion/widgets/SFTPConnectionDialog'],
	function(require, dojo, mUtil, mCommands, mRegex, mContentTypes, URITemplate){

	/**
	 * Utility methods
	 * @class This class contains static utility methods for creating and managing commands from extension points
	 * related to file management.
	 * @name orion.extensionCommands
	 */
	var extensionCommandUtils  = {};
	
	// TODO working around https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
	var nonHash = window.location.href.split('#')[0];
	var orionHome = nonHash.substring(0, nonHash.length - window.location.pathname.length);
	
	extensionCommandUtils._cloneItemWithoutChildren = function clone(item){
	    if (item === null || typeof(item) !== 'object') {
	        return item;
	      }
	
	    var temp = item.constructor(); // changed
	
	    for(var key in item){
			if(key!=="children" && key!=="Children") {
				temp[key] = clone(item[key]);
			}
	    }
	    return temp;
	};

	/**
	 * Converts "orion.navigate.openWith" service contributions into orion.navigate.command that open the appropriate editors.
	 * @returns {Object[]} The "open with" fileCommands
	 */
	extensionCommandUtils._createOpenWithCommands = function(serviceRegistry, contentTypes) {
		function getEditors() {
			var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.editor");
			var editors = [];
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], id = serviceRef.getProperty("id");
				editors.push({
					id: id,
					name: serviceRef.getProperty("name"),
					uriTemplate: serviceRef.getProperty("orionTemplate") || serviceRef.getProperty("uriTemplate")
				});
			}
			return editors;
		}

		function getEditorOpenWith(serviceRegistry, editor) {
			var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith");
			var types = [];
			for (var i=0; i < openWithReferences.length; i++) {
				var ref = openWithReferences[i];
				if (ref.getProperty("editor") === editor.id) {
					var ct = ref.getProperty("contentType");
					if (ct instanceof Array) {
						types = types.concat(ct);
					} else if (ct !== null && typeof ct !== "undefined") {
						types.push(ct);
					}
				}
			}
			return types;
		}
		function getDefaultEditor(serviceRegistry) {
			var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith.default");
			for (var i=0; i < openWithReferences.length; i++) {
				return {editor: openWithReferences[i].getProperty("editor")};
			}
			return null;
		}
		
		var editors = getEditors(), defaultEditor = getDefaultEditor(serviceRegistry);
		var fileCommands = [];

		for (var i=0; i < editors.length; i++) {
			var editor = editors[i];
			var isDefaultEditor = (defaultEditor && defaultEditor.editor === editor.id);
			var editorContentTypes = getEditorOpenWith(serviceRegistry, editor);
			if (editorContentTypes.length) {
				var properties = {
					name: editor.name || editor.id,
					id: "eclipse.openWithCommand." + editor.id,
					tooltip: editor.name,
					contentType: editorContentTypes,
					uriTemplate: editor.uriTemplate,
					forceSingleItem: true,
					isEditor: (isDefaultEditor ? "default": "editor") // Distinguishes from a normal fileCommand
				};
				fileCommands.push({properties: properties, service: {}});
			}
		}
		return fileCommands;
	};
	
	/**
	 * Create a validator for a given set of service properties.  The validator should be able to 
	 * validate a given item using the "contentType" and "validationProperties" service properties.
	 */
	extensionCommandUtils._makeValidator = function(info, serviceRegistry, contentTypes, validationItemConverter) {
		function checkItem(item, key, value, validationProperty) {
			var valid = false;
			var value;
			// item has the specified property
			if (item[key]) {
				validationProperty.itemCached = item;
				if (!value) {  // value doesn't matter, just the presence of the property is enough
					value = item[key];
					valid = true;
				} else if (typeof(value) === 'string') {  // the value is a regular expression that should match some string
					if (!typeof(item[key] === 'string')) {
						// can't pattern match on a non-string
						return false;
					}
					if (validationProperty.variableName) {
						var patternMatch = new RegExp(value).exec(item[key]);
						if (patternMatch) {
							var firstMatch = patternMatch[0];
							if (validationProperty.variableMatchPosition === "before") {
								value = item[key].substring(0, patternMatch.index);
							} else if (validationProperty.variableMatchPosition === "after") {
								value = item[key].substring(patternMatch.index + firstMatch.length);
							} else if (validationProperty.variableMatchPosition === "only") {
								value = firstMatch;
							} else {  // "all"
								value = item[key];
							}
							valid = true;
						}
					} else {
						return new RegExp(value).test(item[key]);
					}
				} else {
					if (item[key] === value) {
						value = item[key];
						valid = true;
					}
				}
				// now store any variable values and look for replacements
				if (validationProperty.variableName) {
					validationProperty.variableValue = value;
					if (validationProperty.replacements) {
						for (var i=0; i<validationProperty.replacements.length; i++) {
							var invalid = false;
							if (validationProperty.replacements[i].pattern) {	
								var from = validationProperty.replacements[i].pattern;
								var to = validationProperty.replacements[i].replacement || "";
								validationProperty.variableValue = validationProperty.variableValue.replace(new RegExp(from), to);
							} else {
								invalid = true;
							}
							if (invalid) {
								window.console.log("Invalid replacements specified in validation property.  " + validationProperty.replacements[i]);
							}
						}
					}
				}
				return valid;
			}
			return false;
		}
		
		function matchSinglePattern(item, propertyName, validationProperty){
			var value = validationProperty.match;
			var key, keyLastSegments;
			if (propertyName.indexOf("|") >= 0) {
				// the pipe means that any one of the piped properties can match
				key = propertyName.substring(0, propertyName.indexOf("|"));
				keyLastSegments = propertyName.substring(propertyName.indexOf("|")+1);
				// if key matches, we can stop.  No match is not a failure, look in the next segments.
				if (matchSinglePattern(item, key, validationProperty)) {
					return true;
				} else {
					return matchSinglePattern(item, keyLastSegments, validationProperty);
				}
			} else if (propertyName.indexOf(":") >= 0) {
				// the colon is used to drill into a property
				key = propertyName.substring(0, propertyName.indexOf(":"));
				keyLastSegments = propertyName.substring(propertyName.indexOf(":")+1);
				// must have key and then check the next value
				if (item[key]) {
					return matchSinglePattern(item[key], keyLastSegments, validationProperty);
				} else {
					return false;
				}
			} else {
				// we are checking a single property
				return checkItem(item, propertyName, value, validationProperty);
			}
		}
		
		function validateSingleItem(item, contentTypes, validator){
			// first validation properties
			if (validator.info.validationProperties) {
				for (var i=0; i<validator.info.validationProperties.length; i++) {
					var validationProperty = validator.info.validationProperties[i];
					if (validationProperty.source) {
						var matchFound = matchSinglePattern(item, validationProperty.source, validationProperty);
						if (!matchFound){
							return false;
						} 
					} else {
						window.console.log("Invalid validationProperties in " + info.id + ".  No source property specified.");
						return false;
					}
				}
			}
			// now content types
			if (validator.info.contentType && contentTypes) {
				var foundMatch = false;
				var contentType = mContentTypes.getFilenameContentType(item.Name, contentTypes);
				if (contentType) {
					for (var i=0; i<validator.info.contentType.length; i++) {
						if (contentType.id === validator.info.contentType[i]) {
							foundMatch = true;
							break;
						}
					}
				}
				return foundMatch;
			} else {	
				return true;
			}
		}
	
		var validator = {info: info};
		validator.validationFunction =  dojo.hitch(validator, function(items){
			if (typeof validationItemConverter === "function") {
				items = validationItemConverter.call(this, items);
			}
			if (items) {
				if (dojo.isArray(items)){
					if ((this.info.forceSingleItem || this.info.uriTemplate) && items.length !== 1) {
						return false;
					}
					if (items.length < 1){
						return false;
					}
				} else {
					items = [items];
				}
				
				for(var i in items){
					if(!validateSingleItem(items[i], contentTypes, this)){
						return false;
					}
				}
				return true;
			}
			return false;
		});
		validator.generatesURI = dojo.hitch(validator, function() {
			return !!this.info.uriTemplate;
		});
		
		validator.getURI = dojo.hitch(validator, function(item) {
			if (this.info.uriTemplate) {
				var variableExpansions = {};
				// we need the properties of the item
				for (var property in item){
					if(item.hasOwnProperty(property)){
						variableExpansions[property] = item[property];
					}
				}
				// now we need the variable expansions collected during validation.  
				if (this.info.validationProperties) {
					for (var i=0; i<this.info.validationProperties.length; i++) {
						var validationProperty = this.info.validationProperties[i];
						if (validationProperty.source && validationProperty.variableName) {
							// we may have just validated this item.  If so, we don't need to recompute the variable value.
							var alreadyCached = validationProperty.itemCached === item && validationProperty.variableValue;
							if (!alreadyCached) {
								matchSinglePattern(item, validationProperty.source, validationProperty);
							}
							if (!item[validationProperty.variableName]) {
								variableExpansions[validationProperty.variableName] = validationProperty.variableValue;
							} else {
								window.console.log("Variable name " + validationProperty.variableName + " in the extension " + this.info.id + " conflicts with an existing property in the item metadata.");
							}
						}
					}
				}
				// special properties.  Should already be in metadata.  See bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
				variableExpansions.OrionHome = orionHome;
				var uriTemplate = new URITemplate(this.info.uriTemplate);
				return window.decodeURIComponent(uriTemplate.expand(variableExpansions));
			} 
			return null;
		});
		return validator;
	};
	
	// Turns an info object containing the service properties and the service (or reference) into Command options.
	extensionCommandUtils._createCommandOptions = function(/**Object*/ info, /**Service*/ serviceOrReference, serviceRegistry, contentTypesMap, /**boolean*/ createNavigateCommandCallback, /**optional function**/ validationItemConverter) {
		var commandOptions = {
			name: info.name,
			image: info.image,
			id: info.id || info.name,
			tooltip: info.tooltip,
			isEditor: info.isEditor
		};
		var validator = extensionCommandUtils._makeValidator(info, serviceRegistry, contentTypesMap, validationItemConverter);
		commandOptions.visibleWhen = validator.validationFunction;
		
		if (createNavigateCommandCallback) {
			if (validator.generatesURI()) {
				commandOptions.hrefCallback = dojo.hitch(validator, function(data){
					var item = dojo.isArray(data.items) ? data.items[0] : data.items;
					return this.getURI(item);
				});
			} else {
				commandOptions.callback = dojo.hitch(info, function(data){
					var shallowItemsClone;
					if (this.forceSingleItem) {
						var item = dojo.isArray() ? data.items[0] : data.items;
						shallowItemsClone = extensionCommandUtils._cloneItemWithoutChildren(item);
					} else {
						if (dojo.isArray(data.items)) {
							shallowItemsClone = [];
							for (var j = 0; j<data.items.length; j++) {
								shallowItemsClone.push(extensionCommandUtils._cloneItemWithoutChildren(data.items[j]));
							}
						} else {
							shallowItemsClone = extensionCommandUtils._cloneItemWithoutChildren(data.items);
						}
					}
					if(serviceOrReference.run) {
						serviceOrReference.run(shallowItemsClone);
					} else if (serviceRegistry) {
						serviceRegistry.getService(serviceOrReference).run(shallowItemsClone);
					}
				});
			}  // otherwise the caller will make an appropriate callback for the extension
		}
		return commandOptions;
	};
	
	extensionCommandUtils.getOpenWithCommands = function(commandService) {
		var openWithCommands = [];
		for (var commandId in commandService._commandList) {
			var command = commandService._commandList[commandId];
			if (command.isEditor) {
				openWithCommands.push(command);
			}
		}
		return openWithCommands;
	};
	
	return extensionCommandUtils;
});