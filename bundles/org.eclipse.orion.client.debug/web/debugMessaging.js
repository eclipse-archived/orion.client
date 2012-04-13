/*******************************************************************************
* @license
* Copyright (c) 2012 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials are made
* available under the terms of the Eclipse Public License v1.0
* (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
* License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
*
* Contributors:
*     IBM Corporation - initial API and implementation
*******************************************************************************/

/*global define*/
/*jslint browser:true*/

define(['require', 'dojo'], function(require, dojo) {

	var orion = {};
	orion.debug = {};

	orion.debug.DebugMessaging = (function() {
		function DebugMessaging(id) {
			this._id = id;

			this._counter = 0;
			this._eventListeners = {};
			this._pendingRequests = {};
			this._initialize();
		}
		DebugMessaging.prototype = /** @lends DebugMessaging.prototype */{
			_initialize: function() {
				this._incoming = dojo.byId("orion-debugMessaging-toPage");
				this._outgoing = dojo.byId("orion-debugMessaging-toExtension");

				if (this._incoming) {
					this.send("add-event-target");
					var self = this;
					this._incoming.addEventListener("DOMNodeInserted", function() {
						var children = self._incoming.childNodes;
						for (var i = children.length - 1; i >= 0; i--) {
							var current = children[i];
							self._incoming.removeChild(current);
							var response = self._pendingRequests[current.id];
							if (response) {
								response(JSON.parse(current.innerText).data);
							} else if (current.id.indexOf("event-") === 0) {
								var start = current.id.indexOf("-") + 1;
								var end = current.id.indexOf("-", start);
								var content = JSON.parse(current.innerText);
								var listenerId = current.id.substring(start, end);
								if (listenerId === "global") {
									for (var current in self._eventListeners) {
										self._eventListeners[current](content.id, content.data);
									}
								} else {
									var listener = self._eventListeners[listenerId];
									if (listener) {
										listener(content.id, content.data);
									}
								}
							}
						}
					});
				}		
			},
			addEventListener: function(id, func) {
				this._eventListeners[id] = func;
			},
			getId: function() {
				return this._id;
			},
			removeEventListener: function(id) {
				delete this._eventListeners[id];
			},
			send: function(requestId, data, response) {
				if (!this._outgoing) {
					return false;
				}

				var messageId = "req-" + this._counter++;
				if (response) {
					this._pendingRequests[messageId] = response;
				}
				var label = dojo.create("label", {id: messageId});
				var content = {id: requestId, data: data || {}};
				label.innerText = JSON.stringify(content);
				label.style.display = "none";
				dojo.place(label, this._outgoing, "first");
				return true;
			},
			verifyExtension: function(callback) {
				var timer = setTimeout(
					function() {callback("The Orion Debug Extension for Chrome must be installed in order to use debug.");},
					999);
				var self = this;
				this.send("get-version", null, function(result) {
					clearTimeout(timer);
					if (result.version) {
						if (result.version === self.REQUIRED_VERSION) {
							callback();
						} else {
							callback("An updated version of the Orion Debug Extension for Chrome must be installed in order to use debug.");
						}
					} else {
						callback("The Orion Debug Extension for Chrome must be installed in order to use debug.");
					}
				});
			},
			REQUIRED_VERSION: "0.4"
		};
		return DebugMessaging;
	}());
	
	return orion.debug;
});
