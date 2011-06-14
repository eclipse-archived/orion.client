/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit window eclipse:true*/

define(['dojo', 'orion/serviceregistry', 'orion/preferences', 'orion/pluginregistry', 'orion/commands', 'orion/profile/usersClient', 'orion/profile/profile',
	        'orion/searchClient', 'orion/globalCommands',
	        'dojo/parser', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane'], 
			function(dojo, mServiceregistry, mPreferences, mPluginRegistry, mCommands, mUsersClient, mProfile, mSearchClient, mGlobalCommands) {

	dojo.addOnLoad(function() {
		document.body.style.visibility = "visible";
		dojo.parser.parse();
	
		var serviceRegistry = new mServiceregistry.ServiceRegistry();
		var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry);
		dojo.addOnUnload(function() {
			pluginRegistry.shutdown();
		});
		var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		var prefsService = new mPreferences.PreferencesService(serviceRegistry, "/prefs/user");
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry});
		var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);
		
		var profile = new mProfile.Profile({
			registry: serviceRegistry,
			pluginRegistry: pluginRegistry,
			profilePlaceholder: dojo.byId('profileContent'),
			commandService: commandService,
			pageActionsPlaceholder: dojo.byId('pageActions'),
			usersClient: usersClient
		});
		
		mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, prefsService, searcher, profile);
		mGlobalCommands.generateDomCommandsInBanner(commandService, profile);
	});

});
