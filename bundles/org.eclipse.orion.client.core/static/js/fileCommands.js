/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window eclipse:true serviceRegistry */
/*browser:true*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Utility methods
 * @namespace eclipse.fileCommandUtils generates commands
 */
 
eclipse.fileCommandUtils = eclipse.fileCommandUtils || {};

eclipse.fileCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId) {

	var favoriteCommand = new eclipse.Command({
		name: "Make Favorite",
		image: "images/silk/star.png",
		id: "eclipse.makeFavorite",
		visibleWhen: function(item) {return item.Location;}, //TODO need a better way to identify file/folder objects
		callback: function(item) {
			serviceRegistry.getService("IFavorites").then(function(service) {
				service.makeFavorites(item);
			});
		}});
	commandService.addCommand(favoriteCommand, "object");
	var deleteCommand = new eclipse.Command({
		name: "Delete",
		image: "images/silk/cross.png",
		id: "eclipse.deleteFile",
		visibleWhen: function(item) {return item.Location;},
		callback: function(item) {
			// prompt since it's so easy to push that X!
			serviceRegistry.getService("IDialogService").then(function(service) {
				service.confirm("Are you sure you want to delete '" + item.Name + "'?", 
				dojo.hitch(explorer, function(doit) {
					if (!doit) {
						return;
					}
					if (item.parent.Path === "") {
						serviceRegistry.getService("IFileService").then(function(service) {
							service.removeProject(
								item.parent, item, dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));
						});
					} else {
						serviceRegistry.getService("IFileService").then(function(service) {
							service.deleteFile(item, dojo.hitch(explorer, explorer.changedItem));
						});
					}
				}));
			});		
		}});
	commandService.addCommand(deleteCommand, "object");

	var downloadCommand = new eclipse.Command({
		name: "Download as Zip",
		image: "images/silk/arrow_down.png",
		id: "eclipse.downloadFile",
		visibleWhen: function(item) {return item.ExportLocation && item.Directory;},
		hrefCallback: function(item) {
			return item.ExportLocation;
		}});
	commandService.addCommand(downloadCommand, "object");
	
	var newFileCommand=  new eclipse.Command({
		name: "New File",
		image: "images/silk/page_add.png",
		id: "eclipse.newFile",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create File",
				label: "File name:",
				func:  function(name){
					serviceRegistry.getService("IFileService").then(function(service) {
						service.createFile(name, item, dojo.hitch(explorer, explorer.changedItem)); 
					});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(newFileCommand, "dom", toolbarId);
	commandService.addCommand(newFileCommand, "object");
	
	var newFolderCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add.png",
		id: "eclipse.newFolder",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create Folder",
				label: "Folder name:",
				func:  function(name){
					serviceRegistry.getService("IFileService").then(function(service) {
						service.createFolder(name, item, dojo.hitch(explorer, explorer.changedItem));
					});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {return item.Directory && !eclipse.util.isAtRoot(item.Location);}});

	commandService.addCommand(newFolderCommand, "dom", toolbarId);
	commandService.addCommand(newFolderCommand, "object");
	
	var newProjectCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/silk/folder_add.png",
		id: "eclipse.newProject",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Create Folder",
				label: "Folder name:",
				func:  function(name, serverPath, create){
					serviceRegistry.getService("IFileService").then(function(service) {
						service.createProject(explorer.treeRoot.ChildrenLocation, name, serverPath, create,
					 		dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));
					});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {return eclipse.util.isAtRoot(item.Location);}});

	commandService.addCommand(newProjectCommand, "dom", toolbarId);
	
	var linkProjectCommand = new eclipse.Command({
		name: "Link Folder",
		image: "images/silk/link_add.png",
		id: "eclipse.linkProject",
		callback: function(item) {
			var dialog = new widgets.NewItemDialog({
				title: "Link Folder",
				label: "Folder name:",
				func:  function(name, url, create){
					serviceRegistry.getService("IFileService").then(function(service) {
						service.createProject(explorer.treeRoot.ChildrenLocation, name, url, create,
					 		dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));
						});
				},
				advanced: true
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {return eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(linkProjectCommand, "dom", toolbarId);
		
	var openResourceCommand = new eclipse.Command({
		name: "Open Resource",
		image: "images/silk/find.png",
		id: "eclipse.openResource",
		callback: function(item) {
			setTimeout(function() {
				new widgets.OpenResourceDialog({
					SearchLocation: explorer.treeRoot.SearchLocation,
					searcher: explorer.searcher
				}).show();
			}, 0);
		}});
	commandService.addCommand(openResourceCommand, "dom", toolbarId);
		
	var importCommand = new eclipse.Command({
		name : "Import",
		image : "images/silk/zip_import.gif",
		id: "eclipse.importCommand",
		callback : function(item) {
			var dialog = new widgets.ImportDialog({
				importLocation: item.ImportLocation,
				func: function(){explorer.changedItem(item);}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(importCommand, "object");
	commandService.addCommand(importCommand, "dom", toolbarId);
};