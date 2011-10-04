/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['require', 'dojo', 'orion/explorer', 'orion/profile/usersUtil'], function(require, dojo, mExplorer, mUsersUtil) {


var eclipse = eclipse || {};

eclipse.UsersList = (function(){
	
	function UsersList(serviceRegistry, selection, searcher, parentId, toolbarId, selectionToolsId) {
		this.registry = serviceRegistry;
		this.selection = selection;
		this.searcher = searcher;
		this.parentId = parentId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.model = null;
		this.myTree = null;
		this.renderer = new eclipse.UsersRenderer({checkbox: this.checkbox, cachePrefix: "UsersNavigator"}, this);
	};
	UsersList.prototype = new mExplorer.Explorer();
	
	UsersList.prototype.loadUsers = function(){
		var parent = dojo.byId(this.parentId);

		// Progress indicator
		var progress = dojo.byId("progress"); 
		if(!progress){
			progress = dojo.create("div", {id: "progress"}, parent, "only");
		}
		dojo.empty(progress);
		b = dojo.create("b");
		dojo.place(document.createTextNode("Loading users..."), progress, "last");
		
		self = this;
		
		mUsersUtil.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, {});
					
		this.registry.getService("orion.core.user").then(function(service){
			dojo.hitch(self, self.createTree(self.parentId, new mExplorer.ExplorerFlatModel("/users", service.getUsersList)));
		});
	};
	
	UsersList.prototype.reloadUsers = function() {
		dojo.empty(this.parentId);
		this.loadUsers();
	};
	
	return UsersList;
}());


eclipse.UsersRenderer = (function() {
	function UsersRenderer (options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	UsersRenderer.prototype = new mExplorer.SelectionRenderer();
	
	UsersRenderer.prototype.getCellHeaderElement = function(col_no){
		
		switch(col_no){
		case 0: 
			return dojo.create("th", {innerHTML: "<h2>Login</h2>"});
			break;
		case 1:
			return dojo.create("th", {innerHTML: "<h2>Actions</h2>"});
			break;
		case 2:
			return dojo.create("th", {innerHTML: "<h2>Name</h2>"});
			break;
		case 3:
			return dojo.create("th", {innerHTML: "<h2>Last Login</h2>"});
			break;
		};
		
	};
	
	UsersRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			
			var col, div, link;

			col = document.createElement('td');
			div = dojo.create("div", {style: "padding-left: 5px; padding-right: 5px; ; padding-top: 5px; padding-bottom: 5px"}, col, "only");
			link = dojo.create("a", {className: "navlinkonpage", href: require.toUrl("profile/user-profile.html") +"#" + item.Location}, div, "last");
			dojo.place(document.createTextNode(item.login), link, "only");			
			return col;
			break;
		case 1:
			return this.getActionsColumn(item, tableRow);
			break;
		case 2:
			return dojo.create("td", {innerHTML: item.Name ? item.Name : "&nbsp;"});
			break;
		case 3:
			return dojo.create("td", {innerHTML: item.LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(item.LastLogInTimestamp)), {formatLength: "short"}) : '&nbsp;'});
			break;
		};
		
	};
	
	return UsersRenderer;
}());



eclipse._UsersList = (function() {
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
			this.registry.getService("orion.core.user").then(function(service) {
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
									.getUserTab(jsonData.users[i].login, jsonData.users[i].Location),
									className : "usersTable"
						}, userRow);
						var actionsTd = dojo.create("td", {className: "usersTable secondaryColumn"});
						var actions = dojo.create("span",{id: "usersActions"+i, style: "visibility: hidden"}, actionsTd);
						var deleteAction = dojo.create("img", {
							id: "deleteAction"+i,
							src : require.toUrl("images/delete.gif"),
							alt : "Delete",
							title : "Delete user " + jsonData.users[i].login,
							className: "commandImage"
						}, actions);
						dojo.style(deleteAction, "opacity", "0.4");
						dojo.connect(deleteAction, "onmouseover", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "1");}, i));
						dojo.connect(deleteAction, "onmouseout", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "0.4");}, i));
						dojo.connect(deleteAction, "onclick", dojo.hitch(this,
								function(login, location) {
									this.deleteUser(login, location);
								}, jsonData.users[i].login, jsonData.users[i].Location));
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
		getUserTab : function(userName, userLocation) {
			return tab = "<a class=\"navlinkonpage\" href=\"" + require.toUrl("profile/user-profile.html") + "#" + userLocation
					+ "\">" + userName + "</a>";
		},
		reloadUsers : function() {
			dojo.html._emptyNode(this.parent);
			this.loadUsers();
		},
		deleteUser : function(userName, userLocation) {
			if (confirm("Do you want to delete user " + userName + "?")) {
				var userList = this;
				this.registry.getService("orion.core.user").then(function(service) {
				  service.deleteUser(userLocation, dojo.hitch(userList, function(jsonData, secondArg) {
					  this.reloadUsers();
				  }));
				});
			}
		}
	};
	return UsersList;
}());

return eclipse;	
});