/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window orion document */
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'orion/Deferred', 'orion/explorers/navigatorRenderer', 'orion/extensionCommands'], 
function(messages, Deferred, mNavigatorRenderer, mExtensionCommands) {

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
	 * openWithCommands and defaultEditor will be computed if not provided.  
	 */
	function createLink(folderPageURL, item, idPrefix, commandService, contentTypeService, /* optional */ openWithCommands, /* optional */defaultEditor) {
	
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
			link.target = this.target;
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

	function DriveTreeRenderer(){
		mNavigatorRenderer.NavigatorRenderer.apply(this, arguments);
	}
	
	DriveTreeRenderer.prototype = Object.create( mNavigatorRenderer.NavigatorRenderer.prototype ); 
	
	return DriveTreeRenderer;
});