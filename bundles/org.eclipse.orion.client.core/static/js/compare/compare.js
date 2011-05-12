/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
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
	new eclipse.FileClient(serviceRegistry, pluginRegistry);

	eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
	var sBSCompareContainer = new orion.SBSCompareContainer(serviceRegistry ,"left-viewer" , "right-viewer");
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var hash = splitted[1];
		
		sBSCompareContainer.resolveDiff(hash, 
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
	}
	
});

