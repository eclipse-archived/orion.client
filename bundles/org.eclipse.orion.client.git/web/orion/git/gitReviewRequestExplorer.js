/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console document orion Image*/
/*global dojo eclipse:true widgets*/
/*jslint regexp:false browser:true forin:true*/

define(['i18n!git/nls/gitmessages', 'require', 'dojo','dijit', 'orion/section', 'orion/i18nUtil', 'orion/globalCommands', 'orion/compare/diff-provider', 
        'orion/compare/compare-container' ,'orion/git/gitCommands','dijit/TooltipDialog', 'orion/git/widgets/CommitTooltipDialog'], 
		function(messages, require, dojo, dijit , mSection, i18nUtil, mGlobalCommands, mDiffProvider , mCompareContainer, mGitCommands) {
	var exports = {};

	exports.GitReviewRequestExplorer = (function() {

		/**
		 * Creates a new Git Review Request explorer.
		 * @class Git Review Request explorer
		 * @name orion.git.GitReviewRequestExplorer
		 * @param fileClient
		 * @param commandService
		 * @param serviceRegistry
		 * @param gitClient
		 */
		function GitReviewRequestExplorer(fileClient, commandService, serviceRegistry, gitClient){
			this.fileClient = fileClient;
			this.registry = serviceRegistry;
			this.gitClient = gitClient;
			this.commandService = commandService;
		}
		
		GitReviewRequestExplorer.prototype.changedItem = function(parent, children) {
			this.redisplay();
		};
		
		GitReviewRequestExplorer.prototype.redisplay = function(){
			this.display(dojo.hash());
		};
		
		GitReviewRequestExplorer.prototype.display = function(remote_sha){
			this.progressService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			this.loadingDeferred = new dojo.Deferred();
			this.progressService.showWhile(this.loadingDeferred, messages["Loading Contribution Review Request..."]); //$NON-NLS-0$
			var that = this;
			var params = [];
			var n = remote_sha.lastIndexOf("_");
			var url = remote_sha.substring(0,n);
			params[1] = remote_sha.substring(n+1);
			params[0] = this.sshCheck(url);
			var redundant = params[0].split(".");
			var index = redundant.length - 1;
			if(redundant[index] === "git"){
				var m = params[0].lastIndexOf(".");
				params[2] = params[0].substring(0,m);
			}
			else{
				params[2] = params[0] + ".git";
			}
			this.url = params[2];
			this.initTitleBar(params[1], params[0]);

			dojo.empty(dojo.byId("welcomeDiv"));
			dojo.empty(dojo.byId("cloneDiv"));
			dojo.empty(dojo.byId("commitDiv"));
			dojo.empty(dojo.byId("fetchDiv"));
			dojo.empty(dojo.byId("remoteDiv"));
			
			this.fileClient.loadWorkspace().then(
				function(workspace){
					that.defaultPath = workspace.ChildrenLocation;
					that.commandService.registerCommandContribution("fetch", "eclipse.orion.git.fetch", 200);
					that.commandService.registerCommandContribution("fetch", "eclipse.orion.git.fetchForce", 250);
					that.commandService.registerCommandContribution("add", "eclipse.addRemoteReviewRequestCommand", 300);
					var tableNode = dojo.byId("cloneDiv");
					dojo.create("div", {"class" : "stretch", id : "descriptionHeader", style: "width: 500px, height: 100px" }, dojo.byId("welcomeDiv"));
					dojo.create("div", {style: "padding-top: 30px" }, dojo.byId("welcomeDiv"));
					var titleWrapper1 = new mSection.Section(dojo.byId("commitDiv"), {
						id: "open commit from existing repository", //$NON-NLS-0$
						title: messages["The commit can be found in the following repositories"], //$NON-NLS-0$
						slideout: true,
						canHide: true,
						preferenceService: that.registry.getService("orion.core.preference"),
						content: '<div id="commitNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					
					var titleWrapper2 = new mSection.Section(dojo.byId("fetchDiv"), {
						id: "fetch section", //$NON-NLS-0$
						title: messages["Try to update your repositories"], //$NON-NLS-0$
						slideout: true,
						canHide: true,
						preferenceService: that.registry.getService("orion.core.preference"),
						content: '<div id="fetchNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					
					var titleWrapper3 = new mSection.Section(tableNode, {
						id: "create new clone", //$NON-NLS-0$
						title: messages["Create new repository"], //$NON-NLS-0$
						content: '<div id="cloneNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					
					var titleWrapper4 = new mSection.Section(dojo.byId("remoteDiv"), {
						id: "add", //$NON-NLS-0$
						title: messages["Attach the remote to one of your existing repositories"], //$NON-NLS-0$
						slideout: true,
						canHide: true,
						hidden: true,
						content: '<div id="remoteNode" class="mainPadding"></list>' //$NON-NLS-0$
					});
					
					dojo.byId("commitDiv").style.display = " none ";
					dojo.byId("fetchDiv").style.display = " none ";
					dojo.byId("remoteDiv").style.display = " none ";
					dojo.byId("moreOptionsDiv").style.display = " none ";
					
					var text = dojo.string.substitute(messages["You are reviewing contribution ${0} from ${1}"], [params[1], params[2]]);
					var text2 = messages["Unfortunately the commit can not be found in your workspace. To see it try one of the following: "];
					dojo.byId("moreOptionsDiv").textContent = messages["To review the commit you can also:"];
					var description = dojo.create("span", {"class" : "gitSecondaryDescription", "style" : "padding : 5px, display: block", "id": "welcome"}, dojo.byId("descriptionHeader"));
					description.textContent = text;
					var description2 = dojo.create("span", {"class" : "gitSecondaryDescription", "style" : "display: block", "id" : "instruction"}, dojo.byId("descriptionHeader"));
					description2.textContent = text2;
					that.renderCloneSection(params);
					
					var repositories = [];
					for(var i=0; i<workspace.Children.length; i++){
						if(workspace.Children[i].Git){
							repositories.push(workspace.Children[i]);
						}
					}
					
					if(repositories.length === 0){
						dojo.byId("instruction").style.display = " block ";
						return;
					}
					that.renderSections(repositories, params[0], params[2], params[1]);
				}
				
			);
		};
		
		GitReviewRequestExplorer.prototype.renderCloneSection = function(params){
			var that = this;
			that.progressService.setProgressMessage("");
			that.commandService.registerCommandContribution("clone", "eclipse.cloneGitRepositoryReviewReq", 200);
			that.commandService.renderCommands("clone", dojo.byId("cloneNode"), "clone", that, "button", params[0]);
			var mainDescription = dojo.create("span", { style: "padding: 0px; text-align: left;", "class": "gitMainDescription" },  dojo.byId("cloneNode"));
			mainDescription.textContent = " using " + params[0];
		};
		
		GitReviewRequestExplorer.prototype.renderSections = function(repositories, url1, url2, sha){
			var that = this;

			var findCommitLocation = function (repositories, commitName, deferred, that) {
				if (deferred === null)
					deferred = new dojo.Deferred();
				if (repositories.length > 0) {
					that.registry.getService("orion.git.provider").doGitLog( //$NON-NLS-0$
						"/gitapi/commit/" + sha + repositories[0].Location + "?page=1&pageSize=1", null, null, messages['Looking for the commit']).then( //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						function(resp){
							that.currentCommit = resp;
							deferred.callback(resp.Children[0].Location);
						},
						function(error) {
							deferred.errback();
						}
					);
				} else {
					deferred.errback();
				}
				
				return deferred;
			};
			if (repositories.length > 0) {
				repositories[0].Content = {};
				var path = "root / "; //$NON-NLS-0$
				if (repositories[0].Parents !== null && repositories[0].Parents !== undefined){
					for (var i=repositories[0].Parents.length; i>0; i--){
						path += repositories[0].Parents[i-1].Name + " / "; //$NON-NLS-0$
					}
				}
				path += repositories[0].Name;
				repositories[0].Content.Path = path;
				
				that.registry.getService("orion.git.provider").getGitClone(repositories[0].Git.CloneLocation).then(
					function(resp){
						resp.Children[0].Id = repositories[0].Id;
						that.registry.getService("orion.git.provider").getGitRemote("/gitapi/remote" + repositories[0].Location).then(
							function(remotes){
								var foundRemote = false;
								for(var i=0;i<remotes.Children.length;i++){
									var url = that.sshCheck(remotes.Children[i].GitUrl);
									if(url === url1 || url === url2){
										foundRemote = true;
									}
								}
								if(foundRemote){
									findCommitLocation(repositories, sha, null, that).then(	
										function(commitLocation){
											var _timer;
											var commitPageURL = "/git/git-commit.html#" + commitLocation + "?page=1&pageSize=1";
											var repoURL = "/git/git-repository.html#" + resp.Children[0].Location;
											dojo.create("div", {id : resp.Children[0].Id + "tableitem" , "class": "sectionTableItem lightTreeTableRow"},  dojo.byId("commitNode"));
											dojo.create("div", {id : resp.Children[0].Id + "div" , "class": "stretch"},  dojo.byId(resp.Children[0].Id + "tableitem"));
											dojo.create("div", {id : resp.Children[0].Id + "divCommands" , "class": "sectionTableItemActions" },  dojo.byId(resp.Children[0].Id + "tableitem"));
											var link2 = dojo.create("a", {style: "padding: 0px; text-align: left; display: inline-block;  width: 150px", href: repoURL },  dojo.byId(resp.Children[0].Id + "div"));
											link2.textContent = repositories[0].Name;
											var span = dojo.create("span", {"class": "gitSecondaryDescription"},dojo.byId(resp.Children[0].Id + "div"));
											span.textContent = messages["location: "] + repositories[0].Content.Path;
											var link = dojo.create("a", {id : resp.Children[0].Id + "a", style: "padding: 0px; text-align: left; width: 50px", href: commitPageURL },  dojo.byId(resp.Children[0].Id + "divCommands"));
											link.textContent = messages["Open Commit"];
											dojo.byId("commitDiv").style.display = " block ";
											dojo.byId("moreOptionsDiv").style.display = " block ";
											dojo.byId("instruction").style.display = " none ";
											var tooltipDialog = new orion.git.widgets.CommitTooltipDialog({
											    commit: that.currentCommit.Children[0],
											    onMouseLeave: function(){
													if(dijit.popup.hide)
														dijit.popup.hide(tooltipDialog); //close doesn't work on FF
													dijit.popup.close(tooltipDialog);
												},
												onMouseEnter: function(){
													clearTimeout(_timer);
												}
											});
											
											dojo.connect(link, "onmouseover", link2, function() { //$NON-NLS-0$
												clearTimeout(_timer);
												
												_timer = setTimeout(function(){
													dijit.popup.open({
														popup: tooltipDialog,
														around: link,
														position: "before",
														orient: {'BL':'TL', 'TR':'BR'} //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
													});
												}, 600);
											});
											
											dojo.connect(link, "onmouseout", link, function() { //$NON-NLS-0$
												clearTimeout(_timer);
												
												_timer = setTimeout(function(){
													if(dijit.popup.hide)
														dijit.popup.hide(tooltipDialog); //close doesn't work on FF
													dijit.popup.close(tooltipDialog);
												}, 200);
											});
										},
										function(){
											var index;
											for(var i=0;i<remotes.Children.length;i++){
												var url = that.sshCheck(remotes.Children[i].GitUrl);
												if(url === url1 || url === url2){
													index = i;
												}
											}
											var repoURL = "/git/git-repository.html#" + resp.Children[0].Location;
											dojo.create("div", {id : resp.Children[0].Id + "tableitem" , "class": "sectionTableItem lightTreeTableRow" , style: "height: 20px"},  dojo.byId("fetchNode"));
											dojo.create("div", {id : resp.Children[0].Id + "div" , "class": "stretch" },  dojo.byId(resp.Children[0].Id + "tableitem"));
											dojo.create("div", {id : resp.Children[0].Id + "divCommands" , "class": "sectionTableItemActions" },  dojo.byId(resp.Children[0].Id + "tableitem"));
											var link = dojo.create("a", {id : resp.Children[0].Id, style: "padding: 0px; text-align: left; display: inline-block;  width: 150px", href: repoURL },  dojo.byId(resp.Children[0].Id + "div"));
											link.textContent = resp.Children[0].Name + "    ";
											var span = dojo.create("span", {"class": "gitSecondaryDescription"},dojo.byId(resp.Children[0].Id + "div"));
											span.textContent = messages["location: "] + repositories[0].Content.Path;
											that.commandService.renderCommands("fetch", dojo.byId(resp.Children[0].Id + "divCommands"), remotes.Children[index], that, "tool");
											dojo.byId("fetchDiv").style.display = " block ";
											var style = dojo.style("commitDiv", "display");
										}
									);	
								} else {
									var repoURL = "/git/git-repository.html#" + resp.Children[0].Location;
									dojo.create("div", {id : resp.Children[0].Id + "tableitem" , "class": "sectionTableItem lightTreeTableRow"},  dojo.byId("remoteNode"));
									dojo.create("div", {id : resp.Children[0].Id + "div" , "class": "stretch" },  dojo.byId(resp.Children[0].Id + "tableitem"));
									dojo.create("div", {id : resp.Children[0].Id + "divCommands" , "class": "sectionTableItemActions" },  dojo.byId(resp.Children[0].Id + "tableitem"));
									var repoLink = dojo.create("a", {id : resp.Children[0].Id, style: "padding: 0px; text-align: left; display: inline-block;  width: 150px", href: repoURL },  dojo.byId(resp.Children[0].Id + "div"));
									repoLink.textContent = resp.Children[0].Name + "    ";
									var span = dojo.create("span", {"class": "gitSecondaryDescription"},dojo.byId(resp.Children[0].Id + "div"));
									span.textContent = messages["location: "] + repositories[0].Content.Path;
									that.commandService.renderCommands("add", dojo.byId(resp.Children[0].Id + "divCommands"), resp.Children[0], that, "tool",  url1);
									dojo.byId("remoteDiv").style.display = " block ";
									 for(var i=0;i<remotes.Children.length;i++){	
										dojo.create("div", {}, dojo.byId(resp.Children[0].Id + "div"));
										resp.Children[0].RemoteLocation = "/gitapi/remote" + repositories[0].Location;
										var div = dojo.create("div", {"class": "gitSecondaryDescription"},dojo.byId(resp.Children[0].Id + "div"));
										div.textContent = remotes.Children[i].Name + " : " + remotes.Children[i].GitUrl;
									}
								}
								that.renderSections(repositories.slice(1), url1, url2, sha);
							}
						);
					}
				);
			}
		};
		
		GitReviewRequestExplorer.prototype.initTitleBar = function(commit, url){
			var title = dojo.string.substitute(messages["Contribution Review Request for ${0} on ${1}"], [commit, url]);
			
			var item = {};
			item.Name = title;
			
			mGlobalCommands.setPageTarget({
				task: "Contribution Review Request",
				breadcrumbTarget: item
			});
		};
		
		GitReviewRequestExplorer.prototype.sshCheck = function(remote){
				var url = remote;
				var scheme = new dojo._Url(url).scheme;
				if(scheme === "ssh"){
					var indexOfAt = url.indexOf("@");
					if(indexOfAt !== -1){
						var urlNoUser = "ssh://" + url.substr(indexOfAt + 1);
						url = urlNoUser;
					}
				}
				return url;
			};
		
		return GitReviewRequestExplorer;
	}());
	
	return exports;
}); // end of define
