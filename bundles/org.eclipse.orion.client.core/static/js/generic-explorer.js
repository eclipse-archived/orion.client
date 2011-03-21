/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

var eclipse = eclipse || {};
eclipse.GenericExplorer = (function() {
	/**
	 * @name eclipse.GenericExplorer
	 * @class A table-based explorer component.
	 * 
	 * @param serviceRegistry
	 * @param parentId id of parent dom element
	 * @param renderer
	 */
	function GenericExplorer(serviceRegistry, renderer) {
		this.registry = serviceRegistry;
		this.renderer = renderer;
		this.myTree = null;
	}
	GenericExplorer.prototype = /** @lends eclipse.GenericExplorer.prototype */ {
		
		// we have changed an item on the server at the specified parent node
		changedItem: function(parent, children) {
			dojo.hitch(this.myTree, this.myTree.refreshAndExpand)(parent, children);
		},
		updateCommands: function(item){
			// update the commands in the tree if the tree exists.
			if (this.myTree) {
				dojo.hitch(this.myTree._renderer, this.myTree._renderer.updateCommands(item));
			}
		},
		
		/**
		 * Displays tree table containing filled with data provided by given model
		 * 
		 * @param parentId id of parent dom element
		 * @param model providing data to display
		 */
		createTree: function (parentId, model){
			var treeId = parentId + "innerTree";
			var existing = dojo.byId(treeId);
			if (existing) {
				dojo.destroy(existing);
			}
			if(model){
				model.rootId = treeId;
			}
			dojo.empty(parentId);
			this.model = model;
			this.myTree = new eclipse.TableTree({
				id: treeId,
				model: model,
				showRoot: false,
				parent: parentId,
				labelColumnIndex: this.checkbox ? 1 : 0,  // 0 if no checkboxes
				renderer: this.renderer
			});
		},
	    
	    _lastHash: null,
	    checkbox: this.checkbox || true
	};
	return GenericExplorer;
}());

eclipse = eclipse || {};
eclipse.SimpleTreeTableModel = (function() {
	/**
	 * @name eclipse.SimpleTreeTableModel
	 * @class Simple tree model using Children and ChildrenLocation attributes to fetch children
	 * and calculating id based on Location attribute.
	 */
	function SimpleTreeTableModel(rootPath, /* function returning promise */fetchItems) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
	}
	SimpleTreeTableModel.prototype = {
		destroy: function(){
		},
		getRoot: function(onItem){
			this.fetchItems(this.rootPath).then(
					dojo.hitch(this, function(item){
						this.root = item;
						onItem(item);
					})
					);
		},
		getChildren: function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
			// the parent already has the children fetched
			if (parentItem.Children) {
				onComplete(parentItem.Children);
			} else if (parentItem.ChildrenLocation) {
				this.fetchItems(parentItem.ChildrenLocation).then( 
					dojo.hitch(this, function(Children) {
						parentItem.Children = Children;
						onComplete(Children);
					})
				);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var result;
			if (item === this.root) {
				result = this.rootId;
			} else {
				result = item.Location;
				// remove all non valid chars to make a dom id. 
				result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
			} 
			return result;
		}
	};
	return SimpleTreeTableModel;
}());

