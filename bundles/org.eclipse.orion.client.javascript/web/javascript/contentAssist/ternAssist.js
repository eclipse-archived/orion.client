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
/*eslint-env amd, browser, node */
define([
	'i18n!javascript/nls/messages',
    'orion/Deferred',
	'orion/objects',
	'javascript/finder',
	'orion/editor/templates',
	'javascript/contentAssist/templates',
	'javascript/hover',
	'javascript/util',
	'javascript/contentAssist/sigparser',
	'orion/i18nUtil'
], function(Messages, Deferred, Objects, Finder, mTemplates, Templates, Hover, Util, SigParser, i18nUtil) {

	/**
	 * @description Creates a new delegate to create keyword and template proposals
	 */
	function TemplateProvider() {
	    //constructor
 	}

 	TemplateProvider.prototype = new mTemplates.TemplateContentAssist([], []);

 	Objects.mixin(TemplateProvider.prototype, {
 		uninterestingChars: ":!#$^&.?<>", //$NON-NLS-1$

 		isValid: function(prefix, buffer, offset) {
			var char = buffer.charAt(offset-prefix.length-1);
			return !char || this.uninterestingChars.indexOf(char) === -1;
		},

		getTemplateProposals: function(prefix, offset, context, ast) {
			var proposals = [];
			var k = this.getKind(ast, offset);
			var templates = Templates.getTemplatesForKind(k.kind);
			for (var t = 0; t < templates.length; t++) {
				var template = templates[t];
				if (this.templateMatches(template, prefix, k, context)) {
					var proposal = template.getProposal(prefix, offset, context);
					var obj = Object.create(null);
			        obj.type = 'markdown'; //$NON-NLS-1$
			        obj.content = Messages['templateHoverHeader'];
			        obj.content += proposal.proposal;
			        proposal.hover = obj;
			        proposal.style = 'emphasis'; //$NON-NLS-1$
					this.removePrefix(prefix, proposal);
					proposal.kind = 'js'; //$NON-NLS-1$
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
					description: Messages['templateAssistHeader'],
					style: 'noemphasis_title', //$NON-NLS-1$
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
		},
		
		/**
		 * @description Computes the kind of context to complete in
		 * @param {Object} ast The backing AST to visit
		 * @param {Number} offset The offset into the source
		 * @param {String} contents The text of the file
		 * @return {Object} Returns the deferred node and the completion kind
		 */
		getKind: function(ast, offset) {
	    	var node = Finder.findNode(offset, ast, {parents:true});
	    	if(node) {
	    		if(node.parents && node.parents.length > 0) {
		    		var prent = node.parents.pop();
		    		switch(prent.type) {
							case 'MemberExpression':
								return { kind : 'member'}; //$NON-NLS-1$
							case 'Program':
							case 'BlockStatement':
								break;
							case 'VariableDeclarator':
								if(!prent.init || offset < prent.init.range[0]) {
									return null;
								}
								break;
							case 'FunctionDelcaration':
							case 'FunctionExpression':
								if(offset < prent.body.range[0]) {
									return null;
								}
								break;
							case 'Property':
								if(offset-1 >= prent.value.range[0] && offset-1 <= prent.value.range[1]) {
									return { kind : 'prop'}; //$NON-NLS-1$
								}
								return null;
							case 'SwitchStatement':
								return {kind: 'swtch'}; //$NON-NLS-1$
						}
				}
	    	}
	    	node = Finder.findComment(offset, ast);
	    	if(node) {
	    		return {kind: 'doc', node: node}; //$NON-NLS-1$
	    	}
			return {kind:'top'}; //$NON-NLS-1$
		}
 	});

 	var provider = new TemplateProvider();

	/**
	 * @description Creates a new TernContentAssist object
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager An AST manager to create ASTs with
	 * @param {TernWorker} ternWorker The worker running Tern
	 * @param {Function} pluginEnvironments The function to use to query the Tern server for contributed plugins
	 * @param {Object} cuprovider The CU Provider that caches compilation units
	 */
	function TernContentAssist(astManager, ternWorker, pluginEnvironments, cuprovider) {
		this.astManager = astManager;
		this.ternworker = ternWorker;
		this.pluginenvs = pluginEnvironments;
		this.cuprovider = cuprovider;
		this.timeout = null;
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
			        	var cu = that.cuprovider.getCompilationUnit(function(){
		            		return Finder.findScriptBlocks(text);
		            	}, meta);
    			        if(cu.validOffset(params.offset)) {
    			            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
    			            	return that.pluginenvs().then(function(envs) {
    			            		return that.doAssist(ast, params, meta, {ecma5:true, ecma6:true, browser:true}, envs, text);
    			            	});
                			});
    			        }
    			        return [];
			        });
			    } else {
			        return that.astManager.getAST(editorContext).then(function(ast) {
			        	return that.pluginenvs().then(function(envs) {
			        		return that.doAssist(ast, params, meta, {ecma5: true, ecma6: true}, envs);
			        	});
        			});
			    }
			});
		},

		doAssist: function(ast, params, meta, envs, farts, htmlsource) {
       		var proposals = [];
       		var templates = createTemplateProposals(params, ast);
   			var env = this.getActiveEnvironments(ast, envs);
		    var files = [
		    	{type:'full', name: meta.location, text: htmlsource ? htmlsource : ast.source} //$NON-NLS-1$
		    ];
		    if(typeof(params.keywords) === 'undefined') {
		    	params.keywords = true;
		    }
		    var args = {params: params, meta: meta, envs:env, files: files};
			var deferred = new Deferred();
			deferred.proposals = proposals;
			deferred.args = args;
			var that = this;
			this.ternworker.postMessage({request: 'completions', args: args}, //$NON-NLS-1$
				function(response) {
					clearTimeout(that.timeout);
					if(deferred.proposals) {
		        		deferred.resolve([].concat(sortProposals(response.proposals ? response.proposals : [], templates, deferred.args), deferred.proposals));
		        	} else {
		        		deferred.resolve(sortProposals(response.proposals, templates, deferred.args));
		        	}
				}
        	);
			
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.timeout = setTimeout(function() {
				if(deferred) {
					// In the editor we can't return an error message here or it will be treated as a proposal and inserted into text
					deferred.resolve(params.timeoutReturn ? params.timeoutReturn : []);
				}
				this.timeout = null;
			}, params.timeout ? params.timeout : 5000);
			return deferred;
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
							    string.split(/,+/).forEach(function(_name) {
							        _name = _name.trim();
							        if (!_name) {
							            return;
							        }
							        env[_name] = true;
							    });
			                }
			            }
			        }
				}
			}
		    return env;
		}
	});

	/**
	 * @description Create the template proposals
	 * @private
	 * @param {Object} params The completion context
	 * @param {Object} ast The the backing AST
	 * @param {String} buffer The compilation unit buffer
	 * @returns {Array} The array of template proposals
	 */
	function createTemplateProposals (params, ast) {
		if((typeof params.template === 'undefined' || params.template) &&
				provider.isValid(params.prefix, ast.source, params.offset, params)) {
			return provider.getTemplateProposals(params.prefix, params.offset, params, ast);
		}
		return [];
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
    			key = 'do...while'; //$NON-NLS-1$
    			break;
    		}
    		case 'in': {
    			key = 'for...in'; //$NON-NLS-1$
    			break;
    		}
    		case 'try':
    		case 'catch':
    		case 'finally': {
    			key = 'try...catch'; //$NON-NLS-1$
    			break;
    		}
    		case 'case':
    		case 'default' : {
    			key = 'switch'; //$NON-NLS-1$
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
            overwrite: true,
            kind: 'js' //$NON-NLS-1$
        };
        if(typeof(completion.overwrite) === 'boolean') {
        	proposal.overwrite = completion.overwrite;
        }
        if(typeof(completion.prefix) === 'string') {
        	//args.params.prefix = completion.prefix;
        	proposal.prefix = completion.prefix;
        }
        proposal.name = proposal.proposal = completion.name;
        if(typeof(completion.type) !== 'undefined') {
            if(/^fn/.test(completion.type)) {
            	//TODO proposal.tags = [{content: 'F', cssClass: 'iconTagPurple'}]; //$NON-NLS-1$ //$NON-NLS-2$
            	calculateFunctionProposal(completion, args, proposal);
            } else if(completion.type === 'template' || completion.type === 'jsdoc_template') {
            	var _t = new mTemplates.Template(args.params.prefix, completion.description, completion.template, completion.name);
            	var _prop = _t.getProposal(args.params.prefix, args.params.offset, {});
            	var obj = Object.create(null);
		        obj.type = 'markdown'; //$NON-NLS-1$
		        obj.content = Messages['templateHoverHeader'];
		        obj.content += _prop.proposal;
		        _prop.hover = obj;
		        provider.removePrefix(args.params.prefix, _prop);
		        _prop.style = 'emphasis'; //$NON-NLS-1$
		        _prop.kind = 'js'; //$NON-NLS-1$
		        if(typeof(completion.prefix) === 'string') {
		        	_prop.prefix = completion.prefix;
		        }
		        return _prop;
            } else {
            	if(typeof(completion.description) === 'string') {
            		proposal.description = completion.description;
            	} else {
	    		    proposal.description = convertTypes(' : ' + completion.type); //$NON-NLS-1$
			    }
		    }
        } else if(completion.isKeyword) {
        	proposal.relevance -= 2; //103
        	proposal.description = Messages['keywordProposalDescription'];
        	proposal.isKeyword = true;
        	completion.doc = Messages['keywordHoverProposal'];
        	completion.url = getKeywordLink(proposal.name);
        } else {
        	proposal.description = '';
        }
        obj = Object.create(null);
        obj.type = 'markdown'; //$NON-NLS-1$
        obj.content = '';
        if(!completion.doc) {
            obj.content += proposal.name;
        } else {
        	var _h = Hover.formatMarkdownHover(completion.doc);
        	if(_h) {
        		obj.content += _h.content;
        	} else {
        		obj.content += proposal.name;
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
		var sig = SigParser.parse(completion.type);
		if(sig.ret) {
			if(sig.ret.value) {
				proposal.description = convertTypes(' : '+sig.ret.value); //$NON-NLS-1$
			} else if(sig.ret.ret) {
				proposal.description = ' : function';  //$NON-NLS-1$
			} else {
				proposal.description = '';
			}
		} else {
			proposal.description = '';
		}
		var _p = completion.name + '(';
		var params = sig.params;
		if(params) {
			for(var i = 0; i < params.length; i++) {
				var param = params[i];
				positions.push({offset: (args.params.offset+_p.length)-args.params.prefix.length, length: param.value.length});
				_p += param.value;
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

	/**
	 * @description Convert the Tern types to be more Orion-like
	 * @param {String} type The type computed from Tern
	 * @returns {String} The formatted type sig
	 */
	function convertTypes(type) {
		return type.replace(/:\s*\?/g, ': any'); //$NON-NLS-1$
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

	/**
	 * @name formatOrigin
	 * @description Formats the origin into a readable string that can fit in content assist.
	 * @param origin {String} the origin string to format
	 * @returns returns a formatted origin string, may be the same as the origin
	 */
	function formatOrigin(origin) {
		var match = /([^/.]+\/[^\/]+)$/g.exec(origin);  // Shortens long / separated file paths to the last two segments
		if(match) {
			return match[1];
		}
		match = /\/([^\/]+)$/g.exec(origin);  // Removes leading slash from a file path
		if(match) {
			return match[1];
		}
		return origin;
	}

	function sortProposals(completions, templates, args) {
		var envs = args.envs ? args.envs : {};
	    //bucket them by origin
	    var tmplateHeader = templates.length > 0;
	    var _p = Object.create(null); // Grouped proposals from env and indexes
	    var _d = Object.create(null); // Grouped proposals from dependencies 
	    var locals = []; // Proposals from local scope
	    var keywords = [];
	    for(var i = 0; i < completions.length; i++) {
	        var _c = completions[i];
	        var _prefix = typeof(_c.prefix) === 'string' ? _c.prefix : args.params.prefix;
	        if(Util.looselyMatches(_prefix, _c.name)) {
    	        var _o = _c.origin;
    	        if(_c.isKeyword) {
    	        	keywords.push(_formatTernProposal(_c, args));
    	        } else if(typeof(_o) === 'undefined') {
    	        	if(_c.isTemplate) {
    	        		templates.push(_formatTernProposal(_c, args));
    	        	} else {
	    	        	locals.push(_formatTernProposal(_c, args));
		        	}
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
					var propMap = _p;
					if (!envs[_o]){
						// Must be a file dependency
						propMap = _d;
					}
					if(!Array.isArray(propMap[orig])) {
						propMap[orig] = [];
					}					
					propMap[orig].push(_formatTernProposal(_c, args));
    	        }
	        }
	    }
	    // Locals, then dependencies, then keywords, then environment/indexes
	    var proposals = [].concat(locals.sort(sorter));
	    var keys = Object.keys(_d);
	    for(i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        proposals.push({
					proposal: '',
					description: key, //$NON-NLS-0$
					style: 'noemphasis_title', //$NON-NLS-0$
					unselectable: true
				});
	        proposals = proposals.concat(_d[key].sort(sorter));
	    }
	    if(keywords.length > 0) {
	    	keywords.sort(sorter);
	    	keywords.splice(0, 0, {
					proposal: '',
					description: Messages['keywordAssistHeader'],
					style: 'noemphasis_title', //$NON-NLS-1$
					unselectable: true
				});
			proposals = proposals.concat(keywords);
	    } 
	    keys = Object.keys(_p);
	    for(i = 0; i < keys.length; i++) {
	        key = keys[i];
	        proposals.push({
					proposal: '',
					description: key, //$NON-NLS-0$
					style: 'noemphasis_title', //$NON-NLS-0$
					unselectable: true
				});
	        proposals = proposals.concat(_p[key].sort(sorter));
	    }
	    if(templates.length > 0) {
	    	templates.sort(function(p1, p2) {
				if (p1.name < p2.name) {
					return -1;
				}
				if (p1.name > p2.name) {
					return 1;
				}
				return 0;
			});
			if(!tmplateHeader) {
				templates.splice(0, 0, {
					proposal: '',
					description: Messages['templateAssistHeader'],
					style: 'noemphasis_title', //$NON-NLS-1$
					unselectable: true
				});
			}
			proposals = proposals.concat(templates);
	    }
	    return proposals;
	}

	return {
		TernContentAssist : TernContentAssist
	};
});