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
     * @param {Object} args The arguments
     * @param {Function} callback The callback to call once the request completes or fails
     * @since 9.0
     */
    function computeHover(ternserver, args, callback) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "documentation", 
		           file: args.meta.location,
		           end: args.params.offset
	           },
	           files: args.files}, 
	           function(error, doc) {
	               if(error) {
	                   callback({request: 'documentation', error: error.message, message: 'Failed to compute documentation'});
	               } else if(doc && doc.doc) {
        			   callback({request: 'documentation', doc:doc});
	               } else {
						callback({request: 'documentation', doc: null});
	               }
	           });
	   } else {
	       callback({request: 'documentation', message: 'Failed to compute documentation, server not started'});
	   }
    }
    
    return {
        computeHover: computeHover
    };
});