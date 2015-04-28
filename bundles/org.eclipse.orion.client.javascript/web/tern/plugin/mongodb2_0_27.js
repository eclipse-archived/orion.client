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
/*globals infer tern*/
(function(mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require);
  if (typeof define === "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern"], mod);
  mod(infer, tern);
})(/* @callback */ function(infer, tern) {

	var defs = {
		  "!name": "mongodb",
		  "!define": {
		    "Server.prototype.connect.!0": {
		      "force": {
		        "!type": "bool",
		        "!span": "3463[67:6]-3468[67:11]"
		      },
		      "bufferMaxEntries": {
		        "!type": "number",
		        "!span": "3482[68:6]-3498[68:22]",
		        "!doc": "Update bufferMaxEntries"
		      }
		    },
		    "Server.prototype.cursor.!2": {
		      "poolSize": "number",
		      "socketOptions": {
		        "connectTimeoutMS": {
		          "!type": "number",
		          "!span": "7125[180:10]-7141[180:26]",
		          "!doc": "Set socketTimeout to the same as the connectTimeoutMS or 30 sec"
		        },
		        "socketTimeoutMS": {
		          "!type": "number",
		          "!span": "7201[181:10]-7216[181:25]",
		          "!doc": "Reset the socket timeout"
		        }
		      },
		      "auto_reconnect": "bool",
		      "host": {
		        "!type": "string",
		        "!span": "3934[86:16]-3938[86:20]"
		      },
		      "connectionTimeout": {
		        "!type": "number",
		        "!span": "4542[99:20]-4559[99:37]"
		      },
		      "socketTimeout": {
		        "!type": "number",
		        "!span": "4677[103:20]-4690[103:33]"
		      },
		      "keepAlive": {
		        "!type": "bool",
		        "!span": "4897[108:20]-4906[108:29]"
		      },
		      "cursorFactory": {
		        "prototype": {
		          "setReadPreference": {},
		          "namespace": {
		            "database": {
		              "!type": "string",
		              "!span": "23515[769:6]-23523[769:14]"
		            },
		            "collection": {
		              "!type": "string",
		              "!span": "23555[770:6]-23565[770:16]"
		            }
		          },
		          "maxTimeMs": "Cursor.prototype.maxTimeMS",
		          "filter": "Cursor.prototype.filter",
		          "addCursorFlag": "Cursor.prototype.addCursorFlag",
		          "addQueryModifier": "Cursor.prototype.addQueryModifier",
		          "comment": "Cursor.prototype.comment",
		          "maxTimeMS": "Cursor.prototype.maxTimeMS",
		          "project": "Cursor.prototype.project",
		          "sort": "Cursor.prototype.sort",
		          "batchSize": "Cursor.prototype.batchSize",
		          "limit": "Cursor.prototype.limit",
		          "skip": "Cursor.prototype.skip",
		          "nextObject": "Cursor.prototype.nextObject",
		          "each": "Cursor.prototype.each",
		          "forEach": "Cursor.prototype.forEach",
		          "toArray": "Cursor.prototype.toArray",
		          "count": "Cursor.prototype.count",
		          "close": "Cursor.prototype.close",
		          "isClosed": "Cursor.prototype.isClosed",
		          "destroy": "Cursor.prototype.destroy",
		          "stream": "Cursor.prototype.stream",
		          "explain": "Cursor.prototype.explain",
		          "_read": "Cursor.prototype._read"
		        },
		        "INIT": {
		          "!type": "number",
		          "!span": "25734[830:7]-25738[830:11]",
		          "!doc": "Versions of Node prior to v0.10 had streams that did not implement the entire Streams API as it is today."
		        },
		        "OPEN": {
		          "!type": "number",
		          "!span": "25751[831:7]-25755[831:11]"
		        },
		        "CLOSED": {
		          "!type": "number",
		          "!span": "25768[832:7]-25774[832:13]"
		        },
		        "GET_MORE": {
		          "!type": "number",
		          "!span": "25787[833:7]-25795[833:15]"
		        }
		      },
		      "reconnect": {
		        "!type": "bool",
		        "!span": "5147[118:16]-5156[118:25]"
		      },
		      "emitError": {
		        "!type": "bool",
		        "!span": "5186[119:16]-5195[119:25]"
		      },
		      "size": {
		        "!type": "number",
		        "!span": "5225[120:16]-5229[120:20]"
		      },
		      "disconnectHandler": "+Store"
		    },
		    "Server.prototype.cursor.!2.cursorFactory.prototype.setReadPreference.!0": {
		      "mode": {
		        "!type": "string",
		        "!span": "2942[82:16]-2946[82:20]"
		      }
		    },
		    "Server.prototype.cursor.!2.cursorFactory.!3": {
		      "limit": {
		        "!type": "number",
		        "!span": "82479[2073:4]-82484[2073:9]"
		      },
		      "sort": {
		        "!type": "number",
		        "!span": "82489[2073:14]-82493[2073:18]"
		      },
		      "fields": {
		        "!type": "number",
		        "!span": "82498[2073:23]-82504[2073:29]"
		      },
		      "skip": {
		        "!type": "number",
		        "!span": "82508[2073:33]-82512[2073:37]"
		      },
		      "hint": {
		        "!type": "number",
		        "!span": "82517[2073:42]-82521[2073:46]"
		      },
		      "explain": {
		        "!type": "number",
		        "!span": "82526[2073:51]-82533[2073:58]"
		      },
		      "snapshot": {
		        "!type": "number",
		        "!span": "82538[2073:63]-82546[2073:71]"
		      },
		      "timeout": {
		        "!type": "number",
		        "!span": "82551[2073:76]-82558[2073:83]"
		      },
		      "tailable": {
		        "!type": "number",
		        "!span": "82563[2073:88]-82571[2073:96]"
		      },
		      "tailableRetryInterval": {
		        "!type": "number",
		        "!span": "82576[2073:101]-82597[2073:122]"
		      },
		      "numberOfRetries": {
		        "!type": "number",
		        "!span": "82605[2074:4]-82620[2074:19]"
		      },
		      "awaitdata": {
		        "!type": "number",
		        "!span": "82625[2074:24]-82634[2074:33]"
		      },
		      "awaitData": {
		        "!type": "number",
		        "!span": "82639[2074:38]-82648[2074:47]"
		      },
		      "exhaust": {
		        "!type": "number",
		        "!span": "82653[2074:52]-82660[2074:59]"
		      },
		      "batchSize": {
		        "!type": "number",
		        "!span": "82665[2074:64]-82674[2074:73]"
		      },
		      "returnKey": {
		        "!type": "number",
		        "!span": "82679[2074:78]-82688[2074:87]"
		      },
		      "maxScan": {
		        "!type": "number",
		        "!span": "82693[2074:92]-82700[2074:99]"
		      },
		      "min": {
		        "!type": "number",
		        "!span": "82705[2074:104]-82708[2074:107]"
		      },
		      "max": {
		        "!type": "number",
		        "!span": "82713[2074:112]-82716[2074:115]"
		      },
		      "showDiskLoc": {
		        "!type": "number",
		        "!span": "82721[2074:120]-82732[2074:131]"
		      },
		      "comment": {
		        "!type": "number",
		        "!span": "82740[2075:4]-82747[2075:11]"
		      },
		      "raw": {
		        "!type": "number",
		        "!span": "82752[2075:16]-82755[2075:19]"
		      },
		      "readPreference": {
		        "!type": "number",
		        "!span": "82760[2075:24]-82774[2075:38]"
		      },
		      "partial": {
		        "!type": "number",
		        "!span": "82779[2075:43]-82786[2075:50]"
		      },
		      "read": {
		        "!type": "number",
		        "!span": "82791[2075:55]-82795[2075:59]"
		      },
		      "dbName": {
		        "!type": "number",
		        "!span": "82800[2075:64]-82806[2075:70]"
		      },
		      "oplogReplay": {
		        "!type": "number",
		        "!span": "82811[2075:75]-82822[2075:86]"
		      },
		      "connection": {
		        "!type": "number",
		        "!span": "82827[2075:91]-82837[2075:101]"
		      },
		      "maxTimeMS": {
		        "!type": "number",
		        "!span": "82842[2075:106]-82851[2075:115]"
		      },
		      "transforms": {
		        "!type": "number",
		        "!span": "82856[2075:120]-82866[2075:130]"
		      }
		    },
		    "Server.prototype.connections.!ret": "[?]",
		    "Mongos.prototype.connections.!ret": "[?]",
		    "Mongos.!0": {
		      "readPreference": "string",
		      "s": {
		        "dbName": {
		          "!type": "string",
		          "!span": "3433[89:6]-3439[89:12]"
		        },
		        "slaveOk": {
		          "!type": "bool",
		          "!span": "3637[99:6]-3644[99:13]"
		        },
		        "db": "+Db"
		      },
		      "_id": "number",
		      "skip": "number",
		      "limit": "number",
		      "hint": {
		        "<i>": {
		          "!type": "number",
		          "!span": "3493[138:16]-3498[138:21]"
		        }
		      },
		      "slaveOk": "bool",
		      "cursorFactory": {
		        "INIT": {
		          "!type": "number",
		          "!span": "11233[392:18]-11237[392:22]",
		          "!doc": "Iterates over all the documents for this cursor using the iterator, callback pattern."
		        },
		        "OPEN": {
		          "!type": "number",
		          "!span": "11261[393:18]-11265[393:22]"
		        },
		        "CLOSED": {
		          "!type": "number",
		          "!span": "11289[394:18]-11295[394:24]"
		        },
		        "prototype": {
		          "batchSize": "AggregationCursor.prototype.batchSize",
		          "geoNear": "AggregationCursor.prototype.geoNear",
		          "group": "AggregationCursor.prototype.group",
		          "limit": "AggregationCursor.prototype.limit",
		          "match": "AggregationCursor.prototype.match",
		          "maxTimeMS": "AggregationCursor.prototype.maxTimeMS",
		          "out": "AggregationCursor.prototype.out",
		          "project": "AggregationCursor.prototype.project",
		          "redact": "AggregationCursor.prototype.redact",
		          "skip": "AggregationCursor.prototype.skip",
		          "sort": "AggregationCursor.prototype.sort",
		          "unwind": "AggregationCursor.prototype.unwind"
		        }
		      },
		      "cursor": {
		        "batchSize": {
		          "!type": "number",
		          "!span": "62091[1535:43]-62100[1535:52]"
		        }
		      },
		      "numCursors": "number",
		      "batchSize": "number",
		      "!span": "77657[1934:23]-77727[1938:3]",
		      "db": "+Db"
		    },
		    "Mongos.!ret": "+Mongos",
		    "ReplSet.prototype.connections.!ret": "[?]",
		    "ReplSet.!ret": "+ReplSet",
		    "ReadPreference.prototype.toObject.!ret": {
		      "mode": {
		        "!type": "string",
		        "!span": "2942[82:16]-2946[82:20]"
		      },
		      "!span": "2941[82:15]-2957[82:31]"
		    },
		    "ReadPreference.!ret": "+ReadPreference",
		    "Db.prototype.open.!0": {
		      "!type": "fn(err: +Error, db: +Db)",
		      "!span": "8603[213:71]-12050[298:7]"
		    },
		    "Db.prototype.command.!0": {
		      "createIndexes": {
		        "!type": "string",
		        "!span": "49544[1242:13]-49557[1242:26]"
		      },
		      "indexes": {
		        "!type": "[Db.prototype.command.!0.indexes.<i>]",
		        "!span": "49565[1242:34]-49572[1242:41]",
		        "!doc": "Set up the index"
		      },
		      "!span": "49543[1242:12]-49582[1242:51]",
		      "!doc": "Create command",
		      "writeConcern": "updateDocuments.!3.writeConcern"
		    },
		    "Db.prototype.command.!0.indexes.<i>": {
		      "name": {
		        "!type": "string",
		        "!span": "49032[1226:19]-49036[1226:23]"
		      },
		      "key": {
		        "<i>": {
		          "!type": "number",
		          "!span": "4020[165:14]-4031[165:25]"
		        }
		      },
		      "readPreference": "string",
		      "!span": "49030[1226:17]-49081[1226:68]"
		    },
		    "Db.prototype.command.!1": {
		      "readPreference": {
		        "!type": "string",
		        "!span": "28641[232:22742]-28655[232:22756]"
		      }
		    },
		    "Db.prototype.listCollections.!0": {
		      "$and": "[?]",
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "Db.prototype.listCollections.!0.$and.<i>": {
		      "name": {
		        "!type": "+RegExp",
		        "!span": "19823[479:43]-19827[479:47]"
		      },
		      "!span": "19822[479:42]-19843[479:63]"
		    },
		    "Db.prototype.listCollections.!1": {
		      "cursorFactory": {
		        "INIT": {
		          "!type": "number",
		          "!span": "8150[274:14]-8154[274:18]",
		          "!doc": "Iterates over all the documents for this cursor using the iterator, callback pattern."
		        },
		        "OPEN": {
		          "!type": "number",
		          "!span": "8174[275:14]-8178[275:18]"
		        },
		        "CLOSED": {
		          "!type": "number",
		          "!span": "8198[276:14]-8204[276:20]"
		        },
		        "prototype": {
		          "batchSize": "CommandCursor.prototype.batchSize",
		          "maxTimeMS": "CommandCursor.prototype.maxTimeMS"
		        }
		      },
		      "!span": "19935[485:16]-19994[485:75]",
		      "!doc": "Return options",
		      "transforms": {
		        "doc": "listCollectionsTranforms.!ret.doc"
		      }
		    },
		    "Db.prototype.listCollections.!ret": "+CommandCursor",
		    "Db.prototype.eval.!2": {},
		    "Db.prototype.eval.!3": {
		      "!type": "fn(err: +Error, results: ?) -> bool",
		      "!span": "74725[1859:45]-74880[1862:5]"
		    },
		    "Db.prototype.eval.!3.!1": {
		      "!span": "71147[1759:9]-71173[1759:35]"
		    },
		    "Db.prototype.renameCollection.!2": {
		      "new_collection": {
		        "!type": "bool",
		        "!span": "22795[557:10]-22809[557:24]",
		        "!doc": "Add return new collection"
		      },
		      "!span": "22750[555:65]-22752[555:67]"
		    },
		    "Db.prototype.dropCollection.!1": {
		      "!type": "fn()",
		      "!span": "23280[571:26]-23292[571:38]"
		    },
		    "Db.prototype.executeDbAdminCommand.!1": {
		      "!span": "25972[646:65]-25974[646:67]"
		    },
		    "Db.prototype.authenticate.!2": {
		      "authMechanism": {
		        "!type": "string",
		        "!span": "41657[1025:12]-41670[1025:25]"
		      },
		      "!span": "41564[1021:65]-41566[1021:67]"
		    },
		    "Db.prototype.logout.!0": {
		      "onAll": {
		        "!type": "bool",
		        "!span": "45185[1114:10]-45190[1114:15]"
		      }
		    },
		    "_setNativeParser.!0": {
		      "read_preference_tags": {
		        "!type": "[_setNativeParser.!0.read_preference_tags.<i>]",
		        "!span": "1968[62:19]-1988[62:39]"
		      },
		      "slaveOk": {
		        "!type": "bool",
		        "!span": "4035[115:18]-4042[115:25]"
		      },
		      "fsync": {
		        "!type": "bool",
		        "!span": "5602[160:18]-5607[160:23]"
		      },
		      "j": {
		        "!type": "bool",
		        "!span": "5684[163:18]-5685[163:19]"
		      },
		      "safe": {
		        "!type": "bool",
		        "!span": "5759[166:18]-5763[166:22]"
		      },
		      "native_parser": {
		        "!type": "bool",
		        "!span": "5873[170:18]-5886[170:31]"
		      },
		      "authSource": {
		        "!type": "string",
		        "!span": "6501[185:18]-6511[185:28]"
		      },
		      "gssapiServiceName": {
		        "!type": "string",
		        "!span": "6586[188:18]-6603[188:35]"
		      },
		      "authMechanism": {
		        "!type": "string",
		        "!span": "7666[213:18]-7679[213:31]",
		        "!doc": "Authentication mechanism"
		      },
		      "authMechanismProperties": {
		        "<i>": {
		          "!type": "string",
		          "!span": "7972[222:12]-7976[222:16]"
		        },
		        "!span": "8060[226:18]-8083[226:41]",
		        "!doc": "Set all authMechanismProperties"
		      },
		      "wtimeout": {
		        "!type": "number",
		        "!span": "8277[231:18]-8285[231:26]"
		      },
		      "read_preference": {
		        "!type": "string",
		        "!span": "8526[235:18]-8541[235:33]"
		      },
		      "!span": "1967[62:18]-1993[62:44]"
		    },
		    "_setNativeParser.!0.read_preference_tags.<i>": {
		      "<i>": {
		        "!type": "string",
		        "!span": "9046[251:20]-9054[251:28]"
		      },
		      "!span": "8729[241:24]-8731[241:26]",
		      "!doc": "Contains the tag object"
		    },
		    "_finishConnecting.!1": {
		      "auth": {
		        "user": {
		          "!type": "string",
		          "!span": "7202[201:25]-7206[201:29]"
		        },
		        "!span": "1771[55:30]-1775[55:34]"
		      },
		      "server_options": {
		        "socketOptions": {
		          "connectTimeoutMS": {
		            "!type": "number",
		            "!span": "5990[173:36]-6006[173:52]"
		          },
		          "socketTimeoutMS": {
		            "!type": "number",
		            "!span": "6195[177:36]-6210[177:51]"
		          },
		          "!span": "1929[61:23]-1942[61:36]"
		        },
		        "slave_ok": {
		          "!type": "bool",
		          "!span": "3987[114:22]-3995[114:30]"
		        },
		        "poolSize": {
		          "!type": "number",
		          "!span": "4150[119:22]-4158[119:30]"
		        },
		        "auto_reconnect": {
		          "!type": "bool",
		          "!span": "4338[124:22]-4352[124:36]"
		        },
		        "!span": "2095[65:9]-2109[65:23]",
		        "!doc": "Add server options to final object"
		      },
		      "rs_options": {
		        "socketOptions": {
		          "connectTimeoutMS": {
		            "!type": "number",
		            "!span": "6074[174:44]-6090[174:60]"
		          },
		          "socketTimeoutMS": {
		            "!type": "number",
		            "!span": "6278[178:44]-6293[178:59]"
		          },
		          "!span": "2026[63:31]-2039[63:44]"
		        },
		        "poolSize": {
		          "!type": "number",
		          "!span": "4212[120:30]-4220[120:38]"
		        },
		        "rs_name": {
		          "!type": "string",
		          "!span": "5186[147:30]-5193[147:37]"
		        },
		        "reconnectWait": {
		          "!type": "number",
		          "!span": "5276[150:30]-5289[150:43]"
		        },
		        "retries": {
		          "!type": "number",
		          "!span": "5380[153:30]-5387[153:37]"
		        },
		        "read_secondary": {
		          "!type": "bool",
		          "!span": "5513[157:30]-5527[157:44]"
		        },
		        "!span": "2169[67:9]-2179[67:19]"
		      },
		      "dbName": {
		        "!type": "string",
		        "!span": "3538[103:9]-3544[103:15]",
		        "!doc": "Get the db name"
		      },
		      "servers": {
		        "!type": "[_finishConnecting.!1.servers.<i>]",
		        "!span": "9817[277:9]-9824[277:16]",
		        "!doc": "Add servers to result"
		      },
		      "!span": "1423[42:15]-1425[42:17]",
		      "!doc": "Result object",
		      "db_options": "_setNativeParser.!0"
		    },
		    "_finishConnecting.!1.servers.<i>": {
		      "host": {
		        "!type": "string",
		        "!span": "3468[98:14]-3472[98:18]"
		      },
		      "port": {
		        "!type": "number",
		        "!span": "3481[98:27]-3485[98:31]"
		      },
		      "!span": "3467[98:13]-3493[98:39]"
		    },
		    "Admin.prototype.addUser.!2": {
		      "dbName": {
		        "!type": "string",
		        "!span": "6255[197:10]-6261[197:16]"
		      }
		    },
		    "Admin.prototype.removeUser.!1": {
		      "dbName": {
		        "!type": "string",
		        "!span": "7136[221:10]-7142[221:16]"
		      }
		    },
		    "Admin.!ret": "+Admin",
		    "formattedOrderClause.!0": "[number]",
		    "handleCallback.!3": {
		      "!span": "78717[1967:16]-78719[1967:18]",
		      "!doc": "Create statistics value"
		    },
		    "AggregationCursor.prototype.batchSize.!ret": "+AggregationCursor",
		    "normalizeHintField.!ret": {
		      "<i>": {
		        "!type": "number",
		        "!span": "3493[138:16]-3498[138:21]"
		      },
		      "!span": "3586[141:16]-3588[141:18]"
		    },
		    "decorateCommand.!0": {
		      "near": {
		        "!type": "[number]",
		        "!span": "69910[1711:4]-69914[1711:8]"
		      },
		      "readPreference": "string",
		      "_id": "number",
		      "skip": "number",
		      "limit": "number",
		      "slaveOk": "bool",
		      "numCursors": "number",
		      "batchSize": "number",
		      "!span": "69876[1709:22]-69926[1712:3]",
		      "!doc": "Build command object",
		      "s": "Collection.s",
		      "hint": "Collection.hint",
		      "db": "+Db",
		      "cursorFactory": "AggregationCursor",
		      "cursor": "Collection.cursor"
		    },
		    "decorateCommand.!1": "+Collection",
		    "decorateCommand.!2": {
		      "readPreference": {
		        "!type": "bool",
		        "!span": "68108[1670:4]-68122[1670:18]"
		      },
		      "geoNear": {
		        "!type": "bool",
		        "!span": "68135[1671:4]-68142[1671:11]"
		      },
		      "near": {
		        "!type": "bool",
		        "!span": "68154[1672:4]-68158[1672:8]"
		      },
		      "!span": "68102[1669:16]-68170[1673:3]",
		      "!doc": "Exclude readPreference and existing options to prevent user from shooting themselves in the foot"
		    },
		    "Cursor.prototype.nextObject.!0": {
		      "!type": "fn(err: +Error, result: ?)",
		      "!span": "22623[731:18]-23126[749:3]"
		    },
		    "Cursor.prototype.count.!1": {
		      "!span": "19625[619:13]-19627[619:15]"
		    },
		    "Cursor.!3": {
		      "limit": {
		        "!type": "number",
		        "!span": "82479[2073:4]-82484[2073:9]"
		      },
		      "sort": {
		        "!type": "number",
		        "!span": "82489[2073:14]-82493[2073:18]"
		      },
		      "fields": {
		        "!type": "number",
		        "!span": "82498[2073:23]-82504[2073:29]"
		      },
		      "skip": {
		        "!type": "number",
		        "!span": "82508[2073:33]-82512[2073:37]"
		      },
		      "hint": {
		        "!type": "number",
		        "!span": "82517[2073:42]-82521[2073:46]"
		      },
		      "explain": {
		        "!type": "number",
		        "!span": "82526[2073:51]-82533[2073:58]"
		      },
		      "snapshot": {
		        "!type": "number",
		        "!span": "82538[2073:63]-82546[2073:71]"
		      },
		      "timeout": {
		        "!type": "number",
		        "!span": "82551[2073:76]-82558[2073:83]"
		      },
		      "tailable": {
		        "!type": "number",
		        "!span": "82563[2073:88]-82571[2073:96]"
		      },
		      "tailableRetryInterval": {
		        "!type": "number",
		        "!span": "82576[2073:101]-82597[2073:122]"
		      },
		      "numberOfRetries": {
		        "!type": "number",
		        "!span": "82605[2074:4]-82620[2074:19]"
		      },
		      "awaitdata": {
		        "!type": "number",
		        "!span": "82625[2074:24]-82634[2074:33]"
		      },
		      "awaitData": {
		        "!type": "number",
		        "!span": "82639[2074:38]-82648[2074:47]"
		      },
		      "exhaust": {
		        "!type": "number",
		        "!span": "82653[2074:52]-82660[2074:59]"
		      },
		      "batchSize": {
		        "!type": "number",
		        "!span": "82665[2074:64]-82674[2074:73]"
		      },
		      "returnKey": {
		        "!type": "number",
		        "!span": "82679[2074:78]-82688[2074:87]"
		      },
		      "maxScan": {
		        "!type": "number",
		        "!span": "82693[2074:92]-82700[2074:99]"
		      },
		      "min": {
		        "!type": "number",
		        "!span": "82705[2074:104]-82708[2074:107]"
		      },
		      "max": {
		        "!type": "number",
		        "!span": "82713[2074:112]-82716[2074:115]"
		      },
		      "showDiskLoc": {
		        "!type": "number",
		        "!span": "82721[2074:120]-82732[2074:131]"
		      },
		      "comment": {
		        "!type": "number",
		        "!span": "82740[2075:4]-82747[2075:11]"
		      },
		      "raw": {
		        "!type": "number",
		        "!span": "82752[2075:16]-82755[2075:19]"
		      },
		      "readPreference": {
		        "!type": "number",
		        "!span": "82760[2075:24]-82774[2075:38]"
		      },
		      "partial": {
		        "!type": "number",
		        "!span": "82779[2075:43]-82786[2075:50]"
		      },
		      "read": {
		        "!type": "number",
		        "!span": "82791[2075:55]-82795[2075:59]"
		      },
		      "dbName": {
		        "!type": "number",
		        "!span": "82800[2075:64]-82806[2075:70]"
		      },
		      "oplogReplay": {
		        "!type": "number",
		        "!span": "82811[2075:75]-82822[2075:86]"
		      },
		      "connection": {
		        "!type": "number",
		        "!span": "82827[2075:91]-82837[2075:101]"
		      },
		      "maxTimeMS": {
		        "!type": "number",
		        "!span": "82842[2075:106]-82851[2075:115]"
		      },
		      "transforms": {
		        "!type": "number",
		        "!span": "82856[2075:120]-82866[2075:130]"
		      }
		    },
		    "Collection.prototype.updateOne.!2": {
		      "multi": {
		        "!type": "bool",
		        "!span": "20285[232:14386]-20290[232:14391]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "Collection.prototype.replaceOne.!1": {
		      "$set": {
		        "user": {
		          "!type": "string",
		          "!span": "37894[919:53]-37898[919:57]"
		        }
		      }
		    },
		    "Collection.prototype.replaceOne.!2": {
		      "multi": {
		        "!type": "bool",
		        "!span": "21660[232:15761]-21665[232:15766]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "Collection.prototype.updateMany.!2": {
		      "multi": {
		        "!type": "bool",
		        "!span": "23048[232:17149]-23053[232:17154]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "Collection.prototype.update.!3": {
		      "!type": "fn(err: +Error|string, results: ?, full: ?) -> bool",
		      "!span": "37945[919:104]-38241[923:11]"
		    },
		    "Collection.prototype.deleteOne.!1": {
		      "single": {
		        "!type": "bool",
		        "!span": "26709[232:20810]-26715[232:20816]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "Collection.prototype.deleteMany.!1": {
		      "single": {
		        "!type": "bool",
		        "!span": "27633[232:21734]-27639[232:21740]"
		      }
		    },
		    "Collection.prototype.remove.!2": {
		      "!type": "fn(err: ?, result: ?)",
		      "!span": "40786[997:58]-40866[999:9]"
		    },
		    "Collection.prototype.options.!0": {
		      "!type": "fn(err: +Error, document: ?) -> bool",
		      "!span": "36859[928:15]-37003[931:3]"
		    },
		    "Collection.prototype.createIndexes.!0": "[?]",
		    "Collection.prototype.listIndexes.!0": {
		      "!span": "116[5:13]-118[5:15]",
		      "cursorFactory": "CommandCursor"
		    },
		    "Collection.prototype.indexInformation.!1": {
		      "!type": "fn(err: ?, indexInformation: ?) -> bool",
		      "!span": "45698[1131:24]-46257[1145:3]"
		    },
		    "Collection.prototype.findAndModify.!3": {
		      "checkKeys": {
		        "!type": "bool",
		        "!span": "57500[1433:10]-57509[1433:19]"
		      }
		    },
		    "Collection.prototype.findAndRemove.!1": "[?]",
		    "Collection.prototype.findAndRemove.!2": {
		      "remove": {
		        "!type": "bool",
		        "!span": "58643[1462:10]-58651[1462:18]"
		      }
		    },
		    "insertDocuments.!1": {
		      "!type": "[insertDocuments.!1.<i>]",
		      "!doc": "Ensure we are operating on an array op docs"
		    },
		    "insertDocuments.!1.<i>": {},
		    "updateDocuments.!1": {
		      "user": {
		        "!type": "string",
		        "!span": "37870[919:29]-37874[919:33]"
		      },
		      "!span": "37869[919:28]-37885[919:44]"
		    },
		    "updateDocuments.!2": {
		      "$set": {
		        "user": {
		          "!type": "string",
		          "!span": "37894[919:53]-37898[919:57]"
		        },
		        "!span": "37887[919:46]-37891[919:50]"
		      },
		      "!span": "37886[919:45]-37929[919:88]"
		    },
		    "updateDocuments.!3": {
		      "writeConcern": {
		        "!span": "81574[1352:29381]-81586[1352:29393]"
		      },
		      "upsert": {
		        "!type": "bool",
		        "!span": "30693[791:17]-30699[791:23]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "removeDocuments.!2": {
		      "single": {
		        "!type": "bool",
		        "!span": "27633[232:21734]-27639[232:21740]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "processScope.!0": {
		      "!span": "75157[1879:18]-75159[1879:20]"
		    },
		    "writeConcern.!0": {
		      "!span": "116[5:13]-118[5:15]",
		      "writeConcern": "updateDocuments.!3.writeConcern"
		    },
		    "writeConcern.!2": {
		      "readPreference": {
		        "!type": "string",
		        "!span": "28641[232:22742]-28655[232:22756]"
		      },
		      "!span": "116[5:13]-118[5:15]"
		    },
		    "loop.!0": "+Cursor",
		    "loop.!1": {
		      "!type": "fn(err: +Error, doc: ?) -> bool",
		      "!span": "15643[507:12]-15915[516:3]"
		    },
		    "parseIndexOptions.!ret": {
		      "name": {
		        "!type": "string",
		        "!span": "4951[197:4]-4955[197:8]"
		      },
		      "keys": {
		        "!type": "[string]",
		        "!span": "4976[197:29]-4980[197:33]"
		      },
		      "fieldHash": {
		        "<i>": {
		          "!type": "number",
		          "!span": "4020[165:14]-4031[165:25]"
		        },
		        "!span": "4988[197:41]-4997[197:50]"
		      },
		      "!span": "4945[196:9]-5012[198:3]"
		    },
		    "debugOptions.!ret": {
		      "!span": "5192[206:21]-5194[206:23]"
		    },
		    "listCollectionsTranforms.!ret": {
		      "doc": {
		        "!type": "fn(doc: ?) -> !0",
		        "!span": "17822[424:4]-17825[424:7]"
		      },
		      "!span": "17816[423:9]-18064[433:3]",
		      "!doc": "Filter out the correct field values"
		    },
		    "createCreateIndexCommand.!ret": {
		      "ns": {
		        "!type": "string",
		        "!span": "47863[1192:4]-47867[1192:8]"
		      },
		      "name": {
		        "!type": "string",
		        "!span": "47917[1192:58]-47923[1192:64]"
		      },
		      "!span": "47857[1191:17]-47938[1193:3]",
		      "key": "parseIndexOptions.!ret.fieldHash"
		    },
		    "createIndexUsingCreateIndexes.!4": {
		      "!type": "fn(err: +Error, result: string) -> bool",
		      "!span": "28797[701:66]-29540[715:3]"
		    },
		    "createListener.!ret": {
		      "!type": "fn(err: ?)",
		      "!span": "51201[1286:17]-51282[1290:3]"
		    },
		    "Store.!1": {
		      "force": {
		        "!type": "bool",
		        "!span": "3463[67:6]-3468[67:11]"
		      },
		      "bufferMaxEntries": {
		        "!type": "number",
		        "!span": "3482[68:6]-3498[68:22]",
		        "!doc": "Update bufferMaxEntries"
		      }
		    },
		    "Db.!2": {
		      "parentDb": "+Db"
		    },
		    "Collection.prototype.insert.!0": {
		      "<i>": "insertDocuments.!1.<i>"
		    }
		  },
		  "Server": {
		    "prototype": {
		      "parserType": {
		        "!type": "fn()",
		        "!span": "7321[197:17]-7331[197:27]"
		      },
		      "connect": {
		        "!type": "fn(db: ?, _options: ?, callback: ?)",
		        "!span": "7415[202:17]-7422[202:24]",
		        "!doc": "Connect"
		      },
		      "capabilities": {
		        "!type": "fn() -> !this.s.sCapabilities",
		        "!span": "9975[297:17]-9987[297:29]",
		        "!doc": "Server capabilities"
		      },
		      "command": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?, callback: ?)",
		        "!span": "10200[304:17]-10207[304:24]",
		        "!doc": "Command"
		      },
		      "insert": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10332[309:17]-10338[309:23]",
		        "!doc": "Insert"
		      },
		      "update": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10462[314:17]-10468[314:23]",
		        "!doc": "Update"
		      },
		      "remove": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10592[319:17]-10598[319:23]",
		        "!doc": "Remove"
		      },
		      "isConnected": {
		        "!type": "fn()",
		        "!span": "10727[324:17]-10738[324:28]",
		        "!doc": "IsConnected"
		      },
		      "cursor": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?)",
		        "!span": "10822[329:17]-10828[329:23]",
		        "!doc": "Insert"
		      },
		      "setBSONParserType": {
		        "!type": "fn(type: ?)",
		        "!span": "10973[334:17]-10990[334:34]"
		      },
		      "lastIsMaster": {
		        "!type": "fn()",
		        "!span": "11078[338:17]-11090[338:29]"
		      },
		      "close": {
		        "!type": "fn(forceClosed: ?)",
		        "!span": "11165[342:17]-11170[342:22]"
		      },
		      "auth": {
		        "!type": "fn()",
		        "!span": "11393[351:17]-11397[351:21]"
		      },
		      "connections": {
		        "!type": "fn() -> [?]",
		        "!span": "11598[361:17]-11609[361:28]",
		        "!doc": "All raw connections @method @return {array}"
		      }
		    },
		    "!type": "fn(host: string, port?: ?|number, options?: ?|number) -> +Server",
		    "!span": "55[3:4]-61[3:10]",
		    "!doc": "Creates a new Server instance @class @deprecated @param {string} host The host for the server, can be either an IP4, IP6 or domain socket style host.",
		    "connectTimeoutMS": {
		      "!type": "number",
		      "!span": "4463[117:29]-4479[118:8]"
		    },
		    "s": {
		      "sCapabilities": {
		        "!type": "+ServerCapabilities",
		        "!span": "6076[142:6]-6089[142:19]"
		      },
		      "clonedOptions": {
		        "poolSize": "number",
		        "socketOptions": {
		          "connectTimeoutMS": {
		            "!type": "number",
		            "!span": "7125[180:10]-7141[180:26]",
		            "!doc": "Set socketTimeout to the same as the connectTimeoutMS or 30 sec"
		          },
		          "socketTimeoutMS": {
		            "!type": "number",
		            "!span": "7201[181:10]-7216[181:25]",
		            "!doc": "Reset the socket timeout"
		          },
		          "!span": "7113[179:23]-7273[182:7]"
		        },
		        "auto_reconnect": "bool",
		        "host": {
		          "!type": "string",
		          "!span": "3934[86:16]-3938[86:20]"
		        },
		        "connectionTimeout": {
		          "!type": "number",
		          "!span": "4542[99:20]-4559[99:37]"
		        },
		        "socketTimeout": {
		          "!type": "number",
		          "!span": "4677[103:20]-4690[103:33]"
		        },
		        "keepAlive": {
		          "!type": "bool",
		          "!span": "4897[108:20]-4906[108:29]"
		        },
		        "reconnect": {
		          "!type": "bool",
		          "!span": "5147[118:16]-5156[118:25]"
		        },
		        "emitError": {
		          "!type": "bool",
		          "!span": "5186[119:16]-5195[119:25]"
		        },
		        "size": {
		          "!type": "number",
		          "!span": "5225[120:16]-5229[120:20]"
		        },
		        "!span": "6124[144:6]-6137[144:19]",
		        "cursorFactory": "Cursor",
		        "disconnectHandler": "+Store"
		      },
		      "reconnect": {
		        "!type": "bool",
		        "!span": "6176[146:6]-6185[146:15]"
		      },
		      "emitError": {
		        "!type": "bool",
		        "!span": "6221[148:6]-6230[148:15]"
		      },
		      "poolSize": {
		        "!type": "number",
		        "!span": "6265[150:6]-6273[150:14]"
		      },
		      "store": {
		        "!type": "+Store",
		        "!span": "6357[154:6]-6362[154:11]"
		      },
		      "host": {
		        "!type": "string",
		        "!span": "6388[156:6]-6392[156:10]"
		      },
		      "!span": "5951[138:7]-5952[138:8]",
		      "!doc": "Define the internal properties",
		      "storeOptions": "Store.s.storeOptions"
		    },
		    "autoReconnect": {
		      "!type": "bool",
		      "!span": "6961[182:30]-6976[182:45]"
		    },
		    "host": {
		      "!type": "string",
		      "!span": "7083[186:30]-7089[186:36]"
		    },
		    "emitOpen": {
		      "!type": "bool",
		      "!span": "11882[294:23]-11890[294:31]"
		    },
		    "socketTimeoutMS": {
		      "!type": "number",
		      "!span": "13724[342:15]-13739[342:30]"
		    }
		  },
		  "Mongos": {
		    "prototype": {
		      "connect": {
		        "!type": "fn(db: ?, _options: ?, callback: ?)",
		        "!span": "7382[208:17]-7389[208:24]",
		        "!doc": "Connect"
		      },
		      "parserType": {
		        "!type": "fn()",
		        "!span": "9888[300:17]-9898[300:27]"
		      },
		      "capabilities": {
		        "!type": "fn() -> !this.s.sCapabilities",
		        "!span": "9994[305:17]-10006[305:29]",
		        "!doc": "Server capabilities"
		      },
		      "command": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?, callback: ?)",
		        "!span": "10219[312:17]-10226[312:24]",
		        "!doc": "Command"
		      },
		      "insert": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10351[317:17]-10357[317:23]",
		        "!doc": "Insert"
		      },
		      "update": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10512[324:17]-10518[324:23]",
		        "!doc": "Update"
		      },
		      "remove": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "10642[329:17]-10648[329:23]",
		        "!doc": "Remove"
		      },
		      "isConnected": {
		        "!type": "fn()",
		        "!span": "10777[334:17]-10788[334:28]",
		        "!doc": "IsConnected"
		      },
		      "cursor": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?)",
		        "!span": "10872[339:17]-10878[339:23]",
		        "!doc": "Insert"
		      },
		      "setBSONParserType": {
		        "!type": "fn(type: ?)",
		        "!span": "11023[344:17]-11040[344:34]"
		      },
		      "lastIsMaster": {
		        "!type": "fn()",
		        "!span": "11130[348:17]-11142[348:29]"
		      },
		      "close": {
		        "!type": "fn(forceClosed: ?)",
		        "!span": "11217[352:17]-11222[352:22]"
		      },
		      "auth": {
		        "!type": "fn()",
		        "!span": "11445[361:17]-11449[361:21]"
		      },
		      "connections": {
		        "!type": "fn() -> [?]",
		        "!span": "11650[371:17]-11661[371:28]",
		        "!doc": "All raw connections @method @return {array}"
		      }
		    },
		    "!type": "fn(servers: ?, options?: ?) -> +Mongos",
		    "!span": "88[4:4]-94[4:10]",
		    "!doc": "Creates a new Mongos instance @class @deprecated @param {Server[]} servers A seedlist of servers participating in the replicaset.",
		    "connectTimeoutMS": {
		      "!type": "number",
		      "!span": "4597[120:50]-4613[121:7]"
		    },
		    "s": {
		      "debug": {
		        "!type": "bool",
		        "!span": "6472[168:6]-6477[168:11]"
		      },
		      "storeOptions": {
		        "force": {
		          "!type": "bool",
		          "!span": "3670[78:6]-3675[78:11]"
		        },
		        "bufferMaxEntries": {
		          "!type": "number",
		          "!span": "3689[79:6]-3705[79:22]",
		          "!doc": "Update bufferMaxEntries"
		        },
		        "!span": "6520[170:6]-6532[170:18]",
		        "!doc": "Store option defaults"
		      },
		      "clonedOptions": {
		        "size": {
		          "!type": "number",
		          "!span": "4108[100:15]-4112[100:19]"
		        },
		        "reconnect": {
		          "!type": "bool",
		          "!span": "4192[101:15]-4201[101:24]"
		        },
		        "emitError": {
		          "!type": "bool",
		          "!span": "4295[102:15]-4304[102:24]"
		        },
		        "debug": {
		          "!type": "bool",
		          "!span": "5005[121:17]-5010[121:22]"
		        },
		        "keepAlive": {
		          "!type": "bool",
		          "!span": "5154[126:17]-5163[126:26]"
		        },
		        "!span": "6575[172:6]-6588[172:19]",
		        "cursorFactory": "Cursor",
		        "disconnectHandler": "+Store"
		      },
		      "!span": "6329[162:7]-6330[162:8]",
		      "!doc": "Internal state",
		      "sCapabilities": "+ServerCapabilities",
		      "store": "+Store"
		    },
		    "emitOpen": {
		      "!type": "bool",
		      "!span": "11882[294:23]-11890[294:31]"
		    },
		    "socketTimeoutMS": {
		      "!type": "number",
		      "!span": "13724[342:15]-13739[342:30]"
		    }
		  },
		  "ReplSet": {
		    "prototype": {
		      "parserType": {
		        "!type": "fn()",
		        "!span": "9132[254:18]-9142[254:28]"
		      },
		      "connect": {
		        "!type": "fn(db: ?, _options: ?, callback: ?)",
		        "!span": "9235[259:18]-9242[259:25]",
		        "!doc": "Connect method"
		      },
		      "capabilities": {
		        "!type": "fn() -> !this.s.sCapabilities",
		        "!span": "12343[372:18]-12355[372:30]",
		        "!doc": "Server capabilities"
		      },
		      "command": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?, callback: ?)",
		        "!span": "12570[379:18]-12577[379:25]",
		        "!doc": "Command"
		      },
		      "insert": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "12750[385:18]-12756[385:24]",
		        "!doc": "Insert"
		      },
		      "update": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "12882[390:18]-12888[390:24]",
		        "!doc": "Update"
		      },
		      "remove": {
		        "!type": "fn(ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "13014[395:18]-13020[395:24]",
		        "!doc": "Remove"
		      },
		      "isConnected": {
		        "!type": "fn()",
		        "!span": "13151[400:18]-13162[400:29]",
		        "!doc": "IsConnected"
		      },
		      "setBSONParserType": {
		        "!type": "fn(type: ?)",
		        "!span": "13238[404:18]-13255[404:35]"
		      },
		      "cursor": {
		        "!type": "fn(ns: ?, cmd: ?, options: ?)",
		        "!span": "13357[409:18]-13363[409:24]",
		        "!doc": "Insert"
		      },
		      "lastIsMaster": {
		        "!type": "fn()",
		        "!span": "13556[415:18]-13568[415:30]"
		      },
		      "close": {
		        "!type": "fn(forceClosed: ?)",
		        "!span": "13645[419:18]-13650[419:23]"
		      },
		      "auth": {
		        "!type": "fn()",
		        "!span": "14036[434:18]-14040[434:22]"
		      },
		      "connections": {
		        "!type": "fn() -> [?]",
		        "!span": "14244[444:18]-14255[444:29]",
		        "!doc": "All raw connections @method @return {array}"
		      }
		    },
		    "!type": "fn(servers: ?, options?: ?) -> +ReplSet",
		    "!span": "121[5:4]-128[5:11]",
		    "!doc": "Creates a new ReplSet instance @class @deprecated @param {Server[]} servers A seedlist of servers participating in the replicaset.",
		    "connectTimeoutMS": {
		      "!type": "number",
		      "!span": "5251[134:84]-5267[134:100]"
		    },
		    "s": {
		      "storeOptions": {
		        "force": {
		          "!type": "bool",
		          "!span": "4324[86:6]-4329[86:11]"
		        },
		        "bufferMaxEntries": {
		          "!type": "number",
		          "!span": "4343[87:6]-4359[87:22]",
		          "!doc": "Update bufferMaxEntries"
		        },
		        "!span": "7894[203:6]-7906[203:18]",
		        "!doc": "Store option defaults"
		      },
		      "clonedOptions": {
		        "size": {
		          "!type": "number",
		          "!span": "4764[108:15]-4768[108:19]"
		        },
		        "reconnect": {
		          "!type": "bool",
		          "!span": "4846[109:15]-4855[109:24]"
		        },
		        "emitError": {
		          "!type": "bool",
		          "!span": "4949[110:15]-4958[110:24]"
		        },
		        "debug": {
		          "!type": "bool",
		          "!span": "5807[137:17]-5812[137:22]"
		        },
		        "keepAlive": {
		          "!type": "bool",
		          "!span": "5956[142:17]-5965[142:26]"
		        },
		        "secondaryOnlyConnectionAllowed": {
		          "!type": "bool",
		          "!span": "6869[168:17]-6899[168:47]"
		        },
		        "!span": "7949[205:6]-7962[205:19]",
		        "cursorFactory": "Cursor",
		        "disconnectHandler": "+Store"
		      },
		      "!span": "7729[195:7]-7730[195:8]",
		      "!doc": "Internal state",
		      "sCapabilities": "+ServerCapabilities",
		      "store": "+Store"
		    },
		    "emitOpen": {
		      "!type": "bool",
		      "!span": "11882[294:23]-11890[294:31]"
		    },
		    "socketTimeoutMS": {
		      "!type": "number",
		      "!span": "13724[342:15]-13739[342:30]"
		    }
		  },
		  "ReadPreference": {
		    "prototype": {
		      "isValid": {
		        "!type": "fn(mode: string) -> bool",
		        "!span": "2730[73:25]-2737[73:32]",
		        "!doc": "Validate if a mode is legal * @method @param {string} mode The string representing the read preference mode."
		      },
		      "toObject": {
		        "!type": "fn() -> ReadPreference.prototype.toObject.!ret",
		        "!span": "2902[81:25]-2910[81:33]",
		        "!doc": "@ignore"
		      }
		    },
		    "isValid": {
		      "!type": "fn(_mode: string) -> bool",
		      "!span": "2252[59:15]-2259[59:22]",
		      "!doc": "Validate if a mode is legal * @method @param {string} mode The string representing the read preference mode."
		    },
		    "PRIMARY": {
		      "!type": "string",
		      "!span": "3077[94:15]-3084[94:22]",
		      "!doc": "@ignore"
		    },
		    "PRIMARY_PREFERRED": {
		      "!type": "string",
		      "!span": "3113[95:15]-3130[95:32]"
		    },
		    "SECONDARY": {
		      "!type": "string",
		      "!span": "3168[96:15]-3177[96:24]"
		    },
		    "SECONDARY_PREFERRED": {
		      "!type": "string",
		      "!span": "3208[97:15]-3227[97:34]"
		    },
		    "NEAREST": {
		      "!type": "string",
		      "!span": "3267[98:15]-3274[98:22]"
		    },
		    "!type": "fn(mode: string, tags: ?) -> +ReadPreference",
		    "!span": "156[6:4]-170[6:18]",
		    "!doc": "Creates a new ReadPreference instance * Read Preferences - **ReadPreference.PRIMARY**, Read from primary only.",
		    "_type": {
		      "!type": "string",
		      "!span": "2018[47:7]-2023[47:12]"
		    },
		    "mode": {
		      "!type": "string",
		      "!span": "2051[48:7]-2055[48:11]"
		    }
		  },
		  "Db": {
		    "prototype": {
		      "open": {
		        "!type": "fn(callback: fn(err: ?, db: +Db))",
		        "!span": "7710[187:13]-7714[187:17]",
		        "!doc": "Open the database @method @param {Db~openCallback} callback Callback @return {null}"
		      },
		      "command": {
		        "!type": "fn(command: Db.prototype.command.!0, options?: ?, callback: ?|fn(err: +Error, result: ?) -> bool)",
		        "!span": "8876[220:13]-8883[220:20]",
		        "!doc": "Execute a command @method @param {object} command The command hash @param {object} [options=null] Optional settings."
		      },
		      "close": {
		        "!type": "fn(force: bool, callback: bool)",
		        "!span": "10561[264:13]-10566[264:18]",
		        "!doc": "Close the db and it's underlying connections @method @param {boolean} force Force close, emitting no events @param {Db~noResultCallback} callback The result callback @return {null}"
		      },
		      "admin": {
		        "!type": "fn() -> +Admin",
		        "!span": "11026[278:13]-11031[278:18]",
		        "!doc": "Return the Admin db instance @method @return {Admin} return the new Admin db instance"
		      },
		      "collection": {
		        "!type": "fn(name: string|+Db, options: ?, callback: ?) -> +Collection",
		        "!span": "12750[307:13]-12760[307:23]",
		        "!doc": "Fetch a specific collection (containing the actual collection information)."
		      },
		      "createCollection": {
		        "!type": "fn(name: string, options?: ?, callback: ?)",
		        "!span": "15509[362:13]-15525[362:29]",
		        "!doc": "Creates a collection on a server pre-allocating space, need to create f.ex capped collections."
		      },
		      "stats": {
		        "!type": "fn(options?: ?, callback: ?)",
		        "!span": "17274[408:13]-17279[408:18]",
		        "!doc": "Get all the db statistics."
		      },
		      "listCollections": {
		        "!type": "fn(filter: ?, options?: ?) -> ?|+CommandCursor",
		        "!span": "18441[445:13]-18456[445:28]",
		        "!doc": "Get the list of all collection information for the specified db."
		      },
		      "eval": {
		        "!type": "fn(code: ?, parameters: ?|[?], options?: ?, callback: fn(err: +Error, results: ?) -> bool)",
		        "!span": "20739[505:13]-20743[505:17]",
		        "!doc": "Evaluate JavaScript on the server * @method @param {Code} code JavaScript to execute on server."
		      },
		      "renameCollection": {
		        "!type": "fn(fromCollection: string, toCollection: string, options?: Db.prototype.renameCollection.!2, callback: Db.prototype.renameCollection.!2)",
		        "!span": "22606[554:13]-22622[554:29]",
		        "!doc": "Rename a collection."
		      },
		      "dropCollection": {
		        "!type": "fn(name: string, callback: fn())",
		        "!span": "23210[570:13]-23224[570:27]",
		        "!doc": "Drop a collection from the database, removing it permanently."
		      },
		      "dropDatabase": {
		        "!type": "fn(callback: ?)",
		        "!span": "23729[591:13]-23741[591:25]",
		        "!doc": "Drop a database."
		      },
		      "collections": {
		        "!type": "fn(callback: ?)",
		        "!span": "24602[618:13]-24613[618:24]",
		        "!doc": "Fetch all collections for the current db."
		      },
		      "executeDbAdminCommand": {
		        "!type": "fn(selector: ?, options?: Db.prototype.executeDbAdminCommand.!1, callback: Db.prototype.executeDbAdminCommand.!1)",
		        "!span": "25843[645:13]-25864[645:34]",
		        "!doc": "Runs a command on the database as admin."
		      },
		      "createIndex": {
		        "!type": "fn(name: string, fieldOrSpec: string|?, options?: ?, callback: string|+Db)",
		        "!span": "27923[679:13]-27934[679:24]",
		        "!doc": "Creates an index on the db and collection collection."
		      },
		      "ensureIndex": {
		        "!type": "fn(name: string, fieldOrSpec: string|?, options?: ?, callback: ?)",
		        "!span": "31196[740:13]-31207[740:24]",
		        "!doc": "Ensures that an index exists, if it does not it creates it @method @deprecated since version 2.0 @param {string} name The index name @param {(string|object)} fieldOrSpec Defines the index."
		      },
		      "db": {
		        "!type": "fn(dbName: ?) -> +Db",
		        "!span": "32331[771:13]-32333[771:15]",
		        "!doc": "Create a new Db instance sharing the current socket connections."
		      },
		      "addUser": {
		        "!type": "fn(username: string, password: string, options?: ?, callback: ?)",
		        "!span": "36251[883:13]-36258[883:20]",
		        "!doc": "Add a user to the database."
		      },
		      "removeUser": {
		        "!type": "fn(username: string, options?: ?, callback: ?)",
		        "!span": "39909[977:13]-39919[977:23]",
		        "!doc": "Remove a user from a database @method @param {string} username The username."
		      },
		      "authenticate": {
		        "!type": "fn(username: string, password?: string, options?: Db.prototype.authenticate.!2, callback: Db.prototype.authenticate.!2) -> bool",
		        "!span": "41434[1020:13]-41446[1020:25]",
		        "!doc": "Authenticate a user against the server."
		      },
		      "logout": {
		        "!type": "fn(options?: ?, callback: fn(err: +Error, doc: bool)|?)",
		        "!span": "44893[1105:13]-44899[1105:19]",
		        "!doc": "Logout user from server, fire off on all connections and remove all auth info @method @param {object} [options=null] Optional settings."
		      },
		      "indexInformation": {
		        "!type": "fn(name: string, options?: ?, callback: ?)",
		        "!span": "46303[1143:13]-46319[1143:29]",
		        "!doc": "Retrieves this collections index info."
		      }
		    },
		    "SYSTEM_INDEX_COLLECTION": {
		      "!type": "string",
		      "!span": "51956[1345:3]-51979[1345:26]"
		    },
		    "SYSTEM_PROFILE_COLLECTION": {
		      "!type": "string",
		      "!span": "52003[1346:3]-52028[1346:28]"
		    },
		    "SYSTEM_USER_COLLECTION": {
		      "!type": "string",
		      "!span": "52052[1347:3]-52074[1347:25]"
		    },
		    "SYSTEM_COMMAND_COLLECTION": {
		      "!type": "string",
		      "!span": "52096[1348:3]-52121[1348:28]"
		    },
		    "SYSTEM_JS_COLLECTION": {
		      "!type": "string",
		      "!span": "52135[1349:3]-52155[1349:23]"
		    },
		    "!type": "fn(databaseName: string, topology: ?, options?: ?|Db.options) -> +Db",
		    "!span": "206[7:4]-208[7:6]",
		    "!doc": "Creates a new Db instance @class @param {string} databaseName The name of the database this instance represents.",
		    "s": {
		      "databaseName": {
		        "!type": "string",
		        "!span": "4430[86:6]-4442[86:18]",
		        "!doc": "Database name"
		      },
		      "bufferMaxEntries": {
		        "!type": "number",
		        "!span": "4837[100:6]-4853[100:22]"
		      },
		      "nativeParser": {
		        "!type": "bool",
		        "!span": "5142[106:6]-5154[106:18]"
		      },
		      "!span": "4397[84:7]-4398[84:8]",
		      "options": {
		        "parentDb": "+Db"
		      },
		      "parentDb": "+Db"
		    },
		    "options": {
		      "!span": "5793[127:30]-5802[127:39]",
		      "!doc": "Last ismaster",
		      "parentDb": "+Db"
		    },
		    "native_parser": {
		      "!type": "bool",
		      "!span": "5930[133:30]-5945[133:45]",
		      "!doc": "Last ismaster"
		    },
		    "slaveOk": {
		      "!type": "bool",
		      "!span": "6096[139:30]-6105[139:39]",
		      "!doc": "Last ismaster"
		    },
		    "writeConcern": {
		      "w": {
		        "!type": "number",
		        "!span": "6521[154:39]-6522[154:40]"
		      },
		      "!span": "6401[150:30]-6415[150:44]"
		    }
		  },
		  "MongoClient": {
		    "connect": {
		      "!type": "fn(url: string, options?: ?, callback: string|fn(err: +Error, db: +Db))",
		      "!span": "3085[77:12]-3092[77:19]",
		      "!doc": "Add connect method"
		    },
		    "!type": "fn()",
		    "!span": "754[29:9]-765[29:20]",
		    "!doc": "Creates a new MongoClient instance @class @return {MongoClient} a MongoClient instance."
		  },
		  "_setNativeParser": {
		    "!type": "fn(db_options: ?) -> !0.native_parser",
		    "!span": "12153[306:4]-12169[306:20]"
		  },
		  "_finishConnecting": {
		    "!type": "fn(serverConfig: +Server, object: ?, options: ?, callback: string|fn(err: +Error, db: +Db))",
		    "!span": "12401[317:4]-12418[317:21]"
		  },
		  "toError": {
		    "!type": "fn(error: string|+Error) -> !0",
		    "!span": "19[2:4]-26[2:11]",
		    "!doc": "Wrap a Mongo error document in an Error instance @ignore @api private"
		  },
		  "Admin": {
		    "prototype": {
		      "command": {
		        "!type": "fn(command: ?, options?: ?, callback: fn(err: +Error, doc: ?) -> bool|?)",
		        "!span": "1963[61:16]-1970[61:23]",
		        "!doc": "Execute a command @method @param {object} command The command hash @param {object} [options=null] Optional settings."
		      },
		      "buildInfo": {
		        "!type": "fn(callback: ?)",
		        "!span": "2496[79:16]-2505[79:25]",
		        "!doc": "Retrieve the server information for the current instance of the db client * @param {Admin~resultCallback} callback The command result callback @return {null}"
		      },
		      "serverInfo": {
		        "!type": "fn(callback: ?)",
		        "!span": "2756[90:16]-2766[90:26]",
		        "!doc": "Retrieve the server information for the current instance of the db client * @param {Admin~resultCallback} callback The command result callback @return {null}"
		      },
		      "serverStatus": {
		        "!type": "fn(callback: ?)",
		        "!span": "3101[103:16]-3113[103:28]",
		        "!doc": "Retrieve this db's server status."
		      },
		      "profilingLevel": {
		        "!type": "fn(callback: ?)",
		        "!span": "3579[122:16]-3593[122:30]",
		        "!doc": "Retrieve the current profiling Level for MongoDB * @param {Admin~resultCallback} callback The command result callback @return {null}"
		      },
		      "ping": {
		        "!type": "fn(options: ?, callback: ?)",
		        "!span": "4318[146:16]-4322[146:20]",
		        "!doc": "Ping the MongoDB server and retrieve results * @param {Admin~resultCallback} callback The command result callback @return {null}"
		      },
		      "authenticate": {
		        "!type": "fn(username: string, password?: string, callback: ?)",
		        "!span": "4723[159:16]-4735[159:28]",
		        "!doc": "Authenticate a user against the server."
		      },
		      "logout": {
		        "!type": "fn(callback: ?)",
		        "!span": "5107[171:16]-5113[171:22]",
		        "!doc": "Logout user from server, fire off on all connections and remove all auth info @method @param {Admin~resultCallback} callback The command result callback @return {null}"
		      },
		      "addUser": {
		        "!type": "fn(username: string, password: string, options?: ?, callback: ?)",
		        "!span": "6030[192:16]-6037[192:23]",
		        "!doc": "Add a user to the database."
		      },
		      "removeUser": {
		        "!type": "fn(username: string, options?: ?, callback: ?)",
		        "!span": "6929[216:16]-6939[216:26]",
		        "!doc": "Remove a user from a database @method @param {string} username The username."
		      },
		      "setProfilingLevel": {
		        "!type": "fn(level: string, callback: ?)",
		        "!span": "7491[235:16]-7508[235:33]",
		        "!doc": "Set the current profiling level of MongoDB * @param {string} level The new profiling level (off, slow_only, all)."
		      },
		      "profilingInfo": {
		        "!type": "fn(callback: ?)",
		        "!span": "8338[268:16]-8351[268:29]",
		        "!doc": "Retrive the current profiling information for MongoDB * @param {Admin~resultCallback} callback The command result callback."
		      },
		      "validateCollection": {
		        "!type": "fn(collectionName: string, options?: ?, callback: ?)",
		        "!span": "8831[284:16]-8849[284:34]",
		        "!doc": "Validate an existing collection * @param {string} collectionName The name of the collection to validate."
		      },
		      "listDatabases": {
		        "!type": "fn(callback: ?)",
		        "!span": "10106[322:16]-10119[322:29]",
		        "!doc": "List the available databases * @param {Admin~resultCallback} callback The command result callback."
		      },
		      "replSetGetStatus": {
		        "!type": "fn(callback: ?)",
		        "!span": "10451[335:16]-10467[335:32]",
		        "!doc": "Get ReplicaSet status * @param {Admin~resultCallback} callback The command result callback."
		      }
		    },
		    "!type": "fn(db: +Db, topology: ?) -> +Admin",
		    "!span": "928[33:4]-933[33:9]",
		    "!doc": "Create a new Admin instance (INTERNAL TYPE, do not instantiate directly) @class @return {Admin} a collection instance.",
		    "s": {
		      "!span": "1071[38:7]-1072[38:8]",
		      "!doc": "Internal state",
		      "db": "+Db",
		      "topology": "?"
		    }
		  },
		  "getSingleProperty": {
		    "!type": "fn(obj: +Db, name: string, value: ?)",
		    "!span": "131[5:4]-148[5:21]",
		    "!doc": "Set simple property"
		  },
		  "formattedOrderClause": {
		    "!type": "fn(sortValue: [number]) -> !0",
		    "!span": "192[6:4]-212[6:24]"
		  },
		  "handleCallback": {
		    "!type": "fn(callback: ?, err: ?, value1: ?, value2: handleCallback.!3) -> bool",
		    "!span": "259[7:4]-273[7:18]"
		  },
		  "AggregationCursor": {
		    "prototype": {
		      "batchSize": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "3998[146:28]-4007[146:37]",
		        "!doc": "Set the batch size for the cursor."
		      },
		      "geoNear": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "4518[160:28]-4525[160:35]",
		        "!doc": "Add a geoNear stage to the aggregation pipeline @method @param {object} document The geoNear stage document."
		      },
		      "group": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "4798[171:28]-4803[171:33]",
		        "!doc": "Add a group stage to the aggregation pipeline @method @param {object} document The group stage document."
		      },
		      "limit": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "5068[182:28]-5073[182:33]",
		        "!doc": "Add a limit stage to the aggregation pipeline @method @param {number} value The state limit value."
		      },
		      "match": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "5338[193:28]-5343[193:33]",
		        "!doc": "Add a match stage to the aggregation pipeline @method @param {object} document The match stage document."
		      },
		      "maxTimeMS": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "5616[204:28]-5625[204:37]",
		        "!doc": "Add a maxTimeMS stage to the aggregation pipeline @method @param {number} value The state maxTimeMS value."
		      },
		      "out": {
		        "!type": "fn(destination: number) -> !this",
		        "!span": "5938[217:28]-5941[217:31]",
		        "!doc": "Add a out stage to the aggregation pipeline @method @param {number} destination The destination name."
		      },
		      "project": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "6220[228:28]-6227[228:35]",
		        "!doc": "Add a project stage to the aggregation pipeline @method @param {object} document The project stage document."
		      },
		      "redact": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "6502[239:28]-6508[239:34]",
		        "!doc": "Add a redact stage to the aggregation pipeline @method @param {object} document The redact stage document."
		      },
		      "skip": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "6772[250:28]-6776[250:32]",
		        "!doc": "Add a skip stage to the aggregation pipeline @method @param {number} value The state skip value."
		      },
		      "sort": {
		        "!type": "fn(document: ?) -> !this",
		        "!span": "7038[261:28]-7042[261:32]",
		        "!doc": "Add a sort stage to the aggregation pipeline @method @param {object} document The sort stage document."
		      },
		      "unwind": {
		        "!type": "fn(field: number) -> !this",
		        "!span": "7307[272:28]-7313[272:34]",
		        "!doc": "Add a unwind stage to the aggregation pipeline @method @param {number} field The unwind field name."
		      }
		    },
		    "INIT": {
		      "!type": "number",
		      "!span": "11233[392:18]-11237[392:22]",
		      "!doc": "Iterates over all the documents for this cursor using the iterator, callback pattern."
		    },
		    "OPEN": {
		      "!type": "number",
		      "!span": "11261[393:18]-11265[393:22]"
		    },
		    "CLOSED": {
		      "!type": "number",
		      "!span": "11289[394:18]-11295[394:24]"
		    },
		    "!type": "fn(bson: ?, ns: ?, cmd: ?, options: ?, topology: ?, topologyOptions: ?)",
		    "!span": "2354[65:4]-2371[65:21]",
		    "!doc": "Creates a new Aggregation Cursor instance (INTERNAL TYPE, do not instantiate directly) @class @extends external:Readable @fires AggregationCursor#data @fires AggregationCursor#end @fires AggregationCursor#close @fires AggregationCursor#readable @return {AggregationCursor} an AggregationCursor instance.",
		    "s": {
		      "state": {
		        "!type": "number",
		        "!span": "2780[82:6]-2785[82:11]"
		      },
		      "!span": "2711[78:7]-2712[78:8]",
		      "!doc": "Internal state"
		    }
		  },
		  "checkCollectionName": {
		    "!type": "fn(collectionName: string|+Db)",
		    "!span": "19[2:4]-38[2:23]"
		  },
		  "shallowClone": {
		    "!type": "fn(obj: ?) -> ?",
		    "!span": "366[9:4]-378[9:16]"
		  },
		  "isObject": {
		    "!type": "fn(arg: string|?) -> bool",
		    "!span": "417[10:4]-425[10:12]"
		  },
		  "normalizeHintField": {
		    "!type": "fn(hint: ?) -> ?",
		    "!span": "501[12:4]-519[12:22]",
		    "!doc": "@ignore"
		  },
		  "decorateCommand": {
		    "!type": "fn(command: ?, options: ?|+Collection, exclude: ?|decorateCommand.!2)",
		    "!span": "619[14:4]-634[14:19]"
		  },
		  "CommandCursor": {
		    "prototype": {
		      "batchSize": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "4020[146:24]-4029[146:33]",
		        "!doc": "Set the batch size for the cursor."
		      },
		      "maxTimeMS": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "4526[160:24]-4535[160:33]",
		        "!doc": "Add a maxTimeMS stage to the aggregation pipeline @method @param {number} value The state maxTimeMS value."
		      }
		    },
		    "INIT": {
		      "!type": "number",
		      "!span": "8150[274:14]-8154[274:18]",
		      "!doc": "Iterates over all the documents for this cursor using the iterator, callback pattern."
		    },
		    "OPEN": {
		      "!type": "number",
		      "!span": "8174[275:14]-8178[275:18]"
		    },
		    "CLOSED": {
		      "!type": "number",
		      "!span": "8198[276:14]-8204[276:20]"
		    },
		    "!type": "fn(bson: ?, ns: ?, cmd: ?, options: ?, topology: ?, topologyOptions: ?)",
		    "!span": "857[18:4]-870[18:17]",
		    "!doc": "Creates a new Command Cursor instance (INTERNAL TYPE, do not instantiate directly) @class @extends external:Readable @fires CommandCursor#data @fires CommandCursor#end @fires CommandCursor#close @fires CommandCursor#readable @return {CommandCursor} an CommandCursor instance.",
		    "s": {
		      "state": {
		        "!type": "number",
		        "!span": "2680[81:6]-2685[81:11]"
		      },
		      "!span": "2611[77:7]-2612[77:8]",
		      "!doc": "Internal state"
		    }
		  },
		  "Cursor": {
		    "prototype": {
		      "filter": {
		        "!type": "fn(filter: ?) -> !this",
		        "!span": "4505[163:17]-4511[163:23]",
		        "!doc": "Set the cursor query @method @param {object} filter The filter object used for the cursor."
		      },
		      "addCursorFlag": {
		        "!type": "fn(flag: string, value: bool) -> !this",
		        "!span": "5020[177:17]-5033[177:30]",
		        "!doc": "Add a cursor flag to the cursor @method @param {string} flag The flag to set, must be one of following ['tailable', 'oplogReplay', 'noCursorTimeout', 'awaitData', 'exhaust', 'partial']."
		      },
		      "addQueryModifier": {
		        "!type": "fn(name: string, value: bool) -> !this",
		        "!span": "5692[193:17]-5708[193:33]",
		        "!doc": "Add a query modifier to the cursor query @method @param {string} name The query modifier (must start with $, such as $orderby etc) @param {boolean} value The flag boolean value."
		      },
		      "comment": {
		        "!type": "fn(value: string) -> !this",
		        "!span": "6391[212:17]-6398[212:24]",
		        "!doc": "Add a comment to the cursor query allowing for tracking the comment in the log."
		      },
		      "maxTimeMS": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "6882[225:17]-6891[225:26]",
		        "!doc": "Set a maxTimeMS on the cursor query, allowing for hard timeout limits on queries (Only supported on MongoDB 2.6 or higher) @method @param {number} value Number of milliseconds to wait before aborting the query."
		      },
		      "project": {
		        "!type": "fn(value: ?) -> !this",
		        "!span": "7433[242:17]-7440[242:24]",
		        "!doc": "Sets a field projection for the query."
		      },
		      "sort": {
		        "!type": "fn(keyOrList: ?, direction?: number) -> !this",
		        "!span": "7907[256:17]-7911[256:21]",
		        "!doc": "Sets the sort order of the cursor query."
		      },
		      "batchSize": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "8507[277:17]-8516[277:26]",
		        "!doc": "Set the batch size for the cursor."
		      },
		      "limit": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "9065[293:17]-9070[293:22]",
		        "!doc": "Set the limit for the cursor."
		      },
		      "skip": {
		        "!type": "fn(value: number) -> !this",
		        "!span": "9667[310:17]-9671[310:21]",
		        "!doc": "Set the skip for the cursor."
		      },
		      "nextObject": {
		        "!type": "fn(callback: fn(err: +Error, result: ?)) -> bool",
		        "!span": "12016[396:17]-12026[396:27]",
		        "!doc": "Get the next available document from the cursor, returns null if no more documents are available."
		      },
		      "each": {
		        "!type": "fn(callback: fn(err: +Error, doc: ?) -> bool)",
		        "!span": "13857[447:17]-13861[447:21]",
		        "!doc": "Iterates over all the documents for this cursor."
		      },
		      "forEach": {
		        "!type": "fn(iterator: ?, callback: ?)",
		        "!span": "15590[506:17]-15597[506:24]",
		        "!doc": "Iterates over all the documents for this cursor using the iterator, callback pattern."
		      },
		      "setReadPreference": {
		        "!type": "fn(r: ?) -> !this",
		        "!span": "16134[526:17]-16151[526:34]",
		        "!doc": "Set the ReadPreference for the cursor."
		      },
		      "toArray": {
		        "!type": "fn(callback: ?) -> bool",
		        "!span": "17196[554:17]-17203[554:24]",
		        "!doc": "Returns an array of documents."
		      },
		      "count": {
		        "!type": "fn(applySkipLimit: bool, opts: ?, callback: ?|bool)",
		        "!span": "19253[609:17]-19258[609:22]",
		        "!doc": "Get the count of documents for this cursor @method @param {boolean} applySkipLimit Should the count command apply limit and skip settings on the cursor or in the passed in options."
		      },
		      "close": {
		        "!type": "fn(callback: ?) -> bool",
		        "!span": "21308[676:17]-21313[676:22]",
		        "!doc": "Close the cursor, sending a KillCursor command and emitting close."
		      },
		      "isClosed": {
		        "!type": "fn() -> bool",
		        "!span": "21638[691:17]-21646[691:25]",
		        "!doc": "Is the cursor closed @method @return {boolean}"
		      },
		      "destroy": {
		        "!type": "fn(err: ?)",
		        "!span": "21706[695:17]-21713[695:24]"
		      },
		      "stream": {
		        "!type": "fn(options?: ?) -> !this",
		        "!span": "22105[708:17]-22111[708:23]",
		        "!doc": "Return a modified Readable stream including a possible transform method."
		      },
		      "explain": {
		        "!type": "fn(callback: ?)",
		        "!span": "22350[719:17]-22357[719:24]",
		        "!doc": "Execute the explain for the cursor @method @param {Cursor~resultCallback} [callback] The result callback."
		      },
		      "_read": {
		        "!type": "fn(n: ?)",
		        "!span": "22453[724:17]-22458[724:22]"
		      },
		      "namespace": {
		        "database": {
		          "!type": "string",
		          "!span": "23515[769:6]-23523[769:14]"
		        },
		        "collection": {
		          "!type": "string",
		          "!span": "23555[770:6]-23565[770:16]"
		        },
		        "!span": "23172[752:40]-23183[752:51]"
		      },
		      "maxTimeMs": "Cursor.prototype.maxTimeMS"
		    },
		    "INIT": {
		      "!type": "number",
		      "!span": "25734[830:7]-25738[830:11]",
		      "!doc": "Versions of Node prior to v0.10 had streams that did not implement the entire Streams API as it is today."
		    },
		    "OPEN": {
		      "!type": "number",
		      "!span": "25751[831:7]-25755[831:11]"
		    },
		    "CLOSED": {
		      "!type": "number",
		      "!span": "25768[832:7]-25774[832:13]"
		    },
		    "GET_MORE": {
		      "!type": "number",
		      "!span": "25787[833:7]-25795[833:15]"
		    },
		    "!type": "fn(bson: ?, ns: ?, cmd: ?, options: ?, topology: ?, topologyOptions: ?)",
		    "!span": "905[19:4]-911[19:10]",
		    "!doc": "Creates a new Cursor instance (INTERNAL TYPE, do not instantiate directly) @class @extends external:CoreCursor @extends external:Readable @property {string} sortValue Cursor query sort setting.",
		    "s": {
		      "maxTimeMS": {
		        "!type": "number",
		        "!span": "3161[93:6]-3170[93:15]",
		        "!doc": "MaxTimeMS"
		      },
		      "numberOfRetries": {
		        "!type": "number",
		        "!span": "3214[95:6]-3229[95:21]"
		      },
		      "tailableRetryInterval": {
		        "!type": "number",
		        "!span": "3253[96:6]-3274[96:27]"
		      },
		      "currentNumberOfRetries": {
		        "!type": "number",
		        "!span": "3304[97:6]-3326[97:28]"
		      },
		      "state": {
		        "!type": "number",
		        "!span": "3370[99:6]-3375[99:11]",
		        "!doc": "Set current cursor to INIT"
		      },
		      "!span": "3132[91:7]-3133[91:8]",
		      "!doc": "Internal cursor state"
		    },
		    "timeout": {
		      "!type": "bool",
		      "!span": "3702[117:7]-3709[117:14]",
		      "!doc": "Legacy fields"
		    }
		  },
		  "Collection": {
		    "prototype": {
		      "writeConcern": {
		        "!span": "4176[119:44]-4190[119:58]"
		      },
		      "find": {
		        "!type": "fn() -> bool",
		        "!span": "4993[147:21]-4997[147:25]",
		        "!doc": "Creates a cursor for a query that can be used to iterate over results from MongoDB @method @param {object} query The cursor query object."
		      },
		      "insertOne": {
		        "!type": "fn(doc: ?, options?: ?, callback: ?)",
		        "!span": "11486[341:21]-11495[341:30]",
		        "!doc": "Inserts a single document into MongoDB."
		      },
		      "insertMany": {
		        "!type": "fn(docs: ?, options?: ?, callback: ?)",
		        "!span": "12570[365:21]-12580[365:31]",
		        "!doc": "Inserts an array of documents into MongoDB."
		      },
		      "bulkWrite": {
		        "!type": "fn(operations: ?, options?: ?, callback: ?)",
		        "!span": "15052[422:21]-15061[422:30]",
		        "!doc": "Perform a bulkWrite operation without a fluent API * Legal operation types are * { insertOne: { document: { a: 1 } } } { updateOne: { filter: {a:2}, update: {$set: {a:2}}, upsert:true } } { updateMany: { filter: {a:2}, update: {$set: {a:2}}, upsert:true } } { deleteOne: { filter: {c:1} } } { deleteMany: { filter: {c:1} } } { replaceOne: { filter: {c:3}, replacement: {c:4}, upsert:true}}] * @method @param {object[]} operations Bulk operations to perform."
		      },
		      "insert": {
		        "!type": "fn(docs: ?, options?: ?, callback: ?)",
		        "!span": "19316[527:21]-19322[527:27]",
		        "!doc": "Inserts a single document or a an array of documents into MongoDB."
		      },
		      "updateOne": {
		        "!type": "fn(filter: ?, update: ?, options?: ?, callback: ?)",
		        "!span": "20082[544:21]-20091[544:30]",
		        "!doc": "Update a single document on MongoDB @method @param {object} filter The Filter used to select the document to update @param {object} update The update operations to be applied to the document @param {object} [options=null] Optional settings."
		      },
		      "replaceOne": {
		        "!type": "fn(filter: ?, update: ?, options?: ?, callback: ?)",
		        "!span": "21456[573:21]-21466[573:31]",
		        "!doc": "Replace a document on MongoDB @method @param {object} filter The Filter used to select the document to update @param {object} doc The Document that replaces the matching document @param {object} [options=null] Optional settings."
		      },
		      "updateMany": {
		        "!type": "fn(filter: ?, update: ?, options?: ?, callback: ?)",
		        "!span": "22844[602:21]-22854[602:31]",
		        "!doc": "Update multiple documents on MongoDB @method @param {object} filter The Filter used to select the document to update @param {object} update The update operations to be applied to the document @param {object} [options=null] Optional settings."
		      },
		      "update": {
		        "!type": "fn(selector: ?, document: ?, options?: ?, callback: fn(err: +Error|string, results: ?, full: ?) -> bool)",
		        "!span": "25902[668:21]-25908[668:27]",
		        "!doc": "Updates documents."
		      },
		      "deleteOne": {
		        "!type": "fn(filter: ?, options?: ?, callback: ?)",
		        "!span": "26537[683:21]-26546[683:30]",
		        "!doc": "Delete a document on MongoDB @method @param {object} filter The Filter used to select the document to remove @param {object} [options=null] Optional settings."
		      },
		      "deleteMany": {
		        "!type": "fn(filter: ?, options?: ?, callback: ?)",
		        "!span": "27460[707:21]-27470[707:31]",
		        "!doc": "Delete multiple documents on MongoDB @method @param {object} filter The Filter used to select the documents to remove @param {object} [options=null] Optional settings."
		      },
		      "remove": {
		        "!type": "fn(selector: ?, options?: ?, callback: fn(err: ?, result: ?))",
		        "!span": "29623[767:21]-29629[767:27]",
		        "!doc": "Remove documents."
		      },
		      "save": {
		        "!type": "fn(doc: insertDocuments.!1.<i>, options?: ?, callback: ?) -> !1.!ret",
		        "!span": "30337[783:21]-30341[783:25]",
		        "!doc": "Save a document."
		      },
		      "findOne": {
		        "!type": "fn()",
		        "!span": "33693[839:21]-33700[839:28]",
		        "!doc": "Fetches the first document that matches the query @method @param {object} query Query for find Operation @param {object} [options=null] Optional settings."
		      },
		      "rename": {
		        "!type": "fn(newName: string, opt: ?, callback: ?)",
		        "!span": "34747[869:21]-34753[869:27]",
		        "!doc": "Rename the collection."
		      },
		      "drop": {
		        "!type": "fn(callback: ?)",
		        "!span": "35979[900:21]-35983[900:25]",
		        "!doc": "Drop the collection from the database, removing it permanently."
		      },
		      "options": {
		        "!type": "fn(callback: fn(err: +Error, document: ?) -> bool)",
		        "!span": "36232[911:21]-36239[911:28]",
		        "!doc": "Returns the options of the collection."
		      },
		      "isCapped": {
		        "!type": "fn(callback: ?)",
		        "!span": "36812[927:21]-36820[927:29]",
		        "!doc": "Returns if the collection is a capped collection * @method @param {Collection~resultCallback} callback The results callback @return {null}"
		      },
		      "createIndex": {
		        "!type": "fn(fieldOrSpec: string|?, options?: ?, callback: ?)",
		        "!span": "38601[954:21]-38612[954:32]",
		        "!doc": "Creates an index on the db and collection collection."
		      },
		      "createIndexes": {
		        "!type": "fn(indexSpecs: [?], callback: ?)",
		        "!span": "39487[973:21]-39500[973:34]",
		        "!doc": "Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher."
		      },
		      "dropIndex": {
		        "!type": "fn(indexName: string, options?: ?, callback: string|fn(err: +Error, result: ?) -> bool)",
		        "!span": "40505[1005:21]-40514[1005:30]",
		        "!doc": "Drops an index from this collection."
		      },
		      "dropIndexes": {
		        "!type": "fn(callback: ?)",
		        "!span": "41191[1027:21]-41202[1027:32]",
		        "!doc": "Drops all indexes from this collection."
		      },
		      "reIndex": {
		        "!type": "fn(options: ?, callback: ?)",
		        "!span": "41942[1050:21]-41949[1050:28]",
		        "!doc": "Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections."
		      },
		      "listIndexes": {
		        "!type": "fn(options?: ?) -> ?",
		        "!span": "42694[1073:21]-42705[1073:32]",
		        "!doc": "Get the list of all indexes information for the collection."
		      },
		      "ensureIndex": {
		        "!type": "fn(fieldOrSpec: string|?, options?: ?, callback: ?)",
		        "!span": "45110[1117:21]-45121[1117:32]",
		        "!doc": "Ensures that an index exists, if it does not it creates it @method @deprecated since version 2.0 @param {(string|object)} fieldOrSpec Defines the index."
		      },
		      "indexExists": {
		        "!type": "fn(indexes: string|[?], callback: ?)",
		        "!span": "45630[1130:21]-45641[1130:32]",
		        "!doc": "Checks if one or more indexes exist on the collection, fails on first non-existing index @method @param {(string|array)} indexes One or more index names to check."
		      },
		      "indexInformation": {
		        "!type": "fn(options?: ?, callback: fn(err: ?, indexInformation: ?) -> bool)",
		        "!span": "46576[1156:21]-46592[1156:37]",
		        "!doc": "Retrieves this collections index info."
		      },
		      "count": {
		        "!type": "fn(query: ?, options?: ?|+Collection, callback: ?|fn(err: +Error, count: ?) -> bool)",
		        "!span": "47893[1184:21]-47898[1184:26]",
		        "!doc": "Count number of matching documents in the db to a query."
		      },
		      "distinct": {
		        "!type": "fn(key: string, query: ?, options?: ?|+Collection, callback: ?)",
		        "!span": "49528[1225:21]-49536[1225:29]",
		        "!doc": "The distinct command returns returns a list of distinct values for the given key across a collection."
		      },
		      "indexes": {
		        "!type": "fn(callback: ?)",
		        "!span": "50416[1255:21]-50423[1255:28]",
		        "!doc": "Retrieve all the indexes on the collection."
		      },
		      "stats": {
		        "!type": "fn(options?: ?|+Collection, callback: ?)",
		        "!span": "50832[1268:21]-50837[1268:26]",
		        "!doc": "Get all the collection statistics."
		      },
		      "findOneAndDelete": {
		        "!type": "fn(filter: ?, options?: ?, callback: ?)",
		        "!span": "52113[1301:21]-52129[1301:37]",
		        "!doc": "Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation."
		      },
		      "findOneAndReplace": {
		        "!type": "fn(filter: ?, replacement: ?, options?: ?, callback: ?)",
		        "!span": "53381[1330:21]-53398[1330:38]",
		        "!doc": "Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation."
		      },
		      "findOneAndUpdate": {
		        "!type": "fn(filter: ?, update: ?, options?: ?, callback: ?)",
		        "!span": "54839[1361:21]-54855[1361:37]",
		        "!doc": "Find a document and update it in one atomic operation, requires a write lock for the duration of the operation."
		      },
		      "findAndModify": {
		        "!type": "fn(query: ?, sort: [number], doc: ?, options?: ?, callback: ?)",
		        "!span": "56416[1395:21]-56429[1395:34]",
		        "!doc": "Find and update a document."
		      },
		      "findAndRemove": {
		        "!type": "fn(query: ?, sort: [?], options?: ?, callback: ?)",
		        "!span": "58368[1456:21]-58381[1456:34]",
		        "!doc": "Find and remove a document."
		      },
		      "aggregate": {
		        "!type": "fn(pipeline: [?]|?, options?: ?|+Collection, callback: ?|+Collection) -> +AggregationCursor",
		        "!span": "60135[1481:21]-60144[1481:30]",
		        "!doc": "Execute an aggregation framework pipeline against the collection, needs MongoDB >= 2.2 @method @param {object} pipeline Array containing all the aggregation framework commands for the execution."
		      },
		      "parallelCollectionScan": {
		        "!type": "fn(options?: ?|+Collection, callback: ?|+Collection)",
		        "!span": "64478[1588:21]-64500[1588:43]",
		        "!doc": "Return N number of parallel cursors for a collection allowing parallel reading of entire collection."
		      },
		      "geoNear": {
		        "!type": "fn(x: number, y: number, options?: ?|+Collection, callback: ?)",
		        "!span": "67499[1650:21]-67506[1650:28]",
		        "!doc": "Execute the geoNear command to search for items in the collection * @method @param {number} x Point to search on the x axis, ensure the indexes are ordered in the same order."
		      },
		      "geoHaystackSearch": {
		        "!type": "fn(x: number, y: number, options?: ?|+Collection, callback: ?)",
		        "!span": "69616[1702:21]-69633[1702:38]",
		        "!doc": "Execute a geo search using a geo haystack index on a collection."
		      },
		      "group": {
		        "!type": "fn(keys: [string]|?, condition: ?, initial: ?, reduce: ?, finalize: ?, command: bool|?, options?: ?|+Collection, callback: ?)",
		        "!span": "72298[1777:21]-72303[1777:26]",
		        "!doc": "Run a group command across a collection * @method @param {(object|array|function|code)} keys An object, array or function expressing the keys to group by."
		      },
		      "mapReduce": {
		        "!type": "fn(map: ?|string, reduce: ?|string, options?: ?|+Collection, callback: ?|+Collection)",
		        "!span": "77023[1914:21]-77032[1914:30]",
		        "!doc": "Run Map Reduce across a collection."
		      },
		      "initializeUnorderedBulkOp": {
		        "!type": "fn(options?: ?)",
		        "!span": "80421[2015:21]-80446[2015:46]",
		        "!doc": "Initiate a Out of order batch write operation."
		      },
		      "initializeOrderedBulkOp": {
		        "!type": "fn(options?: ?)",
		        "!span": "81079[2030:21]-81102[2030:44]",
		        "!doc": "Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types."
		      },
		      "removeOne": "Collection.prototype.deleteOne",
		      "removeMany": "Collection.prototype.deleteMany",
		      "dropAllIndexes": "Collection.prototype.dropIndexes"
		    },
		    "!type": "fn(db: +Db, topology: ?, dbName: string, name: string|+Db, pkFactory: ?, options: ?)",
		    "!span": "2238[55:4]-2248[55:14]",
		    "!doc": "Create a new Collection instance (INTERNAL TYPE, do not instantiate directly) @class @property {string} collectionName Get the collection name.",
		    "s": {
		      "dbName": {
		        "!type": "string",
		        "!span": "3433[89:6]-3439[89:12]"
		      },
		      "slaveOk": {
		        "!type": "bool",
		        "!span": "3637[99:6]-3644[99:13]"
		      },
		      "!span": "3266[81:7]-3267[81:8]",
		      "!doc": "Internal state",
		      "db": "+Db",
		      "topology": "?"
		    },
		    "readPreference": {
		      "!type": "string",
		      "!span": "45659[1130:50]-45673[1130:64]"
		    },
		    "_id": "number",
		    "skip": {
		      "!type": "number",
		      "!span": "8053[250:13]-8057[250:17]"
		    },
		    "limit": {
		      "!type": "number",
		      "!span": "8126[251:13]-8131[251:18]"
		    },
		    "hint": {
		      "<i>": {
		        "!type": "number",
		        "!span": "3493[138:16]-3498[138:21]"
		      },
		      "!span": "8305[253:13]-8309[253:17]"
		    },
		    "slaveOk": {
		      "!type": "bool",
		      "!span": "8595[256:13]-8602[256:20]"
		    },
		    "db": {
		      "!type": "+Db",
		      "!span": "10320[314:13]-10322[314:15]",
		      "!doc": "Add current db as parentDb"
		    },
		    "cursor": {
		      "batchSize": {
		        "!type": "number",
		        "!span": "62091[1535:43]-62100[1535:52]"
		      },
		      "!span": "62062[1535:14]-62068[1535:20]"
		    },
		    "numCursors": {
		      "!type": "number",
		      "!span": "64676[1592:10]-64686[1592:20]"
		    },
		    "batchSize": {
		      "!type": "number",
		      "!span": "64724[1593:10]-64733[1593:19]"
		    }
		  },
		  "insertDocuments": {
		    "!type": "fn(self: +Collection, docs: [?|[insertDocuments.!1.<i>]]|[insertDocuments.!1.<i>], options: ?, callback: ?|fn(err: +Error, r: ?) -> bool)",
		    "!span": "16622[466:4]-16637[466:19]"
		  },
		  "updateDocuments": {
		    "!type": "fn(self: +Collection, selector: ?|updateDocuments.!1, document: insertDocuments.!1.<i>|updateDocuments.!2, options: ?|updateDocuments.!3, callback: ?)",
		    "!span": "23573[618:4]-23588[618:19]"
		  },
		  "removeDocuments": {
		    "!type": "fn(self: +Collection, selector: ?, options: ?, callback: ?|fn(err: +Error, r: ?))",
		    "!span": "27880[720:4]-27895[720:19]"
		  },
		  "groupFunction": {
		    "!type": "string",
		    "!span": "70621[1734:4]-70634[1734:17]",
		    "!doc": "Group function helper @ignore"
		  },
		  "processScope": {
		    "!type": "fn(scope: ?) -> !0",
		    "!span": "75001[1871:9]-75013[1871:21]",
		    "!doc": "Functions that are passed as scope args must be converted to Code instances."
		  },
		  "writeConcern": {
		    "!type": "fn(target: ?, db: +Db, col: +Collection|?, options: ?) -> !0",
		    "!span": "81203[2035:4]-81215[2035:16]",
		    "!doc": "Get write concern"
		  },
		  "getReadPreference": {
		    "!type": "fn(self: +Collection, options: ?, db: +Db, coll: +Collection) -> !1",
		    "!span": "81959[2053:4]-81976[2053:21]",
		    "!doc": "Figure out the read preference"
		  },
		  "testForFields": {
		    "limit": {
		      "!type": "number",
		      "!span": "82479[2073:4]-82484[2073:9]"
		    },
		    "sort": {
		      "!type": "number",
		      "!span": "82489[2073:14]-82493[2073:18]"
		    },
		    "fields": {
		      "!type": "number",
		      "!span": "82498[2073:23]-82504[2073:29]"
		    },
		    "skip": {
		      "!type": "number",
		      "!span": "82508[2073:33]-82512[2073:37]"
		    },
		    "hint": {
		      "!type": "number",
		      "!span": "82517[2073:42]-82521[2073:46]"
		    },
		    "explain": {
		      "!type": "number",
		      "!span": "82526[2073:51]-82533[2073:58]"
		    },
		    "snapshot": {
		      "!type": "number",
		      "!span": "82538[2073:63]-82546[2073:71]"
		    },
		    "timeout": {
		      "!type": "number",
		      "!span": "82551[2073:76]-82558[2073:83]"
		    },
		    "tailable": {
		      "!type": "number",
		      "!span": "82563[2073:88]-82571[2073:96]"
		    },
		    "tailableRetryInterval": {
		      "!type": "number",
		      "!span": "82576[2073:101]-82597[2073:122]"
		    },
		    "numberOfRetries": {
		      "!type": "number",
		      "!span": "82605[2074:4]-82620[2074:19]"
		    },
		    "awaitdata": {
		      "!type": "number",
		      "!span": "82625[2074:24]-82634[2074:33]"
		    },
		    "awaitData": {
		      "!type": "number",
		      "!span": "82639[2074:38]-82648[2074:47]"
		    },
		    "exhaust": {
		      "!type": "number",
		      "!span": "82653[2074:52]-82660[2074:59]"
		    },
		    "batchSize": {
		      "!type": "number",
		      "!span": "82665[2074:64]-82674[2074:73]"
		    },
		    "returnKey": {
		      "!type": "number",
		      "!span": "82679[2074:78]-82688[2074:87]"
		    },
		    "maxScan": {
		      "!type": "number",
		      "!span": "82693[2074:92]-82700[2074:99]"
		    },
		    "min": {
		      "!type": "number",
		      "!span": "82705[2074:104]-82708[2074:107]"
		    },
		    "max": {
		      "!type": "number",
		      "!span": "82713[2074:112]-82716[2074:115]"
		    },
		    "showDiskLoc": {
		      "!type": "number",
		      "!span": "82721[2074:120]-82732[2074:131]"
		    },
		    "comment": {
		      "!type": "number",
		      "!span": "82740[2075:4]-82747[2075:11]"
		    },
		    "raw": {
		      "!type": "number",
		      "!span": "82752[2075:16]-82755[2075:19]"
		    },
		    "readPreference": {
		      "!type": "number",
		      "!span": "82760[2075:24]-82774[2075:38]"
		    },
		    "partial": {
		      "!type": "number",
		      "!span": "82779[2075:43]-82786[2075:50]"
		    },
		    "read": {
		      "!type": "number",
		      "!span": "82791[2075:55]-82795[2075:59]"
		    },
		    "dbName": {
		      "!type": "number",
		      "!span": "82800[2075:64]-82806[2075:70]"
		    },
		    "oplogReplay": {
		      "!type": "number",
		      "!span": "82811[2075:75]-82822[2075:86]"
		    },
		    "connection": {
		      "!type": "number",
		      "!span": "82827[2075:91]-82837[2075:101]"
		    },
		    "maxTimeMS": {
		      "!type": "number",
		      "!span": "82842[2075:106]-82851[2075:115]"
		    },
		    "transforms": {
		      "!type": "number",
		      "!span": "82856[2075:120]-82866[2075:130]"
		    },
		    "!span": "82457[2072:4]-82470[2072:17]"
		  },
		  "methodsToInherit": {
		    "!type": "[string]",
		    "!span": "3517[131:4]-3533[131:20]",
		    "!doc": "Set the methods to inherit from prototype"
		  },
		  "i": {
		    "!type": "number",
		    "!span": "3695[135:8]-3696[135:9]"
		  },
		  "flags": {
		    "!type": "[string]",
		    "!span": "1988[56:4]-1993[56:9]",
		    "!doc": "Flags allowed for cursor"
		  },
		  "loop": {
		    "!type": "fn(self: +Cursor, callback: fn(err: +Error, doc: ?) -> bool) -> loop",
		    "!span": "13029[425:4]-13033[425:8]",
		    "!doc": "Trampoline emptying the number of retrieved items without incurring a nextTick operation"
		  },
		  "_each": {
		    "!type": "fn(self: +Cursor, callback: fn(err: +Error, doc: ?) -> bool) -> bool",
		    "!span": "14062[457:4]-14067[457:9]",
		    "!doc": "Run the each loop"
		  },
		  "parseIndexOptions": {
		    "!type": "fn(fieldOrSpec: string|?) -> parseIndexOptions.!ret",
		    "!span": "221[6:4]-238[6:21]",
		    "!doc": "Create index name based on field spec * @ignore @api private"
		  },
		  "debugOptions": {
		    "!type": "fn(debugFields: [string], options: ?) -> debugOptions.!ret",
		    "!span": "282[7:4]-294[7:16]"
		  },
		  "debugFields": {
		    "!type": "[string]",
		    "!span": "916[22:4]-927[22:15]"
		  },
		  "listCollectionsTranforms": {
		    "!type": "fn(databaseName: string) -> listCollectionsTranforms.!ret",
		    "!span": "17713[420:4]-17737[420:28]",
		    "!doc": "Transformation methods for cursor results"
		  },
		  "_executeAuthCreateUserCommand": {
		    "!type": "fn(self: +Db, username: string, password: string, options: ?, callback: ?|fn(err: ?|+Error, r: [?]) -> bool)",
		    "!span": "32994[792:4]-33023[792:33]"
		  },
		  "_executeAuthRemoveUserCommand": {
		    "!type": "fn(self: +Db, username: string, options: ?, callback: ?|fn(err: ?|+Error, result: bool) -> bool)",
		    "!span": "38390[935:4]-38419[935:33]"
		  },
		  "createCreateIndexCommand": {
		    "!type": "fn(db: +Db, name: string, fieldOrSpec: string|?, options: ?) -> createCreateIndexCommand.!ret",
		    "!span": "47515[1184:4]-47539[1184:28]"
		  },
		  "createIndexUsingCreateIndexes": {
		    "!type": "fn(self: +Db, name: string, fieldOrSpec: string|?, options: ?, callback: fn(err: +Error, result: string) -> bool)",
		    "!span": "48709[1220:4]-48738[1220:33]"
		  },
		  "validateDatabaseName": {
		    "!type": "fn(databaseName: string)",
		    "!span": "50020[1257:4]-50040[1257:24]",
		    "!doc": "Validate the database name"
		  },
		  "createListener": {
		    "!type": "fn(self: +Db, e: string, object: +Db) -> fn(err: ?)",
		    "!span": "51139[1285:4]-51153[1285:18]",
		    "!doc": "Add listeners to topology"
		  },
		  "ServerCapabilities": {
		    "!type": "fn(ismaster: ?)",
		    "!span": "140[5:4]-158[5:22]",
		    "!doc": "Server capabilities"
		  },
		  "Store": {
		    "prototype": {
		      "add": {
		        "!type": "fn(opType: ?, ns: ?, ops: ?, options: ?, callback: ?)",
		        "!span": "541[23:16]-544[23:19]"
		      },
		      "addObjectAndMethod": {
		        "!type": "fn(opType: ?, object: ?, method: ?, params: ?, callback: ?)",
		        "!span": "1350[38:16]-1368[38:34]"
		      },
		      "flush": {
		        "!type": "fn()",
		        "!span": "2185[53:16]-2190[53:21]"
		      },
		      "execute": {
		        "!type": "fn()",
		        "!span": "2360[59:16]-2367[59:23]"
		      },
		      "all": {
		        "!type": "fn() -> !this.s.storedOps",
		        "!span": "2727[77:16]-2730[77:19]"
		      }
		    },
		    "!type": "fn(topology: +Server, storeOptions: ?)",
		    "!span": "368[10:4]-373[10:9]",
		    "!doc": "The store of ops",
		    "s": {
		      "storedOps": {
		        "!type": "[?]",
		        "!span": "317[13:6]-326[13:15]",
		        "!doc": "Reset the ops"
		      },
		      "storeOptions": {
		        "force": {
		          "!type": "bool",
		          "!span": "3463[67:6]-3468[67:11]"
		        },
		        "bufferMaxEntries": {
		          "!type": "number",
		          "!span": "3482[68:6]-3498[68:22]",
		          "!doc": "Update bufferMaxEntries"
		        },
		        "!span": "344[14:6]-356[14:18]",
		        "!doc": "Store option defaults"
		      },
		      "topology": {
		        "!type": "+Server",
		        "!span": "377[15:6]-385[15:14]"
		      },
		      "!span": "305[12:7]-306[12:8]",
		      "!doc": "Internal state"
		    },
		    "length": {
		      "!type": "number",
		      "!span": "431[18:30]-439[18:38]"
		    }
		  },
		  "translateReadPreference": {
		    "!type": "fn(options: ?) -> !0",
		    "!span": "8731[243:4]-8754[243:27]",
		    "!doc": "Ensure the right read Preference object"
		  },
		  "formatSortValue": {
		    "!type": "fn(sortDirection: ?) -> number",
		    "!span": "382[20:4]-397[20:19]"
		  },
		  "Error": {
		    "name": {
		      "!type": "string",
		      "!span": "6691[202:12]-6695[202:16]"
		    }
		  }
  	};
	
	tern.registerPlugin("mongodb2_0_27", /* @callback */ function(server, options) {
	    return {
	      defs : defs
	    };
	});
});