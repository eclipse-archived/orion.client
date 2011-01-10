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
			
			dojo.addClass(tableNode, 'treetable');
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
		
		updateBySelection: function(){
			
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
				check.id = tableRow+"selectedState";
				dojo.addClass(check, "selectionCheckmark");
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				tableRow.appendChild(checkColumn);
				
				dojo.connect(check, "onclick", function(evt) {
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked);
				});
			}
			var col;
			if (item.Directory) {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				col.innerHTML = "<div><img name=\"" + nameId + "\"  src=\"/images/collapsed-gray.png\"><img src=\"/images/silk/folder.png\">" + "<span>" + item.Name + "</span>" + "</div>";
				var self = this;
				col.onclick = function(){self.onToggleDirectory ( tableRow.id ,nameId );};
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				col.innerHTML = "<div><img src=\"/images/none.png\"><img src=\"/images/silk/page.png\"><span>" + item.Name + "</span></div>";
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
		
		getSelectedURL: function(url) {
			var selected = [];
			var self = this;
			dojo.query(".selectionCheckmark").forEach(function(node) {
				if (node.checked && !node.Directory) {
   					var item = self._treeTable.getItem(node.itemId);
					if(item && !item.Directory){
						if(url){
							selected.push(item.Location);
						} else {
							selected.push(item.Name);
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
