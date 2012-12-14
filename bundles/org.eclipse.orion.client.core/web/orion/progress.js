/*******************************************************************************
 * @license
 * Copyright (c) 2009, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define window orion dijit console localStorage*/

define(['i18n!orion/nls/messages', 'require', 'orion/Deferred', 'orion/webui/littlelib', 'orion/globalCommands', 'orion/webui/dialogs/OperationsDialog'], 
function(messages, require, Deferred, lib, mGlobalCommands, mOperationsDialog) {
	
	/**
	 * Service for tracking operations changes
	 * @class Service for tracking operations changes
	 * @name orion.progress.ProgressService
	 * @param {orion.serviceregistry.ServiceRegistry} serviceRegistry
	 * @param {orion.operationsclient.OperationsClient} operationsClient
	 */
	function ProgressService(serviceRegistry, operationsClient){
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.page.progress", this); //$NON-NLS-0$
		this._operationsClient = operationsClient;
		this._initDone = false;
		this._topicListeners = {};
		this._operations = {Children: []};
		this._lastOperation = null;
		this._lastIconClass = null;
	}
	
	ProgressService.prototype = /** @lends orion.progress.ProgressService.prototype */ {
			init: function(progressPane){
				if(this._progressPane){
					return;
				}
				this._progressPane = lib.node(progressPane);
				this._operationsDialog = new mOperationsDialog.OperationsDialog({triggerNode: this._progressPane});
				var that = this;
				this._progressPane.addEventListener("keydown", function(evt) {  //$NON-NLS-0$
					if(evt.charOrCode === ' ' || evt.keyCode === lib.KEY.ENTER) { //$NON-NLS-0$
						that._operationsDialog.show();
					}
				});
				//if operations waren't updated for 5 minutes this means they are out of date and not updated.
				if(new Date()-this.getLastListUpdate()>300000){
					this._operationsClient.getRunningOperations().then(function(operationsList){
						that._loadOperationsList.bind(that)(operationsList);
						window.setTimeout(function() {
							that._checkOperationsChanges.bind(that)();
						}, 5000);
					}, function(error){console.error(error);});
				}else{
					that._generateOperationsInfo.bind(that)(that._operations);
					window.setTimeout(function() {
						that._checkOperationsChanges.bind(that)();
					}, 5000);
				}
				
				window.addEventListener("storage", function(e){ //$NON-NLS-0$
					if(e.key === "orionOperations"){ //$NON-NLS-0$
						that._generateOperationsInfo.bind(that)(that._operations); //$NON-NLS-1$ //$NON-NLS-0$
					}
				});
			},
			_loadOperationsList: function(operationsList){
				operationsList.lastClientDate = new Date();
				if(operationsList.lastClientDate-this.getLastListUpdate()>300000){
					this._operations = operationsList; //$NON-NLS-0$
					this._generateOperationsInfo(operationsList);
				}
			},
			/**
			 * Gets information when operations list was last updated.
			 * @returns {Date}
			 */
			getLastListUpdate: function(){
				var list = this._operations; //$NON-NLS-1$ //$NON-NLS-0$
				return list.lastClientDate ? new Date(list.lastClientDate) : new Date(0);
			},
			_markOperationAsFailed: function(operation, error, ioArgs){
				operation.Message = messages["Operation status is unknown"];
				operation.Running = false;
				operation.Failed = true;
				operation.Result = {HttpCode: ioArgs ? ioArgs.xhr.staus : 500, Severity: error, Message: error.Message ? error.Message : error};
				this.writeOperation(operation);
			},
			_checkOperationsChanges: function(){
				var that = this;
				var operations = this._operations; //$NON-NLS-1$ //$NON-NLS-0$
				var operationsToDelete = [];
				var allRequests = [];
				for(var i=0; i<operations.Children.length; i++){
					var operation = operations.Children[i];
					if(operation.Running===true && (new Date() - new Date(operation.lastClientDate ? operation.lastClientDate : 0) > 5000)){
						var def = this._operationsClient.getOperation(operation.Location);
						allRequests.push(def);
						var func = function(i){
							def.then(function(jsonData, ioArgs) {
								jsonData.lastClientDate = new Date();
								that.writeOperation.bind(that)(jsonData);
							}, function(error, ioArgs){
								if(error.status === 404){
									//if task not found is must have been removed so remove it from tracking list
									operationsToDelete.push(i);
									return error;
								}
								var operation = operations.Children[i];
								that._markOperationAsFailed.bind(that)(operation, error, ioArgs);
							});
						};
						func.bind(this)(i);
					}
					if(!operation.Running  && (new Date() - new Date(operation.lastClientDate ? operation.lastClientDate : 0) > 300000)){
						//after 5 minutes remove operation from the list
						operationsToDelete.push(i);
					}
				}
				Deferred.all(allRequests, function(error) { return error; }).then(function(result){  // the errback used for all doesn't matter, but must be there
					if(operationsToDelete.length>0){
						operations.lastClientDate = new Date();
						for(var i=operationsToDelete.length-1; i>=0; i--){
							operations.Children.splice(operationsToDelete[i], 1);
						}
						that._operations = operations; //$NON-NLS-0$
						that._generateOperationsInfo.bind(that)(operations);
					}
					window.setTimeout(function() {
						that._checkOperationsChanges.bind(that)();
					}, 5000);
				});
			},
			
			_switchIconTo: function(iconClass) {
				if (this._lastIconClass) {
					this._progressPane.classList.remove(this._lastIconClass);
				}
				this._lastIconClass = iconClass;
				this._progressPane.classList.add(this._lastIconClass);
			}, 
			
			_generateOperationsInfo: function(operations){
				this._operationsDialog.setOperations(operations);
				
				if(!operations.Children || operations.Children.length===0){
					this._switchIconTo("progressPane_empty"); //$NON-NLS-0$
					this._progressPane.title = messages["Operations"]; //$NON-NLS-0$
					this._progressPane.alt = messages["Operations"]; //$NON-NLS-0$
					if(this._progressPane.hasAttribute("aria-valuetext")) { //$NON-NLS-0$
						this._progressPane.removeAttribute("aria-valuetext"); //$NON-NLS-0$
					}
					return;
				}
				var status = "";
				for(var i=0; i<operations.Children.length; i++){
					var operation = operations.Children[i];
					if(operation.Running===true){
						status = "running"; //$NON-NLS-0$
						break;
					}
				}
				
				if(status==="" && this._lastOperation!==null){
					if(this._lastOperation.Result){
						switch (this._operationsDialog.parseProgressResult(this._lastOperation.Result).Severity) {
						case "Warning": //$NON-NLS-0$
							if(status!=="error") { //$NON-NLS-0$
								status="warning"; //$NON-NLS-0$
							}
							break;
						case "Error": //$NON-NLS-0$
							status = "error"; //$NON-NLS-0$
						} 
					}
				}
				switch(status){
				case "running": //$NON-NLS-0$
					this._progressPane.title = messages["Operations running"];
					this._progressPane.alt = messages['Operations running'];
					this._progressPane.setAttribute("aria-valuetext", messages['Operations running']); //$NON-NLS-0$
					this._switchIconTo("progressPane_running"); //$NON-NLS-0$
					break;
				case "warning": //$NON-NLS-0$
					this._progressPane.title = messages["Some operations finished with warning"];
					this._progressPane.alt = messages['Some operations finished with warning'];
					this._progressPane.setAttribute("aria-valuetext", messages['Some operations finished with warning']); //$NON-NLS-0$
					this._switchIconTo("progressPane_warning"); //$NON-NLS-0$
					break;
				case "error": //$NON-NLS-0$
					this._progressPane.title = messages["Some operations finished with error"];
					this._progressPane.alt = messages['Some operations finished with error'];
					this._progressPane.setAttribute("aria-valuetext", messages['Some operations finished with error']); //$NON-NLS-0$
					this._switchIconTo("progressPane_error"); //$NON-NLS-0$
					break;
				default:
					this._progressPane.title = messages["Operations"];
					this._progressPane.alt = messages['Operations'];
					if(this._progressPane.hasAttribute("aria-valuetext")) { //$NON-NLS-0$
						this._progressPane.removeAttribute("aria-valuetext"); //$NON-NLS-0$
					}
					this._switchIconTo("progressPane_operations");					 //$NON-NLS-0$
				}
			},
			/**
			 * Checks every 2 seconds for the operation update.
			 * @param operationJson {Object} json operation description to follow
			 * @param deferred {dojo.Deferred} [optional] deferred to be notified when operation is done, if not provided created by function
			 * @returns {dojo.Deferred} notified when operation finishes
			 */
			followOperation: function(operationJson, deferred, operationLocation){
				var result = deferred ? deferred : new Deferred();
				operationLocation = operationLocation || operationJson.Location;
				this.writeOperation(operationJson);
				var that = this;
				if (operationJson && operationJson.Location && operationJson.Running===true) {
					window.setTimeout(function() {
						that._operationsClient.getOperation(operationJson.Location).then(function(jsonData, ioArgs) {
								that.followOperation.bind(that)(jsonData, result, operationJson.Location);
							}, function(error, secondArg){
								that.setProgressResult.bind(that)({Severity: "Error", Message: error}); //$NON-NLS-0$
								that._markOperationAsFailed.bind(that)(operationJson, error, secondArg);
								result.errback(error, secondArg);
								});
					}, 2000);
				} else if (operationJson && operationJson.Result) {
					that._serviceRegistry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
					var severity = this._operationsDialog.parseProgressResult(operationJson.Result).Severity;
					if(severity==="Error" || severity==="Warning"){ //$NON-NLS-1$ //$NON-NLS-0$
						operationJson.Result.failedOperation = {Location: operationLocation, Id: operationJson.Id, Name: operationJson.Name};
						result.resolve(operationJson);
						window.setTimeout(function(){
								that._operationsDialog.show();							
						}, 10);
					}else{
						result.resolve(operationJson);
					}
					
					if(!operationJson.Failed && operationJson.Idempotent===true){
						window.setTimeout(function() {
							that.removeOperation.bind(that)(operationLocation, operationJson.Id);
						}, 5000);
					}
				}
				
				return result;
			},
			removeOperation: function(operationLocation, operationId){
				var that = this;
				if(operationId){
					if(this._lastOperation!==null && this._lastOperation.Id === operationId){
						this._lastOperation = null;
					}
				}
				that._operationsClient.removeOperation.bind(that._operationsClient)(operationLocation).then(function(){
					that.removeOperationFromTheList.bind(that)(operationId);
				});
			},
			removeOperationFromTheList: function(operationId){
				if(this._lastOperation!==null && this._lastOperation.Id === operationId){
					this._lastOperation = null;
				}
				
				var operations = this._operations; //$NON-NLS-1$ //$NON-NLS-0$
				for(var i=0; i<operations.Children.length; i++){
					var operation = operations.Children[i];
					if(operation.Id && operation.Id===operationId){
						operations.Children.splice(i, 1);
						break;
					}
				}
				this._operations = operations; //$NON-NLS-0$
				this._generateOperationsInfo(operations); 
			},
			removeCompletedOperations: function(){
				var operations = this._operations; //$NON-NLS-1$ //$NON-NLS-0$
				for(var i=operations.Children.length-1; i>=0; i--){
					var operation = operations.Children[i];
					if(!operation.Running){
						operations.Children.splice(i, 1);
					}
				}
				this._operations = operations; //$NON-NLS-0$
				this._generateOperationsInfo(operations);
			},
			setProgressResult: function(result){
				this._serviceRegistry.getService("orion.page.message").setProgressResult(result); //$NON-NLS-0$
			},
			/**
			 * Shows a progress message until the given deferred is resolved. Returns a deferred that resolves when
			 * the operation completes.
			 * @param deferred {dojo.Deferred} Deferred to track
			 * @param message {String} Message to display
			 * @returns
			 */
			showWhile: function(deferred, message){
				if(message) {
					this._serviceRegistry.getService("orion.page.message").setProgressMessage(message); //$NON-NLS-0$
				}
				var that = this;
				return deferred.then(function(jsonResult){
					//see if we are dealing with a progress resource
					if (jsonResult && jsonResult.Location && jsonResult.Message && jsonResult.Running) {
						return that.followOperation.bind(that)(jsonResult, null, jsonResult.Location);
					}
					//clear the progress message
					that._serviceRegistry.getService("orion.page.message").setProgressMessage(""); //$NON-NLS-0$
					return jsonResult;
				}, function(jsonError){
					that.setProgressResult.bind(that)(jsonError);
					return jsonError;
				});
			},
			
			/**
			 * Add a listener to be notified about a finish of a operation on given topic
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
			writeOperation: function(operationj){
				var operationJson = JSON.parse(JSON.stringify(operationj));
				this._lastOperation = operationJson;
				var operations = this._operations;
				for(var i=0; i<operations.Children.length; i++){
					var operation = operations.Children[i];
					if((typeof operation.Id !== 'undefined') && operation.Id===operationJson.Id){//$NON-NLS-0$
						operations.Children.splice(i, 1);
						break;
					}
				}
				
				operationJson.lastClientDate = new Date();
				operations.Children.push(operationJson);
				//update also the last list update
				operations.lastClientDate = new Date();
				this._operations = operations;
				this._generateOperationsInfo(operations); 
			}
	};
			
	ProgressService.prototype.constructor = ProgressService;
	//return module exports
	return {ProgressService: ProgressService};
	
});
