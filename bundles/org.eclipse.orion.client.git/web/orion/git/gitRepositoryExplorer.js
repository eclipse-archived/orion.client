/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'require',
	'i18n!git/nls/gitmessages',
	'orion/git/widgets/gitChangeList',
	'orion/git/widgets/gitCommitList',
	'orion/git/widgets/gitBranchList',
	'orion/git/widgets/gitConfigList',
	'orion/git/widgets/gitTagList',
	'orion/git/widgets/gitRepoList',
	'orion/section',
	'orion/webui/littlelib',
	'orion/URITemplate',
	'orion/PageUtil',
	'orion/fileUtils',
	'orion/globalCommands',
	'orion/Deferred'
], function(require, messages, mGitChangeList, mGitCommitList, mGitBranchList, mGitConfigList, mGitTagList, mGitRepoList, mSection, lib, URITemplate, PageUtil, mFileUtils, mGlobalCommands, Deferred) {
var exports = {};
	
var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$

exports.GitRepositoryExplorer = (function() {
	
	/**
	 * Creates a new Git repository explorer.
	 * @class Git repository explorer
	 * @name orion.git.GitRepositoryExplorer
	 * @param options
	 * @param options.parentId
	 * @param options.registry
	 * @param options.linkService
	 * @param options.commandService
	 * @param options.fileClient
	 * @param options.gitClient
	 * @param options.progressService
	 * @param options.preferencesService
	 * @param options.statusService
	 * @param options.selection
 	 * @param options.pageNavId
	 * @param options.actionScopeId
	 */
	function GitRepositoryExplorer(options) {
		this.parentId = options.parentId;
		this.registry = options.registry;
		this.linkService = options.linkService;
		this.commandService = options.commandService;
		this.fileClient = options.fileClient;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.preferencesService = options.preferencesService;
		this.statusService = options.statusService;
		this.selection = options.selection;
		this.pageNavId = options.pageNavId;
		this.actionScopeId = options.actionScopeId;
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
			display.Message = error.DetailedMessage || error.Message || error.message;
		}
		this.statusService.setProgressResult(display);
		
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
		}
	};
	
	GitRepositoryExplorer.prototype.displayRepositories2 = function(location, processURLs){
		var that = this;
		this.loadingDeferred = new Deferred();
		if(processURLs){
			this.loadingDeferred.then(function(){
				that.commandService.processURL(window.location.href);
			});
		}
		
		this.progressService.progress(this.gitClient.getGitClone(location), "Getting git repository details").then(
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
				that.handleError(error);
			}
		);
	};
	
	GitRepositoryExplorer.prototype.displayRepository = function(location){
		var that = this;
		this.loadingDeferred = new Deferred();
		this.progressService.progress(this.gitClient.getGitClone(location), "Getting git repository details").then(
			function(resp){
				
				// render navigation commands
				var pageNav = lib.node(that.pageNavId);
				if(pageNav){
					lib.empty(pageNav);
					that.commandService.renderCommands(that.pageNavId, pageNav, resp, that, "button"); //$NON-NLS-0$
				}
				if (!resp.Children) {
					return;
				}
				
				var repositories;
				if (resp.Children.length === 0) {
					that.initTitleBar({});
					that.displayRepositories([], "full"); //$NON-NLS-0$
				} else if (resp.Children.length && resp.Children.length === 1 && resp.Children[0].Type === "Clone") { //$NON-NLS-0$
					repositories = resp.Children;
					
					that.initTitleBar(repositories[0]);
					that.displayRepositories(repositories, "mini"); //$NON-NLS-0$
					that.statusDeferred = that.displayStatus(repositories[0]);
					that.displayCommits(repositories[0]);
					that.displayBranches(repositories[0]); //$NON-NLS-0$
					that.displayTags(repositories[0]);
					that.displayConfig(repositories[0], "full"); //$NON-NLS-0$
				} else if (resp.Children[0].Type === "Clone"){ //$NON-NLS-0$
					repositories = resp.Children;
					
					that.initTitleBar(repositories);
					that.displayRepositories(repositories, "full", true); //$NON-NLS-0$
				}
			}, function(error){
				that.handleError(error);
			}
		);
	};
	
	var updatePageActions = function(registry, commandService, toolbarId, scopeId, item){
		var toolbar = lib.node(toolbarId);
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
		var task = messages.Repo;
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
			item.Parents[1].Name = messages.Repo;
			task = sectionName;
		} else if (resource && resource.Type === "Clone") { //$NON-NLS-0$
			repository = resource;
			item.Name = repository.Name;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = messages.Repo;
		} else {
			item.Name = messages.Repo;
			scopeId = "reposPageActions";
		}
		
		updatePageActions(that.registry, that.commandService, "pageActions", scopeId, repository || {}); //$NON-NLS-1$ //$NON-NLS-0$
		mGlobalCommands.setPageTarget({task: messages.Repo, target: repository, breadcrumbTarget: item,
			makeBreadcrumbLink: function(seg, location) {
				seg.href = require.toUrl(repoTemplate.expand({resource: location || ""}));
			},
			serviceRegistry: this.registry, commandService: this.commandService}); 
	};
	
	// Git repo
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, mode, links){
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		lib.empty(tableNode);
		var contentParent = document.createElement("div");
		tableNode.appendChild(contentParent);
					
		contentParent.innerHTML = '<div id="repositoryNode" class="mainPadding"></div>'; //$NON-NLS-0$
		var repoNavigator = new mGitRepoList.GitRepoListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "repositoryNode",
			actionScopeId: mode === "mini" ? "itemLevelCommandsMini" : this.actionScopeId,
			handleError: this.handleError,
			repositories: repositories,
			mode: mode,
			links: links,
			loadingDeferred: this.loadingDeferred
		});
		repoNavigator.display();
	};
	
	// Git branches
	
	GitRepositoryExplorer.prototype.displayBranches = function(repository){
		
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "branchSection", //$NON-NLS-0$
			title: messages['Branches'],
			iconClass: ["gitImageSprite", "git-sprite-branch"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="branchNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.preferencesService
		});
		var branchNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "branchNode",
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError,
			root: {
				Type: "RemoteRoot",
				repository: repository,
			}
		});
		branchNavigator.display();
	};
	

	// Git status
		
	GitRepositoryExplorer.prototype.displayStatus = function(repository){	
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$

		var titleWrapper = new mSection.Section(tableNode, {
			id: "statusSection", //$NON-NLS-0$
			title: messages["ChangedFiles"],
			slideout: true,
			content: '<div id="statusNode"></div>', //$NON-NLS-0$
			canHide: false,
			preferenceService: this.preferencesService
		}); 
		
		var explorer  = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			selection: this.stagedSelection,
			parentId:"statusNode", 
			prefix: "all",
			location: repository.StatusLocation,
			repository: repository,
			section: titleWrapper,
			editableInComparePage: true,
			handleError: this.handleError,
			gitClient: this.gitClient,
			progressService: this.progressService
		});
		return explorer.display();
	};
	

	// Git commits
		
	GitRepositoryExplorer.prototype.displayCommits = function(repository){	
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$

		var titleWrapper = new mSection.Section(tableNode, {
			id: "commitSection", //$NON-NLS-0$
			title: messages["Commits"],
			slideout: true,
			content: '<div id="commitNode"></div>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.preferencesService
		}); 
		
		var explorer = new mGitCommitList.GitCommitListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			statusService: this.statusService,
			selection: this.selection,
			actionScopeId: this.actionScopeId,
			parentId:"commitNode",
			section: titleWrapper,
			handleError: this.handleError,
			root: {
				Type: "CommitRoot",
				repository: repository
			}
		});
		this.statusDeferred.then(function() {
			explorer.display();
		});
	};
	
	// Git tags
	
	GitRepositoryExplorer.prototype.displayTags = function(repository){
		// render section even before initialRender
		var tableNode = lib.node("table");
		var titleWrapper = new mSection.Section(tableNode, {
			id : "tagSection",
			iconClass : ["gitImageSprite", "git-sprite-tag"], //$NON-NLS-1$ //$NON-NLS-0$
			title : "Tags",
			content : '<div id="tagNode"></div>',
			canHide : true,
			hidden : true,
			preferenceService : this.preferencesService
		});

		var tagsNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "tagNode",
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError,
			root: {
				Type: "TagRoot",
				repository: repository,
			}
		});
		tagsNavigator.display();
	};
	
	// Git Config
	
	GitRepositoryExplorer.prototype.displayConfig = function(repository, mode){
		
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		
		var titleWrapper = new mSection.Section(tableNode, {
			id: "configSection", //$NON-NLS-0$
			title: messages['Configuration'] + (mode === "full" ? "" : " (user.*)"), //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="configNode" class="mainPadding"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.preferencesService
		});
			
		var configNavigator = new mGitConfigList.GitConfigListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId:"configNode",
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError,
			root: {
				Type: "ConfigRoot",
				repository: repository,
				mode: mode
			}
		});
		configNavigator.display();
	};
	
	
	return GitRepositoryExplorer;
}());

return exports;

// end of define
});
