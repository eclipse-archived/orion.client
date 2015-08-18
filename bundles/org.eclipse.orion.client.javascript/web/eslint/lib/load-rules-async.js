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
'i18n!javascript/nls/problems',
'estraverse',
'orion/editor/stylers/application_javascript/syntax'
], function(util, Logger, Finder, ProblemMessages, Estraverse, JsSyntax) {

    var rules = {
        "curly" : {
            description: ProblemMessages['curly-description'],
            url: 'http://eslint.org/docs/rules/curly', //$NON-NLS-1$
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
            						context.report(node.consequent, ProblemMessages['curly'], null /*, context.getTokens(node.consequent)[0]*/);
            					}
            					if(node.alternate && node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement') {
            						//flag the first token of the statement that should be in the block
            						context.report(node.alternate, ProblemMessages['curly'], null /*, context.getTokens(node.alternate)[0]*/);
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
            						context.report(node.body, ProblemMessages['curly'], null /*, context.getTokens(node.body)[0]*/);
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
		    description: ProblemMessages['eqeqeq-description'],
		    url: "http://eslint.org/docs/rules/eqeqeq", //$NON-NLS-1$
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
        						context.report(node, ProblemMessages['eqeqeq'], {0: expected, 1:op}, getOperatorToken(context, node));
        					} else if (op === "!=") {  //$NON-NLS-0$
        					    expected = '!==';
        						context.report(node, ProblemMessages['eqeqeq'], {0:expected, 1:op}, getOperatorToken(context, node));
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
		    description: ProblemMessages['missing-doc-description'],
		    url: 'http://eslint.org/docs/rules/valid-jsdoc', //$NON-NLS-1$
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
        								context.report(node.key, ProblemMessages['missing-doc'], {0:name}, { type: 'expr' }); //$NON-NLS-1$
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
    								context.report(node.id, ProblemMessages['missing-doc'], {0:node.id.name}, { type: 'decl' });  //$NON-NLS-1$
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
        									context.report(anode.left.property, ProblemMessages['missing-doc'], {0:name}, { type: 'expr' }); //$NON-NLS-1$
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
		    description: ProblemMessages['new-parens-description'],
		    url: 'http://eslint.org/docs/rules/new-parens', //$NON-NLS-1$
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
        								context.report(node.callee, ProblemMessages['new-parens'], null, tokens[0]);
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
            description: ProblemMessages['no-caller-description'],
            url: 'http://eslint.org/docs/rules/no-caller', //$NON-NLS-1$
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
                                context.report(prop, ProblemMessages['no-caller'], {0: name});
                            }
                        }
                    }
                };
            }
        },
        "no-comma-dangle": {
            description: ProblemMessages['no-comma-dangle-description'],
            url: 'http://eslint.org/docs/rules/no-comma-dangle', //$NON-NLS-1$
            rule: function(context) {
                return {
                    'ObjectExpression': function(node) {
                        var token  = context.getLastToken(node, 1);
                        if(token && token.value === ',') {
                            context.report(node, ProblemMessages['no-comma-dangle'], null, token);
                        }
                    }
                };
            }
        },
        "no-cond-assign": {
            description: ProblemMessages['no-cond-assign-description'],
            url: 'http://eslint.org/docs/rules/no-cond-assign', //$NON-NLS-1$
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
                                context.report(assign, ProblemMessages['no-cond-assign']);
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
            description: ProblemMessages['no-console-description'],
            url: 'http://eslint.org/docs/rules/no-console', //$NON-NLS-1$
            rule: function(context) {
                return {
                    'MemberExpression': function(node) {
                        if(node.object.name === 'console') {
                            //are we using the browser env?
                            if(context.env && context.env['browser']) {
                                context.report(node.object, ProblemMessages['no-console']);
                            }
                        }
                    }
                };
            }
        },
        "no-constant-condition": {
            description: ProblemMessages['no-constant-condition-description'],
            url: 'http://eslint.org/docs/rules/no-constant-condition', //$NON-NLS-1$
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
                        context.report(node.test, ProblemMessages['no-constant-condition']);
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
		    description: ProblemMessages['no-debugger-description'],
		    url: 'http://eslint.org/docs/rules/no-debugger', //$NON-NLS-1$
		    rule: function(context) {
        		return {
        			"DebuggerStatement": function(node) {
        				try {
        					context.report(node, ProblemMessages['no-debugger'], null, context.getTokens(node)[0]);
        				}
        				catch(ex) {
        					Logger.log(ex);
        				}
        			}
        		};
        	}
        },
		"no-dupe-keys" : {
		    description: ProblemMessages['no-dupe-keys-description'],
		    url: 'http://eslint.org/docs/rules/no-dupe-keys', //$NON-NLS-1$
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
        								context.report(prop, ProblemMessages['no-dupe-keys'], {0:name}, context.getTokens(prop)[0]);
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
		    description: ProblemMessages['no-empty-block-description'],
		    url: 'http://eslint.org/docs/rules/no-empty', //$NON-NLS-1$
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
            			        context.report(node, ProblemMessages['no-empty-block']);
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
		    description: ProblemMessages['no-eval-description'],
		    url: 'http://eslint.org/docs/rules/no-eval', //$NON-NLS-1$
		    rule: function(context) {
        		return {
        			"CallExpression": function(node) {
        				try {
        					var name = node.callee.name;
        					if(!name) {
        						return;
        					}
        					if('eval' === name) {
        						context.report(node.callee, ProblemMessages['no-eval'], {0:'\'eval\''}, context.getTokens(node.callee)[0]); //$NON-NLS-1$
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
		    description: ProblemMessages['no-extra-semi-description'],
		    url: 'http://eslint.org/docs/rules/no-extra-semi', //$NON-NLS-1$
		    rule: function(context) {
        		return {
        			"EmptyStatement": function(node) {  //$NON-NLS-0$
        				try {
        					var tokens = context.getTokens(node);
        					var t = tokens[tokens.length - 1];
        					if (t && t.type === "Punctuator" && t.value === ";") {  //$NON-NLS-0$  //$NON-NLS-1$
        						context.report(node, ProblemMessages['no-extra-semi'], null, t /* expose the bad token */);
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
		    description: ProblemMessages['no-fallthrough-description'],
		    url: 'http://eslint.org/docs/rules/no-fallthrough', //$NON-NLS-1$
		    rule: function(context) {
        		function fallsthrough(node) {
        		    // cases with no statements or only a single case are implicitly fall-through
        		    if(node.consequent) {
        		        var statements = node.consequent.slice(0);
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
            			                context.report(reportednode, ProblemMessages['no-fallthrough']);
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
        "no-implied-eval" : {
        	description: ProblemMessages['no-implied-eval-description'],
        	url: 'http://eslint.org/docs/rules/no-implied-eval', //$NON-NLS-1$
        	rule: function(context) {
        		return {
        			"CallExpression": function(node) {
        				try {
        					var name = node.callee.name;
        					if(!name) {
        						return;
        					}
        					if('setInterval' === name || 'setTimeout' === name) {
        						if(node.arguments.length > 0) {
        							var arg = node.arguments[0];
        							if(arg.type === 'Literal') {
        								context.report(node.callee, ProblemMessages['no-eval'], {0:'Implicit \'eval\''}, context.getTokens(node.callee)[0]); //$NON-NLS-1$
        							}
        							else if(arg.type === 'Identifier') {
        								//lets see if we can find it's definition
        								var scope = context.getScope();
        								var decl = util.getDeclaration(arg, scope);
        								if (decl && decl.defs && decl.defs.length) {
        									var def = decl.defs[0];
        									var dnode = def.node;
        									if(def.type === 'Variable' && dnode && dnode.type === 'VariableDeclarator' &&
        											dnode.init && dnode.init.type === 'Literal') {
        										context.report(node.callee, ProblemMessages['no-eval'], {0:'Implicit \'eval\''}, context.getTokens(node.callee)[0]); //$NON-NLS-1$
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
        "no-iterator": {
            description: ProblemMessages['no-iterator-description'],
            url: 'http://eslint.org/docs/rules/no-iterator', //$NON-NLS-1$
            rule: function(context) {
                return {
                    'MemberExpression': function(node) {
                        if(node.property != null) {
                            if(node.computed) {
                                if(node.property.value === '__iterator__') {
                                    context.report(node.property, ProblemMessages['no-iterator']);
                                }
                            } else if(node.property.name === '__iterator__') {
                                context.report(node.property, ProblemMessages['no-iterator']);
                            }
                        }
                    }
                };
            }
        },
        "no-proto": {
            description: ProblemMessages['no-proto-description'],
            url: 'http://eslint.org/docs/rules/no-proto.html', //$NON-NLS-1$
            rule: function(context) {
                return {
                    'MemberExpression': function(node) {
                        if(node.property != null) {
                            if(node.computed) {
                                if(node.property.value === '__proto__') {
                                    context.report(node.property, ProblemMessages['no-proto']);
                                }
                            } else if(node.property.name === '__proto__') {
                                context.report(node.property, ProblemMessages['no-proto']);
                            }
                        }
                    }
                };
            }
        },
		'no-jslint': {
		    description: ProblemMessages['no-jslint-description'],
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
            			                    context.report({type:'BlockComment', range:[start, end], loc: comment.loc}, ProblemMessages['no-jslint'], {0:jslint}); //$NON-NLS-1$
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
		    description: ProblemMessages['no-new-array-description'],
		    rule: function(context) {
        		return util.createNewBuiltinRule("Array", ProblemMessages['no-new-array'], context); //$NON-NLS-0$
        	}
        },
		"no-new-func": {
		    description: ProblemMessages['no-new-func-description'],
		    url: 'http://eslint.org/docs/rules/no-new-func', //$NON-NLS-1$
		    rule: function(context) {
        		return util.createNewBuiltinRule("Function", ProblemMessages['no-new-func'], context); //$NON-NLS-1$
        	}
        },
		"no-new-object": {
		    description: ProblemMessages['no-new-object-description'],
		    url: 'http://eslint.org/docs/rules/no-new-object', //$NON-NLS-1$
		    rule: function(context) {
        		return util.createNewBuiltinRule("Object", ProblemMessages['no-new-object'], context); //$NON-NLS-0$
        	}
        },
		"no-new-wrappers": {
		    description: ProblemMessages['no-new-wrappers-description'],
		    url: 'http://eslint.org/docs/rules/no-new-wrappers', //$NON-NLS-1$
		    rule: function(context) {
        		var wrappers = ["String", "Number", "Math", "Boolean", "JSON"]; //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ //$NON-NLS-5$

        		return util.createNewBuiltinRule(wrappers, function(context, node, symbol) {
        			context.report(node, ProblemMessages['no-new-wrappers'], [symbol]);
        		}, context);
        	}
        },
        "no-with": {
        	description: ProblemMessages['no-with-description'],
        	url: 'http://eslint.org/docs/rules/no-with', //$NON-NLS-1$
        	rule: function(context) {
        		return {'WithStatement': function(node) {
	        			context.report(node, ProblemMessages['no-with'], null, context.getFirstToken(node));
	        		}
        		};
        	}
        },
        "missing-nls": {
        	description: ProblemMessages['missing-nls-description'],
        	rule: function(context){
        		function reportNonNLS(node, index){
        			var data = Object.create(null);
        			data.indexOnLine = index;
        			context.report(node, ProblemMessages['missing-nls'], {0:node.value, data: data});
        		}

        		function mapCallees(arr, obj) {
        			for(var i = 0; i < arr.length; i++) {
        				obj[arr[i]] = true;
        			}
        		}

        		var callees = Object.create(null);
        		mapCallees(['require', 'requirejs', 'importScripts', 'define', 'Worker', 'SharedWorker', 'addEventListener', 'RegExp', //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$ //$NON-NLS-7$ //$NON-NLS-8$
        		'removeEventListener'], callees);  //$NON-NLS-1$

        		return {
                    'Literal': function(node) {
        				// Create a map of line numbers to a list of literal nodes
                    	if (typeof node.value === 'string' && node.value.length > 0){
                    		if (node.value.toLowerCase() === 'use strict'){
                    			return;
                    		}
                    		if(/^(?:[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+])$/.test(node.value)) {
                    			return; //don't nag about punctuation
                    		} else if(/^(?:==|!=|===|!==|=>)$/.test(node.value)) {
                    			return; //don't nag about operators
                    		}
                    		if (node.parent){
                    			switch(node.parent.type) {
                    				case 'UnaryExpression':
                    				case 'MemberExpression':
                    				case 'SwitchCase': {
                    					return;
                    				}
                    				case 'BinaryExpression': {
                    					if(node.parent.operator !== '+') {
                    						return;
                    					}
                    					break;
                    				}
                    				case 'Property': {
                    					if(node.parent.key === node) {
                    						return;
                    					}
                						var _p = node.parent.parent.parent;
                						if(_p && _p.type === 'CallExpression' && _p.callee && _p.callee.name === 'define') {
                							return;
                						}
                    					break;
                    				}
                    				case 'NewExpression':
                    				case 'CallExpression': {
                    					var callee = node.parent.callee;
                    					if(callee) {
                    						if(callee.type === 'MemberExpression' && callee.property && callees[callee.property.name]) {
                    							return;
                    						} else if(callees[callee.name]) {
                    							return;
                    						}
                    					}
                    					break;
                    				}
                    				case 'ArrayExpression': {
                    					_p = node.parent.parent;
                    					if(_p.type === 'CallExpression' && (_p.callee.name === 'define' || _p.callee.name === 'require' || _p.callee.name === 'requirejs')) {
                    						return;
                    					}
                    					break;
                    				}
                    			}
                    		}
                    		var lineNum = node.loc.end.line-1;
                    		if (!context._linesWithStringLiterals[lineNum]){
                    			context._linesWithStringLiterals[lineNum] = [];
                    		}
                    		context._linesWithStringLiterals[lineNum].push(node);
                    	}
                    },
                    /**
                     * @callback
                     */
                    'Program': function(node){
                    	context._linesWithStringLiterals = {};
                    },
                    /**
                     * @callback
                     */
                    'Program:exit': function(node){
                    	// Read each line in the map and check if there are non-nls statements
                    	if (context._linesWithStringLiterals){
                    		for (var lineNumber in context._linesWithStringLiterals) {
							    if (context._linesWithStringLiterals.hasOwnProperty(lineNumber)) {
							        var line = context.getSourceLines()[lineNumber];
							        var nodes = context._linesWithStringLiterals[lineNumber];

							        if (nodes){
								        var nonNlsRegExp = /\/\/\$NON-NLS-([0-9])+\$/g;
								        var match;
								        var comments = [];
								        while ((match = nonNlsRegExp.exec(line)) != null){
								        	comments.push(match[1]);
								        }

								        for (var i=0; i<nodes.length; i++) {
								        	match = false;
								        	for (var j=0; j<comments.length; j++) {

								        		// NON-NLS comments start at 1
								        		if (comments[j] === (""+(i+1))){
								        			match = true;
								        			break;
								        		}
								        		// For now allow NON-NLS-0 comments
								        		if (i===0 && comments[j] === '0'){
								        			match = true;
								        			break;
								        		}
								        	}
								        	if (!match){
								        		reportNonNLS(nodes[i], i);
								        	}
								        }
								    }

								    // TODO Report unused non-nls comments
							    }
							}
                    	}
                    }
				};
        	}
        },
		"no-redeclare": {
		    description: ProblemMessages['no-redeclare-description'],
		    url: 'http://eslint.org/docs/rules/no-redeclare', //$NON-NLS-1$
		    rule: function(context) {
                function reportRedeclaration(node, name) {
                    context.report(node, ProblemMessages['no-redeclare'], {0:name});
                }

                function checkScope() {
                    try {
                        var scope = context.getScope();
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
            description: ProblemMessages['no-regex-spaces-description'],
            url: 'http://eslint.org/docs/rules/no-regex-spaces', //$NON-NLS-1$
            rule: function(context) {

                function reportSpaces(node) {
                    var regex = /( {2,})/g;
                    var val = null;
                    while((val = regex.exec(node.raw)) != null) {
                        var start = node.range[0]+val.index;
                        var len = val[0].length;
                        context.report({type: 'Literal', range:[start, start+len], loc: node.loc},  //$NON-NLS-1$
                                        ProblemMessages['no-regex-spaces'], {0:len});
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
            description: ProblemMessages['no-reserved-keys-description'],
            url: 'http://eslint.org/docs/rules/no-reserved-keys', //$NON-NLS-1$
            rule: function(context) {
                return {
                    'ObjectExpression': function(node) {
                        if(node.properties) {
                            for(var i = 0; i < node.properties.length; i++) {
                                var prop = node.properties[i];
                                if(prop.key.type === 'Identifier' && JsSyntax.keywords.indexOf(prop.key.name) > -1) {
                                    context.report(prop.key, ProblemMessages['no-reserved-keys']);
                                }
                            }
                        }
                    }
                };
            }
        },
        "no-shadow": {
            description: ProblemMessages['no-shadow-description'],
            url: 'http://eslint.org/docs/rules/no-shadow', //$NON-NLS-1$
            rule: function(context) {
                function addVariables(map, scope) {
                    scope.variables.forEach(function(variable) {
                        var name = variable.name;
                        if (!variable.defs.length) { // Ignore the synthetic 'arguments' variable
                            return;
                        } if (!Object.prototype.hasOwnProperty.call(map, name)) {
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
                    context.report(node, ProblemMessages['no-shadow'], {0: name});
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
                            if (scope.type === "global") {//$NON-NLS-0$
	                            return; // No shadowing can occur in the global (Program) scope
	                        }
                        }
                        var symbolMap = createSymbolMap(scope);
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
            description: ProblemMessages['no-shadow-global-description'],
            rule: function(context) {

                function checkShadow(node) {
                    var env = context.env ? context.env : {};
                    env.builtin = true;
                    switch(node.type) {
                        case 'VariableDeclarator': {
                            if(env[Finder.findESLintEnvForMember(node.id.name)]) {
                                context.report(node.id, ProblemMessages['no-shadow-global'], {0: node.id.name});
                            }
                            break;
                        }
                        case 'FunctionExpression':
                        case 'FunctionDeclaration':
                        case 'ArrowFunctionExpression': {
                            node.params.forEach(function(param) {
                                if(param.type === 'Identifier' && env[Finder.findESLintEnvForMember(param.name)]) {
                                    context.report(param, ProblemMessages['no-shadow-global-param'], {0: param.name, nls:'no-shadow-global-param'}); //$NON-NLS-1$
                                }
                            });
                            break;
                        }
                    }
                }

                return {
                    'FunctionExpression': checkShadow,
                    'FunctionDeclaration': checkShadow,
                    'ArrowFunctionExpression': checkShadow,
                    'VariableDeclarator': checkShadow
                };
            }
        },
		'no-sparse-arrays': {
		    description: ProblemMessages['no-sparse-arrays-description'],
		    url: 'http://eslint.org/docs/rules/no-sparse-arrays', //$NON-NLS-1$
		    rule: function(context) {
        		return {
        			'ArrayExpression' : function(node){
        			    if(node.elements.indexOf(null) > -1) {
        			        context.report(node, ProblemMessages['no-sparse-arrays']);
        			    }
        			}
        		};
        	}
        },
        "no-throw-literal": {
            description: ProblemMessages['no-throw-literal-description'],
            url: 'http://eslint.org/docs/rules/no-throw-literal', //$NON-NLS-1$
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
                                    context.report(argument, ProblemMessages['no-throw-literal']);
                            }
                        } catch (ex) {
                            Logger.log(ex);
                        }
                    }
                };
           }
        },
		"no-undef": {
		    description: ProblemMessages['no-undef-description'],
		    url: 'http://eslint.org/docs/rules/no-undef', //$NON-NLS-1$
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
            	                    var inenv = env ? '-inenv' : ''; //$NON-NLS-1$
            	                    var nls = 'no-undef-defined'; //$NON-NLS-1$
            	                    context.report(ref.identifier, ProblemMessages['no-undef-defined'], {0:name, nls: nls, pid: nls+inenv});
            	                } else if (ref.isWrite() && variable.writeable === false) {
            	                    context.report(ref.identifier, ProblemMessages['no-undef-readonly'], {0:name, nls: 'no-undef-readonly'}); //$NON-NLS-1$
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
        'no-undef-init': {
        	description: ProblemMessages['no-undef-init-description'],
        	url: 'http://eslint.org/docs/rules/no-undef-init.html', //$NON-NLS-1$
        	rule: function(context) {
        		return {
        			'VariableDeclarator': function(node) {
        				if(node.init && node.init.type === 'Identifier' && node.init.name === 'undefined') {
    						context.report(node.init, ProblemMessages['no-undef-init']);
        				}
        			}
        		};
        	}
        },
		'no-unreachable' : {
		    description: ProblemMessages['no-unreachable-description'],
		    url: 'http://eslint.org/docs/rules/no-unreachable', //$NON-NLS-1$
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
                                context.report(child, ProblemMessages['no-unreachable']);
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
		    description: ProblemMessages['no-unused-params-description'],
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
        					    var pid = 'no-unused-params'; //$NON-NLS-1$
        					    if(node.type === 'FunctionExpression') {
        					        pid += '-expr'; //$NON-NLS-1$
        					        if(hasCallbackComment(node) || (node.params && node.params.length > 0 && hasCallbackComment(node.params[0]))) {
        					            return;
        					        }
        					        var parent = node.parent;
        					        switch(parent.type) {
        					        	case 'Property': {
        					        		if(hasCallbackComment(parent) || hasCallbackComment(parent.key)) {
        					        			return;
        					        		}
        					        		break;
        					        	}
        					        	case 'MemberExpression': {
	        					        	//https://bugs.eclipse.org/bugs/show_bug.cgi?id=457067
	        					            // func epxrs part of call expressions, i.e. bind-like calls
	        					            //Esprima tags the root containing expression with the doc, not the func expr
	        					            parent = parent.parent;
	        					            if(parent.type === 'CallExpression' && hasCallbackComment(parent)) {
	        					               return;
	        					            }
        					        		break;
        					        	}
        					        	case 'AssignmentExpression': {
        					        		var left = parent.left;
	        					        	if(left.type === 'MemberExpression') {
	        					        		if(hasCallbackComment(left)) {
	        					        			return;
	        					        		}
	        					        	} else if(left.type === 'Identifier') {
	        					        		if(hasCallbackComment(left)) {
	        					        			return;
	        					        		}
	        					        	}
        					        		break;
        					        	}
        					        	case 'VariableDeclarator': {
        					        		if(hasCallbackComment(parent.id)) {
        					        			return;
        					        		}
        					        		break;
        					        	}
        					        }
        					    } else if(node.type === 'ArrowFunctionExpression') {
        					    	pid += '-arrow'; //$NON-NLS-1$
        					    	/*
    					        	//check the parent: () => {a => {}}
    					        	//the comment is attached to the ExpressionStatement
    					        	if(node.parent.type === 'ExpressionStatement' && hasCallbackComment(node.parent)) {
    					        		return;
    					        	}
        					        */
        					    }
        						context.report(defnode, ProblemMessages['no-unused-params'], {0:defnode.name, pid: pid}); //$NON-NLS-0
        					}
        				});
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}

        		return {
        			"FunctionDeclaration": check,
        			"FunctionExpression": check,
        			"ArrowFunctionExpression": check
        		};
        	}
        },
		"no-unused-vars": {
		    description: ProblemMessages['no-unused-vars-description'],
		    url: 'http://eslint.org/docs/rules/no-unused-vars', //$NON-NLS-1$
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
        					       context.report(id, ProblemMessages['no-unused-vars-unused-funcdecl'], {0:id.name, nls: 'no-unused-vars-unused-funcdecl'}); //$NON-NLS-1$
        					    } else {
        						   context.report(id, ProblemMessages['no-unused-vars-unused'], {0:id.name, nls: 'no-unused-vars-unused'}); //$NON-NLS-1$
        						}
        					} else if (!references.some(isRead)) {
        						context.report(id, ProblemMessages['no-unused-vars-unread'], {0:id.name, nls: 'no-unused-vars-unread'}); //$NON-NLS-1$
        					}
        				});
        			}
        			catch(ex) {
        				Logger.log(ex);
        			}
        		}

        		return {
        			"Program": check,
        			"FunctionDeclaration": check,
        			"FunctionExpression": check,
        			"ArrowFunctonExpression": check
        		};
        	}
        },
		"no-use-before-define": {
		    description: ProblemMessages['no-use-before-define-description'],
		    url: 'http://eslint.org/docs/rules/no-use-before-define', //$NON-NLS-1$
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
        						context.report(identifier, ProblemMessages['no-use-before-define'], {0:name});
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
            description: ProblemMessages['radix-description'],
            url: 'http://eslint.org/docs/rules/radix', //$NON-NLS-1$
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
                            context.report(callee, ProblemMessages['radix'], null);
                        }
                    }
                }
                return {
                    "CallExpression": checkParseInt
                };
            }
        },
		"semi": {
		    description: ProblemMessages['semi-description'],
		    url: 'http://eslint.org/docs/rules/semi', //$NON-NLS-1$
		    rule: function(context) {
        		function checkForSemicolon(node) {
        			try {
        				var tokens = context.getTokens(node);
        				var len = tokens.length;
        				var t = tokens[len - 1];
        				if (t && t.type === "Punctuator" && t.value === ";") {  //$NON-NLS-0$  //$NON-NLS-1$
        					return;
        				}
        				context.report(node, ProblemMessages['semi'], null, t /* expose the bad token */);
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
		    description: ProblemMessages['use-isnan-description'],
		    url: 'http://eslint.org/docs/rules/use-isnan', //$NON-NLS-1$
		    rule: function(context) {
        		return {
        			'BinaryExpression' : function(node) {
        				try {
        					if(node.left.type === 'Identifier' && node.left.name === 'NaN') {
        						context.report(node.left, ProblemMessages['use-isnan'], null, node.left);
        					} else if(node.right.type === 'Identifier' && node.right.name === 'NaN') {
        						context.report(node.right, ProblemMessages['use-isnan'], null, node.right);
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
		    description: ProblemMessages['valid-typeof-description'],
		    url: 'http://eslint.org/docs/rules/valid-typeof', //$NON-NLS-1$
		    rule: function(context) {
        		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
        		var symbols = ['undefined', 'object', 'function', 'boolean', 'number', 'string', 'symbol']; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$ //$NON-NLS-7$
        		var ops = ['==', '===', '!=', '!=='];

        		return {
        			'UnaryExpression' : function(node){
        			    if(node.operator === 'typeof') {
        			        var parent = node.parent;
        			        var val = parent.left === node ? parent.right : parent.left;
        			        if(parent && parent.type === 'BinaryExpression' &&
        			             ops.indexOf(parent.operator) > -1 &&
        			             (val.type !== 'Literal' || symbols.indexOf(val.value) < 0)) {
        			            context.report(val, ProblemMessages['valid-typeof']);
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
