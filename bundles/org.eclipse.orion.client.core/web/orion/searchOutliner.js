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

define(['require', 'dojo', 'orion/section', 'orion/commands', 'orion/selection', 'orion/explorer'], function(require, dojo, mSection, mCommands, mSelection, mExplorer){

	/**
	 * Instantiates the saved search service. This service is used internally by the
	 * search outliner and is not intended to be used as API.  It is serving as
	 * a preference holder and triggers listeners when the preference changes.
	 * When preference changes trigger listeners, this class would no longer be needed.
	 *
	 * @name orion.searches.SavedSearches
	 * @class A service for creating and managing saved searches.
	 */
	function SavedSearches(serviceRegistry) {
		this._searches = [];
		this._init(serviceRegistry);
		this._initializeSearches();
	}
	
	SavedSearches.prototype = /** @lends orion.searches.SavedSearches.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("orion.core.savedSearches", this);
		},
		
		_notifyListeners: function() {
			this._serviceRegistration.dispatchEvent("searchesChanged", {searches: this._searches, registry: this._registry});
		},

		
		_initializeSearches: function () {
			var savedSearches = this;
			this._registry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) { 
				var i;
				var searches = prefs.get("search");
				if (typeof searches === "string") {
					searches = JSON.parse(searches);
				}
				if (searches) {
					for (i in searches) {
						savedSearches._searches.push(searches[i]);
					}
				}
				savedSearches._notifyListeners();
			});
		}, 
				
		_storeSearches: function() {
			var storedSearches = this._searches;
			this._registry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs){
				prefs.put("search", storedSearches);
			}); 
		},

		addSearch: function(theName, theQuery) {
			var alreadyFound = false;
			for (var i in this._searches) {
				if (this._searches[i].query === theQuery) {
					this._searches[i].name = theName;
					alreadyFound = true;
				}
			}
			if (alreadyFound) {
				this._registry.getService("orion.page.message").setMessage(theName + " is already saved.", 2000);
			} else {
				this._searches.push({ "name": theName, "query": theQuery});
			}
			this._searches.sort(this._sorter);
			this._storeSearches();
			this._notifyListeners();
		},
		
		removeSearch: function(query) {
			for (var i in this._searches) {
				if (this._searches[i].query === query) {
					this._searches.splice(i, 1);
					break;
				}
			}
			this._searches.sort(this._sorter);
			this._storeSearches();
			this._notifyListeners();
		},
		
		renameSearch: function(query, newName) {
			var changed = false;
			for (var i in this._searches) {
				if (this._searches[i].query === query) {
					var search = this._searches[i];
					if (search.name !== newName) {
						search.name = newName;
						changed = true;
					}
				}
			}
			if (changed) {
				this._searches.sort(this._sorter);
				this._storeSearches();
				this._notifyListeners();
			}
		}, 
		
		getSearches: function() {
			return {searches: this._searches};
		}, 
		
		_sorter: function(fav1,fav2) {
			var name1 = fav1.name.toLowerCase();
			var name2 = fav2.name.toLowerCase();
			if (name1 > name2) {
				return 1;
			} else if (name1 < name2) {
				return -1;
			} else {
				return 0;
			}
		}
	};
	function SearchRenderer (options, explorer) {
		this.explorer = explorer;
		this._init(options);
	}
	SearchRenderer.prototype = mExplorer.SelectionRenderer.prototype;
	SearchRenderer.prototype.constructor = SearchRenderer;
	SearchRenderer.prototype.getLabelColumnIndex = function() {
		return 0;
	};
	SearchRenderer.prototype.getCellElement = function(col_no, item, tableRow){
		var href;
		if (item.query) {
			href=require.toUrl("search/search.html") + "#" + item.query;
			var col = dojo.create("td", null, tableRow, "last");
			dojo.addClass(col, "mainNavColumn singleNavColumn");
			var link = dojo.create("a", {href: href, className: "navlinkonpage"}, col, "only");
			dojo.place(window.document.createTextNode(item.name), link, "only");
		} 
	};

	function SearchExplorer(serviceRegistry, selection) {
		this.selection = selection;
		this.registry = serviceRegistry;
		this.renderer = new SearchRenderer({checkbox: false, decorateAlternatingLines: false}, this);
	}
	SearchExplorer.prototype = mExplorer.Explorer.prototype;	
	SearchExplorer.prototype.constructor = SearchExplorer;

	

	/**
	 * Creates a new user interface element showing stored searches
	 *
	 * @name orion.Searches.SearchList
	 * @class A user interface element showing a list of saved searches.
	 * @param {Object} options The service options
	 * @param {Object} options.parent The parent 
	 * @param {orion.serviceregistry.ServiceRegistry} options.serviceRegistry The service registry
	 */
	function SearchOutliner(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		var reg = options.serviceRegistry;
		
		var renameSearchCommand = new mCommands.Command({
			name: "Rename",
			imageClass: "core-sprite-rename",
			id: "eclipse.renameSearch",
			parameters: new mCommands.ParametersDescription([new mCommands.CommandParameter("name", "text", 'Name:', '')]),
			visibleWhen: function(items) {
				items = dojo.isArray(items) ? items : [items];
				return items.length === 1 && items[0].query;
			},
			callback: dojo.hitch(this, function(data) {
				var item = dojo.isArray(data.items) ? data.items[0] : data.items;
				if (data.parameters && data.parameters.valueFor('name')) {
					reg.getService("orion.core.savedSearches").renameSearch(item.query, data.parameters.valueFor('name'));
				}
			})
		});
		var deleteSearchCommand = new mCommands.Command({
			name: "Delete",
			imageClass: "core-sprite-delete",
			id: "eclipse.deleteSearch",
			visibleWhen: function(items) {
				items = dojo.isArray(items) ? items : [items];
				if (items.length === 0) {
					return false;
				}
				for (var i=0; i<items.length; i++) {
					if (!items[i].query) {
						return false;
					}
				}
				return true;
			},
			callback: function(data) {
				var items = dojo.isArray(data.items) ? data.items : [data.items];
				var confirmMessage = items.length === 1 ? "Are you sure you want to delete '" + items[0].name + "' from the searches?" : "Are you sure you want to delete these " + items.length + " searches?";
				if(window.confirm(confirmMessage)) {
					for (var i=0; i<items.length; i++) {
						options.serviceRegistry.getService("orion.core.savedSearches").removeSearch(items[i].query);
					}
				}
			}
		});
		this.commandService = this._registry.getService("orion.page.command");
		// register commands 
		this.commandService.addCommand(renameSearchCommand);	
		this.commandService.addCommand(deleteSearchCommand);	
		var savedSearches = this._registry.getService("orion.core.savedSearches");
		var searchOutliner = this;
		if (savedSearches) {
			// render the searches
			var registry = this._registry;
			savedSearches.getSearches().then(dojo.hitch(searchOutliner, function(searches) {
				this.render(searches.searches, registry);
			}));

			savedSearches.addEventListener("searchesChanged", dojo.hitch(searchOutliner,
				function(searches) {
					this.render(searches.searches, searches.registry);
				}));
		}
	}
	SearchOutliner.prototype = /** @lends orion.navoutliner.SearchOutliner.prototype */ {

		render: function(searches, serviceRegistry) {
			// Searches if we have them
			var commandService = this.commandService;
			// first time setup
			if (!this.searchesSection) {
				this.searchesSection = new mSection.Section(this._parent, {
					id: "searchSection",
					title: "Searches",
					content: '<div id="searchContent"></div>',
					useAuxStyle: true,
					preferenceService: serviceRegistry.getService("orion.core.preference"),
					slideout: true
				});
				this.searchSelection = new mSelection.Selection(serviceRegistry, "orion.searches.selection");
				// add commands to the search section heading
				var selectionId = this.searchesSection.selectionNode.id;
				this.commandService.registerCommandContribution(selectionId, "eclipse.renameSearch", 1, null, false, new mCommands.CommandKeyBinding(113, false, false, false, false, "searchContent"));	
				this.commandService.registerCommandContribution(selectionId, "eclipse.deleteSearch", 2, null, false, new mCommands.CommandKeyBinding(46, false, false, false, false, "searchContent"));
				commandService.registerSelectionService(selectionId, this.searchSelection);
				serviceRegistry.getService("orion.searches.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						commandService.renderCommands(selectionId, selectionTools, selections, this, "button");
					}
				});
			}
			if (searches.length > 0) {
				var explorer = new SearchExplorer(serviceRegistry, this.searchSelection);
				this.searchTable = explorer.createTree("searchContent", new mExplorer.SimpleFlatModel(searches, "srch", function(item) {
					return item.query;
				}));	
				// TODO temporary hack from Libing 
				explorer.navHandler._clearSelection(false);
			} else {
				dojo.place("<p>You can save frequently used by searches by choosing <b>Save Search</b> in the search toolbar.</p>", "searchContent", "only");
			}
		}
	};//end navigation outliner prototype
	SearchOutliner.prototype.constructor = SearchOutliner;

	//return module exports
	return {
		SavedSearches: SavedSearches,
		SearchOutliner: SearchOutliner
	};
});
