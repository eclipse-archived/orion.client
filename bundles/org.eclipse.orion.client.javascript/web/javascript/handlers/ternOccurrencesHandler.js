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
	'i18n!javascript/nls/workermessages'
], function(Messages) {
    
    /**
     * @description Compute the occurrences 
     * @param {Object} ternserver The server to query
     * @param {Object} args The arguments
     * @param {Function} callback The callback to call once the request completes or fails
     * @since 9.0
     */
    function computeOccurrences(ternserver, args, callback) {
        if(ternserver) {
	       ternserver.request({
	           query: {
		           type: "refs",  //$NON-NLS-1$
		           file: args.meta.location,
		           end: args.params.selection.start
	           }}, 
	           function(error, refs) {
	               if(error) {
	                   callback({request: 'occurrences', error: error.message, message: Messages['failedToComputeOccurrences']}); //$NON-NLS-1$
	               } else if(refs && Array.isArray(refs)) {
        			   callback({request: 'occurrences', refs:refs}); //$NON-NLS-1$
	               } else {
	               		callback({request: 'occurrences', refs:[]}); //$NON-NLS-1$
	               }
	           });
	   } else {
	       callback({request: 'occurrences', message: Messages['failedToComputeOccurrencesNoServer']}); //$NON-NLS-1$
	   }
    }
    
    return {
        computeOccurrences: computeOccurrences
    };
});