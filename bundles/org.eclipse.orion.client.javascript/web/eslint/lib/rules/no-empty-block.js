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
/*eslint-env amd, node*/
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
		var comments;
		
		return {
		    'Program' : function(node) {
		          comments = node.comments;  
		    },
			'BlockStatement' : function(node) {
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
		};
	};
	return module.exports;
}));
