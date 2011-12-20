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

define(['require', 'dojo', 'orion/globalCommands', 'orion/widgets/TasksDialog'], function(require, dojo, mGlobalCommands) {
	
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
		this._initDone = false;
		this._topicListeners = {};
	}
	
	ProgressService.prototype = /** @lends orion.progress.ProgressService.prototype */ {
			init: function(progressPane){
				if(this._progressPane){
					return;
				}
				this._progressPane = dojo.byId(progressPane);
				this._taskDialog = new orion.widgets.TasksDialog();
				this._tasksDialogConnection = dojo.connect(this._progressPane, "onclick", dojo.hitch(this, this._openTasksPopup));
				var that = this;
				//if tasks waren't updated for 5 minutes this means they are out of date and not updated.
				if(new Date()-this.getLastListUpdate()>300000){
					this._taskClient.getRunningTasks().then(function(taskList){
						dojo.hitch(that, that._loadTasksList)(taskList);
						window.setTimeout(function() {
							dojo.hitch(that, that._checkTaskChanges());
						}, 5000);
					}, function(error){throw new Error(error);});
				}else{
					dojo.hitch(that, that._generateTaskInfo(JSON.parse(localStorage.getItem("orionTasks") || "{'Children': []}")));
					window.setTimeout(function() {
						dojo.hitch(that, that._checkTaskChanges());
					}, 5000);
				}
				
				window.addEventListener("storage", function(e){
					if(mGlobalCommands.getAuthenticationIds().indexOf(e.key)>=0){
						//refresh task list every time when user changes
						that._taskClient.getRunningTasks().then(function(taskList){
							dojo.hitch(that, that._loadTasksList)(taskList);
						},function(error){throw new Error(error);});
					}
				}, false);
				
				window.addEventListener("storage", function(e){
					if(e.key === "orionTasks"){
						dojo.hitch(that, that._generateTaskInfo(JSON.parse(localStorage.getItem("orionTasks") || "{'Children': []}")));
					}
				});
			},
			_loadTasksList: function(taskList){
				taskList.lastClientDate = new Date();
				if(taskList.lastClientDate-this.getLastListUpdate()>300000){
					localStorage.setItem("orionTasks", JSON.stringify(taskList));
					this._generateTaskInfo(taskList);
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
				var tasks = JSON.parse(localStorage.getItem("orionTasks") || "{'Children': []}");
				var tasksToDelete = [];
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
					if(!task.Running  && (new Date() - new Date(task.lastClientDate ? task.lastClientDate : 0) > 300000)){
						//after 5 minutes remove task from the list
						tasksToDelete.push(i);
					}
				}
				if(tasksToDelete.length>0){
					tasks.lastClientDate = new Date();
					for(var i=tasksToDelete.length-1; i>=0; i--){
						tasks.Children.splice(tasksToDelete[i], 1);
					}
					localStorage.setItem("orionTasks", JSON.stringify(tasks));
					dojo.hitch(that, that._generateTaskInfo)(tasks);
				}
				new dojo.DeferredList(allRequests).addBoth(function(result){
					window.setTimeout(function() {
						dojo.hitch(that, that._checkTaskChanges());
					}, 5000);
				});
			},
			_openTasksPopup: function(){
				dijit.popup.open({
					popup: this._taskDialog,
					around: this._progressPane
				});
				dijit.focus(this._taskDialog.domNode);
			},
			_generateTaskInfo: function(tasks){
				this._taskDialog.setTasks(tasks);
				
				if(!tasks.Children || tasks.Children.length==0){
					this._progressPane.className = "progressPane progressPane_empty";
					this._progressPane.title = "Tasks";
					return;
				}
				var status = "";
				for(var i=0; i<tasks.Children.length; i++){
					var task = tasks.Children[i];
					if(task.Running==true){
						status = "running";
						break;
					}
					if(task.Result){
						switch (this._taskDialog.parseProgressResult(task.Result).Severity) {
						case "Warning":
							if(status!=="error")
								status="warning";
							break;
						case "Error":
							status = "error";
						} 
					}
				}
				switch(status){
				case "running":
					this._progressPane.title = "Tasks running";
					this._progressPane.className = "progressPane progressPane_running";
					break;
				case "warning":
					this._progressPane.title = "Some tasks finished with warning";
					this._progressPane.className = "progressPane progressPane_warning";
					break;
				case "error":
					this._progressPane.title = "Some tasks finished with error";
					this._progressPane.className = "progressPane progressPane_error";
					break;
				default:
					this._progressPane.title = "Tasks";
					this._progressPane.className = "progressPane progressPane_tasks";					
				}
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
								dojo.hitch(that, that.setProgressResult)(error);
								result.errback(error);
								});
					}, 2000);
				} else if (taskJson && taskJson.Result) {
					that._serviceRegistry.getService("orion.page.message").setProgressMessage("");
					var severity = this._taskDialog.parseProgressResult(taskJson.Result).Severity;
					if(severity=="Error" || severity=="Warning")
						dojo.hitch(that, that._openTasksPopup)();
					result.callback(taskJson);
				}
				
				return result;
			},
			setProgressResult: function(result){
				this._serviceRegistry.getService("orion.page.message").setProgressResult(result);
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
			writeTask: function(taskj){
				var taskJson = JSON.parse(JSON.stringify(taskj));
				var tasks = JSON.parse(localStorage.getItem("orionTasks") || "{'Children': []}");
				for(var i=0; i<tasks.Children.length; i++){
					var task = tasks.Children[i];
					if(task.Id && task.Id===taskJson.Id){
						tasks.Children.splice(i, 1);
						break;
					}
				}
				//do not store results, they may be too big for localStorage
				if(!taskJson.Running && !taskJson.Failed){
					delete taskJson.Result;
				}
				taskJson.lastClientDate = new Date();
				tasks.Children.push(taskJson);
				//update also the last list update
				tasks.lastClientDate = new Date();
				localStorage.setItem("orionTasks", JSON.stringify(tasks));
				this._generateTaskInfo(tasks); 
			}
	};
			
	ProgressService.prototype.constructor = ProgressService;
	//return module exports
	return {ProgressService: ProgressService};
	
});
