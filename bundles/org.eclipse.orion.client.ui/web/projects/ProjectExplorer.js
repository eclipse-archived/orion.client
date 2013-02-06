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

define(['i18n!orion/widgets/nls/messages', 'orion/Deferred', 'orion/explorers/explorer-table', 'orion/webui/littlelib'], 
function(messages, Deferred, mFileExplorer, lib) {

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
	
	
	ProjectExplorer.prototype.loadWorkingSets = function( workspace, workingsets ) {
	
		var self = this;
		this.workingSets = workingsets;
		// Create a root that contains the folders from the workset.
		var workingSetList = {};
		workingSetList.Children = [];

// KEEPING THIS FOR REFERENCE UNTIL THE WORKING SETS IS FUNCTIONIONG		
//		workspace.Children.forEach(function(folder) {
//			// TODO check the folder to see if it's in the working set.  If so, push it.
//			workingSetList.Children.push(folder);
//		});
		
		for( var w = 0; w < workingsets.length; w++ ){
		self.fileClient.read(workingsets[w], true).then(function(folder) {
				workingSetList.Children.push( folder.ChildrenLocation );	
			});
		}
		
		this.load(workingSetList, "Loading Working Sets...");	
	};
	
	ProjectExplorer.prototype.loadDriveList = function( workspace, driveNames ) {
		var self = this;
		this.driveNames = driveNames;
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
				result.resolve({Children: treeRoots});
			});
		} else {
			treeRoots.push(orionFileSystem);
			result = {Children: treeRoots};
		}
		this.load(result, "Loading Drives...");	
	};
	
	return ProjectExplorer;
});