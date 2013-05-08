/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window define orion XMLHttpRequest*/
/*browser:true*/

define(['i18n!orion/navigate/nls/messages', 'require', 'orion/webui/littlelib', 'orion/i18nUtil', 'orion/uiUtils', 'orion/fileUtils', 'orion/commands', 
	'orion/commandRegistry', 'orion/extensionCommands', 'orion/contentTypes', 'orion/compare/compareUtils', 
	'orion/Deferred', 'orion/webui/dialogs/DirectoryPrompterDialog', 'orion/webui/dialogs/SFTPConnectionDialog', 'orion/webui/dialogs/ImportDialog'],
	function(messages, require, lib, i18nUtil, mUIUtils, mFileUtils, mCommands, mCommandRegistry, mExtensionCommands, mContentTypes, mCompareUtils, Deferred, DirPrompter, SFTPDialog, ImportDialog){

	/**
	 * Utility methods
	 * @class This class contains static utility methods for creating and managing commands 
	 * related to file management.
	 * @name orion.fileCommands
	 */
	var fileCommandUtils = {};

	var favoritesCache = null;
	
	// This variable is used by a shared error handler so it is set up here.  Anyone using the error handler should set this
	// variable first.
	var progressService = null;
	
	var lastItemLoaded = {Location: null};

	// I'm not sure where this belongs.  This is the first time an outer party consumes
	// favorites and understands the structure.  We need a cache for synchronous requests
	// for move/copy targets.
	function FavoriteFoldersCache(registry) {
		this.registry = registry;
		this.favorites = [];
		var self = this;
		var service = this.registry.getService("orion.core.favorite"); //$NON-NLS-0$
		if(!progressService) {
			progressService = this.registry.getService("orion.page.progress"); //$NON-NLS-0$
		}
		progressService.progress(service.getFavorites(), "Getting favorites").then(function(favs) {
			self.cacheFavorites(favs.navigator);
		});
		service.addEventListener("favoritesChanged", function(event) { //$NON-NLS-0$
			self.cacheFavorites(event.navigator);
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
	 * Uploads a file
	 * @name orion.fileCommands#uploadFile
	 * @function
	 */
	fileCommandUtils.uploadFile = function(targetFolder, file, explorer, unzip) { 
		this.req = new XMLHttpRequest();
		this.req.open('post', targetFolder.ImportLocation, true); //$NON-NLS-0$
		this.req.setRequestHeader("X-Requested-With", "XMLHttpRequest"); //$NON-NLS-1$ //$NON-NLS-0$
		this.req.setRequestHeader("Slug", file.name); //$NON-NLS-0$
		// TODO if we want to unzip zip files, don't use this...
		if (!unzip) {
			this.req.setRequestHeader("X-Xfer-Options", "raw"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		this.req.setRequestHeader("Content-Type", file.type); //$NON-NLS-0$
		this.req.onreadystatechange = function() {
			if (explorer) {
				explorer.changedItem(targetFolder, true);
			}
		};
		this.req.send(file);
	};

	/**
	 * Updates the explorer tool bar
	 * @name orion.fileCommands#updateNavTools
	 * @function
	 */
	fileCommandUtils.updateNavTools = function(registry, commandService, explorer, toolbarId, selectionToolbarId, item) {
		var toolbar = lib.node(toolbarId);
		if (toolbar) {
			commandService.destroy(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId; //$NON-NLS-0$
		}
		// close any open slideouts because if we are retargeting the command
		if (item.Location !== lastItemLoaded.Location) {
			commandService.closeParameterCollector();
			lastItemLoaded.Location = item.Location;
		}

		commandService.renderCommands(toolbar.id, toolbar, item, explorer, "button"); //$NON-NLS-0$
		if (lastItemLoaded.Location) {
			commandService.processURL(window.location.href);
		} 
		if (selectionToolbarId) {
			var selectionTools = lib.node(selectionToolbarId);
			if (selectionTools) {
				commandService.destroy(selectionTools);
				commandService.renderCommands(selectionToolbarId, selectionTools, null, explorer, "button");  //$NON-NLS-0$
			}
		}
		
		// Stuff we do only the first time
		if (!favoritesCache) {
			favoritesCache = new FavoriteFoldersCache(registry);
			var selectionService = registry.getService("orion.page.selection"); //$NON-NLS-0$
			selectionService.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
				var selectionTools = lib.node(selectionToolbarId);
				if (selectionTools) {
					commandService.destroy(selectionTools);
					commandService.renderCommands(selectionTools.id, selectionTools, event.selections, explorer, "button"); //$NON-NLS-1$ //$NON-NLS-0$
				}
			});
		}
	};
	
	function errorHandler(error) {
		if (progressService) {
			progressService.setProgressResult(error);
		} else {
			window.console.log(error);
		}
	}

	
	function getNewItemName(explorer, item, domId, defaultName, onDone) {
		var refNode, name, tempNode;
		if (item.Location === explorer.treeRoot.Location) {
			refNode = lib.node(domId);
		} else {
			var nodes = explorer.makeNewItemPlaceHolder(item, domId);
			if (nodes) {
				refNode = nodes.refNode;
				tempNode = nodes.tempNode;
			} else {
				refNode = lib.node(domId);
			}
		}
		if (refNode) {
			mUIUtils.getUserText(domId+"EditBox", refNode, false, defaultName,  //$NON-NLS-0$
				function(name) { 
					if (name) {
						if (tempNode && tempNode.parentNode) {
							tempNode.parentNode.removeChild(tempNode);
						}
						onDone(name);
					}
				}); 
		} else {
			name = window.prompt(defaultName);
			if (name) {
				onDone(name);
			}
		}
	}
	
	function forceSingleItem(item) {
		if (!item) {
			return {};
		}
		if (Array.isArray(item)) {
			if (item.length === 1) {
				item = item[0];
			} else {
				item = {};
			}
		}
		return item;
	}

	
	function canCreateProject(item) {
		item = forceSingleItem(item);
		return item.Location && mFileUtils.isAtRoot(item.Location);
	}
		
	function createProject(explorer, fileClient, progress, name, populateFunction, progressMessage) {
		// set progress variable so error handler can use
		progressService = progress;
		if (name) {
			var loadedWorkspace;
			if (mFileUtils.isAtRoot(explorer.treeRoot.ChildrenLocation)) {
				loadedWorkspace = explorer.treeRoot;
			} else {
				loadedWorkspace = progressService.progress(fileClient.loadWorkspace(""), "Loading workspace");
			}
			Deferred.when(loadedWorkspace, function(workspace) {
				var deferred = fileClient.createProject(workspace.ChildrenLocation, name);
				if (progressMessage) {
					deferred = progress.showWhile(deferred, progressMessage);
				}
				deferred.then(function(project) {
					// we need folder metadata for the commands, not the project object
					progress.progress(fileClient.read(project.ContentLocation, true), "Reading metadata of newly created project " + name).then(function(folder) {
						if (populateFunction) {
							populateFunction(folder);
						}
						explorer.loadResourceList("", true);
					}, errorHandler);
				}, 
				errorHandler);
			}, errorHandler);
		}
	}


	/**
	 * Creates the commands related to file management.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to use when creating commands
	 * @param {orion.commandregistry.CommandRegistry} commandRegistry The command registry to get commands from
	 * @param {orion.explorer.Explorer} explorer The explorer view to add commands to
	 * @param {orion.fileClient.FileClient} fileClient The file system client that the commands should use
	 * @name orion.fileCommands#createFileCommands
	 * @function
	 */
	fileCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, fileClient) {
		progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$

		function contains(arr, item) {
			for (var i=0; i<arr.length; i++) {
				if (arr[i] === item) {
					return true;
				}
			}
			return false;
		}
		
		function stripPath(location) {
			location = mFileUtils.makeRelative(location);
			// get hash part and strip query off
			var splits = location.split('#'); //$NON-NLS-0$
			var path = splits[splits.length-1];
			var qIndex = path.indexOf("/?"); //$NON-NLS-0$
			if (qIndex > 0) {
				//remove the query but not the trailing separator
				path = path.substring(0, qIndex+1);
			}
			return path;
		}
		
		function makeMoveCopyTargetChoices(items, userData, isCopy) {
			items = Array.isArray(items) ? items : [items];
			var ex = explorer;
			var refreshFunc = function() {
				ex.changedItem.bind(ex)(ex.treeRoot, true);
			};
			var callback = function(selectedItems) {
				if (!Array.isArray(selectedItems)) {
					selectedItems = [selectedItems];
				}
				for (var i=0; i < selectedItems.length; i++) {
					var item = selectedItems[i];
					var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
					func.apply(fileClient, [item.Location, this.path]).then(
						refreshFunc, //refresh the root
						errorHandler
					);
				}
			};
			
			var prompt = function(selectedItems) {
				var dialog = new DirPrompter.DirectoryPrompterDialog({
					title: messages["Choose a Folder"],
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,				
					func: function(targetFolder) { 
						if (targetFolder && targetFolder.Location) {
							if (!Array.isArray(selectedItems)) {
								selectedItems = [selectedItems];
							}
							for (var i=0; i < selectedItems.length; i++) {
								var location = targetFolder.Location;
								var item = selectedItems[i];
								var newName = item.Name || null;
								var func = isCopy ? fileClient.copyFile : fileClient.moveFile;
								var message = i18nUtil.formatMessage(isCopy ? messages["Copying ${0}"] : messages["Moving ${0}"], item.Location);
								if (isCopy && item.parent && item.parent.Location === location) {
									newName = window.prompt(i18nUtil.formatMessage(messages["Enter a new name for '${0}'"], item.Name), i18nUtil.formatMessage(messages["Copy of ${0}"], item.Name));
									// user cancelled?  don't copy this one
									if (!newName) {
										location = null;
									}
								}
								if (location) {
									var deferred = func.apply(fileClient, [item.Location, targetFolder.Location, newName]);
									progressService.showWhile(deferred, message).then(
										refreshFunc, //refresh the root
										errorHandler
									);
								}
							}
						}
					}
				});
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
						choices.push({name: favorites[i].name, imageClass: "core-sprite-makeFavorite", path: stripped, callback: callback}); //$NON-NLS-0$
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
				var slashes = item.stripped.split('/').length + 1; //$NON-NLS-0$
				// but don't indent for leading or trailing slash
				// TODO is there a smarter way to do this?
				for (var j=0; j<slashes-2; j++) {
					displayPath = "  " + displayPath; //$NON-NLS-0$
				}
				choices.push({name: displayPath, path: item.stripped, callback: callback});
			}
			if (proposedPaths.length > 0) {
				choices.push({});  //separator
			}
			choices.push({name: messages["Choose folder..."], callback: prompt});
			return choices;
		}
		
		var oneOrMoreFilesOrFolders = function(item) {
			var items = Array.isArray(item) ? item : [item];
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
		
		var renameCommand = new mCommands.Command({
				name: messages["Rename"],
				tooltip: messages["Rename the selected files or folders"],
				imageClass: "core-sprite-rename", //$NON-NLS-0$
				id: "eclipse.renameResource", //$NON-NLS-0$
				visibleWhen: function(item) {
					if (Array.isArray(item)) {
						return item.length === 1 && item[0].Name;
					}
					return item.Location;
				},
				callback: function(data) {
					// we want to popup the edit box over the name in the explorer.
					// if we can't find it, we'll pop it up over the command dom element.
					var item = forceSingleItem(data.items);
					var refNode = explorer.getNameNode(item);
					if (!refNode) {
						refNode = data.domNode;
					}
					mUIUtils.getUserText(refNode.id+"EditBox", refNode, true, item.Name,  //$NON-NLS-0$
						function(newText) {
							var moveLocation = item.Location;
							if (item.parent.Projects) {
								//special case for moving a project. We want to move the 
								//project rather than move the project's content
								for (var p=0; p < item.parent.Projects.length; p++) {
									var project = item.parent.Projects[p];
									if (project.Id === item.Id) {
										moveLocation = project.Location;
										break;
									}
								}
							}
							var deferred = fileClient.moveFile(moveLocation, item.parent.Location, newText);
							var ex = explorer;
							progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Renaming ${0}"], moveLocation)).then(
								function(newItem) {
									var refreshItem;
									var forceExpand = null;
									if (item.parent.Projects) {
										//special case for renaming a project. Use the treeroot as the refresh item.
										refreshItem = ex.treeRoot;
										forceExpand = ex.isExpanded(item) && item;
									} else {
										// refresh the parent, which will update the child paths. 
										// refreshing the newItem would cause "not found" in the tree since a rename has occurred.
										refreshItem = item.parent;
										if (item.Directory) {
											forceExpand = ex.isExpanded(item) && newItem;
										}
									}
									// Update the parent
									ex.changedItem(item.parent, true);
									// If the renamed item was an expanded directory, force an expand.
									if (forceExpand) {
										ex.changedItem(forceExpand, true);
									}
								}, 
								errorHandler
							);
						}, 
						null, null, "." //$NON-NLS-0$
					); 
				}
			});
		commandService.addCommand(renameCommand);
		
		var contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
		var compareWithEachOtherCommand = new mCommands.Command({
				name: messages["Compare with each other"],
				tooltip: messages["Compare the selected 2 files with each other"],
				id: "eclipse.compareWithEachOther", //$NON-NLS-0$
				visibleWhen: function(item) {
					if (Array.isArray(item)) {
						if(item.length === 2 && !item[0].Directory && !item[1].Directory){
							var contentType1 = contentTypeService.getFilenameContentType(item[0].Name);
							var contentType2 = contentTypeService.getFilenameContentType(item[1].Name);
							if(contentType1 && (contentType1['extends'] === "text/plain" || contentType1.id === "text/plain") && //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
							   contentType2 && (contentType2['extends'] === "text/plain" || contentType2.id === "text/plain")){ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$
								return true;
							}
						} else if(item.length === 2 && item[0].Directory && item[1].Directory){
							return true;
						}
					}
					return false;
				},
				hrefCallback: function(data) {
					if(data.items[0].Directory && data.items[1].Directory){
						return mCompareUtils.generateCompareTreeHref(data.items[0].Location, {compareTo: data.items[1].Location, readonly: true});
					}
					return mCompareUtils.generateCompareHref(data.items[0].Location, {compareTo: data.items[1].Location, readonly: true}); //$NON-NLS-0$
				}
			});
		commandService.addCommand(compareWithEachOtherCommand);
		
		var compareWithCommand = new mCommands.Command({
			name : messages["Compare with..."],
			tooltip: messages["Compare the selected folder with a specified folder"], 
			id: "eclipse.compareWith", //$NON-NLS-0$
			visibleWhen: function(item) {
				if (Array.isArray(item)) {
					if(item.length === 1 && item[0].Directory){
						return true;
					}
				}
				return false;
			},
			callback: function(data) {
				var dialog = new DirPrompter.DirectoryPrompterDialog({
					title: messages["Choose a Folder"],
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,				
					func: function(targetFolder) { 
						if (targetFolder && targetFolder.Location) {
							var compareURL = mCompareUtils.generateCompareTreeHref(data.items[0].Location, {compareTo: targetFolder.Location, readonly: true});
							window.open(compareURL);
						}
					}
				});
				dialog.show();
			} 
		});
		commandService.addCommand(compareWithCommand);
		
		var deleteCommand = new mCommands.Command({
			name: messages["Delete"],
			tooltip: messages["Delete the selected files or folders"],
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.deleteFile", //$NON-NLS-0$
			visibleWhen: oneOrMoreFilesOrFolders,
			callback: function(data) {
				var items = Array.isArray(data.items) ? data.items : [data.items];
				var confirmMessage = items.length === 1 ? i18nUtil.formatMessage(messages["Are you sure you want to delete '${0}'?"], items[0].Name) : i18nUtil.formatMessage(messages["Are you sure you want to delete these ${0} items?"], items.length);
				serviceRegistry.getService("orion.page.dialog").confirm(confirmMessage,  //$NON-NLS-0$
					function(doit) {
						if (!doit) {
							return;
						}
						var count = 0;
						var refresher = function(item) {
							count++;
							if (count === items.length) {
								explorer.changedItem(item, true);
							}
						};
						for (var i=0; i < items.length; i++) {
							var item = items[i];
							var deleteLocation = item.Location;
							var refreshItem = item.parent;
							if (item.parent.Projects) {
								//special case for deleting a project. We want to remove the 
								//project rather than delete the project's content
								refreshItem = explorer.treeRoot;
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
								var deferred = fileClient.deleteFile(deleteLocation);
								progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Deleting ${0}"], deleteLocation)).then(function() {
									refresher(refreshItem);
								}, function(error) {
									errorHandler(error);
									refresher(refreshItem);
								});
							}
						}
					}
				);	
			}});
		commandService.addCommand(deleteCommand);
	
		var downloadCommand = new mCommands.Command({
			name: messages["Export as zip"],
			tooltip: messages["Create a zip file of the folder contents and download it"],
			imageClass: "core-sprite-exportzip", //$NON-NLS-0$
			id: "eclipse.downloadFile", //$NON-NLS-0$
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.ExportLocation && item.Directory;},
			hrefCallback: function(data) {
				return forceSingleItem(data.items).ExportLocation;
			}});
		commandService.addCommand(downloadCommand);
		
		var newFileNameParameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('name', 'text', messages['Name:'], messages['New File'])]); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var newFileCommand =  new mCommands.Command({
			name: messages["New File"],
			tooltip: messages["Create a new file"],
			imageClass: "core-sprite-new_file", //$NON-NLS-0$
			id: "eclipse.newFile", //$NON-NLS-0$
			parameters: newFileNameParameters,
			callback: function(data) {
				// Check selection service first, then use the provided item
				explorer.selection.getSelections(function(selections) {
					var item;
					if (selections.length === 1 && selections[0].Directory) {
						item = selections[0];
					} else {
						item = forceSingleItem(data.items);
					}
					var createFunction = function(name) {
						if (name) {
							var deferred = fileClient.createFile(item.Location, name);
							var ex = explorer;
							progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Creating ${0}"], name)).then(
								function() {ex.changedItem.bind(ex)(item, true); },
								errorHandler);
						}
					};
					if (data.parameters && data.parameters.valueFor('name')) { //$NON-NLS-0$
						createFunction(data.parameters.valueFor('name')); //$NON-NLS-0$
					} else {
						getNewItemName(explorer, item, data.domNode.id, messages['New File'], createFunction);
					}
				});
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}});
		commandService.addCommand(newFileCommand);
		
		var newFolderNameParameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('name', 'text', messages['Folder name:'], messages['New Folder'])]); //$NON-NLS-1$ //$NON-NLS-0$

		var newFolderCommand = new mCommands.Command({
			name: messages['New Folder'],
			tooltip: messages["Create a new folder"],
			imageClass: "core-sprite-new_folder", //$NON-NLS-0$
			id: "eclipse.newFolder", //$NON-NLS-0$
			parameters: newFolderNameParameters,
			callback: function(data) {
				// Check selection service first, then use the provided item
				explorer.selection.getSelections(function(selections) {
					var item;
					if (selections.length === 1 && selections[0].Directory) {
						item = selections[0];
					} else {
						item = forceSingleItem(data.items);
					}
					var createFunction = function(name) {
						if (name) {
							var deferred = fileClient.createFolder(item.Location, name);
							var ex = explorer;
							progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Creating ${0}"], name)).then(
								function() { ex.changedItem.bind(ex)(item, true); },
								errorHandler);
						}
					};
					if (data.parameters && data.parameters.valueFor('name')) { //$NON-NLS-0$
						createFunction(data.parameters.valueFor('name')); //$NON-NLS-0$
					} else {
						getNewItemName(explorer, item, data.domNode.id, messages['New Folder'], createFunction);
					}
				});
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}});
	
		commandService.addCommand(newFolderCommand);

		var zipURLParameters = new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('url', 'url', messages['File URL:'], 'URL'), new mCommandRegistry.CommandParameter('unzip', 'boolean', messages["Unzip *.zip files:"], true)]);//$NON-NLS-4$  //$NON-NLS-3$  //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$

		var importZipURLCommand = new mCommands.Command({
			name: messages["Import from HTTP..."],
			tooltip: messages["Copy a file from a URL and optionally unzip it"],
			id: "orion.importZipURL", //$NON-NLS-0$
			parameters: zipURLParameters,
			callback: function(data) {
				var targetFolder = forceSingleItem(data.items);
				var sourceURL = data.parameters && data.parameters.valueFor("url"); //$NON-NLS-0$
				if (targetFolder && sourceURL) {
					var importURL = targetFolder.ImportLocation+"?source="+sourceURL; //$NON-NLS-0$
					var expandZip = data.parameters && data.parameters.valueFor("unzip") && (sourceURL.indexOf(".zip") === sourceURL.length-4); //$NON-NLS-1$ //$NON-NLS-0$
					var optionHeader = expandZip ? "" : "raw"; //$NON-NLS-1$ //$NON-NLS-0$
					var deferred = fileClient.remoteImport(importURL, {"OptionHeader":optionHeader}); //$NON-NLS-0$
					progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Importing from ${0}"], sourceURL)).then(
						null, //function() {explorer.changedItem(ex.treeRoot, true); }, //refresh the root
						errorHandler
					);
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}
		});
		commandService.addCommand(importZipURLCommand);
		
		var newProjectCommand = new mCommands.Command({
			name: messages["Folder"],
			parameters: newFolderNameParameters,
			imageClass: "core-sprite-new_folder", //$NON-NLS-0$
			tooltip: messages["Create an empty folder"],
			description: messages["Create an empty folder on the Orion server.  You can import, upload, or create content in the editor."],
			id: "orion.new.project", //$NON-NLS-0$
			callback: function(data) {
				// Check selection service first, then use the provided item
				explorer.selection.getSelections(function(selections) {
					var item;
					if (selections.length === 1 && selections[0].Directory) {
						newFolderCommand.callback(data);
					} else {
						item = forceSingleItem(data.items);
						if (data.parameters && data.parameters.valueFor('name')) { //$NON-NLS-0$
							createProject(explorer, fileClient, progressService, data.parameters.valueFor('name')); //$NON-NLS-0$
						} else {
							getNewItemName(data.items, data.domNode.id, messages['New Folder'], function(name) {
								createProject(explorer, fileClient, progressService, name);
							});
						}
					} 
				});
			},
			visibleWhen: canCreateProject
		});
		commandService.addCommand(newProjectCommand);
		
		var linkProjectCommand = new mCommands.Command({
			name: messages["Link to Server"],
			tooltip: messages["Link to existing content on the server"],
			description: messages["Create a folder that links to an existing folder on the server."],
			imageClass: "core-sprite-link", //$NON-NLS-0$
			id: "orion.new.linkProject", //$NON-NLS-0$
			parameters: new mCommandRegistry.ParametersDescription([new mCommandRegistry.CommandParameter('name', 'text', 'Name:', 'New Folder'), new mCommandRegistry.CommandParameter('url', 'url', messages['Server path:'], '')]), //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			callback: function(data) {
				var createFunction = function(name, url) {
					if (name && url) {
						var deferred = fileClient.createProject(explorer.treeRoot.ChildrenLocation, name, url, true);
						var ex = explorer;
						progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Linking to ${0}"], url)).then(function() {
						    ex.loadResourceList(ex.treeRoot.Path, true); // refresh the root
						}, errorHandler);
					}
				};
				if (data.parameters && data.parameters.valueFor('name') && data.parameters.valueFor('url')) { //$NON-NLS-1$ //$NON-NLS-0$
					createFunction(data.parameters.valueFor('name'), data.parameters.valueFor('url')); //$NON-NLS-1$ //$NON-NLS-0$
				} else {
					errorHandler(messages["The name and server location were not specified."]);
				}
			},
			visibleWhen: canCreateProject});
		commandService.addCommand(linkProjectCommand);
		
		var goUpCommand = new mCommands.Command({
//			name: messages["Go Up"],
			tooltip: messages["Move up to the parent folder"],
			imageClass: "core-sprite-go-up", //$NON-NLS-0$
			id: "eclipse.upFolder", //$NON-NLS-0$
			callback: function(data) {
				if (typeof explorer.scopeUp === "function") {
					explorer.scopeUp();
				}
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Parents;
			}});
		commandService.addCommand(goUpCommand);

					
		var importCommand = new mCommands.Command({
			name : messages["Import local file..."],
			tooltip: messages["Copy files and folders from your local file system"],
			imageClass: "core-sprite-importzip", //$NON-NLS-0$
			id: "orion.import", //$NON-NLS-0$
			callback : function(data) {
				var item = forceSingleItem(data.items);
				var ex = explorer;
				var dialog = new ImportDialog.ImportDialog({
					importLocation: item.ImportLocation,
					func: function() {ex.changedItem.bind(ex)(item, true); }
				});
				dialog.show();
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}});
		commandService.addCommand(importCommand);
	
		var importSFTPCommand = new mCommands.Command({
			name : messages["SFTP from..."],
			tooltip: messages["Copy files and folders from a specified SFTP connection"],
			imageClass: "core-sprite-transferin", //$NON-NLS-0$
			id: "orion.importSFTP", //$NON-NLS-0$
			callback : function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new SFTPDialog.SFTPConnectionDialog({
					func:  function(host,port,path,user,password, overwriteOptions){
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp"; //$NON-NLS-1$ //$NON-NLS-0$
						var importOptions = {"OptionHeader":optionHeader,"Host":host,"Port":port,"Path":path,"UserName":user,"Passphrase":password}; //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						var deferred = fileClient.remoteImport(item.ImportLocation, importOptions);
						var ex = explorer;
						progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Importing from ${0}"], host)).then(
							function() { ex.changedItem.bind(ex)(this.treeRoot, true); },
							errorHandler
						);//refresh the root
					}
				});
				dialog.show();
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}});
		commandService.addCommand(importSFTPCommand);
	
		var exportSFTPCommand = new mCommands.Command({
			name : messages["SFTP to..."],
			tooltip: messages["Copy files and folders to a specified SFTP location"],
			imageClass: "core-sprite-transferout", //$NON-NLS-0$
			id: "eclipse.exportSFTPCommand", //$NON-NLS-0$
			callback : function(data) {
				var item = forceSingleItem(data.items);
				var dialog = new SFTPDialog.SFTPConnectionDialog({
					func:  function(host,path,user,password, overwriteOptions){
						var optionHeader = overwriteOptions ? "sftp,"+overwriteOptions : "sftp"; //$NON-NLS-1$ //$NON-NLS-0$
						var exportOptions = {"OptionHeader":optionHeader,"Host":host,"Path":path,"UserName":user,"Passphrase":password}; //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						var deferred = fileClient.remoteExport(item.ExportLocation, exportOptions);
						var ex = explorer;
						progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Exporting from ${0}"], host)).then(
							function() {ex.changedItem.bind(ex)(this.treeRoot, true);},
							errorHandler);//refresh the root
					}
				});
				dialog.show();
			},
			visibleWhen: function(item) {
				item = forceSingleItem(item);
				return item.Directory && !mFileUtils.isAtRoot(item.Location);}});
		commandService.addCommand(exportSFTPCommand);
		
		var copyCommand = new mCommands.Command({
			name : messages["Copy to"],
			tooltip: "Copy files and folders to a specified location", //$NON-NLS-0$
			id: "eclipse.copyFile", //$NON-NLS-0$
			choiceCallback: function(items, userData) {
				return makeMoveCopyTargetChoices(items, userData, true);
			},
			visibleWhen: oneOrMoreFilesOrFolders 
		});
		commandService.addCommand(copyCommand);
		
		var moveCommand = new mCommands.Command({
			name : messages["Move to"],
			tooltip: messages["Move files and folders to a new location"],
			id: "eclipse.moveFile", //$NON-NLS-0$
			choiceCallback: function(items, userData) {
				return makeMoveCopyTargetChoices(items, userData, false);
			},
			visibleWhen: oneOrMoreFilesOrFolders
			});
		commandService.addCommand(moveCommand);
		
		var bufferedSelection = [];
		var copyToBufferCommand = new mCommands.Command({
				name: messages["Copy Items"],
				tooltip: messages["Copy the selected items to the copy/paste buffer"],
				id: "eclipse.copySelections", //$NON-NLS-0$
				callback: function() {
					explorer.selection.getSelections(function(selections) {
						bufferedSelection = selections;
					});
				}
			});
		commandService.addCommand(copyToBufferCommand);
			
		var pasteFromBufferCommand = new mCommands.Command({
				name: messages["Paste Items"],
				tooltip: messages["Paste items from the copy/paste buffer"],
				id: "eclipse.pasteSelections", //$NON-NLS-0$
				visibleWhen: function(item) {
					item = forceSingleItem(item);
					return item.Directory && !mFileUtils.isAtRoot(item.Location);},
				callback: function(data) {
					// Check selection service first.  If a single folder is selected, that is the target.  Otherwise the root is the target.
					explorer.selection.getSelections(function(selections) {
						var item;
						if (selections.length === 1 && selections[0].Directory) {
							item = selections[0];
						} else {
							item = forceSingleItem(data.items);
						}
						if (bufferedSelection.length > 0) {
							// Do not allow pasting into the Root of the Workspace
							if (mFileUtils.isAtRoot(item.Location)) {
								errorHandler(messages["Cannot paste into the root"]);
								return;
							}
							for (var i=0; i<bufferedSelection.length; i++) {
								var location = bufferedSelection[i].Location;
								var name = bufferedSelection[i].Name || null;
								if (location) {
									if (bufferedSelection[i].parent && bufferedSelection[i].parent.Location === item.Location) {
										name = window.prompt(i18nUtil.formatMessage(messages['Enter a new name for \'${0}\''], bufferedSelection[i].Name), i18nUtil.formatMessage(messages['Copy of ${0}'], bufferedSelection[i].Name));
										// user cancelled?  don't copy this one
										if (!name) {
											location = null;
										}
									}
									if (location) {
										var deferred = fileClient.copyFile(location, item.Location, name);
										var ex = explorer;
										progressService.showWhile(deferred, i18nUtil.formatMessage(messages["Pasting ${0}"], location)).then(
											function() { ex.changedItem.bind(ex) (item, true); },
											errorHandler);
									}
								}
							}
						}
					});
				}
			});
		commandService.addCommand(pasteFromBufferCommand);		
	};
		
	fileCommandUtils.createNewContentCommand = function(id, name, href, hrefContent, explorer, fileClient, progress, progressMessage) {
		var parametersArray = href ? [] : [
			new mCommandRegistry.CommandParameter("folderName", "text", messages['Folder name:'], name), //$NON-NLS-1$ //$NON-NLS-0$
			new mCommandRegistry.CommandParameter("url", "url", messages['Extracted from:'], hrefContent), //$NON-NLS-1$ //$NON-NLS-0$
			new mCommandRegistry.CommandParameter("unzip", "boolean", messages['Unzip *.zip files:'], true) //$NON-NLS-1$ //$NON-NLS-0$
		];
		var parameterDescription = null;
		if (parametersArray.length > 0) {
			parameterDescription = new mCommandRegistry.ParametersDescription(parametersArray);
		}

		var newContentCommand = new mCommands.Command({
			name: name,
			parameters: parameterDescription,
			id: id,
			callback: function(data) {
				if (href) {
					window.open(href);
				} else {
					if (data.parameters && data.parameters.valueFor('folderName')) { //$NON-NLS-0$
						var newFolderName = data.parameters.valueFor('folderName'); //$NON-NLS-0$
						createProject(explorer, fileClient, progress, newFolderName, 
							function(folder) {
								data.parameters.clientCollect = true;
								data.commandRegistry.runCommand("orion.importZipURL", folder, explorer, data.parameters); //$NON-NLS-0$
							}); 
					} else {
						getNewItemName(explorer, data.items, data.domNode.id, name, function(name) {
								createProject(explorer, fileClient, progress, name,
								function(folder) {
									data.commandRegistry.runCommand("orion.importZipURL", folder, explorer, data.parameters); //$NON-NLS-0$
								});
							});
					}
				}
			},
			visibleWhen: canCreateProject
		});
		return newContentCommand;
	};
	
	return fileCommandUtils;
});
