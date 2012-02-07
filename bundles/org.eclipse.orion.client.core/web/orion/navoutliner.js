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

define(['require', 'dojo', 'orion/util', 'orion/commands'], function(require, dojo, mUtil, mCommands){

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
		var toolbar = options.toolbar;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (typeof(toolbar) === "string") {
			toolbar = dojo.byId(toolbar);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		this._toolbar = toolbar;
		var navoutliner = this;
		var reg = options.serviceRegistry;
		
		var addFaveURLCommand = new mCommands.Command({
			name: "Add",
			tooltip: "Add link as favorite",
			imageClass: "core-sprite-add",
			id: "eclipse.addExternalFave",
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("url", "text", 'URL:', '')], false),
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
			visibleWhen: function(item) {return item.isFavorite;},
			callback: function(data) {
				if(window.confirm("Do you want to remove " + data.items.name + " from favorites?")) {
					options.serviceRegistry.getService("orion.core.favorite").removeFavorite(data.items.path);
				}
			}
		});		
		var renameFaveCommand = new mCommands.Command({
			name: "Rename",
			imageClass: "core-sprite-rename",
			id: "eclipse.renameFave",
			visibleWhen: function(item) {return item.isFavorite;},
			callback: dojo.hitch(this, function(data) {
				this.editFavoriteName(data.items, data.id, data.domNode.id, data.userData);
			})
		});
		var renameSearchCommand = new mCommands.Command({
			name: "Rename",
			imageClass: "core-sprite-rename",
			id: "eclipse.renameSearch",
			visibleWhen: function(item) {return item.isSearch;},
			callback: dojo.hitch(this, function(data) {
				this.editSearchName(data.items, data.id, data.domNode.id, data.userData);
			})
		});
		var deleteSearchCommand = new mCommands.Command({
			name: "Delete",
			imageClass: "core-sprite-delete",
			id: "eclipse.deleteSearch",
			visibleWhen: function(item) {return item.isSearch;},
			callback: function(data) {
				if(window.confirm("Do you want to remove " + data.items.name + " from favorites?")) {
					options.serviceRegistry.getService("orion.core.favorite").removeSearch(data.items.query);
				}
			}
		});
		var commandService = this._registry.getService("orion.page.command");
		// register commands with object scope
		commandService.addCommand(deleteFaveCommand, "object");
		commandService.addCommand(renameFaveCommand, "object");
		commandService.addCommand(renameSearchCommand, "object");	
		commandService.addCommand(deleteSearchCommand, "object");	
		commandService.addCommand(addFaveURLCommand, "dom");		
		// declare the contribution to the ui
		commandService.addCommandGroup("orion.favorites", 100, "*");
		commandService.registerCommandContribution("eclipse.renameFave", 1, null, "orion.favorites");
		commandService.registerCommandContribution("eclipse.deleteFave", 2, null, "orion.favorites");
		commandService.registerCommandContribution("eclipse.renameSearch", 1, null, "orion.favorites");	
		commandService.registerCommandContribution("eclipse.deleteSearch", 2, null, "orion.favorites");
		commandService.registerCommandContribution("eclipse.addExternalFave", 1, "faveCommands");		

		var favoritesService = this._registry.getService("orion.core.favorite");
		if (favoritesService) {
			// render the favorites
			var registry = this._registry;
			favoritesService.getFavorites().then(function(favs) {
				navoutliner.render(favs.navigator, favs.search, registry);
			});

			favoritesService.addEventListener("favoritesChanged", function(favs) {
				navoutliner.render(favs.navigator, favs.search, favs.registry);
			});
		}
	}
	NavigationOutliner.prototype = /** @lends orion.navoutliner.NavigationOutliner.prototype */ {
		
		editFavoriteName: function(fave, commandId, imageId, faveIndex) {
			var reg = this._registry;
			var link = dojo.byId("fave"+faveIndex);
			
			// hide command buttons while editor is up
			var commandParent = dojo.byId(imageId).parentNode;
			dojo.style(link, "display", "none");
			var children = commandParent.childNodes;
			for (var i = 0; i < children.length; i++) {
				dojo.style(children[i], "display", "none");
			}
			mUtil.getUserText(imageId+"EditBox", link, true, fave.name, 
				function(newText) {
					reg.getService("orion.core.favorite").renameFavorite(fave.path, newText);
				}, 
				function() {
					// re-show the local commands
					var commandParent = dojo.byId(imageId).parentNode;
					var children = commandParent.childNodes;
					for (var i = 0; i < children.length; i++) {
						dojo.style(children[i], "display", "inline");
					}
				});				
		},

		editSearchName: function(search, commandId, imageId, faveIndex) {
			var reg = this._registry;
			var link = dojo.byId("search"+faveIndex);
			
			// hide command buttons while editor is up
			var commandParent = dojo.byId(imageId).parentNode;
			dojo.style(link, "display", "none");
			var children = commandParent.childNodes;
			for (var i = 0; i < children.length; i++) {
				dojo.style(children[i], "display", "none");
			}
			mUtil.getUserText(imageId+"EditBox", link, true, search.name, 
				function(newText) {
					reg.getService("orion.core.favorite").renameSearch(search.query, newText);
				}, 
				function() {
					// re-show the local commands
					var commandParent = dojo.byId(imageId).parentNode;
					var children = commandParent.childNodes;
					for (var i = 0; i < children.length; i++) {
						dojo.style(children[i], "display", "inline");
					}
				});				
		},
		render: function(favorites, searches, serviceRegistry) {
			dojo.empty(this._parent);
			var link;
			if (serviceRegistry) {
				var allReferences = serviceRegistry.getServiceReferences("orion.core.file");
				// top level folder outline if there is more than one file service
				if (allReferences.length > 1) {
					mUtil.createPaneHeading(this._parent, "fileServerSectionHeading", "File Servers", true);
					
					var fileSystemTable = dojo.create("table", {id: "fileSystemTable"});
					dojo.addClass(fileSystemTable, "favoritesTable");
					var body = dojo.create("tbody", null, fileSystemTable);
					for(var i = 0; i < allReferences.length; ++i) {
						var name = allReferences[i].getProperty("Name");
						var location = allReferences[i].getProperty("top");
						if (name && location) {
							var navLocation = require.toUrl("navigate/table.html") + "#" + location;
							var row = dojo.create("tr", null, body);
							var col = dojo.create("td", null, row);
							link = dojo.create("a", {href: navLocation}, col);
							dojo.addClass(link, "navlinkonpage");
							var label = window.document.createTextNode(name);
							dojo.place(label, link, "last");
						}
					}
					dojo.place(fileSystemTable, this._parent);
				}
			}
			

			// Favorites heading
			mUtil.createPaneHeading(this._parent, "favoritesHeading", "Favorites", true, null, "faveCommands", this._registry.getService("orion.page.command"), this);

			// favorites
			var navOutlineTable = dojo.create("table", {id: "favoritesTable"});
			dojo.addClass(navOutlineTable, "favoritesTable");
			var id, tr, col1, href, actionsWrapper;
			var tbody = dojo.create("tbody", null, navOutlineTable);

			for (var j=0; j < favorites.length; j++) {
				var fave = favorites[j];
				if (fave.isExternalResource) {
					href = fave.path;
				} else {
					href = fave.directory ? require.toUrl("navigate/table.html") + "#" + fave.path : require.toUrl("edit/edit.html") + "#" + fave.path;
					if (href==="#") {
						href="";
					}
				}
				var clazz = fave.directory ? "navlinkonpage" : "navlink";
				id = "fave"+j;
				tr = dojo.create("tr");
				tr.id = "row"+id;
				col1 = dojo.create("td", null, tr, "last");
				dojo.style(col1, "whiteSpace", "nowrap");
				link = dojo.create("a", {id: id, href: href, className: clazz}, col1, "only");
				dojo.place(window.document.createTextNode(fave.name), link, "only");
				actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col1, "last");
				this._registry.getService("orion.page.command").renderCommands(actionsWrapper, "object", fave, this, "tool", false, j);
				dojo.place(tr, tbody, "last");
			}
			dojo.place(navOutlineTable, this._parent, "last");
			
			// spacer, which also is a placeholder for newly added favorites
			var spacer = dojo.create("tr", null, navOutlineTable);
			spacer = dojo.create("td", {colspan: 2}, spacer);
			dojo.create("span", {id: "spacer"}, spacer);

			// Searches if we have them
			if (searches.length > 0) {
				mUtil.createPaneHeading(this._parent, "searchesHeading", "Searches", true);
				navOutlineTable = dojo.create("table", {id: "searchTable"});
				dojo.addClass(navOutlineTable, "favoritesTable");

				tbody = dojo.create("tbody", null, navOutlineTable);
				for (var k=0; k < searches.length; k++) {
					var search = searches[k];
					href=require.toUrl("search/search.html") + "#" + search.query;
					id = "search"+k;
					tr = dojo.create("tr");
					tr.id = "searchRow"+id;
					col1 = dojo.create("td", null, tr, "last");
					link = dojo.create("a", {id:id, href: href}, col1, "only");
					dojo.place(window.document.createTextNode(search.name), link, "only");
					actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col1, "last");
					this._registry.getService("orion.page.command").renderCommands(actionsWrapper, "object", search, this, "tool", false, k);
					dojo.place(tr, tbody, "last");
				}
			}
		}
	};//end navigation outliner prototype
	NavigationOutliner.prototype.constructor = NavigationOutliner;

	//return module exports
	return {
		NavigationOutliner: NavigationOutliner
	};
});
