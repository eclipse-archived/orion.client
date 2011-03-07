/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit eclipse*/
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
//dojo.require("dijit._Widget");
// require eclipse.sites.utils

/**
 * Editor for an individual SiteConfiguration model object.
 * @param {Object} options Options bag for creating the widget.
 * @param {eclipse.FileClient} options.fileClient
 * @param {eclipse.SiteService} options.siteService
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
		this._fileClient = this.options.fileClient;
		this._siteService = this.options.siteService;
		
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
			var hostish = /^s+$|^[A-Za-z0-9-_]+$/;
			return focused || hostish.test(this.hostHint.get("value"));
		}));
		
		// dijit.form.Form doesn't work in dojoAttachPoint for some reason
		dijit.byId("siteForm").onSubmit = dojo.hitch(this, this.onSubmit);
	},
	
	startup: function() {
		this.inherited(arguments);
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
		this._siteService.loadSiteConfiguration(location).then(dojo.hitch(this, 
			function(siteConfig) {
				this._setSiteConfiguration(siteConfig);
				this._done("");
				deferred.callback(siteConfig);
			}));
		return deferred;
	},
	
	_setSiteConfiguration: function(siteConfiguration) {
		this._detach(this._siteConfiguration);
		this._siteConfiguration = siteConfiguration;
		
		// Refresh fields
		this.name.set("value", this._siteConfiguration.Name);
		this.mappings.set("value", JSON.stringify(this._siteConfiguration.Mappings));
		this.hostHint.set("value", this._siteConfiguration.HostHint);
		
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
		
		this._attach(this._siteConfiguration);
	},
	
	/**
	 * Hook up listeners for field -> model updates.
	 * @param site {SiteConfiguration}
	 */
	_attach: function(site) {
		this._modelListeners = [];
		var w = this;
		function listen(widgetField, modelField, decodeJson) {
			var handle = dojo.connect(w[widgetField], "onChange", w, function() {
				var value = w[widgetField].get("value");
				if (decodeJson) {
					value = dojo.fromJson(value);
				}
				this._siteConfiguration[modelField] = value;
				console.debug("Change " + modelField + " to " + value);
			});
			w._modelListeners.push(handle);
		}
		listen("name", "Name");
		listen("mappings", "Mappings", true);
		listen("hostHint", "HostHint");
		listen("workspace", "Workspace");
	},
	
	_detach: function() {
		if (this._modelListeners) {
			for (var i=0; i < this._modelListeners.length; i++) {
				dojo.disconnect(this._modelListeners[i]);
			}
		}
	},
	
	/**
	 * Starts loading workspaces and resolves this._workspaces when they're ready.
	 */
	_loadWorkspaces: function() {
		var widget = this;
		widget._workspaces = new dojo.Deferred();
		this._fileClient.loadWorkspaces().then(function(workspaces) {
				widget._workspaces.callback(workspaces);
			},
			function(error) {
				widget._workspaces.errback(error);
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
	onSubmit: function(/**Event*/ e) {
		var form = dijit.byId("siteForm");
		if (form.isValid()) {
			this._busy("Saving...");
			var widget = this;
			
			var siteConfig = widget._siteConfiguration;
			this._siteService.updateSiteConfiguration(siteConfig.Id, siteConfig).then(
					function(updatedSiteConfig) {
						widget._setSiteConfiguration(updatedSiteConfig);
						widget._done("Saved.");
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