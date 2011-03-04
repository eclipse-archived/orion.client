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
	var preferenceService = new eclipse.Preferences(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var controller = new orion.GitStatusController(null , splitted[1] , "unstagedZone" , "stagedZone");
		controller.getGitStatus(splitted[1]);
	
		var stageAll = document.getElementById("stageAll");
		dojo.connect(stageAll, "onclick", stageAll, function() {
			controller.stageAll();
		});
		var unstageAll = document.getElementById("unstageAll");
		dojo.connect(unstageAll, "onclick", unstageAll, function() {
			controller.unstageAll();
		});
		var commit = document.getElementById("commit");
		var commitMessage = document.getElementById("commitMessage");
		dojo.connect(commit, "onclick", commit, function() {
			controller.commit(commitMessage.value);
		});
	
	}
	
});
