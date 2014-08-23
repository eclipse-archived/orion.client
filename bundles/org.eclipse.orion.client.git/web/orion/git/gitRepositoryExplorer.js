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
	'orion/git/util',
	'orion/fileUtils',
	'orion/globalCommands',
	'orion/objects',
	'orion/Deferred'
], function(require, messages, mGitChangeList, mGitCommitList, mGitBranchList, mGitConfigList, mGitRepoList, mGitFileList, mGitCommitInfo, mSection, mSelection, lib, URITemplate, PageUtil, util, mFileUtils, mGlobalCommands, objects, Deferred) {
	
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
		this.redisplay(false, true);
	};
	
	GitRepositoryExplorer.prototype.redisplay = function(processURLs, force) {
		// make sure to have this flag
		if (processURLs === undefined) {
			processURLs = true;
		}
		if (force) {
			this.lastResource = null;
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
		if (this.repositoriesLabel) {
			var parent = this.repositoriesLabel.parentNode;
			if (parent) parent.removeChild(this.repositoriesLabel);
			this.repositoriesLabel = null;
		}
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
		if (this.branchesLabel) {
			var parent = this.branchesLabel.parentNode;
			if (parent) parent.removeChild(this.branchesLabel);
			this.branchesLabel = null;
		}
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
		if (this.treeLabel) {
			var parent = this.treeLabel.parentNode;
			if (parent) parent.removeChild(this.treeLabel);
			this.treeLabel = null;
		}
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
	
	GitRepositoryExplorer.prototype.destroyWorkingDirectory = function() {
		if (this.workingDirNavigator) {
			this.workingDirNavigator.destroy();
			this.workingDirNavigator = null;
		}
		if (this.workingDirSection) {
			this.workingDirSection.destroy();
			this.workingDirSection = null;
		}
	};
	
	GitRepositoryExplorer.prototype.destroyConfig = function() {
		if (this.configLabel) {
			var parent = this.configLabel.parentNode;
			if (parent) parent.removeChild(this.configLabel);
			this.configLabel = null;
		}
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
		this.destroyWorkingDirectory();
		this.destroyConfig();
		this.destroyDiffs();
	};
	
	GitRepositoryExplorer.prototype.setSelectedRepository = function(repository, force) {
		if (!force) {
			if (repository === this.repository) return;
			if (repository && this.repository) {
				if (repository.Location === this.repository.Location) {
					return;
				}
			}
		}
		this.repository = repository;
		this.initTitleBar(repository || {});
		if (repository) {
			this.repositoriesNavigator.select(this.repository);
			this.repositoriesSection.setTitle(repository.Name);
		}
		if (repository) {
			this.displayBranches(repository); 
			this.setSelectedRef(this.reference);
			if (this.showTagsSeparately) {
				this.displayTags(repository);
			}
			this.displayConfig(repository, "full"); //$NON-NLS-0$
		}
	};
	
	GitRepositoryExplorer.prototype.setSelectedRef = function(ref) {
		this.reference = ref;
//		this.displayTree(this.repository);
		this.setSelectedChanges(this.changes);
		this.displayCommits(this.repository);
	};
	
	GitRepositoryExplorer.prototype.setSelectedChanges = function(changes) {
		lib.empty(lib.node('table')); //$NON-NLS-0$
		this.changes = changes = changes || (this.repository.status ? [this.repository.status] : []);
		if (changes.length === 2) {
			if (changes[0].Type === "Commit" && changes[1].Type === "Commit") { //$NON-NLS-1$ //$NON-NLS-0$
				this.displayDiffs(this.repository, null, changes[0].DiffLocation, changes[1].Name);
			} else {
				this.displayDiffs(this.repository, null, changes[0].Type === "Status" ? changes[1].DiffLocation : changes[0].DiffLocation); //$NON-NLS-0$
			}
			return;
		} else if (changes.length === 1 && this.changes[0] && this.changes[0].Type === "Commit") { //$NON-NLS-0$
			this.displayCommit(this.changes[0]);
			this.displayDiffs(this.repository, this.changes[0].Diffs);
			this.statusDeferred = new Deferred().resolve(); //HACK
			return;
		}
		this.statusDeferred = this.displayStatus(this.repository);
		this.displayWorkingDirectory(this.repository);
	};
	
	GitRepositoryExplorer.prototype.setSelectedPath = function(path) {
		this.treePath = path;
		this.displayCommits(this.repository);
	};
	
	GitRepositoryExplorer.prototype.display = function(location, resource, processURLs) {
		if (this.lastResource === resource) return; //$NON-NLS-0$
		this.lastResource = resource; //$NON-NLS-0$
		this.destroy();
		this.accordion = new Accordion();
		var that = this;
		this.changes = this.reference = this.repository = this.treePath = this.log = this.logLocation = null;
		this.loadingDeferred = new Deferred();
		if (processURLs){
			this.loadingDeferred.then(function(){
				that.commandService.processURL(window.location.href);
			});
		}
		this.repositoriesLocation = location;
		this.destroy();
		this.displayRepositories(location, "").then(function() {
			if (resource) {
				that.progressService.progress(that.gitClient.getGitClone(resource), messages["Getting git repository details"]).then(function(selection){
					var repository;
					if (selection.Type === "Clone") { //$NON-NLS-0$
						repository = selection.Children[0];
						that.setSelectedRepository(repository);
					} else if (selection.CloneLocation) {
						that.progressService.progress(that.gitClient.getGitClone(selection.CloneLocation), messages["Getting git repository details"]).then(function(clone){
							if (selection.Type === "Commit") { //$NON-NLS-0$
								that.log = selection;
								that.logLocation = resource;
								that.treePath = selection.RepositoryPath;
								that.changes = [selection.Children[0]];
							} else if (selection.Type === "Branch" || selection.Type === "RemoteTrackingBranch" || selection.Type === "Tag") { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
								that.reference = selection;
							}
							repository = clone.Children[0];
							that.setSelectedRepository(repository);
						}, function(error){
							that.handleError(error);
						});
					} else {
						that.setSelectedRepository();
					}
				}, function(error){
					that.handleError(error);
				});
			} else {
				that.setSelectedRepository();
			}
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
	
	GitRepositoryExplorer.prototype.createLabel = function(parent, str, sibling) {
		var label = document.createElement("div"); //$NON-NLS-0$
		label.className = "gitSectionLabel"; //$NON-NLS-0$
		label.textContent = str;
		if (sibling) {
			parent.insertBefore(label, sibling);
		} else {
			parent.appendChild(label);
		}
		return label;
	};
	
	GitRepositoryExplorer.prototype.displayRepositories = function(location, mode, links) {
		this.destroyRepositories();
		var parent = lib.node('pageToolbar'); //$NON-NLS-0$
		
		this.repositoriesLabel = this.createLabel(parent, messages["Repository:"]);
		
		var section = this.repositoriesSection = new mSection.Section(parent, {
			id: "repoSection", //$NON-NLS-0$
			title: messages["Repo"],
			iconClass: ["gitImageSprite", "git-sprite-repository"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="repositoryNode" class="repoDropdownList"></div><div id="dropdownRepositoryActionsNode" class="sectionDropdownActions"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			dropdown: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		
		var selection = this.repositoriesSelection = new mSelection.Selection(this.registry, "orion.selection.repo"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(e) { //$NON-NLS-0$
			var selected = e.selection;
			if (!selected || this.repository === selected) return;
			this.changes = this.reference = this.log = this.logLocation = this.treePath = null;
			section.setHidden(true);
			this.setSelectedRepository(selected);
			window.location.href = require.toUrl(repoTemplate.expand({resource: this.lastResource = selected.Location}));
		}.bind(this));
		var explorer = this.repositoriesNavigator = new mGitRepoList.GitRepoListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "repositoryNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			sectionActionScodeId: "dropdownRepositoryActionsNode", //$NON-NLS-0$
			handleError: this.handleError.bind(this),
			location: location || this.repositoriesLocation,
			section: section,
			selection: selection,
			selectionPolicy: "singleSelection", //$NON-NLS-0$
			mode: mode,
			showLinks: links,
		});
		return explorer.display().then(function() {
			this.loadingDeferred.resolve();
		}.bind(this), this.loadingDeferred.reject);
	};
	
	GitRepositoryExplorer.prototype.displayBranches = function(repository) {
		this.destroyBranches();
		var parent = lib.node('pageToolbar'); //$NON-NLS-0$
		
		this.branchesLabel = this.createLabel(parent, messages["Reference:"]);
		
		var section = this.branchesSection = new mSection.Section(parent, {
			id: "branchSection", //$NON-NLS-0$
			title: "\u00A0", //$NON-NLS-0$
			iconClass: ["gitImageSprite", "git-sprite-branch"], //$NON-NLS-1$ //$NON-NLS-0$
			slideout: true,
			content: '<div id="branchNode" class="branchDropdownList"></div><div id="dropdownBranchesActionsNode" class="sectionDropdownActions"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			dropdown: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});

		var selection = this.branchesSelection = new mSelection.Selection(this.registry, "orion.selection.ref"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(e) { //$NON-NLS-0$
			var selected = e.selection;
			if (!selected || this.reference === selected) return;
			switch (selected.Type) {
				case "Branch": //$NON-NLS-0$
				case "RemoteTrackingBranch": //$NON-NLS-0$
				case "Tag": //$NON-NLS-0$
				case "StashCommit": //$NON-NLS-0$
					break;
				default:
					return;
			}
			this.changes = this.reference = this.log = this.logLocation = this.treePath = null;
			section.setHidden(true);
			this.setSelectedRef(selected);
			window.location.href = require.toUrl(repoTemplate.expand({resource: this.lastResource = selected.Location}));
		}.bind(this));
		var explorer = this.branchesNavigator = new mGitBranchList.GitBranchListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: "branchNode", //$NON-NLS-0$
			actionScopeId: this.actionScopeId,
			sectionActionScodeId: "dropdownBranchesActionsNode", //$NON-NLS-0$
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
	
	GitRepositoryExplorer.prototype.setBranchesTitle = function() {
		var title = this.showTagsSeparately ? messages["Branches"] : messages['BranchesTags'];
		var explorer = this.commitsNavigator;
		if (!explorer) return;
		var activeBranch = explorer.model.getActiveBranch();
		var targetRef = explorer.model.getTargetReference();
		if (activeBranch && targetRef) {
			var targetName =  util.shortenRefName(targetRef);
			title = activeBranch.Name + " => " + targetName;  //$NON-NLS-0$
		} else {
			title = util.shortenRefName(activeBranch || targetRef);
		}
		this.branchesSection.setTitle(title);
	};
	
	GitRepositoryExplorer.prototype.calculateTreePath = function() {
		return util.relativePath(this.treePath);
	};
	
	GitRepositoryExplorer.prototype.displayTree = function(repository) {	
		this.destroyTree();
		
		var parent = lib.node('pageToolbar'); //$NON-NLS-0$
		
		this.treeLabel = this.createLabel(parent, messages["Path:"]);
		
		var section = this.treeSection = new mSection.Section(parent, {
			id: "treeSection", //$NON-NLS-0$
			title: util.shortenPath("/" + this.calculateTreePath()), //$NON-NLS-0$
			iconClass: ["core-sprite-outline"], //$NON-NLS-0$
			slideout: true,
			content: '<div id="treeNode"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			dropdown: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		
		var selection = this.treeSelection = new mSelection.Selection(this.registry, "orion.selection.tree"); //$NON-NLS-0$
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
		section.addEventListener("toggle", function(e) { //$NON-NLS-0$
			if (e.isExpanded) {
				var location;
				var model = this.commitsNavigator.model;
				if (this.changes && this.changes.length === 1 && this.changes[0].Type === "Commit") { //$NON-NLS-0$
					location = this.changes.TreeLocation;
				} else {
					location = (model.simpleLog ? model.getTargetReference() : model.getActiveBranch()).TreeLocation;
				}
				if (!location) return;
				explorer.display(location).then(function() {
					explorer.myTree.expand(explorer.model.root);
					if (this.treePath) {
						explorer.select(this.treePath);
					}
				}.bind(this));
			}
		}.bind(this));

		selection.addEventListener("selectionChanged", function(e) { //$NON-NLS-0$
			var selected = e.selection;
			if (!selected || this.treePath === selected) return;
			this.setSelectedPath(selected);
			this.treeSection.setTitle(util.shortenPath("/" + this.calculateTreePath())); //$NON-NLS-0$
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
			canHide: true,
			noTwistie: NO_TWISTIES,
			preferenceService: this.preferencesService
		});
		
		var explorer  = this.statusNavigator = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			parentId:"statusNode", //$NON-NLS-0$
			prefix: "all", //$NON-NLS-0$
			repository: repository,
			section: section,
			editableInComparePage: true,
			handleError: this.handleError.bind(this),
			gitClient: this.gitClient,
			progressService: this.progressService
		});
		return explorer.display();
	};

	function compare(s1, s2) {
		if (s1 === s2) { return true; }
		if (s1 && !s2 || !s1 && s2) { return false; }
		if ((s1 && s1.constructor === String) || (s2 && s2.constructor === String)) { return false; }
		if (s1 instanceof Array || s2 instanceof Array) {
			if (!(s1 instanceof Array && s2 instanceof Array)) { return false; }
			if (s1.length !== s2.length) { return false; }
			for (var i = 0; i < s1.length; i++) {
				if (!compare(s1[i], s2[i])) {
					return false;
				}
			}
			return true;
		}
		if (!(s1 instanceof Object) || !(s2 instanceof Object)) { return false; }
		var p;
		for (p in s1) {
			if (s1.hasOwnProperty(p)) {
				if (!s2.hasOwnProperty(p)) { return false; }
				if (!compare(s1[p], s2[p])) {return false; }
			}
		}
		for (p in s2) {
			if (!s1.hasOwnProperty(p)) { return false; }
		}
		return true;
	}

	GitRepositoryExplorer.prototype.displayCommits = function(repository) {	
		this.destroyCommits();
		var parent = lib.node('sidebar'); //$NON-NLS-0$
		var section = this.commitsSection = new mSection.Section(parent, {
			id: "commitsSection", //$NON-NLS-0$
			title: messages["Diffs"],
			slideout: false,
			content: '<div id="commitsNode"></div>', //$NON-NLS-0$
			canHide: true,
			noTwistie: true,
			preferenceService: this.preferencesService
		});
		this.accordion.add(section);
		this.accordion.setDefaultSection(section);
		
		var selection = this.commitsSelection = new mSelection.Selection(this.registry, "orion.selection.commit"); //$NON-NLS-0$
		selection.addEventListener("selectionChanged", function(event) { //$NON-NLS-0$
			var selected = event.selections;
			if (compare(this.changes, selected)) return;
			this.setSelectedChanges(selected);
//			window.location.href = require.toUrl(repoTemplate.expand({resource: this.lastResource = selected.Location}));
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
			targetRef: this.reference,
			log: this.log,
			location: this.logLocation,
			simpleLog: !!this.log,
			repositoryPath: this.calculateTreePath(),
			handleError: this.handleError.bind(this),
			root: {
				Type: "CommitRoot", //$NON-NLS-0$
				repository: repository
			}
		});
		return this.statusDeferred.then(function() {
			return explorer.display().then(function() {
				this.setBranchesTitle();
				if (this.changes) {
					this.changes.forEach(function(c) {
						explorer.select(c);
					});
				} else {
					explorer.select(repository.status);
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
	
	GitRepositoryExplorer.prototype.displayWorkingDirectory = function(repository) {
		this.destroyWorkingDirectory();
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.workingDirSection = new mSection.Section(parent, {
			id: "workingDirSection", //$NON-NLS-0$
			title: messages['LocalChangesDetails'], //$NON-NLS-0$
			slideout: true,
			canHide: true,
			sibling: this.statusSection ? this.statusSection.domNode : null,
			preferenceService: this.preferencesService
		});
		
		var explorer = this.workingDirNavigator = new mGitRepoList.GitRepoListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			parentId: section.getContentElement(),
			actionScopeId: this.actionScopeId,
			handleError: this.handleError.bind(this),
			section: section,
			repositories: [repository],
			mode: "full", //$NON-NLS-0$
			simgleRepository: true,
			showLinks: false,
		});
		return this.statusDeferred.then(function() {
			return explorer.display();
		});
	};
	
	GitRepositoryExplorer.prototype.displayCommit = function(commit) {
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.commitSection = new mSection.Section(parent, {
			id: "commitSection", //$NON-NLS-0$
			title: messages['Commit Details'], //$NON-NLS-0$
			content : '<div id="commitNode" class="sectionTableItem"></div>', //$NON-NLS-0$
			slideout: true,
			canHide: true,
			preferenceService: this.preferencesService
		});

		var commandRegistry = this.commandService;
		var actionsNodeScope = section.actionsNode.id;
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.openGitCommit", 1); //$NON-NLS-1$ //$NON-NLS-0$
//		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.compareWithWorkingTree", 2); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.checkoutTag", 3); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.resetIndex", 4); //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.addTag", 5); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.cherryPick", 6); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.revert", 7); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.askForReviewCommand", 8); //$NON-NLS-1$ //$NON-NLS-0$
		commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, commit, this, "button"); //$NON-NLS-0$	

		var info = new mGitCommitInfo.GitCommitInfo({
			parent: lib.node("commitNode"), //$NON-NLS-0$
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

	GitRepositoryExplorer.prototype.displayDiffs = function(repository, diffs, location, commitName) {
		this.destroyDiffs();
		var parent = lib.node('table'); //$NON-NLS-0$
		var section = this.diffsSection = new mSection.Section(parent, { id : "diffSection", //$NON-NLS-0$
			title : messages["ChangedFiles"],
			content : '<div id="diffNode"></div>', //$NON-NLS-0$
			canHide : true,
			preferencesService : this.preferencesService
		});
		
		var explorer = this.diffsNavigator = new mGitChangeList.GitChangeListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			selection: null,
			parentId:"diffNode", //$NON-NLS-0$
			actionScopeId: "diffSectionItemActionArea", //$NON-NLS-0$
			prefix: "diff", //$NON-NLS-0$
			repository: repository,
			changes: diffs,
			location: location,
			commitName: commitName,
			section: section,
			gitClient: this.gitClient,
			progressService: this.progressService,
			handleError: this.handleError.bind(this)
		});
		return explorer.display();
	};
	
	GitRepositoryExplorer.prototype.displayConfig = function(repository, mode) {
		this.destroyConfig();
		var parent = lib.node('pageToolbar'); //$NON-NLS-0$
		
		var section = this.configSection = new mSection.Section(parent, {
			id: "configSection", //$NON-NLS-0$
			title: "\u200B", //$NON-NLS-0$
			iconClass: ["core-sprite-gear"], //$NON-NLS-0$
			slideout: true,
			content: '<div id="configNode" class="configDropdownList mainPadding"></div><div id="dropdownConfigActionsNode" class="sectionDropdownActions"></div>', //$NON-NLS-0$
			canHide: true,
			hidden: true,
			dropdown: true,
			noTwistie: true,
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
			sectionActionScopeId: "dropdownConfigActionsNode", //$NON-NLS-0$
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
