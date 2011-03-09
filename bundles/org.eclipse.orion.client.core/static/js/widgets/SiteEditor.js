/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox eclipse*/
/*jslint browser:true*/
dojo.provide("widgets.SiteEditor");

dojo.require("dijit.form.Button");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.Form");
dojo.require("dijit.form.Select");
dojo.require("dijit.form.Textarea");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Templated");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.grid.cells");

/**
 * Visualizes the Mappings array of a SiteConfiguration as a data grid.
 */
dojo.declare("widgets.MappingsGrid", [dojox.grid.DataGrid], {
	
	/**
	 * {Array} of Mappings. The model object being edited by this grid.
	 */
	_mappings: null,
	
	constructor: function() {
		this.inherited(arguments);
	},
	
	setServices: function(commandService) {
		this._commandService = commandService;
		
		// Register commands used for editing mappings
		var deleteMappingCommand = new eclipse.Command({
			name: "Delete",
			image: "images/remove.gif",
			id: "eclipse.site.mappings.remove",
			visibleWhen: function(item) {
				return true;
			},
			callback: /** @this {widgets.MappingsGrid} */ function(item) {
				this.get("store").deleteItem(item);
				this.get("store").save();
				this.render();
			}});
		this._commandService.addCommand(deleteMappingCommand, "object");
		this._commandService.registerCommandContribution("eclipse.site.mappings.remove", 1);
	},
	
	/**
	 * @param mappings The Mappings field of a site configuration
	 */
	setMappings: function(mappings) {
		// Hang onto the variable; will be mutated as user makes changes to grid store
		this._mappings = mappings;
		this.setStore(this._createGridStore(mappings));
	},
	
	/**
	 * @param mappings {Array}
	 * @returns {dojo.data.ItemFileWriteStore} A store which will power the grid.
	 */
	_createGridStore: function(mappings) {
		var store = new dojo.data.ItemFileWriteStore({
			data: {
				items: dojo.map(mappings, dojo.hitch(this, function(mapping) {
					return this._createMappingObject(mapping.Source, mapping.Target);
				}))
			}
		});
		dojo.connect(store, "setValue", store, function() {
			// Save whenever user edits an attribute
			this.save();
		});
		store._saveEverything = dojo.hitch(this, function(saveCompleteCallback, saveFailedCallback, updatedContentString) {
			// Save: push latest data from store back into the _mappings model object
			var content = dojo.fromJson(updatedContentString);
			while (this._mappings.length > 0) { this._mappings.pop(); }
			dojo.forEach(content.items, dojo.hitch(this, function(item) {
				this._mappings.push(this._createMappingObject(item.Source, item.Target));
			}));
			console.debug("Set Mappings to " + dojo.toJson(this._mappings));
			saveCompleteCallback();
		});
		return store;
	},
	
	_createMappingObject: function(source, target) {
		return {Source: source, Target: target};
	},
	
	// TODO implement as a Command
	// TODO return deferred for when mapping is done being added so we can do focus tricks
	_addMapping: function(source, target) {
		source = typeof(source) === "string" ? source : "/";
		target = typeof(target) === "string" ? target : "/";
		this.get("store").newItem(this._createMappingObject(source, target));
		this.get("store").save();
	},
	
	postCreate: function() {
		this.inherited(arguments);
		var structure = [
				{field: "Source", name: "Virtual Path", editable: true, commitOnBlur: true,
					width: "23em", cellClasses: "pathCell"},
				{field: "Target", name: "Target", editable: true, commitOnBlur: true,
						width: "23em", cellClasses: "pathCell"},
				{field: "_item", name: " ", editable: false, width: "auto", cellClasses: "actionCell", 
						formatter: dojo.hitch(this, this._actionColumnFormatter)}
			];
		this.set("structure", structure);
		
		// Workaround for commitOnBlur not being handled correctly by dojox.grid.cells._Base 
		dojo.connect(this, "onStartEdit", this, function(inCell, inRowIndex) {
			var handle = dojo.connect(inCell, "registerOnBlur", inCell, function(inNode, inRowIndex) {
				var handle2 = dojo.connect(inNode, "onblur", function(e) {
					setTimeout(dojo.hitch(inCell, "_onEditBlur", inRowIndex), 250);
					dojo.disconnect(handle2);
					dojo.disconnect(handle);
				});
			});
		});
		
		dojo.connect(this, "onStyleRow", this, this._renderCommands);
	},
	
	_actionColumnFormatter: function(item) {
		return " ";
	},
	
	// TODO: this is called often. Try to find event that fires only on row added/removed
	_renderCommands: function(rowInfo) {
		var item = this.getItem(rowInfo.index);
		var actionCell = dojo.query("td.actionCell", rowInfo.node)[0];
		if (actionCell && dojo.query("a", actionCell).length === 0) {
			this._commandService.renderCommands(actionCell, "object", item, this, "image", "deleteMappingCell");
		}
	}
});

