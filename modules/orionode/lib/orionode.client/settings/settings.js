/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Anton McConville (IBM Corporation) - initial API and implementation
 *
 *******************************************************************************/
/*global define dojo dijit orion window widgets localStorage*/
/*jslint browser:true devel:true*/

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', /*'orion/profile/usersClient',*/
		'orion/operationsClient', 'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/config',
		'orion/metatype', 'orion/settings/settingsRegistry', 'dojo/hash', 'dojo/parser', 'dojo/date/locale', 
		'orion/widgets/settings/SettingsContainer', 'dijit/form/Button', 'dijit/ColorPalette'],
		function(messages, require, dojo, mBootstrap, mStatus, mCommands, /*mUsersClient,*/ mOperationsClient, mFileClient, mSearchClient, 
			mDialogs, mGlobalCommands, mConfig, mMetaType, SettingsRegistry) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {

			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;
			// we use internal border containers so we need dojo to parse.
			dojo.parser.parse();

			// Register services
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var preferencesStatusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var commandService = new mCommands.CommandService({
				serviceRegistry: serviceRegistry
			});

			var fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({
				serviceRegistry: serviceRegistry,
				commandService: commandService,
				fileService: fileClient
			});
			
//			var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);
			// would be nice to have a "restore defaults" command for each settings page but until that can be done,
			// add a command with a "secret key binding" for blowing away the preferences.
			var clearPrefsCommand  = new mCommands.Command({
				name: "Clear themes and editor settings", 
				tooltip: "Clear all settings associated with editor themes and window themes", 
				id: "orion.clearThemes", //$NON-NLS-0$
				callback: function(data) {
					preferences.getPreferences('/themes', 2).then(function(prefs) { //$NON-NLS-0$
						prefs.put("styles", null); //$NON-NLS-0$
						prefs.put("selected", null); //$NON-NLS-0$
						preferencesStatusService.setMessage("Theme settings have been cleared.");
					});
					preferences.getPreferences('/settings', 2).then(function(prefs) { //$NON-NLS-0$
						prefs.put("JavaScript Editor", null); //$NON-NLS-0$ // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=386765
						preferencesStatusService.setMessage("Theme settings have been cleared.");
					});
				}});
			commandService.addCommand(clearPrefsCommand);
			// add as a binding only command
			commandService.registerCommandContribution("globalActions", "orion.clearThemes", 1,  null, true, new mCommands.CommandKeyBinding('t', true, true, true)); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			var preferenceDialogService = new mDialogs.DialogService(serviceRegistry);
			mGlobalCommands.generateBanner("orion-settings", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$

			var settingsRegistry = new SettingsRegistry(serviceRegistry, new mMetaType.MetaTypeRegistry(serviceRegistry));

			preferencesStatusService.setMessage(messages["Loading..."]);
			
			/* Note 'pageActions' is the attach id for commands in the toolbar */
			
			var containerParameters = { preferences: preferences, 
										registry: serviceRegistry,
										preferencesStatusService: preferencesStatusService,
										commandService: commandService,
										preferenceDialogService: preferenceDialogService,
										settingsCore: core,
										pageActions: "pageActions", //$NON-NLS-0$
										userClient: {},//usersClient,
										settingsRegistry: settingsRegistry
										};

			var settingsContainer = new orion.widgets.settings.SettingsContainer( containerParameters, dojo.byId( "selectionAgent" ) ); //$NON-NLS-0$
			settingsContainer.startup();

			preferencesStatusService.setMessage("");
		});
	});
});