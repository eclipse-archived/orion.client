define([
	"orion/plugin",
	'i18n!collab/nls/collabmessages', 
	"orion/Deferred", 
	"orion/i18nUtil",
	'orion/EventTarget',
	"orion/collab/collabFileImpl",
	"plugins/filePlugin/fileImpl"
], function(PluginProvider, messages, Deferred, i18nUtil, EventTarget, collabFileImpl, FileServiceImpl) {
		var headers = {
			name: "Orion Shared Workspaces support",
			version: "1.0",
			description: "This plug-in provides shared workspace to the Orion File Service."
		};
		var provider = new PluginProvider(headers);
		var service = new collabFileImpl("/sharedWorkspace/tree");
		// var service = new FileServiceImpl('/sharedWorkspace/tree', '/sharedWorkspace/tree');
		provider.registerService("orion.core.file", service, {
			Name: messages["SharedWorkspace"],
			top: "/sharedWorkspace/tree",
			pattern: "/sharedWorkspace/tree"
		});

		provider.connect();
});
