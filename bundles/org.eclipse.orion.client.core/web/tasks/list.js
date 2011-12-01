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

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/selection', 'orion/fileClient', 'orion/searchClient', 'orion/taskClient', 'orion/status', 'orion/globalCommands',
        'orion/taskTable', 'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mCommands, mSelection, mFileClient, mSearchClient, mTaskClient, mStatus, mGlobalCommands, mTaskTable) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var selection = new mSelection.Selection(serviceRegistry);	
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			var taskClient = new mTaskClient.TaskClient(serviceRegistry);
				
			// global commands
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			var taskTable = new mTaskTable.TasksExplorer(serviceRegistry, selection, "tasks-lisk", "pageActions", "selectionTools");
			
			taskClient.registreTaskChangeListener(function(taskList){
				dojo.hitch(taskTable, taskTable.mergeTasks)(taskList);
			});
			
		});
	});
	
});
