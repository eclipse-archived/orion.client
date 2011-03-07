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
dojo.provide("sites.widgets.SiteEditor");

dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.Form");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Templated");
dojo.require("dijit._Widget");
dojo.require("dijit.Dialog");
// require eclipse.sites.utils

/**
 * Editor for an individual SiteConfiguration data object.
 * @param {Object} options
 * @param {eclipse.ServiceRegistry} options.serviceRegistry Must have FileService, SiteService.
 * @param {String} [options.location] Optional URL of a site configuration to initially load & edit.
 */
dojo.declare("sites.widgets.SiteEditor", [dijit.layout.ContentPane/*dijit._Widget*/, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: dojo.cache("sites.widgets", "templates/SiteEditor.html"),
	
	/** dojo.Deferred */
	workspaces: null,
	
	/** SiteConfiguration */
	siteConfiguration: null,
	
	/** Array */
	_modelListeners: null,
	
	constructor: function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		if (!this.options.serviceRegistry) { throw new Error("options.serviceRegistry is required"); }
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
		
		// Start loading workspaces right away
		this._loadWorkspaces();
	},
	
	/**
	 * Loads site configuration at the given URL into the editor.
	 * @param {String} location URL of the site configuration to load.
	 * @return {dojo.Deferred} A deferred, resolved when the editor has loaded & refreshed itself.
	 */
	load: function(location) {
		return this._getSiteService().then(dojo.hitch(this, function(siteService) {
			siteService.loadSiteConfiguration(location).then(dojo.hitch(this, this._setSiteConfiguration));
		}));
	},
	
	_setSiteConfiguration: function(siteConfiguration) {
		this._detach(this.siteConfiguration);
		this.siteConfiguration = siteConfiguration;
		
		// Refresh fields
		this.name.set("value", this.siteConfiguration.Name);
		this.mappings.set("value", JSON.stringify(this.siteConfiguration.Mappings));
		this.hostHint.set("value", this.siteConfiguration.HostHint);
		
		var widget = this;
		dojo.when(widget.workspaces, function(workspaces) {
			// Workspaces are available so refresh that field
			var options = dojo.map(workspaces, function(workspace) {
				return {
					label: workspace.Name,
					value: workspace.Id,
					selected: workspace.Id === widget.siteConfiguration.Workspace };});
			widget.workspace.set("options", options);
			widget.workspace._loadChildren();
		});
		
		// Update data object when fields change
		this._attach(this.siteConfiguration);
	},
	
	_attach: function(site) {
		this._modelListeners = [];
		var w = this;
		function listen(widgetField, modelField, decodeJson) {
			var handle = dojo.connect(w[widgetField], "onChange", w, function() {
				var value = w[widgetField].get("value");
				if (decodeJson) {
					value = dojo.fromJson(value);
				}
				this.siteConfiguration[modelField] = value;
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
	 * @return {dojo.Deferred} A deferred, resolved with the service
	 */
	_getSiteService: function() {
		return this.options.serviceRegistry.getService(eclipse.sites.SITE_SERVICE_NAME);
	},
	
	/**
	 * Starts loading workspaces and resolves this.workspaces when they're ready.
	 */
	_loadWorkspaces: function() {
		var widget = this;
		widget.workspaces = new dojo.Deferred();
		this.options.serviceRegistry.getService("IFileService").then(
			function(fileService) {
				fileService.loadWorkspaces().then(function(workspaces) {
					widget.workspaces.callback(workspaces);
				},
				function(error) {
					widget.workspaces.errback(error);
				});
			});
	},
	
	/**
	 * @return {SiteConfiguration} The site configuration that is being edited.
	 */
	getSiteConfiguration: function() {
		return this.siteConfiguration;
	},
	
	/**
	 * Callback when 'save' is clicked.
	 * @Override
	 * @return True to allow save to proceed.
	 */
	onSubmit: function(/**Event*/ e) {
		var form = dijit.byId("siteForm");
		if (form.isValid()) {
			this._onBusy("Saving...");
			var widget = this;
			this._getSiteService().then(
					function(siteService) {
						var siteConfig = widget.siteConfiguration;
						siteService.updateSiteConfiguration(siteConfig.Id, siteConfig).then(
								function(updatedSiteConfig) {
									widget._setSiteConfiguration(updatedSiteConfig);
									widget._onDone();
								});
					});
			return true;
		} else {
			alert("invalid");
			return false;
		}
	},
	_onBusy: function(msg) {
	},
	_onDone: function() {
	}
});