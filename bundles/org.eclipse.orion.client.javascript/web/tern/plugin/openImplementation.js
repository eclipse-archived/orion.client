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
    return define(["../lib/infer", "../lib/tern", './resolver', "javascript/finder"], mod);
  mod(infer, tern, resolver);
})(/* @callback */ function(infer, tern, resolver, Finder) {
	
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
			var theFile = server.fileMap[query.file];
			return this.findImplRecurse(query.end, theFile, {implementation: {}}, server);
		},
		
		/**
		 * Looks at the given offset in the given file and returns the implementation if one can be found.
		 * Otherwise returns the given candidateImpl.  This function will run recursively until it finds a node
		 * that is the implementation or findDef returns the same node.
		 * @param offset offset in the file where the node/caret is
		 * @param serverFile the server file containing the ast and filename
		 * @param candidateImpl the value to return if an implementation can't be found
		 * @param server the server to lookup other files in
		 * @returns {Object} Implementation object containing a single 'implementation' property with start/end/file info
		 */
		findImplRecurse: function findImplRecurse(offset, serverFile, candidateImpl, server){
			var query, typeDef, newServerFile;
			if (serverFile){
				var node = Finder.findNode(offset, serverFile.ast, {parents: true});
				if (node){
					if (node.type === 'Identifier'){
						var parent = node.parents[node.parents.length-1];
						if (parent){
							if (parent.type === 'MemberExpression' && node.parents.length >= 2){
								// See if the member expression is an assignment a.b=1 that we can follow, otherwise fallthrough and lookup typeDef for the property node
								parent = node.parents[node.parents.length-2];
							}
							
							var rhs;
							if (parent.type === 'VariableDeclarator' && parent.init){
								rhs = parent.init;
							} else if (parent.type === 'AssignmentExpression' && parent.right){
								rhs = parent.right;
							} else if (parent.type === 'Property' && parent.value){
								rhs = parent.value;
							}
							if (rhs){
								if (rhs.type === 'Literal' || rhs.type === 'FunctionExpression'){
									// Literals count as implementations
									// Function expressions are implementations of a function
									// Short circuit and use the current node
									return {implementation: {start: node.start, end: node.end, file: serverFile.name}};
								}
								// Find the implementation of the RHS identifier
								query = {start: rhs.start, end: rhs.end, file: serverFile.name};
								typeDef = tern.findDef(server, query, serverFile);
								if (typeDef && typeof typeDef.start === 'number' && typeof typeDef.end === 'number' && (typeDef.start !== node.start || typeDef.end !== node.end)){
									newServerFile = server.fileMap[typeDef.file];
									return this.findImplRecurse(typeDef.end, newServerFile, {implementation: {start: typeDef.start, end: typeDef.end, file: typeDef.file}}, server);
								}
							}
						}
						// There are many parents of an identifier, rather than list them all, default to look up the typeDef of the identifier
						query = {start: node.start, end: node.end, file: serverFile.name};
						typeDef = tern.findDef(server, query, serverFile);
						if (typeDef && typeof typeDef.start === 'number' && typeof typeDef.end === 'number' && (typeDef.start !== node.start || typeDef.end !== node.end)){
							newServerFile = server.fileMap[typeDef.file];
							return this.findImplRecurse(typeDef.end, newServerFile, {implementation: {start: typeDef.start, end: typeDef.end, file: typeDef.file}}, server);
						}
						
						// The typeDef couldn't be found or matches the current node, just return the node
						return {implementation: {start: node.start, end: node.end, file: serverFile.name}};
					}
				}
			}
			// Fall back on the last candidate implementation
			return candidateImpl;
		}
	});
});