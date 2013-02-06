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
		var WORKSPACES_FOLDER = 'workspaces';
		var PROJECTS_METADATA = 'project.json';

		function ProjectDataManager( serviceRegistry, fileClient ){
			this.serviceRegistry = serviceRegistry;
			this.fileClient = fileClient;
			
			// set up a deferred for getting the workspace.  Anyone who uses it should ensure the workspace retrieved is set back into this variable
			// so that it doesn't have to be retrieved multiple times.
			this.loadedWorkspace = this.fileClient.loadWorkspace("");
			
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
					
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			var loadedWorkspace = this.loadedWorkspace;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				// cache workspace so that repeated calls won't need to get it again.
				projectDataManager.loadedWorkspace = workspace;
				
				var projectsIndex = projectDataManager.findInWorkspace( workspace.Children, PROJECTS_FOLDER );
				
				if( !projectsIndex ){
					fileClient.createFolder( workspace.ChildrenLocation, PROJECTS_FOLDER ).then( function(projectData){
						fileClient.createFile( projectData.ContentLocation, PROJECTS_METADATA ).then( function( projectFile ){
							var file = projectFile;					
						    fileClient.write( projectFile.Location, '[]' );  
						});
						
						fileClient.createFolder( projectData.ContentLocation, WORKSPACES_FOLDER ).then( function( result ){} );
					});
				}	
			});
		}
		
		function getProjectData( callback ){
		
			var loadedWorkspace = this.loadedWorkspace;
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				// cache workspace so that repeated calls won't need to get it again.
				projectDataManager.loadedWorkspace = workspace;
			
				var projectsIndex = findInWorkspace( workspace.Children, PROJECTS_FOLDER );
						
				if( projectsIndex ){
					
					fileClient.read( workspace.Children[projectsIndex].ChildrenLocation ).then( function(files){
						files = JSON.parse( files );
						var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
					
						fileClient.read( files.Children[projectFile].Location ).then( function( content ){	
							var projects = JSON.parse( content );
							callback( projects, workspace );
						} );
					});
				}
			});
		}
		
		/* Create a folder working folder for a project */ 
		
		function createWorkArea( project, callback ){
		
			var loadedWorkspace = this.loadedWorkspace;
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			this.checkForWorkspaces( function( result ){
				
				if( result === true ){
				
					Deferred.when( loadedWorkspace, function(workspace) {
			
						fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
						
							var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
							
							/* If there is a folder*/
							
							fileClient.read( folders.Children[projectsIndex].ChildrenLocation, true ).then( function(folders){
								
								var workspacesIndex = projectDataManager.findInWorkspace( folders.Children, WORKSPACES_FOLDER );
								
								fileClient.read( folders.Children[workspacesIndex].ChildrenLocation, true ).then( function(folderResult){
								
									fileClient.createFolder( folderResult.Location, project.name ).then( function( outcome ){
									
										project.workspace = outcome.Location;
									
										projectDataManager.save( project );
									});
								});
							});
						});
					});
				
				}else{
					
					Deferred.when( loadedWorkspace, function(workspace) {
			
						fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
						
							var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
							
							fileClient.createFolder( folders.Children[ projectsIndex ].ChildrenLocation, WORKSPACES_FOLDER ).then( function( result ){				
								
								fileClient.createFolder( result.Location, project.name ).then( function( folderResult ){
								
									project.workspace = folderResult.Location;
								
									projectDataManager.save( project );
								});
							});
						});
					});				
				}
			});
		}
		
		function createProjectWorkspaces( callback ){
			var loadedWorkspace = this.loadedWorkspace;
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				// cache workspace so that repeated calls won't need to get it again.
				projectDataManager.loadedWorkspace = workspace;
				
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
					var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
					
					fileClient.createFolder( folders.Children[ projectsIndex ].ChildrenLocation, WORKSPACES_FOLDER ).then( function( result ){
						callback( result );
					});
					
				});
			});
		}
		
		function addNewProject( callback ){
		
		}
		
		function getProject( projectName, callback ){
			
			var loadedWorkspace = this.loadedWorkspace;
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			var project;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				// cache workspace so that repeated calls won't need to get it again.
				projectDataManager.loadedWorkspace = workspace;
			
				var projectsIndex = findInWorkspace( workspace.Children, PROJECTS_FOLDER );
				
				if( projectsIndex ){
					
					fileClient.read( workspace.Children[projectsIndex].ChildrenLocation ).then( function(files){
						files = JSON.parse( files );
						var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
					
						fileClient.read( files.Children[projectFile].Location ).then( function( content ){	
							var projects = JSON.parse( content );
							
							
							for( var p = 0; p < projects.length; p++ ){
								if( projects[p].name === projectName ){
									project = projects[p];
									break;
								}
							}
							
							callback( project, workspace, projectDataManager );
						} );
					});
				}
			});
		}
		
		function removefromArray( array, from, to) {
		  var rest = array.slice((to || from) + 1 || array.length);
		  array.length = from < 0 ? array.length + from : from;
		  return array.push.apply(array, rest);
		}
		
		function save( projectData, callback ){
			
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			var project;
			
			var projectDataManager = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
						var projectsIndex = findInWorkspace( folders.Children, PROJECTS_FOLDER );
						
						if( projectsIndex ){
							
							fileClient.read( folders.Children[projectsIndex].ChildrenLocation ).then( function(files){
								
								files = JSON.parse( files );
								
								var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
								
								var fileLocation = files.Children[projectFile].Location;
							
								fileClient.read( fileLocation ).then( function( content ){	
								
									var projects = JSON.parse( content );
									
									projectData.date = new Date();
									
									var existingProject = false;
									
									for( var p = 0; p < projects.length; p++ ){
										if( projects[p].name === projectData.name ){
											projects[p] = projectData;
											existingProject = true;
											break;
										}
									}
									
									if( !existingProject ){
									
										projects.push( projectData );
										
										/* Create a workspace for this new project */
			
										Deferred.when( loadedWorkspace, function(workspace) {
										
											fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
											
												var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
												
												fileClient.createFolder( folders.Children[ projectsIndex ].ChildrenLocation, WORKSPACES_FOLDER ).then( function( result ){
													callback( result );
												});											
											});
										});		
									}
									
									var fileData = JSON.stringify( projects );
									
									fileClient.write( fileLocation, fileData );
									
									callback( true );
									
								} );
							});
						}
					}
				);
			});
		}
		
		function removeProject( projectName, callback ){
		
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			this.removeFromArray = function( array, from, to) {
			  var rest = array.slice((to || from) + 1 || array.length);
			  array.length = from < 0 ? array.length + from : from;
			  return array.push.apply(array, rest);
			};
			
			var remover = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
					var projectsIndex = findInWorkspace( folders.Children, PROJECTS_FOLDER );
					
					if( projectsIndex ){
					
						var projectDataLocation = folders.Children[projectsIndex].ChildrenLocation;
				
						
						fileClient.read( projectDataLocation ).then( function(files){
						
							files = JSON.parse( files );
						
							var projectFile = findInWorkspace( files.Children, PROJECTS_METADATA );
							
							var fileLocation = files.Children[projectFile].Location;
						
							fileClient.read( fileLocation ).then( function( content ){	
							
								var projects = JSON.parse( content );
								
								var index;
								
								for( var p = 0; p < projects.length; p++ ){
								
									if( projects[p].name === projectName ){
										index = p;
										break;
									}	
								}
								
								if( index >= 0 ){
								
									var newProjects = remover.removeFromArray( projects, index );
									var fileData = JSON.stringify( projects );
									fileClient.write( fileLocation, fileData ).then( function( outcome ){
									
										callback();
									
									} );
									
									
								}
							});
						});
					}
				});
			});
		}
		
			/* Returns true if there is a workspaces folder in the projectData folder */
		
		function checkForWorkspaces( callback ){
		
			var result = false;
			
			var loadedWorkspace = this.fileClient.loadWorkspace("");
			
			var fileClient = this.fileClient;
			
			var projectDataManager = this;
			
			Deferred.when( loadedWorkspace, function(workspace) {
			
				fileClient.read( workspace.ChildrenLocation, true ).then( function(folders){
				
					var projectsIndex = projectDataManager.findInWorkspace( folders.Children, PROJECTS_FOLDER );
					
					fileClient.read( folders.Children[projectsIndex].ChildrenLocation, true ).then( function(folders){
						var workspacesIndex = projectDataManager.findInWorkspace( folders.Children, WORKSPACES_FOLDER );
						
						if( folders.Children[workspacesIndex] ){ result = true; }
						
						callback( result );
					});
				});
			});
		}
		
		ProjectDataManager.prototype.findInWorkspace = findInWorkspace;
		ProjectDataManager.prototype.createProjectData = createProjectData;
		ProjectDataManager.prototype.createProjectWorkspaces = createProjectWorkspaces;
		ProjectDataManager.prototype.getProjectData = getProjectData;
		ProjectDataManager.prototype.getProject = getProject;
		ProjectDataManager.prototype.addNewProject = addNewProject;
		ProjectDataManager.prototype.save = save;
		ProjectDataManager.prototype.removefromArray = removefromArray;
		ProjectDataManager.prototype.removeProject = removeProject;
		ProjectDataManager.prototype.constructor = ProjectDataManager;
		ProjectDataManager.prototype.createWorkArea = createWorkArea;
		ProjectDataManager.prototype.checkForWorkspaces = checkForWorkspaces;
		
		return ProjectDataManager;
	}
);