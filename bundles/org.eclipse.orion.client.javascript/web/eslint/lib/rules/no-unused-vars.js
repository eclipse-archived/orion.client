/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*jslint node:true amd:true*/
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
		"use strict";  //$NON-NLS-0$

		function isRead(ref) {
			return ref.isRead();
		}

		/**
		 * @name getReferences
		 * @description The array of references to the given variable
		 * @param scope
		 * @param variable
		 * @returns {Array} The references
		 */
		function getReferences(scope, variable) {
			var refs = variable.references;
			if (scope.type === "global") {  //$NON-NLS-0$
				// For whatever reason, a reference to some variable 'x' defined in global scope does not cause an entry
				// in x.references or globalScope.references. So we append any refs in globalScope.through that mention x.
				refs = refs.concat(scope.through.filter(function(ref) {
					return ref.identifier.name === variable.name;
				}));
			}
			return refs;
		}

		/**
		 * @name check
		 * @description Lints the given node
		 * @param node
		 */
		function check(node) {
			try {
				var scope = context.getScope();
				scope.variables.forEach(function(variable) {
					if (!variable.defs.length || variable.defs[0].type === "Parameter") { // Don't care about parameters  //$NON-NLS-0$
						return;
					}
					var references = getReferences(scope, variable), id = variable.defs[0].node.id;
					var reason;
					if (!references.length) {
					    reason = 'never used';
						context.report(id, "'${0}' is ${1}.", {0:id.name, 1:reason});
					} else if (!references.some(isRead)) {
					    reason = 'never read';
						context.report(id, "'${0}' is ${1}.", {0:id.name, 1:reason});
					}
				});
			}
			catch(ex) {
				console.log(ex);
			}
		}

		return {
			"Program": check,  //$NON-NLS-0$
			"FunctionDeclaration": check,  //$NON-NLS-0$
			"FunctionExpression": check  //$NON-NLS-0$
		};
	};
	return module.exports;
}));
