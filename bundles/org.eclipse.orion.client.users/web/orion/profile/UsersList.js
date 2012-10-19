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
 
 /*jslint browser:true devel:true sub:true*/
 /*global define window*/

define(['i18n!profile/nls/messages', 'require', 'dojo', 'orion/explorers/explorer', 'orion/profile/usersUtil', 'orion/explorers/navigationUtils', 'dojo/date/locale'], function(messages, require, dojo, mExplorer, mUsersUtil, mNavUtils) {


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
		this.renderer = new eclipse.UsersRenderer({actionScopeId: this.actionScopeId, checkbox: false, cachePrefix: "UsersNavigator"}, this); //$NON-NLS-0$
	}
	
	UsersList.prototype = new mExplorer.Explorer();
	
	UsersList.prototype.queryObject = { start: 0, rows:100, length: 0};
	
	UsersList.prototype.calculateQuery = function(locationHash, queryObj) {
		var startQuery = locationHash.indexOf("?"); //$NON-NLS-0$
		if (startQuery !== -1) {
			var queryStr = locationHash.substring(startQuery + 1);
			var splitQ = queryStr.split("&"); //$NON-NLS-0$
			for(var i=0; i < splitQ.length; i++){
				var splitparameters = splitQ[i].split("="); //$NON-NLS-0$
				if(splitparameters.length === 2){
					if(splitparameters[0] === "rows"){  //$NON-NLS-0$
						queryObj.rows = parseInt(splitparameters[1], 10);
					} else if(splitparameters[0] === "start"){ //$NON-NLS-0$
						queryObj.start = parseInt(splitparameters[1], 10);
					}
				}
			}
		}
	};

	UsersList.prototype.createModel = function() {
		var parent = dojo.byId(this.parentId);
		var queryObj = UsersList.prototype.queryObject;

		// Progress indicator
		var progress = dojo.byId("progress");  //$NON-NLS-0$
		if(!progress){
			progress = dojo.create("div", {id: "progress"}, parent, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
		dojo.empty(progress);
		dojo.create("b"); //$NON-NLS-0$
		dojo.place(document.createTextNode(messages["Loading users..."]), progress, "last"); //$NON-NLS-0$
		
		var service = this.registry.getService("orion.core.user"); //$NON-NLS-0$
		UsersList.prototype.registry = this.registry;
		
		var locationHash = window.location.hash;
		UsersList.prototype.calculateQuery(locationHash, queryObj);
		var flatModel = new mExplorer.ExplorerFlatModel("../users", UsersList.prototype.getUsersListSubset.bind(this)); //$NON-NLS-0$
		flatModel.service = service;
		flatModel.queryObject = queryObj;
		this.queryObject = queryObj;
		this.createTree(this.parentId, flatModel, {setFocus: true}); //$NON-NLS-0$
		mUsersUtil.updateNavTools(this.registry, this, this.toolbarId, this.selectionToolsId, {});
	};
	
	UsersList.prototype.loadUsers = function(refreshTree){
		var that = this;
		var queryObj = UsersList.prototype.queryObject;
		var locationHash = window.location.hash;
		UsersList.prototype.calculateQuery(locationHash, queryObj);
		if (refreshTree) {
			UsersList.prototype.getUsersListSubset().then( function(newChildren) {
				that.myTree.refresh("userslist", newChildren); //$NON-NLS-0$
				mUsersUtil.updateNavTools(that.registry, that, that.toolbarId, that.selectionToolsId, {});
			}.bind(this));
		}
	};
	
	UsersList.prototype.reloadUsers = function() {
		this.loadUsers(true);
	};

	UsersList.prototype.getUsersListSubset = function(root) {
	    var aService;
	    if (this.service) {
	        aService = this.service;
	    } else {
	        aService = this.registry.getService("orion.core.user"); //$NON-NLS-0$
	    }
		return aService.getUsersListSubset(this.queryObject.start, this.queryObject.rows).then(
			function(result) {
				this.queryObject.start = parseInt(result.users_start, 10);
				this.queryObject.rows = parseInt(result.users_rows, 10);
				this.queryObject.length = parseInt(result.users_length, 10);
				return result.users;
			}.bind(this));
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
		var col = dojo.create("th"); //$NON-NLS-0$
		var h2 = dojo.create("h2", null, col); //$NON-NLS-0$
		switch(col_no){
		case 0: 
			h2.textContent = messages["Login"];
			return col;
		case 1:
			h2.textContent = messages["Actions"];
			return col;
		case 2:
			h2.textContent = messages["Name"];
			return col;
		case 3:
			h2.textContent = messages["Last Login"];
			return col;
		}
	};
	
	UsersRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var td;
		switch(col_no){
		case 0:
			
			var col, div, link;

			col = document.createElement('td'); //$NON-NLS-0$
			div = dojo.create("div", {style: "padding-left: 5px; padding-right: 5px; ; padding-top: 5px; padding-bottom: 5px"}, col, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			link = dojo.create("a", {className: "navlinkonpage", href: require.toUrl("profile/user-profile.html") +"#" + item.Location}, div, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(item.login), link, "only");			 //$NON-NLS-0$
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
			return col;
		case 1:
			return this.getActionsColumn(item, tableRow, null, null, true);
		case 2:
			td = dojo.create("td"); //$NON-NLS-0$
			td.textContent = item.Name ? item.Name : " "; //$NON-NLS-0$
			return td;
		case 3:
			td = dojo.create("td"); //$NON-NLS-0$
			td.textContent = item.LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(item.LastLogInTimestamp, 10)), {formatLength: "short"}) : '\u00a0'; //$NON-NLS-1$ //$NON-NLS-0$
			return td;
		}
		
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

				var loginTd = dojo.create("td", { //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				var loginH2 = dojo.create("h2", null, loginTd); //$NON-NLS-0$
				loginH2.textContent = messages['Login'];

				var actionsTd = dojo.create("td", { //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				var actionsH2 = dojo.create("h2", null, actionsTd); //$NON-NLS-0$
				actionsH2.textContent = messages['Actions'];

				var nameTd = dojo.create("td", { //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				var nameH2 = dojo.create("h2", null, nameTd); //$NON-NLS-0$
				nameH2.textContent = messages['Name'];

				var lastLoginTd = dojo.create("td", { //$NON-NLS-0$
					className : "usersTable" //$NON-NLS-0$
				}, titleRow);
				var lastLoginH2 = dojo.create("h2", null, lastLoginTd); //$NON-NLS-0$
				lastLoginH2.textContent = messages['Last Login'];

				dojo.place(thead, table);
				dojo.place(table, this.parent);
				
				var tbody = dojo.create("tbody", null, table); //$NON-NLS-0$
				var userLoginCell, userNameCell;
				for ( var i in jsonData.users) {
					var userRow = dojo.create("tr", {"class": i%2===0 ? "treeTableRow lightTreeTableRow" : "treeTableRow darkTreeTableRow"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(userRow, "onmouseover", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="";}, i)); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.connect(userRow, "onmouseout", dojo.hitch(this, function(i){document.getElementById("usersActions"+i).style.visibility="hidden";}, i)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					userLoginCell = dojo.create("td", { //$NON-NLS-0$
						className : "usersTable"
					}, userRow); //$NON-NLS-1$
					dojo.place(this.getUserTab(jsonData.users[i].login, jsonData.users[i].Location), userLoginCell);
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
					userNameCell = dojo.create("td", { //$NON-NLS-0$
						className: "usersTable secondaryColumn" //$NON-NLS-0$
					}, userRow);
					userNameCell.textContent = jsonData.users[i].Name ? jsonData.users[i].Name : ' '; //$NON-NLS-0$
					var lastLoginCell = dojo.create("td", { //$NON-NLS-0$
						className: "usersTable secondaryColumn" //$NON-NLS-0$
					}, userRow);
					lastLoginCell.textContent = jsonData.users[i].LastLogInTimestamp ? dojo.date.locale.format(new Date(parseInt(jsonData.users[i].LastLogInTimestamp, 10)), {formatLength: "short"}) : '\u00a0'; //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(userRow, tbody);
				}
			}));
		},
		getUserTab : function(userName, userLocation) {
			var a = dojo.create("a", {className: "navlinkonpage", href: require.toUrl("profile/user-profile.html") + "#" + userLocation}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			a.textContent = userName;
			return a;
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
