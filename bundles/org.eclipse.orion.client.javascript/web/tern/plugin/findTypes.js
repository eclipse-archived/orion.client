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
/*globals infer tern walk*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"acorn/dist/walk",
	"javascript/finder"
],/* @callback */ function(infer, tern, walk, finder) {
	
	var pending = Object.create(null);
	
	tern.registerPlugin('findTypes', /* @callback */ function(server, options) { //$NON-NLS-1$
		return {};
	});
	
	tern.defineQueryType('findType', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			//TODO run async
		},
		
		/**
		 * @callback
		 */
		runAsync: function runAsync(server, query, serverFile, f) {
			var file = tern.resolveFile(server, server.fileMap, query.file);
				if(!file) {
					server.addFile(query.file);
					pending[query.file] = {
						callback: f,
						query: query
					};
					server.on("afterLoad", function(file) { //$NON-NLS-1$
						if(file && file.name) {
							var p = pending[file.name];
							if(p) {
								delete pending[file.name];
								doIt(p.query, file, this, p.callback);
							}

						}
					}.bind(server));
				} else {
					doIt(query, file, server, f);
				}
			}
	});
	
	function doIt(query, file, server, f) {
		try {
			var comment = finder.findComment(query.end, file.ast), result;
			if(comment) {
				result = {
			    	guess: infer.didGuess(),
			        type: null,
			        name: null
			    };
			    if(query.node) {
			    	result.node = comment;
			    }
			} else {
				var expr = tern.findExpr(file, query), exprName, type, exprType;
				try {
				    type = tern.findExprType(server, query, file, expr);
				    exprType = type;
				    if (query.preferFunction) {
						type = type.getFunctionType() || type.getType();
					} else {
						type = type.getType();
					}
				    if (expr) {
						if (expr.node.type === "Identifier") {
				        	exprName = expr.node.name;
			        	} else if (expr.node.type === "MemberExpression" && !expr.node.computed) {
				        	exprName = expr.node.property.name;
			        	}
				    }
			    }
				catch(er) {
					//do nothing tag the result later and do a static check
				}
			    result = {
			    	guess: infer.didGuess(),
			        type: infer.toString(exprType),
			        name: type && type.name,
			        exprName: exprName
			    };
			    addNodeContext(file, query, result);
			    if (type) {
			    	tern.storeTypeDocs(query, type, result);
		    	} else {
		    		staticCheck(query, file, result);
		    	}
			    if (!result.doc && exprType && exprType.doc) {
			    	result.doc = tern.parseDoc(query, exprType.doc);
				}
		    }
		    f(null, result);
	    }
	    catch(err) {
		    if (server.options.debug && err.name !== "TernError") {
				console.error(err.stack);
			}
	        f(err);
	    }
	}
	
	function addNodeContext(file, query, result) {
		if(query.node) {
			var _n = finder.findNode(query.end, file.ast, {parents:true});
			if(_n) {
				var n = Object.create(null);
				n.type = _n.type;
				n.range = _n.range;
				if(_n.type === 'Identifier') {
					_n = _n.parents.pop();
					if(_n.type === 'Property') {
						n.type = _n.type;
						n.value = copyNode(_n.value);
						n.key = copyNode(_n.key);
					} else if(_n.type === 'VariableDeclarator') {
						n.type = _n.type;
						n.id = copyNode(_n.id);
						n.init = copyNode(_n.init);
					} else if(_n.type === 'AssignmentExpression') {
						n.type = _n.type;
						n.left = copyNode(_n.left);
						n.right = copyNode(_n.right);
					} else if(_n.type === 'CallExpression') {
						n.type = _n.type;
						n.callee = copyNode(_n.callee);
						n.args = [];
						for(var i = 0, len = _n.arguments.length; i < len; i++) {
							n.args.push(copyNode(_n.arguments[i]));
						}
					} else if(_n.type === 'MemberExpression') {
						n.type = _n.type;
						n.property = copyNode(_n.property);
						n.range = _n.range;
					} else if(_n.type === 'NewExpression') {
						n.type = _n.type;
						n.callee = copyNode(_n.callee);
						n.args = [];
						for(i = 0, len = _n.arguments.length; i < len; i++) {
							n.args.push(copyNode(_n.arguments[i]));
						}
					} else if(_n.type === 'FunctionDeclaration' || _n.type === 'FunctionExpression') {
						n.type = _n.type;
						if(_n.id) {
							n.id = copyNode(_n.id);
						}
						n.params = [];
						for(i = 0, len = _n.params.length; i < len; i++) {
							n.params.push(copyNode(_n.params[i]));
						}
					} else if(_n.type === 'UpdateExpression') {
						n.type = _n.type;
						n.argument = copyNode(_n.argument);
					}
				} else if(_n.type === 'Literal') {
					n.value = _n.value;
					if(_n.regex) {
						n.regex = _n.regex;
					}
				}
				result.node = n;
			}
		}
	}
	
	function copyNode(node) {
		var n = Object.create(null);
		n.range = node.range;
		n.type = node.type;
		return n;
	}
	
	function staticCheck(query, file, result) {
		var node = finder.findNode(query.end, file.ast, {parents: true});
		if(node) {
			checkNode(query, node, result);
		} else {
			result.staticCheck = {
				confidence: -1
			};
		}
	}
		
	function checkNode(query, node, result) {
		switch(node.type) {
			case 'FunctionDeclaration':
			case 'FucntionExpression':
			case 'VariableDeclarator': 
			case 'Literal': {
				//a re-decl cannot be a reference
				result.staticCheck = {
					confidence: -1
				};
				break;
			}
			case 'Identifier': {
				if(Array.isArray(node.parents)) {
					var p = node.parents.slice(node.parents.length-1)[0];
					checkNode(query, p, result);
				} else {
					result.staticCheck = {
						confidence: 25
					};
				}
				break;
			}
			case 'AssignmentExpression': {
				if(node.left.type === 'Identifier' && node.left.name === query.origin.type.exprName) {
					result.staticCheck = {
						confidence: 25
					};
				} else if(node.right.type === 'Identifier' && node.right.name === query.origin.type.exprName) {
					result.staticCheck = {
						confidence: 25
					};
				} else {
					//TODO catch all
					result.staticCheck = {
						confidence: 5
					};
				}
				break;
			}
			case 'MemberExpression': {
				//if part of the expression, maybe relevant
				result.staticCheck = {
					confidence: 10
				};
				break;
			}
			case 'CallExpression': {
				if(node.callee.name === query.origin.type.exprName) {
					if(query.origin.type.type === 'fn()') {
						result.staticCheck = {
							confidence: 25
						};
					} else {
						result.staticCheck = {
							confidence: -1
						};
					}
				}
				for(var i = 0, l = node.arguments.length; i < l; i++) {
					var arg = node.arguments[i];
					if(arg.type === 'Identifier') {
						if(query.origin.type.type === 'fn()') {
							//orig type is function, this is not relevant
							result.staticCheck = {
								confidence: -1
							};
						} else {
							//with no type infos we have no idea if this is the same one
							result.staticCheck = {
								confidence: 40
							};
						}
					} else if(arg.type === 'FunctionExpression') {
						if(arg.id === query.origin.type.exprName) {
							//redecl, not relevant
							result.staticCheck = {
								confidence: -1
							};
						}
					}
				}
				break;
			}
			default: {
				result.staticCheck = {
					confidence: 0
				};
			}
		}
	}
}); 