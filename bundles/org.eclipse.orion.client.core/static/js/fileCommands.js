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
/*global window widgets eclipse:true serviceRegistry dojo */
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

eclipse.fileCommandUtils.hookUpSearch = function(searchBoxId, explorer) {
	var searchField = dojo.byId(searchBoxId);
	if (searchField) {
		dojo.connect(searchField, "onkeypress", function(e){
			if (e.charOrCode === dojo.keys.ENTER) {
				// We expect ExplorerTree to fill in the SearchLocation on the treeRoot
				if (explorer.treeRoot.SearchLocation) {
					if (searchField.value.length > 0) {
						var query = explorer.treeRoot.SearchLocation + searchField.value;
						explorer.loadResourceList(query);
						dojo.stopEvent(e);
					}
				} else {
					window.alert("Can't search: SearchLocation not available");
				}
			}
		});
	}
};

eclipse.fileCommandUtils.updateNavTools = function(registry, explorer, parentId, toolbarId, item) {
	var parent = dojo.byId(parentId);
	var toolbar = dojo.byId(toolbarId);
	if (toolbar) {
		dojo.empty(toolbar);
	} else {
		toolbar = dojo.create("div",{id: toolbarId}, parent, "last");
		dojo.addClass(toolbar, "domCommandToolbar");
	}
	registry.getService("ICommandService").then(dojo.hitch(explorer, function(service) {
		service.renderCommands(toolbar, "dom", item, explorer, "image");
	}));
};

eclipse.fileCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId) {
	function forceSingleItem(item) {
		if (dojo.isArray(item)) {
			if (item.length > 1) {
				item = {};
			} else {
				item = item[0];
			}
		}
		return item;
	}

	var favoriteCommand = new eclipse.Command({
		name: "Make Favorite",
		image: "images/silk/star.gif",
		id: "eclipse.makeFavorite",
		visibleWhen: function(item) {
			var items = dojo.isArray(item) ? item : [item];
			for (var i=0; i < items.length; i++) {
				if (!items[i].Location) {
					return false;
				}
			}
			return true;},
		callback: function(item) {
			serviceRegistry.getService("IFavorites").then(function(service) {
				service.makeFavorites(item);
			});
		}});
	commandService.addCommand(favoriteCommand, "object");
	var deleteCommand = new eclipse.Command({
		name: "Delete",
		image: "images/remove.gif",
		id: "eclipse.deleteFile",
		visibleWhen: function(item) {
			var items = dojo.isArray(item) ? item : [item];
			for (var i=0; i < items.length; i++) {
				if (!items[i].Location) {
					return false;
				}
			}
			return true;},
		callback: function(item) {
			var items = dojo.isArray(item) ? item : [item];
			var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].Name + "'?" : "Are you sure you want to delete these " + items.length + " items?";
			serviceRegistry.getService("IDialogService").then(function(service) {
				service.confirm(confirmMessage, 
				dojo.hitch(explorer, function(doit) {
					if (!doit) {
						return;
					}
					for (var i=0; i < items.length; i++) {
						var item = items[i];
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
					}
				}));
			});		
		}});
	commandService.addCommand(deleteCommand, "object");

	var downloadCommand = new eclipse.Command({
		name: "Download as Zip",
		image: "images/down.gif",
		id: "eclipse.downloadFile",
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.ExportLocation && item.Directory;},
		hrefCallback: function(item) {
			return forceSingleItem(item).ExportLocation;
		}});
	commandService.addCommand(downloadCommand, "object");
	
	var newFileCommand=  new eclipse.Command({
		name: "New File",
		image: "images/newfile_wiz.gif",
		id: "eclipse.newFile",
		callback: function(item) {
			item = forceSingleItem(item);
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
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(newFileCommand, "dom");
	commandService.addCommand(newFileCommand, "object");
	
	var newFolderCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/newfolder_wiz.gif",
		id: "eclipse.newFolder",
		callback: function(item) {
			item = forceSingleItem(item);
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
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});

	commandService.addCommand(newFolderCommand, "dom");
	commandService.addCommand(newFolderCommand, "object");
	
	var newProjectCommand = new eclipse.Command({
		name: "New Folder",
		image: "images/newfolder_wiz.gif",
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
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Location && eclipse.util.isAtRoot(item.Location);}});

	commandService.addCommand(newProjectCommand, "dom");
	
	var linkProjectCommand = new eclipse.Command({
		name: "Link Folder",
		image: "images/link_obj.gif",
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
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Location && eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(linkProjectCommand, "dom");
		
	var openResourceCommand = new eclipse.Command({
		name: "Open Resource",
		image: "images/find.gif",
		id: "eclipse.openResource",
		callback: function(item) {
			window.setTimeout(function() {
				new widgets.OpenResourceDialog({
					SearchLocation: explorer.treeRoot.SearchLocation,
					searcher: explorer.searcher
				}).show();
			}, 0);
		}});
	commandService.addCommand(openResourceCommand, "dom");
		
	var importCommand = new eclipse.Command({
		name : "Import",
		image : "images/zip_import.gif",
		id: "eclipse.importCommand",
		callback : function(item) {
			item = forceSingleItem(item);
			var dialog = new widgets.ImportDialog({
				importLocation: item.ImportLocation,
				func: dojo.hitch(explorer, explorer.changedItem(item))
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(importCommand, "object");
	commandService.addCommand(importCommand, "dom");
};