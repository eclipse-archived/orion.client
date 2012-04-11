/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define dojo */
/*jslint browser:true devel:true*/

define(['dojo', 'orion/siteUtils'], function(dojo, mSiteUtils) {

var exports = {};

exports.SiteTreeModel = (function() {
	/**
	 * @name orion.sites.SiteTreeModel
	 * @class Tree model for powering a tree of site configurations.
	 * @param {orion.sites.SiteService} siteService
	 * @see orion.treetable.TableTree
	 */
	function SiteTreeModel(siteService, id) {
		this._siteService = siteService;
		this._root = {};
		this._id = id;
	}
	SiteTreeModel.prototype = /** @lends orion.sites.SiteTreeModel.prototype */{
		getRoot: function(/**function*/ onItem) {
			onItem(this._root);
		},
		getChildren: function(/**dojo.data.Item*/ parentItem, /**Function(items)*/ onComplete) {
			if (parentItem.children) {
				// The parent already has the children fetched
				onComplete(parentItem.children);
			} else if (parentItem === this._root) {
				this._siteService.getSiteConfigurations().then(
					function(/**Array*/ siteConfigurations) {
						parentItem.children = siteConfigurations;
						onComplete(siteConfigurations);
					});
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

exports.SiteRenderer = (function() {
	/**
	 * @name orion.sites.SiteRenderer
	 * @class A renderer for the site configuration tree.
	 * @see orion.treetable.TableTree
	 * @param {orion.commands.CommandService} commandService
	 */
	function SiteRenderer (commandService) {
		this._commandService = commandService;
	}
	SiteRenderer.prototype = /** @lends orion.sites.SiteRenderer.prototype */{
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			
			dojo.addClass(tableNode, 'treetable');
			var thead = dojo.create("thead", null);
			dojo.create("th", {innerHTML: "Name"}, thead, "last");
			dojo.create("th", {innerHTML: "Status"}, thead, "last");
			dojo.create("th", {innerHTML: "URL", className: "urlCol"}, thead, "last");
			dojo.create("th", {innerHTML: "Actions"}, thead, "last");
			tableNode.appendChild(thead);
		},
		render: function(item, tableRow) {
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.addClass(tableRow, "treeTableRow");
			
			var siteConfigCol = dojo.create("td", {id: tableRow.id + "col1"});
			var statusCol = dojo.create("td", {id: tableRow.id + "col2"});
			var urlCol = dojo.create("td", {id: tableRow.id + "col3"});
			var actionCol = dojo.create("td", {id: tableRow.id + "col4"});
			
			// Site config column
			var href = mSiteUtils.generateEditSiteHref(item);
			var nameLink = dojo.create("a", {href: href}, siteConfigCol, "last");
			dojo.place(document.createTextNode(item.Name), nameLink, "last");
			
			// Status, URL columns
			var status = item.HostingStatus;
			if (typeof status === "object") {
				if (status.Status === "started") {
					dojo.place(document.createTextNode("Started"), statusCol, "last");
					var link = dojo.create("a", {className: "siteURL"}, urlCol, "last");
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
			var actionsWrapper = dojo.create("span", {id: tableRow.id + "actionswrapper"}, actionCol, "only");
			
			// contact the command service to render appropriate commands here.
			this._commandService.renderCommands("siteCommand", actionsWrapper, item, {} /*handler*/, "tool");
			
			dojo.place(siteConfigCol, tableRow, "last");
			dojo.place(statusCol, tableRow, "last");
			dojo.place(urlCol, tableRow, "last");
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

return exports;
});

