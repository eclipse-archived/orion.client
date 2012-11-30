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

/*global define console window*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!orion/search/nls/messages', 'require', 'dojo', 'dijit','orion/explorers/explorer', 'orion/explorers/explorerNavHandler', 'orion/fileClient', 'orion/commands', 'orion/searchUtils', 'orion/globalSearch/search-features', 'orion/compare/compare-features', 'orion/compare/compare-container', 'orion/explorers/navigationUtils', 'dijit/TooltipDialog'], 
		function(messages, require, dojo, dijit, mExplorer, mNavHandler, mFileClient, mCommands, mSearchUtils, mSearchFeatures, mCompareFeatures, mCompareContainer, mNavUtils) {

	function SearchResultModel(	serviceRegistry, fileClient, resultLocation, queryStr, options) {
		this.registry= serviceRegistry;
		this.fileClient = fileClient; 
		this._resultLocation = resultLocation;
		this._listRoot = {
				isRoot: true,
				children:[]
		};
		this.indexedFileItems = [];
		this.location2ModelMap = [];
		this._lineDelimiter = "\n";  //$NON-NLS-0$
		this.onMatchNumberChanged = options.onMatchNumberChanged;
		this.queryObj = mSearchUtils.parseQueryStr(queryStr);
	}
	SearchResultModel.prototype = new mExplorer.ExplorerModel(); 
	
	SearchResultModel.prototype.replaceMode = function(){
		return (typeof this.queryObj.replace === "string"); //$NON-NLS-0$
	};
	
	SearchResultModel.prototype.sameFile = function(prevSelection, curSelection){
		return this.fileModel(prevSelection) === this.fileModel(curSelection);
	};
	
	SearchResultModel.prototype.fileModel = function(model){
		if(!model){
			return null;
		}
		if(model.type === "file"){ //$NON-NLS-0$
			return model;
		}
		return model.parent;
	};
	
	SearchResultModel.prototype.model2Index = function(model, list){
		var lookAt = list;
		if(!lookAt && model.parent){
			lookAt = model.parent.children;
		}
		if(lookAt){
			for(var i = 0 ; i < lookAt.length; i++){
				if(lookAt[i] === model){
					return i;
				}
			}
		}
		return -1;
	};
	
	SearchResultModel.prototype.location2Model = function(location){
		if(location && this.location2ModelMap[location]){
			return this.location2ModelMap[location];
		}
		if(this.indexedFileItems.length > 0){
			return this.indexedFileItems[0];
		}
		return null;
	};
	
	SearchResultModel.prototype.storeStatus = function(currentModel) {
		if(currentModel){
			var fileItem = this.fileModel(currentModel);
			window.sessionStorage[this.queryObj.queryStr + "_search_result_currentFileLocation"] = fileItem.location; //$NON-NLS-0$
			if(currentModel.type === "file"){ //$NON-NLS-0$
				window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"] = "none"; //$NON-NLS-1$ //$NON-NLS-0$
			} else {
				window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"] = JSON.stringify(this.model2Index(currentModel)); //$NON-NLS-0$
			}
			
		}
	};
	
	SearchResultModel.prototype.restoreGlobalStatus = function() {
		this.defaultReplaceStr = this.queryObj.searchStrTitle;
		var defaultReplaceStr = window.sessionStorage["global_search_default_replace_string"]; //$NON-NLS-0$
		if (typeof defaultReplaceStr === "string") { //$NON-NLS-0$
			if (defaultReplaceStr.length > 0) {
				this.defaultReplaceStr= defaultReplaceStr;
			} 
		}
		this.sortByName = (this.queryObj.sort.indexOf("Name") > -1); //$NON-NLS-0$
	};
	
	SearchResultModel.prototype.getRoot = function(onItem){
		onItem(this._listRoot);
	};
	
	SearchResultModel.prototype.getTopIterationNodes = function(){
		return this.indexedFileItems;
	};
	
	SearchResultModel.prototype.buildResultModel = function(){
		this.restoreGlobalStatus();
		this.indexedFileItems = [];
		for(var i = 0; i < this._resultLocation.length; i++){
			var childNode = {parent: this._listRoot, type: "file", name: this._resultLocation[i].name,lastModified: this._resultLocation[i].lastModified, //$NON-NLS-0$
							linkLocation: this._resultLocation[i].linkLocation, location: this._resultLocation[i].location, 
							parentLocation:  mSearchUtils.path2FolderName(this._resultLocation[i].location, this._resultLocation[i].name, true),
							fullPathName: mSearchUtils.path2FolderName(this._resultLocation[i].path, this._resultLocation[i].name)};
			this.location2ModelMap[childNode.location] = childNode;
			this._listRoot.children.push(childNode);
			this.indexedFileItems.push(childNode);
		}
	};
	
	SearchResultModel.prototype.checkStale = function(model, onComplete){
		if(!model.stale){
			return;
		} else {
			this.fileClient.read(model.location).then(
				dojo.hitch(this, function(contents) {
					if(this.hitOnceWithinFile(contents)){
						model.stale = false;
					} else {
						onComplete(model);
					}
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file contents: " + error.message); //$NON-NLS-0$
					onComplete(model);
				})
			);
		}
	};
	
	SearchResultModel.prototype.matchesReplaced = function(model){
		var matchesReplaced = 0;
		if(!model.children){
			return model.checked === false ? 0: 1;
		}
		if(model.children){
			for(var j = 0; j < model.children.length; j++){
				if(!(model.children[j].checked === false)){
					matchesReplaced += 1;
				}
			}
		}
		return matchesReplaced;
	};
	
	SearchResultModel.prototype.writeIncrementalNewContent = function(replaceStr, modelList, reportList,  index, onComplete){
		var model = modelList[index];
		if(!model || index === modelList.length){
			onComplete(modelList);
			return;
		}
		var matchesReplaced = this.matchesReplaced(model);
		if(matchesReplaced > 0){
			this.getFileContent(model, dojo.hitch(this, function(fileItem){
				matchesReplaced = this.matchesReplaced(fileItem);
				var newContents = [];
				mSearchUtils.generateNewContents(fileItem.contents, newContents, fileItem, replaceStr, this.queryObj.inFileQuery.searchStrLength); 
				var contents = newContents.join(this._lineDelimiter);
				
				var etag = fileItem.ETag;
				var args = etag ? { "ETag" : etag }: null; //$NON-NLS-0$
				this.fileClient.write(model.location, contents, args).then(
					dojo.hitch(this, function(result) {
						reportList.push({model: model, matchesReplaced: matchesReplaced, status: "pass" }); //$NON-NLS-0$
						this.writeIncrementalNewContent( replaceStr, modelList, reportList, index+1, onComplete);
					}),
					dojo.hitch(this, function(error) {
						// expected error - HTTP 412 Precondition Failed 
						// occurs when file is out of sync with the server
						if (error.status === 412) {
							reportList.push({model: model, message: messages["Resource has been changed by others."], matchesReplaced: matchesReplaced, status: "failed" }); //$NON-NLS-1$
						}
						// unknown error
						else {
							error.log = true;
							reportList.push({model: model, message: messages["Failed to write file."],  matchesReplaced: matchesReplaced, status: "failed" }); //$NON-NLS-1$
						}
						this.writeIncrementalNewContent(replaceStr, modelList, reportList, index+1, onComplete);
					})
				);
				
			}), true);
			
		} else {
			this.writeIncrementalNewContent( replaceStr, modelList, reportList, index+1, onComplete);
		}
		
	};
	
	SearchResultModel.prototype.getId = function(item){
		var result;
		if (item === this._listRoot) {
			result = this.rootId;
		} else {
			result = item.location;
			// remove all non valid chars to make a dom id. 
			result = result.replace(/[^\.\:\-\_0-9A-Za-z]/g, "");
		} 
		return result;
	};
	
	SearchResultModel.prototype.hitOnceWithinFile = function( fileContentText){
		var lineString = fileContentText.toLowerCase();
		var result;
		if(this.queryObj.inFileQuery.wildCard){
			result = mSearchUtils.searchOnelineRegEx(this.queryObj.inFileQuery, lineString, true);
		} else {
			result = mSearchUtils.searchOnelineLiteral(this.queryObj.inFileQuery, lineString, true);
		}
		return result;
	};

	SearchResultModel.prototype.getFileContent = function(fileItem, onComplete, writing){
		if(fileItem.contents){
			onComplete(fileItem);
		} else {
			this.fileClient.read(fileItem.location).then(
				dojo.hitch(this, function(jsonData) {
					mSearchUtils.searchWithinFile(this.queryObj.inFileQuery, fileItem, jsonData, this._lineDelimiter, this.replaceMode());
					if(this.onMatchNumberChanged && !writing){
						this.onMatchNumberChanged(fileItem);
					}
					onComplete(fileItem);
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file content: " + error.message); //$NON-NLS-0$
					onComplete(null);
				})
			);
		}
	};
	
	SearchResultModel.prototype.getChildren = function(parentItem, onComplete){
		if(!parentItem){
			return;
		}
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.type === "detail") { //$NON-NLS-0$
			onComplete([]);
		} else if (parentItem.type === "file" && parentItem.location) { //$NON-NLS-0$
			if(this.queryObj.searchStr === ""){
				return;
			}
			this.fileClient.read(parentItem.location).then(
					dojo.hitch(this, function(jsonData) {
						  mSearchUtils.searchWithinFile(this.queryObj.inFileQuery, parentItem, jsonData, this._lineDelimiter, this.replaceMode());
						  if(this.onMatchNumberChanged){
							  this.onMatchNumberChanged(parentItem);
						  }
						  onComplete(parentItem.children);
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file content: " + error.message); //$NON-NLS-0$
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
	
	// TODO:  this should be handled outside of here in a common select all command
	// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=339500
	SearchResultRenderer.prototype.initCheckboxColumn = function(tableNode){	
		if (this._useCheckboxSelection) {
			var th = document.createElement('th'); //$NON-NLS-0$
			var check = document.createElement("span"); //$NON-NLS-0$
			dojo.addClass(check, "selectionCheckmarkSprite core-sprite-check"); //$NON-NLS-0$
			if(this.getCheckedFunc){
				check.checked = this.getCheckedFunc(this.explorer.model._listRoot);
				dojo.toggleClass(check, "core-sprite-check_on", check.checked); //$NON-NLS-0$
			}
			th.appendChild(check);
			dojo.connect(check, "onclick", dojo.hitch(this, function(evt) { //$NON-NLS-0$
				var newValue = evt.target.checked ? false : true;
				this.onCheck(null, evt.target, newValue);
			}));
			return th;
		}
	};
	
	SearchResultRenderer.prototype.getCellHeaderElement = function(col_no){	
		var title, header;
		if(col_no === 1){
			title = dojo.create("th"); //$NON-NLS-0$
			header = dojo.create("h2", null, title); //$NON-NLS-0$
			header.textContent = messages["Results"]; //$NON-NLS-0$
			
			if( this.explorer.model.queryObj.searchStrTitle){
				if(this.explorer.numberOnPage > 0){
					var startNumber = this.explorer.model.queryObj.start + 1;
					var endNumber = startNumber + this.explorer.numberOnPage - 1;
					title.innerHTML = "";
					var textBold = dojo.create("h2", null, title, "last"); //$NON-NLS-1$ //$NON-NLS-0$
					var displayStr = "";
					if(!this.explorer.model.replaceMode()){
						displayStr = dojo.string.substitute(messages["Files ${0} of ${1} matching ${2}"], 
						[startNumber +"-"+ endNumber, this.explorer.totalNumber, this.explorer.model.queryObj.searchStrTitle]); 
					} else {
						displayStr = dojo.string.substitute(messages["Replace ${0} with ${1} for files ${2} of ${3}"],
						[this.explorer.model.queryObj.searchStrTitle,
						this.explorer._replaceStr, 
						startNumber +"-"+ endNumber, //$NON-NLS-2$
						this.explorer.totalNumber
						]);
					}
					dojo.place(document.createTextNode(displayStr), textBold, "only"); //$NON-NLS-0$
				}
			}
			return title;
		} else if(col_no === 2){
			title = dojo.create("th"); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			header = dojo.create("h2", null, title);
			header.textContent = messages["Location"];
			return title;
		} else if(col_no === 0){
			return dojo.create("th"); //$NON-NLS-0$
		}
	};
	
	
	SearchResultRenderer.prototype.focus = function(){
	    var resultParentDiv = dojo.byId(this.explorer.getParentDivId());
	    window.setTimeout(function(){
	    	resultParentDiv.focus();
	    	}, 10);
	};

	SearchResultRenderer.prototype.staleFileElement = function(item){
		if(item.stale){
			var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
			mNavUtils.removeNavGrid(navGridHolder, dojo.byId(this.getItemLinkId(item)));
			var span = dojo.byId(this.getFileSpanId(item));
			dojo.empty(span);
			dojo.place(document.createTextNode(item.name), span, "last"); //$NON-NLS-0$
			span = dojo.byId(this.getFileIconId(item));
			dojo.empty(span);
		}
	};
	
	SearchResultRenderer.prototype.replaceFileElement = function(item){
		var renderName = item.totalMatches ? item.name + " (" + item.totalMatches + " matches)" : item.name; //$NON-NLS-1$ //$NON-NLS-0$
		var linkDiv = dojo.byId( this.getItemLinkId(item));
		dojo.place(document.createTextNode(renderName), linkDiv, "only"); //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.replaceDetailIcon = function(item , direction){
		if(this.explorer.model.replaceMode()){
			return;
		}
		if(! item || item.type !== "detail"){ //$NON-NLS-0$
			return;
		}
		var iconSpan = dojo.byId(this.getDetailIconId(item));
		if(!iconSpan){
			return;
		}
		dojo.empty(iconSpan);
		var icon = dojo.create("span", null, iconSpan, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		dojo.addClass(icon, "imageSprite"); //$NON-NLS-0$
		if(direction === "right"){ //$NON-NLS-0$
			dojo.addClass(icon, "core-sprite-rightarrow"); //$NON-NLS-0$
		} else if(direction === "left"){ //$NON-NLS-0$
			dojo.addClass(icon, "core-sprite-leftarrow"); //$NON-NLS-0$
		} else {
			dojo.addClass(icon, "core-sprite-none"); //$NON-NLS-0$
		}
	};
	
	SearchResultRenderer.prototype.renderFileElement = function(item, spanHolder, renderName){
		var link = dojo.create("a", {className: "navlink", id: this.getItemLinkId(item), href: item.linkLocation + mSearchUtils.generateFindURLBinding(this.explorer.model.queryObj.inFileQuery, null, this.explorer._replaceStr)}, spanHolder, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.place(document.createTextNode(renderName), link, "only"); //$NON-NLS-0$
		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
	};
	
	SearchResultRenderer.prototype.generateContextTip = function(detailModel){
		var tableNode = dojo.create( "table",{bgcolor:"#FFFFCC"}); //$NON-NLS-1$ //$NON-NLS-0$
		for(var i = 0; i < detailModel.context.length; i++){
			var lineDiv = dojo.create("tr",{},tableNode); //$NON-NLS-0$
			if(detailModel.context[i].current){
				var lineTd = dojo.create( "td", { noWrap: true}, lineDiv ); //$NON-NLS-0$
				this.generateDetailHighlight(detailModel, dojo.create("span",{className: "primaryColumn"},lineTd)); //$NON-NLS-1$ //$NON-NLS-0$
			} else {
				var td = dojo.create( "td", { noWrap: true}, lineDiv ); //$NON-NLS-1$ //$NON-NLS-0$
				td.textContent = detailModel.context[i].context + "\u00a0"; //$NON-NLS-0$
			}
		}
		return tableNode;
	};
	
	SearchResultRenderer.prototype.generateDetailHighlight = function(detailModel, parentSpan){
		var startIndex = 0;
		var gap = this.explorer.model.queryObj.inFileQuery.searchStrLength;
		for(var i = 0; i < detailModel.matches.length; i++){
			if(startIndex >= detailModel.name.length)
				break;
			if(this.explorer.model.replaceMode()){
				if(i !== (detailModel.matchNumber - 1)){
					continue;
				}
			}
			
			if(startIndex !== detailModel.matches[i].startIndex){
				dojo.place(document.createTextNode(detailModel.name.substring(startIndex, detailModel.matches[i].startIndex)), parentSpan, "last"); //$NON-NLS-0$
			}
			var matchSegBold = dojo.create("b", null, parentSpan, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			if(this.explorer.model.queryObj.inFileQuery.wildCard){
				gap = detailModel.matches[i].length;
			}
			dojo.place(document.createTextNode(detailModel.name.substring(detailModel.matches[i].startIndex, detailModel.matches[i].startIndex + gap)), matchSegBold, "only"); //$NON-NLS-0$
			startIndex = detailModel.matches[i].startIndex + gap;
			if(this.explorer.model.replaceMode()){
				break;
			}
		}
		if(startIndex < (detailModel.name.length - 1)){
			dojo.place(document.createTextNode(detailModel.name.substring(startIndex)), parentSpan, "last"); //$NON-NLS-0$
		}
	};
	
	SearchResultRenderer.prototype.renderDetailElement = function(item, tableRow, spanHolder, renderNumber){
		var linkSpan = this.getDetailElement(item, tableRow, spanHolder);
		if(renderNumber){
			this.renderDetailLineNumber(item, linkSpan);
		}
		this.generateDetailHighlight(item, linkSpan);
	};
		
	SearchResultRenderer.prototype.renderDetailLineNumber = function(item, spanHolder){
		if(!this.explorer.model.replaceMode() || item.matches.length <= 1){
			dojo.place(document.createTextNode(item.lineNumber + ":"), spanHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		} else {
			dojo.place(document.createTextNode(item.lineNumber + "(" + item.matchNumber+ "):"), spanHolder, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
	};
		
	SearchResultRenderer.prototype.getDetailElement = function(item, tableRow, spanHolder){
		var that = this;
		var linkLocation = item.parent.linkLocation + mSearchUtils.generateFindURLBinding(this.explorer.model.queryObj.inFileQuery, item.lineNumber, this.explorer._replaceStr);
		var link = dojo.create("a", {className: "navlink", id: this.getItemLinkId(item), href: linkLocation}, spanHolder, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
		dojo.connect(link, "onclick", link, function() { //$NON-NLS-0$
			that.explorer.getNavHandler().cursorOn(item);
		});
		return dojo.create("span", null, link, "only"); //$NON-NLS-1$ //$NON-NLS-0$
	};
	
	//This is an optional function for explorerNavHandler. It provides the div with the "href" attribute.
	//The explorerNavHandler hooked up by the explorer will check if the href exist as the attribute and react on enter key press.
	SearchResultRenderer.prototype.getRowActionElement = function(tableRowId){
		return dojo.byId(this.getItemLinkId(tableRowId));
	};
	
	SearchResultRenderer.prototype.getLocationSpanId = function(item){
		return this.explorer.model.getId(item) + "_locationSpan"; //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getFileSpanId = function(item){
		return this.explorer.model.getId(item) + "_fileSpan"; //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getFileIconId = function(item){
		return this.explorer.model.getId(item) + "_fileIcon"; //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getItemLinkId = function(itemOrId){
		if(typeof itemOrId === "string"){ //$NON-NLS-0$
			return itemOrId + "_itemLink"; //$NON-NLS-0$
		}
		return this.explorer.model.getId(itemOrId) + "_itemLink"; //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getDetailIconId = function(item){
		return this.explorer.model.getId(item) + "_detailIcon"; //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.renderLocationElement = function(item, onSpan){
		var spanHolder = onSpan ? onSpan: dojo.byId(this.getLocationSpanId(item));
		dojo.empty(spanHolder);
		var qParams = mSearchUtils.copyQueryParams(this.explorer.model.queryObj, true);
		qParams.location = item.parentLocation;
		qParams.start = 0;
		var href =  mSearchUtils.generateSearchHref(qParams);
		var link = dojo.create("a", {className: "navlinkonpage", href: href}, spanHolder, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		link.title = dojo.string.substitute(messages["Search again in this folder with \"${0}\""], [this.explorer.model.queryObj.searchStrTitle]);
		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
		var that = this;
		dojo.connect(link, "onclick", link, function() { //$NON-NLS-0$
			that.explorer.closeContextTip();
		});
		dojo.place(document.createTextNode(item.fullPathName), link, "only"); //$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getPrimColumnStyle = function(){
		return "search_primaryColumn";//$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getSecondaryColumnStyle = function(){
		return "search_secondaryColumn";//$NON-NLS-0$
	};
	
	SearchResultRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col, span, link;
			col = document.createElement('td'); //$NON-NLS-0$
			if(item.type ===  "file"){ //$NON-NLS-0$
				col.noWrap = true;
				span = dojo.create("span", {id: this.getFileIconId(item)}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				if(this.explorer.model.queryObj.searchStr !== ""){
					this.getExpandImage(tableRow, span, "core-sprite-file"); //$NON-NLS-0$
				} else {
					var decorateImage = dojo.create("span", null, span, "last"); //$NON-NLS-0$ //$NON-NLS-0$
					dojo.addClass(decorateImage, "imageSprite"); //$NON-NLS-0$
					dojo.addClass(decorateImage, "core-sprite-file");//$NON-NLS-0$
				}
			} else {
				span = dojo.create("span", {}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				col.noWrap = true;
				col.align = "right"; //$NON-NLS-0$
				this.renderDetailLineNumber(item,  span);
			}
			return col;
		case 1:
			var col, span, link;
			col = document.createElement('td'); //$NON-NLS-0$
			span = dojo.create("span", {id: this.getFileSpanId(item)}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			var that = this;
			if(item.type ===  "file"){ //$NON-NLS-0$
				var renderName = item.totalMatches ? item.name + " (" + item.totalMatches + " matches)" : item.name; //$NON-NLS-1$ //$NON-NLS-0$
				this.renderFileElement(item, span, renderName);
			} else {
				this.renderDetailElement(item, tableRow, span);
				var iconSpan = dojo.create("span", {id: this.getDetailIconId(item)}, span, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				var icon = dojo.create("span", null, iconSpan, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(icon, "imageSprite"); //$NON-NLS-0$
				dojo.addClass(icon, "core-sprite-none"); //$NON-NLS-0$
			}
			return col;
			
		case 2:
			col = document.createElement('td'); //$NON-NLS-0$
			if(item.type ===  "file"){ //$NON-NLS-0$
				span = dojo.create("span", {id: this.getLocationSpanId(item)}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
				if(item.parentLocation){
					this.renderLocationElement(item, span);
				}
			} 
			return col;
		}
	};
	SearchResultRenderer.prototype.constructor = SearchResultRenderer;
	
	
	function SearchReportRenderer(options, explorer){
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	};
	
	SearchReportRenderer.prototype = new mExplorer.SelectionRenderer();
	
	SearchReportRenderer.prototype.getCellHeaderElement = function(col_no){
		var th, h2;
		switch(col_no){
			case 0: 
				th = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				h2 = dojo.create("h2", null, th); //$NON-NLS-0$
				h2.textContent = messages["Files replaced"];
				break;
			case 1: 
				th = dojo.create("th", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				h2 = dojo.create("h2", null, th); //$NON-NLS-0$
				h2.textContent = messages["Status"];
				break;
		}
	};
	
	SearchReportRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
			var div = dojo.create("div", null, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			var span = dojo.create("span", { className: "primaryColumn"}, div, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			dojo.place(document.createTextNode(item.model.fullPathName + "/" + item.model.name), span, "only"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.connect(span, "onclick", span, function() { //$NON-NLS-0$
				window.open(item.model.linkLocation);
			});
			dojo.connect(span, "onmouseover", span, function() { //$NON-NLS-0$
				span.style.cursor ="pointer"; //$NON-NLS-0$
			});
			dojo.connect(span, "onmouseout", span, function() { //$NON-NLS-0$
				span.style.cursor ="default"; //$NON-NLS-0$
			});
			
			var operationIcon = dojo.create("span", null, div, "first"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(operationIcon, "imageSprite"); //$NON-NLS-0$
			
			if(item.status){
				switch (item.status) {
					case "warning": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-warning"); //$NON-NLS-0$
						return col;
					case "failed": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-error"); //$NON-NLS-0$
						return col;
					case "pass": //$NON-NLS-0$
						dojo.addClass(operationIcon, "core-sprite-ok"); //$NON-NLS-0$
						return col;
				}
			}
			return col;
		case 1:
			var statusMessage;
			if(item.status){
				switch (item.status) {
					case "warning": //$NON-NLS-0$
						statusMessage = item.message;
						break;
					case "failed": //$NON-NLS-0$
						statusMessage = item.message;
						break;
					case "pass": //$NON-NLS-0$
						statusMessage = dojo.string.substitute(messages["${0} out of ${1}  matches replaced."], [item.matchesReplaced, item.model.totalMatches]);
						break;
				}
				var td = dojo.create("td", {style: "padding-left: 5px; padding-right: 5px"}); //$NON-NLS-1$ //$NON-NLS-0$
				td.textContent = statusMessage;
				return td;
			}
		}
	};
	
	SearchReportRenderer.prototype.constructor = SearchReportRenderer;
	
	function SearchReportExplorer(parentId, reportList){
		this.parentId = parentId;
		this.reportList = reportList;
		this.renderer = new SearchReportRenderer({checkbox: false}, this);
	}
	SearchReportExplorer.prototype = new mExplorer.Explorer();
	
	SearchReportExplorer.prototype.report = function() {
		this.createTree(this.parentId, new mExplorer.ExplorerFlatModel(null, null, this.reportList));
	};

	SearchReportExplorer.prototype.constructor = SearchReportExplorer;


	/**
	 * Creates a new search result explorer.
	 * @name orion.SearchResultExplorer
	 */
	function SearchResultExplorer(registry, commandService){
		this.registry = registry;
		this._commandService = commandService;
		this.fileClient = new mFileClient.FileClient(this.registry);
		this.defaulRows = 40;
		this.declareCommands();
	}
	
	SearchResultExplorer.prototype = new mExplorer.Explorer();
	
	/**
	 * Clients can connect to this function to receive notification when the root item changes.
	 * @param {Object} item
	 */
	SearchResultExplorer.prototype.onchange = function(item) {
	};
	
	SearchResultExplorer.prototype.setResult = function(parentNode, resultLocation, queryStr, totalNumber) {
		var that = this;
		this.parentNode = parentNode;
		this.queryStr = queryStr;
		this.totalNumber = totalNumber;
		this.numberOnPage = resultLocation.length;
		this.model = new SearchResultModel(this.registry, this.fileClient, resultLocation, queryStr, 
						 { onMatchNumberChanged: function(fileItem){that.renderer.replaceFileElement(fileItem);}});
		this._replaceStr = this.model.queryObj.replace;
		if(this.model.replaceMode()){
			this._hasCheckedItems = true;
			this.checkbox = true;
			this.renderer = new SearchResultRenderer({checkbox: true, highlightSelection: false,
				  getCheckedFunc: function(item){return that.getItemChecked(item);},
				  onCheckedFunc: function(rowId, checked, manually){that.onRowChecked(rowId, checked, manually);}}, that);
		} else {
			this.checkbox = false;
			this.renderer = new SearchResultRenderer({checkbox: false, highlightSelection: false}, this);
		}
		
		this._reporting = false;
		this._uiFactory = null;
		this._currentPreviewModel = null;
		this._currentReplacedContents = null;
		this._popUpContext = false;
		this.timerRunning -= false;
		this._timer = null;
		this.twoWayCompareContainer = null;
	};
	
	/* one-time setup of commands */
	SearchResultExplorer.prototype.declareCommands = function() {
		var that = this;
		// page actions for search
		
		var saveResultsCommand = new mCommands.Command({
			name: messages["Save Search"],
			tooltip: messages["Save search query"],
			id: "orion.saveSearchResults", //$NON-NLS-0$
			callback: function(data) {
				that.saveSearch(that.queryStr);
			},
			visibleWhen : function(item) {
				return !that.model.replaceMode();
			}
		});
	
		var previewCurrentPageCommand = new mCommands.Command({
			name: messages['Replace'],
			tooltip: messages["Replace all matches with..."],
			id: "orion.previewCurrentPage", //$NON-NLS-0$
			callback: function(data) {
				that.preview();
			},
			visibleWhen : function(item) {
				return !that.model.replaceMode() && that.model.queryObj.searchStr !== "";
			}
		});
		
		var replaceAllCommand = new mCommands.Command({
			name: messages["Apply Changes"],
			tooltip: messages["Replace all selected matches"],
			id: "orion.globalSearch.replaceAll", //$NON-NLS-0$
			callback: function(data) {
				that.replaceAll();
			},
			visibleWhen : function(item) {
				return that.model.replaceMode() && !that._reporting && that._hasCheckedItems && that.model.queryObj.searchStr !== "";
			}
		});
	
		var hideCompareCommand = new mCommands.Command({
			name: messages["Hide Compare"],
			tooltip: messages["Hide compare view of changes"],
			id: "orion.globalSearch.hideCompare", //$NON-NLS-0$
			callback: function(data) {
				that.toggleCompare(false);
			},
			visibleWhen : function(item) {
				return that.model.replaceMode() && !that._reporting && that._uiFactory;
			}
		});
	
		var showCompareCommand = new mCommands.Command({
			name: messages["Show Compare"],
			tooltip: messages["Show compare view of changes"],
			id: "orion.globalSearch.showCompare", //$NON-NLS-0$
			callback: function(data) {
				that.toggleCompare(true);
			},
			visibleWhen : function(item) {
				return that.model.replaceMode() && !that._reporting && !that._uiFactory;
			}
		});
	
		var searchAgainCommand = new mCommands.Command({
			name: messages["Search Again"],
			tooltip: messages["Search again"],
			id: "orion.globalSearch.searchAgain", //$NON-NLS-0$
			callback : function() {
				return that.searchAgain();
			},
			visibleWhen : function(item) {
				return that._reporting || that.model.replaceMode();
			}
		});
	
		this._commandService.addCommand(saveResultsCommand);
		this._commandService.addCommand(previewCurrentPageCommand);
		this._commandService.addCommand(searchAgainCommand);
		this._commandService.addCommand(hideCompareCommand);
		this._commandService.addCommand(showCompareCommand);
		this._commandService.addCommand(replaceAllCommand);
		this._commandService.addCommandGroup("pageActions", "orion.searchActions.unlabeled", 200); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.saveSearchResults", 1, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions","orion.previewCurrentPage", 2, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.searchAgain", 3, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.hideCompare", 4, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.showCompare", 5, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageActions", "orion.globalSearch.replaceAll", 6, "orion.searchActions.unlabeled"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		var previousPage = new mCommands.Command({
			name : messages["< Previous Page"],
			tooltip: messages["Show previous page of search result"],
			id : "orion.search.prevPage", //$NON-NLS-0$
			hrefCallback : function() {
				var prevPage = that.caculatePrevPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				var qParams = mSearchUtils.copyQueryParams(that.model.queryObj, true);
				qParams.start = prevPage.start;
				return mSearchUtils.generateSearchHref(qParams);
			},
			visibleWhen : function(item) {
				var prevPage = that.caculatePrevPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				return (prevPage.start !== that.model.queryObj.start);
			}
		});
		var nextPage = new mCommands.Command({
			name : messages["Next Page >"],
			tooltip: messages["Show next page of search result"],
			id : "orion.search.nextPage", //$NON-NLS-0$
			hrefCallback : function() {
				var nextPage = that.caculateNextPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				var qParams = mSearchUtils.copyQueryParams(that.model.queryObj, true);
				qParams.start = nextPage.start;
				return mSearchUtils.generateSearchHref(qParams);
			},
			visibleWhen : function(item) {
				var nextPage = that.caculateNextPage(that.model.queryObj.start, that.model.queryObj.rows, that.totalNumber);
				return (nextPage.start !== that.model.queryObj.start);
			}
		});
		var nextResultCommand = new mCommands.Command({
			tooltip : messages["Next result"],
			imageClass : "core-sprite-move_down", //$NON-NLS-0$
			id: "orion.search.nextResult", //$NON-NLS-0$
			groupId: "orion.searchGroup", //$NON-NLS-0$
			visibleWhen : function(item) {
				return !that._reporting;
			},
			callback : function() {
				that.gotoNext(true, true);
		}});
		var prevResultCommand = new mCommands.Command({
			tooltip : messages["Previous result"],
			imageClass : "core-sprite-move_up", //$NON-NLS-0$
			id: "orion.search.prevResult", //$NON-NLS-0$
			groupId: "orion.searchGroup", //$NON-NLS-0$
			visibleWhen : function(item) {
				return !that._reporting;
			},
			callback : function() {
				that.gotoNext(false, true);
		}});
		this._commandService.addCommand(previousPage);
		this._commandService.addCommand(nextPage);
		this._commandService.addCommand(nextResultCommand);
		this._commandService.addCommand(prevResultCommand);
		mExplorer.createExplorerCommands(this._commandService, function(item){
			return !item._reporting && that.model.queryObj.searchStr !== "";
		});
		// Register command contributions
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.explorer.expandAll", 1); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.explorer.collapseAll", 2); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.search.nextResult", 3); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.search.prevResult", 4); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.search.prevPage", 5); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.registerCommandContribution("pageNavigationActions", "orion.search.nextPage", 6); //$NON-NLS-1$ //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype.loadOneFileMetaData =  function(index, onComplete){
		if(this._crawling){
			return;
		}
		var item = this.model.indexedFileItems[index];
		var that = this;
		this.fileClient.read(item.location, true).then(
			dojo.hitch(this, function(meta) {
				item.fullPathName = mSearchUtils.fullPathNameByMeta(meta.Parents);
				item.parentLocation = meta.Parents[0].Location;
				item.stale = (item.lastModified !== meta.LocalTimeStamp);
				item.ETag = meta.ETag;
				if(item.stale){
					this.model.checkStale(item, function(item){
						//that.renderer.renderLocationElement(item);
						that.renderer.staleFileElement(item);
					});
				} else {
					//this.renderer.renderLocationElement(item);
				}
			    if(index === this.model.indexedFileItems.length){	
			    	if(onComplete){
			    		onComplete();
			    	} else {
			    		return; 
			    	}
			    } else {
					this.loadOneFileMetaData(index+1, onComplete);
			    }
			}),
			dojo.hitch(this, function(error) {
				console.error("Error loading file metadata: status " + error.status); //$NON-NLS-0$
				//If we can't load file meta data we have to stale the file.
				item.stale = true;
				this.renderer.staleFileElement(item);
				if(index === this.model.indexedFileItems.length){
			    	if(onComplete){
			    		onComplete();
			    	} else {
			    		return; 
			    	}
				} else {
					this.loadOneFileMetaData( index+1, onComplete);
				}
			})
		);
	};

	SearchResultExplorer.prototype.setCrawling = function(crawling) {
		this._crawling = crawling;
	};
	
	SearchResultExplorer.prototype.preview = function() {
		var that = this;
		this._commandService.openParameterCollector("pageActions", function(parentDiv) { //$NON-NLS-0$
			// create replace text
			var replaceStringDiv = document.createElement('input'); //$NON-NLS-0$
			replaceStringDiv.type = "text"; //$NON-NLS-0$
			replaceStringDiv.name = "ReplaceWith:"; //$NON-NLS-0$
			replaceStringDiv.id = "globalSearchReplaceWith"; //$NON-NLS-0$
			replaceStringDiv.placeholder="Replace With"; //$NON-NLS-0$
			//dojo.addClass(replaceStringDiv, 'searchCmdGroupMargin');
			replaceStringDiv.onkeydown = function(e){
				if (e.keyCode === dojo.keys.ENTER) {
					var replaceInputDiv = dojo.byId("globalSearchReplaceWith"); //$NON-NLS-0$
					that._commandService.closeParameterCollector();
					return that.doPreview(replaceInputDiv.value);
				}
				if( e.keyCode === 27/*ESC*/ ){
					that._commandService.closeParameterCollector();
					return false;
				}
			};
			parentDiv.appendChild(replaceStringDiv);

			// create the command span for Replace
			var span = document.createElement('span'); //$NON-NLS-0$
			dojo.addClass(span, "parameters"); //$NON-NLS-0$
			span.id = "globalSearchReplaceCommands"; //$NON-NLS-0$
			parentDiv.appendChild(span);
			return replaceStringDiv;
		});
		
		var replaceDiv = document.getElementById("globalSearchReplaceWith"); //$NON-NLS-0$
		replaceDiv.value = this.model.defaultReplaceStr;
		window.setTimeout(function() {
			replaceDiv.select();
			replaceDiv.focus();
		}, 10);	
		
		
		var innerReplaceAllCommand = new mCommands.Command({
			name : "Preview Changes", //$NON-NLS-0$
			image : require.toUrl("images/replaceAll.gif"), //$NON-NLS-0$
			id : "orion.globalSearch.innerReplaceAll", //$NON-NLS-0$
			groupId : "orion.searchGroup", //$NON-NLS-0$
			callback : function() {
				var replaceInputDiv = dojo.byId("globalSearchReplaceWith"); //$NON-NLS-0$
				that._commandService.closeParameterCollector();
				return that.doPreview(replaceInputDiv.value);
			}
		});

		this._commandService.addCommand(innerReplaceAllCommand);

		// Register command contributions
		this._commandService.registerCommandContribution("globalSearchReplaceCommands", "orion.globalSearch.innerReplaceAll", 1); //$NON-NLS-1$ //$NON-NLS-0$
		this._commandService.renderCommands("globalSearchReplaceCommands", "globalSearchReplaceCommands", this, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype._fileExpanded = function(fileIndex, detailIndex){
		var filItem = this.model.indexedFileItems[fileIndex];
		if(detailIndex === null || detailIndex === undefined){
			return {childrenNumber: 0, childDiv: dojo.byId(this.model.getId(filItem))};
		}
		if(filItem.children && filItem.children.length > 0){
			if(detailIndex < 0){
				detailIndex = filItem.children.length -1;
			} else if (detailIndex >= filItem.children.length){
				detailIndex = 0;
			}
			return  {childrenNumber: filItem.children.length, childDiv: dojo.byId(this.model.getId(filItem.children[detailIndex]))};
		}
		return {childrenNumber: 0, childDiv: null};
	};
	
	SearchResultExplorer.prototype.doPreview = function(replacingStr, all) {
		window.sessionStorage["global_search_default_replace_string"] = replacingStr; //$NON-NLS-0$
		var qParams = mSearchUtils.copyQueryParams(this.model.queryObj, true);
		qParams.replace = replacingStr;
		if(all){
			qParams.start = 0;
			qParams.rows = this.totalNumber;
		}
		var href =  mSearchUtils.generateSearchHref(qParams);
		window.location.href = href;
	};

	SearchResultExplorer.prototype.searchAgain = function() {
		var qParams = mSearchUtils.copyQueryParams(this.model.queryObj, true);
		qParams.replace = null;
		if(qParams.rows > this.defaulRows ){
			qParams.rows = this.defaulRows;
		}
		var href =  mSearchUtils.generateSearchHref(qParams);
		if(href === window.location.href){
			window.location.reload();
		} else {
			window.location.href = href;
		}
	};

	SearchResultExplorer.prototype.replaceAll = function() {
		var reportList = [];
		var that = this;
		this._reporting = true;
		this.initCommands();
		this.reportStatus(messages["Writing files..."]);	
		this.model.writeIncrementalNewContent( this._replaceStr, this.model.indexedFileItems, reportList, 0, function(modellist){
			
			dojo.empty(that.getParentDivId());
			var reporter = new SearchReportExplorer(that.getParentDivId(), reportList);
			reporter.report();
			that.reportStatus("");	
		});
	};
	
	SearchResultExplorer.prototype.toggleCompare = function(show) {
		this.replacePreview(false, show);
	};
	
	SearchResultExplorer.prototype.replacePreview = function(init, comparing) {

		dojo.empty(this.getParentDivId());
		if(comparing){
			this._uiFactory = new mSearchFeatures.SearchUIFactory({
				parentDivID: this.getParentDivId()
			});
			this._uiFactory.buildUI();
			this.twoWayCompareContainer = null;
			this._currentPreviewModel = null;
		} else {
			if(this._uiFactory){
				this._uiFactory.destroy();
			}
			this._uiFactory = null;
			this.twoWayCompareContainer = null;
			this._currentPreviewModel = null;
		}
		this.initCommands();
		if(init){
			this.reportStatus(messages["Preparing preview..."]);	
		}
		var that = this;
		this.createTree(this._uiFactory ? this._uiFactory.getMatchDivID() : this.getParentDivId(), this.model, {selectionPolicy: "cursorOnly", indent: 0, onCollapse: function(model){that.onCollapse(model);}}); //$NON-NLS-0$

		if(init){
			this.hookUpNavHandler();
			this.gotoCurrent(this.restoreLocationStatus());
			this.reportStatus("");	
			this.loadOneFileMetaData(0, function(){that.refreshIndex();});
		} else {
			this.hookUpNavHandler();
			this.gotoCurrent(this.restoreLocationStatus());
		}
	};
	
	SearchResultExplorer.prototype.getItemChecked = function(item) {
		if(item.checked === undefined){
			item.checked = true;
		}
		return item.checked;
	};
	
	SearchResultExplorer.prototype._checkedItem = function() {
		for(var i = 0; i < this.model.indexedFileItems.length; i++){
			if(this.model.indexedFileItems[i].checked){
				return true;
			}
			if(!this.model.indexedFileItems[i].children){
				continue;
			}
			for(var j = 0; j < this.model.indexedFileItems[i].children.length; j++){
				if(this.model.indexedFileItems[i].children[j].checked){
					return true;
				}
			}
		}
		return false;
	};
	
	SearchResultExplorer.prototype.onRowChecked = function(rowId, checked, manually) {
		var hasCheckedItems;
		if(!rowId){
			hasCheckedItems = checked;
			this.onItemChecked(this.model._listRoot, checked, manually);
		} else {
			var row = dojo.byId(rowId);
			if(row && row._item){
				this.onItemChecked(row._item, checked, manually);
			}
			hasCheckedItems = this._checkedItem();
		}
		if(hasCheckedItems !== this._hasCheckedItems){
			this._hasCheckedItems = hasCheckedItems;
			this.initCommands();
		}
	};
	
	SearchResultExplorer.prototype.onNewContentChanged = function(fileItem) {
		if(fileItem === this.model.fileModel(this.getNavHandler().currentModel())){
			this.buildPreview(true);
		}
	};
	
	SearchResultExplorer.prototype.onItemChecked = function(item, checked, manually) {
		item.checked = checked;
		if(item.type === "file" || item.isRoot){ //$NON-NLS-0$
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
			if(item.type === "file"){ //$NON-NLS-0$
				this.onNewContentChanged(item);
			}
		} else if(manually){
			this.onNewContentChanged(item.parent);
		}
	};
	
	SearchResultExplorer.prototype._getContentType = function(fileItem){
		return this.registry.getService("orion.core.contenttypes").getFilenameContentType(fileItem.name); //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype.buildPreview = function(updating) {
		if(!this._uiFactory){
			return;
		}
		if(this.model.indexedFileItems.length === 0){
			return;
		}
		var uiFactory = this._uiFactory;
		var fileItem = this.model.fileModel(this.getNavHandler().currentModel());
		this._currentPreviewModel = fileItem;
		if(!updating || !this._currentReplacedContents){
			this._currentReplacedContents = [];
		}
		var that = this;
		this.model.getFileContent(fileItem, function(fileItem){
			mSearchUtils.generateNewContents(fileItem.contents, that._currentReplacedContents, fileItem, that._replaceStr, that.model.queryObj.inFileQuery.searchStrLength); 
			// Diff operations
			var fType = that._getContentType(fileItem);
			dojo.when(fType, function(fType) {
				var options = {
					readonly: true,
					hasConflicts: false,
					newFile: {
						Name: fileItem.location,
						Type: fType,
						Content: fileItem.contents.join(that.model._lineDelimiter)
					},
					baseFile: {
						Name: fileItem.location,
						Type: fType,
						Content: that._currentReplacedContents.join(that.model._lineDelimiter)
					}
				};
				if(!that.twoWayCompareContainer){
					that.uiFactoryCompare = new mCompareFeatures.TwoWayCompareUIFactory({
						parentDivID: uiFactory.getCompareDivID(),
						showTitle: true,
						rightTitle: dojo.string.substitute(messages["Replaced File (${0})"], [fileItem.name]),
						leftTitle: dojo.string.substitute(messages["Original File (${0})"], [fileItem.name]),
						showLineStatus: false
					});
					that.uiFactoryCompare.buildUI();
					that.twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(that.registry, uiFactory.getCompareDivID(), that.uiFactoryCompare, options);
					that.twoWayCompareContainer.startup();
				} else {
					dojo.empty(that.uiFactoryCompare.getTitleDivId());
					dojo.place(document.createTextNode(dojo.string.substitute(messages['Replaced File (${0})'], [fileItem.name])), that.uiFactoryCompare.getTitleDivId(), "only"); //$NON-NLS-1$
					dojo.empty(that.uiFactoryCompare.getTitleDivId(true));
					dojo.place(document.createTextNode(dojo.string.substitute(messages['Original File (${0})'], [fileItem.name])), that.uiFactoryCompare.getTitleDivId(true), "only"); //$NON-NLS-1$
					that.twoWayCompareContainer.setOptions(options);
					that.twoWayCompareContainer.setEditor();
				}
				window.setTimeout(function(){
					dijit.byId(that.getParentDivId()).resize();
					that.renderer.focus();
				}, 100);
			});
		});
	};
	
	
	SearchResultExplorer.prototype.addSavedSearch = function(searchName, query) {
		this.registry.getService("orion.core.savedSearches").addSearch(searchName, query); //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype.saveSearch = function(query) {
		var queryObj = mSearchUtils.parseQueryStr(query);
		var qName = query;
		if(queryObj && typeof(queryObj.searchStrTitle) === "string" && typeof(queryObj.location) === "string" ){ //$NON-NLS-1$ //$NON-NLS-0$
			qName = "\'" + queryObj.searchStrTitle + "\' in ";// +queryObj.location; //$NON-NLS-1$ //$NON-NLS-0$
			if(queryObj.location.length > 0){
				this.fileClient.read(queryObj.location, true).then(
					dojo.hitch(this, function(meta) {
						var parentName = mSearchUtils.fullPathNameByMeta(meta.Parents);
						var fullName = parentName.length === 0 ? meta.Name: parentName + "/" + meta.Name; //$NON-NLS-0$
						this.addSavedSearch(qName + fullName, query);
					}),
					dojo.hitch(this, function(error) {
						console.error("Error loading file meta data: " + error.message); //$NON-NLS-0$
						this.addSavedSearch(qName + "root", query); //$NON-NLS-0$
					})
				);
			} else {
				this.addSavedSearch(qName + "root", query); //$NON-NLS-0$
			}
		} else {
			this.addSavedSearch(qName, query);
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
		this._commandService.destroy("pageActions"); //$NON-NLS-0$
		this._commandService.renderCommands("pageActions", "pageActions", that, that, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		this._commandService.destroy("pageNavigationActions"); //$NON-NLS-0$
		this._commandService.renderCommands("pageNavigationActions", "pageNavigationActions", that, that, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if(this.model.queryObj.searchStr !== ""){
			var newMenu = this._commandService._createDropdownMenu("pageNavigationActions", messages['Options'], false, function() { //$NON-NLS-0$
				if(!that.model.replaceMode()){
					that._commandService._generateCheckedMenuItem(newMenu.menu, messages["Sort by Name"], that.model.sortByName,
						function(event) {
							that.sortWithName(event.target.checked);
							window.setTimeout(function() {newMenu.dropdown.close(true);}, 100);  // so user can see the check take effect briefly before it closes
						});
				} else {
					that._commandService._generateCheckedMenuItem(newMenu.menu, messages["Compare changes"], true,
						function(event) {
							that.toggleCompare(event.target.checked);
							window.setTimeout(function() {newMenu.dropdown.close(true);}, 100);
						});
				}		
			}); 
		}
	};
	
	SearchResultExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message);	 //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype.isExpanded = function(model){
		return this.myTree.isExpanded(this.model.getId(model));
	};
	
	SearchResultExplorer.prototype.popupContext = function(model){
		var that =this;
	    var modelLinkId = this.renderer.getDetailIconId(model);
		var tableNode = this.renderer.generateContextTip(model);
	    that.contextTipDialog.attr("content", tableNode); //$NON-NLS-0$
		//var pos = dojo.position(modelLinkId, true);
 	    var aroundNode = dojo.byId(modelLinkId);
	    var orient = {'TR':'TL', 'TR':'TL'}; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	    if(aroundNode){
		    var parentNode = this.myTree._parent;
			var parentRect = parentNode.getClientRects()[0];
			var rects = aroundNode.getClientRects();
			for (var i = 0, l = rects.length; i < l; i++) {
				var r = rects[i];
				if((r.bottom + 100) > parentRect.bottom){
				    orient = {'TR':'BL', 'TR':'BL'}; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					break;
				}
			}
	    }
	    dijit.popup.open({
        	popup: that.contextTipDialog,
	        around: aroundNode,
	        orient: orient
	    });
	};
	
	SearchResultExplorer.prototype.closeContextTip = function(remainFlag){
		if(!this.model.replaceMode()){
			dijit.popup.close(this.contextTipDialog);
			if(!remainFlag){
				this._popUpContext = false;
			}
			this.renderer.replaceDetailIcon(this.getNavHandler().currentModel(), "right"); //$NON-NLS-0$
		}
		
	};
	
	SearchResultExplorer.prototype.onCollapse = function(model) {
		var curModel = this.getNavHandler().currentModel();
		if(!curModel){
			return;
		}
		if(curModel.type === "detail"){ //$NON-NLS-0$
			var curFileModel = this.model.fileModel(model);
			if(curFileModel === model){
				this.getNavHandler().cursorOn(model);
			}
		}
	};
	
	SearchResultExplorer.prototype.onExpand = function(modelToExpand, childPosition, callback) {
		if(modelToExpand && modelToExpand.children && modelToExpand.children.length > 0 && typeof(childPosition) === "string"){ //$NON-NLS-0$
			var childIndex = 0;
			var forward = true;
			if(childPosition === "first" ){ //$NON-NLS-0$
				childIndex = 0;
			} else if (childPosition === "last"){ //$NON-NLS-0$
				childIndex =  modelToExpand.children.length -1;
				forward = false;
			} else {
				childIndex = JSON.parse(childPosition);
				forward = false;
			}
			if(typeof(childIndex) === "string" || childIndex <0 || childIndex >= modelToExpand.children.length){ //$NON-NLS-0$
				childIndex = 0;
			}	
			this.getNavHandler().cursorOn(modelToExpand.children[childIndex]);
		}
	};
			
	SearchResultExplorer.prototype.forceExpandFunc = function(modelToExpand, childPosition, callback){
		this.myTree.expand(modelToExpand, dojo.hitch(this, function() {
			this.onExpand(modelToExpand , childPosition, callback);
		}));
		return null;
	};
	
	//Provide the key listening div.If not provided this._myTree._parent will be used.
	SearchResultExplorer.prototype.keyEventListeningDiv = function(secondLevel){
		return dojo.byId(this.getParentDivId(secondLevel));

	};
	
	SearchResultExplorer.prototype.onFocus = function(focus){
		if(!focus){
			this.closeContextTip();
		}
	};
	
	SearchResultExplorer.prototype.preventDefaultFunc = function(e, model){
		if(!model){
			return true;
		}
		if(!this.model.replaceMode() && !e.ctrlKey && model.type === "detail"){ //$NON-NLS-0$
			if(e.keyCode === dojo.keys.LEFT_ARROW && this._popUpContext){
				this.closeContextTip();
				e.preventDefault();
				return true;
			}
			if(e.keyCode === dojo.keys.RIGHT_ARROW && !this._popUpContext){
				this._popUpContext = true;
				this.renderer.replaceDetailIcon(model, "left"); //$NON-NLS-0$
				this.popupContext(model);
				e.preventDefault();
				return true;
			}
		}
		return false;
	};
	
	SearchResultExplorer.prototype.onReplaceCursorChanged = function(prevModel, currentModel){
		var that = this;
		if(!this.model.sameFile(this._currentPreviewModel, currentModel)){
			this.buildPreview();
		}
		if(currentModel.type === "detail"){ //$NON-NLS-0$
			if(!currentModel.newMatches){
				that.renderer.focus();
				return;
			}
			this.twoWayCompareContainer.gotoMatch(currentModel.lineNumber-1, currentModel.matches[currentModel.matchNumber-1], 
					currentModel.newMatches[currentModel.matchNumber-1], this.model.queryObj.inFileQuery.searchStrLength,
					function(){window.setTimeout(function(){that.renderer.focus();}, 200);});
			window.setTimeout(function(){that.renderer.focus();}, 0);
		}
	};	
	
	SearchResultExplorer.prototype.onCursorChanged = function(prevModel, currentModel){
		this.renderer.replaceDetailIcon(prevModel, "none");	 //$NON-NLS-0$
		this.model.storeStatus(currentModel);
		var that = this;
		if(this.model.replaceMode() ){
			if(!this._uiFactory){
				return;
			}
			if(!this._timer){
				this._timer = window.setTimeout(function(){that.onReplaceCursorChanged(prevModel, currentModel);that.timerRunning = false;that._timer = null;}, 500);
			} else if (this.timerRunning){
				window.clearTimeOut(this._timer);
				this._timer = window.setTimeout(function(){that.onReplaceCursorChanged(prevModel, currentModel);that.timerRunning = false;that._timer = null;}, 500);
			}
		} else if(currentModel.type === "detail"){ //$NON-NLS-0$
			if(this._popUpContext){
				this.popupContext(currentModel);
				this.renderer.replaceDetailIcon(currentModel, "left"); //$NON-NLS-0$
			} else {
				this.renderer.replaceDetailIcon(currentModel, "right"); //$NON-NLS-0$
			}
		} else{
			if(this._popUpContext){
				this.closeContextTip(true);
			}
		}
	};
	
	SearchResultExplorer.prototype.hookUpNavHandler = function(){
		if(!this.getNavHandler()){
			var options = {
					preventDefaultFunc: dojo.hitch(this, function(event, model) {
						return this.preventDefaultFunc(event, model);
					}),
					onCursorChanged: dojo.hitch(this, function(prevModel, currentModel) {
						this.onCursorChanged(prevModel, currentModel);
					}) 
			};
			var selModel = this.getSelectionModel();
			selModel.navHandler = new mNavHandler.ExplorerNavHandler(this, this.selectionModel.navDict, options);
		} else {
			this.getNavHandler().focus();
		}
		this.getNavHandler().refreshModel(this.getNavDict(), this.model, this.model._listRoot.children);
	};
	
	SearchResultExplorer.prototype.startUp = function() {
		if(this.model.queryObj.searchStrTitle){
			if (this.numberOnPage > 0) {
				var pageTitle = dojo.byId("pageTitle"); //$NON-NLS-0$
				if(pageTitle){
					if(!this.model.replaceMode()){
						pageTitle.textContent = messages["Search Results"];
					} else {
						pageTitle.textContent = messages["Replace All Matches"];
					}
				}
			} else {
				this.parentNode.textContent = "";
				var textBold = dojo.create("b", null, this.parentNode, "last"); //$NON-NLS-1$ //$NON-NLS-0$
				var displayStr = dojo.string.substitute(messages["No matches found for ${0}"], 
					[this.model.queryObj.searchStrTitle]); 
				dojo.place(document.createTextNode(displayStr), textBold, "only"); //$NON-NLS-0$
				return;
			} 
		}
		var that = this;
		this.model.buildResultModel();
		if(!this.model.replaceMode()){
		    this.contextTipDialog = new dijit.TooltipDialog({
		        content: "",
		        onBlur: function(){
		            that.closeContextTip();
		        }
		    });
			this.initCommands();
			dojo.empty(this.getParentDivId());
			this.createTree(this.getParentDivId(), this.model, {selectionPolicy: "cursorOnly", indent: 0, onCollapse: function(model){that.onCollapse(model);}}); //$NON-NLS-0$
			this.hookUpNavHandler();
			this.gotoCurrent(this.restoreLocationStatus());
			this.reportStatus("");	
			this.loadOneFileMetaData(0, function(){that.refreshIndex();});
		} else {
			that.replacePreview(true, true);
		}
	};
	
	SearchResultExplorer.prototype.incrementalRender = function() {
		var that = this;
		this.model.buildResultModel();
		this.createTree(this.getParentDivId(), this.model, {selectionPolicy: "cursorOnly", indent: 0, onCollapse: function(model){that.onCollapse(model);}}); //$NON-NLS-0$
	};
	
	SearchResultExplorer.prototype.restoreLocationStatus = function() {
		var currentFileLocation = window.sessionStorage[this.model.queryObj.queryStr + "_search_result_currentFileLocation"]; //$NON-NLS-0$
		var fileModel = this.model.location2Model(currentFileLocation);
		var currentDetailIndex = "none"; //$NON-NLS-0$
		var detailIndexCached = window.sessionStorage[this.model.queryObj.queryStr + "_search_result_currentDetailIndex"]; //$NON-NLS-0$
		if (typeof detailIndexCached === "string") { //$NON-NLS-0$
			if (detailIndexCached.length > 0) {
				currentDetailIndex = detailIndexCached;
			} 
		}
		return {file: fileModel, detail: currentDetailIndex};
	};
	
	SearchResultExplorer.prototype.refreshIndex = function(){
		var newIndex = [];
		var currentFileItem = this.model.fileModel(this.getNavHandler().currentModel());
		for(var i = 0; i <  this.model.indexedFileItems.length; i++){
			if(!this.model.indexedFileItems[i].stale){
				newIndex.push(this.model.indexedFileItems[i]);
			} else if(currentFileItem === this.model.indexedFileItems[i]){
				currentFileItem = null;
			}
		}
		this.model.indexedFileItems = newIndex;
		if(this.model.indexedFileItems.length === 0){
			this.getNavHandler().refreshModel(this.getNavDict(), this.model, this.model._listRoot.children);
			this.getNavHandler().cursorOn(null, true);
		} else if(!currentFileItem){
			this.getNavHandler().cursorOn(null, true);
			this.getNavHandler().refreshModel(this.getNavDict(), this.model, this.model._listRoot.children);
			this.gotoCurrent();
		} else {
			this.getNavHandler().refreshModel(this.getNavDict(), this.model, this.model._listRoot.children, true);
		}
	};
	
	//provide to the expandAll/collapseAll commands
	SearchResultExplorer.prototype.getItemCount  = function(){
		return this.model._listRoot.children.length;
	};
	
	SearchResultExplorer.prototype.sortWithName = function(byName) {
		if(this.model.sortByName === byName){
			return;
		}
		var qParams = mSearchUtils.copyQueryParams(this.model.queryObj);
		qParams.sort = byName ? "NameLower asc" : "Path asc"; //$NON-NLS-1$ //$NON-NLS-0$
		qParams.start = 0;
		var href =  mSearchUtils.generateSearchHref(qParams);
		window.location.href = href;
	};

	SearchResultExplorer.prototype.getParentDivId = function(secondLevel){
		if(!this.model.replaceMode() || !secondLevel){
			return this.parentNode.id;
		} else {
			return this._uiFactory ? this._uiFactory.getMatchDivID() : this.parentNode.id;
		}
	};
	
	SearchResultExplorer.prototype.gotoCurrent = function(cachedItem) {
		var modelToExpand = null;
		var detailIndex = "none"; //$NON-NLS-0$
		if(cachedItem){
			modelToExpand = cachedItem.file;
			detailIndex = cachedItem.detail;
		} else {
			modelToExpand = this.getNavHandler().currentModel();
		}
		this.getNavHandler().cursorOn(modelToExpand, true);
		if(modelToExpand && detailIndex && detailIndex !== "none"){ //$NON-NLS-0$
			this.myTree.expand(modelToExpand, dojo.hitch(this, function() {
				this.onExpand(modelToExpand, detailIndex);
			}));
		}
	};
	
	SearchResultExplorer.prototype.gotoNext = function(next, forceExpand)	{
		if(this.model.indexedFileItems.length === 0){
			return;
		}
		this.getNavHandler().iterate(next, forceExpand);
	};
	
	SearchResultExplorer.prototype.constructor = SearchResultExplorer;

	//return module exports
	return {
		SearchResultExplorer: SearchResultExplorer
	};
});
