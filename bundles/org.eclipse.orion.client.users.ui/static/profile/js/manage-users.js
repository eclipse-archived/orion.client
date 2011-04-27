/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
dojo.addOnLoad(function() {

	var serviceRegistry = new eclipse.ServiceRegistry();
	var usersService = new eclipse.UsersService(serviceRegistry);
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var prefsService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	var selection = new orion.Selection(serviceRegistry);

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, prefsService, searcher, usersList, usersList);
	eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, usersList);

	var usersList = new eclipse.UsersList(serviceRegistry, selection, searcher, "usersList", "pageActions", "selectionTools");
	
	var createUserCommand = new eclipse.Command({
		name: "Create User",
		image: "profile/images/create_user.gif",
		id: "eclipse.createUser",
		callback: function() {
			var dialog = new profile.widgets.NewUserDialog({
				func : dojo.hitch(usersList, function() {
					this.reloadUsers();
				}),
				registry : serviceRegistry
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			return true;
		}
	});
	
	commandService.addCommand(createUserCommand, "dom");
		
	var deleteCommand = new eclipse.Command({
		name: "Delete User",
		image: "images/remove.gif",
		id: "eclipse.deleteUser",
		visibleWhen: function(item) {
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
		},
		callback: function(item) {
			if(dojo.isArray(item)){
				if(confirm("Do you want do delete " + item.length + " users?")){
					serviceRegistry.getService("IUsersService").then(function(service) {
						var usersProcessed = 0;
						for(var i=0; i<item.length; i++){
							  service.deleteUser(item[i].Location, dojo.hitch(usersList, function(jsonData, secondArg) {
								  usersProcessed++;
								  if(usersProcessed==item.length)
									  this.reloadUsers();
							  }));	
						}
					});
				}
				
			}else{
				if (confirm("Do you want to delete user " + item.login + "?")) {
					serviceRegistry.getService("IUsersService").then(function(service) {
					  service.deleteUser(item.Location, dojo.hitch(usersList, function(jsonData, secondArg) {
						  this.reloadUsers();
					  }));
					});
				}
			}
			
		}
	});
	commandService.addCommand(deleteCommand, "object");
	commandService.addCommand(deleteCommand, "dom");
	
	
	

	// define the command contributions - where things appear, first the groups
	commandService.addCommandGroup("eclipse.usersGroup", 100, null, null, "pageActions");
	commandService.addCommandGroup("eclipse.selectionGroup", 500, "More actions", null, "selectionTools");
	
	commandService.registerCommandContribution("eclipse.createUser", 1, "pageActions", "eclipse.usersGroup");
	
	commandService.registerCommandContribution("eclipse.deleteUser", 1);
	commandService.registerCommandContribution("eclipse.deleteUser", 1, "selectionTools", "eclipse.selectionGroup");
	

	usersList.loadUsers();
	eclipse.usersCommandUtils.updateNavTools(serviceRegistry, usersList, "pageActions", "selectionTools", {});	
});

eclipse.usersCommandUtils = eclipse.usersCommandUtils || {};
eclipse.usersCommandUtils.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
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
	if (!eclipse.doOnce) {
		eclipse.doOnce = true;
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