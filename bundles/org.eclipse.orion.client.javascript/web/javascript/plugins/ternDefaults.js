/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* eslint-env amd*/
/* eslint-disable missing-nls */
define([
	'i18n!javascript/nls/messages',
	'json!tern/defs/ecma5.json',
	'json!tern/defs/ecma6.json',
	'json!tern/defs/ecma7.json',
	'json!tern/defs/browser.json',
	'json!tern/defs/chai.json',
	
	//tern defaults
	"tern/plugin/angular",
	"tern/plugin/doc_comment",
	"tern/plugin/es_modules",
	'tern/plugin/node',
	'tern/plugin/requirejs',
	'tern/plugin/commonjs',
	
	//orion defaults
	"javascript/ternPlugins/amqp",
	"javascript/ternPlugins/ast",
	"javascript/ternPlugins/eslint",
	"javascript/ternPlugins/express",
	"javascript/ternPlugins/html",
	"javascript/ternPlugins/jsdoc",
	"javascript/ternPlugins/mongodb",
	"javascript/ternPlugins/mysql",
	"javascript/ternPlugins/occurrences",
	"javascript/ternPlugins/open_impl",
	"javascript/ternPlugins/outliner",
	"javascript/ternPlugins/plugins",
	"javascript/ternPlugins/postgres",
	"javascript/ternPlugins/redis",
	"javascript/ternPlugins/refs",
	"javascript/ternPlugins/templates",
	"javascript/ternPlugins/quickfixes",
	"javascript/ternPlugins/beautifier"
], function(Messages, ecma5, ecma6, ecma7, browser, chai) {
	var defs = [ecma5, ecma6, ecma7, browser, chai];
	var defNames = ["ecma5", "ecma6", "ecma7", "browser", "chai"]; //these are in the same order to avoid a walk of the array
	
	var plugins = {
		required: {
			"doc_comment": {
				"name": Messages["ternDocPluginName"],
				"description": Messages["ternDocPluginDescription"],
				"fullDocs": true,
				"version": "0.18.0"
			},
			"plugins": {
				"name": Messages["ternPluginsPluginName"],
				"description": Messages["ternPluginsPluginDescription"],
				"version": "1.0"
			},
			"occurrences": {
				"name": Messages["occurrencesPluginName"],
				"description": Messages["occurrencesPluginDescription"],
				"version": "1.0"
			},
			"open_impl": {
				"name": Messages["openImplPluginName"],
				"description": Messages["openImplPluginDescription"],
				"version": "1.0"
			},
			"html": {
				"name": Messages["htmlDepPluginName"],
				"description": Messages["htmlDepPluginDescription"],
				"version": "1.0"
			},
			"refs": {
				"name": Messages["findTypesName"],
				"description": Messages["findTypesDescription"],
				"version": "1.0"
			},
			"jsdoc": {
				"name": Messages["jsdocPluginName"],
				"description": Messages["jsdocPluginDescription"],
				"version": "1.0"
			},
			"eslint": {
				"name": Messages["eslintPluginName"],
				"description": Messages["eslintPluginDescription"],
				"version": "1.0"
			},
			"outliner": {
				"name": Messages["outlinerPluginName"],
				"description": Messages["outlinerPluginDescription"],
				"version": "1.0"
			},
			"fixes": {
				"name": Messages["fixesPluginName"],
				"description": Messages["fixesPluginDescription"],
				"version": "1.0"
			},
			"ast": {
				"name": Messages["astPluginName"],
				"description": Messages["astPluginDescription"],
				"version": "1.0"
			},
			"templates": {
				"name": Messages["templatesPlugin"],
				"description": Messages["templatesPluginDescription"],
				"version": "1.0"
			},
			"beautifier": {
				"name": Messages["beautifierPluginName"],
				"description": Messages["beautifierPluginDescription"],
				"version": "1.0"
			},
		},
		optional: {
			"amqp": {
				"name": Messages["orionAMQPPluginName"],
				"description": Messages["orionAMQPPluginDescription"],
				"version": "0.9.1",
				"env": "amqp"
			},
			"angular": {
				"name": Messages["orionAngularPluginName"],
				"description": Messages["orionAngularPluginDescription"],
				"version": "0.18.0"
			},
			"commonjs": {
				"name": Messages['commonjsPluginName'],
				"description": Messages['commonjsPluginDescription'],
				"version": "0.18.0"
			},
			"express": {
				"name": Messages["orionExpressPluginName"],
				"description": Messages["orionExpressPluginDescription"],
				"version": "4.12.4",
				"env": "express"
			},
			"es_modules": {
				"name": Messages["orionESModulesPluginName"],
				"description": Messages["orionESModulesPluginDescription"],
				"version": "0.18.0",
			},
			"mongodb": {
				"name": Messages["orionMongoDBPluginName"],
				"description": Messages["orionMongoDBPluginDescription"],
				"version": "1.1.21",
				"env": "mongodb"
			},
			"mysql": {
				"name": Messages["orionMySQLPluginName"],
				"description": Messages["orionMySQLPluginDescription"],
				"version": "2.7.0",
				"env": "mysql"
			},
			"node": {
				"name": Messages["orionNodePluginName"],
				"description": Messages["orionNodePluginDescription"],
				"version": "0.18.0"
			},
			"postgres": {
				"name": Messages["orionPostgresPluginName"],
				"description": Messages["orionPostgresPluginDescription"],
				"version": "4.4.0",
				"env": "pg"
			},
			"redis": {
				"name": Messages["orionRedisPluginName"],
				"description": Messages["orionRedisPluginDescription"],
				"version": "0.12.1",
				"env": "redis"
			},
			"requirejs": {
				"name": Messages["orionRequirePluginName"],
				"description": Messages["orionRequirePluginDescription"],
				"version": "0.18.0"
			}
		}
	};
	
	var serverOptions = {
		async: true,
        debug: false,
        projectDir: 'orionFakeProjectDir', // Tern strips the project dir from any file paths it finds and defaults to '/' so this must be set
        defs: defs,
        ecmaVersion: 7,
        optionalDefs: {
        	"ecma5": true,
        	"ecma6": true,
        	"ecma7": true,
        	"browser": true,
        	"chai": true,
        },
        optionalPlugins: {
        	'amqp': 'amqp', 
        	'angular': 'angular', 
        	'express': 'express', 
        	'es_modules': 'es_modules',
        	'mongodb': 'mongodb',
        	'mongo': 'mongodb', //ESlint provides mongo - map it to Tern
        	'mysql': 'mysql', 
        	'node': 'node', 
        	'pg': 'postgres', 
        	'redis': 'redis', 
        	'amd': 'requirejs'
        }
	};
	
	/**
	 * @description Returns a clone of the deafult server options
	 * @private
	 * @returns {Object} A clone the default server options
	 */
	function _serverOptions() {
		var opts = {};
		Object.keys(serverOptions).forEach(function(key) {
			opts[key] = serverOptions[key];
		});
		opts.plugins = {};
		Object.keys(plugins.required).forEach(function(key) {
			opts.plugins[key] = plugins.required[key];
		});
		return opts;
	}
	
	return {
		plugins: plugins,
		defs: defs,
		defNames: defNames,
		pluginsDir: 'tern/plugin/',
		serverOptions: _serverOptions
	};
});
