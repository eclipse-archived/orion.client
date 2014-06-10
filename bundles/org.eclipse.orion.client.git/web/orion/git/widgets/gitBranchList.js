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

/*global define document */

define([
	'i18n!git/nls/gitmessages',
	'orion/explorers/explorer',
	'orion/URITemplate',
	'orion/i18nUtil',
	'orion/Deferred',
	'orion/objects'
], function(messages, mExplorer, URITemplate, i18nUtil, Deferred, objects) {

	var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$

	function GitBranchListModel(options) {
		this.root = options.root;
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
			if (parentItem.Type === "LocalRoot") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				var repository = parentItem.repository || parentItem.parent.repository;
				msg = i18nUtil.formatMessage(messages["Getting remote branches"], repository.Name);
				progress.begin(msg);
				Deferred.when(repository.Branches || this.progressService.progress(this.gitClient.getGitBranch(repository.BranchLocation + (parentItem.mode === "full" ? "?commits=1" : "?commits=1&page=1&pageSize=5")), msg), function(resp) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					progress.done();
					onComplete(that.processChildren(parentItem, resp.Children || resp));
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
			} else {
				return item.Name;
			}
		}
	});
	
	/**
	 * @class orion.git.GitBranchListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitBranchListExplorer(options) {
		var renderer = new GitBranchListRenderer({registry: options.serviceRegistry, commandService: options.commandRegistry, actionScopeId: options.actionScopeId, cachePrefix: options.prefix + "Navigator", checkbox: false}, this); //$NON-NLS-0$
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.checkbox = false;
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
		display: function() {
			this.createTree(this.parentId, new GitBranchListModel({root: this.root, registry: this.registry, progressService: this.progressService, gitClient: this.gitClient, section: this.section, handleError: this.handleError}));
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
			if (root.mode !== "full" /*&& branches.length !== 0*/){ //$NON-NLS-0$
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
				this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, 
					{"ViewAllLink":repoTemplate.expand({resource: root.repository.BranchLocation}), "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all local and remote tracking branches"]}, this, "button"); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			
			this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.addBranch", 200); //$NON-NLS-0$
			this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.addRemote", 100); //$NON-NLS-0$
			this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, root.repository, this, "button"); //$NON-NLS-0$
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
					td = document.createElement("td"); //$NON-NLS-0$
					div = document.createElement("div"); //$NON-NLS-0$
					div.className = "sectionTableItem lightTreeTableRow"; //$NON-NLS-0$
					td.appendChild(div);
					var horizontalBox = document.createElement("div"); //$NON-NLS-0$
					horizontalBox.style.overflow = "hidden"; //$NON-NLS-0$
					div.appendChild(horizontalBox);	
					var actionsID, title, description, titleClass;
					if (item.parent.Type === "LocalRoot") { //$NON-NLS-0$
						var branch = item;
						if (branch.Current){
							var span = document.createElement("span"); //$NON-NLS-0$
							span.className = "sectionIcon gitImageSprite git-sprite-branch-active"; //$NON-NLS-0$
							horizontalBox.appendChild(span);
						}
	
						titleClass = branch.Current ? "activeBranch" : ""; //$NON-NLS-0$
				
						var commit = branch.Commit.Children[0];
						var tracksMessage = ((branch.RemoteLocation.length && branch.RemoteLocation.length === 1 && branch.RemoteLocation[0].Children.length && branch.RemoteLocation[0].Children.length === 1) ? 
								i18nUtil.formatMessage(messages["tracks ${0}, "], branch.RemoteLocation[0].Children[0].Name) : messages["tracks no branch, "]);
						description = tracksMessage + i18nUtil.formatMessage(messages["last modified ${0} by ${1}"], new Date(commit.Time).toLocaleString(), commit.AuthorName); //$NON-NLS-0$
						actionsID = "branchActionsArea"; //$NON-NLS-0$
					} else if (item.parent.Type === "RemoteRoot") { //$NON-NLS-0$
						var expandContainer = document.createElement("div"); //$NON-NLS-0$
						expandContainer.style.display = "inline-block"; //$NON-NLS-0$
						expandContainer.style.styleFloat = expandContainer.style.cssFloat = "left"; //$NON-NLS-0$
						this.getExpandImage(tableRow, expandContainer);
						horizontalBox.appendChild(expandContainer);
						
						description = item.GitUrl || item.Description || item.parent.repository.ContentLocation;
						actionsID = "remoteActionsArea"; //$NON-NLS-0$
					} else if (item.parent.Type === "Remote") { //$NON-NLS-0$
						actionsID = "branchActionsArea"; //$NON-NLS-0$
						description = "";
					} 
					
					var detailsView = document.createElement("div"); //$NON-NLS-0$
					detailsView.className = "stretch"; //$NON-NLS-0$
					horizontalBox.insertBefore(detailsView);
					
					var titleDiv = document.createElement("span"); //$NON-NLS-0$
					titleDiv.className = titleClass;
					titleDiv.textContent = title || item.Name;
					detailsView.appendChild(titleDiv);
					
					var descriptionDiv = document.createElement("div"); //$NON-NLS-0$
					if (description) {
						descriptionDiv.textContent = description;
					}
					detailsView.appendChild(descriptionDiv);
						
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