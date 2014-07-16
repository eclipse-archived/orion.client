/*******************************************************************************
 * @license Copyright (c) 2012, 2013 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define([
	'require',
	'i18n!git/nls/gitmessages',
	'orion/git/widgets/gitCommitList',
	'orion/git/widgets/gitChangeList',
	'orion/section',
	'orion/URITemplate',
	'orion/PageUtil',
	'orion/webui/littlelib',
	'orion/globalCommands',
	'orion/git/gitCommands'
], function(require, messages, mGitCommitList, mGitChangeList, mSection, URITemplate, PageUtil, lib, mGlobalCommands, mGitCommands) {

	var exports = {};

	var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$

	exports.GitStatusExplorer = (function() {
		/**
		 * Creates a new Git status explorer.
		 *
		 * @class Git status explorer
		 * @name orion.git.GitStatusExplorer
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
		function GitStatusExplorer(options) {
			this.parentId = options.parentId;
			this.registry = options.registry;
			this.commandService = options.commandService;
			this.fileClient = options.fileClient;
			this.gitClient = options.gitClient;
			this.progressService = options.progressService;
			this.preferencesService = options.preferencesService;
			this.statusService = options.statusService;
			this.linkService = options.linkService;
			this.selection = options.selection;
			this.parentId = options.parentId;
			this.toolbarId = options.toolbarId;
			this.selectionToolsId = options.selectionToolsId;
			this.actionScopeId = options.actionScopeId;
			this.checkbox = false;
		}

		GitStatusExplorer.prototype.handleError = function(error) {
			var display = {};
			display.Severity = "Error"; //$NON-NLS-0$
			display.HTML = false;
			try {
				var resp = JSON.parse(error.responseText);
				display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
			} catch (Exception) {
				display.Message = error.DetailedMessage || error.Message || error.message;
			}
			this.statusService.setProgressResult(display); //$NON-NLS-0$

			if (error.status === 404) {
				this.initTitleBar();
				this.displayCommit();
			}
		};

		GitStatusExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};

		GitStatusExplorer.prototype.redisplay = function() {
			var pageParams = PageUtil.matchResourceParameters();
			this.display(pageParams.resource);
		};

		GitStatusExplorer.prototype.display = function(location) {
			var that = this;
			var tableNode = lib.node('table'); //$NON-NLS-0$
			lib.empty(tableNode);
			this.displayUnstaged(location).then(function() {
				var repository = that.unstagedNavigator.model.repository;
				var status = that.unstagedNavigator.model.status;
				return that.displayStaged(location).then(function() {
					return that.displayCommits(repository).then(function() {
						that.initTitleBar(status, repository);
						mGitCommands.updateNavTools(that.registry, that.commandService, that, "pageActions", "selectionTools", status); //$NON-NLS-1$ //$NON-NLS-0$
					});
				});
			});
		};
		
		GitStatusExplorer.prototype.initTitleBar = function(status, repository) {
			var item = {};

			// TODO add info about branch or detached
			item.Name = messages["Status"] + ((status.RepositoryState && status.RepositoryState.indexOf("REBASING") !== -1) ? messages[" (Rebase in Progress)"] : ""); //$NON-NLS-1$
			item.Parents = [];
			item.Parents[0] = {};
			item.Parents[0].Name = repository.Name;
			item.Parents[0].Location = repository.Location;
			item.Parents[0].ChildrenLocation = repository.Location;
			item.Parents[1] = {};
			item.Parents[1].Name = messages.Repo;

			mGlobalCommands.setPageTarget({
				task : messages["Status"],
				target : repository,
				breadcrumbTarget : item,
				makeBreadcrumbLink : function(seg, location) {
					seg.href = require.toUrl(repoTemplate.expand({resource: location || ""})); //$NON-NLS-0$
				},
				serviceRegistry : this.registry,
				commandService : this.commandService
			});
		};

		
		// Git unstaged changes

		GitStatusExplorer.prototype.displayUnstaged = function(location) {
			var that = this;
			var tableNode = lib.node('table'); //$NON-NLS-0$
			var unstagedSection = new mSection.Section(tableNode, {
				id : "unstagedSection", //$NON-NLS-0$
				title : messages['Unstaged'],
				content : '<div id="unstagedNode"></div>', //$NON-NLS-0$
				canHide : true,
				onExpandCollapse : function(isExpanded, section) {
					if (!that.unstagedNavigator) {
						return;
					}
					that.commandService.destroy(section.selectionNode);
					if (isExpanded) {
						that.commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that.unstagedNavigator, "button", {"Clone" : that.unstagedNavigator.model.repository}); //$NON-NLS-1$ //$NON-NLS-0$
					}
				}
			});

			if (this.unstagedNavigator) {
				this.unstagedNavigator.destroy(); 
			}
			this.unstagedNavigator = new mGitChangeList.GitChangeListExplorer({
				serviceRegistry: this.registry,
				commandRegistry: this.commandService,
				gitClient: this.gitClient,
				progressService: this.progressService,
				selection: this.unstagedSelection,
				parentId:"unstagedNode", 
				prefix: "unstaged",
				location: location,
				section: unstagedSection,
				editableInComparePage: true,
				handleError: this.handleError
			});
			return this.unstagedNavigator.display();
		};

		// Git staged changes 

		GitStatusExplorer.prototype.displayStaged = function(location) {
			var that = this;
			var tableNode = lib.node('table'); //$NON-NLS-0$
			var stagedSection = new mSection.Section(tableNode, {
				id : "stagedSection", //$NON-NLS-0$
				title : messages['Staged'],
				content : '<div id="stagedNode"></div>', //$NON-NLS-0$
				slideout : true,
				canHide : true,
				onExpandCollapse : function(isExpanded, section) {
					if (!that.stagedNavigator) {
						return;
					}
					that.commandService.destroy(section.selectionNode);
					if (isExpanded) {
						that.commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that.stagedNavigator, "button", { "Clone" : that.stagedNavigator.model.repository}); //$NON-NLS-0$ //$NON-NLS-1$
					}
				}
			});
			
			if (this.stagedNavigator) {
				this.stagedNavigator.destroy(); 
			}
			this.stagedNavigator = new mGitChangeList.GitChangeListExplorer({
				serviceRegistry: this.registry,
				commandRegistry: this.commandService,
				gitClient: this.gitClient,
				progressService: this.progressService,
				selection: this.stagedSelection,
				parentId:"stagedNode", 
				prefix: "staged",
				location: location,
				section: stagedSection,
				editableInComparePage: true,
				handleError: this.handleError
			});
			return this.stagedNavigator.display();
		};

		// Git commits

		GitStatusExplorer.prototype.displayCommits = function(repository) {
			var tableNode = lib.node('table'); //$NON-NLS-0$
			var titleWrapper = new mSection.Section(tableNode, {
				id : "commitSection", //$NON-NLS-0$
				title : messages['Commits'],
				content : '<div id="commitNode" class="mainPadding"></div>', //$NON-NLS-0$
				slideout : true,
				canHide : true,
				preferenceService : this.preferenceService
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
			return explorer.display();
		};
		
		return GitStatusExplorer;
	}());

	return exports;
}); // end of define
