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
	'require',
	'i18n!git/nls/gitmessages',
	'orion/URITemplate',
	'orion/Deferred',
	'orion/dynamicContent',
	'orion/webui/littlelib',
	'orion/git/widgets/CommitTooltipDialog',
	'orion/objects'
], function(require, messages, URITemplate, Deferred, mDynamicContent, lib, mCommitTooltip, objects) {
		
	var commitTemplate = new URITemplate("git/git-commit.html#{,resource,params*}?page=1&pageSize=1"); //$NON-NLS-0$
	
	/**
	 * @class orion.git.GitTagListExplorer
	 * @extends orion.explorers.Explorer
	 */
	function GitTagListExplorer(options) {
		this.registry = options.serviceRegistry;
		this.commandService = options.commandRegistry;
		this.parentId = options.parentId;
		this.actionScopeId = options.actionScopeId;
		this.repository = options.repository;
		this.section = options.section;
		this.commit = options.commit;
	}
	
	objects.mixin(GitTagListExplorer.prototype, {
		decorateTag: function(tag, deferred){
			deferred = deferred || new Deferred();
			if (tag.Commit) {
				deferred.resolve();
			} else {
				this.registry.getService("orion.page.progress").progress(this.registry.getService("orion.git.provider").doGitLog(tag.CommitLocation + "?page=1&pageSize=1"), "Getting tag last commit " + tag.Name).then(
					function(resp){
						tag.Commit = resp.Children[0];
						deferred.resolve();
					}, function(err){
						deferred.reject();
					}
				);
			}
			return deferred;
		},
		display: function(){
			var that = this;
			var section = this.section;
			
			var progress = section.createProgressMonitor();
			progress.begin(messages["Getting tags"]);
	
			var tagsContainer = document.createElement("div");
			tagsContainer.className = "mainPadding";
			
			var repository = this.repository;
			Deferred.when (this.commit || this.registry.getService("orion.page.progress").progress(this.registry.getService("orion.git.provider").getGitBranch(that.location ? that.location : repository.TagLocation + "?page=1&pageSize=5"), "Getting tags " + repository.Name), 
				function(resp){
				
					var tags = resp.Children;
					var isCommit = false;
					if (!tags) {
						 tags = resp.Tags;
						 isCommit = true;
					} else {
						var children = that.children;
						if (children) { //$NON-NLS-0$
							var args = [children.length - 1, 1].concat(tags);
							Array.prototype.splice.apply(children, args);
						} else {
							children = tags;
						}
						if (resp.NextLocation) {
							children.push({Type: "MoreTags", NextLocation: resp.NextLocation}); //$NON-NLS-0$
						}
						tags = that.children = children;
					}
					var dynamicContentModel = new mDynamicContent.DynamicContentModel(tags,
						function(i){
							if (isCommit) return new Deferred().resolve();
							return that.decorateTag.bind(that)(tags[i]);
						});
							
					var dcExplorer = new mDynamicContent.DynamicContentExplorer(dynamicContentModel);
					var tagRenderer = {
						initialRender : function(){
							progress.done();
							var tagNode = lib.node(that.parentId);
							if (!tagNode) {
								return;
							}
							lib.empty(tagNode);
							tagNode.appendChild(tagsContainer);
							
							that.commandService.destroy(section.actionsNode.id);
							
							if (that.commit) {
								that.commandService.registerCommandContribution(section.actionsNode.id, "eclipse.orion.git.addTag", 100); //$NON-NLS-0$
								that.commandService.renderCommands(section.actionsNode.id, section.actionsNode, that.commit, that, "button"); //$NON-NLS-0$
							}
			
							if (tags.length === 0) {
								section.setTitle(messages['No Tags']);
							}
						},
						
						renderBeforeItemPopulation : function(i){
							var sectionItem = document.createElement("div");
							sectionItem.className = "sectionTableItem lightTreeTableRow";
							tagsContainer.appendChild(sectionItem);
	
							var horizontalBox = document.createElement("div");
							horizontalBox.style.overflow = "hidden";
							sectionItem.appendChild(horizontalBox);
							
							var detailsView = document.createElement("div");
							detailsView.className = "stretch";
							horizontalBox.appendChild(detailsView);

							if (tags[i].Type === "MoreTags") {
								detailsView.className = "gitTagListMore"; //$NON-NLS-0$
								detailsView.textContent = messages["MoreTags"];
								var listener;
								detailsView.addEventListener("click", listener = function() { //$NON-NLS-0$
									detailsView.removeEventListener("click", listener); //$NON-NLS-0$
									detailsView.textContent = messages["MoreTagsProgress"];
									that.location = tags[i].NextLocation;
									that.display();
								});
							} else {
								var title = document.createElement("span");
								title.textContent = tags[i].Name;
								detailsView.appendChild(title);
			
								this.explorer.progressIndicators[i] = new this.explorer.progressIndicator(i, title);
								
								var div = document.createElement("div");
								div.id = "tagDetailsView"+i;
								detailsView.appendChild(div);
		
								var actionsArea = document.createElement("div");
								actionsArea.className = "sectionTableItemActions";
								actionsArea.id = "tagActionsArea";
								horizontalBox.appendChild(actionsArea);
								
								that.commandService.renderCommands(that.actionScopeId, actionsArea, tags[i], that, "tool");	 //$NON-NLS-0$
								
							}
						},
							
						renderAfterItemPopulation : function(i){
							that.renderTag(tags[i], i);
						}			
					};
					
					dcExplorer.use(tagRenderer);
					dcExplorer.render();
				
				}, function(err){
					progress.done();
					that.handleError(err);
				}
			);
		},
		renderTag: function(tag, i){
			var description = document.createElement("span");
			description.className = "tag-description";
			
			var detailsDiv = lib.node("tagDetailsView"+i);
			lib.empty(detailsDiv);
			detailsDiv.appendChild(description);
	
			var commit = tag.Commit;
			if (commit) {
				var link = document.createElement("a");
				link.className = "navlinkonpage";
				link.href = require.toUrl(commitTemplate.expand({resource: commit.Location}));
				link.textContent = commit.Message;
				description.appendChild(link);
				 new mCommitTooltip.CommitTooltipDialog({commit: commit, triggerNode: link});

				var author = document.createElement("div");
				author.textContent = commit.AuthorName + messages[" on "] + new Date(commit.Time).toLocaleString();
				detailsDiv.appendChild(author);
			 }
		}
	});
	
	return {
		GitTagListExplorer: GitTagListExplorer
	};

});