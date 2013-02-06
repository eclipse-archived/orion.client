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

define(['i18n!orion/settings/nls/messages', 'require', 'orion/commands', 'orion/section', 'projects/DriveTreeRenderer', 'orion/Deferred', 'orion/fileCommands', 'projects/ProjectExplorer' ], 
	
	function(messages, require, mCommands, mSection, DriveTreeRenderer, Deferred, mFileCommands, ProjectExplorer ) {

		function ProjectNavigation( project, workspace, anchor, serviceRegistry, commandService, progressService, fileClient, contentTypeService ){
		
			this.commandService = commandService;
			
			this.serviceRegistry = serviceRegistry;
			
			this.project = project;
			
			this.anchor = anchor;
			
			this.progressService = progressService;
			
			this.fileClient = fileClient;
			
			this.contentTypeService = contentTypeService;
			
			this.workspace = workspace;
			
			this.anchor.innerHTML = this.template;
			
			this.addWorkingSet( this );
			
			this.addDrives( this );
			
			this.addCommands();	
		}
		
		var workingSetNode;
		ProjectNavigation.prototype.workingSetNode = workingSetNode;
		
		var drivesNode;
		ProjectNavigation.prototype.workingSetNode = drivesNode;
		
		var streamsNode;
		ProjectNavigation.prototype.workingSetNode = streamsNode;
			
		var anchor;
		ProjectNavigation.prototype.anchor = anchor;
		
		var project;
		ProjectNavigation.prototype.project = project;
		
		var template = '<div>' +
							'<div id="configuration"></div>' +
							'<div id="workingSet">' +
							'</div>' +
							'<div id="drives">' +
							'</div>' +
							'<div id="streams">' +
							'</div>' +
						'</div>';
						
		ProjectNavigation.prototype.template = template;
		
		function addDrivesTree( parentNode, drivenames ){
			
			var self = this;
			
			this.drivesExplorer = new ProjectExplorer({							
				selection: this.selection, 
				serviceRegistry: this.serviceRegistry,
				fileClient: this.fileClient, 
				parentId: parentNode, 
				rendererFactory: function(explorer) {  //$NON-NLS-0$
				
					var renderer = new DriveTreeRenderer({
						checkbox: false, 
						cachePrefix: "Drives"}, explorer, self.commandService, self.contentTypeService);
						
					return renderer;
			}}); //$NON-NLS-0$
			
			this.drivesExplorer.loadDriveList( this.workspace, drivenames );
		}
		
		ProjectNavigation.prototype.addDrivesTree = addDrivesTree;
		
		function createSection( node, content, id, title, scope ){
		
			var serviceRegistry = this.serviceRegistry;
			var commandService = this.commandService;
		
			var section = new mSection.Section( node, {
			
				id: id, //$NON-NLS-0$
				title: title, //$NON-NLS-0$
				content: content, //$NON-NLS-0$
				preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
				canHide: true,
				useAuxStyle: true,
				slideout: true,
				onExpandCollapse: function(isExpanded, section) {
					commandService.destroy(section.selectionNode);
					if (isExpanded) {
						commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, scope, "button"); //$NON-NLS-0$
					}
				}
			});
				
			return section;
		}
		
		function addWorkingSet( scope ){
			
			this.workingSetNode = this.anchor.firstChild.children[1];
			
			var workingSetContent = '<div id="WorkingSetContent"></div>';
		
			this.workingSetSection = this.createSection( this.workingSetNode, workingSetContent, 'workingSet', 'Working Set', scope );
			
			var self = this;
			
			this.workingSetExplorer = new ProjectExplorer({							
				selection: this.selection, 
				serviceRegistry: this.serviceRegistry,
				fileClient: this.fileClient, 
				parentId: "WorkingSetContent",   // content DOM id
				rendererFactory: function(explorer) {  //$NON-NLS-0$
				
					var renderer = new DriveTreeRenderer({
						checkbox: false, 
						cachePrefix: "WorkingSet"}, explorer, self.commandService, self.contentTypeService);
						
					return renderer;
			}}); //$NON-NLS-0$
			
			// TODO get the working sets from (wherever) and pass them in for filtering by the explorer
			this.workingSetExplorer.loadWorkingSets( this.workspace, [] );

			
		}
		
		ProjectNavigation.prototype.addWorkingSet = addWorkingSet;
		
		function addDrives( scope ){
		
			this.drivesNode = this.anchor.firstChild.children[2];
			
			var driveContent = '<div id="DriveContent"></div>';
			
			this.drivesSection = this.createSection( this.drivesNode, driveContent, 'drives', "Drives", scope );
			
			var drivenames = [];
			
			if( this.project ){
				for( var p = 0; p < this.project.drives.length; p++ ){
					drivenames.push( this.project.drives[p].drivename );
				}
			}
			
			this.addDrivesTree("DriveContent", drivenames );			
		}
		
		ProjectNavigation.prototype.addDrives = addDrives;
		
		function addStreams( scope ){
		
			this.streamsNode = this.anchor.firstChild.children[3];
			
			var streamsContent = '<div id="streams"></div>';
			
			this.streamsSection = this.createSection( this.workingSetNode, streamsContent, 'streams', 'Streams', scope ); 
	
		}
		
		ProjectNavigation.prototype.addStreams = addStreams;
		
		ProjectNavigation.prototype.createSection = createSection;
					
		function addCommands(){
		
			var saveConfigCommand = new mCommands.Command({
				name: 'Configure', //messages["Install"],
				tooltip: 'Configure Project',
				id: "orion.projectConfiguration", //$NON-NLS-0$
				callback: function(data) {
					console.log( 'configure project' );
				}.bind(this)
			});
			
			this.commandService.addCommand(saveConfigCommand);
			this.commandService.registerCommandContribution("projectConfiguration", "orion.projectConfiguration", 1, /* not grouped */ null, false, /* no key binding yet */ null, null ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands("projectConfiguration", "projectConfiguration", this, this, "button"); //$NON-NLS-0$
		}
		
		ProjectNavigation.prototype.addCommands = addCommands;
		
		var workingSetSection;
		ProjectNavigation.prototype.workingSetSection = workingSetSection;
			
		return ProjectNavigation;
	}
);
			