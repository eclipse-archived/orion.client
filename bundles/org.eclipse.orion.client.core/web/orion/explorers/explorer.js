/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window */
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/nls/messages', 'require', 'dojo', 'orion/treetable', 'orion/explorers/explorerNavHandler', 'orion/commands'], function(messages, require, dojo, mTreeTable, mNavHandler, mCommands){

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
			dojo.hitch(this.myTree, this.myTree.refresh)(parent, children, true);
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
				dojo.place("<br><span id='"+domId+"placeHolderRow'></span>", refNode, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				tempNode = dojo.byId(domId+"placeHolderRow"); //$NON-NLS-0$
				if (tempNode) {
					return {tempNode: tempNode, refNode: tempNode};
				}
			}
			if (refNode) {
				// make a row and empty column so that the new name appears after checkmarks/expansions
				dojo.place("<tr id='"+domId+"placeHolderRow'><td id='"+domId+"placeHolderCol'></td>", refNode, "after"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				tempNode = dojo.byId(domId+"placeHolderRow"); //$NON-NLS-0$
				refNode = dojo.byId(domId+"placeHolderCol"); //$NON-NLS-0$
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
		 * Collapse all the nodes in the explorer
		 */
		collapseAll: function() {
			var topLevelNodes = this._navHandler.getTopLevelNodes();
			for (var i = 0; i < topLevelNodes.length ; i++){
				this.myTree.collapse(topLevelNodes[i]);
			}
		},
		
		/**
		 * Expand all the nodes under a node in the explorer
		 * @param nodeModel {Object} the node model to be expanded. If not provided the whole tree is expanded recursively
		 */
		expandAll: function(nodeModel) {
			if(nodeModel){
				this._expandRecursively(nodeModel);
			} else {
				if(!this._navHandler){
					return;
				}
				//We already know what the top level children is under the root, from the navigation handler.
				var topLevelNodes = this._navHandler.getTopLevelNodes();
				for (var i = 0; i < topLevelNodes.length ; i++){
					this._expandRecursively(topLevelNodes[i]);
				}
			}
		},
		
		_expandRecursively: function(node){
			//If a node is not expandable, we stop here.
			if(!this._navHandler || !this._navHandler.isExpandable(node)){
				return;
			}
			var that = this;
			this.myTree.expand(node, function(){
				that.model.getChildren(node, function(children){
					if(children === undefined || children === null) {
						return;
					}
					var len = children.length;
					for (var i = 0; i < len ; i++){
						that._expandRecursively(children[i]);
					}
				});
			});
		},
		
		/**
		 * Displays tree table containing filled with data provided by given model
		 * 
		 * @param parentId id of parent dom element
		 * @param model providing data to display
		 * @param options optional parameters of the tree(custom indent, onCollapse callback)
		 */
		createTree: function (parentId, model, options){
			if(this.selection) {
				this.selection.setSelections([]);
			}
			if(this.getNavHandler()){
				this.getNavHandler()._clearSelection();
			}
			var treeId = parentId + "innerTree"; //$NON-NLS-0$
			var existing = dojo.byId(treeId);
			if (existing) {
				dojo.destroy(existing);
			}
			if (model){
				model.rootId = treeId;
			}
			this.model = model;
			this._parentId = parentId;
			this._treeOptions = options;
			var useSelection = !options || (options && !options.noSelection);
			if(useSelection){
				this.selectionPolicy = options ? options.selectionPolicy : "";
				this._navDict = new mNavHandler.ExplorerNavDict(this.model);
			}
			this.myTree = new mTreeTable.TableTree({
				id: treeId,
				model: model,
				showRoot: false,
				parent: parentId,
				labelColumnIndex: this.renderer.getLabelColumnIndex(),
				renderer: this.renderer,
				indent: options ? options.indent: undefined,
				onCollapse: options ? options.onCollapse: undefined,
				tableElement: options ? options.tableElement : undefined,
				tableBodyElement: options ? options.tableBodyElement : undefined,
				tableRowElement: options ? options.tableRowElement : undefined
			});
			this.renderer._initializeUIState();
			if(this.selectionPolicy === "cursorOnly"){ //$NON-NLS-0$
				this.initNavHandler();
			}
		},
		getNavHandler: function(){
			return this._navHandler;
		},
		
		getNavDict: function(){
			return this._navDict;
		},
		
		refreshSelection: function(){
			if(this.selection) {
				var navHandler = this.getNavHandler();
				var selections = [];
				if(navHandler && this.getNavDict()){
					var existingSels = navHandler.getSelection();
					for(var i = 0; i < existingSels.length; i++){
						var rowDiv = navHandler.getRowDiv(existingSels[i]);
						if(rowDiv && rowDiv.parentNode){
							var value = this.getNavDict().getValue(this.model.getId(existingSels[i]));
							if(value.model){
								selections.push(value.model);
							}
						}
					}
				}
				this.selection.setSelections(selections);
			}
		},
		
		getRootPath: function() {
			if (this.model && this.model.root) {
				return this.model.root.Location;
			}
			return null;
		},
		
		initNavHandler: function(){
			var parentId = this._parentId;
			var options = this._treeOptions;
			
			var useSelection = !options || (options && !options.noSelection);
			if(!useSelection){
				return;
			}
			if(!this.getNavHandler()){
				this._navHandler = new mNavHandler.ExplorerNavHandler(this, this._navDict, {setFocus: options && options.setFocus, selectionPolicy: (options ? options.selectionPolicy : null)});
			}
			var that = this;
			this.model.getRoot(function(itemOrArray){
				if(itemOrArray instanceof Array){
					that.getNavHandler().refreshModel(that.getNavDict(), that.model, itemOrArray);
				} else if(itemOrArray.children && itemOrArray.children instanceof Array){
					that.getNavHandler().refreshModel(that.getNavDict(), that.model, itemOrArray.children);
				}
				if(options && options.setFocus){
					that.getNavHandler().cursorOn(null, false, false, true);
				}
			});
		},
	    
	    _lastHash: null,
	    checkbox: false
	};
	return Explorer;
}());

