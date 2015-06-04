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
 * Tern type index and templates for AMQP node support
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
			prefix: "mysql", //$NON-NLS-0$
			name: "mysql", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for MySQL DB", //$NON-NLS-0$
			template: "var mysql = require('mysql');\n" //$NON-NLS-0$
		},
		{
			prefix: "mysql", //$NON-NLS-0$
			name: "mysql connection", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new MySQL DB connection", //$NON-NLS-0$
			template: "var mysql = require('mysql');\n" + //$NON-NLS-0$
					  "var ${connection} = mysql.createConnection({\n" +  //$NON-NLS-0$
  					  "\thost : ${host},\n" +  //$NON-NLS-0$
  					  "\tuser : ${username},\n" +  //$NON-NLS-0$
  					  "\tpassword : ${password}\n" +  //$NON-NLS-0$
					  "});\n" + //$NON-NLS-0$
					  "try {\n" +  //$NON-NLS-0$
					  "\t${connection}.connect();\n" +  //$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "} finally {\n" +  //$NON-NLS-0$
					  "\t${connection}.end();\n" +  //$NON-NLS-0$
					  "}"
		},
		{
			prefix: "mysql", //$NON-NLS-0$
			name: "mysql query", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new MySQL DB query statement", //$NON-NLS-0$
			template: "${connection}.query(${sql}, function(error, rows, fields) {\n" + //$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "});\n"  //$NON-NLS-0$
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
				_t.origin = 'mysql'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	} 
	
	/* eslint-disable missing-nls */
	var defs = {
	  "!name": "mysql",
	  "!define": {
	    "ComQuitPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "ComQuitPacket.prototype.write.!0": "+PacketWriter",
	    "ConnectionConfig.mergeFlags": "fn(defaultFlags: [string], userFlags: string) -> number",
	    "ConnectionConfig.mergeFlags.!0": {
	      "!type": "[string]",
	      "!doc": "Set the client flags"
	    },
	    "ConnectionConfig.getCharsetNumber": "fn(charset: ?)",
	    "ConnectionConfig.getDefaultFlags": "fn(options: ConnectionConfig.!0) -> [string]",
	    "ConnectionConfig.getDefaultFlags.!0": {
	      "port": "number"
	    },
	    "ConnectionConfig.getSSLProfile": "fn(name: bool)",
	    "ConnectionConfig.parseFlagList": "fn(flagList: ?) -> ConnectionConfig.parseFlagList.!ret",
	    "ConnectionConfig.parseFlagList.!ret": {
	      "<i>": "bool"
	    },
	    "ConnectionConfig.parseUrl": "fn(url: ConnectionConfig.!0) -> ConnectionConfig.!0",
	    "ConnectionConfig.!0": {
	      "port": "number"
	    },
	    "Protocol.prototype": {
	      "write": "fn(buffer: ?) -> bool",
	      "handshake": "fn(options: Protocol.prototype.handshake.!0, callback: Protocol.prototype.handshake.!0)",
	      "query": "fn(options: ?, callback: ?)",
	      "changeUser": "fn(options: Protocol.prototype.changeUser.!0, callback: ?)",
	      "ping": "fn(options: ?, callback: ?)",
	      "stats": "fn(options: ?, callback: ?)",
	      "quit": "fn(options: ?, callback: ?)",
	      "end": "fn()",
	      "pause": "fn()",
	      "resume": "fn()",
	      "_enqueue": "fn(sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query) -> !0",
	      "_validateEnqueue": "fn(sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query) -> bool",
	      "_parsePacket": "fn()",
	      "_parsePacketDebug": "fn(packet: ?)",
	      "_emitPacket": "fn(packet: ?)",
	      "_determinePacket": "fn(sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query)",
	      "_dequeue": "fn(sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query)",
	      "_startSequence": "fn(sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query)",
	      "handleNetworkError": "fn(err: +Error)",
	      "handleParserError": "fn(err: ?)",
	      "_delegateError": "fn(err: +Error, sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query)",
	      "_shouldErrorBubbleUp": "fn(err: +Error, sequence: fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query) -> !0.fatal",
	      "_hasPendingErrorHandlers": "fn() -> bool",
	      "destroy": "fn()",
	      "_debugPacket": "fn(incoming: bool, packet: ?)"
	    },
	    "Protocol.prototype.handshake.!0": {},
	    "Protocol.prototype.changeUser.!0": {
	      "currentConfig": "+ConnectionConfig"
	    },
	    "Protocol.prototype._enqueue.!0": {
	      "typeCast": "bool",
	      "_callSite": {
	        "!type": "+Error",
	        "!doc": "Long stack trace support"
	      },
	      "_connection": "+Connection"
	    },
	    "Protocol.prototype._enqueue.!0.!0": {
	      "sql": "string"
	    },
	    "Protocol.prototype._emitPacket.!0": "+UseOldPasswordPacket",
	    "Protocol.!0": {
	      "connection": "+PoolConnection",
	      "config": "+ConnectionConfig"
	    },
	    "Query.prototype": {
	      "start": "fn()",
	      "determinePacket": "fn(firstByte: ?, parser: ?)",
	      "OkPacket": "fn(packet: ?)",
	      "ErrorPacket": "fn(packet: ?)",
	      "ResultSetHeaderPacket": "fn(packet: ?)",
	      "FieldPacket": "fn(packet: ?)",
	      "EofPacket": "fn(packet: ?)",
	      "_handleFinalResultPacket": "fn(packet: ?)",
	      "RowDataPacket": "fn(packet: ?, parser: ?, connection: ?)",
	      "_sendLocalDataFile": "fn(path: ?)",
	      "stream": "fn(options: Query.prototype.stream.!0)"
	    },
	    "Query.prototype.ResultSetHeaderPacket.!0": "+ResultSetHeaderPacket",
	    "Query.prototype._handleFinalResultPacket.!0": "+OkPacket",
	    "Query.prototype.stream.!0": {
	      "objectMode": "bool"
	    },
	    "Query.!0": {},
	    "Query.!1": {
	      "sql": "string"
	    },
	    "Connection.createQuery": {
	      "!type": "fn(sql: Query.values, values: Query.values, callback: ?) -> +Query",
	      "!doc": "* Create a new Query instance."
	    },
	    "Connection.createQuery.!ret": "+Query",
	    "Connection.prototype": {
	      "connect": "fn(options: ?, callback: ?)",
	      "beginTransaction": "fn(options: Connection.prototype.beginTransaction.!0, callback: Connection.prototype.beginTransaction.!0) -> fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query",
	      "commit": "fn(options: Connection.prototype.commit.!0, callback: Connection.prototype.commit.!0) -> fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query",
	      "rollback": "fn(options: Query.values, callback: Query.values) -> fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query",
	      "query": "fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query",
	      "ping": "fn(options: ?, callback: ?)",
	      "statistics": "fn(options: ?, callback: ?)",
	      "end": "fn(options: ?, callback: ?)",
	      "destroy": "fn()",
	      "pause": "fn()",
	      "resume": "fn()",
	      "escape": {
	        "!type": "fn(value: ?)",
	        "!doc": "* Escape a value for SQL."
	      },
	      "escapeId": {
	        "!type": "fn(value: ?)",
	        "!doc": "* Escape an identifier for SQL."
	      },
	      "format": {
	        "!type": "fn(sql: ?, values: ?)",
	        "!doc": "* Format SQL and replacement values into a SQL string."
	      },
	      "_startTLS": {
	        "!type": "fn(onSecure: fn(err: +Error))",
	        "!doc": "pre-0.11 environment"
	      },
	      "_handleConnectTimeout": "fn()",
	      "_handleNetworkError": "fn(err: +Error)",
	      "_handleProtocolError": "fn(err: ?)",
	      "_handleProtocolDrain": "fn()",
	      "_handleProtocolConnect": "fn()",
	      "_handleProtocolHandshake": "fn(packet: ?)",
	      "_handleProtocolEnd": "fn(err: ?)",
	      "_handleProtocolEnqueue": "fn(sequence: ?)",
	      "_implyConnect": "fn()",
	      "changeUser": "__changeUser"
	    },
	    "Connection.prototype.beginTransaction.!0": {
	      "sql": "string"
	    },
	    "Connection.prototype.commit.!0": {
	      "sql": "string"
	    },
	    "Connection.prototype.query._connection": "+Connection",
	    "Connection.prototype.query.typeCast": "bool",
	    "Connection.prototype._startTLS.!0": "fn(err: +Error)",
	    "Connection.prototype._handleProtocolHandshake.!0": "+HandshakeInitializationPacket",
	    "Connection.!0": {
	      "config": "+ConnectionConfig"
	    },
	    "PoolConnection.prototype": {
	      "changeUser": "fn(options: ?, callback: ?)",
	      "release": "fn()",
	      "end": "fn()",
	      "destroy": "fn()",
	      "_removeFromPool": "fn()",
	      "_realEnd": "Connection.prototype.end"
	    },
	    "Pool.prototype": {
	      "getConnection": "fn(cb: fn(err: +Error, connection: +PoolConnection))",
	      "acquireConnection": "fn(connection: +PoolConnection, cb: fn(err: +Error, connection: +PoolConnection))",
	      "releaseConnection": "fn(connection: +PoolConnection)",
	      "end": "fn(cb: fn(err: ?))",
	      "query": "fn(sql: ?, values: ?, cb: ?) -> !0",
	      "_enqueueCallback": "fn(callback: fn(err: +Error, connection: +PoolConnection))",
	      "_purgeConnection": "fn(connection: +PoolConnection, callback: fn(err: ?))",
	      "_removeConnection": "fn(connection: +PoolConnection)",
	      "escape": "fn(value: ?)",
	      "escapeId": "fn(value: ?)"
	    },
	    "Pool.prototype.getConnection.!0": "fn(err: +Error, connection: +PoolConnection)",
	    "Pool.prototype.end.!0": "fn(err: ?)",
	    "Pool.prototype._purgeConnection.!1": "fn(err: ?)",
	    "Pool.!0": {
	      "config": "+PoolConfig"
	    },
	    "PoolConfig.prototype": {
	      "newConnectionConfig": "fn() -> +ConnectionConfig"
	    },
	    "PoolNamespace.prototype": {
	      "getConnection": "fn(cb: string)",
	      "_getClusterNode": "fn() -> PoolCluster._nodes.<i>"
	    },
	    "PoolNamespace.prototype._getClusterNode.!ret": {
	      "id": "string",
	      "errorCount": "number",
	      "_offlineUntil": "number",
	      "pool": "+Pool"
	    },
	    "PoolSelector.RR.!ret": "fn(clusterIds: ?) -> !0.<i>",
	    "PoolSelector.RANDOM.!ret": "fn(clusterIds: ?) -> !0.<i>",
	    "PoolSelector.ORDER.!ret": "fn(clusterIds: ?) -> !0.<i>",
	    "PoolCluster.prototype": {
	      "add": "fn(id: ?, config: ?)",
	      "end": "fn(callback: ?)",
	      "of": "fn(pattern: string, selector: string) -> !this._namespaces.<i>",
	      "remove": "fn(pattern: ?)",
	      "getConnection": "fn(pattern: ?, selector: string, cb: string)",
	      "_clearFindCaches": "fn()",
	      "_decreaseErrorCount": "fn(node: PoolCluster._nodes.<i>)",
	      "_findNodeIds": "fn(pattern: string, includeOffline: bool) -> [string]",
	      "_getNode": "fn(id: string) -> !this._nodes.<i>",
	      "_increaseErrorCount": "fn(node: PoolCluster._nodes.<i>)",
	      "_getConnection": "fn(node: PoolCluster._nodes.<i>, cb: fn(err: +Error, connection: +PoolConnection))",
	      "_removeNode": "fn(node: PoolCluster._nodes.<i>)"
	    },
	    "PoolCluster.prototype._getConnection.!1": "fn(err: +Error, connection: +PoolConnection)",
	    "PacketWriter.prototype": {
	      "toBuffer": "fn(parser: +Parser) -> !this._buffer",
	      "writeUnsignedNumber": "fn(bytes: number, value: number)",
	      "writeFiller": "fn(bytes: number)",
	      "writeNullTerminatedString": "fn(value: string, encoding: ?)",
	      "writeString": "fn(value: string)",
	      "writeBuffer": "fn(value: ?)",
	      "writeLengthCodedNumber": "fn(value: ?)",
	      "writeLengthCodedBuffer": "fn(value: ?)",
	      "writeNullTerminatedBuffer": "fn(value: ?)",
	      "writeLengthCodedString": "fn(value: string)",
	      "_allocate": "fn(bytes: number)"
	    },
	    "Parser.prototype": {
	      "write": "fn(buffer: ?)",
	      "append": "fn(chunk: ?)",
	      "pause": "fn()",
	      "resume": "fn()",
	      "peak": "fn() -> !this._buffer.<i>",
	      "parseUnsignedNumber": "fn(bytes: number) -> !this._buffer.<i>",
	      "parseLengthCodedString": "fn()",
	      "parseLengthCodedBuffer": "fn()",
	      "parseLengthCodedNumber": "fn()",
	      "parseFiller": "fn(length: ?)",
	      "parseNullTerminatedBuffer": "fn()",
	      "parseNullTerminatedString": "fn()",
	      "_nullByteOffset": "fn() -> !this._offset",
	      "parsePacketTerminatedString": "fn()",
	      "parseBuffer": "fn(length: ?)",
	      "parseString": "fn(length: number)",
	      "parseGeometryValue": "fn()",
	      "reachedPacketEnd": "fn() -> bool",
	      "_bytesRemaining": "fn() -> number",
	      "incrementPacketNumber": "fn() -> !this._nextPacketNumber",
	      "resetPacketNumber": "fn()",
	      "packetLength": "fn()",
	      "_combineLongPacketBuffers": "fn()",
	      "_advanceToNextPacket": "fn()"
	    },
	    "Parser.!0": {
	      "onError": "fn(err: ?)",
	      "onPacket": "fn()"
	    },
	    "ClientAuthenticationPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "ComChangeUserPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "ComPingPacket.prototype": {
	      "write": "fn(writer: ?)",
	      "parse": "fn(parser: ?)"
	    },
	    "ComQueryPacket.prototype": {
	      "write": "fn(writer: ?)",
	      "parse": "fn(parser: ?)"
	    },
	    "ComStatisticsPacket.prototype": {
	      "write": "fn(writer: ?)",
	      "parse": "fn(parser: ?)"
	    },
	    "EmptyPacket.prototype": {
	      "write": "fn(writer: ?)"
	    },
	    "EofPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "ErrorPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "Field.prototype": {
	      "string": "fn()",
	      "buffer": "fn()",
	      "geometry": "fn()"
	    },
	    "Field.!0": {},
	    "FieldPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "HandshakeInitializationPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)",
	      "scrambleBuff": "fn() -> LocalDataFilePacket.!0"
	    },
	    "LocalDataFilePacket.prototype": {
	      "write": "fn(writer: ?)"
	    },
	    "LocalDataFilePacket.!0": {},
	    "OkPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "OldPasswordPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "ResultSetHeaderPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "typeCast.!0": "+FieldPacket",
	    "SSLRequestPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "StatisticsPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "UseOldPasswordPacket.prototype": {
	      "parse": "fn(parser: ?)",
	      "write": "fn(writer: ?)"
	    },
	    "Sequence.determinePacket": "fn(byte: ?)",
	    "Sequence.prototype": {
	      "hasErrorHandler": "fn() -> bool",
	      "_packetToError": "fn(packet: ?) -> +Error",
	      "_addLongStackTrace": "fn(err: +Error)",
	      "end": "fn(err: +Error)",
	      "OkPacket": "fn(packet: ?)",
	      "ErrorPacket": "fn(packet: ?)",
	      "start": {
	        "!type": "fn()",
	        "!doc": "Implemented by child classes"
	      },
	      "_onTimeout": "fn()"
	    },
	    "ChangeUser.prototype": {
	      "start": "fn(handshakeInitializationPacket: ?)",
	      "ErrorPacket": "fn(packet: ?)"
	    },
	    "ChangeUser.prototype.start.!0": "+OldPasswordPacket",
	    "Handshake.prototype": {
	      "determinePacket": "fn(firstByte: ?)",
	      "HandshakeInitializationPacket": "fn(packet: ?)",
	      "_tlsUpgradeCompleteHandler": "fn()",
	      "_sendCredentials": "fn(serverHello: ?)",
	      "UseOldPasswordPacket": "fn(packet: ?)",
	      "ErrorPacket": "fn(packet: ?)"
	    },
	    "Ping.prototype": {
	      "start": "fn()"
	    },
	    "Quit.prototype": {
	      "start": "fn()"
	    },
	    "listenerCount.!0": "+Sequence",
	    "Statistics.prototype": {
	      "start": "fn()",
	      "StatisticsPacket": "fn(packet: ?)",
	      "determinePacket": "fn(firstByte: ?, parser: ?)"
	    },
	    "Parser._longPacketBuffers": "[?]",
	    "Parser._offset": "number",
	    "Parser._packetEnd": "number",
	    "Parser._packetHeader": "+PacketHeader",
	    "Parser._packetOffset": "number",
	    "Parser._onError": "fn(err: +Error)",
	    "Parser._onPacket": "fn()",
	    "Parser._nextPacketNumber": "number",
	    "Parser._encoding": "string",
	    "Parser._paused": "bool",
	    "PacketWriter._offset": "number",
	    "ConnectionConfig.host": "string",
	    "ConnectionConfig.port": "number",
	    "ConnectionConfig.connectTimeout": "number",
	    "ConnectionConfig.insecureAuth": "bool",
	    "ConnectionConfig.supportBigNumbers": "bool",
	    "ConnectionConfig.bigNumberStrings": "bool",
	    "ConnectionConfig.dateStrings": "bool",
	    "ConnectionConfig.trace": "bool",
	    "ConnectionConfig.stringifyObjects": "bool",
	    "ConnectionConfig.timezone": {
	      "!type": "string",
	      "!doc": "\"+\" is a url encoded char for space so it gets translated to space when giving a connection string.."
	    },
	    "ConnectionConfig.flags": "string",
	    "ConnectionConfig.pool": "+Pool",
	    "ConnectionConfig.ssl": "bool",
	    "ConnectionConfig.multipleStatements": "bool",
	    "ConnectionConfig.typeCast": "bool",
	    "ConnectionConfig.maxPacketSize": "number",
	    "ConnectionConfig.clientFlags": "number",
	    "Connection.config": "+ConnectionConfig",
	    "Connection._protocol": "+Protocol",
	    "Connection._connectCalled": "bool",
	    "Connection.state": "string",
	    "UseOldPasswordPacket.firstByte": "number",
	    "PoolConnection._purge": "bool",
	    "PoolConnection._connectCalled": "bool",
	    "PoolConnection.state": "string",
	    "PoolConnection._clusterId": "string",
	    "OkPacket.changedRows": "number",
	    "Query.sql": "string",
	    "Query.values": {
	      "sql": "string"
	    },
	    "Query.typeCast": "bool",
	    "Query.nestTables": "bool",
	    "Query._resultSet": "+ResultSet",
	    "Query._results": "[[?]]",
	    "Query._fields": "[[?]]",
	    "Query._index": "number",
	    "Query._callSite": {
	      "!type": "+Error",
	      "!doc": "Long stack trace support"
	    },
	    "Query._ended": "bool",
	    "HandshakeInitializationPacket.serverCapabilities1": "number",
	    "HandshakeInitializationPacket.protocol41": "bool",
	    "Pool.config": "+PoolConfig",
	    "Pool._acquiringConnections": "[+PoolConnection]",
	    "Pool._allConnections": "[+PoolConnection]",
	    "Pool._freeConnections": "[+PoolConnection]",
	    "Pool._connectionQueue": "[fn(err: +Error, conn: +PoolConnection)]",
	    "Pool._connectionQueue.<i>": {
	      "!type": "fn(err: +Error, conn: +PoolConnection)",
	      "!doc": "empty the connection queue"
	    },
	    "Pool._closed": "bool",
	    "PoolConfig.acquireTimeout": "number",
	    "PoolConfig.waitForConnections": "bool",
	    "PoolConfig.connectionLimit": "number",
	    "PoolConfig.queueLimit": "number",
	    "PoolCluster._canRetry": "bool",
	    "PoolCluster._defaultSelector": "string",
	    "PoolCluster._removeNodeErrorCount": "number",
	    "PoolCluster._restoreNodeTimeout": "number",
	    "PoolCluster._closed": "bool",
	    "PoolCluster._findCaches": {
	      "<i>": "[string]"
	    },
	    "PoolCluster._lastId": "number",
	    "PoolCluster._namespaces": {
	      "<i>": "+PoolNamespace"
	    },
	    "PoolCluster._nodes": {
	      "<i>": {
	        "id": "string",
	        "errorCount": "number",
	        "_offlineUntil": "number",
	        "pool": "+Pool"
	      }
	    },
	    "PoolNamespace._cluster": "+PoolCluster",
	    "PoolNamespace._pattern": "string",
	    "FieldPacket.zeroFill": {
	      "!type": "bool",
	      "!doc": "parsed flags"
	    },
	    "Sequence._ended": "bool",
	    "Protocol.readable": "bool",
	    "Protocol.writable": "bool",
	    "Protocol._connection": "+PoolConnection",
	    "Protocol._handshaked": "bool",
	    "Protocol._ended": "bool",
	    "Protocol._destroyed": "bool",
	    "Protocol._queue": "[fn(sql: Query.values, values: Query.values, cb: ?) -> Connection.prototype.query]",
	    "Protocol._parser": "+Parser",
	    "ResultSet.fieldPackets": "[?]",
	    "ResultSet.eofPackets": "[?]",
	    "ResultSet.rows": "[?]",
	    "spliceConnection.!0": {
	      "<i>": "+PoolConnection"
	    }
	  },
	  "ComQuitPacket": "fn(sql: ?)",
	  "ConnectionConfig": "fn(options: ConnectionConfig.!0)",
	  "Protocol": "fn(options: Protocol.!0)",
	  "Query": "fn(options: Query.!0, callback: Query.values)",
	  "Connection": "fn(options: Connection.!0)",
	  "bindToCurrentDomain": "fn(callback: ?) -> !0",
	  "PoolConnection": "fn(pool: +Pool, options: Connection.!0)",
	  "Pool": "fn(options: Pool.!0)",
	  "spliceConnection": "fn(array: [+PoolConnection], connection: +PoolConnection)",
	  "PoolConfig": "fn(options: ConnectionConfig.!0)",
	  "PoolNamespace": {
	    "!type": "fn(cluster: +PoolCluster, pattern: string, selector: string)",
	    "!doc": "* PoolNamespace"
	  },
	  "PoolSelector": {
	    "RR": "fn() -> fn(clusterIds: ?) -> !0.<i>",
	    "RANDOM": "fn() -> fn(clusterIds: ?) -> !0.<i>",
	    "ORDER": "fn() -> fn(clusterIds: ?) -> !0.<i>",
	    "!doc": "* PoolSelector"
	  },
	  "PoolCluster": {
	    "!type": "fn(config: ?)",
	    "!doc": "* PoolCluster"
	  },
	  "getMonotonicMilliseconds": "fn() -> number",
	  "_cb": "fn(err: ?)",
	  "_noop": "fn()",
	  "__changeUser": "fn(options: ?, callback: ?)",
	  "sha1": "fn(msg: ?)",
	  "xor": "fn(a: ?, b: ?)",
	  "PacketHeader": "fn(length: ?, number: ?)",
	  "BIT_16": "number",
	  "BIT_24": "number",
	  "IEEE_754_BINARY_64_PRECISION": {
	    "!type": "number",
	    "!doc": "The maximum precision JS Numbers can hold precisely Don't panic: Good enough to represent byte values up to 8192 TB"
	  },
	  "MAX_PACKET_LENGTH": "number",
	  "PacketWriter": "fn()",
	  "MUL_32BIT": "number",
	  "Parser": "fn(options: Parser.!0)",
	  "ResultSet": "fn(resultSetHeaderPacket: ?)",
	  "zeroPad": "fn(number: ?, length: number) -> !0",
	  "convertTimezone": "fn(tz: ?)",
	  "ClientAuthenticationPacket": "fn(options: ?)",
	  "ComChangeUserPacket": "fn(options: ?)",
	  "ComPingPacket": "fn(sql: ?)",
	  "ComQueryPacket": "fn(sql: ?)",
	  "ComStatisticsPacket": "fn(sql: ?)",
	  "EmptyPacket": "fn()",
	  "EofPacket": "fn(options: ?)",
	  "ErrorPacket": "fn(options: ?)",
	  "Field": "fn(options: Field.!0)",
	  "typeToString": "fn(t: ?)",
	  "FieldPacket": "fn(options: ?)",
	  "HandshakeInitializationPacket": "fn(options: ?)",
	  "LocalDataFilePacket": {
	    "!type": "fn(data: LocalDataFilePacket.!0)",
	    "!doc": "* @param {Buffer} data"
	  },
	  "OkPacket": "fn(options: ?)",
	  "OldPasswordPacket": "fn(options: ?)",
	  "ResultSetHeaderPacket": "fn(options: ?)",
	  "RowDataPacket": "fn()",
	  "parse": "fn(parser: ?, fieldPackets: ?, typeCast: ?, nestTables: ?, connection: ?)",
	  "typeCast": "fn(field: ?, parser: ?, timeZone: ?, supportBigNumbers: ?, bigNumberStrings: ?, dateStrings: ?)",
	  "SSLRequestPacket": "fn(options: ?)",
	  "StatisticsPacket": "fn()",
	  "UseOldPasswordPacket": "fn(options: ?)",
	  "Sequence": "fn(options: ?, callback: ?)",
	  "ChangeUser": "fn(options: ?, callback: ?)",
	  "Handshake": "fn(options: ?, callback: ?)",
	  "Ping": "fn(options: ?, callback: ?)",
	  "Quit": "fn(options: ?, callback: ?)",
	  "listenerCount": "fn(emitter: +Sequence, type: string)",
	  "Statistics": "fn(options: ?, callback: ?)",
	  "Classes": {},
	  "loadClass": {
	    "!type": "fn(className: string)",
	    "!doc": "* Load the given class."
	  },
	  "Error": {
	    "code": {
	      "!type": "string",
	      "!doc": "SSL negotiation error are fatal"
	    },
	    "errorno": "string",
	    "syscall": "string",
	    "fatal": "bool",
	    "offset": "number",
	    "stack": "string"
	  }
	};
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionMySQL", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	completion: getTemplates
	      }
	    };
	});
});