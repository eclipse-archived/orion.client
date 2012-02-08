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
/*jslint browser:true*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
	'orion/console', 'debug/debugTab', 'debug/debugMessaging'], 
	function(require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConsole, mDebugTab, mDebugMessaging) {

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
				dojo.place(label, "debug-console", "first");
				return;
			}

			var connection, console, messaging;
			var hash = dojo.hash();
			if (hash.indexOf("ws://") === 0) {
				connection = new mDebugTab.RemoteDebugTab(hash);
			} else {
				if (hash.indexOf("id") === 0) {
					var id = parseInt(hash.substring(2), 10);
					if (id) {
						messaging = new mDebugMessaging.DebugMessaging("debugPage-" + id);
						connection = new mDebugTab.LocalDebugTab(id, messaging);
					}
				}
				if (!connection) {
					return;
				}
			}

			var init = function() {
				dojo.addOnUnload(function() {
					connection.detach();
				});

				connection.addDetachListener(function() {
					var location = dojo.byId("location");
					if (location) {
						location.innerHTML = null;
					}
					console.appendOutput("<< Disconnected from debug target >>");
					console.setAcceptInput(false);
				});
				connection.addUrlListener(function(url) {
					var location = dojo.byId("location");
					if (location) {
						if (url === "about:blank") {
							location.innerHTML = null;
						} else {
							location.innerHTML = url;
						}
					}
				});

				console = new mConsole.Console("debug-console");
				console.addInputListener(function(inputEvent) {
					connection.evaluate(inputEvent, function(result) {
						if (result.error) {
							console.appendOutput("<< " + result.error + " >>");
						} else {
							console.appendOutput(JSON.stringify(result.result));
						}
					});
				});

				connection.attach(function (error) {
					if (error) {
						console.appendOutput("<< " + error + " >>");
						console.setAcceptInput(false);
					}
				});
			};

			if (messaging) {
				messaging.verifyExtension(function(error) {
					if (error) {
						var label = dojo.create("label");
						label.innerHTML = error;
						dojo.place(label, "debug-console", "first");
						var url = require.toUrl("debug/ext/debugChromeExtension.crx");
						var urlLink = dojo.create("a", {href: url}, "debug-console", "last");
						dojo.place(document.createTextNode("   [Click to install it]"), urlLink, "last");
						return;
					}
					init();
				});
			} else {
				init();
			}
		});
	});
});
