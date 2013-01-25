/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global orion window console define localStorage*/
/*jslint browser:true*/


define(['i18n!orion/settings/nls/messages', 'require', 'orion/commands', 'orion/section', 'orion/selection', 'orion/explorers/navigationUtils', 'orion/explorers/explorer', 'orion/explorers/explorer-table', 'projects/DriveTreeRenderer', 'orion/explorers/navigatorRenderer', 'orion/fileClient', 'orion/Deferred', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/contentTypes', 'orion/fileCommands' ], 
	
	function(messages, require, mCommands, mSection, mSelection, mNavUtils, mExplorer, mExplorerTable, DriveTreeRenderer, mNavigatorRenderer,  mFileClient, Deferred, mStatus, mProgress, mOperationsClient, mContentTypes, mFileCommands ) {

		function ProjectNavigation( project, anchor, serviceRegistry, commandService ){
		
			this.commandService = commandService;
			this.serviceRegistry = serviceRegistry;
			var isExpanded = false;
			var that = this;
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var progress = new mProgress.ProgressService(serviceRegistry, operationsClient);
			
			this.anchor = anchor;
			
			document.addEventListener( 'build', that.updateNavigation.bind(that), false);
			
			this.anchor.innerHTML = this.template;
			
			this.workingSetNode = this.anchor.firstChild.children[1];
		
			this.workingSetSection = new mSection.Section(this.workingSetNode, {
					id: "workingset", //$NON-NLS-0$
					title: "Working Set", //$NON-NLS-0$
					content: '<div id="WorkingSet"></div>', //$NON-NLS-0$
					preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: true,
					useAuxStyle: true,
					slideout: true,
					onExpandCollapse: function(isExpanded, section) {
						commandService.destroy(section.selectionNode);
						if (isExpanded) {
							commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that, "button"); //$NON-NLS-0$
						}
				}
			});	
			
			this.drivesNode = this.anchor.firstChild.children[2];
		
			this.workingSetSection = new mSection.Section(this.workingSetNode, {
					id: "drives", //$NON-NLS-0$
					title: "Drives", //$NON-NLS-0$
					content: '<div id="Drives"></div>', //$NON-NLS-0$
					preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: true,
					useAuxStyle: true,
					slideout: true,
					onExpandCollapse: function(isExpanded, section) {
						commandService.destroy(section.selectionNode);
						if (isExpanded) {
							commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that, "button"); //$NON-NLS-0$
						}
				}
			});	
			
			this.repositoriesNode = this.anchor.firstChild.children[3];
		
			this.workingSetSection = new mSection.Section(this.workingSetNode, {
					id: "repositories", //$NON-NLS-0$
					title: "Repositories", //$NON-NLS-0$
					content: '<div id="Repositories"></div>', //$NON-NLS-0$
					preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: true,
					useAuxStyle: true,
					slideout: true,
					onExpandCollapse: function(isExpanded, section) {
						commandService.destroy(section.selectionNode);
						if (isExpanded) {
							commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that, "button"); //$NON-NLS-0$
						}
				}
			});	
			
			var fileClient = new mFileClient.FileClient( serviceRegistry );			
					
			this.selection = new mSelection.Selection( serviceRegistry, "orion.directoryPrompter.selection" ); //$NON-NLS-0$
			
			var projectCommandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: this.selection});

			var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);

			this.explorer = new mExplorerTable.FileExplorer({
				treeRoot: {children:[]}, 
				selection: this.selection, 
				serviceRegistry: serviceRegistry,
				fileClient: fileClient, 
				parentId: "Drives", 
				rendererFactory: function(explorer) {  //$NON-NLS-0$
				
					var renderer = new DriveTreeRenderer({
						checkbox: false, 
						cachePrefix: "Navigator"}, explorer, projectCommandService, contentTypeService);
						
					return renderer;
			}}); //$NON-NLS-0$
			
			mFileCommands.createAndPlaceFileCommandsExtension(serviceRegistry, projectCommandService, this.explorer );
			
			var myexplorer = this.explorer;
			var loadedWorkspace = fileClient.loadWorkspace("");
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				myexplorer.loadResourceList( workspace.DriveLocation, true, null );
			});
			
			var saveConfigCommand = new mCommands.Command({
				name: 'Configure', //messages["Install"],
				tooltip: 'Configure Project',
				id: "orion.projectConfiguration", //$NON-NLS-0$
				callback: function(data) {
					console.log( 'configure project' );
//					driveListContainer.newDrive();
				}.bind(this)
			});
			
			this.commandService.addCommand(saveConfigCommand);
			this.commandService.registerCommandContribution("projectConfiguration", "orion.projectConfiguration", 1, /* not grouped */ null, false, /* no key binding yet */ null, null ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands("projectConfiguration", "projectConfiguration", this, this, "button"); //$NON-NLS-0$
		}
		
		var workingSetNode;
		ProjectNavigation.prototype.workingSetNode = workingSetNode;
		
		var drivesNode;
		ProjectNavigation.prototype.workingSetNode = drivesNode;
		
		var repositoriesNode;
		ProjectNavigation.prototype.workingSetNode = repositoriesNode;
		
		
		var anchor;
		ProjectNavigation.prototype.anchor = anchor;
		
		var template = '<div>' +
							'<div id="configuration"></div>' +
							'<div id="workingSet">' +
							'<div>' +
							'<div id="drives">' +
							'<div>' +
							'<div id="repositories">' +
							'<div>' +
						'</div>';
		ProjectNavigation.prototype.template = template;
		
		function updateNavigation(){
			var serviceRegistry = this.serviceRegistry;
		
			var fileClient = new mFileClient.FileClient( serviceRegistry );			
					
			this.selection = new mSelection.Selection( serviceRegistry, "orion.directoryPrompter.selection" ); //$NON-NLS-0$
			
			var projectCommandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: this.selection});

			var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);

			this.explorer = new mExplorerTable.FileExplorer({
				treeRoot: {children:[]}, 
				selection: this.selection, 
				serviceRegistry: serviceRegistry,
				fileClient: fileClient, 
				parentId: "Drives", 
				rendererFactory: function(explorer) {  //$NON-NLS-0$
				
					var renderer = new DriveTreeRenderer({
						checkbox: false, 
						cachePrefix: "Navigator"}, explorer, projectCommandService, contentTypeService);
						
					return renderer;
			}}); //$NON-NLS-0$
			
			mFileCommands.createAndPlaceFileCommandsExtension(serviceRegistry, projectCommandService, this.explorer );
			
			var myexplorer = this.explorer;
			var loadedWorkspace = fileClient.loadWorkspace("");
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				myexplorer.loadResourceList( workspace.DriveLocation, true, null );
			});
		}
		
		ProjectNavigation.prototype.updateNavigation = updateNavigation;
		
		var workingSetSection;
		ProjectNavigation.prototype.workingSetSection = workingSetSection;
			
		return ProjectNavigation;
	}
);
			