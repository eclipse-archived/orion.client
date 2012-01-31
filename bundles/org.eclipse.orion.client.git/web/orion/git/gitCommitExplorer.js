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

define(['dojo', 'orion/explorer', 'orion/util', 'orion/compare/diff-provider', 'orion/compare/compare-container', 'orion/breadcrumbs', 'orion/git/gitCommands'], 
		function(dojo, mExplorer, mUtil, mDiffProvider , mCompareContainer, mBreadcrumbs, mGitCommands) {
	var exports = {};

	exports.GitCommitExplorer = (function() {

		/**
		 * Creates a new Git commit explorer.
		 * @class Git commit explorer
		 */
		function GitCommitExplorer(registry, linkService, selection, parentId, toolbarId, selectionToolsId){
			this.parentId = parentId;
			this.registry = registry;
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
			var pageTitle = dojo.byId("pageTitle");
			var item = {};
			
			if (commit){
				pageTitle.innerHTML = "Git Commit";
				
				item.Name = commit.Name;
				item.Parents = [];
				item.Parents[0] = {};
				item.Parents[0].Name = repository.Name;
				item.Parents[0].Location = repository.Location;
				item.Parents[0].ChildrenLocation = repository.Location;
				item.Parents[1] = {};
				item.Parents[1].Name = "Repositories";
			} else {
				pageTitle.innerHTML = "Git Commit";
				
				item.Name = "";
			}
			
			var location = dojo.byId("location");
			var breadcrumb = new mBreadcrumbs.BreadCrumbs({
				container: location,
				resource: item,
				makeHref:function(seg, location){
					that.makeHref(seg, location);
				}
			});		
		};
		
		GitCommitExplorer.prototype.makeHref = function(seg, location) {
			seg.href = "/git/git-repository.html#" + (location ? location : "");
		};

		GitCommitExplorer.prototype.displayCommit = function(commit){
			
			var tableNode = dojo.byId( 'table' );	
			dojo.empty( tableNode );
			var titleWrapper = dojo.create( "div", {"class":"pluginwrapper"}, tableNode );	
			var item = { id: "Plugins", "class":"pluginTitle", innerHTML: (commit ? "Commit Details" :  "No Commits") };
			dojo.create( "div", item, titleWrapper );
			
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
			var icon = dojo.create( "span", { "class":"git-decor-icon gitImageSprite git-sprite-modification"}, horizontalBox );
			var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox );
			
			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"class":"git-author-icon"}, detailsView);
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 50;
				image.height = 50;
				dojo.place(image, authorImage, "first");
			}
			
			dojo.create( "div", {"style":"padding-top:10px"}, detailsView );
			dojo.create( "span", { "class":"plugin-description", innerHTML: " commit: " + commit.Name}, detailsView );
			
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, detailsView );
				
				dojo.place(document.createTextNode("parent: "), detailsView);
				link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, detailsView);
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
			}
			
			dojo.create( "div", {"style":"padding-top:10px"}, detailsView );
			dojo.create( "span", { "class":"plugin-description", 
				innerHTML: " authored by " + commit.AuthorName + " (" + commit.AuthorEmail
				+ ") on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView );
			
			dojo.create( "div", null, detailsView );
			dojo.create( "span", { "class":"plugin-description", 
				innerHTML: "committed by " + commit.CommitterName  + " (" + commit.CommitterEmail + ")"}, detailsView );
			
			var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
			
			var div = dojo.create( "div", {"style":"padding-top:20px; padding-left:20px"}, detailsView );
			dojo.create( "span", { "class":"plugin-title", innerHTML: commitMessage0 }, div );
			
			var commitMessage1 = commit.Message.substring(commitMessage0.length + 1, commit.Message.length);
			
			if (commitMessage1.length > 0){
				div = dojo.create( "div", {"style":"padding-left:20px"}, detailsView );
				dojo.place(document.createTextNode(commitMessage1), div);
			}
		};
		
		// Git diffs
		
		GitCommitExplorer.prototype.displayDiffs = function(commit){
			var diffs = commit.Diffs;
			
			var tableNode = dojo.byId( 'table' );
			var titleWrapper = dojo.create( "div", {"class":"pluginwrapper"}, tableNode );
			var item = { id: "diffHeader", "class":"pluginTitle", innerHTML: "Diffs" };
			dojo.create( "div", item, titleWrapper );
			
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
			var extensionListItem = dojo.create( "div", { "class":"git-list-item" }, dojo.byId("diffNode") );
			var horizontalBox = dojo.create( "div", null, extensionListItem );

			var detailsView = dojo.create( "div", {"style":"height:420px"}, horizontalBox );
			
			var diffPath = diff.OldPath;
			
			if (diff.ChangeType === "ADD"){
				diffPath = diff.NewPath;
			}
			
			var title = dojo.create( "span", { "class":"plugin-title", innerHTML: diffPath + " (" + diff.ChangeType + ") " }, detailsView );
			
			var description = dojo.create( "div", { id:"diff_" + index , "style":"height: 90%"}, detailsView );
			
			var diffProvider = new mCompareContainer.DefaultDiffProvider(this.registry);
			
			var diffOptions = {
				readonly: true,
				diffProvider: diffProvider,
				callback : function(){}
			};
			
			var inlineCompareContainer = new mCompareContainer.InlineCompareContainer(this.registry, "diff_" + index, diffOptions);
			inlineCompareContainer.setOptions({hasConflicts: false, complexURL: diff.DiffLocation});
			inlineCompareContainer.setDiffTitle("Compare");
			inlineCompareContainer.startup();
		};
		
		// Git tags

		GitCommitExplorer.prototype.displayTags = function(commit){
			var tags = commit.Tags;
			
			var tableNode = dojo.byId( 'table' );
			var titleWrapper = dojo.create( "div", {"class":"pluginwrapper"}, tableNode );
			var item = { id: "Plugins", "class":"pluginTitle", innerHTML: ((tags && tags.length > 0) ? "Tags:" : "No Tags") };
			dojo.create( "div", item, titleWrapper );
			dojo.create( "div", { id: "tagSectionActionsArea", "class":"additions-light"}, titleWrapper );
			
			this.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.addTag", 2000, "tagSectionActionsArea");
			this.registry.getService("orion.page.command").renderCommands(dojo.byId("tagSectionActionsArea"), "dom", commit, this, "tool", false);
			
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

			dojo.create( "span", { "class":"git-decor-icon gitImageSprite git-sprite-tag" }, horizontalBox );

			var detailsView = dojo.create( "div", {"class":"stretch"}, horizontalBox );
			var title = dojo.create( "span", { "class":"plugin-title", innerHTML: tag.Name }, detailsView );

			dojo.create( "div", null, horizontalBox );

			var actionsArea = dojo.create( "div", {"id":"tagActionsArea", "class":"git-action-area"}, horizontalBox );
			this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", tag, this, "button", false);	
		};

		return GitCommitExplorer;
	}());
	
	return exports;
}); // end of define
