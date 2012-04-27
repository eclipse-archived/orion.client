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

/*global define console document */

define(['i18n!git/nls/gitmessages', 'dojo', 'orion/explorer', 'orion/selection', 'orion/section', 'orion/util', 'orion/commands', 'orion/globalCommands', 'orion/compare/diff-provider', 'orion/compare/compare-container', 
        'orion/breadcrumbs', 'orion/git/gitCommands', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, dojo, mExplorer, mSelection, mSection, mUtil, mCommands, mGlobalCommands, mDiffProvider , mCompareContainer, mBreadcrumbs, mGitCommands) {
	
	var exports = {};
	
	var GitStatusModel = (function() {
		function GitStatusModel() {
			this.selectedFileId = undefined;
			this.selectedItem = undefined;
			this.interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"];
			this.interestedStagedGroup = ["Added", "Changed","Removed"];
			this.conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]];
			this.conflictType = "Conflicting";
			
			this.statusTypeMap = { 
				"Missing":["gitImageSprite git-sprite-removal", "Unstaged removal"],
				"Removed":["gitImageSprite git-sprite-removal","Staged removal"],	
				"Modified":["gitImageSprite git-sprite-modification","Unstaged change"],	
				"Changed":["gitImageSprite git-sprite-modification","Staged change"],	
			    "Untracked":["gitImageSprite git-sprite-addition","Unstaged addition"],	
				"Added":["gitImageSprite git-sprite-addition","Staged addition"],	
				"Conflicting":["gitImageSprite git-sprite-conflict-file", "Conflicting"]	
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
		}
		
		GitStatusExplorer.prototype.handleError = function(error) {
			var display = {};
			display.Severity = "Error";
			display.HTML = false;
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			this.registry.getService("orion.page.message").setProgressResult(display);
			
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
			var progressService = this.registry.getService("orion.page.message");

			var loadingDeferred = new dojo.Deferred();
			progressService.showWhile(loadingDeferred, "Loading...");
			this.registry.getService("orion.git.provider").getGitStatus(location).then(
				function(resp){
					if (resp.Type === "Status") {
						var status = resp;
						that._model = new GitStatusModel();
						that._model.init(status);
						
						that.registry.getService("orion.git.provider").getGitClone(status.CloneLocation).then(
							function(resp){
								loadingDeferred.callback();
								var repositories = resp.Children;
								
								var tableNode = dojo.byId( 'table' );	
								dojo.empty( tableNode );
								
								that.initTitleBar(status, repositories[0]);
				
								that.displayUnstaged(that._model);
								that.displayStaged(status);
								that.displayDiffs(status);
								that.displayCommits(repositories[0]);
								
								// render commands
								mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", status);
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
			var that = this;
			var item = {};
			var pageTitle;
			
			// TODO add info about branch or detached
			
			item.Name = "Status";
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].Location = repository.Location;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories";
			
			pageTitle = "Status for " +  repository.Name + " - Git ";
			
			document.title = pageTitle;
			
			var location = dojo.byId("location");
			new mBreadcrumbs.BreadCrumbs({
				container: location,
				resource: item,
				makeHref:function(seg, location){
					that.makeHref(seg, location);
				}
			});		
			mGlobalCommands.setPageTarget(repository, this.registry, this.commandService);
		};
		
		GitStatusExplorer.prototype.makeHref = function(seg, location) {
			seg.href = "/git/git-repository.html#" + (location ? location : "");
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
		
		GitStatusExplorer.prototype._createCheckbox = function(itemId, section){
			var check = document.createElement("span");
			check.id = itemId;
			dojo.addClass(check, "core-sprite-check selectionCheckmarkSprite " + section.id);

			if(this.getCheckedFunc){
				check.checked = this.getCheckedFunc(item);
				if(this._highlightSelection){
					dojo.toggleClass(tableRow, "checkedRow", check.checked);
				}
				dojo.toggleClass(check, "core-sprite-check_on", check.checked);
			}

			dojo.connect(check, "onclick", dojo.hitch(this, function(evt) {
				var newValue = evt.target.checked ? false : true;
				var checkBox = evt.target;

				checkBox.checked = newValue;
				dojo.toggleClass(checkBox, "core-sprite-check_on", newValue);
				
				var selected = [];
				dojo.query(".core-sprite-check_on." + section.id).forEach(dojo.hitch(this, function(node) {
					var row = node.parentNode.parentNode;
					selected.push(row._item);
				}));
				
				if (section.getSelection) {
					section.getSelection().setSelections(selected);		
				}
			}));
			return check;
		},

		// Git unstaged changes
		
		GitStatusExplorer.prototype.displayUnstaged = function(status){
			
			var that = this;

			var unstagedSortedChanges = this._sortBlock(this._model.interestedUnstagedGroup);
			
			var tableNode = dojo.byId( 'table' );
			
			var unstageSection = new mSection.Section(tableNode, {
				explorer: this,
				id: "unstagedSection",
				title: unstagedSortedChanges.length > 0 ? "Unstaged" : "No Unstaged Changes",
				content: '<div id="unstagedNode" class="plugin-settings-list"></div>',
				commandService: this.registry.getService("orion.page.command"),
				serviceRegistry: this.registry
			});
			
//			unstageSection.registerCommandContribution("eclipse.orion.git.stageCommand", 100);
//			unstageSection.registerCommandContribution("eclipse.orion.git.checkoutCommand", 200);
//			unstageSection.registerCommandContribution("eclipse.orion.git.showPatchCommand", 300);
//			unstageSection.renderCommands(status, "button");
			
			
			
			var sectionItemActionScopeId = "unstagedSectionItem";
			
			mySelectionService = new mSelection.Selection(this.registry);
			
			var commandService = this.registry.getService("orion.page.command");
			commandService.registerCommandContribution(sectionItemActionScopeId, "eclipse.orion.git.stageCommand", 100);
			commandService.registerCommandContribution(sectionItemActionScopeId, "eclipse.orion.git.checkoutCommand", 200);		
			commandService.registerSelectionService(sectionItemActionScopeId, mySelectionService);
			
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
						} else {
							onComplete([]);
						}
					},
					getId: function(/* item */ item){
						if (item instanceof Array && item.length > 0) {
							return "root";
						}
						return item.name;
					}
				};
				
				return UnstagedModel;
			}());
			
			UnstagedRenderer = (function() {
				function UnstagedRenderer (options, explorer) {
					this._init(options);
					this.options = options;
					this.explorer = explorer;
				}
				
				UnstagedRenderer.prototype = new mExplorer.SelectionRenderer();
				
				UnstagedRenderer.prototype.getCellElement = function(col_no, item, tableRow){
					
					switch(col_no){
					case 0:				
						var td = document.createElement("td", {style: "padding: 10px"});
						var div = dojo.create( "div", {style: "padding: 10px"}, td );
						dojo.create( "span", { "class":"sectionIcon " + that._model.getClass(item.type) }, div );
						dojo.create( "span", { "class":"gitMainDescription", innerHTML: item.path }, div );
						return td;
						break;
					case 1:
						var actionsColumn = this.getActionsColumn(item, tableRow);
						return actionsColumn;
						break;
					};
				};
				
				return UnstagedRenderer;
			}());
			
			UnstagedNavigator = (function() {
				function UnstagedNavigator(registry, selection, parentId, actionScopeId) {
					this.registry = registry;
					this.checkbox = true;
					this.parentId = parentId;
					this.selection = selection;
					this.actionScopeId = actionScopeId;
					this.renderer = new UnstagedRenderer({actionScopeId: sectionItemActionScopeId, cachePrefix: "UnstagedNavigator", checkbox: true}, this);
					this.createTree(this.parentId, new UnstagedModel());
				}
				
				UnstagedNavigator.prototype = new mExplorer.Explorer();
			
				return UnstagedNavigator;
			}());
			
			new UnstagedNavigator(this.registry, mySelectionService, "unstagedNode"/*tableNode.id*/, sectionItemActionScopeId);
		};
		
//		GitStatusExplorer.prototype.renderUnstagedChange = function(unstagedSortedChange, index, unstageSection){
//			
//			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem lightTreeTableRow" }, "unstagedNode");
//			extensionListItem._item = unstagedSortedChange;
//			
//			var detailsView = dojo.create( "div", { "class":"stretch"}, extensionListItem );
//			
//			detailsView.appendChild(this._createCheckbox("", unstageSection));
//			dojo.create( "span", { "class":"sectionIcon " + this._model.getClass(unstagedSortedChange.type) }, detailsView );
//			dojo.create( "span", { "class":"gitMainDescription", innerHTML: unstagedSortedChange.path }, detailsView );
//
//			var commandService = this.registry.getService("orion.page.command");
//			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.stageCommand", 100);
//			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.checkoutCommand", 200);
//
//			var actionsArea = dojo.create( "div", {"id":"unstagedActionsArea", "class":"sectionTableItemActions" }, extensionListItem );
//			this.commandService.renderCommands(this.actionScopeId, actionsArea, {type: "fileItem", object: unstagedSortedChange}, this, "tool");
//		};
		
		// Git staged changes
		
		GitStatusExplorer.prototype.displayStaged = function(status){

			var tableNode = dojo.byId( 'table' );

			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"stagedSectionHeader"}, tableNode );
			
			var stagedSortedChanges = this._sortBlock(this._model.interestedStagedGroup);
			
			dojo.create( "div", { id: "stagedSectionTitle", "class":"layoutLeft", 
				innerHTML: (stagedSortedChanges.length > 0 ? "Staged" : "No Staged Changes")}, titleWrapper );
			var actionsArea = dojo.create( "div", { id: "stagedSectionActionsArea", "class":"layoutRight sectionActions"}, titleWrapper );
			
			var parentId = "stagedSectionHeader";
			
			var slideout = 
				'<div id="' + parentId + 'slideContainer" class="layoutBlock slideParameters slideContainer">' +
					'<span id="' + parentId + 'slideOut" class="slide">' +
					   '<span id="' + parentId + 'pageCommandParameters" class="parameters"></span>' +
					   '<span id="' + parentId + 'pageCommandDismiss" class="parametersDismiss"></span>' +
					'</span>' +
				'</div>';
		
		
			dojo.place( slideout, titleWrapper );
			
			var commandService = this.registry.getService("orion.page.command");
			commandService.registerCommandContribution("stagedSectionActionsArea", "eclipse.orion.git.unstageCommand", 100);
			commandService.registerCommandContribution("stagedSectionActionsArea", "eclipse.orion.git.commitCommand", 200);
			commandService.renderCommands("stagedSectionActionsArea", actionsArea, status, this, "button");

			var content =
				'<div class="sectionTable">' +
					'<div class="plugin-settings">' +
						'<list id="stagedNode" class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';
	
			dojo.place( content, tableNode );
			
			for(var i=0; (i<stagedSortedChanges.length);i++){
				this.renderStagedChange(stagedSortedChanges[i], i);
			}
		};
		
		GitStatusExplorer.prototype.renderStagedChange = function(stagedSortedChange, index){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow")  }, "stagedNode");
			var horizontalBox = dojo.create( "div", null, extensionListItem );
			
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox );
			
			dojo.create( "span", { "class":"sectionIcon " + this._model.getClass(stagedSortedChange.type) }, detailsView );
			dojo.create( "span", { "class":"gitMainDescription", innerHTML: stagedSortedChange.path }, detailsView );
			
			var commandService = this.registry.getService("orion.page.command");
			commandService.registerCommandContribution("itemLevelCommands", "eclipse.orion.git.unstageCommand", 100);

			var actionsArea = dojo.create( "div", {"id":"stagedActionsArea", "class":"sectionTableItemActions" }, horizontalBox );
			this.commandService.renderCommands(this.actionScopeId, actionsArea, {type: "fileItem", object: stagedSortedChange}, this, "tool");
		};
				
		// Git diffs
		
		GitStatusExplorer.prototype.displayDiffs = function(status){
			var allSortedChanges = this._sortBlock(this._model.interestedUnstagedGroup.concat(this._model.interestedStagedGroup));
			
			for(var i=0; (i<allSortedChanges.length && i<10);i++){
				this.renderDiff(allSortedChanges[i], i);
			}
		}
		
		GitStatusExplorer.prototype.renderDiff = function(change, index){

			var tableNode = dojo.byId( 'table' );
	
			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"diffSectionHeader_" + index}, tableNode );
			
			// add diff details
			
			dojo.create( "span", { "class":"sectionIcon " + this._model.getClass(change.type) }, titleWrapper );
			dojo.create( "div", { id: "diffSectionTitle", "class":"layoutLeft", innerHTML: change.name}, titleWrapper );
			var diffCompareActionsArea = dojo.create( "div", {"id":"diffCompareActionsArea_" + index, "class":"sectionTableItemActions"}, titleWrapper, "last" );
			dojo.create( "div", { id: "diffActionsArea_" + index, "class":"layoutRight sectionActions"}, titleWrapper );
			
			var content =
				'<div class="sectionTable">' +
					'<div class="plugin-settings">' +
						'<list id="diffNode_' + index + '"class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';

			dojo.place( content, tableNode );
			
