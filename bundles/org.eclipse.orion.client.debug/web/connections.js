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

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/searchClient',
	'orion/globalCommands', 'debug/connectionsTree', 'orion/treetable', 'debug/debugTab', 'debug/debugMessaging',
	'debug/portInputDialog'], 
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConnectionsTree, mTreeTable, mDebugTab, mDebugMessaging) {

	var treeWidget;

	var model = new mConnectionsTree.DebugConnectionTreeModel("debug-tableTree");
	function modelUpdated() {
		model.getRoot(function(root) {
			model.getChildren(root, function(children) {
				treeWidget.refresh(root, children, true);
				for (var i = 0; i < children.length; i++) {
					treeWidget.refresh(children[i], children[i].getChildren(), true);
				}
			});
		});
	}

	var messaging = new mDebugMessaging.DebugMessaging("connectionsPage");

	var RemoteDebugTabProvider = (function() {
		function RemoteDebugTabProvider(debugTab) {
			this._debugTab = debugTab;
		}
		RemoteDebugTabProvider.prototype = /** @lends RemoteDebugTabProvider.prototype */{
			getChildren: function() {
				return [];
			},
			getUrl: function() {
				return this._debugTab.getUrl();
			},
			getWSUrl: function() {
				return this._debugTab.getWSUrl();
			},
			renderLabel: function(column) {
				var wsUrl = this.getWSUrl();
				if (wsUrl) {
					var base = require.toUrl("debug/debug.html");
					var url = base + "#" + wsUrl;
					var urlLink = dojo.create("a", {href: url}, column, "last");
					dojo.place(document.createTextNode(this.getUrl() || "< Loading >"), urlLink, "last");
				} else {
					dojo.create("label", {innerHTML: this.getUrl() + " [debugger attached]"}, column, "last");
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
						current.detach();
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
			getId: function() {
				return this.getPort();
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

	function initiateRemoteConnection(port) {
		messaging.send("connect-port", {port: port}, function(data) {
			if (data.error) {
				// TODO log
				return;
			}
			var tabs = data.tabs;
			var connection = new RemoteDebugConnection(port);
			if (model.addConnection(connection)) {
//				var urlChangedFunction = function() {
//					modelUpdated();
//				};
//				var tabClosedFunction = function(remoteDebugTab) {
//					connection.disconnect(remoteDebugTab);
//					if (connection.getTabs().length === 0) {
//						model.removeConnection(connection);
//					}
//					modelUpdated();
//				};
				for (var j = 0; j < tabs.length; j++) {
					var current = tabs[j];
					var remoteDebugTab = new mDebugTab.RemoteDebugTab(current.webSocketDebuggerUrl, current.url);
//					remoteDebugTab.addUrlListener(urlChangedFunction);
//					remoteDebugTab.addDetachListener(tabClosedFunction);
					connection.addTab(remoteDebugTab);
				}
	
				var portsString = localStorage.getItem("orion.debug.chromeDebugPorts");
				var portsObject = portsString ? JSON.parse(portsString) : {};
				if (!portsObject[port]) {
					portsObject[port] = true;
					portsString = JSON.stringify(portsObject);
					localStorage.setItem("orion.debug.chromeDebugPorts", portsString);
				}
				modelUpdated();
			}
		});
	}

	var LocalDebugTabProvider = (function() {
		function LocalDebugTabProvider(debugTab) {
			this._debugTab = debugTab;
		}
		LocalDebugTabProvider.prototype = /** @lends LocalDebugTabProvider.prototype */{
			getChildren: function() {
				return [];
			},
			getUrl: function() {
				return this._debugTab.getUrl();
			},
			renderLabel: function(column) {
				var base = require.toUrl("debug/debug.html");
				var url = base + "#id" + this._debugTab.getId();
				var urlLink = dojo.create("a", {href: url}, column, "last");
				dojo.place(document.createTextNode(this.getUrl() || "< Loading >"), urlLink, "last");
			},
			shouldDisplayActions: function() {
				return false;
			},
			toString: function() {
				return this.getUrl();
			}
		};
		return LocalDebugTabProvider;
	}());

	var LocalDebugConnection = (function() {
		function LocalDebugConnection() {
			this._tabs = [];
		}
		LocalDebugConnection.prototype = /** @lends LocalDebugConnection.prototype */ {
			addTab: function(value) {
				this._tabs.push(value);
			},
			disconnect: function(value) {
				for (var i = this._tabs.length - 1; i >= 0; i--) {
					var current = this._tabs[i];
					if (!value || current === value) {
						current.detach();
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
					result.push(new LocalDebugTabProvider(this._tabs[i]));
				}
				return result;
			},
			getId: function() {
				return "local";
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
				return false;
			},
			toString: function() {
				return "Local Chrome browser";
			}
		};
		return LocalDebugConnection;
	}());

	function refreshAvailableTabs() {
		model.clear();
		messaging.send("connect-local", null, function(result) {
			var tabs = result.tabs;
			var localDebugConnection;
			messaging.send("get-id", null, function(result) {
				var selfTabId = result.id;
				var urlChangedFunction = function() {
					modelUpdated();
				};
				for (var j = 0; j < tabs.length; j++) {
					var currentTab = tabs[j];									
					if (currentTab.id !== selfTabId) {
						var localDebugTab = new mDebugTab.LocalDebugTab(currentTab.id, messaging, currentTab.url);
						localDebugTab.addUrlListener(urlChangedFunction);
						if (!localDebugConnection) {
							localDebugConnection = new LocalDebugConnection();
							model.addConnection(localDebugConnection);
						}
						localDebugConnection.addTab(localDebugTab);
					}
				}
				modelUpdated();
			});
		});

		var portsString = localStorage.getItem("orion.debug.chromeDebugPorts");
		if (portsString) {
			var portsObject = JSON.parse(portsString);
			for (var port in portsObject) {
				initiateRemoteConnection(parseInt(port, 10));
			}
		}
	}

	messaging.addEventListener(messaging.getId(), function(event, data) {
		if (event === "tabCreated" || event === "tabRemoved") {
			refreshAvailableTabs();
		}
	});

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

			messaging.verifyExtension(function(result) {
				if (result) {
					var label = dojo.create("label");
					label.innerHTML = result;
					dojo.place(label, "debugConnections-table", "first");
					var url = require.toUrl("debug/ext/debugChromeExtension.crx");
					var urlLink = dojo.create("a", {href: url}, "debugConnections-table", "last");
					dojo.place(document.createTextNode("   [Click to install it]"), urlLink, "last");
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
								if (port && 1000 <= port && port < 65535) {
									initiateRemoteConnection(port);
								}
							}
						});
						dialog.startup();
						dialog.show();
					}
				});
				commandService.addCommand(connectCommand);
	
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
				commandService.addCommand(disconnectCommand);
	
				// the following are intentionally commented
//				commandService.registerCommandContribution("pageActions", "orion.debugConnections.connect", 2);
//				commandService.registerCommandContribution("connectionCommands", "orion.debugConnections.disconnect", 1);
				mGlobalCommands.generateDomCommandsInBanner(commandService, {});
				refreshAvailableTabs();
			});
		});
	});
});


