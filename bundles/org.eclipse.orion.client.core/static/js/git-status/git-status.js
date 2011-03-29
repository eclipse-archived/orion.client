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

	var splitted = window.location.href.split('#');
	var controller = null;
	if(splitted.length > 1){
		controller = new orion.GitStatusController(null , splitted[1] , "unstagedZone" , "stagedZone");
		document.title =  controller.findFolderName();
	}

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	if(splitted.length > 1){
		controller.getGitStatus(splitted[1]);
	}
	
});
