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

eclipse.TestResultRenderer = (function() {
	function UTestResultRenderer (options) {
		this._init(options);
	}
	UTestResultRenderer.prototype = {
		initTable: function (tableNode, treeTable) {
			this.setTreeTable(treeTable);
			
			dojo.addClass(tableNode, 'treetable');
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
			var col;
			var self = this;
			if (item.type !== "test") {
				col = document.createElement('td');
				tableRow.appendChild(col);
				var nameId =  tableRow.id + "__expand";
				if(item.succeed)
					col.innerHTML = "<div><img name=\"" + nameId + "\"  src=\"/images/collapsed-gray.png\"><img src=\"/images/unit_test/test_succeed.png\">" + "<span>" + item.name + "</span>" + "</div>";
				else
					col.innerHTML = "<div><img name=\"" + nameId + "\"  src=\"/images/collapsed-gray.png\"><img src=\"/images/unit_test/test_fail.png\">" + "<span>" + item.name + "</span>" + "</div>";
				col.onclick = function(){self.onToggleDirectory ( tableRow.id ,nameId );};
			} else {
				col = document.createElement('td');
				tableRow.appendChild(col);
				
				var testRes =  document.createElement('span');
				testRes.innerHTML = item.name;
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
				
				if(item.succeed)
					col.innerHTML = "<div><img src=\"/images/none.png\"><img src=\"/images/unit_test/test_succeed.png\"></div>";
				else
					col.innerHTML = "<div><img src=\"/images/none.png\"><img src=\"/images/unit_test/test_fail.png\"></div>";
				col.childNodes[0].appendChild(testRes);
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
