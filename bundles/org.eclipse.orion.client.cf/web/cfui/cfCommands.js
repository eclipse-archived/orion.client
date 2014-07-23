/*******************************************************************************
 * @license
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved. 
 * 
 * Note to U.S. Government Users Restricted Rights:  Use, 
 * duplication or disclosure restricted by GSA ADP Schedule 
 * Contract with IBM Corp.
 *******************************************************************************/
 /*global define*/
define(['orion/Deferred', 'orion/commands', 'orion/commandRegistry'], function(Deferred, mCommands, mCommandRegistry){
	return {
		createCfCommands: function(serviceRegistry, commandService, explorer){
			
			var progress = serviceRegistry.getService("orion.page.progress");
			
			var deleteRouteCommand = new mCommands.Command({
				name : "Delete",
				tooltip: "Delete route",
				id : "orion.cf.DeleteRoute",
				
				callback : function(data) {
					var route = data.items;
				},
				visibleWhen : function(item) {
					if(!Array.isArray(item)){
						item = [item];
					}
					
					return item.Type === "Route";
				}
			});
			
			commandService.addCommand(deleteRouteCommand);
		},
		createRoutesCommands: function(serviceRegistry, commandService, explorer){
			
		}
	};
});