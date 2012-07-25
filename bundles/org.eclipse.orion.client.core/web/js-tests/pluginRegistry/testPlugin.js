/*global setTimeout orion dojo eclipse importScripts */

importScripts("../../orion/Deferred.js");
importScripts("../../orion/plugin.js");
var provider = new orion.PluginProvider();
provider.registerService("test", {
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
	}
}, {
	name: "echotest"
});
provider.connect();
