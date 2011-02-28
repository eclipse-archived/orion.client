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
	
	var cloneGitRepositoryCommand = new eclipse.Command({
		name : "Clone Git Repository",
		image : "images/git/cloneGit.gif",
		id : "eclipse.cloneGitRepository",
		callback : function(item) {
			var dialog = new widgets.CloneGitRepositoryDialog({
				func : function(gitUrl) {
					serviceRegistry.getService("IGitService").then(
							function(service) {
								service.cloneGitRepository("", gitUrl,
										function(jsonData, secondArg) {
											alert("Repository cloned. You may now link to " 
													+ jsonData.ContentLocation);
										});
							});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen : function(item) {
			return false;
		}
	});

	commandService.addCommand(cloneGitRepositoryCommand, "dom");
	
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

eclipse.fileCommandUtils._cloneItemWithoutChildren = function clone(item){
    if(item == null || typeof(item) != 'object')
        return item;

    var temp = item.constructor(); // changed

    for(var key in item){
    	if(key!=="children" && key!=="Children")
    		temp[key] = clone(item[key]);
    }
    return temp;
};

eclipse.fileCommandUtils.createAndPlaceFileExtentionsCommands = function(serviceRegistry, commandService, explorer, toolbarId, fileGroup) {
	
	
	var commandsReferences = serviceRegistry.getServiceReferences("fileCommands");
	var items = this.items;
	
	for (var i=0; i<commandsReferences.length; i++) {
		serviceRegistry.getService(commandsReferences[i]).then(function(service) {
			service.info().then(function(info) {
				if(!(info.commands) || info.commands.length==0){
					return;
				}
				var fileGroupCreated = false;
				var navGroupCreated = false;
				for(var j=0; j<info.commands.length; j++){
					var commandDescription = info.commands[j];
					var command = new eclipse.Command({
						name: commandDescription.name,
						image: commandDescription.image,
						id: info.prefix + "." + commandDescription.id,
						tooltip: commandDescription.tooltip,
						callback: dojo.hitch(commandDescription, function(items){
							var shallowItemsClone = eclipse.fileCommandUtils._cloneItemWithoutChildren(items);
							service.run(this.id, shallowItemsClone);
						}),
						visibleWhen: function(items){
							//TODO add some validation description on client site
							return true;
						}
					});
					if(commandDescription.type==="tree" || commandDescription.type==="both"){
						if(!fileGroupCreated){
							commandService.addCommandGroup("fileGroup."+info.prefix, 100, info.displayName ? info.name : null, fileGroup);
							fileGroupCreated=true;
						}
						commandService.addCommand(command, "object");
						commandService.registerCommandContribution(command.id, commandDescription.index, null, fileGroup+"/fileGroup."+info.prefix);
					}
					if(commandDescription.type==="toolbar" || commandDescription.type==="both"){
						if(!navGroupCreated){
							commandService.addCommandGroup("toolbarGroup."+info.prefix, 100, null, null, toolbarId);
							navGroupCreated=true;
						}
						commandService.addCommand(command, "dom");
						commandService.registerCommandContribution(command.id, commandDescription.index, toolbarId, "toolbarGroup."+info.prefix);
					}
				}
				eclipse.fileCommandUtils.updateNavTools(serviceRegistry, explorer, explorer.innerId, toolbarId, explorer.treeRoot);
				explorer.updateCommands();
				
			});
			
		});
	}
	
	

	
	
};
