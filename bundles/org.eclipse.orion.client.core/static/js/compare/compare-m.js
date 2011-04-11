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

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	var canvas = document.getElementById("diff-canvas");
	
	// Git operations
	new eclipse.GitService(serviceRegistry);
	
	var compareMergeContainer = new orion.CompareMergeContainer(serviceRegistry , "left-viewer" , "right-viewer" , canvas);
	compareMergeContainer.resolveDiff(dojo.hash(), 
			  function(newFile , oldFile){
		  		dojo.place(document.createTextNode("File: " + newFile), "left-viewer-title", "only");				  
		  			dojo.place(document.createTextNode("File On Git: " + oldFile), "right-viewer-title", "only");				  
	  		  },
			  function(errorResponse , ioArgs){
				  var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
				  dojo.place(document.createTextNode(message), "left-viewer-title", "only");				  
				  dojo.place(document.createTextNode(message), "right-viewer-title", "only");				  
				  dojo.style("left-viewer-title", "color", "red");
				  dojo.style("right-viewer-title", "color", "red");
			  }
	);
	//every time the user manually changes the hash, we need to load the diff
	dojo.subscribe("/dojo/hashchange", compareMergeContainer, function() {
		compareMergeContainer.resolveDiff(dojo.hash(), 
				  function(newFile , oldFile){
			  		dojo.place(document.createTextNode("File: " + newFile), "left-viewer-title", "only");				  
			  			dojo.place(document.createTextNode("File On Git: " + oldFile), "right-viewer-title", "only");				  
		  		  },
				  function(errorResponse , ioArgs){
					  var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
					  dojo.place(document.createTextNode(message), "left-viewer-title", "only");				  
					  dojo.place(document.createTextNode(message), "right-viewer-title", "only");				  
					  dojo.style("left-viewer-title", "color", "red");
					  dojo.style("right-viewer-title", "color", "red");
				  });
	});
	
	
	// File operations
	var fileClient = new eclipse.FileClient(serviceRegistry, pluginRegistry);
		
	var nextDiffCommand = new eclipse.Command({
		name : "Next diff",
		image : "/images/compare/next-diff.gif",
		id: "orion.compare.nextDiff",
		groupId: "orion.compareGroup",
		callback : function() {
			compareMergeContainer.nextDiff();
	}});
	var copyToLeftCommand = new eclipse.Command({
		name : "Copy from right to left",
		image : "/images/compare/copy-to-left.gif",
		id: "orion.compare.copyToLeft",
		groupId: "orion.compareGroup",
		callback : function() {
			compareMergeContainer.copyToLeft();;
		}});
	commandService.addCommand(nextDiffCommand, "dom");
	commandService.addCommand(copyToLeftCommand, "dom");
		
	// Register command contributions
	commandService.registerCommandContribution("orion.compare.nextDiff", 2, "pageActions");
	commandService.registerCommandContribution("orion.compare.copyToLeft", 1, "pageActions");
		
	eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, {});
	
});

