/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window*/

define([
	'orion/bootstrap', 
	'orion/PageUtil', 
	'orion/contentTypes',
	'orion/fileClient',
	'orion/widgets/nav/fileBrowser'
], function(mBootstrap, PageUtil, mContentTypes, mFileClient, mFileBrowser) {
	mBootstrap.startup().then(function(core) {
		var fBrowser = new mFileBrowser.FileBrowser({
			parent: "fileBrowser", 
			serviceRegistry: core.serviceRegistry, //Remove later
			preferences: core.preferences, //Remove later
			contentTypeService: new mContentTypes.ContentTypeRegistry(core.serviceRegistry),//Will be an individual service not depending on service registry
			//TODO: add highlighting service here
			fileClient: new mFileClient.FileClient(core.serviceRegistry)//Will be an individual service not depending on service registry
		}); 
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			fBrowser.refresh(PageUtil.hash());
		});
		fBrowser.refresh(PageUtil.hash());
	});
});
