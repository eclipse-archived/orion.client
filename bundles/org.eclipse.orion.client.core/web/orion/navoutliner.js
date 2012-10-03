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

define(['i18n!orion/navigate/nls/messages', 'require', 'dojo', 'orion/commands', 'orion/section', 'orion/selection', 'orion/explorers/explorer', 'orion/explorers/navigationUtils'], function(messages, require, dojo, mCommands, mSection, mSelection, mExplorer, mNavUtils){

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
			href = require.toUrl("navigate/table.html") + "#" + item.path; //$NON-NLS-1$ //$NON-NLS-0$
			clazz = "navlinkonpage"; //$NON-NLS-0$
			name = item.name;
		} else if (item.path) {
			href = require.toUrl("edit/edit.html") + "#" + item.path; //$NON-NLS-1$ //$NON-NLS-0$
			clazz = "navlink"; //$NON-NLS-0$
			name = item.name;
		} else if (typeof(item.getProperty) === "function" && item.getProperty("Name") && item.getProperty("top")) { //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			href = require.toUrl("navigate/table.html") + "#" + item.getProperty("top"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			clazz = "navlinkonpage"; //$NON-NLS-0$
			name = item.getProperty("Name"); //$NON-NLS-0$
		} else {
			href = "";
			name = messages["Unknown item"];
		}
		if (href === "#") { //$NON-NLS-0$
			href="";
		}

		var col = dojo.create("td", null, tableRow, "last"); //$NON-NLS-1$ //$NON-NLS-0$
		dojo.addClass(col, "mainNavColumn singleNavColumn"); //$NON-NLS-0$
		var link = dojo.create("a", {href: href, className: clazz}, col, "only"); //$NON-NLS-1$ //$NON-NLS-0$
		dojo.place(window.document.createTextNode(name), link, "only"); //$NON-NLS-0$
		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
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
		if (typeof(parent) === "string") { //$NON-NLS-0$
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; } //$NON-NLS-0$
		if (!options.serviceRegistry) {throw "no service registry"; } //$NON-NLS-0$
		this._parent = parent;
		this._registry = options.serviceRegistry;
		var reg = options.serviceRegistry;
		
		var deleteFaveCommand = new mCommands.Command({
			name: "Delete", //$NON-NLS-0$
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.deleteFave", //$NON-NLS-0$
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
				var confirmMessage = items.length === 1 ? dojo.string.substitute(messages["Are you sure you want to delete '${0}' from the favorites?"], [items[0].name]) : dojo.string.substitute(messages["Are you sure you want to delete these ${0} favorites?"], [items.length]);
				if(window.confirm(confirmMessage)) {
					for (var i=0; i<items.length; i++) {
						options.serviceRegistry.getService("orion.core.favorite").removeFavorite(items[i].path); //$NON-NLS-0$
					}
				}
			})
		});		
		var renameFaveCommand = new mCommands.Command({
			name: messages['Rename'],
			imageClass: "core-sprite-rename", //$NON-NLS-0$
			id: "eclipse.renameFave", //$NON-NLS-0$
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("name", "text", 'Name:', '')]), //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			visibleWhen: function(items) {
				items = dojo.isArray(items) ? items : [items];
				return items.length === 1 && items[0].isFavorite;
			},
			callback: dojo.hitch(this, function(data) {
				var item = dojo.isArray(data.items) ? data.items[0] : data.items;
				
				if (data.parameters && data.parameters.valueFor('name')) { //$NON-NLS-0$
					reg.getService("orion.core.favorite").renameFavorite(item.path, data.parameters.valueFor('name')); //$NON-NLS-1$ //$NON-NLS-0$
				}
			})
		});
		this.commandService = this._registry.getService("orion.page.command"); //$NON-NLS-0$
		// register commands 
		this.commandService.addCommand(deleteFaveCommand);
		this.commandService.addCommand(renameFaveCommand);
		var favoritesService = this._registry.getService("orion.core.favorite"); //$NON-NLS-0$
		var navoutliner = this;

		if (favoritesService) {
			// render the favorites
			var registry = this._registry;
			favoritesService.getFavorites().then(dojo.hitch(navoutliner, function(favs) {
				this.render(favs.navigator, registry);
			}));

			favoritesService.addEventListener("favoritesChanged", dojo.hitch(navoutliner, //$NON-NLS-0$
				function(event) {
					// TODO temporary code, get rid of old "external favorites"
					// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=379435
					var faves = [];
					for (var i=0; i<event.navigator.length; i++) {
						if (!event.navigator[i].isExternalResource) {
							faves.push(event.navigator[i]);
						}
					}
					this.render(faves, event.registry);
				}));
		}
	}
	NavigationOutliner.prototype = /** @lends orion.navoutliner.NavigationOutliner.prototype */ {

		render: function(favorites, serviceRegistry) {
			var commandService = this.commandService;
			var that = this;
			if (serviceRegistry) {
				var allReferences = serviceRegistry.getServiceReferences("orion.core.file"); //$NON-NLS-0$
				// top level folder outline if there is more than one file service.  We never show this if there is only one file service,
				// because it's not an interesting concepts for users.
				if (allReferences.length > 1) {
					if (!this.fileSystemsSection) {
						this.fileSystemsSection = new mSection.Section(this._parent, {
							id: "fileSystemsSection", //$NON-NLS-0$
							title: "Places", //$NON-NLS-0$
							content: '<div id="fileSystemsContent"></div>', //$NON-NLS-0$
							preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
							canHide: true,
							useAuxStyle: true,
							slideout: true,
							onExpandCollapse: function(isExpanded, section) {
								commandService.destroy(section.selectionNode);
								if (isExpanded) {
									commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that, "button"); //$NON-NLS-0$
								}
							}
						});
					}
					this.explorer = new NavOutlineExplorer(serviceRegistry, this.fileSystemSelection);
					this.fileSystemsTable = this.explorer.createTree("fileSystemsContent", new mExplorer.SimpleFlatModel(allReferences, "fs", function(item) { //$NON-NLS-1$ //$NON-NLS-0$
						if (typeof(item.getProperty) === "function" && item.getProperty("top")) { //$NON-NLS-1$ //$NON-NLS-0$
							return item.getProperty("top"); //$NON-NLS-0$
						}
						return "";
					}));
				}
			}
			
			// first time setup
			if (!this.favoritesSection) {
				this.favoritesSection = new mSection.Section(this._parent, {
					id: "favoritesSection", //$NON-NLS-0$
					title: messages["Favorites"], //$NON-NLS-0$
					content: '<div id="favoritesContent"></div>', //$NON-NLS-0$
					preferenceService: serviceRegistry.getService("orion.core.preference"), //$NON-NLS-0$
					canHide: true,
					useAuxStyle: true,
					slideout: true,
					onExpandCollapse: function(isExpanded, section) {
						commandService.destroy(section.selectionNode);
						if (isExpanded) {
							commandService.renderCommands(section.selectionNode.id, section.selectionNode, null, that, "button"); //$NON-NLS-0$
						}
					}
				});
				this.favoritesSelection = new mSelection.Selection(serviceRegistry, "orion.favorites.selection"); //$NON-NLS-0$
				// add commands to the fave section heading
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.renameFave", 1, null, false, new mCommands.CommandKeyBinding(113, false, false, false, false, "favoritesContent", "Favorites")); //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.deleteFave", 2, null, false, new mCommands.CommandKeyBinding(46, false, false, false, false, "favoritesContent", "Favorites")); //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerSelectionService(this.favoritesSection.selectionNode.id, this.favoritesSelection);
				var selectionId = this.favoritesSection.selectionNode.id;
				serviceRegistry.getService("orion.favorites.selection").addEventListener("selectionChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = dojo.byId(selectionId);
					if (selectionTools) {
						commandService.destroy(selectionTools);
						commandService.renderCommands(selectionId, selectionTools, event.selections, that, "button"); //$NON-NLS-0$
					}
				});
			}
			if (favorites.length > 0) {
				this.explorer = new NavOutlineExplorer(serviceRegistry, this.favoritesSelection);
				this.favoritesTable = this.explorer.createTree("favoritesContent", new mExplorer.SimpleFlatModel(favorites, "fav", function(item) { //$NON-NLS-1$ //$NON-NLS-0$
					return item.path || "";
				}));
				// TODO temporary hack from Libing 
				this.explorer.getNavHandler()._clearSelection(false);
			} else {
				dojo.place("<p>"+dojo.string.substitute(messages["You can create favorites by selecting any file or folder in the navigator and choosing ${0} from the More menu."], ["<b>"+messages["Make Favorite"]+"</b>"])+"</p>", "favoritesContent", "only"); //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-2$ //$NON-NLS-0$
			}
		}
	};//end navigation outliner prototype
	NavigationOutliner.prototype.constructor = NavigationOutliner;

	//return module exports
	return {
		NavigationOutliner: NavigationOutliner
	};
});
