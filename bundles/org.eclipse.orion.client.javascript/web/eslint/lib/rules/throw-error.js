/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd, browser, node */
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
	 * @description Rule exports
	 * @function
	 * @param context
	 * @returns {Object} Rule exports
	 */
	module.exports = function(context) {
		"use strict"; //$NON-NLS-0$
		
		/**
		 * @description Checks a throw statement
		 * @private
		 * @param {Object} node The AST 'throw' node
		 */
		function checkThrowArgument(node) {
			try {
				var argument = node.argument;
				// We have no type analysis yet, so to avoid false positives, assume any expr that *could*
				// generate an Error actually does.
				switch (node.argument.type) {
					case "NewExpression":
					case "Identifier":
					case "CallExpression":
					case "MemberExpression":
					case "ConditionalExpression": // throw y ? x : y;
					case "LogicalExpression":     // throw x || y;
					case "SequenceExpression":    // throw 1, 2, new Error(); // throws an Error. weird but true
						return;
				}
				context.report(argument, "Throw an Error instead.");
			} catch (ex) {
				console.log(ex);
			}
		}

		return {
			"ThrowStatement": checkThrowArgument //$NON-NLS-0$
		};
	};
	return module.exports;
}));
