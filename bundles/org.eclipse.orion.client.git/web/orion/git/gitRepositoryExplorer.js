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

define(['require', 'dojo', 'orion/explorer', 'orion/util', 'orion/breadcrumbs'], function(require, dojo, mExplorer, mUtil, mBreadcrumbs) {
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
	
	GitRepositoryExplorer.prototype.handleError = function(error, registry) {
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
						"<h1>Repository</h1>" +
						"<h2><a href=\"/git/git-repository.html#\">See all your repositories</a></h2>" +
						"<section class=\"extension-settings-content\">" +
						"<div class=\"extension-settings\">" +
							"<list id=\"repositoryNode\" class=\"extension-settings-list\">" +
								
								"<div class=\"extension-list-item-collaped\">" +
									"<div class=\"vbox extension-list-item\">" +
										"<div class=\"hbox\">" +
											"<div class=\"vbox stretch details-view\">" +
												"<span class=\"extension-title\">Repository does not exist.</span>" +
												"<div></div>" +
												"<span class=\"extension-description\">Go back to the full repository list.</span>" +
											"</div>" +
											"<div id=\"statusActionsArea\">" +
										"</div>" +
									"</div>" +
								"</div>" +
							
							"</list>" +
						"</div>" + 
						"</section>" + 
					"</div>" + 
									
				"</div>";
			
			var parentNode = dojo.byId(this.parentId);
			dojo.place(repositoryPageSkeleton, parentNode, "only");
		}
	};
	
	GitRepositoryExplorer.prototype.setDefaultPath = function(defaultPath){
		this.defaultPath = defaultPath;
	};
	
	GitRepositoryExplorer.prototype.changedItem = function(parent, children) {
		console.info("item changed: " + parent + " " + children);
		this.redisplayClonesList();
	};
	
	GitRepositoryExplorer.prototype.redisplayClonesList = function(){
		if (dojo.hash()) {
			this.displayRepository(dojo.hash());
		} else {
			var path = this.defaultPath;
			var relativePath = mUtil.makeRelative(path);
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone._");
			gitapiCloneUrl = gitapiCloneUrl.substring(0,gitapiCloneUrl.length-2);
			
			this.displayRepository(relativePath[0] === "/" ? gitapiCloneUrl + relativePath : gitapiCloneUrl + "/" + relativePath);
		};
	};
	
	GitRepositoryExplorer.prototype.displayRepository = function(location){
		var that = this;
		var progressService = this.registry.getService("orion.page.message");

		progressService.setProgressMessage("Loading...");
		this.registry.getService("orion.git.provider").getGitClone(location).then(
			function(resp){
								
				if (resp.Children.length == 1 && resp.Children[0].Type === "Clone") {
					var repositories = resp.Children;
					
					that.initTitleBar(repositories[0]);
	
					that.displayRepositories(repositories);
					that.displayStatus(repositories[0]);
					that.displayCommits(repositories[0]);
					that.displayBranches(repositories[0]);
					that.displayTags(repositories[0]);
					that.displayRemotes(repositories[0]);	
				} else if (resp.Children[0].Type === "Clone"){
					var repositories = resp.Children;
					
					that.initTitleBar();
					
					that.displayRepositories(repositories, "full", true);
				} else if (resp.Children[0].Type === "Branch"){
					var branches = resp.Children;
					
					that.registry.getService("orion.git.provider").getGitClone(branches[0].CloneLocation).then(
						function(resp){
							var repositories = resp.Children;
							
							that.initTitleBar(repositories[0], "Branches");
							
							that.displayRepositories(repositories, "mini", true);
							that.displayBranches(repositories[0], "full");
							that.displayRemoteBranches(repositories[0], "full");
						}, function () {
							that.handleError(error, that.registry);
						}
					);
				} else if (resp.Children[0].Type === "Tag"){
					var tags = resp.Children;
					
					that.registry.getService("orion.git.provider").getGitClone(tags[0].CloneLocation).then(
						function(resp){
							var repositories = resp.Children;
							
							that.initTitleBar(repositories[0], "Tags");
							
							that.displayRepositories(repositories, "mini", true);
							that.displayTags(repositories[0], "full");
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
	
	GitRepositoryExplorer.prototype.initTitleBar = function(repository, sectionName){
		var that = this;
		var pageTitle = dojo.byId("pageTitle");
		var item = {};
		
		if (repository && sectionName){
			pageTitle.innerHTML = "Git Repository (" + sectionName + ")";
			
			item.Name = sectionName;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].Location = repository.Location;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories";
		} else if (repository) {
			pageTitle.innerHTML = "Git Repository";
			
			item.Name = repository.Name;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = "Repositories";
		} else {
			pageTitle.innerHTML = "Git Repositories";
			
			item.Name = "";
		}
		
		var location = dojo.byId("location");
		var breadcrumb = new mBreadcrumbs.BreadCrumbs({
			container: location,
			resource: item,
			makeHref:function(seg, location){
				console.info(seg + " " + location);
				that.makeHref(seg, location);
			}
		});		
	};
	
	GitRepositoryExplorer.prototype.makeHref = function(seg, location) {
		seg.href = "/git/git-repository.html#" + (location ? location : "");
	}
	
	// Git repo
	
	GitRepositoryExplorer.prototype.decorateRepositories = function(repositories, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (repositories.length > 0) {
			this.registry.getService("orion.core.file").loadWorkspace(repositories[0].ContentLocation + "?parts=meta").then(
				function(resp){
					repositories[0].Content = {};
					
					var path = "root / ";
					if (resp.Parents != null)
						for (var i=resp.Parents.length; i>0; i--){
							path += resp.Parents[i-1].Name + " / ";
						}
					path += resp.Name;
					
					repositories[0].Content.Path = path;
					that.decorateRepositories(repositories.slice(1), deferred);
				}
			);
		} else {
			deferred.callback();
		}
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, mode, links){
		var that = this;
		
		// Create the page skeleton
		var repositoryPageSkeleton =
			"<div id=\"mainNode\" class=\"settings\">" +
				
				"<div class=\"displayTable\">" + 
					"<h1>Repository</h1>" +
					(mode === "full" ? "" : "<h2><a href=\"/git/git-repository.html#\">See all your repositories</a></h2>") +
					"<section class=\"extension-settings-content\">" +
					"<div class=\"extension-settings\">" +
						"<list id=\"repositoryNode\" class=\"extension-settings-list\">" +
						"</list>" +
					"</div>" + 
					"</section>" + 
				"</div>" + 
								
			"</div>";
		
		var parentNode = dojo.byId(this.parentId);
		dojo.place(repositoryPageSkeleton, parentNode, "only");
		
		this.decorateRepositories(repositories).then(
			function(){
				for(var i=0; i<repositories.length;i++){
					that.renderRepository(repositories[i], links);
				}
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderRepository = function(repository, links){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("repositoryNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-repository" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view" }, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title"}, detailsView );
		
		if (links){
			link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-repository.html#" + repository.Location}, title);
			dojo.place(document.createTextNode(repository.Name), link);
		} else {
			dojo.place(document.createTextNode(repository.Name), title);
		}

		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: (repository.GitUrl != null ? repository.GitUrl : "(no remote)") }, detailsView );
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", innerHTML: "location: " + repository.Content.Path }, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"repositoryActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", repository, this, "button", false);
	};
	
	// Git status
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository){
		
		var statusLocation = repository.StatusLocation;
		
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
		
	GitRepositoryExplorer.prototype.displayBranches = function(repository, mode){
		
		var branchLocation = repository.BranchLocation;
		
		var branchesSectionSkeleton = 
		"<div class=\"displayTable\">" +
			"<section style=\" width: 100%; border-bottom: 1px solid #EEEEEE; margin: 0; padding: 0;\">" +
			//"<div class=\"extension-settings\">" +
			"<div class=\"vbox\" style=\"width: 100%\">" +
			"<div class=\"hbox\">" +
			"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Branches</h1></div>"+
			"<div id=\"branchSectionActionsArea\" class=\"pageActions\"></div>" +
			"</div>" +
			"</div>" +
		//	"</div>" +
			"</section>" +
			(mode === "full" ? "" : ("<h2><a href=\"/git/git-repository.html#" + branchLocation + "\">See all branches</a></h2>")) +		
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
		
		this.registry.getService("orion.page.command").registerCommandContribution("eclipse.addBranch", 2000, "branchSectionActionsArea");
		this.registry.getService("orion.page.command").renderCommands(dojo.byId("branchSectionActionsArea"), "dom", repository, this, "tool", false);

		this.registry.getService("orion.git.provider").getGitBranch(branchLocation + (mode === "full" ? "?commits=1" : "?commits=1&page=1&pageSize=5")).then(
			function(resp){
				var branches = resp.Children;
				dojo.empty("branchNode");
				for(var i=0; i<branches.length;i++){
					branches[i].ParentLocation = branchLocation;
					that.renderBranch(branches[i]);
				}
			}, function(error){
				that.handleError(error, that.registry);
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
		
		var commit = branch.Commit.Children[0];
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: (branch.RemoteLocation[0] ? ("tracks " + branch.RemoteLocation[0].Children[0].Name + ", ") : "") 
			+ "last modified " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})
			+ " by " + commit.AuthorName}, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", branch, this, "button", false);	
	};
	
	// Git remote branches
	
	GitRepositoryExplorer.prototype.displayRemoteBranches = function(repository, mode){
		
		var remoteLocation = repository.RemoteLocation;
		
//		var branchesSectionSkeleton = 
//		"<div class=\"displayTable\">" + 
//			
//			"<section class=\"extension-settings-content\">" +
//			"<div class=\"extension-settings\">" +
//			"<list class=\"extension-settings-list\">" +
//			"<div class=\"vbox extension-list-item\">" +
//			"<div class=\"hbox\">" +
//			"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Remote Branches</h1></div>"+
//			"<div id=\"remoteBranchSectionActionsArea\" class=\"pageActions\"></div>" +
//			"</div>" +
//			"</div>" +
//			"</div>" +
//			"</list>" +
//			"</section>" +		
//			"<section class=\"extension-settings-content\">" +
//			"<div class=\"extension-settings\">" +
//				"<list id=\"remoteBranchNode\" class=\"extension-settings-list\">" +
//				"</list>" +
//			"</div>" + 
//			"</section>" + 
//		"</div>";
		
		var branchesSectionSkeleton = 
			"<div class=\"displayTable\">" + 
				"<h1>Remote Branches</h1>" +
				"<section class=\"extension-settings-content\">" +
					"<div class=\"extension-settings\">" +
						"<list id=\"remoteBranchNode\" class=\"extension-settings-list\">" +
						"</list>" +
					"</div>" + 
				"</section>" + 
			"</div>";
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(branchesSectionSkeleton, parentNode);
		
		var that = this;
		
		dojo.empty("remoteBranchNode");
		dojo.byId("remoteBranchNode").innerHTML = "Loading...";

		this.registry.getService("orion.git.provider").getGitRemote(remoteLocation).then(
			function(resp){
				var remotes = resp.Children;
				dojo.empty("remoteBranchNode");
				
				if (remotes.length === 0){
					that.renderNoRemoteBranch();
					return;
				}
				
				that.displayRemoteBranches2(remotes, repository);
			}, function(error){
				
			}
		);
	};
	
	GitRepositoryExplorer.prototype.displayRemoteBranches2 = function(remotes, repository, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (remotes.length > 0) {
			this.registry.getService("orion.git.provider").getGitRemote(remotes[0].Location).then(
				function(resp){
					var remoteBranches = resp.Children;
					for(var i=0; (i<remoteBranches.length);i++){
						remoteBranches[i].Repository = repository;
						that.renderRemoteBranch(remoteBranches[i]);
					}
					that.displayRemoteBranches2(remotes.slice(1), repository, deferred);
				}, function () {
					
				}
			);
		} else {
			deferred.callback();
		}
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.renderNoRemoteBranch = function(){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("remoteBranchNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: "No remote branches."}, detailsView );
		dojo.create( "div", null, detailsView );
		
//		var description = dojo.create( "span", { "class":"extension-description", 
//			innerHTML: "You have no outgoing and incoming commits."}, detailsView );	
	};
		
	GitRepositoryExplorer.prototype.renderRemoteBranch = function(remoteBranch){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("remoteBranchNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-branch" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: remoteBranch.Name }, detailsView );
		dojo.create( "div", null, detailsView );
//		var description = dojo.create( "span", { "class":"extension-description", 
//			innerHTML: "tracks " + branch.RemoteLocation[0].Children[0].Name 
//			+ ", last modified " + dojo.date.locale.format(new Date(branch.Commit.Time), {formatLength: "short"})
//			+ " by " + branch.Commit.AuthorName}, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", remoteBranch, this, "button", false);	
	};

	// Git commits
		
	GitRepositoryExplorer.prototype.displayCommits = function(repository){
		
		var commitsSectionSkeleton = 
		"<div class=\"displayTable\">" + 
			"<section style=\" width: 100%; border-bottom: 1px solid #EEEEEE; margin: 0; padding: 0;\">" +
			//"<div class=\"extension-settings\">" +
			"<div class=\"vbox\" style=\"width: 100%\">" +
			"<div class=\"hbox\">" +
			"<div class=\"vbox stretch details-view\"><h1 id=\"commitHeader\" style=\"padding-top: 4px; border-bottom: none;\">Commits</h1></div>"+
			"<div id=\"commitSectionActionsArea\" class=\"pageActions\"></div>" +
			"</div>" +
			"</div>" +
		//	"</div>" +
			"</section>" +
			"<h2 id=\"commitsSectionSeeMore\"></h2>" +			
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
				"<list id=\"commitNode\" class=\"extension-settings-list\">" +
				"</list>" +
			"</div>" + 
			"</section>" + 
		"</div>";
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(commitsSectionSkeleton, parentNode);
		
		var that = this;
		
		dojo.empty("commitNode");
		dojo.byId("commitNode").innerHTML = "Loading...";

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
				
				dojo.byId("commitHeader").innerHTML = "Commits for \"" + currentBranch.Name + "\" branch";
				
				var h2 = dojo.byId("commitsSectionSeeMore");
				var seeMoreLink = dojo.create("a", {className: "navlinkonpage", href: "/git/git-log.html#" + currentBranch.CommitLocation + "?page=1"}, h2);
				dojo.place(document.createTextNode("See the full log"), seeMoreLink);
				
				if (currentBranch.RemoteLocation[0]){
					that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.fetch", 100, "commitSectionActionsArea");
					that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.merge", 100, "commitSectionActionsArea");
					that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.rebase", 100, "commitSectionActionsArea");
					that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.resetIndex", 100, "commitSectionActionsArea");
					that.registry.getService("orion.page.command").renderCommands(dojo.byId("commitSectionActionsArea"), "dom", currentBranch.RemoteLocation[0].Children[0], that, "button", false); 
				}
				
				that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.push", 100, "commitSectionActionsArea");
				that.registry.getService("orion.page.command").renderCommands(dojo.byId("commitSectionActionsArea"), "dom", currentBranch, that, "button", false); 
				
				
				if (currentBranch.RemoteLocation[0] == null){
					dojo.empty("commitNode");
					that.renderNoCommit();
					return;
				};
				
				if (currentBranch.RemoteLocation[0].Children[0].CommitLocation){
					that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD", "",
						function(resp){
							dojo.empty("commitNode");
							
							var anyCommits = false;
							
							for (var i=0; i<resp.Children.length; i++){
								anyCommits = true;
								that.renderCommit(resp.Children[i], true);
							}
							
							that.registry.getService("orion.git.provider").getLog(currentBranch.CommitLocation + "?page=1&pageSize=20", currentBranch.RemoteLocation[0].Children[0].Id, "", 
								function(resp){	
									for (var i=0; i<resp.Children.length; i++){
										anyCommits = true;
										that.renderCommit(resp.Children[i], false);
									}
									
									if (!anyCommits)
										that.renderNoCommit();
								}
							);	
						}
					);
				}
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderNoCommit = function(){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("commitNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: "The branch is up to date."}, detailsView );
		dojo.create( "div", null, detailsView );
		
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: "You have no outgoing and incoming commits."}, detailsView );	
	};
		
	GitRepositoryExplorer.prototype.renderCommit = function(commit, outgoing){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("commitNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var imgSpriteName = (outgoing ? "git-sprite-outgoing_commit" : "git-sprite-incoming_commit");
		
		dojo.create( "span", { "class":"gitImageSprite " + imgSpriteName, "style":"vertical-align: middle;"}, horizontalBox );
		
		if (commit.AuthorImage) {
			var authorImage = dojo.create("span", {"style" : "vertical-align: bottom; padding: 5px;"}, horizontalBox);
			
			var image = new Image();
			image.src = commit.AuthorImage;
			image.name = commit.AuthorName;
			image.width = 30;
			image.height = 30;
			dojo.addClass(image, "gitAuthorImage");
			
			dojo.place(image, authorImage, "first");
		}
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		
		titleLink = dojo.create("a", {className: "extension-title navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, detailsView);
		dojo.place(document.createTextNode(commit.Message), titleLink);		
		
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", 
			innerHTML: " (SHA " + commit.Name + ") by " + commit.AuthorName 
			+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", commit, this, "button", false);	
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
	
	GitRepositoryExplorer.prototype.displayTags = function(repository, mode){
		
		var tagLocation = repository.TagLocation;
		
//		var tagsSectionSkeleton = 
//		"<div class=\"displayTable\">" + 
//			"<section class=\"extension-settings-content\">" +
//			"<div class=\"extension-settings\">" +
//			"<list class=\"extension-settings-list\">" +
//				"<div class=\"vbox extension-list-item\">" +
//					"<div class=\"hbox\">" +
//						"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Tags" + (mode === "full" ? "" : " (5 most recent)") + "</h1></div>"+
//						"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
//					"</div>" +
//				"</div>" +
//			"</list>" +
//			"</div>" +
//			"</section>" +
//			(mode === "full" ? "" : ("<h2 id=\"tagSubHeader\"><a href=\"/git/git-repository.html#" + tagLocation + "\">See all tags</a></h2>")) +
//			"<section class=\"extension-settings-content\">" +
//			"<div class=\"extension-settings\">" +
//				"<list id=\"tagNode\" class=\"extension-settings-list\">" +
//				"</list>" +
//			"</div>" + 
//			"</section>" + 
//		"</div>";
		
		var tagsSectionSkeleton = 
		"<div class=\"displayTable\">" + 
			"<h1>Tags" + (mode === "full" ? "" : " (5 most recent)") + "</h1>" +
			(mode === "full" ? "" : ("<h2 id=\"tagSubHeader\"><a href=\"/git/git-repository.html#" + tagLocation + "\">See all tags</a></h2>")) +
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
		
		this.registry.getService("orion.git.provider").getGitBranch(tagLocation + (mode === "full" ? "" : "?commits=1&page=1&pageSize=5")).then(
			function(resp){
				var tags = resp.Children.slice(0, 5);
				if (mode === 'full')
					tags = resp.Children;
				
				if (tags.length === 0) {
					dojo.empty("tagNode");
					that.renderNoTag();
					dojo.empty("tagSubHeader");
					return;
				}
				
				dojo.empty("tagNode");
				for(var i=0; i<tags.length ;i++){
					tags[i].Repository = repository;
					that.renderTag(tags[i]);
				};
					
//				that.decorateTags(tags).then(
//					function(){
//						dojo.empty("tagNode");
//						for(var i=0; i<tags.length ;i++){
//							tags[i].Repository = repository;
//							that.renderTag(tags[i]);
//						};
//					}
//				);
			}, function(error){
				that.handleError(error, that.registry);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderNoTag = function(){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("tagNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: "No tags."}, detailsView );
		dojo.create( "div", null, detailsView );
		
//		var description = dojo.create( "span", { "class":"extension-description", 
//			innerHTML: "You have no outgoing and incoming commits."}, detailsView );	
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
		
		if (tag.Commit){
			var commit = tag.Commit.Children[0];
			link = dojo.create("a", {className: "navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, description);
			dojo.place(document.createTextNode(commit.Message), link);	
			dojo.place(document.createTextNode(" by " + commit.AuthorName + " on " + 
				dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})), description, "last");
		}

		var actionsArea = dojo.create( "div", {"id":"tagActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", tag, this, "button", false);	
	};
	
	// Git Remotes
	
	GitRepositoryExplorer.prototype.displayRemotes = function(repository, mode){
		
		var remoteLocation = repository.RemoteLocation;
		
		var remotesSectionSkeleton = 
		"<div class=\"displayTable\">" + 
			"<section style=\" width: 100%; border-bottom: 1px solid #EEEEEE; margin: 0; padding: 0;\">" +
			//"<div class=\"extension-settings\">" +
			"<div class=\"vbox\" style=\"width: 100%\">" +
			"<div class=\"hbox\">" +
			"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Remotes</h1></div>"+
			"<div id=\"remoteSectionActionsArea\" class=\"pageActions\"></div>" +
			"</div>" +
			"</div>" +
		//	"</div>" +
			"</section>" +		
			"<section class=\"extension-settings-content\">" +
			"<div class=\"extension-settings\">" +
				"<list id=\"remoteNode\" class=\"extension-settings-list\">" +
				"</list>" +
			"</div>" + 
			"</section>" + 
		"</div>";		
		
		var parentNode = dojo.byId("mainNode");
		dojo.place(remotesSectionSkeleton, parentNode);
		
		var that = this;
		
		dojo.empty("remoteNode");
		dojo.byId("remoteNode").innerHTML = "Loading...";
		
		this.registry.getService("orion.page.command").registerCommandContribution("eclipse.addRemote", 2000, "remoteSectionActionsArea");
		this.registry.getService("orion.page.command").renderCommands(dojo.byId("remoteSectionActionsArea"), "dom", repository, this, "tool", false);

		this.registry.getService("orion.git.provider").getGitRemote(remoteLocation).then(
			function(resp){
				var remotes = resp.Children;
				dojo.empty("remoteNode");
				
				if (remotes.length === 0){
					that.renderNoRemote();
					return;
				}
				
				for(var i=0; i<remotes.length ;i++){
					that.renderRemote(remotes[i]);
				};
			}, function(error){
				that.handleError(error, that.registry);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderNoRemote = function(){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("remoteNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: "No remotes."}, detailsView );
		dojo.create( "div", null, detailsView );
		
//		var description = dojo.create( "span", { "class":"extension-description", 
//			innerHTML: "You have no outgoing and incoming commits."}, detailsView );	
	};
	
	GitRepositoryExplorer.prototype.renderRemote = function(remote){
		var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("remoteNode") );
		var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
		var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );
		
		dojo.create( "span", { "class":"gitImageSprite git-sprite-remote" }, horizontalBox );
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
		var title = dojo.create( "span", { "class":"extension-title", innerHTML: remote.Name }, detailsView );
		
		dojo.create( "div", null, detailsView );
		var description = dojo.create( "span", { "class":"extension-description", innerHTML: remote.GitUrl}, detailsView );

		var actionsArea = dojo.create( "div", {"id":"remoteActionsArea"}, horizontalBox );
		this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", remote, this, "button", false);	

	};
	
	return GitRepositoryExplorer;
}());

return exports;

// end of define
});
