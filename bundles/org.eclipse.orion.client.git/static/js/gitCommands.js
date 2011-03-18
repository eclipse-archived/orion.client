/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global window widgets eclipse:true serviceRegistry dojo */
/*browser:true*/

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * Utility methods
 * @namespace eclipse.fileCommandUtils generates commands
 */
 
eclipse.gitCommandUtils = eclipse.gitCommandUtils || {};

dojo.require("widgets.CloneGitRepositoryDialog");

eclipse.doOnce = false;

eclipse.gitCommandUtils.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
	// TODO this knowledge shouldn't be here...the fact that we know we are on a dark toolbar
	var cssClass = "commandLinkLight";
	var toolbar = dojo.byId(toolbarId);
	if (toolbar) {
		dojo.empty(toolbar);
	} else {
		throw "could not find toolbar " + toolbarId;
	}
	registry.getService("ICommandService").then(dojo.hitch(explorer, function(service) {
		service.renderCommands(toolbar, "dom", item, explorer, "image", cssClass);
		if (selectionToolbarId) {
			var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
			service.renderCommands(selectionTools, "dom", null, explorer, "image", cssClass);
		}
	}));
	
	// Stuff we do only the first time
	if (!eclipse.doOnce) {
		eclipse.doOnce = true;
		registry.getService("ISelectionService").then(function(service) {
			service.addEventListener("selectionChanged", function(selections) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					dojo.empty(selectionTools);
					registry.getService("ICommandService").then(function(commandService) {
						commandService.renderCommands(selectionTools, "dom", selections, explorer, "image", cssClass);
					});
				}
			});
		});
	}
};


eclipse.gitCommandUtils.createFileCommands = function(serviceRegistry, commandService, explorer, toolbarId) {
	var cloneGitRepositoryCommand = new eclipse.Command({
		name : "Clone Git Repository",
		image : "images/git/cloneGit.gif",
		id : "eclipse.cloneGitRepository",
		callback : function(item) {
			var dialog = new widgets.CloneGitRepositoryDialog({
				func : function(gitUrl, gitSshUsername, gitSshPassword, gitSshKnownHost) {
					serviceRegistry.getService("IGitService").then(
							function(service) {
								service.cloneGitRepository("", gitUrl, gitSshUsername, gitSshPassword, gitSshKnownHost, 
										function(jsonData, secondArg) {
											window.alert("Repository cloned. You may now link to " + jsonData.ContentLocation);
										});
							});
				}
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen : function(item) {
			return true;
		}
	});

	commandService.addCommand(cloneGitRepositoryCommand, "dom");
	
	var compareGitCommits = new eclipse.Command({
		name : "Compare",
		image : "images/git/compare-sbs.gif",
		id : "eclipse.compareGitCommits",
		callback : function(item) {
			console.info("Commits compare not implemented yet");
		},
		visibleWhen : function(item) {
			if (dojo.isArray(item) && item.length == 2) {
					return true;
			};
			return false;
		}
	});

	commandService.addCommand(compareGitCommits, "dom");
	
	var openGitCommit = new eclipse.Command({
		name : "Open",
		image : "images/find.gif",
		id : "eclipse.openGitCommit",
		callback : function(item) {
			console.info("Open not implemented yet");
		},
		visibleWhen : function(item) {
			return true;
		}
	});

	commandService.addCommand(openGitCommit, "object");
};