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
	
		function createTestData(){
			
			var testData = [];
			
			
			var d = new Date();
			
			var cultura = new mProjectData( 'Online Store', 
											d, 
											'http://www.culturaespanola.ca', 
											'', 
											'Adding an online store to sell Spanish courses', 
											'Cultura Espanol' );
			
			var shelterbox = new mProjectData( 'Map Data Project', 
												d, 
												'http://www.sbmapdata.appspot.com', 
												'', 
												'Creating a new application that allows a person to enter crisis data to be charted.', 
												'ShelterBox' );
														
			var timeline = new mProjectData( 'Timeline Application', 
											 d, 
														'http://www.clockplot.appspot.com', 
														'', 
														'Creating a visual application that plots timelines.', 
														'Personal' );
														
			var blog = new mProjectData( 'My blog', 
														d, 
														'http://www.hickory.ca', 
														'', 
														'My web log ...', 
														'Personal' );
														
														
			var orion = new mProjectData( 'Orion Information Page', 
														d, 
														'http://www.eclipse.org/orion', 
														'', 
														'Orion Project Page', 
														'Personal' );										

			testData.push( blog );
			testData.push( shelterbox );
			testData.push( cultura );
			testData.push( timeline );
			testData.push( orion );
			
			return testData;
		}
		
	
		function showProjectGrid( projectData ){
			
			var projectList = [];
		
			for( var project = 0; project < projectData.length; project++ ){
				var orionProject = new mProjectData( projectData[project] );
				projectList.push( orionProject );
			}
		
			console.log( projectList );
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
				
	//			var projectData = fetchProjectData(serviceRegistry);
			
		});
	}	
);