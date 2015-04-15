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
    'javascript/hover'
], function(Hover) {
    
    /**
     * @description Computes the content assist proposals
     * @param {Object} ternserver The server to send requests to
     * @param {Function} postMessage The postMessage callback to use to report back to the worker
     * @param {Object} args The arguments from the original request 
     * @returns {Array.<Object>} The array of assist proposals or an empty array, never <code>null</code>
     * @since 9.0
     */
    function computeProposals(ternserver, postMessage, args) {
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
	           sort:true
	           }}, 
	           function(error, comps) {
	               if(error) {
	                   postMessage({error: error.message, message: 'Failed to compute proposals'});
	               } else if(comps && comps.completions) {
        			   postMessage({request: 'completions', proposals:sortProposals(comps.completions, args)});
	               }
	           });
	       
	   } else {
	       postMessage({message: 'failed to compute proposals, server not started'});
	   }
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
		type = type.replace(/:?\s*\?/g, ': Any');
		type = type.replace(/:?\s*bool/g, ': Boolean');
		type = type.replace(/:?\s*number/g, ': Number');
		type = type.replace(/:?\s*string/g, ': String');
		return type;
	}

	/**
	 * @description Match ignoring case and checking camel case.
	 * @function
	 * @param {String} prefix
	 * @param {String} target
	 * @returns {Boolean} If the two strings match
	 */
	function _looselyMatches(prefix, target) {
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
	
	function sortProposals(completions, args) {
	    var _p = Object.create(null);
	    //bucket them by origin
	    var locals = [];
	    for(var i = 0; i < completions.length; i++) {
	        var _c = completions[i];
	        if(!isReachable(_c.origin, args.meta)) {
	        	continue;
	        }
	        if(_looselyMatches(args.params.prefix, _c.name)) {
    	        var _o = _c.origin;
    	        _o = _o ? _o : '?';
    	        if(_o === args.meta.location) {
    	            locals = _binInsert(locals, _formatTernProposal(_c, args));
    	        } else {
    	           _p[_o] = _binInsert(_p[_o], _formatTernProposal(_c, args));
    	        }
	        }
	    }
	    var proposals = [].concat(locals);
	    var keys = Object.keys(_p);
	    for(var i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        proposals.push({
					proposal: '',
					description: key, //$NON-NLS-0$
					style: 'noemphasis_title_keywords', //$NON-NLS-0$
					unselectable: true
				});
	        proposals = proposals.concat(_p[key]);
	    }
	    return proposals;
	}
	
	/**
	 * @description Determines if the given proposal is reachable from the current file context
	 * @param {String} origin The origin of the proposal
	 * @param {Object} meta The metadata describing the location
	 * @returns {Boolean} if the given proposal origin is reachable from the current file context
	 */
	function isReachable(origin, meta) {
		//TODO until we collect the requires graph we only want to show from the file context + indexes
		return (origin === meta.location) || origin.indexOf('/') < 0;
	}
	
	function _binInsert(arr, comp) {
	    if(!arr) {
	        arr = [];
	    }
	    var len = arr.length;
	    if(len === 0) {
	        arr.push(comp);
	    } else {
	        var ret = arr[len-1].name.localeCompare(comp.name);
	        if(ret === 0 || ret < 0) {
	            arr.push(comp);
	        } else {
	            var i;
	            var min = 0, max = len;
	            while(min <= max) {
	                i = Math.floor((min+max)/2);
	                ret = arr[i].name.localeCompare(comp.name);
	                if(ret === 0) {
	                    arr.splice(i+1, 0, comp);
	                    return arr;
	                } else if(ret < 0) {
	                    min = i+1;
	                } else {
	                    max = i-1;          
	                }
	                if(max === min) {
	                    arr.splice(min, 0, comp);
	                    return arr;
	                }
	            }
	        }
	    }
	    return arr;
	}
	
	return {
	    computeProposals: computeProposals
	};
});