/**
 * Editor for an individual SiteConfiguration model object.
 * @param {Object} options Options bag for creating the widget.
 * @param {eclipse.FileClient} options.fileClient
 * @param {eclipse.SiteService} options.siteService
 * @param {eclipse.CommandService} options.commandService
 * @param {String} [options.location] Optional URL of a site configuration to load & edit 
 * immediately after widget is created.
 */
dojo.declare("widgets.SiteEditor", [dijit.layout.ContentPane/*dijit._Widget*/, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: dojo.cache("widgets", "templates/SiteEditor.html"),
	
	/** dojo.Deferred */
	_workspaces: null,
	
	/** SiteConfiguration */
	_siteConfiguration: null,
	
	/** Array */
	_modelListeners: null,
	
	constructor: function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		if (!this.options.fileClient) { throw new Error("options.fileClient is required"); }
		if (!this.options.siteService) { throw new Error("options.siteService is required"); }
		if (!this.options.commandService) { throw new Error("options.commandService is required"); }
		this._fileClient = this.options.fileClient;
		this._siteService = this.options.siteService;
		this._commandService = this.options.commandService;
		
		// Start loading workspaces right away
		this._loadWorkspaces();
		
		if (this.options.location) {
			this.load(this.options.location);
		}
	},
	
	postMixInProperties: function() {
		this.inherited(arguments);
		this.siteConfigNameLabelText = "Name:";
		this.mappingsLabelText = "Mappings:";
		this.hostHintLabelText = "Hostname hint:";
		this.workspaceLabelText = "Workspace:";
		this.addMappingButtonText = "Add";
	},
	
	postCreate: function() {
		this.inherited(arguments);
		this.refocus = false; // Dojo 10654
		
		// Validation
		this.name.set("invalidMessage", "Not a valid name");
		this.name.set("isValid", dojo.hitch(this, function(focused) {
			return focused || dojo.trim(this.name.get("value")) !== "";
		}));
		this.hostHint.set("invalidMessage", "Not a valid hostname");
		this.hostHint.set("isValid", dojo.hitch(this, function(focused) {
			var hostish = /^(?:\s*|[A-Za-z0-9-_]+)$/;
			return focused || hostish.test(this.hostHint.get("value"));
		}));
		
		// Mappings grid
		this.mappings.setServices(this._commandService);
		dojo.connect(this.addMappingButton, "onClick", this.mappings, "_addMapping");
		
		// dijit.form.Form doesn't work in dojoAttachPoint for some reason
		dojo.connect(this.saveButton, "onClick", dijit.byId("siteForm"), function() { this.onSubmit(arguments); });;
		dijit.byId("siteForm").onSubmit = dojo.hitch(this, this.onSubmit);
	},
	
	startup: function() {
		this.inherited(arguments);
		// Render the commands
		console.debug("started");
	},
	
	/**
	 * Loads site configuration from a URL into the editor.
	 * @param {String} location URL of the site configuration to load.
	 * @return {dojo.Deferred} A deferred, resolved when the editor has loaded & refreshed itself.
	 */
	load: function(location) {
		this._busy("Loading...");
		var deferred = new dojo.Deferred();
		// TODO errback for the deferred(s)
		this._siteService.loadSiteConfiguration(location).then(
			dojo.hitch(this, function(siteConfig) {
				this._setSiteConfiguration(siteConfig);
				this._done("");
				deferred.callback(siteConfig);
			}),
			function(error) {
				deferred.errback(error);
			});
		return deferred;
	},
	
	_setSiteConfiguration: function(siteConfiguration) {
		this._detachListeners(this._siteConfiguration);
		this._siteConfiguration = siteConfiguration;
		
		// Refresh fields
		this.name.set("value", this._siteConfiguration.Name);
		this.hostHint.set("value", this._siteConfiguration.HostHint);
		this.mappings.setMappings(this._siteConfiguration.Mappings);
		this.mappings.startup();
		
		var editor = this;
		dojo.when(editor._workspaces, function(workspaces) {
			// Workspaces are available so refresh that widget
			var options = dojo.map(workspaces, function(workspace) {
				return {
					label: workspace.Name,
					value: workspace.Id,
					selected: workspace.Id === editor._siteConfiguration.Workspace };});
			editor.workspace.set("options", options);
			editor.workspace._loadChildren();
		});
		
		this._attachListeners(this._siteConfiguration);
	},
	
	/**
	 * Hook up listeners that perform form widget -> model updates.
	 * @param site {SiteConfiguration}
	 */
	_attachListeners: function(site) {
		this._modelListeners = [];
		
		var editor = this;
		function bindText(widget, modelField) {
			// Bind widget's onChange to site[modelField]
			var handle = dojo.connect(widget, "onChange", null, function(/**Event*/ e) {
				var value = widget.get("value");
				site[modelField] = value;
				
				console.debug("Change " + modelField + " to " + value);
			});
			editor._modelListeners.push(handle);
		}
		
		bindText(this.name, "Name");
		bindText(this.hostHint, "HostHint");
		bindText(this.workspace, "Workspace");
	},
	
	_detachListeners: function() {
		if (this._modelListeners) {
			for (var i=0; i < this._modelListeners.length; i++) {
				dojo.disconnect(this._modelListeners[i]);
			}
		}
		
		// Detach grid
	},
	
	/**
	 * Starts loading workspaces and resolves this._workspaces when they're ready.
	 */
	_loadWorkspaces: function() {
		var editor = this;
		editor._workspaces = new dojo.Deferred();
		this._fileClient.loadWorkspaces().then(function(workspaces) {
				editor._workspaces.callback(workspaces);
			},
			function(error) {
				editor._workspaces.errback(error);
			});
	},
	
	/**
	 * @return {SiteConfiguration} The site configuration that is being edited.
	 */
	getSiteConfiguration: function() {
		return this._siteConfiguration;
	},
	
	/**
	 * Callback when 'save' is clicked.
	 * @Override
	 * @return True to allow save to proceed, false to prevent it.
	 */
	onSubmit: function(/** Event */ e) {
		var form = dijit.byId("siteForm");
		if (form.isValid()) {
			this._busy("Saving...");
			
			var editor = this;
			var siteConfig = editor._siteConfiguration;
			this._siteService.updateSiteConfiguration(siteConfig.Id, siteConfig).then(
					function(updatedSiteConfig) {
						editor._setSiteConfiguration(updatedSiteConfig);
						editor._done("Saved.");
					});
			return true;
		} else {
			//alert("invalid");
			return false;
		}
	},
	
	_busy: function(msg) {
		dojo.forEach(this.getDescendants(), function(widget) {
			widget.set("disabled", true);
		});
		this.onMessage(msg);
	},
	
	_done: function(msg) {
		dojo.forEach(this.getDescendants(), function(widget) {
			widget.set("disabled", false);
		});
		this.onMessage(msg);
	},
	
	/**
	 * Clients can override or dojo.connect() to this function to receive notifications about 
	 * server calls that failed.
	 * TODO
	 */
	onError: function(error) {
	},
	
	/**
	 * Clients can override or dojo.connect() to this function to receive notifications about
	 * server calls that succeeded.
	 */
	onMessage: function(message) {
	}
});
