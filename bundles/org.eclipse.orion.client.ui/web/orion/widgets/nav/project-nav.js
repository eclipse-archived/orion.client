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
/*eslint-env browser, amd*/
define([
	'i18n!orion/edit/nls/messages',
	'orion/commands',
	'orion/i18nUtil',
	'orion/objects',
	'orion/webui/littlelib',
	'orion/explorers/explorer-table',
	'orion/widgets/nav/common-nav',
	'orion/projectCommands',
	'orion/PageUtil',
	'orion/URITemplate',
	'orion/Deferred',
	'orion/fileUtils',
	'orion/customGlobalCommands',
	'orion/bidiUtils'
], function(
	messages, mCommands, i18nUtil, objects, lib, mExplorer, mCommonNav, ProjectCommands,
	PageUtil, URITemplate, Deferred, mFileUtils, mCustomGlobalCommands, bidiUtils
) {
	var CommonNavExplorer = mCommonNav.CommonNavExplorer;
	var CommonNavRenderer = mCommonNav.CommonNavRenderer;
	var FileModel = mExplorer.FileModel;
	var uriTemplate = new URITemplate("#{,resource,params*}"); //$NON-NLS-0$

	function ProjectNavModel(serviceRegistry, root, fileClient, idPrefix, excludeFiles, excludeFolders, projectClient, fileMetadata){
		this.projectClient = projectClient;
		this.project = root;
		this.fileMetadata = fileMetadata;
		FileModel.apply(this, arguments);
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
				onComplete(this.processParent(parentItem, parentItem.children));
				return;
			}
			if(parentItem.type==="Project"){ //$NON-NLS-0$
				var children = [];
				this.fileMetadata.type = "ProjectRoot"; //$NON-NLS-0$
				children.push(this.fileMetadata);
				Deferred.all((parentItem.Dependencies || []).map(function(dependency) {
					var item = {Dependency: dependency, Project: parentItem};
					children.push(item);
					return this.projectClient.getDependencyFileMetadata(dependency, parentItem.WorkspaceLocation).then(function(dependencyMetadata) {
						objects.mixin(item, dependencyMetadata);
					}, function(error) {
						item.Directory = item.disconnected = true;
					});
				}.bind(this))).then(function() {
					this.processParent(parentItem, children);
					children.splice(children.indexOf(this.fileMetadata), 1);
					children.splice(0, 0, this.fileMetadata);
					onComplete(children);
				}.bind(this));
				return;
			}
			return FileModel.prototype.getChildren.call(this, parentItem, /* function(items) */ onComplete);
		},
		getId: function(item){
			if(item.type==="Project") { //$NON-NLS-0$
				item = {Location: item.ContentLocation};
			} else if (item.Dependency && item.disconnected) {
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
		CommonNavExplorer.apply(this, arguments);
		
		var _self = this;
		
		this.dependenciesDisplatcher = ProjectCommands.getDependencyDispatcher();
		this.dependneciesListener = function(event){
			_self.changedItem.call(_self);
		};
		this._dependenciesEventTypes = ["create", "delete"];
		this._dependenciesEventTypes.forEach(function(eventType) { //$NON-NLS-1$//$NON-NLS-0$
			_self.dependenciesDisplatcher.addEventListener(eventType, _self.dependneciesListener);
		});
		
		this._createRunBar();
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
			return this.projectClient.readProject(fileMetadata, this.workspaceMetadata).then(function(projectData){
				this.projectLocation = parentProject ? parentProject.Location : null;
				projectData.type = "Project"; //$NON-NLS-0$
				projectData.Directory = true;
				projectData.fileMetadata = fileMetadata;
				return CommonNavExplorer.prototype.display.call(this, projectData, redisplay).then(function() {
					return this.expandItem(fileMetadata);
				}.bind(this)).then(function () {
					this.sidebarNavInputManager.dispatchEvent({type:"projectDisplayed", item: fileMetadata}); //$NON-NLS-0$
				}.bind(this));
			}.bind(this));
		},
		loadResourceList: function(path, force, postLoad) {
			if (path && typeof path === "object") { //$NON-NLS-0$
				path = path.ChildrenLocation || path.ContentLocation;
			}
			if (this.treeRoot && path === this.treeRoot.ContentLocation) {
				this.display(this.fileMetadata, true);
			} else {
				this.scopeUp();
			}
		},
		createModel: function() {
			return new ProjectNavModel(this.registry, this.treeRoot, this.fileClient, this.parentId, this.excludeFiles, this.excludeFolders, this.projectClient, this.fileMetadata);
		},
		reroot: function(item) {
			this.scopeUp(item.Location);
			return new Deferred().reject();
		},
		registerCommands: function() {
			return CommonNavExplorer.prototype.registerCommands.call(this).then(function() {
				var commandRegistry = this.commandRegistry;
				var fileActionsScope = this.fileActionsScope;
				commandRegistry.registerCommandContribution("dependencyCommands", "orion.project.dependency.connect", 1); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution("dependencyCommands", "orion.project.dependency.disconnect", 2); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(fileActionsScope, "orion.project.create.readme", 5, "orion.menuBarFileGroup/orion.newContentGroup"); //$NON-NLS-1$ //$NON-NLS-0$
				
				var position = 0;
				commandRegistry.addCommandGroup(fileActionsScope, "orion.newDependency", 6, messages["Dependency"], "orion.menuBarFileGroup/orion.newContentGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				ProjectCommands.getAddDependencyCommands(commandRegistry).forEach(function(command){
					commandRegistry.registerCommandContribution(fileActionsScope, command.id, position++, "orion.menuBarFileGroup/orion.newContentGroup/orion.newDependency"); //$NON-NLS-0$
				});
			}.bind(this));
		},
		scopeDown: false,
		scopeUp: function() {
			var input = PageUtil.matchResourceParameters();
			var resource = input.resource;
			delete input.navigate;
			delete input.resource;
			window.location.href = uriTemplate.expand({resource: resource, params: input});
			this.sidebar.setViewMode("nav"); //$NON-NLS-0$
		},
		getTreeRoot: function() {
			return this.fileMetadata;
		},
		changedItem: function(item, forceExpand){
			if(!item || !this.model){
				return this.display(this.fileMetadata, true);
			}
			if(item.Projects){
				return new Deferred().resolve();
			}
			return CommonNavExplorer.prototype.changedItem.call(this, item, forceExpand);
		},
		destroy: function(){
			var _self = this;
			this._dependenciesEventTypes.forEach(function(eventType) {
				_self.dependenciesDisplatcher.removeEventListener(eventType, _self.dependneciesListener);
			});
			if(_self.launchConfigurationListener){
				this._launchConfigurationEventTypes.forEach(function(eventType) {
					_self.launchConfigurationDispatcher.removeEventListener(eventType, _self.launchConfigurationListener);
				});
			}
			if (this._runBar) {
				this._runBar.destroy();
				this._runBar = null;
			}
			CommonNavExplorer.prototype.destroy.call(this);
		},
		_createRunBar: function() {
			var menuBar = this.sidebar.menuBar;
			var runBarParent = menuBar.runBarNode;
			lib.empty(runBarParent);
			
			mCustomGlobalCommands.createRunBar({
				parentNode: runBarParent,
				projectExplorer: this,
				serviceRegistry: this.serviceRegistry,
				commandRegistry: this.commandRegistry,
				fileClient: this.fileClient,
				projectCommands: ProjectCommands,
				projectClient: this.projectClient,
				progressService: this.progressService,
				preferences: this.preferences
			}).then(function(runBar){
				if (runBar) {
					// runBar successfully created, set local reference to it
					this._runBar = runBar;
				}
			}.bind(this));
		}
	});

	function ProjectNavRenderer() {
		CommonNavRenderer.apply(this, arguments);
	}
	ProjectNavRenderer.prototype = Object.create(CommonNavRenderer.prototype);
	objects.mixin(ProjectNavRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			var col = CommonNavRenderer.prototype.getCellElement.call(this, col_no, item, tableRow);
			if((item.Dependency || item.type==="ProjectRoot") && col_no===0){ //$NON-NLS-0$
				col.className = item.type==="ProjectRoot" ? "projectNavColumn projectPrimaryNavColumn" : "projectNavColumn"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var span = lib.$(".mainNavColumn", col); //$NON-NLS-0$
				span.classList.add("projectInformationNode"); //$NON-NLS-0$
				var nameText = item.Dependency ? item.Dependency.Name : (item.Project ? item.Project.Name : item.Name);
				if (bidiUtils.isBidiEnabled) {
					nameText = bidiUtils.enforceTextDirWithUcc(nameText);
				}
				var itemNode = lib.$("a", col); //$NON-NLS-0$
				if(item.disconnected){
					nameText = i18nUtil.formatMessage(messages.Disconnected, nameText);
					itemNode.removeAttribute("href"); //$NON-NLS-0$
				}
				lib.empty(itemNode);
				itemNode.appendChild(document.createTextNode(nameText));

				if(item.Dependency){
					var actions = document.createElement("span"); //$NON-NLS-0$
					actions.className = "mainNavColumn"; //$NON-NLS-0$
					actions.style.cssFloat = "right"; //$NON-NLS-0$
					this.explorer.commandRegistry.renderCommands("dependencyCommands", actions, item, this, "tool"); //$NON-NLS-1$ //$NON-NLS-0$
					col.appendChild(actions);
				}
				return col;
			}
			return col;
		}
	});
	
	/**
	 * @name orion.sidebar.ProjectNavViewMode
	 * @class
	 */
	function ProjectNavViewMode(params) {
		this.preferences = params.preferences;
		this.commandRegistry = params.commandRegistry;
		this.contentTypeRegistry = params.contentTypeRegistry;
		this.fileClient = params.fileClient;
		this.editorInputManager = params.editorInputManager;
		this.parentNode = params.parentNode;
		this.sidebarNavInputManager = params.sidebarNavInputManager;
		this.toolbarNode = params.toolbarNode;
		this.serviceRegistry = params.serviceRegistry;
		this.projectClient = this.serviceRegistry.getService("orion.project.client"); //$NON-NLS-0$
		this.sidebar = params.sidebar;
		this.progressService = params.progressService;
		this.explorer = null;
		var _self = this;
		var sidebar = this.sidebar;
		// Switch to project view mode if a project is opened
		function openProject(metadata){
			function failed() {
				if (!sidebar.getActiveViewModeId()) {
					sidebar.setViewMode(sidebar.getNavigationViewMode().id);
				}
			}
			if (!metadata) {
				failed();
				return;
			}
			if(_self.lastCheckedLocation === metadata.Location){
				return;
			}
			if (sidebar.getActiveViewModeId() === _self.id) {
				return;
			}
			_self.lastCheckedLocation = metadata.Location;
			_self.getProject(metadata).then(function(project) {
				_self.getProjectJson(project).then(function(json) {
					_self.showViewMode(!!json);
					if (json) {
						if (sidebar.getActiveViewModeId() === _self.id) {
							_self.explorer.display(project);
						} else {
							_self.project = project;
							sidebar.setViewMode(_self.id);
						}
					} else {
						if (!sidebar.getActiveViewModeId()) {
							sidebar.setViewMode(sidebar.getNavigationViewMode().id);
						}
					}
				}, failed);
			}, failed);
			var handleDisplay = function (event) {
				if(event.item === metadata) {
					sidebar.sidebarNavInputManager.removeEventListener("projectDisplayed", handleDisplay); //$NON-NLS-0$
					sidebar.sidebarNavInputManager.dispatchEvent({type:"projectOpened", item: metadata}); //$NON-NLS-0$
				}
			};
			sidebar.sidebarNavInputManager.addEventListener("projectDisplayed", handleDisplay); //$NON-NLS-0$
		}
					
		// If we are displaying project root, update the project.  Otherwise check setting and set the new nav root
		this.editorInputManager.addEventListener("InputChanged", function(event) { //$NON-NLS-0$
			if (sidebar.getActiveViewModeId() === _self.id) {
				openProject(event.metadata);
			} else {
				if (localStorage.languageTools){
					// Don't navigate into the project
					// If no mode set, change to default nav view
					if (!sidebar.getActiveViewModeId()){
						sidebar.setViewMode(sidebar.getNavigationViewMode().id);
					}
				} else {
					openProject(event.metadata);
				}
			}
		});
		
		// If we are displaying project root, continue. Otherwise check setting and only show project view if the selection is a project
		this.sidebarNavInputManager.addEventListener("selectionChanged", function(event){ //$NON-NLS-0$
			if (sidebar.getActiveViewModeId() === _self.id) { return; }
			if (localStorage.languageTools){
				_self.showViewMode(false);
			} else {
				_self.project = null;
				var item = event.selections && event.selections.length > 0 ? event.selections[0] : null;
				if (item) {
					_self.getProject(item).then(function(project) {
						_self.getProjectJson(project).then(function(json) {
							_self.project = project;
							_self.showViewMode(!!json);
						});
					});
				} else {
					_self.showViewMode(false);
				}
			}
 		});
 		
	}
	objects.mixin(ProjectNavViewMode.prototype, {
		label: messages["Project"],
		id: "projectNav", //$NON-NLS-0$
		create: function() {
			var _self = this;
			this.explorer = new ProjectNavExplorer({
				preferences: this.preferences,
				commandRegistry: this.commandRegistry,
				fileClient: this.fileClient,
				editorInputManager: this.editorInputManager,
				sidebar: this.sidebar,
				sidebarNavInputManager: this.sidebarNavInputManager,
				parentId: this.parentNode.id,
				projectClient: this.projectClient,
				rendererFactory: function(explorer) {
					return new ProjectNavRenderer({
						checkbox: false,
						treeTableClass: "miniNavTreeTable", //$NON-NLS-0$
						cachePrefix: "ProjectNav" //$NON-NLS-0$
					}, explorer, _self.commandRegistry, _self.contentTypeRegistry);
				},
				serviceRegistry: this.serviceRegistry,
				toolbarNode: this.toolbarNode,
				progressService: this.progressService
			});
			this.explorer.workspaceMetadata = this.workspaceMetadata;
			this.explorer.display(this.project);
			this.toolbarNode.parentNode.classList.add("projectNavSidebarWrapper"); //$NON-NLS-0$
		},
		destroy: function() {
			if (this.explorer) {
				this.explorer.destroy();
			}
			this.explorer = null;
			this.toolbarNode.parentNode.classList.remove("projectNavSidebarWrapper"); //$NON-NLS-0$
		},
		getProject: function(metadata) {
			while (metadata.parent && metadata.parent.parent) {
				metadata = metadata.parent;
			}
			if (metadata.Parents && metadata.Parents.length > 0) {
				var topParent = metadata.Parents[metadata.Parents.length - 1];
				if (topParent.Children) {
					return new Deferred().resolve(topParent);
				}
				return this.fileClient.read(topParent.Location, true);
			}
			return new Deferred().resolve(metadata);
		},
		getProjectJson: function(metadata) {
			function getJson(children) {
				for(var i=0; i<children.length; i++){
					if(!children[i].Directory && children[i].Name === "project.json"){ //$NON-NLS-0$
						return children[i];
					}
				}
				return null;
			}
			var deferred = new Deferred();
			if (metadata.Children || metadata.children){
				deferred.resolve(getJson(metadata.Children || metadata.children));
			} else if(metadata.ChildrenLocation){
				this.fileClient.fetchChildren(metadata.ChildrenLocation).then(function(children){
					metadata.Children = children;
					deferred.resolve(getJson(children));
				}, deferred.reject);
			}
			return deferred;
		},
		showViewMode: function(show) {
			var sidebar = this.sidebar;
			var showing = !!sidebar.getViewMode(this.id);
			if (showing === show) { return; }
			if (show) {
				sidebar.addViewMode(this.id, this);
				sidebar.renderViewModeMenu();
			} else {
				sidebar.removeViewMode(this.id);
				sidebar.renderViewModeMenu();
				this.lastCheckedLocation = null;
			}
		}
	});

	return ProjectNavViewMode;
});
