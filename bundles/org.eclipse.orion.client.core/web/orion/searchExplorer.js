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

define(['require', 'dojo', 'dijit','orion/explorer', 'orion/treeIterator', 'orion/util', 'orion/fileClient', 'orion/commands', 'orion/searchUtils', 'orion/globalSearch/search-features', 'orion/compare/compare-features', 'orion/compare/compare-container', 'dijit/TooltipDialog'], 
		function(require, dojo, dijit, mExplorer, mTreeIterator, mUtil, mFileClient, mCommands, mSearchUtils, mSearchFeatures, mCompareFeatures, mCompareContainer) {

	function SearchResultModel(	serviceRegistry, fileClient, resultLocation, queryStr, options) {
		this.registry= serviceRegistry;
		this.fileClient = fileClient; 
		this._resultLocation = resultLocation;
		this._listRoot = {
				built: false,
				isRoot: true,
				children:[]
		};
		this.indexedFileItems = [];
		this.modelLocHash = [];
		this._lineDelimiter = "\n"; 
		this.onMatchNumberChanged = options.onMatchNumberChanged;
		this.queryObj = mSearchUtils.parseQueryStr(queryStr);
	}
	SearchResultModel.prototype = new mExplorer.ExplorerModel(); 
	
	SearchResultModel.prototype.normalMode = function(){
		return (this.queryObj.replace === null);
	};
	
	SearchResultModel.prototype.sameFile = function(){
		var prevSelection = this.iterator.prevCursor();
		var curSelection = this.iterator.cursor();
		return this.fileModel(prevSelection) === this.fileModel(curSelection);
	};
	
	SearchResultModel.prototype.fileModel = function(model){
		if(model.type === "file"){
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
		var lookAt = this.indexedFileItems;
		if(location){
			for(var i = 0 ; i < lookAt.length; i++){
				if(lookAt[i].location === location){
					return lookAt[i];
				}
			}
		}
		if(lookAt.length > 0){
			return lookAt[0];
		}
		return null;
	};
	
	SearchResultModel.prototype.storeStatus = function() {
		var currentModel = this.iterator.cursor();
		if(currentModel){
			var fileItem = this.fileModel(currentModel);
			window.sessionStorage[this.queryObj.queryStr + "_search_result_currentFileLocation"] = fileItem.location;
			if(currentModel.type === "file"){
				window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"] = "none";
			} else {
				window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"] = JSON.stringify(this.model2Index(currentModel));
			}
			
		}
	};
	
	SearchResultModel.prototype.restoreGlobalStatus = function() {
		this.defaultReplaceStr = this.queryObj.searchStrTitle;
		var defaultReplaceStr = window.sessionStorage["global_search_default_replace_string"];
		if (typeof defaultReplaceStr === "string") {
			if (defaultReplaceStr.length > 0) {
				this.defaultReplaceStr= defaultReplaceStr;
			} 
		}
		this.sortByName = (this.queryObj.sort.indexOf("Name") > -1);
	};
	
	SearchResultModel.prototype.restoreLocationStatus = function() {
		var currentFileLocation = window.sessionStorage[this.queryObj.queryStr + "_search_result_currentFileLocation"];
		var fileModel = this.location2Model(currentFileLocation);
		this.iterator.setCursor(fileModel);
		var currentDetailIndex = "none";
		var detailIndexCached = window.sessionStorage[this.queryObj.queryStr + "_search_result_currentDetailIndex"];
		if (typeof detailIndexCached === "string") {
			if (detailIndexCached.length > 0) {
				currentDetailIndex = detailIndexCached;
			} 
		}
		return currentDetailIndex;
	};
	
	SearchResultModel.prototype.getRoot = function(onItem){
		onItem(this._listRoot);
	};
	
	SearchResultModel.prototype.buildResultModel = function(){
		this.restoreGlobalStatus();
		this.buildFlatModel();
	};
	
	SearchResultModel.prototype.buildFlatModel = function(){
		if(this._listRoot.built){
			return;
		}
		this._listRoot.built = true;
		this.indexedFileItems = [];
		for(var i = 0; i < this._resultLocation.length; i++){
			var childNode = {parent: this._listRoot, type: "file", name: this._resultLocation[i].name,lastModified: this._resultLocation[i].lastModified,
							linkLocation: this._resultLocation[i].linkLocation, location: this._resultLocation[i].location, model:this._resultLocation[i].model};
			this.modelLocHash[childNode.location] = childNode;
			this._listRoot.children.push(childNode);
			this.indexedFileItems.push(childNode);
		}
		this.iterator.setTree(this.indexedFileItems); 
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
					console.error("Error loading file contents: " + error.message);
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
				this.generateNewContents(fileItem.contents, newContents, fileItem, replaceStr); 
				var contents = newContents.join(this._lineDelimiter);
				
				var etag = fileItem.ETag;
				var args = etag ? { "ETag" : etag }: null;
				this.fileClient.write(model.location, contents, args).then(
					dojo.hitch(this, function(result) {
						reportList.push({model: model, matchesReplaced: matchesReplaced, status: "pass" });
						this.writeIncrementalNewContent( replaceStr, modelList, reportList, index+1, onComplete);
					}),
					dojo.hitch(this, function(error) {
						// expected error - HTTP 412 Precondition Failed 
						// occurs when file is out of sync with the server
						if (error.status === 412) {
							reportList.push({model: model, message: "Resource has been changed by others.", matchesReplaced: matchesReplaced, status: "failed" });
						}
						// unknown error
						else {
							error.log = true;
							reportList.push({model: model, message: "Failed to write file.",  matchesReplaced: matchesReplaced, status: "failed" });
						}
						this.writeIncrementalNewContent(replaceStr, modelList, reportList, index+1, onComplete);
					})
				);
				
			}), true);
			
		} else {
			this.writeIncrementalNewContent( replaceStr, modelList, reportList, index+1, onComplete);
		}
		
	};
	
	SearchResultModel.prototype.setSelected = function(model, fromIteration) {
		if(!fromIteration){
			this.iterator.setCursor(model);
		}
		this.storeStatus();
	};
	
	SearchResultModel.prototype.getSelected = function(){
		return this.iterator ? this.iterator.cursor() : null;
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
	
	SearchResultModel.prototype.generateNewContents = function( oldContents, newContents, fileModelNode, replaceStr){
		if(fileModelNode && oldContents){
			var updating;
			if(newContents.length > 0){
				updating = true;
			} else {
				updating = false;
			}
			for(var i = 0; i < oldContents.length ; i++){
				var lineStringOrigin = oldContents[i];
				var changingLine = false;
				var checked = false;
				var fullChecked = false;
				var checkedMatches = [];
				var originalMatches;
				var startNumber = 0;
				for(var j = 0; j < fileModelNode.children.length; j++){
					var lnumber = fileModelNode.children[j].lineNumber - 1;
					if(lnumber === i){
						startNumber = j;
						for(var k = 0; k < fileModelNode.children[j].matches.length; k++ ){
							if(fileModelNode.children[j+k].checked !== false){
								checkedMatches.push(k);
							}
						}
						checked = (checkedMatches.length > 0);
						fullChecked = (checkedMatches.length === fileModelNode.children[j].matches.length);
						originalMatches = fileModelNode.children[j].matches; 
						changingLine = true;
						break;
					}
				}
				if(changingLine){
					var newStr;
					if(!checked){
						newStr = lineStringOrigin;
						for(var k = 0; k < fileModelNode.children[startNumber].matches.length; k++ ){
							fileModelNode.children[startNumber+k].newMatches = fileModelNode.children[startNumber+k].matches;
						}
					} else{
						var result =  mSearchUtils.replaceCheckedMatches(lineStringOrigin, replaceStr, originalMatches, checkedMatches, this.queryObj.inFileQuery.searchStrLength);
						newStr = result.replacedStr;
						for(var k = 0; k < fileModelNode.children[startNumber].matches.length; k++ ){
							fileModelNode.children[startNumber+k].newMatches = result.newMatches;
						}
					}
					if(updating){
						newContents[i] = newStr;
					} else {
						newContents.push(newStr);
					}
				} else if(!updating){
					newContents.push(lineStringOrigin);
				}
			}
		}
	};
	
	SearchResultModel.prototype.generateMatchContext = function(contextAroundLength, fileContents, lineNumber/*zero based*/){
		var context = [];
		var totalContextLength = contextAroundLength*2 + 1;
		var startFrom, endTo;
		if(fileContents.length <= totalContextLength){
			startFrom = 0;
			endTo = fileContents.length -1;
		} else {
			startFrom = lineNumber - contextAroundLength;
			if(startFrom < 0){
				startFrom = 0;
				endTo = startFrom + totalContextLength - 1;
			} else {
				endTo = lineNumber + contextAroundLength;
				if(endTo > (fileContents.length -1)){
					endTo = fileContents.length -1;
					startFrom = endTo - totalContextLength + 1;
				}
				
			}
		}
		for(var i = startFrom; i <= endTo; i++){
			context.push({context: fileContents[i], current: (i === lineNumber)});
		}
		return context;
	};
	
	SearchResultModel.prototype.searchWithinFile = function( fileModelNode, fileContentText){
		var fileContents = fileContentText.split(this._lineDelimiter);
		if(!this.normalMode()){
			fileModelNode.contents = fileContents;
		}
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
						if(this.normalMode()){
							var detailNode = {parent: fileModelNode, context: this.generateMatchContext(2, fileContents, i), checked: fileModelNode.checked, type: "detail", matches: result, lineNumber: lineNumber, name: lineStringOrigin, linkLocation: fileModelNode.linkLocation + ",line=" + lineNumber, location: fileModelNode.location + "-" + lineNumber};
							fileModelNode.children.push(detailNode);
						} else {
							for(var j = 0; j < result.length; j++){
								var matchNumber = j+1;
								var detailNode = {parent: fileModelNode, checked: fileModelNode.checked, type: "detail", matches: result, lineNumber: lineNumber, matchNumber: matchNumber, name: lineStringOrigin, location: fileModelNode.location + "-" + lineNumber + "-" + matchNumber};
								fileModelNode.children.push(detailNode);
							}
						}
						totalMatches += result.length;
					}
				}
			}
			fileModelNode.totalMatches = totalMatches;
		}
	};
	
	
	SearchResultModel.prototype.getFileContent = function(fileItem, onComplete, writing){
		if(fileItem.contents){
			onComplete(fileItem);
		} else {
			this.fileClient.read(fileItem.location).then(
				dojo.hitch(this, function(jsonData) {
					this.searchWithinFile(fileItem, jsonData);
					if(this.onMatchNumberChanged && !writing){
						this.onMatchNumberChanged(fileItem);
					}
					onComplete(fileItem);
				}),
				dojo.hitch(this, function(error) {
					console.error("Error loading file content: " + error.message);
					onComplete(null);
				})
			);
		}
	};
	
	SearchResultModel.prototype.getChildren = function(/* dojo.data.Item */ parentItem, /* function(items) */ onComplete){
		if(!parentItem){
			return;
		}
		if (parentItem.children) {
			onComplete(parentItem.children);
		} else if (parentItem.type === "detail") {
			onComplete([]);
		} else if (parentItem.type === "file" && parentItem.location) {
			this.fileClient.read(parentItem.location).then(
					dojo.hitch(this, function(jsonData) {
						  this.searchWithinFile(parentItem, jsonData);
						  if(this.onMatchNumberChanged){
							  this.onMatchNumberChanged(parentItem);
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
	SearchResultRenderer.prototype = new mExplorer.SelectionRenderer();
	
	SearchResultRenderer.prototype.initCheckboxColumn = function(tableNode){	
		if (this._useCheckboxSelection) {
			var th = document.createElement('th');
			var check = document.createElement("span");
			dojo.addClass(check, "selectionCheckmark");
			if(this.getCheckedFunc){
				check.checked = this.getCheckedFunc(this.explorer.model._listRoot);
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
		if(col_no === 1){
			var title = dojo.create("th", {innerHTML: "<h2>Results</h2>"});
			
			if( this.explorer.model.queryObj.searchStrTitle){
				if(this.explorer.numberOnPage > 0){
					var startNumber = this.explorer.model.queryObj.start + 1;
					var endNumber = startNumber + this.explorer.numberOnPage - 1;
					if(this.explorer._state === "result_view"){
						title.innerHTML = "Files " + "<b>" + startNumber + "-"  + endNumber + "</b>" + " of " + this.explorer.totalNumber + 
						" matching " + "<b>" + this.explorer.model.queryObj.searchStrTitle + "</b>";
					} else {
						title.innerHTML = "Replace " + "<b>" +  this.explorer.model.queryObj.searchStrTitle + "</b>" + " with " +
						"<b>" +  this.explorer._replaceStr + "</b>" + " for files " + "<b>" + startNumber + "-"  + endNumber + "</b>" + " of " + this.explorer.totalNumber;
					}
				}
			} else {
				var headerStr =" Matches to be replaced by \"" + this.explorer._replaceStr + "\"";
				var th = dojo.create("th", {});
				return dojo.create("h2", {innerHTML: headerStr});
			}
			return title;
		} else if(col_no === 2){
			return dojo.create("th", {innerHTML: "<h2>Location</h2>"});
		} else if(col_no === 0){
			return dojo.create("th", {innerHTML: ""});
		}
	};
	
	
	SearchResultRenderer.prototype.deselectElement = function(model){
		var currentRow = this.explorer.getRowdDiv(model);
		if(currentRow) {
			dojo.toggleClass(currentRow, "currentSearchMatch", false);
			this.replaceDetailIcon(model ? model: this.explorer.model.getSelected(), "none");
		}
	};
	
	SearchResultRenderer.prototype.focus = function(){
	    var resultParentDiv = dojo.byId(this.explorer.getParentDivId());
	    window.setTimeout(function(){
	    	resultParentDiv.focus();
	    	}, 10);
	};
	
	SearchResultRenderer.prototype.selectElement = function(previousModel, currentModel, fromIteration){
		if(!previousModel){
			previousModel = this.explorer.model.getSelected();
		}
		if(previousModel === currentModel){
			return;
		}
		this.deselectElement(previousModel);
		this.explorer.model.setSelected(currentModel, fromIteration);
		dojo.toggleClass(this.explorer.model.getId(currentModel), "currentSearchMatch", true);
		var that = this;
		if(this.explorer._state !== "result_view"){
			if(!this.explorer.model.sameFile()){
				this.explorer.buildPreview();
			}
			if(currentModel.type === "detail"){
				this.explorer.twoWayCompareContainer.gotoMatch(currentModel.lineNumber-1, currentModel.matches[currentModel.matchNumber-1], 
						currentModel.newMatches[currentModel.matchNumber-1], this.explorer.model.queryObj.inFileQuery.searchStrLength,
						function(){that.focus();});
				that.focus();
			}
		} else if(currentModel.type === "detail"){
			if(this.explorer._popUpContext){
				this.explorer.popupContext(this.explorer.model.getSelected());
				this.replaceDetailIcon(this.explorer.model.getSelected(), "left");
			} else {
				this.replaceDetailIcon(this.explorer.model.getSelected(), "right");
			}
		} else{
			if(this.explorer._popUpContext){
				this.explorer.closeContextTip(true);
			}
		}
	};
	
	SearchResultRenderer.prototype.staleFileElement = function(item){
		if(item.stale){
			var span = dojo.byId(this.getFileSpanId(item));
			dojo.empty(span);
			dojo.place(document.createTextNode(item.name), span, "last");
			span = dojo.byId(this.getFileIconId(item));
			dojo.empty(span);
		}
	};
	
	SearchResultRenderer.prototype.replaceFileElement = function(item){
		var renderName = item.totalMatches ? item.name + " (" + item.totalMatches + " matches)" : item.name;
		var linkDiv = dojo.byId( this.getFileSpanId(item) + "_link");
		dojo.place(document.createTextNode(renderName), linkDiv, "only");
	};
	
	SearchResultRenderer.prototype.replaceDetailIcon = function(item , direction){
		if(this.explorer._state !== "result_view"){
			return;
		}
		if(! item || item.type !== "detail"){
			return;
		}
		var iconSpan = dojo.byId(this.getDetailIconId(item));
		if(!iconSpan){
			return;
		}
		dojo.empty(iconSpan);
		var icon = dojo.create("span", null, iconSpan, "last");
		dojo.addClass(icon, "imageSprite");
		if(direction === "right"){
			dojo.addClass(icon, "core-sprite-rightarrow");
		} else if(direction === "left"){
			dojo.addClass(icon, "core-sprite-leftarrow");
		} else {
			dojo.addClass(icon, "core-sprite-none");
		}
	};
	
	SearchResultRenderer.prototype.renderFileElement = function(item, spanHolder, renderName){
		if(this.explorer._state === "result_view"){
			var link = dojo.create("a", {className: "navlink", id: spanHolder.id+"_link", href: item.linkLocation}, spanHolder, "last");
			dojo.place(document.createTextNode(renderName), link, "only");
		} else {
			var nameSpan = dojo.create("span", { className: "primaryColumn", id: spanHolder.id+"_link"}, spanHolder, "last");
			dojo.place(document.createTextNode(renderName), nameSpan, "only");
			nameSpan.title = "Click to compare";
			var itemId = this.explorer.model.getId(item);
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
				that.selectElement(null, item);
			});
		}
	};
	
	SearchResultRenderer.prototype.generateContextTip = function(detailModel){
		var tableNode = dojo.create( "table",{bgcolor:"#FFFFCC"});
		for(var i = 0; i < detailModel.context.length; i++){
			var lineDiv = dojo.create("tr",{},tableNode);
			if(detailModel.context[i].current){
				var lineTd = dojo.create( "td", { noWrap: true}, lineDiv );
				this.generateDetailHighlight(detailModel, dojo.create("span",{className: "primaryColumn"},lineTd));
			} else {
				dojo.create( "td", { noWrap: true, innerHTML: detailModel.context[i].context}, lineDiv );
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
			if(this.explorer._state !== "result_view"){
				if(i !== (detailModel.matchNumber - 1)){
					continue;
				}
			}
			
			if(startIndex !== detailModel.matches[i].startIndex){
				dojo.place(document.createTextNode(detailModel.name.substring(startIndex, detailModel.matches[i].startIndex)), parentSpan, "last");
			}
			var matchSegBold = dojo.create("b", null, parentSpan, "last");
			if(this.explorer.model.queryObj.inFileQuery.wildCard){
				gap = detailModel.matches[i].length;
			}
			dojo.place(document.createTextNode(detailModel.name.substring(detailModel.matches[i].startIndex, detailModel.matches[i].startIndex + gap)), matchSegBold, "only");
			startIndex = detailModel.matches[i].startIndex + gap;
			if(this.explorer._state !== "result_view"){
				break;
			}
		}
		if(startIndex < (detailModel.name.length - 1)){
			dojo.place(document.createTextNode(detailModel.name.substring(startIndex)), parentSpan, "last");
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
		if(this.explorer._state === "result_view" || item.matches.length <= 1){
			dojo.place(document.createTextNode(item.lineNumber + ":"), spanHolder, "last");
		} else {
			dojo.place(document.createTextNode(item.lineNumber + "(" + item.matchNumber+ "):"), spanHolder, "last");
		}
	};
		
	SearchResultRenderer.prototype.getDetailElement = function(item, tableRow, spanHolder){
		var that = this;
		if(this.explorer._state === "result_view"){
			var link = dojo.create("a", {className: "navlink", id: this.getDetailLinkId(item), href: item.linkLocation}, spanHolder, "last");
			dojo.connect(link, "onclick", link, function() {
				if(that.explorer._state === "result_view"){
					that.selectElement(null,item);
				}
			});
			return dojo.create("span", null, link, "only");
		} else {
			var nameSpan = dojo.create("span", { className: "primaryColumn"}, spanHolder, "last");
			//dojo.place(document.createTextNode(renderName), nameSpan, "only");
			nameSpan.title = "Click to compare";
			var itemId = this.explorer.model.getId(item);
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
				that.selectElement(null, item);
			});
			return nameSpan;
		}
	};
	
	SearchResultRenderer.prototype.getLocationSpanId = function(item){
		return this.explorer.model.getId(item) + "_locationSpan";
	};
	
	SearchResultRenderer.prototype.getFileSpanId = function(item){
		return this.explorer.model.getId(item) + "_fileSpan";
	};
	
	SearchResultRenderer.prototype.getFileIconId = function(item){
		return this.explorer.model.getId(item) + "_fileIcon";
	};
	
	SearchResultRenderer.prototype.getDetailLinkId = function(item){
		return this.explorer.model.getId(item) + "_detailLink";
	};
	
	SearchResultRenderer.prototype.getDetailIconId = function(item){
		return this.explorer.model.getId(item) + "_detailIcon";
	};
	
	SearchResultRenderer.prototype.renderLocationElement = function(item){
		var spanHolder = dojo.byId(this.getLocationSpanId(item));
		var qParams = mSearchUtils.copyQueryParams(this.explorer.model.queryObj, true);
		qParams.location = item.parentLocation;
		qParams.start = 0;
		var href =  mSearchUtils.generateSearchHref(qParams);
		link = dojo.create("a", {className: "navlink", href: href}, spanHolder, "last");
		link.title = "Search again in this folder with \"" + this.explorer.model.queryObj.searchStrTitle + "\"";
		var that = this;
		dojo.connect(link, "onclick", link, function() {
			that.explorer.closeContextTip();
		});
		dojo.place(document.createTextNode(item.fullPathName), link, "only");
	};
	
	SearchResultRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		switch(col_no){
		case 0:
			var col, span, link;
			col = document.createElement('td');
			if(item.type ===  "file"){
				col.noWrap = true;
				span = dojo.create("span", {id: this.getFileIconId(item)}, col, "only");
				this.getExpandImage(tableRow, span, "core-sprite-file");
			} else {
				span = dojo.create("span", {}, col, "only");
				col.noWrap = true;
				col.align = "right";
				this.renderDetailLineNumber(item,  span);
			}
			return col;
		case 1:
			var col, span, link;
			col = document.createElement('td');
			span = dojo.create("span", {id: this.getFileSpanId(item)}, col, "only");
			var that = this;
			if(that.explorer._state === "result_view"){
				dojo.connect(tableRow, "onclick", tableRow, function() {
					that.selectElement(null, item);
				});
				dojo.connect(tableRow, "onmouseover", tableRow, function() {
					tableRow.style.cursor ="pointer";
				});
				dojo.connect(tableRow, "onmouseout", tableRow, function() {
					tableRow.style.cursor ="default";
				});
			}
			if(item.type ===  "file"){
				var renderName = item.totalMatches ? item.name + " (" + item.totalMatches + " matches)" : item.name;
				this.renderFileElement(item, span, renderName);
			} else {
				this.renderDetailElement(item, tableRow, span);
				var iconSpan = dojo.create("span", {id: this.getDetailIconId(item)}, span, "last");
				var icon = dojo.create("span", null, iconSpan, "last");
				dojo.addClass(icon, "imageSprite");
				dojo.addClass(icon, "core-sprite-none");
			}
			return col;
			
		case 2:
			col = document.createElement('td');
			if(item.type ===  "file"){
				span = dojo.create("span", {id: this.getLocationSpanId(item)}, col, "only");
				if(item.parentLocation){
					this.renderLocationElement(item);
				}
			} 
			return col;
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
		this.defaulRows = 40;
		this.renderer = new SearchResultRenderer({checkbox: false}, this);
		this.totalNumber = totalNumber;
		this.numberOnPage = resultLocation.length;
		this.queryStr = queryStr;
		var that = this;
		this.model = new SearchResultModel(registry, this.fileClient, resultLocation, queryStr, 
						 { onMatchNumberChanged: function(fileItem){that.renderer.replaceFileElement(fileItem);}});
		this.iterator = new mTreeIterator.TreeIterator([], 
		   		   {isExpanded: dojo.hitch(this, function(model) {
		   						 	return this.isExpanded(model);
		   						 }),
		   						 
		   			isExpandable: dojo.hitch(this, function(model) {
					 				return model.type !== "detail";
								 }),				   						 
		   			
					forceExpandFunc: dojo.hitch(this, function(modelToExpand, childPosition, callback) {
			 						return this.forceExpandFunc(modelToExpand, childPosition, callback);
						 		 })
		   		   });
		this.model.iterator = this.iterator;
		this._replaceStr = this.model.queryObj.replace;
		//there are 3 states:
		//result_view: viewing the seach result
		//replace_preview: after user inputs the replace string and enters into the preview 
		//replace_report: after user finishes preview and commits the replace
		
		this._state = (this.model.queryObj.replace === null ? "result_view" : "replace_preview");
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
	
		var previewCurrentPageCommand = new mCommands.Command({
			name: "Replace",
			tooltip: "Replace all matches with...",
			id: "orion.previewCurrentPage",
			callback: function(data) {
				that.preview();
			},
			visibleWhen : function(item) {
				return that._state === "result_view";
			}
		});
		
		var replaceAllCommand = new mCommands.Command({
			name: "Commit",
			tooltip: "Replace all selected matches",
			id: "orion.globalSearch.replaceAll",
			callback: function(data) {
				that.replaceAll();
			},
			visibleWhen : function(item) {
				return that._state === "replace_preview";
			}
		});
	
		var searchAgainCommand = new mCommands.Command({
			name: "Search Again",
			tooltip: "Search again",
			id: "orion.globalSearch.searchAgain",
			callback : function() {
				return that.searchAgain();
			},
			visibleWhen : function(item) {
				return that._state === "report" || that._state === "replace_preview";
			}
		});
	
		this._commandService.addCommand(saveResultsCommand, "dom");
		this._commandService.addCommand(previewCurrentPageCommand, "dom");
		this._commandService.addCommand(searchAgainCommand, "dom");
		this._commandService.addCommand(replaceAllCommand, "dom");
		this._commandService.addCommandGroup("orion.searchActions.unlabeled", 200, null, null, "pageActions");
		this._commandService.registerCommandContribution("orion.saveSearchResults", 1, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.previewCurrentPage", 2, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.globalSearch.searchAgain", 3, "pageActions", "orion.searchActions.unlabeled");
		this._commandService.registerCommandContribution("orion.globalSearch.replaceAll", 4, "pageActions", "orion.searchActions.unlabeled");

		var previousPage = new mCommands.Command({
			name : "< Previous Page",
			tooltip: this._state === "result_view" ? "Show previous page of search result" : "Replace previous page",
			id : "orion.search.prevPage",
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
			name : "Next Page >",
			tooltip: this._state === "result_view" ? "Show next page of search result" : "Replace next page",
			id : "orion.search.nextPage",
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
			tooltip : "Next result",
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
			tooltip : "Previous result",
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
			tooltip : "Expand all results",
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
			tooltip : "Collapse all results",
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
	
	SearchResultExplorer.prototype.loadOneFileMetaData =  function(index, onComplete){
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
						that.renderer.renderLocationElement(item);
						that.renderer.staleFileElement(item);
					});
				} else {
					this.renderer.renderLocationElement(item);
				}
			    if(index === (this.model.indexedFileItems.length-1)){	
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
				console.error("Error loading file metadata: " + error.message);
				if(index === (this.model.indexedFileItems.length-1)){
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

	SearchResultExplorer.prototype.preview = function() {
		var that = this;
		this._commandService.openParameterCollector("tool", null, "pageActions", function(parentDiv) {
			// create replace text
			var replaceStringDiv = document.createElement('input');
			replaceStringDiv.type = "text";
			replaceStringDiv.name = "ReplaceWith:";
			replaceStringDiv.id = "globalSearchReplaceWith";
			replaceStringDiv.placeholder="Replace With";
			//dojo.addClass(replaceStringDiv, 'searchCmdGroupMargin');
			replaceStringDiv.onkeydown = function(e){
				if (e.keyCode === dojo.keys.ENTER) {
					var replaceInputDiv = dojo.byId("globalSearchReplaceWith");
					return that.doPreview(replaceInputDiv.value);
				}
				if( e.keyCode === 27/*ESC*/ ){
					that._commandService.closeParameterCollector("tool");
					return false;
				}
			};
			parentDiv.appendChild(replaceStringDiv);

			// create the command span for Replace
			var span = document.createElement('span');
			dojo.addClass(span, "parameters");
			span.id = "globalSearchReplaceCommands";
			parentDiv.appendChild(span);
		});
		
		var replaceDiv = document.getElementById("globalSearchReplaceWith");
		replaceDiv.value = this.model.defaultReplaceStr;
		window.setTimeout(function() {
			replaceDiv.select();
			replaceDiv.focus();
		}, 10);	
		
		
		var innerReplaceAllCommand = new mCommands.Command({
			name : "Preview Changes",
			image : require.toUrl("images/replaceAll.gif"),
			id : "orion.globalSearch.innerReplaceAll",
			groupId : "orion.searchGroup",
			callback : function() {
				var replaceInputDiv = dojo.byId("globalSearchReplaceWith");
				return that.doPreview(replaceInputDiv.value);
			}
		});

		this._commandService.addCommand(innerReplaceAllCommand, "dom");

		// Register command contributions
		this._commandService.registerCommandContribution("orion.globalSearch.innerReplaceAll", 1, "globalSearchReplaceCommands");
		this._commandService.renderCommands("globalSearchReplaceCommands", "dom", this, this, "button");
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
		window.sessionStorage["global_search_default_replace_string"] = replacingStr;
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
		this._state = "report";
		this.initCommands();
		this.reportStatus("Writing files...");	
		this.model.writeIncrementalNewContent( this._replaceStr, this.model.indexedFileItems, reportList, 0, function(modellist){
			
			dojo.empty(that.getParentDivId());
			var reporter = new SearchReportExplorer(that.getParentDivId(), reportList);
			reporter.report();
			that.reportStatus("");	
		});
	};

	
	SearchResultExplorer.prototype.replacePreview = function(replaceStr) {
		this._state = "replace_preview";
		this._replaceStr = replaceStr;
		this.checkbox = true;
		this.initCommands();

		dojo.empty(this.getParentDivId());
		this._uiFactory = new mSearchFeatures.SearchUIFactory({
			parentDivID: this.getParentDivId()
		});
		this._uiFactory.buildUI();
		// FIXME shouldn't know this id, should be passed in
		var parentPane = dijit.byId("orion.searchResults");
		if(parentPane.isLeftPaneOpen()){
			parentPane.toggle();
		}
		
		this.reportStatus("Preparing preview...");	
		var that = this;
		this.renderer = new SearchResultRenderer({checkbox: true, highlightSelection:false,
													  getCheckedFunc: function(item){return that.getItemChecked(item);},
													  onCheckedFunc: function(rowId, checked, manually){that.onRowChecked(rowId, checked, manually);}}, that);
		this.createTree(this._uiFactory.getMatchDivID(), this.model, {indent: 20, onCollapse: function(model){that.onCollapse(model);}});
		this.renderer.selectElement(this.model.iterator.prevCursor(), this.model.getSelected(), true);
		this.reportStatus("");	
	};
	
	SearchResultExplorer.prototype.getItemChecked = function(item) {
		if(item.checked === undefined){
			item.checked = true;
		}
		return item.checked;
	};
	
	SearchResultExplorer.prototype.onRowChecked = function(rowId, checked, manually) {
		if(!rowId){
			this.onItemChecked(this.model._listRoot, checked, manually);
			return;
		}
		var row = dojo.byId(rowId);
		if(row && row._item){
			this.onItemChecked(row._item, checked, manually);
		}
	};
	
	SearchResultExplorer.prototype.onNewContentChanged = function(fileItem) {
		this.model.generateNewContents(fileItem, this._replaceStr);
		if(fileItem === this.model.fileModel(this.model.getSelected())){
			this.buildPreview(true);
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
	
	SearchResultExplorer.prototype._getContentType = function(fileItem){
		return this.registry.getService("orion.file.contenttypes").getFilenameContentType(fileItem.name);
	};
	
	SearchResultExplorer.prototype.buildPreview = function(updating) {
		if(this.model.indexedFileItems.length === 0){
			return;
		}
		var uiFactory = this._uiFactory;
		var fileItem = this.model.fileModel(this.model.getSelected());
		dojo.empty(uiFactory.getCompareDivID());
		if(!updating || !this._currentReplacedContents){
			this._currentReplacedContents = [];
		}
		var that = this;
		this.model.getFileContent(fileItem, function(fileItem){
			that.model.generateNewContents(fileItem.contents, that._currentReplacedContents, fileItem, that._replaceStr); 
			var uiFactoryCompare = new mCompareFeatures.TwoWayCompareUIFactory({
				parentDivID: uiFactory.getCompareDivID(),
				showTitle: true,
				leftTitle: "Replaced File (" + fileItem.name + ")",
				rightTitle: "Original File (" + fileItem.name + ")",
				showLineStatus: false
			});
			uiFactoryCompare.buildUI();

			// Diff operations
			var fType = that._getContentType(fileItem);
			dojo.when(fType, function(fType) {
				var options = {
					readonly: true,
					hasConflicts: false,
					baseFileName: fileItem.location,
					newFileName: fileItem.location,
					baseFileType: fType,
					newFileType: fType,
					baseFileContent: fileItem.contents.join(that.model._lineDelimiter),
					newFileContent: that._currentReplacedContents.join(that.model._lineDelimiter)
				};
				
				that.twoWayCompareContainer = new mCompareContainer.TwoWayCompareContainer(that.registry, uiFactoryCompare, options);
				that.twoWayCompareContainer.startup();
			});
		});
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
		this._commandService.renderCommands("pageActions", "dom", that, that, "button");

		dojo.empty("pageNavigationActions");
		this._commandService.renderCommands("pageNavigationActions", "dom", that, that, "button");
		if(this._state !== "result_view"){
			mUtil.forceLayout("pageNavigationActions");
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
		mUtil.forceLayout("pageNavigationActions");
	};
	
	SearchResultExplorer.prototype.reportStatus = function(message) {
		this.registry.getService("orion.page.message").setProgressMessage(message);	
	};
	
	SearchResultExplorer.prototype.isExpanded = function(model){
		return this.myTree.isExpanded(this.model.getId(model));
	};
	
	SearchResultExplorer.prototype.popupContext = function(model){
		var that =this;
	    var modelLinkId = this.renderer.getDetailIconId(model);
		var tableNode = this.renderer.generateContextTip(model);
	    that.contextTipDialog.attr("content", tableNode);
		//var pos = dojo.position(modelLinkId, true);
        dijit.popup.open({
        	popup: that.contextTipDialog,
	        around: dojo.byId(modelLinkId),
	        orient: {'TR':'TL', 'TR':'TL'}
	    });
	};
	
	SearchResultExplorer.prototype.closeContextTip = function(remainFlag){
		if(this._state === "result_view"){
			dijit.popup.close(this.contextTipDialog);
			if(!remainFlag){
				this._popUpContext = false;
			}
			this.renderer.replaceDetailIcon(this.model.getSelected(), "right");
		}
		
	};
	
	SearchResultExplorer.prototype.onRihgtArrow = function(e) {
		var curModel = this.model.getSelected();
		if(!curModel){
			return;
		}
		if(curModel.type === "file"){
			if(!this.isExpanded(curModel)){
				this.myTree.expand(curModel);
				e.preventDefault();
				return false;
			}
		} else if(!this._popUpContext && this._state === "result_view"){
			this._popUpContext = true;
			this.renderer.replaceDetailIcon(curModel, "left");
			this.popupContext(curModel);
			e.preventDefault();
			return false;
		}
	};

	SearchResultExplorer.prototype.onLeftArrow = function(e) {
		var curModel = this.model.getSelected();
		if(!curModel){
			return;
		}
		if(curModel.type === "file"){
			if(this.isExpanded(curModel)){
				this.myTree.collapse(curModel);
				e.preventDefault();
				return false;
			}
		} else if(this._popUpContext){
			this.closeContextTip();
			e.preventDefault();
			return false;
		} else {
			if(this.isExpanded(curModel.parent)){
				this.myTree.collapse(curModel.parent);
				e.preventDefault();
				return false;
			}
		}
	};
	
	SearchResultExplorer.prototype.onCollapse = function(model) {
		var curModel = this.model.getSelected();
		if(!curModel){
			return;
		}
		if(curModel.type === "detail"){
			var curFileModel = this.model.fileModel(model);
			if(curFileModel === model){
				this.renderer.selectElement(null, model);
			}
		}
	};
	
	SearchResultExplorer.prototype.onExpand = function(modelToExpand, childPosition, callback) {
		//var curModel = this.model.getSelected();
		if(modelToExpand && modelToExpand.children && modelToExpand.children.length > 0 && typeof(childPosition) === "string"){
			var childIndex = 0;
			if(childPosition === "first" ){
				childIndex = 0;
			} else if (childPosition === "last"){
				childIndex =  modelToExpand.children.length -1;
			} else {
				childIndex = JSON.parse(childPosition);
			}
			if(typeof(childIndex) === "string" || childIndex <0 || childIndex >= modelToExpand.children.length){
				childIndex = 0;
			}	
			this.renderer.selectElement(null, modelToExpand.children[childIndex]);
		}
	};
			
	SearchResultExplorer.prototype.forceExpandFunc = function(modelToExpand, childPosition, callback){
		this.myTree.expand(modelToExpand, dojo.hitch(this, function() {
			this.onExpand(modelToExpand , childPosition, callback);
		}));
		return null;
	};
	
	SearchResultExplorer.prototype.onEnter = function(e) {
		var  currentModel= this.model.getSelected();
		if(!currentModel){
			return;
		}
		if(this._state === "result_view"){
			if(e.ctrlKey){
				window.open(currentModel.linkLocation);
			} else {
				window.location.href = currentModel.linkLocation;
			}
		} else {
			var tableRow = this.getRowdDiv(currentModel);
			var checkBox  = dojo.byId(this.renderer.getCheckBoxId(tableRow.id));
			var checked = !checkBox.checked;
			this.renderer.onCheck(tableRow, checkBox, checked, true);
		}
	};
	
	SearchResultExplorer.prototype.startKeyBoardListening = function() {
		var that = this;
	    this.contextTipDialog = new dijit.TooltipDialog({
	        content: "",
	        onBlur: function(){
	            that.closeContextTip();
	        }
	    });
	    var resultParentDiv = dojo.byId(this.getParentDivId());
	    this.eventHandlers = [];
	    resultParentDiv.focus();
		var h1 = dojo.connect(resultParentDiv, "onblur", dojo.hitch(this, function (e) {
			this.closeContextTip();
		}));
		this.eventHandlers.push(h1);
		
		var h2 = dojo.connect(resultParentDiv, "onkeydown", dojo.hitch(this, function (e) {
			if(e.keyCode === dojo.keys.DOWN_ARROW){
				if(!e.ctrlKey){
					this.gotoNext(true, false);
					e.preventDefault();
					return false;
				}
			} else if(e.keyCode === dojo.keys.UP_ARROW){
				if(!e.ctrlKey){
					this.gotoNext(false, false);
					e.preventDefault();
					return false;
				}
			} else if(e.keyCode === dojo.keys.RIGHT_ARROW){
				if(!e.ctrlKey){
					return this.onRihgtArrow(e);
				}
			} else if(e.keyCode === dojo.keys.LEFT_ARROW){
				if(!e.ctrlKey){
					return this.onLeftArrow(e);
				}
			} else if(e.keyCode === dojo.keys.ENTER) {
				return this.onEnter(e);
			}
		}));
		this.eventHandlers.push(h2);
	};
	
	SearchResultExplorer.prototype.startUp = function() {
		var pageTitle = dojo.byId("pageTitle");
		if(pageTitle && this.model.queryObj.searchStrTitle){
			if (this.numberOnPage > 0) {
				this.reportStatus("Generating search result...");	
				if(this._state === "result_view"){
					pageTitle.innerHTML = "Search Results";
				} else {
					pageTitle.innerHTML = "Replace All Matches";
				}
			} else {
				this.parentNode.innerHTML = "<b>" + "No matches" + "</b>" +
				" for " + "<b>" + this.model.queryObj.searchStrTitle + "</b>";
				return;
			} 
		}
		var that = this;
		this.startKeyBoardListening();
		this.model.buildResultModel();
		var detailIndex = this.model.restoreLocationStatus();
		if(this._state === "result_view"){
			this.initCommands();
			this.createTree(this.parentNode, this.model, {indent: 20, onCollapse: function(model){that.onCollapse(model);}});
		
			this.gotoCurrent(detailIndex);
			this.reportStatus("");	
			this.loadOneFileMetaData(0, function(){that.refreshIndex();});
		} else {
			that.replacePreview(that._replaceStr);
			this.gotoCurrent();
			this.loadOneFileMetaData(0, function(){that.refreshIndex();});
		}
	};
	
	SearchResultExplorer.prototype.refreshIndex = function(){
		var newIndex = [];
		var currentFileItem = this.model.fileModel(this.model.getSelected());
		for(var i = 0; i <  this.model.indexedFileItems.length; i++){
			if(!this.model.indexedFileItems[i].stale){
				newIndex.push(this.model.indexedFileItems[i]);
			} else if(currentFileItem === this.model.indexedFileItems[i]){
				currentFileItem = null;
			}
		}
		this.model.indexedFileItems = newIndex;
		this.model.iterator.setTree(this.model.indexedFileItems);
		if(this.model.indexedFileItems.length === 0){
			this.renderer.deselectElement(this.model.getSelected());
			this.iterator.setCursor(null);
		} else if(!currentFileItem){
			this.model.iterator.reset();
			this.gotoCurrent();
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
		for (var i = 0; i < this.model.indexedFileItems.length ; i++){
			if(this.model.matchesReplaced(this.model.indexedFileItems[i]) > 0){
				this.expandRecursively(this.model.indexedFileItems[i]);
			}
		}
	};
	
	SearchResultExplorer.prototype.collapseAll = function() {
		for (var i = 0; i <  this.model.indexedFileItems.length ; i++){
			this.myTree.collapse( this.model.indexedFileItems[i]);
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
	
	SearchResultExplorer.prototype.getParentDivId = function(secondLevel){
		if(this._state === "result_view" || !secondLevel){
			return "results";
		} else {
			return this._uiFactory.getMatchDivID();
		}
	};
	
	SearchResultExplorer.prototype.visible = function(element) {
		if (element.offsetWidth === 0 || element.offsetHeight === 0) {
			return false;
		}
		// FIXME shouldn't know this id, should be passed in
		var parentNode = dojo.byId(this.getParentDivId());
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
		
	SearchResultExplorer.prototype.gotoCurrent = function(detailIndex)	{
		var modelToExpand = this.model.getSelected();
		if(detailIndex && detailIndex !== "none"){
			this.myTree.expand(modelToExpand, dojo.hitch(this, function() {
				this.onExpand(modelToExpand, detailIndex);
			}));
			//this.myTree.expand(this.model.getSelected());
		} else {
			this.onHighlightSelection(true);
		}
	};
	
	SearchResultExplorer.prototype.gotoNext = function(next, forceExpand)	{
		if(this.model.indexedFileItems.length === 0){
			return;
		}
		if(this.model.iterator.iterate(next, forceExpand)){
			this.renderer.selectElement(this.model.iterator.prevCursor(), this.model.iterator.cursor(), true);
			this.onHighlightSelection(next);
		}
	};
	
	SearchResultExplorer.prototype.getRowdDiv = function(model){
		var rowModel = model ? model: this.model.iterator.cursor();
		return dojo.byId(this.model.getId(rowModel));
	};
	
	SearchResultExplorer.prototype.onHighlightSelection = function(next){
		var currentRowDiv = this.getRowdDiv();
		dojo.toggleClass(currentRowDiv, "currentSearchMatch", true);
		if(!this.visible(currentRowDiv)) {
			expanded.childDiv.scrollIntoView(!next);
		}
	};

	SearchResultExplorer.prototype.constructor = SearchResultExplorer;

	
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
			dojo.connect(span, "onclick", span, function() {
				window.open(item.model.linkLocation);
			});
			dojo.connect(span, "onmouseover", span, function() {
				span.style.cursor ="pointer";
			});
			dojo.connect(span, "onmouseout", span, function() {
				span.style.cursor ="default";
			});
			
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
						statusMessage = item.message;
						break;;
					case "failed":
						statusMessage = item.message;
						break;;
					case "pass":
						statusMessage = item.matchesReplaced + " out of " + item.model.totalMatches + " matches replaced.";
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
