/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 
/*global dijit dojo window eclipse:true setTimeout */
/*jslint forin:true*/

var eclipse = eclipse || {};
eclipse.FavoritesService = (function() {
	function FavoritesService(options) {
		this._favorites = [];
		this._searches = [];
		this._listeners = [];
		this._init(options);
		this._initializeFavorites();
	}
	FavoritesService.prototype = {
		_init: function(options) {
			this._registry = options.serviceRegistry;
		},
	
		/**
		 * @param callback Callback to be notified when favorites change
		 */
		addEventListener: function(callback) {
			this._listeners.push(callback);
			callback(this._favorites, this._searches);
		},
		
		_notifyListeners: function() {
			for (var i = 0; i < this._listeners.length; i++) {
				// FIXME: it is bogus that we separate favorites and searches
				// we need a general representation and let the UI (and user) sort out
				// how it is filtered or organized
				this._listeners[i](this._favorites, this._searches);
			}
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
			this._registry.callService("IPreferenceService", "getNode", null, ["window/favorites", function(prefs) { 
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
			}]);
		}, 
		
		_storeFavorites: function() {
			if (this._favorites.length > 0) {
				var storedFavorites = this._favorites.slice(1);
				this._registry.callService("IPreferenceService", "put", null, ["window/favorites/navigate", JSON.stringify(storedFavorites)]); 
			}
		},
		
		_storeSearches: function() {
			this._registry.callService("IPreferenceService", "put", null, ["window/favorites/search", JSON.stringify(this._searches)]); 
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
		this._registry.callService("IFavorites", "addEventListener", null, [function(favs, searches) {
			favorites.render(favs, searches);
		}]);
	}
	Favorites.prototype = {
		// FIXME: it should really be up to the UI to organize favorites as being searches or not.
		render: function(favorites, searches) {
			var faveTable = dojo.create("table");
			var tr, col1, col2, col3, link;
			for (var i=0; i < favorites.length; i++) {
				var fave = favorites[i];
				var href = fave.directory ? "#" + fave.path : "coding.html#" + fave.path;
				if (href=="#")
					href="";
				var clazz = fave.directory ? "navlinkonpage" : "navlink";
				var img="";
				var img2="";
				var editable="";
				var id = "fave"+i;
				if (i > 0) {
					img = "<img id=\""
							+ (id + "img1")
							+ "\" style=\"margin-left: 4px;\" src=\"images/silk/cross-gray.png\" alt=\"Delete\" title=\"Delete\" name=\"closefave"
							+ i + "\"onMouseOver= \"document.closefave" + i
							+ ".src='images/silk/cross.png'\" onMouseOut = \"document.closefave" + i
							+ ".src='images/silk/cross-gray.png'\" >";
					img2 = "<img id=\""
							+ (id + "img2")
							+ "\"style=\"margin-left: 4px;\" src=\"images/silk/pencil-gray.png\" alt=\"Rename\" title=\"Rename\" name=\"editfave"
							+ i + "\"onMouseOver= \"document.editfave" + i
							+ ".src='images/silk/pencil.png'\" onMouseOut = \"document.editfave" + i
							+ ".src='images/silk/pencil-gray.png'\" >";
				}
				tr = dojo.create("tr"),
					col1 = dojo.create("td", null, tr, "last"),
					col2 = dojo.create("td", null, tr, "last"),
					col3 = dojo.create("td", null, tr, "last"),
					link = dojo.create("a", {id: id, href: href, className: clazz}, col1, "only");
				dojo.place(document.createTextNode(fave.name), link, "only");
				col2.innerHTML = img;
				col3.innerHTML = img2;
				dojo.place(tr, faveTable, "last");
			}
			dojo.place(faveTable, this._parent, "only");
			
			if (searches.length > 0) {
				dojo.place("<br><h2>Searches</h2>", this._parent, "last");
				var searchTable = dojo.create("table");
				for (var i=0; i < searches.length; i++) {
					var search = searches[i];
					var href="#" + search.query;
					var img = "<img id=\""
							+ "search"
							+ i
							+ "\"style=\"margin-left: 4px;\" src=\"images/silk/cross-gray.png\" alt=\"Delete\" title=\"Delete\" name=\"search"
							+ i + "\"onMouseOver= \"document.search" + i
							+ ".src='images/silk/cross.png'\" onMouseOut = \"document.search" + i
							+ ".src='images/silk/cross-gray.png'\" >";
					// mamacdon: so does this
					tr = dojo.create("tr"),
						col1 = dojo.create("td", null, tr, "last"),
						col2 = dojo.create("td", null, tr, "last"),
						link = dojo.create("a", {href: href}, col1, "only");
					dojo.place(document.createTextNode(search.name), link, "only");
					col2.innerHTML = img;
					dojo.place(tr, searchTable, "last");
				}
				dojo.place(searchTable, this._parent, "last");
			}
			
			// attach listeners
			var reg = this._registry;
			for (var i=0; i < favorites.length; i++) {
				if (i === 0) {
					continue;
				}
				var id = "fave"+i;
				var fave = favorites[i];
				
				dojo.byId(id + "img1").onclick = (function(path) {
					return function(event) {
						reg.callService("IFavorites", "removeFavorite", null, [path]);
					};
				
				})(fave.path);
				
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
								reg.callService("IFavorites", "renameFavorite", null, [path, newName]);
							}
							editBox.destroyRecursive();
							dojo.style(dojo.byId(id + "img1"), "display", "inline");
							dojo.style(dojo.byId(id + "img2"), "display", "inline");
						};
					}(fave.name, fave.path, id));
				};
				
				dojo.byId(id + "img2").onclick = (function(faveName, id) {
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
				})(fave.name, id);
			}
			for (var i=0; i < searches.length; i++) {
				dojo.byId("search" + i).onclick = (function(query) {
					return function(event) {
						reg.callService("IFavorites", "removeSearch", null, [search.query]);
					};
				})(searches[i].query);
 			}
 		}
		
	};
	return Favorites;
})();
