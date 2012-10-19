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

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/commands', 'orion/section', 'orion/dynamicContent', 'orion/git/widgets/FilterSearchBox', 'orion/fileUtils', 'orion/PageUtil', 'orion/globalCommands', 'orion/git/gitCommands', 'orion/git/widgets/CommitTooltipDialog', 'dojo/date/locale'], 
		function(messages, require, dojo, mCommands, mSection, mDynamicContent, mFilterSearchBox, mFileUtils, PageUtil, mGlobalCommands, mGitCommands) {
var exports = {};

exports.GitRepositoryExplorer = (function() {
	
	/**
	 * Creates a new Git repository explorer.
	 * @class Git repository explorer
	 * @name orion.git.GitRepositoryExplorer
	 * @param registry
	 * @param commandService
	 * @param linkService
	 * @param selection
	 * @param parentId
	 * @param actionScopeId
	 */
	function GitRepositoryExplorer(registry, commandService, linkService, selection, parentId, pageNavId, actionScopeId){
		this.parentId = parentId;
		this.registry = registry;
		this.linkService = linkService;
		this.commandService = commandService;
		this.selection = selection;
		this.parentId = parentId;
		this.pageNavId = pageNavId;
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
		// An item changed so we do not need to process any URLs
		this.redisplay(false);
	};
	
	GitRepositoryExplorer.prototype.redisplay = function(processURLs){
		// make sure to have this flag
		if(processURLs === undefined){
			processURLs = true;
		}
	
		var pageParams = PageUtil.matchResourceParameters();
		if (pageParams.resource) {
			this.displayRepository(pageParams.resource);
		} else {
			var path = this.defaultPath;
			var relativePath = mFileUtils.makeRelative(path);
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone._"); //$NON-NLS-0$
			gitapiCloneUrl = gitapiCloneUrl.substring(0, gitapiCloneUrl.length-2);
			
			this.displayRepositories2(relativePath[0] === "/" ? gitapiCloneUrl + relativePath : gitapiCloneUrl + "/" + relativePath, processURLs); //$NON-NLS-1$ //$NON-NLS-0$
		};
	};
	
	GitRepositoryExplorer.prototype.displayRepositories2 = function(location, processURLs){
		var that = this;
		this.loadingDeferred = new dojo.Deferred();
		if(processURLs){
			this.loadingDeferred.then(function(){
				that.commandService.processURL(window.location.href);
			});
		}
		
		var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		progressService.showWhile(this.loadingDeferred, "Loading..."); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitClone(location).then( //$NON-NLS-0$
			function(resp){
				if (resp.Children.length === 0) {
					that.initTitleBar({});
					that.displayRepositories([], "full"); //$NON-NLS-0$
				} else if (resp.Children[0].Type === "Clone"){ //$NON-NLS-0$
					var repositories = resp.Children;
					
					that.initTitleBar(repositories);
					that.displayRepositories(repositories, "full", true); //$NON-NLS-0$
				}
				
				//that.commandService.processURL(window.location.href);
			}, function(error){
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.displayRepository = function(location){
		var that = this;
		this.loadingDeferred = new dojo.Deferred();
		var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		progressService.showWhile(this.loadingDeferred, "Loading..."); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitClone(location).then( //$NON-NLS-0$
			function(resp){
				
				// render navigation commands
				var pageNav = dojo.byId(that.pageNavId);
				if(pageNav){
					dojo.empty(that.pageNavId);
					that.commandService.renderCommands(that.pageNavId, pageNav, resp, that, "button");
				}
				
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
				//that.commandService.processURL(window.location.href);
				progressService.setProgressMessage("");
			}, function(error){
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
	
	var updatePageActions = function(registry, toolbarId, scopeId, item){
		var toolbar = dojo.byId(toolbarId);
		var commandService = registry.getService("orion.page.command"); //$NON-NLS-0$
		if (toolbar) {
			commandService.destroy(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId; //$NON-NLS-0$
		}
		commandService.renderCommands(scopeId, toolbar, item, null, "button");  //$NON-NLS-0$
	};
	
	GitRepositoryExplorer.prototype.initTitleBar = function(resource, sectionName){
		var that = this;
		var item = {};
		var task = "Repositories";
		var scopeId = "repoPageActions";

		var repository;
		if (resource && resource.Type === "Clone" && sectionName){ //$NON-NLS-0$
			repository = resource;
			item.Name = sectionName;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].Location = repository.Location;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = "Repositories"; //$NON-NLS-0$
			task = sectionName;
		} else if (resource && resource.Type === "Clone") { //$NON-NLS-0$
			repository = resource;
			item.Name = repository.Name;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = "Repositories"; //$NON-NLS-0$
		} else {
			item.Name = "Repositories"; //$NON-NLS-0$
			scopeId = "reposPageActions";
		}
		
		updatePageActions(that.registry, "pageActions", scopeId, repository || {}); //$NON-NLS-1$ //$NON-NLS-0$
		mGlobalCommands.setPageTarget({task: "Repositories", target: repository, breadcrumbTarget: item,
			makeBreadcrumbLink: function(seg, location) {
				seg.href = "/git/git-repository.html#" + (location ? location : ""); //$NON-NLS-0$
			},
			serviceRegistry: this.registry, commandService: this.commandService}); 
	};
	
	// Git repo
	
	GitRepositoryExplorer.prototype.decorateRepository = function(repository, mode, deferred){
		var that = this;
		if (deferred == null){
			deferred = new dojo.Deferred();
		}
		
		if(!mode){
			mode = "full";
		}
		
		
		this.registry.getService("orion.core.file").loadWorkspace(repository.ContentLocation + "?parts=meta").then( //$NON-NLS-1$ //$NON-NLS-0$
				function(resp){
					try{
						repository.Content = {};
						
						var path = "root / "; //$NON-NLS-0$
						if (resp.Parents !== null)
							for (var i=resp.Parents.length; i>0; i--){
								path += resp.Parents[i-1].Name + " / "; //$NON-NLS-0$
							}
							
						path += resp.Name;
						repository.Content.Path = path;
						
						if (mode !== "full"){ //$NON-NLS-0$
							deferred.callback();
							return;
						}
						
						that.registry.getService("orion.git.provider").getGitStatus(repository.StatusLocation).then( //$NON-NLS-0$
							function(resp){
								try{
									repository.Status = resp;
		
									that.registry.getService("orion.git.provider").getGitBranch(repository.BranchLocation).then( //$NON-NLS-0$
										function(resp){
											try{
												var branches = resp.Children || [];
												var currentBranch;
												for (var i=0; i<branches.length; i++){
													if (branches[i].Current){
														currentBranch = branches[i];
														break;
													}
												}
												
												if (!currentBranch || currentBranch.RemoteLocation[0] === null){
													deferred.callback();
													return;
												}
												
												var tracksRemoteBranch = (currentBranch.RemoteLocation.length === 1 && currentBranch.RemoteLocation[0].Children.length === 1);
												
												if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
													that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
														function(resp){
															if(resp.Children === undefined) { repository.CommitsToPush = 0; }
															else { repository.CommitsToPush = resp.Children.length; }
															deferred.callback();
															return;
														}, function(resp){
															deferred.errback();
															return;
														}
													);
												} else {
													that.registry.getService("orion.git.provider").doGitLog(currentBranch.CommitLocation + "?page=1&pageSize=20").then(  //$NON-NLS-1$ //$NON-NLS-0$
														function(resp){	
															if(resp.Children === undefined) { repository.CommitsToPush = 0; }
															else { repository.CommitsToPush = resp.Children.length; }
															deferred.callback();
															return;
														}, function(resp){
															deferred.errback();
															return;
														}
													);	
												}
											}catch(e){
												deferred.errback();
											}
										}, function(resp){
											deferred.errback();
											return;
										}
									);
								}catch(e){
									deferred.errback();
								}
							}, function(resp){
								deferred.errback();
								return;
							}	
						);
					}catch(e){
						deferred.errback(e);
					}
				}, function(resp){
					deferred.errback();
					return;
				 }
			);
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, mode, links){
		var that = this;
		var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		
		var dynamicContentModel = new mDynamicContent.DynamicContentModel(repositories,
			function(i){
				return that.decorateRepository.bind(that)(repositories[i]);
			}
		);
		
		var dcExplorer = new mDynamicContent.DynamicContentExplorer(dynamicContentModel);
		var repositoryRenderer = {
		
			initialRender : function(){
				var tableNode = dojo.byId('table');	 //$NON-NLS-0$
				dojo.empty(tableNode);
				
				if(!repositories || repositories.length === 0){
					var titleWrapper = new mSection.Section(tableNode, {
						id: "repositorySection", //$NON-NLS-0$
						title: "Repository",
						iconClass: "gitImageSprite git-sprite-repository" //$NON-NLS-0$
					});
					titleWrapper.setTitle(mode === "full" ? messages["No Repositories"] : messages["Repository Not Found"]); //$NON-NLS-0$
					that.loadingDeferred.callback();
					progressService.setProgressMessage("");
					return;
				}
				
				var contentParent = dojo.create("div", {"role": "region", "class":"sectionTable"}, tableNode, "last");
				contentParent.innerHTML = '<list id="repositoryNode" class="mainPadding"></list>'; //$NON-NLS-0$
			},
			
			cleanupRender : function(){
				that.loadingDeferred.callback();
				progressService.setProgressMessage("");
			},
			
			renderBeforeItemPopulation : function(i){
				var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((repositories.length === 1) ? "" : ((i % 2) ? "darkTreeTableRow" : "lightTreeTableRow"))}, dojo.byId("repositoryNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
				
				var detailsView = dojo.create( "div", { "class":"stretch" }, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				var title = dojo.create( "span", { "class":"gitMainDescription"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				if (links){
					var link = dojo.create("a", {"class": "navlinkonpage", href: "/git/git-repository.html#" + repositories[i].Location}, title); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(document.createTextNode(repositories[i].Name), link);
				} else { dojo.place(document.createTextNode(repositories[i].Name), title); }
				
				//create indicator
				this.explorer.progressIndicators[i] = new this.explorer.progressIndicator(i, title);
				
				dojo.create("div", null, detailsView);
				var span = dojo.create("span", {"class" : "gitSecondaryDescription" }, detailsView);
				span.textContent = (repositories[i].GitUrl != null ? "git url: " + repositories[i].GitUrl : messages["(no remote)"]);
				dojo.create("div", null, detailsView);
				dojo.create("span", { "id" : "location"+i, "class":"gitSecondaryDescription" }, detailsView);
				
				dojo.create("div", {"style" : "padding-top:10px"}, detailsView);
				dojo.create("span", {"id":"workspaceState"+i, "class":"gitSecondaryDescription", "style" : "padding-left:10px"}, detailsView);
				dojo.create("span", {"id":"commitsState"+i, "class":"gitSecondaryDescription", "style" : "padding-left:10px"}, detailsView);
				
				if (mode === "full"){
					var actionsArea = dojo.create( "div", {"id":"repositoryActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					that.commandService.renderCommands(that.actionScopeId, actionsArea, repositories[i], that, "tool"); //$NON-NLS-0$
				}
			},
			
			renderAfterItemPopulation : function(i){
				that.renderRepository(repositories[i], i, repositories.length, mode, links);
			}
		};
		
		dcExplorer.use(repositoryRenderer);
		dcExplorer.render();
	};
	
	GitRepositoryExplorer.prototype.renderRepository = function(repository, index, length, mode, links){
		dojo.byId("location"+index).textContent = messages["location: "] + repository.Content.Path;
		var status = repository.Status;
		
		if (mode === "full"){ //$NON-NLS-0$
			var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length;
			var staged = status.Changed.length + status.Added.length + status.Removed.length;
			
			var workspaceState = ((unstaged > 0 || staged > 0) 
				? dojo.string.substitute(messages["${0} file(s) to stage and ${1} file(s) to commit."], [unstaged, staged])
				: messages["Nothing to commit."]);
			
			dojo.byId("workspaceState"+index).textContent = workspaceState;
			
			var commitsState = repository.CommitsToPush;
			dojo.byId("commitsState"+index).textContent = ((commitsState > 0) ? commitsState + messages[" commit(s) to push."] : messages["Nothing to push."]);	
		}
	};
	
	// Git status
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository){
		
		var statusLocation = repository.StatusLocation;
		
		var that = this;
		
		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$

		var titleWrapper = new mSection.Section(tableNode, {
			id: "workingDirectorySection", //$NON-NLS-0$
			title: messages["Working Directory"], //$NON-NLS-0$
			content: '<list id="workingDirectoryNode" class="mainPadding"></list>' //$NON-NLS-0$
		});
		
		that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
		that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
			{"ViewAllLink":"/git/git-status2.html#" + repository.StatusLocation, "ViewAllLabel": messages["See Full Status"], "ViewAllTooltip": messages["See the status"]}, that, "button");
		
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
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, dojo.byId("workingDirectoryNode") , "only"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length;
		var staged = status.Changed.length + status.Added.length + status.Removed.length;
		var workspaceState = messages["You have no changes to commit."]
		
		if (unstaged > 0 || staged > 0)
			workspaceState = messages["You have changes to commit in your workspace!"]
		
		var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription"}, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		title.textContent = workspaceState;
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription" }, detailsView );   //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		description.textContent = dojo.string.substitute(messages['${0} file(s) to stage and ${1} file(s) to commit.'], [unstaged, staged]);
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
			content: '<div id="branchNode"></div>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		});

		var progress = titleWrapper.createProgressMonitor();
		progress.begin("Getting branches"); //$NON-NLS-0$
		this.registry.getService("orion.git.provider").getGitBranch(branchLocation + (mode === "full" ? "?commits=1" : "?commits=1&page=1&pageSize=5")).then( //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			function(resp){
				var branches = resp.Children;
				progress.done();
				
				that.commandService.destroy(titleWrapper.actionsNode.id);
				
				if (mode !== "full" && branches.length !== 0){ //$NON-NLS-0$
					that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
					that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
						{"ViewAllLink":"/git/git-repository.html#" + branchLocation + "?page=1", "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all local and remote tracking branches"]}, that, "button"); //$NON-NLS-7$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
				
				that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.addBranch", 200); //$NON-NLS-0$
				that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, repository, that, "button"); //$NON-NLS-0$
				
				var branchesContainer = dojo.create("list", {className: "mainPadding"});
				
				for(var i=0; i<branches.length;i++){
					branches[i].ParentLocation = branchLocation;
					that.renderBranch(branches[i], i, branchesContainer);
				}
				
				dojo.place(branchesContainer, dojo.byId("branchNode"), "only");
			}, function(error){
				progress.done();
				dojo.hitch(that, that.handleError)(error);
			}
		);
	};
		
	GitRepositoryExplorer.prototype.renderBranch = function(branch, index, container){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow")  }, container ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$

		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		if (branch.Current)
			dojo.create( "span", { "class":"sectionIcon gitImageSprite git-sprite-branch_active" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var title = dojo.create( "span", { "class":"gitMainDescription " + (branch.Current ? "activeBranch" : "") }, detailsView ); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		title.textContent = branch.Name;
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var commit = branch.Commit.Children[0];
		
		var tracksMessage = ((branch.RemoteLocation.length == 1 && branch.RemoteLocation[0].Children.length == 1) ? 
				dojo.string.substitute(messages["tracks ${0}, "], [branch.RemoteLocation[0].Children[0].Name]) : messages["tracks no branch, "]);
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		description.textContent = tracksMessage + dojo.string.substitute(messages["last modified ${0} by ${1}"], [dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"}), //$NON-NLS-0$
			commit.AuthorName]);
		
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
				that.displayRemoteBranches2(titleWrapper, remotes, repository).addBoth(function(){
					progress.done();
				});
			}, function(error){
				progress.done(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.displayRemoteBranches2 = function(titleWrapper, remotes, repository, deferred, anyRemoteBranch, previousRemoteBranches){
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
					
					//concat with previous branches to get full list for the search box
					if(previousRemoteBranches){
						remoteBranches = previousRemoteBranches.concat(remoteBranches);
					}
					
					if(remotes.length === 1){
						//add filter/search box after all branches are rendered
						var remoteBranchesSearchBox = new mFilterSearchBox.FilterSearchBox({
							items : remoteBranches,
							renderItem : function(branch){
								that.renderRemoteBranch.bind(that)(branch);
							},
							sectionId : "remoteBranchSection",
							itemNode : "remoteBranchNode",
							placeHolder : messages["Filter remote branches"]
						});
						
						remoteBranchesSearchBox.render();
					}
					
					that.displayRemoteBranches2(titleWrapper, remotes.slice(1), repository, deferred, (anyRemoteBranch || (remoteBranches.length > 0)), remoteBranches);
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
		var title = dojo.create( "span", { "class":"gitMainDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		title.textContent = remoteBranch.Name;
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
			content: '<div id="commitNode"></div>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.registry.getService("orion.core.preference") //$NON-NLS-0$
		}); 

		var progress = titleWrapper.createProgressMonitor();
		progress.begin(messages["Getting current branch"]);
		
		var commitsContainer = dojo.create("list", { className: "mainPadding"});
		
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
				
				if (!currentBranch){
					progress.done();
					return;
				}
				
				var tracksRemoteBranch = (currentBranch.RemoteLocation.length === 1 && currentBranch.RemoteLocation[0].Children.length === 1);
				
				titleWrapper.setTitle(dojo.string.substitute(messages["Commits for \"${0}\" branch"], [currentBranch.Name])); //$NON-NLS-1$ //$NON-NLS-0$
				
				that.commandService.destroy(titleWrapper.actionsNode.id);

				that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
				that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id, 
					{"ViewAllLink":"/git/git-log.html#" + currentBranch.CommitLocation + "?page=1", "ViewAllLabel":messages["See Full Log"], "ViewAllTooltip":messages["See the full log"]}, that, "button"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
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
					that.renderNoCommit(commitsContainer);
					return;
				}
				
				progress.worked(dojo.string.substitute(messages["Getting commits for \"${0}\" branch"], [currentBranch.Name]));
				if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
					that.registry.getService("orion.git.provider").getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD").then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						function(resp){
							progress.worked(messages["Rendering commits"]);
							
							var commitsCount = resp.Children.length;
							
							for (var i=0; i<resp.Children.length; i++){
								that.renderCommit(resp.Children[i], true, i, commitsContainer);
							}
							
							progress.worked(messages["Getting outgoing commits"]);
							that.registry.getService("orion.git.provider").getLog(currentBranch.CommitLocation + "?page=1&pageSize=20", currentBranch.RemoteLocation[0].Children[0].Id).then(  //$NON-NLS-1$ //$NON-NLS-0$
								function(resp){	
									progress.worked("Rendering commits"); //$NON-NLS-0$
									for (var i=0; i<resp.Children.length; i++){
										that.renderCommit(resp.Children[i], false, i + commitsCount, commitsContainer);
									}
									
									commitsCount = commitsCount + resp.Children.length; 
									
									if (commitsCount === 0){
										that.renderNoCommit(commitsContainer);
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
								that.renderCommit(resp.Children[i], true, i, commitsContainer);
							}
							
							if (resp.Children.length === 0){
								that.renderNoCommit(commitsContainer);
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
		dojo.place(commitsContainer, dojo.byId("commitNode"), "only");
		
	};
	
	GitRepositoryExplorer.prototype.renderNoCommit = function(container){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, container); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var title = dojo.create( "span", { "class":"gitMainDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		title.textContent = messages["The branch is up to date."];
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		
		var description = dojo.create( "span", { "class":"gitSecondaryDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		description.textContent = messages["You have no outgoing or incoming commits."];
	};
		
	GitRepositoryExplorer.prototype.renderCommit = function(commit, outgoing, index, container){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((index % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, container ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
		var description = dojo.create( "span", { "class":"gitSecondaryDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		description.textContent = messages[" (SHA "] + commit.Name + messages[") by "] + commit.AuthorName 
			+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"});
		
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, commit, this, "tool");	 //$NON-NLS-0$
	};

	// Git tags
	
	GitRepositoryExplorer.prototype.decorateTag = function(tag, deferred){
		if(deferred == null){
			deferred = new dojo.Deferred();
		}
		
		this.registry.getService("orion.git.provider").doGitLog(tag.CommitLocation + "?page=1&pageSize=1").then(
			function(resp){
				tag.Commit = resp.Children[0];
				deferred.callback();
			}, function(err){
				deferred.errback();
			}
		);
		
		return deferred;
	};
	
	GitRepositoryExplorer.prototype.displayTags = function(repository, mode){
		var that = this;
		var href = window.location.href;
		var getParameters = dojo.queryToObject(href.substring(href.indexOf('?') + 1));
		
		// default page values
		var page = 1, pageSize = 20;
		
		// override defaults
		if(getParameters.page) { page = getParameters.page; }
		if(getParameters.pageSize) { pageSize = getParameters.pageSize; }
		
		// render section even before initialRender
		var tableNode = dojo.byId("table");
		var titleWrapper = new mSection.Section(tableNode, {
			id : "tagSection",
			iconClass : "gitImageSprite git-sprite-tag",
			title : ("Tags" + (mode === "full" ? "" : " (5 most recent)")),
			content : '<div id="tagNode"></div>',
			canHide : true,
			hidden : true,
			preferenceService : that.registry.getService("orion.core.preference")
		});
						
		var progress = titleWrapper.createProgressMonitor();
		progress.begin(messages["Getting tags"]);
		var tagsContainer = dojo.create("list", {className: "mainPadding"});
		this.registry.getService("orion.git.provider").getGitBranch(repository.TagLocation + (mode === "full" ? "?page="+page+"&pageSize="+pageSize : "?page=1&pageSize=5")).then(
			function(resp){
				var tags = resp.Children;
				
				var dynamicContentModel = new mDynamicContent.DynamicContentModel(tags,
					function(i){
						return that.decorateTag.bind(that)(tags[i]);
					});
						
				var dcExplorer = new mDynamicContent.DynamicContentExplorer(dynamicContentModel);
				var tagRenderer = {
					initialRender : function(){
						progress.done();
						dojo.place(tagsContainer, dojo.byId("tagNode"), "only");
						
						that.commandService.destroy(titleWrapper.actionsNode.id);
						
						if (mode !== "full" && tags.length !== 0){ //$NON-NLS-0$
							that.commandService.registerCommandContribution(titleWrapper.actionsNode.id, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
							that.commandService.renderCommands(titleWrapper.actionsNode.id, titleWrapper.actionsNode.id,
									{"ViewAllLink":"/git/git-repository.html#" + repository.TagLocation + "?page=1&pageSize=20", "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all tags"]}, that, "button"); //$NON-NLS-7$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						}
		
						if (tags.length === 0) {
							titleWrapper.setTitle(messages['No Tags']);
						}
					},
					
					renderBeforeItemPopulation : function(i){
						var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((i % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, tagsContainer ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
						
						var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						var title = dojo.create( "span", { "class":"gitMainDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						title.textContent = tags[i].Name;
						
						this.explorer.progressIndicators[i] = new this.explorer.progressIndicator(i, title);
						
						dojo.create( "div", {"id":"tagDetailsView"+i}, detailsView ); //$NON-NLS-0$
						
						var actionsArea = dojo.create( "div", {"id":"tagActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						that.commandService.renderCommands(that.actionScopeId, actionsArea, tags[i], that, "tool");	 //$NON-NLS-0$
					},
					
					
					renderAfterItemPopulation : function(i){
						that.renderTag(tags[i], i);
					}			
				};
				
				dcExplorer.use(tagRenderer);
				dcExplorer.render();
			
			}, function(err){
				progress.done();
				dojo.hitch(that, that.handleError)(err);
			}
		);
	};
			
	GitRepositoryExplorer.prototype.renderTag = function(tag, i){
		var description = dojo.create( "span", { "class":"tag-description"}, dojo.byId("tagDetailsView"+i), "only" ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						
		var commit = tag.Commit;
		
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
	};
	
	// Git Remotes
	
	GitRepositoryExplorer.prototype.displayRemotes = function(repository, mode){
		
		var remoteLocation = repository.RemoteLocation;
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
		var title = dojo.create( "span", { "class":"gitMainDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		title.textContent = remote.Name;
		
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		description.textContent = remote.GitUrl;

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
		var keySpan = dojo.create( "span", { "class":"gitMainDescription" }, detailsView ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		keySpan.textContent = configEntry.Key;
		var valueSpan = dojo.create( "span", { "class":"gitSecondaryDescription", "style":"margin-left:20px" }, detailsView ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		valueSpan.textContent = configEntry.Value;

		var actionsArea = dojo.create( "div", {"id":"configActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.commandService.renderCommands(this.actionScopeId, actionsArea, configEntry, this, "tool"); //$NON-NLS-0$

	};
	
	return GitRepositoryExplorer;
}());

return exports;

// end of define
});
