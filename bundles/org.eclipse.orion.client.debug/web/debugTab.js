/*******************************************************************************
* @license
* Copyright (c) 2011, 2012 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials are made
* available under the terms of the Eclipse Public License v1.0
* (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
* License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
*
* Contributors:
 *     IBM Corporation - initial API and implementation
*******************************************************************************/

/*global define WebSocket*/

define(['require', 'dojo'], function(require, dojo) {

	var orion = {};
	orion.debug = {};

	var StatesEnum = {
		STATE_DISCONNECTED: 0,
		STATE_CONNECTED: 1,
		STATE_ENABLED: 2,
		STATE_SUSPENDING: 3,
		STATE_RESUMING: 4,
		STATE_SUSPENDED: 5
	};
			
	orion.debug.RemoteDebugTab = (function() {
		function RemoteDebugTab(wsUrl, url) {
			this._wsUrl = wsUrl;
			this._url = url;

			this._nextId = 1;
			this._state = StatesEnum.STATE_DISCONNECTED;
			this._pendingResponses = [];
			this._detachListeners = [];
			this._urlListeners = [];
		}
		RemoteDebugTab.prototype = /** @lends RemoteDebugTab.prototype */{
			addDetachListener: function(listener) {
				this._detachListeners.push(listener);
			},
			addUrlListener: function(listener) {
				this._urlListeners.push(listener);
			},
			attach: function(callback) {
				var pendingCallback = callback;
				if (this._wsUrl) {
					this._socket = new WebSocket(this._wsUrl);
					var self = this;
					this._socket.onmessage = function(evt) {
						self._handleMessage(evt.data);
					};
					this._socket.onclose = function(evt) {
						self._state = StatesEnum.STATE_DISCONNECTED;
						if (pendingCallback) {
							pendingCallback("Failed to connect, remote tab is likely closed or has another debugger attached");
							pendingCallback = null;
							return;
						}
						for (var i = 0; i < self._detachListeners.length; i++) {
							self._detachListeners[i](self);
						}
					};
					this._socket.onopen = function(evt) {
						self._state = StatesEnum.STATE_CONNECTED;
						self.enable(pendingCallback);
						pendingCallback = null;
						if (!self._url) {
							self._updateUrl();
						}
					};
				}
			},
			detach: function(callback) {
				if (this._socket) {
					this._socket.close();
				}
				if (callback) {
					callback();
				}
			},
			enable: function(callback) {
				if (!this._socket || this._state !== StatesEnum.STATE_CONNECTED) {
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
							if (!event.error) {
								self._state = StatesEnum.STATE_ENABLED;
							}
							if (callback) {
								callback(event.error);
							}
						}
					});
				}
				return result;
			},
			evaluate: function(expression, callback) {
				if (!this._socket ||
					(this._state !== StatesEnum.STATE_SUSPENDED && this._state !== StatesEnum.STATE_ENABLED)) {
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
							if (callback) {
								callback(event.error ? {error: event.error.message} : {result: event.result.result});
							}
						}
					});
				}
				return result;
			},
			getUrl: function() {
				return this._url;
			},
			getWSUrl: function() {
				return this._wsUrl;
			},
			removeDetachListener: function(listener) {
				for (var i = 0; i < this._detachListeners.length; i++) {
					var current = this._detachListeners[i];
					if (current === listener) {
						this._detachListeners.splice(i, 1);
						return;
					}
				}
			},
			removeUrlListener: function(listener) {
				for (var i = 0; i < this._urlListeners.length; i++) {
					var current = this._urlListeners[i];
					if (current === listener) {
						this._urlListeners.splice(i, 1);
						return;
					}
				}
			},
