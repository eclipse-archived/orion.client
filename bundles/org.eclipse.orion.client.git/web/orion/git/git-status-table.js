/******************************************************************************* 
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['dojo', 'orion/compare/diff-provider', 'orion/compare/compare-container','orion/commands','orion/git/git-commit-navigator', 'orion/git/gitCommands' ,'dijit/layout/ContentPane'], function(dojo, mDiffProvider, mCompareContainer,mCommands,mGitCommitNavigator,mGitCommands) {

var orion = orion || {};

orion.GitStatusModel = (function() {
	function GitStatusModel() {
		this.selectedFileId = undefined;
		this.selectedItem = undefined;
		this.interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"];
		this.interestedStagedGroup = ["Added", "Changed","Removed"];
		this.conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]];
		this.conflictType = "Conflicting";
	}
	GitStatusModel.prototype = {
		destroy: function(){
		},
		
		interestedCategory: function(){
			
		},
		
		init: function(jsonData){
			this.items = jsonData;
			/*
			for(var i = 0; i < this.conflictPatterns.length ; i++ ){
				this._markConflict(this.conflictPatterns[i]);
			}*/
		},
		
		getModelType: function(groupItem , groupName){
			/*
			if(groupItem.Conflicting){
				if(groupItem.Conflicting === "Hide")
					return undefined;
				else
					return this.conflictType;
			}*/
			return groupName;
		},
		
		_markConflict:function(conflictPattern){
			//if git status server API response a file with "Modified" ,"Added", "Changed","Missing" states , we treat it as a conflicting file
			//And we add additional attribute to that groupItem : groupItem.Conflicting = true;
			var baseGroup = this.getGroupData(conflictPattern[1]);
			if(!baseGroup)
				return;
			for(var i = 0 ; i < baseGroup.length ; i++){
				if(baseGroup[i].Conflicting)
					continue;
				var fileLocation = baseGroup[i].Location;
				var itemsInDetectGroup = [];
				
				for (var j = 2; j < conflictPattern.length ; j++){
					var groupName = conflictPattern[j];
					var groupData = this.getGroupData(groupName);
					if(!groupData)
						continue;
					var item = this._findSameFile(fileLocation , groupData);
					if(item){
						itemsInDetectGroup.push(item);
					} else {
						continue;
					}
				}
				
				//we have the same file at "Modified" ,"Added", "Changed","Missing" groups
				if(itemsInDetectGroup.length === (conflictPattern.length - 2) ){
					baseGroup[i].Conflicting = conflictPattern[0];
					for(var k = 0; k < itemsInDetectGroup.length ; k++){
						itemsInDetectGroup[k].Conflicting = "Hide";
					}
				}
			}
		},
		
		_findSameFile: function(fileLocation , groupData){
			for(var j = 0 ; j < groupData.length ; j++){
				if(groupData[j].Conflicting)
					continue;
				if(fileLocation === groupData[j].Location)
					return groupData[j];
			}
			return undefined;
		},
		
		getGroupData: function(groupName){
			return this.items[groupName];
		},
		
		isConflict: function(type){
			return type === this.conflictType;
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

orion.statusTypeMap = { "Missing":["/git/images/git-removed.gif", "Unstaged removal" , "/git/images/git-stage.gif", "Stage" ],
						"Removed":["/git/images/git-removed.gif","Staged removal" ,"/git/images/git-unstage.gif", "Unstage" ],	
						 "Modified":["/git/images/git-modify.gif","Unstaged change" ,"/git/images/git-stage.gif", "Stage" ],	
						 "Changed":["/git/images/git-modify.gif","Staged change" ,"/git/images/git-unstage.gif", "Untage"],	
					     "Untracked":["/git/images/git-added.gif","Unstaged add" ,"/git/images/git-stage.gif", "Stage"],	
						 "Added":["/git/images/git-added.gif","Staged add" ,"/git/images/git-unstage.gif" , "Unstage"],	
						 "Conflicting":["/git/images/conflict-file.gif","Conflicting" ,"/git/images/git-stage.gif" , "Resolve Conflict"]	
					  };


orion.GitStatusContentRenderer = (function() {
	function GitStatusContentRenderer(serviceRegistry ,tableDivId , model) {
		this._registry = serviceRegistry;
		this._tableParentDivId = tableDivId;
		this._controller = model;
	}
	GitStatusContentRenderer.prototype = {
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
			row.id = itemModel.name + "_" + itemModel.type + "_row";
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
					dojo.toggleClass(nameSpan, "fileNameSelectedRow", true);
					self._controller._model.selectedFileId = nameSpan.id;
					self._controller.loadDiffContent(itemModel);
				}
			});
			
			var actionCol = dojo.create("td", {id: row.id+"actions" ,style: "padding-left: 5px"}, row, "last");
			actionCol.noWrap= true;
			var actionsWrapper = dojo.create("span", {id: row.id+"actionsWrapper"}, actionCol, "only");
			// we must hide/show the span rather than the column.  IE and Chrome will not consider
			// the mouse as being over the table row if it's in a hidden column
			dojo.style(actionsWrapper, "visibility", "hidden");
			this._registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(actionsWrapper, "object", {type: "fileItem", object: itemModel}, this, "image", null);
			});
			
			dojo.connect(row, "onmouseover", row, function() {
				var wrapper = dojo.byId(this.id+"actionsWrapper");
				dojo.style(wrapper, "visibility", "visible");
			});
			
			dojo.connect(row, "onmouseout", row, function() {
				var wrapper = dojo.byId(this.id+"actionsWrapper");
				dojo.style(wrapper, "visibility", "hidden");
			});
			if(this._controller._model.isStaged(itemModel.type)){
				this._controller.hasStaged = true;
			} else {
				this._controller.hasUnstaged = true;
			}
		}
	};
	return GitStatusContentRenderer;
}());

