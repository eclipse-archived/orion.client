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

define(['require', 'dojo', 'orion/auth', 'dojo/DeferredList'], function(require, dojo, mAuth){

	/**
	 * Constructs a new preferences instance. This constructor is not
	 * intended to be used by clients. Preferences should instead be
	 * obtained from a preference service
	 * @class A preferences object returned by the preferences service
	 * @name orion.preferences.Preferences
	 * @see orion.preferences.PreferencesService
	 */
	function Preferences(_name, providers) {
		this._name = _name;
		this._providers = providers;
		this._flushPending = false;
		
		// filled by _getCached call
		this._cached = null;
		
		// filled by sync call
		this._stores = []; 

		// filled by _scheduleFlush
		this._dirty = [];
	}
	Preferences.prototype = /** @lends orion.preferences.Preferences.prototype */ {
		
		_flush: function() {
			var flushes = [];
			
			for (var i=0; i < this._stores.length; ++i) {
				var store = this._stores[i];
				if (this._dirty.indexOf(store) !== -1) {
					flushes.push(this._providers[i].put(this._name, store));
				}
			}
			this._dirty = [];
			return new dojo.DeferredList(flushes);
		},
		
		_scheduleFlush: function(store) {
			if (this._dirty.indexOf(store) === -1) {
				this._dirty.push(store);
			}
			
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
		
		_getCached: function() {
			if (!this._cached) {
				this._cached = {};
				for (var i=0; i < this._stores.length; ++i) {
					var store = this._stores[i];
					for (var j in store) {
						if (store.hasOwnProperty(j) && typeof(this._cached[j]) === "undefined" ) {
							this._cached[j] = store[j];
						}
					}
				}
			}
			return this._cached;
		},

		/**
		 * Returns an array of String preference keys available in this node.
		 */
		keys: function() {
			return Object.keys(this._getCached());
		},
		
		/**
		 * Returns the value of the preference with the given key
		 * @param {String} key The preference key to return
		 */
		get: function(key) {
			var cached = this._getCached();
			return cached[key];
		},
		
		/**
		 * Associates a new preference value with the given key,
		 * replacing any existing value.
		 * @param {String} key The preference key
		 * @param {String} value The preference value
		 */
		put: function(key, value) {
			if (this._stores.length === 0) {
				return;
			}
			
			var top = this._stores[0];
			
			if (top[key] !== value) {
				top[key] = value;
				this._cached = null;
				this._scheduleFlush(top);
			}
		},
		
		/**
		 * Removes the preference with the given key. Has no
		 * effect if no such key is defined.
		 * @param {String} key The preference key to remove
		 */
		remove: function(key) {	
			for (var i=0; i < this._stores.length; ++i) {
				var store = this._stores[i];
				if (store.hasOwnProperty(key)) {
					delete store[key];
					this._cached = null;
					this._scheduleFlush(store);
					return true;
				}
			}
			return false;
		},
		
		/**
		 * Removes all preferences from this preference node.
		 */
		clear: function() {
			for (var i=0; i < this._stores.length; ++i) {
				this._stores[i] = {};
				this._scheduleFlush(this._stores[i]);
			}
			this._cached = null;
		},
		
		/**
		 * Synchronizes this preference node with its storage. Any new values
		 * in the storage area will become available to this preference object.
		 */
		sync:  function(optForce) {
			if(this._flushPending) {
				this._flushPending = false;
				return this._flush();
			}
			
			var that = this;
			var storeList = [];

			for (var i = 0; i < this._providers.length; ++i) {
				storeList.push(this._providers[i].get(this._name, optForce).then(function(i) { // curry i 
					return function(result) {
						that._stores[i] = result;
					};
				}(i)));
			}
			return new dojo.DeferredList(storeList).then(function(){
				that._cached = null;
				that._getCached();
			});
		},
		/**
		 * Flushes all preference changes in this node to its backing storage.
		 * @function
		 */
		flush: function() {
			this._flush();
		}
	};
	
	function Cache(prefix, expiresSeconds) {
		return {
			get: function(name, ignoreExpires) {
				if (expiresSeconds === 0) {
					return null;
				}
				
				var item = localStorage.getItem(prefix + name);
				if (item === null) {
					return null;
				}
				var cached = JSON.parse(item);
				if (ignoreExpires || expiresSeconds === -1 || (cached._expires && cached._expires > new Date().getTime())) {
					delete cached._expires;
					return cached;
				}
				return null;
			},
			set: function(name, data) {
				if (expiresSeconds === 0) {
					return;
				}
				
				if (expiresSeconds !== -1) {
					data._expires = new Date().getTime() + 1000 * expiresSeconds;
				}
				if (Object.keys(data).length === 0) {
					localStorage.removeItem(prefix + name);
				} else {
					var jsonData = JSON.stringify(data);
					localStorage.setItem(prefix + name, jsonData);
					delete data._expires;
				}
			},
			remove: function(name) {
				localStorage.removeItem(prefix + name);
			}
		};
	}
	
	function UserPreferencesProvider(serviceRegistry) {
		this._currentPromises = {};
		this._cache = new Cache("/orion/preferences/user", 0);
		
		this._service = null;
		this.available = function() {
			var that = this;
			if (!this._service) {
				var references = serviceRegistry.getServiceReferences("orion.core.preference.provider");
				if (references.length > 0) {
					serviceRegistry.getService(references[0], 0).then(function(service) { // synchronously set
						that._service = service;
					});
				}
			}
			return !!this._service;
		};
	}
	
	UserPreferencesProvider.prototype = {	
		get: function(name, optForce) {
			if (this._currentPromises[name]) {
				return this._currentPromises[name];
			}
			var d = new dojo.Deferred();
			var cached = null;
			if (optForce) {
				this._cache.remove(name);
			} else {
				cached = this._cache.get(name);
			}
			if (cached !== null) {
				d.resolve(cached);
			} else {
				this._currentPromises[name] = d;
				var that = this;
				this._service.get(name).then(function(data) {
					that._cache.set(name, data);
					delete that._currentPromises[name];
					d.resolve(data);
				}, function (error) {
					if (error.status === 401) {
						delete that._currentPromises[name];
						d.resolve({});
						
						// retry
						mAuth.handleAuthenticationError(error, function(){
							that.get(name);
						});
					} else if (error.status === 404) {
						var data = {};
						that._cache.set(name, data);
						delete that._currentPromises[name];
						d.resolve(data);
					} else  {
						delete that._currentPromises[name];
						d.resolve(that._cache.get(name, true) || {});
					}
				});
			}
			return d;
		},
		
		put: function(name, data) {
			var d = new dojo.Deferred();
			this._cache.set(name, data);
			var that = this;
			this._service.put(name, data).then(function() {
				d.resolve();
			}, function(error) {
				if (error.status === 401) {
					mAuth.handleAuthenticationError(error, function(){
						that._service.put(name, data).then(function() {
							d.resolve();
						}, function() {
							d.resolve();
						});				
					});
				} else {
					d.resolve(); // consider throwing here
				}
			});
			return d;
		}
	};
	
	function DefaultPreferencesProvider(location) {
		this._location = location;
		this._currentPromise = null;
		this._cache = new Cache("/orion/preferences/default", 60*60);
	}
	
	DefaultPreferencesProvider.prototype = {
		
		get: function(name, optForce) {
			if (this._currentPromise) {
				return this._currentPromise;
			}
			var d = new dojo.Deferred();
			var cached = null;
			if (optForce) {
				this._cache.remove(name);
			} else {
				cached = this._cache.get(name);
			}
			if (cached !== null) {
				d.resolve(cached);
			} else {
				this._currentPromise = d;
				var that = this;
				dojo.xhrGet({
					url: this._location,
					headers: {
						"Orion-Version": "1"
					},
					handleAs: "json",
					timeout: 15000,
					load: function(data, ioArgs) {
						that._cache.set(name, data[name] || {});
						that._currentPromise = null;
						d.resolve(data[name]|| {});
					},
					error: function(response, ioArgs) {
						if (ioArgs.xhr.status === 401) {
							that._currentPromise = null;
							d.resolve({});
							d = new dojo.Deferred();
							that._currentPromise = d;
							var currentXHR = this;
							mAuth.handleAuthenticationError(ioArgs.xhr, function(){
								dojo.xhrGet(currentXHR); // retry GET							
							});
						} else if (ioArgs.xhr.status === 404) {
							that._cache.set(name, {});
							that._currentPromise = null;
							d.resolve({});
						} else {
							that._currentPromise = null;
							var data = that._cache.get(name, true);
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
		},
		set: function(name, data) {
			var d = new dojo.Deferred();
			d.resolve();
			return d;
		}
	};
	
	function LocalPreferencesProvider() {
		this._cache = new Cache("/orion/preferences/local", -1);
	}
	
	LocalPreferencesProvider.prototype = {
		get: function(name) {
			var d = new dojo.Deferred();
			var cached = this._cache.get(name);
			if (cached !== null) {
				d.resolve(cached);
			} else {
				d.resolve({});
			}
			return d;
		},
		set: function(name, data) {
			var d = new dojo.Deferred();
			this._cache.set(name, data);
			d.resolve();
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
	function PreferencesService(serviceRegistry, defaultPreferencesLocation) {
		this._userProvider = new UserPreferencesProvider(serviceRegistry);
		this._localProvider = new LocalPreferencesProvider();
		
		defaultPreferencesLocation = defaultPreferencesLocation || "defaults.pref";
		if (defaultPreferencesLocation.indexOf("://") === -1) {
			defaultPreferencesLocation = require.toUrl(defaultPreferencesLocation);
		}
		this._defaultsProvider = new DefaultPreferencesProvider(defaultPreferencesLocation);
		this._serviceRegistration = serviceRegistry.registerService("orion.core.preference", this);
	}
	
	PreferencesService.DEFAULT_SCOPE = 1;
	PreferencesService.LOCAL_SCOPE = 2;
	PreferencesService.USER_SCOPE = 4;
	
	PreferencesService.prototype = /** @lends orion.preferences.PreferencesService.prototype */ {
		
		/**
		 * Retrieves the preferences of the given node name.
		 * @param {String} name A slash-delimited path to the preference node to return
		 */
		getPreferences: function(name, optScope) {
			
			if (!optScope || typeof(optScope) !== "number" || optScope > 7 || optScope < 1) {
				optScope = PreferencesService.DEFAULT_SCOPE | PreferencesService.LOCAL_SCOPE | PreferencesService.USER_SCOPE;
			}
			var providers = [];
			if ((PreferencesService.USER_SCOPE & optScope) && this._userProvider.available()) {
				providers.push(this._userProvider);
			}
			if (PreferencesService.LOCAL_SCOPE & optScope) {
				providers.push(this._localProvider);
			}
			if (PreferencesService.DEFAULT_SCOPE & optScope) {
				providers.push(this._defaultsProvider);
			}
			
			var preferences = new Preferences(name, providers);
			var promise = preferences.sync().then(function() {
				return preferences;
			});
			return promise;
		}
	};
	return {
		PreferencesService: PreferencesService
	};
});
