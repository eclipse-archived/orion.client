/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets*/
/*jslint browser:true*/


define(['dojo', 'orion/widgets/NewItemDialog'], function(dojo, dijit) {

/**
 * Requires file service to get the user's workspace, which is in turn required to create a
 * site configuration.
 * 
 * @param options.serviceRegistry {eclipse.ServiceRegistry}
 * @param options.func {Function} Invoked on OK with (name, workspace) as parameters
 */
dojo.declare("orion.widgets.NewSiteDialog", [orion.widgets.NewItemDialog], {
	/** Array */
	workspaceIds: null,
	
	/** String */
	workspaceId: null,
	
	constructor: function() {
		this.options = arguments[0] || {};
		this.options.title = this.options.title || "New Site Configuration";
		this.options.label = this.options.label || "Name:";
	},
	
	postMixInProperties: function() {
		this.inherited(arguments);
	},
	
	postCreate: function() {
		this.inherited(arguments);
		
		dojo.style(this.itemName, "width", "20em;");
		
		// Hook up the validation and OK-button-enabling
		this.itemName.set("required", true);
		this.itemName.set("isValid", dojo.hitch(this, function(focused) {
			return focused || dojo.trim(this.itemName.get("value")) !== "";
		}));
		dojo.connect(this.itemName, "onChange", this, function() {
			this.newItemButton.set("disabled", dojo.trim(this.itemName.get("value")) === "");
		});
		
		// Load workspaces
		var widget = this;
		this.options.serviceRegistry.getService("orion.core.file").loadWorkspaces().then(dojo.hitch(widget, function(workspaces) {
			this.workspaceIds = dojo.map(workspaces, function(workspace) {
				return workspace.Id;
			});
			this.workspaceId = this.workspaceIds[0];
		}));
	},
	
	_onSubmit: function() {
		// Prevent onSubmit() if name is invalid or workspace not loaded yet
		if (this.itemName.isValid() && this.workspaceId !== null) {
			this.inherited(arguments);
		}
	},
	
	execute: function() {
		if (this.options.func) {
			this.options.func(this.itemName.get("value"), this.workspaceId);
		}
	}
});

});
