/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

 /*global window */

/**
 * @namespace The global container for eclipse APIs.
 */ 
var eclipse = eclipse || {};

/**
 * A preference object provides functions for accessing and setting preferences
 * stored in some asynchronously accessible back end store (for example on a server).
 * @class A preference object provides functions for accessing and setting preferences
 * @name eclipse.Preferences
 */
eclipse.Preferences = (function() {
	/**
	 * Creates a new preferences object that interacts with a remote preference server
	 * at the given location.
	 * @param {String} location The location of the remote preference service
	 * @constructs
	 */
	function Preferences (serviceRegistry, location) {
		this._init(serviceRegistry, location);
	}
	Preferences.prototype = /** @lends eclipse.Preferences */ {
		_init: function(serviceRegistry, location) {
			this.serviceLocation = location;
			this.registry = serviceRegistry;
		},

	 	/**
	 	 * Retrieves the preference with the given key from the preference service at the 
	 	 * given location. On completion, the onDone method is invoked with the preference 
	 	 * value as a parameter. A null value is returned if there is no preference defined 
	 	 * or if there was an error retrieving the value.
	 	 * @param {String} key The preference key. The key is either a simple name, or a path where the key is the final segment.
	 	 * @param {Function} onDone A function that is invoked with the loaded preference as an argument, or
	 	 * with no argument if the preference could not be retrieved and <code>onError</code> is not provided.
	 	 * @param {Function} onError Function to be invoked if retrieval failed, if not profiled <code>onDone</code> 
	 	 * is invoked with no argument.
	 	 */
	 	get: function(key, onDone, /** optional **/onError) {
	 		var servicePath = this.serviceLocation;
	 		var separator = key.lastIndexOf('/');
	 		if (separator) {
	 			if (key.charAt(0) !== '/')
	 				servicePath += '/';
	 			servicePath += key.substring(0, separator);
	 			key = key.substring(separator+1);
	 		}
	 		dojo.xhrGet({
	                url: servicePath + "?key=" + window.encodeURIComponent(key),
	                headers: {
	 					"Orion-Version" : "1"
	 				},
	                handleAs: "json",
	                timeout: 15000,
	                load: function(jsonData, ioArgs) {
	                	onDone(jsonData[key]);
		            },
	                error: function(response, ioArgs) {
						handleGetAuthenticationError(this, ioArgs);
		 				if(onError){
		 					onError(ioArgs.xhr.status);
		 				}else{
		 					onDone();
		 				}
						return response;
	                }
			});
	 	},
	 	/**
	 	 * Retrieves the preferences and children of the given preferences node.
	 	 * @param {String} node Path to a preference node
	 	 * @param {Function} onDone Function to be invoked with the result, or with no argument if retrieval failed.
	 	 */
	 	getNode: function(node, onDone) {
	 		var servicePath = this.serviceLocation;
	 		if (node.charAt(0) !== "/") {
	 			servicePath += "/";
	 		}
	 		dojo.xhrGet({
	 			url: servicePath + node,
	 			headers: {
	 				"Orion-Version" : "1"
	 			},
	 			handleAs: "json",
	 			timeout: 15000,
	 			load: function(jsonData, ioArgs) {
	 				onDone(jsonData);
	 			},
	 			error: function(response, ioArgs) {
	 				handleGetAuthenticationError(this, ioArgs);
	 				onDone();
	 				return response;
	 			}
	 		});
	 	},
	 	/**
	 	 * Sets the preference with the given key to the provided value.
	 	 * @param {String} key The preference key. The key is either a simple name, or a path where the key is the final segment.
	 	 * @param {String} value The preference value.
	 	 */
	 	put: function(key, value, location) {
	 		var servicePath = this.serviceLocation;
	 		var separator = key.lastIndexOf('/');
	 		if (separator) {
	 			if (key[0] != '/')
	 				servicePath += '/';
	 			servicePath += key.substring(0, separator);
	 			key = key.substring(separator+1);
	 		}
	 		dojo.xhrPut({
	                url: servicePath + "?key=" + window.encodeURIComponent(key) + "&value=" + window.encodeURIComponent(value),
	                headers: {
	 					"Orion-Version" : "1"
	 				},
	                handleAs: "json",
	                timeout: 15000,
	                error: function(response, ioArgs) {
						console.error("HTTP status code: ", ioArgs.xhr.status);
						handlePutAuthenticationError(this, ioArgs);
						return response;
	                }
			});
	 	}
	};  // end prototype
	return Preferences;
}());