/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 'orion/selection',
	        'orion/searchClient', 'orion/globalCommands', 'orion/profile/UsersList', 'orion/profile/usersUtil',
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/profile/widgets/NewUserDialog'], 
			function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mCommands, mSelection, mSearchClient, mGlobalCommands, mUsersList, mUsersUtil) {

dojo.addOnLoad(function() {
	document.body.style.visibility = "visible";
	dojo.parser.parse();

	var serviceRegistry = new mServiceregistry.ServiceRegistry();
	var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
	dojo.addOnUnload(function() {
		pluginRegistry.shutdown();
	});
	var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
	var prefsService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
	var selection = new mSelection.Selection(serviceRegistry);

	mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, prefsService, searcher, usersList, usersList);
	mGlobalCommands.generateDomCommandsInBanner(commandService, usersList);

	var usersList = new mUsersList.UsersList(serviceRegistry, selection, searcher, "usersList", "pageActions", "selectionTools");
	
	var createUserCommand = new mCommands.Command({
		name: "Create User",
		image: "/profile/images/create_user.gif",
		id: "eclipse.createUser",
		callback: function() {
			var dialog = new orion.profile.widgets.NewUserDialog({
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
		
	var deleteCommand = new mCommands.Command({
		name: "Delete User",
		image: "/images/remove.gif",
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
					serviceRegistry.getService("orion.core.user").then(function(service) {
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
					serviceRegistry.getService("orion.core.user").then(function(service) {
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
	mUsersUtil.updateNavTools(serviceRegistry, usersList, "pageActions", "selectionTools", {});	
});

});