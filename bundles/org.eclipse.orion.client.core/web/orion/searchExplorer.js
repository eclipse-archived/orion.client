/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */
/*jslint regexp:false browser:true forin:true*/

define(['dojo', 'orion/explorer'], function(dojo, mExplorer) {

	function SearchResultModel(	fileClient, root) {
		this.root = root ? root : null;
		this.fileClient = fileClient; 
		this.currentDetail = null;
		this.indexedFileItems = null;
		this.modelLocHash = [];
		this.currentFileIndex = 0;
		this.currentDetailIndex = -1;
		var isWindows = navigator.platform.indexOf("Win") !== -1;
		this._lineDelimiter =/* isWindows ? "\r\n" :*/ "\n"; 
	}
	SearchResultModel.prototype = mExplorer.ExplorerModel.prototype; 
	
	SearchResultModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	SearchResultModel.prototype.prepareFileItems = function(currentNode){
		this.indexedFileItems = [];
		this.walkTreeNode(this.root);
		this.indexedFileItems.sort(function(a, b) {
			var n1 = a.indexedName && a.indexedName.toLowerCase();
			var n2 = b.indexedName && b.indexedName.toLowerCase();
			if (n1 < n2) { return -1; }
			if (n1 > n2) { return 1; }
			return 0;
		}); 
	},
	
	SearchResultModel.prototype.walkTreeNode = function(currentNode){
		if(!currentNode.parent){
			currentNode.indexedName = "root";
		} else {
			currentNode.indexedName = currentNode.parent.indexedName + "-" + currentNode.name;
		}
		
		if(!currentNode.children){
			if(currentNode.type === "file")
				this.indexedFileItems.push(currentNode);
		} else {
			for (var i = 0; i < currentNode.children.length; i++ ){
				this.walkTreeNode(currentNode.children[i]);
			}
		}
	},
	
	SearchResultModel.prototype.getId = function(item){
		var result;
		if (item === this.root) {
			result = this.rootId;
		} else {
			result = item.location ? item.location : item.Location;
			// remove all non valid chars to make a dom id. 
			result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
		} 
		return result;
	};
	
	SearchResultModel.prototype.searchOneline =  function(lineString, searchStr){
		var i,startIndex = 0;
		var found = false;
		var result = [];
		while(true){
			i = lineString.indexOf(searchStr, startIndex);
			if (i === -1) {
				break;
			} else {
				result.push({startIndex: i});
				found = true;
				startIndex = i + searchStr.length;
			}
		}
		if(found)
			return result;
		return null;
		
	};
	
	SearchResultModel.prototype.searchWithinFile = function( fileModelNode, fileContentText, searchStr){
		var fileContents = fileContentText.split(this._lineDelimiter);
		if(fileModelNode){
			fileModelNode.children = [];
			for(var i = 0; i < fileContents.length ; i++){
				var lineString = fileContents[i];
				var result = this.searchOneline(lineString, searchStr);
				if(result){
					var lineNumber = i+1;
					var detailNode = {parent: fileModelNode, type: "detail",  name: lineNumber+ " : " + lineString, linkLocation: fileModelNode.linkLocation + "?line=" + lineNumber, location: fileModelNode.location + "-" + lineNumber};
					fileModelNode.children.push(detailNode);
				}
				
			}
			fileModelNode.name = fileModelNode.name + " (" + fileModelNode.children.length + " matches)";
		}
	};
	
	SearchResultModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.type === "detail") {
			onComplete([]);
		} else if (parentItem.type === "file" && parentItem.location) {
			this.fileClient.read(parentItem.location).then(
					dojo.hitch(this, function(jsonData) {
						  this.searchWithinFile(parentItem, jsonData, this.root.searchStr);
						  var itemId = this.getId(parentItem);
						  var fileUIItem = dojo.byId(itemId);
						  if(fileUIItem){
							  var linkUIItem = dojo.byId(itemId + "NameColumn");
							  if(linkUIItem)
								  dojo.place(document.createTextNode(parentItem.name), linkUIItem, "only");
						  }
						  onComplete(parentItem.children);
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file content: " + error.message);
						onComplete([]);
					})
			);
		} else {
			onComplete([]);
		}
	};
	
	SearchResultModel.prototype.constructor = SearchResultModel;
	
	function SearchResultRenderer(options, explorer){
		this._init(options);
		this.explorer = explorer;
	}
	SearchResultRenderer.prototype = mExplorer.SelectionRenderer.prototype;
	
	SearchResultRenderer.prototype.getCellHeaderElement = function(col_no){
		
		switch(col_no){
		case 0: 
			return dojo.create("th", {innerHTML: "<h2>Search Results</h2>"});
			break;
		/*	
		case 1:
			return dojo.create("th", {innerHTML: "<h2>Actions</h2>"});
			break;*/
		};
		
	};
	
	SearchResultRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		
		switch(col_no){
		case 0:
			var col, span, link;
			if (item.type ===  "dir") {
				col = document.createElement('td');
				var nameId =  tableRow.id + "__expand";
				span = dojo.create("span", null, col, "only");
				// defined in ExplorerRenderer.  Sets up the expand/collapse behavior
				this.getExpandImage(tableRow, span);
				link = dojo.create("span", {/*className: "navlinkonpage",*/ id: tableRow.id+"NameColumn"}, span, "last");
				dojo.place(document.createTextNode(item.name), link, "only");
			} else {
				col = document.createElement('td');
				
				var href = item.linkLocation;
				
				span = dojo.create("span", null, col, "only");
				if(item.type ===  "file"){
					this.getExpandImage(tableRow, span, "/images/file.gif");
					//dojo.create("img", {src: "/images/none.png", style: "vertical-align: middle"}, span, "last");
					//dojo.create("img", {src: "/images/file.gif", style: "vertical-align: middle; margin-right: 4px"}, span, "last");
				} else {
					
					dojo.create("img", {src: "/images/none.png", style: "vertical-align: middle"}, span, "last");
					dojo.create("img", {src: "/images/leftarrow.gif", style: "vertical-align: middle; margin-right: 4px"}, span, "last");
				}
				link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: href}, span, "last");
				dojo.place(document.createTextNode(item.name), link, "only");
			}
			return col;
		case 1:
			return this.getActionsColumn(item, tableRow);
		};
	};
	SearchResultRenderer.prototype.constructor = SearchResultRenderer;
	
	/**
	 * Creates a new search result explorer.
	 * @name orion.SearchResultExplorer
	 */
	function SearchResultExplorer(registry, fileClient, root,  parentId){
		this.parentId = parentId;
		this.registry = registry;
		this.fileClient = fileClient; 
		this.checkbox = false;
		this.renderer = new SearchResultRenderer({checkbox: false}, this);
		this.model = new SearchResultModel(fileClient, root);
		
	}
	SearchResultExplorer.prototype = mExplorer.Explorer.prototype;
	
	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	SearchResultExplorer.prototype.onchange = function(item) {
	};
	
	SearchResultExplorer.prototype.renderTree = function(parent) {
		this.createTree(parent, this.model);
	};
	
	SearchResultExplorer.prototype.expandAll = function() {
		var root = this.model.root;
		if(root.isRoot){
			for (var i = 0; i < root.children.length ; i++){
				this.expandRecursively(root.children[i]);
			}
		} else {
			this.expandRecursively(root);
		}
	};
	
	SearchResultExplorer.prototype.collapseAll = function() {
		var root = this.model.root;
		if(root.isRoot){
			for (var i = 0; i < root.children.length ; i++){
				this.myTree.collapse(root.children[i]);
			}
		} else {
			this.myTree.collapse(root);
		}
	};
	
	
	SearchResultExplorer.prototype.expandRecursively = function(node)	{
		if(node.type === "detail")
			return;
		this.myTree.expand(node);
		var children = node.children;
		if(children === undefined || children === null)
				return;
		var len = children.length;
		for (var i = 0; i < len ; i++){
			this.expandRecursively(children[i]);
		}
	};
	
	SearchResultExplorer.prototype.findUIParentChain = function(targetNode, parentChain)	{
		parentChain.push(targetNode);
		var id = this.model.getId(targetNode);
		var uiNode = dojo.byId(id);
		if(uiNode){
			return parentChain;
		}
		this.findUIParentChain(targetNode.parent, parentChain);
	},
	

	SearchResultExplorer.prototype.gotoNext = function(next)	{
		var filItem = this.model.indexedFileItems[this.model.currentFileIndex];
		var parentChain = [];
		this.findUIParentChain(filItem, parentChain);
		for(var i = parentChain.length -1 ; i > -1 ; i--){
			this.myTree.expand(parentChain[i]);
		}
		
		dojo.toggleClass(filItem.getId(), "checkedRow", !!evt.target.checked);

	};
	
	SearchResultExplorer.prototype.constructor = SearchResultExplorer;

	//return module exports
	return {
		SearchResultExplorer: SearchResultExplorer
	};
});
