/*******************************************************************************
 * @license
 * Copyright (c) 2015, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define([
	'javascript/util',
], function( Util) {
	
	function OrionAcorn() {
		this.dependencies = {};
		this.environments = {};
		this.comments = [];
		this.tokens = [];
		this.leadingCommentsIndex = 0;
		this.trailingCommentsIndex = 0;
		this.error = null;
		this.needReset = true;
		this.currentOptions = {};
	}

	OrionAcorn.prototype.reset = function reset() {
		this.comments = [];
		this.tokens = [];
		this.leadingCommentsIndex = 0;
		this.trailingCommentsIndex = 0;
	};
	
	OrionAcorn.prototype.initialize = function initialize() {
		this.dependencies = {};
		this.environments = {};
		this.reset();
		this.error = null;
		this.needReset = true;
		this.currentOptions = {};
	};

	OrionAcorn.prototype.attachTernServer = function attachTernServer(ternServer){
		OrionAcorn.prototype.ternServer = ternServer;
	};
	/**
	 * @name onToken
	 * @description Function called when recording a token
	 * @param token the given token to record
	 */
	OrionAcorn.prototype.onToken = function onToken(token) {
		var type = "Punctuator";
		var label = token.type.label;
		var eof = false;
		var value = token.value;
		switch(label) {
			case "num" :
				//num: new TokenType("num", startsExpr),
				type = "Numeric";
				break;
			case "regexp" :
				//regexp: new TokenType("regexp", startsExpr),
				type = "RegularExpression";
				token.value = "/" + value.pattern + "/" + (value.flags ? value.flags : "");
				break;
			case "string" :
				//string: new TokenType("string", startsExpr),
				type = "String";
				break;
			case "name" :
				// name: new TokenType("name", startsExpr),
				type = "Identifier";
				break;
			case "eof" :
				//eof: new TokenType("eof)
				eof = true;
				break;
			default:
				var keyword = token.type.keyword;
				if (keyword) {
					switch(keyword) {
						case "null" :
							type = "Null";
							break;
						case "true" :
						case "false" :
							type = "Boolean";
							break;
						default: 
							type = "Keyword";
					}
				}
		}
		if (!eof) {
			if (typeof value === "undefined") {
				token.value = label;
			}
			token.type = type;
			token.index = this.tokens.length;
			this.tokens.push(token);
		}
	};
	
	/**
	 * @name onComment
	 * @description function called when a comment is recorded
	 * @param block a boolean to indicate if this is a block comment (true) or a line comment (false)
	 * @param text the given comment contents
	 * @param start the given start position
	 * @param end the given end position
	 * @param startLoc the given start location
	 * @param endLoc the given end location
	 */
	OrionAcorn.prototype.onComment = function onComment(block, text, start, end, startLoc, endLoc) {
		var comment = {
			type: block ? 'Block' : 'Line',
			value: text,
			start: start,
			end: end
		};
		if (this.currentOptions.locations) {
			comment.loc = {
				start: startLoc,
				end: endLoc
			};
		}
		if (this.currentOptions.ranges) {
			comment.range = [start, end];
		}
		this.comments.push(comment);
	};

	/**
	 * Define an acorn plugin to record the comments even if there are syntax errors (incomplete block comments),
	 * it linked comments and nodes (leadingComments and trailingComments) and it records environments and dependencies
	 */
	OrionAcorn.prototype.acornPlugin = function acornPlugin(instance, opts) {
		if (!opts) {
			return;
		}
		var that = this;
		/**
		 * Returns a deep copy of the given obj
		 */
		function deepCopy(obj) {
			var ret = {}, key, val;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					val = obj[key];
					if (typeof val === 'object' && val !== null) {
						ret[key] = deepCopy(val);
					} else {
						ret[key] = val;
					}
				}
			}
			return ret;
		}

		instance.extend("raise", function(nextMethod) {
			return function (pos, message) {
				try {
					return nextMethod.call(this, pos, message);
				} catch(err) {
					if (err instanceof SyntaxError) {
						if (this.pos === this.input.length) {
							err.type = Util.ErrorTypes.EndOfInput;
						} else {
							err.type = Util.ErrorTypes.Unexpected;
						}
						if (that.needReset) {
							// we only reset tokens once. We don't want to reset them again when the syntax error is thrown during acorn_loose parsing
							that.reset();
							that.needReset = false;
						}
					}
					that.error = err;
					err.index = pos;
					throw err;
				}
			};
		});
		instance.extend("startNode", function(nextMethod) {
			return function () {
				var node = nextMethod.call(this);
				// attach leading comments
				var max = that.comments.length;
				if (max !== that.leadingCommentsIndex) {
					// we got new comments since the last node
					var i = that.leadingCommentsIndex;
					loop: for (; i< max; i++) {
						var comment = that.comments[i];
						if (node.range[0] >= comment.range[1]) {
							// attach the comment to the node
							if (!node.leadingComments) {
								node.leadingComments = [];
							}
							node.leadingComments.push(deepCopy(that.comments[i]));
						} else {
							break loop;
						}
					}
					that.leadingCommentsIndex = i;
				}
				return node;
			};
		});
		instance.extend("finishNode", function(nextMethod) {
			/**
			 * @description Collects the dependencies from call expressions and new expressions
			 * @param {Node} callee The named callee node 
			 * @param {Array.<Node>} args The list of arguments for the expression
			 * ORION
			 */
			function collectDeps(callee, args, extra) {
				if(extra.deps) {
					var len = args.length;
					if(callee.name === 'importScripts') {
						addArrayDeps(args, extra); //importScripts('foo', 'bar'...)
					} else if(callee.name === 'Worker') {
						addDep(args[0], extra);
					} else if(callee.name === 'require') {
						var _a = args[0];
						if(_a.type === "ArrayExpression") {
							extra.envs.node = true;
							addArrayDeps(_a.elements, extra); //require([foo])
						} else if(_a.type === "Literal") {
							extra.envs.node = true;
							addDep(_a, extra); // require('foo')
						}
						if(len > 1) {
							_a = args[1];
							if(_a.type === "ArrayExpression") {
								extra.envs.node = true;
								addArrayDeps(_a.elements, extra);
							}
						}
					} else if(callee.name === 'requirejs') {
						_a = args[0];
						if(_a.type === "ArrayExpression") {
							extra.envs.amd = true;
							addArrayDeps(_a.elements, extra); //requirejs([foo])
						}
					} else if(callee.name === 'define' && len > 1) {//second arg must be array
						_a = args[0];
						if(_a.type === "Literal") {
							_a = args[1];
						}
						if(_a.type === "ArrayExpression") {
							extra.envs.amd = true;
							addArrayDeps(_a.elements, extra);
						}
					}
				}
			}
			
				/**
			 * @description Adds all of the entries from the array of deps to the global state
			 * @param {Array} array The array of deps to add
			 * ORION
			 */
			function addArrayDeps(array, extra) {
				if(extra.deps) {
					var len = array.length;
					for(var i = 0; i < len; i++) {
						addDep(array[i], extra);
					}
				}
			}
			
				/**
			 * @description Adds a dependency if it has not already been added
			 * @param {Object} node The AST node
			 */
			function addDep(node, extra) {
				if(extra.deps && node.type === "Literal") {
					if (!extra.deps[node.value]) {
						extra.deps[node.value] = 1;
						var resetPending = function(key) {
							clearTimeout(that.pendingModules[key].timeout);
							delete that.pendingModules[key].pending;
							that.ternServer.finishAsyncAction("Read operation timed out.");
						};
						if (extra.envs.node === true) {
							if (that.ternServer){
								var sourceFile = node.sourceFile.name;
								var folderLoc = sourceFile.slice(0, sourceFile.lastIndexOf("/")+1);
								var nativeModulesWithNode = [ '_debug_agent','_debugger','_linklist','assert','buffer','child_process','console','constants','crypto','cluster','dgram','dns','domain','events','freelist','fs','http','_http_agent','_http_client','_http_common','_http_incoming','_http_outgoing','_http_server','https','module','net','os','path','process','punycode','querystring','readline','repl','stream','_stream_readable','_stream_writable','_stream_duplex','_stream_transform','_stream_passthrough','_stream_wrap','string_decoder','sys','timers','tls','_tls_common','_tls_legacy','_tls_wrap','tty','url','util','v8','vm','zlib','internal/child_process','internal/cluster','internal/freelist','internal/module','internal/socket_list','internal/repl','internal/util','internal/streams/lazy_transform'];
								if (!/^[\.]+/.test(node.value) && nativeModulesWithNode.indexOf(node.value) === -1){
									var pacJsonLoc = folderLoc+"node_modules/"+node.value+"/package.json";
									that.ternServer.startAsyncAction();
									if (!that.pendingModules) that.pendingModules=[];
							  		var index = that.pendingModules.length;
							  		that.pendingModules.push({
							  			pending: true,
							  			timeout: setTimeout(resetPending, 4000, index)
							  		});
									that.ternServer.options.getFile(pacJsonLoc, function(err, _file){
										clearTimeout(that.pendingModules[index].timeout);
							   			delete that.pendingModules[index].pending;
										if(!err){
											var val = JSON.parse(_file);
											var mainPath = null;
											var main = val.main;
											if (main) {
												if (!/(\.js)$/.test(main)) {
													main += ".js";
												}
												mainPath = folderLoc + "node_modules/" + node.value + "/" + main;
											} else {
												main = "index.js";
												mainPath = folderLoc + "node_modules/" + node.value + "/index.js";
											}
											node.resolved = {
												file: mainPath,
												contents: null,
												logical: node.value,
												err: err
											};
											that.ternServer.startAsyncAction();
											index = that.pendingModules.length;
									  		that.pendingModules.push({
									  			pending: true,
									  			timeout: setTimeout(resetPending, 4000, index)
									  		});
											that.ternServer.options.getFile(mainPath, function(err, contents) {
												clearTimeout(that.pendingModules[index].timeout);
												node.resolved.contents = contents;
										   		delete that.pendingModules[index].pending;
										   		that.ternServer.finishAsyncAction(err);
											});
										}
										that.ternServer.finishAsyncAction(err);
									});
								}					
							}
						} else if (extra.envs.amd === true){
							if (that.ternServer){
						  		that.ternServer.startAsyncAction();
						  		if (!that.pendingModules) that.pendingModules=[];
						  		var index = that.pendingModules.length;
						  		that.pendingModules.push({
						  			pending: true,
						  			timeout: setTimeout(resetPending, 4000, index)
						  		});
						  		var opts = {logical: node.value, file: node.sourceFile ? node.sourceFile.name : null};
								that.ternServer.options.getFile(opts, function(err, _file) {
									clearTimeout(that.pendingModules[index].timeout);
									node.resolved = {
										file: _file.file,
										contents: typeof _file.contents === 'string' ? _file.contents : '',
										logical: _file.logical,
										err: err
									};
							   		delete that.pendingModules[index].pending;
							   		that.ternServer.finishAsyncAction(err);
								});
							}
						}
					}
				}
			}
			return function(node, type) {
				if (type === "CallExpression" || type === "NewExpression") {
					var extra = {
						deps: {},
						envs: {}
					};
					collectDeps(node.callee, node.arguments, extra);
					// copy all properties from extra.envs into environments
					var env = extra.envs;
					for (var prop in env) {
						if (env.hasOwnProperty(prop)) {
							that.environments[prop] = env[prop];
						}
					}
					var deps = extra.deps;
					// copy all properties from extra.deps into dependencies
					for (var dep in deps) {
						if (deps.hasOwnProperty(dep) && !that.dependencies.hasOwnProperty(dep)) {
							that.dependencies[dep] = {type: "Literal", value: dep };
						}
					}
				}
				var result = nextMethod.call(this, node, type);
				// attach trailing comments
				var max = that.comments.length;
				if (max !== that.trailingCommentsIndex) {
					// we got new comments since the last node
					var i = that.trailingCommentsIndex;
					loop: for (; i< max; i++) {
						var comment = that.comments[i];
						if (result.range[1] <= comment.range[0]) {
							// attach the comment to the node
							if (!result.trailingComments) {
								result.trailingComments = [];
							}
							result.trailingComments.push(deepCopy(that.comments[i]));
						} else {
							break loop;
						}
					}
					that.trailingCommentsIndex = i;
				}
				result.sourceFile = that.sourceFile;
				return result;
			};
		});
		instance.extend("skipBlockComment", function(nextMethod) {
			return function() {
				var lineBreak = /\r\n?|\n|\u2028|\u2029/;
				var lineBreakG = new RegExp(lineBreak.source, "g");

				var startLoc = this.curPosition();
				var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
				if (end !== -1) {
					this.pos -= 2;
					return nextMethod.call(this);
				}
				this.pos += 2;
				// error recovery: the block comment is not complete
				if (this.options.locations) {
					lineBreakG.lastIndex = start;
					var match;
					while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
						++this.curLine;
						this.lineStart = match.index + match[0].length;
					}
				}
				if (this.options.onComment) {
					var current = this.input.length;
					this.pos = current;
					this.options.onComment(true, this.input.slice(start + 2, current), start, current, startLoc, this.curPosition());
				}
			};
		});
	};

	/**
	 * @description setup all the given options to set up the acorn parsing
	 * @param {String} text The given source code
	 * @param {Object} options The given options
	 * @param {Object} acorn The acorn object
	 * @param {Object} acornloose The acorn loose object
	 * @param {Object} file the given file
	 */
	OrionAcorn.prototype.preParse = function preParse(text, options, acorn, acornloose, file) {
		this.initialize();
		if (!acorn.plugins) {
			acorn.plugins = Object.create(null); 
		}
		acorn.plugins.acornPlugin = this.acornPlugin.bind(this);
		// enabled plugins
		options.plugins = {
			"acornPlugin" : true
		};

		if (!acornloose.pluginsLoose) {
			acornloose.pluginsLoose = Object.create(null);
		}
		acornloose.pluginsLoose.acornPlugin = this.acornPlugin.bind(this);

		// enabled plugins
		options.pluginsLoose = {
			"acornPlugin" : true
		};
		options.onToken = this.onToken.bind(this);
		options.onComment = this.onComment.bind(this);
		options.locations = true;
		options.ranges = true;
		options.sourceFile = false;
		options.sourceType = "script";
		options.ecmaVersion = 6;
		this.sourceFile = Object.create(null);
		if (file) {
			this.sourceFile.name = file;
		} else {
			this.sourceFile.name = options.directSourceFile.name;
		}
		if (options.directSourceFile) {
			this.sourceFile.text = options.directSourceFile.text;
		} else {
			this.sourceFile.text  = text;
		}

		this.currentOptions = {
			locations : options.locations,
			ranges : options.ranges
		};
	};

	/**
	 * @description set all the values in the postParse phase
	 * @param {Object} the given ast tree
	 * @param {String} text The given source code
	 */
	OrionAcorn.prototype.postParse = function postParse(ast, text) {
		if (this.error) {
			if (ast.errors) {
				ast.errors.push(this.error);
			} else {
				ast.errors = [this.error];
			}
		}
		ast.comments = this.comments;
		ast.tokens = this.tokens;
		if (!ast.dependencies) {
			ast.dependencies = [];
		}
		for (var prop in this.dependencies) {
			if (this.dependencies.hasOwnProperty(prop)) {
				ast.dependencies.push(this.dependencies[prop]);
			}
		}
		ast.environments = this.environments;
		ast.errors = Util.serializeAstErrors(ast);
	};
	return OrionAcorn;
});
