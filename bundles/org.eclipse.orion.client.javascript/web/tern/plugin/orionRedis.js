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
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - Node.js require statement for Redis", //$NON-NLS-0$
			template: "var ${name} = require('redis');\n" //$NON-NLS-0$
		},
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis client", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client", //$NON-NLS-0$
			template: "var ${name} = require('redis');\n" + //$NON-NLS-0$
					  "var ${client} = ${name}.createClient(${port}, ${host}, ${options});\n"  //$NON-NLS-0$
		},
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis connect", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client and connect", //$NON-NLS-0$
			template: "var ${name} = require('redis');\n" + //$NON-NLS-0$
					  "var ${client} = ${name}.createClient(${port}, ${host}, ${options});\n" +  //$NON-NLS-0$
				  "try {\n" +  //$NON-NLS-0$
					  "\t${cursor}\n"+  //$NON-NLS-0$
					  "} finally {\n"+  //$NON-NLS-0$
					  "\t${client}.close();\n"+  //$NON-NLS-0$
				  "}\n" //$NON-NLS-1$
		},
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis set", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client set call", //$NON-NLS-0$
			template: "client.set(${key}, ${value});\n" //$NON-NLS-0$
		},
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis get", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client get call", //$NON-NLS-0$
			template: "client.get(${key}, function(${error}, ${reply}) {\n"+  //$NON-NLS-0$
					  "\t${cursor}\n" +  //$NON-NLS-0$
					  "});\n" //$NON-NLS-0$
		},
		{
			prefix: "redis", //$NON-NLS-0$
			name: "redis on", //$NON-NLS-0$
			nodes: {top:true, member:false, prop:false},
			description: " - create a new Redis client event handler", //$NON-NLS-0$
			template: "client.on(${event}, function(${arg}) {\n"+  //$NON-NLS-0$
					  "\t${cursor}" +  //$NON-NLS-0$
					  "});\n" //$NON-NLS-0$
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
	      	completion: getTemplates
	      }
	    };
	});
	
	/* eslint-disable missing-nls */
	var defs = {
	  "!name": "redis",
	  "!define": {
	    "RedisClient.prototype": {
	      "initialize_retry_vars": "fn()",
	      "unref": "fn()",
	      "flush_and_error": {
	        "!type": "fn(message: string)",
	        "!doc": "flush offline_queue and command_queue, erroring any items with a callback first"
	      },
	      "on_error": "fn(msg: ?)",
	      "do_auth": "fn()",
	      "on_connect": "fn()",
	      "init_parser": "fn()",
	      "on_ready": "fn()",
	      "on_info_cmd": "fn(err: ?, res: ?)",
	      "ready_check": "fn()",
	      "send_offline_queue": "fn()",
	      "connection_gone": "fn(why: string)",
	      "on_data": "fn(data: ?)",
	      "return_error": "fn(err: +Error)",
	      "return_reply": "fn(reply: try_callback.!2)",
	      "send_command": "fn(command: string, args: ?, callback: ?) -> !2",
	      "pub_sub_command": "fn(command_obj: +Command)",
	      "end": "fn()",
	      "<i>": "fn(args: ?, callback: ?)",
	      "select": {
	        "!type": "fn(db: ?, callback: ?)",
	        "!doc": "store db in this.select_db to restore it on reconnect"
	      },
	      "auth": {
	        "!type": "fn()",
	        "!doc": "TODO - need a better way to test auth, maybe auto-config a local Redis server or something."
	      },
	      "hmget": "fn(arg1: ?, arg2: ?, arg3: ?)",
	      "hmset": "fn(args: [string], callback: string) -> string",
	      "multi": "fn(args: ?) -> +Multi",
	      "MULTI": "fn(args: ?) -> +Multi",
	      "SELECT": "RedisClient.prototype.select",
	      "AUTH": "RedisClient.prototype.auth",
	      "HMGET": "RedisClient.prototype.hmget",
	      "HMSET": "RedisClient.prototype.hmset",
	      "eval": "eval_orig",
	      "EVAL": "eval_orig"
	    },
	    "RedisClient.prototype.pub_sub_command.!0": "+Command",
	    "RedisClient.prototype.hmset.!0": "[string]",
	    "RedisClient.prototype.multi.!ret": "+Multi",
	    "RedisClient.!1": {
	      "socket_nodelay": "bool"
	    },
	    "try_callback.!2": {
	      "!doc": "If detect_buffers option was specified, then the reply from the parser will be Buffers."
	    },
	    "Multi.prototype": {
	      "<i>": "fn() -> !this",
	      "hmset": "fn() -> !this",
	      "exec": "fn(callback: ?) -> fn(err: +Error, replies: ?)",
	      "HMSET": "Multi.prototype.hmset",
	      "EXEC": "Multi.prototype.exec"
	    },
	    "Multi.prototype.exec.!ret": "fn(err: +Error, replies: ?)",
	    "set_union.!0": "[string]",
	    "Test.prototype": {
	      "run": "fn(callback: fn())",
	      "new_client": "fn(id: number)",
	      "on_clients_ready": "fn()",
	      "fill_pipeline": "fn()",
	      "stop_clients": "fn()",
	      "send_next": "fn()",
	      "print_stats": "fn()"
	    },
	    "Test.prototype.run.!0": "fn()",
	    "Test.!0": {
	      "descr": "string",
	      "command": "string",
	      "args": "[string]",
	      "pipeline": "number"
	    },
	    "server_version_at_least.!1": "[number]",
	    "require_number.!ret": "fn(err: ?, results: ?) -> bool",
	    "require_number_any.!ret": "fn(err: ?, results: ?) -> bool",
	    "require_number_pos.!ret": "fn(err: ?, results: ?) -> bool",
	    "require_string.!ret": "fn(err: ?, results: ?) -> bool",
	    "require_null.!ret": "fn(err: ?, results: ?) -> bool",
	    "require_error.!ret": "fn(err: ?, results: ?) -> bool",
	    "last.!ret": "fn(err: ?, results: ?)",
	    "with_timeout.!1": "fn(err: ?, results: ?)",
	    "with_timeout.!ret": "fn()",
	    "Command.command": "string",
	    "Command.sub_command": "bool",
	    "Command.buffer_args": "bool",
	    "Multi._client": "+RedisClient",
	    "Multi.queue": "[[string]]",
	    "Multi.queue.<i>": "[string]",
	    "RedisClient.options": {
	      "socket_nodelay": "bool"
	    },
	    "RedisClient.connection_id": "number",
	    "RedisClient.connected": "bool",
	    "RedisClient.ready": "bool",
	    "RedisClient.connections": "number",
	    "RedisClient.should_buffer": "bool",
	    "RedisClient.command_queue_high_water": "number",
	    "RedisClient.command_queue_low_water": "number",
	    "RedisClient.max_attempts": "number",
	    "RedisClient.commands_sent": "number",
	    "RedisClient.enable_offline_queue": "bool",
	    "RedisClient.pub_sub_mode": "bool",
	    "RedisClient.subscription_set": {
	      "<i>": "bool"
	    },
	    "RedisClient.monitoring": "bool",
	    "RedisClient.closing": "bool",
	    "RedisClient.server_info": {
	      "versions": "[number]",
	      "!doc": "expose info key/vals to users"
	    },
	    "RedisClient.old_state": {
	      "monitoring": "bool",
	      "pub_sub_mode": "bool"
	    },
	    "RedisClient.retry_timer": "number",
	    "RedisClient.retry_totaltime": "number",
	    "RedisClient.retry_delay": "number",
	    "RedisClient.retry_backoff": "number",
	    "RedisClient.attempts": "number",
	    "RedisClient.send_anyway": "bool",
	    "RedisClient.emitted_end": "bool",
	    "RedisClient.port": "number",
	    "RedisClient.host": "string"
	  },
	  "is_whitespace": "fn(s: ?) -> bool",
	  "parseInt10": "fn(s: ?) -> number",
	  "humanize_diff": {
	    "!type": "fn(num: number, unit: string)",
	    "!doc": "green if greater than 0, red otherwise"
	  },
	  "command_name": "fn(words: ?)",
	  "prettyCurrentTime": "fn() -> string",
	  "write_file": "fn(commands: ?, path: string)",
	  "parsers": "[?]",
	  "commands": {
	    "!type": "[string]",
	    "!doc": "This static list of commands is updated from time to time."
	  },
	  "connection_id": "number",
	  "default_port": "number",
	  "default_host": "string",
	  "arraySlice": "fn(from: number, to?: number) -> !this",
	  "trace": "fn()",
	  "err": "+Error",
	  "RedisClient": "fn(stream: ?, options: RedisClient.options)",
	  "try_callback": {
	    "!type": "fn(client: +RedisClient, callback: ?, reply: try_callback.!2)",
	    "!doc": "if a callback throws an exception, re-throw it on a new stack so the parser can keep going."
	  },
	  "reply_to_object": {
	    "!type": "fn(reply: try_callback.!2) -> try_callback.!2",
	    "!doc": "hgetall converts its replies to an Object."
	  },
	  "reply_to_strings": "fn(reply: try_callback.!2) -> !0",
	  "Command": {
	    "!type": "fn(command: string, args: ?, sub_command: bool, buffer_args: bool, callback: ?)",
	    "!doc": "This Command constructor is ever so slightly faster than using an object literal, but more importantly, using a named constructor helps it show up meaningfully in the V8 CPU profiler and in heap snapshots."
	  },
	  "Multi": "fn(client: +RedisClient, args: ?)",
	  "set_union": {
	    "!type": "fn(seta: [string], setb: ?) -> [string]",
	    "!doc": "take 2 arrays and return the union of their elements"
	  },
	  "eval_orig": {
	    "!type": "fn()",
	    "!doc": "stash original eval method"
	  },
	  "num_clients": "number",
	  "num_requests": "number",
	  "versions_logged": "bool",
	  "client_options": {
	    "return_buffers": "bool"
	  },
	  "small_str": "string",
	  "large_str": "string",
	  "lpad": "fn(input: ?, len: number, chr: string) -> string",
	  "Test": "fn(args: Test.!0)",
	  "next": "fn(name: string)",
	  "PORT": {
	    "!type": "number",
	    "!doc": "global require console setTimeout process Buffer"
	  },
	  "HOST": "string",
	  "test_db_num": "number",
	  "connected": "bool",
	  "ended": "bool",
	  "cur_start": "+Date",
	  "run_next_test": "fn()",
	  "test_count": "number",
	  "server_version_at_least": "fn(connection: ?, desired_version: [number]) -> bool",
	  "buffers_to_strings": "fn(arr: ?)",
	  "require_number": "fn(expected: number, label: string) -> fn(err: ?, results: ?) -> bool",
	  "require_number_any": "fn(label: ?) -> fn(err: ?, results: ?) -> bool",
	  "require_number_pos": "fn(label: ?) -> fn(err: ?, results: ?) -> bool",
	  "require_string": "fn(str: string, label: string) -> fn(err: ?, results: ?) -> bool",
	  "require_null": "fn(label: string) -> fn(err: ?, results: ?) -> bool",
	  "require_error": "fn(label: string) -> fn(err: ?, results: ?) -> bool",
	  "is_empty_array": "fn(obj: ?) -> bool",
	  "last": "fn(name: string, fn: fn(err: ?, results: ?) -> bool) -> fn(err: ?, results: ?)",
	  "with_timeout": {
	    "!type": "fn(name: string, cb: fn(err: ?, results: ?), millis: number) -> fn()",
	    "!doc": "Wraps the given callback in a timeout."
	  },
	  "all_tests": "commands",
	  "all_start": "+Date"
	};
	
});