/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - Allow original requirejs plugin to find files in Orion workspace
 *******************************************************************************/
/* eslint-disable missing-nls */
/*eslint-env node, amd*/
/*globals tern tern */
define([
	"../lib/infer", 
	"../lib/tern",
	"orion/objects",
	"javascript/finder",
	"javascript/signatures",
	"javascript/util",
	"json!javascript/rules.json",
	"eslint/conf/environments",
	"orion/i18nUtil",
	"i18n!javascript/nls/workermessages"
], /* @callback */ function(infer, tern, objects, Finder, Signatures, Util, Rules, ESLintEnvs, i18nUtil, Messages) {
	
	var allEnvs = {};
	
	tern.registerPlugin("jsdoc", /* @callback */ function(server, options) {
		return {
     		passes: {
		      	/**
		      	 * @callback
		      	 */
		      	completion: function(file, options, expr, type) {
		      		var comment = Finder.findComment(options.end, file.ast);
		      		if(comment) {
		      			objects.mixin(allEnvs, ESLintEnvs);
		      			fetchPluginEnvs(server);
		      			if(comment.type === 'Line') {
		      				return findLineCompletions(comment, options, file);
		      			}
		      			return findBlockCompletions(comment, options, file);
		      		}
		      		return null;
		      	}
      		}
    	};
	});
	
	function fetchPluginEnvs(server) {
		if(server.options && server.options.plugins) {
			var keys = Object.keys(server.options.plugins);
			for(var i = 0, len = keys.length; i < len; i++) {
				var env = server.options.plugins[keys[i]].env;
				if(env) {
					allEnvs[env] = true;
				}			
			}
		}
	}
	
	/**
	 * @description Finds completions for line comments: //-prefixed
	 * @param {Object} comment The comment AST node
	 * @param {Object} options The options object
	 * @param {File} file The Tern file object
	 * @returns {Array.<Object>} The array of completion objects
	 * @since 11.0
	 */
	function findLineCompletions(comment, options, file) {
		//TODO do we want to do anything here?
		return {completions: []};
	}
	
	/**
	 * @description Finds the completions for block comments: /**- or /*-prefixed 
	 * @param {Object} comment The comment AST node
	 * @param {Object} options The options object
	 * @param {File} file The Tern file object
	 * @returns {Array.<Object>} The array of completion objects
	 * @since 11.0
	 */
	function findBlockCompletions(comment, options, file) {
		var proposals = [];
		var prefix = getPrefix(options.end, file.text), char = file.text.charAt(options.end-prefix.length-1);
		if(char === '{') {
			proposals = computeTypeCompletions(prefix);
		} else if(char === '.') {
			proposals = computeMemberCompletions(prefix, comment, options);
		} else if(char === '*' || char === ' ') {
			proposals = computeBlockCompletions(prefix, comment, options, file);
		}
		return {completions: proposals};
	}
	
	/**
     * @description Get the prefix to use for the proposal, handles @-based prefixes
     * @param {Number} pos The activation context
     * @param {String} buffer The text
     * @returns {String} The prefix to use
     */
    function getPrefix(pos, buffer) {
        var index = pos-1;
        var word = '', char = buffer.charAt(index);
        if('{*,'.indexOf(char) > -1) {
            return word;
        }
        if(char === '@') {
            return char;
        } else if(char === '/' && buffer.charAt(index-1) === '/') {
        	return word;
    	}
        while(index >= 0 && /\S/.test(char)) {
            word = char+word;
            if(char === '@' || char === '*' || char === '{') {
                //we want the prefix to include the '@'
	            return word;
	        } else if(char === '/' && buffer.charAt(index-1) === '/') {
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
	/**
	 * @description Computes the reachable type names from the given scope
	 * @param {String} prefix The prefix
	 * @returns {Array.<Object>} The array of completion objects
	 */
	function computeTypeCompletions(prefix) {
		//TODO
		return [];
	}
	/**
	 * @description Computes the reachable type member names for completions
	 * @param {String} prefix The prefix
	 * @returns {Array.<Object>} The array of completion objects
	 */
	function computeMemberCompletions(prefix) {
		//TODO
		return [];
	}
	/**
	 * @description Computes the proposals for the block
	 * @param {String} prefix The prefix
	 * @param {Object} comment The AST node for the comment
	 * @param {Object} options The activation options
	 * @param {File} file The mapped file from Tern
	 * @returns {Array.<Object>} The array of completion objects
	 */
	function computeBlockCompletions(prefix, comment, options, file) {
		var proposals = [];
		var val;
		var line = getLine(options.end, file);
		var preamble = line.line.slice(0, options.end-line.start-prefix.length-1);
		if(/^\/\*$/.test(preamble.trim())) {
			var keys = Object.keys(block);
			for(var len = keys.length, i = 0; i < len; i++) {
				var tag = block[keys[i]];
				if(Util.looselyMatches(prefix, tag.name)) {
					var _p = createProposal(tag.name, tag.desc, prefix, tag.template);
					_p.url = tag.url;
					_p.doc = tag.desc;
					proposals.push(_p);
				}
			}
		} else if((val = /\s*\*\s*\@name\s*(\w*)/ig.exec(line.line)) !== null) {
			if(val[1] === prefix) {
				var node = Finder.findNodeAfterComment(comment, file.ast);
				var _name = getFunctionName(node);
				if(_name) {
					proposals.push(createProposal(_name, Messages['funcProposalDescription'], prefix));
				}
			}
		} else if((val = /\s*\*\s*\@param\s*(?:\{\w*\})?\s*(\w*)/ig.exec(line.line)) !== null) {
			if(val[1] === prefix) {
				node = Finder.findNodeAfterComment(comment, file.ast);
				if(node) {
					var prms = getFunctionParams(node);
					if(Array.isArray(prms)) {
						for(i = 0; i < prms.length; i++) {
							_name = prms[i].name;
							if(Util.looselyMatches(prefix, _name)) {
								proposals.push(createProposal(_name, Messages['funcParamProposalDescription'], prefix));
							}
						}
					}
				}
			}
		} else if(/^\s*(?:\/\*)?\s*eslint(?:-enable|-disable)?\s+/gi.test(line.line)) {
			//eslint eslint-enable eslint-disable
			var rules = Rules.rules;
			var rulekeys = Object.keys(rules).sort();
			for(i = 0; i < rulekeys.length; i++) {
				var rulekey = rulekeys[i];
				if(Util.looselyMatches(prefix, rulekey)) {
					var rule = rules[rulekey];
					_p = createProposal(rulekey, Messages['eslintRuleProposalDescripton'], prefix);
					var hover = rule.description ? rule.description : '';
					if(rule.url) {
						hover += i18nUtil.formatMessage.call(null, Messages['onlineDocumentationProposalEntry'], rule.url);
					}
					_p.hover = {content: hover, type: 'markdown'}; //$NON-NLS-1$
					proposals.push(_p);
				}
			}
		} else if(/^\s*(?:\/\*)?\s*eslint-env\s+/gi.test(line.line)) {
			//eslint-env (comma-separated list)
			keys = Object.keys(allEnvs).sort();
			for(i = 0; i < keys.length; i++) {
				var key = keys[i];
				if(key !== 'builtin' && Util.looselyMatches(prefix, key)) {
					proposals.push(createProposal(key, Messages['eslintEnvProposalDescription'], prefix));
				}
			}
		} else {
				keys = Object.keys(tags);
				for(len = keys.length, i = 0; i < len; i++) {
					tag = tags[keys[i]];
					if(Util.looselyMatches(prefix, tag.name)) {
						_p = createProposal(tag.name, "", prefix);
						_p.url = tag.url;
						_p.doc = tag.desc;
						proposals.push(_p);
						if(tag.template) {
							_p = createProposal(tag.name, "", prefix, tag.template);
							_p.url = tag.url;
							_p.doc = tag.desc;
							proposals.push(_p);
						}
					}
				}
		}
		return proposals;
	}
	
	/**
	 * @description Finds the line of text the completion is happening on - this mimics 
	 * an option we used to get from the client
	 * @param {Number} offset The offset in text the completion is happening at
	 * @param {File} file The file obejct from Tern
	 * @returns {String} The line of text
	 * @since 11.0
	 */
	function getLine(offset, file) {
		var line = '', idx = offset;
		if(idx > 0 && idx <= file.text.length) {
			var c = file.text.charAt(idx);
			if(c === '\n') {
				//started at the end, walk back to the next end
				idx--;
				c = file.text.charAt(idx);
			}
			while(c !== '\n' && idx > -1) {
				line = c+line;
				idx--;
				c = file.text.charAt(idx);
			}
		}
		return {line: line, start: idx};
	}
	
	/**
	 * @description Returns the function name from the given node if it relates to a function in some way
	 * @param {Object} node The AST node
	 * @returns {String} The name of he related function or null
	 * @since 10.0
	 */
	function getFunctionName(node) {
		switch(node.type) {
			case 'FunctionDeclaration': {
				return node.id.name;
			}
			case 'Property': {
				if(node.value.type === 'FunctionExpression') {
					return node.value.id ? node.value.id.name : node.key.name;
				}
				break;
			}
			case 'ExpressionStatement': {
				var _n = node.expression;
				if(_n && _n.type === 'AssignmentExpression' && _n.right.type === 'FunctionExpression') {
					if(_n.right.id) {
						return _n.right.id.name;
					}
					if(_n.left.type === 'Identifier') {
						return _n.left.name;
					}
					if(_n.left.type === 'MemberExpression') {
						return Signatures.expandMemberExpression(_n.left, '');
					}
				}
				break;
			}
			case 'VariableDeclaration': {
				if(node.declarations.length > 0) {
					//always pick the first one to attach the comment to
					var decl = node.declarations[0];
					if(decl.init && decl.init.type === 'FunctionExpression') {
						if(decl.init.id) {
							return decl.init.id.name;
						}
						return decl.id.name;
					}
				}
				break;
			}
		}
		return null;
	}

	/**
	 * @description Returns the parameters from the related function
	 * @param {Object} node The AST node
	 * @returns {Array.<Object>} The parameters from the related function or an empty array
	 * @since 10.0
	 */
	function getFunctionParams(node) {
		switch(node.type) {
			case 'FunctionDeclaration': {
				return node.params;
			}
			case 'Property': {
				if(node.value.type === 'FunctionExpression') {
					return node.value.params;
				}
				break;
			}
			case 'ExpressionStatement': {
				var _n = node.expression;
				if(_n && _n.type === 'AssignmentExpression' && _n.right.type === 'FunctionExpression') {
					return _n.right.params;
				}
				break;
			}
			case 'VariableDeclaration': {
				if(node.declarations.length > 0) {
					//always pick the first one to attach the comment to
					var decl = node.declarations[0];
					if(decl.init && decl.init.type === 'FunctionExpression') {
						return decl.init.params;
					}
				}
				break;
			}
		}
		return [];
	}
	
	/**
	 * @description Helper function to create a new proposal object
	 * @param {String} name The name of the proposal
	 * @param {String} description The description
	 * @param {String} prefix The optional prefix to pass along
	 * @param {String} template The optional code template for the proposal
	 * @returns {Object} A new proposal object
	 */
	function createProposal(name, description, prefix, template) {
		var p = Object.create(null);
		if(typeof(template) === 'string') {
			p.type = 'jsdoc_template';
			p.template = template;
			p.isTemplate = true;
		} else {
			p.type = 'doc';
		}
		p.name = name;
		p.proposal = name.slice(prefix.length);
		p.description = description;
		if(typeof(prefix) === 'string') {
			p.prefix = prefix;
		}
		return p;
	}
	
	/**
	 * These are templates / entries that apply to blocks starting with /* vs. /**
	 */
	var block = {
		"eslint": {
			name: "eslint",  //$NON-NLS-0$
			desc: Messages['eslintRuleEnableDisable'],
			template: "eslint ${rule-id}:${0/1} ${cursor}" //$NON-NLS-0$  
	    },
	    "eslint-env": {
			name: "eslint-env",  //$NON-NLS-0$
			desc: Messages['eslintEnvDirective'],
			template: "eslint-env ${library}" //$NON-NLS-0$  
	    },
	    "eslint-enable": {
			name: "eslint-enable",  //$NON-NLS-0$
			desc: Messages['eslintRuleEnable'],
			template: "eslint-enable ${rule-id} ${cursor}" //$NON-NLS-0$  
	    },
	    "eslint-disable": {
			name: "eslint-disable",  //$NON-NLS-0$
			desc: Messages['eslintRuleDisable'],
			template: "eslint-disable ${rule-id} ${cursor}" //$NON-NLS-0$  
	    }
	};
	
	var tags = {
		"abstract": {
			"name": "@abstract",
			"url": "http://usejsdoc.org/tags-abstract.html",
			"desc": "This member must be implemented (or overridden) by the inheritor."
		},
		"access": {
			"name": "@access",
			"url": "http://usejsdoc.org/tags-access.html",
			"desc": "Specify the access level of this member (private, public, or protected)."
		},
		"alias": {
			"name": "@alias",
			"url": "http://usejsdoc.org/tags-alias.html",
			"desc": "Treat a member as if it had a different name."
		},
		"augments": {
			"name": "@augments",
			"url": "http://usejsdoc.org/tags-augments.html",
			"desc": "Indicate that a symbol inherits from, ands adds to, a parent symbol."
		},
		"author": {
			"name": "@author",
			"url": "http://usejsdoc.org/tags-author.html",
			"desc": "Identify the author of an item.",
			"template": "@author ${cursor}"
		},
		"borrows": {
			"name": "@borrows",
			"url": "http://usejsdoc.org/tags-borrows.html",
			"desc": "This object uses something from another object."
		},
		"callback": {
			"name": "@callback",
			"url": "http://usejsdoc.org/tags-callback.html",
			"desc": "Document a callback function.",
			"template": "@callback ${cursor}"
		},
		"class": {
			"name": "@class",
			"url": "http://usejsdoc.org/tags-class.html",
			"desc": "This function is intended to be called with the \"new\" keyword.",
			"template": "@class ${cursor}"
		},
		"classdesc": {
			"name": "@classdesc",
			"url": "http://usejsdoc.org/tags-classdesc.html",
			"desc": "Use the following text to describe the entire class."
		},
		"constant": {
			"name": "@constant",
			"url": "http://usejsdoc.org/tags-constant.html",
			"desc": "Document an object as a constant."
		},
		"constructs": {
			"name": "@constructs",
			"url": "http://usejsdoc.org/tags-constructs.html",
			"desc": "This function member will be the constructor for the previous class."
		},
		"copyright": {
			"name": "@copyright",
			"url": "http://usejsdoc.org/tags-copyright.html",
			"desc": "Document some copyright information."
		},
		"default": {
			"name": "@default",
			"url": "http://usejsdoc.org/tags-default.html",
			"desc": "Document the default value."
		},
		"deprecated": {
			"name": "@deprecated",
			"url": "http://usejsdoc.org/tags-deprecated.html",
			"desc": "Document that this is no longer the preferred way.",
			"template": "@deprecated ${cursor}"
		},
		"description": {
			"name": "@description",
			"url": "http://usejsdoc.org/tags-description.html",
			"desc": "Describe a symbol.",
			"template": "@description ${cursor}"
		},
		"enum": {
			"name": "@enum",
			"url": "http://usejsdoc.org/tags-enum.html",
			"desc": "Document a collection of related properties."
		},
		"event": {
			"name": "@event",
			"url": "http://usejsdoc.org/tags-event.html",
			"desc": "Document an event."
		},
		"example": {
			"name": "@example",
			"url": "http://usejsdoc.org/tags-example.html",
			"desc": "Provide an example of how to use a documented item."
		},
		"exports": {
			"name": "@exports",
			"url": "http://usejsdoc.org/tags-exports.html",
			"desc": "Identify the member that is exported by a JavaScript module."
		},
		"external": {
			"name": "@external",
			"url": "http://usejsdoc.org/tags-external.html",
			"desc": "Identifies an external class, namespace, or module."
		},
		"file": {
			"name": "@file",
			"url": "http://usejsdoc.org/tags-file.html",
			"desc": "Describe a file."
		},
		"fires": {
			"name": "@fires",
			"url": "http://usejsdoc.org/tags-fires.html",
			"desc": "Describe the events this method may fire."
		},
		"function": {
			"name": "@function",
			"url": "http://usejsdoc.org/tags-function.html",
			"desc": "Describe a function or method.",
			"template": "@function ${cursor}"
		},
		"global": {
			"name": "@global",
			"url": "http://usejsdoc.org/tags-global.html",
			"desc": "Document a global object."
		},
		"ignore": {
			"name": "@ignore",
			"url": "http://usejsdoc.org/tags-ignore.html",
			"desc": "Omit a symbol from the documentation."
		},
		"implements": {
			"name": "@implements",
			"url": "http://usejsdoc.org/tags-implements.html",
			"desc": "This symbol implements an interface."
		},
		"inheritdoc": {
			"name": "@inheritdoc",
			"url": "http://usejsdoc.org/tags-inheritdoc.html",
			"desc": "Indicate that a symbol should inherit its parent's documentation."
		},
		"inner": {
			"name": "@inner",
			"url": "http://usejsdoc.org/tags-inner.html",
			"desc": "Document an inner object."
		},
		"instance": {
			"name": "@instance",
			"url": "http://usejsdoc.org/tags-instance.html",
			"desc": "Document an instance member."
		},
		"interface": {
			"name": "@interface",
			"url": "http://usejsdoc.org/tags-interface.html",
			"desc": "This symbol is an interface that others can implement."
		},
		"kind": {
			"name": "@kind",
			"url": "http://usejsdoc.org/tags-kind.html",
			"desc": "What kind of symbol is this?"
		},
		"lends": {
			"name": "@lends",
			"url": "http://usejsdoc.org/tags-lends.html",
			"desc": "Document properties on an object literal as if they belonged to a symbol with a given name.",
			"template": "@lends ${cursor}"
		},
		"license": {
			"name": "@license",
			"url": "http://usejsdoc.org/tags-license.html",
			"desc": "Identify the license that applies to this code.",
			"template": "@license ${cursor}"
		},
		"listens": {
			"name": "@listens",
			"url": "http://usejsdoc.org/tags-listens.html",
			"desc": "List the events that a symbol listens for."
		},
		"member": {
			"name": "@member",
			"url": "http://usejsdoc.org/tags-member.html",
			"desc": "Document a member."
		},
		"memberof": {
			"name": "@memberof",
			"url": "http://usejsdoc.org/tags-memberof.html",
			"desc": "This symbol belongs to a parent symbol."
		},
		"mixes": {
			"name": "@mixes",
			"url": "http://usejsdoc.org/tags-mixes.html",
			"desc": "This object mixes in all the members from another object."
		},
		"mixin": {
			"name": "@mixin",
			"url": "http://usejsdoc.org/tags-mixin.html",
			"desc": "Document a mixin object."
		},
		"module": {
			"name": "@module",
			"url": "http://usejsdoc.org/tags-module.html",
			"desc": "Document a JavaScript module."
		},
		"name": {
			"name": "@name",
			"url": "http://usejsdoc.org/tags-name.html",
			"desc": "Document the name of an object.",
			"template": "@name ${cursor}"
		},
		"namespace": {
			"name": "@namespace",
			"url": "http://usejsdoc.org/tags-namespace.html",
			"desc": "Document a namespace object."
		},
		"override": {
			"name": "@override",
			"url": "http://usejsdoc.org/tags-override.html",
			"desc": "Indicate that a symbol overrides its parent."
		},
		"param": {
			"name": "@param",
			"url": "http://usejsdoc.org/tags-param.html",
			"desc": "Document the parameter to a function.",
			"template": "@param {${type}} ${cursor}"
		},
		"private": {
			"name": "@private",
			"url": "http://usejsdoc.org/tags-private.html",
			"desc": "This symbol is meant to be private.",
			"template": "@private ${cursor}"
		},
		"property": {
			"name": "@property",
			"url": "http://usejsdoc.org/tags-property.html",
			"desc": "Document a property of an object."
		},
		"protected": {
			"name": "@protected",
			"url": "http://usejsdoc.org/tags-protected.html",
			"desc": "This symbol is meant to be protected."
		},
		"public": {
			"name": "@public",
			"url": "http://usejsdoc.org/tags-public.html",
			"desc": "This symbol is meant to be public.",
			"template": "@public ${cursor}"
		},
		"readonly": {
			"name": "@readonly",
			"url": "http://usejsdoc.org/tags-readonly.html",
			"desc": "This symbol is meant to be read-only."
		},
		"requires": {
			"name": "@requires",
			"url": "http://usejsdoc.org/tags-requires.html",
			"desc": "This file requires a JavaScript module."
		},
		"returns": {
			"name": "@returns",
			"url": "http://usejsdoc.org/tags-returns.html",
			"desc": "Document the return value of a function.",
			"template": "@returns {${type}} ${cursor}"
		},
		"see": {
			"name": "@see",
			"url": "http://usejsdoc.org/tags-see.html",
			"desc": "Refer to some other documentation for more information.",
			"template": "@see ${cursor}"
		},
		"since": {
			"name": "@since",
			"url": "http://usejsdoc.org/tags-since.html",
			"desc": "When was this feature added?",
			"template": "@since ${cursor}"
		},
		"static": {
			"name": "@static",
			"url": "http://usejsdoc.org/tags-static.html",
			"desc": "Document a static member."
		},
		"summary": {
			"name": "@summary",
			"url": "http://usejsdoc.org/tags-summary.html",
			"desc": "A shorter version of the full description."
		},
		"this": {
			"name": "@this",
			"url": "http://usejsdoc.org/tags-this.html",
			"desc": "What does the 'this' keyword refer to here?"
		},
		"throws": {
			"name": "@throws",
			"url": "http://usejsdoc.org/tags-throws.html",
			"desc": "Describe what errors could be thrown.",
			"template": "@throws {${type}} ${cursor}"
		},
		"todo": {
			"name": "@todo",
			"url": "http://usejsdoc.org/tags-todo.html",
			"desc": "Document tasks to be completed."
		},
		"tutorial": {
			"name": "@tutorial",
			"url": "http://usejsdoc.org/tags-tutorial.html",
			"desc": "Insert a link to an included tutorial file."
		},
		"type": {
			"name": "@type",
			"url": "http://usejsdoc.org/tags-type.html",
			"desc": "Document the type of an object."
		},
		"typedef": {
			"name": "@typedef",
			"url": "http://usejsdoc.org/tags-typedef.html",
			"desc": "Document a custom type."
		},
		"variation": {
			"name": "@variation",
			"url": "http://usejsdoc.org/tags-variation.html",
			"desc": "Distinguish different objects with the same name."
		},
		"version": {
			"name": "@version",
			"url": "http://usejsdoc.org/tags-version.html",
			"desc": "Documents the version number of an item."
		},
		"link": {
			"name": "{@link}",
			"url": "http://usejsdoc.org/tags-inline-link.html",
			"desc": "Link to another item in the documentation."
		},
		"inline-tutorial": {
			"name": "{@tutorial}",
			"url": "http://usejsdoc.org/tags-inline-tutorial.html",
			"desc": "Link to a tutorial."
		}
	};
	
});