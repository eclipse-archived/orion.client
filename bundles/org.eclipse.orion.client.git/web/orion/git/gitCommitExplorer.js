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

define(['dojo', 'orion/explorer', 'orion/util', 'orion/compare/diff-provider', 'orion/compare/compare-container', 'orion/breadcrumbs'], 
		function(dojo, mExplorer, mUtil, mDiffProvider , mCompareContainer, mBreadcrumbs) {
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
		
		GitCommitExplorer.prototype.handleError = function(error, registry) {
			var display = {};
			display.Severity = "Error";
			display.HTML = false;
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.message;
			}
			registry.getService("orion.page.message").setProgressResult(display);
			
			if (error.status === 404) {
				// Create the page skeleton
				var repositoryPageSkeleton =
					"<div id=\"mainNode\" class=\"settings\">" +	
						"<div class=\"displayTable\">" + 
							"<h1>No Commits</h1>" +
						"</div>" + 
					"</div>";
				
				var parentNode = dojo.byId(this.parentId);
				dojo.place(repositoryPageSkeleton, parentNode, "only");
				
				this.initTitleBar();
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
						var commits = resp.Children;
						that.initTitleBar();
						
						that.displayCommits(repositories);
					} else if (resp.Children.length == 1 && resp.Children[0].Type === "Commit") {
						var commits = resp.Children;
						
						that.registry.getService("orion.git.provider").getGitClone(resp.CloneLocation).then(
							function(resp){
								var repositories = resp.Children;
								
								that.initTitleBar(commits[0], repositories[0]);
				
								that.displayCommit(commits[0]);
								that.displayTags(commits[0]);
								that.displayDiffs(commits[0]);
							}, function () {
								that.handleError(error, that.registry);
							}
						);
					}
					
					progressService.setProgressMessage("");
				}, function(error){
					that.handleError(error, that.registry);
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
			var that = this;
			
			// Create the page skeleton
			var commitPageSkeleton =
				"<div id=\"mainNode\" class=\"settings\">" +
					"<div class=\"displayTable\">" +
						"<h1>Commit Details:</h1>" +
						"<section class=\"extension-settings-content\">" +
							"<div class=\"extension-settings\">" +
								"<list id=\"commitNode\" class=\"extension-settings-list\"></list>" +
							"</div>" +
						"</section>" +
					"</div>" +
				"</div>";
			
			
			var parentNode = dojo.byId(this.parentId);
			dojo.place(commitPageSkeleton, parentNode, "only");
			
//			if (repositories.length === 0){
//				that.renderNoRepository();
//				return;
//			}
			
			var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("commitNode") );
			var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
			var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );

			var modification = dojo.create("span", null, horizontalBox);
			dojo.addClass(modification, "gitImageSprite");
			dojo.addClass(modification, "git-sprite-modification");

			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", {"style" : "vertical-align: top; padding: 5px;"}, horizontalBox);
				
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 50;
				image.height = 50;
				dojo.addClass(image, "gitAuthorImage");
				
				dojo.place(image, authorImage, "first");
			}
			
			var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
			
			dojo.create( "div", {"style":"padding-top:10px"}, detailsView );
			dojo.create( "span", { "class":"extension-description", innerHTML: " commit: " + commit.Name}, detailsView );
			
			if (commit.Parents && commit.Parents.length > 0){
				dojo.create( "div", null, detailsView );
				
				dojo.place(document.createTextNode("parent: "), detailsView);
				link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-commit.html#" + commit.Parents[0].Location + "?page=1&pageSize=1"}, detailsView);
				dojo.place(document.createTextNode(commit.Parents[0].Name), link);
			}
			
			dojo.create( "div", {"style":"padding-top:10px"}, detailsView );
			dojo.create( "span", { "class":"extension-description", 
				innerHTML: " authored by " + commit.AuthorName + " (" + commit.AuthorEmail
				+ ") on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView );
			
			dojo.create( "div", null, detailsView );
			dojo.create( "span", { "class":"extension-description", 
				innerHTML: "committed by " + commit.CommitterName  + " (" + commit.CommitterEmail + ")"}, detailsView );
			
			var commitMessage0 = commit.Message.split(/(\r?\n|$)/)[0];
			
			var div = dojo.create( "div", {"style":"padding-top:20px; padding-left:20px"}, detailsView );
			dojo.create( "span", { "class":"extension-title", innerHTML: commitMessage0 }, div );
			
			var commitMessage1 = commit.Message.substring(commitMessage0.length + 1, commit.Message.length);
			
			if (commitMessage1.length > 0){
				div = dojo.create( "div", {"style":"padding-left:20px"}, detailsView );
				dojo.place(document.createTextNode(commitMessage1), div);
			}
		};
		
		// Git diffs
		
		GitCommitExplorer.prototype.displayDiffs = function(commit){
			var diffs = commit.Diffs;
			
			var diffSkeleton =
			"<div class=\"displayTable\">" + 
				"<h1>Diffs</h1>" +
				"<section class=\"extension-settings-content\">" +
				"<div class=\"extension-settings\">" +
					"<list id=\"diffNode\" class=\"extension-settings-list\">" +
					"</list>" +
				"</div>" + 
				"</section>" + 
			"</div>";
			
			var parentNode = dojo.byId("mainNode");
			dojo.place(diffSkeleton, parentNode);
			
			for(var i=0; i<diffs.length; i++){
				this.renderDiff(diffs[i], i);
			}
		};

		GitCommitExplorer.prototype.renderDiff = function(diff, index){
			var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("diffNode") );
			var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
			var horizontalBox = dojo.create( "div", {"class":"hbox" }, extensionListItem );

			
			var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
			
			var diffPath = diff.OldPath;
			
			if (diff.ChangeType === "ADD"){
				diffPath = diff.NewPath;
			}
			
			var title = dojo.create( "span", { "class":"extension-title", innerHTML: diffPath + " (" + diff.ChangeType + ") " }, detailsView );
			
			var description = dojo.create( "div", { id:"diff_" + index , "class":"extension-description", "style":"height:400px"}, detailsView );
			
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
			
			var tagSkeleton;
			
			if (tags == null || tags.length === 0){
				tagSkeleton = 
					"<div class=\"displayTable\">" + 
						"<section style=\" width: 100%; border-bottom: 1px solid #EEEEEE; margin: 0; padding: 0;\">" +
						"<div class=\"vbox\" style=\"width: 100%\">" +
						"<div class=\"hbox\">" +
						"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">No Tags</h1></div>"+
						"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
						"</div>" +
						"</div>" +
						"</section>"
					"</div>";	
			} else {
				tagSkeleton = 
					"<div class=\"displayTable\">" + 
						"<section style=\" width: 100%; border-bottom: 1px solid #EEEEEE; margin: 0; padding: 0;\">" +
						"<div class=\"vbox\" style=\"width: 100%\">" +
						"<div class=\"hbox\">" +
						"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Tags</h1></div>"+
						"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
						"</div>" +
						"</div>" +
						"</section>" +		
						"<section class=\"extension-settings-content\">" +
						"<div class=\"extension-settings\">" +
							"<list id=\"tagNode\" class=\"extension-settings-list\">" +
							"</list>" +
						"</div>" + 
						"</section>" + 
					"</div>";	
			}
			
			
			
			var parentNode = dojo.byId("mainNode");
			dojo.place(tagSkeleton, parentNode);
			
			this.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.addTag", 2000, "tagSectionActionsArea");
			this.registry.getService("orion.page.command").renderCommands(dojo.byId("tagSectionActionsArea"), "dom", commit, this, "tool", false);

			for(var i=0; (i<tags.length && i<10);i++){
				this.renderTag(tags[i]);
			}
		};

		GitCommitExplorer.prototype.renderTag = function(tag){
			var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("tagNode") );
			var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
			var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );

			dojo.create( "span", { "class":"gitImageSprite git-sprite-tag" }, horizontalBox );

			var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
			var title = dojo.create( "span", { "class":"extension-title", innerHTML: tag.Name }, detailsView );

			var actionsArea = dojo.create( "div", {"id":"tagActionsArea"}, horizontalBox );
			this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", tag, this, "tool", false);	
		};

		return GitCommitExplorer;
	}());
	
	return exports;
}); // end of define
