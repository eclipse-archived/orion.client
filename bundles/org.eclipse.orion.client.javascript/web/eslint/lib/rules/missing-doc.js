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
/*global define module require exports */
(function(root, factory) {
	if(typeof exports === 'object') {
		module.exports = factory(require, exports, module);
	}
	else if(typeof define === 'function' && define.amd) {
		define(['require', 'exports', 'module'], factory);
	}
	else {
		var req = function(id) {return root[id];},
			exp = root,
			mod = {exports: exp};
		root.rules.noundef = factory(req, exp, mod);
	}
}(this, function(require, exports, module) {
	module.exports = function(context) {
		"use strict";
		
		/**
		 * @name checkDoc
		 * @description Call-back to check the currently visited node
		 * @private
		 * @param {Object} node The currently visited AST node
		 */
		function checkDoc(node) {
			if(!context.options) {
				return;
			}
			var comments;
			switch(node.type) {
				case 'Property':
					if(context.options[1] === 'expr') {
						if(node.value && node.value.type && node.value.type === 'FunctionExpression') {
							comments = context.getComments(node);
							if(!comments || comments.leading.length < 1) {
								var name;
								switch(node.key.type) {
									case 'Identifier':
										name = node.key.name;
										break;
									case 'Literal':
										name = node.key.value;
										break;
								}
								reportMissingDoc(node.key, name);
							}
						}
					}
					break;
				case 'FunctionDeclaration':
					if(context.options[0] === 'decl') {
						comments = context.getComments(node);
						if(!comments || comments.leading.length < 1) {
							reportMissingDoc(node.id, node.id.name);
						}
					}
					break;
			}
		};
		
		/**
		 * @name reportMissingDoc
		 * @description Creates a new error marker in the context
		 * @private
		 */
		function reportMissingDoc(node, name) {
			context.report(node, 'Missing documentation for function {{name}}', {name: name});
		}
		
		return {
			"Property": checkDoc,
			"FunctionDeclaration": checkDoc,
		};
	};
	return module.exports;
}));