/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define orion*/
/*jslint browser:true */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/sites/siteMappingsTable',
		'orion/widgets/DirectoryPrompterDialog', 'text!orion/widgets/templates/SiteEditor.html',
		'dojo/DeferredList', 'dijit/layout/ContentPane', 'dijit/Tooltip', 'dijit/_Templated',
		'dijit/form/Form', 'dijit/form/TextBox', 'dijit/form/ValidationTextBox'],
		function(require, dojo, dijit, mUtil, mCommands, mSiteMappingsTable) {

var AUTOSAVE_INTERVAL = 8000;

/**
 * @name orion.widgets.SiteEditor
 * @class Editor for an individual site configuration.
 * @param {Object} options Options bag for creating the widget.
 */
dojo.declare("orion.widgets.SiteEditor", [dijit.layout.ContentPane, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/SiteEditor.html'),

	/** SiteConfiguration */
	_siteConfiguration: null,
	
	/** Array */
	_modelListeners: null,
	
	/** MappingsTable */
	mappings: null,

	_mappingProposals: null,

	_isDirty: false,
	
	_autoSaveTimer: null,

	constructor: function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		this.checkOptions(this.options, ["serviceRegistry", "fileClient", "siteClient", "commandService", "statusService", "progressService"]);

		this._fileClient = this.options.fileClient;
		this._siteClient = this.options.siteClient;
		this._commandService = this.options.commandService;
		this._statusService = this.options.statusService;
		this._progressService = this.options.progressService;
		
		this._commandsContainer = this.options.commandsContainer;
		
		if (this.options.location) {
			this.load(this.options.location);
		}
	},
	
	postMixInProperties: function() {
		this.inherited(arguments);
		this.siteConfigNameLabelText = "Name:";
		this.mappingsLabelText = "Mappings:";
		this.hostHintLabelText = "Hostname hint:";
		this.hostingStatusLabelText = "Status:";
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
		
		dijit.byId("siteForm").onSubmit = dojo.hitch(this, this.save);

		// FIXME figure out where this selfhosting command should go
		var convertCommand = new mCommands.Command({
			name: "Convert to Self-Hosting",
			tooltip: "Enable the site configuration to launch an Orion server running your local client code",
			imageClass: "core-sprite-add",
			id: "orion.site.convert",
			visibleWhen: dojo.hitch(this, function(item) {
				return !!item.Location && !this._isSelfHosting;
			}),
			// FIXME selfhosting 
			callback: dojo.hitch(this, this.convertToSelfHostedSite, this._projects)});
		this._commandService.addCommand(convertCommand);

		// Save command
		var saveCommand = new mCommands.Command({
				name: "Save",
				tooltip: "Save the site configuration",
				imageClass: "core-sprite-save",
				id: "orion.site.save",
				visibleWhen: function(item) {
					return !!item.Location /*looks like a site config*/;
				},
				callback: dojo.hitch(this, this.save)});
		this._commandService.addCommand(saveCommand);

		this._autoSaveTimer = setTimeout(dojo.hitch(this, this.autoSave), AUTOSAVE_INTERVAL);
	},
	
	checkOptions: function(options, names) {
		for (var i=0; i < names.length; i++) {
			if (typeof options[names[i]] === "undefined") {
				throw new Error("options." + names[i] + " is required");
			}
		}
	},
	
	/**
	 * @param {Array} proposals 
	 * @param {Array|Object} items
	 * @param {Object} userData
	 * @returns {Array}
	 */
	_makeAddMenuChoices: function(proposals, items, userData) {
		items = dojo.isArray(items) ? items[0] : items;
		proposals = proposals.sort(function(a, b) {
				return a.FriendlyPath.toLowerCase().localeCompare(b.FriendlyPath.toLowerCase());
			});
		var self = this;
		/**
		 * @this An object from the choices array with shape {name:String, mapping:Object}
		 */
		var callback = function(data) {
			self.mappings.addMapping(this.mapping);
		};
		var addUrl = function() {
			self.mappings.addMapping({
				Source: "/web/somePath",
				Target: "http://",
				FriendlyPath: "http://"
			});
		};
		var choices = proposals.map(function(proposal) {
				return {
					name: proposal.FriendlyPath,
					imageClass: "core-sprite-folder",
					mapping: proposal,
					callback: callback
				};
			});
		if (proposals.length > 0) {
			choices.push({}); // Separator
		}
		choices.push({
			name: "Choose folder&#8230;",
			imageClass: "core-sprite-folder",
			callback: dojo.hitch(this, function() {
				var dialog = new orion.widgets.DirectoryPrompterDialog({
					serviceRegistry: this.serviceRegistry,
					fileClient: this.fileClient,
					func: dojo.hitch(this, function(folder) {
						if (!!folder) {
							this._siteClient.getMappingObject(this.getSiteConfiguration(), folder.Location, folder.Name).then(
								function(mapping) {
									callback.call({mapping: mapping});
								});
						}
					})});
				dialog.startup();
				dialog.show();
			})});
		choices.push({name: "URL", imageClass: "core-sprite-link", callback: addUrl});
		return choices;
	},

	// Special feature for setting up self-hosting
	convertToSelfHostedSite: function(projectsPromise, items, userData) {
		var dialog = new orion.widgets.DirectoryPrompterDialog({
			serviceRegistry: this.serviceRegistry,
			fileClient: this.fileClient,
			func: dojo.hitch(this, function(folder) {
				if (folder) {
					this._siteClient.toInternalForm(folder.Location).then(function(path) {
						this.mappings.deleteAllMappings();
						// FIXME async selfhosting
						this._siteClient.getSelfHostingMappings(path).then(function(mappings) {
							this.mappings.addMappings(mappings);
							this.save();
						});
					});
				}
			}),
			title: "Choose Orion Source Folder",
			message: "Select the folder where you checked out the <b>org.eclipse.orion.client</b> repository:"});
		dialog.startup();
		dialog.show();
	},
	
	/**
	 * Loads site configuration from a URL into the editor.
	 * @param {String} location URL of the site configuration to load.
	 * @returns {dojo.Deferred} A deferred, resolved when the editor has loaded & refreshed itself.
	 */
	load: function(location) {
		var deferred = new dojo.Deferred();
		this._busyWhile(deferred, "Loading...");
		this._siteClient.loadSiteConfiguration(location).then(
			dojo.hitch(this, function(siteConfig) {
				this._setSiteConfiguration(siteConfig);
				this.setDirty(false);
				deferred.callback(siteConfig);
			}),
			function(error) {
				deferred.errback(error);
			});
		return deferred;
	},

	_setSiteConfiguration: function(siteConfiguration) {
		this._detachListeners();
		this._siteConfiguration = siteConfiguration;

		// Ask the service for the proposals to put in the dropdown menu
		if (!this._mappingProposals) {
			this._mappingProposals = this._siteClient.getMappingProposals(siteConfiguration).then(dojo.hitch(this, function(proposals) {
				// Register command used for adding mapping
				var addMappingCommand = new mCommands.Command({
					name: "Add",
					tooltip: "Add a directory mapping to the site configuration",
					imageClass: "core-sprite-add",
					id: "orion.site.mappings.add",
					visibleWhen: function(item) {
						return true;
					},
					choiceCallback: dojo.hitch(this, this._makeAddMenuChoices, proposals)});
				this._commandService.addCommand(addMappingCommand);
				var toolbarId = this.addMappingToolbar.id;
				this._commandService.registerCommandContribution(toolbarId, "orion.site.mappings.add", 1);
				// do we really have to render here
				this._commandService.renderCommands(toolbarId, this.addMappingToolbar, this.mappings, this, "button");
			}));
		}
		this._refreshFields();
	},
	
	setDirty: function(value) {
		this._isDirty = value;
	},
	
	isDirty: function() {
		return this._isDirty;
	},
	
	_refreshFields: function() {
		this.name.set("value", this._siteConfiguration.Name);
		this.hostHint.set("value", this._siteConfiguration.HostHint);

		if (!this.mappings) {
			this.mappings = new mSiteMappingsTable.MappingsTable({serviceRegistry: this.serviceRegistry,
					siteClient: this._siteClient, fileClient: this._fileClient, selection: null, 
					parentId: this.mappingsPlaceholder.id, siteConfiguration: this._siteConfiguration
				});
		} else {
			this.mappings._setSiteConfiguration(this._siteConfiguration);
		}

		var hostStatus = this._siteConfiguration.HostingStatus;
		if (hostStatus && hostStatus.Status === "started") {
			dojo.style(this.siteStartedWarning, {display: "block"});
			this.hostingStatus.innerHTML = mUtil.safeText(hostStatus.Status[0].toLocaleUpperCase() + hostStatus.Status.substr(1) + " at ");
			dojo.create("a", {href: hostStatus.URL, innerHTML: mUtil.safeText(hostStatus.URL), target: "_new"}, this.hostingStatus, "last");
		} else {
			dojo.style(this.siteStartedWarning, {display: "none"});
			mUtil.setText(this.hostingStatus, hostStatus.Status[0].toLocaleUpperCase() + hostStatus.Status.substr(1));
		}
		
		var self = this;
		// FIXME async also isSelfHosting
		this._siteClient.isSelfHosting(this._siteConfiguration).then(function(result) {
			self._isSelfHosting = result;
			dojo.empty(self._commandsContainer);
			var userData = {
				site: self._siteConfiguration
			};
			self._commandService.renderCommands(self._commandsContainer.id, self._commandsContainer, self._siteConfiguration, {}, "button", userData);
		});

		setTimeout(dojo.hitch(this, function() {
			this._attachListeners(this._siteConfiguration);
		}), 0);
	},
	
	/**
	 * Hook up listeners that perform form widget -> model updates.
	 * @param site {SiteConfiguration}
	 */
	_attachListeners: function(site) {
		this._detachListeners();
		this._modelListeners = this._modelListeners || [];
		
		var editor = this;
		function bindText(widget, modelField) {
			function commitWidgetValue() {
				var value = widget.get("value");
				var oldValue = site[modelField];
				site[modelField] = value;
				var isChanged = oldValue !== value;
				editor.setDirty(isChanged || editor.isDirty());
			}
			editor._modelListeners.push(dojo.connect(widget, "onChange", commitWidgetValue));
			editor._modelListeners.push(dojo.connect(widget, "onKeyUp", commitWidgetValue));
		}
		
		bindText(this.name, "Name");
		bindText(this.hostHint, "HostHint");
		
		this._modelListeners.push(dojo.connect(this.mappings, "setDirty", this, function(dirty) {
			this.setDirty(dirty);
		}));
	},
	
	_detachListeners: function() {
		if (this._modelListeners) {
			for (var i=0; i < this._modelListeners.length; i++) {
				dojo.disconnect(this._modelListeners[i]);
			}
			this._modelListeners.splice(0);
		}
	},
	
	/**
	 * @returns {SiteConfiguration} The site configuration that is being edited.
	 */
	getSiteConfiguration: function() {
		return this._siteConfiguration;
	},
	
	getResource: function() {
		return this._siteConfiguration && this._siteConfiguration.Location;
	},

	/**
	 * Callback when 'save' is clicked.
	 * @Override
	 * @returns True to allow save to proceed, false to prevent it.
	 */
	save: function(refreshUI) {
		refreshUI = typeof refreshUI === "undefined" ? true : refreshUI;
		var form = dijit.byId("siteForm");
		if (form.isValid()) {
			var siteConfig = this._siteConfiguration;
			// Omit the HostingStatus field before save since it's likely to be updated from
			// the sites page, and we don't want to overwrite
			var status = siteConfig.HostingStatus;
			delete siteConfig.HostingStatus;
			var self = this;
			var deferred = this._siteClient.updateSiteConfiguration(siteConfig.Location, siteConfig).then(
				function(updatedSiteConfig) {
					self.setDirty(false);
					if (refreshUI) {
						self._setSiteConfiguration(updatedSiteConfig);
						return updatedSiteConfig;
					} else {
						siteConfig.HostingStatus = status;
						return siteConfig;
					}
				});
			this._busyWhile(deferred);
			return true;
		} else {
			return false;
		}
	},

	autoSave: function() {
		if (this.isDirty()) {
			this.save(false);
		}
		setTimeout(dojo.hitch(this, this.autoSave), AUTOSAVE_INTERVAL);
	},

	_busyWhile: function(deferred, msg) {
		deferred.then(dojo.hitch(this, this._onSuccess), dojo.hitch(this, this._onError));
		this.progressService.showWhile(deferred, msg);
	},
	
	_onSuccess: function(deferred) {
		this.onSuccess(deferred);
	},
	
	_onError: function(deferred) {
		this._statusService.setErrorMessage(deferred);
		this.onError(deferred);
	},
	
	/**
	 * Clients can dojo.connect() to this function to receive notifications about server calls that succeeded.
	 * @param {dojo.Deferred} deferred The deferred that succeeded.
	 */
	onSuccess: function(deferred) {
	},
		
	/**
	 * Clients can dojo.connect() to this function to receive notifications about server called that failed.
	 * @param {dojo.Deferred} deferred The deferred that errback'd.
	 */
	onError: function(deferred) {
	}
});
});
