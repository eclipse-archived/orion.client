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
						className : "treetable"
					});
					var thead = dojo.create("thead");
					var titleRow = dojo.create("tr", {"class": "domCommandBackground"}, thead);

					dojo.create("td", {
						innerHTML : "<h2>Login</h2>",
						className : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "<h2>Actions</h2>",
						className : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "<h2>Name</h2>",
						className : "usersTable"
					}, titleRow);
					dojo.create("td", {
						innerHTML : "<h2>Last Login</h2>",
						className : "usersTable"
					}, titleRow);


					dojo.place(thead, table);
					dojo.place(table, this.parent);
					
					var tbody = dojo.create("tbody", null, table);

					for ( var i in jsonData.users) {
						var userRow = dojo.create("tr", {"class": i%2==0 ? "treeTableRow lightTreeTableRow" : "treeTableRow darkTreeTableRow"});
						dojo.connect(userRow, "onmouseover", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="";}, i));
						dojo.connect(userRow, "onmouseout", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="hidden";}, i));
						dojo.create("td", {
							innerHTML : this
									.getUserTab(jsonData.users[i].login),
									className : "usersTable"
						}, userRow);
						var actionsTd = dojo.create("td", {className: "usersTable secondaryColumn"});
						var actions = dojo.create("span",{id: "usersActions"+i, style: "visibility: hidden"}, actionsTd);
						var deleteAction = dojo.create("img", {
							id: "deleteAction"+i,
							src : "images/silk/cross.png",
							alt : "Delete",
							title : "Delete user " + jsonData.users[i].login,
							className: "commandImage"
						}, actions);
						dojo.style(deleteAction, "opacity", "0.4");
						dojo.connect(deleteAction, "onmouseover", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "1");}, i));
						dojo.connect(deleteAction, "onmouseout", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "0.4");}, i));
						dojo.connect(deleteAction, "onclick", dojo.hitch(this,
								function(login) {
									this.deleteUser(login);
								}, jsonData.users[i].login));
						dojo.place(actionsTd, userRow);
						dojo.create("td", {
							innerHTML : jsonData.users[i].Name ? jsonData.users[i].Name : '&nbsp;',
							className: "usersTable secondaryColumn"
						}, userRow);
						dojo.create("td", {
							innerHTML : jsonData.users[i].LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(jsonData.users[i].LastLogInTimestamp)), {formatLength: "short"}) : '&nbsp;',
							className: "usersTable secondaryColumn"
						}, userRow);
						dojo.place(userRow, tbody);
					}

				}));
			});
			

		},
		getUserTab : function(userName) {
			return tab = "<a class=\"navlinkonpage\" href=\"/user-profile.html#/users/" + userName
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