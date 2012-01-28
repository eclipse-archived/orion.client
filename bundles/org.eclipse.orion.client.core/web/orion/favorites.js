/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global window define */
 
/*jslint forin:true*/

define(['require', 'dojo', 'orion/util'], function(require, dojo, mUtil){

	/**
	 * Instantiates the favorites service. Clients should obtain the 
	 * <tt>orion.core.favorite</tt> service from the service registry rather
	 * than instantiating this service directly. This constructor is intended
	 * for use by page initialization code that is initializing the service registry.
	 *
	 * @name orion.favorites.FavoritesService
	 * @class A service for creating and managing links that the user has identified
	 * as favorites.
	 */
	function FavoritesService(serviceRegistry) {
		this._favorites = [];
		this._searches = [];
		this._init(serviceRegistry);
		this._initializeFavorites();
	}
	FavoritesService.prototype = /** @lends orion.favorites.FavoritesService.prototype */ {
		_init: function(options) {
			this._registry = options.serviceRegistry;
			this._serviceRegistration = this._registry.registerService("orion.core.favorite", this);
		},
		
		_notifyListeners: function() {
			// FIXME: it is bogus that we separate favorites and searches
			// we need a general representation and let the UI (and user) sort out
			// how it is filtered or organized
			this._serviceRegistration.dispatchEvent("favoritesChanged", {navigator: this._favorites, search: this._searches, registry: this._registry});
		},
	
		/**
		 * Adds an item or array of items to the favorites list.
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
				location = mUtil.makeRelative(location);
				this.addFavorite(item.Name, location, item.Directory);
			}
			this._storeFavorites();
			this._notifyListeners();
		},
		
		addFavoriteUrl: function(url) {
			this.addFavorite(url, url, false, true);
		},
						
		addFavorite: function(theName, thePath, isDirectory, isExternalResource) {
			this._favorites.push({ "name": theName, "path": thePath, "directory": isDirectory, "isFavorite": true, "isExternalResource": isExternalResource });
			this._favorites.sort(this._sorter);
			this._storeFavorites();
			this._notifyListeners();
		},
		
		removeFavorite: function(path) {
			for (var i in this._favorites) {
				if (this._favorites[i].path === path) {
					this._favorites.splice(i, 1);
					break;
				}
			}
			this._favorites.sort(this._sorter);
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
				this._favorites.sort(this._sorter);
				this._storeFavorites();
				this._notifyListeners();
			}
		},
		
		
		addFavoriteSearch: function(theName, theQuery) {
			this._searches.push({ "name": theName, "query": theQuery, "isSearch": true });
			this._searches.sort(this._sorter);
			this._storeSearches();
			this._notifyListeners();
		},
		
		hasFavorite: function(path) {
			for (var i in this._favorites) {
				if (this._favorites[i].path === path) {
					return true;
				}
			}
			return false;
		},
		
		/** @private special characters in regex */
		_SPECIAL_CHARS : "^$\\+[]().",

		
		/**
		 * Queries the favorites using s pseudo-regular expression.  
		 * The format of the regex is the same as that recognized by
		 * the open resources dialog: * represents any text, ? is a 
		 * single character.  And there is an implicit * at the end of
		 * the queryText.
		 *
		 * Empty queryText matches all favorites
		 * 
		 * @param queryText the name of the favorites to look for.  
		 * @return a possibly empty array of favorites that matches 
		 * the queryText
		 */
		queryFavorites: function(queryText) {
			var i;
			if (!queryText) {
				// matches all
				return this._favorites;
			}
			
			// convert query string
			// * --> .*
			// ? --> .?
			// $ --> \$  (and any other special chars
			var convertedQuery = "";
			for (i = 0; i < queryText.length; i++) {
				var char = queryText.charAt(i);
				if (char === "*") {
					convertedQuery += ".*";
				} else if (char === "?") {
					convertedQuery += ".?";
				} else if (this._SPECIAL_CHARS.indexOf(char) >= 0) {
					convertedQuery += ("\\" + char);
				} else {
					convertedQuery += char;
				}
			}
			convertedQuery += ".*";
			var regex = new RegExp(convertedQuery);
			
			// for now, just search the beginning, but we need to support
			// the regex that is available in open resources dialog
			var result = [];
			for (i in this._favorites) {
				if (this._favorites[i].name.search(regex) === 0) {
					result.push(this._favorites[i]);
				}
			}
			return result;
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
		
		_initializeFavorites: function () {
			var favorites = this;
			this._registry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs) { 
				var i;
				var navigate = prefs.get("navigate");
				if (typeof navigate === "string") {
					navigate = JSON.parse(navigate);
				}
				if (navigate) {
					for (i in navigate) {
						navigate[i].isFavorite = true;  // migration code, may not have been stored
						favorites._favorites.push(navigate[i]);
					}
				}
				var search = prefs.get("search");
				if (typeof search === "string") {
					search = JSON.parse(search);
				}
				if (search) {
					for (i in search) {
						search[i].isSearch = true; // migration code, may not been stored
						favorites._searches.push(search[i]);
					}
				}
				favorites._favorites.sort(favorites._sorter);
				favorites._notifyListeners();
			});
		}, 
		
		_storeFavorites: function() {
			var storedFavorites = this._favorites;
			this._registry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs){
				prefs.put("navigate", storedFavorites);
			}); 
		},
		
		_storeSearches: function() {
			var storedSearches = this._searches;
			this._registry.getService("orion.core.preference").getPreferences("/window/favorites").then(function(prefs){
				prefs.put("search", storedSearches);
			}); 
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
		},
		
		getFavorites: function() {
			return {navigator: this._favorites, search: this._searches};
		}
	};
	FavoritesService.prototype.constructor = FavoritesService;

	//return module exports
	return {
		FavoritesService: FavoritesService
	};
});
