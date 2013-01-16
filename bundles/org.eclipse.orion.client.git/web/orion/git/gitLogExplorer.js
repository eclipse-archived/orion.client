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

define(['i18n!git/nls/gitmessages', 'require', 'dojo', 'orion/explorers/explorer', 'orion/commands', 'orion/section', 'orion/globalCommands', 
        'orion/git/gitCommands', 'orion/explorers/navigationUtils', 'orion/git/widgets/CommitTooltipDialog', 'dojo/date/locale'], 
		function(messages, require, dojo, mExplorer, mCommands, mSection, mGlobalCommands, mGitCommands, mNavUtils) {
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
	function GitLogExplorer(serviceRegistry, fileClient, commandService, selection, options, parentId, pageTitleId, toolbarId, selectionToolsId, pageNavId, actionScopeId) {
		this.registry = serviceRegistry;
		this.fileClient = fileClient;
		this.commandService = commandService;
		this.selection = selection;
		
		this.checkbox = options !== null ? options.checkbox : true;
		this.minimal = options !== null ? options.minimal : false;
		
		this.parentId = parentId;
		this.pageTitleId = pageTitleId;
		this.toolbarId = toolbarId;
		this.selectionToolsId = selectionToolsId;
		this.pageNavId = pageNavId;
		this.actionScopeId = actionScopeId || options.actionScopeId;
		
		this.incomingCommits = [];
		this.outgoingCommits = [];
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
			
		this.registry.getService("orion.page.progress").progress(fileClient.read(location, true), "Getting git informatiob about " + location).then(dojo.hitch(this, function(metadata) {
			if (isRemote) {
				var gitService = this.registry.getService("orion.git.provider"); //$NON-NLS-0$
				if (metadata.Git) {
					this.registry.getService("orion.page.progress").progress(gitService.getDefaultRemoteBranch(metadata.Git.RemoteLocation), "Getting default branch for " + metadata.Name).then(function(defaultRemoteBranchJsonData, secondArg) {
						seg.href = require.toUrl("git/git-log.html") + "#" + defaultRemoteBranchJsonData.Location + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					});
				}
			} else {
				if (metadata.Git) {
					seg.href = require.toUrl("git/git-log.html") + "#" + metadata.Git.CommitLocation + "?page=1"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
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
			this.registry.getService("orion.page.progress").progress(this.fileClient.read(fileURI, true), "Getting metadata of " + fileURI).then(dojo.hitch(this, function(metadata) {
				this.isDirectory = metadata.Directory;
				
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
					}, serviceRegistry: that.registry, commandService: that.commandService}); 
					
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
			
			that.registry.getService("orion.page.progress").progress(that.registry.getService("orion.git.provider").getLog(remoteResource.HeadLocation, newRefEncoded), "Getting log for " + remoteResource.Name).then(function(scopedCommitsJsonData) {
				that.incomingCommits = scopedCommitsJsonData.Children;
				that.outgoingCommits = [];
				
				that.registry.getService("orion.page.progress").progress(that.registry.getService("orion.git.provider").doGitLog(remoteResource.CommitLocation + "?" + new dojo._Url(dojo.hash()).query), "Getting incomming changes for " + remoteResource.Name).then(function(jsonData) { //$NON-NLS-0$
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
				that.registry.getService("orion.page.progress").progress(that.registry.getService("orion.git.provider").getGitRemote(resource.toRef.RemoteLocation[0].Children[0].Location), "Getting log for " + resource.Name).then(
					function(remoteJsonData, secondArg) {
						that.registry.getService("orion.page.progress").progress(that.registry.getService("orion.git.provider").getLog(remoteJsonData.CommitLocation, "HEAD"), "Getting outgoing changes for " + resource.Name).then(function(scopedCommitsJsonData) { //$NON-NLS-0$
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
		this.registry.getService("orion.page.progress").progress(gitService.doGitLog(location), "Getting git log").then(
			function(resp) {
				var resource = resp;
				that.registry.getService("orion.page.progress").progress(gitService.getGitClone(resource.CloneLocation), "Getting repository details for " + resource.Name).then(
					function(resp){
						var clone = resp.Children[0];	
						resource.Clone = clone;
						resource.ContentLocation = clone.ContentLocation;
						that.registry.getService("orion.page.progress").progress(gitService.getGitBranch(clone.BranchLocation), "Getting default branch details for " + resource.Name).then(
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
						
							that.displayLog(items.Children);
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

	GitLogExplorer.prototype.displayLog = function(commits){
		
		var that = this;

		var tableNode = dojo.byId( 'table' ); //$NON-NLS-0$
		
		var contentParent = dojo.create("div", {"role": "region", "class":"sectionTable"}, tableNode, "last");
		contentParent.innerHTML = '<div id="logNode" class="mainPadding"></div>'; //$NON-NLS-0$;
		
		var LogModel = (function() {
			function LogModel() {
			}
			
			LogModel.prototype = {					
				destroy: function(){
				},
				getRoot: function(onItem){
					onItem(commits);
				},
				getChildren: function(parentItem, onComplete){	
					if (parentItem instanceof Array && parentItem.length > 0) {
						onComplete(parentItem);
					} else {
						onComplete([]);
					}
				},
				getId: function(/* item */ item){
					return item.Name;
				}
			};
			
			return LogModel;
		}());
		
		var LogRenderer = (function() {
			function LogRenderer (options, explorer) {
				this._init(options);
				this.options = options;
				this.explorer = explorer;
				this.registry = options.registry;
			}
			
			LogRenderer.prototype = new mExplorer.SelectionRenderer();

			LogRenderer.prototype.getCellElement = function(col_no, item, tableRow){
				var commit = item;
				
				switch(col_no){
				case 0:		
					var td = document.createElement("td"); //$NON-NLS-0$
					
					var extensionListItem = dojo.create( "div", { "class":"sectionTableItem" }, td ); //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					var horizontalBox = dojo.create( "div", null, extensionListItem ); //$NON-NLS-0$
					
					var incomingCommit = false;
					dojo.forEach(that.incomingCommits, function(comm, i){
						if (commit.Name === comm.Name){
							incomingCommit = true;
						}
					});
						
					var outgoingCommit = false;
					dojo.forEach(that.outgoingCommits, function(comm, i){
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
						var authorImage = dojo.create("span", {"style" : "float:left"}, horizontalBox); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						
						var image = new Image();
						image.src = commit.AuthorImage;
						image.name = commit.AuthorName;
						image.className = "git-author-icon";
						dojo.place(image, authorImage, "first"); //$NON-NLS-0$
					}
					
					var detailsView = dojo.create( "div", { "class":"stretch"}, horizontalBox ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					
					var titleLink = dojo.create("a", {"class": "gitMainDescription navlinkonpage", href: "/git/git-commit.html#" + commit.Location + "?page=1&pageSize=1"}, detailsView); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					dojo.place(document.createTextNode(commit.Message), titleLink);
					//Add the commit page link as the first grid of the row
					mNavUtils.addNavGrid(this.explorer.getNavDict(), item, titleLink);
					
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
					var description = dojo.create( "span", { "class":"gitSecondaryDescription"  //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						}, detailsView ); //$NON-NLS-1$ //$NON-NLS-0$
					description.textContent = messages[" (SHA "] + commit.Name + messages[") by "] + commit.AuthorName  + " on " + dojo.date.locale.format(new Date(commit.Time), {formatLength: "short"});
					
					return td;
					
					break;
				case 1:
					var actionsColumn = this.getActionsColumn(item, tableRow, null, null, true);
					dojo.style(actionsColumn, "padding-left", "5px"); //$NON-NLS-1$ //$NON-NLS-0$
					dojo.style(actionsColumn, "padding-right", "5px"); //$NON-NLS-1$ //$NON-NLS-0$
					return actionsColumn;
					break;
				}
			};
			
			return LogRenderer;
		}());
		
		var LogNavigator = (function() {
			function LogNavigator(registry, selection, parentId, actionScopeId) {
				this.registry = registry;
				this.checkbox = false;
				this.parentId = parentId;
				this.selection = selection;
				this.actionScopeId = actionScopeId;
				this.renderer = new LogRenderer({registry: this.registry, actionScopeId: this.actionScopeId, cachePrefix: "LogNavigator", checkbox: false}, this); //$NON-NLS-0$
				this.createTree(this.parentId, new LogModel());
			}
			
			LogNavigator.prototype = new mExplorer.Explorer();
		
			//provide to the selection model that if a row is selectable
			LogNavigator.prototype.isRowSelectable = function(modelItem){
				return true;
			};
			//provide to the expandAll/collapseAll commands
			LogNavigator.prototype.getItemCount  = function(){
				return false;
			};
			return LogNavigator;
		}());
		
		var logNavigator = new LogNavigator(this.registry, this.selection, "logNode", this.actionScopeId); //$NON-NLS-0$
	};

	return GitLogExplorer;
}());

return exports;

// end of define
});
