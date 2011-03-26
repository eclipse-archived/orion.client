/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
dojo.addOnLoad(function(){
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	var canvas = document.getElementById("diff-canvas");
	var compareMergeContainer = new orion.CompareMergeContainer("left-viewer" , "right-viewer" , canvas);
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var hash = splitted[1];
		var params = hash.split("?");
		var diffURI = null;
		var fileURI = null;
		if(params.length === 1){
			fileURI = params[0];
		} else {
			fileURI = params[1];
			diffURI = params[0];
		}
		
		compareMergeContainer.resolveDiff(diffURI, 
											  fileURI,
				  function(){
					  dojo.place(document.createTextNode("File: " + fileURI), "left-viewer-title", "only");				  
					  dojo.place(document.createTextNode("File On Git: " + fileURI), "right-viewer-title", "only");				  
				  },
				  function(errorResponse , ioArgs){
					  var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
					  dojo.place(document.createTextNode(message), "left-viewer-title", "only");				  
					  dojo.place(document.createTextNode(message), "right-viewer-title", "only");				  
					  dojo.style("left-viewer-title", "color", "red");
					  dojo.style("right-viewer-title", "color", "red");
				  }
		);
	}
	
		
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

