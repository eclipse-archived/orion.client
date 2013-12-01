/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global define document setTimeout*/
define(['orion/URITemplate', 'orion/webui/littlelib', 'orion/Deferred', 'orion/objects',  'orion/projectCommands', 'orion/commandRegistry', 'orion/PageLinks', 'orion/explorers/explorer', 'orion/section'],
	function(URITemplate, lib, Deferred, objects, mProjectCommands, mCommandRegistry, PageLinks, mExplorer, mSection) {
	
	var editTemplate = new URITemplate("./edit.html#{,resource,params*}"); //$NON-NLS-0$
	
	function ProjectInfoModel(project){
		this.root = project;
	}
	
	ProjectInfoModel.prototype = new mExplorer.ExplorerModel();
	ProjectInfoModel.prototype.constructor = ProjectInfoModel;
	
	ProjectInfoModel.prototype.getRoot = function(onItem){
		return onItem(this.root);
	};
	
	ProjectInfoModel.prototype.getChildren = function(parent, onComplete){
		if(parent === this.root){
			onComplete([
				{id: "Name", displayName: "Name", value: parent.Name, no: 1},
				{id: "Description", displayName: "Description", value: parent.Description, no: 2},
				{id: "Url", displayName: "Site", value: parent.Url, href: parent.Url, no: 3}
				]);
		} else {
			onComplete([]);
		}
	};
	
	ProjectInfoModel.prototype.getId = function(item){
		return "ProjectInfo" + item.id;
	};
	
	function ProjectInfoRenderer(options, projectEditor, explorer){
		this._init(options);
		this.projectEditor = projectEditor;
		this.explorer = explorer;
	}
	
	ProjectInfoRenderer.prototype = new mExplorer.SelectionRenderer();
	ProjectInfoRenderer.prototype.constructor = ProjectInfoRenderer;
	
	ProjectInfoRenderer.prototype.getCellHeaderElement = function(col_no){
		if(col_no===0){
			var td = document.createElement("td");
			td.colSpan = 2;
			td.appendChild(document.createTextNode("Project Information"));
			return td;
		}
	};
	
	ProjectInfoRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0) {
			var td = document.createElement("td");
			var b = document.createElement("span");
			b.className = "discreetInputLabel";
			b.appendChild(document.createTextNode(item.displayName));
			td.classList.add("discreetInputLabel");
			td.appendChild(b);
			td.width = "20%";
			return td;
		}
		if(col_no===1){
			var td;
			if(item.href){
				td = document.createElement("td");
				td.style.verticalAlign = "top";
				
				var urlInput = document.createElement("input");
				urlInput.style.visibility = "hidden";
				
				var urlSelector = document.createElement("div");
				urlSelector.style.marginBottom = "-15px";
				urlSelector.title = "Click to edit";
				urlSelector.className = "discreetInput";
				urlSelector.tabIndex = item.no;	//this is the same as the urlInput's tab index but they will never be visible at the same time
				
				var urlLink = document.createElement("a");
				urlLink.href = item.value || "";
				urlLink.appendChild(document.createTextNode(item.value || ""));
				urlLink.tabIndex = item.no+1;
							
				urlSelector.appendChild(urlLink);
				urlSelector.title = "Click to edit";
		
				//show url input, hide selector
				urlSelector.onclick = function (event){
					urlSelector.style.visibility = "hidden";
					urlLink.style.visibility = "hidden";
					urlInput.style.visibility = "";
					urlInput.focus();
				}.bind(this.projectEditor);
				
				//make the url editable when the selector gains focus
				urlSelector.onfocus = urlSelector.onclick;
				
				//Make pressing "Enter" on the selector do the same think as clicking it
				urlSelector.onkeyup = function(event){
					if(event.keyCode === lib.KEY.ENTER){
						urlSelector.onclick(event);
					}
				}.bind(this.projectEditor);
				
				urlLink.urlSelector = urlSelector; //refer to selector to be able to make it visible from within _renderEditableFields
				
				this.projectEditor._renderEditableFields(urlInput, item.id, item.no, urlLink);
				td.appendChild(urlSelector);
				td.appendChild(urlInput);
				return td;
			}
			td = document.createElement("td");
			td.style.verticalAlign = "top";
			var input = item.id==="Description" ? document.createElement("textArea") : document.createElement("input");
			this.projectEditor._renderEditableFields(input, item.id, item.no, null);
			td.appendChild(input);
			return td;
		}

	};
	
	
	function AdditionalInfoModel(project){
		this.root = project;
	}
	
	AdditionalInfoModel.prototype = new mExplorer.ExplorerModel();
	AdditionalInfoModel.prototype.constructor = AdditionalInfoModel;
	
	AdditionalInfoModel.prototype.getRoot = function(onItem){
		return onItem(this.root);
	};
	
	AdditionalInfoModel.prototype.getChildren = function(parent, onComplete){
		if(parent === this.root){
			for(var i=0; i<parent.children.length; i++){
				parent.children[i].parent = parent;
			}
			onComplete(parent.children);
		} else {
			onComplete([]);
		}
	};
	
	AdditionalInfoModel.prototype.getId = function(item){
		return "AdditionalInfo" + mExplorer.ExplorerModel.prototype.getId.call(this, {Location: item.parent.name + item.name});
	};
	
	function AdditionalInfoRenderer(options, projectEditor, explorer){
		this._init(options);
		this.projectEditor = projectEditor;
		this.explorer = explorer;
	}
	
	AdditionalInfoRenderer.prototype = new mExplorer.SelectionRenderer();
	AdditionalInfoRenderer.prototype.constructor = AdditionalInfoRenderer;
	
	AdditionalInfoRenderer.prototype.getCellHeaderElement = function(col_no){
		if(col_no===0){
			var td = document.createElement("td");
			td.colSpan = 2;
			td.appendChild(document.createTextNode(this.explorer.model.root.name));
			return td;
		}
	};
	
	AdditionalInfoRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0) {
			var td = document.createElement("td");
			var b = document.createElement("span");
			b.className = "discreetInputLabel";
			b.appendChild(document.createTextNode(item.name));
			td.classList.add("discreetInputLabel");
			td.appendChild(b);
			td.width = "20%";
			return td;
		}
		if(col_no===1){
			var td = document.createElement("td");
			if(item.href){
				var a = document.createElement("a");
				var uriTemplate = new URITemplate(item.href);
				a.href = uriTemplate.expand({OrionHome : PageLinks.getOrionHome()});
				a.appendChild(document.createTextNode(item.value || " "));
				td.appendChild(a);
			} else {
				td.appendChild(document.createTextNode(item.value || " "));
			}
			return td;
		}

	};	
	
	function DependenciesModel(project, projectClient){
		this.root = project;
		this.projectClient = projectClient;
	}
	
	DependenciesModel.prototype = new mExplorer.ExplorerModel();
	DependenciesModel.prototype.constructor = DependenciesModel;
	
	DependenciesModel.prototype.getRoot = function(onItem){
		return onItem(this.root);
	};
	
	DependenciesModel.prototype.getChildren = function(parentItem, onComplete){
		if(parentItem === this.root){
			var children = [];
			Deferred.all((parentItem.Dependencies || []).map(function(dependency) {
				var item = {Dependency: dependency, Project: parentItem};
				children.push(item);
				return this.projectClient.getDependencyFileMetadata(dependency, parentItem.WorkspaceLocation).then(function(dependencyMetadata) {
					objects.mixin(item, dependencyMetadata);
				}, function(error) {
					item.Directory = item.disconnected = true;
				});
			}.bind(this))).then(function() {
				onComplete(children);
			}.bind(this));
			
		} else {
			onComplete([]);
		}
	};
	
	DependenciesModel.prototype.getId = function(item){
		return mExplorer.ExplorerModel.prototype.getId.call(this, item.Dependency);
	};
	
	function DependenciesRenderer(options, projectEditor, explorer){
		this._init(options);
		this.projectEditor = projectEditor;
		this.explorer = explorer;
		this.commandRegistry = options.commandRegistry;
		this.actionScopeId = options.actionScopeId;
	}
	
	DependenciesRenderer.prototype = new mExplorer.SelectionRenderer();
	DependenciesRenderer.prototype.constructor = DependenciesRenderer;
	
	DependenciesRenderer.prototype.getCellHeaderElement = function(col_no){
		if(col_no===0){
			var td = document.createElement("td");
			td.colSpan = 2;
			td.appendChild(document.createTextNode("Associated Content"));
			return td;
		}
	};
	
	DependenciesRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		if(col_no===0) {
			var td = document.createElement("td");
			
			if(item.Location){
				td.className = "navColumnNoIcon";
				var a = document.createElement("a");
				a.href = editTemplate.expand({resource: item.Location}); //$NON-NLS-0$
				a.appendChild(document.createTextNode(item.Dependency.Name));
				td.appendChild(a);
			} else {
				var name = item.Dependency.Name;
				if(item.disconnected){
					name += " (disconnected)";
				}
				td.appendChild(document.createTextNode(name));
			}

			return td;
		}
		if(col_no===1){
			var actionsColumn = this.getActionsColumn(item, tableRow, null, null, true);
			actionsColumn.style.textAlign = "right";
			return actionsColumn;
		}

	};
	
	function ProjectEditor(options){
		this.serviceRegistry = options.serviceRegistry;
		this.fileClient = options.fileClient;
		this.progress = options.progress;
		this.projectClient = this.serviceRegistry.getService("orion.project.client");
		this.commandRegistry = options.commandRegistry;
		this._node = null;
		this.dependencyActions = "dependencyActions";
		this.createCommands();
	}
	ProjectEditor.prototype = {
		createCommands: function(){
//			mProjectCommands.createDependencyCommands(this.serviceRegistry, this.commandRegistry, this, this.fileClient, this.projectClient);
//			var dependencyTypes = this.projectClient.getProjectHandlerTypes();
			this.commandRegistry.registerCommandContribution(this.dependencyActions, "orion.project.dependency.connect", 1); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandRegistry.registerCommandContribution(this.dependencyActions, "orion.project.dependency.disconnect", 2); //$NON-NLS-0$
		},
		changedItem: function(){
			this.fileClient.read(this.parentFolder.Location, true).then(function(metadata){
				lib.empty(this.node);
				this.displayContents(this.node, metadata);
			}.bind(this));
		},
		display: function(node, projectData){
			this.node = node;
			this.node.className = "orionProject";				
			this.projectData = projectData;
			var span = document.createElement("span");
			this.node.appendChild(span);
			this.renderProjectInfo(span);
			span = document.createElement("span");
			this.node.appendChild(span);
			this.renderAdditionalProjectProperties(span);
			span = document.createElement("span");
			this.node.appendChild(span);
			this.renderDependencies(span);
		},
		displayContents: function(node, parentFolder){
			this.parentFolder = parentFolder;
			this.projectClient.readProject(parentFolder).then(function(projectData){
				this.display.bind(this)(node, projectData);
			}.bind(this));
		},
		_renderEditableFields: function(input, property, tabIndex, urlElement /*optional*/){	
			var saveInput = function(event) {
				var properties = {};
				properties[property] = event.target.value;
				this.progress.progress(this.projectClient.changeProjectProperties(this.projectData, properties), "Saving project " + this.projectData.Name).then(
					function(newProjectData){
						if(newProjectData){
							this.projectData = newProjectData;
							input.value = event.target.value;
							
							//behave differently for inputs associated with urls
							//hide the <input> element and show the <a> urlElement
							if(urlElement){
								lib.empty(urlElement);
								urlElement.appendChild(document.createTextNode(event.target.value) || "");
								urlElement.href = event.target.value;
								urlElement.style.visibility = "";
								if(urlElement.urlSelector){
									urlElement.urlSelector.style.visibility = "";
								}
								
								input.style.visibility = "hidden";
							}
						}
					}.bind(this)
				);
			}.bind(this);
			
			input.value = this.projectData[property] || "";
			input.title = "Click to edit";
			input.className = "discreetInput";
			input.tabIndex = String(tabIndex);
						
			input.onkeyup = function(event){
				if(event.keyCode === lib.KEY.ENTER){
					// Excluding <textarea> because it is a multi-line input
					// which allows the user to press Enter for a new line
					if (input.tagName.toUpperCase() !== 'TEXTAREA') {
						input.blur();
					}
				}else if(event.keyCode === lib.KEY.ESCAPE){
					input.value = this.projectData[property] || ""; //restore previous value
					input.blur();
				}
			}.bind(this);
			input.onblur = function(event){
				saveInput(event);
			};
		},
		renderProjectInfo: function(parent){
			
			var projectInfoSection = new mSection.Section(parent, {id: "projectInfoSection", title: "Project Information"});
			var explorerParent = document.createElement("div");
			explorerParent.id = "projectInformationNode";
			var projectInfoRenderer = new ProjectInfoRenderer({
				checkbox: false,
				cachePrefix: "ProjectInfoExplorer" //$NON-NLS-0$
			}, this);
			var projectInfoExplorer = new mExplorer.Explorer(this.serviceRegistry, null, projectInfoRenderer, this.commandRegistry);
			projectInfoSection.embedExplorer(projectInfoExplorer, explorerParent);
			projectInfoExplorer.createTree(explorerParent, new ProjectInfoModel(this.projectData), {noSelection: true});
			return;
		},
		renderAdditionalProjectProperties: function(parent){
			this.projectClient.getMatchingProjectHandlers(this.parentFolder).then(function(matchingProjectHandlers){
			for(var projectHandlerIndex = 0; projectHandlerIndex<matchingProjectHandlers.length; projectHandlerIndex++){
				var projectHandler = matchingProjectHandlers[projectHandlerIndex];

				if(!projectHandler || !projectHandler.getAdditionalProjectProperties){
					continue;
				}
				this.progress.progress(projectHandler.getAdditionalProjectProperties(this.parentFolder, this.projectData), "Getting additional project information").then(function(additionalProperties){
					if(!additionalProperties || !additionalProperties.length || additionalProperties.length === 0){
						return;
					}
					for(var i=0; i<additionalProperties.length; i++){
						var cat = additionalProperties[i];
						if(!cat.name){
							continue;
						}
						var addotopnalInfoSection = new mSection.Section(parent, {id: cat.name + "Section", title: cat.name});
						var explorerParent = document.createElement("div");
						var additionalInfoRenderer = new AdditionalInfoRenderer({
							checkbox: false
						}, this);
						var additionalInfoExplorer = new mExplorer.Explorer(this.serviceRegistry, null, additionalInfoRenderer, this.commandRegistry);
						addotopnalInfoSection.embedExplorer(additionalInfoExplorer, explorerParent);
						additionalInfoExplorer.createTree(explorerParent, new AdditionalInfoModel(cat),  {noSelection: true});
					}
				}.bind(this));
			}
			}.bind(this));
		},
		renderDependencies: function(parent){
			
			if(!this.projectData.Dependencies || this.projectData.Dependencies.length===0){
				return;
			}
			
			var dependenciesSection = new mSection.Section(parent, {id: "projectDependenciesSection", title: "Associated Content"});
			var dependenciesParent = document.createElement("div");
			dependenciesParent.id = "ependenciesNode";
			var dependenciesRenderer = new DependenciesRenderer({
				checkbox: false,
				commandRegistry: this.commandRegistry,
				actionScopeId:  this.dependencyActions
			}, this);
			var dependenciesExplorer = new mExplorer.Explorer(this.serviceRegistry, null, dependenciesRenderer, this.commandRegistry);
			dependenciesExplorer.actionScopeId = this.dependencyActions;
			dependenciesSection.embedExplorer(dependenciesExplorer, dependenciesParent);
			dependenciesExplorer.createTree(dependenciesParent, new DependenciesModel(this.projectData, this.projectClient),  {indent: '8px', noSelection: true});
			
		}
	};
	
	return {ProjectEditor: ProjectEditor};
});
