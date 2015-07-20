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
			prefix: "redis",
			name: "redis",
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for Redis",
			template: "var ${name} = require('redis');\n"
		},
		{
			prefix: "redis",
			name: "redis client",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client",
			template: "var ${name} = require('redis');\n" +
					  "var ${client} = ${name}.createClient(${port}, ${host}, ${options});\n"
		},
		{
			prefix: "redis",
			name: "redis connect",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client and connect",
			template: "var ${name} = require('redis');\n" +
					  "var ${client} = ${name}.createClient(${port}, ${host}, ${options});\n" + 
				  "try {\n" + 
					  "\t${cursor}\n"+ 
					  "} finally {\n"+ 
					  "\t${client}.close();\n"+ 
				  "}\n"
		},
		{
			prefix: "redis",
			name: "redis set",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client set call",
			template: "client.set(${key}, ${value});\n"
		},
		{
			prefix: "redis",
			name: "redis get",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client get call",
			template: "client.get(${key}, function(${error}, ${reply}) {\n"+ 
					  "\t${cursor}\n" + 
					  "});\n"
		},
		{
			prefix: "redis",
			name: "redis on",
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client event handler",
			template: "client.on(${event}, function(${arg}) {\n"+ 
					  "\t${cursor}" + 
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
				_t.origin = 'redis'; //$NON-NLS-1$
				_t.type = 'template'; //$NON-NLS-1$
				completions.push(_t);
			}
	    }
	} 
	
	tern.registerPlugin("orionRedis", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {
	      defs : defs,
	      passes: {
	      	variableCompletion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
		"!name": "redis",
		"!define": {
			"!node": {
				"redis": {
					"createClient": "fn(port_arg: number, host_arg?: string, options?: ClientOpts) -> RedisClient",
					"print": "fn(err: Error, reply: ?)",
					"debug_mode": "bool",
					"ClientOpts": "redis.ClientOpts"
				}
			}
		},
	    "ClientOpts": {
	      "parser": "string",
	      "return_buffers": "bool",
	      "detect_buffers": "bool",
	      "socket_nodelay": "bool",
	      "no_ready_check": "bool",
	      "enable_offline_queue": "bool",
	      "retry_max_delay": "number",
	      "connect_timeout": "number",
	      "max_attempts": "number",
	      "auth_pass": "string"
	    },
	    "RedisClient": {
	      "connected": "bool",
	      "retry_delay": "number",
	      "retry_backoff": "number",
	      "command_queue": "[?]",
	      "offline_queue": "[?]",
	      "server_info": "ServerInfo",
	      "end": "fn()",
	      "auth": "fn(password: string, callback?: ?)",
	      "ping": "fn(callback?: ?)",
	      "append": "fn(key: string, value: string, callback?: ?)",
	      "bitcount": "fn(key: string, callback?: ?)",
	      "set": "fn(key: string, value: string, callback?: ?)",
	      "get": "fn(key: string, callback?: ?)",
	      "exists": "fn(key: string, value: string, callback?: ?)",
	      "publish": "fn(channel: string, value: ?)",
	      "subscribe": "fn(channel: string)",
	      "setnx": "fn(args: [?], callback?: ?)",
	      "setex": "fn(args: [?], callback?: ?)",
	      "strlen": "fn(args: [?], callback?: ?)",
	      "del": "fn(args: [?], callback?: ?)",
	      "setbit": "fn(args: [?], callback?: ?)",
	      "getbit": "fn(args: [?], callback?: ?)",
	      "setrange": "fn(args: [?], callback?: ?)",
	      "getrange": "fn(args: [?], callback?: ?)",
	      "substr": "fn(args: [?], callback?: ?)",
	      "incr": "fn(args: [?], callback?: ?)",
	      "decr": "fn(args: [?], callback?: ?)",
	      "mget": "fn(args: [?], callback?: ?)",
	      "rpush": "fn(args: [?])",
	      "lpush": "fn(args: [?], callback?: ?)",
	      "rpushx": "fn(args: [?], callback?: ?)",
	      "lpushx": "fn(args: [?], callback?: ?)",
	      "linsert": "fn(args: [?], callback?: ?)",
	      "rpop": "fn(args: [?], callback?: ?)",
	      "lpop": "fn(args: [?], callback?: ?)",
	      "brpop": "fn(args: [?], callback?: ?)",
	      "brpoplpush": "fn(args: [?], callback?: ?)",
	      "blpop": "fn(args: [?], callback?: ?)",
	      "llen": "fn(args: [?], callback?: ?)",
	      "lindex": "fn(args: [?], callback?: ?)",
	      "lset": "fn(args: [?], callback?: ?)",
	      "lrange": "fn(args: [?], callback?: ?)",
	      "ltrim": "fn(args: [?], callback?: ?)",
	      "lrem": "fn(args: [?], callback?: ?)",
	      "rpoplpush": "fn(args: [?], callback?: ?)",
	      "sadd": "fn(args: [?], callback?: ?)",
	      "srem": "fn(args: [?], callback?: ?)",
	      "smove": "fn(args: [?], callback?: ?)",
	      "sismember": "fn(args: [?], callback?: ?)",
	      "scard": "fn(args: [?], callback?: ?)",
	      "spop": "fn(args: [?], callback?: ?)",
	      "srandmember": "fn(args: [?], callback?: ?)",
	      "sinter": "fn(args: [?], callback?: ?)",
	      "sinterstore": "fn(args: [?], callback?: ?)",
	      "sunion": "fn(args: [?], callback?: ?)",
	      "sunionstore": "fn(args: [?], callback?: ?)",
	      "sdiff": "fn(args: [?], callback?: ?)",
	      "sdiffstore": "fn(args: [?], callback?: ?)",
	      "smembers": "fn(args: [?], callback?: ?)",
	      "zadd": "fn(args: [?], callback?: ?)",
	      "zincrby": "fn(args: [?], callback?: ?)",
	      "zrem": "fn(args: [?], callback?: ?)",
	      "zremrangebyscore": "fn(args: [?], callback?: ?)",
	      "zremrangebyrank": "fn(args: [?], callback?: ?)",
	      "zunionstore": "fn(args: [?], callback?: ?)",
	      "zinterstore": "fn(args: [?], callback?: ?)",
	      "zrange": "fn(args: [?], callback?: ?)",
	      "zrangebyscore": "fn(args: [?], callback?: ?)",
	      "zrevrangebyscore": "fn(args: [?], callback?: ?)",
	      "zcount": "fn(args: [?], callback?: ?)",
	      "zrevrange": "fn(args: [?], callback?: ?)",
	      "zcard": "fn(args: [?], callback?: ?)",
	      "zscore": "fn(args: [?], callback?: ?)",
	      "zrank": "fn(args: [?], callback?: ?)",
	      "zrevrank": "fn(args: [?], callback?: ?)",
	      "hset": "fn(args: [?], callback?: ?)",
	      "hsetnx": "fn(args: [?], callback?: ?)",
	      "hget": "fn(args: [?], callback?: ?)",
	      "hmset": "fn(args: [?], callback?: ?)",
	      "hmget": "fn(args: [?], callback?: ?)",
	      "hincrby": "fn(args: [?], callback?: ?)",
	      "hdel": "fn(args: [?], callback?: ?)",
	      "hlen": "fn(args: [?], callback?: ?)",
	      "hkeys": "fn(args: [?], callback?: ?)",
	      "hvals": "fn(args: [?], callback?: ?)",
	      "hgetall": "fn(args: [?], callback?: ?)",
	      "hexists": "fn(args: [?], callback?: ?)",
	      "incrby": "fn(args: [?], callback?: ?)",
	      "decrby": "fn(args: [?], callback?: ?)",
	      "getset": "fn(args: [?], callback?: ?)",
	      "mset": "fn(args: [?], callback?: ?)",
	      "msetnx": "fn(args: [?], callback?: ?)",
	      "randomkey": "fn(args: [?], callback?: ?)",
	      "select": "fn(args: [?], callback?: ?)",
	      "move": "fn(args: [?], callback?: ?)",
	      "rename": "fn(args: [?], callback?: ?)",
	      "renamenx": "fn(args: [?], callback?: ?)",
	      "expire": "fn(args: [?], callback?: ?)",
	      "expireat": "fn(args: [?], callback?: ?)",
	      "keys": "fn(args: [?], callback?: ?)",
	      "dbsize": "fn(args: [?], callback?: ?)",
	      "echo": "fn(args: [?], callback?: ?)",
	      "save": "fn(args: [?], callback?: ?)",
	      "bgsave": "fn(args: [?], callback?: ?)",
	      "bgrewriteaof": "fn(args: [?], callback?: ?)",
	      "shutdown": "fn(args: [?], callback?: ?)",
	      "lastsave": "fn(args: [?], callback?: ?)",
	      "type": "fn(args: [?], callback?: ?)",
	      "multi": "fn(args: [?], callback?: ?)",
	      "exec": "fn(args: [?], callback?: ?)",
	      "discard": "fn(args: [?], callback?: ?)",
	      "sync": "fn(args: [?], callback?: ?)",
	      "flushdb": "fn(args: [?], callback?: ?)",
	      "flushall": "fn(args: [?], callback?: ?)",
	      "sort": "fn(args: [?], callback?: ?)",
	      "info": "fn(args: [?], callback?: ?)",
	      "monitor": "fn(args: [?], callback?: ?)",
	      "ttl": "fn(args: [?], callback?: ?)",
	      "persist": "fn(args: [?], callback?: ?)",
	      "slaveof": "fn(args: [?], callback?: ?)",
	      "debug": "fn(args: [?], callback?: ?)",
	      "config": "fn(args: [?], callback?: ?)",
	      "unsubscribe": "fn(args: [?], callback?: ?)",
	      "psubscribe": "fn(args: [?], callback?: ?)",
	      "punsubscribe": "fn(args: [?], callback?: ?)",
	      "watch": "fn(args: [?], callback?: ?)",
	      "unwatch": "fn(args: [?], callback?: ?)",
	      "cluster": "fn(args: [?], callback?: ?)",
	      "restore": "fn(args: [?], callback?: ?)",
	      "migrate": "fn(args: [?], callback?: ?)",
	      "dump": "fn(args: [?], callback?: ?)",
	      "object": "fn(args: [?], callback?: ?)",
	      "client": "fn(args: [?], callback?: ?)",
	      "eval": "fn(args: [?], callback?: ?)",
	      "evalsha": "fn(args: [?], callback?: ?)",
	      "quit": "fn(args: [?], callback?: ?)"
	    },
	    "createClient": "fn(port_arg: number, host_arg?: string, options?: ClientOpts) -> RedisClient",
	    "print": "fn(err: Error, reply: ?)",
	    "debug_mode": "bool",
	    "MessageHandler": {},
	    "ServerInfo": {
	      "redis_version": "string",
	      "versions": "[number]"
	    }
		};
});