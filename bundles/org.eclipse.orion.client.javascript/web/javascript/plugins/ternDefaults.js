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
/* eslint-env amd*/
/* eslint-disable missing-nls */
define([
	'i18n!javascript/nls/workermessages',
	'json!tern/defs/ecma5.json',
	'json!tern/defs/ecma6.json',
	'json!tern/defs/browser.json',
	'json!tern/defs/chai.json',
	
	//required to load them
	'tern/plugin/doc_comment',
	'tern/plugin/orionAmqp',
	'tern/plugin/angular',
	'tern/plugin/orionExpress',
	'tern/plugin/orionMongoDB',
	'tern/plugin/orionMySQL',
	'tern/plugin/node',
	'tern/plugin/orionPostgres',
	'tern/plugin/orionRedis',
	'tern/plugin/requirejs',
	'tern/plugin/plugins',
	'tern/plugin/openImplementation',
	'tern/plugin/htmlDependencies',
	'tern/plugin/refs',
	'tern/plugin/jsdoc',
	'tern/plugin/eslint',
], function(Messages, ecma5, ecma6, browser, chai) {
	
	var defs = [ecma5, ecma6, browser, chai];

	var plugins = {
		"doc_comment": {
			"name": Messages["ternDocPluginName"],
			"description": Messages["ternDocPluginDescription"],
			"fullDocs": true,
			"version": "0.12.0",
			"removable": false
		},
		"orionAmqp": {
			"name": Messages["orionAMQPPluginName"],
			"description": Messages["orionAMQPPluginDescription"],
			"version": "0.9.1",
			"removable": true,
			"env": "amqp"
		},
		"angular": {
			"name": Messages["orionAngularPluginName"],
			"description": Messages["orionAngularPluginDescription"],
			"version": "0.12.0",
			"removable": true
		},
		"orionExpress": {
			"name": Messages["orionExpressPluginName"],
			"description": Messages["orionExpressPluginDescription"],
			"version": "4.12.4",
			"removable": true,
			"env": "express"
		},
		"orionMongoDB": {
			"name": Messages["orionMongoDBPluginName"],
			"description": Messages["orionMongoDBPluginDescription"],
			"version": "1.1.21",
			"removable": true,
			"env": "mongodb"
		},
		"orionMySQL": {
			"name": Messages["orionMySQLPluginName"],
			"description": Messages["orionMySQLPluginDescription"],
			"version": "2.7.0",
			"removable": true,
			"env": "mysql"
		},
		"node": {
			"name": Messages["orionNodePluginName"],
			"description": Messages["orionNodePluginDescription"],
			"version": "0.12.0",
			"removable": true
		},
		"orionPostgres": {
			"name": Messages["orionPostgresPluginName"],
			"description": Messages["orionPostgresPluginDescription"],
			"version": "4.4.0",
			"removable": true,
			"env": "pg"
		},
		"orionRedis": {
			"name": Messages["orionRedisPluginName"],
			"description": Messages["orionRedisPluginDescription"],
			"version": "0.12.1",
			"removable": true,
			"env": "redis"
		},
		"requirejs": {
			"name": Messages["orionRequirePluginName"],
			"description": Messages["orionRequirePluginDescription"],
			"nls": "javascript/nls/workermessages",
			"version": "0.12.0",
			"removable": true
		},
		"plugins": {
			"name": Messages["ternPluginsPluginName"],
			"description": Messages["ternPluginsPluginDescription"],
			"version": "1.0",
			"removable": false
		},
		"openImplementation": {
			"name": Messages["openImplPluginName"],
			"description": Messages["openImplPluginDescription"],
			"version": "1.0",
			"removable": false
		},
		"htmlDependencies": {
			"name": Messages["htmlDepPluginName"],
			"description": Messages["htmlDepPluginDescription"],
			"version": "1.0",
			"removable": false
		},
		"refs": {
			"name": Messages["findTypesName"],
			"description": Messages["findTypesDescription"],
			"version": "1.0",
			"removable": false
		},
		"jsdoc": {
			"name": Messages["jsdocPluginName"],
			"description": Messages["jsdocPluginDescription"],
			"version": "1.0",
			"removable": false
		},
		"eslint": {
			"name": Messages["eslintPluginName"],
			"description": Messages["eslintPluginDescription"],
			"version": "1.0",
			"removeable": true
		}
	};
	return {
		plugins: plugins,
		defs: defs,
		pluginsDir: 'tern/plugin/',
		defsDir: 'tern/defs/'
	};
});