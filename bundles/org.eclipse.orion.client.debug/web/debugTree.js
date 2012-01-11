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

/*global dojo eclipse:true */
/*jslint browser:true devel:true*/

define(['dojo'], function(dojo) {

	var eclipse = {};
	eclipse.debug = {};
	
	eclipse.debug.DebugConnectionTreeModel = (function() {
		function DebugConnectionTreeModel(/**String*/ id) {
			this._id = id;
			this._root = [];
		}
		DebugConnectionTreeModel.prototype = /** @lends eclipse.debug.DebugConnectionTreeModel.prototype */{
			getRoot: function(/**function*/ onItem) {
				onItem(this._root);
			},
			getChildren: function(/**dojo.data.Item*/ parentItem, /**Function(items)*/ onComplete) {
				onComplete(parentItem === this._root ? this._root : []);
			},
			getId: function(/**dojo.data.Item|String*/ item) {
				return (item === this._root || item === this._id) ? this._id : item.Id;
			},
			setRoot: function(/**Array*/ value) {
				this._root = value;
			}
		};
		return DebugConnectionTreeModel;
	}());
	
	eclipse.debug.DebugConnectionRenderer = (function() {
		function DebugConnectionRenderer(commandService) {
			this._commandService = commandService;
		}
		DebugConnectionRenderer.prototype = /** @lends eclipse.debug.DebugConnectionRenderer.prototype */{
			initTable: function (tableNode, tableTree) {
				this.tableTree = tableTree;
				dojo.addClass(tableNode, "treetable");
				var header = dojo.create("thead", null);
				dojo.create("th", {innerHTML: "URL"}, header, "last");
				dojo.create("th", {innerHTML: "Status"}, header, "last");
				dojo.create("th", {innerHTML: "Actions"}, header, "last");
				tableNode.appendChild(header);
			},
			render: function(item, tableRow) {
				dojo.style(tableRow, "verticalAlign", "baseline");
				dojo.addClass(tableRow, "treeTableRow");
				var urlCol = dojo.create("td", {id: tableRow.id + "col1"});
				var stateCol = dojo.create("td", {id: tableRow.id + "col2"});
				var actionCol = dojo.create("td", {id: tableRow.id + "col3"});
				
				dojo.place(document.createTextNode(item.getUrl()), urlCol, "last");
				dojo.place(document.createTextNode(item.getState()), stateCol, "last");
				
				/* Action column */
				var actionsWrapper = dojo.create(
					"span",
					{id: tableRow.id + "actionswrapper", style: {visibility: "hidden"}},
					actionCol,
					"only");
				dojo.connect(tableRow, "onmouseover", tableRow, function() {
					dojo.style(actionsWrapper, "visibility", "visible");
				});
				dojo.connect(tableRow, "onmouseout", tableRow, function() {
					dojo.style(actionsWrapper, "visibility", "hidden");
				});
				this._commandService.renderCommands(actionsWrapper, "object", item, {}, "image");
				
				dojo.place(urlCol, tableRow, "last");
				dojo.place(stateCol, tableRow, "last");
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
		return DebugConnectionRenderer;
	}());
	
	return eclipse.debug;
});
