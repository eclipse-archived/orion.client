/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets window*/
/*jslint regexp:false browser:true forin:true*/

var eclipse = eclipse || {};
eclipse.Explorer = (function() {
	/**
	 * @name eclipse.Explorer
	 * @class A table-based explorer component.
	 * 
	 * @param serviceRegistry
	 * @param parentId id of parent dom element
	 * @param renderer
	 */
	function Explorer(serviceRegistry, selection, renderer) {
		this.registry = serviceRegistry;
		this.renderer = renderer;
		this.selection = selection;
		this.myTree = null;
	}
	Explorer.prototype = /** @lends eclipse.Explorer.prototype */ {
		
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
			if (model){
				model.rootId = treeId;
			}
			this.model = model;
			this.myTree = new eclipse.TableTree({
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

eclipse = eclipse || {};
eclipse.ExplorerModel = (function() {
	/**
	 * @name eclipse.ExplorerModel
	 * @class Simple tree model using Children and ChildrenLocation attributes to fetch children
	 * and calculating id based on Location attribute.
	 */
	function ExplorerModel(rootPath, /* function returning promise */fetchItems) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
	}
	ExplorerModel.prototype = {
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

eclipse.ExplorerFlatModel = (function() {
	/**
	 * @name eclipse.Model
	 * @class Tree model used by eclipse.Explorer for flat structures
	 * 
	 * @param rootPath path to load tree table root, response should contain a list of items
	 */
	function ExplorerFlatModel(rootPath, /* function returning promise */fetchItems) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
	}
	
	ExplorerFlatModel.prototype = new eclipse.ExplorerModel();
	
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
eclipse = eclipse || {};
eclipse.ExplorerRenderer = (function() {
	function ExplorerRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
		this._expandImgSrc = '/images/expanded-gray.png';
		this._collapseImgSrc = '/images/collapsed-gray.png';
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
			this.explorer.registry.getService("ICommandService").then(function(service) {
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
				check.type = "checkbox";
				check.id = tableRow.id+"selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
					this._storeSelections();
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
		
		getExpandImage: function(tableRow, placeHolder){
			var expandImg = dojo.create("img", {src: this._collapseImgSrc, name: this.expandCollapseImageId(tableRow.id)}, placeHolder, "last");
			dojo.create("img", {src: "/images/fldr_obj.gif"}, placeHolder, "last");
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
			this.explorer.selection.setSelections(this.getSelected());
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
 * @name eclipse.SelectionRenderer
 * @class Sample renderer that allows you to render a standard tree table.
 * Override {@link eclipse.SelectionRenderer#getCellHeaderElement}  and
 * {@link eclipse.SelectionRenderer#getCellElement} to generate table content.
 */
eclipse.SelectionRenderer = (function(){
	function SelectionRenderer(options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	SelectionRenderer.prototype = new eclipse.ExplorerRenderer();
	
	SelectionRenderer.prototype.renderTableHeader = function(tableNode){
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

