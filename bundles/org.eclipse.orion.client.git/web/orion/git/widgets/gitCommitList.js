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
	'require',
	'i18n!git/nls/gitmessages',
	'orion/git/widgets/gitChangeList',
	'orion/git/widgets/gitCommitInfo',
	'orion/section',
	'orion/commands',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/URITemplate',
	'orion/git/util',
	'orion/commonHTMLFragments',
	'orion/git/logic/gitPush',
	'orion/i18nUtil',
	'orion/explorers/navigationUtils',
	'orion/webui/littlelib',
	'orion/objects'
], function(require, messages, mGitChangeList, mGitCommitInfo, mSection, mCommands, Deferred, mExplorer, URITemplate, util, mHTMLFragments, gitPush, i18nUtil, mNavUtils, lib, objects) {
	var commitTemplate = new URITemplate("git/git-commit.html#{,resource,params*}?page=1&pageSize=1"); //$NON-NLS-0$

	var pageSizeQuery = "?page=1&pageSize=20"; //$NON-NLS-0$

	function GitCommitListModel(options) {
		this.root = options.root;
		this.section = options.section;
		this.location = options.location;
		this.handleError = options.handleError;
		this.repository = options.repository;
		this.progressService = options.progressService;
		this.statusService = options.statusService;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.legacyLog = options.legacyLog;
		this.parentId = options.parentId;
		this.logDeferred = new Deferred();
	}
	GitCommitListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitCommitListModel.prototype, /** @lends orion.git.GitCommitListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		_getRepository: function() {
			var that = this;
			return Deferred.when(that.log || that._getLog(), function(log) {
				return that.progressService.progress(that.gitClient.getGitClone(log.CloneLocation), "Getting repository details for " + log.Name).then(function(resp) { //$NON-NLS-0$
					var repository = resp.Children[0];
					log.Clone = repository;
					log.ContentLocation = repository.ContentLocation;
					return that.root.repository = repository;
				});
			}, function(error){
				that.handleError(error);
			});
		},
		_getLog: function() {
			var that = this;
			var logMsg = that.location ? messages["Getting git log"] : i18nUtil.formatMessage(messages['Getting commits for \"${0}\" branch'], that.currentBranch.Name);
			return that.progressService.progress(that.gitClient.doGitLog(that.location || (that.currentBranch.CommitLocation + pageSizeQuery)), logMsg).then(function(resp) {
				if (that.location && resp.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
					return that.progressService.progress(that.gitClient.doGitLog(resp.CommitLocation), logMsg).then(function(resp) { //$NON-NLS-0$
						return that.log = resp;
					}, function(error){
						that.handleError(error);
					});
				}
				return that.log = resp;
			}, function(error){
				that.handleError(error);
			});
		},
		_getOutgoing: function() {
			var that = this;
			var localBranch = this.getLocalBranch();
			var remoteBranch = this.getRemoteBranch();
			var location = remoteBranch.CommitLocation + (that.log ? that.log.RepositoryPath : "");
			var id = localBranch.Name;
			return that.progressService.progress(that.gitClient.getLog(location + pageSizeQuery, id), messages['Getting outgoing commits']).then(function(resp) {
				return that.outgoingCommits = resp.Children;
			});
		},
		_getIncoming: function() {
			var that = this;
			var localBranch = this.getLocalBranch();
			var remoteBranch = this.getRemoteBranch();
			var location = localBranch.CommitLocation + (that.log ? that.log.RepositoryPath : "");
			var id = remoteBranch.Name;
			return that.progressService.progress(that.gitClient.getLog(location + pageSizeQuery, id), messages['Getting git incoming changes...']).then(function(resp) {
				return that.incomingCommits = resp.Children;
			});
		},
		getLocalBranch: function() {
			var ref = this.log ? this.log.toRef : this.currentBranch;
			if (ref.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
				this.tracksRemoteBranch();// compute localBranch
				return this.localBranch;
			} else {
				return ref;
			}
		},
		getRemoteBranch: function() {
			if (this.remoteBranch) {
				return this.remoteBranch;
			}
			var ref = this.log ? this.log.toRef : this.currentBranch;
			if (ref.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
				return ref;
			} else {
				return ref.RemoteLocation[0] && ref.RemoteLocation[0].Children[ref.RemoteLocation[0].Children.length - 1];
			}
		},
		tracksRemoteBranch: function(){
			if (this.remoteBranch) {
				if (this.isNewBranch(this.remoteBranch)) {
					return false;
				}
			}
			var ref = (this.log && this.log.toRef) || this.currentBranch ;
			if (ref && ref.Type === "RemoteTrackingBranch" && (this.root.repository && this.root.repository.Branches)) { //$NON-NLS-0$
				var result = false;
				var that = this;
				this.root.repository.Branches.some(function(branch){
					if (branch.RemoteLocation && branch.RemoteLocation.length === 1 && branch.RemoteLocation[0].Children.length === 1) {
						if (branch.RemoteLocation[0].Children[0].Name === ref.Name) {
							that.localBranch = branch;
							result = true;
							return true;
						}
					}
					return false;
				});
				return result;
			} 
			return ref && ref.RemoteLocation && ref.RemoteLocation.length === 1 && ref.RemoteLocation[0].Children.length === 1;
		},
		isRebasing: function() {
			var repository = this.root.repository;
			return repository && repository.status && repository.status.RepositoryState === "REBASING_INTERACTIVE"; //$NON-NLS-0$
		},
		isNewBranch: function(branch) {
			return branch.Type === "RemoteTrackingBranch" && !branch.Id; //$NON-NLS-0$
		},
		getChildren: function(parentItem, onComplete) {
			var that = this;
			var tracksRemoteBranch = this.tracksRemoteBranch();
			if (parentItem instanceof Array && parentItem.length > 0) {
				onComplete(parentItem);
			} else if (parentItem.children && !parentItem.more) {
				onComplete(parentItem.children);
			} else if (parentItem.Type === "CommitRoot") { //$NON-NLS-0$
				var section = this.section;
				var progress = section ? section.createProgressMonitor() : null;
				if (progress) progress.begin(messages["Getting git log"]);
				Deferred.when(parentItem.repository || that._getRepository(), function(repository) {
					var currentBranchMsg = i18nUtil.formatMessage(messages['GettingCurrentBranch'], repository.Name);
					if (progress) progress.worked(currentBranchMsg);
					Deferred.when(that.Branches || that.progressService.progress(that.gitClient.getGitBranch(repository.BranchLocation + "?commits=0&page=1&pageSize=5"), currentBranchMsg), function(resp) { //$NON-NLS-0$
						var currentBranch, branches = resp.Children || resp;
						branches.some(function(branch) {
							if (branch.Current) {
								currentBranch = branch;
								return true;
							}
							return false;
						});
						that.currentBranch = currentBranch;
						if (!that.currentBranch && that.isRebasing()) {
							if (section) section.setTitle(messages["RebaseProgress"]);
							onComplete([]);
							if (progress) progress.done();
							return;
						}
						if (!that.currentBranch) {
							if (section) section.setTitle(messages["NoBranch"]);
							onComplete(that.processChildren(parentItem, []));
							if (progress) progress.done();
							return;
						}
						repository.ActiveBranch = currentBranch.CommitLocation;
						that.Branches = branches;
						var localBranch = that.getLocalBranch();
						var remoteBranch = that.getRemoteBranch();
						if (localBranch && remoteBranch && !that.legacyLog) {
							if (section) section.setTitle(i18nUtil.formatMessage(messages["Commits for \"${0}\" branch against"], localBranch.Name));
						} else {
							if (section) section.setTitle(i18nUtil.formatMessage(messages["Commits for \"${0}\" branch"], (remoteBranch || localBranch).Name));
						}
						if (progress) progress.done();
						if (that.legacyLog) {
							return Deferred.when(that.log || that._getLog(), function(log) {
								parentItem.log = log;
								that.logDeferred.resolve(log);
								var children = log.Children;
								var fullList = parentItem.children;
								if (fullList) {
									var args = [fullList.length - 1, 1].concat(children);
									Array.prototype.splice.apply(fullList, args);
								} else {
									fullList = children;
								}
								if (log.NextLocation) {
									fullList.push({Type: "MoreCommits", NextLocation: log.NextLocation}); //$NON-NLS-0$
								}
								onComplete(that.processChildren(parentItem, fullList));
							}, function(error){
								that.handleError(error);
							});
						} else {
							onComplete(that.processChildren(parentItem, [
								{
									Type: "Outgoing", //$NON-NLS-0$
									localBranch: localBranch,
									remoteBranch: remoteBranch
								},
								{
									Type: "Incoming", //$NON-NLS-0$
									localBranch: localBranch,
									remoteBranch: remoteBranch
								},
								{
									Type: "Synchronized" //$NON-NLS-0$
								}
							]));
						}	
					}, function(error){
						if (progress) progress.done();
						that.handleError(error);
					});
				}, function(error){
					if (progress) progress.done();
					that.handleError(error);
				});
			} else if (parentItem.Type === "Incoming") { //$NON-NLS-0$
				if (tracksRemoteBranch) {
					Deferred.when(that.incomingCommits || that._getIncoming(), function(incomingCommits) {
						onComplete(that.processChildren(parentItem, incomingCommits));
					}, function(error) {
						that.handleError(error);
					});
				} else {
					return Deferred.when(that.log || that._getLog(), function(log) {
						var children = [];
						if (log.toRef.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
							children = log.Children;
						}
						onComplete(that.processChildren(parentItem, children));
					}, function(error){
						that.handleError(error);
					});
				}
			} else if (parentItem.Type === "Outgoing") { //$NON-NLS-0$
				if (tracksRemoteBranch) {
					Deferred.when(that.outgoingCommits || that._getOutgoing(), function(outgoingCommits) {
						onComplete(that.processChildren(parentItem, outgoingCommits));
					}, function(error){
						that.handleError(error);
					});
				} else {
					return Deferred.when(that.log || that._getLog(), function(log) {
						var children = [];
						if (log.toRef.Type === "Branch") { //$NON-NLS-0$
							children = log.Children;
						} 
						onComplete(that.processChildren(parentItem, children));
					}, function(error){
						that.handleError(error);
					});
				}
			} else if (parentItem.Type === "Synchronized") { //$NON-NLS-0$
				if (tracksRemoteBranch) {
					return Deferred.when(that.log || that._getLog(), function(log) {
						parentItem.log = log;
						that.logDeferred.resolve(log);
						var remoteBranch = log.toRef.Type === "RemoteTrackingBranch"; //$NON-NLS-0$
						Deferred.when(remoteBranch ? that.incomingCommits || that._getIncoming() : that.outgoingCommits || that._getOutgoing(), function(filterCommits) {
							var children = [];
							log.Children.forEach(function(commit) {
								if (!filterCommits.some(function(com) { return com.Name === commit.Name; })) {
									children.push(commit);
								}
							});
							var fullList = parentItem.children;
							if (fullList) {
								var args = [fullList.length - 1, 1].concat(children);
								Array.prototype.splice.apply(fullList, args);
							} else {
								fullList = children;
							}
							if (log.NextLocation) {
								fullList.push({Type: "MoreCommits", NextLocation: log.NextLocation}); //$NON-NLS-0$
							}
							onComplete(that.processChildren(parentItem, fullList));
						}, function(error){
							that.handleError(error);
						});
					}, function(error){
						that.handleError(error);
					});
				} else {
					onComplete(that.processChildren(parentItem, []));
				}
			} else if (parentItem.Type === "Commit") {  //$NON-NLS-0$
				onComplete(that.processChildren(parentItem, [{Type: "CommitChanges"}]));  //$NON-NLS-0$
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			return this.parentId + (item.Name ? item.Name : "") + (item.Type ? item.Type : ""); //$NON-NLS-0$
		},
		processChildren: function(parentItem, items) {
			if (items.length === 0) {
				items = [{Type: "NoCommits"}]; //$NON-NLS-0$
			}
			items.forEach(function(item) {
				item.parent = parentItem;
			});
			parentItem.children = items;
			return items;
		}
	});
	
	/**
	 * @class orion.git.GitCommitListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitCommitListExplorer(options) {
		var renderer = new GitCommitListRenderer({registry: options.serviceRegistry, commandService: options.commandRegistry, actionScopeId: options.actionScopeId, cachePrefix: "LogNavigator", checkbox: false}, this); //$NON-NLS-0$
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.checkbox = false;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.section = options.section;
		this.root = options.root;
		this.handleError = options.handleError;
		this.location = options.location;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.statusService = options.statusService;
		this.legacyLog = options.legacyLog;
		
		this.incomingActionScope = "IncomingActions"; //$NON-NLS-0$
		this.outgoingActionScope = "OutgoingActions"; //$NON-NLS-0$
		this.syncActionScope = "SynchronizedActions"; //$NON-NLS-0$
		this.createCommands();
	}
	GitCommitListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitCommitListExplorer.prototype, /** @lends orion.git.GitCommitListExplorer.prototype */ {
		changedItem: function(item) {
			var deferred = new Deferred();
			var that = this;
			var model = this.model;
			if (!item) {
				model.getRoot(function(root) {
					item = root;
				});
			}
			
			if (item.Type === "CommitRoot") { //$NON-NLS-0$
				model.incomingCommits = model.outgoingCommits = null;
			}
			if (!item.more) {
				item.children = null;
			}
			model.log = null;
			model.logDeferred = new Deferred();
			var progress = this.section ? this.section.createProgressMonitor() : null;
			if (progress) progress.begin(messages["Getting git log"]);
			model.getChildren(item, function(children) {
				item.removeAll = true;
				that.myTree.refresh.bind(that.myTree)(item, children, false);
				if (item.Type === "CommitRoot") { //$NON-NLS-0$
					that.expandSections(children);
				}
				if (item.Type !== "Synchronized") { //$NON-NLS-0$
					that.updateCommands();
				}
				if (progress) progress.done();
				deferred.resolve(children);
			});
			return deferred;
		},
		display: function() {
			var that = this;
			var deferred = new Deferred();
			var model = new GitCommitListModel({
				root: this.root,
				registry: this.registry,
				progressService: this.progressService,
				statusService: this.statusService,
				gitClient: this.gitClient,
				section: this.section,
				location: this.location,
				handleError: this.handleError,
				parentId: this.parentId,
				legacyLog: this.legacyLog
			});
			this.createTree(this.parentId, model, {onComplete: function() {
				that.status = model.status;
				var fetched = function(){
					that.model.getRoot(function(root) {
						that.model.getChildren(root, function(children) {
							that.expandSections(children);
						});
					});
					that.updateCommands();
					deferred.resolve(model.log);
				};
				that.fetch().then(fetched, fetched);
			}});
			return deferred;
		},
		expandSections: function(children) {
			if (!this.legacyLog && !this.model.isRebasing() && children.length > 2) {
				this.myTree.expand(this.model.getId(children[0]));
				this.myTree.expand(this.model.getId(children[1]));
				if (this.location) {
					this.myTree.expand(this.model.getId(children[2]));
				}
			}
		},
		isRowSelectable: function() {
			return false;
		},
		createCommands: function() {
			var that = this;
			var commandService = this.commandService;
			
			var chooseBranchCommand = new mCommands.Command({
				name: messages["Choose Branch"],
				tooltip: messages["Choose the remote branch."],
				id: "eclipse.orion.git.commit.chooseBranch", //$NON-NLS-0$
				callback: function(data) {
					var explorer = data.handler;
					var model = explorer.model;
					gitPush({
						serviceRegistry: explorer.registry,
						commandService: explorer.commandService
					}).chooseRemote(model.root.repository, model.log ? model.log.toRef : model.currentBranch).then(function(branch) {
						var model = data.handler.model;
						model.remoteBranch = branch;
						model.getRoot(function(root) {
							data.handler.changedItem(root);
						});	
					});
				},
				visibleWhen: function(item) {
					var branch = item;
					var name = branch.Name;
					if (that.model.isNewBranch(branch)) {
						name += messages[" [New branch]"];
					}
					chooseBranchCommand.name = name;
					return true;
				}
			});
			commandService.addCommand(chooseBranchCommand);
		},
		fetch: function() {
			var model = this.model;
			if (model.tracksRemoteBranch() && !this.legacyLog && !model.isRebasing()) {
				var commandService = this.commandService;
				var remoteBranch = model.getRemoteBranch();
				var localBranch = model.getLocalBranch();
				return commandService.runCommand("eclipse.orion.git.fetch", {LocalBranch: localBranch, RemoteBranch: remoteBranch, noAuth: true}, this); //$NON-NLS-0$
			}
			return new Deferred().resolve();
		},
		updateCommands: function() {
			var model = this.model;
			var currentBranch = model.currentBranch;
			var repository = this.root.repository;
			var commandService = this.commandService;
			var section = this.section;
			if (!section) return;
			var actionsNodeScope = section.actionsNode.id;
			var titleLeftActionsNodeScope = section.titleLeftActionsNode.id;
			if (!currentBranch && model.isRebasing()) {
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.resetCommand", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseContinueCommand", 200); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseSkipPatchCommand", 300); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseAbortCommand", 400); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.renderCommands(actionsNodeScope, actionsNodeScope, repository.status, this, "button"); //$NON-NLS-0$
			} else if (currentBranch && !this.legacyLog) {
				var incomingActionScope = this.incomingActionScope;
				var outgoingActionScope = this.outgoingActionScope;
				
				if (lib.node(actionsNodeScope)) {
					commandService.destroy(actionsNodeScope);
				}
				if (lib.node(titleLeftActionsNodeScope)) {
					commandService.destroy(titleLeftActionsNodeScope);
				}
				if (lib.node(incomingActionScope)) {
					commandService.destroy(incomingActionScope);
				}
				if (lib.node(outgoingActionScope)) {
					commandService.destroy(outgoingActionScope);
				}
	
				var tracksRemoteBranch = model.tracksRemoteBranch();
				var localBranch = model.getLocalBranch();
				var remoteBranch = model.getRemoteBranch();
				if (tracksRemoteBranch) {
					commandService.addCommandGroup(incomingActionScope, "eclipse.gitFetchGroup", 100, "Fetch", null, null, null, "Fetch", null, "eclipse.orion.git.fetch"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.fetch", 100, "eclipse.gitFetchGroup"); //$NON-NLS-0$ //$NON-NLS-1$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.fetchForce", 200, "eclipse.gitFetchGroup"); //$NON-NLS-0$ //$NON-NLS-1$
					
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.merge", 300); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.rebase", 200); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.resetIndex", 400); //$NON-NLS-0$
					remoteBranch.GitUrl = localBranch.RemoteLocation[0].GitUrl;
					commandService.renderCommands(incomingActionScope, incomingActionScope, remoteBranch, this, "button"); //$NON-NLS-0$

					commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.sync", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.renderCommands(actionsNodeScope, actionsNodeScope, {LocalBranch: localBranch, RemoteBranch: remoteBranch}, this, "button"); //$NON-NLS-0$
				}
				if (remoteBranch) {
					commandService.registerCommandContribution(titleLeftActionsNodeScope, "eclipse.orion.git.commit.chooseBranch", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.renderCommands(titleLeftActionsNodeScope, titleLeftActionsNodeScope, remoteBranch, this, "button"); //$NON-NLS-0$
				}
				commandService.addCommandGroup(outgoingActionScope, "eclipse.gitPushGroup", 1000, "Push", null, null, null, "Push", null, "eclipse.orion.git.push"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.push", 1100, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushForce", 1200, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushBranch", 1300, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushForceBranch", 1400, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushToGerrit", 1500, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$

				commandService.renderCommands(outgoingActionScope, outgoingActionScope, {LocalBranch: localBranch, RemoteBranch: remoteBranch}, this, "button"); //$NON-NLS-0$
			}
		}
	});
	
	function GitCommitListRenderer() {
		mExplorer.SelectionRenderer.apply(this, arguments);
	}
	GitCommitListRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(GitCommitListRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			var explorer = this.explorer;
			var commit = item;
			switch(col_no){
			case 0:	
				var td = document.createElement("td"); //$NON-NLS-0$
				var sectionItem = document.createElement("div"); //$NON-NLS-0$
				td.appendChild(sectionItem);
				var horizontalBox = document.createElement("div"); //$NON-NLS-0$
				horizontalBox.style.overflow = "hidden"; //$NON-NLS-0$
				sectionItem.appendChild(horizontalBox);	
				var that = this;
				function createExpand() {
					var expandContainer = document.createElement("div"); //$NON-NLS-0$
					expandContainer.style.display = "inline-block"; //$NON-NLS-0$
					expandContainer.style.styleFloat = "left"; //$NON-NLS-0$
					expandContainer.style.cssFloat = "left"; //$NON-NLS-0$
					var expandImage = that.getExpandImage(tableRow, expandContainer);
					horizontalBox.appendChild(expandContainer);
					return expandImage;
				}
				
				var description, detailsView, actionsArea;
				var model = explorer.model;
				if (item.Type === "MoreCommits") { //$NON-NLS-1$ //$NON-NLS-0$
					td.classList.add("gitCommitListMore"); //$NON-NLS-0$
					var branch = model.getLocalBranch() || model.getRemoteBranch();
					td.textContent = i18nUtil.formatMessage(messages[item.Type], branch.Name);
					var listener;
					td.addEventListener("click", listener = function() { //$NON-NLS-0$
						td.removeEventListener("click", listener); //$NON-NLS-0$
						td.textContent = i18nUtil.formatMessage(messages[item.Type + "Progress"], branch.Name);
						model.location = item.NextLocation;
						item.parent.more = true;
						explorer.changedItem(item.parent).then(function() {
							item.parent.more = false;
						});
					});
					return td;
				} else if (item.Type === "CommitChanges") { //$NON-NLS-0$
					tableRow.classList.remove("selectableNavRow"); //$NON-NLS-0$
					commit = item.parent;
					var commitDetails = document.createElement("div"); //$NON-NLS-0$
					var info = new mGitCommitInfo.GitCommitInfo({
						parent: commitDetails,
						commit: commit,
						showTags: false,
						commitLink: false,
						showMessage: false,
						showImage: false,
						showAuthor: false,
						showParentLink: false
					});
					info.display();
					horizontalBox.appendChild(commitDetails);

					var repository = explorer.model.root.repository;
					setTimeout(function() {
						var diffs = commit.Diffs;

						diffs.forEach(function(item) {
							var path = item.OldPath;
							if (item.ChangeType === "ADD") { //$NON-NLS-0$
								path = item.NewPath;
							} 
							item.name = path;
							item.type = item.ChangeType;
						});
						var titleWrapper = new mSection.Section(horizontalBox, {
							id: "commitdDiffSection" + commit.Name, //$NON-NLS-0$
							title: messages["ChangedFiles"],
							slideout: true,
							canHide: false,
							preferenceService: explorer.preferencesService
						}); 
						var explorer2  = new mGitChangeList.GitChangeListExplorer({
							serviceRegistry: explorer.registry,
							commandRegistry: explorer.commandService,
							selection: null,
							parentId: titleWrapper.getContentElement(), 
							actionScopeId: "diffSectionItemActionArea", //$NON-NLS-0$
							prefix: "diff", //$NON-NLS-0$
							changes: diffs,
							location: repository.StatusLocation,
							repository: repository,
							section: titleWrapper
						});
						explorer2.display();
					}, 0);
				}  else if (item.Type !== "Commit") { //$NON-NLS-0$
					if (item.Type !== "NoCommits") { //$NON-NLS-0$
						sectionItem.className = "gitCommitSectionTableItem"; //$NON-NLS-0$
						createExpand();
						tableRow.classList.add("gitCommitListSection"); //$NON-NLS-0$
					} else {
						tableRow.classList.add("gitCommitListNoCommit"); //$NON-NLS-0$
						sectionItem.classList.add("sectionTableItem"); //$NON-NLS-0$
					}
					
					detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
					
					var title = document.createElement("div"); //$NON-NLS-0$
					title.textContent = messages[item.Type];
					if (item.Type !== "NoCommits") { //$NON-NLS-0$
						title.classList.add("gitCommitListSectionTitle"); //$NON-NLS-0$
					}
					detailsView.appendChild(title);
			
					actionsArea = document.createElement("ul"); //$NON-NLS-0$
					actionsArea.className = "layoutRight commandList"; //$NON-NLS-0$
					actionsArea.id = item.Type + "Actions"; //$NON-NLS-0$
					horizontalBox.appendChild(actionsArea);
					
					horizontalBox.classList.add("toolComposite"); //$NON-NLS-0$
					var slideoutFragment = mHTMLFragments.slideoutHTMLFragment(actionsArea.id);
					var slideoutDiv = document.createElement("div"); //$NON-NLS-0$
					slideoutDiv.innerHTML = slideoutFragment;
					horizontalBox.appendChild(slideoutDiv);
				} else {
					createExpand();
					sectionItem.className = "sectionTableItem"; //$NON-NLS-0$
					if (commit.AuthorImage) {
						var authorImage = document.createElement("div"); //$NON-NLS-0$
						authorImage.style["float"] = "left"; //$NON-NLS-1$ //$NON-NLS-0$
						var image = new Image();
						image.src = commit.AuthorImage;
						image.name = commit.AuthorName;
						image.className = "git-author-icon"; //$NON-NLS-0$
						authorImage.appendChild(image);
						horizontalBox.appendChild(authorImage);
					}
					
					detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
	
					var titleLink;
					if (explorer.showCommitLinks) {
						titleLink = document.createElement("a"); //$NON-NLS-0$
						titleLink.className = "navlinkonpage"; //$NON-NLS-0$
						titleLink.href = require.toUrl(commitTemplate.expand({resource: commit.Location})); //$NON-NLS-0$
					} else {
						titleLink = document.createElement("span"); //$NON-NLS-0$
						titleLink.className = "gitCommitTitle"; //$NON-NLS-0$
					}
					titleLink.textContent = util.trimCommitMessage(commit.Message);
					detailsView.appendChild(titleLink);
					
					//Add the commit page link as the first grid of the row
					mNavUtils.addNavGrid(this.explorer.getNavDict(), item, titleLink);
					
					var d = document.createElement("div"); //$NON-NLS-0$
					detailsView.appendChild(d);
	
					description = document.createElement("div"); //$NON-NLS-0$
					description.textContent = i18nUtil.formatMessage(messages["authored by 0 (1) on 2"], //$NON-NLS-0$
									commit.AuthorName, commit.AuthorEmail, new Date(commit.Time).toLocaleString()); 
					detailsView.appendChild(description);
					
					if (commit.Tags && commit.Tags.length) {
						var tags = document.createElement("div"); //$NON-NLS-0$
						tags.textContent = messages["Tags:"];
						tags.className = "gitCommitListTagsTitle"; //$NON-NLS-0$
						commit.Tags.forEach(function (tag) {
							var tagSpan = document.createElement("span"); //$NON-NLS-0$
							tagSpan.textContent = tag.Name;
							tagSpan.className = "gitCommitListTag"; //$NON-NLS-0$
							tags.appendChild(tagSpan);
							
							var tagSpanAction = document.createElement("span"); //$NON-NLS-0$
							tagSpanAction.className = "core-sprite-close gitCommitListTagClose"; //$NON-NLS-0$
							tagSpanAction.addEventListener("click", function(){ //$NON-NLS-0$
								explorer.commandService.runCommand("eclipse.removeTag", tag, explorer); //$NON-NLS-0$
							});
							tagSpan.appendChild(tagSpanAction);
						});
						detailsView.appendChild(tags);
					}
					
					var itemActionScope = "itemLevelCommands"; //$NON-NLS-0$
					actionsArea = document.createElement("ul"); //$NON-NLS-0$
					actionsArea.className = "layoutRight commandList"; //$NON-NLS-0$
					actionsArea.id = itemActionScope;
					horizontalBox.appendChild(actionsArea);
					explorer.commandService.renderCommands(itemActionScope, actionsArea, item, explorer, "tool"); //$NON-NLS-0$
				}

				return td;
			}
		},
		emptyCallback:function(bodyElement) {
			var tr = document.createElement("tr"); //$NON-NLS-0$
			var td = document.createElement("td"); //$NON-NLS-0$
			td.colSpan = 1;
		
			var noCommit = document.createElement("div"); //$NON-NLS-0$
			noCommit.classList.add("sectionTableItem"); //$NON-NLS-0$
			
			if (this.explorer.model.isRebasing()) {
				noCommit.style.whiteSpace = "pre"; //$NON-NLS-0$
				noCommit.appendChild(document.createTextNode(messages["RebaseProgressDetails"]));
			} else {
				var title = document.createElement("div"); //$NON-NLS-0$
				title.textContent = messages["The branch is up to date."];
				noCommit.appendChild(title);
				
				var description = document.createElement("div"); //$NON-NLS-0$
				description.textContent = messages["You have no outgoing or incoming commits."];
				noCommit.appendChild(description);
			}
			
			td.appendChild(noCommit);
			tr.appendChild(td);
			bodyElement.appendChild(tr);
		}
	});
	
	return {
		GitCommitListExplorer: GitCommitListExplorer,
		GitCommitListRenderer: GitCommitListRenderer
	};

});
