/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

var orion = orion || {};

orion.GitStatusModel = (function() {
	function GitStatusModel() {
		this.selectedFileId = undefined;
		this.interestedUnstagedGroup = ["Missing","Modified","Untracked"];
		this.interestedStagedGroup = ["Added", "Changed","Removed"];
	}
	GitStatusModel.prototype = {
		destroy: function(){
		},
		
		interestedCategory: function(){
			
		},
		
		init: function(jsonData){
			this.items = jsonData;
		},
		
		getGroupData: function(groupName){
			return this.items[groupName];
		}
		
	};
	return GitStatusModel;
}());

orion.gitStatusFileImgMap = { "Missing":["/images/git/git-removed.gif", "Removed unstaged" , "/images/git/git-stage.gif", "Stage removed" ],
							  "Removed":["/images/git/git-removed.gif","Removed staged" ,"/images/git/git-unstage.gif", "Unstage removed" ],	
							  "Modified":["/images/git/git-modify.gif","Modified unstaged" ,"/images/git/git-stage.gif", "Stage modified" ],	
							  "Changed":["/images/git/git-modify.gif","Modified staged" ,"/images/git/git-unstage.gif", "Untage modified"],	
							  "Untracked":["/images/git/git-added.gif","Added unstaged" ,"/images/git/git-stage.gif", "Stage untracked"],	
							  "Added":["/images/git/git-added.gif","Added staged" ,"/images/git/git-unstage.gif" , "Unstage added"]	
							};


orion.GitStatusRenderer = (function() {
	function GitStatusRenderer(tableDivId , model) {
		this._tableParentDivId = tableDivId;
		this._controller = model;
	}
	GitStatusRenderer.prototype = {
		initTable: function () {
			tableId = this._tableParentDivId + "_table";
		  	var tableDomNode = dojo.byId( tableId);
		  	var tableParentDomNode = dojo.byId( this._tableParentDivId);
		  	if(tableDomNode){
		  		tableDomNode.innerHTML = "";
		  		tableParentDomNode.removeChild(tableDomNode);
		  	}
			var table = document.createElement('table');
			table.id = tableId;
			table.width = "100%";
			var tableParentDiv = document.getElementById(this._tableParentDivId);
			tableParentDiv.appendChild(table);
			this._table = table;
		},
		
		renderRow: function(itemModel) {
			var self = this;
			var row = document.createElement('tr');
			row.id = itemModel.name +"_row";
			row._item = itemModel;
			this._table.appendChild(row);

			//render the type icon (added , modified ,untracked ...)
			var typeColumn = document.createElement('td');
			var typeImg = document.createElement('img');
			typeImg.src = orion.gitStatusFileImgMap[itemModel.type][0];
			typeImg.title = "Item type : " + orion.gitStatusFileImgMap[itemModel.type][1];
			typeColumn.appendChild(typeImg);
			row.appendChild(typeColumn);
			
			//render the file name field
			var nameColumn = document.createElement('td');
			nameColumn.width="100%";
			//nameColumn.nowrap="nowrap";
			nameColumn.noWrap= true;
			row.appendChild(nameColumn);
			
			var nameSpan =  document.createElement('span');
			nameSpan.id = itemModel.name + "_" + itemModel.type +  "_nameSpan";
			dojo.place(document.createTextNode(itemModel.name), nameSpan, "only");
			nameSpan.style.cursor = "pointer";
			nameSpan.style.color = "#0000FF";
			nameSpan.title = "Click to compare";
			nameColumn.appendChild(nameSpan);
			if(nameSpan.id === self._controller._model.selectedFileId ){
				dojo.toggleClass(nameSpan, "fileNameSelectedRow", true);
			}
			
			dojo.connect(nameSpan, "onmouseover", nameSpan, function() {
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", true);
			});
			dojo.connect(nameSpan, "onmouseout", nameSpan, function() {
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", false);
			});
			
			dojo.connect(nameSpan, "onclick", nameSpan, function() {
				if(itemModel.name !== self._controller._model.selectedFileId ){
					if(self._controller._model.selectedFileId !== undefined){
						var selected = document.getElementById(self._controller._model.selectedFileId);
						if(selected)
							dojo.toggleClass(selected, "fileNameSelectedRow", false);
					}
					dojo.toggleClass(nameSpan, "fileNameSelectedRow", true);
					self._controller._model.selectedFileId = nameSpan.id;
					//self._controller.getFileContentGit(itemModel.location);
					self._controller.loadDiffContent(itemModel.location , itemModel.type === "Untracked" ? null : itemModel.location);
					
				}
			});
			
			//render the side by side viewer icon
			sbsViewerCol = document.createElement('td');
			row.appendChild(sbsViewerCol);
			var sbsViewerImg = document.createElement('img');//dojo.create("img", {src: "/images/redo_edit.gif"}, sbsViewerCol, "last");
			sbsViewerImg.src = "/images/git/compare-sbs.gif";
			sbsViewerImg.title="Click to open two way compare";
			sbsViewerCol.appendChild(sbsViewerImg);
			sbsViewerImg.style.cursor = "pointer";
			sbsViewerImg.onclick = dojo.hitch(this, function(evt) {
				this._controller.openSBSViewer(itemModel.location);
			});
			
			//render the stage / unstage action  icon
			stageCol = document.createElement('td');
			row.appendChild(stageCol);
			var stageImg = document.createElement('img');//dojo.create("img", {src: "/images/down.gif"}, sbsViewerCol, "last");
			stageImg.src = orion.gitStatusFileImgMap[itemModel.type][2];
			stageImg.title = orion.gitStatusFileImgMap[itemModel.type][3];
			stageCol.appendChild(stageImg);
			stageImg.style.cursor = "pointer";
			stageImg.onclick = dojo.hitch(this, function(evt) {
				this._controller.doAction(itemModel.location , itemModel.type);
				//this._controller.getGitStatus(this._controller._url);
			});
		}
	};
	return GitStatusRenderer;
}());

