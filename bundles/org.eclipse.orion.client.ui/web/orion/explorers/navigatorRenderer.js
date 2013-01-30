/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window */
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/navigate/nls/messages', 'require', 'orion/Deferred', 'orion/webui/littlelib', 'orion/explorers/explorer', 'orion/explorers/navigationUtils', 'orion/extensionCommands', 'orion/contentTypes'],
		function(messages, require, Deferred, lib, mExplorer, mNavUtils, mExtensionCommands){
		
	/* Internal */
	function isImage(contentType) {
		switch (contentType && contentType.id) {
			case "image/jpeg": //$NON-NLS-0$
			case "image/png": //$NON-NLS-0$
			case "image/gif": //$NON-NLS-0$
			case "image/ico": //$NON-NLS-0$
			case "image/tiff": //$NON-NLS-0$
			case "image/svg": //$NON-NLS-0$
				return true;
		}
		return false;
	}
	
	/* Internal */
	function addImageToLink(contentType, link, location) {
		var image;
		switch (contentType && contentType.id) {
			case "image/jpeg": //$NON-NLS-0$
			case "image/png": //$NON-NLS-0$
			case "image/gif": //$NON-NLS-0$
			case "image/ico": //$NON-NLS-0$
			case "image/tiff": //$NON-NLS-0$
			case "image/svg": //$NON-NLS-0$
				image = document.createElement("img"); //$NON-NLS-0$
				image.src = location;
				image.classList.add("thumbnail"); //$NON-NLS-0$
				break;
			default:
				if (contentType && contentType.image) {
					image = document.createElement("img"); //$NON-NLS-0$
					image.src = contentType.image;
					// to minimize the height/width in case of a large one
					image.classList.add("thumbnail"); //$NON-NLS-0$
				} else {	
					image = document.createElement("span"); //$NON-NLS-0$
					image.className = "core-sprite-file_model modelDecorationSprite"; //$NON-NLS-0$
				}
				break;
		}
		if (link.firstChild) {
			link.insertBefore(image, link.firstChild);
		} else {
			link.appendChild(image);
		}
	}
		
	/* Exported so that it can be used by other UI that wants to use navigator-style links 
	 * folderURL should be the page you want to direct folders to (such as navigator).  Using a blank string will just hash the current page.
	 * item is a json object describing an Orion file or folder
	 * commandService and contentTypeService  are necessary to compute the proper editor for a file.  The command service must be a synchronous, in-page
	 * service, not retrieved from the service registry.
	 * openWithCommands and defaultEditor will be computed if not provided.  However callers must have already processed the open with
	 * service extension and added to the command registry (such as done in mExtensionCommands._createOpenWithCommands(serviceRegistry, contentTypesCache)).
	 * linkProperties gives additional properties to mix in to the HTML anchor element.
	 */
	function createLink(folderPageURL, item, idPrefix, commandService, contentTypeService, /* optional */ openWithCommands, /* optional */defaultEditor, /* optional */ linkProperties) {
		var link;
		if (item.Directory) {
			link = document.createElement("a"); //$NON-NLS-0$
			link.className = "navlinkonpage"; //$NON-NLS-0$
			link.id = idPrefix+"NameLink"; //$NON-NLS-0$
			link.href = folderPageURL + "#" + item.ChildrenLocation; //$NON-NLS-0$
			link.appendChild(document.createTextNode(item.Name));
		} else {
			var i;			
			// Images: always generate link to file. Non-images: use the "open with" href if one matches,
			// otherwise use default editor.
			if (!openWithCommands) {
				openWithCommands = mExtensionCommands.getOpenWithCommands(commandService);
			}
			if (!defaultEditor) {
				for (i=0; i < openWithCommands.length; i++) {
					if (openWithCommands[i].isEditor === "default") { //$NON-NLS-0$
						defaultEditor = openWithCommands[i];
					}
				}
			}
			link = document.createElement("a"); //$NON-NLS-0$
			link.className= "navlink targetSelector"; //$NON-NLS-0$
			link.id = idPrefix+"NameLink"; //$NON-NLS-0$
			if (linkProperties && typeof linkProperties === "object") { //$NON-NLS-0$
				Object.keys(linkProperties).forEach(function(property) {
					link[property] = linkProperties[property];
				});
			}
			link.appendChild(document.createTextNode(item.Name)); //$NON-NLS-0$

			var href = item.Location, foundEditor = false;
			for (i=0; i < openWithCommands.length; i++) {
				var openWithCommand = openWithCommands[i];
				if (openWithCommand.visibleWhen(item)) {
					href = openWithCommand.hrefCallback({items: item});
					foundEditor = true;
					break; // use the first one
				}
			}
			Deferred.when(contentTypeService.getFileContentType(item), function(contentType) {
				if (!foundEditor && defaultEditor && !isImage(contentType)) {
					href = defaultEditor.hrefCallback({items: item});
				}
				addImageToLink(contentType, link, item.Location);			
				link.href = href;
			});
		}
		return link;
	}
		
	/**
	 * Renders json items into columns in the tree
	 */
	function NavigatorRenderer (options, explorer, commandService, contentTypeService) {
		this.explorer = explorer;
		this.commandService = commandService;
		this.contentTypeService = contentTypeService;
		this.openWithCommands = null;
		this.actionScopeId = options.actionScopeId;
		
		this._init(options);
		this.target = "_self"; //$NON-NLS-0$
	}
	NavigatorRenderer.prototype = new mExplorer.SelectionRenderer(); 
	
	// we are really only using the header for a spacer at this point.
	NavigatorRenderer.prototype.getCellHeaderElement = function(col_no){
		switch(col_no){
		case 0:
		case 1:
		case 2:
			var th = document.createElement("th"); //$NON-NLS-0$
			th.style.height = "8px"; //$NON-NLS-0$
		}
	};

	/**
	 * Sets the link target to be used for file links.
	 * @param {String} target The target (eg. "new", "_self").
	 */
	NavigatorRenderer.prototype.setTarget = function(target){
		this.target = target;
	};
	
	NavigatorRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){

		case 0:
			var col = document.createElement('td'); //$NON-NLS-0$
			var span = document.createElement("span"); //$NON-NLS-0$
			span.id = tableRow.id+"MainCol"; //$NON-NLS-0$
			col.appendChild(span);
			span.className = "mainNavColumn"; //$NON-NLS-0$
			var link;
			if (item.Directory) {
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				var image = this.getExpandImage(tableRow, span);
				link = createLink("", item, tableRow.id, this.commandService, this.contentTypeService);
				span.appendChild(link); //$NON-NLS-0$
				this.explorer._makeDropTarget(item, tableRow);
				this.explorer._makeDropTarget(item, link);
			} else {
				var i;			
				// Images: always generate link to file. Non-images: use the "open with" href if one matches,
				// otherwise use default editor.
				if (!this.openWithCommands) {
					this.openWithCommands = mExtensionCommands.getOpenWithCommands(this.commandService);
					for (i=0; i < this.openWithCommands.length; i++) {
						if (this.openWithCommands[i].isEditor === "default") { //$NON-NLS-0$
							this.defaultEditor = this.openWithCommands[i];
						}
					}
				}
				link = createLink("", item, tableRow.id, this.commandService, this.contentTypeService, this.openWithCommands, this.defaultEditor, { target: this.target });
				span.appendChild(link); //$NON-NLS-0$
			}
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
			// render any inline commands that are present.
			if (this.actionScopeId) {
				this.commandService.renderCommands(this.actionScopeId, span, item, this.explorer, "tool", null, true); //$NON-NLS-0$
			}
			return col;
		case 1:
			var dateColumn = document.createElement('td'); //$NON-NLS-0$
			if (item.LocalTimeStamp) {
				var fileDate = new Date(item.LocalTimeStamp);
				dateColumn.textContent = fileDate.toLocaleString();
			}
			return dateColumn;
		case 2:
			var sizeColumn = document.createElement('td'); //$NON-NLS-0$
			if (!item.Directory && typeof item.Length === "number") { //$NON-NLS-0$
				var length = parseInt(item.Length, 10),
					kb = length / 1024;
				sizeColumn.textContent = Math.ceil(kb).toLocaleString() + " KB"; //$NON-NLS-0$
			}
			sizeColumn.style.textAlign = "right"; //$NON-NLS-0$
			return sizeColumn;
		}
	};
	NavigatorRenderer.prototype.constructor = NavigatorRenderer;
	
	//return module exports
	return {
		NavigatorRenderer: NavigatorRenderer,
		createLink: createLink
	};
});
