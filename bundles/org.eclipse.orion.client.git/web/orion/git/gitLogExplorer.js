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
	'orion/git/widgets/gitCommitList',
	'orion/section',
	'orion/Deferred',
	'orion/URITemplate',
	'orion/globalCommands', 
	'orion/git/gitCommands',
	'orion/i18nUtil',
	'orion/PageUtil',
	'orion/webui/littlelib'
], function(require, messages, mGitCommitList, mSection, Deferred, URITemplate, mGlobalCommands, mGitCommands, i18nUtil, PageUtil, lib) {
var exports = {};

var repoTemplate = new URITemplate("git/git-repository.html#{,resource,params*}"); //$NON-NLS-0$
	
exports.GitLogExplorer = (function() {
	
	/**
	 * Creates a new Git log explorer.
	 * @class Git repository explorer
	 * @name orion.git.GitLogExplorer
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
	 * @param options.selection
	 * @param options.pageNavId
	 * @param options.actionScopeId
	 */
	function GitLogExplorer(options) {
		options = options || {};
		this.registry = options.registry;
		this.fileClient = options.fileClient;
		this.gitClient = options.gitClient;
		this.commandService = options.commandService;
		this.statusService = options.statusService;
		this.progressService = options.progressService;
		this.preferencesService = options.preferencesService;
		this.selection = options.selection;
		this.checkbox = options.checkbox;
		this.minimal = options.minimal;
		this.parentId = options.parentId;
		this.pageTitleId = options.pageTitleId;
		this.toolbarId = options.toolbarId;
		this.selectionToolsId = options.selectionToolsId;
		this.pageNavId = options.pageNavId;
		this.actionScopeId = options.actionScopeId;
	}
	
	GitLogExplorer.prototype.getCloneFileUri = function(){
		var fileURI;
		
		var pageParams = PageUtil.matchResourceParameters();
		var path = pageParams.resource.split("gitapi/commit/"); //$NON-NLS-0$
		if(path.length === 2){
			path = path[1].split("/"); //$NON-NLS-0$
			if(path.length > 1){
				fileURI = "";
				for(var i = 0; i < path.length - 1; i++){
					fileURI += "/" + path[i]; //$NON-NLS-0$
				}
				fileURI += "/" + path[path.length - 1].split("?")[0]; //$NON-NLS-1$ //$NON-NLS-0$
			}
		}
		return fileURI;
	};
	
	GitLogExplorer.prototype.initTitleBar = function(item){
		var deferred = new Deferred();
		var isRemote = (item.toRef && item.toRef.Type === "RemoteTrackingBranch"); //$NON-NLS-0$
		var isBranch = (item.toRef && item.toRef.Type === "Branch"); //$NON-NLS-0$
		
		//TODO we are calculating file path from the URL, it should be returned by git API
		var fileURI, branchName;
		if (isRemote || isBranch) {
			fileURI = item.ContentLocation + item.RepositoryPath;
			branchName = item.toRef.Name;
		} else {
			fileURI = this.getCloneFileUri();
		}
			
		var that = this;
		
		if(fileURI){		
			this.progressService.progress(this.fileClient.read(fileURI, true), "Getting metadata of " + fileURI).then(
				function(metadata) {
					this.isDirectory = this.commitNavigator.isDirectory = metadata.Directory;
					
					/* breadcrumb target item */
					var breadcrumbItem = {};
					
					breadcrumbItem.Parents = [];
					breadcrumbItem.Name = metadata.ETag ? i18nUtil.formatMessage(messages["Log (0) - 1"], branchName, metadata.Name) : i18nUtil.formatMessage(messages["Log (0)"], branchName);
										
					breadcrumbItem.Parents[0] = {};
					breadcrumbItem.Parents[0].Name = item.Clone.Name;
					breadcrumbItem.Parents[0].Location = item.Clone.Location;
					breadcrumbItem.Parents[0].ChildrenLocation = item.Clone.Location;
					breadcrumbItem.Parents[1] = {};
					breadcrumbItem.Parents[1].Name = messages.Repo;
					
					mGlobalCommands.setPageTarget({
						task : messages["Git Log"],
						target : item,
						breadcrumbTarget : breadcrumbItem,
						makeBreadcrumbLink : function(seg, location) {
							seg.href = require.toUrl(repoTemplate.expand({resource: location || "".Location})); //$NON-NLS-0$
						},
						serviceRegistry : that.registry,
						commandService : that.commandService
					});
					
					mGitCommands.updateNavTools(that.registry, that.commandService, that, "pageActions", "selectionTools", item); //$NON-NLS-1$ //$NON-NLS-0$
					deferred.resolve();
				}.bind(this), function(error) { 
					deferred.reject(error);
				}
			);
		} else {
			deferred.resolve();
		}
		return deferred;
	};
	
	GitLogExplorer.prototype.redisplay = function(){
		var pageParams = PageUtil.matchResourceParameters();
		this.display(pageParams.resource);
	};
	
	GitLogExplorer.prototype.changedItem = function(parent, children) {
		this.redisplay();
	};
	
	GitLogExplorer.prototype.handleError = function(error) {
		var display = {};
		display.Severity = "Error"; //$NON-NLS-0$
		display.HTML = false;
		try {
			var resp = JSON.parse(error.responseText);
			display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
		} catch (Exception) {
			display.Message = error.DetailedMessage || error.Message || error.message;
		}
		this.statusService.setProgressResult(display); //$NON-NLS-0$
	};
	
	GitLogExplorer.prototype.display = function(location){
		
		var tableNode = lib.node( 'table' ); //$NON-NLS-0$
		lib.empty(tableNode);

		var titleWrapper = new mSection.Section(tableNode, {
			id: "commitSection", //$NON-NLS-0$
			title: messages["Commits"],
			slideout: true,
			content: '<div class="mainPadding" id="logNode"></div>', //$NON-NLS-0$
			canHide: true,
			preferenceService: this.preferencesService
		}); 
		
		var explorer = this.commitNavigator = new mGitCommitList.GitCommitListExplorer({
			serviceRegistry: this.registry,
			commandRegistry: this.commandService,
			fileClient: this.fileClient,
			gitClient: this.gitClient,
			progressService: this.progressService,
			statusService: this.statusService,
			selection: this.selection,
			actionScopeId: this.actionScopeId,
			parentId: "logNode",
			location: location,
			section: titleWrapper,
			legacyLog: true,
			handleError: this.handleError,
			root: {
				Type: "CommitRoot"
			}
		});
		var that = this;
		
		explorer.display().then(function(result) {
			that.initTitleBar(result);
			mGitCommands.updateNavTools(that.registry, that.commandService, that, that.toolbarId, that.selectionToolsId, result, that.pageNavId);
		});
	};
	return GitLogExplorer;
}());

return exports;

// end of define
});
