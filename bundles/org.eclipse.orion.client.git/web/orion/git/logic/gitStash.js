/******************************************************************************* 
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/

define(['i18n!git/nls/gitmessages','orion/commandRegistry','orion/Deferred','orion/git/widgets/CommitDialog', 
        'orion/git/logic/gitCommon', 'orion/i18nUtil', 'orion/webui/littlelib'],
        function(messages,mCommandRegistry,Deferred,mCommit,mGitCommon,i18nUtil, lib) {
	
	/**
	 * Acts as a factory for stash related functions.
	 * @param dependencies All required objects and values to perform the command
	 */
	return function(dependencies) {
		
		var serviceRegistry = dependencies.serviceRegistry;
		var commandService = dependencies.commandService;
		
		var performStashAll = function(data) {
			
			var d = new Deferred();
			var gitService = serviceRegistry.getService("orion.git.provider");
			var item = data.items.status || data.handler.status || data.items;
			var gitStashLocation = item.Clone.StashLocation;
	
			var name = data.userData.name;
			if(name != null && (name.length === 0 || !name.trim())){
				/* in case of empty or blank commit message, assume 
				 * the default stash message */
				name = undefined;
			}

			/* TODO: Distinguish between index and working directory messages */
			gitService.doStashCreate(gitStashLocation, name, name).then(function(resp){
				d.resolve(data);
			}, function(error){
				d.reject(error);
			});
			
			return d;
		};
		
		var performDrop = function(data) {
			
			var d = new Deferred();
			var gitService = serviceRegistry.getService("orion.git.provider");
			var item = data.items.status || data.handler.status || data.items;
			var dropLocation = item.DropLocation;

			gitService.doStashDrop(dropLocation).then(function(resp){
				d.resolve(data);
			}, function(error){
				d.reject(error);
			});
			
			return d;
		};
		
		var performApply = function(data) {
			
			var d = new Deferred();
			var gitService = serviceRegistry.getService("orion.git.provider");
			var item = data.items.status || data.handler.status || data.items;
			var applyLocation = item.ApplyLocation;

			gitService.doStashApply(applyLocation).then(function(resp){
				d.resolve(data);
			}, function(error){
				d.reject(error);
			});
			
			return d;
		};
		
		var performPop = function(data) {
			
			var d = new Deferred();
			var gitService = serviceRegistry.getService("orion.git.provider");
			var item = data.items.status || data.handler.status || data.items;
			var gitStashLocation = item.Clone.StashLocation;

			gitService.doStashPop(gitStashLocation).then(function(resp){
				d.resolve(data);
			}, function(error){
				d.reject(error);
			});
			
			return d;
		};
		
		return {
			stashAll : performStashAll,
			drop : performDrop,
			apply : performApply,
			pop : performPop
		};
	};
});