/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 
/*global dijit dojo window document eclipse:true setTimeout */
/*jslint forin:true*/

var eclipse = eclipse || {};
eclipse.FavoritesService = (function() {
	function FavoritesService(options) {
		this._favorites = [];
		this._searches = [];
		this._init(options);
		this._initializeFavorites();
	}
	FavoritesService.prototype = {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("IFavorites", this);
		},
		
		_notifyListeners: function() {
			// FIXME: it is bogus that we separate favorites and searches
			// we need a general representation and let the UI (and user) sort out
			// how it is filtered or organized
			this._serviceRegistration.dispatchEvent("favoritesChanged", this._favorites, this._searches);
		},
	
		/**
		 * @param items One or more file or directory objects
		 */
		makeFavorites: function(items) {
			items = dojo.isArray(items) ? items : [items];
			for (var i=0; i < items.length; i++) {
				var item = items[i];
				
				// strip off the hostname and just use the path name
				var location = item.ChildrenLocation ? item.ChildrenLocation : item.Location;
				// it would be cool if the location were a real document location
				// for now I'll assume it's from the same host in order to get the pathname
				location = eclipse.util.makeRelative(location);
				this.addFavorite(item.Name, location, item.Directory);
			}
			this._storeFavorites();
			this._notifyListeners();
		},
		
		addFavorite: function(theName, thePath, isDirectory) {
			this._favorites.push({ "name": theName, "path": thePath, "directory": isDirectory, "isFavorite": true });
		},
		
		removeFavorite: function(path) {
			for (var i in this._favorites) {
				if (this._favorites[i].path === path) {
					this._favorites.splice(i, 1);
					break;
				}
			}
			this._storeFavorites();
			this._notifyListeners();
		},

		renameFavorite: function(path, newName) {
			var changed = false;
			for (var i in this._favorites) {
				if (this._favorites[i].path === path) {
					var fave = this._favorites[i];
					if (fave.name !== newName) {
						fave.name = newName;
						changed = true;
					}
				}
			}
			if (changed) {
				this._storeFavorites();
				this._notifyListeners();
			}
		},
		
		
		addFavoriteSearch: function(theName, theQuery) {
			this._searches.push({ "name": theName, "query": theQuery, "isSearch": true });
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
			this._storeSearches();
			this._notifyListeners();
		},
		
		
		defaultFavorite: function(onDone) {
			onDone(this._favorites[0]);
		},
			
		_initializeFavorites: function () {
			var favorites = this;
			var favesDone, searchesDone;
			this._registry.getService("IPreferenceService").then(function(service) {
				service.getNode("window/favorites", function(prefs) { 
					if (prefs) {
						var i;
						if (prefs.navigate) {
							var navigate = JSON.parse(prefs.navigate);
							for (i in navigate) {
								navigate[i].isFavorite = true;  // migration code, may not have been stored
								favorites._favorites.push(navigate[i]);
							}
						}
						if (prefs.search) {
							var search = JSON.parse(prefs.search);
							for (i in search) {
								search[i].isSearch = true; // migration code, may not been stored
								favorites._searches.push(search[i]);
							}
						}
					}
					favorites._notifyListeners();
				});
			});
		}, 
		
		_storeFavorites: function() {
			if (this._favorites.length > 0) {
				var storedFavorites = this._favorites;
				this._registry.getService("IPreferenceService").then(function(service) {
					service.put("window/favorites/navigate", JSON.stringify(storedFavorites)); 
				});
			}
		},
		
		_storeSearches: function() {
			var storedSearches = this._searches;
			this._registry.getService("IPreferenceService").then(function(service) {
				service.put("window/favorites/search", JSON.stringify(storedSearches)); 
			});
		}
	};
	return FavoritesService;
}());

