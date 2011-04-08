/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint forin:true devel:true*/
/*global dojo, document*/
 
/** @namespace */
var eclipse = eclipse || {};

eclipse.TableTree = (function() {
	/**
	 * Constructs a new TableTree with the given options.
	 * 
	 * @param options 
	 * @name eclipse.TableTree 
	 * @class Generates an HTML table where one of the columns is indented according to depth of children.
	 * Clients must supply a model that generates children items, and a renderer can be supplied which
	 * generates the HTML table row for each child. Custom rendering allows clients to use checkboxes,
	 * images, links, etc. to describe each  element in the tree.  Renderers handle all clicks and other
	 * behavior via their supplied row content.<p>
	 * 
	 * The table tree parent can be specified by id or DOM node.<p>
	 * 
	 * The tree provides API for the client to programmatically expand and collapse
	 * nodes, based on the client renderer's definition of how that is done (click on icon, etc.).
	 * The tree will manage the hiding and showing of child DOM elements and proper indent.<p>
	 * 
	 * The model must implement<ul>
	 *   <li>getRoot(onItem)  
	 *   <li>getChildren(parentItem, onComplete)
	 *   <li>getId(item)  // must be a valid DOM id</ul>
	 * 
	 * Renderers must implement<ul>
	 *   <li>initTable(tableNode) // set up table attributes and a header if desired
	 *   <li>render(item, tr) // generate tds for the row
	 *   <li>labelColumnIndex() // 0 based index of which td contains the primary label which will be indented
	 *   <li>rowsChanged // optional, perform any work (such as styling) that should happen after the row content changes</ul>
	 * 
	 */
	function TableTree (options) {
		this._init(options);
	}
	TableTree.prototype = /** @lends eclipse.TableTree.prototype */ {
		_init: function(options) {
			var parent = options.parent;
			var tree = this;
			if (typeof(parent) === "string") {
				parent = dojo.byId(parent);
			}
			if (!parent) { throw "no parent"; }
			if (!options.model) { throw "no tree model"; }
			if (!options.renderer) { throw "no renderer"; }
			this._parent = parent;
			this._treeModel = options.model;
			this._renderer = options.renderer;
			this._showRoot = options.showRoot === undefined ? false : options.showRoot;
			this._indent = options.indent === undefined ? 16 : options.indent;
			this._labelColumnIndex = options.labelColumnIndex === undefined ? 0 : options.labelColumnIndex;
			this._id = options.id === undefined ? "treetable" : options.id;
			
			// Generate the table
			this._root = this._treeModel.getRoot(function (root) {
				if (this._showRoot) {
					root._depth = 0;
					this._generate([root], 0);
				}
				else {
					tree._treeModel.getChildren(root, function(children) {
						tree._generate(children, 0);
					});
				}
			});
		},
		
		_generate: function(children, indentLevel) {
			dojo.empty(this._parent);
			var table = document.createElement('table');
			table.id = this._id;
			this._renderer.initTable(table, this);
			var tbody = document.createElement('tbody');
			tbody.id = this._id+"tbody";
			this._generateChildren(children, indentLevel, tbody, "last");
			table.appendChild(tbody);
			this._parent.appendChild(table);
			this._rowsChanged();
		},
		
		_generateChildren: function(children, indentLevel, referenceNode, position) {
			for (var i in children) {
				var row = document.createElement('tr');
				row.id = this._treeModel.getId(children[i]);
				row._depth = indentLevel;
				// This is a perf problem and potential leak because we're bashing a dom node with
				// a javascript object.  (Whereas above we are using simple numbers/strings). 
				// We should consider an item map.
				row._item = children[i];
				this._renderer.render(children[i], row);
				// generate an indent
				var indent = this._indent * indentLevel;
				dojo.style(row.childNodes[this._labelColumnIndex], "paddingLeft", indent +"px");
				dojo.place(row, referenceNode, position);
				if (position === "after") {
					referenceNode = row;
				}
			}
		},
		
		_rowsChanged: function() {
			// notify the renderer if it has implemented the function
			if (this._renderer.rowsChanged) {
				this._renderer.rowsChanged();
			}
		},
		
		getSelected: function() {
			return this._renderer.getSelected();
		},
		
		refresh: function(item, children, /* optional */ forceExpand) {
			var parentId = this._treeModel.getId(item);
			if (parentId === this._id) {
				this._removeChildRows(parentId);
				this._generateChildren(children, 0, dojo.byId(parentId+"tbody"), "last");
				this._rowsChanged();
			} else {
				var row = dojo.byId(parentId);
				if (row) {
					// if it is showing children, refresh what is showing
					row._item = item;
					// If the row should be expanded
					if (row && (forceExpand || row._expanded)) {
						this._removeChildRows(parentId);
						this._generateChildren(children, row._depth+1, row, "after");
						this._rowsChanged();
					}
				} else {
					// the item wasn't found.  We could refresh the root here, but for now
					// let's log it to figure out why.
					console.log("could not find table row " + parentId);
				}
			}
		},
		
		refreshAndExpand: function(item, children) {
			this.refresh(item, children, true);
		},
		
		getItem: function(itemOrId) {  // a dom node, a dom id, or the item
			if (typeof(itemOrId) === "string") {  //dom id
				var node = dojo.byId(itemOrId);
				if (node) {
					return node._item;
				}
			}
			if (itemOrId._item) {  // is it a dom node that knows its item?
				return itemOrId._item;
			}
			return itemOrId;  // return what we were given
		},
		
		toggle: function(id, imgName, expandedImage, collapsedImage) {
			var row = dojo.byId(id);
			if (row) {
				if (row._expanded) {
					this.collapse(id);
					if (imgName) {
						document.images[imgName].src=collapsedImage;
					}
				}
				else {
					this.expand(id);
					if (imgName) {
						document.images[imgName].src=expandedImage;
					}
				}
			}
		},
		
		isExpanded: function(id) {
			var row = dojo.byId(id);
			if (row) {
				return row._expanded;
			}
			return false;
		},
		
		expand: function(itemOrId , postExpandFunc , args) {
			var id = typeof(itemOrId) === "string" ? itemOrId : this._treeModel.getId(itemOrId);
			var row = dojo.byId(id);
			if (row) {
				if (row._expanded) {
					return;
				}
				row._expanded = true;
				var tree = this;
				var children = this._treeModel.getChildren(row._item, function(children) {
					tree._generateChildren(children, row._depth+1, row, "after");
					tree._rowsChanged();
					if (postExpandFunc) {
						postExpandFunc.apply(this, args);
					}
				});
			}
		}, 
		
		_removeChildRows: function(parentId) {
			var table = dojo.byId(this._id);
			// true if we are removing directly from table
			var foundParent = parentId === this._id;
			var stop = false;
			var parentDepth = -1;
			var toRemove = [];
			dojo.query(".treeTableRow").forEach(function(row, i) {
				if (stop) {
					return;
				}
				if (foundParent) {
					if (row._depth > parentDepth) {
						toRemove.push(row);
					}
					else {
						stop = true;  // we reached a sibling to our parent
					}
				} else {
					if (row.id === parentId) {
						foundParent = true;
						parentDepth = row._depth;
					}
				}
			});
			for (var i in toRemove) {
				//table.removeChild(toRemove[i]); // IE barfs on this
				var child = toRemove[i];
				child.parentNode.removeChild(child);
			}
		},
		
		collapse: function(itemOrId) {
			var id = typeof(itemOrId) === "string" ? itemOrId : this._treeModel.getId(itemOrId);
			var row = dojo.byId(id);
			if (row) {
				if (!row._expanded) {
					return;
				}
				row._expanded = false;
				this._removeChildRows(id);
				this._rowsChanged();
			}
		}
	};  // end prototype
	return TableTree;
}());

