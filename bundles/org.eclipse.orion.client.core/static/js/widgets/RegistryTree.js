/*jslint forin:true*/
/*global dijit dojo eclipse widgets*/
dojo.provide("widgets.RegistryTree");

dojo.require("dijit.Tree");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.tree.TreeStoreModel");

// TODO re-implement mayHaveChildren so leaves never have expando icons
dojo.declare("widgets.RegistryTree", [dijit.Tree], {
	constructor: function(options) {
		this.inherited(arguments);
		this.registry = options && options.registry;
		if (!this.registry) { throw "Option 'registry' is required"; }
		var registryData = this.buildRegistry(this.registry);
		var store = new dojo.data.ItemFileReadStore({
			data: {
				identifier: "id",
				label: "label",
				items: registryData
			}
		});
		console.debug(JSON.stringify(registryData));
		var model = new dijit.tree.TreeStoreModel({ store: store });
		this.model = model;
	},
	/**
	 * Parse the registry contents into a nice tree
	 * @return {Array.<{{id:string, label:string, children:Array}}>} (The "children" property is optional)
	 */
	buildRegistry: function(registry) {
		var plugins =  { id: "plugins", label: "Plug-ins", children: this.buildPlugins("plugins", registry) };
		var root = {
			id: "root",
			label: "Plug-in registry",
			children: [plugins]
		};
		return [ root ];
	},
	buildPlugins: function(prefix, registry) {
		var nodes = [],
		    plugins = registry.getPlugins();
		this.forEach(registry.getPlugins(), dojo.hitch(this, function(name, value) {
			var plugin = value,
			    newPrefix = prefix + "|" + plugin.pluginURL,
			    //services = this.buildServices(newPrefix, plugin.pluginData.services),
			    extensions = this.buildExtensions(newPrefix, plugin.pluginData.extensions);
			nodes.push({
				id: newPrefix,
				label: plugin.pluginURL,
				children: [/*services,*/ extensions]
			});
		}));
		return nodes;
	},
	buildProperties: function(prefix, /** Object */ properties) {
		var newPrefix = prefix + "|properties",
		    data = [];
		this.forEach(properties, function(key, value) {
				data.push({
					id: newPrefix + "|" + key,
					value: value
				});
			});
		var result = {
			id: newPrefix,
			label: "Properties",
			children: data
		};
		if (data.length === 0) {
			delete result.children; // looks nicer when empty
		}
		return result;
	},
//	buildServices: function(prefix, /** Array */ services) {
//		var scope = this;
//		function buildInterfaces(prefix, /** Object*/ serviceType) {
//			var interfaces = serviceType.interfaces /** Array */,
//			    data = [],
//			    newPrefix = prefix + "|interfaces";
//			for (var i=0; i < interfaces.length; i++) {
//				var interfaze = interfaces[i]; /** String */
//				data.push({
//					id: newPrefix + "|" + i,
//					label: interfaze
//				});
//			}
//			return {
//				id: newPrefix,
//				label: "Interfaces",
//				children: data
//			};
//		}
//		
//		var data = [];
//		for (var i=0; i < services.length; i++) {
//			var service = services[i],
//			    servicePrefix = prefix + "|services|" + i,
//			    serviceType = service.serviceType;
//			data.push({
//				id: servicePrefix,
//				label: service.id + " (Service type: " + serviceType.id + ")",
//				children: [buildInterfaces(servicePrefix, serviceType), this.buildProperties(servicePrefix, service.properties)]
//			});
//		}
//		return {
//			id: prefix + "|services",
//			label: "Services",
//			children: data
//		};
//	},
	buildExtensions: function(prefix, /** eclipse.Plugin? */plugin) {
		var newPrefix = prefix + "|extensions",
		    extensions = plugin && plugin.extensions,
		    data = [];
		if (!extensions) {
			return {
				id: newPrefix,
				label: "Extensions"
			};
		}
		
		for (var i=0; i < extensions.length; i++) {
			var extension = extensions[i];
			data.push({
				id: newPrefix + extension.name,
				label: extension.name + " (Extension point: " + extension.point + ")"			});
		}
		return {
			id: newPrefix,
			label: "Extensions"
		};
	},
	/** @return {Array} */
//	buildLocalServices: function(prefix, registry) {
//		var data = [];
//		this.forEach(registry._localServices, dojo.hitch(this, function(name, localService) {
//			var newPrefix = prefix + "|" + name;
//			data.push({
//				id: newPrefix,
//				label: name,
//				children: this.buildLocalService(newPrefix, localService)
//			});
//		}));
//		return data;
//	},
	/** @return {Array} */
//	buildLocalService: function(prefix, localService) {
//		// NOTE: localService.instances is an Array which uses noninteger keys
//		var data = [];
//		this.forEach(localService.instances, dojo.hitch(this, function(name, instance) {
//			var newPrefix = prefix + "|" + name;
//			data.push({
//				id: newPrefix,
//				label: "Instance " + name,
//				children: this.buildLocalServiceInstance(newPrefix, instance)
//			});//		}));
//		return data;
//	},
	/** @return {Array} */
//	buildLocalServiceInstance: function(prefix, instance) {
//		var newPrefix = prefix + "|" + instance.id,
//		    data = [];
//		data.push(this.buildProperties(newPrefix, instance.properties));
//		data.push({
//			id: newPrefix + "|serviceImpl",
//			label: "serviceImpl: " + instance.serviceImpl
//		});
//		return data;
//	},
	/**
	 * Invokes callback(key, value) for each key-value pair in object
	 */
	forEach: function(obj, /**function(propertyName, value, ?obj):void*/callback) {
		if(!obj) { return; }
		for (var prop in obj) {
			callback(prop, obj[prop], obj);
		}
	}
});



