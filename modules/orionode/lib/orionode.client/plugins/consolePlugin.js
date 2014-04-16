define(['orion/plugin'], function(PluginProvider) {
  var headers = { name: "Console Plugin", 
    version: "0.1", 
description: "A plugin to add a link to the tty shell"};
  var provider = new PluginProvider(headers);
  var serviceImpl = { };
  provider.registerService("orion.navigate.command", {}, {
    name: "Console",
    id: "eclipse.console",
    tooltipKey: "Open Console page",
		validationProperties: [{
			source: "ChildrenLocation|ContentLocation",
			variableName: "ShellLocation",
			replacements: [{pattern: "\\?depth=1$", replacement: ""}] 
		}],
    uriTemplate: "{+OrionHome}/tty/ttyShell.html#{,ShellLocation}",
    forceSingleItem: true
  });
  provider.registerService("orion.page.link.related", null, {
    id: "eclipse.console",
    category: "shell",
    order: 5 // First link in Shell category
  });
  provider.connect(); 
});
