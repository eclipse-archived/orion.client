/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global define*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/selection', 'orion/fileClient', 'orion/searchClient', 'orion/taskClient', 'orion/status', 'orion/progress', 'orion/globalCommands',
        'orion/taskTable', 'orion/taskCommands', 'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mCommands, mSelection, mFileClient, mSearchClient, mTaskClient, mStatus, mProgress, mGlobalCommands, mTaskTable, mTasksCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var selection = new mSelection.Selection(serviceRegistry);	
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var taskClient = new mTaskClient.TaskClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, taskClient, "statusPane", "notifications");
			new mProgress.ProgressService(serviceRegistry, taskClient);
				
			var taskTable = new mTaskTable.TasksExplorer(serviceRegistry, selection, "tasks-lisk", "pageActions", "selectionTools");
			
			// global commands
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
			mTasksCommands.createTaskCommands(serviceRegistry, commandService, taskTable, taskClient);
			
			commandService.addCommandGroup("eclipse.taskGroup.unlabeled", 100, null, null, "pageActions");
			commandService.addCommandGroup("eclipse.selectionGroup", 500, "More", null, "selectionTools");
			
			commandService.registerCommandContribution("eclipse.removeCompletedTasks", 1, "pageActions", "eclipse.taskGroup.unlabeled");
			commandService.registerCommandContribution("eclipse.removeTask", 1);
			commandService.registerCommandContribution("eclipse.removeTask", 1, "selectionTools", "eclipse.selectionGroup");
			commandService.registerCommandContribution("eclipse.cancelTask", 2);
			commandService.registerCommandContribution("eclipse.cancelTask", 2, "selectionTools", "eclipse.selectionGroup");
			
			taskClient.addTaskChangeListener(function(taskList){
				dojo.hitch(taskTable, taskTable.mergeTasks)(taskList);
			});
			
			window.addEventListener("storage", function(e){
				if(mGlobalCommands.getAuthenticationIds().indexOf(e.key)>=0){
					dojo.hitch(taskTable, taskTable.loadTasks)({Children: []});
					taskClient.resetChangeListeners();
				}
			}, false);
			
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		});
	});
	
});
