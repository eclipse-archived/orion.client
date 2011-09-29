/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console*/
/*jslint regexp:false browser:true forin:true*/

define(['dojo', 'orion/explorer', 'orion/util', 'orion/fileClient', 'orion/commands'], function(dojo, mExplorer, mUtil, mFileClient, mCommands) {

	function SearchResultModel(	serviceRegistry, fileClient, resultLocation, searchStr, explorer) {
		this.registry= serviceRegistry;
		this.fileClient = fileClient; 
		this._resultLocation = resultLocation;
		this.searchStr = searchStr.toLowerCase();
		this.root = {
				isRoot: true,
				children:[]
			};
		
		this.currentDetail = null;
		this.indexedFileItems = null;
		this.modelLocHash = [];
		this.currentFileIndex = 0;
		this.currentDetailIndex = -1;
		this._lineDelimiter = "\n"; 
		this.explorer = explorer;
	}
	SearchResultModel.prototype = new mExplorer.ExplorerModel(); 
	
	SearchResultModel.prototype.getRoot = function(onItem){
		onItem(this.root);
	};
	
	SearchResultModel.prototype.markUpSharedParent = function(parentMetaData, directChildMeta){
		if(!this.sharedParentHash[parentMetaData.Location]){
			this.sharedParentHash[parentMetaData.Location] = directChildMeta.Location;
			return;
		}
		var hashValue = this.sharedParentHash[parentMetaData.Location];
		if(typeof(hashValue) === "string"){
			if(hashValue !== directChildMeta.Location)
				this.sharedParentHash[parentMetaData.Location] = 2;
		}
	};
	
	SearchResultModel.prototype.preparecompressHash = function(){
		this.sharedParentHash = [];
		for(var i = 0 ; i < this._resultLocation.length; i++){
			var parents = this._resultLocation[i].metaData.Parents;
			if(parents.length === 0)
				continue;
			var diectChildMeta = this._resultLocation[i];
			for(var j = 0; j< parents.length; j++){
				var parentMeta = parents[j];
				this.markUpSharedParent(parentMeta, diectChildMeta);
				diectChildMeta = parentMeta;
			}
		}
	};

	SearchResultModel.prototype.compressParents = function(parents, currentIndex, newParents){
		if(parents.length === 0)
			return;
		if(currentIndex > (parents.length - 1))
			return;
		var newParentName = parents[currentIndex].Name;
		var location = parents[currentIndex].Location;
		var newIndex = currentIndex + 1;
		var stop = false;
		if(newIndex < parents.length){
			for(var j = currentIndex + 1; j < parents.length; j++){
				newIndex = j;
				if(this.sharedParentHash[parents[j].Location] === 2){
					break;
				} else {
					newParentName =  parents[j].Name + " / " + newParentName;
					if(j === (parents.length - 1))
						stop = true;
				}
			}
		}
		newParents.push({Location: location, Name:newParentName});
		if(!stop)
			this.compressParents(parents, newIndex, newParents);
	};
	
	SearchResultModel.prototype.compressTree = function(){
		for(var i = 0; i < this._resultLocation.length ; i++){
			if(!this._resultLocation[i].metaData) {
				continue;
			}
			var parents = this._resultLocation[i].metaData.Parents;
			if(parents.length === 0)
				continue;
			this.preparecompressHash();
			var newParents = [];
			this.compressParents(parents, 0, newParents);
			this._resultLocation[i].metaData.compressedParents = newParents;
		}
	};
	
	SearchResultModel.prototype._findExistingParent = function(parents, index){
		var parentLocation = parents[index].Location;
		var parentValue = this.modelLocHash[parentLocation];
		if(parentValue) {
			return {parent: parentValue, index: index};
		}
		if(index === (parents.length - 1)) {
			return null;
		}
		return this._findExistingParent(parents, index+1);
	};
	
	SearchResultModel.prototype.buildResultModelTree = function(onComplete, compress){
		if(compress)
			this.compressTree();
		for(var i = 0; i < this._resultLocation.length; i++){
			if(!this._resultLocation[i].metaData) {
				continue;
			}
			var parents;
			if(compress)
				parents = this._resultLocation[i].metaData.compressedParents;
			else
				parents = this._resultLocation[i].metaData.Parents;
			var existingParent = this._findExistingParent(parents, 0);
			var parentIndex, parent;
			if(existingParent){
				parent = existingParent.parent;
				parentIndex = existingParent.index;
			} else {
				parent = this.root;
				parentIndex = parents.length;
			}
			
			//add parents chain top down if needed
			if(parentIndex > 0){
				for(var j = parentIndex - 1; j > -1; j--){
					var parentNode = {parent: parent, children: [], type: "dir", name: parents[j].Name, location: parents[j].Location};
					parent.children.push(parentNode);
					mUtil.processSearchResultParent(parent);
					this.modelLocHash[parents[j].Location] = parentNode;
					parent = parentNode;
				}
			}
			
			//Add the search result (file) as leaf node
			var childNode = {parent: parent, type: "file", name: this._resultLocation[i].name, linkLocation: this._resultLocation[i].linkLocation, location: this._resultLocation[i].location};
			this.modelLocHash[childNode.location] = childNode;
			parent.children.push(childNode);
			mUtil.processSearchResultParent(parent);
		}
		
		this.prepareFileItems();
		onComplete();
	};
	
	SearchResultModel.prototype.loadOneFileMetaData =  function(index, onComplete){
		var item = this._resultLocation[index];
		this.fileClient.read(item.location, true).then(
			dojo.hitch(this, function(meta) {
				item.metaData = meta;
			    if(index === (this._resultLocation.length-1)){			 
					this.buildResultModelTree(onComplete, true); 
			    } else {
					this.loadOneFileMetaData(index+1, onComplete);
			    }
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: " + error.message);
				if(index === (this._resultLocation.length-1)){
					this.buildResultModelTree(onComplete, true); 
				} else {
					this.loadOneFileMetaData( index+1, onComplete);
				}
			})
		);
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
	};
	
	SearchResultModel.prototype.getFileItemIndex = function(fileItem){
		for(var i = 0; i < this.indexedFileItems.length; i++){
			if(fileItem === this.indexedFileItems[i]) {
				return i;
			}
		}
		return -1;
	};
	
	SearchResultModel.prototype.getFileDetailItemIndex = function(fileItemIndex, detailItem){
		if(fileItemIndex < 0) {
			return -1;
		}
		var fileItem = this.indexedFileItems[fileItemIndex];
		if(fileItem.children && fileItem.children.length > 0){
			for(var i = 0; i < fileItem.children.length ; i++){
				if(detailItem === fileItem.children[i]) {
					return i;
				}
			}
		}
		return -1;
	};
	
	SearchResultModel.prototype.walkTreeNode = function(currentNode){
		if(!currentNode.parent){
			currentNode.indexedName = "root";
		} else {
			currentNode.indexedName = currentNode.parent.indexedName + "-" + currentNode.name;
		}
		
		if(!currentNode.children){
			if(currentNode.type === "file") {
				this.indexedFileItems.push(currentNode);
			}
		} else {
			for (var i = 0; i < currentNode.children.length; i++ ){
				this.walkTreeNode(currentNode.children[i]);
			}
		}
	};
	
	SearchResultModel.prototype.getId = function(item){
		var result;
		if (item === this.root) {
			result = this.rootId;
		} else {
			result = item.location;
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
		if(found) {
			return result;
		}
		return null;
		
	};
	
	SearchResultModel.prototype.searchWithinFile = function( fileModelNode, fileContentText, searchStr){
		var fileContents = fileContentText.split(this._lineDelimiter);
		if(fileModelNode){
			fileModelNode.children = [];
			for(var i = 0; i < fileContents.length ; i++){
				var lineStringOrigin = fileContents[i];
				if(lineStringOrigin && lineStringOrigin.length > 0){
					var lineString = lineStringOrigin.toLowerCase();
					var result = this.searchOneline(lineString, searchStr);
					if(result){
						var lineNumber = i+1;
						var detailNode = {parent: fileModelNode, type: "detail",  name: lineNumber+ " : " + lineString, linkLocation: fileModelNode.linkLocation + "?line=" + lineNumber, location: fileModelNode.location + "-" + lineNumber};
						fileModelNode.children.push(detailNode);
					}
				}
			}
			fileModelNode.name = fileModelNode.name + " (" + fileModelNode.children.length + " matches)";
		}
	};
	
	SearchResultModel.prototype._fileExpanded = function(fileIndex, detailIndex){
		var filItem = this.indexedFileItems[fileIndex];
		if(filItem.children && filItem.children.length > 0){
			if(detailIndex > -2){
				if(detailIndex < 0) {
					detailIndex = 0;
				}
			} else {
				detailIndex = filItem.children.length -1;
			}
			return  {childrenNumber: filItem.children.length, childDiv: dojo.byId(this.getId(filItem.children[detailIndex])/*+"NameColumn"*/)};
		}
		return {childrenNumber: 0, childDiv: null};
	};
	
	SearchResultModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.type === "detail") {
			onComplete([]);
		} else if (parentItem.type === "file" && parentItem.location) {
			this.fileClient.read(parentItem.location).then(
					dojo.hitch(this, function(jsonData) {
						  this.searchWithinFile(parentItem, jsonData, this.searchStr);
						  var itemId = this.getId(parentItem);
						  var fileUIItem = dojo.byId(itemId);
						  if(fileUIItem){
							  var linkUIItem = dojo.byId(itemId + "NameColumn");
							  if(linkUIItem) {
								  dojo.place(document.createTextNode(parentItem.name), linkUIItem, "only");
							  }
						  }
						  onComplete(parentItem.children);
						  if(this.highlightSelectionLater){
							  if(parentItem === this.indexedFileItems[this.currentFileIndex]){
								  if(this.currentDetailIndex < -1) {
									  this.currentDetailIndex = parentItem.children.length -1;
								  }
								  var expanded = this._fileExpanded(this.currentFileIndex, this.currentDetailIndex);
								  dojo.toggleClass(expanded.childDiv, "currentSearchMatch", true);
								  if(!this.explorer.visible(expanded.childDiv)) {
									  expanded.childDiv.scrollIntoView(!this.lastNavDirection);
								  }
								  this.highlightSelectionLater = false;
							  }
						  }
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
	SearchResultRenderer.prototype = new mExplorer.SelectionRenderer();
	
	SearchResultRenderer.prototype.getCellHeaderElement = function(col_no){	
		if(col_no === 0){
			return dojo.create("th", {innerHTML: "<h2>Search Results</h2>"});
		}
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
					var that = this;
					dojo.connect(tableRow, "onclick", tableRow, function() {
						var fileItem = item.parent;
						var fileItemIndex = that.explorer.model.getFileItemIndex(fileItem);
						if(fileItemIndex > -1){
							var fileDetailItemIndex = that.explorer.model.getFileDetailItemIndex(fileItemIndex, item);
							if(fileDetailItemIndex > -1){
								if(that.explorer.model.currentFileIndex === fileItemIndex && that.explorer.model.currentDetailIndex === fileDetailItemIndex) {
									return;
								}
								var expanded = that.explorer.model._fileExpanded(that.explorer.model.currentFileIndex, that.explorer.model.currentDetailIndex);
								if(expanded.childDiv) {
									dojo.toggleClass(expanded.childDiv, "currentSearchMatch", false);
								}
								that.explorer.model.currentFileIndex = fileItemIndex;
								that.explorer.model.currentDetailIndex = fileDetailItemIndex;						
								expanded = that.explorer.model._fileExpanded(that.explorer.model.currentFileIndex, that.explorer.model.currentDetailIndex);
								dojo.toggleClass(expanded.childDiv, "currentSearchMatch", true);
							}
						}
					});
					dojo.create("img", {src: "/images/none.png", style: "vertical-align: middle"}, span, "last");
					dojo.create("img", {src: "/images/rightarrow.gif", style: "vertical-align: middle; margin-right: 4px"}, span, "last");
				}
				link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: href}, span, "last");
				dojo.place(document.createTextNode(item.name), link, "only");
			}
			return col;
		case 1:
			return this.getActionsColumn(item, tableRow);
		}
	};
	SearchResultRenderer.prototype.constructor = SearchResultRenderer;
	
	/**
	 * Creates a new search result explorer.
	 * @name orion.SearchResultExplorer
	 */
	function SearchResultExplorer(registry, commandService, resultLocation,  parentNode, searchStr){
		this.parentNode = parentNode;
		this.registry = registry;
		this._commandService = commandService;
		this.fileClient = new mFileClient.FileClient(this.registry);
		this.checkbox = false;
		this.renderer = new SearchResultRenderer({checkbox: false}, this);
		this.model = new SearchResultModel(registry, this.fileClient, resultLocation, searchStr, this);
		
	}
	SearchResultExplorer.prototype = new mExplorer.Explorer();
	
	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	SearchResultExplorer.prototype.onchange = function(item) {
	};
	
	SearchResultExplorer.prototype.initCommands = function(){	
		var that = this;
		var nextResultCommand = new mCommands.Command({
			name : "Next result",
			image : "/images/move_down.gif",
			id: "orion.search.nextResult",
			groupId: "orion.searchGroup",
			callback : function() {
				that.gotoNext(true);
		}});
		var prevResultCommand = new mCommands.Command({
			name : "Previous result",
			image : "/images/move_up.gif",
			id: "orion.search.prevResult",
			groupId: "orion.searchGroup",
			callback : function() {
				that.gotoNext(false);
		}});
		var expandAllCommand = new mCommands.Command({
			name : "Expand all results",
			image : "/images/add.gif",
			id: "orion.search.expandAll",
			groupId: "orion.searchGroup",
			callback : function() {
				that.expandAll();
		}});
		var collapseAllCommand = new mCommands.Command({
			name : "Collapse all results",
			image : "/images/delete.gif",
			id: "orion.search.collapseAll",
			groupId: "orion.searchGroup",
			callback : function() {
				that.collapseAll();
		}});
		this._commandService.addCommand(nextResultCommand, "dom");
		this._commandService.addCommand(prevResultCommand, "dom");
		this._commandService.addCommand(expandAllCommand, "dom");
		this._commandService.addCommand(collapseAllCommand, "dom");
			
		// Register command contributions
		this._commandService.registerCommandContribution("orion.search.nextResult", 1, "pageActionsRight");
		this._commandService.registerCommandContribution("orion.search.prevResult", 2, "pageActionsRight");
		this._commandService.registerCommandContribution("orion.search.expandAll", 3, "pageActionsRight");
		this._commandService.registerCommandContribution("orion.search.collapseAll", 4, "pageActionsRight");
		dojo.empty("pageActionsRight");
		this._commandService.renderCommands("pageActionsRight", "dom", that, that, "image");
	};
	
	SearchResultExplorer.prototype.startUp = function() {
		var that = this;
		this.model.loadOneFileMetaData(0, function(onComplete){
			that.createTree(that.parentNode, that.model);
			that.gotoNext(true);
		});
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
		if(node.type === "detail") {
			return;
		}
		this.myTree.expand(node);
		var children = node.children;
		if(children === undefined || children === null) {
			return;
		}
				
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
	};
	
	SearchResultExplorer.prototype._decideNext = function(next){
		var filItem = this.model.indexedFileItems[this.model.currentFileIndex];
		if(filItem.children && filItem.children.length > 0){
			if(this.model.currentDetailIndex < -1) {
				this.model.currentDetailIndex = filItem.children.length - 1;
			}
			var newDetailIndex, newFileIndex;
			if(next) {
				newDetailIndex = this.model.currentDetailIndex + 1;
			} else {
				newDetailIndex = this.model.currentDetailIndex - 1;
			}
			if(newDetailIndex < 0){
				newFileIndex = this.model.currentFileIndex -1;
				newDetailIndex = -100;
			} else if(newDetailIndex > ( filItem.children.length - 1) ){
				newFileIndex = this.model.currentFileIndex +1;
				newDetailIndex = 0;
			} else{
				newFileIndex = this.model.currentFileIndex;
			}
			
			if(newFileIndex < 0) {
				newFileIndex = this.model.indexedFileItems.length -1;
			} else if(newFileIndex > (this.model.indexedFileItems.length -1)) {
				newFileIndex = 0;
			}
			
			return {newFileIndex:newFileIndex, newDetailIndex:newDetailIndex};
		}
		return null;
	};

	SearchResultExplorer.prototype.visible = function(element) {
		if (element.offsetWidth === 0 || element.offsetHeight === 0) {
			return false;
		}
		var parentNode = dojo.byId("orion.innerSearchResults");
		var parentRect = parentNode.getClientRects()[0],
		rects = element.getClientRects(),
		on_top = function(r) {
			var x = (r.left + r.right)/2, y = (r.top + r.bottom)/2;
		    // document.elementFromPoint(x, y) === element; TODO: what is this ???
		};
		
		for (var i = 0, l = rects.length; i < l; i++) {
			var r = rects[i],
		    in_viewport = (r.top >= parentRect.top && r.top <= parentRect.bottom && r.bottom >= parentRect.top && r.bottom <= parentRect.bottom);
		    if (in_viewport /*&& on_top(r)*/) {
				return true;
		    }
		}
		return false;
	};
		
	SearchResultExplorer.prototype.gotoNext = function(next)	{
		var curentExpanded = this.model._fileExpanded(this.model.currentFileIndex, this.model.currentDetailIndex); 
		if(curentExpanded.childDiv /*&& this.model.currentDetailIndex > -1*/) {
			dojo.toggleClass(curentExpanded.childDiv, "currentSearchMatch", false);
		}
		var nextItem = this._decideNext(next);
		this.model.highlightSelectionLater = true;
		this.model.lastNavDirection = next;
		if(nextItem){
			var newExpanded = this.model._fileExpanded(nextItem.newFileIndex, nextItem.newDetailIndex); 
			this.model.currentFileIndex = nextItem.newFileIndex;
			this.model.currentDetailIndex = nextItem.newDetailIndex;
			if(newExpanded.childrenNumber > 0) {
				this.model.highlightSelectionLater = false;
			}
			if(newExpanded.childDiv)	{
				dojo.toggleClass(newExpanded.childDiv, "currentSearchMatch", true);
				if(!this.visible(newExpanded.childDiv)) {
					newExpanded.childDiv.scrollIntoView(!next);
				}
				return;
			}
		} else if(this.model.currentDetailIndex === -1){
			this.model.currentDetailIndex = 0;
		}
		var parentChain = [];
		var filItem = this.model.indexedFileItems[this.model.currentFileIndex];
		this.findUIParentChain(filItem, parentChain);
		for(var i = parentChain.length -1 ; i > -1 ; i--){
			this.myTree.expand(parentChain[i]);
		}
		if(!this.model.highlightSelectionLater){
			var expanded = this.model._fileExpanded(this.model.currentFileIndex, this.model.currentDetailIndex);
			dojo.toggleClass(expanded.childDiv, "currentSearchMatch", true);
			if(!this.visible(expanded.childDiv)) {
				expanded.childDiv.scrollIntoView(!next);
			}
		}
	};
	
	SearchResultExplorer.prototype.constructor = SearchResultExplorer;

	//return module exports
	return {
		SearchResultExplorer: SearchResultExplorer
	};
});
