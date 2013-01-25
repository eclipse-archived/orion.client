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

define(['orion/bootstrap', 'orion/globalCommands', 'orion/selection', 'orion/commands', 'projects/ProjectTree', 'projects/SFTPConfiguration', 'projects/ProjectNavigation', 'projects/ProjectData', 'projects/ProjectDataManager', 'orion/PageUtil', 'orion/operationsClient', 'orion/status'],
 
	function( mBootstrap, mGlobalCommands, mSelection, mCommands, mProjectTree, mSFTPConfiguration, mProjectNavigation, mProjectData, ProjectDataManager, PageUtil, mOperationsClient, mStatus ){
		
		var serviceRegistry;
		var preferences;
		var commandService;
	
		function createTestData(){
			
			var testData = [];

			return testData;
		}
	
		function fetchProjectData(){
		
			/* This function should read the user's project data from the 
			   file system */
			
			var projectData;
			
			projectData = createTestData();
			
			
			return projectData;
		}
		
		function startProjectComponents( project ){
		
			var titleArea = document.getElementById( 'titleArea');
			titleArea.innerHTML = '<strong>Project: </strong>' + project.name;
		
			var sidePanel = document.getElementById( 'projectNavigation' );
			
			var projectTree = new mProjectNavigation( project, sidePanel, serviceRegistry, commandService );
			
			var mainPanel = document.getElementById( 'SFTPConfiguration' );
			
			var projectData = fetchProjectData();
			
			var SFTPConfiguration = new mSFTPConfiguration( project, mainPanel, projectData, commandService, serviceRegistry );	
		}
		
		mBootstrap.startup().then(
		
		function(core) {
		
			/* Render the page */
			
			serviceRegistry = core.serviceRegistry;
			
			preferences = core.preferences;
		
			var selection = new mSelection.Selection(serviceRegistry);
			
			commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});

			mGlobalCommands.generateBanner("orion-projects", serviceRegistry, commandService, preferences );			
			var projectName = PageUtil.matchResourceParameters();

			/* Create the content */
			projectName = projectName.resource.split('=')[1];
			
			var projectDataManager = new ProjectDataManager(serviceRegistry);
			
			projectDataManager.getProject( projectName, startProjectComponents );
			
//			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);	
//			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$			
//			serviceRegistry.getService("orion.page.message").setErrorMessage('this is a test');
		});
	}	
);