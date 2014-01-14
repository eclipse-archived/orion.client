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
define('javascript/contentAssist/indexFiles/redisIndex', [], 
function () {
	return {
		"!name": "redis",
		"RedisClient" : "redis.RedisClient",
		"!define": {
			"redis": {
        		"debug_mode": {
          			"!type": "Boolean",
          			"!doc": "can set this to true to enable for all connections"
      			},
        		"createClient": {
		        	"!type": "fn(port_arg: Number, host_arg: String, options: Object) -> RedisClient",
		        },
        		"print": "fn(err: Error, reply: Object)",
        		"RedisClient": {
          			"prototype": {
            			"initialize_retry_vars": "fn()",
            			"unref": "fn()",
            			"flush_and_error": {
              				"!type": "fn(message: String)",
              				"!doc": "flush offline_queue and command_queue, erroring any items with a callback first"
            			},
	            		"on_error": "fn(msg: String)",
	            		"do_auth": "fn()",
			            "on_connect": "fn()",
			            "init_parser": "fn()",
			            "on_ready": "fn()",
			            "on_info_cmd": "fn(err: Error, res: Object)",
			            "ready_check": "fn()",
			            "send_offline_queue": "fn()",
			            "connection_gone": "fn(why: String)",
			            "on_data": "fn(data: Object)",
			            "return_error": "fn(err: Error)",
			            "return_reply": "fn(reply: Object)",
			            "send_command": "fn(command: String, args: Object, callback: fn()) -> Object",
			            "pub_sub_command": "fn(command_obj: Object)",
			            "end": "fn()",
			            "select": {
			            	"!type": "fn(db: Object, callback: fn())",
			            	"!doc": "store db in this.select_db to restore it on reconnect"
			            },
			            "auth": {
			            	"!type": "fn()",
			            	"!doc": "Stash auth for connect and reconnect."
			            },
			            "hmget": "fn(arg1: Object, arg2: Object, arg3: Object)",
			            "hmset": "fn(args: Object, callback: fn())",
			            "multi": "fn(args: Object) -> Multi",
			            "MULTI": {
			              "!type": "fn(args: Object) -> Multi",
			            },
			            "EVAL": "fn()",
			            "SELECT": "fn()",
			            "AUTH": "fn()",
			            "HMGET": "fn()",
			            "HMSET": "fn()",
			            "eval": "fn()"
          			},
			        "stream": "Object",
			        "options": {
			        	"socket_nodelay": "Boolean"
			        },
			        "connection_id": "Number",
			        "connected": "Boolean",
			        "ready": "Boolean",
			        "connections": "Number",
			        "should_buffer": "Boolean",
			        "command_queue_high_water": "Number",
			        "command_queue_low_water": "Number",
			        "max_attempts": "Number",
			        "command_queue": "Queue",
			        "commands_sent": "Number",
			        "enable_offline_queue": "Boolean",
			        "pub_sub_mode": "Boolean",
			        "subscription_set": "Object",
			        "monitoring": "Boolean",
			        "closing": "Boolean",
			        "server_info": {
			        	"versions": "[Number]",
			            "!doc": "expose info key/vals to users"
			        },
	        		"auth_pass": "Number",
	        		"parser_module": {
	          			"debug_mode": "Boolean"
	        		},
			        "old_state": {
			        	"monitoring": "Boolean",
			            "pub_sub_mode": "Boolean"
			        },
			        "retry_timer": "Object",
			        "retry_totaltime": "Number",
			        "retry_delay": "Number",
			        "retry_backoff": "Number",
			        "attempts": "Number",
			        "send_anyway": "Boolean",
			        "auth_callback": "Number",
			        "emitted_end": "Boolean",
			        "reply_parser": {
			        	"!doc": "return_buffers sends back Buffers from parser to callback."
			        },
			        "port": "Number",
			        "host": "String",
			       	"offline_queue": "Queue"
		      	},
		      	"RedisClient_obj" : {
		      		"!type": "fn(stream: Object, options: Object)",	
		      	},
			    "Multi": {
			    	"prototype": {
			            "hmset": {
			              "!type": "fn() -> Multi",
			            },
		            	"exec": "fn(callback: fn()) -> fn(err: Error, replies: Object)",
		            	"HMSET": "fn()",
		            	"EXEC": "fn()"
		        	},
          			"_client": "RedisClient",
          			"queue": "[[MULTI]]",
        		},
        		"Multi_obj" : {
        			"!type" : "fn(client: RedisClient, args: Object)"
        		},
      		},
	      	"Queue": {
	        	"prototype": {
		        	"shift": "fn() -> Object",
		        	"push": "fn(item: Object) -> Number",
		        	"forEach": "fn(fn: fn(), thisv: Object)",
		        	"getLength": "fn() -> Number"
		        }
	      	},
	      	"Queue_obj" : {
	      		"!type": "fn()"	
	      	},
	      	"Commands": {
			    "append" : "String",
			    "auth" : "String",
			    "bgrewriteaof" : "String",
			    "bgsave" : "String",
			    "bitcount" : "String",
			    "bitop" : "String",
			    "blpop" : "String",
			    "brpop" : "String",
			    "brpoplpush" : "String",
			    "client kill" : "String",
			    "client list" : "String",
			    "client getname" : "String",
			    "client setname" : "String",
			    "config get" : "String",
			    "config rewrite" : "String",
			    "config set" : "String",
			    "config resetstat" : "String",
			    "dbsize" : "String",
			    "debug object" : "String",
			    "debug segfault" : "String",
			    "decr" : "String",
			    "decrby" : "String",
			    "del" : "String",
			    "discard" : "String",
			    "dump" : "String",
			    "echo" : "String",
			    "eval" : "String",
			    "evalsha" : "String",
			    "exec" : "String",
			    "exists" : "String",
			    "expire" : "String",
			    "expireat" : "String",
			    "flushall" : "String",
			    "flushdb" : "String",
			    "get" : "String",
			    "getbit" : "String",
			    "getrange" : "String",
			    "getset" : "String",
			    "hdel" : "String",
			    "hexists" : "String",
			    "hget" : "String",
			    "hgetall" : "String",
			    "hincrby" : "String",
			    "hincrbyfloat" : "String",
			    "hkeys" : "String",
			    "hlen" : "String",
			    "hmget" : "String",
			    "hmset" : "String",
			    "hset" : "String",
			    "hsetnx" : "String",
			    "hvals" : "String",
			    "incr" : "String",
			    "incrby" : "String",
			    "incrbyfloat" : "String",
			    "info" : "String",
			    "keys" : "String",
			    "lastsave" : "String",
			    "lindex" : "String",
			    "linsert" : "String",
			    "llen" : "String",
			    "lpop" : "String",
			    "lpush" : "String",
			    "lpushx" : "String",
			    "lrange" : "String",
			    "lrem" : "String",
			    "lset" : "String",
			    "ltrim" : "String",
			    "mget" : "String",
			    "migrate" : "String",
			    "monitor" : "String",
			    "move" : "String",
			    "mset" : "String",
			    "msetnx" : "String",
			    "multi" : "String",
			    "object" : "String",
			    "persist" : "String",
			    "pexpire" : "String",
			    "pexpireat" : "String",
			    "ping" : "String",
			    "psetex" : "String",
			    "psubscribe" : "String",
			    "pubsub" : "String",
			    "pttl" : "String",
			    "publish" : "String",
			    "punsubscribe" : "String",
			    "quit" : "String",
			    "randomkey" : "String",
			    "rename" : "String",
			    "renamenx" : "String",
			    "restore" : "String",
			    "rpop" : "String",
			    "rpoplpush" : "String",
			    "rpush" : "String",
			    "rpushx" : "String",
			    "sadd" : "String",
			    "save" : "String",
			    "scard" : "String",
			    "script exists" : "String",
			    "script flush" : "String",
			    "script kill" : "String",
			    "script load" : "String",
			    "sdiff" : "String",
			    "sdiffstore" : "String",
			    "select" : "String",
			    "set" : "String",
			    "setbit" : "String",
			    "setex" : "String",
			    "setnx" : "String",
			    "setrange" : "String",
			    "shutdown" : "String",
			    "sinter" : "String",
			    "sinterstore" : "String",
			    "sismember" : "String",
			    "slaveof" : "String",
			    "slowlog" : "String",
			    "smembers" : "String",
			    "smove" : "String",
			    "sort" : "String",
			    "spop" : "String",
			    "srandmember" : "String",
			    "srem" : "String",
			    "strlen" : "String",
			    "subscribe" : "String",
			    "sunion" : "String",
			    "sunionstore" : "String",
			    "sync" : "String",
			    "time" : "String",
			    "ttl" : "String",
			    "type" : "String",
			    "unsubscribe" : "String",
			    "unwatch" : "String",
			    "watch" : "String",
			    "zadd" : "String",
			    "zcard" : "String",
			    "zcount" : "String",
			    "zincrby" : "String",
			    "zinterstore" : "String",
			    "zrange" : "String",
			    "zrangebyscore" : "String",
			    "zrank" : "String",
			    "zrem" : "String",
			    "zremrangebyrank" : "String",
			    "zremrangebyscore" : "String",
			    "zrevrange" : "String",
			    "zrevrangebyscore" : "String",
			    "zrevrank" : "String",
			    "zscore" : "String",
			    "zunionstore" : "String",
			    "scan" : "String",
			    "sscan" : "String",
			    "hscan" : "String",
			    "zscan" : "String"
	      	},
	      	"HiredisReplyParser": {
	        	"debug_mode": "Boolean",
	        	"name": "String",
          		"prototype": {
            		"reset": "fn()",
            		"execute": "fn(data: Object)"
            	}
	        }
	    },
        "Parser": {
        	"name": "String",
        	"debug_mode": "Boolean",
      		"prototype": {
        		"_parseResult": "fn(type: String)",
        		"execute": "fn(buffer: String)",
	            "append": "fn(newBuffer: String)",
	            "parseHeader": "fn() -> String",
	            "_packetEndOffset": "fn() -> Number",
	            "_bytesRemaining": "fn() -> Number",
	            "parser_error": "fn(message: String)",
	            "send_error": "fn(reply: Object)",
	            "send_reply": "fn(reply: Object)"
      		},
      		"!type": "fn(options: Object)"
        }
  	}
});