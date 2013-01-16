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

define(['i18n!orion/settings/nls/messages', 'require', 'projects/DriveList' ], 
	
	function(messages, require, DriveList) {

		function SFTPConfiguration( node, projectData, commandService, serviceRegistry ){
		
			this.commandService = commandService;
			this.serviceRegistry = serviceRegistry;
			this.anchorNode = node;
			this.anchorNode.innerHTML = this.template;	
			this.projectNode = this.anchorNode.firstChild;
			this.showProjectConfiguration( this.listNode );	
			
			var drivelist = document.createElement( 'div' );
			
			this.projectNode.appendChild( drivelist );
			
			this.driveWidget = new DriveList( {}, drivelist, commandService, serviceRegistry );
			
			this.driveWidget.show();
		}
		
		SFTPConfiguration.prototype.constructor = SFTPConfiguration;
		
		var projectData;		
		SFTPConfiguration.prototype.projectData = projectData;
		
		var anchorNode;
		SFTPConfiguration.prototype.anchorNode = anchorNode;

		var projectNode;
		SFTPConfiguration.prototype.projectNode = projectNode;

		var listNode;
		SFTPConfiguration.prototype.listNode = listNode;
		
		var commandService;
		SFTPConfiguration.prototype.commandService = commandService;


		var template =	'<div id="configuration" class="projectConfiguration" role="tabpanel" style="padding-left:30px;max-width: 700px; min-width: 500px;" aria-labelledby="userSettings">' +	
							'<div class="sectionWrapper toolComposite">' +
									'<div class="sectionAnchor sectionTitle layoutLeft">Configuration</div>' + 
									'<div id="userCommands" class="layoutRight sectionActions"></div>' +
							'</div>' + //$NON-NLS-2$ //$NON-NLS-0$
							'<section class="setting-row" role="region" aria-labelledby="Navigation-header">' +
								'<h3 class="setting-header" data-dojo-attach-point="titleNode">Details</h3>' +
								'<div class="setting-content">' +
									'<div class="setting-property">' +  //$NON-NLS-0$
										'<label>' + //$NON-NLS-0$
											'<span class="setting-label">Project Name:</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											'<input class="setting-control" type="text" name="myname">' + //$NON-NLS-0$
										'</label>' +  //$NON-NLS-0$
									'</div>' +
									'<div class="setting-property">' +  //$NON-NLS-0$
										'<label>' + //$NON-NLS-0$
											'<span class="setting-label">Project URL:</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											'<input class="setting-control" type="text" name="myname">' + //$NON-NLS-0$
										'</label>' +  //$NON-NLS-0$
									'</div>' +
								'</div>' +
							'</section>' +
						'</div>';							
											
		SFTPConfiguration.prototype.template = template;
		
		function showProjectConfiguration(parent, name){

		}
		
		SFTPConfiguration.prototype.showProjectConfiguration = showProjectConfiguration;

		return SFTPConfiguration;
	}
);