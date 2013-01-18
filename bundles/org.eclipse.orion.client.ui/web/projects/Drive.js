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

define(['i18n!orion/settings/nls/messages', 'require', 'orion/commands', 'orion/fileClient', 'orion/selection', 'orion/explorers/navigationUtils', 'orion/explorers/explorer', 'orion/explorers/explorer-table', 'projects/DriveTreeRenderer', 'orion/fileUtils', 'orion/Deferred' ], 
	
	function(messages, require, mCommands, mFileClient, mSelection, mNavUtils, mExplorer, mExplorerTable, DriveTreeRenderer, mFileUtils, Deferred) {
	
		var NAME_INDEX = 0;
		var ADDRESS_INDEX = 1;
		var PORT_INDEX = 2;
		var USERNAME_INDEX = 3;
		var PASSWORD_INDEX = 4;
		var LAST_INDEX = 5;

		function Drive( details, commandService, serviceRegistry ){
			
			this.name = details.drivename;
			this.address = details.address;
			this.port = details.port;
			this.type = details.type;
			this.username = details.username;
			this.password = details.password;

			this.commandService = commandService;
			this.serviceRegsitry = serviceRegistry;

			this.entryNode = document.createElement( 'div' );
			
			this.entryNode.innerHTML = this.templateString;
			
			this.content = this.entryNode.firstChild.firstChild.children[1];
			
			this.setDriveName( this.name );
			
			this.elements[NAME_INDEX]  = this.makeDriveElement( 'Name', this.name );
			this.elements[ADDRESS_INDEX] = this.makeDriveElement( 'Address', this.address );
			this.elements[PORT_INDEX] = this.makeDriveElement( 'Port', this.port );
			this.elements[USERNAME_INDEX] = this.makeDriveElement( 'Username', this.username );
			this.elements[PASSWORD_INDEX] = this.makeDriveElement( 'Password', this.password );
			
			for( var element = NAME_INDEX; element < this.elements.length; element++ ){
				this.content.appendChild( this.elements[element] );
			}
			
			var buttonArea = document.createElement( 'div' );
			buttonArea.className = "setting-property";
			buttonArea.innerHTML = '<div style="float:right;"></div>';
			this.saveButton = buttonArea.firstChild;
			
			this.content.appendChild( buttonArea );
			
			var elements = this.elements;
			var registry = this.serviceRegsitry;
			
			// set up the toolbar level commands	
			var installPluginCommand = new mCommands.Command({
				name: 'Save', //messages["Install"],
				tooltip: 'Save configuration', //messages["Install a plugin by specifying its URL"],
				id: "orion.driveSave",
				callback: function(data) {
				
					var drivename = elements[NAME_INDEX].getValue();
				
					this.setDriveName( drivename );
				
					for( var item in elements ){
						console.log( elements[item].getValue() );
					}
					
					/* constuct the URL - example:
			           sftp://oriontest:orion2012@planetorion.org/home/oriontest/sampledata */
					
					var url = 'sftp://' + elements[USERNAME_INDEX].getValue() + ':' + elements[PASSWORD_INDEX].getValue() + '@' + elements[ADDRESS_INDEX].getValue();
					
					console.log( url );
					
					var fileClient = new mFileClient.FileClient( registry );			
					
					this.selection = new mSelection.Selection(registry, "orion.directoryPrompter.selection"); //$NON-NLS-0$

					this.explorer = new mExplorerTable.FileExplorer({
						treeRoot: {children:[]}, 
						selection: this.selection, 
						serviceRegistry: this._serviceRegistry,
						fileClient: fileClient, 
						parentId: "Drives", 
						excludeFiles: true, 
						rendererFactory: function(explorer) {  //$NON-NLS-0$
							return new DriveTreeRenderer({checkbox: false, singleSelection: true, treeTableClass: "directoryPrompter" }, explorer);   //$NON-NLS-0$
					}}); //$NON-NLS-0$
					
					if (drivename) {
						var loadedWorkspace = fileClient.loadWorkspace("");
						
						Deferred.when(loadedWorkspace, function(workspace) {
							fileClient.createProject( workspace.ChildrenLocation, drivename, url, true);
						});
					}

				}.bind(this)
			});
			
			this.commandService.addCommand(installPluginCommand);
			this.commandService.registerCommandContribution('driveCommand', "orion.driveSave", 1, /* not grouped */ null, false, /* no key binding yet */ null, null); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('driveCommand', this.saveButton, this, this, "button"); //$NON-NLS-0$
		}
		
		var elements = [];
		Drive.prototype.elements = elements;	
	
		var templateString = '<div style="overflow:hidden;">' + //$NON-NLS-0$
								'<section class="setting-row" role="region" aria-labelledby="Navigation-header">' +
									'<h3 class="setting-header" data-dojo-attach-point="titleNode"></h3>' +
									'<div class="setting-content">' +
									'</div>' +
								'</section>' +
							'</div>'; //$NON-NLS-0$
						
		Drive.prototype.templateString = templateString;	
		
		function makeDriveElement( name, value ){
		
			var element = document.createElement( 'div' );
			
			element.className = "setting-property";
			
			element.innerHTML = '<label>' + //$NON-NLS-0$
									'<span class="setting-label">' + name + ':</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
									'<input class="setting-control" type="text" name="myname">' + //$NON-NLS-0$
								'</label>';   //$NON-NLS-0$
								
			element.firstChild.children[1].value = value;
			
			element.getLabel = function(){
				return element.firstChild.children[0].innerHTML;
			};
			
			element.getValue = function(){
				return element.firstChild.children[1].value;
			};
							
			return element;
		}
		
		Drive.prototype.makeDriveElement = makeDriveElement;
		
		function setDriveName( name ){
			this.entryNode.firstChild.firstChild.firstChild.innerHTML = name;			
		}
		
		Drive.prototype.setDriveName = setDriveName;
		
		function setDriveAddress( address ){
			this.entryNode.firstChild.firstChild.firstChild.innerHTML = name;
		}
		
		Drive.prototype.setDriveAddress = setDriveAddress;

		var name;
		var address;
		var port;
		var type;
		var username;
		var password;
		
		Drive.prototype.name = name;
		Drive.prototype.type = type;
		Drive.prototype.port = port;
		Drive.prototype.address = address;
		Drive.prototype.username = username;
		Drive.prototype.password = password;
		Drive.prototype.constructor = Drive;
		
		return Drive;
	}
);