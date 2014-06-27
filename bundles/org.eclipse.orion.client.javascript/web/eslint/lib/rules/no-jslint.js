/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define module require exports console */
(function(root, factory) {
	if(typeof exports === 'object') {  //$NON-NLS-0$
		module.exports = factory(require, exports, module);
	}
	else if(typeof define === 'function' && define.amd) {  //$NON-NLS-0$
		define(['require', 'exports', 'module'], factory);
	}
	else {
		var req = function(id) {return root[id];},
			exp = root,
			mod = {exports: exp};
		root.rules.noundef = factory(req, exp, mod);
	}
}(this, function(require, exports, module) {

	/**
	 * @name module.exports
	 * @description Exported rule
	 * @function
	 * @param context
	 * @returns {Object} Exported AST nodes to lint
	 */
	module.exports = function(context) {
		"use strict";  //$NON-NLS-0$
		
		return {
			'Program' : function(node) {
			    var comments = node.comments;
			    var len;
			    if(comments && (len = comments.length) && comments.length > 0) {
			        for(var i = 0; i < len; i++) {
			            var comment = comments[i];
			            if(comment.type === 'Block') {
			                var match = /^\s*(js[l|h]int)\s*(\w*:\w*)+/ig.exec(comment.value);
			                if(match) {
			                    var jslint = match[1];
			                    if(jslint.length < 1) {
			                        continue;
			                    }
			                    var start = 2 + comment.value.indexOf(jslint) + comment.range[0];
			                    var end = start + jslint.length;
			                    context.report({type:'comment', range:[start, end]}, 'The \'{{a}}\' directive is unsupported, please use eslint-env.', {a: jslint});
			                }
			            }
			        }
			    }
			 }
		};
	};
	return module.exports;
}));
