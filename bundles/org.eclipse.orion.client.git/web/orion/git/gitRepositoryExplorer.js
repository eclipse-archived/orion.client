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
	'orion/git/widgets/gitFileList',
	'orion/git/widgets/gitCommitInfo',
	'orion/section',
	'orion/selection',
	'orion/webui/littlelib',
	'orion/URITemplate',
	'orion/PageUtil',
	'orion/fileUtils',
	'orion/globalCommands',
	'orion/objects',
	'orion/Deferred'
], function(require, messages, mGitChangeList, mGitCommitList, mGitBranchList, mGitConfigList, mGitRepoList, mGitFileList, mGitCommitInfo, mSection, mSelection, lib, URITemplate, PageUtil, mFileUtils, mGlobalCommands, objects, Deferred) {
	
	var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$
	
	var NO_TWISTIES = false;

	function Accordion(options) {
		options = options || {};
		this.parent = options.parent;
		this.sections = [];
	}
	objects.mixin(Accordion.prototype, {
		add: function(section) {
			this.sections.push(section);
			section.setOnExpandCollapse(this._expandCollapse.bind(this));
		},
		remove: function(section) {
			var index = this.sections.indexOf(section);
			if (index !== -1) {
				this.sections.splice(index, 1);
			}
		},
		setDefaultSection: function(section) {
			this.defaultSection = section;
			section.setHidden(false);
		},
		_expandCollapse: function(isExpanded, section) {
			if (this._ignoreExpand) return;
			this._ignoreExpand = true;
			var currentSection = this.currentSection = isExpanded ? section : this.defaultSection;
			var h = 0;
			this.sections.forEach(function(s) {
				h += lib.bounds(s.domNode).height + 6;//TODO - calculate the padding/margin around section
			});
			this.sections.forEach(function(s) {
				s.setHidden(s !== currentSection);
				var content = s.getContentElement();
				content.style.height = s !== currentSection ? 0 : "calc(100% - " + h + "px)"; //$NON-NLS-1$ //$NON-NLS-0$
			});
			this._ignoreExpand = false;
		}
	});
	
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
		if (processURLs === undefined) {
			processURLs = true;
		}
		var pageParams = PageUtil.matchResourceParameters();
		var selection = pageParams.resource;
		var path = this.defaultPath;
		var relativePath = mFileUtils.makeRelative(path);
		
		//NOTE: require.toURL needs special logic here to handle "gitapi/clone"
		var gitapiCloneUrl = require.toUrl("gitapi/clone._"); //$NON-NLS-0$
		gitapiCloneUrl = gitapiCloneUrl.substring(0, gitapiCloneUrl.length-2);
		
		var location = relativePath[0] === "/" ? gitapiCloneUrl + relativePath : gitapiCloneUrl + "/" + relativePath; //$NON-NLS-1$ //$NON-NLS-0$
		this.display(location, selection, processURLs);
	};
	
	GitRepositoryExplorer.prototype.destroyRepositories = function() {
		if (this.repositoriesNavigator) {
			this.repositoriesNavigator.destroy();
			this.repositoriesNavigator = null;
		}
		if (this.repositoriesSection) {
			this.accordion.remove(this.repositoriesSection);
			this.repositoriesSection.destroy();
			this.repositoriesSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyBranches = function() {
		if (this.branchesNavigator) {
			this.branchesNavigator.destroy();
			this.branchesNavigator = null;
		}
		if (this.branchesSection) {
			this.accordion.remove(this.branchesSection);
			this.branchesSection.destroy();
			this.branchesSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyTree = function() {
		if (this.treeNavigator) {
			this.treeNavigator.destroy();
			this.treeNavigator = null;
		}
		if (this.treeSection) {
			this.accordion.remove(this.treeSection);
			this.treeSection.destroy();
			this.treeSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyStatus = function() {
		if (this.statusNavigator) {
			this.statusNavigator.destroy();
			this.statusNavigator = null;
		}
		if (this.statusSection) {
			this.statusSection.destroy();
			this.statusSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyCommits = function() {
		if (this.commitsNavigator) {
			this.commitsNavigator.destroy();
			this.commitsNavigator = null;
		}
		if (this.commitsSection) {
			this.accordion.remove(this.commitsSection);
			this.commitsSection.destroy();
			this.commitsSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyTags = function() {
		if (this.configNavigator) {
			this.configNavigator.destroy();
			this.configNavigator = null;
		}
		if (this.tagsSection) {
			this.accordion.remove(this.tagsSection);
			this.tagsSection.destroy();
			this.tagsSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyConfig = function() {
		if (this.configNavigator) {
			this.configNavigator.destroy();
			this.configNavigator = null;
		}
		if (this.configSection) {
			this.accordion.remove(this.configSection);
			this.configSection.destroy();
			this.configSection = null;
		}
	};

	GitRepositoryExplorer.prototype.destroyDiffs = function() {
		if (this.diffsNavigator) {
			this.diffsNavigator.destroy();
			this.diffsNavigator = null;
		}
		if (this.diffsSection) {
			this.diffsSection.destroy();
			this.diffsSection = null;
		}
	};

	GitRepositoryExplorer.prototype.destroy = function() {
		lib.empty(lib.node('sidebar')); //$NON-NLS-0$
		lib.empty(lib.node('table')); //$NON-NLS-0$
		this.destroyRepositories();
		this.destroyBranches();
		this.destroyTree();
		this.destroyCommits();
		this.destroyStatus();
		this.destroyTags();
		this.destroyConfig();
		this.destroyDiffs();
	};
	
	GitRepositoryExplorer.prototype.setSelectedRepository = function(repository, force) {
		if (!force && repository && repository === this.repository) return;
		this.commit = this.reference = null;
		this.destroy();
		this.repository = repository;
		this.initTitleBar(repository || {});
		this.displayRepositories(this.repositories, ""); //$NON-NLS-0$
		if (repository) {
			this.setSelectedCommit(this.commit);
			this.displayBranches(repository); 
			this.displayTree(repository);
			this.setSelectedRef(this.reference);
			if (this.showTagsSeparately) {
				this.displayTags(repository);
			}
			this.displayConfig(repository, "full"); //$NON-NLS-0$
		} else {
			this.accordion.setDefaultSection(this.repositoriesSection);
		}
	};
	
	GitRepositoryExplorer.prototype.setSelectedRef = function(ref) {
		this.reference = ref;
		this.displayCommits(this.repository);
	};
	
	GitRepositoryExplorer.prototype.setSelectedCommit = function(commit) {
		this.commit = commit;
		if (this.commit && this.commit.Type === "Commit") { //$NON-NLS-0$
			this.displayCommit(this.commit);
			this.displayDiffs(this.commit, this.repository);
			this.statusDeferred = new Deferred().resolve(); //HACK
		} else {
			this.statusDeferred = this.displayStatus(this.repository);
		}
	};
	
	GitRepositoryExplorer.prototype.setSelectedPath = function(path) {
		this.treePath = path;
		this.displayCommits(this.repository);
	};
	
	GitRepositoryExplorer.prototype.display = function(location, selection, processURLs) {
		this.destroy();
		this.accordion = new Accordion();
		var that = this;
		this.loadingDeferred = new Deferred();
		if (processURLs){
			this.loadingDeferred.then(function(){
				that.commandService.processURL(window.location.href);
			});
		}
		this.progressService.progress(this.gitClient.getGitClone(location), messages["Getting git repository details"]).then(function(resp){
			var repositories = that.repositories = resp.Children || [];
			var repository;
			repositories.some(function(repo) {
				if (repo.Location === selection) {
					repository = repo;
					return true;
				}
				return false;
			});
			that.setSelectedRepository(repository);
		}, function(error){
			that.handleError(error);
		});
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
		this.destroyRepositories();
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.repositoriesSection = new mSection.Section(parent, {
			id: "repoSection", //$NON-NLS-0$
			title: this.repository ? this.repository.Name : messages["Repo"],
			iconClass: ["gitImageSprite", "git-sprite-repository"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="repositoryNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);
		
		var selection = this.repositoriesSelection = new mSelection.Selection(this.registry, "orion.selection.repo"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			if (!event.selection) return;
			window.location.hash = event.selection.Location;
		}.bind(this));
		var explorer = this.repositoriesNavigator = new mGitRepoList.GitRepoListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "repositoryNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			handleError: this.handleError.bind(this),
			section: section,
			selection: selection,
			selectionPolicy: "singleSelection", //$NON-NLS-0$
			repositories: repositories,
			mode: mode,
			showLinks: links,
		});
		return explorer.display().then(function() {
			if (this.repository) {
				explorer.select(this.repository);
			}
			this.loadingDeferred.resolve();
		}.bind(this), this.loadingDeferred.reject);
	};
	
	GitRepositoryExplorer.prototype.displayBranches = function(repository) {
		this.destroyBranches();
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.branchesSection = new mSection.Section(parent, {
			id: "branchSection", //$NON-NLS-0$
			title: this.showTagsSeparately ? messages["Branches"] : (this.reference ? this.reference.Name : messages['BranchesTags']),
			iconClass: ["gitImageSprite", "git-sprite-branch"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="branchNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);

		var selection = this.branchesSelection = new mSelection.Selection(this.registry, "orion.selection.ref"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			if (!event.selection || this.reference === event.selection) return;
			this.setSelectedRef(event.selection);
		}.bind(this));
		var explorer = this.branchesNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "branchNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: section,
			selection: selection,
			selectionPolicy: "singleSelection", //$NON-NLS-0$
			handleError: this.handleError.bind(this),
			showTags: !this.showTagsSeparately,
			showHistory: false,
			root: {
				Type: "RemoteRoot", //$NON-NLS-0$
				repository: repository,
			}
		});
		return explorer.display().then(function() {
			if (this.reference) {
				explorer.select(this.reference);
			}
		}.bind(this));
	};
	
	GitRepositoryExplorer.prototype.calculateTreePath = function() {
		var path = "";
	 	if (this.treePath) {
	 		var parents = this.treePath.Parents;
	 		if (parents.length) {
	 			path = this.treePath.Location.substring(parents[parents.length -1].Location.length);
	 		}
	 	}
		return path;
	};
	
	GitRepositoryExplorer.prototype.displayTree = function(repository) {	
		this.destroyTree();
		
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.treeSection = new mSection.Section(parent, {
			id: "treeSection", //$NON-NLS-0$
			title: "/" + this.calculateTreePath(),
			iconClass: ["core-sprite-outline"], //$NON-NLS-0$
			slideout: true,
			content: '<div id="treeNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);
		
		var selection = this.treeSelection = new mSelection.Selection(this.registry, "orion.selection.tree"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			if (!event.selection || this.treePath === event.selection) return;
			this.setSelectedPath(event.selection);
			this.treeSection.setTitle("/" + this.calculateTreePath());
		}.bind(this));
		var explorer  = this.treeNavigator = new mGitFileList.GitFileListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			parentId:"treeNode", //$NON-NLS-0$
			repository: repository,
			fileClient: this.fileClient,
			section: section,
			selection: selection,
			selectionPolicy: "singleSelection", //$NON-NLS-0$
			handleError: this.handleError.bind(this),
			gitClient: this.gitClient,
			progressService: this.progressService
		});
		return explorer.display("/gitapi/tree/master" + repository.ContentLocation).then(function() {
			explorer.myTree.expand(explorer.model.root);
			if (this.treePath) {
				explorer.select(this.treePath);
			}
		}.bind(this));
	};
	
	GitRepositoryExplorer.prototype.displayStatus = function(repository) {	
		this.destroyStatus();
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.statusSection = new mSection.Section(parent, {
			id: "statusSection", //$NON-NLS-0$
			title: messages["ChangedFiles"],
			slideout: true,
			content: '<div id="statusNode"></div>', //$NON-NLS-0$
			canHide: false,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		
		var explorer  = this.statusNavigator = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			parentId:"statusNode", //$NON-NLS-0$
			prefix: "all", //$NON-NLS-0$
			location: repository.StatusLocation,
			repository: repository,
			section: section,
			editableInComparePage: true,
			handleError: this.handleError.bind(this),
			gitClient: this.gitClient,
			progressService: this.progressService
		});
		return explorer.display();
	};

	GitRepositoryExplorer.prototype.displayCommits = function(repository) {	
		this.destroyCommits();
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.commitsSection = new mSection.Section(parent, {
			id: "commitsSection", //$NON-NLS-0$
			title: messages["Diffs"],
			slideout: true,
			content: '<div id="commitsNode"></div>', //$NON-NLS-0$
			canHide: true,
			noTwistie: NO_TWISTIES,
			sibling: this.configSection ? this.configSection.domNode : null,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);
		this.accordion.setDefaultSection(section);
		
		var selection = this.commitsSelection = new mSelection.Selection(this.registry, "orion.selection.commit"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			if (this.commit === event.selection) return;
			lib.empty(lib.node('table')); //$NON-NLS-0$
			this.setSelectedCommit(event.selection);
		}.bind(this));
		var explorer = this.commitsNavigator = new mGitCommitList.GitCommitListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			statusService: this.statusService,
			actionScopeId: this.actionScopeId,
			parentId:"commitsNode", //$NON-NLS-0$
			section: section,
			selection: selection,
			remoteBranch: this.reference,
			repositoryPath: this.calculateTreePath(),
			handleError: this.handleError.bind(this),
			root: {
				Type: "CommitRoot", //$NON-NLS-0$
				repository: repository
			}
		});
		return this.statusDeferred.then(function() {
			return explorer.display().then(function() {
				this.branchesSection.setTitle(explorer.model.getRemoteBranch().Name);
				if (this.commit) {
					explorer.select(this.commit);
				}
			}.bind(this));
		}.bind(this));
	};
	
	GitRepositoryExplorer.prototype.displayTags = function(repository) {
		this.destroyTags();
		var parent = lib.node("sidebar"); //$NON-NLS-0$
		var section = this.tagsSection = new mSection.Section(parent, {
			id : "tagSection", //$NON-NLS-0$
			iconClass : ["gitImageSprite", "git-sprite-tag"], //$NON-NLS-1$ //$NON-NLS-0$
			title : messages["Tags"],
			content : '<div id="tagNode"></div>', //$NON-NLS-0$
			canHide : true,
			hidden : true,
			noTwistie: NO_TWISTIES,
			preferenceService : this.preferencesService
		});
		this.accordion.add(section);

		var explorer = this.tagsNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "tagNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: section,
			handleError: this.handleError.bind(this),
			root: {
				Type: "TagRoot", //$NON-NLS-0$
				repository: repository,
			}
		});
		return explorer.display();
	};
	
	GitRepositoryExplorer.prototype.displayCommit = function(commit) {
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.commitSection = new mSection.Section(parent, {
			id: "commitSection", //$NON-NLS-0$
			title: messages['Commit Details'], //$NON-NLS-0$
			slideout: true,
			canHide: false,
			preferenceService: this.preferencesService
		});

		var commandRegistry = this.commandService;
		var actionsNodeScope = section.actionsNode.id;
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.checkoutTag", 0); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.addTag", 1); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.cherryPick", 2); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.revert", 3); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, commit, this, "button"); //$NON-NLS-0$	

		var info = new mGitCommitInfo.GitCommitInfo({
			parent: section.getContentElement(),
			tagsCommandHandler: this,
			commit: commit,
			showTags: true,
			commitLink: false,
			showMessage: false,
			showParentLink: false,
			showAuthorEmail: true,
			showCommitterEmail: true,
			onlyFullMessage: true,
			fullMessage: true
		});
		info.display();
	};

	GitRepositoryExplorer.prototype.displayDiffs = function(commit, repository) {
		this.destroyDiffs();
		var diffs = commit.Diffs;
		diffs.forEach(function(item) {
			var path = item.OldPath;
			if (item.ChangeType === "ADD") { //$NON-NLS-0$
				path = item.NewPath;
			} 
			item.name = path;
			item.type = item.ChangeType;
		});
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.diffsSection = new mSection.Section(parent, { id : "diffSection", //$NON-NLS-0$
			title : messages["ChangedFiles"],
			content : '<div id="diffNode"></div>', //$NON-NLS-0$
			canHide : false,
			preferencesService : this.preferencesService
		});
		
		var explorer = this.diffsNavigator = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			selection: null,
			parentId:"diffNode", //$NON-NLS-0$
			actionScopeId: "diffSectionItemActionArea", //$NON-NLS-0$
			prefix: "diff", //$NON-NLS-0$
			changes: diffs,
			section: section,
			repository: repository
		});
		return explorer.display();
	};
	
	GitRepositoryExplorer.prototype.displayConfig = function(repository, mode) {
		this.destroyConfig();
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.configSection = new mSection.Section(parent, {
			id: "configSection", //$NON-NLS-0$
			title: messages['Configuration'] + (mode === "full" ? "" : " (user.*)"), //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="configNode" class="mainPadding"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);
			
		var configNavigator = this.configNavigator = new mGitConfigList.GitConfigListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId:"configNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			section: section,
			handleError: this.handleError.bind(this),
			root: {
				Type: "ConfigRoot", //$NON-NLS-0$
				repository: repository,
				mode: mode
			}
		});
		return configNavigator.display();
	};

	return {
		GitRepositoryExplorer: GitRepositoryExplorer
	};
});
