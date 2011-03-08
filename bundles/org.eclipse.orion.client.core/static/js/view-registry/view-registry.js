/*jslint browser:true devel:true*/
/*global dijit dojo eclipse widgets serviceRegistry:true*/
dojo.require("dijit.tree.ForestStoreModel");
dojo.require("widgets.RegistryTree");

dojo.addOnLoad(function() {
	
	// TODO get the registry from somewhere else
	serviceRegistry = new eclipse.ServiceRegistry();
	var registry = new eclipse.PluginRegistry(serviceRegistry);
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});
	
	var initTree = function() {
		var tree = new widgets.RegistryTree({ registry: registry }, "registry-tree");
		tree.startup();
	};
	
	// global commands
	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);

	// add install stuff to page actions toolbar
	var pageActions = dojo.byId("pageActions");
	if (pageActions) {
		dojo.place('<input type="text" id="installUrlTextBox" value="Type a plugin URL here" style="width:16em;"></input>',
			pageActions, "last");
		dojo.place('<button id="installButton">Install</button>',
			pageActions, "last");
	}	
	// Hook up event handlers
	var installUrlTextBox = dojo.byId("installUrlTextBox");
	var installButton = dojo.byId("installButton");
	var refreshButton = dijit.byId("refreshButton");
	var clearButton = dijit.byId("clearButton");

	dojo.connect(refreshButton, "onClick", function(evt) {
		var old = dijit.byId("registry-tree");
		if (old) {
			//old.destroyRecursive();
			dijit.registry.remove("registry-tree");
		}
		initTree();
	});
	dojo.connect(clearButton, "onClick", function(evt) {
		var old = dijit.byId("registry-tree");
		if (old) {
			//old.destroyRecursive();
			dijit.registry.remove("registry-tree");
		}
		var plugins = registry.getPlugins();
		for (var i = 0; i < plugins.length; i++) {
			plugins[i].uninstall();
		}
		initTree();
	});
	var installHandler = function(evt) {
		var pluginUrl = installUrlTextBox.value;
		if (/^\S+$/.test(dojo.trim(pluginUrl))) {
			registry.installPlugin(pluginUrl);
			// FIXME: Add a callback for installPlugin() instead of using a timer
			setTimeout(function() {
				refreshButton.onClick();
				installUrlTextBox.value="";
			}, 500);
		}
	};
	dojo.connect(installUrlTextBox, "onkeypress", function(e) {
		if (dojo.keys.ENTER === e.keyCode) {
			installHandler(e);
		}
	});
	dojo.connect(installButton, "onclick", installHandler);
		
	// Wait until the JSLint plugin has (hopefully) loaded, then draw the tree
	setTimeout(function() {
		initTree();
		installUrlTextBox.focus();
		installUrlTextBox.select();
	}, 500);
});