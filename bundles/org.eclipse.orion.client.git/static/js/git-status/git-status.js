/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
dojo.require("dojo.hash");
dojo.addOnLoad(function(){
	// initialize service registry and EAS services
	var serviceRegistry = new eclipse.ServiceRegistry();
	var pluginRegistry = new eclipse.PluginRegistry(serviceRegistry);
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	// Git operations
	new eclipse.GitService(serviceRegistry);
	// File operations

//commented out temporarily - Boris
//	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);

	var controller = new orion.GitStatusController(serviceRegistry , "unstagedZone" , "stagedZone");
	controller.getGitStatus(dojo.hash());

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
//commented out temporarily - Boris
//	initTitleBar(fileClient);
	//every time the user manually changes the hash, we need to load the git status
	dojo.subscribe("/dojo/hashchange", controller, function() {
		controller.getGitStatus(dojo.hash());
//commented out temporarily - Boris
//		initTitleBar(fileClient);
	});
	
});

function initTitleBar(){
	var fileURI = null;
	var folder = dojo.hash().split("git/status");
	if(folder.length === 2)
		fileURI = folder[1];
	if(fileURI){
		fileClient.read(fileURI, true).then(
				dojo.hitch(this, function(metadata) {
					var titlePane = dojo.byId("pageTitle");
					if (titlePane) {
						dojo.empty(titlePane);
						new eclipse.BreadCrumbs({container: "pageTitle", resource: metadata , makeHref:makeHref});
					}
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file metadata: " + error.message);
				})
		);
	}
	
};

function makeHref(seg,location){
	fileClient.read(location, true).then(
			dojo.hitch(this, function(metadata) {
				seg.href = "/git-status.html#" + metadata.Git.StatusLocation;
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: " + error.message);
			})
	);
};


