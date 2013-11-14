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
/*global define*/
/*jslint browser:true devel:true sub:true*/
define([
	'i18n!orion/edit/nls/messages',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/explorers/explorer-table',
	'orion/widgets/nav/common-nav',
	'orion/projectCommands',
	'orion/URITemplate',
	'orion/Deferred',
	'orion/projectClient'
], function(
	messages, objects, lib, mExplorer, mCommonNav, ProjectCommands,
	URITemplate, Deferred, mProjectClient
) {
	var CommonNavExplorer = mCommonNav.CommonNavExplorer;
	var CommonNavRenderer = mCommonNav.CommonNavRenderer;
	var FileModel = mExplorer.FileModel;

	function ProjectNavModel(serviceRegistry, root, fileClient, idPrefix, excludeFiles, excludeFolders){
		FileModel.apply(this, arguments);
		this.project = root;
	}
	
	ProjectNavModel.prototype = Object.create(FileModel.prototype);
	objects.mixin(ProjectNavModel.prototype, /** @lends orion.sidebar.ProjectNavModel.prototype */ {
		processParent: function(item, children){
			var res = FileModel.prototype.processParent.call(this, item, children);
			if(!item.Project){
				item.Project = this.project;
			}
			for(var i=0; i<children.length; i++){
				children[i].Project = this.project;
			}
			return res;
		},
		getChildren : function(parentItem, /* function(items) */ onComplete) {
			if(parentItem.children){
				onComplete(parentItem.children);
				return;
			}
			if(parentItem.type==="Project"){ //$NON-NLS-0$
				this.fileClient.loadWorkspace(parentItem.ContentLocation).then(function(content){
					var children = [];
					content.type = "ProjectRoot"; //$NON-NLS-0$
					children.push(content);
					if(parentItem.Dependencies){
						for(var i=0; i<parentItem.Dependencies.length; i++){
							children.push({Dependency: parentItem.Dependencies[i]});
						}
					}
					this.processParent(parentItem, children);
					onComplete(children);
				}.bind(this));
			} else if(parentItem.Dependency){
				if(parentItem.FileMetadata){
					FileModel.prototype.getChildren.call(this, parentItem.FileMetadata, function(children){
						this.processParent(parentItem, children);
						onComplete(children);
					}.bind(this));
				} else {
					onComplete([]);
					return;
				}
			}
			return FileModel.prototype.getChildren.call(this, parentItem, /* function(items) */ onComplete);
		},
		getId: function(item){
			if(item.type==="Project") { //$NON-NLS-0$
				item = {Location: item.ContentLocation};
			} else if (item.Dependency) {
				item = item.Dependency;
			}
			return FileModel.prototype.getId.call(this, item);
		},
		hasChildren: function(){
			return true;
		}
	});

	/**
	 * @class orion.sidebar.ProjectNavExplorer
	 * @extends orion.explorers.CommonNavExplorer
	 */
	function ProjectNavExplorer(params) {
		this.projectClient = params.projectClient;
		this.scopeUp = params.scopeUp;
		CommonNavExplorer.apply(this, arguments);
	}
	ProjectNavExplorer.prototype = Object.create(CommonNavExplorer.prototype);
	objects.mixin(ProjectNavExplorer.prototype, /** @lends orion.sidebar.ProjectNavExplorer.prototype */ {
		onFileModelChange: function(event) {
			var oldValue = event.oldValue, newValue = event.newValue;
			// Detect if we moved/renamed/deleted the current file being edited, or an ancestor thereof.
			if(oldValue.ChildrenLocation === this.treeRoot.ContentLocation){
				this.sidebarNavInputManager.dispatchEvent({
					type: "editorInputMoved", //$NON-NLS-0$
					parent: newValue ? (newValue.ChildrenLocation || newValue.ContentLocation) : null,
					newInput: newValue ? (newValue.ChildrenLocation || newValue.ContentLocation) : null
				});
				return;
			}
			CommonNavExplorer.prototype.onFileModelChange.call(this, event);
		},
		display: function(fileMetadata, redisplay){
			if(!fileMetadata){
				return;
			}
			
			this.fileMetadata = fileMetadata;
			
			var parentProject;
			if (fileMetadata && fileMetadata.Parents && fileMetadata.Parents.length===0){
				parentProject = fileMetadata;
			} else if(fileMetadata && fileMetadata.Parents){
				parentProject = fileMetadata.Parents[fileMetadata.Parents.length-1];
			}
			
			if(!redisplay &&  parentProject && parentProject.Location === this.projectLocation){
				return;
			}
			return this.fileClient.loadWorkspace().then(function(workspaceMetadata){
				return this.projectClient.readProject(fileMetadata, workspaceMetadata).then(function(projectData){
					if(projectData) {
						projectData.Workspace = workspaceMetadata;
						this.projectLocation = parentProject ? parentProject.Location : null;
						projectData.type = "Project"; //$NON-NLS-0$
						projectData.Directory = true;
						fileMetadata.type = "ProjectRoot"; //$NON-NLS-0$
						projectData.children = [fileMetadata];
						if (projectData.Dependencies) {
							projectData.Dependencies.forEach(function(dependency) {
								var item = {Dependency: dependency, Project: projectData};
								projectData.children.push(item);
								this.projectClient.getDependencyFileMetadata(dependency, projectData.WorkspaceLocation).then(function(dependencyMetadata) {
									objects.mixin(item, {
										FileMetadata: dependencyMetadata,
										Location: dependencyMetadata.Location,
										ChildrenLocation: dependencyMetadata.ChildrenLocation
									});
									this.renderer.updateRow(item, lib.node(this.model.getId(item)));
									this.expandItem(item);
								}.bind(this), function(error) {
									item.disconnected = true;
									this.renderer.updateRow(item, lib.node(this.model.getId(item)));
									this.expandItem(item);
								}.bind(this));
							}.bind(this));
						}
						return CommonNavExplorer.prototype.display.call(this, projectData, redisplay).then(function() {
							this.expandItem(fileMetadata);
						}.bind(this));
					}
				}.bind(this));
			}.bind(this));
		},
		createModel: function() {
			return new ProjectNavModel(this.registry, this.treeRoot, this.fileClient, this.parentId, this.excludeFiles, this.excludeFolders);
		},
		registerCommands: function() {
			return CommonNavExplorer.prototype.registerCommands.call(this).then(function() {
				var commandRegistry = this.commandRegistry, fileClient = this.fileClient, serviceRegistry = this.registry;
				var newActionsScope = this.newActionsScope;
				commandRegistry.registerCommandContribution("dependencyCommands", "orion.project.dependency.connect", 1); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution("dependencyCommands", "orion.project.dependency.disconnect", 2); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(newActionsScope, "orion.project.create.readme", 5, "orion.commonNavNewGroup/orion.newContentGroup"); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(newActionsScope, "orion.project.addFolder", 1, "orion.commonNavNewGroup/orion.projectDependencies"); //$NON-NLS-1$ //$NON-NLS-0$
				var projectCommandsDef = new Deferred();
				this.projectClient.getProjectHandlerTypes().then(function(dependencyTypes){
					for(var i=0; i<dependencyTypes.length; i++){
						commandRegistry.registerCommandContribution(newActionsScope, "orion.project.adddependency." + dependencyTypes[i], i+1, "orion.commonNavNewGroup/orion.projectDependencies"); //$NON-NLS-1$ //$NON-NLS-0$
					}
					ProjectCommands.createProjectCommands(serviceRegistry, commandRegistry, this, fileClient, this.projectClient, dependencyTypes).then(projectCommandsDef.resolve, projectCommandsDef.resolve);
				}.bind(this), projectCommandsDef.resolve);
				return projectCommandsDef;
			}.bind(this));
		},
		changedItem: function(item, forceExpand){
			if(!item || !this.model){
				return this.display(this.fileMetadata, true);
			}
			if(item.Projects){
				return new Deferred().resolve();
			}
			return CommonNavExplorer.prototype.changedItem.call(this, item, forceExpand);
		}
	});

	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$
	function ProjectNavRenderer() {
		CommonNavRenderer.apply(this, arguments);
	}
	ProjectNavRenderer.prototype = Object.create(CommonNavRenderer.prototype);
	objects.mixin(ProjectNavRenderer.prototype, {
		updateRow: function(item, tableRow){
			if(!tableRow){
				return;
			}
			lib.empty(tableRow);
			var i = 0;
			var cell = this.getCellElement(i, item, tableRow);
			while(cell){
				tableRow.appendChild(cell);
				if (i===0) {
					if(this.getPrimColumnStyle){
						cell.classList.add(this.getPrimColumnStyle()); //$NON-NLS-0$
					} else {
						cell.classList.add("navColumn"); //$NON-NLS-0$
					}
				} else {
					if(this.getSecondaryColumnStyle){
						cell.classList.add(this.getSecondaryColumnStyle()); //$NON-NLS-0$
					} else {
						cell.classList.add("secondaryColumn"); //$NON-NLS-0$
					}
				}
				cell = this.getCellElement(++i, item, tableRow);
			}
		},
		getCellElement: function(col_no, item, tableRow){
			if((item.Dependency || item.type==="ProjectRoot") && col_no===0){ //$NON-NLS-0$
				var col = document.createElement('td'); //$NON-NLS-0$
				col.className = item.type==="ProjectRoot" ? "projectNavColumn projectPrimaryNavColumn" : "projectNavColumn"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var span = document.createElement("span"); //$NON-NLS-0$
				span.id = tableRow.id+"MainCol"; //$NON-NLS-0$
				span.setAttribute("role", "presentation"); //$NON-NLS-1$ //$NON-NLS-0$
				col.appendChild(span);
				col.setAttribute("role", "presentation"); //$NON-NLS-1$ //$NON-NLS-0$
				span.className = "mainNavColumn projectInformationNode"; //$NON-NLS-0$
					// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, span);
				var nameText = item.Dependency ? item.Dependency.Name : (item.Project ? item.Project.Name : item.Name);
				var itemNode = document.createElement("a"); //$NON-NLS-0$
				if(item.disconnected){
					nameText += " " + messages.disconnected; //$NON-NLS-0$
				} else {
					if(item.Dependency && item.FileMetadata){
						itemNode.href = uriTemplate.expand({ //$NON-NLS-0$
							resource: item.FileMetadata.Location
						});
					} else if(item.Location){
						itemNode.href = uriTemplate.expand({ //$NON-NLS-0$
							resource: item.Location
						});
					}
				}
				itemNode.appendChild(document.createTextNode(nameText));
				
				if(item.Dependency){
					var actions = document.createElement("span"); //$NON-NLS-0$
					actions.className = "mainNavColumn"; //$NON-NLS-0$
					actions.style.cssFloat = "right"; //$NON-NLS-0$
					this.explorer.commandRegistry.renderCommands("dependencyCommands", actions, item, this, "tool"); //$NON-NLS-1$ //$NON-NLS-0$
					col.appendChild(actions);
				}
	
				span.appendChild(itemNode);
				this.explorer._makeDropTarget(item, itemNode);
				this.explorer._makeDropTarget(item, tableRow);

				// orion.explorers.FileExplorer#getNameNode
				itemNode.id = tableRow.id + "NameLink"; //$NON-NLS-0$

				return col;
			}
			return CommonNavRenderer.prototype.getCellElement.call(this, col_no, item, tableRow);
		}
	});
	
	/**
	 * @name orion.sidebar.ProjectNavViewMode
	 * @class
	 */
	function ProjectNavViewMode(params) {
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.editorInputManager = params.editorInputManager;
		this.parentNode = params.parentNode;
		this.sidebarNavInputManager = params.sidebarNavInputManager;
		this.toolbarNode = params.toolbarNode;
		this.serviceRegistry = params.serviceRegistry;
		this.projectClient = this.serviceRegistry.getService("orion.project.client"); //$NON-NLS-0$
		this.scopeUp = params.scopeUp;
		this.explorer = null;
		var _self = this;
		if(this.sidebarNavInputManager){
			this.navSelectionListener = function(event) {
				_self.navigatorSelection = event.selections;
			};
			this.sidebarNavInputManager.addEventListener("selectionChanged", this.navSelectionListener); //$NON-NLS-0$
		}
	}
	objects.mixin(ProjectNavViewMode.prototype, {
		label: messages["Project"],
		create: function() {
			var _self = this;
			this.explorer = new ProjectNavExplorer({
				commandRegistry: this.commandRegistry,
				fileClient: this.fileClient,
				editorInputManager: this.editorInputManager,
				sidebarNavInputManager: this.sidebarNavInputManager,
				parentId: this.parentNode.id,
				projectClient: this.projectClient,
				rendererFactory: function(explorer) {
					return new ProjectNavRenderer({
						checkbox: false,
						cachePrefix: "ProjectNav" //$NON-NLS-0$
					}, explorer, _self.commandRegistry, _self.contentTypeRegistry);
				},
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode,
				scopeUp: this.scopeUp
			});
			if (this.navigatorSelection && this.navigatorSelection.length > 0) {
				var project = this.navigatorSelection[0];
				while (project.parent && project.parent.parent) {
					project = project.parent;
				}
				this.explorer.display(project);
				window.location.href = uriTemplate.expand({resource: project.Location});
			} else {
				var resource = this.editorInputManager.getFileMetadata();
				if (resource){
					this.explorer.display(resource);
				}
			}
		},
		destroy: function() {
			if (this.explorer) {
				this.explorer.destroy();
			}
			this.explorer = null;
		}
	});

	return ProjectNavViewMode;
});
