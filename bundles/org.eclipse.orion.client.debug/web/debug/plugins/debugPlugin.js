define([
	"orion/plugin",
	'i18n!debug/nls/debugMessages',
	'orion/debug/debugFileImpl',
	'orion/serviceregistry'
], function(PluginProvider, messages, DebugFileImpl, mServiceRegistry) {
	var headers = {
		name: "Orion Debug Support",
		version: "1.0",
		description: "This plug-in provides Orion debug feature."
	};
	var serviceRegistry = new mServiceRegistry.ServiceRegistry();
	var provider = new PluginProvider(headers, serviceRegistry);

	var fileService = new DebugFileImpl();
	provider.registerService("orion.core.file", fileService, {
		Name: messages["DebugWorkspace"],
		top: "/debug",
		pattern: "/debug"
	});

	provider.connect();
});
