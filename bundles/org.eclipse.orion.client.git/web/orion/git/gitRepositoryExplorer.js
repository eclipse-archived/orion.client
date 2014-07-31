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
	'orion/git/widgets/gitRepoList',
	'orion/section',
	'orion/webui/littlelib',
	'orion/URITemplate',
	'orion/PageUtil',
	'orion/fileUtils',
	'orion/globalCommands',
	'orion/Deferred'
], function(require, messages, mGitChangeList, mGitCommitList, mGitBranchList, mGitConfigList, mGitRepoList, mSection, lib, URITemplate, PageUtil, mFileUtils, mGlobalCommands, Deferred) {
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
	
	GitRepositoryExplorer.prototype.changedItem = function() {
		// An item changed so we do not need to process any URLs
		this.redisplay(false);
	};
	
	GitRepositoryExplorer.prototype.redisplay = function(processURLs) {
		// make sure to have this flag
		this.destroy();
		if (processURLs === undefined) {
			processURLs = true;
		}
		var pageParams = PageUtil.matchResourceParameters();
		var location = pageParams.resource;
		if (!pageParams.resource) {
			var path = this.defaultPath;
			var relativePath = mFileUtils.makeRelative(path);
			
			//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
			var gitapiCloneUrl = require.toUrl("gitapi/clone._"); //$NON-NLS-0$
			gitapiCloneUrl = gitapiCloneUrl.substring(0, gitapiCloneUrl.length-2);
			
			location = relativePath[0] === "/" ? gitapiCloneUrl + relativePath : gitapiCloneUrl + "/" + relativePath; //$NON-NLS-1$ //$NON-NLS-0$
		}
		this.display(location, processURLs);
	};
	
	GitRepositoryExplorer.prototype.destroy = function() {
		if (this.repoNavigator) {
			this.repoNavigator.destroy();
			this.repoNavigator = null;
		}
		if (this.branchesNavigator) {
			this.branchesNavigator.destroy();
			this.branchesNavigator = null;
		}
		if (this.statusNavigator) {
			this.statusNavigator.destroy();
			this.statusNavigator = null;
		}
		if (this.commitsNavigator) {
			this.commitsNavigator.destroy();
			this.commitsNavigator = null;
		}
		if (this.tagsNavigator) {
			this.tagsNavigator.destroy();
			this.tagsNavigator = null;
		}
		if (this.configNavigator) {
			this.configNavigator.destroy();
			this.configNavigator = null;
		}
	};
	
	GitRepositoryExplorer.prototype.display = function(location, processURLs) {
		var that = this;
		this.loadingDeferred = new Deferred();
		if (processURLs){
			this.loadingDeferred.then(function(){
				that.commandService.processURL(window.location.href);
			});
		}
		this.progressService.progress(this.gitClient.getGitClone(location), messages["Getting git repository details"]).then(
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
					if (that.showTagsSeparately) {
						that.displayTags(repositories[0]);
					}
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
	
	GitRepositoryExplorer.prototype.initTitleBar = function(resource, sectionName) {
		var item = {};
		var task = messages.Repo;
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
			item.Parents[1].Name = task;
			task = sectionName;
		} else if (resource && resource.Type === "Clone") { //$NON-NLS-0$
			repository = resource;
			item.Name = repository.Name;
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = task;
		} else {
			item.Name = task;
		}
		
		mGlobalCommands.setPageTarget({
			task: task,
			target: repository,
			breadcrumbTarget: item,
			makeBreadcrumbLink: function(seg, location) {
				seg.href = require.toUrl(repoTemplate.expand({resource: location || ""}));
			},
			serviceRegistry: this.registry,
			commandService: this.commandService
		});
	};
	
	GitRepositoryExplorer.prototype.displayRepositories = function(repositories, mode, links) {
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		lib.empty(tableNode);
		
		var titleWrapper;
		if (mode !== "mini") { //$NON-NLS-0$
			titleWrapper = new mSection.Section(tableNode, {
				id: "repoSection", //$NON-NLS-0$
				title: messages["Repo"],
				iconClass: ["gitImageSprite", "git-sprite-repository"], //$NON-NLS-1$ //$NON-NLS-0$
				slideout: true,
				content: '<div id="repositoryNode"></div>', //$NON-NLS-0$
				canHide: true,
				hidden: true,
				preferenceService: this.preferencesService
			});
		} else {
			var contentParent = document.createElement("div"); //$NON-NLS-0$
			contentParent.className = "miniWrapper"; //$NON-NLS-0$
			contentParent.innerHTML = '<div id="repositoryNode" class="mainPadding"></div>'; //$NON-NLS-0$
			tableNode.appendChild(contentParent);
		}
		
		var repoNavigator = this.repoNavigator = new mGitRepoList.GitRepoListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "repositoryNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			handleError: this.handleError.bind(this),
			section: titleWrapper,
			repositories: repositories,
			mode: mode,
			showLinks: links,
		});
		return repoNavigator.display().then(this.loadingDeferred.resolve, this.loadingDeferred.reject);
	};
	
	GitRepositoryExplorer.prototype.displayBranches = function(repository) {
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		var titleWrapper = new mSection.Section(tableNode, {
			id: "branchSection", //$NON-NLS-0$
			title: this.showTagsSeparately ? messages["Branches"] : messages['BranchesTags'],
			iconClass: ["gitImageSprite", "git-sprite-branch"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="branchNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			preferenceService: this.preferencesService
		});
		var branchNavigator = this.branchesNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "branchNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError.bind(this),
			showTags: !this.showTagsSeparately,
			root: {
				Type: "RemoteRoot", //$NON-NLS-0$
				repository: repository,
			}
		});
		return branchNavigator.display();
	};
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository) {	
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		var titleWrapper = new mSection.Section(tableNode, {
			id: "statusSection", //$NON-NLS-0$
			title: messages["ChangedFiles"],
			slideout: true,
			content: '<div id="statusNode"></div>', //$NON-NLS-0$
			canHide: false,
			preferenceService: this.preferencesService
		}); 
		
		var explorer  = this.statusNavigator = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			selection: this.stagedSelection,
			parentId:"statusNode", //$NON-NLS-0$
			prefix: "all", //$NON-NLS-0$
			location: repository.StatusLocation,
			repository: repository,
			section: titleWrapper,
			editableInComparePage: true,
			handleError: this.handleError.bind(this),
			gitClient: this.gitClient,
			progressService: this.progressService
		});
		return explorer.display();
	};

	GitRepositoryExplorer.prototype.displayCommits = function(repository) {	
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		var titleWrapper = new mSection.Section(tableNode, {
			id: "commitSection", //$NON-NLS-0$
			title: messages["Commits"],
			slideout: true,
			content: '<div id="commitNode"></div>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.preferencesService
		}); 
		
		var explorer = this.commitsNavigator = new mGitCommitList.GitCommitListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			statusService: this.statusService,
			selection: this.selection,
			actionScopeId: this.actionScopeId,
			parentId:"commitNode", //$NON-NLS-0$
			section: titleWrapper,
			handleError: this.handleError.bind(this),
			root: {
				Type: "CommitRoot", //$NON-NLS-0$
				repository: repository
			}
		});
		return this.statusDeferred.then(function() {
			return explorer.display();
		});
	};
	
	GitRepositoryExplorer.prototype.displayTags = function(repository) {
		var tableNode = lib.node("table"); //$NON-NLS-0$
		var titleWrapper = new mSection.Section(tableNode, {
			id : "tagSection", //$NON-NLS-0$
			iconClass : ["gitImageSprite", "git-sprite-tag"], //$NON-NLS-1$ //$NON-NLS-0$
			title : messages["Tags"],
			content : '<div id="tagNode"></div>', //$NON-NLS-0$
			canHide : true,
			hidden : true,
			preferenceService : this.preferencesService
		});

		var tagsNavigator = this.tagsNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "tagNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError.bind(this),
			root: {
				Type: "TagRoot", //$NON-NLS-0$
				repository: repository,
			}
		});
		return tagsNavigator.display();
	};
	
	GitRepositoryExplorer.prototype.displayConfig = function(repository, mode) {
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
			
		var configNavigator = this.configNavigator = new mGitConfigList.GitConfigListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId:"configNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: titleWrapper,
			handleError: this.handleError.bind(this),
			root: {
				Type: "ConfigRoot", //$NON-NLS-0$
				repository: repository,
				mode: mode
			}
		});
		return configNavigator.display();
	};
	
	return GitRepositoryExplorer;
}());

return exports;

});
