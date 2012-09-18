/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
 /*jslint browser:true devel:true sub:true */
 /*global define window orion */

define(['i18n!profile/nls/messages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/operationsClient', 'orion/commands', 'orion/selection',
	        'orion/searchClient', 'orion/fileClient', 'orion/globalCommands', 'orion/profile/UsersList', 'orion/profile/usersUtil',
	        'dojo/hash', 'dojo/date/locale','orion/profile/widgets/NewUserDialog',
	        'orion/profile/widgets/ResetPasswordDialog'], 
			function(messages, require, dojo, mBootstrap, mStatus, mProgress, mOperationsClient, mCommands, mSelection, mSearchClient, mFileClient, mGlobalCommands, mUsersList, mUsersUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
		
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var selection = new mSelection.Selection(serviceRegistry);
			
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			new mProgress.ProgressService(serviceRegistry, operationsClient);
	
			var usersList = new mUsersList.UsersList(serviceRegistry, selection, searcher, "usersList", "pageActions", "selectionTools", "userCommands"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			mGlobalCommands.generateBanner("orion-userList", serviceRegistry, commandService, preferences, searcher, usersList); //$NON-NLS-0$	
			
			var previousPage = new mCommands.Command({
				name : messages["< Previous Page"],
				tooltip: messages["Show previous page of Users names"],
				id : "orion.userlist.prevPage", //$NON-NLS-0$
				hrefCallback : function() {
					var start = usersList.queryObject.start - usersList.queryObject.rows;
					if (start < 0) {
						start = 0;
					}
					return window.location.pathname + "#?start=" + start + "&rows=" + usersList.queryObject.rows; //$NON-NLS-1$ //$NON-NLS-0$
				},
				visibleWhen : function(item) {
					return usersList.queryObject.start > 0;
				}
			});
			commandService.addCommand(previousPage);

			var nextPage = new mCommands.Command({
				name : messages["Next Page >"],
				tooltip: messages["Show next page of User names"],
				id : "orion.userlist.nextPage", //$NON-NLS-0$
				hrefCallback : function() {
					return window.location.pathname + "#?start=" + (usersList.queryObject.start + usersList.queryObject.rows) + "&rows=" + usersList.queryObject.rows; //$NON-NLS-1$ //$NON-NLS-0$
				},
				visibleWhen : function(item) {
					return usersList.queryObject.length === 0 ? true : (usersList.queryObject.start + usersList.queryObject.rows) < usersList.queryObject.length;
				}
			});
			commandService.addCommand(nextPage);


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
									if(usersProcessed===item.length) {
										this.reloadUsers();
									}
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
			
			commandService.registerCommandContribution("pageActions", "orion.userlist.prevPage", 2, "eclipse.usersGroup");  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("pageActions", "orion.userlist.nextPage", 3, "eclipse.usersGroup");  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			commandService.registerCommandContribution("pageActions", "eclipse.createUser", 1, "eclipse.usersGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			commandService.registerCommandContribution("userCommands", "eclipse.deleteUser", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("userCommands", "eclipse.changePassword", 2); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("selectionTools", "eclipse.deleteUser", 1, "eclipse.selectionGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			//every time the user manually changes the hash, we need to load the user list again
			dojo.subscribe("/dojo/hashchange", usersList, function() { //$NON-NLS-0$
				usersList.reloadUsers();
			});
			
			usersList.createModel();
			usersList.loadUsers(true);
		});
	});
});