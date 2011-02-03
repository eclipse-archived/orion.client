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
			this.registry = options.registry;
		},
		loadUsers : function() {
			var userList = this;
			this.registry.getService("IUsersService").then(function(service) {
			  service.getUsersList(dojo.hitch(userList, function(jsonData, secondArg) {

					var table = dojo.create("table", {
						className : "usersTable"
					});
					var titleRow = dojo.doc.createElement("tr");

					dojo.create("td", {
						innerHTML : "Login",
						className : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "Name",
						className : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "Actions",
						className : "usersTable"
					}, titleRow);

					dojo.place(titleRow, table);
					dojo.place(table, this.parent);

					for ( var i in jsonData.users) {
						var userRow = dojo.doc.createElement("tr");
						dojo.create("td", {
							innerHTML : this
									.getUserTab(jsonData.users[i].login),
									className : "usersTable"
						}, userRow);
						dojo.create("td", {
							innerHTML : jsonData.users[i].name,
							className: "usersTable"
						}, userRow);
						var actions = dojo.create("td", {className: "usersTable"});
						var deleteAction = dojo.create("img", {
							src : "images/silk/cross.png",
							alt : "Delete",
							title : "Delete user " + jsonData.users[i].login,
							className: "usersTable"
						}, actions);
						dojo.connect(deleteAction, "onclick", dojo.hitch(this,
								function(login) {
									this.deleteUser(login);
								}, jsonData.users[i].login));
						dojo.place(actions, userRow);
						dojo.place(userRow, table);
					}

				}));
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
				var userList = this;
				this.registry.getService("IUsersService").then(function(service) {
				  service.deleteUser("/users/" + userName, dojo.hitch(userList, function(jsonData, secondArg) {
					  this.reloadUsers();
				  }));
				});
			}
		}
	};
	return UsersList;
}());