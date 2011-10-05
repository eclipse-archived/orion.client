/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 (http://www.eclipse.org/legal/epl-v10.html),
 * and the Eclipse Distribution License v1.0
 * (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define document */

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/status', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
		'orion/compare/compare-features', 'orion/compare/diff-provider', 'orion/compare/compare-container', 'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'],
		function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mStatus, mCommands, mFileClient, mSearchClient, mGlobalCommands, mCompareFeatures, mDiffProvider, mCompareContainer) {

			dojo.addOnLoad(function() {
				document.body.style.visibility = "visible";
				dojo.parser.parse();
				// initialize service registry and EAS services
				var serviceRegistry = new mServiceregistry.ServiceRegistry();
				var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
				var commandService = new mCommands.CommandService({
					serviceRegistry: serviceRegistry
				});
				var preferenceService = new mPreferences.PreferencesService(serviceRegistry);
				var searcher = new mSearchClient.Searcher({
					serviceRegistry: serviceRegistry, commandService: commandService
				});
				// File operations
				var fileClient = new mFileClient.FileClient(serviceRegistry);
				var diffProvider = new mDiffProvider.DiffProvider(serviceRegistry);

				mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
				var uiFactory = new mCompareFeatures.CompareMergeUIFactory({
					parentDivID: "compareContainer",
					showTitle: true,
					showLineStatus: true
				});
				uiFactory.buildUI();

				// Diff operations
				var readOnly = isReadOnly();
				var conflciting = isConflciting();
				compareMergeContainer = new mCompareContainer.CompareMergeContainer(readOnly, conflciting, diffProvider, serviceRegistry, commandService, fileClient, uiFactory);
				compareMergeContainer.resolveDiff(dojo.hash(), function(newFile, oldFile) {
					handleTile(newFile, oldFile, uiFactory);
				}, function(errorResponse, ioArgs) {
					handleErrorTile(errorResponse, ioArgs, uiFactory);
				});

				// every time the user manually changes the hash, we need to
				// load the diff
				dojo.subscribe("/dojo/hashchange", compareMergeContainer, function() {
					compareMergeContainer = new mCompareContainer.CompareMergeContainer(readOnly, conflciting, diffProvider, serviceRegistry, commandService, fileClient, uiFactory);
					compareMergeContainer.resolveDiff(dojo.hash(), function(newFile, oldFile) {
						handleTile(newFile, oldFile, uiFactory);
					}, function(errorResponse, ioArgs) {
						handleErrorTile(errorResponse, ioArgs, uiFactory);
					});
				});
			});

			function isReadOnly() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["readonly"] != null;
			}

			function isConflciting() {
				var queryParams = dojo.queryToObject(window.location.search.slice(1));
				return queryParams["conflict"] != null;
			}

			function handleTile(newFile, oldFile, uiFactory) {
				if (uiFactory.getTitleDivId(true) && uiFactory.getTitleDivId(false)) {
					dojo.place(document.createTextNode(newFile), uiFactory.getTitleDivId(true), "only");
					dojo.place(document.createTextNode(oldFile), uiFactory.getTitleDivId(false), "only");
				}
			}

			function handleErrorTile(errorResponse, ioArgs, uiFactory) {
				if (uiFactory.getTitleDivId(true) && uiFactory.getTitleDivId(false)) {
					var message = typeof (errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText;
					dojo.place(document.createTextNode(message), uiFactory.getTitleDivId(true), "only");
					dojo.place(document.createTextNode(message), uiFactory.getTitleDivId(false), "only");
					dojo.style(uiFactory.getTitleDivId(true), "color", "red");
					dojo.style(uiFactory.getTitleDivId(false), "color", "red");
				}
			}
		});
