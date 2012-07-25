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

/*global define console document orion Image*/
/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!git/nls/gitmessages', 'require', 'dojo','dijit', 'orion/section', 'orion/explorer', 'orion/i18nUtil', 'orion/globalCommands', 'orion/compare/diff-provider', 
        'orion/compare/compare-container' ,'orion/git/gitCommands', 'orion/navigationUtils','dijit/TooltipDialog', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, require, dojo, dijit ,mSection, mExplorer, i18nUtil, mGlobalCommands, mDiffProvider , mCompareContainer, mGitCommands, mNavUtils) {
	var exports = {};

	exports.GitPullRequestExplorer = (function() {

		/**
		 * Creates a new Git Pull Request explorer.
		 * @class Git Pull Request explorer
		 */
		function GitPullRequestExplorer(fileClient, commandService, serviceRegistry, gitClient){
			this.fileClient = fileClient;
			this.registry = serviceRegistry;
			this.gitClient = gitClient;
			this.commandService = commandService;
			mExplorer.createExplorerCommands(commandService);
		}
		
		GitPullRequestExplorer.prototype.handleError = function(error) {
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
		GitPullRequestExplorer.prototype.setDefaultPath = function(defaultPath){
			this.defaultPath = defaultPath;
		};
		
		GitPullRequestExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};
		
		GitPullRequestExplorer.prototype.redisplay = function(){
			this.display(dojo.hash());
		};
		
		GitPullRequestExplorer.prototype.display = function(remote_sha){
			this.progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			this.loadingDeferred = new dojo.Deferred();
			var that = this;
			var params = [];
			var n = remote_sha.lastIndexOf("_");
			params[0] = remote_sha.substring(0,n);
			params[1] = remote_sha.substring(n+1);
			var redundant = params[0].split(".");
			var index = redundant.length - 1;
			if(redundant[index] === "git"){
				var m = params[0].lastIndexOf(".");
				params[2] = params[0].substring(0,m);
			}
			else{
				params[2] = params[0] + ".git";
			}
			this.url = params[2];
			this.initTitleBar(params[1], params[0]);
			dojo.empty(dojo.byId("table"));
			dojo.empty(dojo.byId("openCommitSection"));
			dojo.empty(dojo.byId("fetchDiv"));
			this.fileClient.loadWorkspace().then(
				function(workspace){
					that.setDefaultPath(workspace.Location);
					that.commandService.registerCommandContribution("fetch", "eclipse.orion.git.fetch", 200);
					that.commandService.registerCommandContribution("fetch", "eclipse.orion.git.fetchForce", 250);
					var tableNode = dojo.byId("table");
					var titleWrapper1 = new mSection.Section(dojo.byId("openCommitSection"), {
						id: "open commit from existing repository", //$NON-NLS-0$
						title: "Commit not found", //$NON-NLS-0$
						slideout: true,
						canHide: true,
						preferenceService: that.registry.getService("orion.core.preference"),
						content: '<div id="openExistingNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					var titleWrapper2 = new mSection.Section(dojo.byId("fetchDiv"), {
						id: "fetch section", //$NON-NLS-0$
						title: "No repository to fetch from the remote", //$NON-NLS-0$
						slideout: true,
						canHide: true,
						preferenceService: that.registry.getService("orion.core.preference"),
						content: '<div id="fetchNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					var titleWrapper3 = new mSection.Section(tableNode, {
						id: "create new clone", //$NON-NLS-0$
						title: "Create new repository", //$NON-NLS-0$
						content: '<div id="createNewNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					
					that.renderCloneSection(params);
					that.renderSections(workspace.Children, params[0], params[2], params[1]);
				},
				function(){
				}
			);
	
			
		};
		
		GitPullRequestExplorer.prototype.renderCloneSection = function(params){
			var that = this;
			that.commandService.registerCommandContribution("clone", "eclipse.cloneGitRepositoryPullReq", 200);
			that.commandService.renderCommands("clone", dojo.byId("createNewNode"), "clone", that, "button", params[0]);
			dojo.create("span", { style: "padding: 0px; text-align: left; width: 20px class: gitMainDescription", innerHTML : " using " + params[0] },  dojo.byId("createNewNode"));	
		};
		
		GitPullRequestExplorer.prototype.renderSections = function(repositories, url1, url2, sha){
			var that = this;

			var findCommitLocation = function (repositories, commitName, deferred, that) {
				if (deferred === null)
					deferred = new dojo.Deferred();
				if (repositories.length > 0) {
					that.registry.getService("orion.git.provider").doGitLog( //$NON-NLS-0$
						"/gitapi/commit/" + sha + repositories[0].Location + "?page=1&pageSize=1", null, null, messages['Looking for the commit']).then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						function(resp){
							that.currentCommit = resp;
							deferred.callback(resp.Children[0].Location);
						},
						function(error) {
							deferred.errback();
						}
					);
				} else {
					deferred.errback();
				}
				
				return deferred;
				};

			
			if (repositories.length > 0) {
				repositories[0].Content = {};
				var path = "root / "; //$NON-NLS-0$
				if (repositories[0].Parents !== null && repositories[0].Parents !== undefined){
					for (var i=repositories[0].Parents.length; i>0; i--){
						path += repositories[0].Parents[i-1].Name + " / "; //$NON-NLS-0$
					}
				}
				path += repositories[0].Name;
				repositories[0].Content.Path = path;
				that.registry.getService("orion.git.provider").getGitClone(repositories[0].Git.CloneLocation).then(
					function(resp){
						that.registry.getService("orion.git.provider").getGitRemote("/gitapi/remote" + repositories[0].Location).then(
						function(remotes){
							var found = false;
							for(var i=0;i<remotes.Children.length;i++){
								if(remotes.Children[i].GitUrl === url1 || remotes.Children[i].GitUrl === url2)
									found = true;
							}
							
							if(found){
								findCommitLocation(repositories, sha, null, that).then(	
									function(commitLocation){
										var _timer;
										var commitPageURL = "/git/git-commit.html#" + commitLocation + "?page=1&pageSize=1";
										var repoURL = "/git/git-repository.html#" + resp.Children[0].Location;
										dojo.create("div", {id : resp.Children[0].Name + "tableitem" , class: "sectionTableItem lightTreeTableRow" , style: "height: 20px"},  dojo.byId("openExistingNode"));
										dojo.create("div", {id : resp.Children[0].Name + "div" , class: "stretch" , style: "width: 1000px"},  dojo.byId(resp.Children[0].Name + "tableitem"));
										dojo.create("div", {id : resp.Children[0].Name + "divCommands" , class: "sectionTableItemActions" },  dojo.byId(resp.Children[0].Name + "tableitem"));
										var link2 = dojo.create("a", {style: "padding: 0px; text-align: left; display: inline-block;  width: 150px", innerHTML: repositories[0].Name , href: repoURL },  dojo.byId(resp.Children[0].Name + "div"));
										dojo.create("span", {style: "class: gitSecondaryDescription", innerHTML: "location: " + repositories[0].Content.Path},dojo.byId(resp.Children[0].Name + "div"));
										var link = dojo.create("a", {id : resp.Children[0].Name + "a", style: "padding: 0px; text-align: left; width: 50px", innerHTML: "Open Commit", href: commitPageURL },  dojo.byId(resp.Children[0].Name + "divCommands"));
										dojo.byId("open commit from existing repositoryTitle").innerHTML = "Open Commit";
										var tooltipDialog = new orion.git.widgets.CommitTooltipDialog({
										    commit: that.currentCommit.Children[0],
										    onMouseLeave: function(){
												if(dijit.popup.hide)
													dijit.popup.hide(tooltipDialog); //close doesn't work on FF
												dijit.popup.close(tooltipDialog);
											},
											onMouseEnter: function(){
												clearTimeout(_timer);
											}
										});
										dojo.connect(link, "onmouseover", link2, function() { //$NON-NLS-0$
											clearTimeout(_timer);
											
											_timer = setTimeout(function(){
												dijit.popup.open({
													popup: tooltipDialog,
													around: link,
													position: "before",
													orient: {'BL':'TL', 'TR':'BR'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
												});
											}, 600);
										});
										
										dojo.connect(link, "onmouseout", link, function() { //$NON-NLS-0$
											clearTimeout(_timer);
											
											_timer = setTimeout(function(){
												if(dijit.popup.hide)
													dijit.popup.hide(tooltipDialog); //close doesn't work on FF
												dijit.popup.close(tooltipDialog);
											}, 200);
										});
									},
									function(){
										var index;
										for(var i=0;i<remotes.Children.length;i++){
											if(remotes.Children[i].GitUrl === url1 || remotes.Children[i].GitUrl === url2){
												index = i;
											}
										}
										var repoURL = "/git/git-repository.html#" + resp.Children[0].Location;
										dojo.create("div", {id : resp.Children[0].Name + "tableitem" , class: "sectionTableItem lightTreeTableRow" , style: "height: 20px"},  dojo.byId("fetchNode"));
										dojo.create("div", {id : resp.Children[0].Name + "div" , class: "stretch" },  dojo.byId(resp.Children[0].Name + "tableitem"));
										dojo.create("div", {id : resp.Children[0].Name + "divCommands" , class: "sectionTableItemActions" },  dojo.byId(resp.Children[0].Name + "tableitem"));
										dojo.create("a", {id : resp.Children[0].Name, style: "padding: 0px; text-align: left; display: inline-block;  width: 150px", innerHTML: resp.Children[0].Name + "    " , href: repoURL },  dojo.byId(resp.Children[0].Name + "div"));
										dojo.create("span", {style: "class: gitSecondaryDescription", innerHTML: "location: " + repositories[0].Content.Path},dojo.byId(resp.Children[0].Name + "div"));
										that.commandService.renderCommands("fetch", dojo.byId(resp.Children[0].Name + "divCommands"), remotes.Children[index], that, "tool");
										dojo.byId("fetch sectionTitle").innerHTML = "Fetch from repository with the remote attached";
						
									}
								);
								
							}
							that.renderSections(repositories.slice(1), url1, url2, sha);	
							}
							);
					
					},
					function(error){
					}
							
						);
					
					}
		};
		
		GitPullRequestExplorer.prototype.makeHref =	function (fileClient, seg, location, isRemote) {
			if (!location) {
				return;
			}
			
			fileClient.read(location, true).then(dojo.hitch(this, function(metadata) {
				if (isRemote) {
					var gitService = this.registry.getService("orion.git.provider"); //$NON-NLS-0$
					if (metadata.Git) {
						gitService.getDefaultRemoteBranch(metadata.Git.RemoteLocation).then(function(defaultRemoteBranchJsonData, secondArg) {
							seg.href = require.toUrl("git/git-log.html") + "#" + defaultRemoteBranchJsonData.Location + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						});
					}
				} else {
					if (metadata.Git) {
						seg.href = require.toUrl("git/git-log.html") + "#" + metadata.Git.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
			}), dojo.hitch(this, function(error) {
				window.console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
			}));
		};
		
		GitPullRequestExplorer.prototype.initTitleBar = function(commit, url){
			var item = {};
			item.Name = "Pull Request for " + commit + " on " + url;
			var title =  "Pull Request for " + commit + " on " + url;
			var breadcrumbRootName = "Pull Request for " + commit + " on " + url;
			mGlobalCommands.setPageTarget({task: "Pull Request", title: title, breadcrumbTarget: item,
				breadcrumbRootName: breadcrumbRootName,
				makeBreadcrumbLink: function(seg, location) {
					this.makeHref(this.fileClient, seg, location, false);
				},
				serviceRegistry: this.registry, commandService: this.commandService});
		};
		
		
		return GitPullRequestExplorer;
	}());
	
	return exports;
}); // end of define
