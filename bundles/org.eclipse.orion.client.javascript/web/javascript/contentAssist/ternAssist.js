/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Various improvements
 ******************************************************************************/
/*eslint-env amd */
define([
	'i18n!javascript/nls/messages',
    'orion/Deferred',
	'orion/objects',
	'javascript/finder',
	'javascript/compilationUnit',
	'orion/editor/templates',
	'javascript/contentAssist/templates',
	'javascript/hover',
	'eslint/load-rules-async',
	'eslint/conf/environments',
	'javascript/signatures',
	'javascript/util',
	'orion/editor/stylers/application_javascript/syntax',
	'orion/i18nUtil',
], function(Messages, Deferred, Objects, Finder, CU, mTemplates, Templates, Hover, Rules, ESLintEnv, Signatures, Util, JsSyntax, i18nUtil) {

	/**
	 * @description Creates a new delegate to create keyword and template proposals
	 */
	function TemplateProvider() {
	    //constructor
 	}
 	
 	TemplateProvider.prototype = new mTemplates.TemplateContentAssist([], []);
 	
 	Objects.mixin(TemplateProvider.prototype, {
 		uninterestingChars: ":!#$^&.?<>", //$NON-NLS-0$
 		
 		isValid: function(prefix, buffer, offset) {
			var char = buffer.charAt(offset-prefix.length-1);
			return !char || this.uninterestingChars.indexOf(char) === -1;
		},
		
		getTemplateProposals: function(prefix, offset, context, kind) {
			var proposals = [];
			var k = kind ? kind.kind : null;
			var templates = Templates.getTemplatesForKind(k); //this.getTemplates();
			for (var t = 0; t < templates.length; t++) {
				var template = templates[t];
				if (this.templateMatches(template, prefix, kind, context)) {
					var proposal = template.getProposal(prefix, offset, context);
					var obj = Object.create(null);
			        obj.type = 'markdown'; //$NON-NLS-1$
			        obj.content = 'Template source code:\n\n';
			        obj.content += proposal.proposal;
			        proposal.hover = obj;
			        proposal.style = 'emphasis'; //$NON-NLS-1$
					this.removePrefix(prefix, proposal);
					proposals.push(proposal);
				}
			}
			
			if (0 < proposals.length) {
				//sort the proposals by name
				proposals.sort(function(p1, p2) {
					if (p1.name < p2.name) {
						return -1;
					}
					if (p1.name > p2.name) {
						return 1;
					}
					return 0;
				});
				// if any templates were added to the list of 
				// proposals, add a title as the first element
				proposals.splice(0, 0, {
					proposal: '',
					description: 'Templates', //$NON-NLS-0$
					style: 'noemphasis_title', //$NON-NLS-0$
					unselectable: true
				});
			}
			return proposals;
		},
		
		templateMatches: function(template, prefix, kind, context) {
		    if(template.match(prefix)) {
		        //must match the prefix always
		        if(typeof context.line !== 'undefined') {
			        var len = context.line.length - (typeof prefix !== 'undefined' ? prefix.length : 0);
			        var line = context.line.slice(0, (len > -1 ? len : 0)).trim();
			        if(kind && kind.kind === 'jsdoc') {
			            // don't propose tag templates when one exists already on the same line
			            return !/^[\/]?[\*]+\s*[@]/ig.test(line);
			        } 
		        }
		        if(kind && kind.kind === 'doc') {
		            var comment = kind.node.value.trim();
		            if(comment) {
		                var idx = context.offset - prefix.length - kind.node.range[0];
		                if(idx > -1) {
		                    var val = /^(eslint-\w+|eslint?)(\s|$)/ig.exec(comment.slice(0, idx));
			                if(val) {
		                        //nothing else is allowed in the directives - eslint won't parse it
		                        return false;
			                }
		                } 
		            }
		        }
		        return true;
		    }
		    return false;
		}
 	});
 	
 	var provider = new TemplateProvider();

	/**
	 * @description Create the template proposals
	 * @private
	 * @param {Object} params The completion context
	 * @param {Object} kind The computed completion kind to make
	 * @param {String} buffer The compilation unit buffer
	 * @returns {Array} The array of template proposals
	 */
	function createTemplateProposals (params, kind, buffer) {
		if((typeof params.template === 'undefined' || params.template) && 
				provider.isValid(params.prefix, buffer, params.offset, params)) {
			return provider.getTemplateProposals(params.prefix, params.offset, params, kind);
		}
		return [];
	}
    
    /**
     * @description Get the prefix to use for the proposal, handles @-based prefixes
     * @param {Object} context The proposal context
     * @param {Object} kind The proposal kind we completing
     * @param {String} buffer The text
     * @returns {String} The prefix to use
     */
    function getPrefix(context, kind, buffer) {
    	var prefix = context.prefix;
    	if(kind && kind.kind) {
		    if(typeof prefix === 'string' && typeof context.line === 'string') {
		        switch(kind.kind) {
		            case 'doc':
		            case 'jsdoc': {
		                var index = context.offset-1;
		                var word = '', char = buffer.charAt(index);
		                //do an initial check before looping + regex'ing
		                if('{*,'.indexOf(char) > -1) {
	    		            return word;
	    		        }
			            if(char === '@') {
	    		            return '@';
	    		        }
		                while(index >= 0 && /\S/.test(char)) {
		                    word = char+word;
		                    if(char === '@') {
		                        //we want the prefix to include the '@'
	        		            return word;
	        		        }
		                    index--;
		                    char = buffer.charAt(index);
		                    if('{*,'.indexOf(char) > -1) {
		                        // we don't want the prefix to include the '*'
	    		                return word;
	    		            }
		                }
	                    return word;        		        
		            }
		        }
		    }
	    }
	    return prefix;
    }
    
    /**
	 * @description Computes the kind of context to complete in
	 * @param {Object} ast The backing AST to visit
	 * @param {Number} offset The offset into the source
	 * @param {String} contents The text of the file
	 * @return {Object} Returns the deferred node and the completion kind
	 */
	function getKind(ast, offset, contents) {
	    var node = Finder.findComment(offset, ast);
	    if(node) {
	        switch(node.type) {
	            case 'Block': {
	                var start  = node.range[0];
    		        if(contents.charAt(start) === '/' && contents.charAt(start+1) === '*') {
                        if(contents.charAt(start+2) === '*' && offset > start+2) { // must be past the second '*'
                            return {kind:'jsdoc', node: node};  
                        } else if(offset > start+1) { //must be past the '*'
        		            return {kind:'doc', node: node};
        		        }
    		        }
	            }
	            //$FALLTHROUGH$
	            default: return null;
	        }
	    } 
    	node = Finder.findNode(offset, ast, {parents:true});
    	if(node) {
    		if(node.parents && node.parents.length > 0) {
	    		var parent = node.parents.pop();
	    		switch(parent.type) {
						case 'MemberExpression': 
							return { kind : 'member'}; //$NON-NLS-1$
						case 'Program':
						case 'BlockStatement':
							break;
						case 'VariableDeclarator':
							if(!parent.init || offset < parent.init.range[0]) {
								return null;
							}
							break;
						case 'FunctionDelcaration':
						case 'FunctionExpression':
							if(offset < parent.body.range[0]) {
								return null;						
							}
							break;
						case 'Property':
							if(offset-1 >= parent.value.range[0] && offset-1 <= parent.value.range[1]) {
								return { kind : 'prop'}; //$NON-NLS-1$
							}
							return null;
						case 'SwitchStatement':
							return {kind: 'swtch'}; //$NON-NLS-1$
					}
			}
    	}
		return {kind:'top'}; //$NON-NLS-1$
	}
    
    /**
	 * @description Create proposals specific to JSDoc
	 * @returns {Array} The array of proposals
	 */
	function createDocProposals(params, kind, ast, buffer, pluginenvs) {
	    var proposals = [];
	    if(kind && kind.kind === 'jsdoc') {
		    var offset = params.offset > params.prefix.length ? params.offset-params.prefix.length-1 : 0;
		    switch(buffer.charAt(offset)) {
		        case '{': {
		        	//TODO @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=465029
		            proposals = [];
		            break;
		        }
		        case '.': {
		        	//TODO @see https://bugs.eclipse.org/bugs/show_bug.cgi?id=465029
		            return [];
		        }
		        case '*':
		        case ' ': {
		            var node = Finder.findNode(kind.node.range[1], ast, {parents:true, next:true});
    	               if(node) {
    	                   var isdecl = node.type === 'FunctionDeclaration';
    	                   var ismember = node.type === 'ExpressionStatement';
    	                   if(isdecl || (node.type === 'Property' && node.value.type === 'FunctionExpression') || ismember) {
    	                       if(ismember && node.expression && node.expression.type === 'AssignmentExpression') {
    	                           node = node.expression;
    	                           if(node.left.type !== 'MemberExpression' && node.right.type !== 'FunctionExpression') {
    	                               break;
    	                           }
    	                       }
    	                       var val;
        	                   if((val = /\s*\*\s*\@name\s*(\w*)/ig.exec(params.line)) !== null) {
        	                       if(val[1] === params.prefix) {
        	                           var name;
        	                           if(ismember) {
            	                           name = Signatures.expandMemberExpression(node.left, '');
            	                       } else {
            	                           name = isdecl ? node.id.name : node.key.name;
            	                       }
            	                       proposals.push({
            								proposal: name,
            								relevance: 100,
            								name: name,
            								description: Messages['funcProposalDescription'],
            								style: 'emphasis', //$NON-NLS-1$
            								overwrite: true
        							    });
    							}
        	                   } else if((val = /\s*\*\s*\@param\s*(?:\{\w*\})?\s*(\w*)/ig.exec(params.line)) !== null) {
        	                       if(val[1] === params.prefix) {
        	                           var prms = isdecl ? node.params : node.value.params;
        	                           if(prms) {
        	                               for(var i = 0; i < prms.length; i++) {
        	                                   name = prms[i].name;
        	                                   if(Util.looselyMatches(params.prefix, name)) { 
            	                                   proposals.push({
                        								proposal: name,
                        								relevance: 100,
                        								name: name,
                        								description: Messages['funcParamProposalDescription'],
                        								style: 'emphasis', //$NON-NLS-1$
                        								overwrite: true
                    							    });
                							    }
        	                               }
        	                           }
        	                       }
        	                   }
    	                   }
    	               }
		        }
		    }
        } else if(kind && kind.kind === 'doc') {
            var comment = kind.node.value.trim();
            if(comment) {
	            if(/^(?:\/\*)?\s*eslint(?:-enable|-disable)?\s+/gi.test(params.line)) {
	                //eslint eslint-enable eslint-disable
	                var rules = Rules.getRules();
	                var rulekeys = Object.keys(rules).sort();
	                for(i = 0; i < rulekeys.length; i++) {
	                    var rulekey = rulekeys[i];
                        if(Util.looselyMatches(params.prefix, rulekey)) {
                            var rule = rules[rulekey];
                            var _p = {
								proposal: rulekey,
								relevance: 100,
								name: rulekey,
								description: Messages['eslintRuleProposalDescripton'],
								prefix: params.prefix,
								style: 'emphasis', //$NON-NLS-1$
								overwrite: true
						    };
						    var hover = rule.description ? rule.description : '';
						    if(rule.url) {
						    	hover += i18nUtil.formatMessage.call(null, Messages['onlineDocumentationProposalEntry'], rule.url);
						    }
						    _p.hover = {content: hover, type: 'markdown'}; //$NON-NLS-1$
                            proposals.push(_p);
					    }
	                }
	            } else if(/^(?:\/\*)?\s*eslint-env\s+/gi.test(params.line)) {
	                //eslint-env (comma-separated list)
	                var _all = Objects.mixin(ESLintEnv, pluginenvs);
	                var keys = Object.keys(_all).sort();
	                for(i = 0; i < keys.length; i++) {
	                    var key = keys[i];
	                    if(key !== 'builtin' && Util.looselyMatches(params.prefix, key)) {
	                        proposals.push({
								proposal: key,
								relevance: 100,
								name: key,
								description: Messages['eslintEnvProposalDescription'],
								style: 'emphasis', //$NON-NLS-1$
								overwrite: true
						    });
	                    }
	                }
	            }
            }
        }
        return proposals;
	}

	var deferred = null;

	var handler = function(event) {
		 if(deferred && typeof(event.data) === 'object') {
	        var _d = event.data;
	        if(_d.request === 'completions') {
	        	if(deferred.proposals) {
	        		deferred.resolve([].concat(sortProposals(_d.proposals, deferred.args), deferred.proposals));
	        	} else {
	        		deferred.resolve(sortProposals(_d.proposals, deferred.args));
	        	}
	        	deferred = null;
	        }
	     }
	};
	
	/**
	 * @description Creates a new TernContentAssist object
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager An AST manager to create ASTs with
	 * @param {TernWorker} ternWorker The worker running Tern
	 * @param {Function} pluginEnvironments The function to use to query the Tern server for contributed plugins
	 */
	function TernContentAssist(astManager, ternWorker, pluginEnvironments) {
		this.astManager = astManager;
		this.ternworker = ternWorker;
		this.pluginenvs = pluginEnvironments;
		this.ternworker.addEventListener('message', handler, false);
	}

	/**
	 * Main entry point to provider
	 */
	Objects.mixin(TernContentAssist.prototype, {

		/**
		 * Called by the framework to initialize this provider before any <tt>computeContentAssist</tt> calls.
		 */
		initialize: function() {
		    //override
		},
        
		/**
		 * @description Implements the Orion content assist API v4.0
		 */
		computeContentAssist: function(editorContext, params) {
			var that = this;
			return editorContext.getFileMetadata().then(function(meta) {
			    if(meta.contentType.id === 'text/html') {
			        return editorContext.getText().then(function(text) {
			            var blocks = Finder.findScriptBlocks(text);
			            if(blocks && blocks.length > 0) {
			                var cu = new CU(blocks, meta);
        			        if(cu.validOffset(params.offset)) {
        			            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
        			            	return that.pluginenvs().then(function(envs) {
        			            		return that.doAssist(ast, params, meta, {ecma5:true, browser:true}, envs);
        			            	});
                    			});
        			        }
    			        }
			        });
			    } else {
			        return that.astManager.getAST(editorContext).then(function(ast) {
			        	return that.pluginenvs().then(function(envs) {
			        		return that.doAssist(ast, params, meta, {ecma5: true}, envs);
			        	});
        			});
			    }
			});
		},
		
		doAssist: function(ast, params, meta, envs, contributedEnvs) {
			var kind = getKind(ast, params.offset, ast.source);
       		params.prefix = getPrefix(params, kind, ast.source);
       		var proposals = [].concat(createDocProposals(params, kind, ast, ast.source, contributedEnvs),
       								  createTemplateProposals(params, kind, ast.source));
       		if(kind && (kind.kind === 'jsdoc' || kind.kind === 'doc')) {
       			return new Deferred().resolve(proposals); //resolve now, no need to talk to the worker
       		} else {
       			var env = this.getActiveEnvironments(ast, envs);
			    var files = [
			    	{type:'full', name: meta.location, text: ast.source} //$NON-NLS-1$
			    ];
			    if(typeof(params.keywords) === 'undefined') {
			    	params.keywords = true;
			    }
			    var args = {params: params, meta: meta, envs:env, files: files};
	        	this.ternworker.postMessage({request: 'completions', args: args}); //$NON-NLS-1$
				deferred = new Deferred();
				deferred.proposals = proposals;
				deferred.args = args;
				return deferred;
   			}
		},
		
		getActiveEnvironments: function getActiveEnvironements(ast, defenvs) {
			var env = Object.create(null);
			Objects.mixin(env, defenvs);
			if(ast.comments) {
				for(var i = 0; i < ast.comments.length; i++) {
					var comment = ast.comments[i];
					if (comment.type === "Block") {
			            var value = comment.value.trim();
			            var match = /^(eslint-\w+|eslint|globals?)(\s|$)/.exec(value);
						if (match) {
			                value = value.substring(match.index + match[1].length);
			                if(match[1] === 'eslint-env') {
			                	// Collapse whitespace around ,
							    var string = value.replace(/\s*,\s*/g, ",");
							    string.split(/,+/).forEach(function(name) {
							        name = name.trim();
							        if (!name) {
							            return;
							        }
							        env[name] = true;
							    });
			                }
			            }
			        }
				}
			}
		    return env;
		}
	});
	
	var operators = {
    	'delete': true,
    	'new': true,
    	'instanceof': true,
    	'super': true,
    	'this': true,
    	'typeof': true,
    	'void': true,
    	'yield': true
    };
    
    /**
     * @description Returns the root URL to use for the online doc portion of a keyword proposal
     * @param keyword
     * @returns returns
     */
    function getKeywordLink(keyword) {
    	var key = keyword;
    	switch(keyword) {
    		case 'do': {
    			key = 'do...while';
    			break;
    		}
    		case 'in': {
    			key = 'for...in';
    			break;
    		}
    		case 'try':
    		case 'catch': 
    		case 'finally': {
    			key = 'try...catch';
    			break;
    		}
    		case 'case': 
    		case 'default' : {
    			key = 'switch';
    			break;
    		}
    		case 'if':
    		case 'else': {
    			key = 'if...else'; //$NON-NLS-1$
    			break;
    		}
    	}
    	if(operators[keyword]) {
    		return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/'+key; //$NON-NLS-1$
    	} else if(keyword === 'extends') {
    		return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/'+key; //$NON-NLS-1$
    	}
    	return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/'+key; //$NON-NLS-1$
    }
    
    /**
	 * @name _formatTernProposal
	 * @description Formats the proposal
	 * @function
	 * @private
	 * @param {tern.Completion} completion The Tern proposal object
	 * @param {Object} args The arguments from the original 
	 * @returns {orion.Proposal} An Orion-formatted proposal object
	 */
	function _formatTernProposal(completion, args) {
	    var proposal = {
            relevance: 100,
            style: 'emphasis', //$NON-NLS-1$
            overwrite: true
        };
        proposal.name = proposal.proposal = completion.name;
        if(typeof(completion.type) !== 'undefined') {
            if(/^fn/.test(completion.type)) {
            	calculateFunctionProposal(completion, args, proposal);
            } else if(completion.type === 'template') {
            	var _t = new mTemplates.Template(args.params.prefix, completion.description, completion.template, completion.name);
            	var _prop = _t.getProposal(args.params.prefix, args.params.offset, {});
            	var obj = Object.create(null);
		        obj.type = 'markdown'; //$NON-NLS-1$
		        obj.content = 'Template source code:\n\n';
		        obj.content += _prop.proposal;
		        _prop.hover = obj;
		        provider.removePrefix(args.params.prefix, _prop);
		        _prop.style = 'emphasis'; //$NON-NLS-1$
		        return _prop;
            } else if(typeof(completion.origin) === 'undefined' && (JsSyntax.keywords.indexOf(completion.name) > -1)) {
            	//keyword
            	proposal.relevance -= 2; //103
            	//proposal.style = 'noemphasis_keyword';//$NON-NLS-1$
            	proposal.description = Messages['keywordProposalDescription'];
            	completion.doc = Messages['keywordHoverProposal'];
            	completion.url = getKeywordLink(proposal.name);
            } else {
    		    proposal.description = convertTypes(' : ' + completion.type); //$NON-NLS-1$
		    }
        }
        var obj = Object.create(null);
        obj.type = 'markdown'; //$NON-NLS-1$
        obj.content = '';
        if(!completion.doc) {
            obj.content += proposal.name;
        } else {
        	var _h = Hover.formatMarkdownHover(completion.doc);
        	if(_h) {
        		obj.content += _h.content;	
        	}
        }
        if(completion.url) {
            obj.content += i18nUtil.formatMessage.call(null, Messages['onlineDocumentationProposalEntry'], completion.url);
        }
        proposal.hover = obj;
        return proposal;
	}
	
  	 /**
	 * @description Convert an array of parameters into a string and also compute linked editing positions
	 * @function
	 * @private
	 * @param {Object} completion The Tern completion
	 * @param {Object} params The service parameters
	 */
	function calculateFunctionProposal(completion, args, proposal) {
		var positions = [];
		proposal.relevance += 5;
		var type = completion.type.slice(2);
		var ret = /\s*->\s*(\w*|\d*|(?:fn\(.*\))|(?:\[.*\]))$/.exec(type);
		if(ret) {
			proposal.description = ' : ' + convertTypes(ret[1]); //$NON-NLS-1$
			type = type.slice(0, ret.index);
		}
		var _p = completion.name + '(';
		var params = collectParams(type.slice(1, type.length-1));
		if(params) {
			for(var i = 0; i < params.length; i++) {
				positions.push({offset: (args.params.offset+_p.length)-args.params.prefix.length, length: params[i].length});
				_p += params[i];
				if(i < params.length-1) {
					_p += ', '; //$NON-NLS-1$
				}
			}
		}
		_p += ')';
		proposal.name = proposal.proposal = _p;
		proposal.escapePosition = (args.params.offset - args.params.prefix.length) + _p.length;
		if(positions.length > 0) {
			proposal.positions = positions;
		}
	}

	function collectParams(type) {
		if(type && type.length > 0) {
			var params = [];
			var parencount = 0, char, param = '', index = 0, aftercolon = false;
			while(index < type.length) {
				char = type.charAt(index);
				if(char === 'f') {
					if(type.charAt(index+1) === 'n' && type.charAt(index+2) === '(') {
						parencount++;
					} else if(!aftercolon) {
						param += char;
					}
				} else if(char === ')') {
					parencount--;
				} else if(char === ':' && parencount < 1) {
					params.push(param);
					param = '';
					aftercolon = true;
				} else if(char === ',') {
					index++; //eat the space
					aftercolon = false;
				} else if(!aftercolon && parencount < 1) {
					param += char;
				}
				index++;
			}
			return params;
		}
		return null;
	}

	/**
	 * @description Convert the Tern types to be more Orion-like
	 * @param {String} type The type computed from Tern
	 * @returns {String} The formatted type sig
	 */
	function convertTypes(type) {
		//TODO do we want to convert all types? make arrays pretty?
		type = type.replace(/:\s*\?/g, ': Any'); //$NON-NLS-1$
		type = type.replace(/:\s*bool/g, ': Boolean'); //$NON-NLS-1$
		type = type.replace(/:\s*number/g, ': Number'); //$NON-NLS-1$
		type = type.replace(/:\s*string/g, ': String'); //$NON-NLS-1$
		return type;
	}

	var sorter = function(l,r) {
		// sort by relevance and then by name
		if (l.relevance > r.relevance) {
			return -1;
		} else if (r.relevance > l.relevance) {
			return 1;
		}

		var ldesc = l.name;
		var rdesc = r.name;
		if (ldesc < rdesc) {
			return -1;
		} else if (rdesc < ldesc) {
			return 1;
		}
		return 0;
	};
	
	function formatOrigin(origin) {
		var match = /([^/.]+\/[^\/]+)$/g.exec(origin);
		if(match) {
			return match[1];
		}
		match = /\/([^\/]+)$/g.exec(origin);
		if(match) {
			return match[1];
		}
		return origin;
	}
	
	function sortProposals(completions, args) {
		var envs = args.envs ? args.envs : {};
	    var _p = Object.create(null);
	    //bucket them by origin
	    var locals = [];
	    for(var i = 0; i < completions.length; i++) {
	        var _c = completions[i];
	        if(Util.looselyMatches(args.params.prefix, _c.name)) {
    	        var _o = _c.origin;
    	        if(typeof(_o) === 'undefined') {
    	        	locals.push(_formatTernProposal(_c, args));
    	        	continue;
    	        }
    	        _o = _o ? _o : '?';
    	        if(_o === args.meta.location) {
    	            locals.push(_formatTernProposal(_c, args));
    	        } else {
    	        	if(_o.indexOf('/') < 0 && !envs[_o]) {
	    	        	continue;
	    	        }
	    	       var orig = formatOrigin(_o);
    	           if(!Array.isArray(_p[orig])) {
    	           		_p[orig] = [];
    	           }
    	           _p[orig].push(_formatTernProposal(_c, args));
    	        }
	        }
	    }
	    var proposals = [].concat(locals.sort(sorter));
	    var keys = Object.keys(_p);
	    for(i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        proposals.push({
					proposal: '',
					description: key, //$NON-NLS-0$
					style: 'noemphasis_title_keywords', //$NON-NLS-0$
					unselectable: true
				});
	        proposals = proposals.concat(_p[key].sort(sorter));
	    }
	    return proposals;
	}
	
	return {
		TernContentAssist : TernContentAssist
	};
});
