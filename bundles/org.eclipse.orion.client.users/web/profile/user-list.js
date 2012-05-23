/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['i18n!profile/nls/messages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/selection',
	        'orion/searchClient', 'orion/fileClient', 'orion/globalCommands', 'orion/profile/UsersList', 'orion/profile/usersUtil',
	        'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/profile/widgets/NewUserDialog',
	        'orion/profile/widgets/ResetPasswordDialog'], 
			function(messages, require, dojo, mBootstrap, mStatus, mProgress, mOperationsClient, mCommands, mSelection, mSearchClient, mFileClient, mGlobalCommands, mUsersList, mUsersUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible"; //$NON-NLS-0$
			dojo.parser.parse();
		
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var selection = new mSelection.Selection(serviceRegistry);
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mProgress.ProgressService(serviceRegistry, operationsClient);
		
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher, usersList, usersList); //$NON-NLS-0$
			mGlobalCommands.generateDomCommandsInBanner(commandService, usersList);
		
			var usersList = new mUsersList.UsersList(serviceRegistry, selection, searcher, "usersList", "pageActions", "selectionTools", "userCommands"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var createUserCommand = new mCommands.Command({
				name: messages["Create User"],
				id: "eclipse.createUser", //$NON-NLS-0$
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
			
			commandService.addCommand(createUserCommand);
				
			var deleteCommand = new mCommands.Command({
				name: messages["Delete User"],
				image: require.toUrl("images/delete.gif"), //$NON-NLS-0$
				id: "eclipse.deleteUser", //$NON-NLS-0$
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
				callback: function(data) {
					var item = data.items;
					var userService = serviceRegistry.getService("orion.core.user"); //$NON-NLS-0$
					if(dojo.isArray(item) && item.length > 1){
						if(confirm(dojo.string.substitute(messages["Are you sure you want to delete these ${0} users?"], [item.length]))){
							var usersProcessed = 0;
							for(var i=0; i<item.length; i++){
								userService.deleteUser(item[i].Location).then( dojo.hitch(usersList, function(jsonData) {
									  usersProcessed++;
									  if(usersProcessed==item.length)
										  this.reloadUsers();
								  }));	
							}
						}
						
					}else{
						item = dojo.isArray(item) ? item[0] : item;
						if (confirm(dojo.string.substitute(messages["Are you sure you want to delete user ${0}?"], [item.login]))) {
							userService.deleteUser(item.Location).then( dojo.hitch(usersList, function(jsonData) {
							  this.reloadUsers();
						  }));
						}
					}
				}
			});
			commandService.addCommand(deleteCommand);
			
			var changePasswordCommand = new mCommands.Command({
				name: messages["Change Password"],
				id: "eclipse.changePassword", //$NON-NLS-0$
				callback: function(data) {
					var item = data.items;
					var dialog = new orion.profile.widgets.ResetPasswordDialog({
						user: item,
						registry : serviceRegistry
					});
					dialog.startup();
					dialog.show();
					
				},
				visibleWhen: function(item){
					return true;
				}
			});
			commandService.addCommand(changePasswordCommand);
			
			
		
			// define the command contributions - where things appear, first the groups
			commandService.addCommandGroup("pageActions", "eclipse.usersGroup", 100); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.addCommandGroup("selectionTools", "eclipse.selectionGroup", 500, messages["More"]); //$NON-NLS-1$ //$NON-NLS-0$
			
			commandService.registerCommandContribution("pageActions", "eclipse.createUser", 1, "eclipse.usersGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			commandService.registerCommandContribution("userCommands", "eclipse.deleteUser", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("userCommands", "eclipse.changePassword", 2); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("selectionTools", "eclipse.deleteUser", 1, "eclipse.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
		
			usersList.loadUsers();
			mUsersUtil.updateNavTools(serviceRegistry, usersList, "pageActions", "selectionTools", {});	 //$NON-NLS-1$ //$NON-NLS-0$
		});
	});
});