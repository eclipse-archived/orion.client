/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
define(["dojo", "orion/auth", "dojo/DeferredList"], function(dojo, mAuth){
	
	function _doServiceCall(taskService, funcName, funcArgs) {
		var clientDeferred = new dojo.Deferred();
		taskService[funcName].apply(taskService, funcArgs).then(
			//on success, just forward the result to the client
			function(result) {
				clientDeferred.callback(result);
			},
			//on failure we might need to retry
			function(error) {
				if (error.status === 401) {
					mAuth.handleAuthenticationError(error, function(message) {
						//try again
						taskService[funcName].apply(taskService, funcArgs).then(
							function(result) {
								clientDeferred.callback(result);
							},
							function(error) {
								clientDeferred.errback(error);
							}
						);
					});
				} else {
					//forward other errors to client
					clientDeferred.errback(error);
				}
			}
		);
		return clientDeferred;
	}
	
	function _getTasks(taskService){
		return _doServiceCall(taskService, "getTasks");
	}
	
	function TaskClient(serviceRegistry){
		this._services = [];
		this._patterns = [];
		var taskServices = serviceRegistry.getServiceReferences("orion.core.task");
		for(var i=0; i<taskServices.length; i++){
			var servicePtr = taskServices[i];
			var taskService = serviceRegistry.getService(servicePtr);
			this._services[i] = taskService;
			
			var patternString = taskServices[i].getProperty("pattern") || ".*";
			if (patternString[0] !== "^") {
				patternString = "^" + patternString;
			}
			this._patterns[i] = new RegExp(patternString);
		}
		
		this._getService = function(location) {
			if (!location) {
				return this._services[0];
			}
			for(var i = 0; i < this._patterns.length; ++i) {
				if (this._patterns[i].test(location)) {
					return this._services[i];
				}
			}
			throw "No Matching TaskService for location:" + location;
		};
	}
	
	function _mergeTasks(lists){
		if(lists.length===1){
			return lists[0][1];
		}
		var result = {Children: []};
		for(var i=0; i<lists.length; i++){
			if(lists[i][1] && lists[i][1].Children)
				result.Children = result.Children.concat(lists[i][1].Children);
		}
		return result;
	}
	
	TaskClient.prototype = {
			getTasks: function(){
				var result = new dojo.Deferred();
				var results = [];
				for(var i=0; i<this._services.length; i++){
					results[i] = _getTasks(this._services[i]);
				}
				new dojo.DeferredList(results).then(function(lists){
					result.resolve(_mergeTasks(lists));
				});
				return result;
			}
	};
	
	TaskClient.prototype.constructor = TaskClient;
	
	return {TaskClient: TaskClient};
});