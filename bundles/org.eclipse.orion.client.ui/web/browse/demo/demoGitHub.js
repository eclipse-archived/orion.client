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
/*
define([
	'orion/bootstrap', 
	'orion/fileClient',
	'orion/widgets/browse/fileBrowser'
], function(mBootstrap, mFileClient, mFileBrowser) {
	mBootstrap.startup().then(function(core) {
		var fBrowser = new mFileBrowser.FileBrowser({
			parent: "fileBrowser", 
			//maxEditorHeight: 800,
			fileClient: new mFileClient.FileClient(core.serviceRegistry)
		}); 
	});
});
*/
define(['orion/widgets/browse/fileBrowser', 'orion/serviceregistry', 'orion/pluginregistry'],
function(mFileBrowser, mServiceRegistry, mPluginRegistry) {
		// figure out plugin to install from repoURL
	var pluginURL = "http://libingw.orion.eclipse.org:8080/plugins/GitHubFilePlugin.html?repo=https://github.com/eclipse/orion.client.git";
	var serviceRegistry = new mServiceRegistry.ServiceRegistry();
	var plugins = {};
	plugins[pluginURL] = true;
	var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, {
		storage: {},
		plugins: plugins
	});
	pluginRegistry.start().then(function() {
		var fileBrowser = new mFileBrowser.FileBrowser({
			parent: "fileBrowser", 
			showBranch: true,
			//rootName: "RootName",
			//maxEditorHeight: 1800,
			serviceRegistry: serviceRegistry
		});
	})
});


