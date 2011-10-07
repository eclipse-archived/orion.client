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
/*jslint browser:true regexp:true */

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/explorer'],
		function(require, dojo, dijit, mUtil, mCommands, mExplorer) {

var mSiteMappingsTable = {};

function mixin(target, source) {
	for (var p in source) {
		if (source.hasOwnProperty(p)) { target[p] = source[p]; }
	}
}

function isWorkspacePath(/**String*/ path) {
	return new RegExp("^/").test(path);
}

mSiteMappingsTable.Model = (function() {
	function Model(rootPath, fetchItems, items) {
		this.rootPath = rootPath;
		this.fetchItems = fetchItems;
		this.items = items;
	}
	Model.prototype = new mExplorer.ExplorerFlatModel();
	mixin(Model.prototype, {
		getId: function(/**Object*/ item) {
			var result;
			if (item === this.root) {
				result = this.rootId;
			} else {
				result = "mapping_" + this.items.indexOf(item);
			}
			return result;
		}});
	return Model;
}());

/**
 * @param {Function} options.onchange Callback with signature: <code>function(item, fieldName, newValue, event)</code>
 */
mSiteMappingsTable.Renderer = (function() {
	function Renderer(options, explorer) {
		this._init(options);
		this.options = options;
		this.explorer = explorer;
	}
	Renderer.prototype = new mExplorer.SelectionRenderer();
	mixin(Renderer.prototype, {
		getCellHeaderElement: function(/**Number*/ col_no) {
			var col;
			switch(col_no){
				case 0:
					col = dojo.create("th", {innerHTML: " "});
					dojo.addClass(col, "isValidColumn");
					return col;
				case 1: return dojo.create("th", {innerHTML: "Path"});
				case 2: return dojo.create("th", {innerHTML: "Mount at (server path)"});
				case 3: return dojo.create("th", {innerHTML: "Actions"});
			}
		},
		getCellElement: function(/**Number*/ col_no, /**Object*/ item, /**HTMLTableRowElement*/ tableRow) {
			var col, input;
			switch(col_no) {
				case 0:
					return this.getIsValidCell(col_no, item, tableRow);
				case 1: // Path
					col = dojo.create("td");
					input = dojo.create("input");
					dojo.addClass(input, "pathInput");
					input.value = item.FriendlyPath;
					input.onchange = dojo.hitch(this, function(event) {
							this.options.onchange(item, "FriendlyPath", event.target.value, event);
						});
					dojo.place(input, col);
					return col;
				case 2: // Mount at
					col = dojo.create("td");
					input = dojo.create("input");
					dojo.addClass(input, "serverPathInput");
					input.value = item.Source;
					input.onchange = dojo.hitch(this, function(event) {
							this.options.onchange(item, "Source", event.target.value, event);
						});
					dojo.place(input, col);
					return col;
				case 3: // Actions
					return this.getActionsColumn(item, tableRow);
			}
		},
		getIsValidCell: function(/**Number*/ col_no, /**Object*/ item, /**HTMLTableRowElement*/ tableRow) {
			var target = item.Target;
			var col = document.createElement("td");
			var href, result;
			if (isWorkspacePath(target)) {
				var location = this.options.siteService.makeFullFilePath(target);
				href = mUtil.safeText(location);
				col.innerHTML = "<span class=\"validating\">&#8230;</span>";
				// TODO: should use fileClient here, but without authentication prompt & without retrying
				//this._fileClient.fetchChildren(location)
				dojo.xhrGet({
					url: location,
					headers: { "Orion-Version": "1" },
					handleAs: "json"
				}).then(
					function(children) {
						col.innerHTML = '<a href="' + href + '" target="_new"><span class="imageSprite core-sprite-folder" title="Workspace folder ' + href + '"/></a>';
					}, function(error) {
						col.innerHTML = '<a href="' + href + '" target="_new"><span class="imageSprite core-sprite-error" title="Workspace folder not found: ' + href + '"/></a>';
					});
			} else {
				href = mUtil.safeText(target);
				col.innerHTML = '<a href="' + href + '" target="_new"><span class="imageSprite core-sprite-link" title="External link to ' + href + '"/></a>';
			}
			dojo.addClass(col, "isValidCell");
			return col;
		}
	});
	return Renderer;
}());

/**
 * @name orion.sites.MappingsTable
 */
mSiteMappingsTable.MappingsTable = (function() {
	function MappingsTable(serviceRegistry, siteService, selection, parentId, siteConfiguration, /**dojo.Deferred*/ projectsPromise) {
		this.registry = serviceRegistry;
		serviceRegistry.getService("orion.page.command").then(dojo.hitch(this, function(commandService) {
			this.commandService = commandService;
			this.registerCommands();
		}));
		this.siteService = siteService;
		this.parentId = parentId;
		this.selection = selection;
		this.renderer = new mSiteMappingsTable.Renderer({
				checkbox: false, /*TODO make true when we have selection-based commands*/
				onchange: dojo.hitch(this, this.fieldChanged),
				siteService: siteService
			}, this);
		this.myTree = null;
		this.siteConfiguration = siteConfiguration;
		this.projectsPromise = projectsPromise;
		this.setDirty(false);
	}
	MappingsTable.prototype = new mExplorer.Explorer();
	mixin(MappingsTable.prototype, /** @lends orion.sites.MappingsTable.prototype */ {
		startup: function() {
			var fetchItems = dojo.hitch(this, function() {
				var d = new dojo.Deferred();
				d.callback(this.siteConfiguration.Mappings);
				return d;
			});
			dojo.when(this.projectsPromise, dojo.hitch(this, function(projects) {
				this.projects = projects;
				// Make FriendlyPath
				this.siteConfiguration.Mappings = dojo.map(this.siteConfiguration.Mappings, dojo.hitch(this, function(mapping) {
					return this.createMappingObject(mapping.Source, mapping.Target);
				}));
				// Build visuals
				this.createTree(this.parentId, new mSiteMappingsTable.Model(null, fetchItems, this.siteConfiguration.Mappings));
			}));
		},
		render: function() {
			this.changedItem(this.siteConfiguration.Mappings, this.siteConfiguration.Mappings);
		},
		registerCommands: function() {
			var deleteMappingCommand = new mCommands.Command({
				name: "Delete",
				imageClass: "core-sprite-delete",
				id: "eclipse.site.mappings.remove",
				visibleWhen: function(item) {
					// Only show on a Mappings object
					return item.Source && item.Target;
				},
				callback: dojo.hitch(this, function(item) {
					//table._hideTooltip();
					this.deleteMapping(item);
					this.render();
					this.setDirty(true);
				})});
			this.commandService.addCommand(deleteMappingCommand , "object");
			this.commandService.registerCommandContribution("eclipse.site.mappings.remove", 0);
			
			var moveUpCommand = new mCommands.Command({
				name: "Move Up",
				imageClass: "core-sprite-move_up",
				id: "eclipse.site.mappings.moveUp",
				visibleWhen: dojo.hitch(this, function(item) {
					return item.Source && item.Target;
				}),
				callback: dojo.hitch(this, function(item) {
					var index = this.getItemIndex(item);
					if (index === 0) { return; }
					var temp = this.siteConfiguration.Mappings[index-1];
					this.siteConfiguration.Mappings[index-1] = item;
					this.siteConfiguration.Mappings[index] = temp;
					this.render();
					this.setDirty(true);
				})});
			this.commandService.addCommand(moveUpCommand, "object");
			this.commandService.registerCommandContribution("eclipse.site.mappings.moveUp", 1);
			
			var moveDownCommand = new mCommands.Command({
				name: "Move Down",
				imageClass: "core-sprite-move_down",
				id: "eclipse.site.mappings.moveDown",
				visibleWhen: dojo.hitch(this, function(item) {
					return item.Source && item.Target;
				}),
				callback: dojo.hitch(this, function(item) {
//					this._hideTooltip();
					var index = this.getItemIndex(item);
					if (index === this.siteConfiguration.Mappings.length - 1) { return; }
					var temp = this.siteConfiguration.Mappings[index+1];
					this.siteConfiguration.Mappings[index+1] = item;
					this.siteConfiguration.Mappings[index] = temp;
					this.render();
					this.setDirty(true);
				})});
			this.commandService.addCommand(moveDownCommand, "object");
			this.commandService.registerCommandContribution("eclipse.site.mappings.moveDown", 2);
		},
		getItemIndex: function(item) {
			return this.siteConfiguration.Mappings.indexOf(item);
		},
		// TODO: use makeNewItemPlaceHolder() ?
		_addMapping: function(/**String*/ source, /**String*/ target, /**String*/ friendlyPath) {
			source = this.safePath(typeof(source) === "string" ? source : this.getNextMountPoint(friendlyPath));
			target = this.safePath(typeof(target) === "string" ? target : "/");
			if (!this.mappingExists(source, target)) {
				var newItem = this.createMappingObject(source, target);
				this.siteConfiguration.Mappings.push(newItem);
			}
		},
		addMapping: function(source, target, friendlyPath) {
			this._addMapping(source, target, friendlyPath);
			this.render();
			this.setDirty(true);
		},
		addMappings: function(mappings) {
			for (var i=0; i < mappings.length; i++) {
				this._addMapping(mappings[i].Source, mappings[i].Target);
			}
			this.render();
			this.setDirty(true);
		},
		mappingExists: function(source, target) {
			if (typeof source === "object" && typeof target === "undefined") {
				target = source.Target;
				source = source.Source;
			}
			var mappings = this.siteConfiguration.Mappings;
			for (var i=0; i < mappings.length; i++) {
				if (mappings[i].Source === source && mappings[i].Target === target) {
					return true;
				}
			}
			return false;
		},
		getNextMountPoint: function(/**String*/ friendlyPath) {
			// Try root first
			var mappings = this.siteConfiguration.Mappings;
			var hasRoot = false;
			for (var i=0; i < mappings.length; i++) {
				if (mappings[i].Source === "/") {
					hasRoot = true;
					break;
				}
			}
			if (!hasRoot) {
				return "/";
			}
			// Else base it on friendlyPath
			if (!friendlyPath) {
				return "/web/somePath";
			}
			var segments = friendlyPath.split("/");
			for (i = segments.length-1; i >= 0; i--) {
				if (!/\s+/.test(segments[i])) {
					return "/" + segments[i];
				}
			}
			return "/web/somePath";
		},
		createMappingObject: function(source, target) {
			return {Source: source, Target: target, FriendlyPath: this.toFriendlyPath(target)};
		},
		deleteMapping: function(/**Object*/ mapping) {
			var index = this.siteConfiguration.Mappings.indexOf(mapping);
			if (index !== -1) {
				this.siteConfiguration.Mappings.splice(index, 1);
			}
		},
		deleteAllMappings: function() {
			this.siteConfiguration.Mappings.splice(0, this.siteConfiguration.Mappings.length);
		},
		fieldChanged: function(/**Object*/ item, /**String*/ fieldName, /**String*/ newValue, /**Event*/ event) {
			newValue = this.safePath(newValue);
			var oldValue = item[fieldName];
			if (oldValue !== newValue) {
				item[fieldName] = newValue;
				if (fieldName === "FriendlyPath") {
					this.propagate(newValue, item);
				}
				this.render();
				this.setDirty(true);
			}
		},
		toFriendlyPath: function(target) {
			var friendlyPath;
			if (isWorkspacePath(target)) {
				for (var i=0; i < this.projects.length; i++) {
					var project = this.projects[i];
					var name = "/" + project.Name;
					var location = this.siteService.makeRelativeFilePath(project.Location);
					if (this.pathsMatch(target, location)) {
						friendlyPath = name + target.substring(location.length);
						break;
					}
				}
			}
			return friendlyPath || target;
		},
		/** Rewrites item's FriendlyPath using the project shortname and sets the result into the Target */
		propagate: function(friendlyPath, item) {
			if (isWorkspacePath(friendlyPath)) {
				for (var i=0; i < this.projects.length; i++) {
					var project = this.projects[i];
					var name = "/" + project.Name;
					var location = this.siteService.makeRelativeFilePath(project.Location);
					if (this.pathsMatch(friendlyPath, name)) {
						var rest = friendlyPath.substring(name.length);
						item.Target = location + rest;
						return;
					}
				}
			}
			// Bogus workspace path, or not a workspace path at all
			item.Target = friendlyPath;
		},
		/** @returns true if b is a sub-path of a */
		pathsMatch: function(a, b) {
			return a === b || a.indexOf(b + "/") === 0;
		},
		safePath: function(str) {
			return str.replace(/[\r\n\t]/g, "");
		},
		setDirty: function(value) {
			this._isDirty = value;
		},
		isDirty: function() {
			return this._isDirty;
		}
	});
	return MappingsTable;
}());

return mSiteMappingsTable;
});