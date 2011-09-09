/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window localStorage */

define(['dojo', 'orion/auth'], function(dojo, mAuth){

	/**
	 * Constructs a new preferences instance. This constructor is not
	 * intended to be used by clients. Preferences should instead be
	 * obtained from a preference service
	 * @class A preferences object returned by the preferences service
	 * @name orion.preferences.Preferences
	 * @see orion.preferences.PreferencesService
	 */
	function Preferences(_name, _userProvider, _defaultsProvider) {
		this._name = _name;
		this._userProvider = _userProvider;
		this._defaultsProvider = _defaultsProvider;
		this._flushPending = false;
		this._store = null;
		this._defaults = null;
	}
	Preferences.prototype = /** @lends orion.preferences.Preferences.prototype */ {
		
		_flush: function() {
			return this._userProvider.put(this._name, this._store);
		},
		
		_scheduleFlush: function() {
			if (this._flushPending) {
				return;
			}
			this._flushPending = true;
			window.setTimeout(dojo.hitch(this, function() {
				if (this._flushPending) {
					this._flushPending = false;
					this._flush();
				}
			}),0);
		},

		/**
		 * Returns an array of String preference keys available in this node.
		 */
		keys: function() {
			var i, 
				result = [];
			for (i in this._store) {
				if (this._store.hasOwnProperty(i) && i.charAt(0) !== '/') {
					result.push(i);
				}
			}
			for (i in this._defaults) {
				if (this._defaults.hasOwnProperty(i) && !this._store.hasOwnProperty(i) && i.charAt(0) !== '/') {
					result.push(i);
				}
			}
			return result;
		},
		
		/**
		 * Returns the value of the preference with the given key
		 * @param {String} key The preference key to return
		 */
		get: function(key) {
			if (key.charAt(0) === '/') {
				throw new Error("Bad character in key name: " + key);
			}
			return this._store.hasOwnProperty(key) ? this._store[key] : this._defaults[key];
		},
		
		/**
		 * Associates a new preference value with the given key,
		 * replacing any existing value.
		 * @param {String} key The preference key
		 * @param {String} value The preference value
		 */
		put: function(key, value) {
			if (key.charAt(0) === '/') {
				throw new Error("Bad character in key name: " + key);
			}
			
			if (this._store[key] !== value) {
				this._store[key] = value;
				this._scheduleFlush();
			}
		},
		
		/**
		 * Removes the preference with the given key. Has no
		 * effect if no such key is defined.
		 * @param {String} key The preference key to remove
		 */
		remove: function(key) {
			if (key.charAt(0) === '/') {
				throw new Error("Bad character in key name: " + key);
			}
			
			if (this._store[key]) {
				delete this._store[key];
				this._scheduleFlush();
				return true;			
			}
			return false;
		},
		
		/**
		 * Removes all preferences from this preference node.
		 */
		clear: function() {
			var i;
			for (i in this._store) {
				if (this._store.hasOwnProperty(i) && i.charAt(0) !== '/') {
					delete this._store[i];
				}
			}
			this._scheduleFlush();
		},
		
		/**
		 * Synchronizes this preference node with its storage. Any new values
		 * in the storage area will become available to this preference object.
		 */
		sync:  function() {
			if(this._flushPending) {
				this._flushPending = false;
				return this._flush();
			}
			return this._defaultsProvider.get(this._name).then(dojo.hitch(this, function(defaults) {
				this._defaults = defaults;
				return this._userProvider.get(this._name).then(dojo.hitch(this, function(store) {
					this._store = store;
				}));
			}));
		},
		/**
		 * Flushes all preference changes in this node to its backing storage.
		 * @function
		 */
		flush: function() {
			this._flush();
		}
	};
	
	var _cache = {
			get: function(key, ignoreExpires) {
				var item = localStorage.getItem(key);
				if (item == null) {
					return null;
				}
				var cached = JSON.parse(item);
				if (ignoreExpires || (cached._expires && cached._expires > new Date().getTime())) {
					delete cached._expires;
					return cached;
				}
				return null;
			},
			set: function(key, data) {
				data._expires = new Date().getTime() + (1000*60*60); // expire every hour
				var jsonData = JSON.stringify(data);
				localStorage.setItem(key, jsonData);
				delete data._expires;
			}
	};
	
	function UserPreferencesProvider(location) {
		this.location = location;
		this._currentPromises = {};
	}
	UserPreferencesProvider.prototype = {
		
		get: function(name) {
			if (this._currentPromises[name]) {
				return this._currentPromises[name];
			}
			var d = new dojo.Deferred();
			var key = "/orion/preferences/user" + name;
			var cached = _cache.get(key);
			if (cached !== null) {
				d.resolve(cached);
			} else {
				this._currentPromises[name] = d;
				var that = this;
				dojo.xhrGet({
					url: this.location + name,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000,
					load: function(data, ioArgs) {
						_cache.set(key, data);
						delete that._currentPromises[name];
						d.resolve(data);
					},
					error: function(response, ioArgs) {
						response.log=false;
						if (ioArgs.xhr.status === 401) {
							if(name==="/plugins"){
								d.resolve({});
								return;
							}
							mAuth.handleGetAuthenticationError(this, ioArgs);
						} else if (ioArgs.xhr.status === 404) {
							var data = {};
							_cache.set(key, data);
							delete that._currentPromises[name];
							d.resolve(data);
						} else  {
							delete that._currentPromises[name];
							d.resolve(_cache.get(key, true) || {});
						}
					},
					failOk: true
				});
			}
			return d;
		},
		
		put: function(name, data) {
			var d = new dojo.Deferred();
			var key = "/orion/preferences/user" + name;
			_cache.set(key, data);
			dojo.xhrPut({
				url: this.location + name,
				putData: JSON.stringify(data),
				headers: {
					"Orion-Version": "1"
				},
				handleAs: "json",
				contentType: "application/json",
				timeout: 15000,
				load: function(jsonData, ioArgs) {
					d.resolve();
				},
				error: function(response, ioArgs) {
					if (ioArgs.xhr.status === 401) {
						mAuth.handlePutAuthenticationError(this, ioArgs);
					} else {
						d.resolve(); // consider throwing here
					}
				}
			});
			return d;
		}
	};
	
	function DefaultPreferencesProvider(location) {
		this.location = location;
		this._currentPromise = null;
	}
	DefaultPreferencesProvider.prototype = {
		
		get: function(name) {
			if (this._currentPromise) {
				return this._currentPromise;
			}
			var key = "/orion/preferences/default";
			var d = new dojo.Deferred();
			var cached = _cache.get(key);
			if (cached !== null) {
				d.resolve(cached[name] || {});
			} else {
				this._currentPromise = d;
				var that = this;
				dojo.xhrGet({
					url: this.location,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000,
					load: function(data, ioArgs) {
						_cache.set(key, data);
						that._currentPromise = null;
						d.resolve(data[name]|| {});
					},
					error: function(response, ioArgs) {
						if (ioArgs.xhr.status === 401) {
							if(name==="/plugins"){
								d.resolve({});
								return;
							}
							mAuth.handleGetAuthenticationError(ioArgs.xhr, ioArgs);
						} else if (ioArgs.xhr.status === 404) {
							_cache.set(key, {});
							that._currentPromise = null;
							d.resolve({});
						} else {
							that._currentPromise = null;
							var data = _cache.get(key, true);
							if (data !== null) {
								d.resolve(data[name] || {});
							} else {
								d.resolve({});
							}
						}
					}
				});
			}
			return d;
		}
	};
	
	/**
	 * Constructs a new preference service. Clients should obtain a preference service
	 * by requesting the service <tt>orion.core.preference</tt> from the service registry.
	 * This service constructor is only intended to be used by page service registry
	 * initialization code.
	 * @class The preferences service manages a hierarchical set of preference
	 * nodes. Each node consists of preference key/value pairs. 
	 * @name orion.preferences.PreferencesService
	 * @see orion.preferences.Preferences
	 */
	function PreferencesService(serviceRegistry, userPreferencesLocation, defaultPreferencesLocation) {
		
		userPreferencesLocation = userPreferencesLocation || "/prefs/user";
		defaultPreferencesLocation = defaultPreferencesLocation || "/defaults.pref";
		this._userProvider = new UserPreferencesProvider(userPreferencesLocation);
		this._defaultsProvider = new DefaultPreferencesProvider(defaultPreferencesLocation);
		this._serviceRegistration = serviceRegistry.registerService("orion.core.preference", this);
	}
	PreferencesService.prototype = /** @lends orion.preferences.PreferencesService.prototype */ {
		
		/**
		 * Retrieves the preferences of the given node name.
		 * @param {String} name A slash-delimited path to the preference node to return
		 */
		getPreferences: function(name) {
			var preferences = new Preferences(name, this._userProvider, this._defaultsProvider);
			var promise = preferences.sync().then(function() {
				return preferences;
			});
			return promise;
		}
		
	};
	//return module exports
	return {
		Preferences: Preferences,
		PreferencesService: PreferencesService
	};
});
