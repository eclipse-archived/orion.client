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

	orion.debug.RemoteDebugTab = (function() {
		function RemoteDebugTab(wsUrl, url) {
			this._nextId = 1;
			this._state = this.StatesEnum.STATE_DISCONNECTED;
			this._pendingResponses = [];
			this._closeListeners = [];
			this._urlListeners = [];
			this._url = url;
			this._wsUrl = wsUrl;
			if (this._wsUrl) {
				this._socket = new WebSocket(this._wsUrl);
				var self = this;
				this._socket.onmessage = function(evt) {
					self._handleMessage(evt.data);
				};
				this._socket.onclose = function(evt) {
					self._state = self.StatesEnum.STATE_DISCONNECTED;
					for (var i = 0; i < self._closeListeners.length; i++) {
						self._closeListeners[i](self);
					}
				};
				this._socket.onopen = function(evt) {
					self._state = self.StatesEnum.STATE_CONNECTED;
					self.enable();
					if (!self._url) {
						self._updateUrl();
					}
				};
			}
		}
		RemoteDebugTab.prototype = /** @lends RemoteDebugTab.prototype */{
			addCloseListener: function(listener) {
				this._closeListeners.push(listener);
			},
			addUrlListener: function(listener) {
				this._urlListeners.push(listener);
			},
			close: function() {
				if (this._socket) {
					this._socket.close();
				}
			},
			enable: function(listener) {
				if (!this._socket || this._state !== this.StatesEnum.STATE_CONNECTED) {
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
							if (listener) {
								listener();
							}
						}
					});
				}
				return result;
			},
			evaluate: function(expression, listener) {
				if (!this._socket ||
					(this._state !== this.StatesEnum.STATE_SUSPENDED && this._state !== this.StatesEnum.STATE_ENABLED)) {
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
							if (listener) {
								listener(event.result.result);
							}
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
			getWSUrl: function() {
				return this._wsUrl;
			},
			removeCloseListener: function(listener) {
				for (var i = 0; i < this._closeListeners.length; i++) {
					var current = this._closeListeners[i];
					if (current === listener) {
						this._closeListeners.splice(i, 1);
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
			resume: function(listener) {
				if (!this._socket || this._state !== this.StatesEnum.STATE_SUSPENDED) {
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
							self._resumeListener = listener;
						}
					});
				}
				return result;
			},
			suspend: function(listener) {
				if (!this._socket || this._state !== this.StatesEnum.STATE_ENABLED) {
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
							self._suspendListener = listener;
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
					if (this._suspendListener) {
						this._suspendListener();
						this._suspendListener = null;
					}
				} else if (method === "Debugger.resumed") {
					this._frameId = null;
					this._state = this.StatesEnum.STATE_ENABLED;
					if (this._resumeListener) {
						this._resumeListener();
						this._resumeListener = null;
					}
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
							var value = event.result.result.value;
							self._url = value;
							for (var i = 0; i < self._urlListeners.length; i++) {
								self._urlListeners[i](self._url, self);
							}
						}
					});
					return true;
				}
				return false;
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

	return orion.debug;
});
