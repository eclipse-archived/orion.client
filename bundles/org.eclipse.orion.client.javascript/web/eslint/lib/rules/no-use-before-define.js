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
/*global define module require exports */
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


	function booleanOption(b, defaultValue) {
		return typeof b === "boolean" ? b : defaultValue;  //$NON-NLS-0$
	}

	//------------------------------------------------------------------------------
	// Rule Definition
	//------------------------------------------------------------------------------
	module.exports = function(context) {
		"use strict";  //$NON-NLS-0$

		var options = context.options,
		    flag_vars = booleanOption(options[0], true),   // by default, flag vars
		    flag_funcs = booleanOption(options[1], false); // ... but not funcs

		// TODO extract this helper to util.js and see if it can be used to clean up 'no-redeclare' rule
		function getDeclaration(ref, scope) {
			for (var curScope = scope; true; ) {
				if (!curScope) {
					return null;
				}
				var name = ref.identifier.name, decl;
				curScope.variables.some(function(v) {
					if (v.name === name) {
						decl = v;
						return true;
					}
					return false;
				});
				if (decl) {
					return decl;
				}
				curScope = curScope.upper;
			}
		}

		function check(node) {
			var scope = context.getScope();
			scope.references.forEach(function(ref) {
				var decl = getDeclaration(ref, scope), identifier = ref.identifier, name = identifier.name, defs;
				if (decl && (defs = decl.defs).length && identifier.range[0] < defs[0].node.range[0]) {
					var defType = defs[0].type;
					if ((!flag_funcs && defType === "FunctionName") || (!flag_vars && defType === "Variable")) {  //$NON-NLS-0$  //$NON-NLS-1$
						return;
					}
					context.report(identifier, "'{{name}}' was used before it was defined.", {name: name});
				}
			});
		}

		return {
			"Program": check,  //$NON-NLS-0$
			"FunctionExpression": check,  //$NON-NLS-0$
			"FunctionDeclaration": check  //$NON-NLS-0$
		};
	};
	return module.exports;
}));
