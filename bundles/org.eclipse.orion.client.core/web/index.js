/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global define*/

define(['require', 'dojo', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/status', 'orion/progress', 'orion/globalCommands',
        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'/*, 'dojox/widget/Portlet', 'dojox/widget/FeedPortlet'*/], 
		function(require, dojo, mBootstrap, mCommands, mFileClient, mOperationsClient, mSearchClient, mStatus, mProgress, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
				
			// global commands
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);
		
			// Populate the "get started" tasks
			
			// Note that the shape of the "orion.help.task" extension is not in any shape or form that could be considered final.
			// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
			
			// The shape of the contributed tasks is (for now):
			// info - information about the tasks (object).
			//		required attribute: name - the name of the task
			//		required attribute: id - the id of the task
			//		required attribute: image - a URL to an image (preferably 40x40, this could change)
			//		required attribute: description - a description of the task
			//	    required attribute: steps - an array of steps (array).
			//             optional attribute: href.  An href that takes the user to the page described in the step
			//             required attribute: description of the step.  May be manual instructions for the user.  Appears after the href.
			var taskReferences = serviceRegistry.getServiceReferences("orion.help.task");
			var taskParent = dojo.byId("tasks");
			var operationsTable = dojo.create("table", null, taskParent, "only");
			for (var i=0; i<taskReferences.length; i++) {
				var info = {};
				var propertyNames = taskReferences[i].getPropertyNames();
				for (var j = 0; j < propertyNames.length; j++) {
					info[propertyNames[j]] = taskReferences[i].getProperty(propertyNames[j]);
				}
				var row = dojo.create("tr", null, operationsTable, "last");
				var iconCol = dojo.create("td", null, row, "last");
				var img = dojo.create("img", {src: info.image, name: info.name, alt: info.name}, iconCol, "only");
				dojo.addClass(img, "landingImage");
				var descriptionCol = dojo.create("td", null, row, "last");
				dojo.addClass(descriptionCol, "landingDescription");
				dojo.place(document.createTextNode(info.description), descriptionCol, "only");
				var stepsRow = dojo.create("tr", null, operationsTable, "last");
				var stepsCol = dojo.create("td", {colspan: "2"}, stepsRow, "last");
				var stepsList = dojo.create("ul", null, stepsCol, "last");
				for (var k=0; k<info.steps.length; k++) {
					var item = dojo.create("li", null, stepsList, "last");
					dojo.place(document.createTextNode(info.steps[k].description), item, "last");
					if (info.steps[k].href) {
						dojo.create("br", null, item);
						var anchor = dojo.create("a", {href: info.steps[k].href}, item, "last");
						dojo.addClass(anchor, "landingLink");
						if (info.steps[k].linkName) {
							dojo.place(document.createTextNode("Go to " + info.steps[k].linkName + "."), anchor, "only");
						} else {
							dojo.place(document.createTextNode("Go to " + info.steps[k].href + "."), anchor, "only");
						}
					}
	
				}
			}
			document.body.style.visibility = "visible";
			dojo.parser.parse();
		});
	});
});
