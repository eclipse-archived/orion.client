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
/*global define dojo dijit orion window widgets*/
/*jslint browser:true*/

/*
 * Glue code for content.html
 */

define(['require', 'dojo', 'orion/bootstrap', 'orion/util', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
	        'orion/searchClient', 'orion/globalCommands', 'orion/breadcrumbs', 'orion/URITemplate', 'orion/PageUtil', 
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(require, dojo, mBootstrap, mUtil, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, 
			mGlobalCommands, mBreadcrumbs, URITemplate, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			// Register services
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			var fileMetadata;
			var hostName;
			
			function loadContent() {
				var foundContent = false;
				var params = PageUtil.matchResourceParameters(window.location.href);
				var nonHash = window.location.href.split('#')[0];
				// TODO: should not be necessary, see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
				hostName = nonHash.substring(0, nonHash.length - window.location.pathname.length);
				var locationObject = {OrionHome: hostName, Location: params.resource};
				if (params.contentProvider) {
					// Note that the shape of the "orion.page.content" extension is not in any shape or form that could be considered final.
					// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
			
					// The shape of the extension is:
					// info - information about the extension (object)
					//		required attribute: name - the name to be used in the page title and orion page heading
					//		required attribute: id - the id of the content contribution
					//		required attribute: uriTemplate - a uriTemplate that expands to the URL of the content to be placed in a content iframe
					//		optional attribute: saveToken - if specified, this token (or array of tokens) should be used to find a content URL provided inside a save URL
					//		optional attribute: saveTokenTerminator - if specified this terminator (or array of terminators) should be used to find the 
					//			end of a content URL provided in a save URL
					var contentProviders = serviceRegistry.getServiceReferences("orion.page.content");
					for (var i=0; i<contentProviders.length; i++) {
						// Exclude any navigation commands themselves, since we are the navigator.
						var id = contentProviders[i].getProperty("id");
						if (id === params.contentProvider) {
							var impl = serviceRegistry.getService(contentProviders[i]);
							var info = {};
							var propertyNames = contentProviders[i].getPropertyNames();
							for (var j = 0; j < propertyNames.length; j++) {
								info[propertyNames[j]] = contentProviders[i].getProperty(propertyNames[j]);
							}
							foundContent = true;
							locationObject.ExitURL = hostName+"/content/exit.html";
							if (info.saveToken) {
								// we need to set up a SaveURL for the iframe to use.
								locationObject.SaveURL = hostName+"/content/saveHook.html#" + params.resource + ",contentProvider=" + params.contentProvider + ",";
							}
							// this is ripe for https://bugs.eclipse.org/bugs/show_bug.cgi?id=349531
							document.title = info.name;
							fileClient.read(locationObject.Location, true).then(function(metadata) {
								dojo.empty("location");
								if (metadata) {
									locationObject.Name = metadata.Name;
									fileMetadata = metadata;
									mGlobalCommands.setPageTarget(metadata, serviceRegistry, commandService);
									searcher.setLocationByMetaData(metadata, {index: "first"});
									var root = fileClient.fileServiceName(metadata.Location);
									new mBreadcrumbs.BreadCrumbs({
										container: "location", 
										resource: metadata,
										firstSegmentName: root
									});
								}
								var uriTemplate = new URITemplate(info.uriTemplate);
								var href = uriTemplate.expand(locationObject);
								dojo.place('<iframe id="' + id + '" type="text/html" width="100%" height="100%" frameborder="0" src="'+ href + '"></iframe>', "delegatedContent", "only");
							});
							break;
						}
					}
				}
				if (!foundContent) {
					dojo.place("<div>Plugin content could not be found</div>", "delegatedContent", "only");
				}
			}
			
			// Listen for events from our internal iframe.  This should eventually belong as part of the plugin registry.
			// This mechanism should become generalized into a "shell services" API for plugin iframes to contact the outer context.
			dojo.connect(window, "message", function(event) {
				// For potentially dangerous actions, such as save, we will force the content to be from our domain (internal
				// save hook), which we know has given the user the change to look at the data before save.
				if (hostName && fileMetadata && event.source.parent === window && event.origin === hostName ) {
					if (typeof event.data === "string") {
					var data = JSON.parse(event.data);
						if (data.shellService) {
							if (data.sourceLocation) {
								mUtil.saveFileContents(fileClient, fileMetadata, {sourceLocation: data.sourceLocation}, function() {
									if (window.confirm("Content has been saved.  Click OK to go to the navigator, Cancel to keep editing.")) {
										// go to the navigator
										window.location.href = hostName + "/navigate/table.html#" + fileMetadata.Parents[0].ChildrenLocation;
									} else {
										loadContent();
									}
								});
							}
						}
					}
				}
			});
			
			dojo.subscribe("/dojo/hashchange", this, function() {
				loadContent();
			});
			loadContent();
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
			document.body.style.visibility = "visible";
			dojo.parser.parse();


		});
	});
});