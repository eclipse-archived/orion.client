/******************************************************************************* 
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console document */

define(['dojo', 'orion/explorer', 'orion/util'], function(dojo, mExplorer, mUtil) {
var exports = {};

exports.GitRepositoryExplorer = (function() {
	
	/**
	 * Creates a new Git repository explorer.
	 * @class Git repository explorer
	 */
	function GitRepositoryExplorer(registry, linkService, selection, parentId, toolbarId, selectionToolsId){
		this.parentId = parentId;
		this.registry = registry;
		this.linkService = linkService;
		this.selection = selection;
		this.parentId = parentId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.checkbox = false;
	}
	
	GitRepositoryExplorer.prototype.displayRepository = function(repositoryLocation){
		var that = this;
		var progressService = this.registry.getService("orion.page.message");
		
		// Create the page skeleton
		var repositoryPageSkeleton =
			"<div id=\"mainNode\" class=\"settings\">" +
				
				"<div class=\"displayTable\">" + 
					"<h1>Repository</h1>" +
					"<h2><a href=\"/git/git-repository.html#\">See all your repositories</a></h2>" +
					"<section class=\"extension-settings-content\">" +
					"<div class=\"extension-settings\">" +
						"<list id=\"repositoryNode\" class=\"extension-settings-list\">" +
						"</list>" +
					"</div>" + 
					"</section>" + 
				"</div>" + 
				
				
//				"<div class=\"displayTable\">" + 
//					"<h1>Working Directory</h1>" +
//					"<section class=\"extension-settings-content\">" +
//					"<div class=\"extension-settings\">" +
//						"<list id=\"workingDirectoryNode\" class=\"extension-settings-list\">" +
//						"</list>" +
//					"</div>" + 
//					"</section>" + 
//				"</div>" + 
				
//				"<div class=\"displayTable\">" + 
//				
//					"<section class=\"extension-settings-content\">" +
//					"<div class=\"extension-settings\">" +
//					"<list class=\"extension-settings-list\">" +
//					"<div class=\"vbox extension-list-item\">" +
//					"<div class=\"hbox\">" +
//					"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Branches</h1></div>"+
//					"<div id=\"branchSectionActionsArea\" class=\"pageActions\"></div>" +
//					"</div>" +
//					"</div>" +
//					"</div>" +
//					"</list>" +
//					"</section>" +
//					
//					"<h2><a href=\"/git/git-clone.html\">See all branches</a></h2>" +			
//					"<section class=\"extension-settings-content\">" +
//					"<div class=\"extension-settings\">" +
//						"<list id=\"branchNode\" class=\"extension-settings-list\">" +
//						"</list>" +
//					"</div>" + 
//					"</section>" + 
//				"</div>" + 
				
//				"<div class=\"displayTable\">" + 
//				
//					"<section class=\"extension-settings-content\">" +
//					"<div class=\"extension-settings\">" +
//					"<list class=\"extension-settings-list\">" +
//					"<div class=\"vbox extension-list-item\">" +
//					"<div class=\"hbox\">" +
//					"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Tags (10 most recent)</h1></div>"+
//					"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
//					"</div>" +
//					"</div>" +
//					"</list>" +
//					"</div>" +
//					"</section>" +
//
//					"<h2><a href=\"a\">See all tags</a></h2>" +
//					"<section class=\"extension-settings-content\">" +
//					"<div class=\"extension-settings\">" +
//						"<list id=\"tagNode\" class=\"extension-settings-list\">" +
//						"</list>" +
//					"</div>" + 
//					"</section>" + 
//				"</div>" + 
				
			"</div>";
		
		var parentNode = dojo.byId(this.parentId);
		dojo.place(repositoryPageSkeleton, parentNode, "only");
		
		progressService.setProgressMessage("Loading...");
		this.registry.getService("orion.git.provider").getGitClone(repositoryLocation).then(
			function(resp){
				if (resp.Children.length == 1) {
				
				
				var repository = resp.Children[0];
				that.displayRepositories(resp.Children);
				that.displayStatus(repository, repository.StatusLocation);
				that.displayBranches(repository.BranchLocation);
				that.displayTags(repository.TagLocation, repository);
				
				that.registry.getService("orion.page.command").registerCommandContribution("eclipse.addBranch2", 100, "branchSectionActionsArea");
				that.registry.getService("orion.page.command").renderCommands(dojo.byId("branchSectionActionsArea"), "dom", repository, this, "tool", false); 
				
//				that.registry.getService("orion.page.command").registerCommandContribution("eclipse.addTag", 100, "tagSectionActionsArea");
//				that.registry.getService("orion.page.command").renderCommands(dojo.byId("tagSectionActionsArea"), "dom", {}, this, "tool", false);  
				} else {
					that.displayRepositories(resp.Children, true);
					
					
					
				}
				
				progressService.setProgressMessage("");
			}, function(error){
				
			}
		);
	};
	
	// Git repo
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, links){
		for(var i=0; i<repositories.length;i++){
			this.renderRepository(repositories[i], links);
		}
	};
	
	GitRepositoryExplorer.prototype.renderRepository = function(repository, links){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("repositoryNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-repository" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view" }, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title"}, detailsView );
		
		if (links){
			link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-repository.html#" + repository.ContentLocation}, title);
			dojo.place(document.createTextNode(repository.Name), link);
		} else {
			dojo.place(document.createTextNode(repository.Name), title);
		}

		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", innerHTML: repository.GitUrl }, detailsView );
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", innerHTML: "location: root / testD" }, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"repositoryActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", repository, this, "button", false);
	};
	
	// Git status
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository, statusLocation){
		
		var statusSkeleton =
		"<div class=\"displayTable\">" + 
			"<h1>Working Directory</h1>" +
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
				"<list id=\"workingDirectoryNode\" class=\"extension-settings-list\">" +
				"</list>" +
			"</div>" + 
			"</section>" + 
		"</div>";
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(statusSkeleton, parentNode);
		
		var that = this;
		this.registry.getService("orion.git.provider").getGitBranch(statusLocation).then(
			function(resp){
				var status = resp;
				that.renderStatus(repository, status);
			}, function(error){
				
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderStatus = function(repository, status){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("workingDirectoryNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length;
		var staged = status.Changed.length + status.Added.length + status.Removed.length;
		var workspaceState = "You have no changes to commit."
		
		if (unstaged > 0 || staged > 0)
			workspaceState = "You have changes to commit in your workspace!"
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: workspaceState}, detailsView );
		dojo.create( "div", null, detailsView );
		
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: unstaged + " file(s) to stage and "
			+ staged + " file(s) to commit."}, detailsView );
				
		var actionsArea = dojo.create( "div", {"id":"statusActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", repository, this, "button", false);	
	};
	
	// Git branches
	
	GitRepositoryExplorer.prototype.decorateBranches = function(branches, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (branches.length > 0) {
			this.registry.getService("orion.git.provider").doGitLog(branches[0].CommitLocation + "?page=1&pageSize=1").then(
				function(resp){
					branches[0].Commit = resp.Children[0];
					that.decorateBranches(branches.slice(1), deferred);
				}
			);
		} else {
			deferred.callback();
		}
		
		return deferred;
	};
		
	GitRepositoryExplorer.prototype.displayBranches = function(branchLocation){
		
		var branchesSectionSkeleton = 
		"<div class=\"displayTable\">" + 
			
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
			"<list class=\"extension-settings-list\">" +
			"<div class=\"vbox extension-list-item\">" +
			"<div class=\"hbox\">" +
			"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Branches</h1></div>"+
			"<div id=\"branchSectionActionsArea\" class=\"pageActions\"></div>" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</list>" +
			"</section>" +
			
			"<h2><a href=\"/git/git-clone.html\">See all branches</a></h2>" +			
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
				"<list id=\"branchNode\" class=\"extension-settings-list\">" +
				"</list>" +
			"</div>" + 
			"</section>" + 
		"</div>";
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(branchesSectionSkeleton, parentNode);
		
		var that = this;
		
		dojo.empty("branchNode");
		dojo.byId("branchNode").innerHTML = "Loading...";

		this.registry.getService("orion.git.provider").getGitBranch(branchLocation).then(
			function(resp){
				var branches = resp.Children;
				that.decorateBranches(branches).then(
					function(){
						dojo.empty("branchNode");
						for(var i=0; (i<branches.length && i<5);i++){
							branches[i].ParentLocation = branchLocation;
							that.renderBranch(branches[i]);
						}
					}
				);
			}, function(error){
				
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderBranch = function(branch){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("branchNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-branch" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: branch.Name + (branch.Current ? " (Active)" : "") }, detailsView );
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: "tracks " + branch.RemoteLocation[0].Children[0].Name 
			+ ", last modified " + dojo.date.locale.format(new Date(branch.Commit.Time), {formatLength: "short"})
			+ " by " + branch.Commit.AuthorName}, detailsView );
		
		if (branch.Commit.AuthorImage) {
			var authorImage = dojo.create("span", null, description);
			
			var image = new Image();
			image.src = branch.Commit.AuthorImage;
			image.name = branch.Commit.AuthorName;
			image.width = 30;
			image.height = 30;
			dojo.addClass(image, "gitAuthorImage");
			
			dojo.place(image, authorImage, "first");
		}
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", branch, this, "button", false);	
	};
	
	// Git tags
	
	GitRepositoryExplorer.prototype.decorateTags = function(tags, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (tags.length > 0) {
			this.registry.getService("orion.git.provider").doGitLog(tags[0].CommitLocation + "?page=1&pageSize=1").then(
				function(resp){
					tags[0].Commit = resp.Children[0];
					that.decorateTags(tags.slice(1), deferred);
				}
			);
		} else {
			deferred.callback();
		}
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.displayTags = function(tagLocation, repository){
		
		var tagsSectionSkeleton = 
		"<div class=\"displayTable\">" + 
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
			"<list class=\"extension-settings-list\">" +
			"<div class=\"vbox extension-list-item\">" +
			"<div class=\"hbox\">" +
			"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Tags (10 most recent)</h1></div>"+
			"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
			"</div>" +
			"</div>" +
			"</list>" +
			"</div>" +
			"</section>" +
	
			"<h2><a href=\"a\">See all tags</a></h2>" +
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
				"<list id=\"tagNode\" class=\"extension-settings-list\">" +
				"</list>" +
			"</div>" + 
			"</section>" + 
		"</div>";
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(tagsSectionSkeleton, parentNode);
		
		var that = this;
		
		dojo.empty("tagNode");
		dojo.byId("tagNode").innerHTML = "Loading...";
		
		this.registry.getService("orion.git.provider").getGitBranch(tagLocation).then(
			function(resp){
				var tags = resp.Children.slice(0, 9);
				that.decorateTags(tags).then(
					function(){
						dojo.empty("tagNode");
						for(var i=0; i<tags.length ;i++){
							tags[i].Repository = repository;
							that.renderTag(tags[i]);
						};
					}
				);
			}, function(error){
				
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderTag = function(tag){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("tagNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-tag" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: tag.Name }, detailsView );
		
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description"}, detailsView );
		
		link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-commit.html#" + tag.Commit.Location + "?page=1&pageSize=1"}, description);
		dojo.place(document.createTextNode(tag.Commit.Message), link);	
		dojo.place(document.createTextNode(" by " + tag.Commit.AuthorName + " on " + 
			dojo.date.locale.format(new Date(tag.Commit.Time), {formatLength: "short"})), description, "last");

		var actionsArea = dojo.create( "div", {"id":"tagActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", tag, this, "button", false);	
	};
	
	return GitRepositoryExplorer;
}());

return exports;

// end of define
});
