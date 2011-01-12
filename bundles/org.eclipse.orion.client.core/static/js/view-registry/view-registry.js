/*jslint browser:true devel:true*/
/*global dijit dojo eclipse widgets*/
dojo.require("dijit.tree.ForestStoreModel");
dojo.require("widgets.RegistryTree");

dojo.addOnLoad(function() {
	
	// TODO get the registry from somewhere else
	var registry = new eclipse.Registry();
	(function() {
		registry.start();
		
		var jslintPlugin = registry.getPlugin("/jslintPlugin.html");
		if (jslintPlugin === null) {
			registry.loadPlugin("/jslintPlugin.html", function(plugin) {
				registry.installPlugin(plugin.pluginURL, plugin.pluginData);
			});
		}
		
		// Register EAS
		registry.registerLocalService("IStatusReporter", "EASStatusReporter", new eclipse.StatusReportingService(registry, "statusPane"));
		registry.registerLocalService("ILogService", "EASLog", new eclipse.LogService(registry));
		registry.registerLocalService("IDialogService", "EASDialogs", new eclipse.DialogService(registry));
		registry.registerLocalService("ISaveable", "EASSaveable", new eclipse.SaveableService(registry));
		var inputService = new eclipse.InputService(registry);
		registry.registerLocalService("IInputProvider", "EASInputProvider", inputService);
		registry.registerLocalService("IUsers", "EASUsers", new eclipse.UserService(registry));
		registry.registerLocalService("ISelectionService", "EASSelection", new eclipse.SelectionService(registry));
		var preferenceService = new eclipse.Preferences(registry, "/prefs/user");
		registry.registerLocalService("IPreferenceService", "EASPreferences", preferenceService);
		
		// File operations
		registry.registerLocalService("IFileService", "FileService", new eclipse.FileService());
		
		// Favorites
		registry.registerLocalService("IFavorites", "FavoritesService", new eclipse.FavoritesService({serviceRegistry: registry}));
	}());
	// end TODO
	
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