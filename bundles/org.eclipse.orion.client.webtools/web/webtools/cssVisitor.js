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
/*eslint-env amd*/
define([
], function() {

	var Visitor = {
        
        BREAK: 1,
        SKIP: 2,
        
        /**
         * Visit the given AST top-down node -> attributes -> value -> end visit
         * @param {Object} dom	The AST to visit
         * @param {Function} callback The visitor callback 
         */
        visit: function visit(ast, callback) {
            if(Array.isArray(ast.body) && callback && typeof(callback.visitNode) === 'function') {
                for(var i = 0; i < ast.body.length; i++) {
                    var ret = visitNode(callback, ast.body[i], null);
                    endVisitNode(callback, ast.body[i]);
                    if(ret === this.BREAK) {
                        return;
                    }
                }    
            }
        }
    };

	/**
	 * Visits a given node with a given callback function. if the function does not implement #visitNode this function does nothing
	 * @param {Function} callback The visitor callback. Can optionally implement #visitNode
	 * @param {Object} node The current node being visited
	 * @param {Object} last the last node that was visited
	 * @returns {Number} Returns #Break or #SKIP or nothing   
	 */
    function visitNode(callback, node, last) {
    	if(typeof(callback.visitNode) === 'function') {
	        node.parent = last;
	        var ret = callback.visitNode(node);
	        if(ret === Visitor.BREAK || ret === Visitor.SKIP) {
	            return ret;
	        } 
	        if(Array.isArray(node.body)) {
	            ret = visitNodes(node, node.body, callback);
	            if(ret === Visitor.BREAK) {
		            return ret;
		        }
	        } else if(Array.isArray(node.declarations)) {
				ret = visitNodes(node, node.declarations, callback);
	            if(ret === Visitor.BREAK) {
		            return ret;
		        }	        	
	        } else if(Array.isArray(node.properties)) {
				ret = visitNodes(node, node.properties, callback);
	            if(ret === Visitor.BREAK) {
		            return ret;
		        }	        	
	        }
        }
    }
    
    function visitNodes(node, arr, callback) {
    	for(var i = 0; i < arr.length; i++) {
	        var _n = arr[i];
	        var ret = callback.visitNode(_n, node);
	        if(typeof(callback.endVisitNode) === 'function') {
	    		callback.endVisitNode(_n);
	    	}
	        if(ret === Visitor.SKIP) {
	        	continue;
	        } else if(ret === Visitor.BREAK) {
	            return ret;
	        }
	    }
    }
    
    /**
     * Ends the visit on the given node with the given callback. Allows for post-processing when we are going to leave a node. If the callback does not implement
     * #endVisitNode this function does nothing
     * @param {Function} callback The visitor callback. Can optionally implement #endVisitNode
     * @param {Object} node The node we are ending the visit for
     */
    function endVisitNode(callback, node) {
    	if(typeof(callback.endVisitNode) === 'function') {
    		callback.endVisitNode(node);
    	}
    }

    return Visitor;    
});