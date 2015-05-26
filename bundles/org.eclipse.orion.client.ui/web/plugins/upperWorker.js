importScripts("../orion/plugin.js");
var provider = new orion.PluginProvider();
var serviceImpl = {
	run : function(text) {
		return text.toUpperCase();
	}
};
var serviceProps = {
	name : "UPPERCASE",
	img : "../images/gear.gif",
	key : [ "u", true ]
};
provider.registerService("orion.edit.command", serviceImpl, serviceProps);
provider.connect();
