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
			onItem(this.changes || (this.root || (this.root = {Type: "Root"})));
		},
		getGroups: function(prefix) {
			switch(prefix) {
				case "all":
					return allGroups;
				case "staged":
					return interestedStagedGroup;
				case "unstaged":
					return interestedUnstagedGroup;
			}
		},
		getChildren: function(parentItem, onComplete){	
			if (parentItem instanceof Array && parentItem.length > 0) {
				onComplete(parentItem);
			} else if (parentItem.Type === "Root") {
				var that = this;
				if (parentItem.children) {
					onComplete(parentItem.children);
					return;
				}
				var location = this.location;
				var progressService = this.progressService;
				var gitClient = this.gitClient;
				var progress = this.section.createProgressMonitor();
				progress.begin("Getting changes");
				progressService.progress(gitClient.getGitStatus(location), messages['Loading...']).then( //$NON-NLS-0$
				function(resp) {
					if (resp.Type === "Status") { //$NON-NLS-0$
						var status = that.status = that.items = resp;
						Deferred.when(that.repository || progressService.progress(gitClient.getGitClone(status.CloneLocation), "Getting repository information"), //$NON-NLS-0$
								function(resp) {
									var repository = resp.Children ? resp.Children[0] : resp;
									that.repository = repository;
									repository.status = status;
									progressService
										.progress(
											that.registry
												.getService("orion.git.provider").getGitCloneConfig(repository.ConfigLocation), "Getting repository configuration ", repository.Name).then( //$NON-NLS-0$
												function(resp) {
													var config = resp.Children;
													
													status.Clone = repository;
													status.Clone.Config = [];

													for (var i = 0; i < config.length; i++) {
														if (config[i].Key === "user.name" || config[i].Key === "user.email") //$NON-NLS-1$ //$NON-NLS-0$
															status.Clone.Config.push(config[i]);
													}
													var children = parentItem.children = that._sortBlock(that.getGroups(that.prefix));
													if (that.prefix === "all") {
														if (children.length > 0) {
															children.unshift({Type: "ExplorerSelection", selectable: true});
														}
														children.unshift({Type: "CommitMsg", selectable: false});
													}
													children.forEach(function(child) {
														child.parent = parentItem;
													});
													
													progress.done();
													onComplete(children);
												}, function(error) {
													progress.done();
													that.handleError(error);
												});
								}, function(error) {
									progress.done();
									that.handleError(error);
								});
					}
				}, function(error) {
					progress.done();
					that.handleError(error);
				});
			} else if (mGitUIUtil.isChange(parentItem) || parentItem.Type === "Diff") {
			// lazy creation, this is required for selection  model to be able to traverse into children
				if (!parentItem.children) {
					parentItem.children = [];
					parentItem.children.push({ DiffLocation : parentItem.DiffLocation, Type : "Compare", parent : parentItem, selectable: this.prefix !== "all"});//$NON-NLS-0$
				}
				onComplete(parentItem.children);
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			var prefix = this.prefix;
			if (item instanceof Array && item.length > 0 || item.Type === "Root") {
				return prefix + "Root"; //$NON-NLS-0$
			} else if (mGitUIUtil.isChange(item)) {
				return  prefix + item.type + item.name; 
			} else if (item.Type === "ExplorerSelection" || item.Type === "CommitMsg") {
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
		this.checkbox = options.prefix === "all";
		var renderer = new GitChangeListRenderer({registry: options.serviceRegistry, commandService: options.commandRegistry, actionScopeId: options.actionScopeId, cachePrefix: options.prefix + "Navigator", checkbox: this.checkbox}, this); //$NON-NLS-0
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.prefix = options.prefix;
		this.changes = options.changes;
		this.section = options.section;
		this.location = options.location;
		this.repository = options.repository;
		this.editableInComparePage = options.editableInComparePage;
		this.handleError = options.handleError;
		this.gitClient = options.gitClient;
		this.progressService = options.progressService;
		this.explorerSelectionScope = "explorerSelection";  //$NON-NLS-0$
		this.createSelection();
		this.createCommands();
		if (this.prefix !== "all") {
			this.updateCommands();
		}
	}
	GitChangeListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitChangeListExplorer.prototype, /** @lends orion.git.GitChangeListExplorer.prototype */ {
		changedItem: function(items) {
			var deferred = new Deferred();
			if (this.prefix === "all") {
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
				this.selection.removeEventListener("selectionChanged", this._selectionListener);
				this._selectionListener = null;
			}
		},
		display: function() {
			var that = this;
			var deferred = new Deferred();
			var model =  new GitChangeListModel({registry: this.registry, progress: this.progressService, prefix: this.prefix, location: this.location, repository: this.repository, handleError: this.handleError, changes: this.changes, gitClient: this.gitClient, progressService: this.progressService, section: this.section});
			this.createTree(this.parentId, model, {onComplete: function() {
				var model = that.model;
				if (that.prefix === "all") {
					that.updateCommands();
					that.selection.setSelections(model._sortBlock(model.getGroups("staged")));
				}
				that.status = model.status;
				deferred.resolve();
			}});
			return deferred;
		},
		isRowSelectable: function(modelItem) {
			return this.prefix === "all" ? false : mGitUIUtil.isChange(modelItem);
		},
		getItemCount: function() {
			var result = 0;
			var model = this.model;
			if (model) {
				model.getRoot(function(root) {
					model.getChildren(root, function(children) {
						// -1 for the commit message item
						result = Math.max(0, children.length - 2);
					});
				});
			}
			return result;
		},
		updateCommands: function() {
			mExplorer.createExplorerCommands(this.commandService);
			var actionsNodeScope = this.section.actionsNode.id;
			var selectionNodeScope = this.section.selectionNode.id;
			var explorerSelectionScope = this.explorerSelectionScope;
			this.commandService.registerCommandContribution(explorerSelectionScope, "orion.explorer.expandAll", 200); //$NON-NLS-0$
			this.commandService.registerCommandContribution(explorerSelectionScope, "orion.explorer.collapseAll", 300); //$NON-NLS-0$
			if (this.prefix === "staged") {
				//this.commandService.addCommandGroup(actionsNodeScope, "eclipse.gitCommitGroup", 1000, "Commit", null, null, null, "Commit", null, "eclipse.orion.git.commitCommand"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 	549
				//this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.commitCommand", 100, "eclipse.gitCommitGroup"); //$NON-NLS-0$ 	550
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.commitAndPushCommand", 200, "eclipse.gitCommitGroup"); //$NON-NLS-0$ 
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-0$
				this.commandService.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.unstageCommand", 100); //$NON-NLS-1$ //$NON-NLS-0$
			} else if (this.prefix === "unstaged") {
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.showPatchCommand", 100); //$NON-NLS-0$
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.stageCommand", 200); //$NON-NLS-0$
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.checkoutCommand", 300); //$NON-NLS-0$
				this.commandService.registerCommandContribution("DefaultActionWrapper", "eclipse.orion.git.stageCommand", 100); //$NON-NLS-1$ //$NON-NLS-0$
			}  else if (this.prefix === "all") {
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.showStagedPatchCommand", 100); //$NON-NLS-0$
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.checkoutStagedCommand", 200); //$NON-NLS-0$
//				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.ignoreCommand", 300); //$NON-NLS-0$
				
//				this.commandService.addCommandGroup(selectionNodeScope, "eclipse.gitCommitGroup", 1000, "Commit", null, null, null, "Commit", null, "eclipse.orion.git.precommitCommand", "primaryButton"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 	549
				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.precommitCommand", 300); //$NON-NLS-0$
//				this.commandService.registerCommandContribution(selectionNodeScope, "eclipse.orion.git.precommitAndPushCommand", 200, "eclipse.gitCommitGroup"); //$NON-NLS-0$
				
				var node = lib.node(explorerSelectionScope);
				if (node) {
					this.commandService.destroy(node);
					this.commandService.renderCommands(explorerSelectionScope, explorerSelectionScope, this, this, "button"); //$NON-NLS-0$	
				}

				this.commandService.renderCommands(selectionNodeScope, selectionNodeScope, [], this, "button", {"Clone" : this.model.repository}); //$NON-NLS-1$ //$NON-NLS-0$
			}
		
			this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, this, this, "button"); //$NON-NLS-0$	
		},
		createCommands: function(){
			if (this.prefix !== "all") {
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
						that.commandService.runCommand("eclipse.orion.git.stageCommand", selection, that, null, that.status);
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
						that.commandService.runCommand("eclipse.orion.git.unstageCommand", selection, that, null, that.status);
					});
				}
			});
			
			var precommitCommand = new mCommands.Command({
				tooltip: messages["CommitTooltip"], //$NON-NLS-0$
				id: "eclipse.orion.git.precommitCommand", //$NON-NLS-0$
				extraClass: "primaryButton", //$NON-NLS-0$
				callback: function(data) {
					var name = that.messageTextArea.value.trim();
					if (!name) {
						that.messageTextArea.parentNode.classList.add("invalidCommitMessage");
						that.messageTextArea.select();
						return;
					}
					var amend = that.amendCheck.checked;
					var changeId = that.changeIDCheck.checked;
					that.commandService.runCommand("eclipse.orion.git.commitCommand", data.items, data.handler, null, {name: name, amend: amend, changeId: changeId});
				},
				visibleWhen: function(item) {
					var items = item;
					if (!Array.isArray(items)) {
						items = [items];
					}
					precommitCommand.name =  i18nUtil.formatMessage(messages['SmartCountCommit'], items.length);
					return true;
				}
			});
			
			var precommitAndPushCommand = new mCommands.Command({
				tooltip: messages["Commits and pushes files to the default remote"],
				id: "eclipse.orion.git.precommitAndPushCommand",
				callback: function(data) {
					var name = that.messageTextArea.value.trim();
					if (!name) {
						that.messageTextArea.parentNode.classList.add("invalidCommitMessage");
						that.messageTextArea.select();
						return;
					}
					var amend = that.amendCheck.checked;
					var changeId = that.changeIDCheck.checked;
					data.items = {};
					data.items.Clone = data.userData.Clone;
					that.commandService.runCommand("eclipse.orion.git.commitAndPushCommand", data.items, data.handler, null, {name: name, amend: amend, changeId: changeId});
				},
				visibleWhen: function(item) {
					var items = item;
					if (!Array.isArray(items)) {
						items = [items];
					}
					precommitAndPushCommand.name = i18nUtil.formatMessage(messages["Commit and push ${0} file(s)"], items.length);
					return true;
				}
			});

			this.commandService.addCommand(precommitCommand);
			this.commandService.addCommand(selectAllCommand);
			this.commandService.addCommand(deselectAllCommand);
			this.commandService.addCommand(precommitAndPushCommand);
		},
		createSelection: function(){
			if (!this.selection) {
				this.selection = new mSelection.Selection(this.registry, "orion.selection." + this.prefix + "Section"); //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerSelectionService(this.section.selectionNode.id, this.selection);
				var section = this.section;
				var commandService = this.commandService;
				var that = this;
				this.selection.addEventListener("selectionChanged", this._selectionListener =  function(event) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = section.selectionNode;
					if (selectionTools) {
						commandService.destroy(selectionTools);
						commandService.renderCommands(section.selectionNode.id, selectionTools, event.selections, that, "button", {"Clone" : that.model.repository}); //$NON-NLS-1$ //$NON-NLS-0$
					}
					if (that.prefix === "all") {
						var titleTools = section.titleActionsNode;
						if (titleTools) {
							commandService.destroy(titleTools);
						}
						commandService.renderCommands(titleTools.id, titleTools, that, that, "button"); //$NON-NLS-0$
					}
				});
				
			}
		},
		refreshSelection: function() {
			//Do nothing
		}
	});
	
	function GitChangeListRenderer(options, explorer) {
		mExplorer.SelectionRenderer.apply(this, arguments);
		this.registry = options.registry;
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
					if (item.Type === "CommitMsg") {
						tableRow.classList.add("gitCommitListSection");
						var outerDiv = document.createElement("div"); //$NON-NLS-0$
						outerDiv.id = "gitCommitMessage";
						outerDiv.className = "gitCommitMessage toolComposite";
						td.colSpan = 2;
						tableRow.classList.remove("selectableNavRow");
						
						var topRow = document.createElement("div");
						topRow.className = "gitCommitMessageTopRow";
						
						var textArea = explorer.messageTextArea = document.createElement("textarea"); //$NON-NLS-0$
						textArea.rows = 2;
						textArea.type = "textarea"; //$NON-NLS-0$
						textArea.id = "nameparameterCollector";
						textArea.placeholder = messages["SmartCommit"];
						textArea.classList.add("parameterInput"); //$NON-NLS-0$
						textArea.addEventListener("keyup", function() {
							textArea.parentNode.classList.remove("invalidCommitMessage");
						});
						topRow.appendChild(textArea);
						
						var bottomRow = document.createElement("div");
						bottomRow.className = "gitCommitMessageBottomRow";

						var bottomRight = document.createElement("span");
						bottomRight.className = "layoutRight parameters";
						bottomRow.appendChild(bottomRight);
						
						var amendCheck = explorer.amendCheck = document.createElement("input"); //$NON-NLS-0$
						amendCheck.type = "checkbox"; //$NON-NLS-0$
						amendCheck.id = "amendparameterCollector";
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
						changeIDCheck.id = "changeIDparameterCollector";
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
					else if (mGitUIUtil.isChange(item) || item.Type === "Diff") {
	
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
					} else if (item.Type === "ExplorerSelection") {
						td.colSpan = 2;
						itemLabel = document.createElement("span"); //$NON-NLS-0$
						itemLabel.textContent =  messages["SelectAll"];
						div.appendChild(itemLabel);
						
						var actionsArea = document.createElement("div"); //$NON-NLS-0$
						actionsArea.className = "layoutRight commandList"; //$NON-NLS-0$
						actionsArea.id = explorer.explorerSelectionScope;
						div.appendChild(actionsArea);
						explorer.commandService.renderCommands(actionsArea.id, actionsArea, explorer, explorer, "button"); //$NON-NLS-0$	
					} else {
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
						var hasConflict = item.parent.type === "Conflicting";
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
									explorer.commandService.renderCommands(
										"itemLevelCommands", diffActionWrapper.id, item.parent, explorer, "tool", false, gridHolder); //$NON-NLS-0$
								},
								before : true
							}
						);
					}
					return td;
			}
		},
		onCheckedFunc: function(rowId, checked, manually, item) {
			if (item.Type === "ExplorerSelection") {
				if (checked) {
					this.explorer.commandService.runCommand("orion.explorer.selectAllCommandChangeList", this.explorer, this.explorer);
				} else {
					this.explorer.commandService.runCommand("orion.explorer.deselectAllCommandChangeList", this.explorer, this.explorer);
				}
			} else {
				//stage or unstage
				if (checked) {
					this.explorer.commandService.runCommand("eclipse.orion.git.stageCommand", [item], this.explorer);
				} else {
					this.explorer.commandService.runCommand("eclipse.orion.git.unstageCommand", [item], this.explorer);
				}
			}
		}, 
		getCheckedFunc: function(item){
			if (item.Type === "ExplorerSelection") {
				return !this.explorer.commandService.findCommand("orion.explorer.selectAllCommandChangeList").visibleWhen(this.explorer);
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
