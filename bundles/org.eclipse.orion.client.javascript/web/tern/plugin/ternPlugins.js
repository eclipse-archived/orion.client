/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, amd*/
/*globals infer tern walk*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"acorn/util/walk"
],/* @callback */ function(infer, tern, walk) {
	
	tern.registerPlugin('ternPlugins', /* @callback */ function(server, options) { //$NON-NLS-1$
		return {}; //TODO I don't think we need to hook any phases
	});
	
	tern.defineQueryType('installed_plugins', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			if(server.options && typeof(server.options.plugins) === 'object') {
				return server.options.plugins;
			}
			return null;
		}
	});
	
	tern.defineQueryType('environments', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			if(server.options && typeof(server.options.plugins) === 'object') {
				var plugins = server.options.plugins;
				var keys = Object.keys(plugins);
				var envs = Object.create(null);
				for(var i = 0; i < keys.length; i++) {
					var key = keys[i];
					var env = plugins[key].env;
					if(env) {
						envs[env] = true;
					}
				}
				return envs;
			}
			return null;
		}
	});
	
	tern.defineQueryType('install_plugins', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			//TODO
		}
	});
	
	tern.defineQueryType('remove_plugins', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			//TODO			
		}
	});
	
	tern.defineQueryType('plugin_enablement', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			//TODO
		}
	});
}); 