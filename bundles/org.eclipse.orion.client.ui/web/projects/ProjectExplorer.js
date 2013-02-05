/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define window orion document */
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'orion/Deferred', 'orion/explorers/explorer-table', 'orion/webui/littlelib', 'orion/fileUtils', 'orion/explorers/explorer'], 
function(messages, Deferred, mFileExplorer, lib, mFileUtils, mExplorer) {

	function ProjectExplorer(){
		mFileExplorer.FileExplorer.apply( this, arguments );
	}
	
	ProjectExplorer.prototype = Object.create( mFileExplorer.FileExplorer.prototype ); 
	
	ProjectExplorer.prototype.includeDrive = function( driveName ){
	
		var outcome = false;
		
		if( this.driveNames ){
			for( var drive = 0; drive < this.driveNames.length; drive++ ){
			
				if( this.driveNames[drive] === driveName ){
					outcome = true;
					break;
				}
			}
		}
		
		return outcome;
	};
	
	
	ProjectExplorer.prototype.loadWorkingSets = function( workspace, driveNames, workingsets ) {
	
		var parent = lib.node(this.parentId);			
		
		this.driveNames = driveNames;
		
		// Progress indicator
		var progress = lib.node("progress");  //$NON-NLS-0$
		if(!progress){
			progress = document.createElement("div"); //$NON-NLS-0$
			progress.id = "progress"; //$NON-NLS-0$
			lib.empty(parent);
			parent.appendChild(progress);
		}
		lib.empty(progress);
		
		var progressTimeout = setTimeout(function() {
			lib.empty(progress);
			var b = document.createElement("b"); //$NON-NLS-0$
			progress.appendChild(document.createTextNode("Loading Drives..."));
			progress.appendChild(b);
		}, 500); // wait 500ms before displaying
			
		var self = this;
		
		var errorHandler = function(error) {
			clearTimeout(progressTimeout);
			// Show an error message when a problem happens during getting the workspace
			if (error.status && error.status !== 401){
				try {
					error = JSON.parse(error.responseText);
				} catch(e) {
				}
				lib.empty(progress);
				progress.appendChild(document.createTextNode(messages["Sorry, an error occurred: "] + error.Message)); 
			} else {
				self.registry.getService("orion.page.message").setProgressResult(error); //$NON-NLS-0$
			}
		};
		
		// Create a root that represents the workspace (Orion file system) root.  But rename it "Orion Content".  Renaming it is a cheat, we know that
		// we are dealing with the Orion file system.
		var orionFileSystem = {};
		for (var property in workspace) {
			orionFileSystem[property] = workspace[property];
		}
		orionFileSystem.Name = "Orion Content"; //$NON-NLS-0$
		
		var treeRoots = [];
		var result;
		if (workspace.DriveLocation) {
			result = new Deferred();
			self.fileClient.loadWorkspace(workspace.DriveLocation).then(function (driveRoot) {
				driveRoot.Children.forEach(function(drive) {
					// drives relevant to the project should be pushed onto the treeRoots array.
					
					if( self.includeDrive( drive.Name ) ){
						treeRoots.push(drive);
					}
				});
				treeRoots.push(orionFileSystem);
				result.resolve(treeRoots);

			}, errorHandler);
		} else {
			treeRoots.push(orionFileSystem);
			result = treeRoots;
		}
		Deferred.when(result, function(roots) {
			self.treeRoot = { Children: roots };
			self.model = new mFileExplorer.FileModel(self.registry, self.treeRoot, self.fileClient, self.parentId);
			self.model.processParent(self.treeRoot, roots);	

			clearTimeout(progressTimeout);	
			self.createTree( 	self.parentId, 
								self.model, 
								{	setFocus: true, 
									selectionPolicy: self.renderer.selectionPolicy, 
									onCollapse: 
									function(model){
										if( self.getNavHandler() ){
											self.getNavHandler().onCollapse(model);
										}
									}
								} );
								
			if (typeof self.onchange === "function") { //$NON-NLS-0$
				self.onchange(self.treeRoot);
			}
		}, errorHandler);
	};
	
	ProjectExplorer.prototype.loadDriveList = function( workspace, driveNames ) {
		var parent = lib.node(this.parentId);			
		
		this.driveNames = driveNames;
		
		// Progress indicator
		var progress = lib.node("progress");  //$NON-NLS-0$
		if(!progress){
			progress = document.createElement("div"); //$NON-NLS-0$
			progress.id = "progress"; //$NON-NLS-0$
			lib.empty(parent);
			parent.appendChild(progress);
		}
		lib.empty(progress);
		
		var progressTimeout = setTimeout(function() {
			lib.empty(progress);
			var b = document.createElement("b"); //$NON-NLS-0$
			progress.appendChild(document.createTextNode("Loading Drives..."));
			progress.appendChild(b);
		}, 500); // wait 500ms before displaying
			
		var self = this;
		
		var errorHandler = function(error) {
			clearTimeout(progressTimeout);
			// Show an error message when a problem happens during getting the workspace
			if (error.status && error.status !== 401){
				try {
					error = JSON.parse(error.responseText);
				} catch(e) {
				}
				lib.empty(progress);
				progress.appendChild(document.createTextNode(messages["Sorry, an error occurred: "] + error.Message)); 
			} else {
				self.registry.getService("orion.page.message").setProgressResult(error); //$NON-NLS-0$
			}
		};
		
		// Create a root that represents the workspace (Orion file system) root.  But rename it "Orion Content".  Renaming it is a cheat, we know that
		// we are dealing with the Orion file system.
		var orionFileSystem = {};
		for (var property in workspace) {
			orionFileSystem[property] = workspace[property];
		}
		orionFileSystem.Name = "Orion Content"; //$NON-NLS-0$
		
		var treeRoots = [];
		var result;
		if (workspace.DriveLocation) {
			result = new Deferred();
			self.fileClient.loadWorkspace(workspace.DriveLocation).then(function (driveRoot) {
				driveRoot.Children.forEach(function(drive) {
					// drives relevant to the project should be pushed onto the treeRoots array.
					
					if( self.includeDrive( drive.Name ) ){
						treeRoots.push(drive);
					}
				});
				treeRoots.push(orionFileSystem);
				result.resolve(treeRoots);

			}, errorHandler);
		} else {
			treeRoots.push(orionFileSystem);
			result = treeRoots;
		}
		Deferred.when(result, function(roots) {
			self.treeRoot = { Children: roots };
			self.model = new mFileExplorer.FileModel(self.registry, self.treeRoot, self.fileClient, self.parentId);
			self.model.processParent(self.treeRoot, roots);	

			clearTimeout(progressTimeout);	
			self.createTree( 	self.parentId, 
								self.model, 
								{	setFocus: true, 
									selectionPolicy: self.renderer.selectionPolicy, 
									onCollapse: 
									function(model){
										if( self.getNavHandler() ){
											self.getNavHandler().onCollapse(model);
										}
									}
								} );
								
			if (typeof self.onchange === "function") { //$NON-NLS-0$
				self.onchange(self.treeRoot);
			}
		}, errorHandler);
	};
	
	return ProjectExplorer;
});