/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
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

	var fileServices = serviceRegistry.getServiceReferences("IFileService");
	var fileServiceReference;
	
	for (var i=0; i<fileServices.length; i++) {
		var info = {};
		var propertyNames = fileServices[i].getPropertyNames();
		for (var j = 0; j < propertyNames.length; j++) {
			info[propertyNames[j]] = fileServices[i].getProperty(propertyNames[j]);
		}
		if (new RegExp(info.pattern).test(dojo.hash())) {
			fileServiceReference = fileServices[i];
		}
	}

	serviceRegistry.getService(fileServiceReference).then(function(fileService) {
		var fileClient = new eclipse.FileClient(fileService);

	
		var controller = new orion.GitStatusController(serviceRegistry , "unstagedZone" , "stagedZone");
		controller.getGitStatus(dojo.hash());
	
		eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
		initTitleBar(fileClient);
		//every time the user manually changes the hash, we need to load the git status
		dojo.subscribe("/dojo/hashchange", controller, function() {
			controller.getGitStatus(dojo.hash());
			initTitleBar(fileClient);
		});
	});
	
});

function initTitleBar(fileClient){
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
						var breadcrumb = new eclipse.BreadCrumbs({container: "pageTitle", resource: metadata , makeHref:function(seg,location){makeHref(fileClient, seg,location);}});
						if(breadcrumb.path && breadcrumb.path!="")
							document.title = "Git Status - " + breadcrumb.path;
					}
					
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file metadata: " + error.message);
				})
		);
	}
	
};

function makeHref(fileClient, seg, location){
	fileClient.read(location, true).then(
			dojo.hitch(this, function(metadata) {
				seg.href = "/git-status.html#" + metadata.Git.StatusLocation;
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: " + error.message);
			})
	);
};


