/*jslint browser:true devel:true*/
/*global dijit dojo eclipse widgets*/
dojo.require("dijit.tree.ForestStoreModel");
dojo.require("widgets.RegistryTree");

dojo.addOnLoad(function() {
	
	// TODO get the registry from somewhere else
	var registry = new eclipse.PluginRegistry();
	registry.start();
	
	var initTree = function() {
		var tree = new widgets.RegistryTree({ registry: registry }, "registry-tree");
		tree.startup();
	};
	
	// Hook up event handlers
	var installUrlTextBox = dijit.byId("installUrlTextBox"),
		installButton = dijit.byId("installButton"),
		refreshButton = dijit.byId("refreshButton");
	
	dojo.connect(installUrlTextBox, "onChange", function(evt) {
		var url = installUrlTextBox.get("value");
		installButton.set("disabled", !/^\S+$/.test(dojo.trim(url)));
	});
	dojo.connect(refreshButton, "onClick", function(evt) {
		var old = dijit.byId("registry-tree");
		if (old) {
			//old.destroyRecursive();
			dijit.registry.remove("registry-tree");
		}
		initTree();
	});
	var installHandler = function(evt) {
		var pluginUrl = installUrlTextBox.get("value");
		registry.loadPlugin(pluginUrl, function(plugin) {
			registry.installPlugin(plugin.pluginURL, plugin.pluginData);
			// FIXME: Add a callback for installPlugin() instead of using a timer
			setTimeout(function() {
				refreshButton.onClick();
				installUrlTextBox.set("value", "");
			}, 500);
		});
	};
	dojo.connect(installUrlTextBox, "onKeyPress", function(e) {
		if (dojo.keys.ENTER === e.keyCode) {
			installHandler(e);
		}
	});
	dojo.connect(installButton, "onClick", installHandler);
	
	// Wait until the JSLint plugin has (hopefully) loaded, then draw the tree
	setTimeout(function() {
		initTree();
	}, 500);
});