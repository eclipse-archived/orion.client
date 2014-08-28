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
	'orion/i18nUtil',
	'orion/Deferred',
	'orion/explorers/explorer',
	'orion/git/uiUtil',
	'orion/git/util',
	'orion/webui/tooltip',
	'orion/selection',
	'orion/webui/littlelib',
	'orion/commands',
	'orion/git/logic/gitCommit',
	'orion/objects'
], function(messages, i18nUtil, Deferred, mExplorer, mGitUIUtil, mGitUtil, mTooltip, mSelection , lib, mCommands, gitCommit, objects) {
	
	var interestedUnstagedGroup = [ "Missing", "Modified", "Untracked", "Conflicting" ]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var interestedStagedGroup = [ "Added", "Changed", "Removed" ]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var allGroups = interestedUnstagedGroup.concat(interestedStagedGroup);
	var conflictType = "Conflicting"; //$NON-NLS-0$

	function isConflict(type) {
		return type === conflictType;
	}
	
	var statusTypeMap = {
		"Missing" : { imageClass: "gitImageSprite git-sprite-removal", tooltip: messages['Unstaged removal'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Removed" : { imageClass: "gitImageSprite git-sprite-removal", tooltip: messages['Staged removal'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Modified" : { imageClass: "gitImageSprite git-sprite-file", tooltip: messages['Unstaged change'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Changed" : { imageClass: "gitImageSprite git-sprite-file", tooltip: messages['Staged change'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Untracked" : { imageClass: "gitImageSprite git-sprite-addition", tooltip: messages["Unstaged addition"] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Added" : { imageClass: "gitImageSprite git-sprite-addition", tooltip: messages["Staged addition"] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"Conflicting" : { imageClass: "gitImageSprite git-sprite-conflict-file", tooltip: messages['Conflicting'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

		"ADD" : { imageClass: "gitImageSprite git-sprite-addition", tooltip: messages['Addition'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"MODIFY" : { imageClass: "gitImageSprite git-sprite-file", tooltip: messages['Deletion'] }, //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		"DELETE" : { imageClass: "gitImageSprite git-sprite-removal", tooltip: messages['Diffs'] } //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	};
			
	function GitChangeListModel(options) {
		this.changes = options.changes;
		this.registry = options.registry;
		this.prefix = options.prefix;
		this.location = options.location;
		this.commitName = options.commitName;
		this.repository = options.repository;
		this.handleError = options.handleError;
		this.changes = options.changes;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.section = options.section;
	}
	GitChangeListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitChangeListModel.prototype, /** @lends orion.git.GitChangeListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.changes || (this.root || (this.root = {Type: "Root"}))); //$NON-NLS-0$
		},
		getGroups: function(prefix) {
			switch(prefix) {
				case "all": //$NON-NLS-0$
					return allGroups;
				case "staged": //$NON-NLS-0$
					return interestedStagedGroup;
				case "unstaged": //$NON-NLS-0$
					return interestedUnstagedGroup;
			}
		},
		_processDiffs: function(diffs) {
			diffs.forEach(function(item) {
				var path = item.OldPath;
				if (item.ChangeType === "ADD") { //$NON-NLS-0$
					path = item.NewPath;
				} 
				item.name = path;
				item.type = item.ChangeType;
			});
			if (diffs.length > 0) {
				diffs.unshift({Type: "ExplorerSelection", selectable: true}); //$NON-NLS-0$
			}
			return diffs;
		},
		processChildren: function(parentItem, children) {
			parentItem.children = children;
			children.forEach(function(child) {
				child.parent = parentItem;
			});
			return children;
		},
		getChildren: function(parentItem, onComplete){
			var that = this;
			if (parentItem.children) {
				onComplete(parentItem.children);
			} else if (parentItem instanceof Array && parentItem.length > 0) {
				onComplete(that.processChildren(parentItem, this._processDiffs(parentItem.slice(0))));
			} else if (parentItem.Type === "Root") { //$NON-NLS-0$
				var location = this.location; 
				var progressService = this.progressService;
				var gitClient = this.gitClient;
				var progress = this.section.createProgressMonitor();
				progress.begin(messages["Getting changes"]);
				var repository = that.repository;
				if (location) {
					function doDiff(loc) {
						gitClient.doGitDiff(loc + "?parts=diffs").then(function(resp) { //$NON-NLS-0$
							progress.done();
							onComplete(that.processChildren(parentItem, that._processDiffs(resp.Children)));
						}, function(error) {
							progress.done();
							that.handleError(error);
						});
					}
					if (this.commitName) {
						gitClient.getDiff(location, this.commitName).then(function(resp) {
							doDiff(resp.Location);
						}, function(error) {
							progress.done();
							that.handleError(error);
						});
					} else {
						doDiff(location);
					}
					return;
				}
				location = repository.StatusLocation;
				Deferred.when(repository.status || (repository.status = progressService.progress(gitClient.getGitStatus(location), messages["Getting changes"])), function(resp) {//$NON-NLS-0$
					var status = that.status = that.items = resp;
					Deferred.when(that.repository || progressService.progress(gitClient.getGitClone(status.CloneLocation), messages["Getting git repository details"]), function(resp) {
						var repository = resp.Children ? resp.Children[0] : resp;
						repository.status = status;
						progressService.progress(gitClient.getGitCloneConfig(repository.ConfigLocation), "Getting repository configuration ", repository.Name).then(function(resp) { //$NON-NLS-0$
							var config = resp.Children;
												
							status.Clone = repository;
							status.Clone.Config = [];

							for (var i = 0; i < config.length; i++) {
								if (config[i].Key === "user.name" || config[i].Key === "user.email") //$NON-NLS-1$ //$NON-NLS-0$
									status.Clone.Config.push(config[i]);
							}
							var children = that._sortBlock(that.getGroups(that.prefix));
							if (that.prefix === "all") { //$NON-NLS-0$
								if (children.length > 0) {
									children.unshift({Type: "ExplorerSelection", selectable: true}); //$NON-NLS-0$
								}
								children.unshift({Type: "CommitMsg", selectable: false}); //$NON-NLS-0$
							}
							progress.done();
							onComplete(that.processChildren(parentItem, children));
						}, function(error) {
							progress.done();
							that.handleError(error);
						});
					}, function(error) {
						progress.done();
						that.handleError(error);
					});
				}, function(error) {
					progress.done();
					that.handleError(error);
				});
			} else if (mGitUIUtil.isChange(parentItem) || parentItem.Type === "Diff") { //$NON-NLS-0$
				// lazy creation, this is required for selection  model to be able to traverse into children
				if (!parentItem.children) {
					parentItem.children = [];
					parentItem.children.push({ DiffLocation : parentItem.DiffLocation, Type : "Compare", parent : parentItem, selectable: this.prefix !== "all"}); //$NON-NLS-1$ //$NON-NLS-0$
				}
				onComplete(parentItem.children);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var prefix = this.prefix;
			if (item instanceof Array && item.length > 0 || item.Type === "Root") { //$NON-NLS-0$
				return prefix + "Root"; //$NON-NLS-0$
			} else if (mGitUIUtil.isChange(item)) {
				return  prefix + item.type + item.name; 
			} else if (item.Type === "ExplorerSelection" || item.Type === "CommitMsg") { //$NON-NLS-1$ //$NON-NLS-0$
				return prefix + item.Type;
			} else {
				return  prefix + item.type + item.DiffLocation;
			}
		},
		getModelType: function(groupItem, groupName) {
			return groupName;
		},
		_markConflict: function(conflictPattern) {
			// if git status server API response a file with "Modified"
			// ,"Added", "Changed","Missing" states , we treat it as a
			// conflicting file
			// And we add additional attribute to that groupItem :
			// groupItem.Conflicting = true;
			var baseGroup = this.getGroupData(conflictPattern[1]);
			if (!baseGroup)
				return;
			for (var i = 0; i < baseGroup.length; i++) {
				if (baseGroup[i].Conflicting)
					continue;
				var fileLocation = baseGroup[i].Location;
				var itemsInDetectGroup = [];

				for (var j = 2; j < conflictPattern.length; j++) {
					var groupName = conflictPattern[j];
					var groupData = this.getGroupData(groupName);
					if (!groupData)
						continue;
					var item = this._findSameFile(fileLocation, groupData);
					if (item) {
						itemsInDetectGroup.push(item);
					} else {
						continue;
					}
				}

				// we have the same file at "Modified" ,"Added",
				// "Changed","Missing" groups
				if (itemsInDetectGroup.length === Math.max(0, conflictPattern.length - 2)) {
					baseGroup[i].Conflicting = conflictPattern[0];
					for (var k = 0; k < itemsInDetectGroup.length; k++) {
						itemsInDetectGroup[k].Conflicting = "Hide"; //$NON-NLS-0$
					}
				}
			}
		},
		_findSameFile: function(fileLocation, groupData) {
			for (var j = 0; j < groupData.length; j++) {
				if (groupData[j].Conflicting)
					continue;
				if (fileLocation === groupData[j].Location)
					return groupData[j];
			}
			return undefined;
		},
		_sortBlock: function(interestedGroup) {
			var retValue = [];
			for (var i = 0; i < interestedGroup.length; i++) {
				var groupName = interestedGroup[i];
				var groupData = this.getGroupData(groupName);
				if (!groupData)
					continue;
				for (var j = 0; j < groupData.length; j++) {
					var renderType = this.getModelType(groupData[j], groupName);
					if (renderType) {
						retValue.push({
							name : groupData[j].Name,
							type : renderType,
							location : groupData[j].Location,
							path : groupData[j].Path,
							commitURI : groupData[j].Git.CommitLocation,
							indexURI : groupData[j].Git.IndexLocation,
							DiffLocation : groupData[j].Git.DiffLocation,
							CloneLocation : this.items.CloneLocation, //will die here
							conflicting : isConflict(renderType)
						});
					}
				}
			}
			retValue.sort(function(a, b) {
				var n1 = a.name && a.name.toLowerCase();
				var n2 = b.name && b.name.toLowerCase();
				if (n1 < n2) {
					return -1;
				}
				if (n1 > n2) {
					return 1;
				}
				return 0;
			});
			return retValue;
		},
		getGroupData: function(groupName) {
			return this.items[groupName];
		},
		isStaged: function(type) {
			for (var i = 0; i < interestedStagedGroup.length; i++) {
				if (type === interestedStagedGroup[i]) {
					return true;
				}
			}
			return false;
		},
		getClass: function(item) {
			return statusTypeMap[item.type].imageClass;
		},
		getTooltip: function(item) {
			return statusTypeMap[item.type].tooltip;
		}
	});
	
	/**
	 * @class orion.git.GitChangeListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitChangeListExplorer(options) {
		this.checkbox = options.prefix === "all"; //$NON-NLS-0$
		var renderer = new GitChangeListRenderer({
			noRowHighlighting: true,
			registry: options.serviceRegistry,
			commandService: options.commandRegistry,
			actionScopeId: options.actionScopeId,
			cachePrefix: options.prefix + "Navigator", //$NON-NLS-0$
			checkbox: this.checkbox}, this);
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.prefix = options.prefix;
		this.changes = options.changes;
		this.commit = options.commit;
		this.section = options.section;
		this.location = options.location;
		this.commitName = options.commitName;
		this.repository = options.repository;
		this.editableInComparePage = options.editableInComparePage;
		this.handleError = options.handleError;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.explorerSelectionScope = "explorerSelection";  //$NON-NLS-0$
		this.explorerSelectionStatus = "explorerSelectionStatus";  //$NON-NLS-0$
		this.createSelection();
		this.createCommands();
		if (this.prefix !== "all") { //$NON-NLS-0$
			this.updateCommands();
		}
	}
	GitChangeListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitChangeListExplorer.prototype, /** @lends orion.git.GitChangeListExplorer.prototype */ {
		changedItem: function(items) {
			this.model.repository.status = "";
			var deferred = new Deferred();
			if (this.prefix === "all") { //$NON-NLS-0$
				var parent = items[0].parent;
				var name = this.messageTextArea.value;
				var amend = this.amendCheck.checked;
				var changeId = this.changeIDCheck.checked;
				var that = this;
				parent.children = parent.Children = null;
				this.model.getChildren(parent, function(children) {
					parent.removeAll = true;
					that.myTree.refresh.bind(that.myTree)(parent, children, false);
					var selection = children.filter(function(item) {
						return that.model.isStaged(item.type);
					});
					that.selection.setSelections(selection);
					that.messageTextArea.value = name;
					that.amendCheck.checked = amend;
					that.changeIDCheck.checked = changeId;
					deferred.resolve(children);
				});
			} else {
				deferred.resolve();
			}
			return deferred;
		},
		destroy: function() {
			if (this._selectionListener) {
				this.selection.removeEventListener("selectionChanged", this._selectionListener); //$NON-NLS-0$
				this._selectionListener = null;
			}
		},
		display: function() {
			var that = this;
			var deferred = new Deferred();
			var model =  new GitChangeListModel({
				registry: this.registry,
				progress: this.progressService,
				prefix: this.prefix,
				location: this.location,
				commitName: this.commitName,
				repository: this.repository,
				handleError: this.handleError,
				changes: this.changes,
				gitClient: this.gitClient,
				progressService: this.progressService,
				section: this.section
			});
			this.createTree(this.parentId, model, {
				setFocus: false, // do not steal focus on load
				onComplete: function() {
					var model = that.model;
					if (that.prefix === "all") { //$NON-NLS-0$
						that.updateCommands();
						that.selection.setSelections(model._sortBlock(model.getGroups("staged"))); //$NON-NLS-0$
					}
					if (that.prefix === "diff") { //$NON-NLS-0$
						that.updateCommands();
					}
					that.status = model.status;
					deferred.resolve();
				}
			});
			return deferred;
		},
		isRowSelectable: function(modelItem) {
			return this.prefix === "all" ? false : mGitUIUtil.isChange(modelItem); //$NON-NLS-0$
		},
		getItemCount: function() {
			var result = 0;
			var model = this.model;
			if (model) {
				model.getRoot(function(root) {
					model.getChildren(root, function(children) {
						// -1 for the commit message item
						result = Math.max(0, children.length - (model.prefix === "all" ? 2 : 0)); //$NON-NLS-0$
					});
				});
			}
			return result;
		},
		updateCommands: function() {
			mExplorer.createExplorerCommands(this.commandService);
			var actionsNodeScope = this.section.selectionNode.id;
			var selectionNodeScope = this.section.actionsNode.id;
			
			var commandRegistry = this.commandService;
			var explorerSelectionScope = this.prefix === "all" || this.prefix === "diff" ? this.explorerSelectionScope : actionsNodeScope; //$NON-NLS-1$ //$NON-NLS-0$
			commandRegistry.registerCommandContribution(explorerSelectionScope, "orion.explorer.expandAll", 200); //$NON-NLS-0$
			commandRegistry.registerCommandContribution(explorerSelectionScope, "orion.explorer.collapseAll", 300); //$NON-NLS-0$
			
			var node;
			if (this.prefix === "staged") { //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.commitAndPushCommand", 200, "eclipse.gitCommitGroup"); //$NON-NLS-1$ //$NON-NLS-0$ 
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-0$
				commandRegistry.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-1$ //$NON-NLS-0$
			} else if (this.prefix === "unstaged") { //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.showPatchCommand", 100); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.stageCommand", 200); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.checkoutCommand", 300); //$NON-NLS-0$
				commandRegistry.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.stageCommand", 100); //$NON-NLS-1$ //$NON-NLS-0$
			}  else if (this.prefix === "all") { //$NON-NLS-0$
			
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.popStash", 100); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.applyPatch", 200); //$NON-NLS-1$ //$NON-NLS-0$

				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.showStagedPatchCommand", 100); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.checkoutStagedCommand", 200); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.precreateStashCommand", 300); //$NON-NLS-0$
				
//				commandRegistry.addCommandGroup(selectionNodeScope, "eclipse.gitCommitGroup", 1000, "Commit", null, null, null, "Commit", null, "eclipse.orion.git.precommitCommand", "primaryButton"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 	549
//				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.precommitAndPushCommand", 200, "eclipse.gitCommitGroup"); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.precommitCommand", 400); //$NON-NLS-0$

				commandRegistry.renderCommands(selectionNodeScope, selectionNodeScope, [], this, "button", {Clone : this.model.repository}); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, this.model ? this.model.repository : this, this, "tool"); //$NON-NLS-0$	
			} else if (this.prefix === "diff" && this.commit) { //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.openGitCommit", 1); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.checkoutCommit", 2); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.undoCommit", 3); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.resetIndex", 4); //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.addTag", 5); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.cherryPick", 6); //$NON-NLS-1$ //$NON-NLS-0$
				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.revert", 7); //$NON-NLS-1$ //$NON-NLS-0$
//				commandRegistry.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.askForReviewCommand", 8); //$NON-NLS-1$ //$NON-NLS-0$

				node = lib.node(actionsNodeScope);
				if (node) {
					this.commandService.destroy(node);
					commandRegistry.renderCommands(actionsNodeScope, actionsNodeScope, this.commit, this, "tool"); //$NON-NLS-0$
				}
			}
			node = lib.node(explorerSelectionScope);
			if (node) {
				this.commandService.destroy(node);
				this.commandService.renderCommands(explorerSelectionScope, explorerSelectionScope, this, this, "button"); //$NON-NLS-0$	
			}
		},
		updateSelectionStatus: function(selections) {
			var count = selections ? selections.length : 0;
			var msg = i18nUtil.formatMessage(messages[count === 1 ? "FileSelected" : "FilesSelected"], count);
			this.explorerSelectionStatus.textContent = msg;
		},
		createCommands: function(){
			if (this.prefix !== "all") { //$NON-NLS-0$
				return;
			}
			var that = this;
			var selectAllCommand = new mCommands.Command({
				tooltip : messages["Select all"],
				imageClass : "core-sprite-check", //$NON-NLS-0$
				id: "orion.explorer.selectAllCommandChangeList", //$NON-NLS-0$
				visibleWhen : function(item) {
					var result = false;
					that.model.getRoot(function(root) {
						if (root.children) {
							var selection = root.children.filter(function(item) {
								return !that.model.isStaged(item.type) && mGitUtil.isChange(item);
							});
							result = selection.length > 0;
						}
					});
					return result;
				},
				callback : function(data) {
					that.model.getRoot(function(root) {
						var selection = root.children.filter(function(item) {
							return !that.model.isStaged(item.type) && mGitUtil.isChange(item);
						});
						that.commandService.runCommand("eclipse.orion.git.stageCommand", selection, that, null, that.status); //$NON-NLS-0$
					});
				}
			});
			
			var deselectAllCommand = new mCommands.Command({
				tooltip : messages["Deselect all"],
				imageClass : "core-sprite-check_on", //$NON-NLS-0$
				id: "orion.explorer.deselectAllCommandChangeList", //$NON-NLS-0$
				visibleWhen : function(item) {
					var result = false;
					that.model.getRoot(function(root) {
						if (root.children && root.children.length > 1) {
							var selection = root.children.filter(function(item) {
								return that.model.isStaged(item.type);
							});
							result = selection.length === Math.max(0, root.children.length - 2);
						}
					});
					return result;
				},
				callback : function(data) {
					that.model.getRoot(function(root) {
						var selection = root.children.filter(function(item) {
							return that.model.isStaged(item.type);
						});
						that.commandService.runCommand("eclipse.orion.git.unstageCommand", selection, that, null, that.status); //$NON-NLS-0$
					});
				}
			});
			
			var precommitCommand = new mCommands.Command({
				name: messages['Commit'],
				tooltip: messages["CommitTooltip"],
				id: "eclipse.orion.git.precommitCommand", //$NON-NLS-0$
				extraClass: "primaryButton", //$NON-NLS-0$
				callback: function(data) {
					var name = that.messageTextArea.value.trim();
					if (!name) {
						that.messageTextArea.parentNode.classList.add("invalidCommitMessage"); //$NON-NLS-0$
						that.messageTextArea.select();
						return;
					}
					var amend = that.amendCheck.checked;
					var changeId = that.changeIDCheck.checked;
					that.commandService.runCommand("eclipse.orion.git.commitCommand", data.items, data.handler, null, {name: name, amend: amend, changeId: changeId}); //$NON-NLS-0$
				},
				visibleWhen: function(item) {
					return true;
				}
			});
			
			var precreateStashCommand = new mCommands.Command({
				name: messages["Stash"],
				tooltip: messages["Stash all current changes away"],
				id: "eclipse.orion.git.precreateStashCommand", //$NON-NLS-0$
				callback: function(data) {
					var name = that.messageTextArea.value.trim();
					that.commandService.runCommand("eclipse.orion.git.createStash", data.items, 
							data.handler, null, {name: name});
				},
				visibleWhen: function(item) {
					return true;
				}
			});
			
			var precommitAndPushCommand = new mCommands.Command({
				name: messages["CommitPush"],
				tooltip: messages["Commits and pushes files to the default remote"],
				id: "eclipse.orion.git.precommitAndPushCommand", //$NON-NLS-0$
				callback: function(data) {
					var name = that.messageTextArea.value.trim();
					if (!name) {
						that.messageTextArea.parentNode.classList.add("invalidCommitMessage"); //$NON-NLS-0$
						that.messageTextArea.select();
						return;
					}
					var amend = that.amendCheck.checked;
					var changeId = that.changeIDCheck.checked;
					data.items = {};
					data.items.Clone = data.userData.Clone;
					that.commandService.runCommand("eclipse.orion.git.commitAndPushCommand", data.items, data.handler, null, {name: name, amend: amend, changeId: changeId}); //$NON-NLS-0$
				},
				visibleWhen: function(item) {
					return true;
				}
			});

			this.commandService.addCommand(precommitCommand);
			this.commandService.addCommand(selectAllCommand);
			this.commandService.addCommand(deselectAllCommand);
			this.commandService.addCommand(precommitAndPushCommand);
			this.commandService.addCommand(precreateStashCommand);
		},
		createSelection: function(){
			if (!this.selection) {
				var section = this.section;
				var selectionTools = section.actionsNode;
				this.selection = new mSelection.Selection(this.registry, "orion.selection." + this.prefix + "Section"); //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerSelectionService(selectionTools.id, this.selection);
				var commandService = this.commandService;
				var that = this;
				this.selection.addEventListener("selectionChanged", this._selectionListener =  function(event) { //$NON-NLS-1$ //$NON-NLS-0$
					if (selectionTools) {
						commandService.destroy(selectionTools);
						commandService.renderCommands(selectionTools.id, selectionTools, event.selections, that, "button", {"Clone" : that.model.repository}); //$NON-NLS-1$ //$NON-NLS-0$
					}
					if (that.prefix === "all") { //$NON-NLS-0$
						var titleTools = section.titleActionsNode;
						if (titleTools) {
							commandService.destroy(titleTools);
						}
						commandService.renderCommands(titleTools.id, titleTools, that, that, "button"); //$NON-NLS-0$
					}
					if (that.explorerSelectionStatus) {
						that.updateSelectionStatus(event.selections);
					}
				});
				
			}
		},
		refreshSelection: function() {
			//Do nothing
		}
	});
	
	function GitChangeListRenderer(options) {
		options.cachePrefix = null; // do not persist table state
		mExplorer.SelectionRenderer.apply(this, arguments);
	}
	GitChangeListRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(GitChangeListRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			var div, td, navGridHolder, itemLabel, diffActionWrapper;
			var explorer = this.explorer;
			switch (col_no) {
				case 0:
					td = document.createElement("td"); //$NON-NLS-0$
					div = document.createElement("div"); //$NON-NLS-0$
					div.className = "sectionTableItem"; //$NON-NLS-0$
					td.appendChild(div);
					if (item.Type === "CommitMsg") { //$NON-NLS-0$
						tableRow.classList.add("gitCommitListSection"); //$NON-NLS-0$
						var outerDiv = document.createElement("div"); //$NON-NLS-0$
						outerDiv.id = "gitCommitMessage"; //$NON-NLS-0$
						outerDiv.className = "gitCommitMessage toolComposite"; //$NON-NLS-0$
						td.colSpan = 2;
						tableRow.classList.remove("selectableNavRow"); //$NON-NLS-0$
						
						var topRow = document.createElement("div"); //$NON-NLS-0$
						topRow.className = "gitCommitMessageTopRow"; //$NON-NLS-0$
						
						var textArea = explorer.messageTextArea = document.createElement("textarea"); //$NON-NLS-0$
						textArea.rows = 2;
						textArea.type = "textarea"; //$NON-NLS-0$
						textArea.id = "nameparameterCollector"; //$NON-NLS-0$
						textArea.placeholder = messages["SmartCommit"];
						textArea.classList.add("parameterInput"); //$NON-NLS-0$
						textArea.addEventListener("keyup", function() { //$NON-NLS-0$
							textArea.parentNode.classList.remove("invalidCommitMessage"); //$NON-NLS-0$
						});
						topRow.appendChild(textArea);
						
						var bottomRow = document.createElement("div"); //$NON-NLS-0$
						bottomRow.className = "gitCommitMessageBottomRow"; //$NON-NLS-0$

						var bottomRight = document.createElement("span"); //$NON-NLS-0$
						bottomRight.className = "layoutRight parameters"; //$NON-NLS-0$
						bottomRow.appendChild(bottomRight);
						
						var amendCheck = explorer.amendCheck = document.createElement("input"); //$NON-NLS-0$
						amendCheck.type = "checkbox"; //$NON-NLS-0$
						amendCheck.id = "amendparameterCollector"; //$NON-NLS-0$
						var listener = gitCommit({serviceRegistry: explorer.registry, commandService: explorer.commandService}).amendEventListener;
						amendCheck.addEventListener(listener.event, function(evt){
							return listener.handler(evt, explorer);
						}, listener.capture);
						bottomRight.appendChild(amendCheck);
						
						var amendLabel = document.createElement("label"); //$NON-NLS-0$
						amendLabel.classList.add("parameterInput"); //$NON-NLS-0$
						amendLabel.setAttribute("for", amendCheck.id); //$NON-NLS-0$
						amendLabel.textContent = messages['SmartAmend'];
						bottomRight.appendChild(amendLabel);
						
						var changeIDCheck = explorer.changeIDCheck = document.createElement("input"); //$NON-NLS-0$
						changeIDCheck.type = "checkbox"; //$NON-NLS-0$
						changeIDCheck.id = "changeIDparameterCollector"; //$NON-NLS-0$
						bottomRight.appendChild(changeIDCheck);
						
						var changeIDLabel = document.createElement("label"); //$NON-NLS-0$
						changeIDLabel.classList.add("parameterInput"); //$NON-NLS-0$
						changeIDLabel.setAttribute("for", changeIDCheck.id); //$NON-NLS-0$
						changeIDLabel.textContent = messages['SmartChangeId'];
						bottomRight.appendChild(changeIDLabel);
							
						outerDiv.appendChild(topRow);
						outerDiv.appendChild(bottomRow);
						div.appendChild(outerDiv);
					}
					else if (mGitUIUtil.isChange(item) || item.Type === "Diff") { //$NON-NLS-0$
	
						this.getExpandImage(tableRow, div);
	
						navGridHolder = explorer.getNavDict() ? explorer.getNavDict().getGridNavHolder(item, true) : null;
						diffActionWrapper = document.createElement("span"); //$NON-NLS-0$
						diffActionWrapper.id = explorer.prefix + item.name + item.type + "DiffActionWrapper"; //$NON-NLS-0$
						diffActionWrapper.className = "sectionExplorerActions"; //$NON-NLS-0$
						div.appendChild(diffActionWrapper);
				
						explorer.commandService.destroy(diffActionWrapper);
						explorer.commandService.renderCommands(
							"DefaultActionWrapper", diffActionWrapper, item, explorer, "tool", null, navGridHolder); //$NON-NLS-1$ //$NON-NLS-0$
				
						var icon = document.createElement("span"); //$NON-NLS-0$
						icon.className = explorer.model.getClass(item);
						icon.commandTooltip = new mTooltip.Tooltip({
							node: icon,
							text: explorer.model.getTooltip(item),
							position: ["above", "below", "right", "left"] //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						});
						div.appendChild(icon);
	
						itemLabel = document.createElement("span"); //$NON-NLS-0$
						itemLabel.textContent = item.name;
						div.appendChild(itemLabel);
					} else if (item.Type === "ExplorerSelection") { //$NON-NLS-0$
						td.colSpan = 2;
						
						if (explorer.prefix === "all") { //$NON-NLS-0$
							itemLabel = document.createElement("span"); //$NON-NLS-0$
							itemLabel.className = "gitChangeListSelectAll"; //$NON-NLS-0$
							itemLabel.textContent =  messages["SelectAll"];
							div.appendChild(itemLabel);
							
							var selectionLabel = explorer.explorerSelectionStatus = document.createElement("div"); //$NON-NLS-0$
							selectionLabel.className = "gitChangeListSelectionStatus"; //$NON-NLS-0$
							explorer.updateSelectionStatus();
							div.appendChild(selectionLabel);
						} else {
							var changedLabel = explorer.explorerChangedStatus = document.createElement("div"); //$NON-NLS-0$
							changedLabel.className = "gitChangeListChangedStatus"; //$NON-NLS-0$
							var changed = item.parent.children.length - 1;
							changedLabel.textContent = i18nUtil.formatMessage(messages[changed === 1 ? 'FileChanged' : "FilesChanged"], changed);
							div.appendChild(changedLabel);
						}
						
						var actionsArea = document.createElement("div"); //$NON-NLS-0$
						actionsArea.className = "layoutRight commandList"; //$NON-NLS-0$
						actionsArea.id = explorer.explorerSelectionScope;
						div.appendChild(actionsArea);
						explorer.commandService.renderCommands(actionsArea.id, actionsArea, explorer, explorer, "button"); //$NON-NLS-0$	
					} else {
						tableRow.classList.remove("selectableNavRow"); //$NON-NLS-0$
						
						// render the compare widget
						td.colSpan = 2;
						var actionsWrapper = document.createElement("div"); //$NON-NLS-0$
						actionsWrapper.className = "sectionExplorerActions"; //$NON-NLS-0$
						div.appendChild(actionsWrapper);

						diffActionWrapper = document.createElement("span"); //$NON-NLS-0$
						var prefix = explorer.prefix + item.parent.name + item.parent.type;
						diffActionWrapper.id = prefix + "DiffActionWrapperChange"; //$NON-NLS-0$
						actionsWrapper.appendChild(diffActionWrapper);

						var compareWidgetActionWrapper = document.createElement("span"); //$NON-NLS-0$
						compareWidgetActionWrapper.id = prefix + "CompareWidgetActionWrapper"; //$NON-NLS-0$
						actionsWrapper.appendChild(compareWidgetActionWrapper);
	
						var diffContainer = document.createElement("div"); //$NON-NLS-0$
						diffContainer.id = "diffArea_" + item.DiffLocation; //$NON-NLS-0$
						diffContainer.style.height = "420px"; //$NON-NLS-0$
						diffContainer.style.border = "1px solid lightgray"; //$NON-NLS-0$
						diffContainer.style.overflow = "hidden"; //$NON-NLS-0$
						div.appendChild(diffContainer);
	
						navGridHolder = this.explorer.getNavDict() ? this.explorer.getNavDict().getGridNavHolder(item, true) : null;
						var hasConflict = item.parent.type === "Conflicting"; //$NON-NLS-0$
						mGitUIUtil.createCompareWidget(
							explorer.registry,
							explorer.commandService,
							item.DiffLocation,
							hasConflict,
							diffContainer,
							compareWidgetActionWrapper.id,
							explorer.editableInComparePage ? !this.explorer.model.isStaged(item.parent.type) : false,
							{
								navGridHolder : navGridHolder,
								additionalCmdRender : function(gridHolder) {
									explorer.commandService.destroy(diffActionWrapper.id);
									explorer.commandService.renderCommands("itemLevelCommands", diffActionWrapper.id, item.parent, explorer, "tool", false, gridHolder); //$NON-NLS-1$ //$NON-NLS-0$
								},
								before : true
							}
						);
					}
					return td;
			}
		},
		onCheckedFunc: function(rowId, checked, manually, item) {
			if (item.Type === "ExplorerSelection") { //$NON-NLS-0$
				if (checked) {
					this.explorer.commandService.runCommand("orion.explorer.selectAllCommandChangeList", this.explorer, this.explorer); //$NON-NLS-0$
				} else {
					this.explorer.commandService.runCommand("orion.explorer.deselectAllCommandChangeList", this.explorer, this.explorer); //$NON-NLS-0$
				}
			} else {
				//stage or unstage
				if (checked) {
					this.explorer.commandService.runCommand("eclipse.orion.git.stageCommand", [item], this.explorer); //$NON-NLS-0$
				} else {
					this.explorer.commandService.runCommand("eclipse.orion.git.unstageCommand", [item], this.explorer); //$NON-NLS-0$
				}
			}
		}, 
		getCheckedFunc: function(item){
			if (item.Type === "ExplorerSelection") { //$NON-NLS-0$
				return !this.explorer.commandService.findCommand("orion.explorer.selectAllCommandChangeList").visibleWhen(this.explorer); //$NON-NLS-0$
			}
			
			return this.explorer.model.isStaged(item.type);
		}
	});
	
	return {
		GitChangeListExplorer: GitChangeListExplorer,
		GitChangeListRenderer: GitChangeListRenderer,
		GitChangeListModel: GitChangeListModel
	};

});
