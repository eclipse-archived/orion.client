/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
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
'estraverse',
'orion/editor/stylers/application_javascript/syntax'
], function(util, Logger, Finder, Estraverse, JsSyntax) {
	
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
                function validComment(comments) {
                    if(comments && comments.leading) {
                        var len = comments.leading.length;
                        return len > 0 && comments.leading[len-1].type === 'Block';
                    }
                    return false;
                }
        		function checkDoc(node) {
        			try {
        				var comments;
        				var name;
        				switch(node.type) {
        					case 'Property':  //$NON-NLS-0$
        						if(node.value && (node.value.type === 'FunctionExpression')) {  //$NON-NLS-0$  //$NON-NLS-1$
        							comments = context.getComments(node);
        							if(comments.leading.length < 1 && comments.trailing.length < 1) {
        							    //TODO see https://github.com/jquery/esprima/issues/1071
    							        comments = context.getComments(node.key);
        							}
        							if(!validComment(comments)) {
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
    							comments = context.getComments(node);
    							if(comments.leading.length < 1 && comments.trailing.length < 1) {
    							    //TODO see https://github.com/jquery/esprima/issues/1071
							        comments = context.getComments(node.id);
    							}
    							if(!validComment(comments)) {
    								context.report(node.id, 'Missing documentation for function \'${0}\'.', {0:node.id.name}, { type: 'decl' });
    							}
        						break;
        					case 'ExpressionStatement':  //$NON-NLS-0$
        						if(node.expression && node.expression.type === 'AssignmentExpression') {  //$NON-NLS-0$  //$NON-NLS-1$
        							var anode = node.expression;
        							if(anode.right && (anode.right.type === 'FunctionExpression') && anode.left && (anode.left.type === 'MemberExpression')) {  //$NON-NLS-0$  //$NON-NLS-1$
        								//comments are attached to the enclosing expression statement
        								comments = context.getComments(node);
        								if(comments.leading.length < 1 && comments.trailing.length < 1) {
            							    //TODO see https://github.com/jquery/esprima/issues/1071
        							        comments = context.getComments(anode.left);
            							}
        								if(!validComment(comments)) {
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
                        var func = Finder.findParentFunction(node);
                        if(func) {
                            var object = node.object;
                            if (!object || object.name !== "arguments" || object.type !== "Identifier") { //$NON-NLS-1$ //$NON-NLS-0$
                                return;
                            }
                            var prop = node.property;
                            var name = prop.name ? prop.name : prop.value;
                            if (name === "callee" || name === "caller") {//$NON-NLS-1$ //$NON-NLS-0$
                                context.report(prop, "'arguments.${0}' is deprecated.", {0: name});
                            }
                        }
                    }
                };
            }
        },
        "no-comma-dangle": {
            description: 'Report extra trailing comma in object expressions',
            rule: function(context) {
                return {
                    'ObjectExpression': function(node) {
                        var token  = context.getLastToken(node, 1);
                        if(token && token.value === ',') {
                            context.report(node, 'Trailing commas in object expressions are discouraged.', null, token);
                        }
                    }
                };
            }
        },
        "no-cond-assign": {
            description: 'Disallow assignment statements in control statements like if-else, do-while, while and for statements',
            rule: function(context) {
                
                var statements = {
                    'IfStatement': true,
                    'DoWhileStatement': true,
                    'WhileStatement': true,
                    'ForStatement': true
                };
                
                function isParenthesised(node) {
                    var type = node.parent.type;
                    if(statements[type]) {
                        //if its direct parent is the control statement, check for double parenthesis
                        if(type !== 'ForStatement') {
                            return context.getTokenBefore(node, 1).value === '(';
                        }
                    }
                    return context.getTokenBefore(node).value === '(';
                }
                function skip(node) {
                    switch(node.type) {
                        case 'FunctionExpression':
                        case 'ObjectExpression':
                        case 'CallExpression':
                        case 'ArrayExpression': {
                            return true;
                        }
                        default: return false;
                    }
                }
                function checkForAssignment(node) {
                    var assigns = [];
                    if(node.test === null) {
                        return;
                    }
                    node.test.parent = node;
                    Estraverse.traverse(node.test, {
                        enter: function(n, parent) {
                            if(n.range[0] > node.test.range[1]) {
                                //once we've left the test object 
                                return Estraverse.VisitorOption.Break;
                            }
                            if(skip(n)) {
                                return Estraverse.VisitorOption.Skip;
                            }
                            if(parent) {
                                n.parent = parent;
                            }
                            if(n && n.type === 'AssignmentExpression') {
                                assigns.push(n);
                            }
                        }
                    });
                    var len = assigns.length;
                    if(len > 0) {
                        for(var i = 0; i < len; i++) {
                            var assign = assigns[i];
                            if(!isParenthesised(assign)) {
                                assign.range[0] = assign.left.range[0]; //mark only from the start of first part
                                context.report(assign, 'Expected a conditional expression and instead saw an assignment.');
                            }
                        }
                    }
                }
                
                return {
                  'IfStatement': checkForAssignment,
                  'WhileStatement': checkForAssignment,
                  'ForStatement': checkForAssignment,
                  'DoWhileStatement': checkForAssignment
                };
            }
        },
        "no-console": {
            description: 'Disallow the use of \'console\' in browser-run code',
            rule: function(context) {
                return {
                    'MemberExpression': function(node) {
                        if(node.object.name === 'console') {
                            //are we using the browser env?
                            if(context.env && context.env['browser']) {
                                context.report(node.object, 'Discouraged use of console in browser-based code.');
                            }
                        }
                    }
                };
            }
        },
        "no-constant-condition": {
            description: 'Disallow use of a constant value as a conditional expression',
            rule: function(context) {
                /**
                 * @param {Object} node The AST node
                 * @returns {Boolean} If the given node has a 'truthy' constant value
                 */
                function isConst(node) {
                    switch(node.type) {
                        case 'Literal':
                        case 'ObjectExpression':
                        case 'FunctionExpression': 
                        case 'ArrayExpression': {
                            return true;
                        }
                        case 'BinaryExpression': 
                        case 'LogicalExpression': {
                            return isConst(node.left) && isConst(node.right);
                        }
                        case 'UnaryExpression': {
                            return isConst(node.argument);
                        }
                        default: return false;
                    }
                }
                function checkCondition(node) {
                    if(node && node.test && isConst(node.test)) {
                        context.report(node.test, 'Discouraged use of constant as a conditional expression.');                    
                    }
                }
                
                return {
                    'IfStatement': checkCondition,
                    'WhileStatement': checkCondition,
                    'DoWhileStatement': checkCondition,
                    'ForStatement': checkCondition,
                    'ConditionalExpression': checkCondition
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
        		            var stmts = statements.shift(); //take the block statement off the list, it is not returnable
        		            if(stmts.body.length > 0) {
        		                statements = [].concat(statements, stmts.body); //remove the block statement
        		            }
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
            			                var comments = reportednode.leadingComments;
            			                if(!comments && reportednode.test) {
            			                    //TODO see https://github.com/jquery/esprima/issues/1071
            			                    comments = reportednode.test.leadingComments; 
            			                }
            			                if(comments) {
                        		            var comment = null;
                        		            for(var c = 0; c < comments.length; c++) {
                        		                comment = comments[c];
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
        "no-iterator": {
            description: "Warn when the __iterator__ property is used",
            rule: function(context) {
                return {
                    'MemberExpression': function(node) {
                        if(node.property != null) {
                            if(node.computed) {
                                if(node.property.value === '__iterator__') {
                                    context.report(node.property, 'Discouraged __iterator__ property use.');
                                }
                            } else if(node.property.name === '__iterator__') {
                                context.report(node.property, 'Discouraged __iterator__ property use.');    
                            }
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
                    "ArrowFunctionExpression": checkScope //$NON-NLS-0$
                };
        	}
        },
        "no-regex-spaces": {
            description: "Warn when multiple spaces are used in regular expressions",
            rule: function(context) {
                
                function reportSpaces(node) {
                    var regex = /( {2,})/g;
                    var val = null;
                    while((val = regex.exec(node.raw)) != null) {
                        var start = node.range[0]+val.index;
                        var len = val[0].length;
                        context.report({type: 'Literal', range:[start, start+len], loc: node.loc}, 
                                        'Avoid multiple spaces in regular expressions. Use \' {${0}}\' instead.', {0:len});
                    }
                }
                
                return {
                    'Literal': function(node) {
                        if(node.parent && node.parent.type === 'NewExpression') {
                            if(node.parent.callee.name === 'RegExp') {
                                reportSpaces(node);
                            }
                        }
                        var tok = context.getFirstToken(node);
                        if(tok && tok.type === 'RegularExpression') {
                            reportSpaces(node);
                        }
                    }  
                };
            }
        },
        "no-reserved-keys": {
            description: "Warn when a reserved word is used as a property key",
            rule: function(context) {
                return {
                    'ObjectExpression': function(node) {
                        if(node.properties) {
                            for(var i = 0; i < node.properties.length; i++) {
                                var prop = node.properties[i];
                                if(prop.key.type === 'Identifier' && JsSyntax.keywords.indexOf(prop.key.name) > -1) {
                                    context.report(prop.key, 'Reserved words should not be used as property keys.');
                                }
                            }
                        }
                    }
                };
            }
        },
        "no-shadow": {
            description: "Warn when shadowing variable from upper scope",
            rule: function(context) {
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
                    "ArrowFunctionExpression": checkScope //$NON-NLS-0$
                };
            }
        },
        "no-shadow-global": {
            description: 'Warn when a variable or parameter shadows a member from the global environment',
            rule: function(context) {
                
                function checkShadow(node) {
                    var env = context.env ? context.env : {};
                    env.builtin = true;
                    switch(node.type) {
                        case 'VariableDeclarator': {
                            if(env[Finder.findESLintEnvForMember(node.id.name)]) {
                                context.report(node.id, "Variable '${0}' shadows a global member", {0: node.id.name});
                            }
                            break;
                        }
                        case 'FunctionExpression':
                        case 'FunctionDeclaration': {
                            node.params.forEach(function(param) {
                                if(param.type === 'Identifier' && env[Finder.findESLintEnvForMember(param.name)]) {
                                    context.report(param, "Parameter '${0}' shadows a global member", {0: param.name, nls:'no-shadow-global-param'});
                                }
                            });
                            break;
                        }
                    }
                }
                
                return {
                    'FunctionExpression': checkShadow,
                    'FunctionDeclaration': checkShadow,
                    'VariableDeclarator': checkShadow
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
        "no-throw-literal": {
            description: 'Warn when a Literal is used in a throw statement',
            rule: function(context) {
                return {
                    "ThrowStatement": function(node) {
                        try {
                            var argument = node.argument;
                            // We have no type analysis yet, so to avoid false positives, assume any expr that
                            // *could* generate an Error actually does.
                            switch (argument.type) {
                                case "Identifier":
                                    if (argument.name !== "undefined") {
                                        return;
                                    }
                                //$FALLTHROUGH$
                                case "Literal":
                                case "ObjectExpression":
                                case "ArrayExpression":
                                    context.report(argument, "Throw an Error instead.");
                            }
                        } catch (ex) {
                            Logger.log(ex);
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
                    if(node && node.leadingComments) {
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
        					        if(hasCallbackComment(node) || (node.params && node.params.length > 0 && hasCallbackComment(node.params[0]))) { 
        					            return;
        					        }
        					        var parent = node.parent;
        					        if(parent.type === 'Property' && (hasCallbackComment(parent) || hasCallbackComment(parent.key))) {
        					            return;
        					        }
        					        if(parent.type === 'MemberExpression') {
        					            //https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
        					            // func epxrs part of call expressions, i.e. bind-like calls
        					            //Esprima tags the root containing expression with the doc, not the func expr
        					            parent = parent.parent;
        					            if(parent.type === 'CallExpression' && hasCallbackComment(parent)) {
        					               return;
        					            }
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
        					var node = variable.defs[0].node;
        					var references = getReferences(scope, variable), id = node.id;
        					if (!references.length) {
        					    if(node.type === 'FunctionDeclaration') {
        					       context.report(id, "Function '${0}' is never used.", {0:id.name, nls: 'no-unused-vars-unused-funcdecl'});
        					    } else {
        						   context.report(id, "'${0}' is never used.", {0:id.name, nls: 'no-unused-vars-unused'});
        						}
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
        			"ThrowStatement": checkForSemicolon,  //$NON-NLS-0$
        			"BreakStatement": checkForSemicolon,  //$NON-NLS-0$
        			"ContinueStatement": checkForSemicolon  //$NON-NLS-0$
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
        		var ops = ['==', '===', '!=', '!=='];
        		
        		return {
        			'UnaryExpression' : function(node){
        			    if(node.operator === 'typeof') {
        			        var parent = node.parent;
        			        var val = parent.left === node ? parent.right : parent.left;
        			        if(parent && parent.type === 'BinaryExpression' && 
        			             ops.indexOf(parent.operator) > -1 &&
        			             (val.type !== 'Literal' || symbols.indexOf(val.value) < 0)) {
        			            context.report(val, "Invalid typeof comparison.");
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
