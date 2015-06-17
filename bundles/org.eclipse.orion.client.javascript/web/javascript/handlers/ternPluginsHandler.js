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
	'i18n!javascript/nls/workermessages'
], function(Messages) {
   
   var INSTALLED_PLUGINS_ID = 'installed_plugins'; //$NON-NLS-1$
   var INSTALL_PLUGINS_ID = 'install_plugins'; //$NON-NLS-1$
   var REMOVE_PLUGINS = 'remove_plugins'; //$NON-NLS-1$
   var PLUGIN_ENABLEMENT = 'plugin_enablement'; //$NON-NLS-1$
   var ENVIRONMENTS = 'environments'; //$NON-NLS-1$
   
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
	                   callback({request: INSTALLED_PLUGINS_ID, error: error.message, message: Messages['failedGetInstalledPlugins']});
	               }
	               if(typeof(plugins) === 'object') {
	               		callback({request: INSTALLED_PLUGINS_ID, plugins:plugins});
       			   } else {
       			   		callback({request: INSTALLED_PLUGINS_ID, plugins: null});
       			   }
	           });
	   } else {
	       callback({request: INSTALLED_PLUGINS_ID, message: Messages['failedGetInstalledPluginsNoServer']});
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
	                   callback({request: INSTALL_PLUGINS_ID, error: error.message, message: Messages['failedInstallPlugins']});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: INSTALL_PLUGINS_ID, status:status});
       			   } else {
       			   		callback({request: INSTALL_PLUGINS_ID, status: {state: -1}});
       			   }
	           });
	   } else {
	       callback({request: INSTALL_PLUGINS_ID, message: Messages['failedInstallPluginsNoServer']});
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
	                   callback({request: REMOVE_PLUGINS, error: error.message, message: Messages['failedRemovePlugins']});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: REMOVE_PLUGINS, status:status}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: REMOVE_PLUGINS, status: {state: -1}}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: REMOVE_PLUGINS, message: Messages['failedRemovePluginsNoServer']});
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
	                   callback({request: PLUGIN_ENABLEMENT, error: error.message, message: Messages['failedEnablementPlugins']});
	               }
	               if(typeof(status) === 'object') {
	               		callback({request: PLUGIN_ENABLEMENT, status:status}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: PLUGIN_ENABLEMENT, status: {state: -1}}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: PLUGIN_ENABLEMENT, message: Messages['failedEnablementPluginsNoServer']});
	   }
   }
   
   /**
    * @description Asks the backing server to get the contributed eslint environments
    * @param {Tern.Server} ternserver The backing Tern server
    * @param {Object} args The map of arguments
    * @param {Function} callback The fuction to call back to when the request completes or fails
    */
   function getEnvironments(ternserver, args, callback) {
   		if(ternserver) {
	       ternserver.request({
	           query: {
		           type: ENVIRONMENTS
	           }}, 
	           function(error, envs) {
	               if(error) {
	                   callback({request: ENVIRONMENTS, error: error.message, message: Messages['failedGetEnvs']});
	               }
	               if(typeof(envs) === 'object') {
	               		callback({request: ENVIRONMENTS, envs:envs}); //$NON-NLS-1$
       			   } else {
       			   		callback({request: ENVIRONMENTS, envs: null}); //$NON-NLS-1$
       			   }
	           });
	   } else {
	       callback({request: ENVIRONMENTS, message: Messages['failedGetEnvsNoServer']});
	   }
   }
   
   return {
       getInstalledPlugins: getInstalledPlugins,
       installPlugins: installPlugins,
       removePlugins: removePlugins,
       setPluginEnablement: setPluginEnablement,
       getEnvironments: getEnvironments
   };
});