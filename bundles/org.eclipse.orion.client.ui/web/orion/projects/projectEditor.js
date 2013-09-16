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
define(['orion/markdownView', 'orion/webui/littlelib', 'orion/projectClient', 'orion/projectCommands', 'orion/commandRegistry'],
	function(mMarkdownView, lib, mProjectClient, mProjectCommands, mCommandRegistry) { //$NON-NLS-0$
	function ProjectEditor(options){
		this.serviceRegistry = options.serviceRegistry;
		this.fileClient = options.fileClient;
		this.progress = options.progress;
		this.projectClient = new mProjectClient.ProjectClient(this.serviceRegistry, this.fileClient);
		this.commandService = options.commandService;
		this._node = null;
		this.markdownView = new mMarkdownView.MarkdownView({
			fileClient : this.fileClient,
			progress : this.progress
		});
		this.redmeCommandsScope = "readmeActions";
		this.allDependenciesActions = "dependenciesActions";
		this.dependencyActions = "dependencyActions";
		this.createCommands();
	}
	ProjectEditor.prototype = {
		createCommands: function(){
			mProjectCommands.createProjectCommands(this.serviceRegistry, this.commandService, this, this.fileClient, this.projectClient);
			this.commandService.registerCommandContribution(this.redmeCommandsScope, "orion.project.edit.readme", 1); 
			this.commandService.registerCommandContribution(this.redmeCommandsScope, "orion.project.create.readme", 2); 
			this.commandService.addCommandGroup(this.allDependenciesActions, "orion.miniExplorerNavNewGroup", 1000, "Add", null, null, "core-sprite-addcontent"); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.registerCommandContribution(this.allDependenciesActions, "orion.project.addFolder", 1, "orion.miniExplorerNavNewGroup/orion.projectDepenencies"); //$NON-NLS-1$ //$NON-NLS-0$
			var dependencyTypes = this.projectClient.getProjectHandlerTypes();
			for(var i=0; i<dependencyTypes.length; i++){
				this.commandService.registerCommandContribution(this.allDependenciesActions, "orion.project.adddependency." + dependencyTypes[i], i+1, "orion.miniExplorerNavNewGroup/orion.projectDepenencies"); //$NON-NLS-1$ //$NON-NLS-0$
			}
			this.commandService.registerCommandContribution(this.dependencyActions, "orion.project.dependency.connect", 1); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.registerCommandContribution(this.dependencyActions, "orion.project.dependency.disconnect", 2); //$NON-NLS-0$
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
			this.renderReadmeMd(span);
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
		_renderEditableFields: function(td, span, input, property){
			
			function showInput(event){
				input.value = span.innerText || span.textContent;
				span.style.visibility = "hidden";
				input.style.visibility = "";
				input.focus();
				td.onclick = null;
			}
			
			span.appendChild(document.createTextNode(this.projectData[property] || " "));
			td.title = "Click to edit";
			span.style.position = "absolute";
			td.onclick = showInput.bind(this);
			
			input.value = this.projectData[property] || "";
			input.style.position = "absolute";
			input.style.visibility = "hidden";
			input.title = "Press Enter to save";
			input.style.width = "70%";
			input.style.marginLeft = "0";
			input.onkeyup = function(event){
				if(event.keyCode === 13){
					var properties = {};
					properties[property] = event.target.value;
					this.progress.progress(this.projectClient.changeProjectProperties(this.projectData, properties), "Saving project " + this.projectData.Name).then(
						function(newProjectData){
							if(newProjectData){
								this.projectData = newProjectData;
								lib.empty(span);
								span.appendChild(document.createTextNode(event.target.value));
								if(span.href){
									span.href = event.target.value;
								}
								span.style.visibility = "";
								event.target.style.visibility = "hidden";
								td.onclick = showInput.bind(this);
							}
						}.bind(this)
					);
				} else if(event.keyCode === 27) {
					span.style.visibility = "";
					event.target.style.visibility = "hidden";
					td.onclick = showInput.bind(this);
				}
			}.bind(this);
			input.onblur = function(event){
				span.style.visibility = "";
				event.target.style.visibility = "hidden";
				setTimeout(function(){
					//don't add onclick too soon, to avoid catching the event that triggered blur
					td.onclick = showInput.bind(this);
				}.bind(this), 100);
			};
		},
		renderProjectInfo: function(parent){
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			table.appendChild(tr);
			var td = document.createElement("th");
			td.colSpan = 2;
			td.appendChild(document.createTextNode("PROJECT INFORMATION"));
			tr.appendChild(td);

			tr = document.createElement("tr");
			table.appendChild(tr);
			td = document.createElement("td");
			var b = document.createElement("b");
			b.appendChild(document.createTextNode("Name"));
			td.appendChild(b);
			td.width = "20%";
			tr.appendChild(td);
			td = document.createElement("td");
			td.style.verticalAlign = "top";
			var nameSpan = document.createElement("span");
			var nameInput = document.createElement("input");
			
			this._renderEditableFields(td, nameSpan, nameInput, "Name");
			
			td.appendChild(nameSpan);
			td.appendChild(nameInput);
			
			tr.appendChild(td);
			table.appendChild(tr);
			
			tr = document.createElement("tr");
			table.appendChild(tr);
			td = document.createElement("td");
			b = document.createElement("b");
			b.appendChild(document.createTextNode("Description"));
			td.appendChild(b);
			td.width = "20%";
			tr.appendChild(td);
			td = document.createElement("td");
			td.style.verticalAlign = "top";
			td.style.height = "40px";
			var descriptionSpan = document.createElement("span");
			descriptionSpan.style.height = "40px";
			descriptionSpan.style.verticalAlign = "middle";
			descriptionSpan.style.overflow = "auto";
			descriptionSpan.style.width = "70%";
			var descriptionInput = document.createElement("textarea");
			descriptionInput.style.height = "40px";
			this._renderEditableFields(td, descriptionSpan, descriptionInput, "Description");
			
			td.appendChild(descriptionSpan);
			td.appendChild(descriptionInput);
			tr.appendChild(td);
			table.appendChild(tr);
			
			tr = document.createElement("tr");
			table.appendChild(tr);
			td = document.createElement("td");
			b = document.createElement("b");
			b.appendChild(document.createTextNode("Site"));
			td.appendChild(b);
			td.width = "20%";
			tr.appendChild(td);
			td = document.createElement("td");
			td.style.verticalAlign = "top";
			var a = document.createElement("a");
			a.href = this.projectData.Url;
			var urlInput = document.createElement("input");
			
			this._renderEditableFields(td, a, urlInput, "Url");
			
			td.appendChild(a);
			td.appendChild(urlInput);
			tr.appendChild(td);
			table.appendChild(tr);
			
			parent.appendChild(table);
		},
		renderReadmeMd: function(parent){
			
			var that = this;
			
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			table.appendChild(tr);
			var td = document.createElement("th");
			td.appendChild(document.createTextNode("README.MD"));
			var actionsSpan = document.createElement("span");
			actionsSpan.id = this.redmeCommandsScope;
			actionsSpan.style.cssFloat = "right";
			actionsSpan.style.textTransform = "none";
			td.appendChild(actionsSpan);
			tr.appendChild(td);

			tr = document.createElement("tr");
			table.appendChild(tr);
			td = document.createElement("td");
			//README.MD
			
			function displayReadmeFromChildren(children){
				var div;
				for(var i=0; i<children.length; i++){
					var child = children[i];
					if (!child.Directory && child.Name && child.Name.toLowerCase() === "readme.md") { //$NON-NLS-0$
						div = document.createElement("div");
						div.style.overflow = "auto";
						div.style.maxHeight = "400px";
						this.fileClient.read(child.Location).then(function(markdown){
							this.markdownView.display(div, markdown);
							this.commandService.renderCommands(this.redmeCommandsScope, actionsSpan, child, this, "tool");
						}.bind(this));
						td.appendChild(div);
						break;
					}
				}
				if(!div){
					td.appendChild(document.createTextNode("No readme in this project"));
					this.parentFolder.Project = this.projectData;
					this.commandService.renderCommands(this.redmeCommandsScope, actionsSpan, this.parentFolder, this, "tool");
				}
			}
			
			if(this.parentFolder.Children){
				displayReadmeFromChildren.call(this, this.parentFolder.Children);
			} else if(this.parentFolder.ChildrenLocation){
				this.progress.progress(this.fileClient.fetchChildren(this.parentFolder.ChildrenLocation), "Fetching children of " + this.parentFolder.Name).then( 
					displayReadmeFromChildren.bind(that)
				);
			}
			
			tr.appendChild(td);
			
			parent.appendChild(table);
		},
		renderAdditionalProjectProperties: function(parent){
			if(!this.projectData.type){
				return;
			}
			var projectHandler = this.projectClient.getProjectHandler(this.projectData.type);
			if(!projectHandler || !projectHandler.getAdditionalProjectProperties){
				return;
			}
			this.progress.progress(projectHandler.getAdditionalProjectProperties(this.parentFolder, this.projectData), "Getting additional project information").then(function(additionalProperties){
				if(!additionalProperties || !additionalProperties.length || additionalProperties.length === 0){
					return;
				}
				for(var i=0; i<additionalProperties.length; i++){
					var cat = additionalProperties[i];
					if(!cat.Name){
						continue;
					}
					var table = document.createElement("table");
					var tr = document.createElement("tr");
					table.appendChild(tr);
					var td = document.createElement("th");
					td.colSpan = 2;
					td.appendChild(document.createTextNode(cat.Name));
					var actionsSpan = document.createElement("span");
					td.appendChild(actionsSpan);
					tr.appendChild(td);
					
					if(cat.Children){
						for(var j=0; j<cat.Children.length; j++){
							var child = cat.Children[j];
							tr = document.createElement("tr");
							table.appendChild(tr);
							td = document.createElement("td");
							var b = document.createElement("b");
							b.appendChild(document.createTextNode(child.Name));
							td.appendChild(b);
							td.width = "20%";
							tr.appendChild(td);
							
							td = document.createElement("td");
							if(child.Href){
								var a = document.createElement("a");
								a.href = child.Href.replace("{OrionHome}", "..");
								a.appendChild(document.createTextNode(child.Value || " "));
								td.appendChild(a);
							} else {
								td.appendChild(document.createTextNode(child.Value || " "));
							}
							
							tr.appendChild(td);
						}
					}
					
					parent.appendChild(table);
				}
			}.bind(this));
		},
		renderDependencies: function(parent){
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			table.appendChild(tr);
			var td = document.createElement("th");
			td.colSpan = 2;
			td.appendChild(document.createTextNode("ASSOCIATED CONTENT"));
			var actionsSpan = document.createElement("span");
			actionsSpan.id = this.allDependenciesActions;
			actionsSpan.style.cssFloat = "right";
			actionsSpan.style.textTransform = "none";
			td.appendChild(actionsSpan);
			tr.appendChild(td);
			
			if(this.projectData.Dependencies && this.projectData.Dependencies.length>0){
				for(var i=0; i<this.projectData.Dependencies.length; i++){
					var dependency = this.projectData.Dependencies[i];
					tr = document.createElement("tr");
					table.appendChild(tr);
					td = document.createElement("td");
					td.appendChild(document.createTextNode(dependency.Name));
					var span = document.createElement("span");
					
					(function(td, span, dependency){
						this.projectClient.getDependencyFileMetadata(dependency, this.projectData.WorkspaceLocation).then(function(dependencyMetadata){
							if(dependencyMetadata){
								lib.empty(td);
								var a = document.createElement("a");
								a.href = "./edit.html#" + dependencyMetadata.Location;
								a.appendChild(document.createTextNode(dependency.Name));
								td.appendChild(a);
							}
						}, function(){
							lib.empty(td);
							td.appendChild(document.createTextNode(dependency.Name + " (disconnected)"));
							lib.empty(span);
							this.commandService.renderCommands(this.dependencyActions, span, {Dependency: dependency,  disconnected: true, Project: this.projectData}, this, "tool");
						}.bind(this));
					}).bind(this)(td, span, dependency);
					
					tr.appendChild(td);
					
					td = document.createElement("td");
					span.style.cssFloat = "right";
					td.appendChild(span);
					this.commandService.renderCommands(this.dependencyActions, span, {Dependency: dependency, Project: this.projectData}, this, "tool");
					tr.appendChild(td);
				}
				
			} else {
				tr = document.createElement("tr");
				table.appendChild(tr);
				td = document.createElement("td");
				td.appendChild(document.createTextNode("No associated content"));
				tr.appendChild(td);
			}
			
			parent.appendChild(table);
			this.projectData.type = "Project";
			this.commandService.renderCommands(this.allDependenciesActions, actionsSpan, this.projectData, this, "tool");
		}
	};
	
	return {ProjectEditor: ProjectEditor};
});