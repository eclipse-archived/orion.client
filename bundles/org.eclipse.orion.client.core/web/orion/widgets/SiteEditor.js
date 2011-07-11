/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define */
/*jslint browser:true */

define(['dojo', 'dijit', 'orion/util', 'orion/siteUtils', 'orion/commands', 'siteMappingsTable',
		'dojo/DeferredList', 'dijit/layout/ContentPane', 'dijit/Tooltip', 'dijit/_Templated', 'dijit/form/Form',
		'dijit/form/TextBox', 'dijit/form/ValidationTextBox',
		'text!orion/widgets/templates/SiteEditor.html'],
		function(dojo, dijit, mUtil, mSiteUtils, mCommands, mSiteMappingsTable) {

/**
 * @name orion.widgets.SiteEditor
 * @class Editor for an individual site configuration.
 * @param {Object} options Options bag for creating the widget.
 * @param {eclipse.FileClient} options.fileClient
 * @param {eclipse.SiteService} options.siteService
 * @param {mCommands.CommandService} options.commandService
 * @param {String} [options.location] Optional URL of a site configuration to load in editor
 * upon creation.
 */
dojo.declare("orion.widgets.SiteEditor", [dijit.layout.ContentPane, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: dojo.cache('orion', 'widgets/templates/SiteEditor.html'),
	
	/** dojo.Deferred */
	_workspaces: null,
	
	/** dojo.Deferred */
	_projects: null,
	
	_fetched: false,
	
	/** SiteConfiguration */
	_siteConfiguration: null,
	
	/** Array */
	_modelListeners: null,
	
	/** MappingsTable */
	mappings: null,
	
	_isDirty: false,
	
	constructor: function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
		this.checkOptions(this.options, ["serviceRegistry", "fileClient", "siteService", "commandService", "statusService"]);

		this._fileClient = this.options.fileClient;
		this._siteService = this.options.siteService;
		this._commandService = this.options.commandService;
		this._statusService = this.options.statusService;
		
		this._commandsContainer = this.options.commandsContainer;
		
		if (this.options.location) {
			this.load(this.options.location);
		}
		
		this._workspaces = this._fileClient.loadWorkspaces();
		this._projects = new dojo.Deferred();
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
		
		dijit.byId("siteForm").onSubmit = dojo.hitch(this, this.onSubmit);
		
		dojo.when(this._projects, dojo.hitch(this, function(projects) {
			// Register command used for adding mapping
			var addMappingCommand = new mCommands.Command({
				name: "Add",
				image: "/images/add.gif",
				id: "eclipse.site.mappings.add",
				visibleWhen: function(item) {
					return true;
				},
				choiceCallback: dojo.hitch(this, this._makeAddMenuChoices, projects)});
			this._commandService.addCommand(addMappingCommand, "dom");
			var toolbarId = this.addMappingToolbar.id;
			this._commandService.registerCommandContribution("eclipse.site.mappings.add", 1, toolbarId);
			this._commandService.renderCommands(this.addMappingToolbar, "dom", this.mappings, this, "image");
		}));
		
		// Save command
		var saveCommand = new mCommands.Command({
				name: "Save",
				image: "/images/save.gif",
				id: "eclipse.site.save",
				visibleWhen: function(item) {
					return item.Location /*looks like a site config*/;
				},
				callback: dojo.hitch(this, this.onSubmit)});
		this._commandService.addCommand(saveCommand, "object");
		this._commandService.registerCommandContribution("eclipse.site.save", 0);
	},
	
	checkOptions: function(options, names) {
		for (var i=0; i < names.length; i++) {
			if (typeof options[names[i]] === "undefined") {
				throw new Error("options." + names[i] + " is required");
			}
		}
	},
	
	/**
	 * this._projects must be resolved before this is called
	 * @param {Array} Projects in workspace
	 * @param {Array|Object} items
	 * @param {Object} userData
	 * @returns {Array}
	 */
	_makeAddMenuChoices: function(projects, items, userData) {
		items = dojo.isArray(items) ? items[0] : items;
		var workspaceId = this.getSiteConfiguration().Workspace;
		projects = projects.sort(function(projectA, projectB) {
				return projectA.Name.toLowerCase().localeCompare(projectB.Name.toLowerCase());
			});
		var self = this;
		
		/**
		 * @this An object from the choices array with shape {name:String, path:String, callback:Function}
		 * @param {Object} item
		 */
		var editor = this;
		var callback = function(item, event) {
			if (event.shiftKey) {
				// special feature for setting up self-hosting
				var mappings = editor.getSelfHostingMappings(this.path);
				for (var i = 0; i < mappings.length; i++) {
					editor.mappings.addMapping(mappings[i].Source, mappings[i].Target);
				}
				self.onSubmit();
			} else {
				editor.mappings.addMapping(null, this.path, this.name);
			}
		};
//		var addOther = function() {
//			editor.mappings.addMapping("/mountPoint", "/FolderId/somepath");
//		};
		var addUrl = function() {
			editor.mappings.addMapping("/web/somePath", "http://some-website.com");
		};
		
		var choices = dojo.map(projects, function(project) {
				return {
					name: "/" + project.Name,
					image: "/images/folder.gif",
					path: mSiteUtils.makeRelativeFilePath(project.Location),
					callback: callback
				};
			});
		
		if (projects.length > 0) {
			choices.push({}); // Separator
		}
		choices.push({
			name: "Choose folder&#8230;",
			image: "/images/folder.gif",
			callback: function() { alert("Directory chooser dialog appears here."); }});
		choices.push({name: "URL", image: "/images/link.gif", callback: addUrl});
		return choices;
	},
	
	getSelfHostingMappings: function(clientRepoPath) {
		return [
		    { "Source": "/",
		      "Target": clientRepoPath + "/bundles/org.eclipse.orion.client.core/web"
		    },
		    { "Source": "/",
		      "Target": clientRepoPath + "/bundles/org.eclipse.orion.client.editor/web"
		    },
		    { "Source": "/file",
		      "Target": "http://localhost:8080/file"
		    },
		    { "Source": "/prefs",
		      "Target": "http://localhost:8080/prefs"
		    },
		    { "Source": "/workspace",
		      "Target": "http://localhost:8080/workspace"
		    },
		    { "Source": "/org.dojotoolkit",
		      "Target": "http://localhost:8080/org.dojotoolkit"
		    },
		    { "Source": "/users",
		      "Target": "http://localhost:8080/users"
		    },
		    { "Source": "/auth2",
		      "Target": "http://localhost:8080/auth2"
		    },
		    { "Source": "/login",
		      "Target": "http://localhost:8080/login"
		    },
		    { "Source": "/loginstatic",
		      "Target": "http://localhost:8080/loginstatic"
		    },
		    { "Source": "/site",
		      "Target": "http://localhost:8080/site"
		    },
		    { "Source": "/",
		      "Target": clientRepoPath + "/bundles/org.eclipse.orion.client.git/web"
		    },
		    { "Source": "/gitapi",
		      "Target": "http://localhost:8080/gitapi"
		    },
		    { "Source": "/",
		      "Target": clientRepoPath + "/bundles/org.eclipse.orion.client.users.ui/web"
		    },
		    { "Source": "/xfer",
		      "Target": "http://localhost:8080/xfer"
		    },
		    { "Source": "/filesearch",
		      "Target": "http://localhost:8080/filesearch"
		    },
		    { "Source": "/index.jsp",
		      "Target": "http://localhost:8080/index.jsp"
		    },
		    { "Source": "/plugins/git",
		      "Target": "http://localhost:8080/plugins/git"
		    },
		    { "Source": "/plugins/user",
		      "Target": "http://localhost:8080/plugins/user"
		    },
		    { "Source": "/logout",
		      "Target": "http://localhost:8080/logout"
		    },
		    { "Source": "/mixloginstatic",
		      "Target": "http://localhost:8080/mixloginstatic"
		    },
		    { "Source": "/openids",
		      "Target": "http://localhost:8080/openids"
		    }
		];
	},
	
	/**
	 * Loads site configuration from a URL into the editor.
	 * @param {String} location URL of the site configuration to load.
	 * @returns {dojo.Deferred} A deferred, resolved when the editor has loaded & refreshed itself.
	 */
	load: function(location) {
		var deferred = new dojo.Deferred();
		this._busyWhile(deferred, "Loading...");
		this._siteService.loadSiteConfiguration(location).then(
			dojo.hitch(this, function(siteConfig) {
				this._setSiteConfiguration(siteConfig);
				deferred.callback(siteConfig);
			}),
			function(error) {
				deferred.errback(error);
			});
		return deferred;
	},
	
	/**
	 * Fetches top-level children of the siteConfiguration's workspace
	 * @returns {dojo.Deferred}
	 */
	_fetchProjects: function(siteConfiguration) {
		if (!this._fetched) {
			dojo.when(this._workspaces, dojo.hitch(this, function(workspaces) {
				var workspace;
				for (var i=0; i < workspaces.length; i++) {
					if (workspaces[i].Id === siteConfiguration.Workspace) {
						workspace = workspaces[i];
						break;
					}
				}
				if (workspace) {
					this._fileClient.fetchChildren(workspace.Location).then(
						dojo.hitch(this, function(projects) {
							this._fetched = true;
							this._projects.callback(projects);
						}),
						dojo.hitch(this, this._onError));
				}
			}));
		}
	},

	_setSiteConfiguration: function(siteConfiguration) {
		this._detachListeners(this._siteConfiguration);
		this._siteConfiguration = siteConfiguration;
		this._fetchProjects(siteConfiguration);
		this._refreshFields();
		setTimeout(dojo.hitch(this, function() {
			this._attachListeners(this._siteConfiguration);
		}), 0);
	},
	
	setDirty: function(value) {
		this._isDirty = value;
		if (!value) {
			this.mappings.setDirty(false);
		}
	},
	
	isDirty: function() {
		return this._isDirty || this.mappings.isDirty();
	},
	
	_refreshFields: function() {
		this.name.set("value", this._siteConfiguration.Name);
		this.hostHint.set("value", this._siteConfiguration.HostHint);
		
		this.mappings = new mSiteMappingsTable.MappingsTable(this.serviceRegistry, null, this.mappingsPlaceholder.id, this._siteConfiguration, this._projects);
		this.mappings.startup();

		var hostStatus = this._siteConfiguration.HostingStatus;
		var status;
		if (hostStatus && hostStatus.Status === "started") {
			dojo.style(this.siteStartedWarning, {display: "block"});
			this.hostingStatus.innerHTML = mUtil.safeText(hostStatus.Status[0].toLocaleUpperCase() + hostStatus.Status.substr(1) + " at ");
			var url = mUtil.safeText(hostStatus.URL);
			dojo.create("a", {href: hostStatus.URL, innerHTML: mUtil.safeText(hostStatus.URL), target: "_new"}, this.hostingStatus, "last");
		} else {
			dojo.style(this.siteStartedWarning, {display: "none"});
			mUtil.setText(this.hostingStatus, hostStatus.Status[0].toLocaleUpperCase() + hostStatus.Status.substr(1));
		}
		
		dojo.empty(this._commandsContainer);
		this._commandService.renderCommands(this._commandsContainer, "object", this._siteConfiguration, {},
			"image", null, this._siteConfiguration /*userData*/, true /*forceText*/);
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
			var handle = dojo.connect(widget, "onChange", editor, function(/**Event*/ e) {
				var value = widget.get("value");
				site[modelField] = value;
				this.setDirty(true);
			});
			editor._modelListeners.push(handle);
		}
		
		bindText(this.name, "Name");
		bindText(this.hostHint, "HostHint");
		
		this._modelListeners.push(dojo.connect(this.mappings, "setDirty", this, function(value) {
				if (value) {
					this.setDirty(true);
				}
			}));
	},
	
	_detachListeners: function() {
		if (this._modelListeners) {
			for (var i=0; i < this._modelListeners.length; i++) {
				dojo.disconnect(this._modelListeners[i]);
			}
		}
	},
	
	/**
	 * @returns {SiteConfiguration} The site configuration that is being edited.
	 */
	getSiteConfiguration: function() {
		return this._siteConfiguration;
	},
	
	/**
	 * Callback when 'save' is clicked.
	 * @Override
	 * @returns True to allow save to proceed, false to prevent it.
	 */
	onSubmit: function(/** Event */ e) {
		var form = dijit.byId("siteForm");
		if (form.isValid()) {
			var editor = this;
			var siteConfig = editor._siteConfiguration;
			// Omit the HostingStatus field before save since it's likely to be updated from
			// the sites page, and we don't want to overwrite
			delete siteConfig.HostingStatus;
			var deferred = this._siteService.updateSiteConfiguration(siteConfig.Location, siteConfig).then(
					function(updatedSiteConfig) {
						editor._setSiteConfiguration(updatedSiteConfig);
						editor.setDirty(false);
						return { Result: "Saved \"" + updatedSiteConfig.Name + "\"." };
					});
			this._busyWhile(deferred, "Saving...");
			return true;
		} else {
			return false;
		}
	},
	
	_busyWhile: function(deferred, msg) {
		dojo.forEach(this.getDescendants(), function(widget) {
			widget.set("disabled", true);
		});
		deferred.then(dojo.hitch(this, this._onSuccess), dojo.hitch(this, this._onError));
		this._statusService.showWhile(deferred, msg);
	},
	
	_onSuccess: function(deferred) {
		dojo.forEach(this.getDescendants(), function(widget) {
			widget.set("disabled", false);
		});
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
