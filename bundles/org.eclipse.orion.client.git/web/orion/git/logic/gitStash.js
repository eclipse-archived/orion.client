/**
 * 
 *//******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
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
		
		
		var performStashApply = function(data) {
			var d = new Deferred();
			
			var item = data.items.status || data.handler.status || data.items;
			var location = item.Clone.StashLocation;
			var gitService = serviceRegistry.getService("orion.git.provider");
			
			var options = {};
			options.applyUntracked = true;
			if(item.stashIndex) options.stashIndex = item.stashIndex;
			
			gitService.doStashApply(location,options).then(function(data) {
				d.resolve(data);
			}, function(err) {
				d.reject(err);
			});

			return d;
		};
		
		var performStashCreate = function(data) {
			var d = new Deferred();
			
			var item = data.items.status || data.handler.status || data.items;
			var location = item.Clone.StashLocation;
			var gitService = serviceRegistry.getService("orion.git.provider");
			
			var options = { includeUntracked: true };
			
			gitService.doStashCreate(location,options).then(function(data) {
				d.resolve(data);
			}, function(err) {
				d.reject(err);
			});
			
			return d;
		};
		
		var performStashDrop = function(data) {
			var d = new Deferred();
			
			var item = data.items.status || data.handler.status || data.items;
			var location = item.Clone.StashLocation;
			var gitService = serviceRegistry.getService("orion.git.provider");
			
			
			var options = {};
			
			if (item.stashIndex) {
				options.stashRef = item.stashIndex;
			}
			
			gitService.doStashDrop(location,options).then(function(data) {
				d.resolve(data);
			}, function(err) {
				d.reject(err);
			});
			
			
			return d;
		};
		
		
		var performStashList = function(data) {
			var d = new Deferred();
			
			var item = data.items.status || data.handler.status || data.items;
			var location = item.Clone.StashLocation;
			var gitService = serviceRegistry.getService("orion.git.provider");
			
			gitService.doStashList(location).then(function(data) {
				d.resolve(data);
			}, function(err) {
				d.reject(err);
			});
			
			
			return d;
		};
		
		return {
			performStashCreate:performStashCreate,
			performStashApply:performStashApply,
			performStashDrop:performStashDrop,
			performStashList:performStashList
		};
	};
});