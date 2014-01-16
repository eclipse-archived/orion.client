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
/*global define window console eclipse orion*/

define([
	'orion/bootstrap', 
	'orion/PageUtil', 
	'orion/fileClient',
	'orion/widgets/browse/fileBrowser',
	'orion/Deferred'
], function(mBootstrap, PageUtil, mFileClient, mFileBrowser, mDeferred) {
	mBootstrap.startup().then(function(core) {
		var fBrowser = new mFileBrowser.FileBrowser({
			parent: "fileBrowser", 
			//maxEditorHeight: 800,
			fileClient: new mFileClient.FileClient(core.serviceRegistry)
		}); 
		window.addEventListener("hashchange", function() { //$NON-NLS-0$
			fBrowser.refresh(PageUtil.hash());
		});
		fBrowser.refresh(PageUtil.hash());
	});
});