/**
 * Creates generic explorer commands, like expand all and collapse all.
 * @param {orion.commands.CommandService} commandService the command service where the commands wil be added
 * @param {Function} visibleWhen optional if not provided we always display the commands
 */
exports.createExplorerCommands = function(commandService, visibleWhen) {
	function isVisible(item){
		if( typeof(item.getItemCount) === "function"){
			if(item.getItemCount() > 0){
				return visibleWhen ? visibleWhen(item) : true; 
			}
			return false;
		}
		return false;
	}
	var expandAllCommand = new mCommands.Command({
		tooltip : messages["Expand all"],
		imageClass : "core-sprite-expandAll", //$NON-NLS-0$
		id: "orion.explorer.expandAll", //$NON-NLS-0$
		groupId: "orion.explorerGroup", //$NON-NLS-0$
		visibleWhen : function(item) {
			return isVisible(item);
		},
		callback : function(data) {
			data.items.expandAll();
	}});
	var collapseAllCommand = new mCommands.Command({
		tooltip : messages["Collapse all"],
		imageClass : "core-sprite-collapseAll", //$NON-NLS-0$
		id: "orion.explorer.collapseAll", //$NON-NLS-0$
		groupId: "orion.explorerGroup", //$NON-NLS-0$
		visibleWhen : function(item) {
			return isVisible(item);
		},
		callback : function(data) {
			data.items.collapseAll();
	}});
	commandService.addCommand(expandAllCommand);
	commandService.addCommand(collapseAllCommand);
};

