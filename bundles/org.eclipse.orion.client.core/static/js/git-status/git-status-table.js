/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

var orion = orion || {};

orion.GitStatusModel = (function() {
	function GitStatusModel() {
		this.selectedFileId = undefined;
		this.selectedItem = undefined;
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
		},
		
		isStaged: function(type){
			for(var i = 0; i < this.interestedStagedGroup.length ; i++){
				if(type === this.interestedStagedGroup[i]){
					return  true;
				}
			}
			return false;
		}
		
	};
	return GitStatusModel;
}());

orion.statusTypeMap = { "Missing":["/images/git/git-removed.gif", "Removed unstaged" , "/images/git/git-stage.gif", "Stage" ],
						"Removed":["/images/git/git-removed.gif","Removed staged" ,"/images/git/git-unstage.gif", "Unstage" ],	
						 "Modified":["/images/git/git-modify.gif","Modified unstaged" ,"/images/git/git-stage.gif", "Stage" ],	
						 "Changed":["/images/git/git-modify.gif","Modified staged" ,"/images/git/git-unstage.gif", "Untage"],	
					     "Untracked":["/images/git/git-added.gif","Added unstaged" ,"/images/git/git-stage.gif", "Stage"],	
						 "Added":["/images/git/git-added.gif","Added staged" ,"/images/git/git-unstage.gif" , "Unstage"]	
					  };


