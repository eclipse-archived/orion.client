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
	// Git operations
	new eclipse.GitService(serviceRegistry);

	var controller = new orion.GitStatusController(serviceRegistry , "unstagedZone" , "stagedZone");
	var hash = dojo.hash();
	controller.getGitStatus(dojo.hash());
	document.title =  controller.findFolderName();

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	
	//every time the user manually changes the hash, we need to load the git status
	dojo.subscribe("/dojo/hashchange", controller, function() {
		controller.getGitStatus(dojo.hash());
	});
	
});
