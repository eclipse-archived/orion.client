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
/*global window define orion */
/*browser:true*/

define(["dojo", "orion/util", "orion/commands", "orion/widgets/NewItemDialog", "orion/widgets/DirectoryPrompterDialog"], function(dojo, mUtil, mCommands){

	/**
	 * Utility methods
	 * @class This class contains static utility methods for creating and managing commands 
	 * related to file management.
	 * @name orion.fileCommands
	 */
	var fileCommandUtils = {};

	var favoritesCache = null;

	// I'm not sure where this belongs.  This is the first time an outer party consumes
	// favorites and understands the structure.  We need a cache for synchronous requests
	// for move/copy targets.
	function FavoriteFoldersCache(registry) {
		this.registry = registry;
		this.favorites = [];
		var self = this;
		this.registry.getService("orion.core.favorite").then(function(service) {
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
	FavoriteFoldersCache.prototype.constructor = FavoriteFoldersCache;

	/**
	 * Updates the explorer tool bar
	 * @name orion.fileCommands#updateNavTools
	 * @function
	 */
	fileCommandUtils.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
		var toolbar = dojo.byId(toolbarId);
		if (toolbar) {
			dojo.empty(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId;
		}
		registry.getService("orion.page.command").then(dojo.hitch(explorer, function(service) {
			service.renderCommands(toolbar, "dom", item, explorer, "image", null, null, true);  // true for force icons to text
			if (selectionToolbarId) {
				var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
				service.renderCommands(selectionTools, "dom", null, explorer, "image", null, null, true); // true would force icons to text
			}
		}));
		
		// Stuff we do only the first time
		if (!favoritesCache) {
			favoritesCache = new FavoriteFoldersCache(registry);
			registry.getService("orion.page.selection").then(function(service) {
				service.addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionToolbarId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						registry.getService("orion.page.command").then(function(commandService) {
							commandService.renderCommands(selectionTools, "dom", selections, explorer, "image", null, null, true);
						});
					}
				});
			});
		}
	};

	/**
	 * Creates the commands related to file management.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to use when creating commands
	 * @param {orion.commands.CommandService} commandService The command service to get commands from
	 * @param {orion.explorer.Explorer} explorer The explorer view to add commands to
	 * @param {orion.fileClient.FileClient} fileClient The file system client that the commands should use
	 * @param {String} toolbarId The id of the toolbar to add commands to
	 * @name orion.fileCommands#createFileCommands
	 * @function
	 */
	fileCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, fileClient, toolbarId) {
		
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
			location = mUtil.makeRelative(location);
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
			var callback = function(selectedItems) {
				for (var i=0; i < selectedItems.length; i++) {
					var item = selectedItems[i];
					var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
					func.apply(fileClient, [item.Location, this.path]).then(
						dojo.hitch(explorer, refreshFunc)//refresh the root
					);
				}
			};
			
			var prompt = function(selectedItems) {
				var dialog = new orion.widgets.DirectoryPrompterDialog({
					title: "Choose a Folder",
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,				
					func: function(targetFolder) { 
						if (targetFolder && targetFolder.Location) {
							for (var i=0; i < selectedItems.length; i++) {
								var location = targetFolder.Location;
								var newName; // intentionally undefined.  Only use if we need.
								var item = selectedItems[i];
								var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
								if (isCopy && item.parent && item.parent.Location === location) {
									newName = window.prompt("Enter a new name for '" + item.Name+ "'", "Copy of " + item.Name);
									// user cancelled?  don't copy this one
									if (!newName) {
										location = null;
									}
								}
								if (location) {
									func.apply(fileClient, [item.Location, targetFolder.Location, newName]).then(
										dojo.hitch(explorer, refreshFunc), //refresh the root
										function(error) {
											serviceRegistry.getService("orion.page.message").then(function(statusService) {
												statusService.setErrorMessage(error);
											});
										}
									);
								}
							}
						}
					}
				});
				dialog.startup();
				dialog.show();
			};
			
			// Remember all source paths so we do not propose to move/copy a source to its own location
			var sourceLocations = [];
			for (var i=0; i<items.length; i++) {
				// moving or copying to the parent location is a no-op (we don't support rename or copy with rename from this menu)
				if (items[i].parent && items[i].parent.Location ) {
					items[i].parent.stripped = items[i].parent.stripped || stripPath(items[i].parent.Location);
					if (!contains(sourceLocations, items[i].parent.stripped)) {
						sourceLocations.push(items[i].parent.stripped);
					}
				}
				// moving a directory into itself is not supported
				if (items[i].Directory && !isCopy) {
					items[i].stripped = items[i].stripped || stripPath(items[i].Location);
					sourceLocations.push(items[i].stripped);
				}
			}
	
			var choices = [];
			// Propose any favorite that is not already a sourceLocation
			if (favoritesCache) {
				var favorites = favoritesCache.favorites;
				for (i=0; i<favorites.length; i++) {
					var stripped = stripPath(favorites[i].path);
					if (!contains(sourceLocations, stripped)) {
						choices.push({name: favorites[i].name, image: "/images/silk/star.gif", path: stripped, callback: callback});
					}
				}
			}
			choices.push({});  //separator
			var proposedPaths = [];
			// All children of the root that are folders should be available for choosing.
			var topLevel = explorer.treeRoot.Children;
			for (i=0; i<topLevel.length; i++) {
				var child = topLevel[i];
				child.stripped = child.stripped || (child.Directory ? stripPath(child.Location) : null);
				if (child.stripped && !contains(sourceLocations, child.stripped)) {
					proposedPaths.push(child);
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
				for (var j=0; j<slashes-2; j++) {
					displayPath = "  " + displayPath;
				}
				choices.push({name: displayPath, path: item.stripped, callback: callback});
			}
			if (proposedPaths.length > 0) {
				choices.push({});  //separator
			}
			choices.push({name: "Choose folder...", callback: prompt});
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
	
		var favoriteCommand = new mCommands.Command({
			name: "Make Favorite",
			image: "/images/silk/star.gif",
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
				serviceRegistry.getService("orion.core.favorite").then(function(service) {
					service.makeFavorites(item);
				});
			}});
		commandService.addCommand(favoriteCommand, "object");
		
		var renameCommand = new mCommands.Command({
				name: "Rename",
				image: "/images/editing_16.gif",
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
					mUtil.getUserText(domId+"EditBox", refNode, true, item.Name, 
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
		
		var deleteCommand = new mCommands.Command({
			name: "Delete",
			image: "/images/remove.gif",
			id: "eclipse.deleteFile",
			visibleWhen: oneOrMoreFilesOrFolders,
			callback: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].Name + "'?" : "Are you sure you want to delete these " + items.length + " items?";
				serviceRegistry.getService("orion.page.dialog").then(function(service) {
					service.confirm(confirmMessage, 
					dojo.hitch(explorer, function(doit) {
						if (!doit) {
							return;
						}
						for (var i=0; i < items.length; i++) {
							var item = items[i];
							var deleteLocation = item.Location;
							var refreshItem = item.parent;
							if (item.parent.Projects) {
								//special case for deleting a project. We want to remove the 
								//project rather than delete the project's content
								refreshItem = this.treeRoot;
								deleteLocation = null;
								for (var p=0; p < item.parent.Projects.length; p++) {
									var project = item.parent.Projects[p];
									if (project.Id === item.Id) {
										deleteLocation = project.Location;
										break;
									}
								}
							}
							if (deleteLocation) {
								fileClient.deleteFile(deleteLocation).then(function() {
									explorer.changedItem(refreshItem);
								});
							}
						}
					}));
				});		
			}});
		commandService.addCommand(deleteCommand, "object");
		commandService.addCommand(deleteCommand, "dom");
	
		var downloadCommand = new mCommands.Command({
			name: "Download as Zip",
			image: "/images/down.gif",
			id: "eclipse.downloadFile",
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.ExportLocation && item.Directory;},
			hrefCallback: function(item) {
				return forceSingleItem(item).ExportLocation;
			}});
		commandService.addCommand(downloadCommand, "object");
		
		function getNewItemName(item, domId, defaultName, onDone) {
			var refNode, name, tempNode;
			if (item.Location === explorer.treeRoot.Location) {
				refNode = dojo.byId(domId);
			} else {
				var nodes = explorer.makeNewItemPlaceHolder(item, domId);
				if (nodes) {
					refNode = nodes.refNode;
					tempNode = nodes.tempNode;
				} else {
					refNode = dojo.byId(domId);
				}
			}
			if (refNode) {
				mUtil.getUserText(domId+"EditBox", refNode, false, defaultName, 
					dojo.hitch(this, function(name) {
						if (name) {
							if (tempNode) {
								tempNode.parentNode.removeChild(tempNode);
							}
							onDone(name);
						}
					})); 
			} else {
				name = window.prompt(defaultName);
				if (name) {
					onDone(name);
				}
			}
		}
		
		var newFileCommand =  new mCommands.Command({
			name: "New File",
			image: "/images/newfile_wiz.gif",
			id: "eclipse.newFile",
			callback: function(item, commandId, domId) {
				item = forceSingleItem(item);
				getNewItemName(item, domId, "New File", function(name) {
					if (name) {
						fileClient.createFile(item.Location, name).then(
							dojo.hitch(explorer, function() {this.changedItem(item);}));
					}
				});
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(newFileCommand, "dom");
		commandService.addCommand(newFileCommand, "object");
		
		var newFolderCommand = new mCommands.Command({
			name: "New Folder",
			image: "/images/newfolder_wiz.gif",
			id: "eclipse.newFolder",
			callback: function(item, commandId, domId) {
				item = forceSingleItem(item);
				getNewItemName(item, domId, "New Folder", function(name) {
					if (name) {
						fileClient.createFolder(item.Location, name).then(
							dojo.hitch(explorer, function() {this.changedItem(item);}));
					}
				});
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
	
		commandService.addCommand(newFolderCommand, "dom");
		commandService.addCommand(newFolderCommand, "object");
		
		var newProjectCommand = new mCommands.Command({
			name: "New Folder",
			image: "/images/newfolder_wiz.gif",
			id: "eclipse.newProject",
			callback: function(item, commandId, domId) {
				getNewItemName(item, domId, "New Folder", function(name) {
					if (name) {
						fileClient.createProject(explorer.treeRoot.ChildrenLocation, name).then(
							dojo.hitch(explorer, function() {this.loadResourceList(this.treeRoot.Path, true);})); // refresh the root
					}
				});
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Location && mUtil.isAtRoot(item.Location);}});
	
		commandService.addCommand(newProjectCommand, "dom");
		
		var linkProjectCommand = new mCommands.Command({
			name: "Link Folder",
			image: "/images/link_obj.gif",
			id: "eclipse.linkProject",
			callback: function(item) {
				var dialog = new orion.widgets.NewItemDialog({
					title: "Link Folder",
					label: "Folder name:",
					func:  function(name, url, create){
						fileClient.createProject(explorer.treeRoot.ChildrenLocation, name, url, create).then(
							dojo.hitch(explorer, function() {this.loadResourceList(this.treeRoot.Path, true);}));//refresh the root
					},
					advanced: true
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Location && mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(linkProjectCommand, "dom");
					
		var importCommand = new mCommands.Command({
			name : "Zip Import",
			image : "/images/zip_import.gif",
			id: "eclipse.importCommand",
			callback : function(item) {
				item = forceSingleItem(item);
				var dialog = new orion.widgets.ImportDialog({
					importLocation: item.ImportLocation,
					func: dojo.hitch(explorer, function() { this.changedItem(item); })
				});
				dialog.startup();
				dialog.show();
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(importCommand, "object");
		commandService.addCommand(importCommand, "dom");
	
		var importSFTPCommand = new mCommands.Command({
			name : "SFTP Import",
			image : "/images/zip_import.gif",
			id: "eclipse.importSFTPCommand",
			callback : function(item) {
				item = forceSingleItem(item);
				var dialog = new orion.widgets.SFTPConnectionDialog({
					func:  function(host,path,user,password, overwriteOptions){
						serviceRegistry.getService("orion.page.message").then(function(progressService) {
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
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(importSFTPCommand, "object");
		commandService.addCommand(importSFTPCommand, "dom");
	
		var exportSFTPCommand = new mCommands.Command({
			name : "SFTP Export",
			image : "/images/down.gif",
			id: "eclipse.exportSFTPCommand",
			callback : function(item) {
				item = forceSingleItem(item);
				var dialog = new orion.widgets.SFTPConnectionDialog({
					func:  function(host,path,user,password, overwriteOptions){
						serviceRegistry.getService("orion.page.message").then(function(progressService) {
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
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(exportSFTPCommand, "object");
		commandService.addCommand(exportSFTPCommand, "dom");
		
		var copyCommand = new mCommands.Command({
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
		
		var moveCommand = new mCommands.Command({
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
		
		var bufferedSelection = [];
		var copyToBufferCommand = new mCommands.Command({
				name: "Copy Items",
				id: "eclipse.copySelections",
				callback: function() {
					commandService.getSelectionService().getSelections(function(selections) {
						bufferedSelection = selections;
					});
				}
			});
		commandService.addCommand(copyToBufferCommand, "dom");
			
		var pasteFromBufferCommand = new mCommands.Command({
				name: "Paste Items",
				id: "eclipse.pasteSelections",
				callback: function() {
					if (bufferedSelection.length > 0) {
						for (var i=0; i<bufferedSelection.length; i++) {
							var location = bufferedSelection[i].Location;
							var name = null;
							if (location) {
								if (bufferedSelection[i].parent && bufferedSelection[i].parent.Location === explorer.treeRoot.Location) {
									name = window.prompt("Enter a new name for '" + bufferedSelection[i].Name+ "'", "Copy of " + bufferedSelection[i].Name);
									// user cancelled?  don't copy this one
									if (!name) {
										location = null;
									}
								}
								if (location) {
									fileClient.copyFile(location, explorer.treeRoot.Location, name).then(dojo.hitch(explorer, function() {
										this.changedItem(this.treeRoot);
									}));
								}
							}
						}
					}
				}
			});
		commandService.addCommand(pasteFromBufferCommand, "dom");
		
	};

	fileCommandUtils._cloneItemWithoutChildren = function clone(item){
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
	
	fileCommandUtils.createAndPlaceFileCommandsExtension = function(serviceRegistry, commandService, explorer, toolbarId, selectionToolbarId, fileGroup, selectionGroup) {
		function makeOpenWithRunner(href) {
			return function(item) {
				// String substitution: replace ${foo} with item.foo, ${foo.bar} with item.foo.bar, etc.
				return href.replace(/\$\{([\d\w-_$.]+)\}/g, function(str, properties) {
					// getObject handles property chains
					return dojo.getObject(properties, false, item);
				});
			};
		}
	
		// Note that the shape of the "orion.navigate.command" extension is not in any shape or form that could be considered final.
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
		var commandsReferences = serviceRegistry.getServiceReferences("orion.navigate.command");
		
		// Contributions to the orion.navigate.openWith service type also get mapped to orion.navigate.command
		var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith");
	
		var fileCommands = [];
		var i;
		for (i=0; i<commandsReferences.length; i++) {
			serviceRegistry.getService(commandsReferences[i]).then(function(service) {
				var info = {};
				var propertyNames = commandsReferences[i].getPropertyNames();
				for (var j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = commandsReferences[i].getProperty(propertyNames[j]);
				}
				fileCommands.push({properties: info, service: service});
			});
		}
		
		// Convert "orion.navigate.openWith" contributions into orion.navigate.command that open the appropriate editors
		for (i=0; i < openWithReferences.length; i++) {
			var openWithServiceRef = openWithReferences[i];
			var name = openWithServiceRef.getProperty("name"),
			    href = openWithServiceRef.getProperty("href"),
			    validationProperties = openWithServiceRef.getProperty("validationProperties");
			if (href && validationProperties && name) {
				var properties = {
						name: name,
						id: "eclipse.editor." + i,
						tooltip: name,
						validationProperties: validationProperties,
						href: true,
						forceSingleItem: true,
						isEditor: true // Distinguishes from a normal fileCommand
					};
				// Pretend that this is a real service
				var fakeService = {
						run: makeOpenWithRunner(href)
					};
				fileCommands.push({properties: properties, service: fakeService});
			}
		}
	
		for (i=0; i < fileCommands.length; i++) {
			var info = fileCommands[i].properties;
			var service = fileCommands[i].service;
			
			var commandOptions = fileCommandUtils._createFileCommandOptions(info, service);
			var command = new mCommands.Command(commandOptions);
			if (info.isEditor) {
				command.isEditor = true;
			}
			
			var extensionGroupCreated = false;
			var selectionGroupCreated = false;
			var openWithGroupCreated = false;
			if (info.forceSingleItem || info.href) {
				// single items go in the local actions column, grouped in their own unnamed group to get a separator
				commandService.addCommand(command, "object");
				if (!extensionGroupCreated) {
					extensionGroupCreated = true;
					commandService.addCommandGroup("eclipse.fileCommandExtensions", 1000, null, fileGroup);
				}
				if (!openWithGroupCreated) {
					openWithGroupCreated = true;
					commandService.addCommandGroup("eclipse.openWith", 1000, "Open With", fileGroup + "/eclipse.fileCommandExtensions");
				}
				
				if (info.isEditor) {
					commandService.registerCommandContribution(command.id, i, null, fileGroup + "/eclipse.fileCommandExtensions/eclipse.openWith");
				} else {
					commandService.registerCommandContribution(command.id, i, null, fileGroup + "/eclipse.fileCommandExtensions");
				}
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
			fileCommandUtils.updateNavTools(serviceRegistry, explorer, toolbarId, selectionToolbarId, explorer.treeRoot);
			explorer.updateCommands();
		}
	};
	
	// Turns an info object containing the service properties and the service into Command options.
	fileCommandUtils._createFileCommandOptions = function(/**Object*/ info, /**Service*/ service) {
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
		
		function matchSinglePattern(item, keyWildCard, valueWildCard){
			var keyPattern, key;
			if(keyWildCard.indexOf(":")>=0){
				keyPattern = getPattern(keyWildCard.substring(0, keyWildCard.indexOf(":")));
				var keyLastSegments = keyWildCard.substring(keyWildCard.indexOf(":")+1);
				for(key in item){
					if(keyPattern.test(key)){
						if(matchSinglePattern(item[key], keyLastSegments, valueWildCard)){
							return true;
						}
					}
				}
			}
			
			keyPattern = getPattern(keyWildCard);
			for(key in item){
				if(keyPattern.test(key)){
					if(typeof(valueWildCard)==='string'){
						var valuePattern = getPattern(valueWildCard);
						if(valuePattern.test(item[key])){
							return true;
						}
					}else{
						if(valueWildCard===item[key]){
							return true;
						}
					}
				}
			}
			return false;
		}
		
		function validateSingleItem(item, validationProperties){
			for(var keyWildCard in validationProperties){
				var matchFound = matchSinglePattern(item, keyWildCard, validationProperties[keyWildCard]);
				if(!matchFound){
					return false;
				}
			}
			return true;
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
				
			}),
			isEditor: info.isEditor
		};
		if (info.href) {
			commandOptions.hrefCallback = dojo.hitch(info, function(items){
				var item = dojo.isArray(items) ? items[0] : items;
				var shallowItemClone = fileCommandUtils._cloneItemWithoutChildren(item);
				if(service.run) {
					return service.run(shallowItemClone);
				}
			});
		} else {
			commandOptions.callback = dojo.hitch(info, function(items){
				var shallowItemsClone;
				if (this.forceSingleItem) {
					var item = dojo.isArray() ? items[0] : items;
					shallowItemsClone = fileCommandUtils._cloneItemWithoutChildren(item);
				} else {
					if (dojo.isArray(items)) {
						shallowItemsClone = [];
						for (var j = 0; j<items.length; j++) {
							shallowItemsClone.push(fileCommandUtils._cloneItemWithoutChildren(items[j]));
						}
					} else {
						shallowItemsClone = fileCommandUtils._cloneItemWithoutChildren(items);
					}
				}
				if(service.run) {
					service.run(shallowItemsClone);
				}
			});
		}
		return commandOptions;
	};
	
	fileCommandUtils.getOpenWithCommands = function(commandService) {
		var openWithCommands = [];
		for (var commandId in commandService._objectScope) {
			var command = commandService._objectScope[commandId];
			if (command.isEditor) {
				openWithCommands.push(command);
			}
		}
		return openWithCommands;
	};
	return fileCommandUtils;
});