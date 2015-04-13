/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation, Inc. and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *   IBM Corporation - Initial API and implementation
 ******************************************************************************/
/* eslint-env amd */
define([
], function() {
    
    /**
     * @description Compute the hover for the given arguments
     * @param {Object} ternserver The server to query
     * @param {Function} postMessage The callback to post back from the worker
     * @param {Object} args The arguments
     * @since 9.0
     */
    function computeHover(ternserver, postMessage, args) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "documentation", 
		           file: args.meta.location,
		           end: args.params.offset,
	           }}, 
	           function(error, doc) {
	               if(error) {
	                   postMessage({error: error.message, message: 'Failed to compute documentation'});
	               }
	               if(Array.isArray(doc)) {
        			   postMessage({request: 'hover', doc:doc});
	               }
	           });
	   } else {
	       postMessage({message: 'failed to compute documentation, server not started'});
	   }
    }
    
    return {
        computeHover: computeHover
    };
});