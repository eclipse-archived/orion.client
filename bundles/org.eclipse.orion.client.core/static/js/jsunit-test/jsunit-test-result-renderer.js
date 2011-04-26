/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/******** Rendering json items into columns in the tree **************/

eclipse = eclipse || {};

eclipse.TestResultRenderer = (function() {
	function UTestResultRenderer (options) {
		this._init(options);
	}
	UTestResultRenderer.prototype = {
		initTable: function (tableNode, treeTable) {
			this.setTreeTable(treeTable);
			
			dojo.addClass(tableNode, 'testResultTreetable');
			var thead = document.createElement('thead');
			var row = document.createElement('tr');
			thead.appendChild(row);
			tableNode.appendChild(thead);
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
			var col, div;
			var self = this;
			if (item.type !== "test") {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				div = dojo.create("div", null, col, "only");
				var testStatus = (item.succeed ? "/images/unit_test/test_succeed.png" : "/images/unit_test/test_fail.png");
				dojo.create("img", {name: nameId, src: "/images/collapsed-gray.png"}, div, "last");
				dojo.create("img", {name: nameId, src: testStatus}, div, "last");
				dojo.place(document.createTextNode(item.name), div, "last");
				col.onclick = function(){self.onToggleDirectory ( tableRow.id ,nameId );};
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				
				var testRes =  document.createElement('span');
				dojo.place(document.createTextNode(item.name), testRes, "only");
				testRes.style.cursor = "pointer";
				
				dojo.connect(testRes, "onmouseover", testRes, function() {
					dojo.toggleClass(testRes, "checkedRow", true);
				});
				dojo.connect(testRes, "onmouseout", testRes, function() {
					dojo.toggleClass(testRes, "checkedRow", false);
				});
				
				dojo.connect(testRes, "onclick", testRes, function() {
					if(self._currentSelect !== undefined)
						dojo.toggleClass(self._currentSelect, "testResult", false);
					dojo.toggleClass(testRes, "testResult", true);
					self._currentSelect  = testRes;
					if(self._stackRenderer !== undefined)
						self._stackRenderer.update(item.detail);
				});
				
				div = dojo.create("div", null, col, "only");
				dojo.create("img", {src: "/images/none.png"}, div, "last");
				dojo.create("img", {src: (item.succeed ? "/images/unit_test/test_succeed.png" : "/images/unit_test/test_fail.png")}, div, "last");
				div.appendChild(testRes);
			}
		},

	  	expandAll: function(){
	  		var len = this._treeTable._treeModel.root.children.length;
			for(var i = 0 ; i < len ; i++){
			  	this._expandAll(this._treeTable._treeModel.root.children[i]);
		  	}
	  	},
	  	
		_expandAll: function(root)	{
			var children = root.children;
			if(children === undefined || children === null)
					return;
			this._treeTable.expand(this._treeTable._treeModel.getId(root));
			var len = children.length;
			for (var i = 0; i < len ; i++){
				this._expandAll(children[i]);
			}
		},
		
		rowsChanged: function() {
			dojo.query(".treeTableRow").forEach(function(node, i) {
				var color = i % 2 ? "FFFFFF" : "EFEFEF";
				dojo.style(node, "backgroundColor", color);
			});
		},
		
		_init: function(options) {
			this._useCheckboxSelection = eclipse.uTestUtils.getOptionValue(options , "checkbox" , false);
			this._stackRenderer = eclipse.uTestUtils.getOptionValue(options , "stackRenderer" , undefined);
			this._currentSelect = undefined;
		}
	};
	return UTestResultRenderer;
}());
