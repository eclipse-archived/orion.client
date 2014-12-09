/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/**
 * Implements eslint's load-rules API for AMD. Our rules are loaded as AMD modules.
 */
define([
'./util',
'logger',
'javascript/finder',
], function(util, Logger, Finder) {
	
    var rules = {
        "curly" : {
            description: 'Require curly braces for all control statements',
            rule: function(context) {
        		/**
        		 * Checks the following AST element for a BlockStatement
        		 */
        		function checkBlock(node) {
        			try {
        			    switch(node.type) {
        			        case 'IfStatement': {
            					if(node.consequent && node.consequent.type !== 'BlockStatement') {
            						//flag the first token of the statement that should be in the block
            						context.report(node.consequent, "Statement should be enclosed in braces.", null /*, context.getTokens(node.consequent)[0]*/);
            					}
            					if(node.alternate && node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement') {
            						//flag the first token of the statement that should be in the block
            						context.report(node.alternate, "Statement should be enclosed in braces.", null /*, context.getTokens(node.alternate)[0]*/);
            					}
            					break;
        				    }
        				    case 'DoWhileStatement':
        				    case 'WhileStatement':
        				    case 'WithStatement':
        				    case 'ForStatement': 
                            case 'ForInStatement': {
            					if(node.body && node.body.type !== 'BlockStatement') {
            						//flag the first token of the statement that should be in the block
            						context.report(node.body, "Statement should be enclosed in braces.", null /*, context.getTokens(node.body)[0]*/);
            					}
            					break;
        					}
        				}
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        		
        		return {
        			'IfStatement' : checkBlock,
        			'WhileStatement' : checkBlock,
        			'ForStatement' : checkBlock,
        			'ForInStatement' : checkBlock,
        			'WithStatement': checkBlock,
        			'DoWhileStatement': checkBlock
        		};
        	}
        },
		"eqeqeq": {
		    description: 'Require the use of === and !==',
		    rule: function(context) {
		        function getOperatorToken(context, node) {
            		var tokens = context.getTokens(node), len = tokens.length, operator = node.operator;
            		for (var i=0; i < len; i++) {
            			var t = tokens[i];
            			if (t.value === operator) {
            				return t;
            			}
            		}
            		return null;
            	}
            	function isNullness(node) {
            		if(node && node.type) {
            			return (node.type === 'Literal' && node.value == null) || (node.type === 'Identifier' && node.name === 'undefined');  //$NON-NLS-0$  //$NON-NLS-1$  //$NON-NLS-2$
            		}
            		return false;
            	}
        		return {
        			"BinaryExpression": function(node) {  //$NON-NLS-0$
        				try {
        					if(isNullness(node.left) || isNullness(node.right)) {
        						return;
        					}
        					var op = node.operator;
        					var expected = null;
        					if (op === "==") {  //$NON-NLS-0$
        					    expected = '===';
        						context.report(node, "Expected '${0}' and instead saw '${1}'.", {0: expected, 1:op}, getOperatorToken(context, node));
        					} else if (op === "!=") {  //$NON-NLS-0$
        					    expected = '!==';
        						context.report(node, "Expected '${0}' and instead saw '${1}'.", {0:expected, 1:op}, getOperatorToken(context, node));
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	} 
        },
		"missing-doc" : {
		    description: 'Require JSDoc for all functions',
		    rule: function(context) {
        		var config = (context.options && context.options[0]) || {},
        		    declEnabled = Number(config.decl) > 0,
        		    exprEnabled = Number(config.expr) > 0;
        
        		function checkDoc(node) {
        			try {
        				if(!declEnabled && !exprEnabled) {
        					return;
        				}
        				var comments;
        				var name;
        				switch(node.type) {
        					case 'Property':  //$NON-NLS-0$
        						if(exprEnabled && node.value && (node.value.type === 'FunctionExpression')) {  //$NON-NLS-0$  //$NON-NLS-1$
        							comments = context.getComments(node);
        							if(!comments || comments.leading.length < 1) {
        								switch(node.key.type) { 
        									case 'Identifier':  //$NON-NLS-0$
        										name = node.key.name;
        										break;
        									case 'Literal':  //$NON-NLS-0$
        										name = node.key.value;
        										break;
        								}
        								context.report(node.key, 'Missing documentation for function \'${0}\'.', {0:name}, { type: 'expr' });
        							}
        						}
        						break;
        					case 'FunctionDeclaration':  //$NON-NLS-0$
        						if(declEnabled) {  //$NON-NLS-0$
        							comments = context.getComments(node);
        							if(!comments || comments.leading.length < 1) {
        								context.report(node.id, 'Missing documentation for function \'${0}\'.', {0:node.id.name}, { type: 'decl' });
        							}
        						}
        						break;
        					case 'ExpressionStatement':  //$NON-NLS-0$
        						if(exprEnabled && node.expression && node.expression.type === 'AssignmentExpression') {  //$NON-NLS-0$  //$NON-NLS-1$
        							var anode = node.expression;
        							if(anode.right && (anode.right.type === 'FunctionExpression') && anode.left && (anode.left.type === 'MemberExpression')) {  //$NON-NLS-0$  //$NON-NLS-1$
        								//comments are attached to the enclosing expression statement
        								comments = context.getComments(node);
        								if(!comments || comments.leading.length < 1) {
        									name = anode.left.computed === true ? anode.left.property.value : anode.left.property.name;
        									context.report(anode.left.property, 'Missing documentation for function \'${0}\'.', {0:name}, { type: 'expr' });
        								}
        							}
        						}
        						break;
        				}
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        		
        		return {
        			"Property": checkDoc,  //$NON-NLS-0$
        			"FunctionDeclaration": checkDoc,  //$NON-NLS-0$
        			"ExpressionStatement": checkDoc  //$NON-NLS-0$
        		};
        	}
        },
		"new-parens" : {
		    description: 'Require parenthesis for constructors',
		    rule: function(context) {
        		return {
        			'NewExpression' : function(node) {
        				try {
        					if(node.callee) {
        						var tokens = context.getTokens(node.callee, 0, 1);
        						if(tokens && tokens.length > 0) {
        							var last = tokens[tokens.length-1];
        							if(last.type !== 'Punctuator' || last.value !== '(') {
        								//if there s no opening parenthesis its safe to assume they are missing
        								context.report(node.callee, 'Missing parentheses invoking constructor.', null, tokens[0]);
        							}
        						}
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
        "no-caller": {
            description: "Warn on use of arguments.callee or arguments.caller",
            rule: function(context) {
                return {
                    "MemberExpression": function(node) { //$NON-NLS-0$
                        var object = node.object;
                        if (!object || object.name !== "arguments" || object.type !== "Identifier") { //$NON-NLS-1$ //$NON-NLS-0$
                            return;
                        }
                        var prop = node.property;
                        if (prop.name === "callee" || prop.name === "caller") {//$NON-NLS-1$ //$NON-NLS-0$
                            context.report(prop, "'arguments.${0}' is deprecated.", {0: prop.name});
                        }
                    }
                };
            }
        },
		"no-debugger" : {
		    description: 'Disallow use of the debugger keyword',
		    rule: function(context) {
        		return {
        			"DebuggerStatement": function(node) {
        				try {
        					context.report(node, '\'debugger\' statement use is discouraged.', null, context.getTokens(node)[0]);
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		"no-dupe-keys" : {
		    description: 'Warn when object contains duplicate keys',
		    rule: function(context) {
        		return {
        			"ObjectExpression": function(node) {
        				try {
        					var props = node.properties;
        					if(props && props.length > 0) {
        						var len = props.length;
        						var seen = Object.create(null);
        						for(var i = 0; i < len; i++) {
        							var prop = props[i];
        							// Here we're concerned only with duplicate keys having kind == "init". Duplicates among other kinds (get, set)
        							// cause syntax errors, by spec, so don't need to be linted.
        							if(prop.kind !== "init") {
        								continue;
        							}
        							var name = (prop.key.name ? prop.key.name : prop.key.value);
        							if(Object.prototype.hasOwnProperty.call(seen, name)) {
        								context.report(prop, 'Duplicate object key \'${0}\'.', {0:name}, context.getTokens(prop)[0]);
        							}
        							else {
        								seen[name] = 1;
        							}
        						}
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		'no-empty-block' : {
		    description: 'Warn when a code block is empty',
		    rule: function(context) {
        		var comments;
        		
        		return {
        		    'Program' : function(node) {
        		          comments = node.comments;  
        		    },
        			'BlockStatement' : function(node) {
        			    try {
            			    if(node.body.length < 1) {
            			        for(var i = 0; i < comments.length; i++) {
            			            var range = comments[i].range;
            			            if(range[0] >= node.range[0] && range[1] <= node.range[1]) {
            			                //a commented empty block, ignore
            			                return;
            			            }
            			        }
            			        context.report(node, 'Empty block should be removed or commented.');
            			    }
        			    }
        			    catch(ex) {
        			        Logger.log(ex);
        			    }
        			}
        		};
        	}
        },
		"no-eval" : {
		    description: 'Disallow use of eval function',
		    rule: function(context) {
        		return {
        			"CallExpression": function(node) {
        				try {
        					var name = node.callee.name;
        					if(!name) {
        						return;
        					}
        					if('eval' === name) {
        						context.report(node.callee, "${0} function calls are discouraged.", {0:'\'eval\''}, context.getTokens(node.callee)[0]);
        					}
        					else if('setInterval' === name || 'setTimeout' === name) {
        						if(node.arguments.length > 0) {
        							var arg = node.arguments[0];
        							if(arg.type === 'Literal') {
        								context.report(node.callee, "${0} function calls are discouraged.", {0:'Implicit \'eval\''}, context.getTokens(node.callee)[0]);
        							}
        							else if(arg.type === 'Identifier') {
        								//lets see if we can find it definition
        								var scope = context.getScope();
        								var decl = util.getDeclaration(arg, scope);
        								if (decl && decl.defs && decl.defs.length) {
        									var def = decl.defs[0];
        									var dnode = def.node;
        									if(def.type === 'Variable' && dnode && dnode.type === 'VariableDeclarator' &&
        										dnode.init && dnode.init.type === 'Literal') {
        										context.report(node.callee, "${0} function calls are discouraged.", {0:'Implicit \'eval\''}, context.getTokens(node.callee)[0]);
        									}
        								}
        							}
        						}
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		"no-extra-semi": {
		    description: 'Warn about extraneous semi colons',
		    rule: function(context) {
        		return {
        			"EmptyStatement": function(node) {  //$NON-NLS-0$
        				try {
        					var tokens = context.getTokens(node);
        					var t = tokens[tokens.length - 1];
        					if (t && t.type === "Punctuator" && t.value === ";") {  //$NON-NLS-0$  //$NON-NLS-1$
        						context.report(node, "Unnecessary semicolon.", null, t /* expose the bad token */);
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		'no-fallthrough' : {
		    description: 'Warn when a switch case falls through',
		    rule: function(context) {
        		function fallsthrough(node) {
        		    // cases with no statements or only a single case are implicitly fall-through
        		    if(node.consequent) {
        		        var statements = node.consequent;
        		        if(statements.length > 0 && statements[0].type === 'BlockStatement') {
        		            statements = statements[0].body;
        		        }
        		        if(statements.length < 1) {
        					return false;
        				}
        		        var statement = null;
        		        for(var i = 0; i < statements.length; i++) {
        		            statement = statements[i];
        		            if(util.returnableStatement(statement)) {
        		                return false;
        		            }
        		        }
        		        return true;
        		    }
        		    return false;
        		}
        		
        		return {
        			'SwitchStatement' : function(node) {
        			    try {
            			    if(node.cases && node.cases.length > 1) {
            			        //single case is implicitly fallthrough
            			        var caselen  = node.cases.length;
            			       cases: for(var i = 0; i < caselen; i++) {
            			            if(i+1 === caselen) {
            			                //last node is implicitly fall-through
            			                break;
            			            }
            			            if(fallsthrough(node.cases[i])) {
            			                //corect the highlighting to match eclipse
            			                var reportednode = node.cases[i+1];
            			                if(reportednode.test) {
            			                    reportednode.range[1] = reportednode.test.range[1];
            			                } else {
            			                    //default case - tag the token
            			                    var tokens = context.getTokens(reportednode);
            			                    if(tokens && tokens.length > 0) {
            			                        reportednode.range[1] = tokens[0].range[1];
            			                    }
            			                }
            			                var len = reportednode.leadingComments ? reportednode.leadingComments.length : 0;
            			                if(len > 0) {
                        		            var comment = null;
                        		            for(var c = 0; c < len; c++) {
                        		                comment = reportednode.leadingComments[c];
                        		                if(/\s*\$FALLTHROUGH\$\s*/.test(comment.value)) {
                        		                    continue cases;
                        		                }
                        		            }
                        		        }
            			                context.report(reportednode, 'Switch case may be entered by falling through the previous case.');
            			            }
            			        }
            			    }
        			    }
        			    catch(ex) {
        			        Logger.log(ex);
        			    }
        			 }
        		};
        	}
        },
		'no-jslint': {
		    description: 'Warn when the jslint/jshint directive is used',
		    rule: function(context) {
        		return {
        			'Program' : function(node) {
        			    try {
            			    var comments = node.comments;
            			    var len;
            			    if(comments && (len = comments.length) && comments.length > 0) {
            			        for(var i = 0; i < len; i++) {
            			            var comment = comments[i];
            			            if(comment.type === 'Block') {
            			                var match = /^\s*(js[l|h]int)(\s+\w+:\w+)+/ig.exec(comment.value);
            			                if(match) {
            			                    var jslint = match[1];
            			                    if(jslint.length < 1) {
            			                        continue;
            			                    }
            			                    var start = 2 + comment.value.indexOf(jslint) + comment.range[0];
            			                    var end = start + jslint.length;
            			                    context.report({type:'BlockComment', range:[start, end], loc: comment.loc}, 'The \'${0}\' directive is unsupported, please use eslint-env.', {0:jslint});
            			                }
            			            }
            			        }
            			    }
        			    }
        			    catch(ex) {
        			        Logger.log(ex);
        			    }
        			 }
        		};
        	}
        },
		"no-new-array": {
		    description: 'Disallow use of the Array constructor',
		    rule: function(context) {
        		return util.createNewBuiltinRule("Array", "Use the array literal notation '[]'.", context); //$NON-NLS-0$
        	}
        },
		"no-new-func": {
		    description: 'Disallow use of the Function constructor',
		    rule: function(context) {
        		return util.createNewBuiltinRule("Function", "The Function constructor is eval.", context);
        	}
        },
		"no-new-object": {
		    description: 'Disallow use of the Object constructor',
		    rule: function(context) {
        		return util.createNewBuiltinRule("Object", "Use the object literal notation '{}' or Object.create(null).", context); //$NON-NLS-0$
        	}
        },
		"no-new-wrappers": {
		    description: 'Disabllow creating new String, Number or Boolean via their constructor',
		    rule: function(context) {
        		var wrappers = ["String", "Number", "Math", "Boolean", "JSON"]; //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
        
        		return util.createNewBuiltinRule(wrappers, function(context, node, symbol) {
        			context.report(node, "Do not use '${0}' as a constructor.", [symbol]); //$NON-NLS-1$
        		}, context);
        	}
        },
		"no-redeclare": {
		    description: 'Warn when variable or function is redeclared',
		    rule: function(context) {
                "use strict"; //$NON-NLS-0$

                function reportRedeclaration(node, name) {
                    context.report(node, "'${0}' is already defined.", {0:name});
                }

                function checkScope(node) {
                    try {
                        var scope = context.getScope();
                        if(node.type === "FunctionExpression" && node.id && node.id.name) {
                            scope  = scope.upper;
                        }
                        scope.variables.forEach(function(variable) {
                            // If variable has multiple defs, every one after the 1st is a redeclaration
                            variable.defs.slice(1).forEach(function(def) {
                                reportRedeclaration(def.name, def.name.name);
                            });
                        });
                    }
                    catch(ex) {
                        Logger.log(ex);
                    }
                }

                return {
                    "Program": checkScope,  //$NON-NLS-0$
                    "FunctionDeclaration": checkScope,  //$NON-NLS-0$
                    "FunctionExpression": checkScope,  //$NON-NLS-0$
                    "ArrowFunctionExpression": checkScope, //$NON-NLS-0$
                };
        	}
        },
        "no-shadow": {
            description: "Warn when shadowing variable from upper scope",
            rule: function(context) {
                "use strict"; //$NON-NLS-0$

                var hasOwnProperty = Object.prototype.hasOwnProperty;
                function addVariables(map, scope) {
                    scope.variables.forEach(function(variable) {
                        var name = variable.name;
                        if (!variable.defs.length) { // Ignore the synthetic 'arguments' variable
                            return;
                        } if (!hasOwnProperty.call(map, name)) {
                            map[variable.name] = scope;
                        }
                    });
                }

                /**
                 * @returns {Object} A map of {String} -> {Scope}. Keys are symbol names, values are the 
                 * uppermost scope that binds the name.
                 */
                function createSymbolMap(scope) {
                    var upper = scope.upper;
                    var symbols = Object.create(null);

                    // Hack to walk past upper scope lacking a _namedFunctions map. This happens because escope generates
                    // 2 scopes for a FunctionExpression. The first is never returned by context.getScope() as it is not
                    // the innermost, so this rule never visits it.
                    while (upper && !upper._symbols) { upper = upper.upper; }
                    if (upper) {
                        // Propagate upper scope's named functions to ours
                        util.mixin(symbols, upper._symbols);
                    }
                    addVariables(symbols, scope);
                    scope._symbols = symbols;
                    return symbols;
                }

                function reportShadow(node, name) {
                    context.report(node, "'${0}' is already declared in the upper scope.", {0: name});
                }

                function isParameter(variable) {
                    return variable.defs.some(function(def) {
                        return def.type === "Parameter";  //$NON-NLS-0$
                    });
                }

                function checkScope(node) {
                    try {
                        // Build map
                        var scope = context.getScope();
                        if (node.type === "FunctionExpression" && node.id && node.id.name) {
                            scope  = scope.upper;
                        }
                        var symbolMap = createSymbolMap(scope);

                        if (scope.type === "global") {//$NON-NLS-0$
                            return; // No shadowing can occur in the global (Program) scope
                        }
                        scope.variables.forEach(function(variable) {
                            if (!variable.defs.length) {
                                return; // Skip 'arguments'
                            }
                            // If variable's name was first bound in an upper scope, and the variable is not a parameter,
                            // flag it.
                            var bindingSource;
                            if ((bindingSource = symbolMap[variable.name]) && bindingSource !== scope && !isParameter(variable)) { //$NON-NLS-0$
                                reportShadow(variable.defs[0].name, variable.name);
                            }
                        });
                    } catch(ex) {
                        Logger.log(ex);
                    }
                }
                return {
                    "Program": checkScope, //$NON-NLS-0$
                    "FunctionDeclaration": checkScope, //$NON-NLS-0$
                    "FunctionExpression": checkScope, //$NON-NLS-0$
                    "ArrowFunctionExpression": checkScope, //$NON-NLS-0$
                };
            }
        },
		'no-sparse-arrays': {
		    description: 'Warn when sparse arrays are defined',
		    rule: function(context) {
        		return {
        			'ArrayExpression' : function(node){
        			    if(node.elements.indexOf(null) > -1) {
        			        context.report(node, "Sparse array declarations should be avoided.");
        			    }
        			}
        		};
        	}
        },
		"no-undef": {
		    description: 'Warn when used variable or function has not been defined',
		    rule: function(context) {
                function isImplicitGlobal(variable) {
                    return variable.defs.every(function(def) {
                        return def.type === "ImplicitGlobalVariable";  //$NON-NLS-0$
                    });
                }
            
                function getDeclaredGlobalVariable(scope, ref) {
                    var declaredGlobal = null;
                    scope.variables.some(function(variable) {
                        if (variable.name === ref.identifier.name) {
                            // If it's an implicit global, it must have a `writeable` field (indicating it was declared)
                            if (!isImplicitGlobal(variable) || Object.hasOwnProperty.call(variable, "writeable")) {  //$NON-NLS-0$
                                declaredGlobal = variable;
                                return true;
                            }
                        }
                        return false;
                    });
                    return declaredGlobal;
                }
                "use strict";  //$NON-NLS-0$
            
                return {
                    "Program": function(/*node*/) {  //$NON-NLS-0$
            			try {
            	            var globalScope = context.getScope();
            	
            	            globalScope.through.forEach(function(ref) {
            	                var variable = getDeclaredGlobalVariable(globalScope, ref),
            	                    name = ref.identifier.name;
            	                if (!variable) {
            	                    var env = Finder.findESLintEnvForMember(name);
            	                    var inenv = env ? '-inenv' : '';
            	                    var nls = 'no-undef-defined';
            	                    context.report(ref.identifier, "'${0}' is not defined.", {0:name, nls: nls, pid: nls+inenv});
            	                } else if (ref.isWrite() && variable.writeable === false) {
            	                    context.report(ref.identifier, "'${0}' is read only.", {0:name, nls: 'no-undef-readonly'});
            	                }
            	            });
                    	}
                    	catch(ex) {
                    		Logger.log(ex);
                    	}
                    }
                };
            
            }
        },
		'no-unreachable' : {
		    description: 'Warn when code is not reachable',
		    rule: function(context) {
                /**
                 * @description Returns if the statement is 'hoisted'
                 * @param {Object} node The AST node to check
                 * @see http://www.adequatelygood.com/JavaScript-Scoping-and-Hoisting.html
                 * @returns {Boolean} If the node is hoisted (allowed) after a returnable statement
                 */
                function hoisted(node) {
                    switch(node.type) {
                        case 'FunctionDeclaration':
                        case 'VariableDeclaration':
                            return true;
                    }
                    return false;
                }
                
                /**
                 * @description Check the array of child nodes for any unreachable nodes
                 * @param {Array} children The child nodes to check
                 * @since 6.0
                 */
                function checkUnreachable(children) {
                    try {
                        var i = 0;
                        for(i; i < children.length; i++) {
                            if(util.returnableStatement(children[i])) {
                                break;
                            }
                        }
                        //mark all the remaining child statemnts as unreachable
                        for(i++; i < children.length; i++) {
                            var child = children[i];
                            if(!hoisted(child) && child.type !== "EmptyStatement") {
                                context.report(child, "Unreachable code.");
                            }
                        }
                    }
                    catch(ex) {
                        Logger.log(ex);
                    }
                }
        
                return {
                    "BlockStatement": function(node) {
                        checkUnreachable(node.body);
                    },
            
                    "SwitchCase": function(node) {
                        checkUnreachable(node.consequent);
                    }
                };
        	}
        },
		"no-unused-params" : {
		    description: 'Warn when function parameters are not used',
		    rule: function(context) {
                function hasCallbackComment(node) {
                    if(node.leadingComments) {
                        var len = node.leadingComments.length;
                        for(var i = 0; i < len; i++) {
                            var comment = node.leadingComments[i];
                            if(comment.type === 'Block' && /\s*(?:@callback)\s+/.test(comment.value)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
        
        		function check(node) {
        			try {
        				var scope = context.getScope();
        				var kids = scope.childScopes;
        				if(scope.functionExpressionScope && kids && kids.length) {
        					scope = kids[0];
        				}
        				scope.variables.forEach(function(variable) {
        					if (!variable.defs.length || variable.defs[0].type !== "Parameter") { // only care about parameters  //$NON-NLS-0$
        						return;
        					}
        					var defnode = variable.defs[0].name;
        					if (!variable.references.length) {
        					    var pid = 'no-unused-params';
        					    if(node.type === 'FunctionExpression') {
        					        pid += '-expr';
        					        if(hasCallbackComment(node)) {
        					            return;
        					        }
        					        if(node.parent.type === 'Property' && hasCallbackComment(node.parent)) {
        					            return;
        					        }
        					    }
        						context.report(defnode, "Parameter '${0}' is never used.", {0:defnode.name, pid: pid}); //$NON-NLS-0
        					}
        				});
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        
        		return {
        			"FunctionDeclaration": check,  //$NON-NLS-0$
        			"FunctionExpression": check  //$NON-NLS-0$
        		};
        	}
        },
		"no-unused-vars": {
		    description: 'Warn when declared variables are not used',
		    rule: function(context) {
        		function isRead(ref) {
        			return ref.isRead();
        		}
        
        		function getReferences(scope, variable) {
        			var refs = variable.references;
        			if (scope.type === "global") {  //$NON-NLS-0$
        				// For whatever reason, a reference to some variable 'x' defined in global scope does not cause an entry
        				// in x.references or globalScope.references. So we append any refs in globalScope.through that mention x.
        				refs = refs.concat(scope.through.filter(function(ref) {
        					return ref.identifier.name === variable.name;
        				}));
        			}
        			return refs;
        		}
        
        		function check(/**node*/) {
        			try {
        				var scope = context.getScope();
        				scope.variables.forEach(function(variable) {
        					if (!variable.defs.length || variable.defs[0].type === "Parameter") { // Don't care about parameters  //$NON-NLS-0$
        						return;
        					}
        					var references = getReferences(scope, variable), id = variable.defs[0].node.id;
        					if (!references.length) {
        						context.report(id, "'${0}' is never used.", {0:id.name, nls: 'no-unused-vars-unused'});
        					} else if (!references.some(isRead)) {
        						context.report(id, "'${0}' is never read.", {0:id.name, nls: 'no-unused-vars-unread'});
        					}
        				});
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        
        		return {
        			"Program": check,  //$NON-NLS-0$
        			"FunctionDeclaration": check,  //$NON-NLS-0$
        			"FunctionExpression": check  //$NON-NLS-0$
        		};
        	}
        },
		"no-use-before-define": {
		    description: 'Warn when a variable or function is used before it is defined',
		    rule: function(context) {
                function booleanOption(b, defaultValue) {
            		return typeof b === "boolean" ? b : defaultValue;  //$NON-NLS-0$
            	}
        
        		var options = context.options,
        		    flag_vars = booleanOption(options[0], true),   // by default, flag vars
        		    flag_funcs = booleanOption(options[1], false); // ... but not funcs
        
        		function check(/**node*/) {
        				try {
        				var scope = context.getScope();
        				scope.references.forEach(function(ref) {
        					var decl = util.getDeclaration(ref, scope), identifier = ref.identifier, name = identifier.name, defs;
        					if (decl && (defs = decl.defs).length && identifier.range[0] < defs[0].node.range[0]) {
        						var defType = defs[0].type;
        						if ((!flag_funcs && defType === "FunctionName") || (!flag_vars && defType === "Variable")) {  //$NON-NLS-0$  //$NON-NLS-1$
        							return;
        						}
        						context.report(identifier, "'${0}' was used before it was defined.", {0:name});
        					}
        				});
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        
        		return {
        			"Program": check,  //$NON-NLS-0$
        			"FunctionExpression": check,  //$NON-NLS-0$
        			"FunctionDeclaration": check  //$NON-NLS-0$
        		};
        	}
        },
        "radix": {
            description: "Warn when parseInt() is called without the 'radix' parameter.",
            rule: function(context) {
                function checkParseInt(call) {
                    var callee = call.callee;
                    if (callee.name === "parseInt" && callee.type === "Identifier" && call.arguments.length < 2) { //$NON-NLS-1$ //$NON-NLS-0$
                        // Ensure callee actually resolves to the global `parseInt`
                        var shadowed = false;
                        for (var scope = context.getScope(); scope; scope = scope.upper) { //$NON-NLS-0$
                            shadowed = scope.variables.some(function(variable) {
                                // Found a `parseInt` that is not the builtin
                                return variable.name === "parseInt" && variable.defs.length; //$NON-NLS-0$
                            });
                            if (shadowed) {
                                break;
                            }
                        }
                        if (!shadowed) {
                            context.report(callee, "Missing radix parameter.", null);
                        }
                    }
                }
                return {
                    "CallExpression": checkParseInt
                };
            }
        },
		"semi": {
		    description: 'Warn about missing semicolons',
		    rule: function(context) {
        		function checkForSemicolon(node) {
        			try {
        				var tokens = context.getTokens(node);
        				var len = tokens.length;
        				var t = tokens[len - 1];
        				if (t && t.type === "Punctuator" && t.value === ";") {  //$NON-NLS-0$  //$NON-NLS-1$
        					return;
        				}
        				context.report(node, "Missing semicolon.", null, t /* expose the bad token */);
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        
        		function checkVariableDeclaration(node) {
        			try {
        				var ancestors = context.getAncestors(node),
        				    parent = ancestors[ancestors.length - 1],
        				    parentType = parent.type;
        				if ((parentType === "ForStatement" && parent.init === node) || (parentType === "ForInStatement" && parent.left === node)){  //$NON-NLS-0$  //$NON-NLS-1$
        					// One of these cases, no semicolon token is required after the VariableDeclaration:
        					// for(var x;;)
        					// for(var x in y)
        					return;
        				}
        				checkForSemicolon(node);
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}
        
        		return {
        			"VariableDeclaration": checkVariableDeclaration,  //$NON-NLS-0$
        			"ExpressionStatement": checkForSemicolon,  //$NON-NLS-0$
        			"ReturnStatement": checkForSemicolon,  //$NON-NLS-0$
        		};
        	}
        },
		"throw-error": {
		    description: 'Warn when a non-Error object is used in a throw statement',
		    rule: function(context) {
        		function checkThrowArgument(node) {
        			try {
        				var argument = node.argument;
        				// We have no type analysis yet, so to avoid false positives, assume any expr that *could*
        				// generate an Error actually does.
        				switch (node.argument.type) {
        					case "NewExpression":
        					case "Identifier":
        					case "CallExpression":
        					case "MemberExpression":
        					case "ConditionalExpression": // throw y ? x : y;
        					case "LogicalExpression":     // throw x || y;
        					case "SequenceExpression":    // throw 1, 2, new Error(); // throws an Error. weird but true
        						return;
        				}
        				context.report(argument, "Throw an Error instead.");
        			} catch (ex) {
        				Logger.log(ex);
        			}
        		}
        
        		return {
        			"ThrowStatement": checkThrowArgument //$NON-NLS-0$
        		};
        	}
        },
		"use-isnan" : {
		    description: 'Disallow comparison to the value NaN',
		    rule: function(context) {
        		return {
        			'BinaryExpression' : function(node) {
        				try {
        					if(node.left.type === 'Identifier' && node.left.name === 'NaN') {
        						context.report(node.left, 'Use the isNaN function to compare with NaN.', null, node.left);
        					} else if(node.right.type === 'Identifier' && node.right.name === 'NaN') {
        						context.report(node.right, 'Use the isNaN function to compare with NaN.', null, node.right);
        					}
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		'valid-typeof' : {
		    description: 'Warn when incorrectly comparing the result of a typeof expression',
		    rule: function(context) {
        		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
        		var symbols = ['undefined', 'object', 'function', 'boolean', 'number', 'string', 'symbol'];
        		
        		return {
        			'UnaryExpression' : function(node){
        			    if(node.operator === 'typeof') {
        			        var parent = node.parent;
        			        if(parent && parent.type === 'BinaryExpression' && 
        			             (parent.right.type !== 'Literal' || symbols.indexOf(parent.right.value) < 0)) {
        			            context.report(parent.right, "Invalid typeof comparison.");
        			        }
        			    }
        			}
        		};
        	}
        }
    };
    
    /**
     * @name getRules
     * @description The raw rule object
     * @returns {Object} The raw rule object
     */
    function getRules() {
        return rules;
    }
    
    /**
     * @name getESLintRules
     * @description Returns the rule object for ESLint
     * @returns {Object} The rule object
     * @since 7.0
     */
    function getESLintRules() {
        var ruleobj = Object.create(null);
        var keys = Object.keys(rules);
        for (var i=0; i<keys.length; i++) {
            var rule = keys[i];
            ruleobj[rule] = rules[rule].rule;
        }
        return ruleobj;
    }
		    
	return {
	    getRules: getRules,
	    getESLintRules: getESLintRules
	};
});
