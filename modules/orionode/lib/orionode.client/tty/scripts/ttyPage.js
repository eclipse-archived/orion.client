/*global define window URL*/
/*jslint browser:true sub:true*/

define(["i18n!orion/shell/nls/messages", "orion/bootstrap", "orion/commandRegistry", 
		"orion/fileClient", "orion/searchClient", "orion/globalCommands"],
	function(messages, mBootstrap, mCommandRegistry, mFileClient, mSearchClient, mGlobalCommands) {

	var fileClient, commandRegistry;
	var contentTypeService, openWithCommands = [], serviceRegistry;
	var pluginRegistry, pluginType, preferences, serviceElementCounter = 0;


	mBootstrap.startup().then(function(core) {
		pluginRegistry = core.pluginRegistry;
		serviceRegistry = core.serviceRegistry;
		preferences = core.preferences;

		commandRegistry = new mCommandRegistry.CommandRegistry({});
		fileClient = new mFileClient.FileClient(serviceRegistry);
		var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandRegistry, fileService: fileClient});
		mGlobalCommands.generateBanner("orion-shellPage", serviceRegistry, commandRegistry, preferences, searcher); //$NON-NLS-0$
		mGlobalCommands.setPageTarget({task: messages.Shell, serviceRegistry: serviceRegistry, commandService: commandRegistry});

	});
});
