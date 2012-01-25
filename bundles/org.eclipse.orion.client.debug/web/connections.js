/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:-
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define orion localStorage*/
/*jslint browser:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient',
	'orion/searchClient', 'orion/globalCommands', 'debug/connectionsTree', 'orion/treetable', 'debug/debugTab', 'debug/portInputDialog'], 
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConnectionsTree, mTreeTable, mDebugTab) {

	var treeWidget;

	var model = new mConnectionsTree.DebugConnectionTreeModel("debug-tableTree");	
	function modelUpdated() {
		model.getRoot(function(root) {
			model.getChildren(root, function(children) {
				treeWidget.refreshAndExpand(root, children);
				for (var i = 0; i < children.length; i++) {
					treeWidget.refreshAndExpand(children[i], children[i].getChildren());
				}
			});
		});
	}

	function initiateConnection(portString) {
		var port = parseInt(portString, 10);
		if (1000 <= port && port < 65535) {
			var label = dojo.create("label", {id: "debug-port-" + port});
			label.style.display = "none";
			label.innerHTML = port;
			dojo.place(label, "orion-debugMessaging", "first");
		}
	}

	var RemoteDebugConnection = (function() {
		function RemoteDebugConnection(port) {
			this._tabs = [];
			this._port = port;
		}
		RemoteDebugConnection.prototype = /** @lends RemoteDebugConnection.prototype */ {
			addTab: function(value) {
				this._tabs.push(value);
			},
			disconnect: function(value) {
				for (var i = this._tabs.length - 1; i >= 0; i--) {
					var current = this._tabs[i];
					if (!value || current === value) {
						current.close();
						this._tabs.splice(i, 1);
						if (value) {
							return;
						}
					}
				}
			},
			getChildren: function() {
				var result = [];
				for (var i = 0; i < this._tabs.length; i++) {
					result.push(new RemoteDebugTabProvider(this._tabs[i]));
				}
				return result;
			},
			getPort: function() {
				return this._port;
			},
			getTabs: function() {
				return this._tabs;
			},
			removeTab: function(tab) {
				for (var i = 0; i < this._tabs.length; i++) {
					var current = this._tabs[i];
					if (current === tab) {
						this._tabs.splice(i, 1);
						return;
					}
				}
			},
			renderLabel: function(column) {
				dojo.create("label", {innerHTML: this.toString().bold()}, column, "last");
			},
			shouldDisplayActions: function() {
				return true;
			},
			toString: function() {
				return "Chrome browser on port " + this._port;
			}
		};
		return RemoteDebugConnection;
	}());

	// TODO this should move to debugTab.js
	var RemoteDebugTabProvider = (function() {
		function RemoteDebugTabProvider(remoteDebugTab) {
			this._remoteDebugTab = remoteDebugTab;
		}
		RemoteDebugTabProvider.prototype = /** @lends RemoteDebugTabProvider.prototype */{
			getChildren: function() {
				return [];
			},
			getRemoteDebugTab: function() {
				return this._remoteDebugTab;
			},
			getUrl: function() {
				return this._remoteDebugTab.getUrl();
			},
			getWSUrl: function() {
				return this._remoteDebugTab.getWSUrl();
			},
			renderLabel: function(column) {
				var wsUrl = this.getWSUrl();
				if (wsUrl) {
					var base = require.toUrl("debug/debug.html");
					var url = base + "#" + wsUrl;
					var urlLink = dojo.create("a", {href: url}, column, "last");
					dojo.place(document.createTextNode(this.getUrl() || "< Loading >"), urlLink, "last");
				} else {
					dojo.create("label", {innerHTML: this.getUrl() + " [currently not debuggable]"}, column, "last");
				}
			},
			shouldDisplayActions: function() {
				return false;
			},
			toString: function() {
				return this.getWSUrl();
			}
		};
		return RemoteDebugTabProvider;
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

			var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
			if (!isChrome) {
				var label = dojo.create("label");
				label.innerHTML = "Sorry, Debug is currently only supported for Google Chrome browsers.";
				dojo.place(label, "debugConnections-table", "first");
				return;
			}

			var renderer = new mConnectionsTree.DebugConnectionRenderer(commandService);
			treeWidget = new mTreeTable.TableTree({
				id: "debug-tableTree",
				parent: dojo.byId("debugConnections-table"),
				model: model,
				showRoot: false,
				renderer: renderer
			});

			var connectCommand = new mCommands.Command({
				name: "Connect",
				tooltip: "Connect to a new browser",
				id: "orion.debugConnections.connect",
				groupId: "orion.debugGroup",
				visibleWhen: function(item) {
					return isChrome;
				},
				callback: function() {
					var dialog = new orion.debug.PortInputDialog({
						serviceRegistry: serviceRegistry,
						func: function(port) {
							initiateConnection(port);
						}
					});
					dialog.startup();
					dialog.show();
				}
			});
			commandService.addCommand(connectCommand, "dom");

			var disconnectCommand = new mCommands.Command({
				name: "Disconnect",
				tooltip: "Disconnect",
				imageClass: "core-sprite-problem",
				id: "orion.debugConnections.disconnect",
				visibleWhen: function(item) {
					return true;
				},
				callback: function(data) {
					var connection = data.items;
					connection.disconnect();
					model.removeConnection(connection);
					modelUpdated();

					var port = connection.getPort();
					var portsString = localStorage.getItem("orion.debug.chromeDebugPorts");
					var portsObject = portsString ? JSON.parse(portsString) : {};
					if (portsObject[port]) {
						delete portsObject[port];
						portsString = JSON.stringify(portsObject);
						localStorage.setItem("orion.debug.chromeDebugPorts", portsString);
					}
				}
			});
			commandService.addCommand(disconnectCommand, "object");

			commandService.registerCommandContribution("orion.debugConnections.connect", 1, "pageActions");
			commandService.registerCommandContribution("orion.debugConnections.disconnect", 1);
			mGlobalCommands.generateDomCommandsInBanner(commandService, {});

			var debugMessaging = dojo.byId("orion-debugMessaging");
			if (debugMessaging) {
				var treeModel = model;
				debugMessaging.addEventListener("DOMNodeInserted", function() {
					var changed = false;
					var children = debugMessaging.childNodes;
					for (var i = 0; i < children.length; i++) {
						var current = children[i];
						if (current.id.indexOf("debug-response-") === 0) {
							var info = JSON.parse(current.innerHTML);
							debugMessaging.removeChild(current);

							var port = current.id.substring("debug-response-".length);
							var connection = new RemoteDebugConnection(port);
							if (treeModel.addConnection(connection)) {
								var urlChangedFunction = function() {
									modelUpdated();
								};
								var tabClosedFunction = function(remoteDebugTab) {
									connection.disconnect(remoteDebugTab);
									if (connection.getTabs().length === 0) {
										treeModel.removeConnection(connection);
									}
									modelUpdated();
								};
								for (var j = 0; j < info.length; j++) {
									var current = info[j];
									var remoteDebugTab = new mDebugTab.RemoteDebugTab(current.webSocketDebuggerUrl, current.url);
									remoteDebugTab.addUrlListener(urlChangedFunction);
									remoteDebugTab.addCloseListener(tabClosedFunction);
									connection.addTab(remoteDebugTab);
								}
	
								var portsString = localStorage.getItem("orion.debug.chromeDebugPorts");
								var portsObject = portsString ? JSON.parse(portsString) : {};
								if (!portsObject[port]) {
									portsObject[port] = true;
									portsString = JSON.stringify(portsObject);
									localStorage.setItem("orion.debug.chromeDebugPorts", portsString);
								}
								changed = true;
							}
						}
					}

					if (changed) {
						modelUpdated();
					}
				});
			}

			var portsString = localStorage.getItem("orion.debug.chromeDebugPorts");
			if (portsString) {
				var portsObject = JSON.parse(portsString);
				for (var port in portsObject) {
					initiateConnection(port);
				}
			}
		});
	});
});
