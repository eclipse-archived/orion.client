/*******************************************************************************
 * @license
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

define(["require", "dojo", "orion/util", "orion/commands", "orion/editor/regex", "orion/contentTypes", "orion/URITemplate", "orion/widgets/NewItemDialog", "orion/widgets/DirectoryPrompterDialog", 'orion/widgets/ImportDialog', 'orion/widgets/SFTPConnectionDialog'],
	function(require, dojo, mUtil, mCommands, mRegex, mContentTypes, URITemplate){

	/**
	 * Utility methods
	 * @class This class contains static utility methods for creating and managing commands 
	 * related to file management.
	 * @name orion.fileCommands
	 */
	var fileCommandUtils = {};

	var favoritesCache = null;
	
	var lastItemLoaded = {Location: null};

	// I'm not sure where this belongs.  This is the first time an outer party consumes
	// favorites and understands the structure.  We need a cache for synchronous requests
	// for move/copy targets.
	function FavoriteFoldersCache(registry) {
		this.registry = registry;
		this.favorites = [];
		var self = this;
		var service = this.registry.getService("orion.core.favorite");
		service.getFavorites().then(function(favs) {
			self.cacheFavorites(favs.navigator);
		});
		service.addEventListener("favoritesChanged", function(favs) {
			self.cacheFavorites(favs.navigator);
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
		var service = registry.getService("orion.page.command");
		// close any open slideouts because if we are retargeting the command
		if (item.Location !== lastItemLoaded.Location) {
			service.closeParameterCollector("tool");
			lastItemLoaded.Location = item.Location;
		}

		service.renderCommands(toolbar, "dom", item, explorer, "tool", true).then(function() {
			if (lastItemLoaded.Location) {
				service.processURL(window.location.href);
			}
		}); 
		if (selectionToolbarId) {
			var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
			dojo.addClass(selectionTools, "selectionTools");
			service.renderCommands(selectionTools, "dom", null, explorer, "tool", true); // true would force icons to text
		}
		
		// Stuff we do only the first time
		if (!favoritesCache) {
			favoritesCache = new FavoriteFoldersCache(registry);
			var selectionService = registry.getService("orion.page.selection");
			selectionService.addEventListener("selectionChanged", function(singleSelection, selections) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					dojo.empty(selectionTools);
					registry.getService("orion.page.command").renderCommands(selectionTools, "dom", selections, explorer, "tool", true);
				}
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
		var progress = serviceRegistry.getService("orion.page.progress");
		var errorHandler = function(error) {
			progress.setProgressResult(error);
		};
		
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
				if (!dojo.isArray(selectedItems)) {
					selectedItems = [selectedItems];
				}
				for (var i=0; i < selectedItems.length; i++) {
					var item = selectedItems[i];
					var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
					func.apply(fileClient, [item.Location, this.path]).then(
						dojo.hitch(explorer, refreshFunc), //refresh the root
						errorHandler
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
							if (!dojo.isArray(selectedItems)) {
								selectedItems = [selectedItems];
							}
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
										errorHandler
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
						choices.push({name: favorites[i].name, imageClass: "core-sprite-makeFavorite", path: stripped, callback: callback});
					}
				}
				if (favorites.length > 0) {
					choices.push({});  //separator
				}
			}
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
			tooltip: "Add a file or folder to the favorites list",
			imageClass: "core-sprite-makeFavorite",
			id: "eclipse.makeFavorite",
			visibleWhen: function(item) {
				var items = dojo.isArray(item) ? item : [item];
				for (var i=0; i < items.length; i++) {
					if (!items[i].Location) {
						return false;
					}
				}
				return true;},
			callback: function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var favService = serviceRegistry.getService("orion.core.favorite");
				var doAdd = function(item) {
					return function(result) {
						if (!result) {
							favService.makeFavorites(item);
						} else {
							serviceRegistry.getService("orion.page.message").setMessage(item.Name + " is already a favorite.", 2000);
						}
					};
				};
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					favService.hasFavorite(item.ChildrenLocation || item.Location).then(doAdd(item));
				}
			}});
		commandService.addCommand(favoriteCommand, "object");
		
		var renameCommand = new mCommands.Command({
				name: "Rename",
				tooltip: "Rename the selected files or folders",
				imageClass: "core-sprite-rename",
				id: "eclipse.renameResource",
				visibleWhen: function(item) {
					item = forceSingleItem(item);
					return item.Location;
				},
				callback: dojo.hitch(this, function(data) {
					// we want to popup the edit box over the name in the explorer.
					// if we can't find it, we'll pop it up over the command dom element.
					var item = data.items;
					var refNode = explorer.getNameNode(item);
					if (!refNode) {
						refNode = data.domNode;
					}
					mUtil.getUserText(refNode.id+"EditBox", refNode, true, item.Name, 
						dojo.hitch(this, function(newText) {
							fileClient.moveFile(item.Location, item.parent.Location, newText).then(
								dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}), //refresh the root
								errorHandler
							);
						}), 
						null, null, "."
					); 
				})
			});
		commandService.addCommand(renameCommand, "object");
		
		var deleteCommand = new mCommands.Command({
			name: "Delete",
			tooltip: "Delete the selected files or folders",
			imageClass: "core-sprite-delete",
			id: "eclipse.deleteFile",
			visibleWhen: oneOrMoreFilesOrFolders,
			callback: function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].Name + "'?" : "Are you sure you want to delete these " + items.length + " items?";
				serviceRegistry.getService("orion.page.dialog").confirm(confirmMessage, 
					dojo.hitch(explorer, function(doit) {
						if (!doit) {
							return;
						}
						var count = 0;
						var refresher = function(item) {
							count++;
							if (count === items.length) {
								explorer.changedItem(item);
							}
						};
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
									refresher(refreshItem);
								}, function(error) {
									errorHandler(error);
									refresher(refreshItem);
								});
							}
						}
					})
				);	
			}});
		commandService.addCommand(deleteCommand, "object");
		commandService.addCommand(deleteCommand, "dom");
	
		var downloadCommand = new mCommands.Command({
			name: "Export as zip",
			tooltip: "Create a zip file of the folder contents and download it",
			imageClass: "core-sprite-exportzip",
			id: "eclipse.downloadFile",
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.ExportLocation && item.Directory;},
			hrefCallback: function(data) {
				return forceSingleItem(data.items).ExportLocation;
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
		
		var newFileNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:', 'New File')], false);
		
		var newFileCommand =  new mCommands.Command({
			name: "New File",
			tooltip: "Create a new file",
			imageClass: "core-sprite-new_file",
			id: "eclipse.newFile",
			parameters: newFileNameParameters,
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var createFunction = function(name) {
					if (name) {
						fileClient.createFile(item.Location, name).then(
							dojo.hitch(explorer, function() {this.changedItem(item);}),
							errorHandler);
					}
				};
				if (data.parameters && data.parameters.valueFor('name')) {
					createFunction(data.parameters.valueFor('name'));
				} else {
					getNewItemName(item, data.domNode.id, "New File", createFunction);
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
		commandService.addCommand(newFileCommand, "dom");
		commandService.addCommand(newFileCommand, "object");
		
		var newFolderNameParameters = new mCommands.ParametersDescription([new mCommands.CommandParameter('name', 'text', 'Name:', 'New Folder')], false);

		var newFolderCommand = new mCommands.Command({
			name: "New Folder",
			tooltip: "Create a new folder",
			imageClass: "core-sprite-new_folder",
			id: "eclipse.newFolder",
			parameters: newFolderNameParameters,
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var createFunction = function(name) {
					if (name) {
						fileClient.createFolder(item.Location, name).then(
							dojo.hitch(explorer, function() {this.changedItem(item);}),
							errorHandler);
					}
				};
				if (data.parameters && data.parameters.valueFor('name')) {
					createFunction(data.parameters.valueFor('name'));
				} else {
					getNewItemName(item, data.domNode.id, "New Folder", createFunction);
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mUtil.isAtRoot(item.Location);}});
	
		commandService.addCommand(newFolderCommand, "dom");
		commandService.addCommand(newFolderCommand, "object");
		
		var newProjectCommand = new mCommands.Command({
			name: "New Folder",
			parameters: newFolderNameParameters,
			tooltip: "Create a new folder",
			imageClass: "core-sprite-new_folder",
			id: "eclipse.newProject",
			callback: function(data) {
				var createFunction = function(name) {
					if (name) {
						fileClient.createProject(explorer.treeRoot.ChildrenLocation, name).then(
							dojo.hitch(explorer, function() {this.loadResourceList(this.treeRoot.Path, true);}), // refresh the root
							errorHandler);
					}
				};
				if (data.parameters && data.parameters.valueFor('name')) {
					createFunction(data.parameters.valueFor('name'));
				} else {
					getNewItemName(data.items, data.domNode.id, "New Folder", createFunction);
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Location && mUtil.isAtRoot(item.Location);}});
	
		commandService.addCommand(newProjectCommand, "dom");
		
		var linkProjectCommand = new mCommands.Command({
			name: "Link Folder",
			tooltip: "Create a folder that links to an existing folder on the server",
			imageClass: "core-sprite-link",
			id: "eclipse.linkProject",
			callback: function(data) {
				var dialog = new orion.widgets.NewItemDialog({
					title: "Link Folder",
					label: "Folder name:",
					func:  function(name, url, create){
						fileClient.createProject(explorer.treeRoot.ChildrenLocation, name, url, create).then(
							dojo.hitch(explorer, function() {this.loadResourceList(this.treeRoot.Path, true);}), //refresh the root
							errorHandler);
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
		
		var goUpCommand = new mCommands.Command({
			name: "Go Up",
			tooltip: "Move up to the parent folder",
			imageClass: "core-sprite-move_up",
			id: "eclipse.upFolder",
			callback: function(data) {
				var parents = forceSingleItem(data.items).Parents;
				if (parents && parents.length > 0) {
					window.document.location="#" + parents[0].ChildrenLocation;
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Parents;}});
		commandService.addCommand(goUpCommand, "dom");

					
		var importCommand = new mCommands.Command({
			name : "Import from zip...",
			tooltip: "Copy files and folders contained in a local zip file",
			imageClass: "core-sprite-importzip",
			id: "eclipse.importCommand",
			callback : function(data) {
				var item = forceSingleItem(data.items);
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
			name : "SFTP from...",
			tooltip: "Copy files and folders from a specified SFTP connection",
			imageClass: "core-sprite-transferin",
			id: "eclipse.importSFTPCommand",
			callback : function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new orion.widgets.SFTPConnectionDialog({
					func:  function(host,path,user,password, overwriteOptions){
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp";
						var importOptions = {"OptionHeader":optionHeader,"Host":host,"Path":path,"UserName":user,"Passphrase":password};
						var deferred = fileClient.remoteImport(item.ImportLocation, importOptions);
						progress.showWhile(deferred, "Importing from " + host).then(
							dojo.hitch(explorer, function() {
								this.changedItem(this.treeRoot);
							}),
							errorHandler
						);//refresh the root
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
			name : "SFTP to...",
			tooltip: "Copy files and folders to a specified SFTP location",
			imageClass: "core-sprite-transferout",
			id: "eclipse.exportSFTPCommand",
			callback : function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new orion.widgets.SFTPConnectionDialog({
					func:  function(host,path,user,password, overwriteOptions){
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp";
						var exportOptions = {"OptionHeader":optionHeader,"Host":host,"Path":path,"UserName":user,"Passphrase":password};
						var deferred = fileClient.remoteExport(item.ExportLocation, exportOptions);
						progress.showWhile(deferred, "Exporting from " + host).then(
							dojo.hitch(explorer, function() {this.changedItem(this.treeRoot);}),
							errorHandler);//refresh the root
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
			tooltip: "Copy files and folders to a specified location",
			id: "eclipse.copyFile",
			choiceCallback: function(items, userData) {
				return makeMoveCopyTargetChoices(items, userData, true);
			},
			visibleWhen: oneOrMoreFilesOrFolders 
		});
		commandService.addCommand(copyCommand, "dom");
		commandService.addCommand(copyCommand, "object");
		
		var moveCommand = new mCommands.Command({
			name : "Move to",
			tooltip: "Move files and folders to a new location",
			id: "eclipse.moveFile",
			choiceCallback: function(items, userData) {
				return makeMoveCopyTargetChoices(items, userData, false);
			},
			visibleWhen: oneOrMoreFilesOrFolders
			});
		commandService.addCommand(moveCommand, "dom");
		commandService.addCommand(moveCommand, "object");
		
		var bufferedSelection = [];
		var copyToBufferCommand = new mCommands.Command({
				name: "Copy Items",
				tooltip: "Copy the selected items to the copy/paste buffer",
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
				tooltip: "Paste items from the copy/paste buffer",
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
									}), errorHandler);
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
	
	var contentTypesMapCache;
	fileCommandUtils.createAndPlaceFileCommandsExtension = function(serviceRegistry, commandService, explorer, toolbarId, selectionToolbarId, fileGroup, selectionGroup) {
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
		
		var fileCommands = [];
		var i;
		for (i=0; i<commandsReferences.length; i++) {
			var impl = serviceRegistry.getService(commandsReferences[i]);
			var info = {};
			var propertyNames = commandsReferences[i].getPropertyNames();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = commandsReferences[i].getProperty(propertyNames[j]);
			}
			fileCommands.push({properties: info, service: impl});
		}
		
		if (!contentTypesMapCache) {
			serviceRegistry.getService("orion.file.contenttypes").getContentTypesMap().then(function(map) {
				contentTypesMapCache = map;
			});
		}
		dojo.when(contentTypesMapCache, dojo.hitch(this, function() {
			fileCommands = fileCommands.concat(this._createOpenWithCommands(serviceRegistry, contentTypesMapCache));
		
			for (i=0; i < fileCommands.length; i++) {
				var commandInfo = fileCommands[i].properties;
				var service = fileCommands[i].service;
				
				var commandOptions = fileCommandUtils._createFileCommandOptions(commandInfo, service);
				var command = new mCommands.Command(commandOptions);
				if (commandInfo.isEditor) {
					command.isEditor = commandInfo.isEditor;
				}
				
				var extensionGroupCreated = false;
				var selectionGroupCreated = false;
				var openWithGroupCreated = false;
				if (commandInfo.forceSingleItem || commandInfo.href) {
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
					
					if (commandInfo.isEditor) {
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
		}));
	};
	
	/**
	 * Converts "orion.navigate.openWith" service contributions into orion.navigate.command that open the appropriate editors.
	 * @returns {Object[]} The "open with" fileCommands
	 */
	fileCommandUtils._createOpenWithCommands = function(serviceRegistry, contentTypesMap) {
		function getEditors() {
			var serviceReferences = serviceRegistry.getServiceReferences("orion.edit.editor");
			var editors = [];
			for (var i=0; i < serviceReferences.length; i++) {
				var serviceRef = serviceReferences[i], id = serviceRef.getProperty("id");
				editors.push({
					id: id,
					name: serviceRef.getProperty("name"),
					uriTemplate: new URITemplate(serviceRef.getProperty("orionTemplate") || serviceRef.getProperty("uriTemplate"))
				});
			}
			return editors;
		}

		function toNamePattern(exts, filenames) {
			exts = exts.map(function(ext) { return mRegex.escape(ext); });
			filenames = filenames.map(function(ext) { return mRegex.escape(ext); });
			var extsPart = exts.length && "(*\\.(" + exts.join("|") + ")$)";
			var filenamesPart = filenames.length && "(^(" + filenames.join("|") + ")$)";
			var pattern;
			if (extsPart && filenamesPart) {
				pattern = extsPart + "|" + filenamesPart;
			} else if (extsPart) {
				pattern = extsPart;
			} else if (filenamesPart) {
				pattern = filenamesPart;
			} else {
				pattern = null;
			}
			// /(*\.(ext1|ext2|...)$)|(^(filename1|filename2|...)$)/
			return pattern;
		}
		function getEditorOpenWith(serviceRegistry, editor) {
			var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith");
			var types = [];
			for (var i=0; i < openWithReferences.length; i++) {
				var ref = openWithReferences[i];
				if (ref.getProperty("editor") === editor.id) {
					var ct = ref.getProperty("contentType");
					if (ct instanceof Array) {
						types = types.concat(ct);
					} else if (ct !== null && typeof ct !== "undefined") {
						types.push(ct);
					}
				}
			}
			return types;
		}
		function getDefaultEditor(serviceRegistry) {
			var openWithReferences = serviceRegistry.getServiceReferences("orion.navigate.openWith.default");
			for (var i=0; i < openWithReferences.length; i++) {
				return {editor: openWithReferences[i].getProperty("editor")};
			}
			return null;
		}
		
		var editors = getEditors(), defaultEditor = getDefaultEditor(serviceRegistry);
		var fileCommands = [];
		for (var i=0; i < editors.length; i++) {
			var editor = editors[i];
			var isDefaultEditor = (defaultEditor && defaultEditor.editor === editor.id);
			var editorContentTypes = getEditorOpenWith(serviceRegistry, editor);
			if (editorContentTypes.length) {
				var exts = [], filenames = [];
				for (var j=0; j < editorContentTypes.length; j++) {
					var contentType = contentTypesMap[editorContentTypes[j]];
					if (contentType) {
						exts = exts.concat(contentType.extension);
						filenames = filenames.concat(contentType.filename);	
					}
				}
				var uriTemplate = editor.uriTemplate;
				var validationProperties = { Directory: false, Name: toNamePattern(exts, filenames) };
				var properties = {
						name: editor.name || editor.id,
						id: "eclipse.openWithCommand." + editor.id,
						tooltip: editor.name,
						validationProperties: validationProperties,
						href: true,
						forceSingleItem: true,
						isEditor: (isDefaultEditor ? "default": "editor") // Distinguishes from a normal fileCommand
					};
				// Pretend that this is a real service
				var fakeService = { run: uriTemplate.expand.bind(uriTemplate) };
				fileCommands.push({properties: properties, service: fakeService});
			}
		}
		return fileCommands;
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
			commandOptions.hrefCallback = dojo.hitch(info, function(data){
				var item = dojo.isArray(data.items) ? data.items[0] : data.items;
				var shallowItemClone = fileCommandUtils._cloneItemWithoutChildren(item);
				if(service.run) {
					return service.run(shallowItemClone);
				}
			});
		} else {
			commandOptions.callback = dojo.hitch(info, function(data){
				var shallowItemsClone;
				if (this.forceSingleItem) {
					var item = dojo.isArray() ? data.items[0] : data.items;
					shallowItemsClone = fileCommandUtils._cloneItemWithoutChildren(item);
				} else {
					if (dojo.isArray(data.items)) {
						shallowItemsClone = [];
						for (var j = 0; j<data.items.length; j++) {
							shallowItemsClone.push(fileCommandUtils._cloneItemWithoutChildren(data.items[j]));
						}
					} else {
						shallowItemsClone = fileCommandUtils._cloneItemWithoutChildren(data.items);
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
