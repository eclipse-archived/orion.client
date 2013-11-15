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
define(['orion/URITemplate', 'orion/webui/littlelib', 'orion/projectCommands', 'orion/commandRegistry', 'orion/PageLinks'],
	function(URITemplate, lib, mProjectCommands, mCommandRegistry, PageLinks) {
	
	var editTemplate = new URITemplate("./edit.html#{,resource,params*}"); //$NON-NLS-0$
	
	function ProjectEditor(options){
		this.serviceRegistry = options.serviceRegistry;
		this.fileClient = options.fileClient;
		this.progress = options.progress;
		this.projectClient = this.serviceRegistry.getService("orion.project.client");
		this.commandService = options.commandService;
		this._node = null;
		this.dependencyActions = "dependencyActions";
		this.createCommands();
	}
	ProjectEditor.prototype = {
		createCommands: function(){
			mProjectCommands.createDependencyCommands(this.serviceRegistry, this.commandService, this, this.fileClient, this.projectClient);
			var dependencyTypes = this.projectClient.getProjectHandlerTypes();
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
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			table.appendChild(tr);
			var td = document.createElement("th");
			td.colSpan = 2;
			td.appendChild(document.createTextNode("Project Information"));
			tr.appendChild(td);

			// NAME
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
			var nameInput = document.createElement("input");
			this._renderEditableFields(nameInput, "Name", 1, null);

			td.appendChild(nameInput);
			tr.appendChild(td);
			table.appendChild(tr);
			
			// DESCRIPTION
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
			var descriptionInput = document.createElement("textarea");
			descriptionInput.style.height = "40px";
			this._renderEditableFields(descriptionInput, "Description", 2, null);

			td.appendChild(descriptionInput);
			tr.appendChild(td);
			table.appendChild(tr);
			
			// SITE
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
			
			var urlInput = document.createElement("input");
			urlInput.style.visibility = "hidden";
			
			var urlSelector = document.createElement("div");
			urlSelector.title = "Click to edit";
			urlSelector.className = "discreetInput";
			urlSelector.tabIndex = 3;	//this is the same as the urlInput's tab index but they will never be visible at the same time
			
			var urlLink = document.createElement("a");
			urlLink.href = this.projectData.Url || "";
			urlLink.appendChild(document.createTextNode(this.projectData.Url || ""));
			urlLink.tabIndex = 4;
						
			urlSelector.appendChild(urlLink);
			urlSelector.title = "Click to edit";
	
			//show url input, hide selector
			urlSelector.onclick = function (event){
				urlSelector.style.visibility = "hidden";
				urlLink.style.visibility = "hidden";
				urlInput.style.visibility = "";
				urlInput.focus();
			}.bind(this);
			
			//make the url editable when the selector gains focus
			urlSelector.onfocus = urlSelector.onclick;
			
			//Make pressing "Enter" on the selector do the same think as clicking it
			urlSelector.onkeyup = function(event){
				if(event.keyCode === lib.KEY.ENTER){
					urlSelector.onclick(event);
				}
			}.bind(this);
			
			urlLink.urlSelector = urlSelector; //refer to selector to be able to make it visible from within _renderEditableFields
			
			this._renderEditableFields(urlInput, "Url", 3, urlLink);
			
			td.appendChild(urlSelector);
			td.appendChild(urlInput);
			tr.appendChild(td);
			table.appendChild(tr);
			
			parent.appendChild(table);
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
						var table = document.createElement("table");
						var tr = document.createElement("tr");
						table.appendChild(tr);
						var td = document.createElement("th");
						td.colSpan = 2;
						td.appendChild(document.createTextNode(cat.name));
						var actionsSpan = document.createElement("span");
						td.appendChild(actionsSpan);
						tr.appendChild(td);
						
						if(cat.children){
							for(var j=0; j<cat.children.length; j++){
								var child = cat.children[j];
								tr = document.createElement("tr");
								table.appendChild(tr);
								td = document.createElement("td");
								var b = document.createElement("b");
								b.appendChild(document.createTextNode(child.name));
								td.appendChild(b);
								td.width = "20%";
								tr.appendChild(td);
								
								td = document.createElement("td");
								if(child.href){
									var a = document.createElement("a");
									var uriTemplate = new URITemplate(child.href);
									a.href = uriTemplate.expand({OrionHome : PageLinks.getOrionHome()});
									a.appendChild(document.createTextNode(child.value || " "));
									td.appendChild(a);
								} else {
									td.appendChild(document.createTextNode(child.value || " "));
								}
								
								tr.appendChild(td);
							}
						}
						
						parent.appendChild(table);
					}
				}.bind(this));
			}
			}.bind(this));
		},
		renderDependencies: function(parent){
			
			if(!this.projectData.Dependencies || this.projectData.Dependencies.length===0){
				return;
			}
			
			var table = document.createElement("table");
			var tr = document.createElement("tr");
			table.appendChild(tr);
			var td = document.createElement("th");
			td.appendChild(document.createTextNode("Associated Content"));
			tr.appendChild(td);
			td = document.createElement("th");
			tr.appendChild(td);
			
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
							a.href = editTemplate.expand({resource: dependencyMetadata.Location}); //$NON-NLS-0$
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
				
			parent.appendChild(table);
			this.projectData.type = "Project";
		}
	};
	
	return {ProjectEditor: ProjectEditor};
});
