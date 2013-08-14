/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window define orion XMLHttpRequest confirm*/
/*jslint sub:true*/
define(['i18n!orion/navigate/nls/messages', 'orion/webui/littlelib', 'orion/commands', 'orion/Deferred', 'orion/webui/dialogs/DirectoryPrompterDialog'],
	function(messages, lib, mCommands, Deferred, DirectoryPrompterDialog){
		var projectCommandUtils = {};
		
		var selectionListenerAdded = false;
		
		var lastItemLoaded = {Location: null};
		
		var progressService;
		
			
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
		
	/**
	 * Updates the explorer toolbar.
	 * @name orion.fileCommands#updateNavTools
	 * @function
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.commandregistry.CommandRegistry} commandRegistry
	 * @param {orion.explorer.Explorer} explorer
	 * @param {String} toolbarId Gives the scope for toolbar commands. Commands in this scope are rendered with the <code>item</code>
	 * parameter as their target.
	 * @param {String} [selectionToolbarId] Gives the scope for selection-based commands. Commands in this scope are rendered
	 * with current selection as their target.
	 * @param {Object} item The model item to render toolbar commands against.
	 * @param {Boolean} [rootSelection=false] If <code>true</code>, any selection-based commands will be rendered with the <code>explorer</code>'s 
	 * treeRoot as their target, when no selection has been made. If <code>false</code>, any selection-based commands will be inactive when no 
	 * selection has been made.
	 */
	projectCommandUtils.updateNavTools = function(registry, commandRegistry, explorer, toolbarId, selectionToolbarId, toolbarItem, rootSelection) {
		function updateSelectionTools(selectionService, item) {
			var selectionTools = lib.node(selectionToolbarId);
			if (selectionTools) {
				// Hacky: check for a local selection service of the selectionToolbarId, or the one associated with the commandRegistry
				var contributions = commandRegistry._contributionsByScopeId[selectionToolbarId];
				selectionService = selectionService || (contributions && contributions.localSelectionService) || commandRegistry.getSelectionService(); //$NON-NLS-0$
				if (contributions && selectionService) {
					Deferred.when(selectionService.getSelections(), function(selections) {
						commandRegistry.destroy(selectionTools);
						var isNoSelection = !selections || (Array.isArray(selections) && !selections.length);
						if (rootSelection && isNoSelection) {
							commandRegistry.renderCommands(selectionTools.id, selectionTools, item, explorer, "button");  //$NON-NLS-0$
						} else {
							commandRegistry.renderCommands(selectionTools.id, selectionTools, null, explorer, "button"); //$NON-NLS-1$ //$NON-NLS-0$
						}
					});
				}
			}
		}

		var toolbar = lib.node(toolbarId);
		if (toolbar) {
			commandRegistry.destroy(toolbar);
		} else {
			throw new Error("could not find toolbar " + toolbarId); //$NON-NLS-0$
		}
		// close any open slideouts because if we are retargeting the command
		if (toolbarItem.Location !== lastItemLoaded.Location) {
			commandRegistry.closeParameterCollector();
			lastItemLoaded.Location = toolbarItem.Location;
		}

		commandRegistry.renderCommands(toolbar.id, toolbar, toolbarItem, explorer, "button"); //$NON-NLS-0$
		if (lastItemLoaded.Location) {
			commandRegistry.processURL(window.location.href);
		} 
		if (selectionToolbarId) {
			updateSelectionTools(null, explorer.treeRoot);
		}

		// Attach selection listener once, keep forever
		if (!selectionListenerAdded) {
			selectionListenerAdded = true;
			var selectionService = registry.getService("orion.page.selection"); //$NON-NLS-0$
			selectionService.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
				updateSelectionTools(selectionService, explorer.treeRoot);
			});
		}
	};
	
	projectCommandUtils.getDepenencyFileMetadata = function(depenency, fileClient){
		var deferred = new Deferred();
		function getLastChild(childrenLocation, path){
			fileClient.fetchChildren(childrenLocation).then(function(children){
				for(var i=0; i<children.length; i++){
					if(children[i].Name === path[0]){
						if(path.length===1){
							deferred.resolve(children[i]);
						} else {
							getLastChild(children[i].ChildrenLocation, path.splice(1, path.length-1));
						}
						return;
					}
				}
					deferred.reject(depenency.Location + " could not be found in your workspace");
			}, function(error){console.error(error);});
		}
		
		if(depenency.Type==="file"){
			var path = depenency.Location.split("/");
			fileClient.loadWorkspace().then(function(workspace){
						for(var i=0; i<workspace.Children.length; i++){
							if(workspace.Children[i].Name===path[0]){
								if(path.length===1){
									deferred.resolve(workspace.Children[i]);
								} else {
									getLastChild(workspace.Children[i].ChildrenLocation, path.splice(1, path.length-1));
								}
								return;
							}
						}
						deferred.reject(depenency.Location + " could not be found in your workspace");
			}, function(error){console.error(error);});
		}
		return deferred;
	};
		
	/**
	 * Creates the commands related to file management.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to use when creating commands
	 * @param {orion.commandregistry.CommandRegistry} commandRegistry The command registry to get commands from
	 * @param {orion.explorer.FileExplorer} explorer The explorer view to add commands to, and to update when model items change.
	 * To broadcast model change nodifications, this explorer must have a <code>modelEventDispatcher</code> field.
	 * @param {orion.EventTarget} [explorer.modelEventDispatcher] If supplied, this dispatcher will be invoked to dispatch events
	 * describing model changes that are performed by file commands.
	 * @param {orion.fileClient.FileClient} fileClient The file system client that the commands should use
	 * @name orion.fileCommands#createFileCommands
	 * @function
	 */
	projectCommandUtils.createProjectCommands = function(serviceRegistry, commandService, explorer, fileClient) {
		progressService = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
		var that = this;
		function errorHandler(error) {
			if (progressService) {
				progressService.setProgressResult(error);
			} else {
				window.console.log(error);
			}
		}
		
		var addFolderCommand = new mCommands.Command({
			name: "Add External Folder",
			tooltip: "Add an external folder from workspace",
			id: "orion.project.addFolder", //$NON-NLS-0$
			callback: function(data) {
				var item = forceSingleItem(data.items);
				
				var dialog = new DirectoryPrompterDialog.DirectoryPrompterDialog({ title : messages["Choose a Folder"],
					serviceRegistry : serviceRegistry,
					fileClient : fileClient,
					func : function(targetFolder) {
						fileClient.read(targetFolder.Location, true).then(function(fileMetadata){
							var fileLocation = "";
							if(fileMetadata.Parents){
								for(var i=fileMetadata.Parents.length-1; i>=0; i--){
									fileLocation+=fileMetadata.Parents[i].Name;
									fileLocation+= "/";
								}
								fileLocation+=fileMetadata.Name;
							}
							fileClient.addProjectDepenency(item.Location, {Name: fileMetadata.Name, Type: "file", Location: fileLocation}).then(function(){
								explorer.changedItem();
							}, errorHandler);
						}, errorHandler);
					}
				});
				
				dialog.show();
				
			},
			visibleWhen: function(item) {
				return item.type==="Project";
			}
		});
		commandService.addCommand(addFolderCommand);
		
		var initProjectCommand = new mCommands.Command({
			name: "Init Basic Project",
			tooltip: "Convert this folder into a project",
			id: "orion.project.initProject", //$NON-NLS-0$
			callback: function(data) {
				var item = forceSingleItem(data.items);
				var parentProject;
				if (item.Parents && item.Parents.length===0){
					parentProject = item;
				} else if(item.Parents){
					parentProject = item.Parents[item.Parents.length-1];
				}
				if(parentProject){
					fileClient.initProject(parentProject.Location).then(function(){
						fileClient.read(item.Location, true).then(function(fileMetadata){
							explorer.changedItem(fileMetadata);
						}, errorHandler);
					}, errorHandler);
				}
				
			},
			visibleWhen: function(item) {
				return item.type==="Folder";
			}
		});
		commandService.addCommand(initProjectCommand);
		
		};
	
		return projectCommandUtils;
});