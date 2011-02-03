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
			this._favorites.push({ "name": theName, "path": thePath, "directory": isDirectory });
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
			this._searches.push({ "name": theName, "query": theQuery });
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
			this._favorites.push({ "name": "root", "path": "", "directory": true });
			
			var favorites = this;
			var favesDone, searchesDone;
			this._registry.getService("IPreferenceService").then(function(service) {
				service.getNode("window/favorites", function(prefs) { 
					if (prefs) {
						var i;
						if (prefs.navigate) {
							var navigate = JSON.parse(prefs.navigate);
							for (i in navigate) {
								favorites._favorites.push(navigate[i]);
							}
						}
						if (prefs.search) {
							var search = JSON.parse(prefs.search);
							for (i in search) {
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
				var storedFavorites = this._favorites.slice(1);
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
		this._deleteFaveCommand = new eclipse.Command({
			name: "Delete",
			image: "images/silk/cross.png",
			callback: function(item) {
				this._registry.getService("IFavorites").then(function(service) {
					service.removeFavorite(item.path);
				});
			}
		});
		// Hook up the callback TBD
		this._renameFaveCommand = new eclipse.Command({
			name: "Rename",
			image: "images/silk/pencil.png"
		});
		this._deleteSearchCommand = new eclipse.Command({
			name: "Delete",
			image: "images/silk/cross.png",
			callback: function(item) {
				this._registry.getService("IFavorites").then(function(service) {
					service.removeSearch(item.query);
				});
			}
		});
		this._registry.getService("IFavorites").then(function(service) {
			service.addEventListener("favoritesChanged", function(favs, searches) {
				favorites.render(favs, searches);
			});
		});
	}
	Favorites.prototype = {
		// FIXME: it should really be up to the UI to organize favorites as being searches or not.
		render: function(favorites, searches) {
			var faveTable = dojo.create("table");
			var tr, col1, col2, col3, link;
			for (var i=0; i < favorites.length; i++) {
				var fave = favorites[i];
				var href = fave.directory ? "#" + fave.path : "coding.html#" + fave.path;
				if (href==="#") {
					href="";
				}
				var clazz = fave.directory ? "navlinkonpage" : "navlink";
				var img="";
				var img2="";
				var editable="";
				var id = "fave"+i;
				tr = dojo.create("tr");
				col1 = dojo.create("td", null, tr, "last");
				col2 = dojo.create("td", null, tr, "last");
				col3 = dojo.create("td", null, tr, "last");
				link = dojo.create("a", {id: id, href: href, className: clazz}, col1, "only");
				dojo.place(document.createTextNode(fave.name), link, "only");
				if (i > 0) {
					// FIXME command service should render, that will be the next step.
					img = this._deleteFaveCommand._asImage(id+"img1", fave, this);
					img2 = this._renameFaveCommand._asImage(id+"img2", fave);
					dojo.place(img, col2, "only");
					dojo.place(img2, col3, "only");
				}

				dojo.place(tr, faveTable, "last");
				if (i > 0) {
					var reg = this._registry;
					/** @return function(event) */
					var makeRenameHandler = function(isKeyEvent) {
						return (function (oldName, path, id) {
							return function(event) {
								var editBox = dijit.byId(id + "EditBox"),
									newName = editBox.get("value");
								if (isKeyEvent && event.keyCode !== dojo.keys.ENTER) {
									return;
								} else if (!editBox.isValid() || newName === oldName) {
									// No change; restore the old link
									dojo.style(dojo.byId(id), "display", "inline");
								} else {
									// Will update old link
									reg.getService("IFavorites").then(function(service) {
										service.renameFavorite(path, newName);
									});
								}
								editBox.destroyRecursive();
								dojo.style(dojo.byId(id + "img1"), "display", "inline");
								dojo.style(dojo.byId(id + "img2"), "display", "inline");
							};
						}(fave.name, fave.path, id));
					};
					
					dojo.connect(img2, "onclick", this, (function(faveName, id) {
						return function(event) {
							// Swap in an editable text field
							var editBox = new dijit.form.ValidationTextBox({
								id: id + "EditBox",
								required: true, // disallows empty string
								value: faveName
							});
							var link = dojo.byId(id);
							dojo.place(editBox.domNode, link, "before");
							// hide link & buttons for reuse later
							dojo.style(link, "display", "none");
							dojo.style(dojo.byId(id + "img1"), "display", "none");
							dojo.style(dojo.byId(id + "img2"), "display", "none");
							
							dojo.connect(editBox, "onKeyDown", makeRenameHandler(true));
							dojo.connect(editBox, "onBlur", makeRenameHandler(false));
							setTimeout(function() { editBox.focus(); }, 0);
						};
					})(fave.name, id));
				}
			}
			dojo.place(faveTable, this._parent, "only");
			
			if (searches.length > 0) {
				dojo.place("<br><h2>Searches</h2>", this._parent, "last");
				var searchTable = dojo.create("table");
				for (var i=0; i < searches.length; i++) {
					var search = searches[i];
					var href="#" + search.query;
					// FIXME command service should render this
					var img = this._deleteSearchCommand._asImage("search"+i, search, this);
					tr = dojo.create("tr");
					col1 = dojo.create("td", null, tr, "last");
					col2 = dojo.create("td", null, tr, "last");
					link = dojo.create("a", {href: href}, col1, "only");
					dojo.place(document.createTextNode(search.name), link, "only");
					// FIXME rendering should go in command service.  That is the next step.
					dojo.place(img, col2, "only");
					dojo.place(tr, searchTable, "last");
				}
				dojo.place(searchTable, this._parent, "last");
			}
		}
	};
	return Favorites;
})();
