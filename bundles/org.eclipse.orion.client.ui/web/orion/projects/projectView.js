/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global define document window*/
define(['orion/projects/projectExplorer',
	'orion/projectClient',
	'orion/selection',
	'orion/projectCommands',
	'orion/webui/littlelib'], function(mProjectExplorer, mProjectClient, Selection, ProjectCommands, lib) {
		function ProjectView(options){
			this.progress = options.progress;
			this.fileClient = options.fileClient;
			this.serviceRegistry = options.serviceRegistry;
			this.commandService = options.commandService;
			this.projectClient = new mProjectClient.ProjectClient(this.serviceRegistry, this.fileClient);
			this.createCommands();
		};
		ProjectView.prototype = {
			display: function(workspace, parent){
				var _self = this;
				parent.classList.add("orionProject");
				this.projectExplorer = new mProjectExplorer.ProjectExplorer(parent, this.serviceRegistry, new Selection.Selection(this.serviceRegistry), this.commandServic);
				this.changedItem(workspace);
			},
			changedItem: function(parent, children, changeType){
				var _self = this;
				if(changeType === "created" && parent.ContentLocation){
					window.location = "../edit/edit.html#" + parent.ContentLocation + "?depth=1";
					return;
				}
				if(parent){
					_self.progress.progress(_self.projectClient.readAllProjects(parent), "Listing projects").then(function(projects){
						_self.projectExplorer.loadProjects(projects);
						lib.empty(_self.projectExplorer.newActionsSpan);
						_self.commandService.renderCommands(mProjectExplorer.newActionsScope, _self.projectExplorer.newActionsSpan, parent, _self.projectExplorer, "tool");
					});
				} else {
					_self.progress.progress(_self.fileClient.loadWorkspace(), "Getting workspace information").then(function(workspace){
						_self.progress.progress(_self.projectClient.readAllProjects(parent), "Listing projects").then(function(projects){
							_self.projectExplorer.loadProjects(projects);
							lib.empty(_self.projectExplorer.newActionsSpan);
							_self.commandService.renderCommands(mProjectExplorer.newActionsScope, _self.projectExplorer.newActionsSpan, parent, _self.projectExplorer, "tool");
						});
					});
				}
			},
			createCommands: function(){
				this.commandService.addCommandGroup(mProjectExplorer.newActionsScope, "orion.projectsNewGroup", 1, "Create Project", null, null, "core-sprite-addcontent"); //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerCommandContribution(mProjectExplorer.newActionsScope, "orion.project.create.basic", 1, "orion.projectsNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerCommandContribution(mProjectExplorer.newActionsScope, "orion.project.create.fromfile", 2, "orion.projectsNewGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				var dependencyTypes = this.projectClient.getProjectHandlerTypes();
				for(var i=0; i<dependencyTypes.length; i++){
					this.commandService.registerCommandContribution(mProjectExplorer.newActionsScope, "orion.project.createproject." + dependencyTypes[i], i+3, "orion.projectsNewGroup"); //$NON-NLS-1$ //$NON-NLS-0$
				}
				
				ProjectCommands.createProjectCommands(this.serviceRegistry, this.commandService, this, this.fileClient, this.projectClient);
			}
		};
		
	return {ProjectView: ProjectView};
});