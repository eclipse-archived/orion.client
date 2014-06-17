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
		module.exports = factory(require('../util'), require, exports, module);  //$NON-NLS-0$
	}
	else if(typeof define === 'function' && define.amd) {  //$NON-NLS-0$
		define(['eslint/util', 'require', 'exports', 'module'], factory);
	}
	else {
		var req = function(id) {return root[id];},
			exp = root,
			mod = {exports: exp};
		root.rules.noundef = factory(req, exp, mod);
	}
}(this, function(util, require, exports, module) {

	/**
	 * @name module.exports
	 * @description Exported rule
	 * @function
	 * @param context
	 * @returns {Object} Exported AST nodes to lint
	 */
	module.exports = function(context) {
		"use strict";  //$NON-NLS-0$
		
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

        return {
            "BlockStatement": function(node) {
                checkUnreachable(node.body);
            },
    
            "SwitchCase": function(node) {
                checkUnreachable(node.consequent);
            }
        };
	};
	return module.exports;
}));
