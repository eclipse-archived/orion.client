/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
define(['i18n!orion/compare/nls/messages', 'require', 'dojo', 'dijit','orion/explorers/explorer', 'orion/explorers/explorerNavHandler', 'orion/fileClient', 'orion/commands', 
		'orion/explorers/navigationUtils', 'orion/crawler/searchCrawler', 'orion/compare/compareUtils', 'orion/searchUtils', 'orion/selection'], 
		function(messages, require, dojo, dijit, mExplorer, mNavHandler, mFileClient, mCommands, mNavUtils, mSearchCrawler, mCompareUtils, mSearchUtils, mSelection) {
	/**
	 * Creates a new compare tree explorer.
	 * @name orion.CompareTreeExplorer
	 */
	function CompareTreeModel(rootPath, fetchItems, root) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.root = root;
	}
	
	CompareTreeModel.prototype = new mExplorer.ExplorerFlatModel();
	
	CompareTreeModel.prototype.getId = function(item){
		return item.fileURL;
	};

	CompareTreeModel.prototype.constructor = CompareTreeModel;

	function CompareTreeExplorerRenderer(options, explorer){
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	};
	
	CompareTreeExplorerRenderer.prototype = new mExplorer.SelectionRenderer();
	
	CompareTreeExplorerRenderer.prototype.getCellHeaderElement = function(col_no){
		var col, h2;
		switch(col_no){
			case 0: 
				col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				h2 = dojo.create("h2", col); //$NON-NLS-0$
				h2.textContent = this.explorer._compareResults.length + " of " + this.explorer._totalFiles + messages["files changed"]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				break;
			case 1: 
				col = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				h2 = dojo.create("h2", col); //$NON-NLS-0$
				h2.textContent = messages["Location"];
				break;
		}
	};
	
	CompareTreeExplorerRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			
			var diffStatusIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
			//dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
			var linkRef, displayName;
			if(item.type){
				//dojo.addClass(diffStatusIcon, "imageSprite"); //$NON-NLS-0$
				switch (item.type) {
					case "added": //$NON-NLS-0$
						dojo.addClass(diffStatusIcon, "compareAdditionSprite"); //$NON-NLS-0$
						displayName = item.name;
						linkRef = require.toUrl("edit/edit.html") + "#" + item.fileURL;
						break;
					case "removed": //$NON-NLS-0$
						dojo.addClass(diffStatusIcon, "compareRemovalSprite"); //$NON-NLS-0$
						displayName = item.name;
						linkRef = require.toUrl("edit/edit.html") + "#" + item.fileURL;
						break;
					case "modified": //$NON-NLS-0$
						dojo.addClass(diffStatusIcon, "imageSprite"); //$NON-NLS-0$
						dojo.addClass(diffStatusIcon, "core-sprite-file"); //$NON-NLS-0$
						displayName = item.name;
						linkRef = mCompareUtils.generateCompareHref(item.fileURL + "," + item.fileURLBase, {readonly: true});
						break;
				}
			}
			
			var span = dojo.create("span", { className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(displayName), span, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, span);
			dojo.connect(span, "onclick", span, function() { //$NON-NLS-0$
				window.open(linkRef);
			});
			dojo.connect(span, "onmouseover", span, function() { //$NON-NLS-0$
				span.style.cursor ="pointer"; //$NON-NLS-0$
			});
			dojo.connect(span, "onmouseout", span, function() { //$NON-NLS-0$
				span.style.cursor ="default"; //$NON-NLS-0$
			});
			return col;
		case 1:
			var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			if(!item.fullPathName){
				return;
			}
			var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			
			var span = dojo.create("span", { className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var linkRef = require.toUrl("navigate/table.html") + "#" + item.parentLocation;
			//var linkRef = require.toUrl("edit/edit.html") + "#" + item.fileURL
			var fileService = this.explorer.getFileServiceName(item);
			dojo.place(document.createTextNode(fileService + "/" + item.fullPathName), span, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, span);
			dojo.connect(span, "onclick", span, function() { //$NON-NLS-0$
				window.open(linkRef);
			});
			dojo.connect(span, "onmouseover", span, function() { //$NON-NLS-0$
				span.style.cursor ="pointer"; //$NON-NLS-0$
			});
			dojo.connect(span, "onmouseout", span, function() { //$NON-NLS-0$
				span.style.cursor ="default"; //$NON-NLS-0$
			});
			return col;
		}
	};
	
	CompareTreeExplorerRenderer.prototype.constructor = CompareTreeExplorerRenderer;
	
	function CompareTreeExplorer(registry, parentId, commandService){
		this.selection = new mSelection.Selection(registry, "orion.compare.selection"); 
		this.registry = registry;
		this._commandService = commandService;
		this._fileClient = new mFileClient.FileClient(this.registry);
		this.parentId = parentId;
		this.renderer = new CompareTreeExplorerRenderer({checkbox: false}, this);
		//this.declareCommands();
	}
	CompareTreeExplorer.prototype = new mExplorer.Explorer();
	
	CompareTreeExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message);	 //$NON-NLS-0$
	};

	CompareTreeExplorer.prototype._tailRelativePath = function(parentFullPath, childFullPath) {
		var containsParentPath = childFullPath.indexOf(parentFullPath);
		if(containsParentPath !== 0){
			throw "File path does not contain the folder path";
			return childFullPath;
		}
		var relativePath = childFullPath.substring(parentFullPath.length);
		if(relativePath.length > 0 && relativePath.indexOf("/") === 0){
			relativePath = relativePath.substring(1);
		}
		return relativePath;
	};
	
	CompareTreeExplorer.prototype._compareHitTest = function(files, OveralIndex) {
		console.log("compare hit testing on: " + OveralIndex );
		console.log(files[0].URL );
		console.log(files[1].URL);
		if(files[1].Content !== files[0].Content){
			this._compareResults.push({type: "modified", fileURL: files[0].URL, fileURLBase: files[1].URL, name: files[0].name});
			this._renderUI();		
			console.log("Different files..." );
		} else {
			console.log("Same files..." );
		}
		files[1].Content = null;
		files[0].Content = null;
	};
	
	CompareTreeExplorer.prototype._testSameFiles = function(currentIndex) {
		if(currentIndex === this._sameFiles.length){
			var that = this;
			if(this._compareResults.length > 0){
				this._loadOneFileMetaData(0,function(){that._renderUI(); that._addOptions()});
			}
			console.log("completed compare");
			this.reportStatus("");	
		} else {
			this.reportStatus("Comparing " + this._sameFiles[currentIndex].fileNew.Location);	
			this._getFileContent([{URL: this._sameFiles[currentIndex].fileNew.Location, name: this._sameFiles[currentIndex].fileNew.Name}, 
					{URL: this._sameFiles[currentIndex].fileBase.Location, name: this._sameFiles[currentIndex].fileBase.Name}], 0, currentIndex);
		}
	};
	
	CompareTreeExplorer.prototype._loadOneFileMetaData =  function(index, onComplete){
		var item = this._compareResults[index];
		this._fileClient.read(item.fileURL, true).then(
			dojo.hitch(this, function(meta) {
				item.fullPathName = mSearchUtils.fullPathNameByMeta(meta.Parents);
				item.parentLocation = meta.Parents[0].ChildrenLocation;
				item.name = meta.Name;
			    if(index === (this._compareResults.length-1)){	
			    	if(onComplete){
			    		onComplete();
			    	} else {
			    		return; 
			    	}
			    } else {
					this._loadOneFileMetaData(index+1, onComplete);
			    }
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: status " + error.status); //$NON-NLS-0$
				if(index === (this._compareResults.length-1)){
			    	if(onComplete){
			    		onComplete();
			    	} else {
			    		return; 
			    	}
				} else {
					this._loadOneFileMetaData( index+1, onComplete);
				}
			})
		);
	};

	CompareTreeExplorer.prototype._getChildrenLocation =  function(locations, index, onComplete){
		if(!this._fileClient){
			console.log("A file client is needed for getting file content"); //$NON-NLS-0$
			return;
		}
		var that = this;
		that._fileClient.read(locations[index].URL, true).then(function(meta) {
			locations[index].childrenLocation = meta.ChildrenLocation;
			if(index < (locations.length - 1)){
				that._getChildrenLocation(locations, index+1, onComplete);
			} else {
				onComplete();
			}
		}, function(error, ioArgs) {
			locations[index].childrenLocation = locations[index].URL;
			if(index < (locations.length - 1)){
				that._getChildrenLocation(locations, index+1, onComplete);
			} else {
				onComplete();
			}
		});
	};

	CompareTreeExplorer.prototype._getFileContent = function(files, currentIndex, OveralIndex) {
		if(!this._fileClient){
			console.log("A file client is needed for getting file content"); //$NON-NLS-0$
			return;
		}
		var that = this;
		that._fileClient.read(files[currentIndex].URL).then(function(contents) {
			files[currentIndex].Content = contents;
			if(currentIndex < (files.length - 1)){
				that._getFileContent(files, currentIndex+1, OveralIndex);
			} else {
				that._compareHitTest(files, OveralIndex);
				that._testSameFiles(OveralIndex+1);
			}
		}, function(error, ioArgs) {
			if (error.status === 404) {
				files[currentIndex].Content = "";
				if(currentIndex < (files.length - 1)){
					that._getFileContent(files, currentIndex+1, OveralIndex);
				} else {
					that._compareHitTest(files, OveralIndex);
					that._testSameFiles(files, OveralIndex+1);
				}
			} else if (that.errorCallback) {
				that.errorCallback(error, ioArgs);
			}
		});
	};
	
	CompareTreeExplorer.prototype.getFileServiceName = function(item) {
		if(item.type === "removed"){
			return this._fileServiceNameBase;
		}
		return this._fileServiceNameNew;
	};

	CompareTreeExplorer.prototype._compareSkeletons = function(currentIndex) {
		this._compareResults = [];
		this._sameFiles = [];//To buffer a list of file pairs that have the same relative location
		var skeletonNew = this._fileSkeletonNew;
		var skeletonBase = this._fileSkeletonBase;
		for(var i = 0; i < skeletonNew.length; i++){//Loop on file skeleton to be compared
			var hasSameFile = false;
			var sameFileBase = null;
			var curResItemNew = skeletonNew[i];
			var relativePathNew = this._tailRelativePath(this._folderNew, curResItemNew.Location);
			for( var j = 0; j < skeletonBase.length; j++){//Loop on file skeleton to compare with
				var curResItemBase = skeletonBase[j];
				var relativePathBase = this._tailRelativePath(this._folderBase, curResItemBase.Location);
				if(relativePathBase === relativePathNew){//If the relative path is the same, we treat them as same file
					curResItemNew._hasSameFile = true;
					curResItemBase._hasSameFile = true;
					hasSameFile = true;
					this._sameFiles.push({fileNew: curResItemNew, fileBase: curResItemBase});//Buffer the same files that will be tested later
					break;
				}
			}
			if(!hasSameFile){//If a file in the new file skeleton has no partner in the base file skeleton, it is treatede as added file.
				this._compareResults.push({type: "added", fileURL: curResItemNew.Location, name: curResItemNew.Name});
			}
		}
		for( var j = 0; j < skeletonBase.length; j++){//Loop on the base file skeleton(the opne to compare with) to filter out those that do not have "_hasSameFile" property.
			var curResItemBase = skeletonBase[j];
			if(!curResItemBase._hasSameFile){
				this._compareResults.push({type: "removed", fileURL: curResItemBase.Location, name: curResItemBase.Name});
			}
		}
		this._totalFiles = this._compareResults.length + this._sameFiles.length;
		if(this._compareResults.length > 0){
			this._renderUI();
		}
		this._testSameFiles(0);
	};

	CompareTreeExplorer.prototype.prepareResults = function(twoFolders) {
		var twoFoldersIndex = twoFolders.indexOf(","); //$NON-NLS-0$
		if(twoFoldersIndex > 0){
			this._folderNew = twoFolders.substring(0, twoFoldersIndex);
			this._folderBase = twoFolders.substring(twoFoldersIndex+1);
			this._fileServiceNameNew = this._fileClient.fileServiceName(this._folderNew);
			this._fileServiceNameBase = this._fileClient.fileServiceName(this._folderBase);
			
			var that = this;
			var locations = [{URL:this._folderNew},{URL:this._folderBase}];
			this._getChildrenLocation(locations, 0, function(){
				var crawlerNew = new mSearchCrawler.SearchCrawler(that.registry, that._fileClient, "", {buildSkeletonOnly: true, location: that._folderNew, childrenLocation: locations[0].childrenLocation,
									fetchChildrenCallBack: function(folderURL){that.reportStatus("Fetching folder: " + folderURL + "...");}
									}); 
				var crawlerBase = new mSearchCrawler.SearchCrawler(that.registry, that._fileClient, "", {buildSkeletonOnly: true, location: that._folderBase, childrenLocation: locations[1].childrenLocation,
									fetchChildrenCallBack: function(folderURL){that.reportStatus("Fetching folder: " + folderURL + "...");}
									}); 
				crawlerNew.buildSkeleton(
					function(){
					}, 
					function(){
						crawlerBase.buildSkeleton(
							function(){
							}, 
							function(){
								that._fileSkeletonNew = crawlerNew.fileSkeleton;
								that._fileSkeletonBase = crawlerBase.fileSkeleton;
								that._compareSkeletons(0);
						});
				});
			});
		} 
	};

	CompareTreeExplorer.prototype.startup = function(twoFolders) {
		this.reportStatus("Generating compare tree result...");	
		this.prepareResults(twoFolders);
	};

	CompareTreeExplorer.prototype._addOptions = function() {
		var that = this;
		var optionMenu = that._commandService._createDropdownMenu("pageNavigationActions", messages['Options']);
		that._commandService._generateCheckedMenuItem(optionMenu.menu, messages["Sort by folders"], false,
			function(event) {
				that._sortByFolder = event.target.checked;
				that._renderUI();
				optionMenu.dropdown.close(true);
			});
	};

	CompareTreeExplorer.prototype._renderUI = function() {
		var that = this;
		this._compareResults.sort( function(item1, item2){
				var name1 = that._sortByFolder ? (that.getFileServiceName(item1) + item1.fullPathName).toLowerCase(): item1.name.toLowerCase();
				var name2 = that._sortByFolder ? (that.getFileServiceName(item2) + item2.fullPathName).toLowerCase(): item2.name.toLowerCase();
				if (name1 > name2) {
					return 1;
				} else if (name1 < name2) {
					return -1;
				} else {
					return 0;
				}
			});
		this.createTree(this.parentId, new CompareTreeModel(null, null, this._compareResults), {selectionPolicy: "cursorOnly", setFocus: true});
	};
	
	CompareTreeExplorer.prototype.constructor = CompareTreeExplorer;

	//return module exports
	return {
		CompareTreeExplorer: CompareTreeExplorer
	};
});
