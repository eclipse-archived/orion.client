/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint browser:true devel:true*/
/*global dijit dojo eclipse widgets serviceRegistry:true*/

dojo.addOnLoad(function() {
	
	// TODO get the registry from somewhere else
	serviceRegistry = new eclipse.ServiceRegistry();
	var registry = new eclipse.PluginRegistry(serviceRegistry);
	dojo.addOnWindowUnload(function() {
		registry.shutdown();
	});
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	var statusService = new eclipse.StatusReportingService(serviceRegistry, "statusPane", "notifications");
		
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", serviceRegistry, commandService, preferenceService, searcher);
	
	// Populate recent projects
	serviceRegistry.getService("IPreferenceService").then(function(service) {
			return service.getPreferences("/window/recent");
		}).then(function(prefs){
			return prefs.get("projects");
		}).then(function(projects) {
			var recent = dojo.byId("recent");
			dojo.empty(recent);
			if (projects && projects.length && projects.length > 0) {
				for (var i=projects.length-1; i>=0; i--) {
					if (projects[i].location && projects[i].name) {
						dojo.place("<a class='landingLink' href='navigate-table.html#"+projects[i].location+"'>"+projects[i].name+"</a><br>", recent, "last");
					}
				}
			} else {
				dojo.place("Go to the <a href='navigate-table.html#'>Navigator</a> to create or view your projects.", recent, "only");
			}
		});
	
	// Populate the "get started" tasks
	
	// Note that the shape of the "landingTasks" extension is not in any shape or form that could be considered final.
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
	var taskReferences = serviceRegistry.getServiceReferences("landingTasks");
	var taskParent = dojo.byId("tasks");
	var taskTable = dojo.create("table", null, taskParent, "only");
	for (var i=0; i<taskReferences.length; i++) {
		serviceRegistry.getService(taskReferences[i]).then(function(service) {
			var info = {};
			var propertyNames = taskReferences[i].getPropertyNames();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = taskReferences[i].getProperty(propertyNames[j]);
			}
			var row = dojo.create("tr", null, taskTable, "last");
			var iconCol = dojo.create("td", null, row, "last");
			var img = dojo.create("img", {src: info.image, name: info.name, alt: info.name}, iconCol, "only");
			dojo.addClass(img, "landingImage");
			var descriptionCol = dojo.create("td", null, row, "last");
			dojo.addClass(descriptionCol, "landingDescription");
			dojo.place(document.createTextNode(info.description), descriptionCol, "only");
			var stepsRow = dojo.create("tr", null, taskTable, "last");
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
		});
	}
});