eclipse.Favorites = (function() {
	function Favorites(options) {
		var parent = options.parent;
		if (typeof(parent) === "string") {
			parent = dojo.byId(parent);
		}
		if (!parent) { throw "no parent"; }
		if (!options.serviceRegistry) {throw "no service registry"; }
		this._parent = parent;
		this._registry = options.serviceRegistry;
		var favorites = this;
		var deleteFaveCommand = new eclipse.Command({
			name: "Delete",
			image: "images/remove.gif",
			id: "eclipse.deleteFave",
			visibleWhen: function(item) {return item.isFavorite;},
			callback: function(item) {
				options.serviceRegistry.getService("IFavorites").then(function(service) {
					service.removeFavorite(item.path);
				});
			}
		});
		var renameFaveCommand = new eclipse.Command({
			name: "Rename",
			image: "images/editing_16.gif",
			id: "eclipse.renameFave",
			visibleWhen: function(item) {return item.isFavorite;},
			callback: dojo.hitch(this, function(item, commandId, domId, faveIndex) {
				this.editFavoriteName(item, commandId, domId, faveIndex);
			})
		});
		var deleteSearchCommand = new eclipse.Command({
			name: "Delete",
			image: "images/remove.gif",
			id: "eclipse.deleteSearch",
			visibleWhen: function(item) {return item.isSearch;},
			callback: function(item) {
				options.serviceRegistry.getService("IFavorites").then(function(service) {
					service.removeSearch(item.query);
				});
			}
		});
		this._registry.getService("ICommandService").then(function(commandService) {
			// register commands with object scope
			commandService.addCommand(deleteFaveCommand, "object");
			commandService.addCommand(renameFaveCommand, "object");
			commandService.addCommand(deleteSearchCommand, "object");
			// declare the contribution to the ui
			commandService.registerCommandContribution("eclipse.renameFave", 1);
			commandService.registerCommandContribution("eclipse.deleteFave", 2);
			commandService.registerCommandContribution("eclipse.deleteSearch", 1);

		});
		this._registry.getService("IFavorites").then(function(service) {
			service.addEventListener("favoritesChanged", function(favs, searches) {
				favorites.render(favs, searches);
			});
		});
	}
	Favorites.prototype = {
		editFavoriteName: function(fave, commandId, imageId, faveIndex) {
			var reg = this._registry;
			var linkId = "fave"+faveIndex;
			/** @return function(event) */
			var makeRenameHandler = function(isKeyEvent) {
				return (function (oldName, path, linkId, imageId) {
					return function(event) {
						var editBox = dijit.byId(imageId+ "EditBox"),
							newName = editBox.get("value");
						if (isKeyEvent && event.keyCode !== dojo.keys.ENTER) {
							return;
						} else if (!editBox.isValid() || newName === oldName) {
							// No change; restore the old link
							dojo.style(dojo.byId(linkId), "display", "inline");
						} else {
							// Will update old link
							reg.getService("IFavorites").then(function(service) {
								service.renameFavorite(path, newName);
							});
						}
						editBox.destroyRecursive();
						// re-show the local commands
						var commandParent = dojo.byId(imageId).parentNode;
						var children = commandParent.childNodes;
						for (var i = 0; i < children.length; i++) {
							dojo.style(children[i], "display", "inline");
						}
					};
				}(fave.name, fave.path, linkId, imageId));
			};
			// Swap in an editable text field
			var editBox = new dijit.form.ValidationTextBox({
				id: imageId+ "EditBox",
				required: true, // disallows empty string
				value: fave.name
			});
			var link = dojo.byId(linkId);
			dojo.place(editBox.domNode, link, "before");
			// hide link & buttons for reuse later
			var commandParent = dojo.byId(imageId).parentNode;
			dojo.style(link, "display", "none");
			var children = commandParent.childNodes;
			for (var i = 0; i < children.length; i++) {
				dojo.style(children[i], "display", "none");
			}
					
			dojo.connect(editBox, "onKeyDown", makeRenameHandler(true));
			dojo.connect(editBox, "onBlur", makeRenameHandler(false));
			setTimeout(function() { editBox.focus(); }, 0);
					
		},
		// FIXME: it should really be up to the UI to organize favorites as being searches or not.
		render: function(favorites, searches) {
			var faveTable = dojo.create("table");
			dojo.addClass(faveTable, "favoritesTable");
			var tr, col1, col2;
			for (var j=0; j < favorites.length; j++) {
				var fave = favorites[j];
				// TODO we should be getting this value from the preferences (table or tree)
				var href = fave.directory ? "navigate-table.html#" + fave.path : "coding.html#" + fave.path;
				if (href==="#") {
					href="";
				}
				var clazz = fave.directory ? "navlinkonpage" : "navlink";
				var editable="";
				var id = "fave"+j;
				tr = dojo.create("tr");
				tr.id = "row"+id;
				col1 = dojo.create("td", null, tr, "last");
				dojo.style(col1, "whiteSpace", "nowrap");
				col2 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
				dojo.style(col2, "whiteSpace", "nowrap");
				var link = dojo.create("a", {id: id, href: href, className: clazz}, col1, "only");
				dojo.place(document.createTextNode(fave.name), link, "only");
				var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col2, "only");
				// we must hide/show the span rather than the column.  IE and Chrome will not consider
				// the mouse as being over the table row if it's in a hidden column
				dojo.style(actionsWrapper, "visibility", "hidden");
				this._registry.getService("ICommandService").then(function(service) {
					service.renderCommands(actionsWrapper, "object", fave, this, "image", j);
				});
				dojo.place(tr, faveTable, "last");
				dojo.connect(tr, "onmouseover", tr, function() {
					var wrapper = dojo.byId(this.id+"actionsWrapper");
					dojo.style(wrapper, "visibility", "visible");
				});
				dojo.connect(tr, "onmouseout", tr, function() {
					var wrapper = dojo.byId(this.id+"actionsWrapper");
					dojo.style(wrapper, "visibility", "hidden");
				});
			}
			dojo.place(faveTable, this._parent, "only");
			
			if (searches.length > 0) {
				dojo.place("<br><h2>Searches</h2>", this._parent, "last");
				var searchTable = dojo.create("table");
				dojo.addClass(searchTable, "favoritesTable");
				for (var i=0; i < searches.length; i++) {
					var search = searches[i];
					var href="searchResults.html#" + search.query;
					tr = dojo.create("tr");
					tr.id = "searchRow"+i;
					col1 = dojo.create("td", null, tr, "last");
					col2 = dojo.create("td", {id: tr.id+"actions"}, tr, "last");
					var link = dojo.create("a", {href: href}, col1, "only");
					dojo.place(document.createTextNode(search.name), link, "only");
					// render local commands
					var actionsWrapper = dojo.create("span", {id: tr.id+"actionsWrapper"}, col2, "only");
					dojo.style(actionsWrapper, "visibility", "hidden");
					this._registry.getService("ICommandService").then(function(service) {
						service.renderCommands(actionsWrapper, "object", search, this, "image", i);
					});
					dojo.place(tr, searchTable, "last");
					dojo.connect(tr, "onmouseover", tr, function() {
						var wrapper = dojo.byId(this.id+"actionsWrapper");
						dojo.style(wrapper, "visibility", "visible");
					});
					dojo.connect(tr, "onmouseout", tr, function() {
						var wrapper = dojo.byId(this.id+"actionsWrapper");
						dojo.style(wrapper, "visibility", "hidden");
					});
				}
				dojo.place(searchTable, this._parent, "last");
			}
		}
	};
	return Favorites;
})();
