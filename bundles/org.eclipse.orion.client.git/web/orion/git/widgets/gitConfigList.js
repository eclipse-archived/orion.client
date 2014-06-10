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

/*global define document*/

define([
	'i18n!git/nls/gitmessages',
	'orion/explorers/explorer',
	'orion/i18nUtil',
	'orion/URITemplate',
	'orion/objects'
], function(messages, mExplorer, i18nUtil, URITemplate, objects) {

	var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$		
		
	function GitConfigListModel(options) {
		this.root = options.root;
		this.registry = options.registry;
		this.handleError = options.handleError;
		this.section = options.section;
		this.progressService = options.progressService;
		this.gitClient = options.gitClient;
	}
	GitConfigListModel.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitConfigListModel.prototype, /** @lends orion.git.GitConfigListModel.prototype */ {
		destroy: function(){
		},
		getRoot: function(onItem){
			onItem(this.root);
		},
		getChildren: function(parentItem, onComplete){	
			var that = this;
			var progress;
			if (parentItem.Type === "ConfigRoot") { //$NON-NLS-0$
				progress = this.section.createProgressMonitor();
				var msg = i18nUtil.formatMessage(messages['Getting configuration of'], parentItem.repository.Name);
				progress.begin(msg);
				this.progressService.progress(this.gitClient.getGitCloneConfig(parentItem.repository.ConfigLocation), msg).then( function(resp){
					progress.worked("Rendering configuration"); //$NON-NLS-0$
					var configurationEntries = resp.Children;
					
					if (configurationEntries.length === 0){
						that.section.setTitle("No Configuration"); //$NON-NLS-0$
					}
					
					var filteredConfig = [];
					for(var i=0; i<configurationEntries.length ;i++){
						if (parentItem.mode === "full" || configurationEntries[i].Key.indexOf("user.") !== -1) //$NON-NLS-1$ //$NON-NLS-0$
							filteredConfig.push(configurationEntries[i]);
					}
					progress.done();
					onComplete(filteredConfig);
				}, function(error){
					progress.done();
					that.handleError(error);
				});
			} else {
				onComplete([]);
			}
		},
		getId: function(/* item */ item){
			if (item.Type === "ConfigRoot") { //$NON-NLS-0$
				return "ConfigRoot"; //$NON-NLS-0$
			} else {
				return item.Name;
			}
		}
	});
	
	/**
	 * @class orion.git.GitConfigListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitConfigListExplorer(options) {
		var renderer = new GitConfigListRenderer({registry: options.serviceRegistry, commandService: options.commandRegistry, actionScopeId: options.actionScopeId, cachePrefix: options.prefix + "Navigator", checkbox: false}, this); //$NON-NLS-0$
		mExplorer.Explorer.call(this, options.serviceRegistry, options.selection, renderer, options.commandRegistry);	
		this.checkbox = false;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.root = options.root;
		this.section = options.section;
		this.handleError = options.handleError;
		this.progressService = options.progressService;
		this.gitClient = options.gitClient;
	}
	GitConfigListExplorer.prototype = Object.create(mExplorer.Explorer.prototype);
	objects.mixin(GitConfigListExplorer.prototype, /** @lends orion.git.GitConfigListExplorer.prototype */ {
		display: function() {
			this.createTree(this.parentId, new GitConfigListModel({root: this.root, registry: this.registry, progressService: this.progressService, gitClient: this.gitClient, section: this.section, handleError: this.handleError}));
			this.updateCommands();
		},
		isRowSelectable: function(modelItem) {
			return false;
		},
		updateCommands: function() {
			var root = this.root;
			var section = this.section;
			var actionsNodeScope = section.actionsNode.id;
			if (root.mode !== "full"/* && configurationEntries.length !== 0*/){ //$NON-NLS-0$
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.repositories.viewAllCommand", 10); //$NON-NLS-0$
				this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, {"ViewAllLink":repoTemplate.expand({resource: root.repository.ConfigLocation}), "ViewAllLabel":messages['View All'], "ViewAllTooltip":messages["View all configuration entries"]}, this, "button"); //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		
			if (root.mode === "full"){ //$NON-NLS-0$
				this.commandService.registerCommandContribution(actionsNodeScope, "eclipse.orion.git.addConfigEntryCommand", 1000); //$NON-NLS-0$
				this.commandService.renderCommands(actionsNodeScope, actionsNodeScope, root.repository, this, "button"); //$NON-NLS-0$
			}
		}
	});
	
	function GitConfigListRenderer() {
		mExplorer.SelectionRenderer.apply(this, arguments);
	}
	GitConfigListRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(GitConfigListRenderer.prototype, {
		getCellElement: function(col_no, item, tableRow){
			if (col_no > 2) return null;
			var div, td;
			td = document.createElement("td"); //$NON-NLS-0$
			div = document.createElement("div"); //$NON-NLS-0$
			div.style.overflow = "hidden"; //$NON-NLS-0$
//			div.className = "sectionTableItem"; //$NON-NLS-0$
			td.appendChild(div);
			switch (col_no) {
				case 0:
					var keySpan = document.createElement("span"); //$NON-NLS-0$
					keySpan.textContent = item.Key;
					div.appendChild(keySpan);
					break;
				case 1:
					var valueSpan = document.createElement("span"); //$NON-NLS-0$
					valueSpan.textContent = item.Value;
					div.appendChild(valueSpan);
					break;
				case 2:
					var actionsArea = document.createElement("ul"); //$NON-NLS-0$
					actionsArea.className = "sectionTableItemActions layoutRight commandList"; //$NON-NLS-0$
					actionsArea.id = "configActionsArea"; //$NON-NLS-0$
					div.appendChild(actionsArea);
					this.commandService.renderCommands(this.actionScopeId, actionsArea, item, this.explorer, "tool"); //$NON-NLS-0$
					break;
			}
			return td;
		}
	});
	
	return {
		GitConfigListExplorer: GitConfigListExplorer,
		GitConfigListRenderer: GitConfigListRenderer
	};

});