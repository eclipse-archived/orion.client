/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

define(['require', 'dojo'], function(require, dojo) {
	
	/**
	 * Service for tracking tasks changes
	 * @class Service for tracking tasks changes
	 * @name orion.progress.ProgressService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.taskclient.TaskClient} taskClient
	 */
	function ProgressService(serviceRegistry, taskClient){
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.page.progress", this);
		this._taskClient = taskClient;
		this._init();
		this._topicListeners = {};
	}
	
	ProgressService.prototype = /** @lends orion.progress.ProgressService.prototype */ {
			//FIXME reset tasks list when user changes
			_init: function(){
				var that = this;
				//if tasks waren't updated for 60 seconds this means they are out of date and not updated.
				if(new Date()-this.getLastListUpdate()>60000){
					this._taskClient.getRunningTasks().then(function(taskList){
						taskList.lastClientDate = new Date();
						if(taskList.lastClientDate-that.getLastListUpdate()>60000){
							localStorage.setItem("orionTasks", JSON.stringify(taskList));
						}
						window.setTimeout(function() {
							dojo.hitch(that, that._checkTaskChanges());
						}, 5000);
					}, function(error){throw new Error(error);});
				}else{
					window.setTimeout(function() {
						dojo.hitch(that, that._checkTaskChanges());
					}, 5000);
				}
			},
			/**
			 * Gets information when tasks list was last updated.
			 * @returns {Date}
			 */
			getLastListUpdate: function(){
				var list = JSON.parse(localStorage.getItem("orionTasks") || "{}");
				return list.lastClientDate ? new Date(list.lastClientDate) : new Date(0);
			},
			_checkTaskChanges: function(){
				var that = this;
				var tasks = JSON.parse(localStorage.getItem("orionTasks") || "{Children: []}");
				var allRequests = [];
				for(var i=0; i<tasks.Children.length; i++){
					var task = tasks.Children[i];
					if(task.Running==true && (new Date() - new Date(task.lastClientDate ? task.lastClientDate : 0) > 5000)){
						var def = this._taskClient.getTask(task.Location);
						allRequests.push(def);
						def.then(function(jsonData, ioArgs) {
							jsonData.lastClientDate = new Date();
							dojo.hitch(that, that.writeTask)(jsonData);
						}, function(error, ioArgs){
							throw new Error(error); //TODO what to do on error?
						});
					}
				}
				new dojo.DeferredList(allRequests).addBoth(function(result){
					window.setTimeout(function() {
						dojo.hitch(that, that._checkTaskChanges());
					}, 5000);
				});
			},
			/**
			 * Checks every 2 seconds for the task update.
			 * @param taskJson {Object} json task description to follow
			 * @param deferred {dojo.Deferred} [optional] deferred to be notified when task is done, if not provided created by function
			 * @returns {dojo.Deferred} notified when task finishes
			 */
			followTask: function(taskJson, deferred){
				var result = deferred ? deferred : new dojo.Deferred();
				this.writeTask(taskJson);
				var that = this;
				if (taskJson && taskJson.Location && taskJson.Running==true) {
					window.setTimeout(function() {
						that._taskClient.getTask(taskJson.Location).then(function(jsonData, ioArgs) {
								dojo.hitch(that, that.followTask(jsonData, result));
							}, function(error){
								that._serviceRegistry.getService("orion.page.message").setProgressResult(error);
								result.errback(error);
								});
					}, 2000);
					if(taskJson.Message){
						that._serviceRegistry.getService("orion.page.message").setProgressMessage(taskJson.Message);
					}
				} else if (taskJson && taskJson.Result) {
					that._serviceRegistry.getService("orion.page.message").setProgressResult(taskJson.Result);
					result.callback(taskJson);
				}
				
				return result;
			},
			/**
			 * Shows a progress message until the given deferred is resolved. Returns a deferred that resolves when
			 * the operation completes.
			 * @param deferred {dojo.Deferred} Deferred to track
			 * @param message {String} Message to display
			 * @returns
			 */
			showWhile: function(deferred, message){
				this._serviceRegistry.getService("orion.page.message").setProgressMessage(message);
				var that = this;
				return deferred.then(function(jsonResult){
					//see if we are dealing with a progress resource
					if (jsonResult && jsonResult.Location && jsonResult.Message && jsonResult.Running) {
						return dojo.hitch(that, that.followTask)(jsonResult);
					}
					//clear the progress message
					that._serviceRegistry.getService("orion.page.message").setProgressMessage("");
					return jsonResult;
				});
			},
			
			/**
			 * Add a listener to be notified about a finish of a task on given topic
			 * @param topic {String} a topic to track
			 * @param topicListener {function} a listener to be notified
			 * NOTE: Notifications are not implemented yet!
			 */
			followTopic: function(topic, topicListener){
				if(!this._topicListeners[topic]){
					this._topicListeners[topic] = [];
				}
				this._topicListeners[topic].push(topicListener);
			},
			writeTask: function(taskJson){
				var tasks = JSON.parse(localStorage.getItem("orionTasks") || "{Children: []}");
				for(var i=0; i<tasks.Children.length; i++){
					var task = tasks.Children[i];
					if(task.Id && task.Id===taskJson.Id){
						tasks.Children.splice(i, 1);
						break;
					}
				}
				taskJson.lastClientDate = new Date();
				tasks.Children.push(taskJson);
				//update also the last list update
				tasks.lastClientDate = new Date();
				localStorage.setItem("orionTasks", JSON.stringify(tasks));
			}
	};
			
	ProgressService.prototype.constructor = ProgressService;
	//return module exports
	return {ProgressService: ProgressService};
	
});