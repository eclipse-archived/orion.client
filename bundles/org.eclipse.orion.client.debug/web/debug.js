/*******************************************************************************
* @license
* Copyright (c) 2011 IBM Corporation and others.
* All rights reserved. This program and the accompanying materials are made
* available under the terms of the Eclipse Public License v1.0
* (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
* License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
*
* Contributors:
* IBM Corporation - initial API and implementation
*******************************************************************************/
/*global define dojo dijit orion window widgets*/
/*jslint browser:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient',
	'orion/searchClient', 'orion/globalCommands', 'debug/debugTree', 'orion/treetable',
	'orion/widgets/NewSiteDialog'],
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mDebugTree, mTreeTable) {
	
	var eclipse = {};
	eclipse.debug = {};
	
	var model = new mDebugTree.DebugConnectionTreeModel("debug-tableTree");
	var treeWidget;
	
	eclipse.debug.RemoteDebugConnection = (function() {
		eclipse.debug.StatesEnum = {
			STATE_DISCONNECTED: "Disconnected",
			STATE_CONNECTED: "Connected",
			STATE_ENABLED: "Debugging",
			STATE_SUSPENDING: "Suspending...",
			STATE_RESUMING: "Resuming...",
			STATE_SUSPENDED: "Suspended"
		};
		
		function RemoteDebugConnection(info) {
			this._nextId = 1;
			this._state = eclipse.debug.StatesEnum.STATE_DISCONNECTED;
			this._wsUrl = info.webSocketDebuggerUrl;
			this._url = info.url;
			this._pendingResponses = [];
			this._socket = new WebSocket(info.webSocketDebuggerUrl);
			var self = this;
			this._socket.onmessage = function(evt) {
				self._handleMessage(evt.data);
			};
			this._socket.onclose = function(evt) {
				self._state = eclipse.debug.StatesEnum.STATE_DISCONNECTED;
				model.getRoot(
					function(root) {
						treeWidget.refreshAndExpand("debug-tableTree", root);
				});
			};
			this._socket.onopen = function(evt) {
				self._state = eclipse.debug.StatesEnum.STATE_CONNECTED;
				model.getRoot(
					function(root) {
						treeWidget.refreshAndExpand("debug-tableTree", root);
				});
			};
		}
		RemoteDebugConnection.prototype = /** @lends eclipse.debug.RemoteDebugConnection.prototype */{
			disable: function() {
				if (this._state !== eclipse.debug.StatesEnum.STATE_ENABLED && this._state !== eclipse.debug.StatesEnum.STATE_SUSPENDED) {
					return false;
				}
				var request = {
					id: this._nextId++,
					method: "Debugger.disable",
					params: {}
				};
				var requestString = JSON.stringify(request);
				var result = this._socket.send(requestString);
				if (result) {
					var self = this;
					this._pendingResponses.push({
						id: request.id,
						action: function(event) {
							self._state = eclipse.debug.StatesEnum.STATE_CONNECTED;
							model.getRoot(
								function(root) {
									treeWidget.refreshAndExpand("debug-tableTree", root);
								}
							);
						}
					});
				}
				return result;
			},
			enable: function() {
				if (this._state !== eclipse.debug.StatesEnum.STATE_CONNECTED) {
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
							self._state = eclipse.debug.StatesEnum.STATE_ENABLED;
							model.getRoot(
								function(root) {
									treeWidget.refreshAndExpand("debug-tableTree", root);
								}
							);
						}
					});
				}
				return result;
			},
			evaluate: function(expression) {
				if (this._state !== eclipse.debug.StatesEnum.STATE_SUSPENDED &&
						this._state !== eclipse.debug.StatesEnum.STATE_ENABLED) {
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
							alert("Evaluation Result: " + JSON.stringify(event.result.result));
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
				if (this._state !== eclipse.debug.StatesEnum.STATE_SUSPENDED) {
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
							self._state = eclipse.debug.StatesEnum.STATE_RESUMING;
							model.getRoot(
								function(root) {
									treeWidget.refreshAndExpand("debug-tableTree", root);
								}
							);
						}
					});
				}
				return result;
			},
			suspend: function() {
				if (this._state !== eclipse.debug.StatesEnum.STATE_ENABLED) {
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
							self._state = eclipse.debug.StatesEnum.STATE_SUSPENDING;
							model.getRoot(
								function(root) {
									treeWidget.refreshAndExpand("debug-tableTree", root);
								}
							);
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
					this._state = eclipse.debug.StatesEnum.STATE_SUSPENDED;
					model.getRoot(
						function(root) {
							treeWidget.refreshAndExpand("debug-tableTree", root);
						}
					);
				} else if (method === "Debugger.resumed") {
					this._frameId = null;
					this._state = eclipse.debug.StatesEnum.STATE_ENABLED;
					model.getRoot(
						function(root) {
							treeWidget.refreshAndExpand("debug-tableTree", root);
						}
					);
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
			}
		};
		return RemoteDebugConnection;
	}());
	
	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);
			
			var renderer = new mDebugTree.DebugConnectionRenderer(commandService);
			treeWidget = new mTreeTable.TableTree({
				id: "debug-tableTree",
				parent: dojo.byId("debug-table"),
				model: model,
				showRoot: false,
				renderer: renderer
			});
			
			var connectCommand = new mCommands.Command({
				name: "Connect",
				tooltip: "Connect to a new browser",
				image: require.toUrl("images/add.gif"),
				id: "eclipse.debug.connect",
				groupId: "eclipse.debugGroup",
				visibleWhen: function(item) {
					return true;
				},
				callback: function() {
					var dialog = new orion.widgets.NewSiteDialog({
						title: "Enter browser debug port",
						serviceRegistry: serviceRegistry,
						func: function(name, workspace) {
							var label = dojo.create("label", {id: "debug-port"});
							label.style.display = "none";
							label.innerHTML = name;
							dojo.place(label, "orion-debugMessaging", "first");
						}
					});
					dialog.startup();
					dialog.show();
				}
			});
			commandService.addCommand(connectCommand, "dom");
			
			var enableCommand = new mCommands.Command({
				name: "Enable",
				tooltip: "Enable the debugger in the target",
				imageClass: "core-sprite-add",
				id: "eclipse.debug.enable",
				visibleWhen: function(item) {
					return item.getState() === eclipse.debug.StatesEnum.STATE_CONNECTED;
				},
				callback: function(item, cmdId, imageId, userData) {
					item.enable();
				}
			});
			commandService.addCommand(enableCommand, "object");
			
			var disableCommand = new mCommands.Command({
				name: "Disable",
				tooltip: "Disable the debugger in the target",
				imageClass: "core-sprite-problem",
				id: "eclipse.debug.disable",
				visibleWhen: function(item) {
					return item.getState() !== eclipse.debug.StatesEnum.STATE_DISCONNECTED &&
						item.getState() !== eclipse.debug.StatesEnum.STATE_CONNECTED;
				},
				callback: function(item, cmdId, imageId, userData) {
					item.disable();
				}
			});
			commandService.addCommand(disableCommand, "object");
			
			var suspendCommand = new mCommands.Command({
				name: "Suspend",
				tooltip: "Suspend execution in the target",
				imageClass: "core-sprite-leftarrow",
				id: "eclipse.debug.suspend",
				visibleWhen: function(item) {
					return item.getState() === eclipse.debug.StatesEnum.STATE_ENABLED;
				},
				callback: function(item, cmdId, imageId, userData) {
					item.suspend();
				}
			});
			commandService.addCommand(suspendCommand, "object");
			
			var evaluateCommand = new mCommands.Command({
				name: "Evaluate",
				tooltip: "Evaluate a JS expression in the target",
				imageClass: "core-sprite-rename",
				id: "eclipse.debug.evaluate",
				visibleWhen: function(item) {
					return item.getState() === eclipse.debug.StatesEnum.STATE_SUSPENDED ||
						item.getState() === eclipse.debug.StatesEnum.STATE_ENABLED;
				},
				callback: function(item, cmdId, imageId, userData) {
					var dialog = new orion.widgets.NewSiteDialog({
						title: "Enter the JS Expression to Evaluate",
						serviceRegistry: serviceRegistry,
						func: function(name, workspace) {
							item.evaluate(name);
						}
					});
					dialog.startup();
					dialog.show();
				}
			});
			commandService.addCommand(evaluateCommand, "object");
			
			var resumeCommand = new mCommands.Command({
				name: "Resume",
				tooltip: "Resume execution in the target",
				imageClass: "core-sprite-rightarrow",
				id: "eclipse.debug.resume",
				visibleWhen: function(item) {
					return item.getState() === eclipse.debug.StatesEnum.STATE_SUSPENDED;
				},
				callback: function(item, cmdId, imageId, userData) {
					item.resume();
				}
			});
			commandService.addCommand(resumeCommand, "object");
			
			commandService.registerCommandContribution("eclipse.debug.connect", 1, "pageActions");
			commandService.registerCommandContribution("eclipse.debug.enable", 1, "connectionActions");
			commandService.registerCommandContribution("eclipse.debug.disable", 2, "connectionActions");
			commandService.registerCommandContribution("eclipse.debug.suspend", 3, "connectionActions");
			commandService.registerCommandContribution("eclipse.debug.evaluate", 4, "connectionActions");
			commandService.registerCommandContribution("eclipse.debug.resume", 5, "connectionActions");
			mGlobalCommands.generateDomCommandsInBanner(commandService, {});
			
			var debugMessaging = dojo.byId("orion-debugMessaging");
			if (debugMessaging) {
				debugMessaging.addEventListener("DOMNodeInserted", function() {
					var responseLabel = dojo.byId("debug-response");
					if (!responseLabel) {
						return;
					}
					var info = JSON.parse(responseLabel.innerHTML);
					var connections = [];
					for (var i = 0; i < info.length; i++) {
						var connection = new eclipse.debug.RemoteDebugConnection(info[i]);
						connections.push(connection);
					}
					model.setRoot(connections);
					treeWidget.refreshAndExpand("debug-tableTree", connections);
				});
			}
		});
	});
});
