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

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/selection', 'orion/fileClient', 'orion/searchClient', 'orion/operationsClient', 'orion/status', 'orion/progress', 'orion/globalCommands',
        'orion/operationsTable', 'orion/operationsCommands', 'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
		function(require, dojo, mBootstrap, mCommands, mSelection, mFileClient, mSearchClient, mOperationsClient, mStatus, mProgress, mGlobalCommands, mOperationsTable, mOperationsCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var selection = new mSelection.Selection(serviceRegistry);	
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			new mProgress.ProgressService(serviceRegistry, operationsClient);
				
			var operationsTable = new mOperationsTable.OperationsExplorer(serviceRegistry, selection, "tasks-lisk", "pageActions", "selectionTools");
			
			// global commands
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			mOperationsCommands.createOperationsCommands(serviceRegistry, commandService, operationsTable, operationsClient);
			
			commandService.addCommandGroup("eclipse.taskGroup.unlabeled", 100, null, null, "pageActions");
			commandService.addCommandGroup("eclipse.selectionGroup", 500, "More", null, "selectionTools");
			
			commandService.registerCommandContribution("eclipse.removeCompletedOperations", 1, "pageActions", "eclipse.taskGroup.unlabeled");
			commandService.registerCommandContribution("eclipse.removeOperation", 1);
			commandService.registerCommandContribution("eclipse.removeOperation", 1, "selectionTools", "eclipse.selectionGroup");
			commandService.registerCommandContribution("eclipse.cancelOperation", 2);
			commandService.registerCommandContribution("eclipse.cancelOperation", 2, "selectionTools", "eclipse.selectionGroup");
			
			function displayError(error){
				var display = [];
				display.Severity = "Error";
				display.HTML = false;
				
				try {
					var jsonData = JSON.parse(error);
					display.Message = jsonData.DetailedMessage ? jsonData.DetailedMessage : jsonData.Message;
				} catch (Exception) {
					display.Message = error;
				}
				
				serviceRegistry.getService("orion.page.message").setProgressResult(display);
			}
			
			try{
				operationsClient.addOperationChangeListener(function(taskList){
					dojo.hitch(operationsTable, operationsTable.mergeOperations)(taskList);
				});
			}catch (e) {
				displayError(e);
				dojo.hitch(operationsTable, operationsTable.mergeOperations)({Children: []});
			}
			window.addEventListener("storage", function(e){
				try{
					if(mGlobalCommands.getAuthenticationIds().indexOf(e.key)>=0){
						dojo.hitch(operationsTable, operationsTable.loadOperations)({Children: []});
						operationsClient.resetChangeListeners();
					}
				}catch (e) {
					displayError(e);
					dojo.hitch(operationsTable, operationsTable.mergeOperations)({Children: []});
				}
			}, false);
			
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		});
	});
	
});
