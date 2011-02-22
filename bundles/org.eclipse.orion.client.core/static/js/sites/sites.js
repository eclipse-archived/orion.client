/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global eclipse dojo dijit window*/
/*jslint devel:true*/

/*
 * Glue code for sites.html
 */
dojo.addOnLoad(function() {
	// Register services
	var serviceRegistry = new eclipse.ServiceRegistry();
//	new eclipse.StatusReportingService(serviceRegistry, "statusPane");
//	new eclipse.LogService(serviceRegistry);
//	new eclipse.UserService(serviceRegistry);
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var siteService = new eclipse.sites.SiteService();
	serviceRegistry.registerService(eclipse.sites.SITE_SERVICE_NAME, siteService);
	
	// Contribute commands
	(function() {
		var createCommand = new eclipse.Command({
			name : "Create Site Configuration",
			image : "/images/silk/add.png",
			id: "eclipse.sites.createSiteConfigurationCommand",
			groupId: "eclipse.siteGroup",
			callback : function() {
				alert("TODO");
			}});
		commandService.addCommand(createCommand, "dom", "site-toolbar" /* ??? */);
		commandService.addCommandGroup("eclipse.siteGroup", 100);
		
		// Render page-level commands
		// Use "dom" scope since "page" scope doesn't seem to work
		var toolbar = dojo.byId("site-toolbar");
		commandService.renderCommands(toolbar, "dom", {}, {}, "image");
	}());
	
	// Create the visuals
	(function() {
		var model = new eclipse.sites.SiteTreeModel(siteService);
		var treeWidget = new eclipse.TableTree({
			id: "site-table-tree",
			parent: dojo.byId("site-table"),
			model: model,
			showRoot: false,
//			labelColumnIndex: 1,  // 0 if no checkboxes
			renderer: new eclipse.sites.SiteRenderer(commandService)
		});
	}());
	
});