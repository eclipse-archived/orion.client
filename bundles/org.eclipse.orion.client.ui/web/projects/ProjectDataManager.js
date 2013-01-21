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

define(['i18n!orion/settings/nls/messages', 'require', 'projects/ProjectData', 'orion/fileClient', 'orion/Deferred' ], 
	
	function(messages, require, mProjectData, mFileClient, Deferred) {
	
		var PROJECTS_FOLDER = 'projectData';
		
		var PROJECTS_METADATA = 'project.json';

		function ProjectDataManager( serviceRegistry ){
			this.serviceRegistry = serviceRegistry;
			this.fileClient = new mFileClient.FileClient( serviceRegistry );
			this.createProjectData();
		}
		
		function findInWorkspace( subtree, name ){
		
			var element;
		
			for( var item =0; item < subtree.length; item++ ){	
				if(subtree[item].Name === name ){
					element= item;
					break;
				}
			}
			
			return element;
		}
		
		function createProjectData( callback ){
		
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
					var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
					
					if( !projectsIndex ){
						fileClient.createFolder( workspace.ChildrenLocation, PROJECTS_FOLDER ).then( function(projectData){
							fileClient.createFile( projectData.ContentLocation, PROJECTS_METADATA ).then( function( projectFile ){
								var file = projectFile;					
							    fileClient.write( projectFile.Location, '[]' );
							});
						});
					}	
				});
			});
		}
		
		function getProjectData( callback ){
		
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
						var projectsIndex = findInWorkspace( folders.Children, PROJECTS_FOLDER );
						
						if( projectsIndex ){
							
							fileClient.read( folders.Children[projectsIndex].ChildrenLocation ).then( function(files){
								files = JSON.parse( files );
								var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
							
								fileClient.read( files.Children[projectFile].Location ).then( function( content ){	
									var projects = JSON.parse( content );
									callback( projects );
								} );
							});
						}
					}
				);
			});
		}
		
		function addNewProject( callback ){
		
		}
		
		function getProject( projectName, callback ){
			
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			var project;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
						var projectsIndex = findInWorkspace( folders.Children, PROJECTS_FOLDER );
						
						if( projectsIndex ){
							
							fileClient.read( folders.Children[projectsIndex].ChildrenLocation ).then( function(files){
								files = JSON.parse( files );
								var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
							
								fileClient.read( files.Children[projectFile].Location ).then( function( content ){	
									var projects = JSON.parse( content );
									
									
									for( var p = 0; p < projects.length; p++ ){
										if( projects[p].name === projectName ){
											project = projects[p];
										}
									}
									
									callback( project );
								} );
							});
						}
					}
				);
			});
		
		}
		
		function modifyProject( projectData, callback ){
		
		}
		
		function removeProject( projectName, callback ){
		
		}
		
		ProjectDataManager.prototype.findInWorkspace = findInWorkspace;
		ProjectDataManager.prototype.createProjectData = createProjectData;
		ProjectDataManager.prototype.getProjectData = getProjectData;
		ProjectDataManager.prototype.getProject = getProject;
		ProjectDataManager.prototype.addNewProject = addNewProject;
		ProjectDataManager.prototype.modifyProject = modifyProject;
		ProjectDataManager.prototype.removeProject = removeProject;
		ProjectDataManager.prototype.constructor = ProjectDataManager;
		
		return ProjectDataManager;
	}
);