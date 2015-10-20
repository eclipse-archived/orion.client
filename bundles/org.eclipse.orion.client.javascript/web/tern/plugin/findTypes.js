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
/*globals infer tern walk*/
define([
	"../lib/infer", 
	"../lib/tern", 
	"acorn/dist/walk",
	"javascript/finder"
],/* @callback */ function(infer, tern, walk, finder) {
	
	function addNodeContext(file, end, result) {
		var node = finder.findNode(end, file.ast);
		if(node) {
			//we only want a very small subset of node infos
			var n = Object.create(null);
			n.type = node.type;
			n.range = node.range;
			n.value = node.value;
			result.node = n;
		}

	}
	
	function inComment(file, end) {
		var comments = file.ast.comments;
		if(Array.isArray(comments)) {
			for(var i = 0, len = comments.length; i < len; i++) {
				var comment = comments[i];
				if(comment.range[0] <= end && comment.range[1] >= end) {
					return comment;
				}
			}
		}
		return null;
	}
	
	tern.registerPlugin('findTypes', /* @callback */ function(server, options) { //$NON-NLS-1$
		return {};
	});
	
	tern.defineQueryType('findType', { //$NON-NLS-1$
		/**
		 * @callback
		 */
		run: function run(server, query) {
			var file = tern.resolveFile(server, server.fileMap, query.file), result;
			if(file) {
				var comment = inComment(file, query.end);
				if(comment) {
					//handle in a comment
					result = {
				    	guess: infer.didGuess(),
				        type: null,
				        name: null,
				        node: comment
				    };
				} else {
					var expr = tern.findExpr(file, query), exprName;
				    var type = tern.findExprType(server, query, file, expr); 
				    var exprType = type;
				    if (query.preferFunction) {
						type = type.getFunctionType() || type.getType();
					} else {
						type = type.getType();
					}
				    if (expr) {
						if (expr.node.type === "Identifier") {
				        	exprName = expr.node.name;
			        	} else if (expr.node.type === "MemberExpression" && !expr.node.computed) {
				        	exprName = expr.node.property.name;
			        	}
				    }
				    result = {
				    	guess: infer.didGuess(),
				        type: infer.toString(exprType),
				        name: type && type.name,
				        exprName: exprName
				    };
				    addNodeContext(file, query.end, result);
				    if (type) {
				    	tern.storeTypeDocs(query, type, result);
			    	}
				    if (!result.doc && exprType.doc) {
				    	result.doc = tern.parseDoc(query, exprType.doc);
					}
			    }
			}
			return result;
		}
	});
}); 