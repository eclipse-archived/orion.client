/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define dijit console document Image */

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/commands', 'orion/fileClient', 'orion/section', 'orion/dynamicContent', 'orion/git/widgets/FilterSearchBox', 'orion/util', 'orion/PageUtil', 'orion/globalCommands', 'orion/git/gitCommands',
'orion/selection', 'orion/git/gitClient', 'orion/searchClient', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, require, dojo, mCommands, mFileClient, mSection, mDynamicContent, mFilterSearchBox, mUtil, PageUtil, mGlobalCommands, mGitCommands, mSelection, mGitClient, mSearchClient) {
var exports = {};

exports.GitLogExplorer = (function() {
	
	/**
	 * Creates a new Git log explorer.
	 * @class Git repository explorer
	 * @name orion.git.GitLogExplorer
	 * @param registry
	 * @param commandService
	 * @param linkService
	 * @param selection
	 * @param parentId
	 * @param actionScopeId
	 */
	function GitLogExplorer(serviceRegistry, selection, options, parentId, pageTitleId, toolbarId, selectionToolsId, pageNavId, actionScopeId) {
		this.registry = serviceRegistry;
		this.selection = selection;
		this.checkbox = options !== null ? options.checkbox : true;
		this.minimal = options !== null ? options.minimal : false;
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.pageNavId = pageNavId;
		this.selectionToolsId = selectionToolsId;
		this.actionScopeId = actionScopeId || options.actionScopeId;
		this.fileClient = new mFileClient.FileClient(serviceRegistry);
		
		this.incomingCommits = [];
		this.outgoingCommits = [];
		
		var selection = new mSelection.Selection(serviceRegistry);
		this.commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry, selection: selection});
		
		// Git operations
		var that = this;
		var gitClient = new mGitClient.GitService(serviceRegistry);
		var fileClient = new mFileClient.FileClient(serviceRegistry);
		this.searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, fileService: fileClient, commandService: that.commandService});
	}
	
	GitLogExplorer.prototype.getCloneFileUri = function(){
		var fileURI;
		var path = dojo.hash().split("gitapi/commit/"); //$NON-NLS-0$
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
		
	GitLogExplorer.prototype.getHeadFileUri = function(){
		var fileURI;
		var path = dojo.hash().split("gitapi/commit/"); //$NON-NLS-0$
		if(path.length === 2){
			path = path[1].split("/"); //$NON-NLS-0$
			if(path.length > 1){
				fileURI="";
				for(var i=1; i<path.length-1; i++){
					//first segment is a branch name
					fileURI+= "/" + path[i]; //$NON-NLS-0$
				}
				fileURI+="/" + path[path.length-1].split("?")[0]; //$NON-NLS-1$ //$NON-NLS-0$
			}
		}
		return fileURI;
	};
		
	
	GitLogExplorer.prototype.makeHref = function(fileClient, seg, location, isRemote) {
		if (!location) {
			return;
		}
			
		fileClient.read(location, true).then(dojo.hitch(this, function(metadata) {
			if (isRemote) {
				var gitService = this.registry.getService("orion.git.provider"); //$NON-NLS-0$
				if (metadata.Git) {
					gitService.getDefaultRemoteBranch(metadata.Git.RemoteLocation).then(function(defaultRemoteBranchJsonData, secondArg) {
						seg.href = require.toUrl("git/git-log2.html") + "#" + defaultRemoteBranchJsonData.Location + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					});
				}
			} else {
				if (metadata.Git) {
					seg.href = require.toUrl("git/git-log2.html") + "#" + metadata.Git.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
		}), dojo.hitch(this, function(error) {
			console.error("Error loading file metadata: " + error.message); //$NON-NLS-0$
		}));
	};
	
	GitLogExplorer.prototype.initTitleBar = function(item){
		var deferred = new dojo.Deferred();
		var isRemote = (item.toRef && item.toRef.Type === "RemoteTrackingBranch"); //$NON-NLS-0$
		var isBranch = (item.toRef && item.toRef.Type === "Branch"); //$NON-NLS-0$
		
		//TODO we are calculating file path from the URL, it should be returned by git API
		var fileURI, branchName;
		if (isRemote || isBranch) {
			fileURI = this.getHeadFileUri();
			branchName = item.toRef.Name;
		} else { fileURI = this.getCloneFileUri(); }	
			
		var that = this;
		
		if(fileURI){		
			this.fileClient.read(fileURI, true).then(dojo.hitch(this, function(metadata) {
				var title = branchName ? branchName + " on " + metadata.Name + " - Git Log" : metadata.Name + " - " + "Git Log";
				var breadcrumbRootName;
				var branchIdentifier = branchName ? " (" + branchName + ") " : "";
		
				// adjust top name of breadcrumb segment
				if (metadata.Parents && metadata.Parents.length > 0) {
					var rootParent = metadata.Parents[metadata.Parents.length - 1];
					breadcrumbRootName = "Log" + branchIdentifier + rootParent.Name;
				} else {
					breadcrumbRootName = "Log" + branchIdentifier + metadata.Name;
				}
				
				mGlobalCommands.setPageTarget({task: "Git Log", title: title, target: item, breadcrumbTarget: metadata, breadcrumbRootName: breadcrumbRootName,
					makeBreadcrumbLink: function(seg, location) {
						that.makeHref(that.fileClient, seg, location, isRemote);
					}, serviceRegistry: that.registry, commandService: that.commandService, searchService: that.searcher}); 
					
					mGitCommands.updateNavTools(that.registry, that, "pageActions", "selectionTools", item); //$NON-NLS-1$ //$NON-NLS-0$
					deferred.callback();
				}), dojo.hitch(this, function(error) { deferred.errback(error);}));
			} else {
				deferred.callback();
			}
			return deferred;
	};
	
	GitLogExplorer.prototype.redisplay = function(){
		this.display(dojo.hash());
	};
	
	GitLogExplorer.prototype.changedItem = function(parent, children) {
		this.redisplay();
	};
	
	GitLogExplorer.prototype.renderCommit = function(commit, i){
		var extensionListItem = dojo.create( "div", { "class":"sectionTableItem " + ((i % 2) ? "darkTreeTableRow" : "lightTreeTableRow") }, dojo.byId("logNode") ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
		
		var incomingCommit = false;
		dojo.forEach(this.incomingCommits, function(comm, i){
			if (commit.Name === comm.Name){
				incomingCommit = true;
			}
		});
			
		var outgoingCommit = false;
		dojo.forEach(this.outgoingCommits, function(comm, i){
			if (commit.Name === comm.Name){
				outgoingCommit = true;
			}
		});
		
		if(!incomingCommit && !outgoingCommit){
			dojo.create( "span", null, horizontalBox );
		} else {
			var imgSpriteName = (outgoingCommit ? "git-sprite-outgoing_commit" : "git-sprite-incoming_commit");
			dojo.create( "span", { "class":"sectionIcon gitImageSprite " + imgSpriteName}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		}
		
		if (commit.AuthorImage) {
			var authorImage = dojo.create("span", {"class":"git-author-icon"}, horizontalBox); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var image = new Image();
			image.src = commit.AuthorImage;
			image.name = commit.AuthorName;
			image.width = 30;
			image.height = 30;
			dojo.place(image, authorImage, "first"); //$NON-NLS-0$
		}
		
		var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		
		var titleLink = dojo.create("a", {"class": "gitMainDescription navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, detailsView); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		dojo.place(document.createTextNode(commit.Message), titleLink);		
		
		var _timer;
		
		var tooltipDialog = new orion.git.widgets.CommitTooltipDialog({
		    commit: commit,
		    onMouseLeave: function(){
		    	if(dijit.popup.hide)
					dijit.popup.hide(tooltipDialog); //close doesn't work on FF
				dijit.popup.close(tooltipDialog);
            },
            onMouseEnter: function(){
		    	clearTimeout(_timer);
            }
		});
		
		dojo.connect(titleLink, "onmouseover", titleLink, function() { //$NON-NLS-0$
			clearTimeout(_timer);
			
			_timer = setTimeout(function(){
				dijit.popup.open({
					popup: tooltipDialog,
					around: titleLink,
					orient: {'BR':'TL', 'TR':'BL'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				});
			}, 600);
		});
		
		dojo.connect(titleLink, "onmouseout", titleLink, function() { //$NON-NLS-0$
			clearTimeout(_timer);
			
			_timer = setTimeout(function(){
				if(dijit.popup.hide)
					dijit.popup.hide(tooltipDialog); //close doesn't work on FF
				dijit.popup.close(tooltipDialog);
			}, 200);
		});
		
		dojo.create( "div", null, detailsView ); //$NON-NLS-0$
		var description = dojo.create( "span", { "class":"gitSecondaryDescription",  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			innerHTML: messages[" (SHA "] + commit.Name + messages[") by "] + commit.AuthorName 
			+ " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"})}, detailsView ); //$NON-NLS-1$ //$NON-NLS-0$
					
		var actionsArea = dojo.create( "div", {"id":"branchActionsArea", "class":"sectionTableItemActions" }, horizontalBox ); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		this.registry.getService("orion.page.command").renderCommands(this.actionScopeId, actionsArea, commit, this, "tool");	 //$NON-NLS-0$
	};
	
	GitLogExplorer.prototype.renderLog = function(commits){
		var tableNode = dojo.byId('table');	 //$NON-NLS-0$
		dojo.empty(tableNode);
		
		var contentParent = dojo.create("div", {"role": "region", "class":"sectionTable"}, tableNode, "last");
		contentParent.innerHTML = '<list id="logNode" class="mainPadding"></list>'; //$NON-NLS-0$
		
		for(var i=0; i<commits.length; ++i){
			this.renderCommit(commits[i], i);
		}
	};
	
	GitLogExplorer.prototype.getOutgoingIncomingChanges = function(resource){
		var that = this;
		var d = new dojo.Deferred();
		
		var progressService = this.registry.getService("orion.page.message");
		progressService.showWhile(d, messages["Getting git incoming changes..."]);
	
		var processRemoteTrackingBranch = function(remoteResource) {
			var newRefEncoded = encodeURIComponent(remoteResource.FullName);
			
			// update page navigation
			if (that.toolbarId && that.selectionToolsId){
				mGitCommands.updateNavTools(that.registry, that, that.toolbarId, that.selectionToolsId, remoteResource, that.pageNavId);
			}
			
			that.registry.getService("orion.git.provider").getLog(remoteResource.HeadLocation, newRefEncoded).then(function(scopedCommitsJsonData) {
				that.incomingCommits = scopedCommitsJsonData.Children;
				that.outgoingCommits = [];
				
				that.registry.getService("orion.git.provider").doGitLog(remoteResource.CommitLocation + "?" + new dojo._Url(dojo.hash()).query).then(function(jsonData) { //$NON-NLS-0$
					remoteResource.Children = jsonData.Children;
					if(jsonData.NextLocation){
						remoteResource.NextLocation = remoteResource.Location + "?" + new dojo._Url(jsonData.NextLocation).query; //$NON-NLS-0$
					}
					
					if(jsonData.PreviousLocation ){
						remoteResource.PreviousLocation  = remoteResource.Location + "?" + new dojo._Url(jsonData.PreviousLocation).query; //$NON-NLS-0$
					}
					
					d.callback(remoteResource);
				});
			});
		};
											
		if (resource.Type === "RemoteTrackingBranch"){ //$NON-NLS-0$
			processRemoteTrackingBranch(resource);
		} else if (resource.Type === "Commit" && resource.toRef.Type === "RemoteTrackingBranch"){ //$NON-NLS-1$ //$NON-NLS-0$
			processRemoteTrackingBranch(resource.toRef);
		} else if (resource.toRef){
			if (resource.toRef.RemoteLocation && resource.toRef.RemoteLocation.length===1 && resource.toRef.RemoteLocation[0].Children && resource.toRef.RemoteLocation[0].Children.length===1){
				that.registry.getService("orion.git.provider").getGitRemote(resource.toRef.RemoteLocation[0].Children[0].Location).then(
					function(remoteJsonData, secondArg) {
						that.registry.getService("orion.git.provider").getLog(remoteJsonData.CommitLocation, "HEAD").then(function(scopedCommitsJsonData) { //$NON-NLS-0$
							that.incomingCommits = [];
							that.outgoingCommits = scopedCommitsJsonData.Children;
							d.callback(resource);
						});
					}
				);
			} else {
				d.callback(resource);
			}
		} else {
			d.callback(resource);
		}
		
		return d;
	};
	
	GitLogExplorer.prototype.handleError = function(error) {
		var display = {};
		display.Severity = "Error"; //$NON-NLS-0$
		display.HTML = false;
		try {
			var resp = JSON.parse(error.responseText);
			display.Message = resp.DetailedMessage ? resp.DetailedMessage : resp.Message;
		} catch (Exception) {
			display.Message = error.message;
		}
		this.registry.getService("orion.page.message").setProgressResult(display); //$NON-NLS-0$
	};
	
	GitLogExplorer.prototype.loadResource = function(location){
		var loadingDeferred = new dojo.Deferred();
		var progressService = this.registry.getService("orion.page.message");
		progressService.showWhile(loadingDeferred, messages['Loading git log...']);
		
		var that = this;
		var gitService = this.registry.getService("orion.git.provider"); //$NON-NLS-0$
		gitService.doGitLog(location).then(
			function(resp) {
				var resource = resp;
				gitService.getGitClone(resource.CloneLocation).then(
					function(resp){
						var clone = resp.Children[0];	
						resource.Clone = clone;
						resource.ContentLocation = clone.ContentLocation;
						gitService.getGitBranch(clone.BranchLocation).then(
							function(branches){
								dojo.forEach(branches.Children, function(branch, i) {
									if (branch.Current === true){
										resource.Clone.ActiveBranch = branch.CommitLocation;
										loadingDeferred.callback(resource);
									}
								});
							}
						);
					}
				);
			}
		);
		
		return loadingDeferred;
	};
	
	GitLogExplorer.prototype.display = function(location){
		var that = this;
		var progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
		
		var loadingDeferred = new dojo.Deferred();
		progressService.showWhile(loadingDeferred, messages['Loading...']);
		
		that.loadResource(location).then(
			function(resp){
				var resource = resp;
				loadingDeferred.callback();
				that.initTitleBar(resource).then(
					function(){
						that.getOutgoingIncomingChanges(resource).then(function(items){
							// update page navigation
							if (that.toolbarId && that.selectionToolsId){
								mGitCommands.updateNavTools(that.registry, that, that.toolbarId, that.selectionToolsId, items, that.pageNavId);
							}
						
							that.renderLog(items.Children);
						});
					}
				);
			},
			function(err){
				loadingDeferred.callback();
				that.handleError(err);
			}
		);
	};
	
	return GitLogExplorer;
}());

return exports;

// end of define
});
