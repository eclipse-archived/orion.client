/*******************************************************************************
 * @license Copyright (c) 2014 IBM Corporation and others. All rights
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
	'i18n!git/nls/gitmessages',
	'orion/keyBinding',
	'orion/commandRegistry',
	'orion/explorers/explorer',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/Deferred',
	'orion/objects'
], function(messages, KeyBinding, mCommandRegistry, mExplorer, URITemplate, i18nUtil, Deferred, objects) {
		
	var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$

	function GitRepoListModel(options) {
		this.root = options.root;
		this.registry = options.registry;
		this.handleError = options.handleError;
		this.section = options.section;
		this.repositories = options.repositories;
		this.progressService = options.progressService;
		this.parentId = options.parentId;
		this.fileClient = options.fileClient;
		this.gitClient = options.gitClient;
		this.mode = options.mode;
	}
	GitRepoListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitRepoListModel.prototype, /** @lends orion.git.GitRepoListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		loadRepositoryInfo: function(repository) {
			var that = this;
			var deferred = new Deferred();
			this.progressService.progress(this.fileClient.loadWorkspace(repository.ContentLocation + "?parts=meta"), "Loading workspace info").then(function(resp) {//$NON-NLS-1$ //$NON-NLS-0$
				try {
					repository.Content = {};
					var path = "root / "; //$NON-NLS-0$
					if (resp.Parents !== null) {
						for (var i=resp.Parents.length; i>0; i--) {
							path += resp.Parents[i-1].Name + " / "; //$NON-NLS-0$
						}
					}
					path += resp.Name;
					repository.Content.Path = path;
					
					if (that.mode !== "full"){ //$NON-NLS-0$
						return deferred.resolve();
					}
					
					that.progressService.progress(that.gitClient.getGitStatus(repository.StatusLocation), "Getting status for " + repository.Name).then(function(resp) { //$NON-NLS-0$
						try{
							repository.Status = resp;
							that.progressService.progress(that.gitClient.getGitBranch(repository.BranchLocation), "Getting branches for " + repository.Name).then(function(resp){ //$NON-NLS-0$
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
										deferred.resolve();
										return;
									}
									var tracksRemoteBranch = (currentBranch.RemoteLocation.length === 1 && currentBranch.RemoteLocation[0].Children.length === 1);
									if (tracksRemoteBranch && currentBranch.RemoteLocation[0].Children[0].CommitLocation){
										that.progressService.progress(that.gitClient.getLog(currentBranch.RemoteLocation[0].Children[0].CommitLocation + "?page=1&pageSize=20", "HEAD"), "Getting incomming commits " + repository.Name).then(function(resp){ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
											if(resp.Children === undefined) { repository.CommitsToPush = 0; }
											else { repository.CommitsToPush = resp.Children.length; }
											deferred.resolve();
											return;
										}, deferred.reject);
									} else {
										that.progressService.progress(that.gitClient.doGitLog(currentBranch.CommitLocation + "?page=1&pageSize=20"), "Getting outgoing commits " + repository.Name).then(function(resp){ //$NON-NLS-1$ //$NON-NLS-0$
											if(resp.Children === undefined) { repository.CommitsToPush = 0; }
											else { repository.CommitsToPush = resp.Children.length; }
											deferred.resolve();
											return;
										}, deferred.reject);	
									}
								} catch(e){
									deferred.reject();
								}
							}, deferred.reject);
						} catch(e){
							deferred.reject();
						}
					}, deferred.reject);
				} catch(e){
					deferred.reject(e);
				}
			}, deferred.reject);
			return deferred;
		},
		getChildren: function(parentItem, onComplete){	
			var that = this;
			var progress, msg;
			progress = this.section ? this.section.createProgressMonitor() : null;
			msg = messages["Getting git repository details"];
			if (progress) progress.begin(msg);
			if (parentItem.children && !parentItem.more) {
				onComplete(parentItem.children);
			} else if (parentItem.Type === "RepoRoot") { //$NON-NLS-0$
				var allInfoDeferreds = that.repositories.map(function(repo) {
					return repo.infoDeferred = that.loadRepositoryInfo(repo);
				});
				function done() {
					if (progress) progress.done();
				}
				Deferred.all(allInfoDeferreds).then(done, done);
				onComplete(that.processChildren(parentItem, that.repositories));
			} else {
				onComplete([]);
			}
		},
		processChildren: function(parentItem, children) {
			children.forEach(function(item) {
				item.parent = parentItem;
			});
			parentItem.children = children;
			return children;
		},
		getId: function(/* item */ item){
			return this.parentId + (item.Name ? item.Name : "") + (item.Type ? item.Type : ""); //$NON-NLS-0$
		}
	});
	
	/**
	 * @class orion.git.GitRepoListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitRepoListExplorer(options) {
		this.checkbox = false;
		var renderer = new GitRepoListRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			cachePrefix: options.prefix + "Navigator", //$NON-NLS-0$
			checkbox: this.checkbox
		}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.repositories = options.repositories;
		if (this.repositories) {
			this.repositories.sort(function(repo1, repo2) {
				return repo1.Name.localeCompare(repo2.Name);
			});
		}
		this.mode = options.mode;
		this.showLinks = options.showLinks;
		this.section = options.section;
		this.handleError = options.handleError;
		this.gitClient = options.gitClient;
		this.fileClient = options.fileClient;
		this.progressService = options.progressService;
	}
	GitRepoListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitRepoListExplorer.prototype, /** @lends orion.git.GitRepoListExplorer.prototype */ {
		changedItem: function(item) {
			var deferred = new Deferred();
			var model = this.model;
			if (!item) {
				model.getRoot(function(root) {
					item = root;
				});
			}
			var that = this;
			model.getChildren(item, function(children) {
				item.removeAll = true;
				that.myTree.refresh.bind(that.myTree)(item, children, false);
				deferred.resolve(children);
			});
			return deferred;
		},
		display: function() {
			var deferred = new Deferred();
			var model = new GitRepoListModel({
				root: {Type: "RepoRoot"}, //$NON-NLS-0$
				registry: this.registry,
				progressService: this.progressService,
				gitClient: this.gitClient,
				fileClient: this.fileClient,
				section: this.section,
				repositories: this.repositories,
				mode: this.mode,
				parentId: this.parentId,
				handleError: this.handleError
			});
			this.createTree(this.parentId, model, {
				setFocus: false, // do not steal focus on load
				selectionPolicy: this.selectionPolicy,
				onComplete: function() {
					deferred.resolve();
				}
			});
			this.updateCommands();
			return deferred;
		},
		isRowSelectable: function() {
			return !!this.selection;
		},
		updateCommands: function() {
			var section = this.section;
			if (!section) return;
			var commandRegistry = this.commandService;
			var actionsNodeScope = section.actionsNode.id;
			commandRegistry.addCommandGroup(actionsNodeScope, "eclipse.gitGroup", 100); //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.cloneGitRepository", 100, "eclipse.gitGroup", false, null, new mCommandRegistry.URLBinding("cloneGitRepository", "url")); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.createGitProject", 300, "eclipse.gitGroup", true, null, new mCommandRegistry.URLBinding("createProjectContext", "name")); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.initGitRepository", 200, "eclipse.gitGroup"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.openCommitCommand", 1000, "eclipse.gitGroup", true,  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				new KeyBinding.KeyBinding('h', true, true), new mCommandRegistry.URLBinding("openGitCommit", "commitName")); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, this.repositories[0], this, "button"); //$NON-NLS-0$
		}
	});
	
	function GitRepoListRenderer(options) {
		options.cachePrefix = null; // do not persist table state
		mExplorer.SelectionRenderer.apply(this, arguments);
	}
	GitRepoListRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(GitRepoListRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			var div, td;
			switch (col_no) {
				case 0:
					var explorer = this.explorer;
					var repo = item;
				
					td = document.createElement("td"); //$NON-NLS-0$
					div = document.createElement("div"); //$NON-NLS-0$
					div.className = "sectionTableItem"; //$NON-NLS-0$
					td.appendChild(div);
					var horizontalBox = document.createElement("div"); //$NON-NLS-0$
					horizontalBox.style.overflow = "hidden"; //$NON-NLS-0$
					div.appendChild(horizontalBox);	
					
					var actionsID, title, description, subDescription, extraDescriptions = [], titleClass = "", titleLink;
					if (item.parent.Type === "RepoRoot") { //$NON-NLS-0$
						if (explorer.showLinks) {
							titleLink = require.toUrl(repoTemplate.expand({resource: repo.Location}));
						} else {
							titleClass = "gitRepoTitle"; //$NON-NLS-0$
						}
						if (!explorer.section) { //$NON-NLS-0$
							tableRow.classList.remove("selectableNavRow"); //$NON-NLS-0$
						} else {
							var ellipses = "..."; //$NON-NLS-0$
							description = repo.GitUrl ? messages["git url:"] + repo.GitUrl : messages["(no remote)"];
							subDescription = repo.Content ? messages["location: "] + repo.Content.Path : ellipses;
							if (explorer.mode === "full") { //$NON-NLS-0$
								var status = repo.Status;
								if (status) {
									if (status.RepositoryState !== "SAFE"){ //$NON-NLS-0$
										extraDescriptions.push(messages["Rebase in progress!"]);
									}
									
									var unstaged = status.Untracked.length + status.Conflicting.length + status.Modified.length + status.Missing.length;
									var staged = status.Changed.length + status.Added.length + status.Removed.length;
									extraDescriptions.push(((unstaged > 0 || staged > 0) 
										? i18nUtil.formatMessage(messages["${0} file(s) to stage and ${1} file(s) to commit."], unstaged, staged)
										: messages["Nothing to commit."]));
								}
								var commitsState = repo.CommitsToPush;
								if (commitsState !== undefined) {
									extraDescriptions.push(commitsState > 0 ? commitsState + messages[" commit(s) to push."] : messages["Nothing to push."]);
								}
							}
							if (repo.infoDeferred) {
								title = repo.Name + ellipses;
								if (explorer.mode === "full") extraDescriptions.push(ellipses); //$NON-NLS-0$
								repo.infoDeferred.then(function() {
									if (explorer.destroyed) return;
									explorer.myTree.redraw(item);
								});
								repo.infoDeferred = null;
							}
						}
					}
					
					var detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
					
					var titleDiv = document.createElement(titleLink ? "a" : "span"); //$NON-NLS-1$ //$NON-NLS-0$
					titleDiv.className = titleClass;
					if (titleLink) {
						titleDiv.href = titleLink;
					}
					titleDiv.textContent = title || item.Name;
					detailsView.appendChild(titleDiv);
					
					var descriptionDiv = document.createElement("div"); //$NON-NLS-0$
					if (description) {
						descriptionDiv.textContent = description;
					}
					detailsView.appendChild(descriptionDiv);
					
					if (subDescription) {
						var subDescriptionDiv = document.createElement("div"); //$NON-NLS-0$
						subDescriptionDiv.textContent = subDescription;
						detailsView.appendChild(subDescriptionDiv);
					}
					
					if (extraDescriptions.length) {
						var section = document.createElement("div"); //$NON-NLS-0$
						section.className = "gitRepoExtraDescriptionSection"; //$NON-NLS-0$
						detailsView.appendChild(section);						
						extraDescriptions.forEach(function(extraDescription) {
							var span = document.createElement("span"); //$NON-NLS-0$
							span.className = "gitRepoExtraDescription"; //$NON-NLS-0$
							span.textContent = extraDescription;
							section.appendChild(span);
						});
					}

					var actionsArea = document.createElement("div"); //$NON-NLS-0$
					actionsArea.className = "sectionTableItemActions"; //$NON-NLS-0$
					actionsArea.id = actionsID;
					horizontalBox.appendChild(actionsArea);
					this.commandService.renderCommands(this.actionScopeId, actionsArea, item, explorer, explorer.section ? "tool" : "button"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$	
					return td;
			}
		}
	});
	
	return {
		GitRepoListExplorer: GitRepoListExplorer,
		GitRepoListRenderer: GitRepoListRenderer
	};

});