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
 * Tern type index and templates for PostgreSQL node support
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
			prefix: "postgres", //$NON-NLS-0$
			name: "postgres", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for Postgres DB", //$NON-NLS-0$
			template: "var pg = require('pg');\n" //$NON-NLS-0$
		},
		{
			prefix: "postgres", //$NON-NLS-0$
			name: "postgres client", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB client", //$NON-NLS-0$
			template: "var pg = require('pg');\n" + //$NON-NLS-0$
					  "var url = \"postgres://postgres:${port}@${host}/${database}\";\n" +  //$NON-NLS-0$
					  "var ${client} = new pg.Client(url);\n"  //$NON-NLS-0$
		},
		{
			prefix: "postgres", //$NON-NLS-0$
			name: "postgres connect", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB client and connect", //$NON-NLS-0$
			template: "var pg = require('pg');\n" + //$NON-NLS-0$
					  "var url = \"postgres://postgres:${port}@${host}/${database}\";\n" +  //$NON-NLS-0$
					  "var ${client} = new pg.Client(url);\n" + //$NON-NLS-0$
					  "${client}.connect(function(error) {\n" +  //$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "});\n" //$NON-NLS-1$
		},
		{
			prefix: "postgres", //$NON-NLS-0$
			name: "postgres query", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Postgres DB query statement", //$NON-NLS-0$
			template: "${client}.query(${sql}, function(error, result) {\n" + //$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "});\n" //$NON-NLS-1$
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
				_t.origin = 'postgres'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	} 
	
	/* eslint-disable missing-nls */
	var defs = {
	  "!name": "postgres",
	  "!define": {
	    "TypeOverrides.prototype": {
	      "getOverrides": "fn(format: string) -> !this.text",
	      "setTypeParser": "fn(oid: ?, format: string, parseFn: string)",
	      "getTypeParser": "fn(oid: ?, format: string) -> string"
	    },
	    "ConnectionParameters.prototype": {
	      "getLibpqConnectionString": "fn(cb: fn(err: ?, conString: string))"
	    },
	    "ConnectionParameters.prototype.getLibpqConnectionString.!0": "fn(err: ?, conString: string)",
	    "NativeQuery.prototype": {
	      "handleError": "fn(err: +Error)",
	      "submit": "fn(client: NativeQuery.prototype.submit.!0)"
	    },
	    "NativeQuery.prototype.submit.!0": {
	      "_types": "+TypeOverrides",
	      "_queryQueue": "[+NativeQuery]",
	      "_connected": {
	        "!type": "bool",
	        "!doc": "set internal states to connected"
	      },
	      "port": "number",
	      "namedQueries": {
	        "<i>": "bool",
	        "!doc": "a hash to hold named queries"
	      },
	      "_activeQuery": "+NativeQuery",
	      "readyForQuery": "bool",
	      "hasExecuted": "bool",
	      "queryQueue": "[+Query]",
	      "binary": "bool",
	      "encoding": "string",
	      "ssl": "bool",
	      "connectionParameters": "+ConnectionParameters",
	      "activeQuery": "+Query",
	      "connection": "+Connection"
	    },
	    "Client.prototype": {
	      "connect": "fn(callback: ?)",
	      "query": "fn(config: ?, values: ?, callback: ?) -> !0",
	      "end": "fn()",
	      "_hasActiveQuery": "fn() -> !this._activeQuery",
	      "_pulseQueryQueue": "fn(initialConnection: bool)",
	      "cancel": "fn(client: ?, query: ?)",
	      "setTypeParser": "fn(oid: ?, format: ?, parseFn: ?)",
	      "getTypeParser": "fn(oid: ?, format: ?) -> string",
	      "getStartupConf": "fn() -> Client.prototype.getStartupConf.!ret",
	      "escapeIdentifier": "fn(str: ?) -> !0.<i>",
	      "escapeLiteral": "fn(str: ?) -> !0.<i>",
	      "copyFrom": "fn(text: ?)",
	      "copyTo": "fn(text: ?)"
	    },
	    "Client.prototype.getStartupConf.!ret": {},
	    "Client.md5": "fn(string: ?)",
	    "NativeResult.prototype": {
	      "addCommandComplete": "fn(pq: ?)"
	    },
	    "Query.prototype": {
	      "requiresPreparation": "fn() -> bool",
	      "handleRowDescription": {
	        "!type": "fn(msg: ?)",
	        "!doc": "associates row metadata from the supplied message with this query object metadata used when parsing row results"
	      },
	      "handleDataRow": "fn(msg: ?)",
	      "handleCommandComplete": "fn(msg: ?, con: +Connection)",
	      "handleReadyForQuery": "fn()",
	      "handleError": "fn(err: ?, connection: +Connection)",
	      "submit": "fn(connection: +Connection)",
	      "hasBeenParsed": "fn(connection: +Connection) -> !this.name",
	      "handlePortalSuspended": "fn(connection: +Connection)",
	      "_getRows": "fn(connection: +Connection, rows: ?)",
	      "prepare": "fn(connection: +Connection)",
	      "handleCopyInResponse": "fn(connection: +Connection)",
	      "handleCopyData": "fn(msg: ?, connection: +Connection)"
	    },
	    "Query.prototype.handleCommandComplete.!1": "+Connection",
	    "Query.!ret": "+Query",
	    "Connection.prototype": {
	      "connect": "fn(port: ?, host: ?)",
	      "attachListeners": "fn(stream: ?)",
	      "requestSsl": "fn()",
	      "startup": "fn(config: Client.prototype.getStartupConf.!ret)",
	      "cancel": "fn(processID: ?, secretKey: ?)",
	      "password": "fn(password: string)",
	      "_send": "fn(code: number, more: bool) -> bool",
	      "query": "fn(text: ?)",
	      "parse": {
	        "!type": "fn(query: Connection.prototype.parse.!0, more: bool)",
	        "!doc": "send parse message \"more\" === true to buffer the message until flush() is called"
	      },
	      "bind": {
	        "!type": "fn(config: Connection.prototype.bind.!0, more: bool)",
	        "!doc": "send bind message \"more\" === true to buffer the message until flush() is called"
	      },
	      "execute": {
	        "!type": "fn(config: Connection.prototype.execute.!0, more: bool)",
	        "!doc": "send execute message \"more\" === true to buffer the message until flush() is called"
	      },
	      "flush": "fn()",
	      "sync": "fn()",
	      "end": "fn()",
	      "close": "fn(msg: ?, more: ?)",
	      "describe": "fn(msg: Connection.prototype.describe.!0, more: bool)",
	      "sendCopyFromChunk": "fn(chunk: ?)",
	      "endCopyFrom": "fn()",
	      "sendCopyFail": "fn(msg: string)",
	      "parseMessage": "fn(buffer: ?) -> +Message",
	      "parseR": "fn(buffer: ?, length: ?) -> +Message",
	      "parseS": "fn(buffer: ?, length: ?) -> +Message",
	      "parseK": "fn(buffer: ?, length: ?) -> +Message",
	      "parseC": "fn(buffer: ?, length: ?) -> +Message",
	      "parseZ": "fn(buffer: ?, length: ?) -> +Message",
	      "parseT": "fn(buffer: ?, length: ?) -> +Message",
	      "parseField": "fn(buffer: ?) -> +Field",
	      "parseD": {
	        "!type": "fn(buffer: ?, length: ?) -> +DataRowMessage",
	        "!doc": "extremely hot-path code"
	      },
	      "_readValue": {
	        "!type": "fn(buffer: ?)",
	        "!doc": "extremely hot-path code"
	      },
	      "parseE": {
	        "!type": "fn(buffer: ?, length: ?) -> +Message",
	        "!doc": "parses error"
	      },
	      "parseN": {
	        "!type": "fn(buffer: ?, length: ?) -> +Message",
	        "!doc": "same thing, different name"
	      },
	      "parseA": "fn(buffer: ?, length: ?) -> +Message",
	      "parseG": "fn(buffer: ?, length: ?) -> +Message",
	      "parseH": "fn(buffer: ?, length: ?) -> +Message",
	      "parseGH": "fn(buffer: ?, msg: +Message) -> !1",
	      "parsed": "fn(buffer: ?, length: ?) -> +Message",
	      "parseInt32": "fn(buffer: ?)",
	      "parseInt16": "fn(buffer: ?)",
	      "readString": "fn(buffer: ?, length: number)",
	      "readBytes": "fn(buffer: ?, length: number)",
	      "parseCString": "fn(buffer: ?)"
	    },
	    "Connection.prototype.parse.!0": {
	      "name": "string",
	      "types": "[?]"
	    },
	    "Connection.prototype.bind.!0": {
	      "portal": "string",
	      "statement": "string",
	      "binary": "bool",
	      "!doc": "normalize config"
	    },
	    "Connection.prototype.execute.!0": {
	      "portal": "string",
	      "rows": "string"
	    },
	    "Connection.prototype.describe.!0": {
	      "type": "string",
	      "name": "string"
	    },
	    "Connection.prototype.parseMessage.!ret": {
	      "!type": "+Message",
	      "!doc": "the msg is an Error instance"
	    },
	    "Connection.prototype.parseD.!ret": "+DataRowMessage",
	    "Connection.!0": {
	      "ssl": "bool"
	    },
	    "add.!0": "[string]",
	    "add.!1": "+ConnectionParameters",
	    "PG.prototype": {
	      "end": "fn()",
	      "connect": "fn(config: ?, callback: ?)",
	      "cancel": {
	        "!type": "fn(config: ?, client: ?, query: ?)",
	        "!doc": "cancel the query runned by the given client"
	      }
	    },
	    "Result.prototype": {
	      "addCommandComplete": {
	        "!type": "fn(msg: ?)",
	        "!doc": "adds a command complete message"
	      },
	      "parseRow": {
	        "!type": "fn(rowData: ?) -> +Result.RowCtor",
	        "!doc": "rowData is an array of text or binary values this turns the row into a JavaScript object"
	      },
	      "addRow": "fn(row: [?])",
	      "addFields": "fn(fieldDescriptions: ?)",
	      "_parseRowAsArray": "Result.parseRow"
	    },
	    "prepareValue.!1": "[?]",
	    "normalizeQueryConfig.!0": {
	      "!doc": "can take in strings or config objects",
	      "text": "normalizeQueryConfig.!0"
	    },
	    "Error.fields.<i>": "+Field",
	    "Query.binary": "bool",
	    "Query.portal": {
	      "!type": "string",
	      "!doc": "use unique portal name each time"
	    },
	    "Query._result": "+Result",
	    "Query.isPreparedStatement": {
	      "!type": "bool",
	      "!doc": "prepared statements need sync to be called after each command complete or when an error is encountered"
	    },
	    "Query._canceledDueToError": "bool",
	    "Result.command": "string",
	    "Result.rowCount": {
	      "!type": "number",
	      "!doc": "msg.value is from native bindings"
	    },
	    "Result.oid": "number",
	    "Result.rows": "[[?]]",
	    "Result.rows.<i>": "[?]",
	    "Result.fields": "[?]",
	    "Result._parsers": "[string]",
	    "Result.RowCtor": "fn()",
	    "Result.rowAsArray": "bool",
	    "Result.parseRow": "fn(rowData: ?) -> [?]",
	    "Result._getTypeParser": "fn(oid: ?, format: string) -> string",
	    "Connection.lastBuffer": "bool",
	    "Connection.lastOffset": "number",
	    "Connection.offset": "number",
	    "Connection.encoding": "string",
	    "Connection.parsedStatements": {
	      "<i>": "bool"
	    },
	    "Connection.ssl": "bool",
	    "Connection._ending": "bool",
	    "Connection._mode": "number",
	    "Connection._emitMessage": "bool",
	    "Connection.checkSslResponse": "bool",
	    "Message.name": "string",
	    "Message.binary": "bool",
	    "Field.format": "string",
	    "DataRowMessage.name": "string",
	    "DataRowMessage.fields": "[?]",
	    "ConnectionParameters.port": "number",
	    "ConnectionParameters.ssl": "bool",
	    "ConnectionParameters.isDomainSocket": {
	      "!type": "bool",
	      "!doc": "a domain socket begins with '/'"
	    },
	    "TypeOverrides.text": {
	      "<i>": "string"
	    },
	    "NativeQuery.state": {
	      "!type": "string",
	      "!doc": "handle successful result"
	    },
	    "NativeQuery._arrayMode": "bool",
	    "NativeQuery._emitRowEvents": {
	      "!type": "bool",
	      "!doc": "if the 'row' event is listened for then emit them as they come in without setting singleRowMode to true this has almost no meaning because libpq reads all rows into memory befor returning any"
	    },
	    "Client.Query": {
	      "prototype": {
	        "requiresPreparation": "Query.prototype.requiresPreparation",
	        "handleRowDescription": "Query.prototype.handleRowDescription",
	        "handleDataRow": "Query.prototype.handleDataRow",
	        "handleCommandComplete": "Query.prototype.handleCommandComplete",
	        "handleReadyForQuery": "Query.prototype.handleReadyForQuery",
	        "handleError": "Query.prototype.handleError",
	        "submit": "Query.prototype.submit",
	        "hasBeenParsed": "Query.prototype.hasBeenParsed",
	        "handlePortalSuspended": "Query.prototype.handlePortalSuspended",
	        "_getRows": "Query.prototype._getRows",
	        "prepare": "Query.prototype.prepare",
	        "handleCopyInResponse": "Query.prototype.handleCopyInResponse",
	        "handleCopyData": "Query.prototype.handleCopyData"
	      }
	    }
	  },
	  "defaults": {
	    "host": {
	      "!type": "string",
	      "!doc": "database host defaults to localhost"
	    },
	    "port": {
	      "!type": "number",
	      "!doc": "database port"
	    },
	    "rows": {
	      "!type": "number",
	      "!doc": "number of rows to return at a time from a prepared statement's portal."
	    },
	    "binary": {
	      "!type": "bool",
	      "!doc": "binary result mode"
	    },
	    "poolSize": {
	      "!type": "number",
	      "!doc": "number of connections to use in connection pool 0 will disable connection pooling"
	    },
	    "poolIdleTimeout": {
	      "!type": "number",
	      "!doc": "max milliseconds a client can go unused before it is removed from the pool and destroyed"
	    },
	    "reapIntervalMillis": {
	      "!type": "number",
	      "!doc": "frequeny to check for idle clients within the client pool"
	    },
	    "poolLog": {
	      "!type": "bool",
	      "!doc": "pool log function / boolean"
	    },
	    "client_encoding": "string",
	    "ssl": "bool"
	  },
	  "TypeOverrides": "fn(userTypes: ?)",
	  "ConnectionParameters": "fn(config: ?)",
	  "msg": "string",
	  "NativeQuery": "fn(native: ?)",
	  "Client": "fn(config: defaults)",
	  "NativeResult": "fn(pq: ?)",
	  "Query": "fn(config: ?, values: ?, callback: ?) -> +Query",
	  "Connection": "fn(config: Connection.!0)",
	  "TEXT_MODE": "number",
	  "BINARY_MODE": "number",
	  "Message": "fn(name: string, length: ?)",
	  "ROW_DESCRIPTION": "string",
	  "Field": "fn()",
	  "FORMAT_TEXT": "string",
	  "FORMAT_BINARY": "string",
	  "DATA_ROW": "string",
	  "DataRowMessage": "fn(length: ?, fieldCount: ?)",
	  "val": "fn(key: string, config: ?, envVar: ?) -> !1.<i>",
	  "useSsl": "fn() -> bool",
	  "add": "fn(params: [string], config: +ConnectionParameters, paramName: string)",
	  "PG": "fn(clientConstructor: fn(config: defaults))",
	  "pools": {
	    "all": {
	      "!doc": "dictionary of all key:pool pairs"
	    },
	    "getOrCreate": "fn(clientConfig: ?)"
	  },
	  "Result": {
	    "!type": "fn(rowMode: ?)",
	    "!doc": "result object returned from query in the 'end' event and also passed as second argument to provided callback"
	  },
	  "matchRegexp": "+RegExp",
	  "inlineParser": "fn(fieldName: ?, i: number) -> string",
	  "arrayString": {
	    "!type": "fn(val: ?) -> string",
	    "!doc": "convert a JS array to a postgres array literal uses comma separator so won't work for types like box that use a different array separator."
	  },
	  "prepareValue": {
	    "!type": "fn(val: ?, seen: [?]) -> !0",
	    "!doc": "converts values from javascript types to their 'raw' counterparts for use as a postgres parameter note: you can override this function to provide your own conversion mechanism for complex types, etc..."
	  },
	  "prepareObject": "fn(val: ?, seen: [?]) -> string",
	  "dateToString": "fn(date: ?) -> string",
	  "normalizeQueryConfig": "fn(config: normalizeQueryConfig.!0, values: ?, callback: ?) -> !0",
	  "Error": {
	    "name": "string",
	    "fields": "[+Field]",
	    "binary": "bool",
	    "columnTypes": "[?]"
	  }
	};
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionPostgres", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	completion: getTemplates
	      }
	    };
	});
});