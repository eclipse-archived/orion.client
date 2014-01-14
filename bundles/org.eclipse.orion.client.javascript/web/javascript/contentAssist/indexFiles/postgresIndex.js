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
define('javascript/contentAssist/indexFiles/postgresIndex', [
], function () {
	return {
		"!name": "postgres",
  		"!define": {
    		"PG" : {
    			"prototype" : {
    				"end" : {
    					"!type" : "fn()"
    				},
    				"connect" : {
    					"!type" : "fn(config: Object, callback: fun())"
    				},
    				"cancel" : {
    					"!type" : "fn(config: Object, client: Client, query: Query)"
    				}
    			}
    		},
    		"PG_obj" : {
    			"!type": "fn(config: Object)"
    		},
      		"Client": {
        		"prototype": {
	          		"connect": {
    					"!type" : "fn(callback: fn())"
    				},
	          		"getStartupConf": {
    					"!type" : "fn() -> Object"
    				},
	          		"cancel": {
    					"!type" : "fn(client: Client, query: Query)"
    				},
	          		"escapeIdentifier": {
	            		"!type": "fn(str: String) -> String",
	            		"!doc": "Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c"
	          		},
	          		"escapeLiteral": {
	            		"!type": "fn(str: String) -> String",
	            		"!doc": "Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c"
	          		},
	          		"_pulseQueryQueue": {
    					"!type" : "fn()"
    				},
	         		"_copy": {
    					"!type" : "fn(text: String, stream: Object) -> Object"
    				},
	          		"copyFrom": {
    					"!type" : "fn(text: String)"
    				},
	          		"copyTo": {
    					"!type" : "fn(text: String)"
    				},
	          		"query": {
    					"!type" : "fn(config: Object, values: Object, callback: fn()) -> Object"
    				},
	          		"end": {
    					"!type" : "fn()"
    				}
	        	},
	        },
        	"Client_obj" : {
        		"md5": "fn(string: String)",
        		"!type": "fn(config: Object)"
        	},
        	"ConnectionParameters": {
		        "prototype": {
		          	"getLibpqConnectionString": {
    					"!type" : "fn(cb: fn())"
    				}
		        },
		    },
		    "ConnectionParameters_obj" : {
		    	"!type": "fn(config: Object)"
		    },
		    "Connection": {
		        "prototype": {
		        	"connect": {
    					"!type" : "fn(port: Number, host: String)"
    				},
		          	"attachListeners": {
    					"!type" : "fn(stream: Object)"
    				},
		          	"requestSsl": {
    					"!type" : "fn(config: Object)"
    				},
		          	"startup": {
    					"!type" : "fn(config: Object)"
    				},
		          	"cancel": {
    					"!type" : "fn(processID: Number, secretKey: String)"
    				},
		          	"password": {
    					"!type" : "fn(password: String)"
    				},
		          	"_send": {
    					"!type" : "fn(code: Number, more: Object) -> Boolean"
    				},
		          	"query": {
    					"!type" : "fn(text: String)"
    				},
		          	"parse": {
		            	"!type": "fn(query: Query, more: Object)",
		            	"!doc": "send parse message \"more\" === true to buffer the message until flush() is called"
		          	},
		          	"bind": {
		            	"!type": "fn(config: Object, more: Object)",
		            	"!doc": "send bind message \"more\" === true to buffer the message until flush() is called"
		          	},
		          	"execute": {
		            	"!type": "fn(config: Object, more: Object)",
		            	"!doc": "send execute message \"more\" === true to buffer the message until flush() is called"
		         	 },
		          	"flush": {
    					"!type" : "fn()"
    				},
		          	"sync": {
    					"!type" : "fn()"
    				},
		          	"end": {
    					"!type" : "fn()"
    				},
		          	"describe": {
    					"!type" : "fn(msg: Message, more: Object)"
    				},
		          	"sendCopyFromChunk": {
    					"!type" : "fn(chunk: Object)"
    				},
		          	"endCopyFrom": {
    					"!type" : "fn()"
    				},
		          	"sendCopyFail": {
    					"!type" : "fn(msg: Message)"
    				},
		          	"setBuffer": {
		            	"!type": "fn(buffer: Buffer)",
		            	"!doc": "parsing methods",
		          	},
		          	"readSslResponse": {
    					"!type" : "fn()"
    				},
		          	"parseMessage": {
    					"!type" : "fn() -> Boolean"
    				},
		          	"parseR": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseS": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseK": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseC": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseZ": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseT": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseField": {
		            	"!type": "fn(buffer: Buffer) -> Object",
		          	},
		          	"parseD": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		            	"!doc": "extremely hot-path code",
		          	},
		          	"_readValue": {
		            	"!type": "fn(buffer: Buffer)",
		            	"!doc": "extremely hot-path code",
		          	},
		          	"parseE": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		            	"!doc": "parses error",
		            	"!ret": "?"
		          	},
		          	"parseN": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		            	"!doc": "same thing, different name",
		          	},
		          	"parseA": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseG": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseH": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseGH": {
		            	"!type": "fn(buffer: Buffer, msg: String) -> Message",
		          	},
		          	"parsed": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Message",
		          	},
		          	"parseInt32": {
		            	"!type": "fn(buffer: Buffer) -> Number",
		          	},
		          	"parseInt16": {
		           		"!type": "fn(buffer: Buffer) -> Number",
		          	},
		          	"readString": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> String",
		          	},
		          	"readBytes": {
		            	"!type": "fn(buffer: Buffer, length: Number) -> Buffer",
		          	},
		          	"parseCString": {
		            	"!type": "fn(buffer: Buffer) -> String",
		          	}
		        },
		    },
		    "Connection_obj" : {
		    	"!type": "fn(config: Object)"
		    },
		  	"Error": {
		    	"name": "String",
		    	"length": "Number",
			    "salt": "Buffer",
			    "parameterName": "String",
			    "parameterValue": "String",
			    "processID": "Number",
			    "secretKey": "Number",
			    "text": "String",
			    "status": "String",
			    "fieldCount": "Number",
			    "fields": "[Object]",
			    "processId": "Number",
			    "channel": "String",
			    "payload": "String",
			    "binary": "Boolean",
			    "columnTypes": "[Number]",
			    "chunk": "Buffer"
		  	},
	        "CopyFromStream": {
	          	"prototype": {
		            "_writable": {
	    				"!type" : "fn() -> Boolean"
	    			},
		            "startStreamingToConnection": {
	    				"!type" : "fn(connection: Connection)"
	    			},
		            "_handleChunk": {
	    				"!type" : "fn(string: String, encoding: String) -> Boolean"
	    			},
		            "_sendIfConnectionReady": {
	    				"!type" : "fn() -> Boolean"
	    			},
		            "_endIfNeedAndPossible": {
	    				"!type" : "fn()"
	    			},
		            "write": {
	    				"!type" : "fn(string: String, encoding: String) -> Boolean"
	    			},
		            "end": {
	    				"!type" : "fn(string: String, encondig: String) -> Boolean"
	    			},
		            "error": {
	    				"!type" : "fn(error: Error) -> Boolean"
	    			},
		            "close": {
	    				"!type" : "fn() -> Boolean"
	    			}
	          	}
	        },
	        "CopyFromStream_obj" : {
	        	"!type": "fn()"
	        },
	        "CopyToStream": {
	          	"prototype": {
	            	"_outputDataChunk": {
    					"!type" : "fn()"
    				},
		            "_readable": {
    					"!type" : "fn() -> Boolean"
    				},
		            "error": {
    					"!type" : "fn(error: Error) -> Boolean"
    				},
		            "close": {
    					"!type" : "fn() -> Boolean"
    				},
		            "handleChunk": {
    					"!type" : "fn(chunk: Object)"
    				},
		            "pause": {
    					"!type" : "fn() -> Boolean"
    				},
		            "resume": {
    					"!type" : "fn() -> Boolean"
    				},
		            "setEncoding": {
    					"!type" : "fn(encoding: String)"
    				}
	          	}
	        },
	        "CopyToStream_obj" : {
	        	"!type": "fn()"
	        },
	        "Query": {
		        "prototype": {
		          	"requiresPreparation": {
    					"!type" : "fn() -> Boolean"
    				},
		          	"handleRowDescription": {
		            	"!type": "fn(msg: Message)",
		            	"!doc": "associates row metadata from the supplied message with this query object metadata used when parsing row results"
		          	},
		          	"handleDataRow": {
    					"!type" : "fn(msg: Message)"
    				},
		          	"handleCommandComplete": {
    					"!type" : "fn(msg: Message, con: Connection)"
    				},
		          	"handleReadyForQuery": {
    					"!type" : "fn()"
    				},
		          	"handleError": {
    					"!type" : "fn(err: Boolean, connection: Connection)"
    				},
		          	"submit": {
    					"!type" : "fn(connection: Connection)"
    				},
		          	"hasBeenParsed": {
    					"!type" : "fn(connection: Connection) -> String"
    				},
		          	"handlePortalSuspended": {
    					"!type" : "fn(connection: Connection)"
    				},
		          	"_getRows": {
    					"!type" : "fn(connection: Connection, rows: Object)"
    				},
		          	"prepare": {
    					"!type" : "fn(connection: Connection)"
    				},
		          	"handleCopyInResponse": {
    					"!type" : "fn(connection: Connection)"
    				},
		          	"handleCopyData": {
    					"!type" : "fn(msg: Message, connection: Connection)"
    				}
		        },
		        "portal": {
		          	"!type": "String",
		          	"!doc": "use unique portal name each time"
		        },
		        "_fieldNames": {
    				"!type" : "[String]"
    			},
		        "_fieldConverters": "[Object]",
		        "isPreparedStatement": {
		          "!type": "Boolean",
		          "!doc": "prepared statements need sync to be called after each command complete or when an error is encountered"
		        },
		        "_canceledDueToError": "Boolean"
		    },
		    "Query_obj" : {
		    	"!type": "fn(config: Object, values: Object, callback: fn()) -> Query",
		    },
		    "Result": {
		        "prototype": {
		          	"addCommandComplete": {
		            	"!type": "fn(msg: Message)",
		            	"!doc": "adds a command complete message"
		          	},
		          	"_parseRowAsArray": {
		            	"!type": "fn(rowData: Object) -> [Object]"
		            },
		          	"parseRow": {
		            	"!type": "fn(rowData: Object) -> Object",
		            	"!doc": "rowData is an array of text or binary values this turns the row into a JavaScript object"
		          	},
		          	"addRow": {
		            	"!type": "fn(row: Object)"
		            },
		          	"addFields": {
		            	"!type": "fn(fieldDescriptions: Object)"
		            }
		        },
		    },
		    "Result_obj" : {
		    	"!type": "fn(rowMode: Object)"
		    }
	    }
	}
});