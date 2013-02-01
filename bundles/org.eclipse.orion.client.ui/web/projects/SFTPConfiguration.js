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

define(['i18n!orion/settings/nls/messages', 'require', 'projects/DriveList', 'orion/commands', 'projects/ProjectDataManager', 'projects/ProjectData', 'projects/ProjectResponseHandler' ], 
	
	function(messages, require, DriveList, mCommands, ProjectDataManager, ProjectData, ProjectResponseHandler ) {

		function SFTPConfiguration( project, node, projectData, commandService, serviceRegistry ){
		
			this.commandService = commandService;
			this.serviceRegistry = serviceRegistry;
			this.anchorNode = node;
			this.anchorNode.innerHTML = this.template;	
			this.projectNode = this.anchorNode.firstChild;
			this.responseHandler = new ProjectResponseHandler( 'informationPane' );
			
			var drivelist = document.createElement( 'div' );
			
			this.projectData = project;
			
			this.projectNode.appendChild( drivelist );

			this.driveWidget = new DriveList( {}, drivelist, commandService, serviceRegistry );
			
			this.projectDataManager = new ProjectDataManager( serviceRegistry );
			
			this.driveWidget.show();

			/* Set up drives */
			
			var driveListContainer = this.driveWidget;
			
			var thisSFTPConfiguration = this;
			
			var saveConfigCommand = new mCommands.Command({
				name: 'Save', //messages["Install"],
				tooltip: 'Saves configuration',
				id: "orion.saveProjectConfig", //$NON-NLS-0$
				callback: thisSFTPConfiguration.saveConfiguration.bind(thisSFTPConfiguration)
			});
			
			this.commandService.addCommand(saveConfigCommand);
			this.commandService.registerCommandContribution("configurationCommands", "orion.saveProjectConfig", 1, /* not grouped */ null, false, /* no key binding yet */ null, null ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands("configurationCommands", "configurationCommands", this, this, "button"); //$NON-NLS-0$
			
			var drivelist = document.createElement( 'div' );
			this.projectNode.appendChild( drivelist );

			if( project ){	
			
				this.setProjectName( project.name );
			
				this.setProjectAddress( project.address );
				
				this.setProjectDescription( project.description );
			
				for( var d = 0; d < project.drives.length; d++ ){
					this.driveWidget.newDrive( project.drives[d] );
					this.driveWidget.addRows();
				}
				
				if( !project.workspace ){
					this.projectDataManager.createProjectWorkspace();
				}
				
			}else{
				this.projectDataManager.getProjectData( this.createEmptyProject.bind( this ) );
			}
		}

		function createEmptyProject( projectData ){
			var projectCount = projectData.length;
			var projectNumber = projectCount +1;
			var projectName = 'Project ' + projectNumber ;
			this.setProjectName( projectName );		
			this.driveWidget.newDrive();
			this.driveWidget.addRows();
			
			this.saveConfiguration();		
		}
		
		function saveConfiguration(){
			
			var project = new ProjectData();
			project.name = this.getProjectName();
			project.address = this.getProjectAddress();
			project.drives = this.driveWidget.getJSONDrives();
			project.description = this.getProjectDescription();
			
			var titleArea = document.getElementById( 'titleArea');
			titleArea.innerHTML = '<strong>Project: </strong>' + project.name;
		
			this.projectDataManager.save( project, this.handleFeedback.bind( this) );
		}
		
		function handleFeedback( x, y ){
			this.handleSuccess();
		}

		var template =	'<div id="configuration" class="projectConfiguration" role="tabpanel" style="padding-left:30px;max-width: 700px; min-width: 500px;" aria-labelledby="userSettings">' +	
							'<div class="sectionWrapper toolComposite">' +
									'<div class="sectionAnchor sectionTitle layoutLeft">Configuration</div>' + 
									'<div id="userCommands" class="layoutRight sectionActions"></div>' +
									'<div id="configurationCommands" class="configurationCommands layoutRight sectionActions"></div>' +
							'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
							
							'<section class="setting-row" role="region" aria-labelledby="Navigation-header">' +
								'<h3 class="setting-header" id="titleNode">Details</h3>' +
								'<div class="setting-content">' +
									'<div class="setting-property">' +  //$NON-NLS-0$
										'<label>' + //$NON-NLS-0$
											'<span class="setting-label">Project Name:</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											'<input id="projectName" class="setting-control" type="text" name="myname">' + //$NON-NLS-0$
										'</label>' +  //$NON-NLS-0$
									'</div>' +
									'<div class="setting-property">' +  //$NON-NLS-0$
										'<label>' + //$NON-NLS-0$
											'<span class="setting-label">Project URL:</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											'<input id="projectAddress" class="setting-control" type="text" name="myname">' + //$NON-NLS-0$
										'</label>' +  //$NON-NLS-0$
									'</div>' +
									'<div class="setting-property">' +  //$NON-NLS-0$
										'<label>' + //$NON-NLS-0$
											'<span class="setting-label" style="vertical-align:top;">Project Description:</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											'<textarea id="projectDescription" class="setting-control" rows="4" cols="50"></textarea>' + //$NON-NLS-0$
										'</label>' +  //$NON-NLS-0$
									'</div>' +
								'</div>' +
							'</section>' +
						'</div>';							
											
		SFTPConfiguration.prototype.template = template;
		
		var projectDataManager;
		
		function showProjectConfiguration(parent, name){

		}

		function setProjectName( projectname ){
			var nameNode = document.getElementById( "projectName" );
			nameNode.value = projectname;
		}
		
		function getProjectName(){
			var name;
			var nameNode = document.getElementById( "projectName" );
			name = nameNode.value;
			return name;
		}
		
		function setProjectAddress( projectaddress ){
			var addressNode = document.getElementById( "projectAddress" );
			addressNode.value = projectaddress;
		}
		
		function getProjectAddress(){
			var address;
			var addressNode = document.getElementById( "projectAddress" );
			address = addressNode.value;
			return address;
		}
		
		function handleSuccess( result ){
			this.responseHandler.handleSuccess( 'Configuration Saved' );
		}
		
		function setProjectDescription( description ){
			var descriptionNode = document.getElementById( "projectDescription" );
			descriptionNode.value = description;
		}
		
		function getProjectDescription(){
			var description;
			var descriptionNode = document.getElementById( "projectDescription" );
			description = descriptionNode.value;
			return description;
		}
		
		SFTPConfiguration.prototype.handleSuccess = handleSuccess;
		
		function handleError( result ){
			var messageText = result.responseText;
			var message = JSON.parse( messageText );
			message = message.DetailedMessage;
			this.responseHandler.handleError( message );
		}
		
		SFTPConfiguration.prototype.handleError = handleError;
		
		SFTPConfiguration.prototype.projectDataManager = projectDataManager;
		SFTPConfiguration.prototype.handleFeedback = handleFeedback;
		SFTPConfiguration.prototype.saveConfiguration = saveConfiguration;
		SFTPConfiguration.prototype.createEmptyProject = createEmptyProject;
		SFTPConfiguration.prototype.showProjectConfiguration = showProjectConfiguration;
		SFTPConfiguration.prototype.setProjectName = setProjectName;
		SFTPConfiguration.prototype.setProjectAddress = setProjectAddress;	
		SFTPConfiguration.prototype.getProjectName = getProjectName;
		SFTPConfiguration.prototype.getProjectAddress = getProjectAddress;
		SFTPConfiguration.prototype.setProjectDescription = setProjectDescription;
		SFTPConfiguration.prototype.getProjectDescription = getProjectDescription;

		return SFTPConfiguration;
	}
);