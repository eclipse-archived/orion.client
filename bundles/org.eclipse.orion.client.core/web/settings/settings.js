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

define(['i18n!settings/nls/messages', 'require', 'dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 'orion/profile/usersClient', 'orion/operationsClient', 'orion/fileClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'dojo/parser', 'dojo/hash', 'dojo/date/locale', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/settings/SettingsContainer', 'dijit/form/Button', 'dijit/ColorPalette'], function(messages, require, dojo, mBootstrap, mStatus, mCommands, mUsersClient, mOperationsClient, mFileClient, mSearchClient, mDialogs, mGlobalCommands) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {

			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			var pluginRegistry = core.pluginRegistry;

			document.body.style.visibility = "visible"; //$NON-NLS-0$
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
			
			var usersClient = new mUsersClient.UsersClient(serviceRegistry, pluginRegistry);

			var preferenceDialogService = new mDialogs.DialogService(serviceRegistry);
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$

			preferencesStatusService.setMessage(messages["Loading..."]);
			
			/* Note 'pageActions' is the attach id for commands in the toolbar */
			
			var containerParameters = { preferences: preferences, 
										registry: serviceRegistry,
										preferencesStatusService: preferencesStatusService,
										commandService: commandService,
										preferenceDialogService: preferenceDialogService,
										settingsCore: core,
										pageActions: "pageActions", //$NON-NLS-0$
										userClient: usersClient };

			var settingsContainer = new orion.widgets.settings.SettingsContainer( containerParameters, dojo.byId( "selectionAgent" ) ); //$NON-NLS-0$
			settingsContainer.startup();

			preferencesStatusService.setMessage("");
		});
	});
});