orion.GitStatusController = (function() {
	function GitStatusController(serviceRegistry , url , unstagedDivId , stagedDivId) {
		this.registry = serviceRegistry;
		this._url = url;
		this._model = new orion.GitStatusModel();
		this._unstagedTableRenderer = new orion.GitStatusRenderer(unstagedDivId , this);
		this._stagedTableRenderer = new orion.GitStatusRenderer(stagedDivId , this);
		this._inlineCompareContainer = new orion.InlineCompareContainer("inline-compare-viewer");
	}
	GitStatusController.prototype = {
		loadStatus: function(jsonData){
			this._model.init(jsonData);
			this._loadBlock(this._unstagedTableRenderer , this._model.interestedUnstagedGroup);
			this._loadBlock(this._stagedTableRenderer , this._model.interestedStagedGroup);
		},
		
		_makeLocation: function(location , name){//temporary
			var relative = eclipse.util.makeRelative(location);
			var splitted = relative.split("/");
			if(splitted.length > 2)
				return "/" + splitted[1] + "/" + splitted[2] + "/" + name;
			return name;
		},
		
		_loadBlock: function(renderer , interedtedGroup){
			renderer.initTable();
			for (var i = 0; i < interedtedGroup.length ; i++){
				var groupName = interedtedGroup[i];
				var groupData = this._model.getGroupData(groupName);
				if(!groupData)
					break;
				for(var j = 0 ; j < groupData.length ; j++){
					renderer.renderRow({name:groupData[j].Name , type:groupName , location:this._makeLocation(groupData[j].Location , groupData[j].Name)});
				} 
			}
		},
		
		loadDiffContent: function(fileContentURI , diffURI){
			this._inlineCompareContainer.resolveDiff(fileContentURI,
					                                function(){					
														var fileNameDiv = document.getElementById("fileNameInViewer");
														fileNameDiv.innerHTML = fileContentURI;
													} , 
					                                diffURI);
		},
		
		openSBSViewer: function(hash){
			//var url = "/compare.html#/" + hash;
			var url = "/compare.html#" + hash;
			window.open(url,"");
		},
		
		doAction: function(location  ,type){
			var shouldStage = false;
			for(var i = 0; i < this._model.interestedUnstagedGroup.length ; i++){
				if(type === this._model.interestedUnstagedGroup[i]){
					shouldStage = true;
				}
			}
			if(shouldStage)
				this.stage(location);
			else
				this.unstage(location);
		},
		
		getGitStatus: function(url){
			var self = this;
			dojo.xhrGet({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				load: function(jsonData, ioArgs) {
					console.log(JSON.stringify(jsonData));
					self.loadStatus(jsonData);
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		stage: function(location){
			var self = this;
			var url = "/git/index" + location;
			dojo.xhrPut({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				load: function(jsonData, ioArgs) {
					console.log(JSON.stringify(jsonData));
					self.getGitStatus(self._url);;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		unstage: function(location){
			var self = this;
			var url = "/git/index" + location;
			dojo.xhrPost({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				postData: dojo.toJson({"Reset":"MIXED"} ),
				load: function(jsonData, ioArgs) {
					console.log(JSON.stringify(jsonData));
					self.getGitStatus(self._url);;
				},
				error: function(response, ioArgs) {
					console.error("HTTP status code: ", ioArgs.xhr.status);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		}
		
		
	};
	return GitStatusController;
}());

