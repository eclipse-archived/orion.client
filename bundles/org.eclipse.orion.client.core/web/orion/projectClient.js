/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
define(['i18n!orion/navigate/nls/messages', "orion/Deferred"], function(messages, Deferred){

	/**
	 * Creates a new project client.
	 * @class Project client provides client-side API to handle projects based on given file client.
	 * @name orion.projectClient.ProjectClient
	 */
	function ProjectClient(serviceRegistry, fileClient) {
		this.serviceRegistry = serviceRegistry;
		this.fileClient = fileClient;
		this.allDependencyHandlersReferences = serviceRegistry.getServiceReferences("orion.project.dependency.handler"); //$NON-NLS-0$
	}

	ProjectClient.prototype = /**@lends orion.ProjectClient.ProjectClient.prototype */ {
		_getProjectJsonData : function(folderMetadata, children, workspace){
			var deferred = new Deferred();
			for(var i=0; i<children.length; i++){
				if(children[i].Name === "project.json"){
					this.fileClient.read(children[i].Location).then(function(content){
						try{
							var projectJson = content && content.length>0 ? JSON.parse(content) : {};
							projectJson.Name = projectJson.Name || folderMetadata.Name;
							projectJson.ContentLocation = folderMetadata.ChildrenLocation;
							projectJson.WorkspaceLocation = workspace.Location;
							projectJson.ProjectJsonLocation = children[i].Location;
							deferred.resolve(projectJson);
						} catch (e){
							deferred.reject(e);
						}
					}, function(error){deferred.reject(error);}, function(progress){deferred.progress(progress);});
					return deferred;
				}
			}
			deferred.resolve(null);
			return deferred;
		},
		readAllProjects : function(workspaceMetadata){
			var deferred = new Deferred();

			if(!workspaceMetadata.Children){
				deferred.resolve([]);
				return deferred;
			}	
			var projects = [];
			var projectDeferrds = [];
			for(var i=0; i<workspaceMetadata.Children.length; i++){
				var projectDeferred = this.readProject(workspaceMetadata.Children[i]);
				projectDeferrds.push(projectDeferred);
				projectDeferred.then(function(projectMetadata){
					if(projectMetadata){
						projects.push(projectMetadata);
					}
				});
			}
			Deferred.all(projectDeferrds).then(function(){
				deferred.resolve(projects);
			});
			return deferred;
		},
		readProject : function(fileMetadata){
			var that = this;
			return this.fileClient.loadWorkspace().then(function(workspace){
				if(fileMetadata.Parents && fileMetadata.Parents.length>0){
					var topFolder = fileMetadata.Parents[fileMetadata.Parents.length-1];
					if(topFolder.Children){
						return that._getProjectJsonData.bind(that)(topFolder, topFolder.Children, workspace);
					} else if(topFolder.ChildrenLocation) {
						return this.fileClient.fetchChildren(topFolder.ChildrenLocation).then(function(children){
							return that._getProjectJsonData.bind(that)(topFolder, children, workspace);
						},
						function(error){return error;},
						function(progress){return progress;});
					} else {
						var deferred = new Deferred();
						deferred.resolve(null);
						return deferred;
					}
				} else if(fileMetadata.Children) {
					return that._getProjectJsonData.bind(that)(fileMetadata, fileMetadata.Children, workspace);
				} else if(fileMetadata.ChildrenLocation){
					return this.fileClient.fetchChildren(fileMetadata.ChildrenLocation).then(function(children){
						return that._getProjectJsonData.bind(that)(fileMetadata, children, workspace);
					},
					function(error){return error;},
					function(progress){return progress;});
				} else {
					var deferred = new Deferred();
					deferred.resolve(null);
					return deferred;
				}
			}.bind(that));
		},
		
		/**
		 * Initializes a project in a folder.
		 * @param {String} contentLocation The location of the parent folder
		 * @return {Object} projectMetadata JSON representation of the created folder
		 */
		initProject : function(contentLocation, projectMetadata){
			var that = this;
			return this.fileClient.createFile(contentLocation, "project.json").then(function(fileMetadata){
				if(projectMetadata){
					return that.fileClient.write(fileMetadata.Location, JSON.stringify(projectMetadata));
				}
				return fileMetadata;
			}, 
				function(error){return error;},
				function(progress){return progress;});
		},
		
		getDependencyFileMetadata : function(dependency, workspaceLocation){
		var deferred = new Deferred();
		var that = this;
		function getLastChild(childrenLocation, path){
			this.fileClient.fetchChildren(childrenLocation).then(function(children){
				for(var i=0; i<children.length; i++){
					if(children[i].Name === path[0]){
						if(path.length===1){
							deferred.resolve(children[i]);
						} else {
							getLastChild.bind(that)(children[i].ChildrenLocation, path.splice(1, path.length-1));
						}
						return;
					}
				}
					deferred.reject(dependency.Location + " could not be found in your workspace");
			}, function(error){deferred.reject(error);});
		}
		
		if(dependency.Type==="file"){
			var path = dependency.Location.split("/");
			this.fileClient.loadWorkspace(workspaceLocation).then(function(workspace){
						for(var i=0; i<workspace.Children.length; i++){
							if(workspace.Children[i].Name===path[0]){
								if(path.length===1){
									deferred.resolve(workspace.Children[i]);
								} else {
									getLastChild.bind(that)(workspace.Children[i].ChildrenLocation, path.splice(1, path.length-1));
								}
								return;
							}
						}
						deferred.reject(dependency.Location + " could not be found in your workspace");
			}, function(error){deferred.reject(error);});
		} else {
			var handler = this.getDependencyHandler(dependency.Type);
			if(handler===null){
				deferred.reject(dependency.Type + " is not supported.");
				return deferred;
			}
			this.fileClient.loadWorkspace(workspaceLocation).then(function(workspace){
				var checkdefs = [];
				var found = false;
				for(var i=0; i<workspace.Children.length; i++){
					if(found===true){
						break;
					}
					var def = handler.getDependencyDescription(workspace.Children[i]);
					checkdefs.push(def);
					(function(i, def){
						def.then(function(matches){
							if(matches && matches.Location === dependency.Location){
								found = true;
								deferred.resolve(workspace.Children[i]);
							}
						});
					})(i, def);
				}
				Deferred.all(checkdefs).then(function(){
					if(!found){
						deferred.reject(dependency.Name + " could not be found in your workspace");
					}
				});
			}, deferred.reject);
		}
		return deferred;
	},
	/**
		* @param {Object} projectMetadata Project metadata
		* @param {Object} dependency The JSON representation of the dependency
		* @param {String} dependency.Type Type of the dependency (i.e. "file")
		* @param {String} dependency.Name String description of the dependency (i.e. folder name)
		* @param {String} dependency.Location Location of the dependency understood by the plugin of given type
		*/
	addProjectDependency: function(projectMetadata, dependency){
		var deferred = new Deferred();
		this.fileClient.fetchChildren(projectMetadata.ContentLocation).then(function(children){
			for(var i=0; i<children.length; i++){
				if(children[i].Name==="project.json"){
					this.fileClient.read(children[i].Location).then(function(content){
						try{
							var projectJson = content && content.length>0 ? JSON.parse(content) : {};
							if(!projectJson.Dependencies){
								projectJson.Dependencies = [];
							}
							for(var j=0; j<projectJson.Dependencies.length; j++){
								if(projectJson.Dependencies[j].Location === dependency.Location){
									deferred.resolve(projectJson);	
									return;
								}
							}
							projectJson.Dependencies.push(dependency);
							this.fileClient.write(children[i].Location, JSON.stringify(projectJson)).then(
								function(){
									projectJson.ContentLocation = projectMetadata.ContentLocation;
									projectJson.Name = projectMetadata.Name;
									deferred.resolve(projectJson);
								},
								deferred.reject
							);
							
							deferred.resolve(projectJson);
						} catch (e){
							deferred.reject(e);
						}
					}.bind(this), deferred.reject, deferred.progress);
					return;
				}
			}
		}.bind(this), deferred.reject);
		return deferred;
	},
	
	removeProjectDependency: function(projectMetadata, dependency){
		var deferred = new Deferred();
		this.fileClient.fetchChildren(projectMetadata.ContentLocation).then(function(children){
			for(var i=0; i<children.length; i++){
				if(children[i].Name==="project.json"){
					this.fileClient.read(children[i].Location).then(function(content){
						try{
							var projectJson = content && content.length>0 ? JSON.parse(content) : {};
							if(!projectJson.Dependencies){
								projectJson.Dependencies = [];
							}
							for(var j=projectJson.Dependencies.length-1; j>=0; j--){
								if(projectJson.Dependencies[j].Location === dependency.Location && projectJson.Dependencies[j].Type === dependency.Type){
									projectJson.Dependencies.splice(j);
								}
							}
							this.fileClient.write(children[i].Location, JSON.stringify(projectJson)).then(
								function(){
									projectJson.ContentLocation = projectMetadata.ContentLocation;
									projectJson.Name = projectMetadata.Name;
									deferred.resolve(projectJson);
								},
								deferred.reject
							);
							
						} catch (e){
							deferred.reject(e);
						}
					}.bind(this), deferred.reject, deferred.progress);
					return;
				}
			}
		}.bind(this), deferred.reject);
		return deferred;
	},
	
	getDependencyTypes: function(){
		var types = [];
		for(var i=0; i<this.allDependencyHandlersReferences.length; i++){
			types.push(this.allDependencyHandlersReferences[i].getProperty("type"));
		}
		return types;
	},
	
	getDependencyHandler: function(type){
		for(var i=0; i<this.allDependencyHandlersReferences.length; i++){
			if(this.allDependencyHandlersReferences[i].getProperty("type") === type){
				var service = this.serviceRegistry.getService(this.allDependencyHandlersReferences[i]);
				service.id = this.allDependencyHandlersReferences[i].getProperty("id");
				service.addParamethers =  this.allDependencyHandlersReferences[i].getProperty("addParamethers");
				service.name =  this.allDependencyHandlersReferences[i].getProperty("name");
				service.tooltip = this.allDependencyHandlersReferences[i].getProperty("tooltip");
				service.type = type;
				service.actionComment = this.allDependencyHandlersReferences[i].getProperty("actionComment");
				return service;
			}
		}
	}
		
	};//end ProjectClient prototype
	ProjectClient.prototype.constructor = ProjectClient;

	//return the module exports
	return {ProjectClient: ProjectClient};
});