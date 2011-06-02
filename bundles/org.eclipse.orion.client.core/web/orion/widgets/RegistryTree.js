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
dojo.declare("orion.widgets.RegistryTree", [dijit.Tree], {
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
		return [ plugins ];
	},
	buildPlugins: function(prefix, registry) {
		var nodes = [];
		var plugins = registry.getPlugins();
		for (var i=0; i < plugins.length; i++) {
			var newPrefix = prefix + "|" + plugins[i].getLocation();
			nodes.push({
				plugin: plugins[i],
				id: newPrefix,
				label: plugins[i].getLocation(),
				children: [this.buildServices(newPrefix, plugins[i].getServiceReferences())]
			});
		}
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
	getSelectedPlugins: function() {
		if (this.selectedNodes.length === 0) {
			return [];
		}
		var plugins = [];
		for (var i=0; i<this.selectedNodes.length; i++) {
			if (this.selectedNodes[i].item.plugin) {
				// each item node's properties are actually kept in a single item array.
				// I have no idea why, something with the TreeStoreModel????
				plugins.push(this.selectedNodes[i].item.plugin[0]);
			}
		}
		return plugins;
	}
});
});


