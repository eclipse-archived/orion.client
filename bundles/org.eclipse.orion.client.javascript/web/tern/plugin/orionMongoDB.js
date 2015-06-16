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
/*globals infer tern resolver*/
/**
 * Tern type index and templates for MongoDB node support
 */
(function(mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require);
  if (typeof define === "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", './resolver'], mod);
  mod(infer, tern, resolver);
})(/* @callback */ function(infer, tern, resolver) {

	var templates = [
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for MongoDB", //$NON-NLS-0$
			template: "var ${name} = require('mongodb');\n" //$NON-NLS-0$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb client", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new MongoDB client", //$NON-NLS-0$
			template: "var MongoClient = require('mongodb').MongoClient;\n" +//$NON-NLS-0$
					  "var Server = require('mongodb').Server;\n${cursor}" //$NON-NLS-1$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb open", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new MongoDB client and open a connection", //$NON-NLS-0$
			template: "var MongoClient = require('mongodb').MongoClient;\n" +//$NON-NLS-0$
					  "var Server = require('mongodb').Server;\n"+  //$NON-NLS-0$
					  "var ${client} = new MongoClient(new Server(${host}, ${port}));\n"+ //$NON-NLS-0$
					  "try {\n" + //$NON-NLS-0$
					  "\t${client}.open(function(error, ${client}) {\n" + //$NON-NLS-0$
  					  "\t\tvar ${db} = ${client}.db(${name});\n" + //$NON-NLS-0$
  					  "\t\t${cursor}\n" + //$NON-NLS-0$
  					  "\t});\n" +  //$NON-NLS-0$
  					  "} finally {\n" + //$NON-NLS-0$
  					  "\t${client}.close();\n" + //$NON-NLS-0$
  					  "};" //$NON-NLS-0$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb connect", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - connect to an existing MongoDB database", //$NON-NLS-0$
			template: "var MongoClient = require('mongodb').MongoClient;\n" +//$NON-NLS-0$
					  "MongoClient.connect(${url}, function(error, db) {\n"+  //$NON-NLS-0$
					  "\t${cursor}\n"+ //$NON-NLS-0$
  					  "});\n" //$NON-NLS-0$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb connect (Cloud Foundry)", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - connect to an existing MongoDB database using Cloud Foundry", //$NON-NLS-0$
			template: "if (${process}.env.VCAP_SERVICES) {\n" +  //$NON-NLS-0$
   					  "\tvar env = JSON.parse(${process}.env.VCAP_SERVICES);\n" +  //$NON-NLS-0$
   					  "\tvar mongo = env[\'${mongo-version}\'][0].credentials;\n" +  //$NON-NLS-0$
					  "} else {\n" +  //$NON-NLS-0$
					  "\tvar mongo = {\n" +  //$NON-NLS-0$
					  "\t\tusername : \'username\',\n" +  //$NON-NLS-0$
					  "\t\tpassword : \'password\',\n" +  //$NON-NLS-0$
					  "\t\turl : \'mongodb://username:password@localhost:27017/database\'\n" +  //$NON-NLS-0$
					  "\t};\n}\n" +  //$NON-NLS-0$
					  "var MongoClient = require('mongodb').MongoClient;\n" +//$NON-NLS-0$
					  "MongoClient.connect(mongo.url, function(error, db) {\n"+  //$NON-NLS-0$
					  "\t${cursor}\n"+ //$NON-NLS-0$
  					  "});\n" //$NON-NLS-0$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb collection", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a MongoDB database collection", //$NON-NLS-0$
			template: "${db}.collection(${id}, function(${error}, collection) {\n"+//$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
				  "});"  //$NON-NLS-0$
		},
		{
			prefix: "mongodb", //$NON-NLS-0$
			name: "mongodb strict collection", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a MongoDB database strict collection", //$NON-NLS-0$
			template: "${db}.collection(${id}, {strict:true}, function(${error}, collection) {\n"+//$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "});"  //$NON-NLS-0$
		}
	];
	
	/**
	 * @description Gets the templates that apply to given context
	 * @since 9.0
	 * @callback
	 */
	function getTemplates(file, query, completions) {
		var wordEnd = tern.resolvePos(file, query.end);
		var expr = infer.findExpressionAround(file.ast, null, wordEnd, file.scope);
		var tmps = resolver.getTemplatesForNode(templates, expr);
		if(tmps && tmps.length > 0) {
			for (var i = 0; i < tmps.length; i++) {
				var _t = tmps[i];
				_t.origin = 'mongodb'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	} 
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionMongoDB", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	completion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
		"mongodb": {
		    "MongoClient": {
		      "!type": "fn(serverConfig: ?, options: ?)",
		      "connect": "fn(uri: string, options: ?, callback: fn(err: Error, db: Db))",
		      "prototype": {}
		    },
		    "Server": {
		      "!type": "fn(host: string, port: number, opts?: ServerOptions)",
		      "prototype": {
		        "connect": "fn() -> ?"
		      }
		    },
		    "Db": {
		      "!type": "fn(databaseName: string, serverConfig: Server, dbOptions?: DbCreateOptions)",
		      "prototype": {
		        "db": "fn(dbName: string) -> Db",
		        "open": "fn(callback: fn(err: Error, db: Db))",
		        "close": "fn(forceClose?: bool, callback?: fn(err: Error, result: ?))",
		        "admin": "fn(callback: fn(err: Error, result: ?)) -> ?",
		        "collectionsInfo": "fn(collectionName: string, callback?: fn(err: Error, result: ?))",
		        "collectionNames": "fn(collectionName: string, options: ?, callback?: fn(err: Error, result: ?))",
		        "collection": "fn(collectionName: string) -> Collection",
		        "collections": "fn(callback: fn(err: Error, collections: [Collection]))",
		        "eval": "fn(code: ?, parameters: [?], options?: ?, callback?: fn(err: Error, result: ?))",
		        "logout": "fn(options: ?, callback?: fn(err: Error, result: ?))",
		        "authenticate": "fn(userName: string, password: string, callback?: fn(err: Error, result: ?))",
		        "addUser": "fn(username: string, password: string, callback?: fn(err: Error, result: ?))",
		        "removeUser": "fn(username: string, callback?: fn(err: Error, result: ?))",
		        "createCollection": "fn(collectionName: string, callback?: fn(err: Error, result: Collection))",
		        "command": "fn(selector: Object, callback?: fn(err: Error, result: ?))",
		        "dropCollection": "fn(collectionName: string, callback?: fn(err: Error, result: ?))",
		        "renameCollection": "fn(fromCollection: string, toCollection: string, callback?: fn(err: Error, result: ?))",
		        "lastError": "fn(options: Object, connectionOptions: ?, callback: fn(err: Error, result: ?))",
		        "previousError": "fn(options: Object, callback: fn(err: Error, result: ?))",
		        "executeDbCommand": "fn(command_hash: ?, callback?: fn(err: Error, result: ?))",
		        "executeDbAdminCommand": "fn(command_hash: ?, callback?: fn(err: Error, result: ?))",
		        "resetErrorHistory": "fn(callback?: fn(err: Error, result: ?))",
		        "createIndex": "fn(collectionName: ?, fieldOrSpec: ?, options: IndexOptions, callback: Function)",
		        "ensureIndex": "fn(collectionName: ?, fieldOrSpec: ?, options: IndexOptions, callback: Function)",
		        "cursorInfo": "fn(options: ?, callback: Function)",
		        "dropIndex": "fn(collectionName: string, indexName: string, callback: Function)",
		        "reIndex": "fn(collectionName: string, callback: Function)",
		        "indexInformation": "fn(collectionName: string, options: ?, callback: Function)",
		        "dropDatabase": "fn(callback: fn(err: Error, result: ?))",
		        "stats": "fn(options: ?, callback: Function)",
		        "_registerHandler": "fn(db_command: ?, raw: ?, connection: ?, exhaust: ?, callback: Function)",
		        "_reRegisterHandler": "fn(newId: ?, object: ?, callback: Function)",
		        "_callHandler": "fn(id: ?, document: ?, err: ?) -> ?",
		        "_hasHandler": "fn(id: ?) -> ?",
		        "_removeHandler": "fn(id: ?) -> ?",
		        "_findHandler": "fn(id: ?) -> ret",
		        "__executeQueryCommand": "fn(self: ?, db_command: ?, options: ?, callback: ?)",
		        "DEFAULT_URL": "string",
		        "connect": "fn(url: string, options: Object, callback: fn(err: Error, result: ?))",
		        "addListener": "fn(event: string, handler: fn(param: ?)) -> ?"
		      }
		    },
		    "SocketOptions": {
		      "timeout": "number",
		      "noDelay": "bool",
		      "keepAlive": "number",
		      "encoding": "string"
		    },
		    "ServerOptions": {
		      "auto_reconnect": "bool",
		      "poolSize": "number",
		      "socketOptions": "?"
		    },
		    "PKFactory": {
		      "counter": "number",
		      "createPk": "fn()"
		    },
		    "DbCreateOptions": {
		      "w": "?",
		      "wtimeout": "number",
		      "fsync": "bool",
		      "journal": "bool",
		      "readPreference": "string",
		      "native_parser": "bool",
		      "forceServerObjectId": "bool",
		      "pkFactory": "PKFactory",
		      "serializeFunctions": "bool",
		      "raw": "bool",
		      "recordQueryStats": "bool",
		      "retryMiliSeconds": "number",
		      "numberOfRetries": "number",
		      "logger": "Object",
		      "slaveOk": "number",
		      "promoteLongs": "bool"
		    },
		    "ReadPreference": {
		      "PRIMARY": "string",
		      "PRIMARY_PREFERRED": "string",
		      "SECONDARY": "string",
		      "SECONDARY_PREFERRED": "string",
		      "NEAREST": "string",
		      "prototype": {}
		    },
		    "CollectionCreateOptions": {
		      "readPreference": "string",
		      "slaveOk": "bool",
		      "serializeFunctions": "bool",
		      "raw": "bool",
		      "pkFactory": "PKFactory"
		    },
		    "CollStats": {
		      "ns": "string",
		      "count": "number",
		      "size": "number",
		      "avgObjSize": "number",
		      "storageSize": "number",
		      "numExtents": "number",
		      "nindexes": "number",
		      "lastExtentSize": "number",
		      "paddingFactor": "number",
		      "flags": "number",
		      "totalIndexSize": "number",
		      "indexSizes": {
		        "_id_": "number",
		        "username": "number"
		      }
		    },
		    "Collection": {
		      "insert": "fn(query: ?, callback: fn(err: Error, result: ?))",
		      "remove": "fn(selector: Object, callback?: fn(err: Error, result: ?))",
		      "rename": "fn(newName: String, callback?: fn(err: Error, result: ?))",
		      "save": "fn(doc: ?, callback: fn(err: Error, result: ?))",
		      "update": "fn(selector: Object, document: ?, callback?: fn(err: Error, result: ?))",
		      "distinct": "fn(key: string, query: Object, callback: fn(err: Error, result: ?))",
		      "count": "fn(callback: fn(err: Error, result: ?))",
		      "drop": "fn(callback?: fn(err: Error, result: ?))",
		      "findAndModify": "fn(query: Object, sort: [?], doc: Object, callback: fn(err: Error, result: ?))",
		      "findAndRemove": "fn(query: Object, sort?: [?], callback?: fn(err: Error, result: ?))",
		      "find": "fn(callback?: fn(err: Error, result: Cursor)) -> Cursor",
		      "findOne": "fn(callback?: fn(err: Error, result: ?)) -> Cursor",
		      "createIndex": "fn(fieldOrSpec: ?, callback: fn(err: Error, indexName: string))",
		      "ensureIndex": "fn(fieldOrSpec: ?, callback: fn(err: Error, indexName: string))",
		      "indexInformation": "fn(options: ?, callback: Function)",
		      "dropIndex": "fn(name: string, callback: Function)",
		      "dropAllIndexes": "fn(callback: Function)",
		      "reIndex": "fn(callback: Function)",
		      "mapReduce": "fn(map: Function, reduce: Function, options: MapReduceOptions, callback: Function)",
		      "group": "fn(keys: Object, condition: Object, initial: Object, reduce: Function, finalize: Function, command: bool, options: Object, callback: Function)",
		      "options": "fn(callback: Function)",
		      "isCapped": "fn(callback: Function)",
		      "indexExists": "fn(indexes: string, callback: Function)",
		      "geoNear": "fn(x: number, y: number, callback: Function)",
		      "geoHaystackSearch": "fn(x: number, y: number, callback: Function)",
		      "indexes": "fn(callback: Function)",
		      "aggregate": "fn(pipeline: [?], callback: fn(err: Error, results: ?))",
		      "stats": "fn(options: Object, callback: fn(err: Error, results: CollStats))",
		      "hint": "?"
		    },
		    "MapReduceOptions": {
		      "out": "Object",
		      "query": "Object",
		      "sort": "Object",
		      "limit": "number",
		      "keeptemp": "bool",
		      "finalize": "?",
		      "scope": "Object",
		      "jsMode": "bool",
		      "verbose": "bool",
		      "readPreference": "string"
		    },
		    "IndexOptions": {
		      "w": "?",
		      "wtimeout": "number",
		      "fsync": "bool",
		      "journal": "bool",
		      "unique": "bool",
		      "sparse": "bool",
		      "background": "bool",
		      "dropDups": "bool",
		      "min": "number",
		      "max": "number",
		      "v": "number",
		      "expireAfterSeconds": "number",
		      "name": "string"
		    },
		    "Cursor": {
		      "INIT": "number",
		      "OPEN": "number",
		      "CLOSED": "number",
		      "GET_MORE": "number",
		      "prototype": {
		        "rewind": "fn() -> Cursor",
		        "toArray": "fn(callback: fn(err: Error, results: [?]))",
		        "each": "fn(callback: fn(err: Error, item: ?))",
		        "count": "fn(applySkipLimit: bool, callback: fn(err: Error, count: number))",
		        "sort": "fn(keyOrList: ?, callback?: fn(err: Error, result: ?)) -> Cursor",
		        "limit": "fn(limit: number, callback?: fn(err: Error, result: ?)) -> Cursor",
		        "setReadPreference": "fn(preference: string, callback?: Function) -> Cursor",
		        "skip": "fn(skip: number, callback?: fn(err: Error, result: ?)) -> Cursor",
		        "batchSize": "fn(batchSize: number, callback?: fn(err: Error, result: ?)) -> Cursor",
		        "nextObject": "fn(callback: fn(err: Error, doc: ?))",
		        "explain": "fn(callback: fn(err: Error, result: ?))",
		        "stream": "fn() -> CursorStream",
		        "close": "fn(callback: fn(err: Error, result: ?))",
		        "isClosed": "fn() -> bool"
		      }
		    },
		    "CursorStream": {
		      "!type": "fn(cursor: Cursor)",
		      "prototype": {
		        "pause": "fn() -> ?",
		        "resume": "fn() -> ?",
		        "destroy": "fn() -> ?"
		      }
		    },
		    "CollectionFindOptions": {
		      "limit": "number",
		      "sort": "?",
		      "fields": "Object",
		      "skip": "number",
		      "hint": "Object",
		      "explain": "bool",
		      "snapshot": "bool",
		      "timeout": "bool",
		      "tailtable": "bool",
		      "tailableRetryInterval": "number",
		      "numberOfRetries": "number",
		      "awaitdata": "bool",
		      "oplogReplay": "bool",
		      "exhaust": "bool",
		      "batchSize": "number",
		      "returnKey": "bool",
		      "maxScan": "number",
		      "min": "number",
		      "max": "number",
		      "showDiskLoc": "bool",
		      "comment": "String",
		      "raw": "bool",
		      "readPreference": "String",
		      "partial": "bool"
		    },
		    "MongoCollectionOptions": {
		      "safe": "?",
		      "serializeFunctions": "?",
		      "raw": "bool",
		      "pkFactory": "?",
		      "readPreference": "string"
		    }
	  },
	  "!name": "mongodb",
	  "!define": {
	  	"!node": {
		   "mongodb": {
		   	"!doc": "MongoDB",
		   	"!url": "https://www.mongodb.org/",
		    "MongoClient": "mongodb.MongoClient",
		    "Db": "mongodb.Db",
		    "Server": "mongodb.Server",
		    "SocketOptions": "mongodb.SocketOptions",
		    "ServerOptions": "mongodb.ServerOptions",
		    "CollectionFindOptions": "mongodb.CollectionFindOptions",
		    "MongoCollectionOptions": "mongodb.MongoCollectionOptions",
		    "IndexOptions": "mongodb.IndexOptions",
		    "CollectionCreateOptions": "mongodb.CollectionCreateOptions",
		    "DbCreateOptions": "mongodb.DbCreateOptions",
		    "MapReduceOptions": "mongodb.MapReduceOptions",
		    "CollStats": "mongodb.CollStats",
		    "ReadPreference": "mongodb.ReadPreference",
		    "Collection": "mongodb.Collection",
		    "Cursor": "mongodb.Cursor",
		    "PKFactory": "mongodb.PKFactory"
		   }
		 }
		}
	};
});