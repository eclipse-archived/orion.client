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

	/* set the login information in toolbar */
	dojo.xhrGet({
		url : "/auth2",
		handleAs : 'javascript',
		sync : true,
		headers : {
			"Orion-Version" : "1"
		}
	});

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
	commandService.addCommand(createUserCommand, "dom", "userCommandsToolbar");
	commandService.renderCommands(document.getElementById("userCommandsToolbar"), "dom", 0, this, "image");

});