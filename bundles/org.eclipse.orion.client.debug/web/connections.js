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

/*global define orion*/
/*jslint browser:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient',
	'orion/searchClient', 'orion/globalCommands', 'debug/connectionsTree', 'orion/treetable', 
	'orion/widgets/NewSiteDialog'], 
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConnectionsTree, mTreeTable) {

	var treeWidget;
	var model = new mConnectionsTree.DebugConnectionTreeModel("debug-tableTree");	
	function modelUpdated() {
		model.getRoot(function(root) {
			model.getChildren(root, function(children) {
				treeWidget.refreshAndExpand(root, children);
				for (var i = 0; i < children.length; i++) {
					treeWidget.refreshAndExpand(children[i], children[i].getConnections());
				}
			});
		});
	}

	var RemoteDebugConnection = (function() {
		function RemoteDebugConnection(info) {
			this._connections = [];
			var socketString = info.webSocketDebuggerUrl;
			var start = socketString.indexOf(':');
			start = socketString.indexOf(':', start + 1);
			var end = socketString.indexOf('/', start);
			this._port = socketString.substring(start + 1, end);
		}
		RemoteDebugConnection.prototype = /** @lends RemoteDebugConnection.prototype */ {
			addConnection: function(value) {
				this._connections.push(value);
			},
			getChildren: function() {
				return this.getConnections();
			},
			getConnections: function() {
				return this._connections;
			},
			renderLabel: function(column) {
				dojo.place(document.createTextNode(this.toString()), column, "last");
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

	var RemoteDebugTab = (function() {
		function RemoteDebugTab(info) {
			this._wsUrl = info.webSocketDebuggerUrl;
			this._url = info.url;
		}
		RemoteDebugTab.prototype = /** @lends RemoteDebugTab.prototype */{
			getChildren: function() {
				return [];
			},
			getUrl: function() {
				return this._url;
			},
			getWSUrl: function() {
				return this._wsUrl;
			},
			renderLabel: function(column) {
				var base = require.toUrl("debug/debug.html");
				var url = base + "#" + this.getWSUrl();
				var urlLink = dojo.create("a", {href: url}, column, "last");
				dojo.place(document.createTextNode(this.getUrl()), urlLink, "last");
			},
			shouldDisplayActions: function() {
				return false;
			},
			toString: function() {
				return this.getWSUrl();
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

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher);

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

			var disconnectCommand = new mCommands.Command({
				name: "Disconnect",
				tooltip: "Disconnect from the target",
				imageClass: "core-sprite-problem",
				id: "orion.debugConnections.disconnect",
				visibleWhen: function(item) {
					return true;
				},
				callback: function(data) {
					// TODO
				}
			});
			commandService.addCommand(disconnectCommand, "object");

			commandService.registerCommandContribution("orion.debugConnections.connect", 1, "pageActions");
			/* uncomment the following line to re-introduce the Disconnect action */
		//	commandService.registerCommandContribution("orion.debugConnections.disconnect", 1);
			mGlobalCommands.generateDomCommandsInBanner(commandService, {});

			var debugMessaging = dojo.byId("orion-debugMessaging");
			if (debugMessaging) {
				var treeModel = model;
				debugMessaging.addEventListener("DOMNodeInserted", function() {
					var responseLabel = dojo.byId("debug-response");
					if (!responseLabel) {
						return;
					}
					var info = JSON.parse(responseLabel.innerHTML);
					debugMessaging.removeChild(responseLabel);

					var connection = new RemoteDebugConnection(info[0]);
					for (var i = 0; i < info.length; i++) {
						var tab = new RemoteDebugTab(info[i]);
						connection.addConnection(tab);
					}
					treeModel.addConnection(connection);
					modelUpdated();
				});
			}
		});
	});
});
