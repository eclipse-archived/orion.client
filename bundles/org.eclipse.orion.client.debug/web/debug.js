/*******************************************************************************
* @license
* Copyright (c) 2011, 2012 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials are made
* available under the terms of the Eclipse Public License v1.0
* (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
* License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
*
* Contributors:
* 	IBM Corporation - initial API and implementation
*******************************************************************************/

/*global define WebSocket*/
/*jslint browser:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands', 'orion/console'], 
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConsole) {
	
	var console;
	var commandService;

	var RemoteDebugTab = (function() {
		function RemoteDebugTab(wsUrl) {
			this._nextId = 1;
			this._state = this.StatesEnum.STATE_DISCONNECTED;
			this._wsUrl = wsUrl;
			this._pendingResponses = [];
			this._socket = new WebSocket(wsUrl);
			var self = this;
			this._socket.onmessage = function(evt) {
				self._handleMessage(evt.data);
			};
			this._socket.onclose = function(evt) {
				self._state = self.StatesEnum.STATE_DISCONNECTED;
				var location = dojo.byId("location");
		        if (location) {
					location.innerHTML = null;
		        }
				console.appendOutput("<< Disconnected from external browser >>");
				console.setAcceptInput(false);
			};
			this._socket.onopen = function(evt) {
				self._state = self.StatesEnum.STATE_CONNECTED;
				self.enable();
				self._updateUrl();
			};
		}
		RemoteDebugTab.prototype = /** @lends RemoteDebugTab.prototype */{
			enable: function() {
				if (this._state !== this.StatesEnum.STATE_CONNECTED) {
					return false;
				}
				var request = {
					id: this._nextId++,
					method: "Debugger.enable",
					params: {}
				};
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					var self = this;
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							self._state = self.StatesEnum.STATE_ENABLED;
						}
					});
				}
				return result;
			},
			evaluate: function(expression) {
				if (this._state !== this.StatesEnum.STATE_SUSPENDED &&
						this._state !== this.StatesEnum.STATE_ENABLED) {
					return false;
				}
				var request;
				if (this._frameId) {
					request = {
						id: this._nextId++,
						method: "Debugger.evaluateOnCallFrame",
						params: {
							callFrameId: this._frameId,
							expression: expression
						}
					};
				} else {
					request = {
						id: this._nextId++,
						method: "Runtime.evaluate",
						params: {
							expression: expression
						}
					};
				}
				
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							console.appendOutput(JSON.stringify(event.result.result));
						}
					});
				}
				return result;
			},
			getState: function() {
				return this._state;
			},
			getUrl: function() {
				return this._url;
			},
			resume: function() {
				if (this._state !== this.StatesEnum.STATE_SUSPENDED) {
					return false;
				}
				var request = {
					id: this._nextId++,
					method: "Debugger.resume",
					params: {}
				};
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					var self = this;
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							self._state = self.StatesEnum.STATE_RESUMING;
						}
					});
				}
				return result;
			},
			suspend: function() {
				if (this._state !== this.StatesEnum.STATE_ENABLED) {
					return false;
				}
				var request = {
					id: this._nextId++,
					method: "Debugger.pause",
					params: {}
				};
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					var self = this;
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							self._state = self.StatesEnum.STATE_SUSPENDING;
						}
					});
				}
				return result;
			},
			
			_handleMessage: function(wsMessage) {
				var event = JSON.parse(wsMessage);	
				var method = event.method;
				if (method === "Debugger.paused") {
					this._frameId = event.params.callFrames[0].callFrameId;
					this._state = this.StatesEnum.STATE_SUSPENDED;
				} else if (method === "Debugger.resumed") {
					this._frameId = null;
					this._state = this.StatesEnum.STATE_ENABLED;
				} else if (method === "Debugger.globalObjectCleared") {
					this._url = null;
				} else if (method === "Debugger.scriptParsed") {
					if (!this._url) {
						this._updateUrl();
					}
				} else if (!method) {
					for (var i = 0; i < this._pendingResponses.length; i++) {
						var current = this._pendingResponses[i];
						if (current.id === event.id) {
							current.action(event);
							this._pendingResponses.splice(i, 1);
							break;
						}
					}
				}
			},
			_updateUrl: function() {
				// TODO is there really not a better request to send here?
				var request = {
					id: this._nextId++,
					method: "Runtime.evaluate",
					params: {
						expression: "document.location.href"
					}
				};
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							var value = event.result.result.value;
							if (value === "about:blank") {
								this._url = null;
							} else {
								this._url = value;
							}
							var location = dojo.byId("location");
					        if (location) {
								location.innerHTML = this._url;
					        }
						}
					});
				}
			},
			
			StatesEnum: {
				STATE_DISCONNECTED: "Disconnected",
				STATE_CONNECTED: "Connected",
				STATE_ENABLED: "Debugging",
				STATE_SUSPENDING: "Suspending...",
				STATE_RESUMING: "Resuming...",
				STATE_SUSPENDED: "Suspended"
			}
		};
		return RemoteDebugTab;
	}());

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();

			commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);

			var hash = dojo.hash();
			var connection = new RemoteDebugTab(hash);
			console = new mConsole.Console("debug-console");
			console.addInputListener(function(inputEvent) {
				connection.evaluate(inputEvent);
			});
			
		});
	});
});
