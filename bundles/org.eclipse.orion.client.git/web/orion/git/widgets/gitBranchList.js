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
	'orion/git/widgets/gitChangeList',
	'orion/git/widgets/gitCommitInfo',
	'orion/section',
	'orion/explorers/explorer',
	'orion/URITemplate',
	'orion/git/util',
	'orion/i18nUtil',
	'orion/Deferred',
	'orion/objects'
], function(require, messages, mGitChangeList, mGitCommitInfo, mSection, mExplorer, URITemplate, util, i18nUtil, Deferred, objects) {

	var commitTemplate = new URITemplate("git/git-commit.html#{,resource,params*}?page=1&pageSize=1"); //$NON-NLS-0$

	function GitBranchListModel(options) {
		this.root = options.root;
		this.showHistory = options.showHistory === undefined || options.showHistory;
		this.showTags = options.showTags === undefined || options.showTags;
		this.registry = options.registry;
		this.handleError = options.handleError;
		this.section = options.section;
		this.progressService = options.progressService;
		this.gitClient = options.gitClient;
	}
	GitBranchListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitBranchListModel.prototype, /** @lends orion.git.GitBranchListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(parentItem, onComplete){	
			var that = this;
			var progress, msg;
			var repository = parentItem.repository || parentItem.parent.repository;
			if (parentItem.Type === "LocalRoot") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				msg = i18nUtil.formatMessage(messages["Getting remote branches"], repository.Name);
				progress.begin(msg);
				Deferred.when(repository.Branches || this.progressService.progress(this.gitClient.getGitBranch(parentItem.location ? parentItem.location : repository.BranchLocation + "?commits=1&page=1&pageSize=5"), msg), function(resp) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					var children = parentItem.children;
					if (children) { //$NON-NLS-0$
						var args = [children.length - 1, 1].concat(resp.Children || resp);
						Array.prototype.splice.apply(children, args);
					} else {
						children = resp.Children || resp;
					}
					if (resp.NextLocation) {
						children.push({Type: "MoreBranches", NextLocation: resp.NextLocation}); //$NON-NLS-0$
					}
					progress.done();
					onComplete(that.processChildren(parentItem, children));
				}, function(error){
					progress.done();
					that.handleError(error);
				});
			} else if (parentItem.Type === "TagRoot") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				msg = i18nUtil.formatMessage(messages["Getting remote branches"], repository.Name);
				progress.begin(msg);
				Deferred.when(repository.Branches || this.progressService.progress(this.gitClient.getGitBranch(parentItem.location ? parentItem.location : repository.TagLocation + "?commits=1&page=1&pageSize=5"), msg), function(resp) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					var children = parentItem.children;
					if (children) { //$NON-NLS-0$
						var args = [children.length - 1, 1].concat(resp.Children || resp);
						Array.prototype.splice.apply(children, args);
					} else {
						children = resp.Children || resp;
					}
					if (resp.NextLocation) {
						children.push({Type: "MoreTags", NextLocation: resp.NextLocation}); //$NON-NLS-0$
					}
					progress.done();
					onComplete(that.processChildren(parentItem, children));
				}, function(error){
					progress.done();
					that.handleError(error);
				});
			} else if (parentItem.Type === "RemoteRoot") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				msg = i18nUtil.formatMessage(messages["Getting remote branches"], parentItem.repository.Name);
				this.progressService.progress(this.gitClient.getGitRemote(parentItem.repository.RemoteLocation), msg).then(function (resp) {
					progress.done();
					var remotes = resp.Children;
					remotes.unshift({Type: "LocalRoot", Name: messages["Local"]}); //$NON-NLS-0$
					if (that.showTags) {
						remotes.push({Type: "TagRoot", Name: messages["Tags"]}); //$NON-NLS-0$
					}
					onComplete(that.processChildren(parentItem, remotes));
					if (remotes.length === 0){
						this.section.setTitle(messages["No Remote Branches"]);
					}
				}, function(error){
					progress.done();
					that.handleError(error);
				});
			} else if (parentItem.Type === "Remote") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				msg = i18nUtil.formatMessage(messages["Getting remote branches"], parentItem.Name);
				progress.begin(msg);
				this.progressService.progress(this.gitClient.getGitRemote(parentItem.Location), msg).then(function (resp) {
					progress.done();
					onComplete(that.processChildren(parentItem, resp.Children));
				}, function(error){
					progress.done();
					that.handleError(error);
				});
			} else if (this.showHistory && (parentItem.Type === "Branch" || parentItem.Type === "RemoteTrackingBranch" || parentItem.Type === "Tag")) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				msg = i18nUtil.formatMessage(messages['Getting commits for \"${0}\" branch'], parentItem.Name);
				this.progressService.progress(that.gitClient.doGitLog(parentItem.location ? parentItem.location : parentItem.CommitLocation + "?page=1&pageSize=20"), msg).then(function(resp) { //$NON-NLS-0$
					var children = parentItem.children;
					if (children) {
						var args = [children.length - 1, 1].concat(resp.Children);
						Array.prototype.splice.apply(children, args);
					} else {
						children = resp.Children;
					}
					if (resp.NextLocation) {
						children.push({Type: "MoreCommits", NextLocation: resp.NextLocation}); //$NON-NLS-0$
					}
					progress.done();
					onComplete(that.processChildren(parentItem, children));
				}, function(error){
					that.handleError(error);
				});
			} else if (parentItem.Type === "Commit") {  //$NON-NLS-0$
				onComplete(that.processChildren(parentItem, [{Type: "CommitChanges"}]));  //$NON-NLS-0$
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
			if (item.Type === "LocalRoot") { //$NON-NLS-0$
				return "LocalRoot"; //$NON-NLS-0$
			} else if (item.Type === "MoreCommits" || item.Type === "MoreBranches") { //$NON-NLS-1$ //$NON-NLS-0$
				return item.Type + item.parent.Name;
			} else {
				return "branchList" + (item.Name || item.Type); //$NON-NLS-0$
			}
		}
	});
	
	/**
	 * @class orion.git.GitBranchListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitBranchListExplorer(options) {
		var renderer = new GitBranchListRenderer({
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			cachePrefix: options.prefix + "Navigator", //$NON-NLS-0$
//			noRowHighlighting: true,
			checkbox: false
		}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.checkbox = false;
		this.showHistory = true;
		this.showTags = false;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.root = options.root;
		this.section = options.section;
		this.handleError = options.handleError;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
	}
	GitBranchListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitBranchListExplorer.prototype, /** @lends orion.git.GitBranchListExplorer.prototype */ {
		changedItem: function(item) {
			var deferred = new Deferred();
			var model = this.model;
			var that = this;
			model.getChildren(item, function(children) {
				item.removeAll = true;
				that.myTree.refresh.bind(that.myTree)(item, children, false);
				deferred.resolve(children);
			});
			return deferred;
		},
		display: function() {
			this.createTree(this.parentId, new GitBranchListModel({
				root: this.root,
				registry: this.registry,
				progressService: this.progressService,
				gitClient: this.gitClient,
				section: this.section,
				showHistory: this.showHistory,
				showTags: this.showTags,
				handleError: this.handleError
			}));
			this.updateCommands();
		},
		isRowSelectable: function(modelItem) {
			return false;
		},
//		getItemCount: function() {
//			return this.branches.length;
//		},
		updateCommands: function() {
			var root = this.root;
			var section = this.section;
			var actionsNodeScope = section.actionsNode.id;
			if (root.Type === "RemoteRoot") { //$NON-NLS-0$
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.addBranch", 200); //$NON-NLS-0$
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.addRemote", 100); //$NON-NLS-0$
				this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, root.repository, this, "button"); //$NON-NLS-0$
			}
		}
	});
	
	function GitBranchListRenderer(options) {
		mExplorer.SelectionRenderer.apply(this, arguments);
		this.registry = options.registry;
	}
	GitBranchListRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(GitBranchListRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			var div, td;
			switch (col_no) {
				case 0:
					var commit, explorer = this.explorer;
				
					td = document.createElement("td"); //$NON-NLS-0$
					div = document.createElement("div"); //$NON-NLS-0$
					div.className = "sectionTableItem"; //$NON-NLS-0$
					td.appendChild(div);
					var horizontalBox = document.createElement("div"); //$NON-NLS-0$
					horizontalBox.style.overflow = "hidden"; //$NON-NLS-0$
					div.appendChild(horizontalBox);	
					
					var that = this;
					function createExpand() {
						var expandContainer = document.createElement("div"); //$NON-NLS-0$
						expandContainer.style.display = "inline-block"; //$NON-NLS-0$
						expandContainer.style.styleFloat = expandContainer.style.cssFloat = "left"; //$NON-NLS-0$
						that.getExpandImage(tableRow, expandContainer);
						horizontalBox.appendChild(expandContainer);
					}
					
					var actionsID, title, description, subDescription, titleClass = "", titleLink;
					if (item.Type === "MoreCommits" || item.Type === "MoreBranches" || item.Type === "MoreTags") { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						td.classList.add("gitCommitListMore"); //$NON-NLS-0$
						td.textContent = i18nUtil.formatMessage(messages[item.Type], item.parent.Name);
						var listener;
						td.addEventListener("click", listener = function() { //$NON-NLS-0$
							td.removeEventListener("click", listener); //$NON-NLS-0$
							td.textContent = i18nUtil.formatMessage(messages[item.Type + "Progress"], item.parent.Name);
							item.parent.location = item.NextLocation;
							explorer.changedItem(item.parent);
						});
						return td;
					} else if (item.parent.Type === "LocalRoot") { //$NON-NLS-0$
						if (explorer.showHistory) createExpand();
						var branch = item;
						if (branch.Current){
							var span = document.createElement("span"); //$NON-NLS-0$
							span.className = "sectionIcon gitImageSprite git-sprite-branch-active"; //$NON-NLS-0$
							horizontalBox.appendChild(span);
							titleClass = "activeBranch"; //$NON-NLS-0$
						}
						commit = branch.Commit.Children[0];
						var tracksMessage = ((branch.RemoteLocation.length && branch.RemoteLocation.length === 1 && branch.RemoteLocation[0].Children.length && branch.RemoteLocation[0].Children.length === 1) ? 
								i18nUtil.formatMessage(messages["tracks ${0}, "], branch.RemoteLocation[0].Children[0].Name) : messages["tracks no branch, "]);
						description = tracksMessage + i18nUtil.formatMessage(messages["last modified ${0} by ${1}"], new Date(commit.Time).toLocaleString(), commit.AuthorName); //$NON-NLS-0$
						actionsID = "branchActionsArea"; //$NON-NLS-0$
					} else if (item.parent.Type === "TagRoot") { //$NON-NLS-0$
						if (explorer.showHistory) createExpand();
						commit = item.Commit.Children[0];
//						description = util.trimCommitMessage(commit.Message);
//						subDescription = i18nUtil.formatMessage(messages["authored by 0 (1) on 2"], commit.AuthorName, commit.AuthorEmail, new Date(commit.Time).toLocaleString()); //$NON-NLS-0$
						actionsID = "tagActionsArea"; //$NON-NLS-0$
					} else if (item.parent.Type === "RemoteRoot") { //$NON-NLS-0$
						createExpand();
						if (item.Type !== "TagRoot") { //$NON-NLS-0$
							description = item.GitUrl || item.Description || item.parent.repository.ContentLocation;
						}
						actionsID = "remoteActionsArea"; //$NON-NLS-0$
					} else if (item.parent.Type === "Remote") { //$NON-NLS-0$
						if (explorer.showHistory) createExpand();
						actionsID = "branchActionsArea"; //$NON-NLS-0$
						description = "";
					} else if (item.Type === "Commit") { //$NON-NLS-0$
						createExpand();
						commit = item;
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
						
						title = util.trimCommitMessage(commit.Message);
						description = i18nUtil.formatMessage(messages["authored by 0 (1) on 2"], //$NON-NLS-0$
									commit.AuthorName, commit.AuthorEmail, new Date(commit.Time).toLocaleString()); 
						if (explorer.showCommitLinks) {
							titleLink = require.toUrl(commitTemplate.expand({resource: commit.Location})); //$NON-NLS-0$
							titleClass = "navlinkonpage"; //$NON-NLS-0$
						} else {
							titleClass = "gitCommitTitle"; //$NON-NLS-0$
						}
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
							id: "diffSection" + commit.Name, //$NON-NLS-0$
							title: messages["ChangedFiles"],
							slideout: true,
							canHide: false,
							preferenceService: explorer.preferencesService
						}); 

						var repository = explorer.model.root.repository;
						setTimeout(function() {
							var explorer2  = new mGitChangeList.GitChangeListExplorer({
								serviceRegistry: explorer.registry,
								commandRegistry: explorer.commandService,
								selection: null,
								parentId: titleWrapper.getContentElement(), 
								actionScopeId: "diffSectionItemActionArea",
								prefix: "diff",
								changes: diffs,
								location: repository.StatusLocation,
								repository: repository,
								section: titleWrapper
							});
							explorer2.display();
						}, 10);
						return td;
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
					
					if (item.Type === "Commit") { //$NON-NLS-0$
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
					}

					var actionsArea = document.createElement("div"); //$NON-NLS-0$
					actionsArea.className = "sectionTableItemActions"; //$NON-NLS-0$
					actionsArea.id = actionsID;
					horizontalBox.appendChild(actionsArea);
					this.commandService.renderCommands(this.actionScopeId, actionsArea, item, this.explorer, "tool"); //$NON-NLS-0$	
					return td;
			}
		}
	});
	
	return {
		GitBranchListExplorer: GitBranchListExplorer,
		GitBranchListRenderer: GitBranchListRenderer
	};

});