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
define(['require', 'dojo', 'orion/commands'], 
        function(require, dojo, mCommands) {
	/**
	 * @namespace The global container for eclipse APIs.
	 */ 
	var exports = {};
	//this function is just a closure for the global "doOnce" flag
	(function() {
		var doOnce = false;

		exports.updateNavTools = function(registry, explorer, toolbarId, selectionToolbarId, item) {
			var toolbar = dojo.byId(toolbarId);
			if (toolbar) {
				dojo.empty(toolbar);
			} else {
				throw "could not find toolbar " + toolbarId;
			}
			var service = registry.getService("orion.page.command");
			service.renderCommands(toolbar, "dom", item, explorer, "tool", true);  // true for force icons to text
			if (selectionToolbarId) {
				var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
				service.renderCommands(selectionTools, "dom", null, explorer, "tool", true); // true would force icons to text
			}

			// Stuff we do only the first time
			if (!doOnce) {
				doOnce = true;
				registry.getService("orion.page.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionToolbarId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						registry.getService("orion.page.command").renderCommands(selectionTools, "dom", selections, explorer, "tool", true);
					}
				});
			}
		};
		
		exports.createOperationsCommands = function(serviceRegistry, commandService, explorer, operationsClient){
		
			var removeCompletedOperationsCommand = new mCommands.Command({
				name : "Remove Completed",
				tooltip : "Remove all completed operations",
				id : "eclipse.removeCompletedOperations",
				callback : function(data) {
					operationsClient.removeCompletedOperations().then(function(){explorer.removeCompletedOperations();});
				},
				visibleWhen : function(item) {
					return true;
				}
			});
			commandService.addCommand(removeCompletedOperationsCommand, "dom");
			
			var removeOperationCommand = new mCommands.Command({
				name : "Remove",
				tooltip : "Remove operations from the operations list.",
				imageClass: "core-sprite-delete",
				id : "eclipse.removeOperation",
				callback : function(data) {
					var items = dojo.isArray(data.items) ? data.items : [data.items];
					var removeResults = [];
					for (var i=0; i < items.length; i++) {
						var item = items[i];
						removeResults[i] = operationsClient.removeOperation(item.Location);
					}
					 new dojo.DeferredList(removeResults).then(function(){
						 dojo.hitch(explorer, explorer.removeOperations)(items);
					 });
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
			commandService.addCommand(removeOperationCommand, "object");
			commandService.addCommand(removeOperationCommand, "dom");
			
			var cancelOperationCommand = new mCommands.Command({
				name : "Cancel",
				tooltip : "Cancel operations from the operations list.",
				imageClass: "core-sprite-stop",
				id : "eclipse.cancelOperation",
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
			commandService.addCommand(cancelOperationCommand, "object");
			commandService.addCommand(cancelOperationCommand, "dom");
		};
	
	}());	
	return exports;	
});