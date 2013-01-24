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

define(['orion/bootstrap', 'orion/globalCommands', 'orion/selection', 'orion/commands', 'projects/ProjectTree', 'projects/ProjectGrid', 'projects/ProjectData', 'projects/ProjectDataManager'],
 
	function( mBootstrap, mGlobalCommands, mSelection, mCommands, mProjectTree, mProjectGrid, mProjectData, mProjectDataManager ){
	
		function showProjectGrid( projectData ){
			
			var projectList = [];
		
			for( var project = 0; project < projectData.length; project++ ){
				var orionProject = new mProjectData( projectData[project] );
				projectList.push( orionProject );
			}
		
			var mainPanel = document.getElementById( 'projectGrid' );
			var projectGrid = new mProjectGrid.ProjectGrid( mainPanel, projectList );
		}
		
		var projectMetaData;
		
		mBootstrap.startup().then(
		
			function(core) {
			
				/* Render the page */
				
				var serviceRegistry = core.serviceRegistry;
	
				this.projectDataManager = new mProjectDataManager( serviceRegistry );
				
				var preferences = core.preferences;
			
				var selection = new mSelection.Selection(serviceRegistry);
				
				var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
			
				mGlobalCommands.generateBanner("orion-projects", serviceRegistry, commandService, preferences );	
				
				/* Create the content */
				
				var sidePanel = document.getElementById( 'projectTree' );
				
				var projectTree = new mProjectTree.ProjectTree( sidePanel );
				
				this.projectDataManager.getProjectData( showProjectGrid ); 
		});
	}	
);