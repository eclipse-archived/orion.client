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
 
/*global window document define setTimeout */
/*jslint forin:true*/

define(['i18n!orion/navigate/nls/messages', 'require', 'orion/webui/littlelib', 'orion/i18nUtil', 'orion/commands', 'orion/section', 'orion/selection', 'orion/explorers/explorer', 'orion/explorers/navigatorRenderer', 'orion/explorers/navigationUtils'], 
function(messages, require, lib, i18nUtil, mCommands, mSection, mSelection, mExplorer, mNavRenderer, mNavUtils){

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
		var href, clazz, name, link;
		var col = document.createElement("td"); //$NON-NLS-0$
		tableRow.appendChild(col);
		col.classList.add("mainNavColumn"); //$NON-NLS-0$
		col.classList.add("singleNavColumn"); //$NON-NLS-0$
		if (item.directory) {
			link = mNavRenderer.createLink(require.toUrl("navigate/table.html"), { Name: item.name, ChildrenLocation: item.path, Directory: true }, "", this.commandService, this.contentTypeService); //$NON-NLS-0$
		} else if (item.path) {
			link = mNavRenderer.createLink("", { Name: item.name, Location: item.path }, "", this.commandService, this.contentTypeService); //$NON-NLS-0$
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
		if (!link) {
			link = document.createElement("a"); //$NON-NLS-0$
			link.href = href;
			link.className = clazz;
			link.appendChild(document.createTextNode(name));
		}
		col.appendChild(link);
		mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
	};

	function NavOutlineExplorer(serviceRegistry, selection, commandService) {
		this.selection = selection;
		this.registry = serviceRegistry;
		this.renderer = new NavOutlineRenderer({checkbox: false}, this);
		this.renderer.commandService = commandService;
		this.renderer.contentTypeService = serviceRegistry.getService("orion.core.contenttypes");
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
	 * @param {orion.commands.CommandService} options.commandService The in-page (synchronous) command service.
	 */
	function NavigationOutliner(options) {
		var parent = lib.node(options.parent);
		if (!parent) { throw "no parent"; } //$NON-NLS-0$
		if (!options.serviceRegistry) {throw "no service registry"; } //$NON-NLS-0$
		this._parent = parent;
		this._registry = options.serviceRegistry;
		this.commandService = options.commandService;
		var reg = options.serviceRegistry;
		var self = this;
		
		var deleteFaveCommand = new mCommands.Command({
			name: "Delete", //$NON-NLS-0$
			imageClass: "core-sprite-delete", //$NON-NLS-0$
			id: "eclipse.deleteFave", //$NON-NLS-0$
			visibleWhen: function(items) {
				items = Array.isArray(items) ? items : [items];
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
			callback: function(data) {
				var items = Array.isArray(data.items) ? data.items : [data.items];
				var confirmMessage = items.length === 1 ? i18nUtil.formatMessage(messages["Are you sure you want to delete '${0}' from the favorites?"], items[0].name) : i18nUtil.formatMessage(messages["Are you sure you want to delete these ${0} favorites?"], items.length);
				if(window.confirm(confirmMessage)) {
					for (var i=0; i<items.length; i++) {
						options.serviceRegistry.getService("orion.page.progress").progress(options.serviceRegistry.getService("orion.core.favorite").removeFavorite(items[i].path), "Removing favorite " + items[i].name); //$NON-NLS-0$
					}
				}
			}
		});		
		var renameFaveCommand = new mCommands.Command({
			name: messages['Rename'],
			imageClass: "core-sprite-rename", //$NON-NLS-0$
			id: "eclipse.renameFave", //$NON-NLS-0$
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("name", "text", 'Name:', '')]), //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			visibleWhen: function(items) {
				items = Array.isArray(items) ? items : [items];
				return items.length === 1 && items[0].isFavorite;
			},
			callback: function(data) {
				var item = Array.isArray(data.items) ? data.items[0] : data.items;
				
				if (data.parameters && data.parameters.valueFor('name')) { //$NON-NLS-0$
					reg.getService("orion.page.progress").progress(reg.getService("orion.core.favorite").renameFavorite(item.path, data.parameters.valueFor('name')), "Rename favorite " + item.name + " to " + data.parameters.valueFor('name')); //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
		});
		// register commands 
		this.commandService.addCommand(deleteFaveCommand);
		this.commandService.addCommand(renameFaveCommand);
		var favoritesService = this._registry.getService("orion.core.favorite"); //$NON-NLS-0$
		var progress = this._registry.getService("orion.page.progress"); //$NON-NLS-0$

		if (favoritesService) {
			// render the favorites
			var registry = this._registry;
			progress.progress(favoritesService.getFavorites(), "Getting favorites").then(function(favs) {
				self.render(favs.navigator, registry);
			});

			favoritesService.addEventListener("favoritesChanged", //$NON-NLS-0$
				function(event) {
					// TODO temporary code, get rid of old "external favorites"
					// see https://bugs.eclipse.org/bugs/show_bug.cgi?id=379435
					var faves = [];
					for (var i=0; i<event.navigator.length; i++) {
						if (!event.navigator[i].isExternalResource) {
							faves.push(event.navigator[i]);
						}
					}
					self.render(faves, event.registry);
				});
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
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.renameFave", 1, null, false, new mCommands.CommandKeyBinding(113, false, false, false, false, "favoritesContent", "Favorites")); //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
				this.commandService.registerCommandContribution(this.favoritesSection.selectionNode.id, "eclipse.deleteFave", 2, null, false, new mCommands.CommandKeyBinding(46, false, false, false, false, "favoritesContent", "Favorites")); //$NON-NLS-2$  //$NON-NLS-1$ //$NON-NLS-0$
				commandService.registerSelectionService(this.favoritesSection.selectionNode.id, this.favoritesSelection);
				var selectionId = this.favoritesSection.selectionNode.id;
				serviceRegistry.getService("orion.favorites.selection").addEventListener("selectionChanged", function(event) { //$NON-NLS-1$ //$NON-NLS-0$
					var selectionTools = lib.node(selectionId);
					if (selectionTools) {
						commandService.destroy(selectionTools);
						commandService.renderCommands(selectionId, selectionTools, event.selections, that, "button"); //$NON-NLS-0$
					}
				});
			}
			if (favorites.length > 0) {
				this.explorer = new NavOutlineExplorer(serviceRegistry, this.favoritesSelection, this.commandService);
				this.favoritesTable = this.explorer.createTree("favoritesContent", new mExplorer.SimpleFlatModel(favorites, "fav", function(item) { //$NON-NLS-1$ //$NON-NLS-0$
					return item.path || "";
				}));
				// TODO temporary hack from Libing 
				this.explorer.getNavHandler()._clearSelection(false);
			} else {
				var faves = lib.node("favoritesContent"); //$NON-NLS-0$
				if (faves) {
					lib.empty(faves);
					var p = document.createElement("p"); //$NON-NLS-0$
					p.appendChild(document.createTextNode(i18nUtil.formatMessage(messages["You can create favorites by selecting any file or folder in the navigator and choosing ${0} from the ${1} menu."], "'"+messages["Make Favorite"]+"'", "'"+messages["Actions"]+"'"))); //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
					faves.appendChild(p);
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
