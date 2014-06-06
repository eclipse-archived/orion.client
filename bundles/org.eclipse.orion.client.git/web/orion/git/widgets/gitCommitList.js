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

/*global define document Image*/

define([
	'require',
	'i18n!git/nls/gitmessages',
	'orion/commands',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/URITemplate',
	'orion/git/util',
	'orion/commonHTMLFragments',
	'orion/git/logic/gitPush',
	'orion/i18nUtil',
	'orion/explorers/navigationUtils',
	'orion/git/widgets/CommitTooltipDialog',
	'orion/webui/littlelib',
	'orion/objects'
], function(require, messages, mCommands, Deferred, mExplorer, URITemplate, util, mHTMLFragments, gitPush, i18nUtil, mNavUtils, mCommitTooltip, lib, objects) {
	var commitTemplate = new URITemplate("git/git-commit.html#{,resource,params*}?page=1&pageSize=1"); //$NON-NLS-0$
//	var logTemplate = new URITemplate("git/git-log.html#{,resource,params*}?page=1"); //$NON-NLS-0$

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
				return ref.RemoteLocation[0].Children[ref.RemoteLocation[0].Children.length - 1];
			}
		},
		tracksRemoteBranch: function(){
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
		getChildren: function(parentItem, onComplete) {
			var that = this;
			var tracksRemoteBranch = this.tracksRemoteBranch();
			if (parentItem instanceof Array && parentItem.length > 0) {
				onComplete(parentItem);
			} else if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem.Type === "CommitRoot") { //$NON-NLS-0$
				var section = this.section;
				var progress = section.createProgressMonitor();
				Deferred.when(parentItem.repository || that._getRepository(), function(repository) {
					var currentBranchMsg = i18nUtil.formatMessage(messages['GettingCurrentBranch'], repository.Name);
					progress.begin(currentBranchMsg);
					that.progressService.progress(that.gitClient.getGitBranch(repository.BranchLocation + "?commits=1&page=1&pageSize=5"), currentBranchMsg).then(function(resp) { //$NON-NLS-0$
						var currentBranch;
						resp.Children.some(function(branch) {
							if (branch.Current) {
								currentBranch = branch;
								return true;
							}
							return false;
						});
						that.currentBranch = currentBranch;
						if (!that.currentBranch || !currentBranch.RemoteLocation[0]) {
							if (that.isRebasing()) {
								section.setTitle(messages["RebaseProgress"]);
								onComplete([]);
							} else {
								section.setTitle(messages["NoBranch"]);
								onComplete(that.processChildren(parentItem, []));
							}
							progress.done();
							return;
						}
						repository.ActiveBranch = currentBranch.CommitLocation;
						repository.Branches = resp.Children;
						var localBranch = that.getLocalBranch();
						var remoteBranch = that.getRemoteBranch();
						if (localBranch) {
							section.setTitle(i18nUtil.formatMessage(messages["Commits for \"${0}\" branch against"], localBranch.Name));
						} else {
							section.setTitle(i18nUtil.formatMessage(messages["Commits for \"${0}\" branch"], remoteBranch.Name));
						}
						progress.done();
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
					}, function(error){
						progress.done();
						that.handleError(error);
					});
				}, function(error){
					progress.done();
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
							onComplete(that.processChildren(parentItem, children));
						}, function(error){
							that.handleError(error);
						});
					}, function(error){
						that.handleError(error);
					});
				} else {
					onComplete(that.processChildren(parentItem, []));
				}
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			return item.Name || item.Type;
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
			if (item.Type === "CommitRoot") { //$NON-NLS-0$
				model.incomingCommits = model.outgoingCommits = null;
			}
			item.children = model.log = null;
			model.logDeferred = new Deferred();
			var progress = this.section.createProgressMonitor();
			progress.begin(messages["Getting git log"]);
			model.getChildren(item, function(children) {
				that.myTree.refresh.bind(that.myTree)(item, children, false);
				if (item.Type === "Synchronized") { //$NON-NLS-0$
					that.updatePageCommands(item);
				} else {
					that.updateCommands();
				}
				progress.done();
				deferred.resolve(children);
			});
			return deferred;
		},
		display: function() {
			var that = this;
			var deferred = new Deferred();
			var model = new GitCommitListModel({root: this.root, registry: this.registry, progressService: this.progressService, statusService: this.statusService, gitClient: this.gitClient, section: this.section, location: this.location, handleError: this.handleError});
			this.createTree(this.parentId, model, {onComplete: function() {
				that.status = model.status;
				that.model.getRoot(function(root) {
					that.model.getChildren(root, function(children) {
						that.myTree.expand(that.model.getId(children[0]));
						that.myTree.expand(that.model.getId(children[1]));
					});
				});
				that.updateCommands();
				deferred.resolve(model.log);
			}});
			return deferred;
		},
		createCommands: function() {
			var commandService = this.commandService;
			var nextPageCommand = new mCommands.Command({
				name: messages['Next Page >'],
				tooltip: messages["Show next page of git log"],
				id: "eclipse.orion.git.commit.nextPage", //$NON-NLS-0$
				callback: function(data) {
					var item = data.items;
					if (item.log) {
						data.handler.model.location = item.log.NextLocation;
						data.handler.changedItem(item);
					}
				},
				visibleWhen: function(item) {
					return !!item.log.NextLocation;
				}
			});
			commandService.addCommand(nextPageCommand);

			var previousPageCommand = new mCommands.Command({
				name: messages['< Previous Page'],
				tooltip: messages["Show previous page of git log"],
				id: "eclipse.orion.git.commit.previousPage", //$NON-NLS-0$
				callback: function(data) {
					var item = data.items;
					if (item.log) {
						data.handler.model.location = item.log.PreviousLocation;	
						data.handler.changedItem(item);
					}
				},
				visibleWhen: function(item) {
					return !!item.log.PreviousLocation;
				}
			});
			commandService.addCommand(previousPageCommand);
			
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
					if (branch.Type === "RemoteTrackingBranch" && !branch.Id) { //$NON-NLS-0$
						name += messages[" [New branch]"];
					}
					chooseBranchCommand.name = name;
					return true;
				}
			});
			commandService.addCommand(chooseBranchCommand);
		},
		updateCommands: function() {
			var model = this.model;
			var currentBranch = model.currentBranch;
			var repository = this.root.repository;
			var commandService = this.commandService;
			var section = this.section;
			var actionsNodeScope = section.actionsNode.id;
			var titleLeftActionsNodeScope = section.titleLeftActionsNode.id;
			if (!currentBranch && model.isRebasing()) {
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.resetCommand", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseContinueCommand", 200); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseSkipPatchCommand", 300); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.rebaseAbortCommand", 400); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.renderCommands(actionsNodeScope, actionsNodeScope, repository.status, this, "button"); //$NON-NLS-0$
			} else if (currentBranch) {
				var incomingActionScope = this.incomingActionScope;
				var outgoingActionScope = this.outgoingActionScope;
				
				if (lib.node(titleLeftActionsNodeScope)) {
					commandService.destroy(titleLeftActionsNodeScope);
				}
				if (lib.node(incomingActionScope)) {
					commandService.destroy(incomingActionScope);
				}
				if (lib.node(outgoingActionScope)) {
					commandService.destroy(outgoingActionScope);
				}
				
//				commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
//				commandService.renderCommands(actionsNodeScope, actionsNodeScope, {
//					"ViewAllLink" : logTemplate.expand({resource: currentBranch.CommitLocation}),
//					"ViewAllLabel" : messages['See Full Log'],
//					"ViewAllTooltip" : messages["See the full log"]
//				}, this, "button"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	
				var tracksRemoteBranch = model.tracksRemoteBranch();
				var localBranch = model.getLocalBranch();
				var remoteBranch = model.getRemoteBranch();
				if (tracksRemoteBranch) {
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.fetch", 400); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.merge", 300); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.rebase", 200); //$NON-NLS-0$
					commandService.registerCommandContribution(incomingActionScope, "eclipse.orion.git.resetIndex", 100); //$NON-NLS-0$
					remoteBranch.GitUrl = localBranch.RemoteLocation[0].GitUrl;
					commandService.renderCommands(incomingActionScope, incomingActionScope, remoteBranch, this, "button"); //$NON-NLS-0$

					commandService.registerCommandContribution(titleLeftActionsNodeScope, "eclipse.orion.git.commit.chooseBranch", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.renderCommands(titleLeftActionsNodeScope, titleLeftActionsNodeScope, remoteBranch, this, "button"); //$NON-NLS-0$
					
					commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.sync", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					commandService.renderCommands(actionsNodeScope, actionsNodeScope, {LocalBranch: localBranch, RemoteBranch: remoteBranch}, this, "button"); //$NON-NLS-0$
				}

				commandService.addCommandGroup(outgoingActionScope, "eclipse.gitPushGroup", 1000, "Push", null, null, null, "Push", null, "eclipse.orion.git.push"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.push", 1100, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushBranch", 1200, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.registerCommandContribution(outgoingActionScope, "eclipse.orion.git.pushToGerrit", 1200, "eclipse.gitPushGroup"); //$NON-NLS-0$ //$NON-NLS-1$
				commandService.renderCommands(outgoingActionScope, outgoingActionScope, {LocalBranch: localBranch, RemoteBranch: remoteBranch}, this, "button"); //$NON-NLS-0$
			}
		},
		updatePageCommands: function(item) {
			var that = this;
			this.model.logDeferred.then(function() {
				var commandService = that.commandService;
				if (lib.node(that.syncActionScope)) {
					commandService.destroy(that.syncActionScope);
				}
				commandService.registerCommandContribution(that.syncActionScope, "eclipse.orion.git.commit.nextPage", 200); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerCommandContribution(that.syncActionScope, "eclipse.orion.git.commit.previousPage", 100); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				commandService.renderCommands(that.syncActionScope, that.syncActionScope, item, that, "button"); //$NON-NLS-0$
			});
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
				var description, detailsView, actionsArea;
				if (item.Type !== "Commit") { //$NON-NLS-0$
					if (item.Type !== "NoCommits") { //$NON-NLS-0$
						sectionItem.className = "gitCommitSectionTableItem"; //$NON-NLS-0$
						var expandContainer = document.createElement("div"); //$NON-NLS-0$
						expandContainer.style.display = "inline-block"; //$NON-NLS-0$
						expandContainer.style.styleFloat = "left"; //$NON-NLS-0$
						expandContainer.style.cssFloat = "left"; //$NON-NLS-0$
						var expandImage = this.getExpandImage(tableRow, expandContainer);
						if (item.Type === "Synchronized") { //$NON-NLS-0$
							expandImage.addEventListener("click",function() { //$NON-NLS-0$
								explorer.updatePageCommands(item);
							});
						}
						horizontalBox.appendChild(expandContainer);
						tableRow.classList.add("gitCommitListSection"); //$NON-NLS-0$
					} else {
						tableRow.classList.add("gitComitListNoCommit"); //$NON-NLS-0$
						sectionItem.classList.add("sectionTableItem"); //$NON-NLS-0$
					}
					
					detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.appendChild(detailsView);
					
					var title = document.createElement("div"); //$NON-NLS-0$
					title.textContent = messages[item.Type];
					if (item.Type !== "NoCommits") { //$NON-NLS-0$
						title.classList.add("gitComitListSectionTitle"); //$NON-NLS-0$
					}
					detailsView.appendChild(title);
			
					actionsArea = document.createElement("ul"); //$NON-NLS-0$
					actionsArea.className = "layoutRight commandList"; //$NON-NLS-0$
					actionsArea.id = item.Type + "Actions"; //$NON-NLS-0$
					horizontalBox.appendChild(actionsArea);
					
					horizontalBox.classList.add("toolComposite"); //$NON-NLS-0$
					var slideoutFragment = mHTMLFragments.slideoutHTMLFragment(actionsArea.id);
					var range = document.createRange();
					range.selectNode(horizontalBox);
					slideoutFragment = range.createContextualFragment(slideoutFragment);
					horizontalBox.appendChild(slideoutFragment);
				} else {
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
	
					var titleLink = document.createElement("a"); //$NON-NLS-0$
					titleLink.className = "navlinkonpage"; //$NON-NLS-0$
					titleLink.href = require.toUrl(commitTemplate.expand({resource: commit.Location})); //$NON-NLS-0$
					titleLink.textContent = util.trimCommitMessage(commit.Message);
					detailsView.appendChild(titleLink);
					
					//Add the commit page link as the first grid of the row
					mNavUtils.addNavGrid(this.explorer.getNavDict(), item, titleLink);
					
					new mCommitTooltip.CommitTooltipDialog({commit: commit, triggerNode: titleLink});
	
					var d = document.createElement("div"); //$NON-NLS-0$
					detailsView.appendChild(d);
	
					description = document.createElement("span"); //$NON-NLS-0$
					description.textContent = messages[" (SHA "] + commit.Name + messages[") by "] + commit.AuthorName + messages[" on "]
							+ new Date(commit.Time).toLocaleString();
					detailsView.appendChild(description);
					
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