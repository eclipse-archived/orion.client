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
	  		"Connection" : {
	  			"!proto": "Object",
	  			"!type": "fn(options: Object)",
	    		"createQuery": {
	  				"!type": "fn(sql: String, values: Object, cb: fn()) -> Query"
	  			},
	    		"prototype": {
	      			"connect": {
	  					"!type": "fn(cb: fn())"
	  				},
			      	"changeUser": {
	  					"!type": "fn(options: Object, cb: fn())"
	  				},
			      	"beginTransaction": {
	  					"!type": "fn(cb: fn()) -> String"
	  				},
			      	"commit": {
	  					"!type": "fn(cb: fn()) -> String"
	  				},
			      	"rollback": {
	  					"!type": "fn(cb: fn()) -> String"
	  				},
			      	"query": {
	  					"!type": "fn(sql: Object, values: ?, cb: ?)"
	  				},
			      	"ping": {
	  					"!type": "fn(cb: fn())"
	  				},
			      	"statistics": {
	  					"!type": "fn(cb: fn())"
	  				},
			      	"end": {
	  					"!type": "fn(cb: fn())"
	  				},
			      	"destroy": {
	  					"!type": "fn()"
	  				},
			      	"pause": {
	  					"!type": "fn()"
	  				},
			      	"resume": {
	  					"!type": "fn()"
	  				},
			      	"escape": {
	  					"!type": "fn(value: String) -> String"
	  				},
			      	"format": {
	  					"!type": "fn(sql: Object, values: [String])"
	  				},
			      	"_handleNetworkError": {
	  					"!type": "fn(err: Error)"
	  				},
			      	"_handleProtocolError": {
	  					"!type": "fn(err: Error)"
	  				},
			      	"_handleProtocolDrain": {
	  					"!type": "fn()"
	  				},
			      	"_handleProtocolConnect": {
	  					"!type": "fn()"
	  				},
			      	"_handleProtocolHandshake": {
	  					"!type": "fn()"
	  				},
			      	"_handleProtocolEnd": {
	  					"!type": "fn(err: Error)"
	  				},
			      	"_implyConnect": {
	  					"!type": "fn()"
	  				}
	    		},
	  		},
  			"Pool": {
  				"!proto": "Object",
  				"!type": "fn(options: Object)",
    			"prototype": {
      				"getConnection": {
	  					"!type": "fn(cb: fn(err: Error, conn: Connection))"
	  				},
      				"releaseConnection": {
	  					"!type": "fn(connection: Connection)"
	  				},
      				"end": {
	  					"!type": "fn(cb: fn(err: Error)) -> Object"
	  				},
      				"query": {
	  					"!type": "fn(sql: String, values: Object, cb: fn())"
	  				},
      				"_removeConnection": {
        				"!type": "fn(connection: Connection)",
      				},
      				"escape": {
	  					"!type": "fn(value: String) -> String"
	  				}
    			}
 			},
  			"PoolConfig": {
  				"!proto": "Object",
  				"!type" : "fn(options: Object)"
  			},
  			"ConnectionConfig": {
  				"!proto": "Object",
  				"!type": "fn(options: Object)",
  				"host": "String",
			    "port": "String",
			    "database": "String",
			    "user": "String",
			    "password": "String",
    			"mergeFlags": {
	  				"!type": "fn(default_flags: Object, user_flags: [String]) -> Number"
	  			},
    			"getDefaultFlags": {
      				"!type": "fn(options: Object) -> [String]",
    			},
    			"getCharsetNumber": {
	  				"!type": "fn(charset: String)"
	  			},
    			"parseUrl": {
	          		"!type": "fn(url: String) -> Object",
    			}
  			},
  			"PoolCluster": {
  				"!proto": "Object",
  				"!type": "fn(config: Object)",
    			"prototype": {
	          		"of": {
		            	"!type": "fn(pattern: String, selector: String) -> Object",
		        	},
	          		"add": {
	  					"!type": "fn(id: String, config: String)"
	  				},
	          		"getConnection": {
	  					"!type": "fn(pattern: String, selector: String, cb: String)"
	  				},
	          		"end": {
	  					"!type": "fn()"
	  				},
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
	          		"_clearFindCaches": {
	  					"!type": "fn()"
	  				}
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
  			"PoolConnection": {
  				"!proto": "Object",
  				"!type": "fn(pool: Pool, options: Object)",
		    	"prototype": {
		        	"release": {
	  					"!type": "fn()"
	  				},
		          	"_realEnd": {
		            	"!type": "fn(cb: fn(err: Error))",
		            	"!doc": "TODO: Remove this when we are removing PoolConnection#end"
		          	},
		          	"end": {
	  					"!type": "fn()"
	  				},
		          	"destroy": {
	  					"!type": "fn()"
	  				},
		          	"_removeFromPool": {
	  					"!type": "fn(connection:PoolConnection)"
	  				}
		        }
		    },
  			"MySQL": {
  				"!proto": "Object",
    			"createConnection": {
	  				"!type": "fn(config: Object) -> Connection"
	  			},
    			"createPool": {
	  				"!type": "fn(config: Object) -> Pool"
	  			},
    			"createPoolCluster": {
	  				"!type": "fn(config: Object) -> PoolCluster"
	  			},
    			"createQuery": {
	  				"!type": "fn(sql: String, values: Object, cb: Object) -> Object"
	  			},
    			"Types": "Types",
    			"escape": {
	  				"!type": "fn(val: String, stringifyObjects: Boolean, timeZone: String) -> String"
	  			},
    			"escapeId": {
	  				"!type": "fn(val: String, forbidQualified: Boolean) -> String"
	  			},
    			"format": {
	  				"!type": "fn(sql: String, values: [String], stringifyObjects: Boolean, timeZone: String)"
	  			}
  			},
  			"Types": {
  				"!proto": "Object",
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
		    	"!proto": "Object",
		    	"!type": "fn(options: Object, callback: fn())",
    			"prototype": {
      				"start": {
	  					"!type": "fn()"
	  				},
      				"determinePacket": {
	  					"!type": "fn(firstByte: Number, parser: Object)"
	  				},
      				"OkPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"ErrorPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"ResultSetHeaderPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"FieldPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"EofPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"_handleFinalResultPacket": {
	  					"!type": "fn(packet: Object)"
	  				},
      				"RowDataPacket": {
	  					"!type": "fn(packet: Object, parser: Parser, connection: Connection)"
	  				},
      				"_sendLocalDataFile": {
	  					"!type": "fn(path: String)"
	  				},
      				"stream": {
	  					"!type": "fn(options: Object) -> Object"
	  				}
    			}
    		},
		    "SqlString": {
		    	"!proto": "Object",
		      	"escapeId": {
	  				"!type": "fn(val: Object, forbidQualified: Boolean) -> String"
	  			},
		      	"escape": {
	  				"!type": "fn(val: String, stringifyObjects: Boolean, timeZone: String) -> String"
	  			},
		      	"arrayToList": {
	  				"!type": "fn(array: String, timeZone: String)"
	  			},
		      	"format": {
	  				"!type": "fn(sql: String, values: [Object], stringifyObjects: Object, timeZone: String)"
	  			},
		      	"dateToString": {
	  				"!type": "fn(date: String, timeZone: String) -> String"
	  			},
		      	"bufferToString": {
	  				"!type": "fn(buffer: String) -> String"
	  			},
		      	"objectToValues": {
	  				"!type": "fn(object: String, timeZone: String) -> String"
	  			}
		    }
		}
}});