/********* Rendering json items into columns in the tree **************/
eclipse = eclipse || {};
eclipse.GenericTableRenderer = (function() {
	function GenericTableRenderer (options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	GenericTableRenderer.prototype = {
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			
			dojo.addClass(tableNode, 'treetable');
			this.renderTableHeader(tableNode);

		},
		getActionsColumn: function(item, tableRow){
			dojo.connect(tableRow, "onmouseover", tableRow, function() {
				var actionsColumn = dojo.byId(this.id+"actionswrapper");
				dojo.style(actionsColumn, "visibility", "visible");
			});
			dojo.connect(tableRow, "onmouseout", tableRow, function() {
				var actionsColumn = dojo.byId(this.id+"actionswrapper");
				dojo.style(actionsColumn, "visibility", "hidden");
			});
			
			var actionsColumn = document.createElement('td');
			actionsColumn.id = tableRow.id + "actions";
			
			var actionsWrapper = document.createElement('span');
			actionsWrapper.id = tableRow.id + "actionswrapper";
			actionsColumn.appendChild(actionsWrapper);
			dojo.style(actionsWrapper, "visibility", "hidden");
			// contact the command service to render appropriate commands here.
			this.explorer.registry.getService("ICommandService").then(function(service) {
				service.renderCommands(actionsWrapper, "object", item, this.explorer, "image");
			});
			return actionsColumn;
		},
		initCheckboxColumn: function(tableNode){
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				return th;
			}
		},
		getCheckboxColumn: function(item, tableRow){
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td');
				var check = document.createElement('input');
				check.type = "checkbox";
				check.id = tableRow+"selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				
				
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
					this.explorer.registry.getService("ISelectionService").then(dojo.hitch(this, function(service) {
						service._setSelection(this.getSelected());
					}));				
				}));
				return checkColumn;
			}
		},
		getExpandImage: function(tableRow, placeHolder){
			var expandImg = dojo.create("img", {src: "/images/collapsed-gray.png", name: tableRow.id + "__expand"}, placeHolder, "last");
			dojo.create("img", {src: "/images/fldr_obj.gif"}, placeHolder, "last");
			expandImg.onclick = dojo.hitch(this, function(evt) {
				this.tableTree.toggle(tableRow.id, tableRow.id + "__expand", '/images/expanded-gray.png', '/images/collapsed-gray.png');
			});
			return expandImg;
		},
		render: function(item, tableRow){
			tableRow.cellSpacing = "8px";
			this.renderRow(item, tableRow);
		},
		
		getSelected: function() {
			var selected = [];
			dojo.query(".selectionCheckmark").forEach(dojo.hitch(this, function(node) {
				if (node.checked) {
					var row = node.parentNode.parentNode;
					selected.push(this.tableTree.getItem(row));
				}
			}));
			return selected;
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
			// update the selections so that any checked rows that may no longer be around are not
			// remembered.  This is a temporary solution, 
			// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=339450
			this.explorer.registry.getService("ISelectionService").then(dojo.hitch(this,
				function(selService) {
					selService._setSelection(this.getSelected());
				}));
		},
		updateCommands: function(){
			var registry = this.explorer.registry;
			dojo.query(".treeTableRow").forEach(function(node, i) {
				
				var actionsWrapperId = node.id + "actionswrapper";
				var actionsWrapper = dojo.byId(actionsWrapperId);
				
				dojo.empty(actionsWrapper);
				// contact the command service to render appropriate commands here.
				registry.getService("ICommandService").then(function(service) {
					service.renderCommands(actionsWrapper, "object", node._item, this.explorer, "image");
				});

			});
		},
		
		_init: function(options) {
			if (options) {
				this._useCheckboxSelection = options.checkbox === undefined ? false : options.checkbox;
				this._colums = options.colums === undefined ? [] : options.colums;
			}
		}
	};
	return GenericTableRenderer;
}());

/**
 * @name eclipse.SimpleTreeTableRenderer
 * @class Sample renderer that allows you to render a standard tree table.
 * Override {@link eclipse.SimpleTreeTableRenderer#getCellHeaderElement}  and
 * {@link eclipse.SimpleTreeTableRenderer#getCellElement} to generate table content.
 */
eclipse.SimpleTreeTableRenderer = (function(){
	function SimpleTreeTableRenderer(options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	SimpleTreeTableRenderer.prototype = eclipse.GenericTableRenderer.prototype;
	
	SimpleTreeTableRenderer.prototype.renderTableHeader = function(tableNode){
		var thead = document.createElement('thead');
		var row = document.createElement('tr');
		dojo.addClass(thead, "navTableHeading");
		var th, actions, size;
		
		row.appendChild(this.initCheckboxColumn(tableNode));
		
		var i = 0;
		var cell = this.getCellHeaderElement(i);
		while(cell){
			dojo.addClass(cell, "navColumn");
			row.appendChild(cell);
			
			cell = this.getCellHeaderElement(++i);
		}
		thead.appendChild(row);
		tableNode.appendChild(thead);
		
	};
	
	SimpleTreeTableRenderer.prototype.renderRow = function(item, tableRow) {
		dojo.style(tableRow, "verticalAlign", "baseline");
		dojo.addClass(tableRow, "treeTableRow");

		var checkColumn = this.getCheckboxColumn(item, tableRow);
		if(checkColumn)
			tableRow.appendChild(checkColumn);

		var i = 0;
		var cell = this.getCellElement(i, item, tableRow);
		while(cell){
			tableRow.appendChild(cell);
			dojo.addClass(cell, 'secondaryColumn');
			
			cell = this.getCellElement(++i, item, tableRow);
		}
		
	};
	
	/**
	 * Override to return a dom element containing table header, preferably <code>th</code>
	 * @param col_no number of column
	 */
	SimpleTreeTableRenderer.prototype.getCellHeaderElement = function(col_no){};



	/**
	 * Override to return a dom element containing table cell, preferable <code>td</td>
	 * @param col_no number of column
	 * @param item item to be rendered
	 * @param tableRow the current table row
	 */
	SimpleTreeTableRenderer.prototype.getCellElement = function(col_no, item, tableRow){};
	
	return SimpleTreeTableRenderer;
}());

