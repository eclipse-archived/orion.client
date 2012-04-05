/*global setTimeout orion dojo eclipse importScripts */

importScripts("../../orion/Deferred.js");
importScripts("../../orion/plugin.js");
var provider = new eclipse.PluginProvider();
var serviceProvider = provider.registerServiceProvider("test", {
	test: function(echo) {
		return echo;
	},
	testPromise: function(echo) {
		var d = new orion.Deferred();
		setTimeout(function() {
			d.progress("progress");
			d.resolve(echo);
		}, 0);
		return d;
	},
	testEvent: function(name) {
		serviceProvider.dispatchEvent(name, name + "test");
	}
}, {
	name: "echotest"
});
provider.connect();
