/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*global define console window document navigator */
 
 define(['dojo'], function(dojo){
 
	/**
	 * Local storage support class.
	 *
	 * @param prefix [required] Used to create a separate namespace for storage.
	 */
	function LocalStorage(prefix){
		this._prefix = prefix;
	}
	
	LocalStorage.prototype = {
	
		/**
		 * [interface] Stores the pair (key, value)
		 */
		set : function(key, value){
			var cKey = this._prefix + "." + key;
			window.localStorage.setItem(cKey, value);
		},
		
		/**
		 * [interface] Retrieves the value for the given key.
		 * Returns an empty string if key is not present.
		 */
		get : function(key){
			var cKey = this._prefix + "." + key;
			return (window.localStorage.getItem(cKey) === null ? "" : window.localStorage.getItem(cKey));
		},
		
		/**
		 * [interface] Erases the value for the given key.
		 */
		destroy : function(key){
			var cKey = this._prefix + "." + key;
			window.localStorage.removeItem(cKey);
		},
		
		/**
		 * [interface] Tests whether local storage is enabled or not.
		 */
		available : function(){
			return (window.localStorage ? true : false);
		},
		
		/**
		 * [interface] Retrieves all saved keys without the prefix.
		 */
		getKeys : function(){
			var result = [];
			for(var i=0; i<window.localStorage.length; ++i){
				var key = window.localStorage.key(i);
				if(key.indexOf(this._prefix) === 0){
					result.push(key.substring(this._prefix.length + 1, key.length));
				}
			}
			
			return result;
		},
		
		/**
		 * [interface] Clears all saved data.
		 */
		clear : function(){
			var keys = this.getKeys();
		
			for(var i=0; i<keys.length; ++i){
				var key = keys[i];
				this.destroy(key);
			}
		}
	};
	
	LocalStorage.prototype.constructor = LocalStorage;
	
	/**
	 * Stores user git credentials for automatic authentication support.
	 */
	function GitCredentialsStorage(){
		this._prefix = "orion.git.credentials";
		this._browserEnabled = false;
		
		// detect and use underlying browser storage mechanism
		if(this._supportsLocalStorage()){ this._store = new LocalStorage(this._prefix); this._browserEnabled = true; }
	}
	
	GitCredentialsStorage.prototype = {
		
		/**
		 * Detects if local storage is enabled.
		 */
		_supportsLocalStorage : function(){
			var tmp = new LocalStorage();
			return tmp.available();
		},
		
		/**
		 * Determines whether the storage feature is enabled or not.
		 */
		isUserEnabled : function(){
			return (this._store.get("isUserEnabled") !== "" ? true : false);
		},
		
		/**
		 * Enables the use of credentials storage.
		 */
		userEnable : function(){
			this._store.set("isUserEnabled", "true");
		},
		
		/**
		 * Disables the use of credentials storage.
		 */
		userDisable : function(){
			this._store.destroy("isUserEnabled");
		},
		
		/**
		 * Informs if browser support credentials storage.
		 */
		isBrowserEnabled : function(){
			return this._browserEnabled;
		},
				
		/**
		 * Informs if automatic authentication support
		 * is enabled or not. If no brower storage mechanism
		 * is present the support cannot be enabled and we will
		 * have to switch to manual authentication instead.
		 */
		isEnabled : function(){
			if(this._browserEnabled){ return this.isUserEnabled(); }
			else { return false; }
		},
		
		/**
		 * Retrieves the stored private key.
		 * Returns an empty string if no key was stored.
		 */
		getPrivateKey : function(repository){
			return this._store.get(repository + "::" + "privateKey");
		},
		
		/**
		 * Stores the private key.
		 */
		setPrivateKey : function(repository, privateKey){
			this._store.set(repository + "::" + "privateKey", privateKey);
		},
		
		/**
		 * Erases the private key.
		 */
		erasePrivateKey : function(repository){
			this._store.destroy(repository + "::" + "privateKey");
		},
		
		/**
		 * Retrieves the stored passphrase.
		 * Returns an empty string if no passphrase was found.
		 */
		getPassphrase : function(repository){
			return this._store.get(repository + "::" + "passphrase");
		},
		
		/**
		 * Stores the passphrase.
		 */
		setPassphrase : function(repository, passphrase){
			this._store.set(repository + "::" + "passphrase", passphrase);
		},
		
		/**
		 * Erases the passphrase.
		 */
		erasePassphrase : function(repository){
			this._store.destroy(repository + "::" + "passphrase");
		},
		
		/**
		 * Returns whether the given repository should prompt for credentials or not.
		 */
		getPrompt : function(repository){
			return (this._store.get(repository + "::" + "prompt") === "false" ? false : true);
		},
		
		/**
		 * Stores the information not to prompt for credentials.
		 */
		setPrompt : function(repository){
			this._store.set(repository + "::" + "prompt", "false");
		},
		
		/**
		 * Erases the information to prompt for credentials.
		 */
		erasePrompt : function(repository){
			this._store.destroy(repository + "::" + "prompt");
		},
		
		/**
		 * Clears all credentials.
		 */
		clearCredentials : function(){
			this._store.clear();
		},
		
		/**
		 *	Returns repositories which have stored credentials.
		 */
		getRepositories : function(){
			var keys = this._store.getKeys();
			var result = [];
			
			for(var i=0; i<keys.length; ++i){
				if(keys[i] !== "isUserEnabled"){
					var repository = keys[i].substring(0, keys[i].indexOf("::"));
					if(dojo.indexOf(result, repository) < 0){ result.push(repository); }
				}
			}
			
			return result;
		}
	};
	
	GitCredentialsStorage.prototype.constructor = GitCredentialsStorage;
 
	return {
		GitCredentialsStorage : GitCredentialsStorage
	};
 });