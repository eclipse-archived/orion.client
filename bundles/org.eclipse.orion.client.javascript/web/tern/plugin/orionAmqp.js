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
	/* eslint-disable missing-nls */
		{
			prefix: "amqp",
			name: "amqp",
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for AMQP framework",
			template: "var amqp = require('amqp');\n"
		},
		{
			prefix: "amqp",
			name: "amqp connection",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new AMQP connection ",
			template: "var amqp = require('amqp');\n" +
					  "var ${connection} = amqp.createConnection({\n" +  
					  "\thost: ${host},\n" + 
					  "\tport: ${port},\n" + 
					  "\tlogin: ${login},\n" + 
					  "\tpassword: ${password}\n" + 
					  "});\n"
		},
		{
			prefix: "amqp",
			name: "amqp on",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new AMQP connection on statement",
			template: "${connection}.on(${event}, function() {\n" +  
					  "\t${cursor}\n" + 
					  "});\n"
		},
		{
			prefix: "amqp",
			name: "amqp queue",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new AMQP connection queue statement",
			template: "${connection}.queue(${id}, function(queue) {\n" + 
					  "\tqueue.bind(\'#\'); //catch all messages\n" +
					  "\tqueue.subscribe(function (message, headers, deliveryInfo) {\n" +
					  "\t\t// Receive messages\n" +
					  "\t});\n" +
					  "\t${cursor}\n" + 
					  "});\n"
		},
		{
			prefix: "amqp",
			name: "amqp exchange",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new AMQP connection exchange",
			template: "var exchange = ${connection}.exchange(${id}, {type: \'topic\'}, function(exchange) {\n" +  
					  "\t${cursor}\n" + 
					  "});\n"
		}
		/* eslint-enable missing-nls */
	];
	
	/**
	 * @description Gets the templates that apply to given context
	 * @since 9.0
	 * @callback
	 */
	function getTemplates(file, start, end, completions) {
		var wordEnd = tern.resolvePos(file, end);
		var expr = infer.findExpressionAround(file.ast, null, wordEnd, file.scope);
		var tmps = resolver.getTemplatesForNode(templates, expr);
		if(tmps && tmps.length > 0) {
			for (var i = 0; i < tmps.length; i++) {
				var _t = tmps[i];
				_t.origin = 'amqp'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	} 
	
	/* eslint-enable missing-nls */
	tern.registerPlugin("orionAmqp", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	variableCompletion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
		  "!name": "amqp",
		  "!define": {
		  	"!node": {
		  		"amqp": {
			  		"Connection": "Connection",
			  		"createConnection": "fn(options: Object, implOptions: Object, readyCallback: fn()) -> +Connection"
		  		}
		  	},
		    "Exchange.!3": {
		      "type": "string"
		    },
		    "createExchangeErrorHandlerFor.!ret": "fn(err: ?)",
		    "Connection.prototype._bodyToBuffer.!ret": "[Connection.prototype._bodyToBuffer.!ret.<i>]",
		    "Connection.prototype._bodyToBuffer.!ret.<i>": {
		      "contentType": "string"
		    },
		    "Connection.prototype._parseURLOptions.!ret": {
		      "ssl": {
		        "enabled": "bool"
		      }
		    },
		    "Connection.prototype._sendHeader.!2": {
		      "reserved1": "number",
		      "routingKey": "string",
		      "noWait": "bool"
		    },
		    "serializer.serializeFields.!2": {
		      "reserved1": "number",
		      "routingKey": "string",
		      "noWait": "bool"
		    },
		    "Queue.prototype.subscribeRaw.!0": {
		      "state": "string"
		    },
		    "Message.!1": {
		      "parseError": "+Error",
		      "rawData": "string"
		    },
		    "parseTable.!ret": {
		      "!doc": "XXX check if bitIndex greater than 7?"
		    },
		    "parseFields.!1": "[?]",
		    "parseFields.!ret": {}
		  },
		  "methods": {
		    "<i>": {
		      "!doc": "debug(name);"
		    },
		    "!doc": "methods keyed on their name"
		  },
		  "Channel": {
		    "prototype": {
		      "closeOK": "fn()",
		      "reconnect": "fn()",
		      "_taskPush": "fn(reply: ?, cb: ?)",
		      "_tasksFlush": "fn()",
		      "_handleTaskReply": "fn(channel: ?, method: ?, args: ?) -> bool",
		      "_onChannelMethod": "fn(channel: ?, method: ?, args: ?)",
		      "close": "fn(reason: ?)"
		    },
		    "!type": "fn(connection: +Connection, channel: number)",
		    "!doc": "This class is not exposed to the user."
		  },
		  "Exchange": {
		    "prototype": {
		      "_onMethod": "fn(channel: ?, method: ?, args: ?) -> bool",
		      "publish": {
		        "!type": "fn(routingKey: ?, data: ?, options: ?, callback: ?)",
		        "!doc": "exchange.publish('routing.key', 'body'); the third argument can specify additional options - mandatory (boolean, default false) - immediate (boolean, default false) - contentType (default 'application/octet-stream') - contentEncoding - headers - deliveryMode - priority (0-9) - correlationId - replyTo - expiration - messageId - timestamp - userId - appId - clusterId the callback is optional and is only used when confirm is turned on for the exchange"
		      },
		      "_awaitConfirm": {
		        "!type": "fn(task: ?, callback: ?)",
		        "!doc": "registers tasks for confirms"
		      },
		      "cleanup": {
		        "!type": "fn()",
		        "!doc": "do any necessary cleanups eg."
		      },
		      "destroy": "fn(ifUnused: ?)",
		      "unbind": "fn()",
		      "bind": "fn()",
		      "bind_headers": "fn()"
		    },
		    "!type": "fn(connection: +Connection, channel: number, name: ?, options: Exchange.!3, openCallback: ?)",
		    "binds": "number",
		    "exchangeBinds": "number",
		    "sourceExchanges": {
		      "<i>": "+Exchange"
		    },
		    "_sequence": "number",
		    "_unAcked": {},
		    "_addedExchangeErrorHandler": "bool",
		    "state": "string",
		    "channel": "number",
		    "connection": "+Connection",
		    "_tasks": "[?]"
		  },
		  "createExchangeErrorHandlerFor": {
		    "!type": "fn(exchange: +Exchange) -> fn(err: ?)",
		    "!doc": "creates an error handler scoped to the given `exchange`"
		  },
		  "Connection": {
		    "prototype": {
		      "setOptions": "fn(options: ?)",
		      "setImplOptions": "fn(options: ?)",
		      "connect": "fn()",
		      "reconnect": "fn()",
		      "disconnect": "fn()",
		      "addAllListeners": "fn()",
		      "heartbeat": "fn()",
		      "exchange": {
		        "!type": "fn(name: ?, options: Exchange.!3, openCallback: ?) -> +Exchange",
		        "!doc": "connection.exchange('my-exchange', { type: 'topic' }); Options - type 'fanout', 'direct', or 'topic' (default) - passive (boolean) - durable (boolean) - autoDelete (boolean, default true)"
		      },
		      "exchangeClosed": {
		        "!type": "fn(name: ?)",
		        "!doc": "remove an exchange when it's closed (called from Exchange)"
		      },
		      "queue": {
		        "!type": "fn(name: ?) -> +Queue",
		        "!doc": "Options - passive (boolean) - durable (boolean) - exclusive (boolean) - autoDelete (boolean, default true)"
		      },
		      "queueClosed": {
		        "!type": "fn(name: ?)",
		        "!doc": "remove a queue when it's closed (called from Queue)"
		      },
		      "publish": {
		        "!type": "fn(routingKey: ?, body: ?, options: ?, callback: ?)",
		        "!doc": "Publishes a message to the default exchange."
		      },
		      "_bodyToBuffer": "fn(body: ?) -> [?]",
		      "_inboundHeartbeatTimerReset": "fn()",
		      "_outboundHeartbeatTimerReset": "fn()",
		      "_saslResponse": "fn() -> ?|string",
		      "_onMethod": "fn(channel: number, method: methods.<i>, args: parseFields.!ret)",
		      "_parseURLOptions": {
		        "!type": "fn(connectionString: ?) -> Connection.prototype._parseURLOptions.!ret",
		        "!doc": "Generate connection options from URI string formatted with amqp scheme."
		      },
		      "_chooseHost": {
		        "!type": "fn() -> !this.options.host",
		        "!doc": "If you pass a array of hosts, lets choose a random host or the preferred host number, or then next one."
		      },
		      "_createSocket": "fn()",
		      "end": "fn()",
		      "_getSSLOptions": "fn() -> !this.sslConnectionOptions",
		      "_startHandshake": {
		        "!type": "fn()",
		        "!doc": "Time to start the AMQP 7-way connection initialization handshake! 1."
		      },
		      "_sendBody": {
		        "!type": "fn(channel: number, body: ?, properties: ?)",
		        "!doc": "Parse helpers "
		      },
		      "_sendHeader": {
		        "!type": "fn(channel: number, size: ?, properties: ?)",
		        "!doc": "connection: the connection channel: the channel to send this on size: size in bytes of the following message properties: an object containing any of the following: - contentType (default 'application/octet-stream') - contentEncoding - headers - deliveryMode - priority (0-9) - correlationId - replyTo - expiration - messageId - timestamp - userId - appId - clusterId"
		      },
		      "_sendMethod": "fn(channel: number, method: ?, args: ?)",
		      "generateChannelId": {
		        "!type": "fn() -> !this.channelCounter",
		        "!doc": "tries to find the next available id slot for a channel"
		      }
		    },
		    "!type": "fn(connectionArgs: ?, options: ?, readyCallback: ?)",
		    "connectionAttemptScheduled": {
		      "!type": "bool",
		      "!doc": "Set to false, so that if we fail in the reconnect attempt, we can schedule another one."
		    },
		    "_defaultExchange": "+Exchange",
		    "channelCounter": "number",
		    "_blocked": "bool",
		    "channels": {
		      "!doc": "In the case where this is a reconnection, do not trample on the existing channels.",
		      "<i>": "+Queue"
		    },
		    "exchanges": {
		      "<i>": "+Exchange"
		    },
		    "parser": {
		      "!type": "+AMQPParser",
		      "!doc": "Reset parser state"
		    },
		    "readyEmitted": {
		      "!type": "bool",
		      "!doc": "Set 'ready' flag for auth failure detection."
		    },
		    "hosti": {
		      "!type": "number",
		      "!doc": "If this is already set, it looks like we want to choose another one."
		    },
		    "<i>": "fn()",
		    "sslConnectionOptions": {}
		  },
		  "serializer": {
		    "serializeFloat": "fn(b: ?, size: number, value: ?, bigEndian: ?)",
		    "serializeInt": "fn(b: ?, size: number, int: number)",
		    "serializeShortString": "fn(b: ?, string: ?)",
		    "serializeLongString": "fn(b: ?, string: ?)",
		    "serializeDate": "fn(b: ?, date: ?)",
		    "serializeBuffer": "fn(b: ?, buffer: ?)",
		    "serializeBase64": "fn(b: ?, buffer: ?)",
		    "isBigInt": "fn(value: ?) -> bool",
		    "getCode": "fn(dec: ?) -> string",
		    "isFloat": "fn(value: ?) -> bool",
		    "serializeValue": "fn(b: ?, value: ?)",
		    "serializeTable": "fn(b: ?, object: ?)",
		    "serializeArray": "fn(b: ?, arr: ?)",
		    "serializeFields": "fn(buffer: ?, fields: ?, args: ?, strict: bool)"
		  },
		  "methodTable": {
		    "<i>": {
		      "<i>": "methods.<i>"
		    },
		    "!doc": "a look up table for methods recieved indexed on class id, method id"
		  },
		  "classes": {
		    "!doc": "classes keyed on their index"
		  },
		  "Queue": {
		    "prototype": {
		      "subscribeRaw": "fn(options: Queue.consumerTagListeners.<i>, messageListener: Queue.consumerTagListeners.<i>)",
		      "unsubscribe": "fn(consumerTag: ?)",
		      "subscribe": "fn(options: ?, messageListener: ?)",
		      "shift": {
		        "!type": "fn(reject: ?, requeue: ?)",
		        "!doc": "Acknowledges the last message"
		      },
		      "bind": "fn(exchange: string, routingKey: string, callback: string)",
		      "unbind": "fn(exchange: string, routingKey: string)",
		      "bind_headers": "fn()",
		      "unbind_headers": "fn()",
		      "destroy": "fn(options: ?)",
		      "purge": "fn()",
		      "_onMethod": "fn(channel: ?, method: ?, args: ?)",
		      "_onContentHeader": "fn(channel: number, classInfo: ?, weight: number, properties: parseFields.!ret, size: number)",
		      "_onContent": "fn(channel: number, data: ?)",
		      "flow": "fn(active: ?)",
		      "subscribeJSON": "Queue.prototype.subscribe"
		    },
		    "!type": "fn(connection: +Connection, channel: number, name: ?, options: ?, callback: ?)",
		    "name": "string",
		    "_bindings": {
		      "<i>": {
		        "<i>": "number"
		      }
		    },
		    "consumerTagListeners": {
		      "<i>": {
		        "state": "string"
		      }
		    },
		    "consumerTagOptions": {
		      "<i>": "Queue.consumerTagListeners.<i>"
		    },
		    "options": {
		      "autoDelete": "bool",
		      "closeChannelOnUnsubscribe": "bool"
		    },
		    "state": "string",
		    "_bindCallback": "string",
		    "_sequence": "number",
		    "confirm": "bool",
		    "currentMessage": "+Message"
		  },
		  "AMQPParser": {
		    "prototype": {
		      "throwError": {
		        "!type": "fn(error: string)",
		        "!doc": "If there's an error in the parser, call the onError handler or throw"
		      },
		      "execute": {
		        "!type": "fn(data: ?)",
		        "!doc": "Everytime data is recieved on the socket, pass it to this function for parsing."
		      },
		      "_parseMethodFrame": "fn(channel: number, buffer: ?)",
		      "_parseHeaderFrame": "fn(channel: number, buffer: ?)"
		    },
		    "!type": "fn(version: string, type: string)",
		    "!doc": "An interruptible AMQP parser.",
		    "isClient": "bool",
		    "state": "string",
		    "parse": "fn(data: ?) -> AMQPParser.parse",
		    "onMethod": "fn(channel: number, method: methods.<i>, args: parseFields.!ret)",
		    "onContent": "fn(channel: number, data: ?)",
		    "onContentHeader": "fn(channel: number, classInfo: ?, weight: number, properties: parseFields.!ret, size: number)",
		    "onHeartBeat": "fn()",
		    "onError": "fn(e: string)"
		  },
		  "maxFrameBuffer": {
		    "!type": "number",
		    "!doc": "parser"
		  },
		  "channelMax": {
		    "!type": "number",
		    "!doc": "copying qpid)"
		  },
		  "defaultPorts": {
		    "amqp": "number",
		    "amqps": "number"
		  },
		  "defaultOptions": {
		    "host": "string",
		    "port": "number",
		    "login": "string",
		    "password": "string",
		    "authMechanism": "string",
		    "vhost": "string",
		    "connectionTimeout": "number",
		    "ssl": {
		      "enabled": "bool"
		    }
		  },
		  "defaultSslOptions": {
		    "port": "number",
		    "ssl": {
		      "rejectUnauthorized": "bool"
		    }
		  },
		  "defaultImplOptions": {
		    "defaultExchangeName": "string",
		    "reconnect": "bool",
		    "reconnectBackoffStrategy": "string",
		    "reconnectExponentialLimit": "number",
		    "reconnectBackoffTime": "number"
		  },
		  "defaultClientProperties": {
		    "platform": "string",
		    "product": "string"
		  },
		  "Message": {
		    "prototype": {
		      "acknowledge": {
		        "!type": "fn(all: ?)",
		        "!doc": "Acknowledge receipt of message."
		      },
		      "reject": {
		        "!type": "fn(requeue: ?)",
		        "!doc": "Reject an incoming message."
		      }
		    },
		    "!type": "fn(queue: +Queue, args: ?)",
		    "!doc": "Properties: - routingKey - size - deliveryTag - contentType (default 'application/octet-stream') - contentEncoding - headers - deliveryMode - priority (0-9) - correlationId - replyTo - experation - messageId - timestamp - userId - appId - clusterId",
		    "queue": "+Queue",
		    "read": "number",
		    "size": "number"
		  },
		  "parseShortString": "fn(buffer: ?)",
		  "parseLongString": "fn(buffer: ?)",
		  "parseSignedInteger": "fn(buffer: ?) -> !0.<i>",
		  "parseValue": "fn(buffer: ?) -> !0.<i>",
		  "parseTable": "fn(buffer: ?) -> parseTable.!ret",
		  "parseFields": "fn(buffer: ?, fields: [?]) -> parseFields.!ret",
		  "Error": {
		    "name": "string"
		  },
		  "createConnection": "fn(options: Object, implOptions: Object, readyCallback: fn()) -> +Connection"
		};
});