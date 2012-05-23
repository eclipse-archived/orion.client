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

define(['i18n!profile/nls/messages', 'require', 'dojo', 'orion/explorer', 'orion/profile/usersUtil'], function(messages, require, dojo, mExplorer, mUsersUtil) {


var eclipse = eclipse || {};

eclipse.UsersList = (function(){
	
	function UsersList(serviceRegistry, selection, searcher, parentId, toolbarId, selectionToolsId, actionScopeId) {
		this.registry = serviceRegistry;
		this.selection = selection;
		this.searcher = searcher;
		this.parentId = parentId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.actionScopeId = actionScopeId;
		this.model = null;
		this.myTree = null;
		this.renderer = new eclipse.UsersRenderer({actionScopeId: this.actionScopeId, checkbox: this.checkbox, cachePrefix: "UsersNavigator"}, this); //$NON-NLS-0$
	};
	UsersList.prototype = new mExplorer.Explorer();
	
	UsersList.prototype.loadUsers = function(){
		var parent = dojo.byId(this.parentId);

		// Progress indicator
		var progress = dojo.byId("progress");  //$NON-NLS-0$
		if(!progress){
			progress = dojo.create("div", {id: "progress"}, parent, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
		dojo.empty(progress);
		b = dojo.create("b"); //$NON-NLS-0$
		dojo.place(document.createTextNode(messages["Loading users..."]), progress, "last"); //$NON-NLS-1$

		mUsersUtil.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, {});
					
		var service = this.registry.getService("orion.core.user"); //$NON-NLS-0$
		this.createTree(this.parentId, new mExplorer.ExplorerFlatModel("/users", service.getUsersList)); //$NON-NLS-0$
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
			return dojo.create("th", {innerHTML: "<h2>"+messages["Login"]+"</h2>"}); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 1:
			return dojo.create("th", {innerHTML: "<h2>"+messages["Actions"]+"</h2>"}); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 2:
			return dojo.create("th", {innerHTML: "<h2>"+messages["Name"]+"</h2>"}); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 3:
			return dojo.create("th", {innerHTML: "<h2>"+messages["Last Login"]+"</h2>"}); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			break;
		};
		
	};
	
	UsersRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			
			var col, div, link;

			col = document.createElement('td'); //$NON-NLS-0$
			div = dojo.create("div", {style: "padding-left: 5px; padding-right: 5px; ; padding-top: 5px; padding-bottom: 5px"}, col, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			link = dojo.create("a", {className: "navlinkonpage", href: require.toUrl("profile/user-profile.html") +"#" + item.Location}, div, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(item.login), link, "only");			 //$NON-NLS-0$
			return col;
			break;
		case 1:
			return this.getActionsColumn(item, tableRow);
			break;
		case 2:
			return dojo.create("td", {innerHTML: item.Name ? item.Name : "&nbsp;"}); //$NON-NLS-1$ //$NON-NLS-0$
			break;
		case 3:
			return dojo.create("td", {innerHTML: item.LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(item.LastLogInTimestamp)), {formatLength: "short"}) : '&nbsp;'}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
			var service = this.registry.getService("orion.core.user"); //$NON-NLS-0$
			service.getUsersList(dojo.hitch(userList, function(jsonData, secondArg) {
				var table = dojo.create("table", { //$NON-NLS-0$
					className : "treetable" //$NON-NLS-0$
				});
				var thead = dojo.create("thead"); //$NON-NLS-0$
				var titleRow = dojo.create("tr", {"class": "domCommandBackground"}, thead); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

				dojo.create("td", { //$NON-NLS-0$
					innerHTML : "<h2>"+messages['Login']+"</h2>", //$NON-NLS-2$ //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				dojo.create("td", { //$NON-NLS-0$
					innerHTML : "<h2>"+messages['Actions']+"</h2>", //$NON-NLS-2$ //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				dojo.create("td", { //$NON-NLS-0$
					innerHTML : "<h2>"+messages['Name']+"</h2>", //$NON-NLS-2$ //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				dojo.create("td", { //$NON-NLS-0$
					innerHTML : "<h2>"+messages['Last Login']+"</h2>", //$NON-NLS-2$ //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);


				dojo.place(thead, table);
				dojo.place(table, this.parent);
				
				var tbody = dojo.create("tbody", null, table); //$NON-NLS-0$

				for ( var i in jsonData.users) {
					var userRow = dojo.create("tr", {"class": i%2==0 ? "treeTableRow lightTreeTableRow" : "treeTableRow darkTreeTableRow"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(userRow, "onmouseover", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="";}, i)); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(userRow, "onmouseout", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="hidden";}, i)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.create("td", { //$NON-NLS-0$
						innerHTML : this
								.getUserTab(jsonData.users[i].login, jsonData.users[i].Location),
								className : "usersTable" //$NON-NLS-0$
					}, userRow);
					var actionsTd = dojo.create("td", {className: "usersTable secondaryColumn"}); //$NON-NLS-1$ //$NON-NLS-0$
					var actions = dojo.create("span",{id: "usersActions"+i, style: "visibility: hidden"}, actionsTd); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					var deleteAction = dojo.create("img", { //$NON-NLS-0$
						id: "deleteAction"+i, //$NON-NLS-0$
						src : require.toUrl("images/delete.gif"), //$NON-NLS-0$
						alt : messages["Delete"],
						title : messages["Delete user "] + jsonData.users[i].login,
						className: "commandImage" //$NON-NLS-0$
					}, actions);
					dojo.style(deleteAction, "opacity", "0.4"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(deleteAction, "onmouseover", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "1");}, i)); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(deleteAction, "onmouseout", dojo.hitch(this, function(i){dojo.style(dojo.byId("deleteAction"+i), "opacity", "0.4");}, i)); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(deleteAction, "onclick", dojo.hitch(this, //$NON-NLS-0$
							function(login, location) {
								this.deleteUser(login, location);
							}, jsonData.users[i].login, jsonData.users[i].Location));
					dojo.place(actionsTd, userRow);
					dojo.create("td", { //$NON-NLS-0$
						innerHTML : jsonData.users[i].Name ? jsonData.users[i].Name : '&nbsp;', //$NON-NLS-0$
						className: "usersTable secondaryColumn" //$NON-NLS-0$
					}, userRow);
					dojo.create("td", { //$NON-NLS-0$
						innerHTML : jsonData.users[i].LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(jsonData.users[i].LastLogInTimestamp)), {formatLength: "short"}) : '&nbsp;', //$NON-NLS-1$ //$NON-NLS-0$
						className: "usersTable secondaryColumn" //$NON-NLS-0$
					}, userRow);
					dojo.place(userRow, tbody);
				}
			}));
		},
		getUserTab : function(userName, userLocation) {
			return tab = "<a class=\"navlinkonpage\" href=\"" + require.toUrl("profile/user-profile.html") + "#" + userLocation //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					+ "\">" + userName + "</a>"; //$NON-NLS-1$ //$NON-NLS-0$
		},
		reloadUsers : function() {
			dojo.html._emptyNode(this.parent);
			this.loadUsers();
		},
		deleteUser : function(userName, userLocation) {
			if (confirm(dojo.string.substitute(messages["Do you want to delete user ${0}?"], [userName]))) {
				this.registry.getService("orion.core.user").deleteUser(userLocation, dojo.hitch(this, function(jsonData, secondArg) { //$NON-NLS-0$
					this.reloadUsers();
				}));
			}
		}
	};
	return UsersList;
}());

return eclipse;	
});