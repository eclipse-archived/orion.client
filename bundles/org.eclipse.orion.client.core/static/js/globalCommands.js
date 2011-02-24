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
 
eclipse.globalCommandUtils = eclipse.globalCommandUtils || {};

eclipse.globalCommandUtils.createGlobalCommands = function(commandService) {
		
	var openResourceCommand = new eclipse.Command({
		name: "Open Resource",
		image: "images/silk/find.png",
		id: "eclipse.openResource",
		callback: function(item) {
			window.setTimeout(function() {
				new widgets.OpenResourceDialog({
					SearchLocation: explorer.treeRoot.SearchLocation,
					searcher: explorer.searcher
				}).show();
			}, 0);
		}});
	commandService.addCommand(openResourceCommand, "global");
		
	var importCommand = new eclipse.Command({
		name : "Import",
		image : "images/silk/zip_import.gif",
		id: "eclipse.importCommand",
		callback : function(item) {
			item = forceSingleItem(item);
			var dialog = new widgets.ImportDialog({
				importLocation: item.ImportLocation,
				func: dojo.hitch(explorer, explorer.changedItem(item))
			});
			dialog.startup();
			dialog.show();
		},
		visibleWhen: function(item) {
			item = forceSingleItem(item);
			return item.Directory && !eclipse.util.isAtRoot(item.Location);}});
	commandService.addCommand(importCommand, "object");
	commandService.addCommand(importCommand, "dom");
};