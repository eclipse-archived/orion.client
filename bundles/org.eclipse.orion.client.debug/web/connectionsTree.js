/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:-
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define*/
/*jslint browser:true*/

define(['require', 'dojo'], function(require, dojo) {

	var orion = {};
	orion.debug = {};

	orion.debug.DebugConnectionTreeModel = (function() {
		function DebugConnectionTreeModel(/**String*/ id) {
			this._id = id;
			this._root = [];
		}
		DebugConnectionTreeModel.prototype = /** @lends orion.debug.DebugConnectionTreeModel.prototype */{
			addConnection: function(connection) {
				/* first check for a duplicate */
				var port = connection.getPort();
				for (var i = 0; i < this._root.length; i++) {
					var current = this._root[i];
					if (current.getPort() === port) {
						return false;
					}
				}
				this._root.push(connection);
				return true;
			},
			getRoot: function(/**function*/ onItem) {
				onItem(this);
			},
			getChildren: function(/**dojo.data.Item*/ parentItem, /**Function(items)*/ onComplete) {
				onComplete(parentItem === this ? this._root : parentItem.getChildren());
			},
			getId: function(/**dojo.data.Item|String*/ item) {
				return (item === this || item === this._id) ? this._id : item.toString();
			},
			removeConnection: function(connection) {
				for (var i = 0; i < this._root.length; i++) {
					var current = this._root[i];
					if (current === connection) {
						this._root.splice(i, 1);
						return;
					}
				}
			}
		};
		return DebugConnectionTreeModel;
	}());

	orion.debug.DebugConnectionRenderer = (function() {
		function DebugConnectionRenderer(commandService) {
			this._commandService = commandService;
		}
		DebugConnectionRenderer.prototype = /** @lends orion.debug.DebugConnectionRenderer.prototype */{
			initTable: function(tableNode, tableTree) {
				this.tableTree = tableTree;
				dojo.addClass(tableNode, "treetable");
			},
			render: function(item, tableRow) {
				dojo.style(tableRow, "verticalAlign", "baseline");
				dojo.addClass(tableRow, "treeTableRow");
				var labelColumn = dojo.create("td", {id: tableRow.id + "col1"});
				var actionColumn = dojo.create("td", {id: tableRow.id + "col2"});
				item.renderLabel(labelColumn);
				if (item.shouldDisplayActions()) {
					var actionsWrapper = dojo.create(
						"span",
						{id: tableRow.id + "actionswrapper", style: {visibility: "hidden"}},
						actionColumn,
						"only");
					dojo.connect(tableRow, "onmouseover", tableRow, function() {
						dojo.style(actionsWrapper, "visibility", "visible");
					});
					dojo.connect(tableRow, "onmouseout", tableRow, function() {
						dojo.style(actionsWrapper, "visibility", "hidden");
					});
					this._commandService.renderCommands(actionsWrapper, "object", item, {}, "tool");	
				}
				dojo.place(labelColumn, tableRow, "last");
				dojo.place(actionColumn, tableRow, "last");
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

	return orion.debug;
});
