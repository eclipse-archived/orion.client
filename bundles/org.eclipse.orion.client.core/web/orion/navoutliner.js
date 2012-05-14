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

define(['require', 'dojo', 'orion/util', 'orion/commands', 'orion/selection', 'orion/explorer'], function(require, dojo, mUtil, mCommands, mSelection, mExplorer){

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
		var href, clazz;
		if (item.isExternalResource) {
			href = item.path;
			clazz = "navlink";
		} else if (item.directory) {
			href = require.toUrl("navigate/table.html") + "#" + item.path;
			clazz= "navlinkonpage";
		} else if (item.path) {
			href = require.toUrl("edit/edit.html") + "#" + item.path;
			clazz = "navlink";
		} else if (typeof(item.getProperty) === "function" && item.getProperty("Name") && item.getProperty("top")) {
			href = require.toUrl("navigate/table.html") + "#" + item.getProperty("top");
			clazz = "navlinkonpage";
		} else {
			href = "";
			item.name = "Unknown item";
		}
		if (href === "#") {
			href="";
		}

		var col = dojo.create("td", null, tableRow, "last");
		dojo.addClass(col, "mainNavColumn");
		dojo.style(col, "whiteSpace", "nowrap");
		var link = dojo.create("a", {href: href, className: clazz}, col, "only");
		dojo.place(window.document.createTextNode(item.name), link, "only");
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
		
		var addFaveURLCommand = new mCommands.Command({
			name: "Add",
			tooltip: "Add link as favorite",
			imageClass: "core-sprite-add",
			id: "eclipse.addExternalFave",
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("url", "text", 'URL:', '')]),
			callback: dojo.hitch(this, function(data) {
				if (data.parameters) {
					var newText = data.parameters.valueFor('url');
					if (newText) {
						var favService = reg.getService("orion.core.favorite");
						favService.hasFavorite(newText).then(function(result) {
							if (!result) {
								favService.addFavoriteUrl(newText);
							} else {
								reg.getService("orion.page.message").setMessage(newText + " is already a favorite.", 2000);
							}
						});
					}
				}
			})
		});		
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
		this.commandService.addCommand(addFaveURLCommand);	
		// to the fave section heading
		this.commandService.registerCommandContribution("faveCommands", "eclipse.renameFave", 1);
		this.commandService.registerCommandContribution("faveCommands", "eclipse.deleteFave", 2);
		this.commandService.registerCommandContribution("faveCommands", "eclipse.addExternalFave", 3);		

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
					this.render(favs.navigator, favs.registry);
				}));
		}
	}
	NavigationOutliner.prototype = /** @lends orion.navoutliner.NavigationOutliner.prototype */ {

		render: function(favorites, serviceRegistry) {
			var link;
			if (serviceRegistry) {
				var allReferences = serviceRegistry.getServiceReferences("orion.core.file");
				// top level folder outline if there is more than one file service
				if (allReferences.length > 1) {
					mUtil.createPaneHeading(this._parent, "fileServerSectionHeading", "Places", true);
				}
			}
			
			var navOutlineTable, id, tr, col1, href, actionsWrapper, tbody;
			var commandService = this.commandService;
			if (favorites.length > 0) {
				// first time setup
				if (!this.favoritesDiv) {
					mUtil.createPaneHeading(this._parent, "favoritesHeading", "Favorites", true, null, "faveCommands", this._registry.getService("orion.page.command"), this);
					this.favoritesDiv = dojo.create("div", {id: "favoritesContent"}, this._parent);
					this.favoritesSelection = new mSelection.Selection(serviceRegistry, "orion.favorites.selection");
					commandService.registerSelectionService("faveCommands", this.favoritesSelection);
					serviceRegistry.getService("orion.favorites.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
						var selectionTools = dojo.byId("faveCommands");
						if (selectionTools) {
							dojo.empty(selectionTools);
							commandService.renderCommands("faveCommands", selectionTools, selections, this, "button");
						}
					});
				}
				this.explorer = new NavOutlineExplorer(serviceRegistry, this.favoritesSelection);
				this.favoritesTable = this.explorer.createTree(this.favoritesDiv.id, new mExplorer.SimpleFlatModel(favorites, "fav", function(item) {
					if (item.path) {
						return item.path;
					}
					if (typeof(item.getProperty) === "function" && item.getProperty("top")) {
						return item.getProperty("top");
					}
					return "";
				}));
				// TODO temporary hack from Libing 
				this.explorer.navHandler._clearSelection(false);
			}
		}
	};//end navigation outliner prototype
	NavigationOutliner.prototype.constructor = NavigationOutliner;

	//return module exports
	return {
		NavigationOutliner: NavigationOutliner
	};
});
