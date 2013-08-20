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
	}

	ProjectClient.prototype = /**@lends orion.ProjectClient.ProjectClient.prototype */ {
		_getProjectJsonData : function(folderMetadata, children){
			var deferred = new Deferred();
			for(var i=0; i<children.length; i++){
				if(children[i].Name === "project.json"){
					this.fileClient.read(children[i].Location).then(function(content){
						try{
							var projectJson = content && content.length>0 ? JSON.parse(content) : {};
							projectJson.Name = projectJson.Name || folderMetadata.Name;
							projectJson.ContentLocation = folderMetadata.ChildrenLocation;
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
		readProject : function(fileMetadata){
			var that = this;
			if(fileMetadata.Parents && fileMetadata.Parents.length>0){
				var topFolder = fileMetadata.Parents[fileMetadata.Parents.length-1];
				if(topFolder.Children){
					return that._getProjectJsonData.bind(that)(topFolder, topFolder.Children);
				} else if(topFolder.ChildrenLocation) {
					return this.fileClient.fetchChildren(topFolder.ChildrenLocation).then(function(children){
						return that._getProjectJsonData.bind(that)(topFolder, children);
					},
					function(error){return error;},
					function(progress){return progress;});
				} else {
					var deferred = new Deferred();
					deferred.resolve(null);
					return deferred;
				}
			} else if(fileMetadata.Children) {
				return that._getProjectJsonData.bind(that)(fileMetadata, fileMetadata.Children);
			} else if(fileMetadata.ChildrenLocation){
				return this.fileClient.fetchChildren(fileMetadata.ChildrenLocation).then(function(children){
					return that._getProjectJsonData.bind(that)(fileMetadata, children);
				},
				function(error){return error;},
				function(progress){return progress;});
			} else {
				var deferred = new Deferred();
				deferred.resolve(null);
				return deferred;
			}
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
		
		getDepenencyFileMetadata : function(depenency){
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
					deferred.reject(depenency.Location + " could not be found in your workspace");
			}, function(error){deferred.reject(error);});
		}
		
		if(depenency.Type==="file"){
			var path = depenency.Location.split("/");
			this.fileClient.loadWorkspace().then(function(workspace){
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
						deferred.reject(depenency.Location + " could not be found in your workspace");
			}, function(error){deferred.reject(error);});
		}
		return deferred;
	},
	/**
		* @param {Object} projectMetadata Project metadata
		* @param {Object} dependency The JSON representation of the depenency
		* @param {String} dependency.Type Type of the depenency (i.e. "file")
		* @param {String} dependency.Name String description of the dependency (i.e. folder name)
		* @param {String} dependency.Location Location of the depenency understood by the plugin of given type
		*/
	addProjectDepenency: function(projectMetadata, depenency){
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
							projectJson.Dependencies.push(depenency);
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
	}
		
	};//end ProjectClient prototype
	ProjectClient.prototype.constructor = ProjectClient;

	//return the module exports
	return {ProjectClient: ProjectClient};
});