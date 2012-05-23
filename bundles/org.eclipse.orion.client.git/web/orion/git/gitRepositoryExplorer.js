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

/*global define dijit console document Image */

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/section', 'orion/util', 'orion/PageUtil', 'orion/globalCommands', 'orion/breadcrumbs', 'orion/git/gitCommands', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, require, dojo, mSection, mUtil, PageUtil, mGlobalCommands, mBreadcrumbs, mGitCommands) {
var exports = {};

exports.GitRepositoryExplorer = (function() {
	
	/**
	 * Creates a new Git repository explorer.
	 * @class Git repository explorerpadd
	 */
	function GitRepositoryExplorer(registry, commandService, linkService, selection, parentId, toolbarId, selectionToolsId, actionScopeId){
		this.parentId = parentId;
		this.registry = registry;
		this.linkService = linkService;
		this.commandService = commandService;
		this.selection = selection;
		this.parentId = parentId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.actionScopeId = actionScopeId;
		this.checkbox = false;
	}
	
	GitRepositoryExplorer.prototype.handleError = function(error) {
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
			this.displayRepositories();
		}
	};
	
	GitRepositoryExplorer.prototype.setDefaultPath = function(defaultPath){
		this.defaultPath = defaultPath;
	};
	
	GitRepositoryExplorer.prototype.changedItem = function(parent, children) {
		this.redisplayClonesList();
	};
	
	GitRepositoryExplorer.prototype.redisplayClonesList = function(){
		var pageParams = PageUtil.matchResourceParameters();
		if (pageParams.resource) {
			this.displayRepository(pageParams.resource);
		} else {
			var path = this.defaultPath;
			var relativePath = mUtil.makeRelative(path);
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone._"); //$NON-NLS-0$
			gitapiCloneUrl = gitapiCloneUrl.substring(0,gitapiCloneUrl.length-2);
			
			this.displayRepository(relativePath[0] === "/" ? gitapiCloneUrl + relativePath : gitapiCloneUrl + "/" + relativePath); //$NON-NLS-1$ //$NON-NLS-0$
		};
	};
	
	GitRepositoryExplorer.prototype.displayRepository = function(location){
		var that = this;
		this.loadingDeferred = new dojo.Deferred();
		var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		progressService.showWhile(this.loadingDeferred, "Loading..."); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitClone(location).then( //$NON-NLS-0$
			function(resp){
				
				if (resp.Children.length === 0) {
					that.initTitleBar({});
					that.displayRepositories([], "full"); //$NON-NLS-0$
				} else if (resp.Children.length == 1 && resp.Children[0].Type === "Clone") { //$NON-NLS-0$
					var repositories = resp.Children;
					
					that.initTitleBar(repositories[0]);
					that.displayRepositories(repositories);
					that.displayStatus(repositories[0]);
					that.displayCommits(repositories[0]);
					that.displayBranches(repositories[0]);
					that.displayTags(repositories[0]);
					that.displayRemotes(repositories[0]);
					that.displayConfig(repositories[0]);
				} else if (resp.Children[0].Type === "Clone"){ //$NON-NLS-0$
					var repositories = resp.Children;
					
					that.initTitleBar(repositories);
					that.displayRepositories(repositories, "full", true); //$NON-NLS-0$
				} else if (resp.Children[0].Type === "Branch"){ //$NON-NLS-0$
					var branches = resp.Children;
					
					that.registry.getService("orion.git.provider").getGitClone(branches[0].CloneLocation).then( //$NON-NLS-0$
						function(resp){
							var repositories = resp.Children;
							
							that.initTitleBar(repositories[0], "Branches"); //$NON-NLS-0$
							
							that.displayRepositories(repositories, "mini", true); //$NON-NLS-0$
							that.displayBranches(repositories[0], "full"); //$NON-NLS-0$
							that.displayRemoteBranches(repositories[0], "full"); //$NON-NLS-0$
						}, function () {
							dojo.hitch(that, that.handleError)(error);
						}
					);
				} else if (resp.Children[0].Type === "Tag"){ //$NON-NLS-0$
					var tags = resp.Children;
					
					that.registry.getService("orion.git.provider").getGitClone(tags[0].CloneLocation).then( //$NON-NLS-0$
						function(resp){
							var repositories = resp.Children;
							
							that.initTitleBar(repositories[0], messages['Tags']);
							
							that.displayRepositories(repositories, "mini", true); //$NON-NLS-0$
							that.displayTags(repositories[0], "full"); //$NON-NLS-0$
						}, function () {
							dojo.hitch(that, that.handleError)(error);
						}
					);
				} else if (resp.Children[0].Type === "Config"){ //$NON-NLS-0$
					that.registry.getService("orion.git.provider").getGitClone(resp.CloneLocation).then( //$NON-NLS-0$
						function(resp){
							var repositories = resp.Children;
							
							that.initTitleBar(repositories[0], messages["Configuration"]);
							
							that.displayRepositories(repositories, "mini", true); //$NON-NLS-0$
							that.displayConfig(repositories[0], "full"); //$NON-NLS-0$
						}, function () {
							dojo.hitch(that, that.handleError)(error);
						}
					);
				}
				that.commandService.processURL(window.location.href);
				progressService.setProgressMessage("");
			}, function(error){
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.initTitleBar = function(resource, sectionName){
		var that = this;
		var item = {};
		var pageTitle;		
		
		// render commands
		mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", resource); //$NON-NLS-1$ //$NON-NLS-0$
		
		if (resource && resource.Type === "Clone" && sectionName){ //$NON-NLS-0$
			var repository = resource;
			
			item.Name = sectionName;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].Location = repository.Location;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories"; //$NON-NLS-0$
			pageTitle = dojo.string.substitute(messages['0 on 1 - Git'], [sectionName, repository.Name]);
		} else if (resource && resource.Type === "Clone") { //$NON-NLS-0$
			var repository = resource;
			
			item.Name = repository.Name;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = "Repositories"; //$NON-NLS-0$
			pageTitle = repository.Name + messages[" - Git"];
		} else {
			item.Name = "Repositories"; //$NON-NLS-0$
			pageTitle = messages["Repositories - Git"];
		}
		
		document.title = pageTitle;
		
		var location = dojo.byId("location"); //$NON-NLS-0$
		var breadcrumb = new mBreadcrumbs.BreadCrumbs({
			container: location,
			resource: item,
			makeHref:function(seg, location){
				that.makeHref(seg, location);
			}
		});		
	};
	
	GitRepositoryExplorer.prototype.makeHref = function(seg, location) {
		seg.href = "/git/git-repository.html#" + (location ? location : ""); //$NON-NLS-0$
	}
	
	// Git repo
	
	GitRepositoryExplorer.prototype.decorateRepositories = function(repositories, mode, deferred){
		var that = this;
		if (deferred == null){
			deferred = new dojo.Deferred();
		}
		
		if (repositories.length > 0) {
			this.registry.getService("orion.core.file").loadWorkspace(repositories[0].ContentLocation + "?parts=meta").then( //$NON-NLS-1$ //$NON-NLS-0$
				function(resp){
					repositories[0].Content = {};
					
					var path = "root / "; //$NON-NLS-0$
					if (resp.Parents != null)
						for (var i=resp.Parents.length; i>0; i--){
							path += resp.Parents[i-1].Name + " / "; //$NON-NLS-0$
						}
					path += resp.Name;
					
					repositories[0].Content.Path = path;
					
					if (mode !== "full"){ //$NON-NLS-0$
						that.decorateRepositories(repositories.slice(1), mode, deferred);
						return;
					}
					
					that.registry.getService("orion.git.provider").getGitStatus(repositories[0].StatusLocation).then( //$NON-NLS-0$
						function(resp){
							repositories[0].Status = resp;

							that.registry.getService("orion.git.provider").getGitBranch(repositories[0].BranchLocation).then( //$NON-NLS-0$
								function(resp){
									var branches = resp.Children;
									var currentBranch;
									for (var i=0; i<branches.length; i++){
										if (branches[i].Current){
											currentBranch = branches[i];
											break;
										}
									}
									
									if (currentBranch.RemoteLocation[0] == null){
										that.decorateRepositories(repositories.slice(1), mode, deferred);
										return;
									};
									
									var tracksRemoteBranch = (currentBranch.RemoteLocation.length == 1 && currentBranch.RemoteLocation[0].Children.length === 1);
									
									if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
										that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											function(resp){
												repositories[0].CommitsToPush = resp.Children.length;
											}
										);
									} else {
										that.registry.getService("orion.git.provider").doGitLog(currentBranch.CommitLocation + "?page=1&pageSize=20").then(  //$NON-NLS-1$ //$NON-NLS-0$
											function(resp){	
												repositories[0].CommitsToPush = resp.Children.length;
											}
										);	
									}
									
									that.decorateRepositories(repositories.slice(1), mode, deferred);
								}
							);
						}	
					);
				}
			);
		} else {
			deferred.callback();
		}
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, mode, links){
		var that = this;
		
		var tableNode = dojo.byId( 'table' );	 //$NON-NLS-0$
		dojo.empty( tableNode );

		var titleWrapper = new mSection.Section(tableNode, {
			id: "repositorySection", //$NON-NLS-0$
			title: (mode === "full" ? messages['Repositories'] : messages["Repository"]), //$NON-NLS-0$
			iconClass: "gitImageSprite git-sprite-repository" //$NON-NLS-0$
		});
	
		if (!repositories || repositories.length === 0){
			titleWrapper.setTitle(mode === "full" ? messages["No Repositories"] : messages["Repository Not Found"]); //$NON-NLS-0$
			return;
		}

		
		titleWrapper.setContent('<list id="repositoryNode" class="mainPadding"></list>'); //$NON-NLS-0$
		
		
		var repositoryMonitor = titleWrapper.createProgressMonitor();
		repositoryMonitor.begin(mode === "full" ? messages["Loading repositories"] : messages["Loading repository"]); //$NON-NLS-0$
		this.decorateRepositories(repositories, mode).then(
			function(){
				repositoryMonitor.done();
				for(var i=0; i<repositories.length;i++){
					that.renderRepository(repositories[i], i, repositories.length, mode, links);
				}
				that.loadingDeferred.callback();
			},
			function(){
				repositoryMonitor.done();
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderRepository = function(repository, index, length, mode, links){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((length == 1) ? "" : ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow"))}, dojo.byId("repositoryNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch" }, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		if (links){
			link = dojo.create("a", {"class": "navlinkonpage", href: "/git/git-repository.html#" + repository.Location}, title); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(repository.Name), link);
		} else {
			dojo.place(document.createTextNode(repository.Name), title);
		}

		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: (repository.GitUrl != null ? repository.GitUrl : messages["(no remote)"]) }, detailsView );
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription", innerHTML: messages["location: "] + repository.Content.Path }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var status = repository.Status;
		
		if (mode === "full"){ //$NON-NLS-0$
			var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length;
			var staged = status.Changed.length + status.Added.length + status.Removed.length;
			
			var workspaceState = ((unstaged > 0 || staged > 0) 
				? dojo.string.substitute(messages["${0} file(s) to stage and ${1} file(s) to commit."], [unstaged, staged])
				: messages["Nothing to commit."]);
			dojo.create( "div", {"style":"padding-top:10px"}, detailsView );		 //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.create( "span", { "class":"gitSecondaryDescription", "style":"padding-left:10px", innerHTML: workspaceState}, detailsView ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var commitsState = repository.CommitsToPush;
			dojo.create( "span", { "class":"gitSecondaryDescription", "style":"padding-left:10px",  //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				innerHTML: ((commitsState > 0 ) ? commitsState + messages[" commit(s) to push."] : messages["Nothing to push."])}, detailsView );
		}
		
		var actionsArea = dojo.create( "div", {"id":"repositoryActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, repository, this, "tool"); //$NON-NLS-0$
	};
	
	// Git status
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository){
		
		var statusLocation = repository.StatusLocation;
		
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$

		var titleWrapper = new mSection.Section(tableNode, {
			id: "workingDirectorySection", //$NON-NLS-0$
			title: "Working Directory", //$NON-NLS-0$
			content: '<list id="workingDirectoryNode" class="mainPadding"></list>' //$NON-NLS-0$
		});
		
		var progress = titleWrapper.createProgressMonitor();
		progress.begin("Loading status"); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitBranch(statusLocation).then( //$NON-NLS-0$
			function(resp){
				var status = resp;
				progress.done();
				that.renderStatus(repository, status);
			}, function(error){
				progress.done(error);
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderStatus = function(repository, status){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("workingDirectoryNode") ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length;
		var staged = status.Changed.length + status.Added.length + status.Removed.length;
		var workspaceState = messages["You have no changes to commit."]
		
		if (unstaged > 0 || staged > 0)
			workspaceState = messages["You have changes to commit in your workspace!"]
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: workspaceState}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: dojo.string.substitute(messages['${0} file(s) to stage and ${1} file(s) to commit.'], [unstaged, staged])
						}, detailsView );
				
		var actionsArea = dojo.create( "div", {"id":"statusActionsArea", "class":"sectionTableItemActions"}, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, repository, this, "tool");	 //$NON-NLS-0$
	};
	
	// Git branches
	
	GitRepositoryExplorer.prototype.decorateBranches = function(branches, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (branches.length > 0) {
			this.registry.getService("orion.git.provider").doGitLog(branches[0].CommitLocation + "?page=1&pageSize=1").then( //$NON-NLS-1$ //$NON-NLS-0$
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

		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "branchSection", //$NON-NLS-0$
			title: messages['Branches'],
			iconClass: "gitImageSprite git-sprite-branch", //$NON-NLS-0$
			slideout: true,
			content: '<list id="branchNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		});

		var progress = titleWrapper.createProgressMonitor();
		progress.begin("Getting branches"); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitBranch(branchLocation + (mode === "full" ? "?commits=1" : "?commits=1&page=1&pageSize=5")).then( //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			function(resp){
				var branches = resp.Children;
				progress.done();
				
				if (mode !== "full" && branches.length !== 0){ //$NON-NLS-0$
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
						{"ViewAllLink":"/git/git-repository.html#" + branchLocation + "?page=1", "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all local and remote tracking branches"]}, that, "button"); //$NON-NLS-7$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				
				that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.addBranch", 200); //$NON-NLS-0$
				that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, repository, that, "button"); //$NON-NLS-0$
				
				for(var i=0; i<branches.length;i++){
					branches[i].ParentLocation = branchLocation;
					that.renderBranch(branches[i], i);
				}
			}, function(error){
				progress.done();
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderBranch = function(branch, index){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow")  }, dojo.byId("branchNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$

		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		if (branch.Current)
			dojo.create( "span", { "class":"sectionIcon gitImageSprite git-sprite-branch_active" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var title = dojo.create( "span", { "class":"gitMainDescription " + (branch.Current ? "activeBranch" : ""), innerHTML: branch.Name }, detailsView ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var commit = branch.Commit.Children[0];
		
		var tracksMessage = ((branch.RemoteLocation.length == 1 && branch.RemoteLocation[0].Children.length == 1) ? 
				dojo.string.substitute(messages["tracks ${0}, "], [branch.RemoteLocation[0].Children[0].Name]) : messages["tracks no branch, "]);
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: tracksMessage 
			+ dojo.string.substitute(messages["last modified ${0} by ${1}"], [dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"}), //$NON-NLS-1$
			commit.AuthorName])}, detailsView );
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, branch, this, "tool");	 //$NON-NLS-0$
	};
	
	// Git remote branches
	
	GitRepositoryExplorer.prototype.displayRemoteBranches = function(repository, mode){
		
		var remoteLocation = repository.RemoteLocation;
				
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "remoteBranchSection", //$NON-NLS-0$
			title: "Remote Branches", //$NON-NLS-0$
			iconClass: "gitImageSprite git-sprite-branch", //$NON-NLS-0$
			content: '<list id="remoteBranchNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		}); 

		var progress = titleWrapper.createProgressMonitor();
		progress.begin("Getting remote branches"); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitRemote(remoteLocation).then( //$NON-NLS-0$
			function(resp){
				var remotes = resp.Children;
				progress.done();
				if (remotes.length === 0){
					titleWrapper.setTitle(messages["No Remote Branches"]);
					return;
				}
				progress = titleWrapper.createProgressMonitor();
				progress.begin(messages["Rendering branches"]);
				that.displayRemoteBranches2(remotes, repository).addBoth(function(){
					progress.done();
				});
			}, function(error){
				progress.done(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.displayRemoteBranches2 = function(remotes, repository, deferred, anyRemoteBranch){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (remotes.length > 0) {
			this.registry.getService("orion.git.provider").getGitRemote(remotes[0].Location).then( //$NON-NLS-0$
				function(resp){
					var remoteBranches = resp.Children;
					for(var i=0; (i<remoteBranches.length);i++){
						remoteBranches[i].Repository = repository;
						that.renderRemoteBranch(remoteBranches[i], i);
					}
					that.displayRemoteBranches2(remotes.slice(1), repository, deferred, (anyRemoteBranch || (remoteBranches.length > 0)));
				}, function () {
					
				}
			);
		} else {
			if (!anyRemoteBranch){
				titleWrapper.setTitle(messages['No Remote Branches']);
			}
			deferred.callback();
		}
		
		return deferred;
	};
			
	GitRepositoryExplorer.prototype.renderRemoteBranch = function(remoteBranch, index){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, dojo.byId("remoteBranchNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: remoteBranch.Name }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, remoteBranch, this, "tool");	 //$NON-NLS-0$
	};

	// Git commits
		
	GitRepositoryExplorer.prototype.displayCommits = function(repository){
				
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$

		var titleWrapper = new mSection.Section(tableNode, {
			id: "commitSection", //$NON-NLS-0$
			title: messages["Commits"],
			slideout: true,
			content: '<list id="commitNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		}); 

		var progress = titleWrapper.createProgressMonitor();
		progress.begin(messages["Getting current branch"]);
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
				
				titleWrapper.setTitle("Commits for \"" + currentBranch.Name + "\" branch"); //$NON-NLS-1$ //$NON-NLS-0$

				that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
				that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
					{"ViewAllLink":"/git/git-log.html#" + currentBranch.CommitLocation + "?page=1", "ViewAllLabel":messages["See Full Log"], "ViewAllTooltip":"See the full log"}, that, "button"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
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
				
				progress.worked(dojo.string.substitute(messages["Getting commits for \"${0}\" branch"], [currentBranch.Name]));
				if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
					that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						function(resp){
							progress.worked(messages["Rendering commits"]);
							
							var commitsCount = resp.Children.length;
							
							for (var i=0; i<resp.Children.length; i++){
								that.renderCommit(resp.Children[i], true, i);
							}
							
							progress.worked(messages["Getting outgoing commits"]);
							that.registry.getService("orion.git.provider").getLog(currentBranch.CommitLocation + "?page=1&pageSize=20", currentBranch.RemoteLocation[0].Children[0].Id).then(  //$NON-NLS-1$ //$NON-NLS-0$
								function(resp){	
									progress.worked("Rendering commits"); //$NON-NLS-0$
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
	
	GitRepositoryExplorer.prototype.renderNoCommit = function(){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("commitNode") ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: messages["The branch is up to date."]}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: messages["You have no outgoing or incoming commits."]}, detailsView );	
	};
		
	GitRepositoryExplorer.prototype.renderCommit = function(commit, outgoing, index){
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
		    	clearTimeout(_timer);
            }
		});
		
		dojo.connect(titleLink, "onmouseover", titleLink, function() { //$NON-NLS-0$
			clearTimeout(_timer);
			
			_timer = setTimeout(function(){
				dijit.popup.open({
					popup: tooltipDialog,
					around: titleLink,
					orient: {'BR':'TL', 'TR':'BL'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}, 600);
		});
		
		dojo.connect(titleLink, "onmouseout", titleLink, function() { //$NON-NLS-0$
			clearTimeout(_timer);
			
			_timer = setTimeout(function(){
				if(dijit.popup.hide)
					dijit.popup.hide(tooltipDialog); //close doesn't work on FF
				dijit.popup.close(tooltipDialog);
			}, 200);
		});
		
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: messages[" (SHA "] + commit.Name + messages[") by "] + commit.AuthorName 
			+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView ); //$NON-NLS-1$ //$NON-NLS-0$
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, commit, this, "tool");	 //$NON-NLS-0$
	};

	// Git tags
	
	GitRepositoryExplorer.prototype.decorateTags = function(tags, deferred){
		var that = this;
		if (deferred == null)
			deferred = new dojo.Deferred();
		
		if (tags.length > 0) {
			this.registry.getService("orion.git.provider").doGitLog(tags[0].CommitLocation + "?page=1&pageSize=1").then( //$NON-NLS-1$ //$NON-NLS-0$
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
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "tagSection", //$NON-NLS-0$
			iconClass: "gitImageSprite git-sprite-tag", //$NON-NLS-0$
			title: ("Tags" + (mode === "full" ? "" : " (5 most recent)")), //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			content: '<list id="tagNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		}); 
		var progress = titleWrapper.createProgressMonitor();
		progress.begin(messages["Getting tags"]);
		
		this.registry.getService("orion.git.provider").getGitBranch(tagLocation + (mode === "full" ? "" : "?commits=1&page=1&pageSize=5")).then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			function(resp){
				var tags = resp.Children.slice(0, 5);
				if (mode === 'full') //$NON-NLS-0$
					tags = resp.Children;
				
				progress.done();
				if (mode !== "full" && tags.length !== 0){ //$NON-NLS-0$
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id,
							{"ViewAllLink":"/git/git-repository.html#" + tagLocation + "?page=1", "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all tags"]}, that, "button"); //$NON-NLS-7$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}

				if (tags.length === 0) {
					titleWrapper.setTitle(messages['No Tags']);
					return;
				}
				
				for(var i=0; i<tags.length ;i++){
					tags[i].Repository = repository;
					that.renderTag(tags[i], i);
				};
			}, function(error){
				progress.done();
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
			
	GitRepositoryExplorer.prototype.renderTag = function(tag, index){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, dojo.byId("tagNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: tag.Name }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		if (tag.Commit){
			var description = dojo.create( "span", { "class":"tag-description"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var commit = tag.Commit.Children[0];
			var link = dojo.create("a", {"class": "navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, description); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			dojo.place(document.createTextNode(commit.Message), link);	
			dojo.place(document.createTextNode(messages[" by "] + commit.AuthorName + messages[" on "] + 
				dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})), description, "last"); //$NON-NLS-1$ //$NON-NLS-0$
			
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
			
			dojo.connect(link, "onmouseover", link, function() { //$NON-NLS-0$
				clearTimeout(_timer);
				
				_timer = setTimeout(function(){
					dijit.popup.open({
						popup: tooltipDialog,
						around: link,
						orient: {'BR':'TL', 'TR':'BL'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
				
		}

		var actionsArea = dojo.create( "div", {"id":"tagActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, tag, this, "tool");	 //$NON-NLS-0$
	};
	
	// Git Remotes
	
	GitRepositoryExplorer.prototype.displayRemotes = function(repository, mode){
		
		var remoteLocation = repository.RemoteLocation;
		mGlobalCommands.setPageTarget(repository, this.registry, this.commandService); 

				
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "remoteSection", //$NON-NLS-0$
			title: messages["Remotes"],
			iconClass: "gitImageSprite git-sprite-remote", //$NON-NLS-0$
			slideout: true,
			content: '<list id="remoteNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		});
		
		var progress = titleWrapper.createProgressMonitor();
		progress.begin("Getting remotes"); //$NON-NLS-0$
		
		that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.addRemote", 100); //$NON-NLS-0$
		that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, repository, that, "button"); //$NON-NLS-0$
				
		this.registry.getService("orion.git.provider").getGitRemote(remoteLocation).then( //$NON-NLS-0$
			function(resp){
				var remotes = resp.Children;
				
				progress.worked(messages["Rendering remotes"]);
				if (remotes.length === 0){
					titleWrapper.setTitle(messages["No Remotes"]);
					progress.done();
					return;
				}
				
				for(var i=0; i<remotes.length ;i++){
					that.renderRemote(remotes[i], i);
				};
				progress.done();
			}, function(error){
				progress.done();
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderRemote = function(remote, index){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow")  }, dojo.byId("remoteNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription", innerHTML: remote.Name }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription", innerHTML: remote.GitUrl}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		var actionsArea = dojo.create( "div", {"id":"remoteActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, remote, this, "tool");	 //$NON-NLS-0$

	};
	
	// Git Config
	
	GitRepositoryExplorer.prototype.displayConfig = function(repository, mode){
		
		var configLocation = repository.ConfigLocation;
	
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "configSection", //$NON-NLS-0$
			title: messages['Configuration'] + (mode === "full" ? "" : " (user.*)"), //$NON-NLS-2$ //$NON-NLS-1$
			slideout: true,
			content: '<list id="configNode" class="mainPadding"></list>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		});
		
		var progress = titleWrapper.createProgressMonitor();
		progress.begin(messages["Getting confituration"]);
				
		this.registry.getService("orion.git.provider").getGitCloneConfig(configLocation).then( //$NON-NLS-0$
			function(resp){
				progress.worked("Rendering configuration"); //$NON-NLS-0$
				var configurationEntries = resp.Children;
				
				if (mode !== "full" && configurationEntries.length !== 0){ //$NON-NLS-0$

					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id,
							{"ViewAllLink":"/git/git-repository.html#" + configLocation, "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all configuration entries"]}, that, "button"); //$NON-NLS-6$ //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				
				if (mode === "full"){ //$NON-NLS-0$
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.addConfigEntryCommand", 1000); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, repository, that, "button"); //$NON-NLS-0$
				}
				
				if (configurationEntries.length === 0){
					titleWrapper.setTitle("No Configuration"); //$NON-NLS-0$
					progress.done();
					return;
				}
				
				for(var i=0; i<configurationEntries.length ;i++){
					if (mode === "full" || configurationEntries[i].Key.indexOf("user.") !== -1) //$NON-NLS-1$ //$NON-NLS-0$
						that.renderConfigEntry(configurationEntries[i], i);
				}
				progress.done();
			}, function(error){
				progress.done();
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.renderConfigEntry = function(configEntry, index){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow")  }, dojo.byId("configNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "span", { "class":"gitMainDescription", innerHTML: configEntry.Key }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.create( "span", { "class":"gitSecondaryDescription", "style":"margin-left:20px", innerHTML: configEntry.Value}, detailsView ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		var actionsArea = dojo.create( "div", {"id":"configActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, configEntry, this, "tool"); //$NON-NLS-0$

	};
	
	return GitRepositoryExplorer;
}());

return exports;

// end of define
});
