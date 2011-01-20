/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/******** Rendering json items into columns in the tree **************/
eclipse = eclipse || {};
eclipse.TestNavigatorRenderer = (function() {
	function FileRenderer (options) {
		this._init(options);
	}
	FileRenderer.prototype = {
		initTable: function (tableNode, treeTable) {
			this.setTreeTable(treeTable);
			
			dojo.addClass(tableNode, 'testNavTreetable');
			var thead = document.createElement('thead');
			var row = document.createElement('tr');
			var th;
			if (this._useCheckboxSelection) {
				th = document.createElement('th');
				row.appendChild(th);
			}
			
			thead.appendChild(row);
			tableNode.appendChild(thead);
		},
		
		_findParentDepth: function(parents){
			var length = parents.length;
			for(var i = 0 ; i < length ; i++){
				if(dojo.byId( parents[i]))
					return i;
			}
			return length;
		},
		
		_expandParents: function(args){
			var selection = args[0];
			var depth = args[1];
			if(depth < 0)
				return;
			var self = this;
			if(depth > 0)
				this._treeTable.expand(selection.parents[depth] ,function(arg){self._expandParents(arg);} ,[selection , depth-1]);
			else
				this._treeTable.expand(selection.parents[depth] ,function(arg){self._checkSingleFile(arg);} ,[selection.location]);
		},
		
		_updateSingleSelection: function(){
			var selection = this._selectionList[this._selectionCursor];
			var loc = selection.location;
			var fileItemDiv = dojo.byId(loc);
			if(!fileItemDiv ){
				var depth = this._findParentDepth(selection.parents);
				this._expandParents([selection, depth]);
			} else {
				this._checkSingleFile([selection.location]);
			}
		},
		
		updateBySelection: function(selectionList){
			this._selectionList = selectionList;
			this._selectionCursor = 0;
			this._unCheckFiles();
			this._updateSingleSelection();
		},
		
		setTreeTable: function(treeTable) {
			this._treeTable = treeTable;
		},
		
		onToggleDirectory: function(id, imgName){
			this._treeTable.toggle(id, imgName,"/images/expanded-gray.png", "/images/collapsed-gray.png");
		},
		
		render: function(item, tableRow) {
			tableRow.cellSpacing = "1px";
			dojo.style(tableRow, "verticalAlign", "baseline");
			dojo.addClass(tableRow, "treeTableRow");
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td');
				var check = document.createElement('input');
				check.type = "checkbox";
				check.id = tableRow.id+"_selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				tableRow.appendChild(checkColumn);
				
				dojo.connect(check, "onclick", function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
				});
			}
			var col, div;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				dojo.create("img", {src: "/images/collapsed-gray.png", name: nameId}, div, "last");
				dojo.create("img", {src: "/images/silk/folder.png"}, div, "last");
				dojo.place(document.createTextNode(item.Name), div, "last");
				var self = this;
				col.onclick = function(){self.onToggleDirectory ( tableRow.id ,nameId );};
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				div = dojo.create("div", null, col, "only");
				dojo.create("img", {src: "/images/none.png"}, div, "last");
				dojo.create("img", {src: "/images/silk/page.png"}, div, "last");
				dojo.place(document.createTextNode(item.Name), div, "last");
			}
		},
		
		_unCheckFiles: function() {
			var rootChildren = this._treeTable._treeModel.root.children;
			for (var i = 0; i< rootChildren.length ; i++){
				this._treeTable.collapse(rootChildren[i]);
			}
		},
		
		_checkSingleFile: function(args) {
			var itemId = args[0];
			var node = dojo.byId(itemId + "_selectedState");
			if (node && !node.checked) {
				node.checked = true;
				dojo.toggleClass(node.parentNode.parentNode, "checkedRow", true);
			}
			if(this._selectionCursor < (this._selectionList.length - 1 )){
				this._selectionCursor++;
				this._updateSingleSelection();
			}
		},
		
		getSelected: function() {
			var selected = [];
			dojo.query(".selectionCheckmark").forEach(function(node) {
				if (node.checked) {
					selected.push(node.itemId);
				}
			});
			return selected;
		},
		
		getSelectedURL: function(withParentInfo) {
			var selected = [];
			var self = this;
			dojo.query(".selectionCheckmark").forEach(function(node) {
				if (node.checked && !node.Directory) {
   					var item = self._treeTable.getItem(node.itemId);
					if(item && !item.Directory){
						if(withParentInfo){
							selected.push(item);
						} else {
							selected.push(item.Location);
						}
					}
				}
			});
			return selected;
		},
		
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				var color = i % 2 ? "FFFFFF" : "EFEFEF";
				dojo.style(node, "backgroundColor", color);
			});
		},
		
		_init: function(options) {
			this._useCheckboxSelection = eclipse.uTestUtils.getOptionValue(options , "checkbox" , false);
		}
	};
	return FileRenderer;
}());
