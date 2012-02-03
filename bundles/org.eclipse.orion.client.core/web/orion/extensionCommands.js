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
	extensionCommandUtils._createOpenWithCommands = function(serviceRegistry, contentTypesMap) {
		function getEditors() {
			var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.editor");
			var editors = [];
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], id = serviceRef.getProperty("id");
				editors.push({
					id: id,
					name: serviceRef.getProperty("name"),
					uriTemplate: new URITemplate(serviceRef.getProperty("orionTemplate") || serviceRef.getProperty("uriTemplate"))
				});
			}
			return editors;
		}

		function toNamePattern(exts, filenames) {
			exts = exts.map(function(ext) { return mRegex.escape(ext); });
			filenames = filenames.map(function(ext) { return mRegex.escape(ext); });
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
				var exts = [], filenames = [];
				for (var j=0; j < editorContentTypes.length; j++) {
					var contentType = contentTypesMap[editorContentTypes[j]];
					if (contentType) {
						exts = exts.concat(contentType.extension);
						filenames = filenames.concat(contentType.filename);	
					}
				}
				var uriTemplate = editor.uriTemplate;
				var validationProperties = { Directory: false, Name: toNamePattern(exts, filenames) };
				var properties = {
						name: editor.name || editor.id,
						id: "eclipse.openWithCommand." + editor.id,
						tooltip: editor.name,
						validationProperties: validationProperties,
						href: true,
						forceSingleItem: true,
						isEditor: (isDefaultEditor ? "default": "editor") // Distinguishes from a normal fileCommand
					};
				// Pretend that this is a real service
				var fakeService = { run: dojo.hitch(uriTemplate, uriTemplate.expand) };
				fileCommands.push({properties: properties, service: fakeService});
			}
		}
		return fileCommands;
	};
	
	// Turns an info object containing the service properties and the service (or reference) into Command options.
	extensionCommandUtils._createCommandOptions = function(/**Object*/ info, /**Service*/ serviceOrReference, serviceRegistry, /**boolean*/ createNavigateCommandCallback, /**optional function**/ validationItemConverter) {
		function getPattern(wildCard){
			var pattern = '^';
	        for (var i = 0; i < wildCard.length; i++ ) {
	                var c = wildCard.charAt(i);
	                switch (c) {
	                        case '?':
	                                pattern += '.';
	                                break;
	                        case '*':
	                                pattern += '.*';
	                                break;
	                        default:
	                                pattern += c;
	                }
	        }
	        pattern += '$';
	        
	        return new RegExp(pattern);
		}
		
		function matchSinglePattern(item, keyWildCard, valueWildCard){
			var keyPattern, key;
			if(keyWildCard.indexOf(":")>=0){
				keyPattern = getPattern(keyWildCard.substring(0, keyWildCard.indexOf(":")));
				var keyLastSegments = keyWildCard.substring(keyWildCard.indexOf(":")+1);
				for(key in item){
					if(keyPattern.test(key)){
						if(matchSinglePattern(item[key], keyLastSegments, valueWildCard)){
							return true;
						}
					}
				}
			}
			
			keyPattern = getPattern(keyWildCard);
			for(key in item){
				if(keyPattern.test(key)){
					if(typeof(valueWildCard)==='string'){
						var valuePattern = getPattern(valueWildCard);
						if(valuePattern.test(item[key])){
							return true;
						}
					}else{
						if(valueWildCard===item[key]){
							return true;
						}
					}
				}
			}
			return false;
		}
		
		function validateSingleItem(item, validationProperties){
			for(var keyWildCard in validationProperties){
				var matchFound = matchSinglePattern(item, keyWildCard, validationProperties[keyWildCard]);
				if(!matchFound){
					return false;
				}
			}
			return true;
		}
		
		var commandOptions = {
			name: info.name,
			image: info.image,
			id: info.id || info.name,
			tooltip: info.tooltip,
			visibleWhen: dojo.hitch(info, function(items){
				if (typeof validationItemConverter === "function") {
					items = validationItemConverter(items);
				}
				if(dojo.isArray(items)){
					if ((this.forceSingleItem || this.href) && items.length !== 1) {
						return false;
					}
					if(!this.forceSingleItem && items.length < 1){
						return false;
					}
				} else{
					items = [items];
				}
				
				if(!this.validationProperties){
					return true;
				}
				
				for(var i in items){
					if(!validateSingleItem(items[i], this.validationProperties)){
						return false;
					}
				}
				return true;
				
			}),
			isEditor: info.isEditor
		};
		
		if (createNavigateCommandCallback) {
			if (info.href) {
				commandOptions.hrefCallback = dojo.hitch(info, function(data){
					var item = dojo.isArray(data.items) ? data.items[0] : data.items;
					var shallowItemClone = extensionCommandUtils._cloneItemWithoutChildren(item);
					if(serviceOrReference.run) {
						return serviceOrReference.run(shallowItemClone);
					} else if (serviceRegistry) {
						return serviceRegistry.getService(serviceOrReference).run(shallowItemClone);
					}
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
		for (var commandId in commandService._objectScope) {
			var command = commandService._objectScope[commandId];
			if (command.isEditor) {
				openWithCommands.push(command);
			}
		}
		return openWithCommands;
	};
	
	return extensionCommandUtils;
});