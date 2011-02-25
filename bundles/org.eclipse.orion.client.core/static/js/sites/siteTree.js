/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true handleGetAuthenticationError handlePostAuthenticationError
  handleDeleteAuthenticationError */
/*jslint browser:true devel:true*/

var sites = dojo.getObject("eclipse.sites", true);

sites.SiteTreeModel = (function() {
	/**
	 * @name eclipse.sites.SiteTreeModel
	 * @class Tree model for powering a tree of site configurations.
	 * @see eclipse.TableTree
	 * @param siteService
	 */
	function SiteTreeModel(siteService, id) {
		this._siteService = siteService;
		this._root = {};
		this._id = id;
	}
	SiteTreeModel.prototype = {
		getRoot: function(/**function*/ onItem) {
			onItem(this._root);
		},
		getChildren: function(/**dojo.data.Item*/ parentItem, /**function(items)*/ onComplete) {
			if (parentItem.children) {
				// The parent already has the children fetched
				onComplete(parentItem.children);
			} else if (parentItem === this._root) {
				this._siteService.getSiteConfigurations().then(
					function(/**Array*/ siteConfigurations) {
						parentItem.children = siteConfigurations;
						onComplete(siteConfigurations);
					});
			} else if (parentItem.Id) {
//				// A site configuration
//				//Id Location Mappings Name Workspace HostingStatus
//				var result = [];
//				result.push({ Id: parentItem.Id});
//				result.push({ Location: parentItem.Location});
//				onComplete(result);
			} else {
				return onComplete([]);
			}
		},
		getId: function(/**dojo.data.Item|String*/ item) {
			return (item === this._root || item === this._id) ? this._id : item.Id;
		}
	};
	return SiteTreeModel;
}());

sites.SiteRenderer = (function() {
	/**
	 * @name eclipse.sites.SiteRenderer
	 * @class A renderer for the site configuration tree.
	 */
	function SiteRenderer (commandService) {
		this._commandService = commandService;
	}
	SiteRenderer.prototype = {
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			
			dojo.addClass(tableNode, 'treetable');
			var thead = dojo.create("thead", null);
			dojo.create("th", {innerHTML: ""}, thead, "last");
			dojo.create("th", {innerHTML: "Status"}, thead, "last");
			dojo.create("th", {innerHTML: "Actions"}, thead, "last");
			tableNode.appendChild(thead);
		},
		render: function(item, tableRow) {
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.addClass(tableRow, "treeTableRow");
			
			var siteConfigCol = dojo.create("td", {id: tableRow.id + "col1"});
			var statusCol = dojo.create("td", {id: tableRow.id + "col2"});
			var actionCol = dojo.create("td", {id: tableRow.id + "col3"});
			
			// Site config column
			var nameTag = dojo.create("b", null, siteConfigCol, "last");
			dojo.place(document.createTextNode(item.Name), nameTag, "last");
			var detailsDiv = dojo.create("div", null, siteConfigCol, "last");
			dojo.addClass(detailsDiv, "siteConfigDetails");
			dojo.place(document.createTextNode("Id:" + item.Id), detailsDiv, "last");
			dojo.create("br", null, detailsDiv, "last");
			dojo.place(document.createTextNode("Mappings:" + item.Mappings), detailsDiv, "last");
			dojo.create("br", null, detailsDiv, "last");
			dojo.place(document.createTextNode("Workspace:" + item.Workspace), detailsDiv, "last");
			
			// Status column
			var status = item.HostingStatus;
			if (typeof status === "object") {
				if (status.Status === "started") {
					dojo.place(document.createTextNode("Started at "), statusCol, "last");
					var link = dojo.create("a", null, statusCol, "last");
					dojo.place(document.createTextNode(status.URL), link, "only");
					link.href = status.URL;
				} else {
					var statusString = status.Status.substring(0,1).toUpperCase() + status.Status.substring(1);
					dojo.place(document.createTextNode(statusString), statusCol, "only");
				}
			} else {
				dojo.place(document.createTextNode("Unknown"), statusCol, "only");
			}
			
			// Action column
			var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper",
					style: {visibility: "hidden"}}, actionCol, "only");
			dojo.connect(tableRow, "onmouseover", tableRow, function() {
				dojo.style(actionsWrapper, "visibility", "visible");
			});
			dojo.connect(tableRow, "onmouseout", tableRow, function() {
				dojo.style(actionsWrapper, "visibility", "hidden");
			});
			
			// contact the command service to render appropriate commands here.
			this._commandService.renderCommands(actionsWrapper, "object", item, {} /*??*/, "image");
			
			dojo.place(siteConfigCol, tableRow, "last");
			dojo.place(statusCol, tableRow, "last");
			dojo.place(actionCol, tableRow, "last");
		},
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				if (i % 2) {
					dojo.addClass(node, "darkTreeTableRow");
					dojo.removeClass(node, "lightTreeTableRow");
				} else {
					dojo.addClass(node, "lightTreeTableRow");
					dojo.removeClass(node, "darkTreeTableRow");
				}
			});
		},
		labelColumnIndex: 0
	};
	return SiteRenderer;
}());
