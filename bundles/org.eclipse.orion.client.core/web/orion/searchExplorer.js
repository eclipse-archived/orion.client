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
			if(lookAt[i].location === location){
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
	
	SearchResultModel.prototype.setCurrent = function(currentFileIndex, currentDetailIndex, storeStatus) {
		this.currentFileIndex = currentFileIndex;
		this.currentDetailIndex = currentDetailIndex;
		if(storeStatus){
			this.storeStatus();
		}
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
			var childNode = {parent: this._listRoot, type: "file", name: this._resultLocation[i].name, ETag: this._resultLocation[i].metaData.ETag,
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
	
	
	SearchResultModel.prototype.generateRepalceModel = function(replaceStr, modelList, index, onComplete){
		var model = modelList[index];
		if(!model || index === modelList.length){
			onComplete(modelList);
			return;
		}
		if(model.children){
			this.generateNewContents(model, replaceStr);
			this.generateRepalceModel(replaceStr, modelList, index+1, onComplete);
		} else {
			this.fileClient.read(model.location).then(
				dojo.hitch(this, function(contents) {
					this.searchWithinFile(model, contents);
					this.generateNewContents(model, replaceStr);
					this.generateRepalceModel(replaceStr, modelList, index+1, onComplete);
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file contents: " + error.message);
					this.generateRepalceModel(replaceStr, modelList, index+1, onComplete);
				})
			);
		}
		
	};
	
	SearchResultModel.prototype.matchesReplaced = function(model){
		var matchesReplaced = 0;
		if(model.children){
			for(var j = 0; j < model.children.length; j++){
				if(!(model.children[j].checked === false)){
					matchesReplaced += model.children[j].matches.length;
				}
			}
		}
		return matchesReplaced;
	};
	
	SearchResultModel.prototype.writeNewContent = function(modelList, reportList,  index, onComplete){
		var model = modelList[index];
		if(!model || index === modelList.length){
			onComplete(modelList);
			return;
		}
		var matchesReplaced = this.matchesReplaced(model);
		if(matchesReplaced > 0){
			var contents = model.newContents.join(this._lineDelimiter);
			var etag = model.ETag;
			var args = { "ETag" : etag };
			this.fileClient.write(model.location, contents, args).then(
					dojo.hitch(this, function(result) {
						reportList.push({model: model, matchesReplaced: matchesReplaced, status: "pass" });
						this.writeNewContent( modelList, reportList, index+1, onComplete);
					}),
					dojo.hitch(this, function(error) {
						// expected error - HTTP 412 Precondition Failed 
						// occurs when file is out of sync with the server
						if (error.status === 412) {
							var forceSave = confirm("Resource is out of sync with the server. Do you want to save it anyway?");
							if (forceSave) {
								// repeat save operation, but without ETag 
								this.fileClient.write(model.location, contents).then(
										dojo.hitch(this, function(result) {
											reportList.push({model: model, matchesReplaced: matchesReplaced, status: "pass" });
										}));
							}
							reportList.push({model: model, matchesReplaced: matchesReplaced, status: "warning" });
						}
						// unknown error
						else {
							error.log = true;
							reportList.push({model: model, matchesReplaced: matchesReplaced, status: "failed" });
						}
						this.writeNewContent( modelList, reportList, index+1, onComplete);
					})
			);
		} else {
			this.writeNewContent( modelList, reportList, index+1, onComplete);
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
	
	SearchResultModel.prototype.generateNewContents = function( fileModelNode, replaceStr, forceGenerate){
		if(fileModelNode){
			var fileContents = fileModelNode.contents;
			var updating;
			if(fileModelNode.newContents && !forceGenerate){
				updating = true;
			} else {
				updating = false;
				fileModelNode.newContents = [];
			}
			for(var i = 0; i < fileContents.length ; i++){
				var lineStringOrigin = fileContents[i];
				var changingLine = false;
				var checked = true;
				for(var j = 0; j < fileModelNode.children.length; j++){
					var lnumber = fileModelNode.children[j].lineNumber - 1;
					if(lnumber === i){
						checked = fileModelNode.children[j].checked;
						changingLine = true;
						break;
					}
				}
				if(changingLine){
					var newStr;
					if(checked === false){
						newStr = lineStringOrigin;
					} else if (this.queryObj.inFileQuery.wildCard){
						newStr = mSearchUtils.replaceRegEx(lineStringOrigin, this.queryObj.inFileQuery.regExp, replaceStr);
					} else {
						newStr = mSearchUtils.replaceStringLiteral(lineStringOrigin, this.queryObj.inFileQuery.searchStr, replaceStr);
					}
					if(updating){
						fileModelNode.newContents[i] = newStr;
					} else {
						fileModelNode.newContents.push(newStr);
					}
				} else if(!updating){
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
						var detailNode = {parent: fileModelNode, checked: fileModelNode.checked, type: "detail", matches: result, lineNumber: lineNumber, name: lineStringOrigin, linkLocation: fileModelNode.linkLocation + "?line=" + lineNumber, location: fileModelNode.location + "-" + lineNumber};
						fileModelNode.children.push(detailNode);
						totalMatches += result.length;
					}
				}
			}
			fileModelNode.totalMatches = totalMatches;
		}
	};
	
	SearchResultModel.prototype._fileExpanded = function(fileIndex, detailIndex){
		var filItem = this.indexedFileItems()[fileIndex];
		if(detailIndex === null || detailIndex === undefined){
			return {childrenNumber: 0, childDiv: dojo.byId(this.getId(filItem))};
		}
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
								  var renderName = parentItem.totalMatches ? parentItem.name + " (" + parentItem.totalMatches + " matches)" : parentItem.name;
								  dojo.place(document.createTextNode(renderName), linkUIItem, "only");
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
	
	SearchResultRenderer.prototype.initCheckboxColumn = function(tableNode){	
		if (this._useCheckboxSelection) {
			var th = document.createElement('th');
			var check = document.createElement("span");
			dojo.addClass(check, "selectionCheckmark");
			if(this.getCheckedFunc){
				check.checked = this.getCheckedFunc(this.explorer.model.getRealRoot());
				dojo.toggleClass(check, "selectionCheckmarkChecked", check.checked);
			}
			th.appendChild(check);
			dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
				var newValue = evt.target.checked ? false : true;
				this.onCheck(null, evt.target, newValue);
			}));
			return th;
		}
	};
	
	SearchResultRenderer.prototype.getCellHeaderElement = function(col_no){	
		if(col_no === 0){
			if(this.explorer._state === "result_view"){
				return dojo.create("th", {innerHTML: "<h2> Search results</h2>"});
			} else {
				var headerStr =" Matches to be replaced by \"" + this.explorer._replaceStr + "\"";
				var th = dojo.create("th", {});
				return dojo.create("h2", {innerHTML: headerStr});
			}
		} else if(this.explorer.model.useFlatList && col_no === 1){
			return dojo.create("th", {innerHTML: "<h2>Location</h2>"});
		}
	};
	
	
	SearchResultRenderer.prototype.deselectElement = function(){
		var expanded = this.explorer.model._fileExpanded(this.explorer.model.currentFileIndex, this.explorer.model.currentDetailIndex);
		if(expanded.childDiv) {
			dojo.toggleClass(expanded.childDiv, "currentSearchMatch", false);
		}
	};
	
	SearchResultRenderer.prototype.selectElement = function(item, storeStatus){
		if(item.type === "file"){
			var fileItemIndex = this.explorer.model.getFileItemIndex(item);
			if(!(fileItemIndex === this.explorer.model.currentFileIndex && this.explorer.model.currentDetailIndex === null)){
				this.deselectElement();
				this.explorer.model.setCurrent(fileItemIndex, null, storeStatus);
				dojo.toggleClass(this.explorer.model.getId(item), "currentSearchMatch", true);
				this.explorer.buildPreview();
			}
		} else {
			var fileItem = item.parent;
			var fileItemIndex = this.explorer.model.getFileItemIndex(fileItem);
			if(fileItemIndex > -1){
				var fileDetailItemIndex = this.explorer.model.getFileDetailItemIndex(fileItemIndex, item);
				if(this.explorer.model.currentFileIndex === fileItemIndex && this.explorer.model.currentDetailIndex === fileDetailItemIndex) {
					return;
				}
				this.deselectElement();
				this.explorer.model.setCurrent(fileItemIndex, fileDetailItemIndex);
				dojo.toggleClass(this.explorer.model.getId(item), "currentSearchMatch", true);
			}
		}
	};
	
	SearchResultRenderer.prototype.renderFileElement = function(item, tableRow, spanHolder, renderName){
		if(this.explorer._state === "result_view"){
			var link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: item.linkLocation}, spanHolder, "last");
			dojo.place(document.createTextNode(renderName), link, "only");
		} else {
			var nameSpan = dojo.create("span", { className: "primaryColumn"}, spanHolder, "last");
			dojo.place(document.createTextNode(renderName), nameSpan, "only");
			nameSpan.title = "Click to compare";
			var itemId = this.explorer.model.getId(item);
			var fileItemIndex = this.explorer.model.getFileItemIndex(item);
			if(fileItemIndex === this.explorer.model.currentFileIndex && 
			   this.explorer.model.currentDetailIndex === null){
				dojo.toggleClass(itemId, "currentSearchMatch", true);
			}
			
			var that = this;
			dojo.connect(nameSpan, "onmouseover", nameSpan, function() {
				nameSpan.style.cursor ="pointer";
				dojo.toggleClass(itemId, "fileNameCheckedRow", true);
			});
			dojo.connect(nameSpan, "onmouseout", nameSpan, function() {
				nameSpan.style.cursor ="default";
				dojo.toggleClass(itemId, "fileNameCheckedRow", false);
			});
			dojo.connect(nameSpan, "onclick", nameSpan, function() {
				that.selectElement(item, false);
			});
		}
	};
	
	SearchResultRenderer.prototype.getDetailElement = function(item, tableRow, spanHolder){
		if(this.explorer._state === "result_view"){
			var link = dojo.create("a", {className: "navlink", id: tableRow.id+"NameColumn", href: item.linkLocation}, spanHolder, "last");
			return dojo.create("span", null, link, "only");
		} else {
			return dojo.create("span", null, spanHolder, "last");
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
					var renderName = item.totalMatches ? item.name + " (" + item.totalMatches + " matches)" : item.name;
					if(item.stale){
						var icon = dojo.create("span", null, span, "last");
						dojo.addClass(icon, "imageSprite");
						dojo.addClass(icon, "core-sprite-none");
						icon = dojo.create("span", null, span, "last");
						dojo.addClass(icon, "imageSprite");
						dojo.addClass(icon, "core-sprite-file");
						dojo.place(document.createTextNode(renderName), span, "last");
						
					} else {
						this.getExpandImage(tableRow, span, "core-sprite-file");
						this.renderFileElement(item, tableRow, span, renderName);
					}
				} else {
					var that = this;
					dojo.connect(tableRow, "onclick", tableRow, function() {
						if(that.explorer._state === "result_view"){
							that.selectElement(item,true);
						}
					});
					var icon = dojo.create("span", null, span, "last");
					dojo.addClass(icon, "imageSprite");
					dojo.addClass(icon, "core-sprite-none");
					icon = dojo.create("span", null, span, "last");
					dojo.addClass(icon, "imageSprite");
					dojo.addClass(icon, "core-sprite-rightarrow");
					
					var linkSpan = this.getDetailElement(item, tableRow, span);
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
		//there are 3 states:
		//result_view: viewing the seach result
		//replace_preview: after user inputs the replace string and enters into the preview 
		//replace_report: after user finishes preview and commits the replace
		this._state = "result_view";
		this._replacable = true;
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
		
		var saveResultsCommand = new mCommands.Command({
			name: "Save Search",
			tooltip: "Save query to search favorites",
			id: "orion.saveSearchResults",
			callback: function(data) {
				that.saveSearch(that.queryStr);
			},
			visibleWhen : function(item) {
				return that._state === "result_view";
			}
		});
	
		var replaceAllCommand = new mCommands.Command({
			name: "Replace",
			tooltip: "Replace all selected matches",
			id: "orion.globalSearch.replaceAll",
			callback: function(data) {
				that.replaceAll();
			},
			visibleWhen : function(item) {
				return that._state === "replace_preview";
			}
		});
	
		var reportFinishCommand = new mCommands.Command({
			name: "Done",
			tooltip: "Finish replace",
			id: "orion.globalSearch.reportFinish",
			callback : function() {
				return window.location.reload();
			},
			visibleWhen : function(item) {
				return that._state === "report";
			}
		});
	
		var cancelReplaceCommand = new mCommands.Command({
			name: "Cancel",
			tooltip: "Cancell replace",
			id: "orion.globalSearch.cancellReplace",
			callback: function(data) {
				that.cancellReplace();
			},
			visibleWhen : function(item) {
				return that._state === "replace_preview";
			}
		});
	
		this._commandService.addCommand(saveResultsCommand, "dom");
		this._commandService.addCommand(cancelReplaceCommand, "dom");
		this._commandService.addCommand(replaceAllCommand, "dom");
		this._commandService.addCommand(reportFinishCommand, "dom");
		this._commandService.addCommandGroup("orion.searchActions.unlabeled", 200, null, null, "pageActions");
		this._commandService.registerCommandContribution("orion.saveSearchResults", 1, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.globalSearch.cancellReplace", 2, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.globalSearch.replaceAll", 3, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.globalSearch.reportFinish", 4, "pageActions", "orion.searchActions.unlabeled");

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
				if(that._state !== "result_view"){
					return false;
				}
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
				if(that._state !== "result_view"){
					return false;
				}
				var nextPage = that.caculateNextPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				return (nextPage.start !== that.model.queryObj.start);
			}
		});
		var nextResultCommand = new mCommands.Command({
			name : "Next result",
			imageClass : "core-sprite-move_down",
			id: "orion.search.nextResult",
			groupId: "orion.searchGroup",
			visibleWhen : function(item) {
				return that._state === "result_view";
			},
			callback : function() {
				that.gotoNext(true, true);
		}});
		var prevResultCommand = new mCommands.Command({
			name : "Previous result",
			imageClass : "core-sprite-move_up",
			id: "orion.search.prevResult",
			groupId: "orion.searchGroup",
			visibleWhen : function(item) {
				return that._state === "result_view";
			},
			callback : function() {
				that.gotoNext(false, true);
		}});
		var expandAllCommand = new mCommands.Command({
			name : "Expand all results",
			imageClass : "core-sprite-expandAll",
			id: "orion.search.expandAll",
			groupId: "orion.searchGroup",
			visibleWhen : function(item) {
				return that._state === "result_view" || that._state === "replace_preview";
			},
			callback : function() {
				that.expandAll();
		}});
		var collapseAllCommand = new mCommands.Command({
			name : "Collapse all results",
			imageClass : "core-sprite-collapseAll",
			id: "orion.search.collapseAll",
			groupId: "orion.searchGroup",
			visibleWhen : function(item) {
				return that._state === "result_view" || that._state === "replace_preview";
			},
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
		var reportList = [];
		var that = this;
		this._state = "report";
		this.initCommands();
		this.reportStatus("Wringting files...");	
		this.model.writeNewContent( this.model.indexedFileItems(), reportList, 0, function(modellist){
			dojo.empty("results");
			var reporter = new SearchReportExplorer("results", reportList);
			reporter.report();
			that.reportStatus("");	
		});
	};

	
	SearchResultExplorer.prototype.replacePreview = function(replaceStr) {
		var that = this;
		this._state = "replace_preview";
		this._replaceStr = replaceStr;
		this.checkbox = true;
		this.initCommands();

		dojo.empty("results");
		this._uiFactory = new mSearchFeatures.SearchUIFactory({
			parentDivID: "results"
		});
		this._uiFactory.buildUI();
		var parentPane = dijit.byId("orion.innerSearchResults");
		if(parentPane.isLeftPaneOpen()){
			parentPane.toggle();
		}
		
		this.reportStatus("Preparing preview...");	
		this.model.generateRepalceModel(replaceStr, this.model.indexedFileItems(), 0, function(modellist){
			that.renderer = new SearchResultRenderer({checkbox: true, highlightSelection:false,
													  getCheckedFunc: function(item){return that.getItemChecked(item);},
													  onCheckedFunc: function(rowId, checked, manually){that.onRowChecked(rowId, checked, manually);}}, that);
			that.createTree(that._uiFactory.getMatchDivID(), that.model);
			that.renderer.selectElement(that.model.indexedFileItems()[0], false);
			that.reportStatus("");	
		});
	};
	
	SearchResultExplorer.prototype.getItemChecked = function(item) {
		if(item.checked === undefined){
			item.checked = true;
		}
		return item.checked;
	};
	
	SearchResultExplorer.prototype.onRowChecked = function(rowId, checked, manually) {
		if(!rowId){
			this.onItemChecked(this.model.getRealRoot(), checked, manually);
			return;
		}
		var row = dojo.byId(rowId);
		if(row && row._item){
			this.onItemChecked(row._item, checked, manually);
		}
	};
	
	SearchResultExplorer.prototype.onNewContentChanged = function(fileItem) {
		this.model.generateNewContents(fileItem, this._replaceStr);
		var fileItemIndex = this.model.getFileItemIndex(fileItem);
		if(fileItemIndex === this.model.currentFileIndex){
			this.buildPreview();
		}
	};
	
	SearchResultExplorer.prototype.onItemChecked = function(item, checked, manually) {
		item.checked = checked;
		if(item.type === "file" || item.isRoot){
			if(item.children){
				for(var i = 0; i < item.children.length; i++){
					var checkBox  = dojo.byId(this.renderer.getCheckBoxId(this.model.getId(item.children[i])));
					if(checkBox){
						this.renderer.onCheck(null, checkBox, checked, false);
					} else {
						item.children[i].checked = checked;
					}
				}
			}
			if(item.type === "file"){
				this.onNewContentChanged(item);
			}
		} else if(manually){
			this.onNewContentChanged(item.parent);
		}
	};
	
	SearchResultExplorer.prototype.cancellReplace = function() {
		var parentPane = dijit.byId("orion.innerSearchResults");
		if(!parentPane.isLeftPaneOpen()){
			parentPane.toggle();
		}
		this._state = "result_view";
		this.checkbox = false;
		this.initCommands();
		this.model.restoreLocationStatus();

		dojo.empty("results");
		this.renderer = new SearchResultRenderer({checkbox: false}, this);
		this.createTree("results", this.model);
		this.gotoCurrent();
	};
	
	SearchResultExplorer.prototype._resolveFileType = function(fileLocation){
		var fileName = fileLocation;
		var splits = fileName.split(".");
		if (splits.length > 0) {
			return splits.pop().toLowerCase();
		}
		return "";
	};
	
	SearchResultExplorer.prototype.buildPreview = function() {
		var uiFactory = this._uiFactory;
		var fileItem = this.model.indexedFileItems()[this.model.currentFileIndex];
		dojo.empty(uiFactory.getCompareDivID());
		var uiFactoryCompare = new mCompareFeatures.TwoWayCompareUIFactory({
			parentDivID: uiFactory.getCompareDivID(),
			showTitle: true,
			leftTitle: "Replaced File (" + fileItem.name + ")",
			rightTitle: "Original File (" + fileItem.name + ")",
			showLineStatus: false
		});
		uiFactoryCompare.buildUI();

		// Diff operations
		var fType = this._resolveFileType(fileItem.location);
		var options = {
			readonly: true,
			hasConflicts: false,
			baseFileName: fileItem.location,
			newFileName: fileItem.location,
			baseFileType: fType,
			newFileType: fType,
			baseFileContent: fileItem.contents.join(this.model._lineDelimiter),
			newFileContent: fileItem.newContents.join(this.model._lineDelimiter)
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
		if(this._replacable){
			if(this._state === "result_view"){
				var replaceStrDiv= dojo.create("input", {type: "search", id: "replaceString", placeholder: "replace text", title:"Type a text to replace all with"}, "pageActions", "last");
				dojo.addClass(replaceStrDiv, "searchbox");
				dojo.connect(replaceStrDiv, "onkeypress", function(e){
					if (e.charOrCode === dojo.keys.ENTER) {
						if (replaceStrDiv.value.length > 0) {
							that.replacePreview(replaceStrDiv.value);
						} 
					}
				});
			}
		}
		dojo.empty("pageNavigationActions");
		this._commandService.renderCommands("pageNavigationActions", "dom", that, that, "tool");
		if(this._state !== "result_view"){
			return;
		}
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
			this.model.setCurrent(nextItem.newFileIndex, nextItem.newDetailIndex, true);
			if(newExpanded.childrenNumber > 0) {
				this.model.highlightSelectionLater = false;
				if(nextItem.newDetailIndex < 0 ){
					this.model.setCurrent(nextItem.newFileIndex, newExpanded.childrenNumber - 1, true);
				} else if(nextItem.newDetailIndex >= newExpanded.childrenNumber){
					this.model.setCurrent(nextItem.newFileIndex, 0, true);
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

	
	function SearchReportExplorer(parentId, reportList){
		this.parentId = parentId;
		this.reportList = reportList;
		this.renderer = new SearchReportRenderer({checkbox: false}, this);
	};
	SearchReportExplorer.prototype = new mExplorer.Explorer();
	
	SearchReportExplorer.prototype.report = function() {
		this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, this.reportList));
	};

	SearchReportExplorer.prototype.constructor = SearchReportExplorer;

	
	function SearchReportRenderer(options, explorer){
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	};
	
	SearchReportRenderer.prototype = new mExplorer.SelectionRenderer();
	
	SearchReportRenderer.prototype.getCellHeaderElement = function(col_no){
		switch(col_no){
			case 0: 
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Files replaced</h2>"});
				break;
			case 1: 
				return dojo.create("th", {style: "padding-left: 5px; padding-right: 5px", innerHTML: "<h2>Status</h2>"});
				break;
		}
	};
	
	SearchReportRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"});
			var div = dojo.create("div", null, col, "only");
			var span = dojo.create("span", { className: "primaryColumn"}, div, "last");

			dojo.place(document.createTextNode(item.model.fullPathName + "/" + item.model.name), span, "only");
			
			var operationIcon = dojo.create("span", null, div, "first");
			dojo.addClass(operationIcon, "imageSprite");
			
			if(item.status){
				switch (item.status) {
					case "warning":
						dojo.addClass(operationIcon, "core-sprite-warning");
						return col;
					case "failed":
						dojo.addClass(operationIcon, "core-sprite-error");
						return col;
					case "pass":
						dojo.addClass(operationIcon, "core-sprite-ok");
						return col;
				}
			}
			return col;
		case 1:
			var statusMessage;
			if(item.status){
				switch (item.status) {
					case "warning":
						statusMessage = "User aborted file writing";
						break;;
					case "failed":
						statusMessage = "Failed to write file";
						break;;
					case "pass":
						statusMessage = item.matchesReplaced + " out of " + item.model.totalMatches + " matches replaced";
						break;
				}
				return dojo.create("td", {style: "padding-left: 5px; padding-right: 5px", innerHTML: statusMessage});
			}
		}
	};
	
	SearchReportRenderer.prototype.constructor = SearchReportRenderer;
	
	
	//return module exports
	return {
		SearchResultExplorer: SearchResultExplorer
	};
});
