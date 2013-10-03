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
	'orion/selection',
	'orion/webui/littlelib'], function(mProjectExplorer, Selection, lib) {
		function ProjectView(options){
			this.progress = options.progress;
			this.fileClient = options.fileClient;
			this.serviceRegistry = options.serviceRegistry;
			this.commandService = options.commandService;
			this.projectClient = this.serviceRegistry.getService("orion.project.client");
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
			}
		};
		
	return {ProjectView: ProjectView};
});