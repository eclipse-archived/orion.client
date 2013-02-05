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

define(['i18n!orion/settings/nls/messages', 'require', 'orion/commands', 'orion/fileClient', 'orion/selection', 'orion/explorers/navigationUtils', 'orion/explorers/explorer', 'orion/explorers/explorer-table', 'projects/DriveTreeRenderer', 'orion/fileUtils', 'orion/Deferred', 'projects/ProjectResponseHandler', 'projects/ProjectDataManager' ], 
	
	function(messages, require, mCommands, mFileClient, mSelection, mNavUtils, mExplorer, mExplorerTable, DriveTreeRenderer, mFileUtils, Deferred, ProjectResponseHandler) {
	
		var NAME_INDEX = 0;
		var ADDRESS_INDEX = NAME_INDEX + 1;
		var PATH_INDEX = ADDRESS_INDEX + 1;
		var PORT_INDEX =  PATH_INDEX + 1;	
		var USERNAME_INDEX = PORT_INDEX + 1;
		var PASSWORD_INDEX = USERNAME_INDEX + 1;
		var LAST_INDEX = PASSWORD_INDEX + 1;

		function Drive( details, commandService, serviceRegistry ){
			
			this.drivename = details.drivename;
			this.address = details.address;
			this.path = details.path;
			this.port = details.port;
			this.type = details.type;
			this.username = details.username;
			this.password = details.password;
			this.responseHandler = new ProjectResponseHandler( 'informationPane' );

			this.commandService = commandService;
			this.serviceRegistry = serviceRegistry;

			this.entryNode = document.createElement( 'div' );
			
			this.entryNode.innerHTML = this.templateString;
			
			this.content = this.entryNode.firstChild.firstChild.children[1];
			
			this.setDriveName( this.drivename );
			
			this.elements[NAME_INDEX]  = this.makeDriveElement( 'Name', this.drivename );
			this.elements[ADDRESS_INDEX] = this.makeDriveElement( 'Address', this.address );
//			this.elements[PATH_INDEX] = this.makeDriveElement( 'Path', this.path );
//			this.elements[PORT_INDEX] = this.makeDriveElement( 'Port', this.port );
//			this.elements[USERNAME_INDEX] = this.makeDriveElement( 'Username', this.username );
//			this.elements[PASSWORD_INDEX] = this.makeDriveElement( 'Password', this.password, "password" );
			
			for( var element = NAME_INDEX; element < this.elements.length; element++ ){
				this.content.appendChild( this.elements[element] );
			}
			
			var buttonArea = document.createElement( 'div' );
			buttonArea.className = "setting-property";
			buttonArea.innerHTML = '<div style="float:right;"></div><div style="float:right;"></div>';
			this.disconnectbutton = buttonArea.children[0];
			this.connectbutton = buttonArea.children[1];
			
			this.content.appendChild( buttonArea );
			
			var elements = this.elements;
			var registry = this.serviceRegistry;
			
			var thisDrive = this;
					
			// set up the toolbar level commands	
			var connectCommand = new mCommands.Command({
				name: 'Connect', //messages["Install"],
				tooltip: 'Connect to drive', //messages["Install a plugin by specifying its URL"],
				id: "orion.driveSave",
				callback: function(data) {
				
					var drivename = elements[NAME_INDEX].getValue();
				
					this.setDriveName( drivename );
					
					/* constuct the URL - example:
			           sftp://oriontest:orion2012@planetorion.org/home/oriontest/sampledata */
					
					var url = 'sftp://:@' + elements[ADDRESS_INDEX].getValue();
					
					var fileClient = new mFileClient.FileClient( this.serviceRegistry );			
					
					this.selection = new mSelection.Selection(this.serviceRegistry, "orion.directoryPrompter.selection"); //$NON-NLS-0$

					this.explorer = new mExplorerTable.FileExplorer({
						treeRoot: {children:[]}, 
						selection: this.selection, 
						serviceRegistry: this.serviceRegistry,
						fileClient: fileClient, 
						parentId: "Drives", 
						excludeFiles: true, 
						rendererFactory: function(explorer) {  //$NON-NLS-0$
							return new DriveTreeRenderer({checkbox: false, singleSelection: true, treeTableClass: "directoryPrompter" }, explorer);   //$NON-NLS-0$
					}}); //$NON-NLS-0$
					
					if (drivename) {
						var loadedWorkspace = fileClient.loadWorkspace("");
						
						var responseHandler = this;
						
						Deferred.when(loadedWorkspace, function(workspace) {
							fileClient.createProject( workspace.ChildrenLocation, drivename, url, true).then( responseHandler.handleSuccess.bind( responseHandler), responseHandler.handleError.bind( responseHandler) );
						});
					}

				}.bind(this)
			});
			
			this.commandService.addCommand(connectCommand);
			this.commandService.registerCommandContribution('driveCommand', "orion.driveSave", 1, /* not grouped */ null, false, /* no key binding yet */ null, null); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var disconnectCommand = new mCommands.Command({
				name: 'Disconnect', //messages["Install"],
				tooltip: 'Disconnect drive', //messages["Install a plugin by specifying its URL"],
				id: "orion.driveDisconnect",
				callback: thisDrive.disconnect.bind(thisDrive)
			});
			
			this.commandService.addCommand(disconnectCommand);
			this.commandService.registerCommandContribution('driveCommand', "orion.driveDisconnect", 1, /* not grouped */ null, false, /* no key binding yet */ null, null); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands('driveCommand', this.connectbutton, this, this, "button"); //$NON-NLS-0$
		}
		
		var elements = [];
		Drive.prototype.elements = elements;	
	
		var templateString = '<div style="overflow:hidden;">' + //$NON-NLS-0$
								'<section class="setting-row" role="region" aria-labelledby="Navigation-header">' +
									'<h3 class="setting-header" id="titleNode"></h3>' +
									'<div class="setting-content">' +
									'</div>' +
								'</section>' +
							'</div>'; //$NON-NLS-0$
						
		Drive.prototype.templateString = templateString;	
		
		function makeDriveElement( name, value, type ){
		
			if( !type ){ type = "text"; }
		
			var element = document.createElement( 'div' );
			
			element.className = "setting-property";
			
			element.innerHTML = '<label>' + //$NON-NLS-0$
//									'<span class="setting-label">' + name + ':</span>' + //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//									'<input class="setting-control" type="' + type + '">' + //$NON-NLS-0$
								'</label>';   //$NON-NLS-0$
								
			var label = document.createElement( 'label' );
			
			
			var span = document.createElement( 'span' );
			span.className = 'setting-label';
			span.innerHTML = name;
								
			var input = document.createElement( 'input' );
			input.className = 'setting-control';
			input.type = type;
			
			label.appendChild( span );
			label.appendChild( input );
			
			element.appendChild( label );
								
			input.value = value;
//			element.firstChild.children[1].value = value;
			
			element.getLabel = function(){
				return span.innerHTML;
			};
			
			element.getValue = function(){
				return input.value;
			};
							
			return element;
		}
		
		Drive.prototype.makeDriveElement = makeDriveElement;
		
		
		function disconnect(data){
			var fileClient = new mFileClient.FileClient( this.serviceRegistry );
					
			var loadedWorkspace = fileClient.loadWorkspace("");
		
			Deferred.when( loadedWorkspace, function(workspace) {

				var drives = workspace.DriveLocation;
				
				fileClient.read( workspace.DriveLocation, true ).then( function(folders){
					
					var driveName = elements[NAME_INDEX].getValue();
					
					var responseHandler = this;
					
					for( var folder = 0; folder < folders.Children.length;folder++ ){
					
						if( folders.Children[folder].Name === driveName ){
							for( var p =0; p< folders.Projects.length; p++ ){
								if( folders.Children[folder].Id === folders.Projects[p].Id ){
									fileClient.deleteFile( folders.Projects[p].Location, true ).then(responseHandler.handleSuccess.bind( responseHandler), responseHandler.handleError.bind( responseHandler ) );								
									break;
								}
							}
						}
					}
				});
	
				// myexplorer.loadResourceList( workspace.DriveLocation, true, null );
			});
		}
		
		function setDriveName( name ){
			this.entryNode.firstChild.firstChild.firstChild.innerHTML = name;			
		}
		
		Drive.prototype.setDriveName = setDriveName;
		
		function setDriveAddress( address ){
			this.entryNode.firstChild.firstChild.firstChild.innerHTML = name;
		}
		
		Drive.prototype.setDriveAddress = setDriveAddress;

		function toJSONData(){
			
			var jsonDrive = { 'drivename': this.elements[NAME_INDEX].getValue(), 
							  'address': this.elements[ADDRESS_INDEX].getValue()
							  /*, 'path': elements[PATH_INDEX].getValue(),
						      'port': elements[PORT_INDEX].getValue(),
						      'username': elements[USERNAME_INDEX].getValue() */ };					
			return jsonDrive;
		}
		
		Drive.prototype.toJSONData = toJSONData;
		
		function handleSuccess( result ){
		
			var evt = document.createEvent('Event');
			// define that the event name is `build`
			evt.initEvent('build', true, true);
			 
			// elem is any element
			this.entryNode.dispatchEvent(evt);
			
			this.responseHandler.handleSuccess( 'OK' );
		}
		
		Drive.prototype.handleSuccess = handleSuccess;
		
		function handleError( result ){
			var messageText = result.responseText;
			var message = JSON.parse( messageText );
			message = message.DetailedMessage;
			this.responseHandler.handleError( message );
		}
		
		Drive.prototype.handleError = handleError;

		var name;
		var address;
		var port;
		var type;
		var username;
		var password;
		var path;
		
		Drive.prototype.disconnect = disconnect;
		
		Drive.prototype.path = path;
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