//			this.commandService.renderCommands(this.actionScopeId, actionsArea, diff, this, "tool", false);	
			
			// add inline compare view
			
			var diffItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("diffNode_" + index) );
			var diffHorizontalBox = dojo.create( "div", null, diffItem );
			
			dojo.create( "div", { "id":"diffArea_" + index, "style":"height:420px;border:1px solid lightgray;overflow: hidden"}, diffHorizontalBox);

			var diffProvider = new mCompareContainer.DefaultDiffProvider(this.registry);
			
			var diffOptions = {
				commandSpanId: diffCompareActionsArea.id,
				diffProvider: diffProvider,
				hasConflicts: false,
				readonly: true,
				complexURL: change.diffURI,
				callback : function(){}
			};
			
			var inlineCompareContainer = new mCompareContainer.toggleableCompareContainer(this.registry, "diffArea_" + index, "inline", diffOptions);
			var that = this;
			inlineCompareContainer.startup( function(){
//				if(index < (diffs.length -1 )){
//					that.renderDiff(diffs, index+1);
//				}
			});
		};
		
		// Git commits
		
		GitStatusExplorer.prototype.displayCommits = function(repository){
					
			var that = this;
			
			var tableNode = dojo.byId( 'table' );

			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"commitSectionHeader"}, tableNode );
			
			dojo.create( "div", { id: "commitSectionTitle", "class":"layoutLeft", innerHTML: "Commits" }, titleWrapper );
			dojo.create( "div", { id: "commitSectionProgress", "class": "sectionProgress layoutLeft", innerHTML: "..."}, titleWrapper );
			dojo.create( "div", { id: "commitSectionActionsArea", "class":"layoutRight sectionActions"}, titleWrapper );
			
			var parentId = "commitSectionHeader";
			
			var slideout = 
				'<div id="' + parentId + 'slideContainer" class="layoutBlock slideParameters slideContainer">' +
					'<span id="' + parentId + 'slideOut" class="slide">' +
					   '<span id="' + parentId + 'pageCommandParameters" class="parameters"></span>' +
					   '<span id="' + parentId + 'pageCommandDismiss" class="parametersDismiss"></span>' +
					'</span>' +
				'</div>';
		
		
			dojo.place( slideout, titleWrapper );

			var content =	
				'<div class="sectionTable" role="region" aria-labelledby="commitSectionTitle">' +
					'<div class="plugin-settings">' +
						'<list id="commitNode" class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';
			
			dojo.place( content, tableNode );

			this.registry.getService("orion.git.provider").getGitBranch(repository.BranchLocation).then(
				function(resp){
					var branches = resp.Children;
					var currentBranch;
					for (var i=0; i<branches.length; i++){
						if (branches[i].Current){
							currentBranch = branches[i];
							break;
						}
					}
					
					var tracksRemoteBranch = (currentBranch.RemoteLocation.length == 1 && currentBranch.RemoteLocation[0].Children.length === 1);
					
					dojo.byId("commitSectionTitle").innerHTML = "Commits for \"" + currentBranch.Name + "\" branch";
					
					that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.repositories.viewAllCommand", 10);
					that.commandService.renderCommands("commitSectionActionsArea", dojo.byId("commitSectionActionsArea"), 
						{"ViewAllLink":"/git/git-log.html#" + currentBranch.CommitLocation + "?page=1", "ViewAllLabel":"See Full Log", "ViewAllTooltip":"See the full log"}, that, "button");
							
					if (tracksRemoteBranch){
						that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.fetch", 100);
						that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.merge", 100);
						that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.rebase", 100);
						that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.resetIndex", 100);
						that.commandService.renderCommands("commitSectionActionsArea", dojo.byId("commitSectionActionsArea"), currentBranch.RemoteLocation[0].Children[0], that, "button"); 
					};
					
					that.commandService.registerCommandContribution("commitSectionActionsArea", "eclipse.orion.git.push", 100);
					that.commandService.renderCommands("commitSectionActionsArea", dojo.byId("commitSectionActionsArea"), currentBranch, that, "button"); 
					
					if (currentBranch.RemoteLocation[0] == null){
						dojo.style(dojo.byId("commitSectionProgress"), "visibility", "hidden");
						that.renderNoCommit();
						return;
					};
					
					if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
						that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then(
							function(resp){
								dojo.style(dojo.byId("commitSectionProgress"), "visibility", "hidden");
								
								var commitsCount = resp.Children.length;
								
								for (var i=0; i<resp.Children.length; i++){
									that.renderCommit(resp.Children[i], true, i);
								}
								
								that.registry.getService("orion.git.provider").getLog(currentBranch.CommitLocation + "?page=1&pageSize=20", currentBranch.RemoteLocation[0].Children[0].Id).then( 
									function(resp){	
										for (var i=0; i<resp.Children.length; i++){
											that.renderCommit(resp.Children[i], false, i + commitsCount);
										}
										
										commitsCount = commitsCount + resp.Children.length; 
										
										if (commitsCount == 0)
											that.renderNoCommit();
									}
								);	
							}
						);
					} else {
						that.registry.getService("orion.git.provider").doGitLog(currentBranch.CommitLocation + "?page=1&pageSize=20").then( 
							function(resp){	
								dojo.style(dojo.byId("commitSectionProgress"), "visibility", "hidden");
							
								for (var i=0; i<resp.Children.length; i++){
									that.renderCommit(resp.Children[i], true, i);
								}
								
								if (resp.Children.length == 0)
									that.renderNoCommit();
							}
						);	
					}
				}
			);
		};
		
		GitStatusExplorer.prototype.renderNoCommit = function(){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("commitNode") );
			var horizontalBox = dojo.create( "div", null, extensionListItem );
			
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox );
			var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: "The branch is up to date."}, detailsView );
			dojo.create( "div", null, detailsView );
			
			var description = dojo.create( "span", { "class":"gitSecondaryDescription", 
				innerHTML: "You have no outgoing or incoming commits."}, detailsView );	
		};
			
		GitStatusExplorer.prototype.renderCommit = function(commit, outgoing, index){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, dojo.byId("commitNode") );
			var horizontalBox = dojo.create( "div", null, extensionListItem );
			
			var imgSpriteName = (outgoing ? "git-sprite-outgoing_commit" : "git-sprite-incoming_commit");
			
			dojo.create( "span", { "class":"sectionIcon gitImageSprite " + imgSpriteName}, horizontalBox );
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"class":"git-author-icon"}, horizontalBox);
				
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 30;
				image.height = 30;
				dojo.place(image, authorImage, "first");
			}
			
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox );
			
			var titleLink = dojo.create("a", {"class": "gitMainDescription navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, detailsView);
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
			    	clearTimeout(_timer);
	            }
			});
			
			dojo.connect(titleLink, "onmouseover", titleLink, function() {
				clearTimeout(_timer);
				
				_timer = setTimeout(function(){
					dijit.popup.open({
						popup: tooltipDialog,
						around: titleLink,
						orient: {'BR':'TL', 'TR':'BL'}
					});
				}, 600);
			});
			
			dojo.connect(titleLink, "onmouseout", titleLink, function() {
				clearTimeout(_timer);
				
				_timer = setTimeout(function(){
					if(dijit.popup.hide)
						dijit.popup.hide(tooltipDialog); //close doesn't work on FF
					dijit.popup.close(tooltipDialog);
				}, 200);
			});
			
			dojo.create( "div", null, detailsView );
			var description = dojo.create( "span", { "class":"gitSecondaryDescription", 
				innerHTML: " (SHA " + commit.Name + ") by " + commit.AuthorName 
				+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView );
			
			var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox );
			this.commandService.renderCommands(this.actionScopeId, actionsArea, commit, this, "tool");	
		};		

		return GitStatusExplorer;
	}());
	
	return exports;
}); // end of define
