/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/*global define document */

define(['orion/bootstrap', 'orion/globalCommands', 'orion/webui/littlelib', 'orion/selection', 'orion/commandRegistry',
	'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/operationsClient',
	'orion/status', 'orion/progress', 'orion/links', 'orion/projectClient', 'orion/projects/projectExplorer',
	'orion/projectCommands'],
 
	function( mBootstrap, mGlobalCommands, lib, mSelection, mCommandRegistry, mFileClient, mSearchClient, mDialogs,
			mOperationsClient, mStatus, mProgress, mLinks, mProjectClient, mProjectExplorer, ProjectCommands ){
		
		mBootstrap.startup().then(
		
			function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			new mDialogs.DialogService(serviceRegistry);
			var selection = new mSelection.Selection(serviceRegistry);
			var commandRegistry = new mCommandRegistry.CommandRegistry({selection: selection});
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var progress = new mProgress.ProgressService(serviceRegistry, operationsClient, commandRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			// ...
			var linkService = new mLinks.TextLinkService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var projectClient = new mProjectClient.ProjectClient(serviceRegistry, fileClient);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});

			
			mGlobalCommands.generateBanner("orion-projects", serviceRegistry, commandRegistry, preferences, searcher );	
			
			var newActionsScope = "newProjectActions";
			
				
			/* Create the content */
			
			var projectsContainer = lib.node("projectsContainer");
			projectsContainer.className = "orionProject";
			
			var actionsSpan = document.createElement("span");
			actionsSpan.id = "projectsActions";
			actionsSpan.style.display = "block";
			actionsSpan.style.minWidth = "90%";
			actionsSpan.style.marginLeft = "5%";
			actionsSpan.style.marginTop = "30px";
			actionsSpan.style.marginBottom = "10px";
			var newActionsSpan = document.createElement("span");
			newActionsSpan.id = newActionsScope;
			actionsSpan.appendChild(newActionsSpan);
			
			projectsContainer.appendChild(actionsSpan);
			
			var projectsSpan = document.createElement("span");
			projectsSpan.id = "projectsSpan";
			projectsContainer.appendChild(projectsSpan);
			
			var projectExplorer = new mProjectExplorer.ProjectExplorer(projectsSpan, serviceRegistry, selection, commandRegistry);
			
			/* Add actions */
		
			commandRegistry.addCommandGroup(newActionsScope, "orion.projectsNewGroup", 1, "Create Project", null, null, "core-sprite-addcontent"); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "orion.project.create.basic", 1, "orion.projectsNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(newActionsScope, "orion.project.create.fromfile", 2, "orion.projectsNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			ProjectCommands.createProjectCommands(serviceRegistry, commandRegistry, projectExplorer, fileClient, projectClient);
			
			function initTitleBar(projects){
				mGlobalCommands.setPageTarget({task: "Projects", target: projects, breadcrumbTarget: {Name: "Projects", Children: projects, Parents: []},
					makeBreadcrumbLink: function(seg, location) {
					},
					serviceRegistry: serviceRegistry, commandService: commandRegistry}); 
			}
			
			initTitleBar([]);
			
			projectExplorer.changedItem = function(){
				progress.progress(fileClient.loadWorkspace(), "Getting workspace information").then(function(workspace){
					progress.progress(projectClient.readAllProjects(workspace), "Listing projects").then(function(projects){
						initTitleBar(projects);
						lib.empty(newActionsSpan);
						commandRegistry.renderCommands(newActionsScope, newActionsSpan, workspace, projectExplorer, "tool");
						projectExplorer.loadProjects(projects);
					});
				});
			};
			
			projectExplorer.changedItem();
		});
	}	
);