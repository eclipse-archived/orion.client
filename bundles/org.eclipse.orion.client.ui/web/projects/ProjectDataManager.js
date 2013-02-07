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
		}
		
		function _findInWorkspace( subtree, name ){
		
			var element;
		
			for( var item =0; item < subtree.length; item++ ){	
				if(subtree[item].Name === name ){
					element= item;
					break;
				}
			}
			
			return element;
		}
		
		function getProjectData( callback ){
			var self = this;
			Deferred.when(this.projectsFile, function(file) {
				self.fileClient.read( self.projectsFile.Location ).then( function( content ){	
					var projects = JSON.parse( content );
					callback( projects, self.loadedWorkspace );
				});
			});
		}
		

		function addNewProject( callback ){
		
		}
		
		function getProject( projectName, callback ){
			var project;
			var self = this;
			Deferred.when(this.projectsFile, function(file) {
				self.projectsFile = file;
				self.fileClient.read( file.Location ).then( function( content ){	
					var projects = JSON.parse( content );
					for( var p = 0; p < projects.length; p++ ){
						if( projects[p].name === projectName ){
							project = projects[p];
							break;
						}
					}
					if (!project) {
						project = { name: "Project " + (projects.length + 1), address: "", description: "", drives: [] };
						self.save(project);
					}
					if (project.workspace) {
						callback(project, self.loadedWorkspace, self);
					} else {
						Deferred.when(self.workspacesFolder, function(workspacesFolder) {
							self.workspacesFolder = workspacesFolder;
							self.fileClient.createFolder( workspacesFolder.Location, project.name ).then( function( file ){
								project.workspace = file.Location;
								self.save( project );
								callback(project, self.loadedWorkspace, self);
							});
						});
					}
				} );
			});
		}
		
		// asynchronous, cannot rely that data is saved on return
		function save( projectData, callback ){
			var self = this;			
			Deferred.when(this.projectsFile, function(file) {
				self.projectsFile = file;
				self.fileClient.read( file.Location ).then( function( content ){	
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
					}
					
					var fileData = JSON.stringify( projects );
					self.fileClient.write( self.projectsFile.Location, fileData );

					callback( true );
					
				} );
			});
						
		}
		
		function removeProject( projectName, callback ){
			var self = this;
			Deferred.when(this.projectsFile, function(file) {
				self.projectsFile = file;
				self.fileClient.read( file.Location ).then( function( content ){			
					var projects = JSON.parse( content );
					
					var index;
					
					for( var p = 0; p < projects.length; p++ ){
					
						if( projects[p].name === projectName ){
							index = p;
							break;
						}	
					}
					
					if( index >= 0 ){
					
						var newProjects = self._removeFromArray( projects, index );
						var fileData = JSON.stringify( projects );
						self.fileClient.write( self.projectsFile.Location, fileData ).then( function( outcome ){				
							callback();				
						} );
						
						
					}
				});
			});
		}
		
		function _removefromArray( array, from, to) {
		  var rest = array.slice((to || from) + 1 || array.length);
		  array.length = from < 0 ? array.length + from : from;
		  return array.push.apply(array, rest);
		}
		
		// Startup the ProjectDataManager
		// Upon callback, we'll have cached everything we need for future API calls
				
		function startup(callback){
			// We will cache the following
				// this.loadedWorkspace
				// this.projectsFolder
				// this.projectsFile
				// this.workspacesFolder				
			var fileClient = this.fileClient;
			var projectDataManager = this;
			this.fileClient.loadWorkspace("").then(function(workspace) {
				// Cache workspace
				projectDataManager.loadedWorkspace = workspace;
				
				var projectsIndex = projectDataManager._findInWorkspace( workspace.Children, PROJECTS_FOLDER );
				
				if( !projectsIndex ){
					projectDataManager.projectsFolder = fileClient.createFolder( workspace.ChildrenLocation, PROJECTS_FOLDER );
					projectDataManager.projectsFolder.then( function(projectData){
						// Cache projects folder
						projectDataManager.projectsFolder = projectData;
						projectDataManager.projectsFile = fileClient.createFile( projectData.ContentLocation, PROJECTS_METADATA );
						projectDataManager.projectsFile.then( function( projectsFile ){
							// Cache projects file
							projectDataManager.projectsFile = projectsFile;
						    fileClient.write(projectsFile.Location, '[]' );
						});
						
						projectDataManager.workspacesFolder = fileClient.createFolder( projectData.ContentLocation, WORKSPACES_FOLDER );
						projectDataManager.workspacesFolder.then(function(workspacesFolder) {
							// Cache workspaces folder
							projectDataManager.workspacesFolder = workspacesFolder;
							callback();
						});
					});
				} else {
					projectDataManager.projectsFolder = workspace.Children[projectsIndex];
					projectDataManager.projectsFile = projectDataManager.workspacesFolder = fileClient.fetchChildren(projectDataManager.projectsFolder.ChildrenLocation);
					projectDataManager.projectsFile.then(function(children) {
						var index = _findInWorkspace(children, PROJECTS_METADATA);
						projectDataManager.projectsFile = children[index];
						index = _findInWorkspace(children, WORKSPACES_FOLDER);
						projectDataManager.workspacesFolder = children[index];
						callback();
					});
				}
			});
		}
		
		ProjectDataManager.prototype._findInWorkspace = _findInWorkspace;
		ProjectDataManager.prototype._removefromArray = _removefromArray;
		ProjectDataManager.prototype.startup = startup;
		ProjectDataManager.prototype.getProjectData = getProjectData;
		ProjectDataManager.prototype.getProject = getProject;
		ProjectDataManager.prototype.addNewProject = addNewProject;
		ProjectDataManager.prototype.save = save;
		ProjectDataManager.prototype.removeProject = removeProject;
		ProjectDataManager.prototype.constructor = ProjectDataManager;
		
		return ProjectDataManager;
	}
);