orion.GitStatusTableRenderer = (function() {
	function GitStatusTableRenderer(serviceRegistry ,parentId , header , type) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
		this._header = header;
		this._type = type;
	}
	GitStatusTableRenderer.prototype = {
		render: function (renderSeparator) {
			var headerTable = dojo.create("table", {width:"100%"},this._parentId);
			var row = dojo.create("tr", null, headerTable);
			var titleCol = dojo.create("td", {width:"50%" ,height:"100%"}, row, "last");
			var title = dojo.create("h2", {innerHTML: this._header}, titleCol, "last");
			
			var actionCol = dojo.create("td", {width:"50%" ,height:"100%" ,nowrap :true}, row, "last");
			var actionDiv = dojo.create("div", {style:"float: right;", align:"right"}, actionCol, "last");
			this._cmdSpan = dojo.create("span", null, actionDiv, "last");
			
			dojo.create("hr", null,this._parentId);
			
			this._statusContentId = this._parentId + "_" + this._type;
			dojo.create("div", {id:this._statusContentId}, this._parentId, "last");
			if(	renderSeparator)
				dojo.create("table", {width:"100%", height:"10px"},this._parentId);
		},
		
		getStatusContentId: function(){
			return this._statusContentId;
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpan, "only");
			var self = this;
			this._registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(self._cmdSpan, "object", {type: self._type}, this, "image", null);
			});
		}
	};
	return GitStatusTableRenderer;
}());

orion.GitCommitZoneRenderer = (function() {
	function GitCommitZoneRenderer(serviceRegistry ,parentId) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
	}
	GitCommitZoneRenderer.prototype = {
		render: function (renderSeparator) {
			var headerTable = dojo.create("table", {width:"100%"},this._parentId);
			var row = dojo.create("tr", null, headerTable);
			var titleCol = dojo.create("td", {nowrap :true}, row, "last");
			var title = dojo.create("h2", {innerHTML: "Commit message:"}, titleCol, "last");
			
			var commitTable = dojo.create("table", null,this._parentId);
			var commitRow = dojo.create("tr", null, commitTable);
			var messageCol = dojo.create("td", {nowrap :true}, commitRow, "last");
			dojo.create("textarea", {id:"commitMessage", COLS:40, ROWS:6}, messageCol, "last");
			
			var actionCol = dojo.create("td", {nowrap :true}, commitRow, "last");
			var actionDiv = dojo.create("div", {style:"float: left;", align:"left"}, actionCol, "last");
			var actionTable = dojo.create("table", null,actionDiv);
			var actionRow1 = dojo.create("tr", null, actionTable);
			var actionCol1 = dojo.create("td", {nowrap :true}, actionRow1, "last");
			dojo.create("button", {id:"commit", innerHTML: "Commit"}, actionCol1, "last");
			
			dojo.create("tr", {width:"100%" ,height:"20px"}, actionTable);

			var actionRow2 = dojo.create("tr", null, actionTable);
			var actionCol2 = dojo.create("td", {nowrap :true}, actionRow2, "last");
			dojo.create("input", {id:"amend", type:"checkbox" ,value: "Amend"}, actionCol2, "last");
			actionCol2.appendChild(document.createTextNode(" Amend"));
			if(	renderSeparator)
				dojo.create("table", {width:"100%", height:"10px"},this._parentId);
		}
		
	};
	return GitCommitZoneRenderer;
}());

