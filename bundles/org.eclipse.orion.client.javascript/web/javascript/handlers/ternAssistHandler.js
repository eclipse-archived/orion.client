/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Initial API and implementation
 ******************************************************************************/
/* eslint-env amd */
define([
	'orion/objects',
    'javascript/hover',
    'javascript/finder',
    'javascript/signatures',
    'eslint/load-rules-async',
	'eslint/conf/environments',
    'orion/editor/templates', //$NON-NLS-0$
	'javascript/contentAssist/templates',  //$NON-NLS-0$
	'orion/editor/stylers/application_javascript/syntax'
], function(Objects, Hover, Finder, Signatures, Rules, ESLintEnv, mTemplates, Templates, JsSyntax) {

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
			        obj.type = 'markdown';
			        obj.content = 'Template source code:\n\n';
			        obj.content += Hover.formatMarkdownHover(proposal.proposal).content;
			        proposal.hover = obj;
			        proposal.style = 'emphasis';
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
							return { kind : 'member'};
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
								return { kind : 'prop'};
							}
							return null;
						case 'SwitchStatement':
							return {kind: 'swtch'};
					}
			}
    	}
		return {kind:'top'};
	}
    
    /**
	 * @description Create proposals specific to JSDoc
	 * @returns {Array} The array of proposals
	 */
	function createDocProposals(params, kind, ast, buffer) {
	    var proposals = [];
	    if(kind && kind.kind === 'jsdoc') {
		    var offset = params.offset > params.prefix.length ? params.offset-params.prefix.length-1 : 0;
		    switch(buffer.charAt(offset)) {
		        case '{': {
		            proposals = []; //TODO have to delegate to the worker
		            break;
		        }
		        case '.': {
		            //TODO re-write the inferencing code to only pick out 'typed' proposals - we 
		            //only want non-functions here
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
            								description: ' - The name of the function',
            								style: 'emphasis',
            								overwrite: true
        							    });
    							}
        	                   } else if((val = /\s*\*\s*\@param\s*(?:\{\w*\})?\s*(\w*)/ig.exec(params.line)) !== null) {
        	                       if(val[1] === params.prefix) {
        	                           var prms = isdecl ? node.params : node.value.params;
        	                           if(prms) {
        	                               for(var i = 0; i < prms.length; i++) {
        	                                   name = prms[i].name;
        	                                   if(looselyMatches(params.prefix, name)) { 
            	                                   proposals.push({
                        								proposal: name,
                        								relevance: 100,
                        								name: name,
                        								description: ' - Function parameter',
                        								style: 'emphasis',
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
                        if(looselyMatches(params.prefix, rulekey)) {
                            var rule = rules[rulekey];
                            proposals.push({
								proposal: rulekey,
								relevance: 100,
								name: rulekey,
								description: ' - '+(rule.description ? rule.description : 'ESLint rule name'),
								prefix: params.prefix,
								style: 'emphasis',
								overwrite: true
						    });
					    }
	                }
	            } else if(/^(?:\/\*)?\s*eslint-env\s+/gi.test(params.line)) {
	                //eslint-env (comma-separated list)
	                var keys = Object.keys(ESLintEnv).sort();
	                for(i = 0; i < keys.length; i++) {
	                    var key = keys[i];
	                    if(key !== 'builtin' && looselyMatches(params.prefix, key)) {
	                        proposals.push({
								proposal: key,
								relevance: 100,
								name: key,
								description: ' - ESLint environment name',
								style: 'emphasis',
								overwrite: true
						    });
	                    }
	                }
	            }
            }
        }
        return proposals;
	}
    
    /**
     * @description Computes the content assist proposals
     * @param {Object} ternserver The server to send requests to
     * @param {Object} args The arguments from the original request 
     * @param {Function} callback The function to call back to once the request completes or fails
     * @since 9.0
     */
    function computeProposals(ternserver, args, callback) {
        if(ternserver) {
	       ternserver.request({
	           query: {
	           type: "completions", 
	           file: args.meta.location,
	           types: true, 
	           origins: true,
	           urls: true,
	           docs: true,
	           end: args.params.offset,
	           sort:true,
	           includeKeywords: args.params.keywords
	           },
	           files: args.files}, 
	           function(error, comps) {
	               if(error) {
	               		callback({request: 'completions', error: error.message, message: 'Failed to compute proposals'});
	               } else if(comps && comps.completions) {
	               		var file = ternserver.fileMap[args.meta.location];
	               		var kind = getKind(file.ast, args.params.offset, file.text);
	               		args.params.prefix = getPrefix(args.params, kind, file.text);
	               		if(kind && (kind.kind === 'jsdoc' || kind.kind === 'doc')) {
	               			callback({request: 'completions', proposals:[].concat(createDocProposals(args.params, kind, file.ast, file.text),
	               								  createTemplateProposals(args.params, kind, file.text))});
	               		} else {
	               			callback({request: 'completions', proposals:[].concat(sortProposals(comps.completions, args),
	               								  createDocProposals(args.params, kind, file.ast, file.text),
	               								  createTemplateProposals(args.params, kind, file.text))});
               			}
	               } else {
	               		callback({request: 'completions', proposals:[]});
	               }
	           });
	       
	   } else {
	       callback({request: 'completions', message: 'Failed to compute proposals, server not started'});
	   }
    }
    
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
    			key = 'if...else';
    			break;
    		}
    	}
    	if(operators[keyword]) {
    		return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/'+key;
    	} else if(keyword === 'extends') {
    		return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/'+key;
    	}
    	return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/'+key;
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
            style: 'emphasis',
            overwrite: true
        };
        proposal.name = proposal.proposal = completion.name;
        if(typeof(completion.type) !== 'undefined') {
            if(/^fn/.test(completion.type)) {
            	calculateFunctionProposal(completion, args, proposal);
            } else if(typeof(completion.origin) === 'undefined' && (JsSyntax.keywords.indexOf(completion.name) > -1)) {
            	//keyword
            	proposal.relevance -= 2; //103
            	//proposal.style = 'noemphasis_keyword';//$NON-NLS-1$
            	proposal.description = ' - Keyword';
            	completion.doc = 'ECMAScript reserved keyword';
            	completion.url = getKeywordLink(proposal.name);
            } else {
    		    proposal.description = convertTypes(' : ' + completion.type);
		    }
        }
        var obj = Object.create(null);
        obj.type = 'markdown';
        obj.content = '';
        if(!completion.doc) {
            obj.content += proposal.name;
        } else {
            obj.content += Hover.formatMarkdownHover(completion.doc).content;
        }
        if(completion.url) {
            obj.content += '\n\n[Online documentation]('+completion.url+')';
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
			proposal.description = ' : ' + convertTypes(ret[1]);
			type = type.slice(0, ret.index);
		}
		var _p = completion.name + '(';
		var params = collectParams(type.slice(1, type.length-1));
		if(params) {
			for(var i = 0; i < params.length; i++) {
				positions.push({offset: (args.params.offset+_p.length)-args.params.prefix.length, length: params[i].length});
				_p += params[i];
				if(i < params.length-1) {
					_p += ', ';
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
		type = type.replace(/:\s*\?/g, ': Any');
		type = type.replace(/:\s*bool/g, ': Boolean');
		type = type.replace(/:\s*number/g, ': Number');
		type = type.replace(/:\s*string/g, ': String');
		return type;
	}

	/**
	 * @description Match ignoring case and checking camel case.
	 * @param {String} prefix
	 * @param {String} target
	 * @returns {Boolean} If the two strings match
	 */
	function looselyMatches(prefix, target) {
		if (target === null || prefix === null) {
			return false;
		}

		// Zero length string matches everything.
		if (prefix.length === 0) {
			return true;
		}

		// Exclude a bunch right away
		if (prefix.charAt(0).toLowerCase() !== target.charAt(0).toLowerCase()) {
			return false;
		}

		if (_startsWith(target, prefix)) {
			return true;
		}

		var lowerCase = target.toLowerCase();
		if (_startsWith(lowerCase, prefix)) {
			return true;
		}

		// Test for camel characters in the prefix.
		if (prefix === prefix.toLowerCase()) {
			return false;
		}

		var prefixParts = _toCamelCaseParts(prefix);
		var targetParts = _toCamelCaseParts(target);

		if (prefixParts.length > targetParts.length) {
			return false;
		}

		for (var i = 0; i < prefixParts.length; ++i) {
			if (!_startsWith(targetParts[i], prefixParts[i])) {
				return false;
			}
		}

		return true;
	}
	
	/**
	 * @description Returns if the string starts with the given prefix
	 * @param {String} s The string to check
	 * @param {String} pre The prefix 
	 * @returns {Boolean} True if the string starts with the prefix
	 */
	function _startsWith(s, pre) {
		return s.slice(0, pre.length) === pre;
	}
	
	/**
	 * @description Convert an input string into parts delimited by upper case characters. Used for camel case matches.
	 * e.g. GroClaL = ['Gro','Cla','L'] to match say 'GroovyClassLoader'.
	 * e.g. mA = ['m','A']
	 * @function
	 * @public
	 * @param {String} str
	 * @return Array.<String>
	 */
	function _toCamelCaseParts(str) {
		var parts = [];
		for (var i = str.length - 1; i >= 0; --i) {
			if (_isUpperCase(str.charAt(i))) {
				parts.push(str.substring(i));
				str = str.substring(0, i);
			}
		}
		if (str.length !== 0) {
			parts.push(str);
		}
		return parts.reverse();
	}
	
	/**
	 * @description Returns if the given character is upper case or not considering the locale
	 * @param {String} string A string of at least one char14acter
	 * @return {Boolean} True iff the first character of the given string is uppercase
	 */
	 function _isUpperCase(string) {
		if (string.length < 1) {
		return false;
		}
		if (isNaN(string.charCodeAt(0))) {
			return false;
		}
		return string.toLocaleUpperCase().charAt(0) === string.charAt(0);
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
	
	function sortProposals(completions, args) {
		var envs = args.envs ? args.envs : {};
	    var _p = Object.create(null);
	    //bucket them by origin
	    var locals = [];
	    for(var i = 0; i < completions.length; i++) {
	        var _c = completions[i];
	        if(looselyMatches(args.params.prefix, _c.name)) {
    	        var _o = _c.origin;
    	        if(typeof(_o) === 'undefined') {
    	        	locals.push(_formatTernProposal(_c, args));
    	        	continue;
    	        }
    	        _o = _o ? _o : '?';
    	        if(_o === args.meta.location) {
    	            locals.push(_formatTernProposal(_c, args));
    	        } else {
    	        	if(!envs[_o]) {
	    	        	continue;
	    	        }
    	           if(!Array.isArray(_p[_o])) {
    	           		_p[_o] = [];
    	           }
    	           _p[_o].push(_formatTernProposal(_c, args));
    	        }
	        }
	    }
	    var proposals = [].concat(locals.sort(sorter));
	    var keys = Object.keys(_p);
	    for(var i = 0; i < keys.length; i++) {
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
	    computeProposals: computeProposals
	};
});
