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
		"!name": "mysql",
  		"!define": {
    		"!node": {
		  		"Connection" : {
		    		"createQuery": "fn(sql: String, values: Object, cb: fn()) -> Query",
		    		"prototype": {
		      			"connect": "fn(cb: fn())",
				      	"changeUser": "fn(options: Object, cb: fn())",
				      	"beginTransaction": "fn(cb: fn()) -> String",
				      	"commit": "fn(cb: fn()) -> String",
				      	"rollback": "fn(cb: fn()) -> String",
				      	"query": "fn(sql: Object, values: ?, cb: ?)",
				      	"ping": "fn(cb: fn())",
				      	"statistics": "fn(cb: fn())",
				      	"end": "fn(cb: fn())",
				      	"destroy": "fn()",
				      	"pause": "fn()",
				      	"resume": "fn()",
				      	"escape": "fn(value: String) -> String",
				      	"format": "fn(sql: Object, values: [String])",
				      	"_handleNetworkError": "fn(err: Error)",
				      	"_handleProtocolError": "fn(err: Error)",
				      	"_handleProtocolDrain": "fn()",
				      	"_handleProtocolConnect": "fn()",
				      	"_handleProtocolHandshake": "fn()",
				      	"_handleProtocolEnd": "fn(err: Error)",
				      	"_implyConnect": "fn()"
		    		},
		  		},
		  		"Connection_obj" : {
		  			"!type": "fn(options: Object)",
		  		},
      			"Pool": {
        			"prototype": {
          				"getConnection": "fn(cb: fn(err: Error, conn: Connection))",
          				"releaseConnection": "fn(connection: Connection)",
          				"end": "fn(cb: fn(err: Error)) -> Object",
          				"query": "fn(sql: String, values: Object, cb: fn())",
          				"_removeConnection": {
            				"!type": "fn(connection: Connection)",
          				},
          				"escape": "fn(value: String) -> String"
        			}
     			},
     			"Pool_obj" : {
     				"!type": "fn(options: Object)"
     			},
      			"PoolConfig": {
      				"!type" : "fn(options: Object)"
      			},
      			"ConnectionConfig": {
        			"mergeFlags": "fn(default_flags: Object, user_flags: [String]) -> Number",
        			"getDefaultFlags": {
          				"!type": "fn(options: Object) -> [String]",
        			},
        			"getCharsetNumber": "fn(charset: String)",
        			"parseUrl": {
		          		"!type": "fn(url: String) -> Object",
        			}
      			},
      			"ConnectionConfig_obj" : {
      				"!type": "fn(options: Object)",
      				"host": "String",
				    "port": "String",
				    "database": "String",
				    "user": "String",
				    "password": "String"
      			},
      			"PoolCluster": {
        			"prototype": {
		          		"of": {
			            	"!type": "fn(pattern: String, selector: String) -> Object",
			        	},
		          		"add": "fn(id: String, config: String)",
		          		"getConnection": "fn(pattern: String, selector: String, cb: String)",
		          		"end": "fn()",
		          		"_findNodeIds": {
		            		"!type": "fn(pattern: String) -> Object",
		          		},
		          		"_getNode": {
		            		"!type": "fn(id: String) -> Object",
		          		},
		          		"_increaseErrorCount": {
		            		"!type": "fn(node: Object)",
		          		},
		          		"_decreaseErrorCount": {
		            		"!type": "fn(node: Object)",
		          		},
		          		"_getConnection": {
		            		"!type": "fn(node: Object, cb: fn(err: +Error, connection: String))",
		          		},
		          		"_clearFindCaches": "fn()"
		        	},
		        	"_canRetry": "Boolean",
		        	"_removeNodeErrorCount": "Number",
		        	"_defaultSelector": "String",
		        	"_closed": "Boolean",
		        	"_lastId": "Number",
		        	"_nodes": "Object",
		        	"_serviceableNodeIds": "[String]",
		        	"_namespaces": "Object",
		        	"_findCaches": "Object"
		      	},
		      	"PoolCluster_obj" : {
		      		"!type": "fn(config: Object)"
		      	},
      			"PoolConnection": {
			    	"prototype": {
			        	"release": "fn()",
			          	"_realEnd": {
			            	"!type": "fn(cb: fn(err: Error))",
			            	"!doc": "TODO: Remove this when we are removing PoolConnection#end"
			          	},
			          	"end": "fn()",
			          	"destroy": "fn()",
			          	"_removeFromPool": "fn(connection:PoolConnection)"
			        }
			    },
			    "PoolConnection_obj" : {
			    	"!type": "fn(pool: Pool, options: Object)"
			    },
      			"MySQL_obj": {
        			"createConnection": "fn(config: Object) -> Connection",
        			"createPool": "fn(config: Object) -> Pool",
        			"createPoolCluster": "fn(config: Object) -> PoolCluster",
        			"createQuery": "fn(sql: String, values: Object, cb: Object) -> !0",
        			"Types": "Types",
        			"escape": "fn(val: String, stringifyObjects: Boolean, timeZone: String) -> String",
        			"escapeId": "fn(val: String, forbidQualified: Boolean) -> String",
        			"format": "fn(sql: String, values: [String], stringifyObjects: Boolean, timeZone: String)"
      			},
      			"Types": {
			        "DECIMAL": "Number",
			        "TINY": "Number",
			        "SHORT": "Number",
			        "LONG": "Number",
			        "FLOAT": "Number",
			        "DOUBLE": "Number",
			        "NULL": "Number",
			        "TIMESTAMP": "Number",
			        "LONGLONG": "Number",
			        "INT24": "Number",
			        "DATE": "Number",
			        "TIME": "Number",
			        "DATETIME": "Number",
			        "YEAR": "Number",
			        "NEWDATE": "Number",
			        "VARCHAR": "Number",
			        "BIT": "Number",
			        "NEWDECIMAL": "Number",
			        "ENUM": "Number",
			        "SET": "Number",
			        "TINY_BLOB": "Number",
			        "MEDIUM_BLOB": "Number",
			        "LONG_BLOB": "Number",
			        "BLOB": "Number",
			        "VAR_STRING": "Number",
			        "STRING": "Number",
			        "GEOMETRY": "Number"
			    },
			    "Query": {
        			"prototype": {
          				"start": "fn()",
          				"determinePacket": "fn(firstByte: Number, parser: Object)",
          				"OkPacket": "fn(packet: Object)",
          				"ErrorPacket": "fn(packet: Object)",
          				"ResultSetHeaderPacket": "fn(packet: Object)",
          				"FieldPacket": "fn(packet: Object)",
          				"EofPacket": "fn(packet: Object)",
          				"_handleFinalResultPacket": "fn(packet: Object)",
          				"RowDataPacket": "fn(packet: Object, parser: ?, connection: Connection)",
          				"_sendLocalDataFile": "fn(path: String)",
          				"stream": "fn(options: Object) -> Object"
        			}
        		},
        		"Query_obj" : {
        			"!type": "fn(options: Object, callback: fn())"
        		},
			    "SqlString": {
			      	"escapeId": "fn(val: Object, forbidQualified: Boolean) -> String",
			      	"escape": "fn(val: String, stringifyObjects: Boolean, timeZone: String) -> String",
			      	"arrayToList": "fn(array: String, timeZone: String)",
			      	"format": "fn(sql: String, values: [Object], stringifyObjects: Object, timeZone: String)",
			      	"dateToString": "fn(date: String, timeZone: String) -> String",
			      	"bufferToString": "fn(buffer: String) -> String",
			      	"objectToValues": "fn(object: String, timeZone: String) -> String"
			    }
    		},
  		}
}});