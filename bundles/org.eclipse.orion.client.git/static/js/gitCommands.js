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
};