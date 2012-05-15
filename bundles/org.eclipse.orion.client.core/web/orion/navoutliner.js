/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
 
/*global window define setTimeout */
/*jslint forin:true*/

define(['require', 'dojo', 'orion/util', 'orion/commands', 'orion/section', 'orion/selection', 'orion/explorer'], function(require, dojo, mUtil, mCommands, mSection, mSelection, mExplorer){

	function NavOutlineRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
	}
	NavOutlineRenderer.prototype = mExplorer.SelectionRenderer.prototype;
	NavOutlineRenderer.prototype.constructor = NavOutlineRenderer;
	NavOutlineRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	NavOutlineRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var href, clazz, name;
		if (item.directory) {
			href = require.toUrl("navigate/table.html") + "#" + item.path;
			clazz = "navlinkonpage";
			name = item.name;
		} else if (item.path) {
			href = require.toUrl("edit/edit.html") + "#" + item.path;
			clazz = "navlink";
			name = item.name;
		} else if (typeof(item.getProperty) === "function" && item.getProperty("Name") && item.getProperty("top")) {
			href = require.toUrl("navigate/table.html") + "#" + item.getProperty("top");
			clazz = "navlinkonpage";
			name = item.getProperty("Name");
		} else {
			href = "";
			name = "Unknown item";
		}
		if (href === "#") {
			href="";
		}

		var col = dojo.create("td", null, tableRow, "last");
		dojo.addClass(col, "mainNavColumn");
		dojo.style(col, "whiteSpace", "nowrap");
		var link = dojo.create("a", {href: href, className: clazz}, col, "only");
		dojo.place(window.document.createTextNode(name), link, "only");
		mUtil.addNavGrid(item, link);
	};

	function NavOutlineExplorer(serviceRegistry, selection) {
		this.selection = selection;
		this.registry = serviceRegistry;
		this.renderer = new NavOutlineRenderer({checkbox: false, decorateAlternatingLines: false}, this);
	}
	NavOutlineExplorer.prototype = mExplorer.Explorer.prototype;	
	NavOutlineExplorer.prototype.constructor = NavOutlineExplorer;

	

	/**
	 * Creates a new user interface element showing an outliner used for navigation
	 *
	 * @name orion.navoutliner.NavigationOutliner
	 * @class A user interface element showing a list of various navigation links.
	 * @param {Object} options The service options
	 * @param {Object} options.parent The parent of this outliner widget
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 */
	function NavigationOutliner(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		var reg = options.serviceRegistry;
		
		var deleteFaveCommand = new mCommands.Command({
			name: "Delete",
			imageClass: "core-sprite-delete",
			id: "eclipse.deleteFave",
			visibleWhen: function(items) {
				items = dojo.isArray(items) ? items : [items];
				if (items.length === 0) {
					return false;
				}
				for (var i=0; i<items.length; i++) {
					if (!items[i].isFavorite) {
						return false;
					}
				}
				return true;
			},
			callback: dojo.hitch(this, function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].name + "' from the favorites?" : "Are you sure you want to delete these " + items.length + " favorites?";
				if(window.confirm(confirmMessage)) {
					for (var i=0; i<items.length; i++) {
						options.serviceRegistry.getService("orion.core.favorite").removeFavorite(items[i].path);
					}
				}
			})
		});		
		var renameFaveCommand = new mCommands.Command({
			name: "Rename",
			imageClass: "core-sprite-rename",
			id: "eclipse.renameFave",
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("name", "text", 'Name:', '')]),
			visibleWhen: function(items) {
				items = dojo.isArray(items) ? items : [items];
				return items.length === 1 && items[0].isFavorite;
			},
			callback: dojo.hitch(this, function(data) {
				var item = dojo.isArray(data.items) ? data.items[0] : data.items;
				
				if (data.parameters && data.parameters.valueFor('name')) {
					reg.getService("orion.core.favorite").renameFavorite(item.path, data.parameters.valueFor('name'));
				}
			})
		});
		this.commandService = this._registry.getService("orion.page.command");
		// register commands 
		this.commandService.addCommand(deleteFaveCommand);
		this.commandService.addCommand(renameFaveCommand);
		var favoritesService = this._registry.getService("orion.core.favorite");
		var navoutliner = this;

		if (favoritesService) {
			// render the favorites
			var registry = this._registry;
			favoritesService.getFavorites().then(dojo.hitch(navoutliner, function(favs) {
				this.render(favs.navigator, registry);
			}));

			favoritesService.addEventListener("favoritesChanged", dojo.hitch(navoutliner,
				function(favs) {
					// TODO temporary code, get rid of old "external favorites"
					// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=379435
					var faves = [];
					for (var i=0; i<favs.navigator.length; i++) {
						if (!favs.navigator[i].isExternalResource) {
							faves.push(favs.navigator[i]);
						}
					}
					this.render(faves, favs.registry);
				}));
		}
	}
	NavigationOutliner.prototype = /** @lends orion.navoutliner.NavigationOutliner.prototype */ {

		render: function(favorites, serviceRegistry) {
			var commandService = this.commandService;

			if (serviceRegistry) {
				var allReferences = serviceRegistry.getServiceReferences("orion.core.file");
				// top level folder outline if there is more than one file service.  We never show this if there is only one file service,
				// because it's not an interesting concepts for users.
				if (allReferences.length > 1) {
					if (!this.fileSystemsSection) {
						this.fileSystemsSection = new mSection.Section(this._parent, {
							id: "fileSystemsSection",
							title: "Places",
							content: '<div id="fileSystemsContent"></div>',
							// we don't have any file system level commands yet....
							// commandService: this.commandService,
							// explorer: this,
							preferenceService: serviceRegistry.getService("orion.core.preference"),
							canHide: true
						});
						this.fileSystemMonitor = this.fileSystemsSection.createProgressMonitor();
					}
					this.explorer = new NavOutlineExplorer(serviceRegistry, this.fileSystemSelection);
					this.fileSystemsTable = this.explorer.createTree("fileSystemsContent", new mExplorer.SimpleFlatModel(allReferences, "fs", function(item) {
						if (typeof(item.getProperty) === "function" && item.getProperty("top")) {
							return item.getProperty("top");
						}
						return "";
					}));
					this.fileSystemMonitor.done();
				}
			}
			
			// first time setup
			if (!this.favoritesSection) {
				this.favoritesSection = new mSection.Section(this._parent, {
					id: "favoritesSection",
					title: "Favorites",
					content: '<div id="favoritesContent"></div>',
					explorer: this,
					commandService: this.commandService,
					preferenceService: serviceRegistry.getService("orion.core.preference"),
					canHide: true
				});
				this.favoritesMonitor = this.favoritesSection.createProgressMonitor();
				this.favoritesSelection = new mSelection.Selection(serviceRegistry, "orion.favorites.selection");
				// add commands to the fave section heading
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.renameFave", 1);
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.deleteFave", 2);
				commandService.registerSelectionService(this.favoritesSection.selectionNode.id, this.favoritesSelection);
				var selectionId = this.favoritesSection.selectionNode.id;
				serviceRegistry.getService("orion.favorites.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						commandService.renderCommands(selectionId, selectionTools, selections, this, "button");
					}
				});
			}
			if (favorites.length > 0) {
				this.explorer = new NavOutlineExplorer(serviceRegistry, this.favoritesSelection);
				this.favoritesTable = this.explorer.createTree("favoritesContent", new mExplorer.SimpleFlatModel(favorites, "fav", function(item) {
					return item.path || "";
				}));
				// TODO temporary hack from Libing 
				this.explorer.navHandler._clearSelection(false);
			} else {
				dojo.place("<p>You can create favorites by selecting any file or folder in the navigator and choosing <b>Make Favorite</b> from the More menu.</p>", "favoritesContent", "only");
			}
			this.favoritesMonitor.done();
		}
	};//end navigation outliner prototype
	NavigationOutliner.prototype.constructor = NavigationOutliner;

	//return module exports
	return {
		NavigationOutliner: NavigationOutliner
	};
});
