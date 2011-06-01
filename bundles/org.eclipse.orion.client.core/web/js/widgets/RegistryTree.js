/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*jslint forin:true*/
/*global dijit dojo eclipse widgets*/

define(['dojo', 'dijit', 'dojo/data/ItemFileReadStore', 'dijit/Tree', 'dijit/tree/TreeStoreModel'], function(dojo, dijit) {

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
		//console.debug(JSON.stringify(registryData));
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
			    newPrefix = prefix + "|" + plugin.getLocation(),
			    services = this.buildServices(newPrefix, plugin.getServiceReferences());
			nodes.push({
				id: newPrefix,
				label: plugin.getLocation(),
				children: [services]
			});
		}));
		return nodes;
	},
	buildProperties: function(prefix, /** Object */ reference) {
		var newPrefix = prefix + "|properties",
		    data = [];
		
		var propertyNames = reference.getPropertyNames();
		for (var i =0; i < propertyNames.length; i++) {
			var key = propertyNames[i];
			var value = reference.getProperty(key);
			data.push({
				id: newPrefix + "|" + key,
				label: key + " = " + value
			});
		}
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
	buildServices: function(prefix, /** Array */ references) {
		var scope = this;
		var data = [];
		for (var i=0; i < references.length; i++) {
			var reference = references[i],
			    servicePrefix = prefix + "|services|" + i,
			    serviceName = reference.getName();
			data.push({
				id: servicePrefix,
				label: serviceName + " (Service Id: " + reference.getServiceId() + ")",
				children: [this.buildProperties(servicePrefix, reference)]
			});
		}
		return {
			id: prefix + "|services",
			label: "Services",
			children: data
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
});


