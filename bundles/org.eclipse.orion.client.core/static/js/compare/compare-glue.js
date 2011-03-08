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
	var sBSCompareContainerEditor = new orion.SBSCompareContainer("left-viewer" , "right-viewer");
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
		
		sBSCompareContainerEditor.resolveDiff(diffURI, 
											  fileURI,
				  function(){
					var leftTH = document.getElementById("left-viewer-title");
					var rightTH = document.getElementById("right-viewer-title");
					leftTH.innerHTML = "File  : " + fileURI;
					rightTH.innerHTML = "File On Git : " + fileURI;
				  });
	}
	
});

