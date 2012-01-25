/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:-
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define orion dojo dijit widgets*/
/*jslint browser:true*/

define(['dojo', 'orion/widgets/NewItemDialog'], function(dojo, dijit) {

	/**
	 * @param options.serviceRegistry {eclipse.ServiceRegistry}
	 * @param options.func {Function} Invoked on OK with (port) as parameter
	 */
	dojo.declare("orion.debug.PortInputDialog", [orion.widgets.NewItemDialog], {
		constructor: function(options) {
			this.options = options;
			this.options.title = "Enter Chrome browser debug port (1000-65534)";
			this.options.label = "Port:";
		},
		postMixInProperties: function() {
			this.inherited(arguments);
		},
		postCreate: function() {
			this.inherited(arguments);
			dojo.style(this.itemName, "width", "20em;");
			this.itemName.set("required", true);
			this.itemName.set("isValid", dojo.hitch(this, function(focused) {
				var port = parseInt(dojo.trim(this.itemName.get("value")), 10);
				this.newItemButton.set("disabled", isNaN(port) || !(1000 <= port && port < 65535));
				return !isNaN(port);
			}));
		},
		_onSubmit: function() {
			if (this.itemName.isValid()) {
				this.inherited(arguments);
			}
		},
		execute: function() {
			if (this.options.func) {
				this.options.func(parseInt(dojo.trim(this.itemName.get("value")), 10));
			}
		}
	});
});
