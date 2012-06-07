/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define dojo dijit console document window */

define(['i18n!git/nls/gitmessages', 'dojo', 'orion/explorer', 'orion/selection', 'orion/section', 'orion/util', 'orion/commands', 'orion/globalCommands', 'orion/compare/diff-provider', 'orion/compare/compare-container', 
        'orion/git/util', 'orion/git/gitCommands', 'orion/navigationUtils', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, dojo, mExplorer, mSelection, mSection, mUtil, mCommands, mGlobalCommands, mDiffProvider , mCompareContainer, mGitUtil, mGitCommands, mNavUtils) {
	
	var exports = {};
	
	var conflictTypeStr = "Conflicting"; //$NON-NLS-0$
	
	function isConflict(type){
		return type === conflictTypeStr;
	};
	
	var GitStatusModel = (function() {
		function GitStatusModel() {
			this.selectedFileId = undefined;
			this.selectedItem = undefined;
			this.interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.interestedStagedGroup = ["Added", "Changed","Removed"]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]]; //$NON-NLS-11$ //$NON-NLS-10$ //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.conflictType = "Conflicting"; //$NON-NLS-0$
			
			this.statusTypeMap = { 
				"Missing":["gitImageSprite git-sprite-removal", messages['Unstaged removal']], //$NON-NLS-1$ //$NON-NLS-0$
				"Removed":["gitImageSprite git-sprite-removal",messages['Staged removal']],	 //$NON-NLS-1$ //$NON-NLS-0$
				"Modified":["gitImageSprite git-sprite-modification",messages['Unstaged change']],	 //$NON-NLS-1$ //$NON-NLS-0$
				"Changed":["gitImageSprite git-sprite-modification",messages['Staged change']],	 //$NON-NLS-1$ //$NON-NLS-0$
			    "Untracked":["gitImageSprite git-sprite-addition",messages["Unstaged addition"]],	 //$NON-NLS-1$ //$NON-NLS-0$
				"Added":["gitImageSprite git-sprite-addition",messages["Staged addition"]],	 //$NON-NLS-1$ //$NON-NLS-0$
				"Conflicting":["gitImageSprite git-sprite-conflict-file", messages['Conflicting']]	 //$NON-NLS-1$ //$NON-NLS-0$
			};
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
			
			isStaged: function(type){
				for(var i = 0; i < this.interestedStagedGroup.length ; i++){
					if(type === this.interestedStagedGroup[i]){
						return  true;
					}
				}
				return false;
			},
			
			getClass: function(type){
				return this.statusTypeMap[type][0];
			}
			
			
			
		};
		return GitStatusModel;
	}());

	exports.GitStatusExplorer = (function() {

		/**
		 * Creates a new Git status explorer.
		 * @class Git status explorer
		 */
		function GitStatusExplorer(registry, commandService, linkService, selection, parentId, toolbarId, selectionToolsId, actionScopeId){
			this.parentId = parentId;
			this.registry = registry;
			this.commandService = commandService;
			this.linkService = linkService;
			this.selection = selection;
			this.parentId = parentId;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = false;
			this.actionScopeId = actionScopeId;
			mExplorer.createExplorerCommands(commandService);
		}
		
		GitStatusExplorer.prototype.handleError = function(error) {
			var display = {};
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			this.registry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
			
			if (error.status === 404) {
				this.initTitleBar();
				this.displayCommit();
			}
		};
		
		GitStatusExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};
		
		GitStatusExplorer.prototype.redisplay = function(){
			this.display(dojo.hash());
		};
		
		GitStatusExplorer.prototype.display = function(location){
			var that = this;
			var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$

			var loadingDeferred = new dojo.Deferred();
			progressService.showWhile(loadingDeferred, messages['Loading...']);
			this.registry.getService("orion.git.provider").getGitStatus(location).then( //$NON-NLS-0$
				function(resp){
					if (resp.Type === "Status") { //$NON-NLS-0$
						var status = resp;
						that._model = new GitStatusModel();
						that._model.init(status);
						
						that.registry.getService("orion.git.provider").getGitClone(status.CloneLocation).then( //$NON-NLS-0$
							function(resp){
								var repositories = resp.Children;
								
								that.registry.getService("orion.git.provider").getGitCloneConfig(repositories[0].ConfigLocation).then( //$NON-NLS-0$
									function(resp){
										loadingDeferred.callback();
										var config = resp.Children;
										
										status.Clone = repositories[0];
										status.Clone.Config = [];
										
										for (var i=0; i < config.length; i++){
											if (config[i].Key === "user.name" || config[i].Key === "user.email") //$NON-NLS-1$ //$NON-NLS-0$
												status.Clone.Config.push(config[i])
										}
										
										var tableNode = dojo.byId( 'table' );	 //$NON-NLS-0$
										dojo.empty( tableNode );
										
										that.initTitleBar(status, repositories[0]);
						
										that.displayUnstaged(status, repositories[0]);
										that.displayStaged(status, repositories[0]);
										that.displayCommits(repositories[0]);
										
										// render commands
										mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", status); //$NON-NLS-1$ //$NON-NLS-0$
									}, function (error) {
										loadingDeferred.callback();
										dojo.hitch(that, that.handleError)(error);
									}
								);
							}, function (error) {
								loadingDeferred.callback();
								dojo.hitch(that, that.handleError)(error);
							}
						);
					}	
					progressService.setProgressMessage("");
				}, function(error){
					loadingDeferred.callback();
					dojo.hitch(that, that.handleError)(error);
				}
			);
		};
		
		GitStatusExplorer.prototype.initTitleBar = function(status, repository){
			var item = {};
			
			// TODO add info about branch or detached		
			item.Name = messages["Status"] + ((status.RepositoryState && status.RepositoryState.indexOf("REBASING") !== -1) ? messages[" (Rebase in Progress)"] : ""); //$NON-NLS-1$
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories"; //$NON-NLS-0$

			mGlobalCommands.setPageTarget({task: messages["Status"], target: repository, 
				breadcrumbTarget: item,
				makeBreadcrumbLink: function(seg, location) {
					seg.href = "/git/git-repository.html#" + (location ? location : ""); //$NON-NLS-0$
				},
				serviceRegistry: this.registry, commandService: this.commandService});
		};
		
		// helpers
		
		GitStatusExplorer.prototype._sortBlock = function(interestedGroup){
			var retValue = [];
			for (var i = 0; i < interestedGroup.length ; i++){
				var groupName = interestedGroup[i];
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
											CloneLocation:this._model.items.CloneLocation,
											conflicting:isConflict(renderType)
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
		};

		// Git unstaged changes

		GitStatusExplorer.prototype.displayUnstaged = function(status, repository){
			
			var that = this;

			var unstagedSortedChanges = this._sortBlock(this._model.interestedUnstagedGroup);
			
			var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
			
			var unstagedSection = new mSection.Section(tableNode, {
				id: "unstagedSection", //$NON-NLS-0$
				title: unstagedSortedChanges.length > 0 ? messages['Unstaged'] : messages["No Unstaged Changes"],
				content: '<div id="unstagedNode"></div>', //$NON-NLS-0$
				canHide: true
			});
			
			this.commandService.registerCommandContribution(unstagedSection.actionsNode.id, "orion.explorer.expandAll", 200); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.registerCommandContribution(unstagedSection.actionsNode.id, "orion.explorer.collapseAll", 300); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.commandService.registerCommandContribution(unstagedSection.selectionNode.id, "eclipse.orion.git.showPatchCommand", 100); //$NON-NLS-0$
			this.commandService.registerCommandContribution(unstagedSection.selectionNode.id, "eclipse.orion.git.stageCommand", 200); //$NON-NLS-0$
			this.commandService.registerCommandContribution(unstagedSection.selectionNode.id, "eclipse.orion.git.checkoutCommand", 300); //$NON-NLS-0$	

			if (!this.unstagedOnce){
				if (!this.unstagedSelection)
					this.unstagedSelection = new mSelection.Selection(this.registry, "orion.unstagedSection.selection"); //$NON-NLS-0$
				
				this.registry.getService("orion.unstagedSection.selection").addEventListener("selectionChanged", function(singleSelection, selections) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = dojo.byId(unstagedSection.selectionNode.id);
					if (selectionTools) {
						dojo.empty(selectionTools);
						that.commandService.renderCommands(unstagedSection.selectionNode.id, selectionTools, selections, that, "button", {"Clone": repository}); //$NON-NLS-1$ //$NON-NLS-0$
					}
				});
				this.unstagedOnce = true;
			}
						
			this.commandService.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.stageCommand", 100);
			
			UnstagedModel = (function() {
				function UnstagedModel() {
				}
				
				UnstagedModel.prototype = {
					destroy: function(){
					},
					getRoot: function(onItem){
						onItem(unstagedSortedChanges);
					},
					getChildren: function(parentItem, onComplete){	
						if (parentItem instanceof Array && parentItem.length > 0) {
							onComplete(parentItem);
						} else if (mGitUtil.isChange(parentItem)) {
							if(!parentItem.children){//lazy creation, this is required for selection model to be able to trverse into children
								parentItem.children = [];
								parentItem.children.push({"diffUri": parentItem.diffURI, "Type": "Diff", parent: parentItem}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							}
							onComplete(parentItem.children); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						} else {
							onComplete([]);
						}
					},
					getId: function(/* item */ item){
						if (item instanceof Array && item.length > 0) {
							return "unstagedRoot"; //$NON-NLS-0$
						} else if (mGitUtil.isChange(item)) {
							return "unstaged" + item.name; //$NON-NLS-0$
						} else {
							return "unstaged" + item.diffUri; //$NON-NLS-0$
						}
					}
				};
				
				return UnstagedModel;
			}());
			
			UnstagedRenderer = (function() {
				function UnstagedRenderer (options, explorer) {
					this._init(options);
					this.options = options;
					this.explorer = explorer;
					this.registry = options.registry;
				}
				
				UnstagedRenderer.prototype = new mExplorer.SelectionRenderer();

				UnstagedRenderer.prototype.getCellElement = function(col_no, item, tableRow){					
					switch(col_no){
					case 0:		
						if (mGitUtil.isChange(item)){
							var td = document.createElement("td"); //$NON-NLS-0$
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							this.getExpandImage(tableRow, div); //$NON-NLS-0$
							
							var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
							
							var diffActionWrapper = dojo.create("span", {"class": "sectionExplorerActions", id: "unstaged" + item.name + "DiffActionWrapper"}, div, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							window.setTimeout(function(){
								that.commandService.renderCommands("DefaultActionWrapper", diffActionWrapper.id, item, that, "tool", null, navGridHolder);	 //$NON-NLS-0$
							}, 300);			
							
							dojo.create( "span", { "class":"gitImageSprite " + that._model.getClass(item.type)}, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							
							var itemLabel = dojo.create( "span", { "class":"gitMainDescription", innerHTML: item.name }, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							return td;
						} else {
							var td = document.createElement("td"); //$NON-NLS-0$
							td.colSpan = 2;
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							var compareWidgetActionWrapper = dojo.create("div", {"class": "sectionExplorerActions", id: "unstaged" + item.parent.name + "CompareWidgetActionWrapper"}, div, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							dojo.create( "div", { "id":"diffArea_" + item.diffUri, "style":"height:420px; border:1px solid lightgray; overflow: hidden"}, div); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
							var hasConflict = isConflict(item.parent.type);
							window.setTimeout(function(){
								var diffProvider = new mCompareContainer.DefaultDiffProvider(that.registry);
								var diffOptions = {
									gridRenderer: {
										navGridHolder: navGridHolder
									},
									commandSpanId: compareWidgetActionWrapper.id,
									diffProvider: diffProvider,
									hasConflicts: hasConflict,
									readonly: true,
									editableInComparePage: true,
									complexURL: item.diffUri,
									callback : function(){}
								};
								
								var inlineCompareContainer = new mCompareContainer.toggleableCompareContainer(that.registry, "diffArea_" + item.diffUri, "inline", diffOptions); //$NON-NLS-1$ //$NON-NLS-0$
								inlineCompareContainer.startup( function(maxHeight){
									var vH = 420;
									if(maxHeight < vH){
										vH = maxHeight;
									}
									dojo.style("diffArea_" + item.diffUri, "height", vH + "px"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								});
							}, 300);
							
							return td;
						}

						break;
					case 1:
						// Create an actions column that the compare container can use.  We don't render any commands in here, the container will.
//						if (item.type){
//							var actionsColumn = document.createElement('td'); //$NON-NLS-0$
//							actionsColumn.id = tableRow.id + "actionswrapper"; //$NON-NLS-0$
//							dojo.addClass(actionsColumn, "sectionExplorerActions"); //$NON-NLS-0$
//							var innerSpan = dojo.create("span", {"class": "sectionExplorerActions", id: "unstaged"+item.name+"compareActionWrapper"}, actionsColumn, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//							return actionsColumn;
//						}
						break;
					}
				};
				
				return UnstagedRenderer;
			}());
			
			UnstagedNavigator = (function() {
				function UnstagedNavigator(registry, selection, parentId, actionScopeId) {
					this.registry = registry;
					this.checkbox = false;
					this.parentId = parentId;
					this.selection = selection;
					this.actionScopeId = actionScopeId;
					this.renderer = new UnstagedRenderer({registry: this.registry,/* actionScopeId: sectionItemActionScopeId, */cachePrefix: "UnstagedNavigator", checkbox: false}, this); //$NON-NLS-0$
					this.createTree(this.parentId, new UnstagedModel(), {setFocus: true});
				}
				
				UnstagedNavigator.prototype = new mExplorer.Explorer();

				//provide to the selection model that if a row is selectable
				UnstagedNavigator.prototype.isRowSelectable = function(modelItem){
					return mGitUtil.isChange(modelItem);
				};
				//provide to the expandAll/collapseAll commands
				UnstagedNavigator.prototype.getItemCount  = function(){
					return unstagedSortedChanges.length;
				};
				return UnstagedNavigator;
			}());
			
			var unstagedNavigator = new UnstagedNavigator(this.registry, this.unstagedSelection, "unstagedNode" /*, sectionItemActionScopeId*/); //$NON-NLS-0$
			this.commandService.renderCommands(unstagedSection.actionsNode.id, unstagedSection.actionsNode.id, unstagedNavigator, unstagedNavigator, "button"); //$NON-NLS-0$
		};
		
		// Git staged changes
		
		GitStatusExplorer.prototype.displayStaged = function(status, repository){
			
			var that = this;
			
			var stagedSortedChanges = this._sortBlock(this._model.interestedStagedGroup);
			
			var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
			
			var stagedSection = new mSection.Section(tableNode, {
				id: "stagedSection", //$NON-NLS-0$
				title: stagedSortedChanges.length > 0 ? messages['Staged'] : messages["No Staged Changes"],
				content: '<div id="stagedNode"></div>', //$NON-NLS-0$
				slideout: true,
				canHide: true
			});
			
			this.commandService.registerCommandContribution(stagedSection.actionsNode.id, "eclipse.orion.git.commitCommand", 100); //$NON-NLS-0$
			this.commandService.registerCommandContribution(stagedSection.actionsNode.id, "orion.explorer.expandAll", 200); //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.registerCommandContribution(stagedSection.actionsNode.id, "orion.explorer.collapseAll", 300); //$NON-NLS-1$ //$NON-NLS-0$

			this.commandService.registerCommandContribution(stagedSection.selectionNode.id, "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-0$
			
			if (!this.stagedOnce){
				if (!this.stagedSelection)
					this.stagedSelection = new mSelection.Selection(this.registry, "orion.stagedSection.selection"); //$NON-NLS-0$
				
				this.registry.getService("orion.stagedSection.selection").addEventListener("selectionChanged", function(singleSelection, selections) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = dojo.byId(stagedSection.selectionNode.id);
					if (selectionTools) {
						dojo.empty(selectionTools);
						that.commandService.renderCommands(stagedSection.selectionNode.id, selectionTools, selections, that, "button", {"Clone": repository}); //$NON-NLS-1$ //$NON-NLS-0$
					}
				});
				this.stagedOnce = true;
			}
			
			this.commandService.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-0$
			
			StagedModel = (function() {
				function StagedModel() {
				}
				
				StagedModel.prototype = {					
					destroy: function(){
					},
					getRoot: function(onItem){
						onItem(stagedSortedChanges);
					},
					getChildren: function(parentItem, onComplete){	
						if (parentItem instanceof Array && parentItem.length > 0) {
							onComplete(parentItem);
						} else if (mGitUtil.isChange(parentItem)) {
							if(!parentItem.children){//lazy creation, this is required for selection model to be able to trverse into children
								parentItem.children = [];
								parentItem.children.push({"diffUri": parentItem.diffURI, "Type": "Diff", parent: parentItem});//$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							}
							onComplete(parentItem.children); 
						} else {
							onComplete([]);
						}
					},
					getId: function(/* item */ item){
						if (item instanceof Array && item.length > 0) {
							return "stagedRoot"; //$NON-NLS-0$
						} else if (mGitUtil.isChange(item)) {
							return "staged" + item.name; //$NON-NLS-0$
						} else {
							return "staged" + item.diffUri; //$NON-NLS-0$
						}
					}
				};
				
				return StagedModel;
			}());
			
			StagedRenderer = (function() {
				function StagedRenderer (options, explorer) {
					this._init(options);
					this.options = options;
					this.explorer = explorer;
					this.registry = options.registry;
				}
				
				StagedRenderer.prototype = new mExplorer.SelectionRenderer();

				StagedRenderer.prototype.getCellElement = function(col_no, item, tableRow){
					switch(col_no){
					case 0:		
						if (mGitUtil.isChange(item)){
							var td = document.createElement("td"); //$NON-NLS-0$
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							this.getExpandImage(tableRow, div);
							var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
							
							var diffActionWrapper = dojo.create("span", {"class": "sectionExplorerActions", id: "staged" + item.name + "DiffActionWrapper"}, div, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							window.setTimeout(function(){
								that.commandService.renderCommands("DefaultActionWrapper", diffActionWrapper.id, item, that, "tool", null, navGridHolder);	 //$NON-NLS-0$
							}, 300);		
							
							dojo.create( "span", { "class":"gitImageSprite " + that._model.getClass(item.type)}, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							
							var itemLabel = dojo.create( "span", { "class":"gitMainDescription", innerHTML: item.name }, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							
							return td;
						} else {
							var td = document.createElement("td"); //$NON-NLS-0$
							td.colSpan = 2;
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							var compareWidgetActionWrapper = dojo.create("div", {"class": "sectionExplorerActions", id: "staged" + item.parent.name + "CompareWidgetActionWrapper"}, div, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							dojo.create( "div", { "id":"diffArea_" + item.diffUri, "style":"height:420px; border:1px solid lightgray; overflow: hidden"}, div); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
							var hasConflict = isConflict(item.parent.type);
							window.setTimeout(function(){
								var diffProvider = new mCompareContainer.DefaultDiffProvider(that.registry);
								
								var diffOptions = {
									gridRenderer: {
										navGridHolder: navGridHolder
									},
									commandSpanId: compareWidgetActionWrapper.id,
									diffProvider: diffProvider,
									hasConflicts: hasConflict,
									readonly: true,
									complexURL: item.diffUri,
									callback : function(){}
								};
								
								var inlineCompareContainer = new mCompareContainer.toggleableCompareContainer(that.registry, "diffArea_" + item.diffUri, "inline", diffOptions); //$NON-NLS-1$ //$NON-NLS-0$
								inlineCompareContainer.startup( function(maxHeight){
									var vH = 420;
									if(maxHeight < vH){
										vH = maxHeight;
									}
									dojo.style("diffArea_" + item.diffUri, "height", vH + "px"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								});
							}, 500);
							
							return td;
						}

						break;
					case 1:
						// Create an actions column that the compare container can use.  We don't render any commands in here, the container will.
//						if (item.type){
//							var actionsColumn = document.createElement('td'); //$NON-NLS-0$
//							actionsColumn.id = tableRow.id + "actionswrapper"; //$NON-NLS-0$
//							dojo.addClass(actionsColumn, "sectionExplorerActions"); //$NON-NLS-0$
//							var innerSpan = dojo.create("span", {"class": "sectionExplorerActions", id: "staged"+item.name+"compareActionWrapper"}, actionsColumn, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//							return actionsColumn;
//						}
						break;
					}
				};
				
				return StagedRenderer;
			}());
			
			StagedNavigator = (function() {
				function StagedNavigator(registry, selection, parentId, actionScopeId) {
					this.registry = registry;
					this.checkbox = false;
					this.parentId = parentId;
					this.status = status;
					this.selection = selection;
					this.actionScopeId = actionScopeId;
					this.renderer = new StagedRenderer({registry: this.registry, /*actionScopeId: sectionItemActionScopeId, */cachePrefix: "StagedNavigator", checkbox: false}, this); //$NON-NLS-0$
					this.createTree(this.parentId, new StagedModel());
				}
				
				StagedNavigator.prototype = new mExplorer.Explorer();
			
				//provide to the selection model that if a row is selectable
				StagedNavigator.prototype.isRowSelectable = function(modelItem){
					return mGitUtil.isChange(modelItem);
				};
				//provide to the expandAll/collapseAll commands
				StagedNavigator.prototype.getItemCount  = function(){
					return stagedSortedChanges.length;
				};
				return StagedNavigator;
			}());
			
			var stagedNavigator = new StagedNavigator(this.registry, this.stagedSelection, "stagedNode" /*, sectionItemActionScopeId*/); //$NON-NLS-0$
			this.commandService.renderCommands(stagedSection.actionsNode.id, stagedSection.actionsNode.id, stagedNavigator, stagedNavigator, "button"); //$NON-NLS-0$
		};
	
		// Git commits
		
		GitStatusExplorer.prototype.displayCommits = function(repository){
								
			var that = this;
			
			var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
			
			var titleWrapper = new mSection.Section(tableNode, {
				id: "commitSection", //$NON-NLS-0$
				title: messages['Commits'],
				content: '<list id="commitNode" class="mainPadding"></list>', //$NON-NLS-0$
				slideout: true,
				canHide: true,
				preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
			});
			
			var progress = titleWrapper.createProgressMonitor();
			
			progress.begin(messages['Getting current branch']);
			this.registry.getService("orion.git.provider").getGitBranch(repository.BranchLocation).then( //$NON-NLS-0$
				function(resp){
					var branches = resp.Children;
					var currentBranch;
					for (var i=0; i<branches.length; i++){
						if (branches[i].Current){
							currentBranch = branches[i];
							break;
						}
					}
					
					var tracksRemoteBranch = (currentBranch.RemoteLocation.length === 1 && currentBranch.RemoteLocation[0].Children.length === 1);
					
					titleWrapper.setTitle(dojo.string.substitute(messages["Commits for \"${0}\" branch"], [currentBranch.Name]));
	
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
						{"ViewAllLink":"/git/git-log.html#" + currentBranch.CommitLocation + "?page=1", "ViewAllLabel":messages['See Full Log'], "ViewAllTooltip":"See the full log"}, that, "button"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					
					if (tracksRemoteBranch){
						that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.fetch", 100); //$NON-NLS-0$
						that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.merge", 100); //$NON-NLS-0$
						that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.rebase", 100); //$NON-NLS-0$
						that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.resetIndex", 100); //$NON-NLS-0$
						that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, currentBranch.RemoteLocation[0].Children[0], that, "button"); //$NON-NLS-0$
					}
					
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.push", 100); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, currentBranch, that, "button"); //$NON-NLS-0$
					
					if (currentBranch.RemoteLocation[0] === null){
						progress.done();
						that.renderNoCommit();
						return;
					}
					
					progress.worked(dojo.string.substitute(messages['Getting commits for \"${0}\" branch'],  [currentBranch.Name]));
					if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
						that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							function(resp){
								progress.worked(messages['Rendering commits']);
								
								var commitsCount = resp.Children.length;
								
								for (var i=0; i<resp.Children.length; i++){
									that.renderCommit(resp.Children[i], true, i);
								}
								
								progress.worked(messages['Getting outgoing commits']);
								that.registry.getService("orion.git.provider").getLog(currentBranch.CommitLocation + "?page=1&pageSize=20", currentBranch.RemoteLocation[0].Children[0].Id).then(  //$NON-NLS-1$ //$NON-NLS-0$
									function(resp){	
										progress.worked(messages['Rendering commits']);
										for (var i=0; i<resp.Children.length; i++){
											that.renderCommit(resp.Children[i], false, i + commitsCount);
										}
										
										commitsCount = commitsCount + resp.Children.length; 
										
										if (commitsCount === 0){
											that.renderNoCommit();
										}
										
										progress.done();
									},
									function(error){
										progress.done(error);
									}
								);	
							},
							function(error){
								progress.done(error);
							}
						);
					} else {
						that.registry.getService("orion.git.provider").doGitLog(currentBranch.CommitLocation + "?page=1&pageSize=20").then(  //$NON-NLS-1$ //$NON-NLS-0$
							function(resp){	
								progress.worked(messages['Rendering commits']);
								for (var i=0; i<resp.Children.length; i++){
									that.renderCommit(resp.Children[i], true, i);
								}
								
								if (resp.Children.length === 0){
									that.renderNoCommit();
								}	
									
								progress.done();
							},
							function(error) {
								progress.done(error);
							}
						);	
					}
				}
			);
		};
		
		GitStatusExplorer.prototype.renderNoCommit = function(){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("commitNode") ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
			
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: messages['The branch is up to date.']}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create( "div", null, detailsView ); //$NON-NLS-0$
			
			var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: messages['You have no outgoing or incoming commits.']}, detailsView );	
		};
			
		GitStatusExplorer.prototype.renderCommit = function(commit, outgoing, index){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, dojo.byId("commitNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
			
			var imgSpriteName = (outgoing ? "git-sprite-outgoing_commit" : "git-sprite-incoming_commit"); //$NON-NLS-1$ //$NON-NLS-0$
			
			dojo.create( "span", { "class":"sectionIcon gitImageSprite " + imgSpriteName}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"class":"git-author-icon"}, horizontalBox); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 30;
				image.height = 30;
				dojo.place(image, authorImage, "first"); //$NON-NLS-0$
			}
			
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var titleLink = dojo.create("a", {"class": "gitMainDescription navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, detailsView); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(commit.Message), titleLink);		
			
			var _timer;
			
			var tooltipDialog = new orion.git.widgets.CommitTooltipDialog({
			    commit: commit,
			    onMouseLeave: function(){
			    	if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
	            },
	            onMouseEnter: function(){
			    	window.clearTimeout(_timer);
	            }
			});
			
			dojo.connect(titleLink, "onmouseover", titleLink, function() { //$NON-NLS-0$
				window.clearTimeout(_timer);
				
				_timer = window.setTimeout(function(){
					dijit.popup.open({
						popup: tooltipDialog,
						around: titleLink,
						orient: {'BR':'TL', 'TR':'BL'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					});
				}, 600);
			});
			
			dojo.connect(titleLink, "onmouseout", titleLink, function() { //$NON-NLS-0$
				window.clearTimeout(_timer);
				
				_timer = window.setTimeout(function(){
					if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
				}, 200);
			});
			
			dojo.create( "div", null, detailsView ); //$NON-NLS-0$
			var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: " (SHA " + commit.Name + ") by " + commit.AuthorName  //$NON-NLS-1$ //$NON-NLS-0$
				+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView ); //$NON-NLS-1$ //$NON-NLS-0$
			
			var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands(this.actionScopeId, actionsArea, commit, this, "tool");	 //$NON-NLS-0$
		};		

		return GitStatusExplorer;
	}());
	
	return exports;
}); // end of define
