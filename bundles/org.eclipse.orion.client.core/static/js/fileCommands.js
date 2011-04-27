/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
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

eclipse.favoritesCache = null;

// I'm not sure where this belongs.  This is the first time an outer party consumes
// favorites and understands the structure.  We need a cache for synchronous requests
// for move/copy targets.
eclipse.FavoriteFoldersCache = (function() {
	function FavoriteFoldersCache(registry) {
		this.registry = registry;
		this.favorites = [];
		var self = this;
		this.registry.getService("IFavorites").then(function(service) {
			service.getFavorites(function(faves) {
				self.cacheFavorites(faves);
			});
			service.addEventListener("favoritesChanged", function(faves) {
				self.cacheFavorites(faves);
			});
		});
	}
	FavoriteFoldersCache.prototype = {
		cacheFavorites: function(faves) {
			this.favorites = [];
			for (var i=0; i<faves.length; i++) {
				if (faves[i].directory) {
					this.favorites.push(faves[i]);
				}
			}
			this.favorites.sort(function(a,b) {
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			});
		}
	};
	return FavoriteFoldersCache;
}());

eclipse.fileCommandUtils.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
	var toolbar = dojo.byId(toolbarId);
	if (toolbar) {
		dojo.empty(toolbar);
	} else {
		throw "could not find toolbar " + toolbarId;
	}
	registry.getService("ICommandService").then(dojo.hitch(explorer, function(service) {
		service.renderCommands(toolbar, "dom", item, explorer, "image");
		if (selectionToolbarId) {
			var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
			service.renderCommands(selectionTools, "dom", null, explorer, "image");
		}
	}));
	
	// Stuff we do only the first time
	if (!eclipse.favoritesCache) {
		eclipse.favoritesCache = new eclipse.FavoriteFoldersCache(registry);
		registry.getService("Selection").then(function(service) {
			service.addEventListener("selectionChanged", function(singleSelection, selections) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					dojo.empty(selectionTools);
					registry.getService("ICommandService").then(function(commandService) {
						commandService.renderCommands(selectionTools, "dom", selections, explorer, "image");
					});
				}
			});
		});
	}
};

