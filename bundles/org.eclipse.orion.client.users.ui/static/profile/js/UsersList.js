/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var eclipse = eclipse || {};
eclipse.UsersList = (function() {
	function UsersList(options) {
		this._init(options);
	}

	UsersList.prototype = {
		_init : function(options) {
			this.parent = options.parent;
		},
		loadUsers : function() {
			dojo.xhrGet({
				url : "/users",
				headers : {
					"EclipseWeb-Version" : "1"
				},
				handleAs : "json",
				timeout : 15000,
				load : dojo.hitch(this, function(jsonData, secondArg) {

					var table = dojo.create("table", {
						class : "usersTable"
					});
					var titleRow = dojo.doc.createElement("tr");

					dojo.create("td", {
						innerHTML : "Login",
						class : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "Name",
						class : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "Actions",
						class : "usersTable"
					}, titleRow);

					dojo.place(titleRow, table);
					dojo.place(table, this.parent);

					for ( var i in jsonData.users) {
						var userRow = dojo.doc.createElement("tr");
						dojo.create("td", {
							innerHTML : this
									.getUserTab(jsonData.users[i].login),
							class : "usersTable"
						}, userRow);
						dojo.create("td", {
							innerHTML : jsonData.users[i].name,
							class: "usersTable"
						}, userRow);
						var actions = dojo.create("td", {class: "usersTable"});
						var deleteAction = dojo.create("img", {
							src : "images/silk/cross.png",
							alt : "Delete",
							title : "Delete user " + jsonData.users[i].login,
							class: "usersTable"
						}, actions);
						dojo.connect(deleteAction, "onclick", dojo.hitch(this,
								function(login) {
									this.deleteUser(login)
								}, jsonData.users[i].login));
						dojo.place(actions, userRow);
						dojo.place(userRow, table);
					}

				}),
				error : function(error, ioArgs) {
					handleGetAuthenticationError(this, ioArgs);
					console.error("HTTP status code: ", ioArgs.xhr.status);
				}
			});

		},
		getUserTab : function(userName) {
			return tab = "<a href=\"/user-profile.html#/users/" + userName
					+ "\">" + userName + "</a>";
		},
		reloadUsers : function() {
			dojo.html._emptyNode(this.parent);
			this.loadUsers();
		},
		deleteUser : function(userName) {
			if (confirm("Do you want to delete user " + userName + "?")) {
				dojo.xhrDelete({
					url : "/users/" + userName,
					headers : {
						"EclipseWeb-Version" : "1"
					},
					handleAs : "json",
					timeout : 15000,
					load : dojo.hitch(this, function(jsonData, secondArg) {
						this.reloadUsers();
					}),
					error : function(error, ioArgs) {
						handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});
			}
		}
	}
	return UsersList;
}());