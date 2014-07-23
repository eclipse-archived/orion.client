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
			
			var progressService = serviceRegistry.getService("orion.page.progress");
			var cfClient = serviceRegistry.getService("orion.cf.service");
			
			var createRouteParameters = new mCommandRegistry.ParametersDescription(
					[new mCommandRegistry.CommandParameter("domain", "text", 'Domain:'),
					 new mCommandRegistry.CommandParameter("host", "text", 'Host:')]);
			
			var createRouteCommand = new mCommands.Command({
				name : "Create",
				tooltip: "Create route",
				id : "orion.cf.CreateRoute",
				parameters: createRouteParameters,
				
				callback : function(data) {
					var target = data.items;
					
					var domain = data.parameters.valueFor("domain");
					var host = data.parameters.valueFor("host");
					
					progressService.showWhile(cfClient.createRoute(target, 
							domain, host), "Creating route...").then(
						function(jazzResp) {
							explorer.changedItem();
						}, function (error) {
							exports.handleError(error, progressService);
						}
					);
				},
				visibleWhen : function(item) {
					return true;
				}
			});
			
			commandService.addCommand(createRouteCommand);
			
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