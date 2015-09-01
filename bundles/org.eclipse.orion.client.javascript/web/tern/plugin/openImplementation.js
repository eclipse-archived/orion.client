/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, amd*/
/*globals infer tern resolver*/
(function(mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    return mod(require("../lib/infer"), require("../lib/tern"), require);
  if (typeof define === "function" && define.amd) // AMD
    return define(["../lib/infer", "../lib/tern", './resolver'], mod);
  mod(infer, tern, resolver);
})(/* @callback */ function(infer, tern, resolver) {
	
	tern.registerPlugin("openImplementation", /* @callback */ function(server, options) { //$NON-NLS-1$
	    return {};
	});
	
	tern.defineQueryType('implementation', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			var property = this._getDefNode(server, query);
			while (property) {
				var fileName = property.value.sourceFile.name;
				var newQuery = {start: property.value.range[0],
								end: property.value.range[1],
								type: "definition", //$NON-NLS-1$
								file: fileName};
				if (property.value.type === "FunctionExpression") {
					return {implementation: newQuery};
				} else if (property.value.type === "Identifier") {
					property = this._getDefNode(server, newQuery);
				}
			}
			return {implementation: {}};
		},
		_getDefNode: function(server, query) {
			var theFile = server.fileMap[query.file];
			var res = tern.findDef(server, query, theFile);
			if (res) {
				theFile = server.fileMap[res.file];
				var implName = theFile.text.substring(res.start, res.end);
				var theNode = infer.findExpressionAt(theFile.ast, res.start, res.end, null, function(type, node) {
					return true;
				});
				var outerNode = infer.findExpressionAround(theFile.ast, res.start, res.end);
				if (outerNode) {
					if (outerNode.node.properties) {
						for (var i=0; i<outerNode.node.properties.length; i++) {
							var property = outerNode.node.properties[i];
							if (property.key.name === implName) {
								return property;
							}
						}
					} else if (outerNode.start === res.start && outerNode.end === res.end) {
						return outerNode;
					}
				}
			}
			return null;
		}
	});
});