/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox eclipse*/
/*jslint browser:true */

define(['dojo', 'dijit', 'dojox', 'orion/util', 'orion/siteUtils','orion/commands',
		'dijit/form/DropDownButton', 'dijit/form/ComboBox', 'dijit/form/Form', 'dijit/form/Select', 'dijit/form/Textarea', 'dijit/form/TextBox', 
		'dijit/form/ValidationTextBox', 'dijit/Menu', 'dijit/layout/ContentPane', 'dijit/Tooltip', 'dijit/_Templated', 'dojo/data/ItemFileWriteStore', 
		'dojo/DeferredList', 'dojox/grid/DataGrid', 'dojox/grid/cells'], 
        function(dojo, dijit, dojox, mUtil, mSiteUtils, mCommands) {

/**
 * Visualizes the Mappings array of a SiteConfiguration as a data grid.
 */
dojo.declare("widgets.MappingsGrid", [dojox.grid.DataGrid], /** @lends widgets.MappingsGrid */ {
	
	/**
	 * @type {Array} The model object being edited by this grid.
	 */
	_mappings: null,
	
	_workspaceToChildren: null,
	
	constructor: function() {
		this.inherited(arguments);
	},
	
	setServices: function(commandService, fileClient) {
		this._commandService = commandService;
		this._fileClient = fileClient;
		
		// Register commands used for editing mappings
		var deleteMappingCommand = new mCommands.Command({
			name: "Delete",
			image: "/images/remove.gif",
			id: "eclipse.site.mappings.remove",
			visibleWhen: function(item) {
				// Only show on a Mappings object
				return item.Source && item.Target;
			},
			callback: function(item) {
				// "this" is {widgets.MappingsGrid}
				this._hideTooltip();
				this.store.deleteItem(item);
				this.store.save();
				this.render();
			}});
		this._commandService.addCommand(deleteMappingCommand , "object");
		this._commandService.registerCommandContribution("eclipse.site.mappings.remove", 0);
		
		var moveUpCommand = new mCommands.Command({
			name: "Move Up",
			image: "/images/prev_nav.gif",
			id: "eclipse.site.mappings.moveUp",
			visibleWhen: dojo.hitch(this, function(item) {
				return item.Source && item.Target;
			}),
			callback: function(itemToMove) {
				this._hideTooltip();
				
				var index = this.getItemIndex(itemToMove);
				if (index === 0) { return; }
				
				// There must be a better way than this
				var newOrder = this._deleteAll();
				// swap index-1 with index
				newOrder.splice(index-1, 2, newOrder[index], newOrder[index-1]);
				for (var i=0; i < newOrder.length; i++) {
					this.store.newItem(newOrder[i]);
				}
				
				this.store.save();
				this.render();
			}});
		this._commandService.addCommand(moveUpCommand, "object");
		this._commandService.registerCommandContribution("eclipse.site.mappings.moveUp", 1);
		
		var moveDownCommand = new mCommands.Command({
			name: "Move Down",
			image: "/images/next_nav.gif",
			id: "eclipse.site.mappings.moveDown",
			visibleWhen: dojo.hitch(this, function(item) {
				return item.Source && item.Target;
			}),
			callback: function(itemToMove) {
				this._hideTooltip();
				
				var index = this.getItemIndex(itemToMove);
				if (index === this.get("rowCount")-1) { return; }
				
				var newOrder = this._deleteAll();
				// swap index+1 with index
				newOrder.splice(index, 2, newOrder[index+1], newOrder[index]);
				for (var i=0; i < newOrder.length; i++) {
					this.store.newItem(newOrder[i]);
				}

				this.store.save();
				this.render();
			}});
		this._commandService.addCommand(moveDownCommand, "object");
		this._commandService.registerCommandContribution("eclipse.site.mappings.moveDown", 2);
	},
	
	/** @returns {Mappings[]} An array representing what used to be in the store. */
	_deleteAll: function() {
		var result = [],
		    store = this.store,
		    item;
		while (this.get("rowCount") > 0) {
			item = this.getItem(0);
			result.push(this._createMappingObject(store.getValue(item, "Source"), store.getValue(item, "Target")));
			store.deleteItem(item);
		}
		return result;
	},
	
	/**
	 * @param {Array} mappings The Mappings field of a site configuration
	 */
	setMappings: function(mappings) {
		// Hang onto mappings object; will be mutated as user makes changes to grid store
		this._mappings = mappings;
		
		// Wait until workspace children are loaded; we need them for making friendlyPaths field
		dojo.when(this._editor._workspaceToChildren, dojo.hitch(this, 
			function(map) {
				this._workspaceToChildren = map;
				this.setStore(this._createGridStore(mappings));
			}));
	},
	
	// Sets reference to the outer SiteEditor
	setEditor: function(editor) {
		this._editor = editor;
	},
	
	/**
	 * @param {Array} mappings
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
			// Save store whenever user edits an attribute
			this.save();
		});
		store._saveEverything = dojo.hitch(this, function(saveCompleteCallback, saveFailedCallback, updatedContentString) {
			// Save: push latest data from store back into the _mappings model object
			var content = dojo.fromJson(updatedContentString);
			while (this._mappings.length > 0) { this._mappings.pop(); }
			dojo.forEach(content.items, dojo.hitch(this, function(item) {
				var mapping = {};
				mapping.Source = item.Source;
				mapping.Target = item.Target;
				this._mappings.push(mapping);
			}));
//			console.debug("Set Mappings to " + dojo.toJson(this._mappings));
			saveCompleteCallback();
		});
		return store;
	},
	
	_createMappingObject: function(source, target) {
		return {Source: source, Target: target, _friendlyPath: this._toFriendlyPath(target)};
	},
	
	_getRowNodeForItem: function(/** dojo.data.Item */ item) {
		var rowIdx = this.getItemIndex(item);
		return this.getRowNode(rowIdx);
	},
	
	_hideTooltip: function() {
		dijit.hideTooltip(dijit._masterTT && dijit._masterTT.aroundNode);
	},
	
	_addMapping: function(source, target) {
		source = typeof(source) === "string" ? source : "/mountPoint";
		target = typeof(target) === "string" ? target : "/";
		var store = this.get("store");
		var newItem = this.store.newItem(this._createMappingObject(source, target));
		var that = this;
		store.save({
			onComplete: function() {
				// This is probably not the best way to wait until the table has updated
				setTimeout(function() {
					var rowNode = that._getRowNodeForItem(newItem);
					if (rowNode) {
						var cols = dojo.query("td", rowNode);
						var mountAtCol = cols[that.MOUNT_AT_COL];
						var thePath = that._toReadablePath(rowNode);
						var message = "Click to set the remote path where <b>" + thePath + "</b> will be accessible.";
						dijit.showTooltip(message, mountAtCol, "above");
						dojo.connect("onclick", dojo.hitch(dijit._masterTT, dijit._masterTT.hide, dijit._masterTT.aroundNode));
					}
				}, 1);
			}});
	},
	
	_toReadablePath: function(/**DomNode*/ rowNode) {
		var cols = dojo.query("td", rowNode);
		return mUtil.getText(cols[this.PATH_COL]);
	},
	
	postCreate: function() {
		this.inherited(arguments);
		// These constants must be kept up to date with structure
		this.PATH_COL = 1;
		this.MOUNT_AT_COL = 2;
		var structure = [
				{field: "Target", name: " ", editable: false,
						width: "32px",
						cellClasses: "isValidCell",
						formatter: dojo.hitch(this, this._isValidFormatter)},
				{field: "_friendlyPath", name: "Path", editable: true, commitOnBlur: true,
						cellClasses: "pathCell",
						width: "auto",
						formatter: dojo.hitch(this, this._friendlyPathFormatter)},
				{field: "Source", name: "Mount at", editable: true, commitOnBlur: true,
						width: "30%",
						cellClasses: "editablePathCell"},
				{field: "_item", name: " ", editable: false, 
						cellClasses: "actionCell",
						width: "80px",
						formatter: dojo.hitch(this, this._actionColumnFormatter)}
			];
		this.set("structure", structure);
		
		// Workaround for commitOnBlur not working right see dojox/grid/cells/_base.js
		dojo.connect(this, "onStartEdit", this, function(inCell, inRowIndex) {
			var grid = this;
			var handle = dojo.connect(inCell, "registerOnBlur", inCell, function(inNode, inRowIndex) {
				var handle2 = dojo.connect(inNode, "onblur", function(e) {
					setTimeout(dojo.hitch(inCell, "_onEditBlur", inRowIndex), 250);
					dojo.disconnect(handle2);
					dojo.disconnect(handle);
				});
				var handle3 = dojo.connect(inNode, "onblur", inCell, function(inNode) {
					// Propagate change to the _friendlyPath column into the Target column
					if (inCell.index === grid.PATH_COL) {
						var item = grid.getItem(inRowIndex);
						grid._propagate(item);
					}
					dojo.disconnect(handle3);
				});
			});
		});
		dojo.connect(this, "onStartEdit", this, this._hideTooltip);
		dojo.connect(this, "onResizeColumn", this, this._hideTooltip);
		dojo.connect(this, "onStyleRow", this, this._renderCommands);
	},
	
	_isWorkspacePath: function(/**String*/ path) {
		return new RegExp("^/").test(path);
	},
	
	/**
	 * Formats the "is valid?" column. If the Target looks like a workspace path, we try a GET on it
	 * to see if it exists.
	 * @returns {dojo.Deferred}
	 */
	_isValidFormatter: function(/**String*/ target, i, inCell) {
		if (inCell.lastTarget && inCell.lastTarget === target) {
			// Re-use value from last time
			return inCell.lastResult;
		}
		inCell.lastTarget = target;
		
		var result;
		var href;
		if (this._isWorkspacePath(target)) {
			var location = mSiteUtils.makeFullFilePath(target);
			var deferred = new dojo.Deferred();
			href = mUtil.safeText(location);
			// TODO: should use fileClient here, but we don't want its retrying or error dialog
			//this._fileClient.fetchChildren(location)
			dojo.xhrGet({
				url: location,
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json"
			}).then(
				function(children) {
					deferred.callback('<a href="' + href + '" target="_new"><img src="/images/fldr_obj.gif" title="Workspace folder ' + href + '"/></a>');
				}, function(error) {
					deferred.callback('<a href="' + href + '" target="_new"><img src="/images/error.gif" title="Workspace folder  not found: ' + href + '"/></a>');
				});
			result = deferred;
		} else {
			href = mUtil.safeText(target);
			result = '<a href="' + href + '" target="_blank"><img src="/images/link_obj.gif" title="External link to ' + href + '"/></a>';
		}
		inCell.lastResult = result;
		return result;
	},
	
	// Propagate value of _friendlyPath field to the Target field
	_propagate: function(item) {
		var friendlyPath = this.store.getValue(item, "_friendlyPath");
		var newTarget;
		var found = false;
		if (this._isWorkspacePath(friendlyPath)) {
			this._everyTopLevelFolder(dojo.hitch(this, 
				function(child, childLoc, childName) {
					if (this._pathMatch(friendlyPath, childName)) {
						found = true;
						// Change friendly path back to internal format
						var rest = friendlyPath.substring(childName.length);
						newTarget = childLoc + rest;
						return false;
					}
				}));
		}
		if (!found) {
			newTarget = friendlyPath;
		}
		this.store.setValue(item, "Target", newTarget);
	},
	
	_toFriendlyPath: function(target) {
		var result;
		var found;
		this._everyTopLevelFolder(dojo.hitch(this, 
			function(child, childLoc, childName) {
				if (this._pathMatch(target, childLoc)) {
					found = true;
					var newFriendlyPath = childName + target.substring(childLoc.length);
					//console.debug("Resolving to " + newFriendlyPath);
					result = newFriendlyPath;
					return false;
				}
			}));
		
		if (!found) {
			result = target;
		}
		return result;
	},
	
	_everyTopLevelFolder: function(callback) {
		var workspaceId = this._editor.getSiteConfiguration().Workspace;
		var children = this._workspaceToChildren[workspaceId];
		for (var i=0; i < children.length; i++) {
			var child = children[i];
			var childLoc = mSiteUtils.makeRelativeFilePath(child.Location);
			var childName = "/" + child.Name;
			if (callback(child, childLoc, childName) === false) {
				break;
			}
		}
	},
	
	/**
	 * Returns the _friendlyPath field value. This is a virtual field -- kept in the store for display but not
	 * saved to SiteConfig model. _friendlyPath's value is the same as Target except when Target is a workspace
	 * path: in this case _friendlyPath refers to the project by its user-visible Name rather than the cryptic 
	 * project UUID. Changes made by user to _friendlyPath are pushed into the Target field, which is persisted.
	 * 
	 * @returns {String | dojo.Deferred}
	 */
	_friendlyPathFormatter: function(/**String*/ friendlyPath, /*Number*/ rowIndex, /**Object*/ inCell) {
		return mUtil.safeText(friendlyPath);
	},
	
	/** @returns true if b is a sub-path of a */
	_pathMatch: function(a, b) {
		return a === b || a.indexOf(b + "/") === 0;
	},
	
	_actionColumnFormatter: function(item) {
		// Empty cell; command service will render in here later
		return " ";
	},
	
	// TODO: this is called often. Try to find event that fires only on row added/removed
	_renderCommands: function(rowInfo) {
		var item = this.getItem(rowInfo.index);
		var actionCell = dojo.query("td.actionCell", rowInfo.node)[0];
		if (actionCell && dojo.query("a", actionCell).length === 0) {
			this._commandService.renderCommands(actionCell, "object", item, this, "image", "actionCellCommand");
		}
	}
});

/**
 * Editor for an individual SiteConfiguration model object.
 * @param {Object} options Options bag for creating the widget.
 * @param {eclipse.FileClient} options.fileClient
 * @param {eclipse.SiteService} options.siteService
 * @param {mCommands.CommandService} options.commandService
 * @param {String} [options.location] Optional URL of a site configuration to load in editor
 * upon creation.
 */
dojo.declare("widgets.SiteEditor", [dijit.layout.ContentPane/*dijit._Widget*/, dijit._Templated], {
	widgetsInTemplate: true,
	templateString: dojo.cache(new dojo._Url("/js/widgets/templates/SiteEditor.html")),
	
	/** dojo.Deferred */
	_workspaces: null,
	
	/**
	 * dojo.Deferred
	 * Resolves with an Object that maps {String} workspaceId to {Array} children
	 */
	_workspaceToChildren: null,
	
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
		if (!this.options.statusService) { throw new Error("options.statusService is required"); }
		this._fileClient = this.options.fileClient;
		this._siteService = this.options.siteService;
		this._commandService = this.options.commandService;
		this._statusService = this.options.statusService;
		this._commandsContainer = this.options.commandsContainer;
		
		// Start loading workspaces right away
		this._workspaces = new dojo.Deferred();
		this._workspaceToChildren = new dojo.Deferred();
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
		this.addMappingButtonText = "Add&#8230;";
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
		
		// Mappings grid
		this.mappings.setServices(this._commandService, this._fileClient);
		this.mappings.setEditor(this);
		
		// dijit.form.Form doesn't work in dojoAttachPoint for some reason
		dijit.byId("siteForm").onSubmit = dojo.hitch(this, this.onSubmit);
		
		dojo.when(this._workspaceToChildren, dojo.hitch(this, function(workspaceToChildrenMap) {
			// Register command used for adding mapping
			var addMappingCommand = new mCommands.Command({
				name: "Add&#8230;",
				image: "/images/add_obj.gif",
				id: "eclipse.site.mappings.add",
				visibleWhen: function(item) {
					return true;
				},
				choiceCallback: dojo.hitch(this, this._makeAddMenuChoices, workspaceToChildrenMap)});
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
	
	/**
	 * this._workspaceToChildren must be resolved before this is called, and site must be loaded.
	 * @param workspaceToChildrenMap Maps {String} workspaceId to {Array} children
	 * @param items {Array|Object}
	 * @param userData
	 * @returns {Array}
	 */
	_makeAddMenuChoices: function(workspaceToChildrenMap, items, userData) {
		items = dojo.isArray(items) ? items[0] : items;
		var workspaceId = this.getSiteConfiguration().Workspace;
		var projects = workspaceToChildrenMap[workspaceId];
		var self = this;
		
		/**
		 * @this An object from the choices array with shape {name:String, path:String, callback:Function}
		 * @param item
		 */
		var editor = this;
		var callback = function(item, event) {
			if (event.shiftKey) {
				// special feature for setting up self-hosting
				var mappings = [
				    {
				      "Source": "/",
				      "Target": this.path + "/bundles/org.eclipse.orion.client.core/web"
				    },
				    {
				      "Source": "/editor",
				      "Target": this.path + "/bundles/org.eclipse.orion.client.editor/web"
				    },
				    {
				      "Source": "/file",
				      "Target": "http://localhost:8080/file"
				    },
				    {
				      "Source": "/prefs",
				      "Target": "http://localhost:8080/prefs"
				    },
				    {
				      "Source": "/workspace",
				      "Target": "http://localhost:8080/workspace"
				    },
				    {
				      "Source": "/org.dojotoolkit",
				      "Target": "http://localhost:8080/org.dojotoolkit"
				    },
				    {
				      "Source": "/users",
				      "Target": "http://localhost:8080/users"
				    },
				    {
				      "Source": "/auth2",
				      "Target": "http://localhost:8080/auth2"
				    },
				    {
				      "Source": "/login",
				      "Target": "http://localhost:8080/login"
				    },
				    {
				      "Source": "/loginstatic",
				      "Target": "http://localhost:8080/loginstatic"
				    },
				    {
				      "Source": "/site",
				      "Target": "http://localhost:8080/site"
				    },
				    {
				      "Source": "/",
				      "Target": this.path + "/bundles/org.eclipse.orion.client.git/static"
				    },
				    {
					  "Source": "/git",
					  "Target": "http://localhost:8080/git"
					},
				    {
				      "Source": "/gitapi",
				      "Target": "http://localhost:8080/gitapi"
				    },
				    {
				      "Source": "/",
				      "Target": this.path + "/bundles/org.eclipse.orion.client.users.ui/static"
				    },
				    {
				      "Source": "/xfer",
				      "Target": "http://localhost:8080/xfer"
				    },
				    {
				      "Source": "/filesearch",
				      "Target": "http://localhost:8080/filesearch"
				    },
				    {
				      "Source": "/index.jsp",
				      "Target": "http://localhost:8080/index.jsp"
				    },
				    {
				      "Source": "/plugins/git",
				      "Target": "http://localhost:8080/plugins/git"
				    },
				    {
				      "Source": "/plugins/user",
				      "Target": "http://localhost:8080/plugins/user"
				    },
				    {
				      "Source": "/logout",
				      "Target": "http://localhost:8080/logout"
				    }
				];
				for (var i = 0; i<mappings.length; i++) {
					editor.mappings._addMapping(mappings[i].Source, mappings[i].Target);
				}
				self.onSubmit();
			} else {
				editor.mappings._addMapping("/mountPoint", this.path);
			}
		};
//		var addOther = function() {
//			editor.mappings._addMapping("/mountPoint", "/FolderId/somepath");
//		};
		var addUrl = function() {
			editor.mappings._addMapping("/mountPoint", "http://someurl");
		};
		
		var choices = dojo.map(projects, function(project) {
				return {
					name: "Folder: /" + project.Name,
					path: mSiteUtils.makeRelativeFilePath(project.Location),
					callback: callback
				};
			});
		
		if (projects.length > 0) {
			choices.push({}); // Separator
		}
		choices.push({name: "URL", callback: addUrl});
//		choices.push({name: "Other", callback: addOther});
		return choices;
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
	
	_setSiteConfiguration: function(siteConfiguration) {
		this._detachListeners(this._siteConfiguration);
		this._siteConfiguration = siteConfiguration;
		this._refreshFields();
		this._attachListeners(this._siteConfiguration);
	},
	
	_refreshFields: function() {
		this.name.set("value", this._siteConfiguration.Name);
		this.hostHint.set("value", this._siteConfiguration.HostHint);
		this.mappings.setMappings(this._siteConfiguration.Mappings);
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
			var handle = dojo.connect(widget, "onChange", null, function(/**Event*/ e) {
				var value = widget.get("value");
				site[modelField] = value;
				
//				console.debug("Change " + modelField + " to " + value);
			});
			editor._modelListeners.push(handle);
		}
		
		bindText(this.name, "Name");
		bindText(this.hostHint, "HostHint");
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
		editor._fileClient.loadWorkspaces().then(function(workspaces) {
				editor._workspaces.callback(workspaces);
				editor._loadWorkspaceChildren(workspaces);
			},
			function(error) {
				editor._workspaces.errback(error);
			});
	},
	
	/**
	 * Loads each workspace's children and resolves this._workspaceToChildren with the completed
	 * Id-to-Children map.
	 * @param workspaces
	 */
	_loadWorkspaceChildren: function(workspaces) {
		var editor = this;
		
		// Promise for each workspace's children
		var promises = dojo.map(workspaces, function(workspace) {
			return editor._fileClient.fetchChildren(workspace.Location).then(function(children) {
				return {id: workspace.Id, children: children};
			});
		});
		
		var deferredList = new dojo.DeferredList(promises);
		deferredList.then(function(/*Array*/ results) {
				var map = {};
				dojo.forEach(results, function(/*Array*/ result) {
					// result[0] is the workspace number, result[1] is the data
					var data = result[1];
					map[data.id] = data.children;
				});
				
				// Finally, we've built the map
				editor._workspaceToChildren.callback(map);
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
			var editor = this;
			var siteConfig = editor._siteConfiguration;
			// Omit the HostingStatus field before save since it's likely to be updated from
			// the sites page, and we don't want to overwrite
			delete siteConfig.HostingStatus;
			var deferred = this._siteService.updateSiteConfiguration(siteConfig.Location, siteConfig).then(
					function(updatedSiteConfig) {
						editor._setSiteConfiguration(updatedSiteConfig);
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
		this.saveButton.set("disabled", false);
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