orion.GitLogTableRenderer = (function() {
	function GitLogTableRenderer(controller ,serviceRegistry ,parentId , header , type ) {
		this._controller = controller;
		this._registry = serviceRegistry;
		this._parentId = parentId;
		this._header = header;
		this._type = type;
	}
	GitLogTableRenderer.prototype = {
		render: function (renderSeparator) {
			var headerTable = dojo.create("table", null,this._parentId);
			var row = dojo.create("tr", null, headerTable);
			var titleCol = dojo.create("td", null, row, "last");
			dojo.create("h2", {innerHTML: this._header}, titleCol, "last");
			var cmdCol = dojo.create("td", null, row, "last");
			this._cmdSpan = dojo.create("span", null, cmdCol, "last");
			var cmdColAdditional = dojo.create("td", null, row, "last");
			this._cmdSpanAdditional = dojo.create("span", null, cmdColAdditional, "last");
			dojo.create("hr", null,this._parentId);
			this._logContentId = this._parentId + "_" + this._type;
			//dojo.create("div", {id:this._logContentId , style: "border:1px solid grey ;margin-left: 5px; margin-right: 30px; width: 95%; height: 200px; overflow: auto"}, this._parentId, "last");
			dojo.create("div", {id:this._logContentId , style: "margin-left: 5px; margin-right: 5px; width: 99%; overflow: false"}, this._parentId, "last");
			if(	renderSeparator)
				dojo.create("table", {width:"100%", height:"10px"},this._parentId);
		},
		
		getLogContentId: function(){
			return this._logContentId;
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpan, "only");
			var self = this;
			this._registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(self._cmdSpan, "object", {type: self._type , object:self._controller}, this, "image", null,null, true);
			});
		},
		
		renderAdditionalAction:function(item){
			dojo.place(document.createTextNode(""), this._cmdSpanAdditional, "only");
			var self = this;
			this._registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(self._cmdSpanAdditional, "object", item, this, "image", null,null, true);
			});
		}
	};
	return GitLogTableRenderer;
}());

orion.InlineCompareRenderer = (function() {
	function InlineCompareRenderer(serviceRegistry ,parentId) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
	}
	InlineCompareRenderer.prototype = {
		render: function () {
			var titleTable = dojo.create("table" , {width:"100%"});
			var row = dojo.create("tr", null, titleTable);
			var titleCol = dojo.create("td", {nowrap :true}, row, "last");
			var title = dojo.create("h2", {id :"fileNameInViewer" ,innerHTML: "Select a file on the left to compare..."}, titleCol, "last");
			var titleDiv = new dijit.layout.ContentPane({region: "top", style:"width:100%;height:30px;overflow: hidden;"});
			dojo.addClass(titleDiv, 'auxpane');
			titleDiv.attr('content', titleTable);
			
			var viewerDiv = new dijit.layout.ContentPane({class:"mainpane" ,id : "inline-compare-viewer" ,splitter:false ,region: "center", style:"width:100%;height:100%;overflow: hidden;"});
			dojo.addClass(viewerDiv, 'mainpane');
			
			var parent = dijit.byId(this._parentId);
			parent.addChild(titleDiv);
			parent.addChild(viewerDiv);
		}
		
	};
	return InlineCompareRenderer;
}());

