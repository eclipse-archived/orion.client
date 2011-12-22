/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define console document */

define(['dojo', 'orion/explorer', 'orion/util'], function(dojo, mExplorer, mUtil) {
	var exports = {};

	exports.GitCommitExplorer = (function() {

		/**
		 * Creates a new Git commit explorer.
		 * @class Git commit explorer
		 */
		function GitCommitExplorer(registry, linkService, selection, parentId, toolbarId, selectionToolsId){
			this.parentId = parentId;
			this.registry = registry;
			this.linkService = linkService;
			this.selection = selection;
			this.parentId = parentId;
			this.toolbarId = toolbarId;
			this.selectionToolsId = selectionToolsId;
			this.checkbox = false;
		}

		GitCommitExplorer.prototype.displayCommit = function(commitLocation){
			var that = this;
			var progressService = this.registry.getService("orion.page.message");

			// Create the page skeleton
			var repositoryPageSkeleton =
				"<div id=\"mainNode\" class=\"settings\">" +
					"<div class=\"displayTable\">" +
						"<h1>Commit</h1>" +
						"<section class=\"extension-settings-content\">" +
							"<div class=\"extension-settings\">" +
								"<list id=\"commitNode\" class=\"extension-settings-list\"></list>" +
							"</div>" +
						"</section>" +
					"</div>" +

					"<div class=\"displayTable\">" +
						"<section class=\"extension-settings-content\">" +
							"<div class=\"extension-settings\">" +
								"<list class=\"extension-settings-list\">" +
									"<div class=\"vbox extension-list-item\">" +
										"<div class=\"hbox\">" +
											"<div class=\"vbox stretch details-view\"><h1 style=\"padding-top: 4px; border-bottom: none;\">Tags (10 most recent)</h1></div>"+
											"<div id=\"tagSectionActionsArea\" class=\"pageActions\"></div>" +
										"</div>" +
									"</div>" +
								"</list>" +
							"</div>" +
						"</section>" +

						"<section class=\"extension-settings-content\">" +
							"<div class=\"extension-settings\">" +
								"<list id=\"tagNode\" class=\"extension-settings-list\"></list>" +
							"</div>" +
						"</section>" +
					"</div>" +
				"</div>";

			var parentNode = dojo.byId(this.parentId);
			dojo.place(repositoryPageSkeleton, parentNode, "only");

			progressService.setProgressMessage("Loading...");
			this.registry.getService("orion.git.provider").doGitLog(commitLocation).then(
				function(resp){
					var commit = resp.Children[0];
					that.renderCommit(commit);
					that.displayTags(commit.Tags);

					that.registry.getService("orion.page.command").registerCommandContribution("eclipse.orion.git.addTag", 100, "tagSectionActionsArea");
					that.registry.getService("orion.page.command").renderCommands(dojo.byId("tagSectionActionsArea"), "dom", commit, this, "tool", false); 

					progressService.setProgressMessage("");
				}, function(error){
				}
			);
		};

		GitCommitExplorer.prototype.renderCommit = function(commit){
			var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("commitNode") );
			var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
			var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );

			var modification = dojo.create("span", null, horizontalBox);
			dojo.addClass(modification, "gitImageSprite");
			dojo.addClass(modification, "git-sprite-modification");

			var detailsView = dojo.create( "div", { "class":"vbox stretch details-view" }, horizontalBox );
			dojo.create( "span", { "class":"extension-title", innerHTML: commit.Message }, detailsView );
			dojo.create( "div", null, detailsView );
			dojo.create( "span", { "class":"extension-description", innerHTML: commit.CommitterName + " (" + commit.CommitterEmail + ")" }, detailsView );
			dojo.create( "div", null, detailsView );
			var description = dojo.create( "span", { "class":"extension-description", innerHTML: commit.Name }, detailsView );

			if (commit.AuthorImage) {
				var authorImage = dojo.create("span", null, description);
				var image = new Image();
				image.src = commit.AuthorImage;
				image.name = commit.AuthorName;
				image.width = 30;
				image.height = 30;
				dojo.addClass(image, "gitAuthorImage");
				dojo.place(image, authorImage, "first");
			}
			var actionsArea = dojo.create( "div", {"id":"commitActionsArea"}, horizontalBox );
			this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", commit, this, "tool", false);
		};

		GitCommitExplorer.prototype.displayTags = function(tags){
			for(var i=0; (i<tags.length && i<10);i++){
				this.renderTag(tags[i]);
			}
		};

		GitCommitExplorer.prototype.renderTag = function(tag){
			var extensionListItemCollapsed = dojo.create( "div", { "class":"extension-list-item-collaped" }, dojo.byId("tagNode") );
			var extensionListItem = dojo.create( "div", { "class":"vbox extension-list-item" }, extensionListItemCollapsed );
			var horizontalBox = dojo.create( "div", { "class":"hbox" }, extensionListItem );

			dojo.create( "span", { "class":"gitImageSprite git-sprite-tag" }, horizontalBox );

			var detailsView = dojo.create( "div", { "class":"vbox stretch details-view"}, horizontalBox );
			var title = dojo.create( "span", { "class":"extension-title", innerHTML: tag.Name }, detailsView );

			var actionsArea = dojo.create( "div", {"id":"tagActionsArea"}, horizontalBox );
			this.registry.getService("orion.page.command").renderCommands(actionsArea, "object", tag, this, "tool", false);	
		};

		return GitCommitExplorer;
	}());
	return exports;
}); // end of define