//			resume: function(callback) {
//				if (!this._socket || this._state !== StatesEnum.STATE_SUSPENDED) {
//					return false;
//				}
//				var request = {
//					id: this._nextId++,
//					method: "Debugger.resume",
//					params: {}
//				};
//				var requestString = JSON.stringify(request);
//				var result = this._socket.send(requestString);
//				if (result) {
//					var self = this;
//					this._pendingResponses.push({
//						id: request.id,
//						action: function(event) {
//							self._state = StatesEnum.STATE_RESUMING;
//							self._resumeListener = callback;
//						}
//					});
//				}
//				return result;
//			},
//			suspend: function(callback) {
//				if (!this._socket || this._state !== StatesEnum.STATE_ENABLED) {
//					return false;
//				}
//				var request = {
//					id: this._nextId++,
//					method: "Debugger.pause",
//					params: {}
//				};
//				var requestString = JSON.stringify(request);
//				var result = this._socket.send(requestString);
//				if (result) {
//					var self = this;
//					this._pendingResponses.push({
//						id: request.id,
//						action: function(event) {
//							self._state = StatesEnum.STATE_SUSPENDING;
//							self._suspendListener = callback;
//						}
//					});
//				}
//				return result;
//			},

			_handleMessage: function(wsMessage) {
				var event = JSON.parse(wsMessage);	
				var method = event.method;
				if (method === "Debugger.paused") {
					this._frameId = event.params.callFrames[0].callFrameId;
					this._state = StatesEnum.STATE_SUSPENDED;
					if (this._suspendListener) {
						this._suspendListener(event.error);
						this._suspendListener = null;
					}
				} else if (method === "Debugger.resumed") {
					this._frameId = null;
					this._state = StatesEnum.STATE_ENABLED;
					if (this._resumeListener) {
						this._resumeListener(event.error);
						this._resumeListener = null;
					}
				// TODO replace the following two with the new event
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
				if (!this._socket) {
					return false;
				}
				
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
					var self = this;
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							if (event.error) {
								// maybe display error somehow
							} else {
								var value = event.result.result.value;
								self._url = value;
								for (var i = 0; i < self._urlListeners.length; i++) {
									self._urlListeners[i](self._url, self);
								}
							}
						}
					});
					return true;
				}
				return false;
			}
		};
		return RemoteDebugTab;
	}());

	orion.debug.LocalDebugTab = (function() {
		function LocalDebugTab(id, messaging, url) {
			this._id = id;
			this._messaging = messaging;
			this._url = url;

			this._state = StatesEnum.STATE_DISCONNECTED;
			this._detachListeners = [];
			this._pendingResponses = [];
			this._urlListeners = [];
			
			var self = this;
			messaging.addEventListener(id, function(event, data) {
				if (event === "detached") {
					self._state = StatesEnum.STATE_DISCONNECTED;
					for (var j = 0; j < self._detachListeners.length; j++) {
						self._detachListeners[j](self);
					}
				} else if (event === "updateUrl") {
					self._url = data.url;
					for (var i = 0; i < self._urlListeners.length; i++) {
						self._urlListeners[i](self._url, self);
					}
				}
			});
		}

		LocalDebugTab.prototype = /** @lends LocalDebugTab.prototype */{
			addDetachListener: function(listener) {
				this._detachListeners.push(listener);
			},
			addUrlListener: function(listener) {
				this._urlListeners.push(listener);
			},
			attach: function(callback) {
				if (this._state === StatesEnum.STATE_CONNECTED || this._state === StatesEnum.STATE_ENABLED) {
					if (callback) {
						callback();
					}
					return;
				}
				var self = this;
				this._messaging.send("attach", {id: this._id}, function(result) {
					if (result.error) {
						if (callback) {
							callback(result.error.message);
						}
						return;
					}
					self._state = StatesEnum.STATE_CONNECTED;
					self.enable(callback);
				});
			},
			detach: function(callback) {
				if (this._state === StatesEnum.STATE_DISCONNECTED) {
					if (callback) {
						callback();
					}
					return;
				}
				var self = this;
				this._messaging.send("detach", {id: this._id}, function (result) {
					if (result.error) {
						if (callback) {
							callback(result.error.message);
						}
						return;
					}
					self._state = StatesEnum.STATE_DISCONNECTED;
					for (var j = 0; j < self._detachListeners.length; j++) {
						self._detachListeners[j](self);
					}
					if (callback) {
						callback();
					}
				});
			},
			enable: function(callback) {
				var self = this;
				this._messaging.send("send-command", {id: this._id, command: "Debugger.enable", args: {}}, function(result) {
					if (result.error) {
						if (callback) {
							callback(result.error.message);
						}
						return;
					}
					self._state = StatesEnum.STATE_ENABLED;
					if (!self._url) {
						self._updateUrl();
					}
					if (callback) {
						callback();
					}
				});
			},
			evaluate: function(expression, callback) {
				if (this._state !== StatesEnum.STATE_SUSPENDED && this._state !== StatesEnum.STATE_ENABLED) {
					return false;
				}
				var resultListener = function(result) {
					if (result.error) {
						if (callback) {
							callback({error: result.error.message});
						}
						return;
					}
					if (callback) {
						callback({result: result.result.result});
					}
				};
				
				if (this._frameId) {
					this._messaging.send(
						"send-command",
						{id: this._id, command: "Debugger.evaluateOnCallFrame", args: {callFrameId: this._frameId, expression: expression}},
						resultListener);
				} else {
					this._messaging.send(
						"send-command",
						{id: this._id, command: "Runtime.evaluate", args: {expression: expression}},
						resultListener);
				}
			},
			getId: function() {
				return this._id;
			},
			getUrl: function() {
				return this._url;
			},
			removeDetachListener: function(listener) {
				for (var i = 0; i < this._detachListeners.length; i++) {
					var current = this._detachListeners[i];
					if (current === listener) {
						this._detachListeners.splice(i, 1);
						return;
					}
				}
			},
			removeUrlListener: function(listener) {
				for (var i = 0; i < this._urlListeners.length; i++) {
					var current = this._urlListeners[i];
					if (current === listener) {
						this._urlListeners.splice(i, 1);
						return;
					}
				}
			},
			_updateUrl: function() {
				var self = this;
				this._messaging.send("get-url", {id: this._id}, function(result) {
					if (result.error) {
						// TODO log
						return;
					}
					self._url = result.url;
					for (var i = 0; i < self._urlListeners.length; i++) {
						self._urlListeners[i](self._url, self);
					}
				});
				return true;
			}
		};
		return LocalDebugTab;
	}());

	return orion.debug;
});
