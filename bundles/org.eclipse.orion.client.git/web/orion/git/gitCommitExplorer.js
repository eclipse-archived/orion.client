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

/*global define console document */

define(['dojo', 'orion/explorer', 'orion/util', 'orion/globalCommands', 'orion/compare/diff-provider', 'orion/compare/compare-container', 'orion/breadcrumbs', 'orion/git/gitCommands'], 
		function(dojo, mExplorer, mUtil, mGlobalCommands, mDiffProvider , mCompareContainer, mBreadcrumbs, mGitCommands) {
	var exports = {};

	exports.GitCommitExplorer = (function() {

		/**
		 * Creates a new Git commit explorer.
		 * @class Git commit explorer
		 */
		function GitCommitExplorer(registry, commandService, linkService, selection, parentId, toolbarId, selectionToolsId){
			this.parentId = parentId;
			this.registry = registry;
			this.commandService = commandService;
			this.linkService = linkService;
			this.selection = selection;
			this.parentId = parentId;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = false;
		}
		
		GitCommitExplorer.prototype.handleError = function(error) {
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
		
		GitCommitExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};
		
		GitCommitExplorer.prototype.redisplay = function(){
			this.display(dojo.hash());
		};
		
		GitCommitExplorer.prototype.display = function(location){
			var that = this;
			var progressService = this.registry.getService("orion.page.message");

			progressService.setProgressMessage("Loading...");
			this.registry.getService("orion.git.provider").getGitClone(location).then(
				function(resp){					
					if (resp.Children.length === 0) {
						that.initTitleBar();
						that.displayCommit();
					} else if (resp.Children.length == 1 && resp.Children[0].Type === "Commit") {
						var commits = resp.Children;
						
						that.registry.getService("orion.git.provider").getGitClone(resp.CloneLocation).then(
							function(resp){
								var repositories = resp.Children;
								
								that.initTitleBar(commits[0], repositories[0]);
				
								that.displayCommit(commits[0]);
								that.displayTags(commits[0]);
								that.displayDiffs(commits[0]);
								
								commits[0].CloneLocation = repositories[0].Location;
								
								// render commands
								mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", commits[0]);
							}, function () {
								dojo.hitch(that, that.handleError)(error);
							}
						);
					}	
					progressService.setProgressMessage("");
				}, function(error){
					dojo.hitch(that, that.handleError)(error);
				}
			);
		};
		
		GitCommitExplorer.prototype.initTitleBar = function(commit, repository){
			var that = this;
			var item = {};
			var pageTitle;
			
			if (commit){
				item.Name = commit.Name;
				item.Parents = [];
				item.Parents[0] = {};
				item.Parents[0].Name = repository.Name;
				item.Parents[0].Location = repository.Location;
				item.Parents[0].ChildrenLocation = repository.Location;
				item.Parents[1] = {};
				item.Parents[1].Name = "Repositories";
				pageTitle = commit.Name + " on " + repository.Name + " - Git";
			} else {
				item.Name = "";
				pageTitle = "Git";
			}
			
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
		
		GitCommitExplorer.prototype.makeHref = function(seg, location) {
			seg.href = "/git/git-repository.html#" + (location ? location : "");
		};

		GitCommitExplorer.prototype.displayCommit = function(commit){
			
			var tableNode = dojo.byId( 'table' );	
			dojo.empty( tableNode );
			
			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"commitSectionHeader"}, tableNode );
			
			dojo.create( "span", { "class":"git-decor-icon gitImageSprite git-sprite-modification" }, titleWrapper );
			dojo.create( "div", { id: "commitSectionTitle", "class":"layoutLeft", innerHTML: (commit ? "Commit Details" :  "No Commits") }, titleWrapper );
			dojo.create( "div", { id: "commitSectionActionsArea", "class":"layoutRight sectionActions"}, titleWrapper );

			if (!commit)
				return;
			
			var content =	
				'<div class="git-table">' +
					'<div class="plugin-settings">' +
						'<list id="commitNode" class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';
			
			dojo.place( content, tableNode );

		    var list = dojo.byId( "commitNode" );		
			
		    var extensionListItem = dojo.create( "div", { "class":"git-list-item" }, list );
			var horizontalBox = dojo.create( "div", null, extensionListItem );
			var detailsView = dojo.create( "div", null, horizontalBox );
			
			var commitMessages = this._splitCommitMessage(commit.Message);
			
			var div = dojo.create( "div", null, detailsView );
			dojo.create( "span", { "class":"gitMainDescription", innerHTML: commitMessages[0] }, div );
			
			dojo.create( "div", {"style":"padding-top:15px"}, detailsView );
			
			if (commitMessages[1] !== null){
				div = dojo.create( "pre", null, detailsView );
				dojo.place(document.createTextNode(commitMessages[1]), div);
				dojo.create( "div", {"style":"padding-top:15px"}, detailsView );
			}
						
			dojo.create( "span", { "class":"gitSecondaryDescription", innerHTML: "commit: " + commit.Name}, detailsView );
			
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, detailsView );
				
				var parentMessage = dojo.create( "span", { "class":"gitSecondaryDescription"}, detailsView );
				
				dojo.place(document.createTextNode("parent: "), parentMessage);
				link = dojo.create("a", {className: "pnavlinkonpage", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, parentMessage);
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
			}
			
			dojo.create( "div", {"style":"padding-top:15px"}, detailsView );
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"class":"git-author-icon-small"}, detailsView);
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 35;
				image.height = 35;
				dojo.place(image, authorImage, "first");
			}
			
			dojo.create( "span", { "class":"gitSecondaryDescription", 
				innerHTML: "authored by " + commit.AuthorName + " (" + commit.AuthorEmail
				+ ") on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView );
			
			dojo.create( "div", null, detailsView );
			dojo.create( "span", { "class":"gitSecondaryDescription", 
				innerHTML: "committed by " + commit.CommitterName  + " (" + commit.CommitterEmail + ")"}, detailsView );
		};
		
		GitCommitExplorer.prototype._splitCommitMessage = function(commitMessage){
			var cut = false;
			var mainMessageMaxLength = 100;
			
			var commitMessage0 = commitMessage.split(/(\r?\n|$)/)[0].trim();
			if (commitMessage0.length > mainMessageMaxLength){
				var cutPoint = commitMessage0.indexOf(" ", mainMessageMaxLength - 10);
				commitMessage0 = commitMessage0.substring(0, (cutPoint !== -1 ? cutPoint : mainMessageMaxLength));
				cut = true;
			};
			
			var commitMessage1 = commitMessage.substring(commitMessage0.length + 1, commitMessage.length).trim();
			if (commitMessage1.length > 0){
				commitMessage1 = (cut ? "..." + commitMessage1 : commitMessage1);
			} else {
				commitMessage1 = null;
			}
			
			commitMessage0 += (cut ? "..." : "");
			
			return [commitMessage0, commitMessage1];
		};
		
		// Git diffs
		
		GitCommitExplorer.prototype.displayDiffs = function(commit){
			var diffs = commit.Diffs;
			
			var tableNode = dojo.byId( 'table' );

			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"diffSectionHeader"}, tableNode );
			
			dojo.create( "div", { id: "diffSectionTitle", "class":"layoutLeft", innerHTML: "Diffs" }, titleWrapper );
			dojo.create( "div", { id: "diffSectionActionsArea", "class":"layoutRight sectionActions"}, titleWrapper );
						
			var content =
				'<div class="git-table">' +
					'<div class="plugin-settings">' +
						'<list id="diffNode" class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';

			dojo.place( content, tableNode );
			
			for(var i=0; i<diffs.length; i++){
				this.renderDiff(diffs[i], i);
			}
		};

		GitCommitExplorer.prototype.renderDiff = function(diff, index){
			
			// add diff details
			
			var diffDetailsItem = dojo.create( "div", { "class":"git-list-item" }, dojo.byId("diffNode") );
			var diffDetailsHorizontalBox = dojo.create( "div", null, diffDetailsItem );

			var detailsView = dojo.create( "div", {"style":"float:left"}, diffDetailsHorizontalBox );
			var diffPath = diff.OldPath;
			if (diff.ChangeType === "ADD"){
				diffPath = diff.NewPath;
			}	
			dojo.create( "span", { "class":"gitMainDescription", innerHTML: diffPath + " (" + diff.ChangeType + ") " }, detailsView );

			var actionsArea = dojo.create( "div", {"id":"diffActionsArea_" + index, "class":"git-action-area"}, diffDetailsHorizontalBox );
			this.commandService.renderCommands(actionsArea, "object", diff, this, "tool", false);	
			
			// add inline compare view
			
			var diffItem = dojo.create( "div", { "class":"git-list-item" }, dojo.byId("diffNode") );
			var diffHorizontalBox = dojo.create( "div", null, diffItem );
			
			dojo.create( "div", { "id":"diffArea_" + index, "style":"height:420px"}, diffHorizontalBox );

			var diffProvider = new mCompareContainer.DefaultDiffProvider(this.registry);
			
			var diffOptions = {
				readonly: true,
				diffProvider: diffProvider,
				callback : function(){}
			};
			
			var inlineCompareContainer = new mCompareContainer.InlineCompareContainer(this.registry, "diffArea_" + index, diffOptions);
			inlineCompareContainer.setOptions({hasConflicts: false, complexURL: diff.DiffLocation});
			inlineCompareContainer.setDiffTitle("Compare");
			inlineCompareContainer.startup();
		};
		
		// Git tags

		GitCommitExplorer.prototype.displayTags = function(commit){
			var tags = commit.Tags;
			
			var tableNode = dojo.byId( 'table' );

			var titleWrapper = dojo.create( "div", {"class":"auxpaneHeading sectionWrapper toolComposite", "id":"tagSectionHeader"}, tableNode );
			
			dojo.create( "span", { "class":"git-decor-icon gitImageSprite git-sprite-tag" }, titleWrapper );
			dojo.create( "div", { id: "tagSectionTitle", "class":"layoutLeft", innerHTML: ((tags && tags.length > 0) ? "Tags:" : "No Tags") }, titleWrapper );
			dojo.create( "div", { id: "tagSectionActionsArea", "class":"layoutRight sectionActions"}, titleWrapper );

			var parentId = "tagSectionHeader";
			
			var slideout = 
				'<div id="' + parentId + 'slideContainer" class="layoutBlock slideParameters slideContainer">' +
					'<span id="' + parentId + 'slideOut" class="slide">' +
					   '<span id="' + parentId + 'pageCommandParameters" class="parameters"></span>' +
					   '<span id="' + parentId + 'pageCommandDismiss" class="parametersDismiss"></span>' +
					'</span>' +
				'</div>';
		
		
			dojo.place( slideout, titleWrapper );
			
			this.commandService.registerCommandContribution("eclipse.orion.git.addTag", 2000, "tagSectionActionsArea");
			this.commandService.renderCommands(dojo.byId("tagSectionActionsArea"), "dom", commit, this, "button", false);
			
			if (!tags && tags.length > 0)
				return;
			
			var content =
				'<div class="git-table">' +
					'<div class="plugin-settings">' +
						'<list id="tagNode" class="plugin-settings-list"></list>' +
					'</div>' +
				'</div>';

			dojo.place( content, tableNode );
			
			for(var i=0; (i<tags.length && i<10);i++){
				this.renderTag(tags[i]);
			}
		};

		GitCommitExplorer.prototype.renderTag = function(tag){
			var extensionListItem = dojo.create( "div", { "class":"git-list-item" }, dojo.byId("tagNode") );
			var horizontalBox = dojo.create( "div", null, extensionListItem );

			var detailsView = dojo.create( "div", {"class":"stretch"}, horizontalBox );
			var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: tag.Name }, detailsView );

			dojo.create( "div", null, horizontalBox );

			var actionsArea = dojo.create( "div", {"id":"tagActionsArea", "class":"git-action-area"}, horizontalBox );
			this.commandService.renderCommands(actionsArea, "object", tag, this, "tool", false);	
		};

		return GitCommitExplorer;
	}());
	
	return exports;
}); // end of define
