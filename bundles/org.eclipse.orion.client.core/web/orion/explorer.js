/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window */
/*jslint regexp:false browser:true forin:true*/

define(['dojo', 'orion/treetable'], function(dojo, mTreeTable){

var exports = {};

exports.Explorer = (function() {
	/**
	 * Creates a new explorer.
	 *
	 * @name orion.explorer.Explorer
	 * @class A table-based explorer component.
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry The service registry to
	 * use for any services required by the explorer
	 * @param {orion.selection.Selection} selection The initial selection
	 * @param renderer
	 */
	function Explorer(serviceRegistry, selection, renderer) {
		this.registry = serviceRegistry;
		this.renderer = renderer;
		this.selection = selection;
		this.myTree = null;
	}
	Explorer.prototype = /** @lends orion.explorer.Explorer.prototype */ {
		
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
		
		makeNewItemPlaceHolder: function(item, domId, column_no) {
			// we want to popup the name prompt underneath the parent item.
			var refNode = this.getRow(item);
			var tempNode;
			if(column_no){
				refNode = refNode.childNodes[column_no];
				// make a row and empty column so that the new name appears after checkmarks/expansions
				dojo.place("<br><span id='"+domId+"placeHolderRow'></span>", refNode, "last");
				tempNode = dojo.byId(domId+"placeHolderRow");
				if (tempNode) {
					return {tempNode: tempNode, refNode: tempNode};
				}
			}
			if (refNode) {
				// make a row and empty column so that the new name appears after checkmarks/expansions
				dojo.place("<tr id='"+domId+"placeHolderRow'><td id='"+domId+"placeHolderCol'></td>", refNode, "after");
				tempNode = dojo.byId(domId+"placeHolderRow");
				refNode = dojo.byId(domId+"placeHolderCol");
				if (tempNode && refNode) {
					return {tempNode: tempNode, refNode: refNode};
				}
			}
			return null;
		},
		
		getRow: function(item) {
			var rowId = this.model.getId(item);
			if (rowId) {
				return dojo.byId(rowId);
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
			if (model){
				model.rootId = treeId;
			}
			this.model = model;
			this.myTree = new mTreeTable.TableTree({
				id: treeId,
				model: model,
				showRoot: false,
				parent: parentId,
				labelColumnIndex: this.checkbox ? 1 : 0,  // 0 if no checkboxes
				renderer: this.renderer
			});
			this.renderer._initializeUIState();
		},
		
		getRootPath: function() {
			if (this.model && this.model.root) {
				return this.model.root.Location;
			}
			return null;
		},
	    
	    _lastHash: null,
	    checkbox: this.checkbox || true
	};
	return Explorer;
}());

exports.ExplorerModel = (function() {
	/**
	 * Creates a new explorer model instance.
	 * @name orion.explorer.ExplorerModel
	 * @class Simple tree model using Children and ChildrenLocation attributes to fetch children
	 * and calculating id based on Location attribute.
	 */
	function ExplorerModel(rootPath, /* function returning promise */fetchItems) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
	}
	ExplorerModel.prototype = /** @lends orion.explorer.ExplorerModel.prototype */{
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
	return ExplorerModel;
}());

exports.ExplorerFlatModel = (function() {
	/**
	 * Creates a new flat explorer model.
	 * @name orion.explorer.ExplorerFlatModel
	 * @class Tree model used by orion.explorer.Explorer for flat structures
	 * @param {String} rootPath path to load tree table root, response should contain a list of items
	 * @param {Function} fetchItems A function that returns a promise that resolves to the
	 * items at the provided location.
	 */
	function ExplorerFlatModel(rootPath, fetchItems) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
	}
	
	ExplorerFlatModel.prototype = new exports.ExplorerModel();
	
	ExplorerFlatModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		if(parentItem==this.root){
			onComplete(parentItem);
		}else{
			onComplete([]);
		}
	};
	
	return ExplorerFlatModel;
}());

/********* Rendering json items into columns in the tree **************/
exports.ExplorerRenderer = (function() {
	function ExplorerRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
		this._expandImgSrc = '/images/twistie_open.gif';
		this._collapseImgSrc = '/images/twistie_closed.gif';
	}
	ExplorerRenderer.prototype = {
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			dojo.empty(tableNode);
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
			this.explorer.registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(actionsWrapper, "object", item, this.explorer, "image");
			});
			return actionsColumn;
		},
		initCheckboxColumn: function(tableNode){
			if (this._useCheckboxSelection) {
				var th = document.createElement('th');
				return th;
			}
		},
		getCheckboxColumn: function(item, tableRow){
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td');
				dojo.addClass(checkColumn, "secondaryColumn");
				var check = document.createElement('input');
				dojo.style(check, "verticalAlign", "middle");
				check.type = "checkbox";
				check.id = tableRow.id+"selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
					this._storeSelections();
					if (this.explorer.selection)
						this.explorer.selection.setSelections(this.getSelected());		
				}));
				return checkColumn;
			}
		},
		
		_storeSelections: function() {
			var selectionIDs = this.getSelectedIds();
			var prefPath = this._getUIStatePreferencePath();
			if (prefPath && window.sessionStorage) {
				window.sessionStorage[prefPath+"selection"] = JSON.stringify(selectionIDs);
			}
		},
		
		_restoreSelections: function(prefPath) {
			var selections = window.sessionStorage[prefPath+"selection"];
			if (typeof selections === "string") {
				if (selections.length > 0) {
					selections = JSON.parse(selections);
				} else {
					selections = null;
				}
			}
			var i;
			if (selections) {
				for (i=0; i<selections.length; i++) {
					var tableRow = dojo.byId(selections[i]);
					if (tableRow) {
						dojo.addClass(tableRow, "checkedRow");
						var check = dojo.byId(tableRow.id + "selectedState");
						if (check) {
							check.checked = true;
						}
					}
				}
			}	
			// notify the selection service of our new selections
			var selectedItems = this.getSelected();
			if(this.explorer.selection)
				this.explorer.selection.setSelections(selectedItems);
		},
		
		_storeExpansions: function(prefPath) {
			window.sessionStorage[prefPath+"expanded"] = JSON.stringify(this._expanded);
		},
		
		// returns true if the selections also need to be restored.
		_restoreExpansions: function(prefPath) {
			var didRestoreSelections = false;
			var expanded = window.sessionStorage[prefPath+"expanded"];
			if (typeof expanded=== "string") {
				if (expanded.length > 0) {
					expanded= JSON.parse(expanded);
				} else {
					expanded = null;
				}
			}
			var i;
			if (expanded) {
				for (i=0; i<expanded.length; i++) {
					var row= dojo.byId(expanded[i]);
					if (row) {
						this._expanded.push(expanded[i]);
						// restore selections after expansion in case an expanded item was selected.
						this.tableTree.expand(expanded[i], dojo.hitch(this, function() {
							this._restoreSelections(prefPath);
						}));
						didRestoreSelections = true;
					}
				}
			}
			return !didRestoreSelections;
		},
		
		_getUIStatePreferencePath: function() {
			if (this.explorer) {
				var rootPath = this.explorer.getRootPath();
				if (this._cachePrefix && rootPath) {
					var rootSegmentId = rootPath.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
					return "/" + this._cachePrefix + "/" + rootSegmentId + "/uiState";
				}
			}
			return null;
						
		},
		
		expandCollapseImageId: function(rowId) {
			return rowId+"__expand";
		},
		
		getExpandImage: function(tableRow, placeHolder, decorateImage){
			var expandImg = dojo.create("img", {style: "vertical-align: middle;", src: this._collapseImgSrc, name: this.expandCollapseImageId(tableRow.id)}, placeHolder, "last");
			dojo.create("img", {style: "vertical-align: middle; margin-right: 4px; padding-top: 3px; padding-bottom: 3px;", src: decorateImage ? decorateImage : "/images/folder.gif"}, placeHolder, "last");
			expandImg.onclick = dojo.hitch(this, function(evt) {
				this.tableTree.toggle(tableRow.id, this.expandCollapseImageId(tableRow.id), this._expandImgSrc, this._collapseImgSrc);
				var expanded = this.tableTree.isExpanded(tableRow.id);
				if (expanded) {
					this._expanded.push(tableRow.id);
				} else {
					for (var i in this._expanded) {
						if (this._expanded[i] === tableRow.id) {
							this._expanded.splice(i, 1);
							break;
						}
					}
				}
				var prefPath = this._getUIStatePreferencePath();
				if (prefPath && window.sessionStorage) {
					this._storeExpansions(prefPath);
				}
				
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
		
		getSelectedIds: function() {
			var selected = [];
			dojo.query(".selectionCheckmark").forEach(dojo.hitch(this, function(node) {
				if (node.checked) {
					var row = node.parentNode.parentNode;
					selected.push(row.id);
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
			// notify the selection service of the change in state.
			if(this.explorer.selection)
				this.explorer.selection.setSelections(this.getSelected());
		},
		updateCommands: function(){
			var registry = this.explorer.registry;
			dojo.query(".treeTableRow").forEach(function(node, i) {
				
				var actionsWrapperId = node.id + "actionswrapper";
				var actionsWrapper = dojo.byId(actionsWrapperId);
				
				dojo.empty(actionsWrapper);
				// contact the command service to render appropriate commands here.
				registry.getService("orion.page.command").then(function(service) {
					service.renderCommands(actionsWrapper, "object", node._item, this.explorer, "image");
				});

			});
		},
		
		_init: function(options) {
			if (options) {
				this._useCheckboxSelection = options.checkbox === undefined ? false : options.checkbox;
				this._colums = options.colums || [];
				this._cachePrefix = options.cachePrefix;
			}
		},
		
		_initializeUIState: function() {
			this._expanded = [];
			var prefsPath = this._getUIStatePreferencePath();
			if (prefsPath && window.sessionStorage) {
				if (this._restoreExpansions(prefsPath)) {
					this._restoreSelections(prefsPath);
				}
			}
		}
	};
	return ExplorerRenderer;
}());

/**
 * @name orion.explorer.SelectionRenderer
 * @class Sample renderer that allows you to render a standard tree table.
 * Override {@link orion.explorer.SelectionRenderer#getCellHeaderElement}  and
 * {@link orion.explorer.SelectionRenderer#getCellElement} to generate table content.
 */
exports.SelectionRenderer = (function(){
	function SelectionRenderer(options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	SelectionRenderer.prototype = new exports.ExplorerRenderer();
	
	SelectionRenderer.prototype.renderTableHeader = function(tableNode){
		var thead = document.createElement('thead');
		var row = document.createElement('tr');
		dojo.addClass(thead, "navTableHeading");
		var th, actions, size;
		if (this._useCheckboxSelection)
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
	
	SelectionRenderer.prototype.renderRow = function(item, tableRow) {
		dojo.style(tableRow, "verticalAlign", "baseline");
		dojo.addClass(tableRow, "treeTableRow");

		var checkColumn = this.getCheckboxColumn(item, tableRow);
		if(checkColumn) {
			tableRow.appendChild(checkColumn);
		}

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
	SelectionRenderer.prototype.getCellHeaderElement = function(col_no){};

	/**
	 * Override to return a dom element containing table cell, preferable <code>td</td>
	 * @param col_no number of column
	 * @param item item to be rendered
	 * @param tableRow the current table row
	 */
	SelectionRenderer.prototype.getCellElement = function(col_no, item, tableRow){};
	
	return SelectionRenderer;
}());
return exports;
});
