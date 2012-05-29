/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console document Image*/

define(['i18n!git/nls/gitmessages', 'dojo', 'orion/section', 'orion/explorer', 'orion/i18nUtil', 'orion/globalCommands', 'orion/compare/diff-provider', 
        'orion/compare/compare-container', 'orion/git/gitCommands', 'orion/navigationUtils'], 
		function(messages, dojo, mSection, mExplorer, i18nUtil, mGlobalCommands, mDiffProvider , mCompareContainer, mGitCommands, mNavUtils) {
	var exports = {};

	exports.GitCommitExplorer = (function() {

		/**
		 * Creates a new Git commit explorer.
		 * @class Git commit explorer
		 */
		function GitCommitExplorer(registry, commandService, linkService, selection, parentId, toolbarId, selectionToolsId, actionScopeId){
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
		
		GitCommitExplorer.prototype.handleError = function(error) {
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
		
		GitCommitExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};
		
		GitCommitExplorer.prototype.redisplay = function(){
			this.display(dojo.hash());
		};
		
		GitCommitExplorer.prototype.display = function(location){
			var that = this;
			var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$

			var loadingDeferred = new dojo.Deferred();
			progressService.showWhile(loadingDeferred, messages["Loading..."]);
			this.registry.getService("orion.git.provider").getGitClone(location).then( //$NON-NLS-0$
				function(resp){					
					if (resp.Children.length === 0) {
						loadingDeferred.callback();
						that.initTitleBar();
						that.displayCommit();
					} else if (resp.Children.length === 1 && resp.Children[0].Type === "Commit") { //$NON-NLS-0$
						var commits = resp.Children;
						
						that.registry.getService("orion.git.provider").getGitClone(resp.CloneLocation).then( //$NON-NLS-0$
							function(resp){
								loadingDeferred.callback();
								var repositories = resp.Children;
								
								that.initTitleBar(commits[0], repositories[0]);
				
								that.displayCommit(commits[0]);
								that.displayTags(commits[0]);
								that.displayDiffs(commits[0]);
								
								commits[0].CloneLocation = repositories[0].Location;
								
								// render commands
								mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", commits[0]); //$NON-NLS-1$ //$NON-NLS-0$
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
		
		GitCommitExplorer.prototype.initTitleBar = function(commit, repository){
			var that = this;
			var item;
			var pageTitle;
			
			if (commit){
				item = {};
				item.Name = commit.Name;
				item.Parents = [];
				item.Parents[0] = {};
				item.Parents[0].Name = repository.Name;
				item.Parents[0].Location = repository.Location;
				item.Parents[0].ChildrenLocation = repository.Location;
				item.Parents[1] = {};
				item.Parents[1].Name = messages["Repositories"];
			}
			mGlobalCommands.setPageTarget({task: "Commit", target: repository, 
				breadcrumbTarget: item, 
				makeBreadcrumbLink: function(seg, location) {
					seg.href = "/git/git-repository.html#" + (location ? location : ""); //$NON-NLS-0$
				},
				serviceRegistry: this.registry, commandService: this.commandService});
		};
		
		GitCommitExplorer.prototype.displayCommit = function(commit){
			
			var tableNode = dojo.byId( 'table' );	 //$NON-NLS-0$
			dojo.empty( tableNode );
						
			if (!commit){
				var titleWrapper = new mSection.Section(tableNode, {
					id: "commitSection", //$NON-NLS-0$
					title: messages["No Commits"],
					iconClass: "gitImageSprite git-sprite-modification", //$NON-NLS-0$
				});
				return;
			}

			var contentParent = dojo.create("div", {"role": "region", "class":"sectionTable"}, tableNode, "last");
			contentParent.innerHTML = '<list id="commitNode" class="mainPadding"></list>'; //$NON-NLS-0$

		    var list = dojo.byId( "commitNode" );		 //$NON-NLS-0$
			
		    var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, list ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
			var detailsView = dojo.create( "div", null, horizontalBox ); //$NON-NLS-0$
			
			var commitMessages = this._splitCommitMessage(commit.Message);

			var div = dojo.create( "div", null, detailsView ); //$NON-NLS-0$
			var mainCommitMessage = dojo.create( "span", { "class":"gitMainDescription"}, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.registry.getService("orion.core.textlink").addLinks(commitMessages[0], mainCommitMessage); //$NON-NLS-0$
			dojo.create( "div", {"style":"padding-top:15px"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (commitMessages[1] !== null){
				var secondaryCommitMessage = dojo.create( "pre", null, detailsView ); //$NON-NLS-0$
				this.registry.getService("orion.core.textlink").addLinks(commitMessages[1], secondaryCommitMessage); //$NON-NLS-0$
				dojo.create( "div", {"style":"padding-top:15px"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
						
			dojo.create( "span", { "class":"gitSecondaryDescription", innerHTML: i18nUtil.formatMessage(messages["commit: 0"], commit.Name)}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, detailsView ); //$NON-NLS-0$
				
				var parentMessage = dojo.create( "span", { "class":"gitSecondaryDescription"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				var temp = dojo.create("span"); //$NON-NLS-0$
				var link = dojo.create("a", {className: "pnavlinkonpage", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, temp); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
				parentMessage.innerHTML = i18nUtil.formatMessage(messages["parent: 0"], temp.innerHTML);
			}
			
			dojo.create( "div", {"style":"padding-top:15px"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"class":"git-author-icon-small"}, detailsView); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 35;
				image.height = 35;
				dojo.place(image, authorImage, "first"); //$NON-NLS-0$
			}
			
			dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: i18nUtil.formatMessage(messages["authored by 0 (1) on 2"], commit.AuthorName, commit.AuthorEmail, dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"}))}, detailsView ); //$NON-NLS-1$
			
			dojo.create( "div", null, detailsView ); //$NON-NLS-0$
			dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: i18nUtil.formatMessage(messages["committed by 0 (1)"],  commit.CommitterName, commit.CommitterEmail)}, detailsView );
		};
		
		GitCommitExplorer.prototype._splitCommitMessage = function(commitMessage){
			var cut = false;
			var mainMessageMaxLength = 100;
			
			var commitMessage0 = commitMessage.split(/(\r?\n|$)/)[0].trim();
			if (commitMessage0.length > mainMessageMaxLength){
				var cutPoint = commitMessage0.indexOf(" ", mainMessageMaxLength - 10); //$NON-NLS-0$
				commitMessage0 = commitMessage0.substring(0, (cutPoint !== -1 ? cutPoint : mainMessageMaxLength));
				cut = true;
			};
			
			var commitMessage1 = commitMessage.substring(commitMessage0.length + 1, commitMessage.length).trim();
			if (commitMessage1.length > 0){
				commitMessage1 = (cut ? "..." + commitMessage1 : commitMessage1); //$NON-NLS-0$
			} else {
				commitMessage1 = null;
			}
			
			commitMessage0 += (cut ? "..." : ""); //$NON-NLS-0$
			
			return [commitMessage0, commitMessage1];
		};
		
		// Git tags

		GitCommitExplorer.prototype.displayTags = function(commit){
			var tags = commit.Tags;
			
			var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$

			var titleWrapper = new mSection.Section(tableNode, {
				id: "tagSection", //$NON-NLS-0$
				title: ((tags && tags.length > 0) ? messages["Tags:"] : messages["No Tags"]),
				iconClass: "gitImageSprite git-sprite-tag", //$NON-NLS-0$
				slideout: true,
				content: '<list id="tagNode"></list>', //$NON-NLS-0$
				canHide: true,
				preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
			}); 
			
			this.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.addTag", 100); //$NON-NLS-0$
			this.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode, commit, this, "button"); //$NON-NLS-0$
			
			if (!tags && tags.length > 0)
				return;
			
			for(var i=0; (i<tags.length && i<10);i++){
				this.renderTag(tags[i]);
			}
		};

		GitCommitExplorer.prototype.renderTag = function(tag){
			var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("tagNode") ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$

			var detailsView = dojo.create( "div", {"class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: tag.Name }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

			dojo.create( "div", null, horizontalBox ); //$NON-NLS-0$

			var actionsArea = dojo.create( "div", {"id":"tagActionsArea", "class":"sectionTableItemActions"}, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			this.commandService.renderCommands(this.actionScopeId, actionsArea, tag, this, "tool", false);	 //$NON-NLS-0$
		};
		
		// Git diffs
		
		GitCommitExplorer.prototype.displayDiffs = function(commit){
			
			var that = this;
			
			var diffs = commit.Diffs;
			
			var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
			
			var section = new mSection.Section(tableNode, {
				id: "diffSection", //$NON-NLS-0$
				title: messages["Diffs"],
				content: '<div id="diffNode"></div>', //$NON-NLS-0$
				canHide: true,
				preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
			});
			
			var sectionItemActionScopeId = "diffSectionItemActionArea"; //$NON-NLS-0$
			
			DiffModel = (function() {
				function DiffModel() {
				}
				
				DiffModel.prototype = {
					destroy: function(){
					},
					getRoot: function(onItem){
						onItem(diffs);
					},
					getChildren: function(parentItem, onComplete){	
						if (parentItem instanceof Array && parentItem.length > 0) {
							onComplete(parentItem);
						} else if (parentItem.Type === "Diff") {
							if(!parentItem.children){//lazy creation, this is required for selection model to be able to trverse into children
								parentItem.children = [];
								parentItem.children.push({parent: parentItem}); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							}
							onComplete(parentItem.children); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							//onComplete([{parent: parentItem}]); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						} else {
							onComplete([]);
						}
					},
					getId: function(/* item */ item){
						if (item instanceof Array && item.length > 0) {
							return "diffRoot"; //$NON-NLS-0$
						} else if (item.Type === "Diff") {
							return "diff" + item.DiffLocation; //$NON-NLS-0$
						} else {
							return "diffWidget" + item.DiffLocation; //$NON-NLS-0$
						}
					}
				};
				
				return DiffModel;
			}());
			
			DiffRenderer = (function() {
				function DiffRenderer (options, explorer) {
					this._init(options);
					this.options = options;
					this.explorer = explorer;
					this.registry = options.registry;
				}
				
				DiffRenderer.prototype = new mExplorer.SelectionRenderer();

				DiffRenderer.prototype.getCellElement = function(col_no, item, tableRow){					
					switch(col_no){
					case 0:		
						if (item.Type === "Diff"){
							var td = document.createElement("td"); //$NON-NLS-0$
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							
							var path = item.OldPath;
						    var sprite = "git-sprite-modification"; //$NON-NLS-0$
							if (item.ChangeType === "ADD"){ //$NON-NLS-0$
								path = item.NewPath;
								sprite = "git-sprite-addition"; //$NON-NLS-0$
							} else if (item.ChangeType === "DELETE"){ //$NON-NLS-0$
								sprite = "git-sprite-removal"; //$NON-NLS-0$
							}
							
							this.getExpandImage(tableRow, div, "gitImageSprite", sprite); //$NON-NLS-0$
							
							var itemLabel = dojo.create( "span", { "class":"gitMainDescription", innerHTML: path }, div ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							
							return td;
						} else {
							var td = document.createElement("td"); //$NON-NLS-0$
							td.colSpan = 2;
							var div = dojo.create( "div", {"class" : "sectionTableItem"}, td ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							var actionsWrapper = dojo.create( "div", {"class": "sectionExplorerActions"}, div);
							var diffActionWrapper = dojo.create("span", {id: "diff" + item.parent.DiffLocation + "DiffActionWrapper"}, actionsWrapper, "last");
							var compareWidgetActionWrapper = dojo.create("span", {id: "diff" + item.parent.DiffLocation + "CompareWidgetActionWrapper"}, actionsWrapper, "last");
							
							dojo.create( "div", { "id":"diffArea_" + item.parent.DiffLocation, "style":"height:420px; border:1px solid lightgray; overflow: hidden"}, div); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							var navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
							window.setTimeout(function(){
								var diffProvider = new mCompareContainer.DefaultDiffProvider(that.registry);
								var diffOptions = {
									navGridHolder: navGridHolder,
									commandSpanId: compareWidgetActionWrapper.id,
									diffProvider: diffProvider,
									hasConflicts: false,
									readonly: true,
									editableInComparePage: true,
									complexURL: item.parent.DiffLocation,
									callback : function(){
										dojo.empty(diffActionWrapper.id);
										that.commandService.renderCommands("itemLevelCommands", diffActionWrapper.id, item.parent, that, "tool", false); //$NON-NLS-0$
									}
								};
								
								var inlineCompareContainer = new mCompareContainer.toggleableCompareContainer(that.registry, "diffArea_" + item.parent.DiffLocation, "inline", diffOptions); //$NON-NLS-1$ //$NON-NLS-0$
								inlineCompareContainer.startup( function(maxHeight){
									var vH = 420;
									if(maxHeight < vH){
										vH = maxHeight;
									}
									dojo.style("diffArea_" + item.parent.DiffLocation, "height", vH + "px"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								});
							}, 500);
							
							return td;
						}

						break;
					case 1:
						// Create an actions column that the compare container can use.  We don't render any commands in here, the container will.
//						if (item.Type === "Diff"){
//							var actionsColumn = document.createElement('td'); //$NON-NLS-0$
//							
//							actionsColumn.id = tableRow.id + "ActionsWwrapper"; //$NON-NLS-0$
//							dojo.addClass(actionsColumn, "sectionExplorerActions"); //$NON-NLS-0$
//							
//							dojo.create("div", {"class": "sectionTableItemActions", id: "diff" + item.DiffLocation + "DiffWidgetActionsWrapper"}, actionsColumn, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//							dojo.create("div", {"class": "sectionTableItemActions", id: "diff" + item.DiffLocation + "DiffActionsWrapper"}, actionsColumn, "last"); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
//							
//							return actionsColumn;
//						}
						break;
					}
				};
				
				return DiffRenderer;
			}());
			
			DiffNavigator = (function() {
				function DiffNavigator(registry, selection, parentId, actionScopeId) {
					this.registry = registry;
					this.checkbox = false;
					this.parentId = parentId;
					this.selection = selection;
					this.actionScopeId = actionScopeId;
					this.renderer = new DiffRenderer({registry: this.registry, actionScopeId: sectionItemActionScopeId, cachePrefix: "DiffNavigator", checkbox: false}, this); //$NON-NLS-0$
					this.createTree(this.parentId, new DiffModel(), {selectionPolicy: "cursorOnly"});
				}
				
				DiffNavigator.prototype = new mExplorer.Explorer();
			
				DiffNavigator.prototype.isRowSelectable = function(modelItem){
					return modelItem.Type === "Diff";
				};
				return DiffNavigator;
			}());
			
			new DiffNavigator(this.registry, null, "diffNode", sectionItemActionScopeId); //$NON-NLS-0$
		};

		return GitCommitExplorer;
	}());
	
	return exports;
}); // end of define
