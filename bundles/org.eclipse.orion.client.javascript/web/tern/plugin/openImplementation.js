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
			if (query.end && !query.start) {
				query.start = query.end;
			}
			var definition = this._getDefNode(server, query);
			var prevDef;
			while (definition) {
//				console.log(definition.type);
				// If a 'findDef' finds itself we're done
				if (prevDef && prevDef.start === definition.start && prevDef.end === definition.end) {
					return {implementation: {start: definition.start, end: definition.end,
												file: definition.sourceFile.name}};
				}
				prevDef = definition;
				
				if (definition.type === "Property") {					
					definition = definition.value;
				} else if (definition.type === "Identifier") {
					query = {start: definition.start, end: definition.end,
									type: "definition", //$NON-NLS-1$
									file: definition.sourceFile.name};
					definition = this._getDefNode(server, query);
				} else if (definition.type === "MemberExpression") {
					definition = definition.property;
				} else if (definition.type === "FunctionExpression") {
					return {implementation: {start: definition.start, end: definition.end,
												file: definition.sourceFile.name}};
				}
			}
			return {implementation: {}};
		},
		_getDefNode: function(server, query) {
			var theFile = server.fileMap[query.file];
//			console.log("findDef: " + query.start + "," + query.end + " : " + theFile.name);
			var res = tern.findDef(server, query, theFile);
			if (res && res.start) {
				theFile = server.fileMap[res.file];
				if (theFile.ast) {
					var theNode = infer.findExpressionAt(theFile.ast, res.start, null, null, function(type, node) {
						return true;
					});
//					console.log("OK");
					return theNode.node;
				}
			}
			return null;
		}
	});
});