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
	var sBSCompareContainer = new orion.SBSCompareContainer("left-viewer" , "right-viewer");
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
		
		sBSCompareContainer.resolveDiff(diffURI, 
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
				  },
				  fileURI
		);
	}
	
});