orion.GitStatusRenderer = (function() {
	function GitStatusRenderer(tableDivId , model) {
		this._tableParentDivId = tableDivId;
		this._controller = model;
	}
	GitStatusRenderer.prototype = {
		initTable: function () {
			tableId = this._tableParentDivId + "_table";
		  	var tableParentDomNode = dojo.byId( this._tableParentDivId);
			dojo.place(document.createTextNode(""), tableParentDomNode, "only");
			
		  	var table = document.createElement('table');
			table.id = tableId;
			table.width = "100%";
			tableParentDomNode.appendChild(table);
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
			typeImg.src = orion.statusTypeMap[itemModel.type][0];
			typeColumn.appendChild(typeImg);
			row.appendChild(typeColumn);
			
			//render the file name field
			var nameColumn = document.createElement('td');
			nameColumn.width="100%";
			nameColumn.noWrap= true;
			row.appendChild(nameColumn);
			
			var nameSpan =  document.createElement('span');
			nameSpan.id = itemModel.name + "_" + itemModel.type +  "_nameSpan";
			dojo.place(document.createTextNode(itemModel.name), nameSpan, "only");
			nameSpan.style.color = "#0000FF";
			nameSpan.title = "Click to compare";
			nameColumn.appendChild(nameSpan);
			if(nameSpan.id === self._controller._model.selectedFileId ){
				self._controller._model.selectedItem = itemModel;
				dojo.toggleClass(nameSpan, "fileNameSelectedRow", true);
			}
			
			dojo.connect(nameSpan, "onmouseover", nameSpan, function() {
				nameSpan.style.cursor = self._controller.loading ? 'wait' :"pointer";
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", true);
			});
			dojo.connect(nameSpan, "onmouseout", nameSpan, function() {
				nameSpan.style.cursor = self._controller.loading ? 'wait' :"default";
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", false);
			});
			
			dojo.connect(nameSpan, "onclick", nameSpan, function() {
				if(itemModel.name !== self._controller._model.selectedFileId ){
					if(self._controller._model.selectedFileId !== undefined){
						var selected = document.getElementById(self._controller._model.selectedFileId);
						if(selected)
							dojo.toggleClass(selected, "fileNameSelectedRow", false);
					}
					self._controller.cursorWait(nameSpan , true);
					dojo.toggleClass(nameSpan, "fileNameSelectedRow", true);
					self._controller._model.selectedFileId = nameSpan.id;
					self._controller.loadDiffContent(itemModel);
				}
			});
			
			//render the side by side viewer icon
			sbsViewerCol = document.createElement('td');
			row.appendChild(sbsViewerCol);
			this._controller.createImgButton(false ,sbsViewerCol , "/images/git/compare-sbs.gif", "Side by side compare",
					function(evt) {
						self._controller.openSBSViewer(itemModel);
					} );
			
			//render the stage / unstage action  icon
			if(this._controller._model.isStaged(itemModel.type)){
				this._controller.hasStaged = true;
				return;
			} else {
				this._controller.hasUnstaged = true;
			}
			stageCol = document.createElement('td');
			row.appendChild(stageCol);
			this._controller.createImgButton(true ,stageCol , orion.statusTypeMap[itemModel.type][2], orion.statusTypeMap[itemModel.type][3],
					function(evt) {
						self._controller.doAction(itemModel.location , itemModel.type);
					} );
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
			this.initViewer();
			this._model.selectedFileId = null;
			this._loadBlock(this._unstagedTableRenderer , this._model.interestedUnstagedGroup);
			this._loadBlock(this._stagedTableRenderer , this._model.interestedStagedGroup);
			
			//We do not want to reload the diff viewer when status is reloaded.
			//if(this._model.selectedItem)
			//	this.loadDiffContent(this._model.selectedItem);
			//else
			//	this._model.selectedFileId = null;
			
			var self = this;
			var messageArea = document.getElementById("commitMessage");
			messageArea.disabled = !this.hasStaged;
			
			var stageAllBtn = document.getElementById("stageAll");
			var unstageAllBtn = document.getElementById("unstageAll");
			var commitBtn = document.getElementById("commit");
			var amendBtn = document.getElementById("amend");
			
			this.modifyImageButton(true ,stageAllBtn , "Stage all", function(evt){self.stageAll();} , !this.hasUnstaged);
			this.modifyImageButton(true ,unstageAllBtn , "Unstage all", function(evt){self.unstageAll();} , !this.hasStaged);
			this.modifyImageButton(true ,commitBtn , "Commit staged files", function(evt){self.commit(messageArea.value);} , !this.hasStaged , function(){return (messageArea.value === undefined || messageArea.value === null || messageArea.value === "");});
			this.modifyImageButton(false ,amendBtn , "Amend last commit", function(evt){self.commit(messageArea.value , true);} , true , function(){return (messageArea.value === undefined || messageArea.value === null || messageArea.value === "");});
			
			this.cursorClear();
		},
		
		_makeLocation: function(location , name){//temporary
			var relative = eclipse.util.makeRelative(location);
			var splitted = relative.split("/");
			if(splitted.length > 2)
				return "/" + splitted[1] + "/" + splitted[2] + "/" + name;
			return name;
		},
		
		cursorWait: function(currentDiv , remember){
			this.loading = true;
			document.body.style.cursor = 'wait';
			if(currentDiv)
				currentDiv.style.cursor = 'wait';
			if(remember)
				this.currentDiv = currentDiv;
		},
		
		cursorClear: function() {
			this.loading = false;
			document.body.style.cursor = 'default';
			if(this.currentDiv)
				this.currentDiv.style.cursor = 'default';
			this.currentDiv = undefined;
		},
		
		initViewer: function () {
		  	this._inlineCompareContainer.destroyEditor();//
			this._model.selectedItem = null;
			this.hasStaged = false;
			this.hasUnstaged = false;
			dojo.place(document.createTextNode("Compare..."), "fileNameInViewer", "only");
			this.removeProgressDiv("inline-compare-viewer"  , "compareIndicatorId");
			this.createProgressDiv("inline-compare-viewer"  , "compareIndicatorId" , "Select a file on the left to compare..");
		},
		
		createProgressDiv: function(progressParentId , progressId,message){
			var tableParentDiv = dojo.byId(progressParentId);
		
			var progressDiv = document.createElement('DIV');
			progressDiv.id = progressId;
			tableParentDiv.appendChild(progressDiv);
			progressDiv.width = "100%";
			progressDiv.align="center";
			
			var progressMessage = document.createElement('h2');
			dojo.place(document.createTextNode(message), progressMessage, "only");
			progressDiv.appendChild(progressMessage);
			return progressMessage;
		},
		
		_createProgressDivCenter: function(progressParentId , progressId,message){
			var tableParentDiv = dojo.byId(progressParentId);
			
			var table = document.createElement('table');
			tableParentDiv.appendChild(table);
			table.id = progressId;
			table.width = "100%";
			table.height = "100%";
			table.style.backgroundColor = "#EEEEEE";
			table.style.zIndex =100;
			table.style.opacity =0.5;
			
			var row = document.createElement('tr');
			table.appendChild(row);

			var progressColumn = document.createElement('td');
			row.appendChild(progressColumn);
			progressColumn.width = "100%";
			progressColumn.height =tableParentDiv.clientHeight;//"100%" ;
			progressColumn.noWrap= true;
			
			var progressDiv = document.createElement('DIV');
			progressColumn.appendChild(progressDiv);
			progressDiv.width = "100%";
			progressDiv.height = tableParentDiv.clientHeight;//"100%" ;
			progressDiv.align="center";
			
			var progressMessage = document.createElement('h2');
			dojo.place(document.createTextNode(message), progressMessage, "only");
			progressDiv.appendChild(progressMessage);
			
		},
	
		createImgButton: function(enableWaitCursor ,imgParentDiv , imgSrc, imgTitle,onClick){
			var imgBtn = document.createElement('img');
			imgBtn.src = imgSrc;
			imgParentDiv.appendChild(imgBtn);
			this.modifyImageButton(enableWaitCursor ,imgBtn , imgTitle,onClick);
		},
		
		modifyImageButton: function(enableWaitCursor , imgBtnDiv , imgTitle, onClick , disabled , onHoverCallBack){
			var self = this;
			if(disabled === undefined || !disabled){
				imgBtnDiv.title= imgTitle;
				
				dojo.style(imgBtnDiv, "opacity", "0.4");
				dojo.connect(imgBtnDiv, "onmouseover", imgBtnDiv, function() {
					//console.log( "onmouseover : " + self.loading );
					var disableOnHover = false;
					if(onHoverCallBack)
						disableOnHover = onHoverCallBack();
					imgBtnDiv.style.cursor = self.loading ? 'wait' : (disableOnHover ? "default" : "pointer");
					if(disableOnHover)
						dojo.style(imgBtnDiv, "opacity", "0.4");
					else
						dojo.style(imgBtnDiv, "opacity", "1");
				});
				dojo.connect(imgBtnDiv, "onmouseout", imgBtnDiv , function() {
					//console.log( "onmouseout : " + self.loading );
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default";
					dojo.style(imgBtnDiv, "opacity", "0.4");
				});
				imgBtnDiv.onclick = function(evt){
					var disableOnHover = false;
					if(onHoverCallBack)
						disableOnHover = onHoverCallBack();
					if(enableWaitCursor && !disableOnHover)
						self.cursorWait(imgBtnDiv , true) ;
					if(!disableOnHover)
						onClick(evt);
				};
			} else {
				imgBtnDiv.title= "";
				imgBtnDiv.style.cursor =  self.loading ? 'wait' : "default";
				dojo.style(imgBtnDiv, "opacity", "0.0");
				dojo.connect(imgBtnDiv, "onmouseover", imgBtnDiv, function() {
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default";
					dojo.style(imgBtnDiv, "opacity", "0");
				});
				dojo.connect(imgBtnDiv, "onmouseout", imgBtnDiv , function() {
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default";
					dojo.style(imgBtnDiv, "opacity", "0");
				});
				imgBtnDiv.onclick = null;
			}
		},
		
		removeProgressDiv: function(progressParentId , progressId){
			if(dojo.byId(progressId))
				dojo.place(document.createTextNode(""), progressParentId, "only");
		},
		
		_loadBlock: function(renderer , interedtedGroup){
			renderer.initTable();
			for (var i = 0; i < interedtedGroup.length ; i++){
				var groupName = interedtedGroup[i];
				var groupData = this._model.getGroupData(groupName);
				if(!groupData)
					break;
				for(var j = 0 ; j < groupData.length ; j++){
					renderer.renderRow({name:groupData[j].Name, 
										type:groupName, 
										location:groupData[j].Location,
										commitURI:groupData[j].Git.CommitLocation,
										indexURI:groupData[j].Git.IndexLocation,
										diffURI:groupData[j].Git.DiffLocation
					});
				} 
			}
		},
		
		_resolveURI: function(itemModel){
			var untracked = (itemModel.type === "Untracked");
			var added = (itemModel.type === "Added");
			var diffURI =  (untracked || added) ? null : itemModel.diffURI;
			var fileURI =  (untracked || added) ? itemModel.location : (this._model.isStaged(itemModel.type) ? itemModel.commitURI: itemModel.indexURI);
			return {diffURI:diffURI , fileURI:fileURI };
		},
		
		loadDiffContent: function(itemModel){
			this.cursorWait();
			var self = this;
			var result = this._resolveURI(itemModel);
			var diffVS = this._model.isStaged(itemModel.type) ? "index VS HEAD ) >>> " : "local VS index ) >>> " ;
			var message = "Compare( " + orion.statusTypeMap[itemModel.type][1] + " : " +diffVS + itemModel.name;
			this.removeProgressDiv("inline-compare-viewer"  , "compareIndicatorId");
			this._inlineCompareContainer.resolveDiff(result.diffURI,
													result.fileURI,
					                                function(){					
														dojo.place(document.createTextNode(message), "fileNameInViewer", "only");
														self.cursorClear();
													},
													function(response, ioArgs){
														self.handleServerErrors(response , ioArgs);
													}
			);
		},
		
		openSBSViewer: function(itemModel){
			var result = this._resolveURI(itemModel);
			var url = "/compare.html#" + (result.diffURI ?  result.diffURI+"?" : "")  + result.fileURI;
			window.open(url,"");
		},
		
		doAction: function(location  ,type){
			if(this._model.isStaged(type))
				this.unstage(eclipse.util.makeRelative(location));
			else
				this.stage(eclipse.util.makeRelative(location));
		},
		
		handleServerErrors: function(errorResponse , ioArgs){
		  	this._inlineCompareContainer.destroyEditor();
			dojo.place(document.createTextNode("Compare..."), "fileNameInViewer", "only");
			this.removeProgressDiv("inline-compare-viewer"  , "compareIndicatorId");
			var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
			var errorDiv = this.createProgressDiv("inline-compare-viewer"  , "compareIndicatorId" , message);
			dojo.style(errorDiv, "color", "red");
			this.cursorClear();
		},
		
		
		getGitStatus: function(url){
			this.cursorWait();
			var self = this;
			dojo.xhrGet({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				load: function(jsonData, ioArgs) {
					//console.log(JSON.stringify(jsonData));
					self.loadStatus(jsonData);
				},
				error: function(response, ioArgs) {
					self.handleServerErrors(response, ioArgs);
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
					self.getGitStatus(self._url);
				},
				error: function(response, ioArgs) {
					self.handleServerErrors(response, ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		stageAll: function(){
			var start = this._url.indexOf("/file/");
			if(start != -1){
				var sub = this._url.substring(start);
				var subSlitted = sub.split("/");
				if(subSlitted.length > 2){
					this.stage([subSlitted[0] , subSlitted[1] , subSlitted[2]].join("/") );
				}
			}
		},
		
		unstage: function(location){
			var self = this;
			var url = "/git/index" +  location;
			dojo.xhrPost({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				postData: dojo.toJson({"Reset":"MIXED"} ),
				load: function(jsonData, ioArgs) {
					//console.log(JSON.stringify(jsonData));
					self.getGitStatus(self._url);;
				},
				error: function(response, ioArgs) {
					self.handleServerErrors(response, ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		unstageAll: function(){
			var start = this._url.indexOf("/file/");
			if(start != -1)
				this.unstage(this._url.substring(start));
		},
		
		commitAll: function(location , message , body){
			var self = this;
			var url = "/git/commit/HEAD" +  location;
			dojo.xhrPost({
				url: url , 
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				timeout: 5000,
				postData: body,
				load: function(jsonData, ioArgs) {
					self.getGitStatus(self._url);;
				},
				error: function(response, ioArgs) {
					self.handleServerErrors(response, ioArgs);
					handleGetAuthenticationError(this, ioArgs);
					return response;
				}
			});
		},
		
		commit: function(message , amend){
			var start = this._url.indexOf("/file/");
			if(start != -1){
				var sub = this._url.substring(start);
				var subSlitted = sub.split("/");
				if(subSlitted.length > 2){
					this.commitAll([subSlitted[0] , subSlitted[1] , subSlitted[2]].join("/") , message , amend ?dojo.toJson({"Message":message,"Amend":"true"}): dojo.toJson({"Message":message}));
				}
			}
		},
		
		findFolderName: function(){
			var start = this._url.indexOf("/file/");
			if(start != -1){
				var sub = this._url.substring(start);
				return sub;
			}
			return this._url;
		}		
	};
	return GitStatusController;
}());