eclipse.fileCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, fileClient, toolbarId) {
	
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
	
	function contains(arr, item) {
		for (var i=0; i<arr.length; i++) {
			if (arr[i] === item) {
				return true;
			}
		}
		return false;
	}
	
	function stripPath(location) {
		location = eclipse.util.makeRelative(location);
		// get hash part and strip query off
		var splits = location.split('#');
		var path = splits[splits.length-1];
		var qIndex = path.indexOf("/?");
		if (qIndex > 0) {
			//remove the query but not the trailing separator
			path = path.substring(0, qIndex+1);
		}
		return path;
	}
	
	function makeMoveCopyTargetChoices(items, userData, isCopy) {
		items = dojo.isArray(items) ? items : [items];
		var refreshFunc = function() {
			this.changedItem(this.treeRoot);
		};
		var callback = function(items) {
			for (var i=0; i < items.length; i++) {
				var item = items[i];
				var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
				func.apply(fileClient, [item.Location, this.path]).then(
					dojo.hitch(explorer, refreshFunc)//refresh the root
				);
			}
		};
		
		var prompt = function() {
			window.alert("Directory prompter appears here.");
		};
		
		// gather up source paths so we do not propose to move/copy a source to its own location
		var sourceLocations = [];
		var i;
		for (i=0; i<items.length; i++) {
			// moving or copying to the parent location is a no-op (we don't support rename or copy with rename from this menu)
			if (items[i].parent && items[i].parent.Location) {
				sourceLocations.push(stripPath(items[i].parent.Location));
			}
			// moving a directory into itself is not supported
			if (items[i].Directory && !isCopy) {
				sourceLocations.push(stripPath(items[i].Location));
			}
		}
		var choices = [];
		if (eclipse.favoritesCache) {
			var favorites = eclipse.favoritesCache.favorites;
			for (i=0; i<favorites.length; i++) {
				var path = stripPath(favorites[i].path);
				if (!contains(sourceLocations, path)) {
					choices.push({name: favorites[i].name, image: "images/silk/star.gif", path: path, callback: callback});
				}
			}
		}
		choices.push({});  //separator
		// Now we propose the most common cases.  Parent, siblings, and visible child folders of items (no fetch required)
		// Don't propose a target if it's a source
		var proposedPaths = [];
		var alreadySeen = [];
		var j, child, childPath;
		for (i= 0; i<items.length; i++) {
			var item = items[i];
			var sibling = items[i];
			// for the purposes of finding parents and siblings, if this is a file, consider its parent folder 
			// for finding targets, not itself.
			if (!item.Directory && item.parent) {
				item = item.parent;
			}
			if (item.Parents) {
				for (j=0; j<item.Parents.length; j++) {
					child = item.Parents[j];
					childPath = stripPath(child.Location);
					if (child.Directory && !contains(alreadySeen, childPath) && !contains(sourceLocations, childPath)) {
						alreadySeen.push(childPath);
						child.stripped = childPath;
						proposedPaths.push(child);
					}
				}			}
			if (item.parent) {
				var parentPath = item.parent.Location;
				if (parentPath) {
					var stripped = stripPath(parentPath);
					if (!contains(alreadySeen, stripped) && !contains(sourceLocations, stripped)) {
						alreadySeen.push(stripped);
						proposedPaths.push(item.parent);
						item.parent.stripped = stripped;
					}
				}
			}
			if (sibling.parent && sibling.parent.children) {	// siblings
				for (j=0; j<sibling.parent.children.length; j++) {
					child = sibling.parent.children[j];
					childPath = stripPath(child.Location);
					if (child.Directory && !contains(alreadySeen, childPath) && !contains(sourceLocations, childPath)) {
						alreadySeen.push(childPath);
						child.stripped = childPath;
						proposedPaths.push(child);
					}
				}
			}
			// All children of the root that are folders should be available for choosing.
			var topLevel = explorer.treeRoot.Children;
			for (i=0; i<topLevel.length; i++) {
				child = topLevel[i];
				childPath = child.Directory ? stripPath(child.Location) : null;
				if (childPath && !contains(alreadySeen, childPath) && !contains(sourceLocations, childPath)) {
					alreadySeen.push(childPath);
					child.stripped = childPath;
					proposedPaths.push(child);
				}
			}
		}
		// sort the choices
		proposedPaths.sort(function(a,b) {
			if (a.stripped < b.stripped) {
				return -1;
			}
			if (a.stripped > b.stripped) {
				return 1;
			}
			return 0;
		});
		// now add them
		for (i=0; i<proposedPaths.length; i++) {
			var item = proposedPaths[i];
			var displayPath = item.Name;
			// we know we've left leading and trailing slash so slashes is splits + 1
			var slashes = item.stripped.split('/').length + 1;
			// but don't indent for leading or trailing slash
			// TODO is there a smarter way to do this?
			for (j=0; j<slashes-2; j++) {
				displayPath = "  " + displayPath;
			}
			choices.push({name: displayPath, path: item.stripped, callback: callback});
		}
		if (proposedPaths.length > 0) {
			choices.push({});  //separator
		}
		choices.push({name: "Choose target...", callback: prompt});
		return choices;
	}
	
	var oneOrMoreFilesOrFolders = function(item) {
		var items = dojo.isArray(item) ? item : [item];
		if (items.length === 0) {
			return false;
		}
		for (var i=0; i < items.length; i++) {
			if (!items[i].Location) {
				return false;
			}
		}
		return true;
	};

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
	
	var renameCommand = new eclipse.Command({
			name: "Rename",
			image: "images/editing_16.gif",
			id: "eclipse.renameResource",
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Location;
			},
			callback: dojo.hitch(this, function(item, commandId, domId) {
				// we want to popup the edit box over the name in the explorer.
				// if we can't find it, we'll pop it up over the command dom element.
				var refNode = explorer.getNameNode(item);
				if (!refNode) {
					refNode = dojo.byId(domId);
				}
				eclipse.util.getUserText(domId+"EditBox", refNode, true, item.Name, 
					dojo.hitch(this, function(newText) {
						fileClient.moveFile(item.Location, item.parent.Location, newText).then(
							dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);})//refresh the root
						);
					}), 
					null, null, "."
				); 
			})
		});
	commandService.addCommand(renameCommand, "object");
	
	var deleteCommand = new eclipse.Command({
		name: "Delete",
		image: "images/remove.gif",
		id: "eclipse.deleteFile",
		visibleWhen: oneOrMoreFilesOrFolders,
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
							fileClient.removeProject(item.parent.Location, item.Location).then(
								dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));//refresh the root
						} else {
							fileClient.deleteFile(item.Location).then(
								dojo.hitch(explorer, function() {explorer.changedItem(item.parent);}));//refresh the parent
						}
					}
				}));
			});		
		}});
	commandService.addCommand(deleteCommand, "object");
	commandService.addCommand(deleteCommand, "dom");

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
					fileClient.createFile(item.Location, name).then(
					dojo.hitch(explorer, function() {this.changedItem(item);})); //refresh the parent
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
					fileClient.createFolder(item.Location, name).then(
						dojo.hitch(explorer, function() {this.changedItem(item);}));//refresh the parent
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
					fileClient.createProject(explorer.treeRoot.ChildrenLocation, name, serverPath, create).then(
						dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));//refresh the root
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
					fileClient.createProject(explorer.treeRoot.ChildrenLocation, name, url, create).then(
						dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));//refresh the root
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
		name : "Zip Import",
		image : "images/zip_import.gif",
		id: "eclipse.importCommand",
		callback : function(item) {
			item = forceSingleItem(item);
			var dialog = new widgets.ImportDialog({
				importLocation: item.ImportLocation,
				func: dojo.hitch(explorer, function() { this.changedItem(item); })
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(importCommand, "object");
	commandService.addCommand(importCommand, "dom");

	var importSFTPCommand = new eclipse.Command({
		name : "SFTP Import",
		image : "images/zip_import.gif",
		id: "eclipse.importSFTPCommand",
		callback : function(item) {
			item = forceSingleItem(item);
			var dialog = new widgets.SFTPConnectionDialog({
				func:  function(host,path,user,password, overwriteOptions){
					serviceRegistry.getService("IStatusReporter").then(function(progressService) {
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp";
						var importOptions = {"OptionHeader":optionHeader,"Host":host,"Path":path,"UserName":user,"Passphrase":password};
						var deferred = fileClient.remoteImport(item.ImportLocation, importOptions);
						progressService.showWhile(deferred, "Importing from " + host).then(
							dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));//refresh the root
					});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(importSFTPCommand, "object");
	commandService.addCommand(importSFTPCommand, "dom");

	var exportSFTPCommand = new eclipse.Command({
		name : "SFTP Export",
		image : "images/down.gif",
		id: "eclipse.exportSFTPCommand",
		callback : function(item) {
			item = forceSingleItem(item);
			var dialog = new widgets.SFTPConnectionDialog({
				func:  function(host,path,user,password, overwriteOptions){
					serviceRegistry.getService("IStatusReporter").then(function(progressService) {
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp";
						var exportOptions = {"OptionHeader":optionHeader,"Host":host,"Path":path,"UserName":user,"Passphrase":password};
						var deferred = fileClient.remoteExport(item.ExportLocation, exportOptions);
						progressService.showWhile(deferred, "Exporting from " + host).then(
							dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}));//refresh the root
					});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(exportSFTPCommand, "object");
	commandService.addCommand(exportSFTPCommand, "dom");
	
	var copyCommand = new eclipse.Command({
		name : "Copy to",
		id: "eclipse.copyFile",
		choiceCallback: function(items, userData) {
			return makeMoveCopyTargetChoices(items, userData, true);
		},
		visibleWhen: oneOrMoreFilesOrFolders 
	});
	commandService.addCommand(copyCommand, "dom");
	// don't do this at the row-level until we figure out bug 338888
	// commandService.addCommand(copyCommand, "object");
	
	var moveCommand = new eclipse.Command({
		name : "Move to",
		id: "eclipse.moveFile",
		choiceCallback: function(items, userData) {
			return makeMoveCopyTargetChoices(items, userData, false);
		},
		visibleWhen: oneOrMoreFilesOrFolders
		});
	commandService.addCommand(moveCommand, "dom");
	// don't do this at the row-level until we figure out bug 338888
	// commandService.addCommand(moveCommand, "object");
};

eclipse.fileCommandUtils._cloneItemWithoutChildren = function clone(item){
    if (item === null || typeof(item) !== 'object') {
        return item;
      }

    var temp = item.constructor(); // changed

    for(var key in item){
		if(key!=="children" && key!=="Children") {
			temp[key] = clone(item[key]);
		}
    }
    return temp;
};

eclipse.fileCommandUtils.createAndPlaceFileCommandsExtension = function(serviceRegistry, commandService, explorer, toolbarId, selectionToolbarId, fileGroup, selectionGroup) {
	
	function getPattern(wildCard){
		var pattern = '^';
        for (var i = 0; i < wildCard.length; i++ ) {
                var c = wildCard.charAt(i);
                switch (c) {
                        case '?':
                                pattern += '.';
                                break;
                        case '*':
                                pattern += '.*';
                                break;
                        default:
                                pattern += c;
                }
        }
        pattern += '$';
        
        return new RegExp(pattern);
	}
	
	function validateSingleItem(item, validationProperties){
		for(var keyWildCard in validationProperties){
			var keyPattern = getPattern(keyWildCard);
			var matchFound = false;
			for(var key in item){
				if(keyPattern.test(key)){
					if(typeof(validationProperties[keyWildCard])==='string'){
						var valuePattern = getPattern(validationProperties[keyWildCard]);
						if(valuePattern.test(item[key])){
							matchFound = true;
							break;
						}
					}else{
						if(validationProperties[keyWildCard]===item[key]){
							matchFound = true;
							break;
						}
					}
				}
			}
			if(!matchFound){
				return false;
			}
		}
		return true;
	}
	
	// Note that the shape of the "fileCommands" extension is not in any shape or form that could be considered final.
	// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
	
	// The shape of the contributed commands is (for now):
	// info - information about the command (object).
	//		required attribute: name - the name of the command
	//		required attribute: id - the id of the command
	//		optional attribute: tooltip - the tooltip to use for the command
	//        optional attribute: image - a URL to an image for the command
	//        optional attribute: href - if true, then the service returns an href when it runs
	//        optional attribute: forceSingleItem - if true, then the service is only invoked when a single item is selected
	//			and the item parameter to the run method is guaranteed to be a single item vs. an array.  When this is not true, 
	//			the item parameter to the run method may be an array of items.
	// run - the implementation of the command (function).
	//        arguments passed to run: (itemOrItems)
	//          itemOrItems (object or array) - an array of items to which the item applies, or a single item if the info.forceSingleItem is true
	//        the return value of the run function will be used as follows:
	//          if info.href is true, the return value should be an href and the window location will be replaced with the href
	//			if info.href is not true, the run function is assumed to perform all necessary action and the return is not used.
	var commandsReferences = serviceRegistry.getServiceReferences("fileCommands");

	for (var i=0; i<commandsReferences.length; i++) {
		serviceRegistry.getService(commandsReferences[i]).then(function(service) {
			var info = {};
			var propertyNames = commandsReferences[i].getPropertyNames();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = commandsReferences[i].getProperty(propertyNames[j]);
			}

			var commandOptions = {
				name: info.name,
				image: info.image,
				id: info.id,
				tooltip: info.tooltip,
				visibleWhen: dojo.hitch(info, function(items){
					if(dojo.isArray(items)){
						if ((this.forceSingleItem || this.href) && items.length !== 1) {
							return false;
						}
						if(!this.forceSingleItem && items.length < 1){
							return false;
						}
					} else{
						items = [items];
					}
					
					if(!this.validationProperties){
						return true;
					}
					
					for(var i in items){
						if(!validateSingleItem(items[i], this.validationProperties)){
							return false;
						}
					}
					return true;
					
				})
			};
			if (info.href) {
				commandOptions.hrefCallback = dojo.hitch(info, function(items){
					var item = dojo.isArray(items) ? items[0] : items;
					var shallowItemClone = eclipse.fileCommandUtils._cloneItemWithoutChildren(item);
					if(service.run) {
						return service.run(shallowItemClone);
					}
				});
			} else {
				commandOptions.callback = dojo.hitch(info, function(items){
					var shallowItemsClone;
					if (this.forceSingleItem) {
						var item = dojo.isArray() ? items[0] : items;
						shallowItemsClone = eclipse.fileCommandUtils._cloneItemWithoutChildren(item);
					} else {
						if (dojo.isArray(items)) {
							shallowItemsClone = [];
							for (var j = 0; j<items.length; j++) {
								shallowItemsClone.push(eclipse.fileCommandUtils._cloneItemWithoutChildren(items[j]));
							}
						} else {
							shallowItemsClone = eclipse.fileCommandUtils._cloneItemWithoutChildren(items);
						}
					}
					if(service.run) {
						service.run(shallowItemsClone);
					}
				});
			}
			var command = new eclipse.Command(commandOptions);
			var extensionGroupCreated = false;
			var selectionGroupCreated = false;
			if (info.forceSingleItem || info.href) {
				// single items go in the local actions column, grouped in their own unnamed group to get a separator
				commandService.addCommand(command, "object");
				if (!extensionGroupCreated) {
					extensionGroupCreated = true;
					commandService.addCommandGroup("eclipse.fileCommandExtensions", 1000, null, fileGroup);
				}
				commandService.registerCommandContribution(command.id, i, null, fileGroup + "/eclipse.fileCommandExtensions");
			} else {  
				// items based on selection are added to the selections toolbar, grouped in their own unnamed group to get a separator
				// TODO would we also want to add these to the menu above so that they are available for single selections?  
				// For now we do not do this to reduce clutter, but we may revisit this.
				commandService.addCommand(command, "dom");
				if (!selectionGroupCreated) {
					selectionGroupCreated = true;
					commandService.addCommandGroup("eclipse.bulkFileCommandExtensions", 1000, null, selectionGroup);
				}
				commandService.registerCommandContribution(command.id, i, selectionToolbarId, selectionGroup + "/eclipse.bulkFileCommandExtensions");
			}
			eclipse.fileCommandUtils.updateNavTools(serviceRegistry, explorer, toolbarId, selectionToolbarId, explorer.treeRoot);
			explorer.updateCommands();
		});
	}
};
