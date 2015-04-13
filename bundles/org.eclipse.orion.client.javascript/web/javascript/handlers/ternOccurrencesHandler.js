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
     * @description Compute the occurrences 
     * @param {Object} ternserver The server to query
     * @param {Function} postMessage The callback postMessage to communicate back fro the worker 
     * @param {Object} args The arguments
     * @since 9.0
     */
    function computeOccurrences(ternserver, postMessage, args) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "refs", 
		           file: args.meta.location,
		           end: args.params.selection.start,
	           }}, 
	           function(error, refs) {
	               if(error) {
	                   postMessage({error: error.message, message: 'Failed to compute occurrences'});
	               }
	               if(Array.isArray(refs)) {
        			   postMessage({request: 'occurrences', refs:refs});
	               }
	           });
	   } else {
	       postMessage({message: 'failed to compute occurrences, server not started'});
	   }
    }
    
    
    return {
        computeOccurrences: computeOccurrences
    };
});