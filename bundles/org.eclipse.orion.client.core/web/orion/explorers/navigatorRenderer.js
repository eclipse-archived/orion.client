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

define(['i18n!orion/navigate/nls/messages', 'require', 'dojo', 'orion/explorers/explorer', 'orion/explorers/navigationUtils', 'orion/extensionCommands', 'orion/contentTypes', 'dojo/number', 'dojo/date/locale'],
		function(messages, require, dojo, mExplorer, mNavUtils, mExtensionCommands){
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
			return dojo.create("th", {style: "height: 8px;"}); //$NON-NLS-1$ //$NON-NLS-0$
		}
	};
		
	NavigatorRenderer.prototype.setTarget = function(target){
		this.target = target;
	};
	
	NavigatorRenderer.prototype.getCellElement = function(col_no, item, tableRow){
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
		
		function addImageToLink(contentType, link) {
			switch (contentType && contentType.id) {
				case "image/jpeg": //$NON-NLS-0$
				case "image/png": //$NON-NLS-0$
				case "image/gif": //$NON-NLS-0$
				case "image/ico": //$NON-NLS-0$
				case "image/tiff": //$NON-NLS-0$
				case "image/svg": //$NON-NLS-0$
					var thumbnail = dojo.create("img", {src: item.Location}, link, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.addClass(thumbnail, "thumbnail"); //$NON-NLS-0$
					break;
				default:
					if (contentType && contentType.image) {
						var image = dojo.create("img", {src: contentType.image}, link, "last"); //$NON-NLS-1$ //$NON-NLS-0$
						// to minimize the height/width in case of a large one
						dojo.addClass(image, "thumbnail"); //$NON-NLS-0$
					} else {	
						var fileIcon = dojo.create("span", null, link, "last"); //$NON-NLS-1$ //$NON-NLS-0$
						dojo.addClass(fileIcon, "core-sprite-file_model modelDecorationSprite"); //$NON-NLS-0$
					}
			}
		}
		
		switch(col_no){

		case 0:
			var col = document.createElement('td'); //$NON-NLS-0$
			var span = dojo.create("span", {id: tableRow.id+"MainCol"}, col, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(span, "mainNavColumn"); //$NON-NLS-0$
			var link;
			if (item.Directory) {
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, span);
				link = dojo.create("a", {className: "navlinkonpage", id: tableRow.id+"NameLink", href: "#" + item.ChildrenLocation}, span, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(item.Name), link, "last"); //$NON-NLS-0$
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
				var href = item.Location, foundEditor = false;
				for (i=0; i < this.openWithCommands.length; i++) {
					var openWithCommand = this.openWithCommands[i];
					if (openWithCommand.visibleWhen(item)) {
						href = openWithCommand.hrefCallback({items: item});
						foundEditor = true;
						break; // use the first one
					}
				}
				var contentType = this.contentTypeService.getFileContentType(item);
				if (!foundEditor && this.defaultEditor && !isImage(contentType)) {
					href = this.defaultEditor.hrefCallback({items: item});
				}				

				link = dojo.create("a", {className: "navlink targetSelector", id: tableRow.id+"NameLink", href: href, target:this.target}, span, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				addImageToLink(contentType, link);
				dojo.place(document.createTextNode(item.Name), link, "last"); //$NON-NLS-0$
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
				dateColumn.textContent = dojo.date.locale.format(fileDate);
			}
			return dateColumn;
		case 2:
			var sizeColumn = document.createElement('td'); //$NON-NLS-0$
			if (!item.Directory && typeof item.Length === "number") { //$NON-NLS-0$
				var length = parseInt(item.Length, 10),
					kb = length / 1024;
				sizeColumn.textContent = dojo.number.format(Math.ceil(kb)) + " KB"; //$NON-NLS-0$
			}
			dojo.style(sizeColumn, "textAlign", "right"); //$NON-NLS-1$ //$NON-NLS-0$
			return sizeColumn;
		}
	};
	NavigatorRenderer.prototype.constructor = NavigatorRenderer;
	
	//return module exports
	return {
		NavigatorRenderer: NavigatorRenderer
	};
});
