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

define(['i18n!orion/content/nls/messages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
	        'orion/searchClient', 'orion/globalCommands', 'orion/URITemplate', 'orion/PageUtil', 
	        'dojo/hash'], 
			function(messages, require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, 
			mGlobalCommands, URITemplate, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			// Register services
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			var fileMetadata;
			var hostName;
			
			/**
			 * Utility method for saving file contents to a specified location
			 */
			function saveFileContents(fileClient, targetMetadata, contents, afterSave) {
				var etag = targetMetadata.ETag;
				var args = { "ETag" : etag }; //$NON-NLS-0$
				fileClient.write(targetMetadata.Location, contents, args).then(
					function(result) {
						if (afterSave) {
							afterSave();
						}
					},
					/* error handling */
					function(error) {
						// expected error - HTTP 412 Precondition Failed 
						// occurs when file is out of sync with the server
						if (error.status === 412) {
							var forceSave = window.confirm(messages["Resource is out of sync with the server. Do you want to save it anyway?"]);
							if (forceSave) {
								// repeat save operation, but without ETag 
								fileClient.write(targetMetadata.Location, contents).then(
									function(result) {
											targetMetadata.ETag = result.ETag;
											if (afterSave) {
												afterSave();
											}
									}
								);
							}
						}
						// unknown error
						else {
							error.log = true;
						}
					}
				);
			}
			
			function loadContent() {
				var foundContent = false;
				var params = PageUtil.matchResourceParameters(window.location.href);
				var nonHash = window.location.href.split('#')[0]; //$NON-NLS-0$
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
					var contentProviders = serviceRegistry.getServiceReferences("orion.page.content"); //$NON-NLS-0$
					for (var i=0; i<contentProviders.length; i++) {
						// Exclude any navigation commands themselves, since we are the navigator.
						var id = contentProviders[i].getProperty("id"); //$NON-NLS-0$
						if (id === params.contentProvider) {
							var impl = serviceRegistry.getService(contentProviders[i]);
							var info = {};
							var propertyNames = contentProviders[i].getPropertyKeys();
							for (var j = 0; j < propertyNames.length; j++) {
								info[propertyNames[j]] = contentProviders[i].getProperty(propertyNames[j]);
							}
							foundContent = true;
							locationObject.ExitURL = hostName+"/content/exit.html"; //$NON-NLS-0$
							if (info.saveToken) {
								// we need to set up a SaveURL for the iframe to use.
								locationObject.SaveURL = hostName+"/content/saveHook.html#" + params.resource + ",contentProvider=" + params.contentProvider + ","; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
							}
							
							function makeIFrame() {
								var uriTemplate = new URITemplate(info.uriTemplate);
								var href = uriTemplate.expand(locationObject);
								dojo.place('<iframe id="' + id + '" type="text/html" width="100%" height="100%" frameborder="0" src="'+ href + '"></iframe>', "delegatedContent", "only"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$

							}
							
							// TODO should we have the plugin specify whether it needs a Location?
							// If there is metadata, we want to fill in the location object with the name.
							if (locationObject.Location && locationObject.Location.length > 0) {
								fileClient.read(locationObject.Location, true).then(
									function(metadata) {
										if (metadata) {
											// store info used for iframe and saving
											locationObject.Name = metadata.Name;
											fileMetadata = metadata;
											mGlobalCommands.setPageTarget(
												{task: info.name, location: metadata.Location, target: metadata, serviceRegistry: serviceRegistry, 
													commandService: commandService, searchService: searcher, fileService: fileClient, isFavoriteTarget: true});
											makeIFrame();
										}
						
									},  
									// TODO couldn't read metadata, try to make iframe anyway.
									function() {
										mGlobalCommands.setPageTarget({task: info.name, title: info.name});
										makeIFrame();
									});
							} else {
								mGlobalCommands.setPageTarget({task: info.name, title: info.name});
								makeIFrame();
							}
							break;
						}
					}
				}
				if (!foundContent) {
					dojo.place("<div>"+messages["Plugin content could not be found"]+"</div>", "delegatedContent", "only"); //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-0$ //$NON-NLS-2$
				}
			}
			
			// Listen for events from our internal iframe.  This should eventually belong as part of the plugin registry.
			// This mechanism should become generalized into a "shell services" API for plugin iframes to contact the outer context.
			dojo.connect(window, "message", function(event) { //$NON-NLS-0$
				// For potentially dangerous actions, such as save, we will force the content to be from our domain (internal
				// save hook), which we know has given the user the change to look at the data before save.
				if (hostName && fileMetadata && event.source.parent === window && event.origin === hostName ) {
					if (typeof event.data === "string") { //$NON-NLS-0$
					var data = JSON.parse(event.data);
						if (data.shellService) {
							if (data.sourceLocation) {
								saveFileContents(fileClient, fileMetadata, {sourceLocation: data.sourceLocation}, function() {
									if (window.confirm(messages["Content has been saved.  Click OK to go to the navigator, Cancel to keep editing."])) {
										// go to the navigator
										window.location.href = hostName + "/navigate/table.html#" + fileMetadata.Parents[0].ChildrenLocation; //$NON-NLS-0$
									} else {
										loadContent();
									}
								});
							}
						}
					}
				}
			});
			
			mGlobalCommands.generateBanner("orion-delegatedContent", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			dojo.subscribe("/dojo/hashchange", this, function() { //$NON-NLS-0$
				loadContent();
			});
			loadContent();
		});
	});
});