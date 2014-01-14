/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - Initial API and implementation
 ******************************************************************************/
 /*global define */
define('javascript/contentAssist/indexFiles/mysqlIndex', [], 
function () {
	return {
		"!name": "mongodb",
  		"!define": {
  			"MongoClient" : {
  				"prototype" : {
  					"connect" : "fn(url: String, options: Object, callback: fn())",
  					"open" : "fn(callback: fn())",
  					"close" : "fn(callback: fn())",
  					"db" : "fn(dbName: String) -> Db"
  				},
  				"connect" : "fn(url: String, options: Object, callback: fn())"
  			},
  			"MongoClient_obj" : {
  				"!type" : "fn(serverConfig: Object, options: Object)"
  			},
  			"Db" : {
  				"prototype" : {
  					"addUser" : "fn(username: String, password: String, options: Object, callback: fn())",
  					"admin" : "fn(callback: fn())",
  					"authenticate" : "fn(username: String, password: String, options: Object, callback: fn())",
  					"close" : "fn(forceClose: Boolean, callback: fn())",
  					"createCollection" : "fn(collectionName: String, options: Object, callback: fn())",
  					"createIndex" : "fn(collectionName: String, fieldOrSpec: Object, options: Object, callback: fn())",
  					"command" : "fn(selector: Object, options: Object, callback: fn())",
  					"collection" : "fn(collectionName: String, options: Object, callback: fn())",
  					"collectionsInfo" : "fn(collectionName: String, callback: fn())",
  					"collectionNames" : "fn(collectionName: String, options: Object, callback: fn())",
  					"collections" : "fn(callback: fn())",
  					"cursorInfo" : "fn(options: Object, callback: fn())",
  					"db" : "fn(dbName: String) -> Db",
  					"dereference" : "fn(dbRef: DBRef, callback: fn())",
  					"dropCollection" : "fn(collectionName; String, callback: fn())",
  					"dropDatabase" : "fn(callback: fn())",
  					"dropIndex" : "fn(collectionName: String, indexName: String, callback: fn())",
  					"ensureIndex" : "fn(collectionName: String, fieldOrSpec: Object, options: Object, callback: fn())",
  					"executeDbAdminCommand" : "fn(command_hash: String, options: Object, callback: fn())",
  					"executeDbCommand" : "fn(command_hash: String, options: Object, callback: fn())",
  					"eval" : "fn(code: Code, parameters: Object, options: Object, callback: fn())",
  					"indexInformation" : "fn(collectionName: String, options: Object, callback: fn())",
  					"logout" : "fn(options: Object, callback: fn())",
  					"open" : "fn(callback: fn())",
  					"reIndex" : "fn(collectionName: String, callback: fn())",
  					"removeAllEventListeners" : "fn()",
  					"renameCollection" : "fn(fromCollection: String, toCollection: String, options: Object, callback: fn())",
  					"removeUser" : "fn(username: String, options: Object, callback: fn())",
  					"stats" : "fn(options: Object, callback: fn())"
  				},
  				"connect" : "fn(url: String, options: Object, callback: fn())",
  				"DEFAULT_URL" : "String",
  				"wrap" : "fn()"
  			},
  			"Db_obj" : {
  				"!type" : "fn(databaseName: String, serverConfig: Object, options: Object)"
  			}
  		}
  	}
 });