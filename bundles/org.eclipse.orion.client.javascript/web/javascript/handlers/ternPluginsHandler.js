/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Initial API and implementation
 ******************************************************************************/
/* eslint-env amd */
define([
], function() {
   
   var INSTALLED_PLUGINS_ID = 'installed_plugins'; //$NON-NLS-1$
   var INSTALL_PLUGINS_ID = 'install_plugins'; //$NON-NLS-1$
   var REMOVE_PLUGINS = 'remove_plugins'; //$NON-NLS-1$
   var PLUGIN_ENABLEMENT = 'plugin_enablement'; //$NON-NLS-1$
   
   /**
    * @description Asks the backing server for its complete listing of installed plugins
    * @param {Tern.Server} ternserver The server to query
    * @param {Object} args The arguments
    * @param {Function} callback The callback to call once the request completes or fails
    * @since 9.0
    */
   function getInstalledPlugins(ternserver, args, callback) {
       if(ternserver) {
	       ternserver.request({
	           query: {
		           type: INSTALLED_PLUGINS_ID
	           }}, 
	           function(error, plugins) {
	               if(error) {
	                   callback({request: INSTALLED_PLUGINS_ID, error: error.message, message: 'Failed to get installed plugins'});
	               }
	               if(typeof(plugins) === 'object') {
	               		callback({request: INSTALLED_PLUGINS_ID, plugins:plugins}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: INSTALLED_PLUGINS_ID, plugins: null}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: INSTALLED_PLUGINS_ID, message: 'Failed to get installed plugins, server not started'});
	   }
   }
   
   /**
    * @description Asks the backing server to install a plugin
    * @param {Tern.Server} ternserver The backing Tern server
    * @param {Object} args The map of arguments
    * @param {Function} callback The fuction to call back to when the request completes or fails
    */
   function installPlugins(ternserver, args, callback) {
   		if(ternserver) {
	       ternserver.request({
	           query: {
		           type: INSTALL_PLUGINS_ID
	           }}, 
	           function(error, status) {
	               if(error) {
	                   callback({request: INSTALL_PLUGINS_ID, error: error.message, message: 'Failed to install plugins'});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: INSTALL_PLUGINS_ID, status:status}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: INSTALL_PLUGINS_ID, status: {state: -1}}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: INSTALL_PLUGINS_ID, message: 'Failed to install plugins, server not started'});
	   }
   }
   
   /**
    * @description Asks the backing server to remove a plugin
    * @param {Tern.Server} ternserver The backing Tern server
    * @param {Object} args The map of arguments
    * @param {Function} callback The fuction to call back to when the request completes or fails
    */
   function removePlugins(ternserver, args, callback) {
   		if(ternserver) {
	       ternserver.request({
	           query: {
		           type: REMOVE_PLUGINS
	           }}, 
	           function(error, status) {
	               if(error) {
	                   callback({request: REMOVE_PLUGINS, error: error.message, message: 'Failed to remove plugins'});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: REMOVE_PLUGINS, status:status}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: REMOVE_PLUGINS, status: {state: -1}}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: REMOVE_PLUGINS, message: 'Failed to remove plugins, server not started'});
	   }
   }
   
   /**
    * @description Asks the backing server to set the enabled state of a plugin(s)
    * @param {Tern.Server} ternserver The backing Tern server
    * @param {Object} args The map of arguments
    * @param {Function} callback The fuction to call back to when the request completes or fails
    */
   function setPluginEnablement(ternserver, args, callback) {
   		if(ternserver) {
	       ternserver.request({
	           query: {
		           type: PLUGIN_ENABLEMENT
	           }}, 
	           function(error, status) {
	               if(error) {
	                   callback({request: PLUGIN_ENABLEMENT, error: error.message, message: 'Failed to set enablement of plugins'});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: PLUGIN_ENABLEMENT, status:status}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: PLUGIN_ENABLEMENT, status: {state: -1}}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: PLUGIN_ENABLEMENT, message: 'Failed to set enablement of plugins, server not started'});
	   }
   }
   
   return {
       getInstalledPlugins: getInstalledPlugins,
       installPlugins: installPlugins,
       removePlugins: removePlugins,
       setPluginEnablement: setPluginEnablement
   };
});