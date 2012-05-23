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

/*global define dojo dijit document console */


define(['i18n!git/nls/gitmessages', 'require', 'dojo',  'orion/compare/compare-container', 'orion/commands', 'orion/globalCommands', 'orion/git/git-commit-navigator', 'orion/git/gitCommands', 'orion/breadcrumbs', 'orion/util', 'orion/compare/compareUtils', 'dijit/layout/ContentPane'], function(
		messages, require, dojo,  mCompareContainer, mCommands, mGlobalCommands, mGitCommitNavigator, mGitCommands, mBreadcrumbs, mUtil, mCompareUtils) {

	var orion = orion || {};
	
		
/**
 * Create a stylized pane heading.
 * @param {DomNode} parent the parent node of the title element
 * @param {String} the string to use as the heading id. It will also be used to prefix any generated id's.
 * @param {String} headingLabel the pane heading text
 * @param {Boolean} isAuxStyle specifies whether heading is in an auxiliary pane or main pane
 * @param {String} headingId the id for the heading label.  Optional
 * @param {String} commandId the id for command tools.  Optional
 * @param {Object} command service for rendering commands.  Optional, no commands are rendered if not specified.
 * @param {Object} the handler for commands.  Optional.  
 * @param {Object} the item for command rendering.  Optional.
 */
function createPaneHeading(parent, id, headingLabel, isAuxStyle, headingId, commandId, commandService, handler, item) {
	headingId = headingId || id+"heading"; //$NON-NLS-0$
	commandId = commandId || id+"commands"; //$NON-NLS-0$
	var paneHeadingFragment = 
		'<div class="toolComposite" id="' + id + '">' + //$NON-NLS-1$ //$NON-NLS-0$
			'<div class="layoutLeft" id="' + id + '"><span class="paneTitle" id="' + headingId + '">' + headingLabel + '</span></div>' + //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			'<ul class="layoutRight commandList sectionActions" id="' + commandId + '"></ul>' + //$NON-NLS-1$ //$NON-NLS-0$
			'<div id="' + parent.id + 'slideContainer" class="layoutBlock slideParameters slideContainer">' + //$NON-NLS-1$ //$NON-NLS-0$
				'<span id="' + parent.id + 'slideOut" class="slide">' + //$NON-NLS-1$ //$NON-NLS-0$
					'<span id="' + parent.id + 'pageCommandParameters" class="parameters"></span>' + //$NON-NLS-1$ //$NON-NLS-0$
					'<span id="' + parent.id + 'pageCommandDismiss" class="parametersDismiss"></span>' + //$NON-NLS-1$ //$NON-NLS-0$
				'</span>' + //$NON-NLS-0$
			'</div>'+ //$NON-NLS-0$
		'</div>'; //$NON-NLS-0$
		
	dojo.place(paneHeadingFragment, parent, "last"); //$NON-NLS-0$
	if (isAuxStyle) {
		dojo.addClass(id, "auxpaneHeading"); //$NON-NLS-0$
	} else {
		dojo.addClass(id, "paneHeading"); //$NON-NLS-0$
	}
	
	if (commandService) {
		commandService.renderCommands(commandId, dojo.byId(commandId), item || handler, handler, "button"); //$NON-NLS-0$
	}
	return dojo.byId(id);
}

orion.GitStatusModel = (function() {
	function GitStatusModel() {
		this.selectedFileId = undefined;
		this.selectedItem = undefined;
		this.interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.interestedStagedGroup = ["Added", "Changed","Removed"]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]]; //$NON-NLS-11$ //$NON-NLS-10$ //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.conflictType = "Conflicting"; //$NON-NLS-0$
	}
	GitStatusModel.prototype = {
		destroy: function(){
		},
		
		interestedCategory: function(){
		},
		
		init: function(jsonData){
			this.items = jsonData;
		},
		
		getModelType: function(groupItem , groupName){
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
						itemsInDetectGroup[k].Conflicting = "Hide"; //$NON-NLS-0$
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

orion.statusTypeMap = { "Missing":[require.toUrl("git/images/removal.gif"), messages["Unstaged removal"] , require.toUrl("git/images/stage.gif"), messages["Stage"] ], //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
						"Removed":[require.toUrl("git/images/removal.gif"),messages["Staged removal"] ,require.toUrl("git/images/unstage.gif"), messages["Unstage"] ],	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
						 "Modified":[require.toUrl("git/images/modification.gif"),messages["Unstaged change"] ,require.toUrl("git/images/stage.gif"), messages['Stage'] ],	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
						 "Changed":[require.toUrl("git/images/modification.gif"),messages["Staged change"] ,require.toUrl("git/images/unstage.gif"), messages['Unstage']],	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
					     "Untracked":[require.toUrl("git/images/addition.gif"),messages["Unstaged add"] ,require.toUrl("git/images/stage.gif"), messages['Stage']],	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
						 "Added":[require.toUrl("git/images/addition.gif"),messages["Staged add"] ,require.toUrl("git/images/unstage.gif") , messages['Unstage']],	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
						 "Conflicting":[require.toUrl("git/images/conflict-file.gif"),messages["Conflicting"] ,require.toUrl("git/images/stage.gif") , messages["Resolve Conflict"]]	 //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
					  };


orion.GitStatusContentRenderer = (function() {
	function GitStatusContentRenderer(options, serviceRegistry ,tableDivId , model) {
		this._registry = serviceRegistry;
		this._useCheckboxSelection = (options.useCheckBox === undefined) ? false: options.useCheckBox;
		this._tableParentDivId = tableDivId;
		this._controller = model;
	}
	GitStatusContentRenderer.prototype = {
		initTable: function () {
			var tableId = this._tableParentDivId + "_table"; //$NON-NLS-0$
		  	var tableParentDomNode = dojo.byId( this._tableParentDivId);
			dojo.place(document.createTextNode(""), tableParentDomNode, "only"); //$NON-NLS-0$
			var table = dojo.create("table", {id: tableId}); //$NON-NLS-0$
			dojo.addClass(table, "statusTable"); //$NON-NLS-0$
			tableParentDomNode.appendChild(table);
			this._table = table;
		},
		
		getSelected: function() {
			var selected = [];
			dojo.query(".selectionCheckmark" + this._tableParentDivId).forEach(dojo.hitch(this, function(node) { //$NON-NLS-0$
				if (node.checked) {
					var row = node.parentNode.parentNode;
					selected.push({rowId:row.id, modelItem:row._item});
				}
			}));
			return selected;
		},
		
		toggleSelectAll: function(select) {
			var selected = [];
			dojo.query(".selectionCheckmark" + this._tableParentDivId).forEach(dojo.hitch(this, function(node) { //$NON-NLS-0$
				node.checked = select;
				var row = node.parentNode.parentNode;
				dojo.toggleClass(row, "checkedRow", !!select); //$NON-NLS-0$
			}));
			return selected;
		},
		
		getCheckboxColumn: function(tableRow){
			if (this._useCheckboxSelection) {
				var checkColumn = document.createElement('td'); //$NON-NLS-0$
				dojo.addClass(checkColumn, "secondaryColumn"); //$NON-NLS-0$
				var check = dojo.create("input", {type: "checkbox", id: tableRow.id+"selectedState" }); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.addClass(check, "selectionCheckmark"+ this._tableParentDivId); //$NON-NLS-0$
				dojo.addClass(check, "statusCheckBoxRow"); //$NON-NLS-0$
				check.itemId = tableRow.id;
				checkColumn.appendChild(check);
				dojo.connect(check, "onclick", dojo.hitch(this, function(evt) { //$NON-NLS-0$
					dojo.toggleClass(tableRow, "checkedRow", !!evt.target.checked); //$NON-NLS-0$
					this._controller._unstagedTableRenderer.renderAction();
					this._controller._stagedTableRenderer.renderAction();
					this._controller._stagedTableRenderer.updateCheckbox();
					this._controller._unstagedTableRenderer.updateCheckbox();
				}));
				return checkColumn;
			}
			return null;
		},
		
		renderRow: function(itemModel, lineNumber) {
			var self = this;
			var row = document.createElement('tr'); //$NON-NLS-0$
			row.id = itemModel.name + "_" + itemModel.type + "_row"; //$NON-NLS-1$ //$NON-NLS-0$
			row._item = itemModel;
			if (lineNumber % 2) {
				dojo.addClass(row, "darkTreeTableRow"); //$NON-NLS-0$
			} else {
				dojo.addClass(row, "lightTreeTableRow"); //$NON-NLS-0$
			}
			this._table.appendChild(row);

			//render the check box
			if(this._useCheckboxSelection){
				row.appendChild(this.getCheckboxColumn(row));
			}
			//render the type icon (added , modified ,untracked ...)
			var typeColumn = document.createElement('td'); //$NON-NLS-0$
			var typeImg = document.createElement('img'); //$NON-NLS-0$
			typeImg.src = orion.statusTypeMap[itemModel.type][0];
			dojo.style(typeImg, "verticalAlign", "middle"); //$NON-NLS-1$ //$NON-NLS-0$
			typeColumn.appendChild(typeImg);
			row.appendChild(typeColumn);
			
			//render the file name field
			var nameColumn = document.createElement('td'); //$NON-NLS-0$
			//nameColumn.width="100%";
			nameColumn.noWrap= true;
			row.appendChild(nameColumn);
			
			var nameSpan =  document.createElement('span'); //$NON-NLS-0$
			dojo.style(nameSpan, "verticalAlign", "middle"); //$NON-NLS-1$ //$NON-NLS-0$
			nameSpan.id = row.id +  "_nameSpan"; //$NON-NLS-0$
			dojo.place(document.createTextNode(itemModel.name), nameSpan, "only"); //$NON-NLS-0$
			dojo.style(nameSpan, "color", "#0000FF"); //$NON-NLS-1$ //$NON-NLS-0$
			nameSpan.title = "Click to compare"; //$NON-NLS-0$
			nameColumn.appendChild(nameSpan);
			if(nameSpan.id === self._controller._model.selectedFileId ){
				self._controller._model.selectedItem = itemModel;
				dojo.toggleClass(nameSpan, "fileNameSelectedRow", true); //$NON-NLS-0$
			}
			
			dojo.connect(nameSpan, "onmouseover", nameSpan, function() { //$NON-NLS-0$
				nameSpan.style.cursor = self._controller.loading ? 'wait' :"pointer"; //$NON-NLS-1$ //$NON-NLS-0$
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", true); //$NON-NLS-0$
			});
			dojo.connect(nameSpan, "onmouseout", nameSpan, function() { //$NON-NLS-0$
				nameSpan.style.cursor = self._controller.loading ? 'wait' :"default"; //$NON-NLS-1$ //$NON-NLS-0$
				dojo.toggleClass(nameSpan, "fileNameCheckedRow", false); //$NON-NLS-0$
			});
			
			dojo.connect(nameSpan, "onclick", nameSpan, function() { //$NON-NLS-0$
				if(itemModel.name !== self._controller._model.selectedFileId ){
					if(self._controller._model.selectedFileId !== undefined){
						var selected = document.getElementById(self._controller._model.selectedFileId);
						if(selected)
							dojo.toggleClass(selected, "fileNameSelectedRow", false); //$NON-NLS-0$
					}
					dojo.toggleClass(nameSpan, "fileNameSelectedRow", true); //$NON-NLS-0$
					self._controller._model.selectedFileId = nameSpan.id;
					self._controller.loadDiffContent(itemModel);
				}
			});
			
			var actionCol = dojo.create("td", {id: row.id+"actionswrapper"}, row, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(actionCol, "statusAction"); //$NON-NLS-0$
			actionCol.noWrap= true;
			var actionsWrapper = dojo.create("span", {id: row.id+"actionsWrapper"}, actionCol, "only"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._registry.getService("orion.page.command").renderCommands("itemLevelCommands", actionsWrapper, {type: "fileItem", object: itemModel, rowId:row.id}, this, "tool"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._registry.getService("orion.page.command").renderCommands("itemLevelCommands", actionsWrapper, itemModel, this, "tool"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
	function GitStatusTableRenderer(options, serviceRegistry ,parentId , header , type) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
		this._header = header;
		this._useCheckboxSelection = (options.useCheckBox === undefined) ? false: options.useCheckBox;
		this._type = type;
	}
	GitStatusTableRenderer.prototype = {
		render: function (renderSeparator) {
			var headingSection = createPaneHeading(this._parentId, this._type + "heading", this._header, true, this._type + "_header", this._type + "commands"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(headingSection, "paneHeadingFixed"); //$NON-NLS-0$
			var check = dojo.create("input", {type: "checkbox"}, this._type+"_header", "after"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(check, "statusCheckBoxOverall"); //$NON-NLS-0$
			this.checkBox = check;
			dojo.connect(check, "onclick", dojo.hitch(this, function(evt) { //$NON-NLS-0$
				this.contentRenderer.toggleSelectAll(evt.target.checked);
				this.renderAction();
			}));
			var localTools = dojo.byId(this._type+"commands"); //$NON-NLS-0$
			var id = this._type+"commandSpan"; //$NON-NLS-0$
			this._cmdSpan = dojo.create("span", {"id": id}, localTools, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			// TODO this is done here 
			var commandService = this._registry.getService("orion.page.command"); //$NON-NLS-0$
			if (this._type === "stagedItems") { //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitUnstage", 1); //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitUnstageAll", 2); //$NON-NLS-0$
			} else {
				commandService.registerCommandContribution(id, "orion.gitStage", 1); //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitCheckout", 2); //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitStageAll", 3);	 //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitCheckoutAll", 4);	 //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.gitSavePatch", 5); //$NON-NLS-0$
			}
		
			dojo.addClass(this._cmdSpan, "paneHeadingCommands"); //$NON-NLS-0$
			this._messageId =  this._parentId + "_" + this._type + "_message"; //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("section", {id:this._messageId, role: "region", "aria-labelledby": this._type + "_header"}, this._parentId, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._statusContentId = this._parentId + "_" + this._type; //$NON-NLS-0$
			dojo.create("section", {id:this._statusContentId, role: "region", "aria-labelledby": this._type + "_header"}, this._parentId, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		setLoadingMessage: function(message){
			if(message){
				dojo.place(document.createTextNode(message), this._messageId, "only"); //$NON-NLS-0$
			}else{
				dojo.empty(this._messageId);
			}
		},
		
		select: function(selected){
			this.checkBox.checked = selected;
		},
		
		disable: function (disable) {
			this.checkBox.disabled = disable;
		},
		
		updateCheckbox: function(){
			var selectedItems = this.contentRenderer.getSelected();
			if (this.contentRenderer.totalRow === 0) 
				return;
			if(this.contentRenderer.totalRow === selectedItems.length)
				this.select(true);
			else
				this.select(false);
			
		},
		
		getStatusContentId: function(){
			return this._statusContentId;
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpan, "only"); //$NON-NLS-0$
			var self = this;
			this._registry.getService("orion.page.command").renderCommands(self._cmdSpan.id, self._cmdSpan, {type: self._type}, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
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
			this._commitZone = dojo.create("section", {role: "region", "aria-labelledby":"commitHeader"}, this._parentId, "last"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var headingSection = dojo.create("div", {id: "commitHeader"}, this._commitZone); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(headingSection, "auxpaneHeading paneHeadingFixed"); //$NON-NLS-0$
			var title = dojo.create("span", {innerHTML: messages["Commit message"]}, headingSection); //$NON-NLS-0$
			
			var commitTable = dojo.create("table", {role: "presentation"}, this._commitZone); //$NON-NLS-1$ //$NON-NLS-0$
			var commitRow = dojo.create("tr", null, commitTable); //$NON-NLS-0$
			var messageCol = dojo.create("td", {nowrap :true}, commitRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			var text = dojo.create("textarea", {id:"commitMessage", ROWS:6}, messageCol, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(text, "pane"); //$NON-NLS-0$
			var actionCol = dojo.create("td", {nowrap :true}, commitRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			var actionDiv = dojo.create("div", {style:"float: left;", align:"left"}, actionCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var actionTable = dojo.create("table", {role: "presentation"}, actionDiv); //$NON-NLS-1$ //$NON-NLS-0$
			var actionRow1 = dojo.create("tr", null, actionTable); //$NON-NLS-0$
			var actionCol1 = dojo.create("td", {nowrap :true}, actionRow1, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("button", {id:"commit", innerHTML: messages["Commit"], title: messages["Record changes in the active branch"]}, actionCol1, "last"); //$NON-NLS-4$ //$NON-NLS-1$ //$NON-NLS-0$
			
			dojo.create("tr", {width:"100%" ,height:"20px"}, actionTable); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			var actionRow2 = dojo.create("tr", null, actionTable); //$NON-NLS-0$
			var actionCol2 = dojo.create("td", {nowrap :true}, actionRow2, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("input", {id:"amend", type:"checkbox" ,value: "Amend", title: messages["Amend last commit"]}, actionCol2, "last"); //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			actionCol2.appendChild(document.createTextNode(messages[" Amend"]));
		},
		
		show:function(){
			this._commitZone.style.display = "";
		},
		
		hide:function(){
			this._commitZone.style.display = "none"; //$NON-NLS-0$
		}
	};
	return GitCommitZoneRenderer;
}());

orion.GitRebaseZoneRenderer = (function() {
	function GitRebaseZoneRenderer(serviceRegistry, parentId) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
	}
	GitRebaseZoneRenderer.prototype = {
		render: function (renderSeparator) {
			this._rebaseZone = dojo.create("div", null, this._parentId, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			
			var headerTable = dojo.create("table", {width:"100%"}, this._rebaseZone); //$NON-NLS-1$ //$NON-NLS-0$
			var row = dojo.create("tr", null, headerTable); //$NON-NLS-0$
			var titleCol = dojo.create("td", {nowrap :true}, row, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("h2", {innerHTML: messages["Rebase in progress. Choose action:"] }, titleCol, "last"); //$NON-NLS-2$ //$NON-NLS-0$
			
			var commitTable = dojo.create("table", null, this._rebaseZone); //$NON-NLS-0$
			var commitRow = dojo.create("tr", null, commitTable); //$NON-NLS-0$
			
			var actionCol = dojo.create("td", {nowrap :true}, commitRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			var actionDiv = dojo.create("div", {style:"float: left;", align:"left"}, actionCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			this._cmdSpan = dojo.create("span", {id:"rebaseActions"}, actionDiv, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			if(	renderSeparator)
				dojo.create("table", {width:"100%", height:"10px"}, this._rebaseZone); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpan, "only"); //$NON-NLS-0$
			var self = this;
			this._registry.getService("orion.page.command").renderCommands(self._cmdSpan.id, self._cmdSpan, {type: "rebase"}, this, "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		show:function(){
			this._rebaseZone.style.display = "";
		},
		
		hide:function(){
			this._rebaseZone.style.display = "none"; //$NON-NLS-0$
		}
	};
	return GitRebaseZoneRenderer;
}());

orion.GitCommitterAndAuthorZoneRenderer = (function() {
	function GitCommitterAndAuthorZoneRenderer(serviceRegistry, parentId) {
		this._registry = serviceRegistry;
		this._parentId = parentId;
	}
	GitCommitterAndAuthorZoneRenderer.prototype = {
		render: function (renderSeparator) {
			this._cmdSpanShow = dojo.create("span", {id:"personIdentShow"}, this._parentId, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._cmdSpanHide = dojo.create("span", {id:"personIdentHide"}, this._parentId, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this._personIdentZone = dojo.create("div", null, this._parentId, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			
			var committerTable = dojo.create("table", null, this._personIdentZone); //$NON-NLS-0$
			var committerRow = dojo.create("tr", null, committerTable); //$NON-NLS-0$
			var nameLabelCol = dojo.create("td", {nowrap :true}, committerRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("h2", {innerHTML: messages["Committer name:"]}, nameLabelCol, "last"); //$NON-NLS-2$ //$NON-NLS-0$
			var nameCol = dojo.create("td", {nowrap :true}, committerRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			this._committerName = dojo.create("input", {id:"committerName", type:"text"}, nameCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var emailLabelCol = dojo.create("td", {nowrap :true}, committerRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("h2", {innerHTML: messages["email:"]}, emailLabelCol, "last"); //$NON-NLS-2$ //$NON-NLS-0$
			var emailCol = dojo.create("td", {nowrap :true}, committerRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			this._committerEmail = dojo.create("input", {id:"committerEmail", type:"text"}, emailCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var authorRow = dojo.create("tr", null, committerTable); //$NON-NLS-0$
			var nameLabelCol = dojo.create("td", {nowrap :true}, authorRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("h2", {innerHTML: messages["Author name: "] }, nameLabelCol, "last"); //$NON-NLS-2$ //$NON-NLS-0$
			var nameCol = dojo.create("td", {nowrap :true}, authorRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			this._authorName = dojo.create("input", {id:"authorName", type:"text"}, nameCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var emailLabelCol = dojo.create("td", {nowrap :true}, authorRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create("h2", {innerHTML: messages['email:']}, emailLabelCol, "last"); //$NON-NLS-2$ //$NON-NLS-0$
			var emailCol = dojo.create("td", {nowrap :true}, authorRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			this._authorEmail = dojo.create("input", {id:"authorEmail", type:"text"}, emailCol, "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if(	renderSeparator)
				dojo.create("table", {width:"100%", height:"10px"},this._parentId); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpanShow, "only"); //$NON-NLS-0$
			dojo.place(document.createTextNode(""), this._cmdSpanHide, "only"); //$NON-NLS-0$
			var self = this;
			var service = this._registry.getService("orion.page.command"); //$NON-NLS-0$
			service.renderCommands(self._cmdSpanShow.id, self._cmdSpanShow, {type: "personIdentShow"}, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
			service.renderCommands(self._cmdSpanHide.id, self._cmdSpanHide, {type: "personIdentHide"}, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		setDefaultPersonIdent:function(name, email) {
			this._defName = name;
			this._defEmail = email;
		},
		
		show:function() {
			this._personIdentZone.style.display = "";
			this._cmdSpanHide.style.display = "";
			this._cmdSpanShow.style.display = "none"; //$NON-NLS-0$
		},
		
		hide:function() {
			this._personIdentZone.style.display = "none"; //$NON-NLS-0$
			this._cmdSpanHide.style.display = "none"; //$NON-NLS-0$
			this._cmdSpanShow.style.display = "";
			this.resetCommitterAndAuthor();
		},
		
		resetCommitterAndAuthor:function() {
			this._committerName.value = this._defName; 
			this._committerEmail.value = this._defEmail;
			this._authorName.value = this._defName; 
			this._authorEmail.value = this._defEmail;		
		}
	};
	return GitCommitterAndAuthorZoneRenderer;
}());

orion.GitLogTableRenderer = (function() {
	function GitLogTableRenderer(controller ,serviceRegistry ,parentId , header , type ) {
		this._controller = controller;
		this._registry = serviceRegistry;
		this._parentId = parentId;
		this._header = header;
		this._type = type;
		//The section Id represents a div that wraps the header , separator , and log contetn div
		this._sectionId = this._parentId + "_" + this._type + "_section"; //$NON-NLS-1$ //$NON-NLS-0$
	}
	GitLogTableRenderer.prototype = {
		render: function (renderSeparator) {
			var section = dojo.create("section", {id: this._sectionId, role: "region", "aria-labelledby": this._type + "_header"}, this._parentId); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var headingSection = createPaneHeading(section, this._type + "heading", this._header, true, this._type + "_header", this._type + "commands"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(headingSection, "paneHeadingFixed"); //$NON-NLS-0$
			var idAdditional = this._type+"commandSpanAdditional"; //$NON-NLS-0$
			this._cmdSpanAdditional = dojo.create("span", {"id": idAdditional}, this._type + "commands", "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(this._cmdSpanAdditional, "statusLogCmd paneHeadingCommands"); //$NON-NLS-0$
			var id = this._type+"commandSpan"; //$NON-NLS-0$
			this._cmdSpan = dojo.create("span", {"id": id}, this._type + "commands", "last"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var commandService = this._registry.getService("orion.page.command"); //$NON-NLS-0$
			if (this._type === "gitRemote") { //$NON-NLS-0$
				commandService.registerCommandContribution(id, "orion.openGitRemote", 1);	 //$NON-NLS-0$
				commandService.registerCommandContribution(idAdditional, "eclipse.orion.git.fetch", 2);	 //$NON-NLS-0$
				commandService.registerCommandContribution(idAdditional, "eclipse.orion.git.merge", 3);	 //$NON-NLS-0$
			} else {
				commandService.registerCommandContribution(id, "orion.openGitLog", 1);	 //$NON-NLS-0$
				commandService.registerCommandContribution(idAdditional, "eclipse.orion.git.push", 2);	 //$NON-NLS-0$
			}
			dojo.addClass(this._cmdSpan, "statusLogCmd paneHeadingCommands"); //$NON-NLS-0$
			this._logContentId = this._parentId + "_" + this._type + "_content"; //$NON-NLS-1$ //$NON-NLS-0$
			var contentDiv = dojo.create("div", {id:this._logContentId , tabindex: "0"}, section, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(contentDiv, "statusLogContent"); //$NON-NLS-0$
		},
		
		getLogContentId: function(){
			return this._logContentId;
		},
			
		getLogSectionId: function(){
			return this._sectionId;
		},
			
		modifyHeader: function(location){
			//We should make sure that the header DIV still exist because sometimes the whole remote mini log is emptied.
			if(dojo.byId(this._type + "_header")){ //$NON-NLS-0$
				dojo.place(document.createTextNode(dojo.string.substitute(messages["Recent commits on ${0}"], [location])), this._type + "_header", "only"); //$NON-NLS-2$ //$NON-NLS-1$
			}
		},
		
		renderAction:function(){
			dojo.place(document.createTextNode(""), this._cmdSpan, "only"); //$NON-NLS-0$
			var self = this;
			this._registry.getService("orion.page.command").renderCommands(self._cmdSpan.id, self._cmdSpan, {type: self._type , model: self._controller._model, branch: self._controller._curBranch}, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		renderAdditionalAction:function(item){
			dojo.place(document.createTextNode(""), this._cmdSpanAdditional, "only"); //$NON-NLS-0$
			var self = this;
			this._registry.getService("orion.page.command").renderCommands(self._cmdSpanAdditional.id, self._cmdSpanAdditional, item, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
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
		render: function (createCommandSpan) {
			var titleTable = dojo.create("table" , {width:"100%"}); //$NON-NLS-1$ //$NON-NLS-0$
			var row = dojo.create("tr", null, titleTable); //$NON-NLS-0$
			var titleCol = dojo.create("td", {nowrap :true}, row, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			var title = dojo.create("h2", {id :"fileNameInViewer" ,innerHTML: messages["Select a file on the left to compare..."]}, titleCol, "last"); //$NON-NLS-3$ //$NON-NLS-1$ //$NON-NLS-0$
			var titleDiv = new dijit.layout.ContentPane({region: "top"}); //$NON-NLS-0$
			dojo.addClass(titleDiv.domNode, "inlineCompareTitle"); //$NON-NLS-0$
			titleDiv.attr('content', titleTable); //$NON-NLS-0$
			
			var viewerDiv = new dijit.layout.ContentPane({"class":"mainpane" ,id : "inline-compare-viewer" ,splitter:false ,region: "center"}); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.addClass(viewerDiv.domNode, 'mainpane'); //$NON-NLS-0$
			dojo.addClass(viewerDiv.domNode, 'inlineCompareContent'); //$NON-NLS-0$
			
			var parent = dijit.byId(this._parentId);
			parent.addChild(titleDiv);
			parent.addChild(viewerDiv);
			if (createCommandSpan) {
				var td = document.createElement('td'); //$NON-NLS-0$
				td.id = "inlineCompareCommands"; // this id should not be known here.  It is decided in compare-container.js //$NON-NLS-0$
				row.appendChild(td);
				td.noWrap = true;
				row.align = "right"; //$NON-NLS-0$
				titleTable.align = "right"; //$NON-NLS-0$
			}
		}
		
	};
	return InlineCompareRenderer;
}());

orion.GitStatusController = (function() {
	function GitStatusController(options ,serviceRegistry , commandService , statusService, unstagedDivId , stagedDivId) {
		this._registry = serviceRegistry;
		this._commandService = commandService;
		this._statusService = statusService;
		this._model = new orion.GitStatusModel();
		this._timerOn = false;
		this._renderLog = options.renderLog ? true:false;
		this._generateCommands();
		this._unstagedTableRenderer = new orion.GitStatusTableRenderer({useCheckBox:true}, serviceRegistry ,"statusZone" , messages["Unstaged"] , "unstagedItems"); //$NON-NLS-2$ //$NON-NLS-0$
		this._unstagedTableRenderer.render(true);
		this._stagedTableRenderer = new orion.GitStatusTableRenderer({useCheckBox:true}, serviceRegistry ,"statusZone" , messages["Staged"] , "stagedItems"); //$NON-NLS-2$ //$NON-NLS-0$
		this._stagedTableRenderer.render(true);
		this._commitZoneRenderer = new orion.GitCommitZoneRenderer(serviceRegistry ,"statusZone"); //$NON-NLS-0$
		this._commitZoneRenderer.render(true);
		this._rebaseZoneRenderer = new orion.GitRebaseZoneRenderer(serviceRegistry, "statusZone"); //$NON-NLS-0$
		this._rebaseZoneRenderer.render(true);
		this._committerAndAuthorZoneRenderer = new orion.GitCommitterAndAuthorZoneRenderer(serviceRegistry, "statusZone"); //$NON-NLS-0$
		this._committerAndAuthorZoneRenderer.render(true);
		if(this._renderLog){
			this._logTableRenderer = new orion.GitLogTableRenderer(this ,serviceRegistry ,"logZone" , messages["Recent commits on"] , "gitLog"); //$NON-NLS-2$ //$NON-NLS-0$
			this._logTableRenderer.render(true);
			this._logTableRenderer.renderAction();
			
			this._remoteTableRenderer = new orion.GitLogTableRenderer(this,serviceRegistry ,"logZone" , messages['Recent commits on'] , "gitRemote"); //$NON-NLS-2$ //$NON-NLS-0$
			this._remoteTableRenderer.render(true);
			this._remoteTableRenderer.renderAction();
		}
		
		(new orion.InlineCompareRenderer(serviceRegistry ,"viewerZone")).render(true); //$NON-NLS-0$
		
		this._unstagedContentRenderer = new orion.GitStatusContentRenderer({useCheckBox:true}, serviceRegistry ,this._unstagedTableRenderer.getStatusContentId(), this);
		this._unstagedTableRenderer.contentRenderer = this._unstagedContentRenderer;
		this._stagedContentRenderer = new orion.GitStatusContentRenderer({useCheckBox:true}, serviceRegistry ,this._stagedTableRenderer.getStatusContentId() , this);
		this._stagedTableRenderer.contentRenderer = this._stagedContentRenderer;
		
		var diffProvider = new mCompareContainer.DefaultDiffProvider(serviceRegistry);
		var that = this;
		var options = {
				commandSpanId: "inlineCompareCommands", //$NON-NLS-0$
				diffProvider: diffProvider
			};
			
		
		this._inlineCompareContainer = new mCompareContainer.InlineCompareContainer(serviceRegistry, "inline-compare-viewer", options); //$NON-NLS-0$
		that._staging = false;
		that._stagingConflict = false;
		this.startTimer();		
		var commitBtn = document.getElementById("commit"); //$NON-NLS-0$
		commitBtn.onclick = function(evt){
			that.commit();
		};
	}
	GitStatusController.prototype = {
		setLoadingStatusMessage: function(message){
			dojo.hitch(this._unstagedTableRenderer, this._unstagedTableRenderer.setLoadingMessage(message));
			dojo.hitch(this._stagedTableRenderer, this._stagedTableRenderer.setLoadingMessage(message));
		},
		loadStatus: function(jsonData){
			this._staging = false;
			this._model.init(jsonData);
			this._getCloneInfo();
		},
		
		_processStatus: function(){
			this.initViewer();
			this._model.selectedFileId = null;
			this.setLoadingStatusMessage();
			this._loadBlock(this._unstagedContentRenderer , this._model.interestedUnstagedGroup);
			this._loadBlock(this._stagedContentRenderer , this._model.interestedStagedGroup);
			this._stagedTableRenderer.disable(!this.hasStaged);
			this._unstagedTableRenderer.disable(!this.hasUnstaged);
			if(this._renderLog && this._initializing){
				var that = this;
				
				var commandService = this._registry.getService("orion.page.command"); //$NON-NLS-0$
				mGitCommands.createStatusCommands(that._registry , commandService , function(){that.getGitStatus(that._url ,true);} , 9 , that);
				
				this._renderLogs(false);
				this._renderLogs(true);
			}
			
			this._committerAndAuthorZoneRenderer.renderAction();
			this._unstagedTableRenderer.renderAction();
			this._stagedTableRenderer.renderAction();
		
			this._renderGlobalActions();
			if(this._stagingConflict){
				this._stagingConflict = false;
				if(!this.hasStaged){
					this.commit(dojo.string.substitute("Resolved deletion conflicts on file ", [this._stagingName]), false); //$NON-NLS-0$
				}
			}
			
			this._statusService.setProgressMessage("");
			
			// check if repository state contains REBASING
			// (status could be: REBASING, REBASING_REBASING, REBASING_INTERACTIVE, REBASING_MERGE)
			if (this._model.items.RepositoryState.indexOf("REBASING") != -1) { //$NON-NLS-0$
				this.rebaseState = true;
				// show rebase panel
				this._rebaseZoneRenderer.renderAction();
				this._rebaseZoneRenderer.show();
				this._commitZoneRenderer.hide();
			} 
			else {
				this.rebaseState = false;
				// show commit panel
				this._commitZoneRenderer.show();
				this._rebaseZoneRenderer.hide();
			}
		},
		
		_commitReady: function(){
			var amendBtn = document.getElementById("amend"); //$NON-NLS-0$
			if(this.hasStaged){
				return true;
			} else {
				if(amendBtn.checked)
					return true;
				else
					return false;
			}
		},
		
		_prepareStage: function(item, group){
			this._staging = true;
			if(group){
				for(var i = 0 ; i < item.length ;  i++){
					dojo.style(item[i].rowId + "_nameSpan", "color", "#666666"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
			} else {
				dojo.style(item + "_nameSpan", "color", "#666666"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
		_renderGlobalActions:function(){
			var toolbar = dojo.byId( "pageActions"); //$NON-NLS-0$
			dojo.place(document.createTextNode(""), toolbar, "only"); //$NON-NLS-0$
			var self = this;
			this._registry.getService("orion.page.command").renderCommands(toolbar.id, toolbar, {type: "global"}, this, "button", true); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
		
		_processCloneInfo:function(){
			dojo.byId("logZone").style.display = "block"; //$NON-NLS-1$ //$NON-NLS-0$
			this._curBranch = undefined;
			for(var i=0; i<this._branchInfo.Children.length; i++){
				if(this._branchInfo.Children[i].Current)
					this._curBranch = this._branchInfo.Children[i];
			}
			this._curRemote =  ( this._remoteInfo &&  this._remoteInfo.Children && this._remoteInfo.Children.length > 0 ) ? this._remoteInfo.Children[0]:null;
			this._curClone = this._cloneInfo.Children[0];
			mGlobalCommands.setPageTarget(this._curClone, this._registry, this._commandService, dojo.hitch(this._curBranch || this._curRemote,
				function() {
					return this;
				}));
			this._initTitleBar(true);
			this._logTableRenderer.renderAction();
			this._remoteTableRenderer.renderAction();
			
			this._committerAndAuthorZoneRenderer.setDefaultPersonIdent(this._userName, this._userEmail);
			this._committerAndAuthorZoneRenderer.hide();
		},
		
		_initTitleBar:function(withBranchName){
			var title = messages["Git Status"];
			var branchName = this._curBranch ? this._curBranch.Name : "detached"; //$NON-NLS-0$

			//render browser title
			document.title = dojo.string.substitute(messages["Status for ${0} - Git"],  [this._curClone.Name]);
			//render page title
			//FIXME we should not know these global page ids inside component implementations
//			dojo.place(document.createTextNode(title), "pageTitle", "only"); //$NON-NLS-1$ //$NON-NLS-0$
			var that = this;
			var item = {};
			var location_ = dojo.byId("location"); //$NON-NLS-0$
			
			item.Name = branchName;
			item.Parents = [];
			item.Name = dojo.string.substitute(messages["Status (${0})"], [branchName]);
			item.Parents[0] = {};
			item.Parents[0].Name = this._curClone.Name;
			item.Parents[0].Location = this._curClone.Location;
			item.Parents[0].ChildrenLocation = this._curClone.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories"; //$NON-NLS-0$

			if(withBranchName) {
				//render git status title on local branch 
				this._logTableRenderer.modifyHeader(branchName);
				if(this._curBranch && this._curRemote){
					branchName = (this._curBranch.RemoteLocation.length > 0 ? this._curBranch.RemoteLocation[0].Name : "") + "/" + this._curBranch.Name; //$NON-NLS-0$
					//render git log title on remote branch
					this._remoteTableRenderer.modifyHeader(branchName);
				}
			}
			
			new mBreadcrumbs.BreadCrumbs({
				container: location_,
				resource: item,
				makeHref:function(seg, location_){
					seg.href = "/git/git-repository.html#" + (location_ ? location_ : ""); //$NON-NLS-0$
				}
			});
			mUtil.forceLayout("pageTitle"); //$NON-NLS-0$

		},
		
		_getCloneInfo:function(){
			var that = this;
			if (that._initializing) {
				var path = that._model.items.CloneLocation;
				var gitService = that._registry.getService("orion.git.provider"); //$NON-NLS-0$
				gitService.getGitClone(path).then(function(cloneJsonData, secondArd) {
					that._cloneInfo = cloneJsonData;
					if(that._cloneInfo.Children.length === 0){
						that._renderLog = false;
						that._initTitleBar();
						that._processStatus();
						return;
					}
					gitService.getGitBranch(that._cloneInfo.Children[0].BranchLocation).then(function(children){
						that._branchInfo = children;
						gitService.getGitRemote(that._cloneInfo.Children[0].RemoteLocation).then(function(children){
							that._remoteInfo = children;
							var userNamePath = that._cloneInfo.Children[0].ConfigLocation.replace("config", "config/user.name"); //$NON-NLS-1$ //$NON-NLS-0$
							var setUserEmailAndProcess = function(userEmail) {
								that._userEmail = userEmail;
								that._processCloneInfo();
								that._processStatus();
							};
							gitService.getGitCloneConfig(userNamePath).then(
								function(configEntry){
									that._userName = configEntry.Value;
									var userEmailPath = that._cloneInfo.Children[0].ConfigLocation.replace("config", "config/user.email"); //$NON-NLS-1$ //$NON-NLS-0$
									gitService.getGitCloneConfig(userEmailPath).then(
										function(configEntry){
											setUserEmailAndProcess(configEntry.Value);
										},
										function(error) {
											setUserEmailAndProcess("");
										});
								},
								function(error) {
									that._userName = "";
									var userEmailPath = that._cloneInfo.Children[0].ConfigLocation.replace("config", "config/user.email"); //$NON-NLS-1$ //$NON-NLS-0$
									gitService.getGitCloneConfig(userEmailPath).then(
										function(configEntry){
											setUserEmailAndProcess(configEntry.Value);
										},
										function(error) {
											setUserEmailAndProcess("");
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
				if(!this._curRemote || !this._curBranch || this._curBranch.RemoteLocation.length!==1 || this._curBranch.RemoteLocation[0].Children.length!==1){
					//We want to empty the mini log section for the tracked remote branch if there is no such 
					dojo.empty(this._remoteTableRenderer.getLogSectionId());
					return;
				}
		        this._gitCommitNavigatorRem = new mGitCommitNavigator.GitCommitNavigator(this._registry, null, {checkbox: false, actionScopeId: "itemLevelCommands", minimal: true}, this._remoteTableRenderer.getLogContentId());     //$NON-NLS-0$
				if(dojo.byId(this._remoteTableRenderer.getLogContentId())){
					//If the remote section is rendered before, we need to empty the contents
					dojo.place(document.createTextNode(""), this._remoteTableRenderer.getLogContentId(), "only"); //$NON-NLS-0$
				} else {
					//If the remote section is not rendered before, we need to create the empty frame there
					this._remoteTableRenderer.render(true);
				}
				dojo.place(document.createTextNode("Loading recent commits..."), this._remoteTableRenderer.getLogContentId(), "only"); //$NON-NLS-1$ //$NON-NLS-0$
				// refresh the commit list for the remote
				var path = this._curBranch.RemoteLocation[0].Children[0].Location + "?page=1&pageSize=5"; //$NON-NLS-0$
				var gitService = that._registry.getService("orion.git.provider"); //$NON-NLS-0$
				gitService.doGitLog(path).then(
					function(jsonData, secondArg) {
							var gitService = that._registry.getService("orion.git.provider"); //$NON-NLS-0$
							dojo.place(document.createTextNode(messages["Getting git incoming changes..."]), that._remoteTableRenderer.getLogContentId(), "only"); //$NON-NLS-1$
							gitService.getLog(jsonData.HeadLocation, jsonData.Id).then(function(scopedCommitsJsonData, secondArg) {
										that._gitCommitNavigatorRem.renderer.setIncomingCommits(scopedCommitsJsonData.Children);
										that._gitCommitNavigatorRem.loadCommitsList(jsonData.CommitLocation + "?page=1&pageSize=5", jsonData); //$NON-NLS-0$
										that._remoteTableRenderer.renderAdditionalAction(that._gitCommitNavigatorRem._lastTreeRoot);
							});
					},
					function(error, ioArgs) {
							that._gitCommitNavigatorRem.loadCommitsList(path, error);	
							console.error("HTTP status code: ", ioArgs.xhr.status); //$NON-NLS-0$
					}
				);
			} else {
		        this._gitCommitNavigatorLog = new mGitCommitNavigator.GitCommitNavigator(this._registry, null, {checkbox: false, minimal: true},this._logTableRenderer.getLogContentId());
		        dojo.place(document.createTextNode(messages["Loading recent commits..."]), this._logTableRenderer.getLogContentId(), "only"); //$NON-NLS-1$
				var path = (that._curBranch ? that._curBranch.CommitLocation :  that._model.items.CommitLocation) + "?page=1&pageSize=5"; //$NON-NLS-0$
				var gitService = that._registry.getService("orion.git.provider"); //$NON-NLS-0$
				gitService.doGitLog(path).then(function(commitLogJsonData, ioArgs) {
						function renderCommitLogJsonData(commitLogJsonData){
							if (commitLogJsonData.toRef == null || commitLogJsonData.toRef.RemoteLocation.length!==1 || commitLogJsonData.toRef.RemoteLocation[0].Children.length!==1 || !that._curBranch){
								that._gitCommitNavigatorLog.loadCommitsList((that._curBranch ? that._curBranch.CommitLocation :  that._model.items.CommitLocation) +"?page=1&pageSize=5", {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.toRef.RemoteLocation, Children: commitLogJsonData.Children}); //$NON-NLS-1$ //$NON-NLS-0$
								if(that._curRemote && that._curBranch)
									that._logTableRenderer.renderAdditionalAction(that._gitCommitNavigatorLog._lastTreeRoot);
							}
							else {
								gitService.getGitRemote(commitLogJsonData.toRef.RemoteLocation[0].Children[0].Location).then(function(remoteJsonData, secondArg) {
										gitService.getLog(remoteJsonData.CommitLocation, "HEAD").then(function(scopedCommitsJsonData) { //$NON-NLS-0$
												that._gitCommitNavigatorLog.renderer.setOutgoingCommits(scopedCommitsJsonData.Children);
												that._gitCommitNavigatorLog.loadCommitsList( that._curBranch.CommitLocation +"?page=1&pageSize=5" , {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.toRef.RemoteLocation, Children: commitLogJsonData.Children}); //$NON-NLS-1$ //$NON-NLS-0$
												if(that._curRemote)
													that._logTableRenderer.renderAdditionalAction(that._gitCommitNavigatorLog._lastTreeRoot);
											
										});
									},
									function(error, ioArgs) {
											that._gitCommitNavigatorLog.loadCommitsList(path, {Type:"LocalBranch" ,RemoteLocation: commitLogJsonData.toRef.RemoteLocation, Children: commitLogJsonData.Children}); //$NON-NLS-0$
											if(that._curRemote && that._curBranch)
												that._logTableRenderer.renderAdditionalAction(that._gitCommitNavigatorLog._lastTreeRoot);
										console.error("HTTP status code: ", ioArgs.xhr.status); //$NON-NLS-0$
									});
							}
						}
						renderCommitLogJsonData(commitLogJsonData);
					},
					function(error, ioArgs) {
						console.error("HTTP status code: ", ioArgs.xhr.status); //$NON-NLS-0$
					});
			}
		},
		
		
		_generateCommands: function(){
			var self = this;
			var sbsCompareCommand = new mCommands.Command({
				name: messages['Compare'],
				tooltip: messages["Show the side-by-side compare"],
				imageClass: "git-sprite-open_compare", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.sbsCompare", //$NON-NLS-0$
				hrefCallback: function(data) {
					return self.openCompareEditor(data.items.object);
				},
				visibleWhen: function(item) {
					return item.type === "fileItem"; //$NON-NLS-0$
				}
			});		

			var showCommitterAndAuthorPanel = new mCommands.Command({
				name : messages["Change Committer or Author"],
				id : "orion.showCommitterAndAuthor", //$NON-NLS-0$
				callback : function() {
					self._committerAndAuthorZoneRenderer.show();
				},
				visibleWhen : function(item) {
					return item.type === "personIdentShow"; //$NON-NLS-0$
				}
			});
			
			var hideCommitterAndAuthorPanel = new mCommands.Command({
				name : messages["Use Default Committer and Author"],
				id : "orion.hideCommitterAndAuthor", //$NON-NLS-0$
				callback : function() {
					self._committerAndAuthorZoneRenderer.hide();
				},
				visibleWhen : function(item) {
					return item.type === "personIdentHide"; //$NON-NLS-0$
				}
			});
			
			var checkoutCommand = new mCommands.Command({
				name: messages["Checkout"],
				tooltip: messages["Checkout the file, discarding the unstaged change"],
				imageClass: "git-sprite-checkout", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitCheckout", //$NON-NLS-0$
				callback: function(data) {
					self._registry.getService("orion.page.dialog").confirm(messages["Your changes to the file will be lost. Are you sure you want to checkout?"], function(doit) { //$NON-NLS-0$
						if (!doit) {
							return;
						}
						self._statusService.setProgressMessage(messages["Checking out..."]);
						self.checkout([data.items.object.name]);
					});
				},
				visibleWhen: function(item) {
					return (item.type === "fileItem" && !self._model.isStaged(item.object.type)); //$NON-NLS-0$
				}
			});		

			var stageCommand = new mCommands.Command({
				name: messages['Stage'],
				tooltip: messages["Stage the change"],
				imageClass: "git-sprite-stage", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitStage", //$NON-NLS-0$
				callback: function(data) {
					self._statusService.setProgressMessage("Staging..."); //$NON-NLS-0$
					self._prepareStage(data.items.rowId, false);
					return self.stage(data.items.object.indexURI , data.items.object);
				},
				visibleWhen: function(item) {
					return (item.type === "fileItem" && !self._model.isStaged(item.object.type)); //$NON-NLS-0$
				}
			});		

			var stageAllCommand = new mCommands.Command({
				name: messages['Stage'],
				tooltip: messages["Stage the selected changes"],
				imageClass: "git-sprite-stage_all", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitStageAll", //$NON-NLS-0$
				callback: function(data) {
					self._statusService.setProgressMessage(messages["Staging..."]);
					return self.stageSelected();
				},
				visibleWhen: function(item) {
					var return_value = (item.type === "unstagedItems" && self.hasUnstaged && self._unstagedContentRenderer.getSelected().length > 0); //$NON-NLS-0$
					return return_value;
				}
			});		
			
			var checkoutAllCommand = new mCommands.Command({
				name: messages['Checkout'],
				tooltip: messages["Checkout all the selected files, discarding all changes"],
				imageClass: "git-sprite-checkout", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitCheckoutAll", //$NON-NLS-0$
				callback: function(data) {
					self._registry.getService("orion.page.dialog").confirm(messages["Your changes to all the selected files will be lost. Are you sure you want to checkout?"], function(doit) { //$NON-NLS-0$
						if (!doit) {
							return;
						}
						self._statusService.setProgressMessage(messages['Checking out...']);
						self.checkoutSelected();
					});
				},
				visibleWhen: function(item) {
					var return_value = (item.type === "unstagedItems" && self.hasUnstaged && self._unstagedContentRenderer.getSelected().length > 0); //$NON-NLS-0$
					return return_value;
				}
			});		
			
			var savePatchCommand = new mCommands.Command({
				name: messages["Save Patch"],
				tooltip: messages["Save workspace changes as a patch"],
				imageClass: "git-sprite-diff", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitSavePatch", //$NON-NLS-0$
				hrefCallback : function() {
					var url = self._curClone.DiffLocation + "?parts=diff"; //$NON-NLS-0$
					var selectedItems = self._unstagedContentRenderer.getSelected();
					for (var i = 0; i < selectedItems.length; i++) {
						url += "&Path="; //$NON-NLS-0$
						url += selectedItems[i].modelItem.path;
					}
					return url;
				},
				visibleWhen: function(item) {
					var return_value = (item.type === "unstagedItems" && self.hasUnstaged && self._unstagedContentRenderer.getSelected().length > 0); //$NON-NLS-0$
					return return_value;
				}
			});

			var unstageCommand = new mCommands.Command({
				name: messages['Unstage'],
				tooltip: messages["Unstage the change"],
				imageClass: "git-sprite-unstage", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitUnstage", //$NON-NLS-0$
				callback: function(data) {
					self._statusService.setProgressMessage(messages["Unstaging..."]);
					return self.unstage(data.items.object);
				},
				visibleWhen: function(item) {
					return item.type === "fileItem" && self._model.isStaged(item.object.type); //$NON-NLS-0$
				}
			});		

			var unstageAllCommand = new mCommands.Command({
				name: messages['Unstage'],
				tooltip: "Unstage the selected changes", //$NON-NLS-0$
				imageClass: "git-sprite-unstage_all", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitUnstageAll", //$NON-NLS-0$
				callback: function(data) {
					self._statusService.setProgressMessage(messages['Unstaging...']);
					return self.unstageSelected("MIXED"); //$NON-NLS-0$
				},
				visibleWhen: function(item) {
					var return_value = (item.type === "stagedItems" && self.hasStaged && self._stagedContentRenderer.getSelected().length > 0); //$NON-NLS-0$
					return return_value;
				}
			});		

			var resetChangesCommand = new mCommands.Command({
				name: messages["Reset"],
				tooltip: messages["Reset the branch, discarding all staged and unstaged changes"],
				imageClass: "git-sprite-refresh", //$NON-NLS-0$
				spriteClass: "gitCommandSprite", //$NON-NLS-0$
				id: "orion.gitResetChanges", //$NON-NLS-0$
				callback: function(data) {
					var dialog = self._registry.getService("orion.page.dialog"); //$NON-NLS-0$
					dialog.confirm(messages["All unstaged and staged changes in the working directory and index will be discarded and cannot be recovered."]+"\n" + //$NON-NLS-1$
						messages["Are you sure you want to continue?"],
						function(doit) {
							if (!doit) {
								return;
							}
							self._statusService.setProgressMessage(messages["Resetting local changes..."]);
							return self.unstageAll("HARD"); //$NON-NLS-0$
						}
					);
				},
				
				visibleWhen: function(item) {
					return (self.hasStaged || self.hasUnstaged);
				}
			});
			
			var rebaseContinueCommand = new mCommands.Command({
				name: "Continue", //$NON-NLS-0$
				tooltip: "Continue rebase", //$NON-NLS-0$
				id: "orion.gitRebaseContinue", //$NON-NLS-0$
				callback: function() {
						self._statusService.setProgressMessage(messages["Continue rebase..."]);
						return self.rebase("CONTINUE"); //$NON-NLS-0$
				},
				visibleWhen: function(data) {
					return self.rebaseState;
				}
			});	
			
			var rebaseSkipCommand = new mCommands.Command({
				name: "Skip Patch", //$NON-NLS-0$
				tooltip: "Skip patch", //$NON-NLS-0$
				id: "orion.gitRebaseSkip", //$NON-NLS-0$
				callback: function() {
						self._statusService.setProgressMessage(messages["Skipping patch..."]);
						return self.rebase("SKIP"); //$NON-NLS-0$
				},
				visibleWhen: function(data) {
					return self.rebaseState;
				}
			});	
			
			var rebaseAbortCommand = new mCommands.Command({
				name: "Abort", //$NON-NLS-0$
				tooltip: "Abort rebase", //$NON-NLS-0$
				id: "orion.gitRebaseAbort", //$NON-NLS-0$
				callback: function() {
						self._statusService.setProgressMessage(messages["Aborting rebase..."]);
						return self.rebase("ABORT"); //$NON-NLS-0$
				},
				visibleWhen: function(data) {
					return self.rebaseState;
				}
			});		
			
			var openGitLog = new mCommands.Command({
				name : messages["Complete log"],
				id : "orion.openGitLog", //$NON-NLS-0$
				hrefCallback : function(data) {
					return require.toUrl("git/git-log.html") +"#" + (data.items.branch ? data.items.branch.CommitLocation : data.items.model.items.CommitLocation) + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				},
				visibleWhen : function(item) {
					return item.type === "gitLog" && ((item.branch && item.branch.CommitLocation) || (item.model && item.model.items && item.model.items.CommitLocation)); //$NON-NLS-0$
				}
			});
		
			var openGitRemote = new mCommands.Command({
				name : messages['Complete log'],
				id : "orion.openGitRemote", //$NON-NLS-0$
				hrefCallback : function(data) {
					return require.toUrl("git/git-log.html") +"#" + data.items.branch.RemoteLocation[0].Children[0].CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				},
				visibleWhen : function(item) {
					return (item.type === "gitRemote" && item.branch && item.branch.RemoteLocation.length===1 && item.branch.RemoteLocation[0].Children.length===1); //$NON-NLS-0$
				}
			});
			
			var commandService = this._registry.getService("orion.page.command"); //$NON-NLS-0$
			// register commands with object scope
			commandService.addCommand(sbsCompareCommand);
			commandService.addCommand(stageCommand);	
			commandService.addCommand(checkoutCommand);
			commandService.addCommand(stageAllCommand);
			commandService.addCommand(checkoutAllCommand);
			commandService.addCommand(savePatchCommand);
			commandService.addCommand(unstageAllCommand);
			commandService.addCommand(unstageCommand);
			commandService.addCommand(resetChangesCommand);
			commandService.addCommand(rebaseContinueCommand);
			commandService.addCommand(rebaseSkipCommand);
			commandService.addCommand(rebaseAbortCommand);
			commandService.addCommand(resetChangesCommand);
			commandService.addCommand(showCommitterAndAuthorPanel);
			commandService.addCommand(hideCommitterAndAuthorPanel);
			commandService.addCommand(openGitLog);	
			commandService.addCommand(openGitRemote);	
			
			// object level contributions
			commandService.registerCommandContribution("itemLevelCommands", "orion.gitStage", 100); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "orion.gitCheckout", 101);	 //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "orion.gitUnstage", 102);	 //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("itemLevelCommands", "orion.sbsCompare", 103);	 //$NON-NLS-1$ //$NON-NLS-0$
			
			// dom level contributions for commands with known ids.
			commandService.registerCommandContribution("pageActions", "orion.gitResetChanges", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("rebaseActions", "orion.gitRebaseContinue", 2); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("rebaseActions", "orion.gitRebaseSkip", 3);	 //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("rebaseActions", "orion.gitRebaseAbort", 4); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("personIdentShow", "orion.showCommitterAndAuthor", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.registerCommandContribution("personIdentHide", "orion.hideCommitterAndAuthor", 2); //$NON-NLS-1$ //$NON-NLS-0$
			
			// dynamically generated sections register their commands once the id of tool area is computed
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
			var messageArea = document.getElementById("commitMessage"); //$NON-NLS-0$
			var commitBtn = document.getElementById("commit"); //$NON-NLS-0$
			if(this._staging){
				commitBtn.disabled = true;
				messageArea.disabled = false;
			} else {
				commitBtn.disabled = !(this._commitReady() && messageArea.value !== "");
				messageArea.disabled = !this._commitReady();
			}
			
			this._timerId = setTimeout(dojo.hitch(this, function() {
				this.doTimer(); 
			}), 150);
		},
		
		initViewer: function () {
		  	this._inlineCompareContainer.destroyEditor();
			this._model.selectedItem = null;
			this.hasStaged = false;
			this.hasUnstaged = false;
			dojo.place(document.createTextNode(messages['Select a file on the left to compare...']), "fileNameInViewer", "only"); //$NON-NLS-2$ //$NON-NLS-1$
			dojo.style("fileNameInViewer", "color", "#6d6d6d"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.empty("inlineCompareCommands"); //$NON-NLS-0$
		},

		_createImgButton: function(enableWaitCursor ,imgParentDiv , imgSrc, imgTitle,onClick){
			var imgBtn = document.createElement('img'); //$NON-NLS-0$
			imgBtn.src = imgSrc;
			imgParentDiv.appendChild(imgBtn);
			this.modifyImageButton(enableWaitCursor ,imgBtn , imgTitle,onClick);
		},
		
		_modifyImageButton: function(enableWaitCursor , imgBtnDiv , imgTitle, onClick , disabled , onHoverCallBack){
			var self = this;
			if(disabled === undefined || !disabled){
				imgBtnDiv.title= imgTitle;
				
				dojo.style(imgBtnDiv, "opacity", "0.4"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.connect(imgBtnDiv, "onmouseover", imgBtnDiv, function() { //$NON-NLS-0$
					var disableOnHover = false;
					if(onHoverCallBack)
						disableOnHover = onHoverCallBack();
					imgBtnDiv.style.cursor = self.loading ? 'wait' : (disableOnHover ? "default" : "pointer"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					if(disableOnHover)
						dojo.style(imgBtnDiv, "opacity", "0.4"); //$NON-NLS-1$ //$NON-NLS-0$
					else
						dojo.style(imgBtnDiv, "opacity", "1"); //$NON-NLS-1$ //$NON-NLS-0$
				});
				dojo.connect(imgBtnDiv, "onmouseout", imgBtnDiv , function() { //$NON-NLS-0$
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default"; //$NON-NLS-1$ //$NON-NLS-0$
					dojo.style(imgBtnDiv, "opacity", "0.4"); //$NON-NLS-1$ //$NON-NLS-0$
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
				imgBtnDiv.style.cursor =  self.loading ? 'wait' : "default"; //$NON-NLS-1$ //$NON-NLS-0$
				dojo.style(imgBtnDiv, "opacity", "0.0"); //$NON-NLS-1$ //$NON-NLS-0$
				dojo.connect(imgBtnDiv, "onmouseover", imgBtnDiv, function() { //$NON-NLS-0$
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default"; //$NON-NLS-1$ //$NON-NLS-0$
					dojo.style(imgBtnDiv, "opacity", "0"); //$NON-NLS-1$ //$NON-NLS-0$
				});
				dojo.connect(imgBtnDiv, "onmouseout", imgBtnDiv , function() { //$NON-NLS-0$
					imgBtnDiv.style.cursor = self.loading ? 'wait' : "default"; //$NON-NLS-1$ //$NON-NLS-0$
					dojo.style(imgBtnDiv, "opacity", "0"); //$NON-NLS-1$ //$NON-NLS-0$
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
				renderer.renderRow(retValue[i], i);
			}
			renderer.totalRow = retValue.length;
			return retValue.length;
		},
		
		loadDiffContent: function(itemModel){
			this._statusService.setProgressMessage("Loading diff..."); //$NON-NLS-0$
			var self = this;
			var diffVS = this._model.isStaged(itemModel.type) ? messages["index VS HEAD"] : messages["local VS index"] ;
			this._inlineCompareContainer.setDiffTitle(dojo.string.substitute(messages["Compare(${0} : ${1})"], [orion.statusTypeMap[itemModel.type][1],diffVS])) ;
			
			this._inlineCompareContainer.setOptions({hasConflicts: this._model.isConflict(itemModel.type),
													 complexURL: itemModel.diffURI});
			
			this._inlineCompareContainer.clearContent();
			this._inlineCompareContainer.startup();
		},
		
		openCompareEditor: function(itemModel){

			var href = mCompareUtils.generateCompareHref(itemModel.diffURI, {
				readonly: this._model.isStaged(itemModel.type),
				conflict: this._model.isConflict(itemModel.type)
			});
			return href;
		},
		
		handleServerErrors: function(errorResponse , ioArgs){
			var display = [];
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			
			try{
				var resp = JSON.parse(errorResponse.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			}catch(Exception){
				display.Message =  typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText;//dojo.fromJson(ioArgs.xhr.responseText).DetailedMessage; //$NON-NLS-0$
			}
			
			this._statusService.setProgressResult(display);
		},
		
		getGitStatus: function(url , initializing){
			this._url = url;
			this._initializing = (initializing ? true : false);
			if (this._initializing) {
				this._cloneInfo = undefined;
			}
			var self = this;
			self.setLoadingStatusMessage(messages["Loading status..."]);
			self._registry.getService("orion.git.provider").getGitStatus(url).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.loadStatus(jsonData);
			}, function(response, ioArgs) {
				self.setLoadingStatusMessage();
				self.handleServerErrors(response, ioArgs);
			});
		},
		
		stage: function(location , itemModel){
			var self = this;
			if (itemModel && itemModel.conflicting) {
				self._stagingConflict = true;
				self._stagingName = itemModel.name;
			} else
				self._stagingConflict = false;
			self._registry.getService("orion.git.provider").stage(location).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.getGitStatus(self._url);
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});

		},
		
		stageSelected: function(){
			var selectedItems = this._unstagedContentRenderer.getSelected();
			if(selectedItems.length === 0)
				return;
			this._prepareStage(selectedItems, true);
			this._unstagedTableRenderer.select(false);
			this._stagedTableRenderer.select(false);
			if(this._unstagedContentRenderer.totalRow === selectedItems.length)
				//this.stageAll();
				this.stageMultipleFiles(selectedItems);
			else
				//this.stageOneSelection(selectedItems, 0);
				this.stageMultipleFiles(selectedItems);
		},

		checkoutSelected: function(){
			var selection = this._unstagedContentRenderer.getSelected();
			if(selection.length === 0)
				return;
			this._prepareStage(selection, true);
			this._unstagedTableRenderer.select(false);
			this._stagedTableRenderer.select(false);
			var nameList = [];
			for ( var i = 0; i < selection.length; i++) {
				var itemModel = selection[i].modelItem;
				if (itemModel && itemModel.name) {
					nameList.push(itemModel.name);
				}
			}
			this.checkout(nameList);
		},

		stageOneSelection: function (selection, index){
			var that = this;
			var itemModel = selection[index].modelItem;
			if (itemModel && itemModel.conflicting) {
				that._stagingConflict = true;
				that._stagingName = itemModel.name;
			}
			that._registry.getService("orion.git.provider").stage(itemModel.indexURI).then(function(jsonData, secondArg) { //$NON-NLS-0$
				if (index === (selection.length - 1)) {
					that.getGitStatus(that._url);
				} else {
					that.stageOneSelection(selection, index + 1);
				}
			}, function(response, ioArgs) {
				that.handleServerErrors(response, ioArgs);
			});
		},

		stageMultipleFiles: function (selection){
			var that = this;
			var paths = [];
			for ( var i = 0; i < selection.length; i++) {
				var itemModel = selection[i].modelItem;
				if (itemModel && itemModel.conflicting) {
					that._stagingConflict = true;
					that._stagingName = itemModel.name;
				}
				paths.push(itemModel.name);
			}
			that._registry.getService("orion.git.provider").stageMultipleFiles(that._model.items.IndexLocation, paths).then(function(jsonData, secondArg) { //$NON-NLS-0$
				that.getGitStatus(that._url);
			}, function(response, ioArgs) {
				that.handleServerErrors(response, ioArgs);
			});
		},

		checkout: function(itemNameList){
			var self = this;
			var location = this._model.items.CloneLocation;
			self._registry.getService("orion.git.provider").checkoutPath(location, itemNameList).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.getGitStatus(self._url);
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});
		},
		
		stageAll: function(){
			this.stage(this._curClone.IndexLocation);
		},

		unstageSelected: function(resetParam){
			var selectedItems = this._stagedContentRenderer.getSelected();
			this._stagedTableRenderer.select(false);
			this._unstagedTableRenderer.select(false);
			if(selectedItems.length === 0)
				return;
			if(this._stagedContentRenderer.totalRow === selectedItems.length)
				this.unstageAll(resetParam);
			else
				this.unstageMultipleFiles(selectedItems);
		},
		
		unstage: function(itemModel){
			var self = this;
			self._registry.getService("orion.git.provider").unstage(self._model.items.IndexLocation, [itemModel.name]).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.getGitStatus(self._url);
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});
		},
		
		unstageAll: function(resetParam){
			var self = this;
			self._registry.getService("orion.git.provider").unstageAll(self._model.items.IndexLocation, resetParam).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.getGitStatus(self._url);
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});
		},
		
		unstageMultipleFiles: function(selection){
			var that = this;
			var paths = [];
			for ( var i = 0; i < selection.length; i++) {
				var itemModel = selection[i].modelItem;
				paths.push(itemModel.name);
			}
			that._registry.getService("orion.git.provider").unstage(that._model.items.IndexLocation, paths).then(function(jsonData, secondArg) { //$NON-NLS-0$
				that.getGitStatus(that._url);
			}, function(response, ioArgs) {
				that.handleServerErrors(response, ioArgs);
			});
		},
		
		commitAll: function(location , message , body){
			var self = this;
			var messageArea = document.getElementById("commitMessage"); //$NON-NLS-0$
			messageArea.value = "";
			self._statusService.setProgressMessage(messages["Committing..."]);
			self._registry.getService("orion.git.provider").commitAll(location, message, body).then(function(jsonData, secondArg) { //$NON-NLS-0$
				self.getGitStatus(self._url, true);
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});
		},
		
		commit: function(message, amend, committerName, committerEmail, authorName, authorEmail){
			var body = {};
			if(!message) {
				var messageArea = document.getElementById("commitMessage"); //$NON-NLS-0$
				message = messageArea.value;
				if(message !== "")
					body.Message = message;
				else
					return;
			}
	
			if(!amend) {
				var amendBtn = document.getElementById("amend"); //$NON-NLS-0$
				amend = amendBtn.checked;
				if(amend)
					body.Amend = "true"; //$NON-NLS-0$
			}
			
			if(!committerName) {
				var committerNameInput = document.getElementById("committerName"); //$NON-NLS-0$
				committerName =  committerNameInput.value;
				body.CommitterName = committerName;
				if (!committerName) {
					this.reportWarning(messages["The committer name is required."]);
					this._committerAndAuthorZoneRenderer.show();
					return;
				}
			}
			if(!committerEmail) {
				var committerEmailInput = document.getElementById("committerEmail"); //$NON-NLS-0$
				committerEmail =  committerEmailInput.value;
				body.CommitterEmail = committerEmail;
				if (!committerEmail) {
					this.reportWarning(messages["The committer mail is required."]);
					this._committerAndAuthorZoneRenderer.show();
					return;
				}
			}
			if(!authorName) {
				var authorNameInput = document.getElementById("authorName"); //$NON-NLS-0$
				authorName =  authorNameInput.value;
				body.AuthorName = authorName;
				if (!authorName) {
					this.reportWarning(messages["The author name is required."]);
					this._committerAndAuthorZoneRenderer.show();
					return;
				}
			}
			if(!authorEmail) {
				var authorEmailInput = document.getElementById("authorEmail"); //$NON-NLS-0$
				authorEmail =  authorEmailInput.value;
				body.AuthorEmail = authorEmail;
				if (!authorEmail) {
					this.reportWarning(messages["The author mail is required."]);
					this._committerAndAuthorZoneRenderer.show();
					return;
				}
			}
			
			this.commitAll(this._curClone.HeadLocation, message, dojo.toJson(body));
		},
		
		reportWarning: function(message){
			var display = [];
			display.Severity = "Warning"; //$NON-NLS-0$
			display.Message = message;
			this._registry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
		},
				
		rebase: function(action){
			var self = this;
			self._registry.getService("orion.git.provider").doRebase(self._curClone.HeadLocation, "", action, function(jsonData) { //$NON-NLS-0$
				if (jsonData.Result == "OK" || jsonData.Result == "ABORTED" || jsonData.Result == "FAST_FORWARD" || jsonData.Result == "UP_TO_DATE") { //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					var display = [];
					display.Severity = "Ok"; //$NON-NLS-0$
					display.HTML = false;
					display.Message = jsonData.Result;
					self._statusService.setProgressResult(display);
					self.getGitStatus(self._url);
				}
				if (jsonData.Result == "STOPPED") { //$NON-NLS-0$
					var display = [];
					display.Severity = "Warning"; //$NON-NLS-0$
					display.HTML = false;
					display.Message = jsonData.Result + messages[". Repository still contains conflicts."];
					self._statusService.setProgressResult(display);
					self.getGitStatus(self._url);
				} else if (jsonData.Result == "FAILED_UNMERGED_PATHS") { //$NON-NLS-0$
					var display = [];
					display.Severity = "Error"; //$NON-NLS-0$
					display.HTML = false;
					display.Message = jsonData.Result + messages[". Repository contains unmerged paths. Resolve conflicts first."];
					self._statusService.setProgressResult(display);
				}
			}, function(response, ioArgs) {
				self.handleServerErrors(response, ioArgs);
			});
		}	
	};
	return GitStatusController;
}());

return orion;	
});
