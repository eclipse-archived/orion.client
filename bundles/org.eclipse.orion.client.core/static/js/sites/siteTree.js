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
	function SiteTreeModel(siteService) {
		this._siteService = siteService;
		this._root = {};
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
			} else {
				return onComplete([]);
			}
		},
		getId: function(/**dojo.data.Item*/ item) {
			return item === this._root ? "[root]" : item.Id;
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
			var thead = dojo.create("thead", {innerHTML: "<tr><th>Name</th><th>Actions</th></tr>"});
			tableNode.appendChild(thead);
		},
		render: function(item, tableRow) {
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.style(tableRow, "border-spacing", "8px");
			dojo.addClass(tableRow, "treeTableRow");
			
			var col1 = dojo.create("td", {id: tableRow.id + "col1"});
			var col2 = dojo.create("td", {id: tableRow.id + "col2"});
			
			// Create column contents
			dojo.place(document.createTextNode(item.Name), col1, "first");
			
			var actionsWrapper = dojo.create("span",
				{ id: tableRow.id + "actionswrapper",
				  style: {visibility: "hidden"}
				}, col2, "only");
			dojo.connect(tableRow, "onmouseover", tableRow, function() {
				dojo.style(actionsWrapper, "visibility", "visible");
			});
			dojo.connect(tableRow, "onmouseout", tableRow, function() {
				dojo.style(actionsWrapper, "visibility", "hidden");
			});
			
			// contact the command service to render appropriate commands here.
			this._commandService.renderCommands(actionsWrapper, "object", item, {} /*??*/, "image");
			
			dojo.place(col1, tableRow, "last");
			dojo.place(col2, tableRow, "last");
		},
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				var color = i % 2 ? "FFFFFF" : "EFEFEF";
				dojo.style(node, "backgroundColor", color);
			});
		},
		labelColumnIndex: 0
	};
	return SiteRenderer;
}());
