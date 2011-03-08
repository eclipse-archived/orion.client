/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
dojo.addOnLoad(function() {

	var serviceRegistry = new eclipse.ServiceRegistry();
	var usersService = new eclipse.UsersService(serviceRegistry);
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var prefsService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, prefsService, searcher, usersList, usersList);
	eclipse.globalCommandUtils.generateDomCommandsInBanner(commandService, usersList);

	dojo.create("a", {id:"profileBanner", className: "breadcrumb currentLocation", innerHTML: "Orion Users"}, dojo.byId('pageTitle'));

	var usersList = new eclipse.UsersList({
		parent : "usersList",
		registry : serviceRegistry
	});
	usersList.loadUsers();

	
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
		}
	});
	
	
	commandService.addCommandGroup("eclipse.manageuserscommands", 100, null, null, "pageActions");
	commandService.addCommand(createUserCommand, "dom");
	commandService.registerCommandContribution("eclipse.createUser", 1, "pageActions", "eclipse.manageuserscommands");
	
	
	commandService.renderCommands(dojo.byId("pageActions"), "dom", {}, {}, "image");
	


});