orion.GitStatusController = (function() {
	function GitStatusController(options ,serviceRegistry , statusService, unstagedDivId , stagedDivId) {
		this._registry = serviceRegistry;
		this._statusService = statusService;
		this._model = new orion.GitStatusModel();
		this._timerOn = false;
		this._renderLog = options.renderLog ? true:false;
		this._generateCommands();
		
		this._unstagedTableRenderer = new orion.GitStatusTableRenderer(serviceRegistry ,"statusZone" , "Unstaged" , "unstagedItems");
		this._unstagedTableRenderer.render(true);
		this._stagedTableRenderer = new orion.GitStatusTableRenderer(serviceRegistry ,"statusZone" , "Staged" , "stagedItems");
		this._stagedTableRenderer.render();
		this._commitZoneRenderer = new orion.GitCommitZoneRenderer(serviceRegistry ,"statusZone");
		this._commitZoneRenderer.render(true);
		if(this._renderLog){
			this._logTableRenderer = new orion.GitLogTableRenderer(this ,serviceRegistry ,"logZone" , "Recent commits on" , "gitLog");
			this._logTableRenderer.render(true);
			
			this._remoteTableRenderer = new orion.GitLogTableRenderer(this,serviceRegistry ,"logZone" , "Recent commits on" , "gitRemote");
			this._remoteTableRenderer.render(true);
			
	        //this._gitCommitNavigatorLog = new mGitCommitNavigator.GitCommitNavigator(serviceRegistry, null, null,this._logTableRenderer.getLogContentId());    
	        //this._gitCommitNavigatorRem = new mGitCommitNavigator.GitCommitNavigator(serviceRegistry, null, null,this._remoteTableRenderer.getLogContentId());
		}
		
		(new orion.InlineCompareRenderer(serviceRegistry ,"viewerZone")).render();
		
		this._unstagedContentRenderer = new orion.GitStatusContentRenderer(serviceRegistry ,this._unstagedTableRenderer.getStatusContentId(), this);
		this._stagedContentRenderer = new orion.GitStatusContentRenderer(serviceRegistry ,this._stagedTableRenderer.getStatusContentId() , this);
		this._inlineCompareContainer = new mCompareContainer.InlineCompareContainer(new mDiffProvider.DiffProvider(serviceRegistry),serviceRegistry ,"inline-compare-viewer");
		var self = this;
		self._stagingConflict = false;
		var commitBtn = document.getElementById("commit");
		commitBtn.onclick = function(evt){
			self.commit();
		};
		
	}
	GitStatusController.prototype = {
		loadStatus: function(jsonData){
			this._model.init(jsonData);
			this._getCloneInfo();
		},
		
		_processStatus: function(){
			this.initViewer();
			this._model.selectedFileId = null;
			this._loadBlock(this._unstagedContentRenderer , this._model.interestedUnstagedGroup);
			this._loadBlock(this._stagedContentRenderer , this._model.interestedStagedGroup);
			if(this._renderLog && this._initializing){
				this._renderLogs(false);
				this._renderLogs(true);
				var that = this;
				this._registry.getService("orion.page.command").then(function(commandService) {
					mGitCommands.createStatusCommands(that._registry , commandService , function(){that.getGitStatus(that._url ,true);} , 9 , that._gitCommitNavigatorLog , that._gitCommitNavigatorRem);
				});
			}
			
			this._unstagedTableRenderer.renderAction();
			this._stagedTableRenderer.renderAction();
			if(this._renderLog){
				this._logTableRenderer.renderAction();
				this._remoteTableRenderer.renderAction();
			}
			
			this._renderGlobalActions();
			
			var self = this;
			var messageArea = document.getElementById("commitMessage");
			messageArea.disabled = !this.hasStaged;
			
			var commitBtn = document.getElementById("commit");
			var amendBtn = document.getElementById("amend");
			
			commitBtn.disabled = !this.hasStaged;
			amendBtn.disabled = !this.hasStaged;
			amendBtn.checked = false;
			messageArea.value = "";
			if(this.hasStaged)
				this.startTimer();
			else 
				this.stopTimer();
			
			if(this._stagingConflict){
				this._stagingConflict = false;
				if(!this.hasStaged){
					this.commit("Resolved deletion conflicts on file " + this._stagingName, false);
				}
			}
			
			this._statusService.setProgressMessage("");
		},
		
		_renderGlobalActions:function(){
			var toolbar = dojo.byId( "pageActions");
			dojo.place(document.createTextNode(""), toolbar, "only");
			var self = this;
			this._registry.getService("orion.page.command").then(function(service) {
				service.renderCommands(toolbar, "dom", {type: "global"}, this, "image",  null, null, true);
			});
		},
		
		_processCloneInfo:function(){
			dojo.byId("logZone").style.display = "block";
			this._curBranch = undefined;
			for(var i=0; i<this._branchInfo.Children.length; i++){
				if(this._branchInfo.Children[i].Current)
					this._curBranch = this._branchInfo.Children[i];
			}
			this._curRemote = this._remoteInfo.Children[0];
			this._curClone = this._cloneInfo.Children[0];
			
			this._initTitleBar(true);
			var that = this;
			var openGitLog = new mCommands.Command({
				name : that._curBranch.Name,
				id : "orion.openGitLog",
				hrefCallback : function(item) {
					return "/git/git-log.html#" + that._curBranch.CommitLocation + "?page=1";
				},
				visibleWhen : function(item) {
					return item.type === "gitLog";
				}
			});
		
			var openGitRemote = new mCommands.Command({
				name : (that._curRemote ? that._curRemote.Name : "") + "/" + that._curBranch.Name,
				id : "orion.openGitRemote",
				hrefCallback : function(item) {
					return "/git/git-log.html?remote#" + that._curBranch.RemoteLocation + "?page=1";
				},
				visibleWhen : function(item) {
					return item.type === "gitRemote";
				}
			});
			this._registry.getService("orion.page.command").then(function(commandService) {
				commandService.addCommand(openGitLog, "object");	
				commandService.addCommand(openGitRemote, "object");	
				commandService.registerCommandContribution("orion.openGitLog", 8);	
				commandService.registerCommandContribution("orion.openGitRemote", 9);	
			});
		},
		
		_initTitleBar:function(withBranchName){
			var title = "Git Status";
			var location = "";
			if(withBranchName) {
				location = this._curClone.Name + " on " + this._curBranch.Name;
			}
			document.title = location;
			// not good that these dom id's are known way down here
			dojo.place(document.createTextNode(title), "pageTitle", "only");
			dojo.place(document.createTextNode(location), "location", "only");
		},
		
		_getCloneInfo:function(){
			var that = this;
			if (that._initializing) {
				var path = that._model.items.CloneLocation;
				that._registry.getService("orion.git.provider").then(function(gitService){
					gitService.getGitClone(path, function(cloneJsonData, secondArd) {
						that._cloneInfo = cloneJsonData;
						if(that._cloneInfo.Children.length === 0){
							that._renderLog = false;
							that._initTitleBar();
							that._processStatus();
							return;
						}
							
						that._registry.getService("orion.git.provider").then(function(gitService){
							gitService.getGitBranch(that._cloneInfo.Children[0].BranchLocation).then(function(children){
								that._branchInfo = children;
								gitService.getGitRemote(that._cloneInfo.Children[0].RemoteLocation).then(function(children){
									that._remoteInfo = children;
									that._processCloneInfo();
									that._processStatus();
								});
							});
						});
					});
				});
			} else {
				that._processStatus();
			}
		},
		
		_renderLogs:function(isRemote){
			var that = this;
			if(!this._renderLog)
				return;
			if (isRemote) {
				if(!this._curRemote)
					return;
		        this._gitCommitNavigatorRem = new mGitCommitNavigator.GitCommitNavigator(this._registry, null, null, {checkbox: false, minimal: true}, this._remoteTableRenderer.getLogContentId());    
				dojo.place(document.createTextNode(""), this._remoteTableRenderer.getLogContentId(), "only");
				// refresh the commit list for the remote
				var path = this._curBranch.RemoteLocation + "?page=1";
				dojo.xhrGet({
					url : path,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, secondArg) {
						that._registry.getService("orion.git.provider").then(function(gitService){
							gitService.getLog(jsonData.HeadLocation, jsonData.Id, function(scopedCommitsJsonData, secondArd) {
								that._gitCommitNavigatorRem.renderer.setIncomingCommits(scopedCommitsJsonData);
								that._gitCommitNavigatorRem.loadCommitsList(jsonData.CommitLocation + "?page=1&pageSize=5", jsonData);
								that._remoteTableRenderer.renderAdditionalAction(that._gitCommitNavigatorRem._lastTreeRoot);
							});
						});
					},
					error : function(error, ioArgs) {
						//mAuth.handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				});
			} else {
		        this._gitCommitNavigatorLog = new mGitCommitNavigator.GitCommitNavigator(this._registry, null, null, {checkbox: false, minimal: true},this._logTableRenderer.getLogContentId());
		        dojo.place(document.createTextNode(""), this._logTableRenderer.getLogContentId(), "only");
				var path = that._curBranch.CommitLocation + "?page=1";
				dojo.xhrGet({
					url : path,
					headers : {
						"Orion-Version" : "1"
					},
					handleAs : "json",
					timeout : 5000,
					load : function(jsonData, secondArg) {
						return jsonData;
					},
					error : function(error, ioArgs) {
						//mAuth.handleGetAuthenticationError(this, ioArgs);
						console.error("HTTP status code: ", ioArgs.xhr.status);
					}
				}).then(function(commitLogJsonData){
					if (commitLogJsonData.RemoteLocation == null){
						that._gitCommitNavigatorLog.loadCommitsList(that._curBranch.CommitLocation +"?page=1&pageSize=5", {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.RemoteLocation});
					}
					else {
						dojo.xhrGet({
							url : commitLogJsonData.RemoteLocation,
							headers : {
								"Orion-Version" : "1"
							},
							handleAs : "json",
							timeout : 5000,
							load : function(remoteJsonData, secondArg) {
								that._registry.getService("orion.git.provider").then(function(gitService){
									gitService.getLog(remoteJsonData.CommitLocation, "HEAD", function(scopedCommitsJsonData, secondArg) {
										that._gitCommitNavigatorLog.renderer.setOutgoingCommits(scopedCommitsJsonData);
										that._gitCommitNavigatorLog.loadCommitsList(that._curBranch.CommitLocation +"?page=1&pageSize=5" , {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.RemoteLocation});
										if(that._curRemote && scopedCommitsJsonData.length > 0)
											that._logTableRenderer.renderAdditionalAction(that._gitCommitNavigatorLog._lastTreeRoot);
									});
								});
							},
							error : function(error, ioArgs) {
								//mAuth.handleGetAuthenticationError(this, ioArgs);
								console.error("HTTP status code: ", ioArgs.xhr.status);
								that._gitCommitNavigatorLog.loadCommitsList(path, {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.RemoteLocation});
							}
						});
					}
				});
			}
		},
		
		
		_generateCommands: function(){
			var self = this;
			var sbsCompareCommand = new mCommands.Command({
				name: "Side by side compare",
				tooltip: "Side by side compare",
				image: "/git/images/compare-sbs.gif",
				id: "orion.sbsCompare",
				hrefCallback: function(item) {
					return self.openCompareEditor(item.object);
				},
				visibleWhen: function(item) {
					return item.type === "fileItem";
				}
			});		

			var checkoutCommand = new mCommands.Command({
				name: "checkout",
				tooltip: "checkout",
				image: "/git/images/git-checkout.gif",
				id: "orion.gitCheckout",
				callback: function(item) {
					self._registry.getService("orion.page.dialog").then(function(service) {
						service.confirm("Your changes to the file will be lost. Are you sure you want to checkout?",
						function(doit) {
							if (!doit) {
								return;
							}
							self._statusService.setProgressMessage("Checking out...");
							self.checkout(item.object);
						});
					});
				},
				visibleWhen: function(item) {
					return (item.type === "fileItem" && !self._model.isStaged(item.object.type));
				}
			});		

			var stageCommand = new mCommands.Command({
				name: "stage",
				tooltip: "stage",
				image: "/git/images/git-stage.gif",
				id: "orion.gitStage",
				callback: function(item) {
					self._statusService.setProgressMessage("Staging...");
					return self.stage(item.object.indexURI , item.object);
				},
				visibleWhen: function(item) {
					return (item.type === "fileItem" && !self._model.isStaged(item.object.type));
				}
			});		

			var stageAllCommand = new mCommands.Command({
				name: "stageAll",
				tooltip: "Stage all",
				image: "/git/images/git-stage-all.gif",
				id: "orion.gitStageAll",
				callback: function(item) {
					self._statusService.setProgressMessage("Staging...");
					return self.stageAll();
				},
				visibleWhen: function(item) {
					return (item.type === "unstagedItems" && self.hasUnstaged);
				}
			});		

			var unstageCommand = new mCommands.Command({
				name: "unstage",
				tooltip: "Unstage",
				image: "/git/images/git-unstage.gif",
				id: "orion.gitUnstage",
				callback: function(item) {
					self._statusService.setProgressMessage("Unstaging...");
					return self.unstage(item.object);
				},
				visibleWhen: function(item) {
					return false;//(item.type === "fileItem" && self._model.isStaged(item.object.type));
				}
			});		

			var unstageAllCommand = new mCommands.Command({
				name: "unstageAll",
				tooltip: "Unstage all",
				image: "/git/images/git-unstage-all.gif",
				id: "orion.gitUnstageAll",
				callback: function(item) {
					self._statusService.setProgressMessage("Unstaging...");
					return self.unstageAll("MIXED");
				},
				visibleWhen: function(item) {
					return (item.type === "stagedItems" && self.hasStaged);
				}
			});		

			var resetChangesCommand = new mCommands.Command({
				name: "Reset",
				tooltip: "Reset all changes",
				image: "/git/images/git-undo-changes.gif",
				id: "orion.gitResetChanges",
				callback: function(item) {
					self._registry.getService("orion.page.dialog").then(function(service) {
						service.confirm("The content of the working directory will be reset to content on the index.\n" + 
								"All unstaged and staged changes in the working directory will be discarded and cannot be recovered.\n" +
								"Are you sure you want to continue?",
						function(doit) {
							if (!doit) {
								return;
							}
							self._statusService.setProgressMessage("Resetting local changes...");
							return self.unstageAll("HARD");
						});
					});
				},
				
				visibleWhen: function(item) {
					return (self.hasStaged || self.hasUnstaged);
				}
			});		

			this._registry.getService("orion.page.command").then(function(commandService) {
				// register commands with object scope
				commandService.addCommand(sbsCompareCommand, "object");	
				commandService.addCommand(stageCommand, "object");	
				commandService.addCommand(checkoutCommand, "object");	
				commandService.addCommand(stageAllCommand, "object");	
				commandService.addCommand(unstageAllCommand, "object");	
				commandService.addCommand(unstageCommand, "object");	
				commandService.addCommand(resetChangesCommand, "dom");	
				commandService.registerCommandContribution("orion.gitStage", 1);	
				commandService.registerCommandContribution("orion.gitCheckout", 2);	
				commandService.registerCommandContribution("orion.gitUnstage", 3);	
				commandService.registerCommandContribution("orion.sbsCompare", 4);	
				commandService.registerCommandContribution("orion.gitStageAll", 5);	
				commandService.registerCommandContribution("orion.gitUnstageAll", 6);	
				commandService.registerCommandContribution("orion.gitResetChanges", 7 , "pageActions");	
			});
		},

		startTimer: function(){
			if(!this.timerOn){
				this.timerOn = true;
				this.doTimer();
			}
		},
		
		stopTimer: function(){
			if(this.timerOn && this._timerId){
				this.timerOn = false;
				clearTimeout(this._timerId);
			}
		},
		
		doTimer: function(){
			var messageArea = document.getElementById("commitMessage");
			var commitBtn = document.getElementById("commit");
			commitBtn.disabled = (messageArea.value === "");
			this._timerId = setTimeout(dojo.hitch(this, function() {
				this.doTimer(); 
			}), 150);
		},
		
		initViewer: function () {
		  	this._inlineCompareContainer.destroyEditor();
			this._model.selectedItem = null;
			this.hasStaged = false;
			this.hasUnstaged = false;
			dojo.place(document.createTextNode("Select a file on the left to compare..."), "fileNameInViewer", "only");
			dojo.style("fileNameInViewer", "color", "#6d6d6d");
		},

		_createImgButton: function(enableWaitCursor ,imgParentDiv , imgSrc, imgTitle,onClick){
			var imgBtn = document.createElement('img');
			imgBtn.src = imgSrc;
			imgParentDiv.appendChild(imgBtn);
			this.modifyImageButton(enableWaitCursor ,imgBtn , imgTitle,onClick);
		},
		
		_modifyImageButton: function(enableWaitCursor , imgBtnDiv , imgTitle, onClick , disabled , onHoverCallBack){
			var self = this;
			if(disabled === undefined || !disabled){
				imgBtnDiv.title= imgTitle;
				
				dojo.style(imgBtnDiv, "opacity", "0.4");
				dojo.connect(imgBtnDiv, "onmouseover", imgBtnDiv, function() {
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
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default";
					dojo.style(imgBtnDiv, "opacity", "0.4");
				});
				imgBtnDiv.onclick = function(evt){
					var disableOnHover = false;
					if(onHoverCallBack)
						disableOnHover = onHoverCallBack();
					if(enableWaitCursor && !disableOnHover)
						//self.cursorWait(imgBtnDiv , true) ;
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
		
		_sortBlock: function(interedtedGroup){
			var retValue = [];
			for (var i = 0; i < interedtedGroup.length ; i++){
				var groupName = interedtedGroup[i];
				var groupData = this._model.getGroupData(groupName);
				if(!groupData)
					continue;
				for(var j = 0 ; j < groupData.length ; j++){
					var renderType = this._model.getModelType(groupData[j] , groupName);
					if(renderType){
						retValue.push({name:groupData[j].Name, 
											type:renderType, 
											location:groupData[j].Location,
											path:groupData[j].Path,
											commitURI:groupData[j].Git.CommitLocation,
											indexURI:groupData[j].Git.IndexLocation,
											diffURI:groupData[j].Git.DiffLocation,
											conflicting:this._model.isConflict(renderType)
						});
					}
				} 
			}
			retValue.sort(function(a, b) {
				var n1 = a.name && a.name.toLowerCase();
				var n2 = b.name && b.name.toLowerCase();
				if (n1 < n2) { return -1; }
				if (n1 > n2) { return 1; }
				return 0;
			}); 
			return retValue;
		},
			
		
		_loadBlock: function(renderer , interedtedGroup){
			renderer.initTable();
			var retValue = this._sortBlock(interedtedGroup);
			for (var i = 0; i < retValue.length ; i++){
				renderer.renderRow(retValue[i]);
			}
		},
		
		loadDiffContent: function(itemModel){
			this._statusService.setProgressMessage("Loading diff...");
			var self = this;
			var diffVS = this._model.isStaged(itemModel.type) ? "index VS HEAD ) " : "local VS index ) " ;
			var message = "Compare( " + orion.statusTypeMap[itemModel.type][1] + " : " +diffVS ;
			
			var diffURI = (this._model.isConflict(itemModel.type) ? itemModel.diffURI : itemModel.diffURI + "?conflict=true");
			this._inlineCompareContainer.resolveDiff(diffURI + "?conflict=true",
					                                function(newFile , OldFile){					
														dojo.place(document.createTextNode(message), "fileNameInViewer", "only");
														dojo.style("fileNameInViewer", "color", "#6d6d6d");
														self._statusService.setProgressMessage("");
													},
													function(response, ioArgs){
														self.handleServerErrors(response , ioArgs);
													}
			);
		},
		
		openCompareEditor: function(itemModel){
			var diffParam = "";
			var baseUrl = "/compare/compare.html#";
			if(this._model.isConflict(itemModel.type)){
				diffParam = "?conflict=true";
			}
			if(this._model.isStaged(itemModel.type)){
				baseUrl = "/compare/compare.html?readonly#";
			}
			var url = baseUrl + itemModel.diffURI + diffParam;
			return url;
			//window.open(url,"");
		},
		
		handleServerErrors: function(errorResponse , ioArgs){
			var display = [];
			display.Severity = "Error";
			display.HTML = false;
			display.Message =  typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText;//dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage;
			
			this._statusService.setProgressResult(display);
		},
		
		getGitStatus: function(url , initializing){
			this._url = url;
			this._initializing = (initializing ? true:false);
			if(this._initializing){
				this._cloneInfo = undefined;
				this._statusService.setProgressMessage("Loading status...");
			}
			var self = this;
			self._registry.getService("orion.git.provider").then(
				function(service) {
					service.getGitStatus(url, 
										 function(jsonData, secondArg) {
										 	 self.loadStatus(jsonData);
										 },
										 function(response, ioArgs){
											 self.handleServerErrors(response, ioArgs);
										 }
					);
				});
		},
		
		stage: function(location , itemModel){
			var self = this;
			if(itemModel && itemModel.conflicting){
				self._stagingConflict = true;
				self._stagingName = itemModel.name;
			}
			else
				self._stagingConflict = false;
			self._registry.getService("orion.git.provider").then(
					function(service) {
						service.stage(location, 
											 function(jsonData, secondArg) {
											 	 self.getGitStatus(self._url);
											 },
											 function(response, ioArgs){
												 self.handleServerErrors(response, ioArgs);
											 }
						);
					});
		},
		
		checkout: function(itemModel){
			var self = this;
			var location = this._model.items.CloneLocation;
			self._registry.getService("orion.git.provider").then(
					function(service) {
						service.checkoutPath(location, [itemModel.name],
											 function(jsonData, secondArg) {
											 	 self.getGitStatus(self._url);
											 },
											 function(response, ioArgs){
												 self.handleServerErrors(response, ioArgs);
											 }
						);
					});
		},
		
		stageAll: function(){
			this.stage(this._model.items.IndexLocation);
		},
		
		unstage: function(itemModel){
			var self = this;
			self._registry.getService("orion.git.provider").then(
					function(service) {
						service.unstage(self._model.items.IndexLocation, [itemModel.path],
											 function(jsonData, secondArg) {
											 	 self.getGitStatus(self._url);
											 },
											 function(response, ioArgs){
												 self.handleServerErrors(response, ioArgs);
											 }
						);
					});
		},
		
		unstageAll: function(resetParam){
			var self = this;
			self._registry.getService("orion.git.provider").then(
					function(service) {
						service.unstageAll(self._model.items.IndexLocation, resetParam,
											 function(jsonData, secondArg) {
											 	 self.getGitStatus(self._url);
											 },
											 function(response, ioArgs){
												 self.handleServerErrors(response, ioArgs);
											 }
						);
					});
		},
		
		commitAll: function(location , message , body){
			var self = this;
			self._statusService.setProgressMessage("Committing...");
			self._registry.getService("orion.git.provider").then(
					function(service) {
						service.commitAll(location,  message , body,
											 function(jsonData, secondArg) {
											 	 self.getGitStatus(self._url,true);
											 },
											 function(response, ioArgs){
												 self.handleServerErrors(response, ioArgs);
											 }
						);
					});
		},
		
		commit: function(message , amend){
			if(!message){
				var messageArea = document.getElementById("commitMessage");
				message = messageArea.value;
				if(message === "")
					return;
				var amendBtn = document.getElementById("amend");
				amend = amendBtn.checked;
			}
			this.commitAll(this._model.items.CommitLocation , message , amend ?dojo.toJson({"Message":message,"Amend":"true"}): dojo.toJson({"Message":message}));
		}
		
	};
	return GitStatusController;
}());

return orion;	
});
