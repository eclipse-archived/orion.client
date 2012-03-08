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

define(['require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 'orion/fileClient', 'orion/operationsClient',
	        'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/breadcrumbs', 'orion/URITemplate', 'orion/PageUtil', 
	        'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(require, dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, 
			mGlobalCommands, mBreadcrumbs, URITemplate, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			// Register services
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			
			// parse the URL to determine what should be saved.
			var params = PageUtil.matchResourceParameters(window.location.href);
			if (params.contentProvider) {
				// Note that the shape of the "orion.page.content" extension is not in any shape or form that could be considered final.
				// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
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
						if (info.saveToken) {
							// save tokens would typically have special characters such as '?' or '&' in them so we can't use
							// the URI template to parse them.  Not sure how we could best express this.  For now we have the plugin
							// specify a token that signifies the start of the URI and possible terminators.  A better way to do this might
							// be to let the plugin specify a regex or a template of the content URI so that we could grab things like hostname,
							// path, parameters, etc.
							var tokens = dojo.isArray(info.saveToken) ? info.saveToken : [info.saveToken];
							var parameterStart = dojo.hash().indexOf(",");
							if (parameterStart >= 0) {
								var parameterString = dojo.hash().substring(parameterStart);
								for (var i=0; i<tokens.length; i++) {
									var index = parameterString.indexOf(info.saveToken[i]);
									if (index >= 0) {
										var contentURL = parameterString.substring(index+info.saveToken[i].length);
										if (info.saveTokenTerminator) {
											var terminators = dojo.isArray(info.saveTokenTerminator) ? info.saveTokenTerminator : [info.saveTokenTerminator];
											for (var j=0; j<terminators.length; j++) {
												var ending = contentURL.indexOf(terminators[j]);
												if (ending >= 0) {
													contentURL = contentURL.substring(0, ending);
													break;
												}
											}
										}
										if (contentURL && contentURL.length > 0) {
											dojo.place("<p>Content plugin <b>" + info.name + "</b> has saved data at <a href='" + contentURL + "'>" + contentURL + "</a>." +
											"<p>We will be able to save this back when <a href='https://bugs.eclipse.org/bugs/show_bug.cgi?id=373443'>Bug 373443</a> is implemented.</p>",
											"orion.saveRequest" ,"only");
										}
										break;
									}
								}
							}
						}
						break;
					}
				}
			}
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		});
	});
});