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
	'orion/highlight',
	'orion/widgets/nav/staticContentTypes',
	'orion/widgets/nav/fileBrowser'
], function(mBootstrap, PageUtil, mContentTypes, mFileClient, Highlight, mStaticContentTypes, mFileBrowser) {
	mBootstrap.startup().then(function(core) {
		var cTypeService = new mContentTypes.ContentTypeRegistry(mStaticContentTypes.ContentTypes);
		var fBrowser = new mFileBrowser.FileBrowser({
			parent: "fileBrowser",//Required 
			fileClient: new mFileClient.FileClient(core.serviceRegistry), //Required. But will be different implementation that does not require service registration
			syntaxHighlighter: new Highlight.SyntaxHighlighter(core.serviceRegistry, cTypeService), //Required. But will be different implementation that does not require service registration
			contentTypeService: cTypeService, //new mContentTypes.ContentTypeRegistry(core.serviceRegistry),  //Required. But will be different implementation that does not require service registration
			preferences: null//core.preferences //Optional. If defined, should not depend on bootstrap
		}); 
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			fBrowser.refresh(PageUtil.hash());
		});
		fBrowser.refresh(PageUtil.hash());
	});
});
