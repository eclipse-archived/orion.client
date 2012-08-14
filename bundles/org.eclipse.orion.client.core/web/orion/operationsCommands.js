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

/*global window widgets eclipse:true serviceRegistry dojo */
/*browser:true*/
define(['i18n!orion/operations/nls/messages', 'require', 'dojo', 'orion/commands'], 
        function(messages, require, dojo, mCommands) {
	/**
	 * @namespace The global container for eclipse APIs.
	 */ 
	var exports = {};
	//this function is just a closure for the global "doOnce" flag
	(function() {
		var doOnce = false;

		exports.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
			var service = registry.getService("orion.page.command"); //$NON-NLS-0$
			var toolbar = dojo.byId(toolbarId);
			if (toolbar) {
				service.destroy(toolbar);
			} else {
				throw messages["could not find toolbar "] + toolbarId;
			}
			service.renderCommands(toolbarId, toolbar, item, explorer, "button");   //$NON-NLS-0$
			if (selectionToolbarId) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					service.destroy(selectionTools);
					service.renderCommands(selectionToolbarId, selectionTools, null, explorer, "button");  //$NON-NLS-0$
				}
			}

			// Stuff we do only the first time
			if (!doOnce) {
				doOnce = true;
				registry.getService("orion.page.selection").addEventListener("selectionChanged", function(singleSelection, selections) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = dojo.byId(selectionToolbarId);
					if (selectionTools) {
						var commandService = registry.getService("orion.page.command"); //$NON-NLS-0$
						commandService.destroy(selectionTools);
						commandService.renderCommands(selectionToolbarId, selectionTools, selections, explorer, "button"); //$NON-NLS-0$
					}
				});
			}
		};
		
		exports.createOperationsCommands = function(serviceRegistry, commandService, explorer, operationsClient){
		
			var removeCompletedOperationsCommand = new mCommands.Command({
				name : messages["Remove Completed"],
				tooltip : messages["Remove all completed operations"],
				id : "eclipse.removeCompletedOperations", //$NON-NLS-0$
				callback : function(data) {
					var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					operationsClient.removeCompletedOperations().then(dojo.hitch(progress, function(item){
						progress.removeCompletedOperations();
					}));
				},
				visibleWhen : function(item) {
					return true;
				}
			});
			commandService.addCommand(removeCompletedOperationsCommand);
			
			var removeOperationCommand = new mCommands.Command({
				name : messages["Remove"],
				tooltip : messages["Remove operations from the operations list."],
				imageClass: "core-sprite-delete", //$NON-NLS-0$
				id : "eclipse.removeOperation", //$NON-NLS-0$
				callback : function(data) {
					var items = dojo.isArray(data.items) ? data.items : [data.items];
					var progress = serviceRegistry.getService("orion.page.progress"); //$NON-NLS-0$
					for (var i=0; i < items.length; i++) {
						var item = items[i];
						operationsClient.removeOperation(item.Location).then(dojo.hitch(progress, function(item){
							progress.removeOperationFromTheList(item.Id);
						}, item));
					}
				},
				visibleWhen : function(items) {
					if(!dojo.isArray(items) || items.length===0)
						return items.Running===false;
					for(var i in items){
						if(items[i].Running!=false){
							return false;
						}
					}
					return true;
				}
			});
			commandService.addCommand(removeOperationCommand);
			
			var cancelOperationCommand = new mCommands.Command({
				name : messages["Cancel"],
				tooltip : messages["Cancel operations from the operations list."],
				imageClass: "core-sprite-stop", //$NON-NLS-0$
				id : "eclipse.cancelOperation", //$NON-NLS-0$
				callback : function(data) {
					var items = dojo.isArray(data.items) ? data.items : [data.items];
					for (var i=0; i < items.length; i++) {
						var item = items[i];
						operationsClient.cancelOperation(item.Location);
					}
				},
				visibleWhen : function(items) {
					if(!dojo.isArray(items) || items.length===0)
						return items.CanBeCanceled===true && items.Running===true;
					for(var i in items){
						if(items[i].CanBeCanceled!=true || items[i].Running!=true){
							return false;
						}
					}
					return true;
				}
			});
			commandService.addCommand(cancelOperationCommand);
		};
	
	}());	
	return exports;	
});