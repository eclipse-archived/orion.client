/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console window*/
/*jslint regexp:false browser:true forin:true*/

define(['require', 'dojo', 'dijit','orion/explorer', 'orion/util', 'orion/fileClient', 'orion/commands', 'orion/searchUtils', 'orion/globalSearch/search-features', 'orion/compare/compare-features', 'orion/compare/compare-container'], 
		function(require, dojo, dijit, mExplorer, mUtil, mFileClient, mCommands, mSearchUtils, mSearchFeatures, mCompareFeatures, mCompareContainer) {

	function SearchResultModel(	serviceRegistry, fileClient, resultLocation, queryStr, explorer) {
		this.registry= serviceRegistry;
		this.fileClient = fileClient; 
		this._resultLocation = resultLocation;
		this._treeRoot = {
				built: false,
				isRoot: true,
				children:[]
		};
		this._listRoot = {
				built: false,
				isRoot: true,
				children:[]
		};
		this.currentDetail = null;
		this.indexedFileItems_tree = [];
		this.modelLocHash_tree = [];
		this.indexedFileItems_flat = [];
		this.modelLocHash_flat = [];
		this._lineDelimiter = "\n"; 
		this.explorer = explorer;
		this.queryObj = mSearchUtils.parseQueryStr(queryStr);
	}
	SearchResultModel.prototype = new mExplorer.ExplorerModel(); 
	
	SearchResultModel.prototype.getRealRoot = function(){
		if(this.useFlatList){
			return this._listRoot;
		} else {
			return this._treeRoot;
		}
	};
	
	SearchResultModel.prototype.modelLocHash = function(){
		if(this.useFlatList){
			return this.modelLocHash_flat;
		} else {
			return this.modelLocHash_tree;
		}
	};
	
	SearchResultModel.prototype.indexedFileItems = function(){
		if(this.useFlatList){
			return this.indexedFileItems_flat;
		} else {
			return this.indexedFileItems_tree;
		}
	};
	
	SearchResultModel.prototype.indexToLocation = function(index){
		var fileModel = this.indexedFileItems()[index];
		return fileModel.location;
	};
	
	SearchResultModel.prototype.locationToIndex = function(location, setCurrentIndex){
		var lookAt = this.indexedFileItems();
		for(var i = 0 ; i < lookAt.length; i++){
			if(lookAt[i].location == location){
				if(setCurrentIndex){
					this.currentFileIndex = i;
				}
				return i;
			}
		}
		if(setCurrentIndex){
			this.currentFileIndex = 0;
		}
		return 0;
	};
	
	SearchResultModel.prototype.setCurrent = function(currentFileIndex, currentDetailIndex) {
		this.currentFileIndex = currentFileIndex;
		this.currentDetailIndex = currentDetailIndex;
		this.storeStatus();
	};
	
	SearchResultModel.prototype.storeStatus = function() {
		window.sessionStorage["globa_search" + "_search_result_useFlatList"] = JSON.stringify(this.useFlatList);
		window.sessionStorage[this.queryObj.queryStr + "_search_result_currentFileLocation"] = this.indexToLocation(this.currentFileIndex);
		window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"] = JSON.stringify(this.currentDetailIndex);
	};
	
	SearchResultModel.prototype.restoreGlobalStatus = function() {
		this.useFlatList = true;
		var useFlatList = window.sessionStorage["globa_search" + "_search_result_useFlatList"];
		if (typeof useFlatList=== "string") {
			if (useFlatList.length > 0) {
				this.useFlatList= JSON.parse(useFlatList);
			} 
		}
		this.sortByName = (this.queryObj.sort.indexOf("Name") > -1);
	};
	
	SearchResultModel.prototype.restoreLocationStatus = function() {
		this.useFlatList = true;
		var useFlatList = window.sessionStorage["globa_search" + "_search_result_useFlatList"];
		if (typeof useFlatList=== "string") {
			if (useFlatList.length > 0) {
				this.useFlatList= JSON.parse(useFlatList);
			} 
		}
		this.currentFileIndex = 0;
		var currentFileLocation = window.sessionStorage[this.queryObj.queryStr + "_search_result_currentFileLocation"];
		if (typeof currentFileLocation=== "string") {
			if (currentFileLocation.length > 0) {
				this.currentFileIndex= this.locationToIndex(currentFileLocation);
			} 
		}
		this.currentDetailIndex = 0;
		var currentDetailIndex = window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"];
		if (typeof currentDetailIndex=== "string") {
			if (currentDetailIndex.length > 0) {
				this.currentDetailIndex= JSON.parse(currentDetailIndex);
			} 
		}
	};
	
	SearchResultModel.prototype.getRoot = function(onItem){
		onItem(this.getRealRoot());
	};
	
	SearchResultModel.prototype.markUpSharedParent = function(parentMetaData, directChildLocation){
		if(!this.sharedParentHash[parentMetaData.Location]){
			this.sharedParentHash[parentMetaData.Location] = directChildLocation;
			return;
		}
		var hashValue = this.sharedParentHash[parentMetaData.Location];
		if(typeof(hashValue) === "string"){
			if(hashValue !== directChildLocation)
				this.sharedParentHash[parentMetaData.Location] = 2;
		}
	};
	
	SearchResultModel.prototype.prepareCompressHash = function(){
		this.sharedParentHash = [];
		for(var i = 0 ; i < this._resultLocation.length; i++){
			var parents = this._resultLocation[i].metaData.Parents;
			if(parents.length === 0)
				continue;
			var diectChildLocation = this._resultLocation[i].location;
			for(var j = 0; j< parents.length; j++){
				var parentMeta = parents[j];
				this.markUpSharedParent(parentMeta, diectChildLocation);
				diectChildLocation = parentMeta.Location;
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
					newParentName =  parents[j].Name + "/" + newParentName;
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
			this.prepareCompressHash();
			var newParents = [];
			this.compressParents(parents, 0, newParents);
			this._resultLocation[i].metaData.compressedParents = newParents;
		}
	};
	
	SearchResultModel.prototype._findExistingParent = function(parents, index){
		var parentLocation = parents[index].Location;
		var parentValue = this.modelLocHash()[parentLocation];
		if(parentValue) {
			return {parent: parentValue, index: index};
		}
		if(index === (parents.length - 1)) {
			return null;
		}
		return this._findExistingParent(parents, index+1);
	};
	
	SearchResultModel.prototype.fullPathNameByTree = function(childNode, fullPath){
		if(!childNode || !childNode.parent){
			return;
		}
		if(childNode.parent.isRoot){
			return;
		}
		var separator = (fullPath.name === "") ? "" : "/";
		fullPath.name = childNode.parent.name + separator + fullPath.name;
		if(childNode.parent)
			this.fullPathNameByTree(childNode.parent, fullPath);
	};
	
	SearchResultModel.prototype.buildResultModel = function(onComplete){
		this.restoreGlobalStatus();
		var that = this;
		var callBack = function(){
			that.restoreLocationStatus();
			onComplete();
		};
		
		if(this.useFlatList){
			this.buildFlatModel(callBack);
		} else {
			this.buildTreeModel(true, callBack);
		}
	};
	
	SearchResultModel.prototype.buildTreeModel = function(compress, callback){
		if(this._treeRoot.built){
			callback();
			return;
		}
		this._treeRoot.built = true;
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
				parent = this._treeRoot;
				parentIndex = parents.length;
			}
			
			//add parents chain top down if needed
			if(parentIndex > 0){
				for(var j = parentIndex - 1; j > -1; j--){
					var parentNode = {parent: parent, children: [], type: "dir", name: parents[j].Name, location: parents[j].Location};
					parent.children.push(parentNode);
					this.modelLocHash_tree[parents[j].Location] = parentNode;
					parent = parentNode;
				}
			}
			
			//Add the search result (file) as leaf node
			var fullPath = {name: ""};
			var childNode = {parent: parent, type: "file", name: this._resultLocation[i].name, 
					linkLocation: this._resultLocation[i].linkLocation,
					location: this._resultLocation[i].location,
					stale: (this._resultLocation[i].lastModified !== this._resultLocation[i].metaData.LocalTimeStamp) };

			this.fullPathNameByTree(childNode, fullPath);
			childNode.fullPathName = fullPath.name;
			this.modelLocHash_tree[childNode.location] = childNode;
			parent.children.push(childNode);
		}
		this.indexedFileItems_tree = [];
		var tempList = [];
		this.prepareFileItems_tree(tempList);
		var that = this;
		this.checkStale(tempList, 0, function(list){
			for(var i=0; i < list.length; i++){
				if(!list[i].stale){
					that.indexedFileItems_tree.push(list[i]);
				}
			}
			callback();
		});
	};
	
	SearchResultModel.prototype.buildFlatModel = function(callback){
		if(this._listRoot.built){
			callback();
			return;
		}
		this._listRoot.built = true;
		this.indexedFileItems_flat = [];
		var tempList = [];
		for(var i = 0; i < this._resultLocation.length; i++){
			if(!this._resultLocation[i].metaData) {
				continue;
			}
			//Add the search result (file) as leaf node
			var childNode = {parent: this._listRoot, type: "file", name: this._resultLocation[i].name, 
					linkLocation: this._resultLocation[i].linkLocation, location: this._resultLocation[i].location, 
					stale: (this._resultLocation[i].lastModified !== this._resultLocation[i].metaData.LocalTimeStamp) };
			childNode.fullPathName = mSearchUtils.fullPathNameByMeta(this._resultLocation[i].metaData.Parents);
			childNode.parentLocation = this._resultLocation[i].metaData.Parents[0].Location;
			this.modelLocHash_flat[childNode.location] = childNode;
			this._listRoot.children.push(childNode);
			//this.indexedFileItems_flat.push(childNode);
			tempList.push(childNode);
		}
		var that = this;
		this.checkStale(tempList, 0, function(list){
			for(var i=0; i < list.length; i++){
				if(!list[i].stale){
					that.indexedFileItems_flat.push(list[i]);
				}
			}
			callback();
		});
		
	};
	
	SearchResultModel.prototype.checkStale = function(modelList, index, onComplete){
		var model = modelList[index];
		if(!model || index === modelList.length){
			onComplete(modelList);
			return;
		}
		if(!model.stale){
			this.checkStale(modelList, index+1, onComplete);
		} else {
			this.fileClient.read(model.location).then(
				dojo.hitch(this, function(contents) {
					if(this.hitOnceWithinFile(contents)){
						model.stale = false;
					}
					this.checkStale(modelList, index+1, onComplete);
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file contents: " + error.message);
					this.checkStale(modelList, index+1, onComplete);
				})
			);
		}
		
	};
	
	
	SearchResultModel.prototype.loadOneFileMetaData =  function(index, onComplete){
		var item = this._resultLocation[index];
		this.fileClient.read(item.location, true).then(
			dojo.hitch(this, function(meta) {
				item.metaData = meta;
			    if(index === (this._resultLocation.length-1)){			 
					this.buildResultModel(onComplete); 
			    } else {
					this.loadOneFileMetaData(index+1, onComplete);
			    }
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: " + error.message);
				if(index === (this._resultLocation.length-1)){
					this.buildResultModel(onComplete); 
				} else {
					this.loadOneFileMetaData( index+1, onComplete);
				}
			})
		);
	};

	SearchResultModel.prototype.prepareFileItems_tree = function(list){
		this.walkTreeNode(this._treeRoot, list);
	};
	
	SearchResultModel.prototype.getFileItemIndex = function(fileItem){
		for(var i = 0; i < this.indexedFileItems().length; i++){
			if(fileItem === this.indexedFileItems()[i]) {
				return i;
			}
		}
		return -1;
	};
	
	SearchResultModel.prototype.getFileDetailItemIndex = function(fileItemIndex, detailItem){
		if(fileItemIndex < 0) {
			return -1;
		}
		var fileItem = this.indexedFileItems()[fileItemIndex];
		if(fileItem.children && fileItem.children.length > 0){
			for(var i = 0; i < fileItem.children.length ; i++){
				if(detailItem === fileItem.children[i]) {
					return i;
				}
			}
		}
		return -1;
	};
	
	SearchResultModel.prototype.walkTreeNode = function(currentNode, list){
		if(!currentNode.children){
			if(currentNode.type === "file") {
				list.push(currentNode);
			}
		} else {
			for (var i = 0; i < currentNode.children.length; i++ ){
				this.walkTreeNode(currentNode.children[i], list);
			}
		}
	};
	
	SearchResultModel.prototype.getId = function(item){
		var result;
		if (item === this.getRealRoot()) {
			result = this.rootId;
		} else {
			result = item.location;
			// remove all non valid chars to make a dom id. 
			result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
		} 
		return result;
	};
	
	/**
	 * Helper for finding regex matches in text contents.
	 * 
	 * @param {String}
	 *            pattern A valid regexp pattern.
	 * @param {String}
	 *            flags Valid regexp flags: [is]
	 * @param {Number}
	 *            [startIndex] Default is false.
	 * @return {Object} An object giving the match details, or
	 *         <code>null</code> if no match found. The
	 *         returned object will have the properties:<br />
	 *         {Number} index<br />
	 *         {Number} length
	 */
	SearchResultModel.prototype._findRegExp =  function(text, pattern, flags, startIndex) {
		if (!pattern) {
			return null;
		}
		flags = flags || "";
		// 'g' makes exec() iterate all matches, 'm' makes ^$
		// work linewise
		flags += (flags.indexOf("g") === -1 ? "g" : "")
				+ (flags.indexOf("m") === -1 ? "m" : "");
		var regexp = new RegExp(pattern, flags);
		var result = null, match = null;
		result = regexp.exec(text.substring(startIndex));
		return result && {
			startIndex : result.index + startIndex,
			length : result[0].length
		};
	};
	
	SearchResultModel.prototype.searchOnelineLiteral =  function(lineString, searchStr, onlyOnce){
		var i,startIndex = 0;
		var found = false;
		var result = [];
		while(true){
			i = lineString.indexOf(searchStr, startIndex);
			if (i < 0) {
				break;
			} else {
				result.push({startIndex: i});
				found = true;
				if(onlyOnce){
					break;
				}
				startIndex = i + this.queryObj.inFileQuery.searchStrLength;
			}
		}
		if(found) {
			return result;
		}
		return null;
		
	};
	
	SearchResultModel.prototype.searchOnelineRegEx =  function(lineString, onlyOnce){
		var i,startIndex = 0;
		var found = false;
		var result = [];
		while(true){
			var regExResult = this._findRegExp(lineString, this.queryObj.inFileQuery.regExp.pattern, this.queryObj.inFileQuery.regExp.flags, startIndex);
			if(regExResult){
				result.push(regExResult);
				found = true;
				if(onlyOnce){
					break;
				}
				startIndex = regExResult.startIndex + regExResult.length;
			} else {
				break;
			}
		}
		if(found) {
			return result;
		}
		return null;
	};
	
	SearchResultModel.prototype.hitOnceWithinFile = function( fileContentText){
		var lineString = fileContentText.toLowerCase();
		var result;
		if(this.queryObj.inFileQuery.wildCard){
			result = this.searchOnelineRegEx(lineString, true);
		} else {
			result = this.searchOnelineLiteral(lineString, this.queryObj.inFileQuery.searchStr, true);
		}
		return result;
	};
	
	SearchResultModel.prototype.generateNewContents = function( fileModelNode, replaceStr){
		if(fileModelNode){
			var fileContents = fileModelNode.contents;
			fileModelNode.newContents = [];
			for(var i = 0; i < fileContents.length ; i++){
				var lineStringOrigin = fileContents[i];
				var changingLine = false;
				for(var j = 0; j < fileModelNode.children.length; j++){
					var lnumber = fileModelNode.children[j].lineNumber - 1;
					if(lnumber === i){
						changingLine = true;
						break;
					}
				}
				if(changingLine){
					var newStr;
					if(this.queryObj.inFileQuery.wildCard){
						newStr = mSearchUtils.replaceRegEx(lineStringOrigin, this.queryObj.inFileQuery.regExp, replaceStr);
					} else {
						newStr = mSearchUtils.replaceStringLiteral(lineStringOrigin, this.queryObj.inFileQuery.searchStr, replaceStr);
					}
					fileModelNode.newContents.push(newStr);
				} else {
					fileModelNode.newContents.push(lineStringOrigin);
				}
			}
		}
	};
	
	SearchResultModel.prototype.searchWithinFile = function( fileModelNode, fileContentText){
		var fileContents = fileContentText.split(this._lineDelimiter);
		fileModelNode.contents = fileContents;
		if(fileModelNode){
			fileModelNode.children = [];
			var totalMatches = 0;
			for(var i = 0; i < fileContents.length ; i++){
				var lineStringOrigin = fileContents[i];
				if(lineStringOrigin && lineStringOrigin.length > 0){
					var lineString = lineStringOrigin.toLowerCase();
					var result;
					if(this.queryObj.inFileQuery.wildCard){
						result = this.searchOnelineRegEx(lineString);
					} else {
						result = this.searchOnelineLiteral(lineString, this.queryObj.inFileQuery.searchStr);
					}
					if(result){
						var lineNumber = i+1;
						var detailNode = {parent: fileModelNode, type: "detail", matches: result, lineNumber: lineNumber, name: lineStringOrigin, linkLocation: fileModelNode.linkLocation + "?line=" + lineNumber, location: fileModelNode.location + "-" + lineNumber};
						fileModelNode.children.push(detailNode);
						totalMatches += result.length;
					}
				}
			}
			fileModelNode.name = fileModelNode.name + " (" + totalMatches + " matches)";
		}
	};
	
	SearchResultModel.prototype._fileExpanded = function(fileIndex, detailIndex){
		var filItem = this.indexedFileItems()[fileIndex];
		if(filItem.children && filItem.children.length > 0){
			if(detailIndex < 0){
				detailIndex = filItem.children.length -1;
			} else if (detailIndex >= filItem.children.length){
				detailIndex = 0;
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
						  this.searchWithinFile(parentItem, jsonData);
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
							  if(parentItem === this.indexedFileItems()[this.currentFileIndex]){
								  if(this.currentDetailIndex < 0) {
									  this.currentDetailIndex = parentItem.children.length -1;
								  } else if (this.currentDetailIndex >= parentItem.children.length){
									  this.currentDetailIndex = 0;
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
		} else if(this.explorer.model.useFlatList && col_no === 1){
			return dojo.create("th", {innerHTML: "<h2>Location</h2>"});
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
					if(item.stale){
						var icon = dojo.create("span", null, span, "last");
						dojo.addClass(icon, "imageSprite");
						dojo.addClass(icon, "core-sprite-none");
						icon = dojo.create("span", null, span, "last");
						dojo.addClass(icon, "imageSprite");
						dojo.addClass(icon, "core-sprite-file");
						dojo.place(document.createTextNode(item.name), span, "last");
						
					} else {
						this.getExpandImage(tableRow, span, "core-sprite-file");
						link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: href}, span, "last");
						dojo.place(document.createTextNode(item.name), link, "only");
					}
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
								that.explorer.model.setCurrent(fileItemIndex, fileDetailItemIndex);
								expanded = that.explorer.model._fileExpanded(that.explorer.model.currentFileIndex, that.explorer.model.currentDetailIndex);
								dojo.toggleClass(expanded.childDiv, "currentSearchMatch", true);
							}
						}
					});
					var icon = dojo.create("span", null, span, "last");
					dojo.addClass(icon, "imageSprite");
					dojo.addClass(icon, "core-sprite-none");
					icon = dojo.create("span", null, span, "last");
					dojo.addClass(icon, "imageSprite");
					dojo.addClass(icon, "core-sprite-rightarrow");
					
					link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: href}, span, "last");
					var linkSpan = dojo.create("span", null, link, "only");
					dojo.place(document.createTextNode(item.lineNumber + " : "), linkSpan, "last");
					var startIndex = 0;
					var gap = this.explorer.model.queryObj.inFileQuery.searchStrLength;
					for(var i = 0; i < item.matches.length; i++){
						if(startIndex >= item.name.length)
							break;
						if(startIndex !== item.matches[i].startIndex){
							dojo.place(document.createTextNode(item.name.substring(startIndex, item.matches[i].startIndex)), linkSpan, "last");
						}
						var matchSegBold = dojo.create("b", null, linkSpan, "last");
						if(this.explorer.model.queryObj.inFileQuery.wildCard){
							gap = item.matches[i].length;
						}
						dojo.place(document.createTextNode(item.name.substring(item.matches[i].startIndex, item.matches[i].startIndex + gap)), matchSegBold, "only");
						startIndex = item.matches[i].startIndex + gap;
					}
					if(startIndex < (item.name.length - 1)){
						dojo.place(document.createTextNode(item.name.substring(startIndex)), linkSpan, "last");
					}
				}
			}
			return col;
		case 1:
			if(this.explorer.model.useFlatList && item.type ===  "file"){
				col = document.createElement('td');
				span = dojo.create("span", null, col, "only");
				var qParams = mSearchUtils.copyQueryParams(this.explorer.model.queryObj);
				qParams.location = item.parentLocation;
				qParams.start = 0;
				var href =  mSearchUtils.generateSearchHref(qParams);
				link = dojo.create("a", {className: "navlink", id: tableRow.id+"LocationColumn", href: href}, span, "last");
				link.title = "Search again in this folder with \"" + this.explorer.model.queryObj.searchStrTitle + "\"";
				dojo.place(document.createTextNode(item.fullPathName), link, "only");
				return col;
			}
		}
	};
	SearchResultRenderer.prototype.constructor = SearchResultRenderer;
	
	/**
	 * Creates a new search result explorer.
	 * @name orion.SearchResultExplorer
	 */
	function SearchResultExplorer(registry, commandService, resultLocation,  parentNode, queryStr, totalNumber){
		this.parentNode = parentNode;
		this.registry = registry;
		this._commandService = commandService;
		this.fileClient = new mFileClient.FileClient(this.registry);
		this.checkbox = false;
		this.renderer = new SearchResultRenderer({checkbox: false}, this);
		this.totalNumber = totalNumber;
		this.numberOnPage = resultLocation.length;
		this.queryStr = queryStr;
		this.model = new SearchResultModel(registry, this.fileClient, resultLocation, queryStr, this);
		this.declareCommands();
	}
	SearchResultExplorer.prototype = new mExplorer.Explorer();
	
	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	SearchResultExplorer.prototype.onchange = function(item) {
	};
	
	/* one-time setup of commands */
	SearchResultExplorer.prototype.declareCommands = function() {
		var that = this;
		// page actions for search
		
		var saveresultsCommand = new mCommands.Command({
			name: "Save Search",
			tooltip: "Save query to search favorites",
			id: "orion.saveSearchResults",
			callback: function(data) {
				that.saveSearch(that.queryStr);
			}
		});
	
		var replaceAllCommand = new mCommands.Command({
			name: "Replace With",
			tooltip: "Replace all matches with",
			id: "orion.globalSearch.replaceAll",
			callback: function(data) {
				that.replaceAll();
			}
		});
	
		this._commandService.addCommand(saveresultsCommand, "dom");
		//this._commandService.addCommand(replaceAllCommand, "dom");
		this._commandService.addCommandGroup("orion.searchActions.unlabeled", 200, null, null, "pageActions");
		this._commandService.registerCommandContribution("orion.saveSearchResults", 1, "pageActions", "orion.searchActions.unlabeled");
		//this._commandService.registerCommandContribution("orion.globalSearch.replaceAll", 2, "pageActions", "orion.searchActions.unlabeled");

		var previousPage = new mCommands.Command({
			name : "< Previous Page",
			tooltip: "Show previous page of search result",
			id : "orion.search.prevPage",
			hrefCallback : function() {
				var prevPage = that.caculatePrevPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				var qParams = mSearchUtils.copyQueryParams(that.model.queryObj);
				qParams.start = prevPage.start;
				return mSearchUtils.generateSearchHref(qParams);
			},
			visibleWhen : function(item) {
				var prevPage = that.caculatePrevPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				return (prevPage.start !== that.model.queryObj.start);
			}
		});
		var nextPage = new mCommands.Command({
			name : "Next Page >",
			tooltip: "Show next page of search result",
			id : "orion.search.nextPage",
			hrefCallback : function() {
				var nextPage = that.caculateNextPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				var qParams = mSearchUtils.copyQueryParams(that.model.queryObj);
				qParams.start = nextPage.start;
				return mSearchUtils.generateSearchHref(qParams);
			},
			visibleWhen : function(item) {
				var nextPage = that.caculateNextPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				return (nextPage.start !== that.model.queryObj.start);
			}
		});
		var nextResultCommand = new mCommands.Command({
			name : "Next result",
			imageClass : "core-sprite-move_down",
			id: "orion.search.nextResult",
			groupId: "orion.searchGroup",
			callback : function() {
				that.gotoNext(true, true);
		}});
		var prevResultCommand = new mCommands.Command({
			name : "Previous result",
			imageClass : "core-sprite-move_up",
			id: "orion.search.prevResult",
			groupId: "orion.searchGroup",
			callback : function() {
				that.gotoNext(false, true);
		}});
		var expandAllCommand = new mCommands.Command({
			name : "Expand all results",
			imageClass : "core-sprite-expandAll",
			id: "orion.search.expandAll",
			groupId: "orion.searchGroup",
			callback : function() {
				that.expandAll();
		}});
		var collapseAllCommand = new mCommands.Command({
			name : "Collapse all results",
			imageClass : "core-sprite-collapseAll",
			id: "orion.search.collapseAll",
			groupId: "orion.searchGroup",
			callback : function() {
				that.collapseAll();
		}});
		this._commandService.addCommand(previousPage, "dom");
		this._commandService.addCommand(nextPage, "dom");
		this._commandService.addCommand(nextResultCommand, "dom");
		this._commandService.addCommand(prevResultCommand, "dom");
		this._commandService.addCommand(expandAllCommand, "dom");
		this._commandService.addCommand(collapseAllCommand, "dom");
			
		// Register command contributions
		this._commandService.registerCommandContribution("orion.search.nextResult", 1, "pageNavigationActions");
		this._commandService.registerCommandContribution("orion.search.prevResult", 2, "pageNavigationActions");
		this._commandService.registerCommandContribution("orion.search.expandAll", 3, "pageNavigationActions");
		this._commandService.registerCommandContribution("orion.search.collapseAll", 4, "pageNavigationActions");
		this._commandService.registerCommandContribution("orion.search.prevPage", 5, "pageNavigationActions");
		this._commandService.registerCommandContribution("orion.search.nextPage", 6, "pageNavigationActions");
	};
	
	SearchResultExplorer.prototype.replaceAll = function() {
		dojo.empty("results");
		var uiFactory = new mSearchFeatures.SearchUIFactory({
			parentDivID: "results"
		});
		uiFactory.buildUI();
		var parentPane = dijit.byId("orion.innerSearchResults");
		if(parentPane.isLeftPaneOpen()){
			parentPane.toggle();
		}
		this.previewMode = true;
		this.renderer = new SearchResultRenderer({checkbox: true}, this);
		this.createTree(uiFactory.getMatchDivID(), this.model);
		this.gotoCurrent();
		this.buildPreview(uiFactory);
	};
	
	SearchResultExplorer.prototype.buildPreview = function(uiFactory) {
		var filItem = this.model.indexedFileItems()[this.model.currentFileIndex];
		this.model.generateNewContents(filItem, this.replaceStrDiv.value);
		
		var uiFactoryCompare = new mCompareFeatures.TwoWayCompareUIFactory({
			parentDivID: uiFactory.getCompareDivID(),
			showTitle: false,
			showLineStatus: false
		});
		uiFactoryCompare.buildUI();

		// Diff operations

		var options = {
			readonly: true,
			hasConflicts: false,
			baseFileContent: filItem.contents.join(this.model._lineDelimiter),
			newFileContent: filItem.newContents.join(this.model._lineDelimiter)
		};
		
		var twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(this.registry, uiFactoryCompare, options);
		twoWayCompareContainer.startup();
		return;
	};
	
	
	SearchResultExplorer.prototype.addFavorite = function(favoriteName, query) {
		this.registry.getService("orion.core.favorite").addFavoriteSearch(favoriteName, query);
	};
	
	SearchResultExplorer.prototype.saveSearch = function(query) {
		var queryObj = mSearchUtils.parseQueryStr(query);
		var qName = query;
		if(queryObj && typeof(queryObj.searchStrTitle) === "string" && typeof(queryObj.location) === "string" ){
			qName = "\'" + queryObj.searchStrTitle + "\' in ";// +queryObj.location;
			if(queryObj.location.length > 0){
				this.fileClient.read(queryObj.location, true).then(
					dojo.hitch(this, function(meta) {
						var parentName = mSearchUtils.fullPathNameByMeta(meta.Parents);
						var fullName = parentName.length === 0 ? meta.Name: parentName + "/" + meta.Name;
						this.addFavorite(qName + fullName, query);
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file meta data: " + error.message);
						this.addFavorite(qName + "root", query);
					})
				);
			} else {
				this.addFavorite(qName + "root", query);
			}
		} else {
			this.addFavorite(qName, query);
		}
	};
	
	SearchResultExplorer.prototype.caculateNextPage = function(currentStart, pageSize, totalNumber){
		if((currentStart + pageSize) >= totalNumber){
			return {start:currentStart};
		}
		return {start: currentStart+pageSize};
	};
	
	SearchResultExplorer.prototype.caculatePrevPage = function(currentStart, pageSize, totalNumber){
		var start = currentStart - pageSize;
		if(start < 0){
			start = 0;
		}
		return {start: start};
	};
	
	SearchResultExplorer.prototype.initCommands = function(){	
		var that = this;
		dojo.empty("pageActions");
		this._commandService.renderCommands("pageActions", "dom", that, that, "tool");
		//this.replaceStrDiv= dojo.create("input", {type: "search", id: "replaceString", placeholder: "replace text", title:"Type a text to replace all with"}, "pageActions", "last");
		//dojo.addClass(this.replaceStrDiv, "searchbox");
		dojo.empty("pageNavigationActions");
		this._commandService.renderCommands("pageNavigationActions", "dom", that, that, "tool");
		
		var optionMenu = dijit.byId("globalSearchOptMenu");
		if (optionMenu) {
			optionMenu.destroy();
		}
		var newMenu = new dijit.Menu({
			style : "display: none;",
			id : "globalSearchOptMenu"
		});
		
		newMenu.addChild(new dijit.CheckedMenuItem({
			label: "Show as Tree",
			checked: !that.model.useFlatList,
			onChange : function(checked) {
				that.switchTo(!checked);
			}
		}));
		
		newMenu.addChild(new dijit.CheckedMenuItem({
			label: "Sort by Name",
			checked: that.model.sortByName,
			onChange : function(checked) {
				that.sortWithName(checked);
			}
		}));
		var menuButton = new dijit.form.DropDownButton({
			label : "Options",
			dropDown : newMenu
		});
		dojo.addClass(menuButton.domNode, "commandImage");
		dojo.place(menuButton.domNode, "pageNavigationActions", "last");
		
		
	};
	
	SearchResultExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message);	
	};
	
	SearchResultExplorer.prototype.startUp = function() {
		var that = this;
		var pageTitle = dojo.byId("pageTitle");
		if(pageTitle && this.model.queryObj.searchStrTitle){
			if(this.numberOnPage < 1){
				pageTitle.innerHTML = "<b>" + "No matches" + "</b>" +
				" found by keyword " + "<b>" + this.model.queryObj.searchStrTitle + "</b>" + " in:";
				return;
			} else {
				this.reportStatus("Generating search result...");	
				var startNumber = this.model.queryObj.start + 1;
				var endNumber = startNumber + this.numberOnPage - 1;
				pageTitle.innerHTML = "Files " + "<b>" + startNumber + "-"  + endNumber + "</b>" + " of " + this.totalNumber + 
				" found by keyword " + "<b>" + this.model.queryObj.searchStrTitle + "</b>" + " in:";
			}
		}
		
		this.model.loadOneFileMetaData(0, function(onComplete){
			that.initCommands();
			that.createTree(that.parentNode, that.model);
			that.gotoCurrent();
			that.reportStatus("");	
		});
	};
	
	SearchResultExplorer.prototype.switchTo = function(flatList) {
		if(this.model.useFlatList === flatList){
			return;
		}
		var currentFileLocation = this.model.indexToLocation(this.model.currentFileIndex);
		this.model.useFlatList = flatList;
		
		var that = this;
		var callBack = function(){
			that.model.locationToIndex(currentFileLocation, true);
			that.model.storeStatus();
			that.createTree(that.parentNode, that.model);
			that.gotoCurrent();
		};
		
		if(this.model.useFlatList){
			this.model.buildFlatModel(callBack);
		} else {
			this.model.buildTreeModel(true, callBack);
		}
	};
	
	SearchResultExplorer.prototype.sortWithName = function(byName) {
		if(this.model.sortByName === byName){
			return;
		}
		var qParams = mSearchUtils.copyQueryParams(this.model.queryObj);
		qParams.sort = byName ? "Name asc" : "Path asc";
		qParams.start = 0;
		var href =  mSearchUtils.generateSearchHref(qParams);
		window.location.href = href;
	};
	
	SearchResultExplorer.prototype.expandAll = function() {
		var root = this.model.getRealRoot();
		if(root.isRoot){
			for (var i = 0; i < root.children.length ; i++){
				this.expandRecursively(root.children[i]);
			}
		} else {
			this.expandRecursively(root);
		}
		this.gotoCurrent();
	};
	
	SearchResultExplorer.prototype.collapseAll = function() {
		var root = this.model.getRealRoot();
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
	
	SearchResultExplorer.prototype._decideNext = function(next, calculateNext){
		if(!calculateNext){
			return {newFileIndex:this.model.currentFileIndex, newDetailIndex:this.model.currentDetailIndex};
		}
		
		var filItem = this.model.indexedFileItems()[this.model.currentFileIndex];
		if(filItem.children && filItem.children.length > 0){
			var newDetailIndex, newFileIndex;
			if(next) {
				newDetailIndex = this.model.currentDetailIndex + 1;
			} else {
				newDetailIndex = this.model.currentDetailIndex - 1;
			}
			if(newDetailIndex < 0){
				newFileIndex = this.model.currentFileIndex -1;
				newDetailIndex = -1;
			} else if(newDetailIndex > ( filItem.children.length - 1) ){
				newFileIndex = this.model.currentFileIndex +1;
				newDetailIndex = 0;
			} else{
				newFileIndex = this.model.currentFileIndex;
			}
			
			if(newFileIndex < 0) {
				newFileIndex = this.model.indexedFileItems().length -1;
			} else if(newFileIndex >= this.model.indexedFileItems().length) {
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
		
	SearchResultExplorer.prototype.gotoCurrent = function()	{
		this.gotoNext(true, false);
	};
	
	SearchResultExplorer.prototype.gotoNext = function(next, calculateNext)	{
		if(this.model.indexedFileItems().length === 0){
			return;
		}
		var curentExpanded = this.model._fileExpanded(this.model.currentFileIndex, this.model.currentDetailIndex); 
		if(curentExpanded.childDiv) {
			dojo.toggleClass(curentExpanded.childDiv, "currentSearchMatch", false);
		}
		var nextItem = this._decideNext(next, calculateNext);
		this.model.highlightSelectionLater = true;
		this.model.lastNavDirection = next;
		if(nextItem){
			var newExpanded = this.model._fileExpanded(nextItem.newFileIndex, nextItem.newDetailIndex); 
			this.model.setCurrent(nextItem.newFileIndex, nextItem.newDetailIndex);
			if(newExpanded.childrenNumber > 0) {
				this.model.highlightSelectionLater = false;
				if(nextItem.newDetailIndex < 0 ){
					this.model.setCurrent(nextItem.newFileIndex, newExpanded.childrenNumber - 1);
				} else if(nextItem.newDetailIndex >= newExpanded.childrenNumber){
					this.model.setCurrent(nextItem.newFileIndex, 0);
				}
			}
			if(newExpanded.childDiv)	{
				dojo.toggleClass(newExpanded.childDiv, "currentSearchMatch", true);
				if(!this.visible(newExpanded.childDiv)) {
					newExpanded.childDiv.scrollIntoView(!next);
				}
				return;
			}
		} 
		var parentChain = [];
		var filItem = this.model.indexedFileItems()[this.model.currentFileIndex];
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