exports.ExplorerModel = (function() {
	/**
	 * Creates a new explorer model instance.
	 * @name orion.explorer.ExplorerModel
	 * @class Simple tree model using Children and ChildrenLocation attributes to fetch children
	 * and calculating id based on Location attribute.
	 */
	function ExplorerModel(rootPath, /* function returning promise */fetchItems, idPrefix) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.idPrefix = idPrefix || "";
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
			if (item.Location === this.root.Location) {
				return this.rootId;
			} 
			// first strip slashes so we aren't processing path separators.
			var stripSlashes = item.Location.replace(/[\\\/]/g, "");
			// these id's are used in the DOM, so we can't use characters that aren't valid in DOM id's.
			// However we need a unique substitution string for these characters, so that we don't duplicate id's
			// So we are going to substitute ascii values for invalid characters.
			// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=363062
			
			var id = this.idPrefix;
			for (var i=0; i<stripSlashes.length; i++) {
				if (stripSlashes[i].match(/[^\.\:\-\_0-9A-Za-z]/g)) {
					id += stripSlashes.charCodeAt(i);
				} else {
					id += stripSlashes[i];
				}
			}
			return id;
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
	function ExplorerFlatModel(rootPath, fetchItems, root) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.root = root;
	}
	
	ExplorerFlatModel.prototype = new exports.ExplorerModel();
	
	ExplorerFlatModel.prototype.getRoot = function(onItem){
		if(this.root){
			onItem(this.root);
		} else {
			this.fetchItems(this.rootPath).then(
					dojo.hitch(this, function(item){
						this.root = item;
						onItem(item);
					})
					);
		}
	};
	
	ExplorerFlatModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		if(parentItem === this.root){
			onComplete(this.root);
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
		this._expandImageClass = "core-sprite-openarrow"; //$NON-NLS-0$
		this._collapseImageClass = "core-sprite-closedarrow"; //$NON-NLS-0$
		this._twistieSpriteClass = "modelDecorationSprite"; //$NON-NLS-0$
	}
	ExplorerRenderer.prototype = {
	
		_init: function(options) {
			if (options) {
				this._useCheckboxSelection = options.checkbox === undefined ? false : options.checkbox;
				this.selectionPolicy = options.singleSelection ? "singleSelection" : "";//$NON-NLS-0$
				this._cachePrefix = options.cachePrefix;
				this.getCheckedFunc = options.getCheckedFunc;
				this.onCheckedFunc = options.onCheckedFunc;
				this._highlightSelection = true;
				this._treeTableClass = options.treeTableClass || "treetable";  //$NON-NLS-0$
				if (options.highlightSelection === false){
					this._highlightSelection = false;
				}
				this._decorateAlternatingLines = true;
				if (options.decorateAlternatingLines === false) {
					this._decorateAlternatingLines = false;
				}
				if (!this.actionScopeId) {
					this.actionScopeId = options.actionScopeId;
				}
			}
		},
		
		getLabelColumnIndex: function() {
			return this.explorer.checkbox ? 1 : 0;  // 0 if no checkboxes
		}, 
		
		initTable: function (tableNode, tableTree) {
			this.tableTree = tableTree;
			dojo.empty(tableNode);
			if (this._treeTableClass) {
				dojo.addClass(tableNode, this._treeTableClass); 
			}
			this.renderTableHeader(tableNode);

		},
		getActionsColumn: function(item, tableRow, renderType, columnClass, renderAsGrid){
			renderType = renderType || "tool"; //$NON-NLS-0$
			var commandService = this.explorer.registry.getService("orion.page.command"); //$NON-NLS-0$
			var actionsColumn = document.createElement('td'); //$NON-NLS-0$
			actionsColumn.id = tableRow.id + "actionswrapper"; //$NON-NLS-0$
			if (columnClass) {
				dojo.addClass(actionsColumn, columnClass);
			}
			// contact the command service to render appropriate commands here.
			if (this.actionScopeId) {
				commandService.renderCommands(this.actionScopeId, actionsColumn, item, this.explorer, renderType, null, (renderAsGrid && this.explorer.getNavDict()) ? this.explorer.getNavDict().getGridNavHolder(item, true) : null);
			} else {
				window.console.log("Warning, no action scope was specified.  No commands rendered."); //$NON-NLS-0$
			}
			return actionsColumn;
		},
		initCheckboxColumn: function(tableNode){
			if (this._useCheckboxSelection) {
				var th = document.createElement('th'); //$NON-NLS-0$
				return th;
			}
		},
		getCheckboxColumn: function(item, tableRow){
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td'); //$NON-NLS-0$
				var check = document.createElement("span"); //$NON-NLS-0$
				check.id = this.getCheckBoxId(tableRow.id);
				dojo.addClass(check, "core-sprite-check selectionCheckmarkSprite"); //$NON-NLS-0$
				check.itemId = tableRow.id;
				if(this.getCheckedFunc){
					check.checked = this.getCheckedFunc(item);
					if(this._highlightSelection){
						dojo.toggleClass(tableRow, "checkedRow", check.checked); //$NON-NLS-0$
					}
					dojo.toggleClass(check, "core-sprite-check_on", check.checked); //$NON-NLS-0$
				}
				checkColumn.appendChild(check);
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) { //$NON-NLS-0$
					var newValue = evt.target.checked ? false : true;
					this.onCheck(tableRow, evt.target, newValue, true);
				}));
				return checkColumn;
			}
		},
		
		getCheckBoxId: function(rowId){
			return rowId + "selectedState"; //$NON-NLS-0$
		},
			
		onCheck: function(tableRow, checkBox, checked, manually, setSelection){
			checkBox.checked = checked;
			dojo.toggleClass(checkBox, "core-sprite-check_on", checked); //$NON-NLS-0$
			if(this.onCheckedFunc){
				this.onCheckedFunc(checkBox.itemId, checked, manually);
			}
			if(this.explorer.getNavHandler() && setSelection){
				this.explorer.getNavHandler().setSelection(this.explorer.getNavDict().getValue(tableRow.id).model, true);	
			}
		},
		
		storeSelections: function() {
			if(this.explorer.getNavHandler()){
				var selectionIDs = this.explorer.getNavHandler().getSelectionIds();
				var prefPath = this._getUIStatePreferencePath();
				if (prefPath && window.sessionStorage) {
					window.sessionStorage[prefPath+"selection"] = JSON.stringify(selectionIDs); //$NON-NLS-0$
				}
			}
		},
		
		_restoreSelections: function(prefPath) {
			var selections = window.sessionStorage[prefPath+"selection"]; //$NON-NLS-0$
			if (typeof selections === "string") { //$NON-NLS-0$
				if (selections.length > 0) {
					selections = JSON.parse(selections);
				} else {
					selections = null;
				}
			}
			var i;
			if (selections && this.explorer.getNavDict()) {
				var selectedItems = [];
				for (i=0; i<selections.length; i++) {
					var wrapper = this.explorer.getNavDict().getValue(selections[i]);
					if(wrapper && wrapper.rowDomNode && wrapper.model){
						selectedItems.push(wrapper.model);
						if(this._highlightSelection){
							dojo.addClass(wrapper.rowDomNode, "checkedRow"); //$NON-NLS-0$
						}
						var check = dojo.byId(this.getCheckBoxId(wrapper.rowDomNode.id));
						if (check) {
							check.checked = true;
							dojo.addClass(check, "core-sprite-check_on"); //$NON-NLS-0$
						}
					}
				}
				// notify the selection service of our new selections
				if(this.explorer.selection) {
					this.explorer.selection.setSelections(selectedItems);
					if(this.explorer.getNavHandler()){
						this.explorer.getNavHandler().refreshSelection();
					}
				}
			}	
		},
		
		_storeExpansions: function(prefPath) {
			window.sessionStorage[prefPath+"expanded"] = JSON.stringify(this._expanded); //$NON-NLS-0$
		},
		
		// returns true if the selections also need to be restored.
		_restoreExpansions: function(prefPath) {
			var didRestoreSelections = false;
			var expanded = window.sessionStorage[prefPath+"expanded"]; //$NON-NLS-0$
			if (typeof expanded=== "string") { //$NON-NLS-0$
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
					return "/" + this._cachePrefix + "/" + rootSegmentId + "/uiState"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
			return null;
						
		},
		
		expandCollapseImageId: function(rowId) {
			return rowId+"__expand"; //$NON-NLS-0$
		},
		
		updateExpandVisuals: function(tableRow, isExpanded) {
			var expandImage = dojo.byId(this.expandCollapseImageId(tableRow.id));
			if (expandImage) {
				dojo.addClass(expandImage, isExpanded ? this._expandImageClass : this._collapseImageClass);
				dojo.removeClass(expandImage, isExpanded ? this._collapseImageClass : this._expandImageClass);
			}
		},
		
		getExpandImage: function(tableRow, placeHolder, /* optional extra decoration */ decorateImageClass, /* optional sprite class for extra decoration */ spriteClass){
			var expandImage = dojo.create("span", {id: this.expandCollapseImageId(tableRow.id)}, placeHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(expandImage, this._twistieSpriteClass);
			dojo.addClass(expandImage, this._collapseImageClass);
			if (decorateImageClass) {
				var decorateImage = dojo.create("span", null, placeHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(decorateImage, spriteClass || "imageSprite"); //$NON-NLS-0$
				dojo.addClass(decorateImage, decorateImageClass);
			}

			expandImage.onclick = dojo.hitch(this, function(evt) {
				this.tableTree.toggle(tableRow.id);
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
			return expandImage;
		},
		
		render: function(item, tableRow){
			dojo.addClass(tableRow, "navRow"); //$NON-NLS-0$
			this.renderRow(item, tableRow);
		},
		
		rowsChanged: function() {
			if (this._decorateAlternatingLines) {
				dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
					if (i % 2) {
						dojo.addClass(node, "darkTreeTableRow"); //$NON-NLS-0$
						dojo.removeClass(node, "lightTreeTableRow"); //$NON-NLS-0$
					} else {
						dojo.addClass(node, "lightTreeTableRow"); //$NON-NLS-0$
						dojo.removeClass(node, "darkTreeTableRow"); //$NON-NLS-0$
					}
				});
			}
			// notify the selection service of the change in state.
			if(this.explorer.selectionPolicy !== "cursorOnly"){ //$NON-NLS-0$
				this.explorer.refreshSelection();
				this.explorer.initNavHandler();			
			}
		},
		updateCommands: function(){
			var registry = this.explorer.registry;
			dojo.query(".treeTableRow").forEach(function(node, i) { //$NON-NLS-0$
				
				var actionsWrapperId = node.id + "actionswrapper"; //$NON-NLS-0$
				var actionsWrapper = dojo.byId(actionsWrapperId);
				var commandService = registry.getService("orion.page.command"); //$NON-NLS-0$ 
				commandService.destroy(actionsWrapper);
				// contact the command service to render appropriate commands here.
				if (this.actionScopeId) {
					commandService.renderCommands(this.actionScopeId, actionsWrapper, node._item, this.explorer, "tool"); //$NON-NLS-0$
				}
			});
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
 * @class This  renderer renders a tree table and installs a selection and cursoring model to
 * allow the user to make selections without using checkboxes.
 * Override {@link orion.explorer.SelectionRenderer#getCellHeaderElement}  and
 * {@link orion.explorer.SelectionRenderer#getCellElement} to generate table content.
 */
exports.SelectionRenderer = (function(){
	/**
	 * Create a selection renderer with the specified options.  Options are defined in
	 * ExplorerRenderer.  An additional option is added here.
	 * @param {Boolean}singleSelection If true, set the selection policy to "singleSelection".
	 *
	 */
	function SelectionRenderer(options, explorer) {
		this._init(options);
		this.explorer = explorer;
	}
	SelectionRenderer.prototype = new exports.ExplorerRenderer();

	SelectionRenderer.prototype.renderTableHeader = function(tableNode){
		var thead = document.createElement('thead'); //$NON-NLS-0$
		var row = document.createElement('tr'); //$NON-NLS-0$
		dojo.addClass(thead, "navTableHeading"); //$NON-NLS-0$
		if (this._useCheckboxSelection) {
			row.appendChild(this.initCheckboxColumn(tableNode));
		}
		
		var i = 0;
		var cell = this.getCellHeaderElement(i);
		while(cell){
			if (cell.innerHTML.length > 0) {
				dojo.addClass(cell, "navColumn"); //$NON-NLS-0$
			}
			row.appendChild(cell);			
			cell = this.getCellHeaderElement(++i);
		}
		thead.appendChild(row);
		tableNode.appendChild(thead);
		
	};
	
	SelectionRenderer.prototype.renderRow = function(item, tableRow) {
		dojo.style(tableRow, "verticalAlign", "baseline"); //$NON-NLS-1$ //$NON-NLS-0$
		dojo.addClass(tableRow, "treeTableRow"); //$NON-NLS-0$
		var navDict = this.explorer.getNavDict();
		if(navDict){
			navDict.addRow(item, tableRow);
			dojo.connect(tableRow, "onclick", dojo.hitch(this, function(evt) { //$NON-NLS-0$
				if(this.explorer.getNavHandler()){
					this.explorer.getNavHandler().onClick(item, evt);
				}
			}));
		}
		var checkColumn = this.getCheckboxColumn(item, tableRow);
		if(checkColumn) {
			dojo.addClass(checkColumn, 'checkColumn'); //$NON-NLS-0$
			tableRow.appendChild(checkColumn);
		}

		var i = 0;
		var cell = this.getCellElement(i, item, tableRow);
		while(cell){
			tableRow.appendChild(cell);
			if (i===0) {
				if(this.getPrimColumnStyle){
					dojo.addClass(cell, this.getPrimColumnStyle()); //$NON-NLS-0$
				} else {
					dojo.addClass(cell, "navColumn"); //$NON-NLS-0$
				}
			} else {
				if(this.getSecondaryColumnStyle){
					dojo.addClass(cell, this.getSecondaryColumnStyle()); //$NON-NLS-0$
				} else {
					dojo.addClass(cell, "secondaryColumn"); //$NON-NLS-0$
				}
			}
			cell = this.getCellElement(++i, item, tableRow);
		}
		
	};

	/**
	 * Override to return a dom element containing table header, preferably <code>th</code>
	 * @name orion.explorer.SelectionRenderer#getCellHeaderElement
	 * @function
	 * @param col_no number of column
	 */
	SelectionRenderer.prototype.getCellHeaderElement = function(col_no){};

	/**
	 * Override to return a dom element containing table cell, preferable <code>td</code>
	 * @name orion.explorer.SelectionRenderer#getCellElement
	 * @function
	 * @param col_no number of column
	 * @param item item to be rendered
	 * @param tableRow the current table row
	 */
	SelectionRenderer.prototype.getCellElement = function(col_no, item, tableRow){};
	
	return SelectionRenderer;
}());

exports.SimpleFlatModel = (function() {	
	/**
	 * Creates a new flat model based on an array of items already known.
	 *
	 * @name orion.explorer.SimpleFlatModel
	 * @param {Array} items the items in the model
	 * @param {String} idPrefix string used to prefix generated id's
	 * @param {Function} getKey function used to get the property name used for generating an id in the model
	 */
	function SimpleFlatModel(items, idPrefix, getKey) {
		this.items = items;
		this.getKey = getKey;
		this.idPrefix = idPrefix;
		this.root = {children: items};
	}
	
	SimpleFlatModel.prototype = new exports.ExplorerModel();
		
	SimpleFlatModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	SimpleFlatModel.prototype.destroy = function() {
	};
	
	SimpleFlatModel.prototype.getId = function(/* item */ item){
		var key = this.getKey(item);
		// this might be a path, so strip slashes
		var stripSlashes = key.replace(/[\\\/]/g, "");
		var id = "";
		for (var i=0; i<stripSlashes.length; i++) {
			if (stripSlashes[i].match(/[^\.\:\-\_0-9A-Za-z]/g)) {
				id += stripSlashes.charCodeAt(i);
			} else {
				id += stripSlashes[i];
			}
		}
		return this.idPrefix + id;
	};
		
	SimpleFlatModel.prototype.getChildren = function(parentItem, /* function(items) */ onComplete){
		if(parentItem === this.root){
			onComplete(this.items);
		}else{
			onComplete([]);
		}
	};
	return SimpleFlatModel;
}());

return exports;
});
