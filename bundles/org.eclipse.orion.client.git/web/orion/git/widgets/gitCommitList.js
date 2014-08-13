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
	'orion/git/widgets/gitChangeList',
	'orion/git/widgets/gitCommitInfo',
	'orion/section',
	'orion/commands',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/commonHTMLFragments',
	'orion/i18nUtil',
	'orion/git/util',
	'orion/webui/littlelib',
	'orion/objects'
], function(messages, mGitChangeList, mGitCommitInfo, mSection, mCommands, Deferred, mExplorer, mHTMLFragments, i18nUtil, util, lib, objects) {

	var pageSizeQuery = "?page=1&pageSize=20"; //$NON-NLS-0$

	function GitCommitListModel(options) {
		this.root = options.root;
		this.showCommitChanges = options.showCommitChanges;
		this.section = options.section;
		this.location = options.location;
		this.handleError = options.handleError;
		this.repository = options.repository;
		this.progressService = options.progressService;
		this.statusService = options.statusService;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.simpleLog = options.simpleLog;
		this.parentId = options.parentId;
		this.targetRef = options.targetRef;
		this.log = options.log;
		this.logDeferred = new Deferred();
		this.repositoryPath = options.repositoryPath || "";
	}
	GitCommitListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitCommitListModel.prototype, /** @lends orion.git.GitCommitListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		_getRepository: function(parentItem) {
			var that = this;
			return Deferred.when(that.log || that._getLog(parentItem), function(log) {
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
		_getLog: function(parentItem) {
			var that = this;
			var logMsg = that.location ? messages["Getting git log"] : i18nUtil.formatMessage(messages['Getting commits for \"${0}\" branch'], that.currentBranch.Name);
			var ref = that.simpleLog ? that.getTargetReference() : that.getActiveBranch();
			var location = parentItem.more ? parentItem.location : that.location || ((ref.CommitLocation || ref.Location) + that.repositoryPath + pageSizeQuery);
			return that.progressService.progress(that.gitClient.doGitLog(location), logMsg).then(function(resp) {
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
			var activeBranch = this.getActiveBranch();
			var targetRef = this.getTargetReference();
			var location = (targetRef.CommitLocation || targetRef.Location) + (that.log ? that.log.RepositoryPath : "");
			var id = activeBranch.Name;
			return that.progressService.progress(that.gitClient.getLog(location + pageSizeQuery, id), messages['Getting outgoing commits']).then(function(resp) {
				return that.outgoingCommits = resp.Children;
			});
		},
		_getIncoming: function() {
			var that = this;
			var activeBranch = this.getActiveBranch();
			var targetRef = this.getTargetReference();
			var location = activeBranch.CommitLocation + (that.log ? that.log.RepositoryPath : "");
			var id = targetRef.Name;
			return that.progressService.progress(that.gitClient.getLog(location + pageSizeQuery, id), messages['Getting git incoming changes...']).then(function(resp) {
				return that.incomingCommits = resp.Children;
			});
		},
		getActiveBranch: function() {
			return this.currentBranch;
		},
		getTargetReference: function() {
			if (this.targetRef) {
				return this.targetRef;
			}
			var result;
			if (this.log) {
				if (this.log && !this.log.toRef) {
					result = this.log.Children[0];
				} else {
					result = this.log.toRef;
				}
			} else {
				var ref = this.currentBranch;
				result = ref.RemoteLocation[0] && ref.RemoteLocation[0].Children[ref.RemoteLocation[0].Children.length - 1];
			}
			this.targetRef = result;
			return result;
		},
		tracksRemoteBranch: function(){
			if (this.targetRef) {
				if (this.isNewBranch(this.targetRef)) {
					return false;
				}
			}
			var ref = this.currentBranch;
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
				Deferred.when(parentItem.repository || that._getRepository(parentItem), function(repository) {
					var currentBranchMsg = i18nUtil.formatMessage(messages['GettingCurrentBranch'], repository.Name);
					if (progress) progress.worked(currentBranchMsg);
					Deferred.when(repository.BranchesNoCommits || (repository.BranchesNoCommits = that.progressService.progress(that.gitClient.getGitBranch(repository.BranchLocation + "?commits=0&page=1&pageSize=5"), currentBranchMsg)), function(resp) { //$NON-NLS-0$
						var currentBranch, branches = resp.Children || resp;
						repository.BranchesNoCommits = branches;
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
						var activeBranch = that.getActiveBranch();
						var targetRef = that.getTargetReference();
						if (activeBranch && targetRef && !that.simpleLog) {
							if (section) section.setTitle(activeBranch.Name);
						} else if (targetRef || activeBranch) {
							if (section) section.setTitle(util.shortenRefName(targetRef || activeBranch));
						}
						if (progress) progress.done();
						if (that.simpleLog) {
							return Deferred.when(that.log || that._getLog(parentItem), function(log) {
								parentItem.log = log;
								that.logDeferred.resolve(log);
								var children = log.Children.slice(0);
								onComplete(that.processChildren(parentItem, that.processMoreChildren(parentItem, children, log)));
							}, function(error){
								that.handleError(error);
							});
						} else {
							onComplete(that.processChildren(parentItem, [
								{
									Type: "Uncommited",  //$NON-NLS-0$
									selectable: false,
									isNotSelectable: true
								},
								{
									Type: "Outgoing", //$NON-NLS-0$
									selectable: false,
									isNotSelectable: true,
									activeBranch: activeBranch,
									targetRef: targetRef
								},
								{
									Type: "Incoming", //$NON-NLS-0$
									selectable: false,
									isNotSelectable: true,
									activeBranch: activeBranch,
									targetRef: targetRef
								},
								{
									Type: "Synchronized", //$NON-NLS-0$
									selectable: false,
									isNotSelectable: true,
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
			} else if (parentItem.Type === "Uncommited") { //$NON-NLS-0$
				var repository = that.root.repository;
				Deferred.when(repository.status || (repository.status = that.progressService.progress(that.gitClient.getGitStatus(repository.StatusLocation), messages['Getting changes'])), function(status) { //$NON-NLS-0$
					repository.status = status;
					onComplete(that.processChildren(parentItem, [
						status
					]));
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
					return Deferred.when(that.log || that._getLog(parentItem), function(log) {
						var children = [];
						if (log.toRef.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
							children = that.processMoreChildren(parentItem, log.Children.slice(0), log);
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
					return Deferred.when(that.log || that._getLog(parentItem), function(log) {
						var children = [];
						if (log.toRef.Type === "Branch") { //$NON-NLS-0$
							children = that.processMoreChildren(parentItem, log.Children.slice(0), log);
						} 
						onComplete(that.processChildren(parentItem, children));
					}, function(error){
						that.handleError(error);
					});
				}
			} else if (parentItem.Type === "Synchronized") { //$NON-NLS-0$
				if (tracksRemoteBranch) {
					return Deferred.when(that.log || that._getLog(parentItem), function(log) {
						parentItem.log = log;
						that.logDeferred.resolve(log);
						var remoteBranch = log.toRef && log.toRef.Type === "RemoteTrackingBranch"; //$NON-NLS-0$
						Deferred.when(remoteBranch ? that.incomingCommits || that._getIncoming() : that.outgoingCommits || that._getOutgoing(), function(filterCommits) {
							var children = [];
							log.Children.forEach(function(commit) {
								if (!filterCommits.some(function(com) { return com.Name === commit.Name; })) {
									children.push(commit);
								}
							});
							onComplete(that.processChildren(parentItem, that.processMoreChildren(parentItem, children, log)));
						}, function(error){
							that.handleError(error);
						});
					}, function(error){
						that.handleError(error);
					});
				} else {
					onComplete(that.processChildren(parentItem, []));
				}
			} else if (parentItem.Type === "Commit" && that.showCommitChanges) {  //$NON-NLS-0$
				onComplete(that.processChildren(parentItem, [{Type: "CommitChanges"}]));  //$NON-NLS-0$
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			return this.parentId + (item.Name ? item.Name : "") + (item.Type ? item.Type : ""); //$NON-NLS-0$
		},
		processMoreChildren: function(parentItem, children, item) {
			var fullList = parentItem.children;
			if (fullList) {
				var args = [fullList.length - 1, 1].concat(children);
				Array.prototype.splice.apply(fullList, args);
			} else {
				fullList = children;
			}
			if (item.NextLocation) {
				fullList.push({Type: "MoreCommits", NextLocation: item.NextLocation, selectable: false, isNotSelectable: true}); //$NON-NLS-0$
			}
			return fullList;
		},
		processChildren: function(parentItem, items) {
			if (items.length === 0) {
				items = [{Type: "NoCommits", selectable: false, isNotSelectable: true}]; //$NON-NLS-0$
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
		this.targetRef = options.targetRef;
		this.log = options.log;
		this.simpleLog = options.simpleLog;
		this.selectionPolicy = options.selectionPolicy;
		this.repositoryPath = options.repositoryPath;
		
		this.incomingActionScope = "IncomingActions"; //$NON-NLS-0$
		this.outgoingActionScope = "OutgoingActions"; //$NON-NLS-0$
		this.syncActionScope = "SynchronizedActions"; //$NON-NLS-0$
		
		if (this.selection) {
			this.selection.addEventListener("selectionChanged", function(e) { //$NON-NLS-0$
				this.updateSelectionCommands(e.selections);
			}.bind(this));
		}
		
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
			model.log = null;
			model.logDeferred = new Deferred();
			if (item.more) {
			} else {
				item.children = null;
			}
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
				repositoryPath: this.repositoryPath,
				log: this.log,
				targetRef: this.targetRef,
				simpleLog: this.simpleLog
			});
			this.createTree(this.parentId, model, {
				setFocus: false, // do not steal focus on load
				selectionPolicy: this.selectionPolicy,
				onComplete: function() {
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
				}
			});
			return deferred;
		},
		expandSections: function(children) {
			if (!this.simpleLog && !this.model.isRebasing()) {
				for (var i = 0; i < children.length; i++) {
					this.myTree.expand(this.model.getId(children[i]));
				}
			}
		},
		isRowSelectable: function() {
			return !!this.selection;
		},
		createCommands: function() {
			var that = this;
			var commandService = this.commandService;
			
			var simpleLogCommand = new mCommands.Command({
				id: "eclipse.orion.git.commit.simpleLog", //$NON-NLS-0$
				callback: function(data) {
					var model = that.model;
					model.simpleLog = !model.simpleLog;
					that.simpleLog = !that.simpleLog;
					data.handler.changedItem();
				},
				visibleWhen: function(item) {
					simpleLogCommand.name = that.model.simpleLog ? "Show Active Branch" : "Show Log";
					simpleLogCommand.tooltip = that.model.simpleLog ? "Show the history of the active branch against the selected reference." : "Show the history of the selected reference.";
					return true;
				}
			});
			commandService.addCommand(simpleLogCommand);
		},
		fetch: function() {
			var model = this.model;
			var targetRef = model.getTargetReference();
			if (model.tracksRemoteBranch() && !this.simpleLog && !model.isRebasing() && targetRef.Type === "RemoteTrackingBranch") { //$NON-NLS-0$
				var commandService = this.commandService;
				var activeBranch = model.getActiveBranch();
				return commandService.runCommand("eclipse.orion.git.fetch", {LocalBranch: activeBranch, RemoteBranch: targetRef, noAuth: true}, this); //$NON-NLS-0$
			}
			return new Deferred().resolve();
		},
		updateSelectionCommands: function(items) {
			var commandService = this.commandService;
			var section = this.section;
			if (!section) return;
			var selectionNodeScope = section.selectionNode.id;
			if (lib.node(selectionNodeScope)) {
				commandService.destroy(selectionNodeScope);
			}
			commandService.registerCommandContribution(selectionNodeScope, "eclipse.compareGitCommits", 1); //$NON-NLS-1$ //$NON-NLS-0$
			commandService.renderCommands(selectionNodeScope, selectionNodeScope, items, this, "button"); //$NON-NLS-0$
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
				return;
			}
			
			if (lib.node(titleLeftActionsNodeScope)) {
				commandService.destroy(titleLeftActionsNodeScope);
			}
			commandService.registerCommandContribution(titleLeftActionsNodeScope, "eclipse.orion.git.commit.simpleLog", 50); //$NON-NLS-0$
			commandService.renderCommands(titleLeftActionsNodeScope, titleLeftActionsNodeScope, this, this, "button"); //$NON-NLS-0$
			
			if (currentBranch && !this.simpleLog) {
				var incomingActionScope = this.incomingActionScope;
				var outgoingActionScope = this.outgoingActionScope;
				
				if (lib.node(actionsNodeScope)) {
					commandService.destroy(actionsNodeScope);
				}
				if (lib.node(incomingActionScope)) {
					commandService.destroy(incomingActionScope);
				}
				if (lib.node(outgoingActionScope)) {
					commandService.destroy(outgoingActionScope);
				}
	
				var tracksRemoteBranch = model.tracksRemoteBranch();
				var activeBranch = model.getActiveBranch();
				var targetRef = model.getTargetReference();
				if (tracksRemoteBranch) {
					commandService.addCommandGroup(incomingActionScope, "eclipse.gitFetchGroup", 500, "Fetch", null, null, null, "Fetch", null, "eclipse.orion.git.fetch"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.fetch", 100, "eclipse.gitFetchGroup"); //$NON-NLS-0$ //$NON-NLS-1$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.fetchForce", 200, "eclipse.gitFetchGroup"); //$NON-NLS-0$ //$NON-NLS-1$
					
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.merge", 300); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.mergeSquash", 350); //$NON-NLS-1$ //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.rebase", 200); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.resetIndex", 400); //$NON-NLS-0$
					targetRef.GitUrl = activeBranch.RemoteLocation[0].GitUrl;
					commandService.renderCommands(incomingActionScope, incomingActionScope, targetRef, this, "button"); //$NON-NLS-0$

					commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.sync", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.renderCommands(actionsNodeScope, actionsNodeScope, {LocalBranch: activeBranch, RemoteBranch: targetRef}, this, "button"); //$NON-NLS-0$
				}

				commandService.addCommandGroup(outgoingActionScope, "eclipse.gitPushGroup", 1000, "Push", null, null, null, "Push", null, "eclipse.orion.git.push"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.push", 1100, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushForce", 1200, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushBranch", 1300, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushForceBranch", 1400, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushToGerrit", 1500, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$

				commandService.renderCommands(outgoingActionScope, outgoingActionScope, {LocalBranch: activeBranch, RemoteBranch: targetRef}, this, "button"); //$NON-NLS-0$
			}
		}
	});
	
	function GitCommitListRenderer(options) {
		options.setFocus = false;   // do not steal focus on load
		options.cachePrefix = null; // do not persist table state
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
				
				var detailsView, actionsArea, title;
				var model = explorer.model;
				if (item.Type === "MoreCommits") { //$NON-NLS-1$ //$NON-NLS-0$
					td.classList.add("gitCommitListMore"); //$NON-NLS-0$
					var ref = model.simpleLog ? model.getTargetReference() : model.getActiveBranch();
					td.textContent = i18nUtil.formatMessage(messages[item.Type], ref ? ref.Name : model.root.Name);
					var listener;
					td.addEventListener("click", listener = function() { //$NON-NLS-0$
						td.removeEventListener("click", listener); //$NON-NLS-0$
						td.textContent = i18nUtil.formatMessage(messages[item.Type + "Progress"], ref ? ref.Name : model.root.Name);
						item.parent.location = item.NextLocation;
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
						tagsCommandHandler: explorer,
						commit: commit,
						showTags: false,
						commitLink: false,
						showMessage: false,
						fullMessage: true,
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
				}  else if (item.Type === "Status") { //$NON-NLS-0$
					sectionItem.classList.add("sectionTableItem"); //$NON-NLS-0$
						
					detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
					
					title = document.createElement("div"); //$NON-NLS-0$
					title.textContent = messages["LocalChanges"];
					title.classList.add("gitStatusTitle"); //$NON-NLS-0$
					detailsView.appendChild(title);
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
					
					title = document.createElement("div"); //$NON-NLS-0$
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
					if (model.showCommitChanges) {
						createExpand();
					}
					sectionItem.className = "sectionTableItem"; //$NON-NLS-0$
					detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
					var commitInfo = new mGitCommitInfo.GitCommitInfo({
						parent: detailsView,
						tagsCommandHandler: explorer,
						commit: commit,
						showTags: true,
						showBranches: false,
						commitLink: false,
						showParentLink: false,
						showCommitter: false,
						showCommit: false,
						showGerrit: false,
						simple: true,
					});
					commitInfo.display();
					
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
